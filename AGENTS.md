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
- Preserve the current local port default of `8000` unless there is a hard requirement to change it.
- Cloudflare preview and production currently use the pinned `Next 13.5.11` + `@opennextjs/cloudflare 0.2.1` + `wrangler 3.114.17` path so local Node `18.14+` development stays intact.
- Do not casually collapse local SQLite/local uploads into Cloudflare D1/R2 code paths.
- Prefer startup-grade polish in scripts, docs, and deployment ergonomics, but do not redesign the app to achieve that.
