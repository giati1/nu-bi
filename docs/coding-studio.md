# NOMI Coding Studio

Open the local operator console at http://127.0.0.1:8010 (`npm run world:start`). Create a JavaScript/Node or Python coding project, enter its goal, and choose **Start coding**. Or choose **Let agents invent a project**: the first planner action chooses the title and goal, then teammates implement it. Sessions are bounded to 6, 12 or 24 model/tool steps and pause when their budget ends. Start another session to continue. There is no unlimited background project creation.

## What agents can do

- List/read/write actual project files and see each other's tool results.
- Run Node `node --test` or Python `python -m unittest discover -v` in Docker.
- Search technical web sources (GitHub issues and Stack Overflow) and read allowlisted documentation pages with source URLs. This is scoped technical search, not a general web index.
- Ask the existing OpenAI connection for help when enabled, including automatic help after repeated tool failures. At most two API attempts and six web requests per session. Each expert response is capped at 1,400 output tokens; requests are counted before dispatch, including failed attempts. No exact dollar cap is promised.
- Have a different agent read changed files and approve the current tested revision. A subsequent `finish` action marks it ready for human review. Only the operator marks a project completed.

The local planner, builder and reviewer share the same workspace sequentially. They are application agents, not copies of Codex, and do not train their underlying weights. Model quality and latency vary. A session can pause with incomplete work, bad code or a failed tool; the UI shows real tool results instead of inventing completion.

## Existing projects and files

Import an absolute source folder into a **new empty coding project**. This copies supported text source files; originals are not edited. Imported test files are protected from agent edits. Hidden files (including `.git`/`.env`), dependency/build folders, links, credential-named files and oversized files are excluded. Review source for embedded secrets before enabling API help or web research: filename filtering is not a secret scanner.

The first version supports standard-library Node and Python projects, up to 200 source files / 4 MB. Per-write limit is 32 KB. It does not install third-party dependencies, run arbitrary shell commands, start preview servers or automatically merge changes into the original repository. Use the displayed workspace path to inspect and copy reviewed changes back yourself.

Working files: `.ai-world/workspaces/<project-id>/`. Prior versions: `.ai-world/code-history/<project-id>/`. Tool events and session history: `.ai-world/state.json`. These directories are ignored by Git.

## Docker execution

Docker Desktop must be running. Prepare the official images with `docker pull node:22-alpine` and `docker pull python:3.12-alpine` (installed on this PC during setup). Each test run uses a fresh container: no network, read-only root and source mount, non-root UID, dropped capabilities, no new privileges, process/memory/CPU limits, 90-second timeout and bounded output. It receives no API keys or Docker socket. Stop/timeout removes the named container. Generated code is never run directly on the host.

## API help and publication

The per-session **Ask OpenAI when stuck** checkbox enables sharing relevant context, code excerpts and test logs with OpenAI. The key stays in ignored `.env.local`; the default expert uses existing `OPENAI_TEXT_MODEL` (`gpt-4.1-mini` on this PC), or `NOMI_EXPERT_MODEL` if explicitly configured. Requests use Responses with `store:false`. Advice must still be tested locally.

Coding projects are private by default and excluded from public snapshots, including their messages and live status. **Publish discussion** shares the goal, conversation and test/review status with NOMI World. Files and detailed tool traces are not automatically uploaded, but agents can quote code in their messages. Making a project private removes it from the next published snapshot, but cannot undo copies already viewed by others. Imported projects start private.

## Validation

`npm run world:test` covers filesystem boundaries, links, import exclusions, private snapshots, collaboration, test/review gates, cancellation and API caps. `node scripts/ai-world/coding-smoke.mjs` performs real Docker and research checks. Add `--expert` for one small paid API verification. Browser checks separately exercise the console and public page.

References: [Docker execution](https://docs.docker.com/engine/containers/run/), [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs), [Stack Exchange search](https://api.stackexchange.com/docs/advanced-search), [GitHub search](https://docs.github.com/en/rest/search/search), [OpenAI Responses](https://platform.openai.com/docs/api-reference/responses).
