# NOMI

NOMI is a full-stack social product built with Next.js App Router, TypeScript, and Tailwind CSS. The visible brand is `NOMI`, while the internal repo, folder, database, and infrastructure names intentionally remain `nu-bi`.

This Phase 2 pass finishes the platform foundation for:

- stable local Node development
- Cloudflare Workers deployment via OpenNext
- explicit D1 and R2 runtime separation
- clean local, preview, and production environment handling
- CI validation and GitHub deploy scaffolding

## What Is Implemented

- Local app development on Next.js App Router
- Local SQLite database with auto-applied SQL migrations
- Local filesystem uploads in `public/uploads`
- Runtime-aware D1 adapter path for Cloudflare
- Runtime-aware R2 adapter path for Cloudflare
- Worker-safe media delivery through `/api/media/[key]`
- Local dev scripts with predictable default port handling
- GitHub validation workflow
- Manual GitHub deploy workflow scaffold for Cloudflare
- `wrangler.jsonc` config with production and preview binding sections

## What Is Scaffolded

- real Cloudflare D1 database IDs
- real Cloudflare R2 buckets and public media domain
- Cloudflare secrets such as `OPENAI_API_KEY`
- GitHub repository secrets for deploy automation

## Version Decisions

- App runtime remains on Next.js `13.5.11` to preserve current product behavior and avoid a risky framework upgrade during infrastructure work.
- Local app development remains compatible with Node `18.14+`.
- Cloudflare build and deploy tooling in this repo currently requires Node `20.3+`.
- That means:
  - `npm run dev`, `npm run db:init`, and `npm run db:seed` can keep running on the local workstation
  - `npm run cf:*` commands should run under Node 20+, typically in GitHub Actions or a newer shell environment

## Runtime Model

### Local Node development

- command: `npm run dev`
- env source: `.env.local`
- database: SQLite at `db/local.sqlite`
- storage: local filesystem at `public/uploads`

### Local Worker preview

- command: `npm run cf:preview`
- env source: `.dev.vars`
- database: D1 binding `DB`
- storage: R2 binding `MEDIA`
- runtime: Wrangler + Worker preview

### Cloudflare production

- command: `npm run cf:deploy`
- env source: `wrangler.jsonc` vars + Cloudflare secrets
- database: D1 binding `DB`
- storage: R2 binding `MEDIA`

## Important Files

- [package.json](./package.json)
- [wrangler.jsonc](./wrangler.jsonc)
- [next.config.js](./next.config.js)
- [lib/config/env.ts](./lib/config/env.ts)
- [lib/db/client.ts](./lib/db/client.ts)
- [lib/storage/index.ts](./lib/storage/index.ts)
- [lib/auth/session.ts](./lib/auth/session.ts)
- [.env.example](./.env.example)
- [.dev.vars.example](./.dev.vars.example)
- [.github/workflows/validate.yml](./.github/workflows/validate.yml)
- [.github/workflows/deploy-cloudflare.yml](./.github/workflows/deploy-cloudflare.yml)
- [AGENTS.md](./AGENTS.md)

## Local Setup

1. Install dependencies:

```powershell
cd C:\Users\cedri_vq8ow\nu-bi
npm install
```

2. Create local env:

```powershell
copy .env.example .env.local
```

3. Initialize the local database:

```powershell
npm run db:init
```

4. Seed demo data if needed:

```powershell
npm run db:seed
```

5. Start local development:

```powershell
npm run dev
```

Default local URL:

- `http://localhost:8000`

If you want a different local port:

```powershell
$env:PORT=3000
npm run dev
```

## Local Validation

Run the main validation commands:

```powershell
npm run typecheck
npm run build
```

`npm run build` validates the Next.js production build locally. `npm run cf:*` commands are a separate Cloudflare toolchain path and require Node 20.3+.

## Environment Files

### `.env.local`

Used by:

- `npm run dev`
- local SQLite
- local filesystem uploads

Create it from:

```powershell
copy .env.example .env.local
```

### `.dev.vars`

