# NOMI

NOMI is a full-stack social product built with Next.js App Router, TypeScript, Tailwind CSS, and a repository-based data layer. The app still supports local SQLite and filesystem uploads for development, but it is now structured to deploy on Cloudflare Workers with D1 and R2.

Internal repo, folder, and infrastructure names intentionally remain `nu-bi` for now.

## What Changed In This Migration

- Database access is now runtime-aware:
  - local development uses SQLite through `sqlite3`
  - Cloudflare deployment uses the `DB` D1 binding
- Storage is now runtime-aware:
  - local development uses `public/uploads`
  - Cloudflare deployment uses the `MEDIA` R2 binding
- Media delivery now has a Worker-safe route fallback:
  - `/api/media/[key]`
- Cloudflare deployment scaffolding is now included:
  - `wrangler.toml`
  - `open-next.config.mjs`
  - OpenNext Cloudflare build scripts
- Local development remains intact:
  - `npm run dev`
  - `npm run db:init`
  - `npm run db:seed`

## Architecture

- `app/`: Next.js pages and route handlers
- `components/`: feed, profile, inbox, creator, and media UI
- `lib/auth/`: password hashing, session creation, cookie/session lookup
- `lib/cloudflare/`: Cloudflare runtime binding access
- `lib/config/`: shared environment resolution
- `lib/db/`: runtime-aware DB adapter and repository methods
- `lib/storage/`: runtime-aware local/R2 media storage
- `lib/ai/`: AI helpers and adapter abstraction
- `db/migrations/`: schema for local SQLite and D1
- `scripts/`: local DB bootstrapping and seeding

## Runtime Model

### Local development

- `DATABASE_DRIVER=sqlite`
- `STORAGE_DRIVER=local`
- SQLite file at `db/local.sqlite`
- uploads written to `public/uploads`

### Cloudflare deployment

- `DATABASE_DRIVER=d1`
- `STORAGE_DRIVER=r2`
- D1 bound as `DB`
- R2 bound as `MEDIA`
- OpenNext builds the Worker entry at `.open-next/worker.js`

## Environment Variables

Copy `.env.example` to `.env.local` for local development.

Key variables:

- `NEXT_PUBLIC_APP_URL`
- `DATABASE_DRIVER`
- `DATABASE_PATH`
- `STORAGE_DRIVER`
- `UPLOADS_DIR`
- `NEXT_PUBLIC_STORAGE_BASE_PATH`
- `NEXT_PUBLIC_MEDIA_BASE_PATH`
- `SESSION_COOKIE_NAME`
- `SESSION_MAX_AGE_DAYS`
- `R2_PUBLIC_BASE_URL`
- `OPENAI_API_KEY`

For Cloudflare preview or Worker-local testing, copy `.dev.vars.example` to `.dev.vars`.

## Local Development

1. Install dependencies:

```powershell
cd C:\Users\cedri_vq8ow\nu-bi
npm install
```

2. Create local env:

```powershell
copy .env.example .env.local
```

3. Initialize local SQLite:

```powershell
npm run db:init
```

4. Seed demo data if needed:

```powershell
npm run db:seed
```

5. Start local dev:

```powershell
npm run dev
```

Local app:

- `http://localhost:8000`

## Demo Accounts

- `aria@nubi.com` / `Password123!`
- `kade@nubi.com` / `Password123!`
- `lina@nubi.com` / `Password123!`
- `master@nubi.com` / `Password123!`

## GitHub Push Flow

1. Create a GitHub repo.
2. Add the remote:

```powershell
git remote add origin <YOUR_GITHUB_REPO_URL>
```

3. Commit your work:

```powershell
git add .
git commit -m "Prepare NOMI for Cloudflare deployment"
```

4. Push:

```powershell
git push -u origin main
```

## Cloudflare Setup

### 1. Install Wrangler

```powershell
npm install
```

Wrangler is included in `devDependencies`.

### 2. Log into Cloudflare

