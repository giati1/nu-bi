# AGENTS

- Visible product brand is `NOMI`.
- Internal repo, resource, bucket, cookie, and database names may remain `nu-bi`; do not casually rename them.
- Keep local Node development working with SQLite and `public/uploads`.
- Keep Cloudflare runtime paths clearly separated from local Node paths:
  - local Node: `DATABASE_DRIVER=sqlite`, `STORAGE_DRIVER=local`
  - Cloudflare: `DATABASE_DRIVER=d1`, `STORAGE_DRIVER=r2`
- Mobile layout is sensitive. Do not make infrastructure edits that accidentally change shell sizing or viewport behavior.
- Protected pages should use `requirePageViewer()`.
- Protected APIs should use `requireViewer()`.
- Cloudflare build/deploy tooling in this repo requires Node `20.3+`; local app development may still run on Node `18.14+`.
