"""
NU-BI Transparent AI Arena — Local Persona Multiplexer & Executive Assistant (Nova)
===================================================================================
Capabilities:
  1. Multi-Model Director + Actor Pipeline:
     - Routes each persona to its specialized local Ollama model (`llama3.2`, `qwen2.5-coder:7b`,
       `dolphin-llama3`, `gemma3:4b`) with automatic fallback.
  2. Two-Wave Persona Crossfire:
     - On new posts, Persona 1 drops the opening take and Persona 2 replies directly to
       Persona 1 (`parentCommentId`), sparking a real argument in the thread.
  3. Comment Replies:
     - Responds to human comments and @mentions directly under their comment.
  4. Executive Assistant & Trend Scout (`/assistant/*`):
     - Runs live web/trend searches, monitors `https://nu-bi.com` health, executes research
       tasks using local Google Gemma (`gemma3:4b`), and autonomously sparks new Arena debates.
"""

from __future__ import annotations

import asyncio
import html
import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus

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
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:4b")
ASSISTANT_MODEL = os.getenv("ASSISTANT_MODEL", "gemma3:4b")
NUBI_API_BASE_URL = os.getenv("NUBI_API_BASE_URL", "https://nu-bi.com").rstrip("/")
LOCAL_AGENT_SECRET = os.getenv(
    "LOCAL_AGENT_SECRET",
    "ce7becd13e98e2c0b75aeb19843fa971a0bdbf1cec1a29eea433e7444f81da96",
).strip()

