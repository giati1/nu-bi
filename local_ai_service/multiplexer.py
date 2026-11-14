"""
NU-BI Transparent AI Arena — Local Persona Multiplexer (Nova)
=============================================================
Two-Step Pipeline:
  1. Director Pass: Sends the incoming NU-BI post to the local Ollama API (Nova)
     to pick the 2 best-fitting personas from `personas.json`.
  2. Actor Pass: Concurrently generates replies from the 2 chosen personas via
     Ollama using their distinct system prompts.
  3. Callback Pass: Posts the generated replies back to the NU-BI Cloudflare API
     (`/api/internal/local-agent/comment`) so they appear as live comments on the post.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, Field

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nubi.multiplexer")

BASE_DIR = Path(__file__).resolve().parent
PERSONAS_PATH = BASE_DIR / "personas.json"

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
NUBI_API_BASE_URL = os.getenv("NUBI_API_BASE_URL", "https://nu-bi.com").rstrip("/")
LOCAL_AGENT_SECRET = os.getenv(
    "LOCAL_AGENT_SECRET",
    "ce7becd13e98e2c0b75aeb19843fa971a0bdbf1cec1a29eea433e7444f81da96",
).strip()

app = FastAPI(
    title="NU-BI Local Persona Multiplexer (Nova)",
    version="1.0.0",
)


class PostAuthor(BaseModel):
    id: str = ""
    username: str = "creator"
    displayName: str = "Creator"


class WebhookPostPayload(BaseModel):
    event: str = "post.created"
    postId: str = Field(..., min_length=1)
    body: str = ""
    createdAt: Optional[str] = None
    commentId: Optional[str] = None
    commentBody: Optional[str] = None
    parentCommentId: Optional[str] = None
    parentCommentBody: Optional[str] = None
    targetPersonaSlug: Optional[str] = None
    author: PostAuthor = Field(default_factory=PostAuthor)
    tags: List[str] = Field(default_factory=list)
    media: List[Dict[str, Any]] = Field(default_factory=list)
    callbackUrl: Optional[str] = None


def load_personas() -> List[Dict[str, Any]]:
    if not PERSONAS_PATH.exists():
        raise FileNotFoundError(f"personas.json not found at {PERSONAS_PATH}")
    with PERSONAS_PATH.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list) or len(data) < 2:
        raise ValueError("personas.json must contain a list of at least 2 personas.")
    return data


async def ollama_chat(
    client: httpx.AsyncClient,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.7,
) -> str:
    url = f"{OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "options": {"temperature": temperature},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    response = await client.post(url, json=payload, timeout=60.0)
    response.raise_for_status()
    data = response.json()
    content = (data.get("message") or {}).get("content", "")
    return str(content).strip()


async def director_pass(
    client: httpx.AsyncClient,
    post: WebhookPostPayload,
    personas: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Step 1 (Director Pass): Ask Nova (Ollama) which 2 personas from personas.json
    should jump into this post's thread. Falls back deterministically if Ollama
    returns non-JSON or is unreachable.
    """
    valid_slugs = {p["slug"]: p for p in personas}

    # If this is a comment event and a specific persona was tagged or replied to, select it directly
    if post.event == "comment.created" or post.commentId:
        if post.targetPersonaSlug and post.targetPersonaSlug in valid_slugs:
            logger.info("Comment targeted persona directly: %s", post.targetPersonaSlug)
            return [valid_slugs[post.targetPersonaSlug]]

        # Check if comment text mentions any persona slug
        comment_lower = (post.commentBody or "").lower()
        for slug, persona in valid_slugs.items():
            if f"@{slug}" in comment_lower or slug in comment_lower:
                logger.info("Comment mentioned persona: %s", slug)
                return [persona]

    roster_text = "\n".join(
        f'- "{p["slug"]}": {p["displayName"]} ({p.get("bio", "")})'
        for p in personas
    )

    is_comment_event = post.event == "comment.created" or bool(post.commentId)
    desired_count = 1 if is_comment_event else 2

    director_system = (
        "You are Nova, the Director of the NU-BI Transparent AI Arena. "
        f"Your job is to read the incoming content and pick EXACTLY {desired_count} persona slug(s) "
        "from the provided roster whose perspective will create the sharpest, most engaging reply. "
        f"Respond ONLY with a valid JSON array of {desired_count} slug string(s), for example: "
        '["nova_hype", "nova_advocate"]'
    )
    director_user = (
        f"Available Personas:\n{roster_text}\n\n"
        f"Author: {post.author.displayName} (@{post.author.username})\n"
        f"Original Post Text: {post.body or '(Media post)'}\n"
        + (f"New Comment to Reply To: {post.commentBody}\n" if is_comment_event else "")
        + f"Tags: {', '.join(post.tags) if post.tags else 'none'}\n\n"
        f"Return ONLY the JSON array of {desired_count} persona slug(s):"
    )

    try:
        raw = await ollama_chat(
            client,
            system_prompt=director_system,
            user_prompt=director_user,
            temperature=0.2,
        )
        match = re.search(r"\[.*?\]", raw, flags=re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, list):
                chosen: List[Dict[str, Any]] = []
                for slug in parsed:
                    if isinstance(slug, str) and slug in valid_slugs and valid_slugs[slug] not in chosen:
                        chosen.append(valid_slugs[slug])
                if len(chosen) >= desired_count:
                    logger.info("Director selected personas: %s", [p["slug"] for p in chosen[:desired_count]])
                    return chosen[:desired_count]
    except Exception as exc:
        logger.warning("Director pass fell back to default (%s)", exc)

    return personas[:desired_count]


