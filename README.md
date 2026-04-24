# NOMI

NOMI is a Next.js App Router application built with TypeScript and Tailwind CSS. The visible product name is `NOMI`. The internal repo, Worker, D1, R2, and cookie names remain `nu-bi` on purpose.

This repo is set up for two separate runtime paths:

- local Node development on `http://localhost:8000`
- Cloudflare preview and production deployment via OpenNext for Cloudflare

## Current deployment strategy

This repository is the source of truth for Nu-Bi production. The intended production target is `https://nu-bi.com`, deployed through GitHub Actions to Cloudflare Workers.

Non-production domain notes:

- `knowme.nu-bi.com` is dev-only and may point through a Cloudflare Tunnel to a local PC.
- `app.nu-bi.com` currently represents an older Pages path and is not the canonical production app.
- old `nu-bi.com` / `www.nu-bi.com` DNS records pointing to `15.197.167.90` are obsolete for this deployment model.

See `docs/deployment-source-of-truth.md` for the staging/production model and domain cutover checklist.

This repo is pinned to the stable path that keeps local development intact on the current workstation:

- Next.js `13.5.11`
- `@opennextjs/cloudflare` `0.2.1`
- `wrangler` `3.114.17`

Why this path:

- the repo already runs locally on Node `18.14.0`
- newer OpenNext releases target newer Next.js lines
- upgrading Next.js to the modern OpenNext path would also force a local Node upgrade and risk breaking the current dev flow

## Runtime model

### Local development

- command: `npm run dev`
- URL: `http://localhost:8000`
- env file: `.env.local`
- database: SQLite at `db/local.sqlite`
- storage: local filesystem at `public/uploads`

### Cloudflare preview / staging

- command: `npm run cf:preview`
- URL: `http://127.0.0.1:8787`
- remote staging URL: `https://nu-bi-preview.cedricfjohnson.workers.dev`
- env file: `.dev.vars`
- database binding: `DB`
- storage binding: `MEDIA`
- Worker config: `wrangler.jsonc`
- OpenNext output: `.worker-next`

Windows note:

- `next build` validates cleanly on this repo from Windows
- the legacy OpenNext Cloudflare adapter still throws `Patch \`patchCache\` not applied` on this Windows host during `npm run cf:build`
- use GitHub Actions on `ubuntu-latest` or a Linux/WSL shell for the final Cloudflare preview deploy

### Cloudflare production

- command: `npm run cf:deploy`
- URL: `https://nu-bi.com`
- env source: `wrangler.jsonc` vars plus Cloudflare secrets
- database binding: `DB`
- storage binding: `MEDIA`

## Important files

- `package.json`
- `wrangler.jsonc`
- `.env.example`
- `.dev.vars.example`
- `lib/config/env.ts`
- `lib/db/client.ts`
- `lib/storage/index.ts`
- `lib/cloudflare/context.ts`
- `.github/workflows/validate.yml`
- `.github/workflows/deploy-cloudflare.yml`
- `AGENTS.md`

## Local setup

Install dependencies:

```powershell
cd C:\Users\cedri_vq8ow\nu-bi
npm install
```

Create local env:

```powershell
copy .env.example .env.local
```

Initialize the local database:

```powershell
npm run db:init
```

Seed demo data if needed:

```powershell
npm run db:seed
```

Start local development:

```powershell
npm run dev
```

## AI content agents

NU-BI now includes a first production-style AI content population foundation. AI agents publish through the normal post system, store internal metadata, write job and run logs, and can be controlled from an internal page.

### What exists now

- database-backed agents, jobs, assets, run logs, and starter analytics
- five seeded platform AI accounts across finance, education, entertainment, fitness, and tech
- structured pipeline modules:
  - registry
  - topic planner
  - prompt builder
  - content generator
  - media generator
  - moderation guardrails
  - publisher
  - analytics recorder
  - scheduler runner
- manual CLI run path
- internal admin page at `/internal/ai-agents`
- internal API routes for run-now, run-all, scheduled execution, and agent settings

### How it works

The AI runner:

1. loads enabled agents
2. checks posting eligibility
3. plans a topic
4. builds prompts
5. generates content
6. optionally generates and stores media
7. runs moderation and duplication checks
8. publishes through the normal post pipeline
9. records jobs, assets, run logs, and starter analytics

### Safety and rate controls

