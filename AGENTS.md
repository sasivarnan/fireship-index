# Project instructions

- Keep responses concise and use ASD-STE100 Simplified Technical English.
- Read files before editing. Preserve user changes.
- Write self-documenting code. Use comments only when necessary.
- Keep one public Astro page. Use the approved Cloudflare Worker and RSS API. Do not expose API secrets.
- Render the public score and videos on the server. Keep manual XML import local. Show stale-data states clearly.
- Keep the score formula and data limits consistent in the interface, README, and discovery files.
- Do not invent live data, predictions, endorsements, rankings, or a public domain.
- Use `SITE_URL` for domain-specific metadata. Deploy the Astro Worker with Wrangler only when requested. Keep Cloudflare KV for the last-good feed snapshot.
- Keep the Built by Sasivarnan R footer linked to https://sasivarnan.com.
- Run `npm run check` after changes. Build before production browser checks.
- Record browser checks and limits in `docs/ux-audit.md`.
- Treat commit, push, and deployment as separate actions. Do each only when requested.
