"""
NU-BI Live Cultural Pulse — Local Voice Multiplexer & Autonomous Conversation Engine
====================================================================================
Capabilities:
  1. Three-Wave Back-and-Forth Conversations:
     - Wave 1: Voice 1 drops the opening reply on a post.
     - Wave 2: Voice 2 replies directly to Voice 1 (`parentCommentId`), pushing back or expanding.
     - Wave 3: The original post author (or Voice 1) fires back at Voice 2 (`parentCommentId`),
       creating a natural 3-turn back-and-forth conversation thread.
  2. Rotating Voices Across Diverse Topics:
     - Rotates thread starters across Marcus Vance (`@marcusvance`), Elena Rostova (`@elenarostova`),
       Jax Mercer (`@jaxmercer`), and Soren Vale (`@sorenvale`).
     - Covers music, street fashion, money & hustle, relationships & loyalty, sports, movies,
       late-night thoughts, cities, and creator culture.
  3. Built-In All-Day Autonomous Conversation Scheduler:
     - Automatically sparks fresh topics and multi-voice back-and-forth threads throughout the day.
"""

from __future__ import annotations

import asyncio
import html
import json
import logging
import os
import random
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
AUTO_SPARK_INTERVAL_SECONDS = int(os.getenv("AUTO_SPARK_INTERVAL_SECONDS", "900"))

ALL_DAY_TOPIC_BANK: List[Dict[str, str]] = [
    {
        "category": "tech_ai",
        "topic": "LIVE_TECH_AI_NEWS: Scout the latest breaking AI model release, open-source breakthrough, or chip/robotics news and explain why it changes the game.",
        "starter": "kairosterling",
    },
    {
        "category": "music",
        "topic": "Why do underground artists with a cult following outlast mainstream industry plants every single time?",
        "starter": "sorenvale",
    },
    {
        "category": "hustle",
        "topic": "Is it better to move in complete silence until the project is done, or build in public so people watch the grind?",
        "starter": "marcusvance",
    },
    {
        "category": "tech_ai",
        "topic": "Small open-source AI models running locally on consumer GPUs are catching up to trillion-dollar cloud labs faster than anyone predicted.",
        "starter": "kairosterling",
    },
    {
        "category": "culture",
        "topic": "Everyone says they want honesty and real talk until it's their own habits getting called out.",
        "starter": "jaxmercer",
    },
    {
        "category": "streetwear",
        "topic": "Independent streetwear brands building whole visual worlds are making $2,000 designer logo tees look lazy.",
        "starter": "sorenvale",
    },
    {
        "category": "tech_ai",
        "topic": "Autonomous AI coding and workflow agents are shifting software from 'apps you click' to 'agents that execute for you.' Which industry gets disrupted first?",
        "starter": "kairosterling",
    },
    {
        "category": "money",
        "topic": "If someone handed you $50K right now with one rule—you can't put it in stocks or crypto—what business or asset are you buying?",
        "starter": "marcusvance",
    },
    {
        "category": "relationships",
        "topic": "Why has modern dating turned into a game of who cares less instead of who actually builds something real?",
        "starter": "jaxmercer",
    },
    {
        "category": "tech_ai",
        "topic": "Between custom AI silicon, edge compute, and humanoid robotics stepping into warehouses, hardware is officially exciting again.",
        "starter": "kairosterling",
    },
    {
        "category": "discipline",
        "topic": "Motivation gets you through week one. Systems and boring daily habits are the only things that still work in month six.",
        "starter": "elenarostova",
    },
    {
        "category": "music",
        "topic": "What's one album with zero skips that still sounds ahead of its time when you play it at 2 AM in the car?",
        "starter": "sorenvale",
    },
    {
        "category": "sports",
        "topic": "In high-stakes games, do you trust raw talent that improvises or a disciplined system that never panics in the 4th quarter?",
        "starter": "marcusvance",
    },
    {
        "category": "tech_ai",
        "topic": "A 3-person engineering team armed with modern AI agents can now ship what used to take a 150-person company. Are bloated tech orgs finished?",
        "starter": "kairosterling",
    },
    {
        "category": "loyalty",
        "topic": "Outgrowing your old circle is uncomfortable, but staying small just so people around you feel comfortable is worse.",
        "starter": "elenarostova",
    },
    {
        "category": "cinema",
        "topic": "Why do $15M independent films feel ten times more memorable right now than $250M studio blockbusters?",
        "starter": "jaxmercer",
    },
    {
        "category": "cities",
        "topic": "Which city actually has the best creative and hustle energy right now: Atlanta, LA, NYC, Houston, or Miami?",
        "starter": "sorenvale",
    },
    {
        "category": "ownership",
        "topic": "Creators taking a quick brand check instead of owning their own product line are trading a house for a weekend rental.",
        "starter": "marcusvance",
    },
    {
        "category": "late_night",
        "topic": "Why do your clearest ideas about your life and next move always hit after midnight when the phone finally stops buzzing?",
        "starter": "sorenvale",
    },
    {
        "category": "social",
        "topic": "Most social feeds feel like a mall food court now. Smaller rooms where people actually know each other's names always win.",
        "starter": "jaxmercer",
    },
    {
        "category": "craft",
        "topic": "People obsess over shortcuts and tools, but taste and work ethic are still the only two things you cannot fake.",
        "starter": "elenarostova",
    },
]

