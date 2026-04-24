# Desktop Nu-Bi Audit

Audit date: 2026-04-23

Machine/folder audited: `C:\Users\cedri_vq8ow\nu-bi`

## A. Confirmed project identity

This folder is confirmed as the Nu-Bi project repository.

Evidence:

- Git repository on branch `main`, tracking `origin/main`.
- `package.json` name is `nu-bi`.
- README states the visible product brand is `NOMI`, while internal repo, Worker, D1, R2, and cookie names intentionally remain `nu-bi`.
- Next.js App Router source exists under `app/`.
- Local Node runtime is configured for SQLite and filesystem uploads.
- Cloudflare runtime is configured for OpenNext, Workers, D1, and R2.
- Pinned deployment stack is present:
  - `next` `13.5.11`
  - `@opennextjs/cloudflare` `0.2.1`
  - `wrangler` `3.114.17`

## B. Important files/folders present

Top-level project/config files:

- `package.json`
- `package-lock.json`
- `README.md`
- `AGENTS.md`
- `next.config.js`
- `postcss.config.js`
- `tailwind.config.ts`
- `tsconfig.json`
- `tsconfig.typecheck.json`
- `wrangler.jsonc`
- `.env.example`
- `.dev.vars.example`
- `.gitignore`

Application source folders:

- `app/`
- `components/`
- `hooks/`
- `lib/`
- `styles/`
- `types/`

Database and storage:

- `db/migrations/`
- ignored local SQLite files: `db/local.sqlite`, `db/local.sqlite-shm`, `db/local.sqlite-wal`
- `public/uploads/` with ignored local upload media
- `public/icons/`
- `public/service-worker.js`

Cloudflare/OpenNext deployment:

- `wrangler.jsonc`
- `.github/workflows/validate.yml`
- `.github/workflows/deploy-cloudflare.yml`
- `.github/workflows/deploy-cloudflare-production.yml`
- `.github/workflows/ai-agents-scheduler.yml`
- `scripts/patch-opennext-cloudflare.mjs`
- `scripts/prune-worker-assets.mjs`
- generated `.worker-next/index.mjs` after `npm run cf:build`

Detected route groups/pages include:

- Pages: `/`, `/home`, `/explore`, `/creator`, `/creator/media`, `/ai`, `/messages`, `/messages/[conversationId]`, `/notifications`, `/profile/[username]`, `/post/[id]`, `/post/[id]/edit`, `/saved`, `/search`, `/settings`, `/settings/profile`, `/settings/notifications`, `/shorts`, `/login`, `/signup`, `/internal/ai-agents`, `/manifest.webmanifest`.
- API areas: admin engagement, AI caption/chat/document/profile/reply/speech/visual, auth, blocks, comments, conversations, follow, interests, internal AI agents, likes, media, messages, mutes, notifications, polls, posts, profile, reports, reposts, saved, search, settings, shorts, stories, upload.

## C. Missing or suspicious items

No confirmed missing source files were found. `npm run typecheck`, `npm run build`, `npm run cf:build`, and `npx wrangler deploy --env preview --dry-run` all passed.

Suspicious items:

- Two migration files share the `012_` prefix:
  - `db/migrations/012_ai_content_agents.sql`
  - `db/migrations/012_profile_voice_intro.sql`
- Duplicate numbering is not a build blocker, but it is operationally suspicious because migration order is filename-based. If these migrations have not already been applied remotely, renumber one before making this history canonical.
- Many important source files are untracked. They look like real Nu-Bi/NOMI functionality and should be reviewed and committed before GitHub is treated as the new source of truth.
- `.env.local` and `.dev.vars` exist and are ignored. They were not copied into this report because they may contain secrets.
- Local SQLite and upload media are ignored. Back them up separately if they contain important seed/test data.
- `npm install` reports 15 audit vulnerabilities: 2 low, 4 moderate, 9 high. No dependency upgrades were made because that is not a safe high-confidence recovery edit.
- `wrangler` reports that version `3.114.17` is out of date. The repo intentionally pins this version for the current OpenNext path, so it was not upgraded during this audit.

Legacy/stale references:

- README and `docs/deployment-source-of-truth.md` mark `app.nu-bi.com` as an older Pages path and `knowme.nu-bi.com` as dev-only.
- No unrelated old-project source tree was found inside this repo.