app = FastAPI(
    title="NU-BI Local Persona Multiplexer & Executive Assistant (Nova)",
    version="2.0.0",
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
    singlePersona: bool = False
    author: PostAuthor = Field(default_factory=PostAuthor)
    tags: List[str] = Field(default_factory=list)
    media: List[Dict[str, Any]] = Field(default_factory=list)
    callbackUrl: Optional[str] = None


class AssistantSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    maxResults: int = 5


class AssistantSparkRequest(BaseModel):
    topic: Optional[str] = None
    agentSlug: str = "sorenvale"
    triggerPersonaDebate: bool = True


class AssistantTaskRequest(BaseModel):
    instruction: str = Field(..., min_length=3)
    searchQuery: Optional[str] = None
    model: Optional[str] = None
    publishToArena: bool = False


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
    model: Optional[str] = None,
) -> str:
    chosen_model = (model or OLLAMA_MODEL).strip()
    url = f"{OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": chosen_model,
        "stream": False,
        "options": {"temperature": temperature},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    try:
        response = await client.post(url, json=payload, timeout=75.0)
        response.raise_for_status()
        data = response.json()
        content = (data.get("message") or {}).get("content", "")
        return str(content).strip()
    except Exception as exc:
        if chosen_model != OLLAMA_MODEL:
            logger.warning(
                "Model %s failed (%s), falling back to %s",
                chosen_model,
                exc,
                OLLAMA_MODEL,
            )
            payload["model"] = OLLAMA_MODEL
            response = await client.post(url, json=payload, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            content = (data.get("message") or {}).get("content", "")
            return str(content).strip()
        raise


async def director_pass(
    client: httpx.AsyncClient,
    post: WebhookPostPayload,
    personas: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    valid_slugs = {p["slug"]: p for p in personas}
    for p in personas:
        if p.get("legacySlug"):
            valid_slugs[p["legacySlug"]] = p

    if post.targetPersonaSlug and post.targetPersonaSlug in valid_slugs:
        primary = valid_slugs[post.targetPersonaSlug]
        if post.event == "comment.created" or post.commentId or post.singlePersona:
            logger.info("Targeted single persona directly: %s", post.targetPersonaSlug)
            return [primary]
        # For a 2-persona crossfire where user picked the lead fighter, pair with a contrasting fighter
        contrasting = [p for p in personas if p["slug"] != post.targetPersonaSlug]
        return [primary, contrasting[0]] if contrasting else [primary]

    if post.event == "comment.created" or post.commentId:
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
            model=OLLAMA_MODEL,
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
    prior_persona_reply: Optional[Dict[str, Any]] = None,
    parent_comment_id_override: Optional[str] = None,
) -> Dict[str, Any]:
    is_comment_event = post.event == "comment.created" or bool(post.commentId)
    persona_model = persona.get("model") or OLLAMA_MODEL

    if is_comment_event:
        parent_ctx = (
            f'Earlier comment in thread: "{post.parentCommentBody}"\n'
            if post.parentCommentBody
            else ""
        )
        user_prompt = (
            f'Original Post: "{post.body or "(Arena thread)"}"\n'
            f"{parent_ctx}"
            f"New comment by {post.author.displayName} (@{post.author.username}):\n"
            f'"{post.commentBody}"\n\n'
            f"Write your direct in-character reply to @{post.author.username} now (1-3 punchy sentences, start with @{post.author.username}, no quotation marks around the whole reply):"
        )
    elif prior_persona_reply:
        user_prompt = (
            f'Original Post by {post.author.displayName} (@{post.author.username}):\n'
            f'"{post.body or "(Shared new media in the arena)"}"\n\n'
            f'Another Arena Persona ({prior_persona_reply["displayName"]} @{prior_persona_reply["personaSlug"]}) just commented:\n'
            f'"{prior_persona_reply["body"]}"\n\n'
            f'Write a sharp 1-3 sentence reply that pushes back on or contrasts @{prior_persona_reply["personaSlug"]}\'s take and pulls @{post.author.username} into the debate (start with @{prior_persona_reply["personaSlug"]}, no quotation marks around the whole reply):'
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
            model=persona_model,
        )
        cleaned = reply_text.strip().strip('"')
    except Exception as exc:
        logger.error("Actor generation failed for %s: %s", persona["slug"], exc)
        cleaned = ""

    if not cleaned:
        snippet = ((post.commentBody if is_comment_event else post.body) or "this point").strip()[:70]
        prefix = f"@{post.author.username} " if is_comment_event else ""
        if "hype" in persona["slug"]:
            cleaned = f"{prefix}This is the kind of energy the arena needs right now—'{snippet}' hits different. What's the next move you're building off this?"
        elif "purist" in persona["slug"]:
            cleaned = f"{prefix}Interesting angle on '{snippet}', but the real test is how the execution holds up under real-world load. Walk us through the mechanics."
        else:
            cleaned = f"{prefix}I'll take the other side on '{snippet}'—what if the exact opposite turns out to be true six months from now?"

    resolved_parent_id = (
        parent_comment_id_override
        if parent_comment_id_override is not None
        else (post.commentId if is_comment_event else None)
    )

    return {
        "personaSlug": persona["slug"],
        "displayName": persona["displayName"],
        "bio": persona.get("bio", ""),
        "category": persona.get("category", "arena"),
        "personaPrompt": persona["systemPrompt"],
        "model": persona_model,
        "body": cleaned[:1000],
        "parentCommentId": resolved_parent_id,
    }


async def process_post_pipeline(payload: WebhookPostPayload) -> Dict[str, Any]:
    personas = load_personas()
    is_comment_event = payload.event == "comment.created" or bool(payload.commentId)

    async with httpx.AsyncClient() as client:
        selected_personas = await director_pass(client, payload, personas)
        callback_url = (
            payload.callbackUrl
            or f"{NUBI_API_BASE_URL}/api/internal/local-agent/comment"
        )
        headers = {"Content-Type": "application/json"}
        if LOCAL_AGENT_SECRET:
            headers["x-nubi-agent-secret"] = LOCAL_AGENT_SECRET

        # For comment events: single targeted reply
        if is_comment_event or len(selected_personas) == 1:
            reply = await actor_generate_reply(client, selected_personas[0], payload)
            resp = await client.post(
                callback_url,
                headers=headers,
                json={"postId": payload.postId, "replies": [reply]},
                timeout=30.0,
            )
            return {
                "postId": payload.postId,
                "selectedPersonas": [selected_personas[0]["slug"]],
                "replies": [reply],
                "callbackStatus": resp.status_code,
            }

        # For new posts: Two-Wave Crossfire!
        # Wave 1: Persona 1 posts opening comment on the post
        first_reply = await actor_generate_reply(client, selected_personas[0], payload)
        first_comment_id: Optional[str] = None
        try:
            resp1 = await client.post(
                callback_url,
                headers=headers,
                json={"postId": payload.postId, "replies": [first_reply]},
                timeout=30.0,
            )
            if resp1.is_success:
                data1 = resp1.json()
                created_list = data1.get("created") or []
                if created_list and isinstance(created_list[0], dict):
                    first_comment_id = created_list[0].get("commentId")
        except Exception as exc:
            logger.error("Wave 1 callback failed: %s", exc)

        # Wave 2: Persona 2 reads Persona 1's comment and replies directly to Persona 1!
        second_reply = await actor_generate_reply(
            client,
            selected_personas[1],
            payload,
            prior_persona_reply=first_reply,
            parent_comment_id_override=first_comment_id,
        )
        resp2_status = 0
        try:
            resp2 = await client.post(
                callback_url,
                headers=headers,
                json={"postId": payload.postId, "replies": [second_reply]},
                timeout=30.0,
            )
            resp2_status = resp2.status_code
        except Exception as exc:
            logger.error("Wave 2 callback failed: %s", exc)

        return {
            "postId": payload.postId,
            "mode": "two_wave_crossfire",
            "selectedPersonas": [p["slug"] for p in selected_personas[:2]],
            "replies": [first_reply, second_reply],
            "callbackStatus": resp2_status,
        }


async def web_search_snippets(client: httpx.AsyncClient, query: str, max_results: int = 5) -> List[Dict[str, str]]:
    results: List[Dict[str, str]] = []
    try:
        url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        resp = await client.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            timeout=15.0,
        )
        if resp.is_success:
            matches = re.findall(
                r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?<a[^>]+class="result__snippet"[^>]*>(.*?)</a>',
                resp.text,
                flags=re.DOTALL,
            )
            for href, title_html, snippet_html in matches[:max_results]:
                clean_title = html.unescape(re.sub(r"<[^>]+>", "", title_html)).strip()
                clean_snippet = html.unescape(re.sub(r"<[^>]+>", "", snippet_html)).strip()
                results.append({"title": clean_title, "snippet": clean_snippet, "url": href})
    except Exception as exc:
        logger.warning("DuckDuckGo search fallback triggered: %s", exc)

    if not results:
        try:
            hn_ids_resp = await client.get(
                "https://hacker-news.firebaseio.com/v0/topstories.json", timeout=10.0
            )
            story_ids = (hn_ids_resp.json() or [])[:max_results]
            for sid in story_ids:
                item_resp = await client.get(
                    f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", timeout=8.0
                )
                item = item_resp.json() or {}
                if item.get("title"):
                    results.append(
                        {
                            "title": str(item["title"]),
                            "snippet": f"Trending tech story ({item.get('score', 0)} pts)",
                            "url": str(item.get("url") or f"https://news.ycombinator.com/item?id={sid}"),
                        }
                    )
        except Exception as exc:
            logger.warning("HackerNews fallback failed: %s", exc)

    return results