_topic_cursor = 0
_auto_loop_task: Optional[asyncio.Task] = None
_recent_topics: List[str] = []

app = FastAPI(
    title="NU-BI Local Voice Multiplexer & Autonomous Conversation Engine",
    version="3.0.0",
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
    agentSlug: Optional[str] = None
    triggerPersonaDebate: bool = True


class AssistantSparkBatchRequest(BaseModel):
    count: int = 3
    topics: Optional[List[str]] = None


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


def get_next_topic_entry() -> Dict[str, str]:
    global _topic_cursor
    entry = ALL_DAY_TOPIC_BANK[_topic_cursor % len(ALL_DAY_TOPIC_BANK)]
    _topic_cursor += 1
    return entry


async def ollama_chat(
    client: httpx.AsyncClient,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.78,
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

    author_lower = (post.author.username or "").lower()
    non_author_personas = [
        p
        for p in personas
        if p["slug"].lower() != author_lower
        and (p.get("legacySlug") or "").lower() != author_lower
    ]
    pool = non_author_personas if len(non_author_personas) >= 2 else personas

    if post.targetPersonaSlug and post.targetPersonaSlug in valid_slugs:
        primary = valid_slugs[post.targetPersonaSlug]
        if post.event == "comment.created" or post.commentId or post.singlePersona:
            logger.info("Targeted single voice directly: %s", post.targetPersonaSlug)
            return [primary]
        contrasting = [p for p in pool if p["slug"] != primary["slug"]]
        random.shuffle(contrasting)
        return [primary, contrasting[0]] if contrasting else [primary]

    if post.event == "comment.created" or post.commentId:
        comment_lower = (post.commentBody or "").lower()
        for slug, persona in valid_slugs.items():
            if f"@{slug}" in comment_lower or slug in comment_lower:
                logger.info("Comment mentioned voice: %s", slug)
                return [persona]

    roster_text = "\n".join(
        f'- "{p["slug"]}": {p["displayName"]} ({p.get("bio", "")})'
        for p in pool
    )

    is_comment_event = post.event == "comment.created" or bool(post.commentId)
    desired_count = 1 if is_comment_event else 2

    director_system = (
        f"Pick EXACTLY {desired_count} speaker slug(s) from the roster whose contrasting views "
        "will create the most entertaining, realistic back-and-forth conversation on this post. "
        f"Respond ONLY with a JSON array of {desired_count} slug string(s), e.g. "
        '["marcusvance", "jaxmercer"]'
    )
    director_user = (
        f"Available Speakers:\n{roster_text}\n\n"
        f"Post Author: {post.author.displayName} (@{post.author.username})\n"
        f"Post Text: {post.body or '(Media post)'}\n"
        + (f"New Comment to Reply To: {post.commentBody}\n" if is_comment_event else "")
        + f"\nReturn ONLY the JSON array of {desired_count} slug(s):"
    )

    try:
        raw = await ollama_chat(
            client,
            system_prompt=director_system,
            user_prompt=director_user,
            temperature=0.35,
            model=OLLAMA_MODEL,
        )
        match = re.search(r"\[.*?\]", raw, flags=re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, list):
                chosen: List[Dict[str, Any]] = []
                for slug in parsed:
                    if (
                        isinstance(slug, str)
                        and slug in valid_slugs
                        and valid_slugs[slug] in pool
                        and valid_slugs[slug] not in chosen
                    ):
                        chosen.append(valid_slugs[slug])
                if len(chosen) >= desired_count:
                    logger.info("Director selected voices: %s", [p["slug"] for p in chosen[:desired_count]])
                    return chosen[:desired_count]
    except Exception as exc:
        logger.warning("Director pass fell back to shuffled pool (%s)", exc)

    shuffled = list(pool)
    random.shuffle(shuffled)
    return shuffled[:desired_count]


async def actor_generate_reply(
    client: httpx.AsyncClient,
    persona: Dict[str, Any],
    post: WebhookPostPayload,
    prior_persona_reply: Optional[Dict[str, Any]] = None,
    second_persona_reply: Optional[Dict[str, Any]] = None,
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
            f'Original Post: "{post.body or "(Thread)"}"\n'
            f"{parent_ctx}"
            f"New comment by {post.author.displayName} (@{post.author.username}):\n"
            f'"{post.commentBody}"\n\n'
            f"Write your direct reply to @{post.author.username} now (1-3 natural sentences, start with @{post.author.username}, no quotation marks around the reply):"
        )
    elif second_persona_reply and prior_persona_reply:
        # Wave 3: Comeback / 3rd turn in the back-and-forth conversation!
        user_prompt = (
            f'Original Post by {post.author.displayName} (@{post.author.username}):\n'
            f'"{post.body}"\n\n'
            f'First comment by {prior_persona_reply["displayName"]} (@{prior_persona_reply["personaSlug"]}):\n'
            f'"{prior_persona_reply["body"]}"\n\n'
            f'Reply by {second_persona_reply["displayName"]} (@{second_persona_reply["personaSlug"]}):\n'
            f'"{second_persona_reply["body"]}"\n\n'
            f'Jump back into the thread and reply directly to @{second_persona_reply["personaSlug"]} in 1-2 punchy, natural sentences (start with @{second_persona_reply["personaSlug"]}, no quotation marks around the reply):'
        )
    elif prior_persona_reply:
        # Wave 2: Direct pushback / riff on Wave 1
        user_prompt = (
            f'Original Post by {post.author.displayName} (@{post.author.username}):\n'
            f'"{post.body or "(Shared new media)"}"\n\n'
            f'{prior_persona_reply["displayName"]} (@{prior_persona_reply["personaSlug"]}) just commented:\n'
            f'"{prior_persona_reply["body"]}"\n\n'
            f'Write a sharp 1-3 sentence reply that pushes back on, adds a real-world angle to, or riffs with @{prior_persona_reply["personaSlug"]}\'s point (start with @{prior_persona_reply["personaSlug"]}, no quotation marks around the reply):'
        )
    else:
        # Wave 1: Direct response to the post
        user_prompt = (
            f"Post by {post.author.displayName} (@{post.author.username}):\n"
            f'"{post.body or "(Shared new media)"}"\n\n'
            "Write your direct comment reply now (1-3 punchy, natural sentences, no quotation marks around the reply):"
        )

    try:
        reply_text = await ollama_chat(
            client,
            system_prompt=persona["systemPrompt"],
            user_prompt=user_prompt,
            temperature=0.82,
            model=persona_model,
        )
        cleaned = reply_text.strip().strip('"')
    except Exception as exc:
        logger.error("Actor generation failed for %s: %s", persona["slug"], exc)
        cleaned = ""

    if not cleaned:
        snippet = ((post.commentBody if is_comment_event else post.body) or "this").strip()[:65]
        prefix = f"@{post.author.username} " if is_comment_event else ""
        cleaned = f"{prefix}Real talk on '{snippet}'—most people don't want to admit what it actually takes behind the scenes."

    resolved_parent_id = (
        parent_comment_id_override
        if parent_comment_id_override is not None
        else (post.commentId if is_comment_event else None)
    )

    return {
        "personaSlug": persona["slug"],
        "displayName": persona["displayName"],
        "bio": persona.get("bio", ""),
        "category": persona.get("category", "culture"),
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

        # THREE-WAVE BACK-AND-FORTH CONVERSATION!
        # Wave 1: Voice 1 comments on the post
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

        # Wave 2: Voice 2 replies directly to Voice 1!
        second_reply = await actor_generate_reply(
            client,
            selected_personas[1],
            payload,
            prior_persona_reply=first_reply,
            parent_comment_id_override=first_comment_id,
        )
        second_comment_id: Optional[str] = None
        resp2_status = 0
        try:
            resp2 = await client.post(
                callback_url,
                headers=headers,
                json={"postId": payload.postId, "replies": [second_reply]},
                timeout=30.0,
            )
            resp2_status = resp2.status_code
            if resp2.is_success:
                data2 = resp2.json()
                created_list2 = data2.get("created") or []
                if created_list2 and isinstance(created_list2[0], dict):
                    second_comment_id = created_list2[0].get("commentId")
        except Exception as exc:
            logger.error("Wave 2 callback failed: %s", exc)

        # Wave 3: The original post author (if one of our voices) or Voice 1 replies back to Voice 2!
        author_lower = (payload.author.username or "").lower()
        author_persona = next(
            (
                p
                for p in personas
                if p["slug"].lower() == author_lower
                or (p.get("legacySlug") or "").lower() == author_lower
            ),
            None,
        )
        wave3_persona = author_persona if author_persona else selected_personas[0]
        if wave3_persona["slug"] == selected_personas[1]["slug"]:
            wave3_persona = selected_personas[0]

        third_reply = await actor_generate_reply(
            client,
            wave3_persona,
            payload,
            prior_persona_reply=first_reply,
            second_persona_reply=second_reply,
            parent_comment_id_override=second_comment_id or first_comment_id,
        )
        resp3_status = 0
        try:
            resp3 = await client.post(
                callback_url,
                headers=headers,
                json={"postId": payload.postId, "replies": [third_reply]},
                timeout=30.0,
            )
            resp3_status = resp3.status_code
        except Exception as exc:
            logger.error("Wave 3 callback failed: %s", exc)

        return {
            "postId": payload.postId,
            "mode": "three_wave_conversation",
            "selectedPersonas": [
                selected_personas[0]["slug"],
                selected_personas[1]["slug"],
                wave3_persona["slug"],
            ],
            "replies": [first_reply, second_reply, third_reply],
            "callbackStatus": resp3_status or resp2_status,
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
                            "snippet": f"Breaking tech story ({item.get('score', 0)} pts)",
                            "url": str(item.get("url") or f"https://news.ycombinator.com/item?id={sid}"),
                        }
                    )
        except Exception as exc:
            logger.warning("HackerNews fallback failed: %s", exc)

    return results


async def _execute_spark_debate(req: AssistantSparkRequest) -> Dict[str, Any]:
    personas = load_personas()
    persona_by_slug = {p["slug"]: p for p in personas}
    for p in personas:
        if p.get("legacySlug"):
            persona_by_slug[p["legacySlug"]] = p

    topic_entry = get_next_topic_entry()
    topic_context = (req.topic or "").strip() or topic_entry["topic"]

    chosen_slug = (req.agentSlug or "").strip().lower()
    if not chosen_slug or chosen_slug not in persona_by_slug:
        chosen_slug = topic_entry["starter"]
    starter_persona = persona_by_slug.get(chosen_slug, personas[0])
    is_tech_correspondent = starter_persona["slug"] == "kairosterling" or "#tech" in topic_context.lower() or "live_tech_ai_news" in topic_context.lower()

    async with httpx.AsyncClient() as client:
        live_headlines_block = ""
        if is_tech_correspondent and "live_tech_ai_news" in topic_context.lower():
            headlines = await web_search_snippets(
                client,
                "latest AI model release open source LLM GPU robotics tech news",
                4,
            )
            if headlines:
                live_headlines_block = "\nLive Tech & AI Headlines:\n" + "\n".join(
                    f"- {h['title']}: {h['snippet']}" for h in headlines[:3]
                )

        post_body = await ollama_chat(
            client,
            system_prompt=(
                f"{starter_persona['systemPrompt']} "
                "You are starting a new conversation thread on the NU-BI feed. "
                "Write a single compelling, authentic social post (2-3 sentences max, under 320 characters) "
                "that shares a bold opinion or breaks down a tech/cultural shift people will want to debate in the comments. "
                "Do NOT wrap the post in quotes."
            ),
            user_prompt=f"Topic to post about: {topic_context}{live_headlines_block}\n\nWrite your post now:",
            temperature=0.82,
            model=starter_persona.get("model") or ASSISTANT_MODEL,
        )
        cleaned_post = post_body.strip().strip('"')[:440]
        if is_tech_correspondent and "#tech" not in cleaned_post.lower():
            cleaned_post = f"{cleaned_post} #tech #ai"

        headers = {"Content-Type": "application/json"}
        if LOCAL_AGENT_SECRET:
            headers["x-nubi-agent-secret"] = LOCAL_AGENT_SECRET

        post_resp = await client.post(
            f"{NUBI_API_BASE_URL}/api/internal/local-agent/post",
            headers=headers,
            json={
                "body": cleaned_post,
                "agentSlug": starter_persona["slug"],
                "displayName": starter_persona["displayName"],
                "mode": "arena_spark",
                "topic": topic_context[:180],
                "model": starter_persona.get("model") or ASSISTANT_MODEL,
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
                author=PostAuthor(
                    username=starter_persona["slug"],
                    displayName=starter_persona["displayName"],
                ),
                tags=[],
            )
            debate_result = await process_post_pipeline(debate_payload)

        _recent_topics.append(f"{starter_persona['displayName']}: {topic_context[:80]}")
        if len(_recent_topics) > 25:
            _recent_topics.pop(0)

        return {
            "ok": post_resp.is_success,
            "starter": starter_persona["slug"],
            "topicSeed": topic_context,
            "publishedPost": post_data,
            "personaDebate": debate_result,
        }


async def _autonomous_daily_pulse_loop() -> None:
    """
    Background loop that runs all day while Nova is active, automatically starting
    new topics and 3-way back-and-forth conversations across the feed.
    """
    logger.info(
        "Autonomous Daily Pulse Loop active (interval=%ds, topics=%d)",
        AUTO_SPARK_INTERVAL_SECONDS,
        len(ALL_DAY_TOPIC_BANK),
    )
    await asyncio.sleep(20)
    while True:
        try:
            entry = get_next_topic_entry()
            logger.info(
                "Auto-Pulse sparking topic [%s] via @%s: %s",
                entry["category"],
                entry["starter"],
                entry["topic"],
            )
            await _execute_spark_debate(
                AssistantSparkRequest(
                    topic=entry["topic"],
                    agentSlug=entry["starter"],
                    triggerPersonaDebate=True,
                )
            )
        except Exception as exc:
            logger.error("Autonomous pulse iteration error: %s", exc)
        # Add slight human jitter (e.g. 12 to 18 minutes)
        jittered_sleep = max(300, int(AUTO_SPARK_INTERVAL_SECONDS * random.uniform(0.8, 1.2)))
        await asyncio.sleep(jittered_sleep)


@app.on_event("startup")
async def on_startup() -> None:
    global _auto_loop_task
    if _auto_loop_task is None or _auto_loop_task.done():
        _auto_loop_task = asyncio.create_task(_autonomous_daily_pulse_loop())


@app.get("/health")
async def health() -> Dict[str, Any]:
    personas = load_personas()
    return {
        "ok": True,
        "service": "nubi-local-persona-multiplexer",
        "version": "3.0.0",
        "ollamaBaseUrl": OLLAMA_BASE_URL,
        "ollamaDefaultModel": OLLAMA_MODEL,
        "assistantModel": ASSISTANT_MODEL,
        "autoPulseActive": _auto_loop_task is not None and not _auto_loop_task.done(),
        "autoPulseIntervalSeconds": AUTO_SPARK_INTERVAL_SECONDS,
        "topicBankSize": len(ALL_DAY_TOPIC_BANK),
        "recentTopics": _recent_topics[-8:],
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
        "autoPulseActive": _auto_loop_task is not None and not _auto_loop_task.done(),
        "recentTopics": _recent_topics[-8:],
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
                "Synthesize the search results into a concise, high-signal briefing and propose "
                "one compelling discussion question based on the findings."
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


@app.post("/assistant/spark")
async def assistant_spark_debate(
    req: AssistantSparkRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    x_nubi_agent_secret: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    if LOCAL_AGENT_SECRET and x_nubi_agent_secret != LOCAL_AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: invalid x-nubi-agent-secret")

    if request.query_params.get("async") == "1":
        background_tasks.add_task(_execute_spark_debate, req)
        return {
            "ok": True,
            "mode": "async",
            "topicSeed": req.topic or "rotating_topic_bank",
            "agentSlug": req.agentSlug or "rotating",
        }

    return await _execute_spark_debate(req)


@app.post("/assistant/spark-batch")
async def assistant_spark_batch(
    req: AssistantSparkBatchRequest,
    background_tasks: BackgroundTasks,
    x_nubi_agent_secret: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    if LOCAL_AGENT_SECRET and x_nubi_agent_secret != LOCAL_AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: invalid x-nubi-agent-secret")

    count = max(1, min(req.count, 8))

    async def _run_batch() -> None:
        for idx in range(count):
            custom_topic = (
                req.topics[idx]
                if req.topics and idx < len(req.topics)
                else None
            )
            entry = get_next_topic_entry()
            await _execute_spark_debate(
                AssistantSparkRequest(
                    topic=custom_topic or entry["topic"],
                    agentSlug=entry["starter"],
                    triggerPersonaDebate=True,
                )
            )
            await asyncio.sleep(4)

    background_tasks.add_task(_run_batch)
    return {
        "ok": True,
        "mode": "batch_async",
        "queuedTopicsCount": count,
    }


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
                "You are the local Executive Operations Assistant for NU-BI (https://nu-bi.com). "
                "Execute the instruction with concrete, actionable precision."
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
                    "agentSlug": "sorenvale",
                    "displayName": "Soren Vale",
                    "mode": "arena_spark",
                    "topic": req.instruction[:140],
                    "model": chosen_model,
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
    uvicorn.run("multiplexer:app", host="0.0.0.0", port=port, reload=False)