```powershell
npx wrangler login
```

### 3. Create D1

```powershell
npx wrangler d1 create nu-bi
```

Take the returned `database_id` and place it in [wrangler.toml](./wrangler.toml).

### 4. Apply migrations to D1

```powershell
npx wrangler d1 migrations apply nu-bi --remote
```

This project stores migrations in `db/migrations`, and `wrangler.toml` is already configured to use that folder.

### 5. Create R2 buckets

```powershell
npx wrangler r2 bucket create nu-bi-media
npx wrangler r2 bucket create nu-bi-media-preview
```

If you use different names, update [wrangler.toml](./wrangler.toml).

### 6. Configure secrets and vars

Set any sensitive values as Cloudflare secrets:

```powershell
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

Non-secret runtime vars can stay in `wrangler.toml`, or you can manage them in the Cloudflare dashboard.

Recommended production vars:

- `NEXT_PUBLIC_APP_URL`
- `DATABASE_DRIVER=d1`
- `STORAGE_DRIVER=r2`
- `NEXT_PUBLIC_MEDIA_BASE_PATH=/api/media`
- `SESSION_COOKIE_NAME=nubi_session`
- `SESSION_MAX_AGE_DAYS=14`
- `R2_PUBLIC_BASE_URL` if using a public/custom R2 domain

### 7. Build for Cloudflare

```powershell
npm run cf:build
```

### 8. Preview locally with Worker runtime

```powershell
copy .dev.vars.example .dev.vars
npm run cf:preview
```

### 9. Deploy

```powershell
npm run cf:deploy
```

## Notes On D1 And Local SQLite

- Local dev still auto-applies migrations through `lib/db/client.ts`.
- Cloudflare D1 does not auto-apply migrations on requests.
- Use Wrangler migration commands for D1 changes.
- This keeps local iteration fast without making production startup do schema work.

## Notes On R2 And Media

- Local uploads still use `public/uploads`.
- Cloudflare uploads use `MEDIA.put(...)` when `STORAGE_DRIVER=r2` and the `MEDIA` binding exists.
- If `R2_PUBLIC_BASE_URL` is set, uploaded files use that public URL.
- If not, media can still be served through `/api/media/[key]`.

## Performance Foundations Added

- Worker-native DB path in production instead of local tunnel/database dependence
- Worker-native storage path in production instead of local filesystem dependence
- immutable cache headers for `_next/static` and local uploads in `public/_headers`
- media route fallback so deployment is not blocked on public R2 domain setup

## Important Files

- [package.json](./package.json)
- [next.config.js](./next.config.js)
- [open-next.config.mjs](./open-next.config.mjs)
- [wrangler.toml](./wrangler.toml)
- [lib/config/env.ts](./lib/config/env.ts)
- [lib/cloudflare/context.ts](./lib/cloudflare/context.ts)
- [lib/db/client.ts](./lib/db/client.ts)
- [lib/storage/index.ts](./lib/storage/index.ts)
- [app/api/media/[key]/route.ts](./app/api/media/[key]/route.ts)
- [.env.example](./.env.example)
- [.dev.vars.example](./.dev.vars.example)

## What Still Requires Manual Setup

- real Cloudflare `database_id` in `wrangler.toml`
- real R2 bucket names if different from defaults
- Cloudflare secrets for OpenAI / OAuth if used
- `npm install` to fetch `@opennextjs/cloudflare` and `wrangler`
- optionally updating `package-lock.json` after installing the new Cloudflare dependencies

## Recommended Next Commands

```powershell
cd C:\Users\cedri_vq8ow\nu-bi
npm install
npm run typecheck
npm run db:init
npm run dev
```

Then for Cloudflare:

```powershell
npx wrangler login
npx wrangler d1 create nu-bi
npx wrangler r2 bucket create nu-bi-media
npx wrangler r2 bucket create nu-bi-media-preview
npx wrangler d1 migrations apply nu-bi --remote
npm run cf:build
npm run cf:deploy
```