Used by:

- `npm run cf:preview`
- local Worker preview

Create it from:

```powershell
copy .dev.vars.example .dev.vars
```

Important:

- `DB` and `MEDIA` are not set in `.dev.vars`
- those are Wrangler bindings from `wrangler.jsonc`

### Cloudflare runtime vars and secrets

Used by:

- `npm run cf:deploy`
- deployed Worker runtime

Set secrets with Wrangler or the Cloudflare dashboard, for example:

```powershell
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

## Cloudflare Login

```powershell
npx wrangler login
```

## D1 Setup

Create production D1:

```powershell
npx wrangler d1 create nu-bi
```

Create preview D1:

```powershell
npx wrangler d1 create nu-bi-preview
```

Then copy the returned `database_id` values into [wrangler.jsonc](./wrangler.jsonc):

- production `database_id`
- preview `env.preview.d1_databases[0].database_id`

Apply production migrations:

```powershell
npm run cf:migrate:production
```

Apply preview migrations:

```powershell
npm run cf:migrate:preview
```

## R2 Setup

Create production bucket:

```powershell
npx wrangler r2 bucket create nu-bi-media
```

Create preview bucket:

```powershell
npx wrangler r2 bucket create nu-bi-media-preview
```

If you use different bucket names, update [wrangler.jsonc](./wrangler.jsonc) to match.

## Cloudflare Preview

1. Make sure `.dev.vars` exists:

```powershell
copy .dev.vars.example .dev.vars
```

2. Make sure preview D1 and preview R2 bindings exist in [wrangler.jsonc](./wrangler.jsonc)

3. Run preview:

```powershell
npm run cf:preview
```

Preview URL:

- `http://127.0.0.1:8787`

## Cloudflare Production Deploy

1. Ensure Node 20.3+ is active
2. Ensure `wrangler.jsonc` contains real D1 IDs and bucket names
3. Ensure required Cloudflare secrets are configured
4. Build and deploy:

```powershell
npm run cf:build
npm run cf:deploy
```

To deploy preview explicitly:

```powershell
npm run cf:deploy:preview
```

## GitHub Workflow

### Validation

Workflow file:

- [.github/workflows/validate.yml](./.github/workflows/validate.yml)

It runs:

- `npm ci`
- `npm run typecheck`
- `npm run build`

### Cloudflare deploy

Workflow file:

- [.github/workflows/deploy-cloudflare.yml](./.github/workflows/deploy-cloudflare.yml)

Required GitHub secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Recommended process:

1. merge to `main`
2. run the manual deploy workflow
3. choose `preview` or `production`

## Rollback / Recovery Basics

If a deploy goes bad:

1. redeploy the last known good commit from GitHub Actions or locally
2. if the issue is schema-related, stop and inspect the last migration applied to D1 before pushing another deploy
3. if the issue is storage-related, verify the `MEDIA` binding and bucket names in Cloudflare before changing application code
4. use `npm run dev` or `npm run cf:preview` to reproduce locally before retrying production

## Notes For Future Passes

- Brand is `NOMI`
- Internal repo and infrastructure names remain `nu-bi`
- Mobile layout is sensitive
- Do not casually blur local SQLite/local uploads with D1/R2 runtime code
- Cloudflare deploy tooling is Node 20+, but local app development can remain on Node 18.14+

## Recommended Next Commands

For local app work:

```powershell
cd C:\Users\cedri_vq8ow\nu-bi
npm run typecheck
npm run build
npm run db:init
npm run dev
```

For Cloudflare setup:

```powershell
npx wrangler login
npx wrangler d1 create nu-bi
npx wrangler d1 create nu-bi-preview
npx wrangler r2 bucket create nu-bi-media
npx wrangler r2 bucket create nu-bi-media-preview
npm run cf:migrate:production
npm run cf:migrate:preview
```

For Cloudflare preview or deploy:

```powershell
copy .dev.vars.example .dev.vars
npm run cf:preview
```

```powershell
npm run cf:build
npm run cf:deploy
```
