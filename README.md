# Nu-bi

Nu-bi is a production-leaning MVP for an AI-ready social platform built with Next.js, TypeScript, Tailwind CSS, SQLite for local development, and a D1-compatible SQL schema for Cloudflare deployment.

## Architecture

- `app/`: Next.js App Router pages and API routes.
- `components/`: reusable UI for auth, feed, profile, messaging, and interactions.
- `lib/auth/`: session cookies and password hashing.
- `lib/db/`: SQLite client plus repository methods for auth, feed, social graph, comments, messaging, notifications, search, and reports.
- `lib/storage/`: local media uploads with an R2-ready interface contract.
- `lib/ai/`: ranking, moderation, post analysis, message tone, and assistant integration hooks.
- `db/migrations/001_init.sql`: D1-compatible schema with indexes and foreign keys.
- `scripts/`: local DB initialization and seed scripts.

## Fully implemented

- Email/password sign up, log in, log out, and cookie-backed sessions.
- Protected routes with middleware.
- Public landing page and protected app experience.
- Home feed with followed-user preference and discovery fallback.
- Post creation with text, image upload, repost support, and delete-own-post.
- Profiles with counts, bio, avatar, follow/unfollow, and user post history.
- Likes, comments, reports, notifications, and search.
- One-to-one direct messaging with unread tracking.
- Local file uploads saved into `public/uploads`.
- AI-ready interfaces for feed ranking, moderation scoring, post analysis, and message tone.

## Scaffolded but ready for extension

- Google OAuth environment/config placeholders.
- Cloudflare Worker deployment path via `wrangler.toml`.
- R2 production media binding through the storage abstraction.
- D1 production binding with the same SQL schema.
- Rich AI assistants and ranking logic behind `lib/ai/`.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create local env:

```bash
copy .env.example .env.local
```

On this machine the file lives at:

- `C:\Users\cedri_vq8ow\nu-bi\.env.local`

You can edit it with:

```powershell
notepad C:\Users\cedri_vq8ow\nu-bi\.env.local
```

For live OpenAI-backed AI features, add:

```env
OPENAI_API_KEY=your_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-4.1
```

3. Initialize the database:

```bash
npm run db:init
```

4. Optional demo data:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

Nu-bi runs on `http://localhost:8000`.

## Demo accounts after seeding

- `aria@nubi.com` / `Password123!`
- `kade@nubi.com` / `Password123!`
- `lina@nubi.com` / `Password123!`
- `master@nubi.com` / `Password123!`  `NU-BI` master account

## Exact connection path

The existing Cloudflare tunnel already maps:

- Hostname: `knowme.nu-bi.com`
- Local target: `http://localhost:8000`
- Tunnel config file: `C:\Users\cedri_vq8ow\.cloudflared\config.yml`

To use that existing connection locally:

1. Run Nu-bi with `npm run dev` from `C:\Users\cedri_vq8ow\nu-bi`
2. Start the tunnel with the existing script:

```powershell
.\start-tunnel.ps1
```

3. Verify locally:

- `http://localhost:8000`
- `http://localhost:8000/login`
- `http://localhost:8000/home`

4. Verify through the tunnel:

- `https://knowme.nu-bi.com`
- `https://knowme.nu-bi.com/login`
- `https://knowme.nu-bi.com/home`

## Cloudflare deployment notes

- The schema in [`db/migrations/001_init.sql`](./db/migrations/001_init.sql) is written to stay D1-compatible.
- `wrangler.toml` includes D1 and R2 bindings you can replace with real IDs and bucket names.
- For production media storage, swap the local upload behavior in [`lib/storage/index.ts`](./lib/storage/index.ts) to use the `MEDIA` R2 binding and `R2_PUBLIC_BASE_URL`.
- For production sessions, the current cookie/session table design can remain unchanged when backed by D1.

## Key routes

- `/`
- `/login`
- `/signup`
- `/home`
- `/profile/[username]`
- `/settings/profile`
- `/messages`
- `/messages/[conversationId]`
- `/search`
- `/notifications`
- `/post/[id]`

## Useful checks

```bash
npm run typecheck
npm run build
```