## D. Untracked but likely important files

Likely important untracked source/config files:

- `.github/workflows/ai-agents-scheduler.yml`
- `.github/workflows/deploy-cloudflare-production.yml`
- `app/api/admin/engagement/post/route.ts`
- `app/api/admin/engagement/profile/route.ts`
- `app/api/ai/chat/route.ts`
- `app/api/ai/document/route.ts`
- `app/api/ai/speech/route.ts`
- `app/api/internal/ai-agents/[agentId]/route.ts`
- `app/api/internal/ai-agents/[agentId]/run/route.ts`
- `app/api/internal/ai-agents/run-all/route.ts`
- `app/api/internal/ai-agents/scheduled/route.ts`
- `app/api/posts/view/route.ts`
- `app/api/reposts/route.ts`
- `app/api/stories/engage/route.ts`
- `app/api/stories/route.ts`
- `app/api/stories/seen/route.ts`
- `app/internal/ai-agents/page.tsx`
- `app/manifest.ts`
- `components/activity-alerts.tsx`
- `components/admin-engagement-controls.tsx`
- `components/ai-agents-admin-panel.tsx`
- `components/ai-chat-panel.tsx`
- `components/creator-command-panel.tsx`
- `components/extras-ai-chat.tsx`
- `components/home-ai-drawer.tsx`
- `components/home-ai-tools-panel.tsx`
- `components/home-onboarding-panel.tsx`
- `components/home-quick-launch-panel.tsx`
- `components/home-stories-panel.tsx`
- `components/home-utility-drawer.tsx`
- `components/inbox-brief-panel.tsx`
- `components/install-nubi-prompt.tsx`
- `components/microphone-level.tsx`
- `components/mood-feed-panel.tsx`
- `components/post-view-tracker.tsx`
- `components/pwa-register.tsx`
- `components/quote-repost-button.tsx`
- `components/story-highlight-row.tsx`
- `components/video-editor-panel.tsx`
- `db/migrations/008_stories.sql`
- `db/migrations/009_story_views.sql`
- `db/migrations/010_story_engagements.sql`
- `db/migrations/011_comment_media.sql`
- `db/migrations/012_ai_content_agents.sql`
- `db/migrations/012_profile_voice_intro.sql`
- `db/migrations/013_story_engagement_media.sql`
- `db/migrations/014_test_engagement_overrides.sql`
- `docs/deployment-source-of-truth.md`
- `hooks/use-microphone-level.ts`
- `lib/ai-agents/analytics.ts`
- `lib/ai-agents/bootstrap.ts`
- `lib/ai-agents/content-generator.ts`
- `lib/ai-agents/media-generator.ts`
- `lib/ai-agents/moderation.ts`
- `lib/ai-agents/prompt-builder.ts`
- `lib/ai-agents/publisher.ts`
- `lib/ai-agents/registry.ts`
- `lib/ai-agents/scheduler.ts`
- `lib/ai-agents/topic-planner.ts`
- `lib/auth/internal.ts`
- `lib/db/ai-repository.ts`
- `lib/media/image-framing.ts`
- `lib/media/upload-assistant.ts`
- `lib/media/video-editor.ts`
- `lib/notifications/presenter.ts`
- `public/icons/nomi-icon-maskable.svg`
- `public/icons/nomi-icon.svg`
- `public/service-worker.js`
- `scripts/delete-ai-posts.ts`
- `scripts/prune-worker-assets.mjs`
- `scripts/run-ai-agents.ts`
- `tsconfig.typecheck.json`

Ignored but locally important:

- `.env.local`
- `.dev.vars`
- `db/local.sqlite`
- `db/local.sqlite-shm`
- `db/local.sqlite-wal`
- `public/uploads/*`

## E. Broken imports/references

No broken imports or missing route/component/module references were found by the passing typecheck and builds.

Script/config references checked:

- `scripts/run-next.mjs` exists and sets the default local port to `8000`.
- `scripts/init-db.ts` exists.
- `scripts/seed.ts` exists.
- `scripts/run-ai-agents.ts` exists.
- `scripts/patch-opennext-cloudflare.mjs` exists.
- `scripts/prune-worker-assets.mjs` exists.
- `wrangler.jsonc` points to generated `.worker-next/index.mjs`.
- `wrangler.jsonc` uses `db/migrations`, which exists.