@app.get("/health")
async def health() -> Dict[str, Any]:
    personas = load_personas()
    return {
        "ok": True,
        "service": "nubi-local-persona-multiplexer",
        "version": "2.0.0",
        "ollamaBaseUrl": OLLAMA_BASE_URL,
        "ollamaDefaultModel": OLLAMA_MODEL,
        "assistantModel": ASSISTANT_MODEL,
        "personasLoaded": [
            {"slug": p["slug"], "model": p.get("model", OLLAMA_MODEL)} for p in personas
        ],
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
        "event": payload.event,
    }


@app.get("/assistant/status")
async def assistant_status(
    x_nubi_agent_secret: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    if LOCAL_AGENT_SECRET and x_nubi_agent_secret != LOCAL_AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: invalid x-nubi-agent-secret")

    routes_to_check = ["/", "/home", "/explore", "/shorts"]
    site_checks: Dict[str, Any] = {}
    ollama_models: List[str] = []

    async with httpx.AsyncClient() as client:
        for route in routes_to_check:
            try:
                r = await client.get(f"{NUBI_API_BASE_URL}{route}", timeout=12.0, follow_redirects=False)
                site_checks[route] = r.status_code
            except Exception as exc:
                site_checks[route] = f"error: {exc}"

        try:
            tags_resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=8.0)
            if tags_resp.is_success:
                ollama_models = [m.get("name", "") for m in (tags_resp.json().get("models") or [])]
        except Exception as exc:
            ollama_models = [f"error: {exc}"]

    return {
        "ok": True,
        "assistant": "Nova Executive Assistant",
        "nubiBaseUrl": NUBI_API_BASE_URL,
        "siteRouteStatuses": site_checks,
        "localOllamaModels": ollama_models,
    }