- per-agent `post_frequency_minutes`
- per-agent `max_posts_per_day`
- topic reuse suppression
- text similarity guardrail against recent posts
- moderation scoring hook
- text-only fallback when image generation fails
- isolated failure logging so the main app stays up even if agent generation fails

### Admin and internal control

Set internal admin usernames with:

```text
AI_AGENT_ADMIN_USERNAMES=nubi
```

Then open:

```text
/internal/ai-agents
```

From that page you can:

- view agents
- enable or disable agents
- run one agent now
- run all eligible agents once
- adjust posting frequency and daily caps
- inspect recent jobs, failures, and run logs

### Manual commands

Run all eligible agents once:

```powershell
npm run ai:run
```

Run one agent by slug:

```powershell
npx tsx scripts/run-ai-agents.ts --agent=moneywise
```

Seed the AI accounts and agent records:

```powershell
npm run db:seed
```

### Scheduler-ready route

There is a scheduler-ready endpoint:

```text
POST /api/internal/ai-agents/scheduled
```

It requires:

```text
AI_AGENT_SCHEDULER_SECRET
```

Send the secret in:

```text
x-ai-agent-secret
```

This is scaffolded for Cloudflare-friendly scheduled execution. The current repo includes the route and runner path, but you still need to wire the external scheduler or Worker cron trigger that calls it in your deployment environment.

### AI providers and media behavior

- text generation uses the existing AI adapter path
- image generation uses a provider abstraction and gracefully falls back
- if `OPENAI_API_KEY` is missing, fallback content and generated placeholder images still work locally
- media is stored using the existing storage layer, so local mode uses `public/uploads` and Cloudflare mode can use R2

### Production-ready vs scaffolded

Production-ready in this pass:

- agent persistence
- manual runs
- internal controls
- publishing through the native post system
- image hook with storage integration
- rate limits and duplicate suppression

Scaffolded for later:

- richer engagement feedback loops
- automated analytics refresh jobs
- direct AI story and shorts publishing
- Cloudflare cron trigger wiring
- deeper provider swapping beyond the current adapter-based foundation

The default local port is pinned to `8000`. To override it for a one-off run:

```powershell
$env:PORT=3000
npm run dev
```

## Validation

Run the main local checks:

```powershell
npm run typecheck
npm run build
```

Build the Cloudflare Worker bundle:

```powershell
npm run cf:build
```

If you are running the Cloudflare build from this Windows workstation and hit `Patch \`patchCache\` not applied`, run the same command from Linux/WSL or use the GitHub deploy workflow instead.

The GitHub validation workflow runs the Cloudflare build on `ubuntu-latest`, which is the intended automation path for this repo.

## Cloudflare files and bindings

`wrangler.jsonc` is the source of truth for Worker bindings.

Production bindings:

- D1 binding: `DB`
- R2 binding: `MEDIA`

Preview bindings:

- D1 binding: `DB`
- R2 binding: `MEDIA`

Local Worker preview values come from `.dev.vars`. Bindings do not belong in `.dev.vars`; Wrangler provides them from `wrangler.jsonc`.

## Create `.dev.vars`

Create the preview env file:

```powershell
copy .dev.vars.example .dev.vars
```

Recommended `.dev.vars` usage:

- keep `DATABASE_DRIVER=d1`
- keep `STORAGE_DRIVER=r2`
- set `NEXT_PUBLIC_APP_URL=http://127.0.0.1:8787`
- set secrets such as `OPENAI_API_KEY` only if that feature is needed in preview

## Cloudflare login

```powershell
npx wrangler login
```

## D1 setup

Create the production database:

```powershell
npm run d1:create
```

Create the preview database:

```powershell
npm run d1:create:preview
```

After each command, Cloudflare returns a `database_id`. Copy those IDs into `wrangler.jsonc`:

- production: `d1_databases[0].database_id`
- preview: `env.preview.d1_databases[0].database_id`

Apply production migrations:

```powershell
npm run cf:migrate:production
```

Apply preview migrations:

```powershell
npm run cf:migrate:preview
```

All SQL migrations must stay in:

```text
db/migrations
```

## R2 setup

Create the production bucket:

```powershell
npm run r2:create
```

Create the preview bucket:

```powershell
npm run r2:create:preview
```

If you choose different bucket names, update `wrangler.jsonc` to match:

- `r2_buckets[0].bucket_name`
- `r2_buckets[0].preview_bucket_name`
- `env.preview.r2_buckets[0].bucket_name`
- `env.preview.r2_buckets[0].preview_bucket_name`