Environment variable coverage:

- Variables referenced in `lib/config/env.ts` are represented in `.env.example`, `.dev.vars.example`, or `wrangler.jsonc`.
- `OPENAI_API_KEY` is optional for fallback behavior but required for real OpenAI-backed AI features.
- `AI_AGENT_SCHEDULER_SECRET` is required for the scheduled AI-agent endpoint and must be configured as a Cloudflare Worker secret for runtime use.
- GitHub scheduler workflow also requires `NUBI_AI_AGENT_SCHEDULER_SECRET`.

## F. Build/deploy blockers

No current install, typecheck, local build, Cloudflare bundle, or Cloudflare preview dry-run blocker remains.

Current warnings/risks:

- `npm install` reports 15 vulnerabilities.
- Wrangler warns that pinned `3.114.17` is out of date.
- Wrangler dry run reports `direct eval` warnings inside `.worker-next/index.mjs`; this comes from generated/bundled code and did not block the dry run.
- Remote deploy readiness still depends on external Cloudflare/GitHub state:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - D1 database IDs in `wrangler.jsonc` matching real Cloudflare resources
  - R2 buckets existing
  - Worker secrets configured in preview and production
  - D1 migrations applied remotely
  - GitHub Actions environments/secrets configured

Historical note from the prior desktop recovery report:

- A previous local build blocker was a recursive `.next` junction pointing outside the repo. It has already been repaired; the current `.next` is a normal generated build folder.

## G. Recommended fixes in priority order

1. Review and commit the untracked important source/config files listed in section D.
2. Decide whether to renumber one duplicate `012_` migration before remote migration history depends on it.
3. Commit this audit file with the source-of-truth recovery commit.
4. Confirm Cloudflare resources and secrets outside the repo before deploying.
5. Apply remote D1 migrations only after reviewing migration order.
6. Push the reviewed desktop state to GitHub as the new source of truth.
7. Address npm audit findings in a separate dependency-maintenance pass with full regression testing.

## Command results

`git status --short --branch`:

- `## main...origin/main`
- Many tracked files are modified.
- Many important source/config files are untracked.

`git branch --show-current` and `git branch --all`:

- Current branch: `main`
- Branches: local `main`, remote `origin/main`

Package manager install check:

- Command: `npm install`
- Result: passed.
- Postinstall patch ran and reported `PATCH ALREADY APPLIED`.
- Audit summary: 15 vulnerabilities, no automatic fix applied.

Typecheck:

- Command: `npm run typecheck`
- Result: passed.

Build:

- Command: `npm run build`
- Result: passed.
- Generated 62 app routes.

Cloudflare bundle build:

- Command: `npm run cf:build`
- Result: passed.
- Output: `.worker-next/index.mjs`

Cloudflare preview deploy readiness check:

- Command: `npx wrangler deploy --env preview --dry-run`
- Result: passed.
- No deploy was performed.
- Preview bindings detected: D1 `nu-bi-preview`, R2 `nu-bi-media-preview`, expected preview vars.

## Files changed by this audit

Intentionally edited:

- `DESKTOP_NU_BI_AUDIT.md`

Generated/updated by verification commands:

- `.next/`
- `.worker-next/`
- `.wrangler/`
- `node_modules/` may have been touched by `npm install`
- `package-lock.json` timestamp/content may be touched by npm if lock metadata changed; inspect before commit

No app source code, migrations, package scripts, or deployment config files were manually edited in this audit.

## Files still suspected missing

No exact missing source files are currently suspected.

Items still suspicious but present:

- `db/migrations/012_ai_content_agents.sql`
- `db/migrations/012_profile_voice_intro.sql`

The concern is duplicate migration numbering, not missing content.

## Ready to push as new source of truth

Conditionally yes.

This repo is internally complete enough to install, typecheck, build locally, build the Cloudflare Worker bundle, and pass a non-deploying Cloudflare preview dry run.

Before pushing as the new GitHub source of truth:

- Review and commit the untracked important files.
- Decide how to handle the duplicate `012_` migration numbering.
- Keep ignored local data and secrets out of Git.
- Confirm external Cloudflare/GitHub secrets and resources separately before deploying.