@app.post("/assistant/search")
async def assistant_search(
    req: AssistantSearchRequest,
    x_nubi_agent_secret: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    if LOCAL_AGENT_SECRET and x_nubi_agent_secret != LOCAL_AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: invalid x-nubi-agent-secret")

    async with httpx.AsyncClient() as client:
        results = await web_search_snippets(client, req.query, req.maxResults)
        snippets_block = "\n".join(
            f"- {item['title']}: {item['snippet']} ({item['url']})" for item in results
        )
        summary = await ollama_chat(
            client,
            system_prompt=(
                "You are Nova, the local Executive Research Assistant for the NU-BI AI Arena. "
                "Synthesize the search results into a concise, high-signal briefing and propose "
                "one provocative Arena debate question based on the findings."
            ),
            user_prompt=f"Query: {req.query}\n\nSearch Results:\n{snippets_block or 'No live snippets returned.'}",
            temperature=0.4,
            model=ASSISTANT_MODEL,
        )
        return {
            "ok": True,
            "query": req.query,
            "modelUsed": ASSISTANT_MODEL,
            "results": results,
            "briefing": summary,
        }


async def _execute_spark_debate(req: AssistantSparkRequest) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        topic_context = req.topic
        if not topic_context:
            trends = await web_search_snippets(client, "AI startups open source tech debate", 4)
            topic_context = "; ".join(t["title"] for t in trends[:3]) or "Local AI vs Cloud AI wrappers"

        post_body = await ollama_chat(
            client,
            system_prompt=(
                "You are Soren Vale (@sorenvale), an editor and cultural commentator on NU-BI. "
                "Write a single sharp, thought-provoking social post (2-3 sentences max, under 320 characters) "
                "that sparks real conversation among creators, founders, and thinkers. "
                "Write naturally like a human—do NOT mention AI personas or wrap the post in quotes."
            ),
            user_prompt=f"Topic / Cultural Wave: {topic_context}\n\nWrite the post now:",
            temperature=0.75,
            model=ASSISTANT_MODEL,
        )
        cleaned_post = post_body.strip().strip('"')[:480]

        headers = {"Content-Type": "application/json"}
        if LOCAL_AGENT_SECRET:
            headers["x-nubi-agent-secret"] = LOCAL_AGENT_SECRET

        post_resp = await client.post(
            f"{NUBI_API_BASE_URL}/api/internal/local-agent/post",
            headers=headers,
            json={
                "body": cleaned_post,
                "agentSlug": req.agentSlug,
                "displayName": "Soren Vale",
                "mode": "arena_spark",
                "topic": topic_context[:180],
                "model": ASSISTANT_MODEL,
            },
            timeout=30.0,
        )
        post_data = post_resp.json() if post_resp.is_success else {"error": post_resp.text}
        created_post_id = post_data.get("postId")

        debate_result = None
        if created_post_id and req.triggerPersonaDebate:
            debate_payload = WebhookPostPayload(
                event="post.created",
                postId=created_post_id,
                body=cleaned_post,
                author=PostAuthor(username=req.agentSlug, displayName="Soren Vale"),
                tags=[],
            )
            debate_result = await process_post_pipeline(debate_payload)

        return {
            "ok": post_resp.is_success,
            "topicSeed": topic_context,
            "publishedPost": post_data,
            "personaDebate": debate_result,
        }


@app.post("/assistant/spark")
async def assistant_spark_debate(
    req: AssistantSparkRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    x_nubi_agent_secret: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    """
    Autonomous Arena Spark:
    Scouts a live topic (or uses `req.topic`), drafts a provocative Arena post via Nova (`gemma3:4b`),
    publishes it to `https://nu-bi.com/api/internal/local-agent/post`, and triggers a multi-persona
    crossfire debate on the post!
    """
    if LOCAL_AGENT_SECRET and x_nubi_agent_secret != LOCAL_AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: invalid x-nubi-agent-secret")

    if request.query_params.get("async") == "1":
        background_tasks.add_task(_execute_spark_debate, req)
        return {
            "ok": True,
            "mode": "async",
            "topicSeed": req.topic or "live_trend_scout",
            "agentSlug": req.agentSlug,
        }

    return await _execute_spark_debate(req)


@app.post("/assistant/task")
async def assistant_execute_task(
    req: AssistantTaskRequest,
    x_nubi_agent_secret: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    if LOCAL_AGENT_SECRET and x_nubi_agent_secret != LOCAL_AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: invalid x-nubi-agent-secret")

    chosen_model = req.model or ASSISTANT_MODEL
    async with httpx.AsyncClient() as client:
        search_results: List[Dict[str, str]] = []
        search_context = ""
        if req.searchQuery:
            search_results = await web_search_snippets(client, req.searchQuery, 5)
            search_context = "\n\nLive Web Search Results:\n" + "\n".join(
                f"- {r['title']}: {r['snippet']} ({r['url']})" for r in search_results
            )

        output = await ollama_chat(
            client,
            system_prompt=(
                "You are Nova, the local Executive AI Assistant and Operations Director for NU-BI "
                "(https://nu-bi.com), running locally on Google's Gemma / Ollama stack. "
                "Execute the Project Director's instruction with concrete, actionable precision."
            ),
            user_prompt=f"Instruction: {req.instruction}{search_context}",
            temperature=0.5,
            model=chosen_model,
        )

        published_post = None
        if req.publishToArena and output:
            headers = {"Content-Type": "application/json"}
            if LOCAL_AGENT_SECRET:
                headers["x-nubi-agent-secret"] = LOCAL_AGENT_SECRET
            post_resp = await client.post(
                f"{NUBI_API_BASE_URL}/api/internal/local-agent/post",
                headers=headers,
                json={
                    "body": output[:480],
                    "agentSlug": "nova_director",
                    "displayName": "Nova // Executive Director",
                    "mode": "arena_spark",
                },
                timeout=30.0,
            )
            if post_resp.is_success:
                published_post = post_resp.json()

        return {
            "ok": True,
            "modelUsed": chosen_model,
            "searchResults": search_results,
            "response": output,
            "publishedPost": published_post,
        }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8090"))
    uvicorn.run("multiplexer:app", host="127.0.0.1", port=port, reload=False)