async def actor_generate_reply(
    client: httpx.AsyncClient,
    persona: Dict[str, Any],
    post: WebhookPostPayload,
) -> Dict[str, Any]:
    """
    Step 2 (Actor Pass): Generate an in-character reply for a single persona.
    """
    is_comment_event = post.event == "comment.created" or bool(post.commentId)
    if is_comment_event:
        parent_ctx = (
            f'Earlier comment in thread: "{post.parentCommentBody}"\n'
            if post.parentCommentBody
            else ""
        )
        user_prompt = (
            f"Original Post: \"{post.body or '(Arena thread)'}\"\n"
            f"{parent_ctx}"
            f"New comment by {post.author.displayName} (@{post.author.username}):\n"
            f'"{post.commentBody}"\n\n'
            f"Write your direct in-character reply to @{post.author.username} now (1-3 punchy sentences, start with @{post.author.username}, no quotation marks around the whole reply):"
        )
    else:
        user_prompt = (
            f"Post by {post.author.displayName} (@{post.author.username}):\n"
            f'"{post.body or "(Shared new media in the arena)"}"\n\n'
            "Write your direct comment reply now (1-3 punchy sentences, no quotation marks around the whole reply):"
        )
    try:
        reply_text = await ollama_chat(
            client,
            system_prompt=persona["systemPrompt"],
            user_prompt=user_prompt,
            temperature=0.8,
        )
        cleaned = reply_text.strip().strip('"')
    except Exception as exc:
        logger.error("Actor generation failed for %s: %s", persona["slug"], exc)
        cleaned = ""

    if not cleaned:
        # Resilient fallback if local Ollama model is still loading
        snippet = ((post.commentBody if is_comment_event else post.body) or "this point").strip()[:70]
        if "hype" in persona["slug"]:
            cleaned = f"@{post.author.username} This is the kind of energy the arena needs right now—'{snippet}' hits different. What's the next move you're building off this?"
        elif "purist" in persona["slug"]:
            cleaned = f"@{post.author.username} Interesting angle on '{snippet}', but the real test is how the execution holds up under real-world load. Walk us through the mechanics."
        else:
            cleaned = f"@{post.author.username} I'll take the other side on '{snippet}'—what if the exact opposite turns out to be true six months from now?"

    return {
        "personaSlug": persona["slug"],
        "displayName": persona["displayName"],
        "bio": persona.get("bio", ""),
        "category": persona.get("category", "arena"),
        "personaPrompt": persona["systemPrompt"],
        "body": cleaned[:1000],
        "parentCommentId": post.commentId if is_comment_event else None,
    }


async def process_post_pipeline(payload: WebhookPostPayload) -> Dict[str, Any]:
    personas = load_personas()

    async with httpx.AsyncClient() as client:
        # 1. Director Pass
        selected_personas = await director_pass(client, payload, personas)

        # 2. Concurrent Actor Pass
        actor_tasks = [
            actor_generate_reply(client, persona, payload)
            for persona in selected_personas
        ]
        replies = await asyncio.gather(*actor_tasks)

        # 3. Send generated replies back to NU-BI Cloudflare API
        callback_url = (
            payload.callbackUrl
            or f"{NUBI_API_BASE_URL}/api/internal/local-agent/comment"
        )
        headers = {"Content-Type": "application/json"}
        if LOCAL_AGENT_SECRET:
            headers["x-nubi-agent-secret"] = LOCAL_AGENT_SECRET

        callback_body = {
            "postId": payload.postId,
            "replies": replies,
        }

        try:
            resp = await client.post(
                callback_url,
                headers=headers,
                json=callback_body,
                timeout=30.0,
            )
            logger.info(
                "Posted %d persona replies to %s (status=%s)",
                len(replies),
                callback_url,
                resp.status_code,
            )
            return {
                "postId": payload.postId,
                "selectedPersonas": [p["slug"] for p in selected_personas],
                "replies": replies,
                "callbackStatus": resp.status_code,
            }
        except Exception as exc:
            logger.error("Failed to send replies back to %s: %s", callback_url, exc)
            return {
                "postId": payload.postId,
                "selectedPersonas": [p["slug"] for p in selected_personas],
                "replies": replies,
                "callbackError": str(exc),
            }


@app.get("/health")
async def health() -> Dict[str, Any]:
    personas = load_personas()
    return {
        "ok": True,
        "service": "nubi-local-persona-multiplexer",
        "ollamaBaseUrl": OLLAMA_BASE_URL,
        "ollamaModel": OLLAMA_MODEL,
        "personasLoaded": [p["slug"] for p in personas],
    }


@app.post("/webhook/new-post")
async def receive_new_post(
    payload: WebhookPostPayload,
    background_tasks: BackgroundTasks,
    request: Request,
    x_nubi_agent_secret: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    if LOCAL_AGENT_SECRET and x_nubi_agent_secret != LOCAL_AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: invalid x-nubi-agent-secret")

    run_sync = request.query_params.get("sync") == "1"
    if run_sync:
        result = await process_post_pipeline(payload)
        return {"ok": True, "mode": "sync", "result": result}

    background_tasks.add_task(process_post_pipeline, payload)
    return {
        "ok": True,
        "mode": "async",
        "queuedPostId": payload.postId,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8090"))
    uvicorn.run("multiplexer:app", host="127.0.0.1", port=port, reload=False)
