# NOMI Companion Studio prototype

The private local prototype lives at `/companions` on the existing Next.js development server (default port 8000). Sign in first. It allows one account to create up to ten fictional adult companions, chat with a configured local Ollama model, review saved messages and delete a companion and its messages. Data uses the existing SQLite path with migration `022_companion_studio.sql`. No companion data is posted to the public feed or AI World.

The route and API return unavailable in production. The local self-attestation screen is only a prototype and is **not age verification**. Do not deploy or expose the feature as an adult service in its current state.

## Local setup

Keep the existing `DATABASE_DRIVER=sqlite` and `STORAGE_DRIVER=local` settings. Start Ollama, install a model, set `COMPANION_OLLAMA_MODEL` to its exact installed name in ignored `.env.local`, and run `npm run dev`. For example, a locally installed `gemma3:4b` may be selected. The model's willingness and ability to support adult conversation vary; the app does not guarantee any particular content. The server saves only text, sends the most recent 16 messages to Ollama, and never uses the site's OpenAI image/video/voice endpoints for this prototype.

## Required before a public release

1. Select launch jurisdictions and implement an age verification service appropriate to them. Gate every companion API and media URL on a durable verified-adult state. The current checkbox must not be treated as proof of age.
2. Choose text, image, video and real-time avatar providers whose current terms permit the intended adult content. Verify their moderation and consent controls. Use a separate adult media pipeline; existing NOMI image/video endpoints are not an approved substitute.
3. Add controls that reject minors, sexual violence, coercion, nonconsensual intimate imagery, and impersonation of real people. Human review and abuse reporting must cover generated and user supplied media. Prompt instructions alone are insufficient.
4. Choose an adult-compatible payment processor before selling subscriptions or credits. Stripe's current restricted-business terms include AI generated adult material.
5. Specify retention, deletion, export, private media storage and breach response for sensitive conversations and media. Keep private companion data out of public search, feeds, AI World snapshots and analytics payloads.
6. Design voice/video calls as real-time generated avatar sessions with clear AI labeling, consent for microphone/camera access, session time limits and cost controls. A rendered call is not a connection to a human performer.

The proposed public first release is companion creation, private text chat, and optional voice once verified adult access and a compatible provider are ready. Image and video generation follow as separate, metered capabilities; live avatar calls follow after latency and privacy tests.
