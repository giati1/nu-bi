# Nu-Bi Deployment Source Of Truth

This repository is the source of truth for Nu-Bi application code, Cloudflare Worker configuration, database migrations, storage bindings, and deployment automation.

## Environments

| Environment | Purpose | App URL | Database | Storage | Deploy path |
| --- | --- | --- | --- | --- | --- |
| Local Node | Developer workstation only | `http://localhost:8000` | SQLite `db/local.sqlite` | `public/uploads` | `npm run dev` |
| Local Worker preview | Cloudflare runtime smoke test | `http://127.0.0.1:8787` | D1 preview binding | R2 preview binding | `npm run cf:preview` |
| Staging | Remote pre-production | `https://nu-bi-preview.cedricfjohnson.workers.dev` | D1 `nu-bi-preview` | R2 `nu-bi-media-preview` | GitHub `Deploy Cloudflare Staging` |
| Production | Public production target | `https://nu-bi.com` | D1 `nu-bi` | R2 `nu-bi-media` | GitHub `Deploy Cloudflare Production` |

## Domain Policy

- `nu-bi.com` is the intended production apex domain.
- `www.nu-bi.com` should redirect to `nu-bi.com` after cutover.
- `knowme.nu-bi.com` is dev-only. It is a Cloudflare Tunnel to a local PC and must not be used as production.
- `app.nu-bi.com` currently points to an older Cloudflare Pages project and must not be treated as the canonical production app.
- DNS records pointing `nu-bi.com` or `www.nu-bi.com` to `15.197.167.90` are obsolete for Nu-Bi production.

## GitHub Actions

- `.github/workflows/validate.yml` validates PRs and `main`.
- `.github/workflows/deploy-cloudflare.yml` deploys staging using `wrangler --env preview`.
- `.github/workflows/deploy-cloudflare-production.yml` deploys production using the root Wrangler environment.
- `.github/workflows/ai-agents-scheduler.yml` performs health checks and triggers the AI-agent scheduler endpoint.

Required GitHub environments:

- `staging`
- `production`

Required GitHub environment or repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NUBI_AI_AGENT_SCHEDULER_SECRET`

Recommended GitHub variables:

- `NUBI_STAGING_HEALTH_URL=https://nu-bi-preview.cedricfjohnson.workers.dev/`
- `NUBI_PRODUCTION_HEALTH_URL=https://nu-bi.com/`
- `NUBI_AI_AGENT_SCHEDULER_URL=https://nu-bi.com/api/internal/ai-agents/scheduled`

## Cloudflare Dashboard Items Not Stored In Git

These must be configured in Cloudflare manually and verified before production cutover:

- Worker custom domain or route for `nu-bi.com`.
- Redirect or route policy for `www.nu-bi.com`.
- Removal or replacement of old DNS A records to `15.197.167.90`.
- Decision for `app.nu-bi.com`: remove, redirect, or repoint away from the old Pages project.
- Worker secrets for production and preview, including `OPENAI_API_KEY`, `GOOGLE_CLIENT_SECRET`, and `AI_AGENT_SCHEDULER_SECRET`.
- D1 databases and IDs matching `wrangler.jsonc`.
- R2 buckets matching `wrangler.jsonc`.

## Production Cutover Checklist

1. Confirm staging deployment succeeds from GitHub Actions.
2. Confirm `https://nu-bi-preview.cedricfjohnson.workers.dev/` returns HTTP 200.
3. Confirm staging D1 migrations are applied: `npm run cf:migrate:preview`.
4. Confirm production D1 migrations are applied: `npm run cf:migrate:production`.
5. Confirm production Worker secrets exist in Cloudflare.
6. Confirm preview Worker secrets exist in Cloudflare.
7. Configure the production Worker custom domain or route for `nu-bi.com`.
8. Replace obsolete `nu-bi.com` DNS records pointing to `15.197.167.90`.
9. Configure `www.nu-bi.com` to redirect to `https://nu-bi.com`.
10. Remove, redirect, or repoint `app.nu-bi.com` from the old Pages project.
11. Keep `knowme.nu-bi.com` documented as dev-only or remove it if no longer needed.
12. Run GitHub `Deploy Cloudflare Production` from the reviewed commit.
13. Verify `https://nu-bi.com/`, `/login`, and one authenticated path.
14. Verify the health-check workflow passes.
15. Verify AI-agent scheduler calls production only after `AI_AGENT_SCHEDULER_SECRET` matches between GitHub and Cloudflare.