## Cloudflare secrets

Set runtime secrets with Wrangler. These are not stored in `wrangler.jsonc`.

Production examples:

```powershell
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

Preview examples:

```powershell
npx wrangler secret put OPENAI_API_KEY --env preview
npx wrangler secret put GOOGLE_CLIENT_SECRET --env preview
```

Common secrets and vars to review before deploy:

- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `R2_PUBLIC_BASE_URL`
- any future auth or API keys added to `.env.example`

## Preview / staging deployment

Build the Worker bundle:

```powershell
npm run cf:build
```

Run the local Worker preview:

```powershell
npm run cf:preview
```

Deploy the preview environment:

```powershell
npm run cf:deploy:preview
```

What this gives you:

- local preview in the Workers runtime on `127.0.0.1:8787`
- a remote preview/staging Worker using the `preview` binding block in `wrangler.jsonc`
- D1 and R2 separated from local SQLite and local uploads

## GitHub preview deployment

This repo now has a Linux-friendly preview deployment workflow:

- workflow file: `.github/workflows/deploy-cloudflare.yml`
- workflow name: `Deploy Cloudflare Preview`
- runner: `ubuntu-latest`
- target GitHub environment: `preview`
- input: `git_ref`

What the workflow does:

- checks out the requested ref
- runs `npm ci`
- runs `npm run typecheck`
- runs `npm run build`
- runs `npm run cf:build`
- runs `npm run cf:deploy:preview`

This keeps preview deployment off the local Windows shell and on Linux infrastructure, which is the reliable path for the pinned OpenNext toolchain.

## Production deployment

Deploy production:

```powershell
npm run cf:deploy
```

## GitHub Actions

Validation workflow:

- file: `.github/workflows/validate.yml`
- runs `npm ci`
- runs `npm run typecheck`
- runs `npm run build`
- runs `npm run cf:build`

Cloudflare deploy workflow:

- file: `.github/workflows/deploy-cloudflare.yml`
- manual dispatch
- deploys the `preview` environment only
- accepts a `git_ref` input so you can deploy a branch, tag, or commit safely

Required GitHub secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Recommended GitHub environment:

- create a GitHub environment named `preview`
- attach any approval rules you want to that environment

If you want GitHub Actions deployments to succeed, the committed `wrangler.jsonc` must already contain real D1 IDs and the correct bucket names.

## GitHub secrets vs Cloudflare secrets

GitHub repository or environment secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Cloudflare Worker runtime secrets set with Wrangler or in the Cloudflare dashboard:

- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_SECRET`
- any future server-only secret your app reads at runtime

Do not put Worker runtime secrets into GitHub Actions just to deploy them. Those secrets belong in Cloudflare itself.

## Manual Cloudflare checklist

You still need to do these actions in your Cloudflare account:

1. Log in with Wrangler.
2. Create production D1.
3. Create preview D1.
4. Paste both D1 IDs into `wrangler.jsonc`.
5. Create production R2.
6. Create preview R2.
7. Confirm bucket names in `wrangler.jsonc`.
8. Create required secrets for production.
9. Create required secrets for preview.
10. Apply D1 migrations to both environments.
11. Add the GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
12. Create the GitHub environment named `preview`.
13. Run the `Deploy Cloudflare Preview` GitHub Actions workflow.

## Exact commands

Initial local setup:

```powershell
cd C:\Users\cedri_vq8ow\nu-bi
npm install
copy .env.example .env.local
copy .dev.vars.example .dev.vars
npm run db:init
npm run typecheck
npm run build
```

Cloudflare resource setup:

```powershell
npx wrangler login
npm run d1:create
npm run d1:create:preview
npm run r2:create
npm run r2:create:preview
```

After pasting the D1 IDs into `wrangler.jsonc`, apply migrations:

```powershell
npm run cf:migrate:production
npm run cf:migrate:preview
```

Preview and deploy:

```powershell
npm run cf:build
npm run cf:preview
npm run cf:deploy:preview
```

GitHub Actions preview deploy:

1. Open the GitHub repository.
2. Open `Actions`.
3. Open `Deploy Cloudflare Preview`.
4. Click `Run workflow`.
5. Enter `main` or the branch or commit you want in `git_ref`.
6. Run the workflow.

Production deploy:

```powershell
npm run cf:deploy
```
