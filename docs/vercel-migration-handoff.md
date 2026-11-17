# Vercel migration handoff

Prepared on 17 November 2026. This document is a plan, not an implemented migration.

## Start the next chat

Use this request:

> Read `docs/vercel-migration-handoff.md` in `/Users/sasivarnan/Repos/GitHub/sasivarnan/fireship-index`. Migrate the site from Cloudflare Workers to Astro on Vercel with 15-minute ISR. Preserve the approved design, scoring, Refresh, and saved-feed fallback. Inspect the current files and Git status first. Resolve the storage and production-origin decisions described in the document. Complete local checks and prepare the result for review. Do not commit, push, deploy, change DNS, or create paid resources unless I request those actions.

## Scope and current state

- Repository: `/Users/sasivarnan/Repos/GitHub/sasivarnan/fireship-index`.
- Remote: <https://github.com/sasivarnan/fireship-index>.
- Inspected commit: `9c01aaa3038c0cd98ff705adf7287d0b0de60e69` on `main`. The working tree was clean when this document was started. Check again before editing.
- Configured origin: <https://fireship-index.sasivarnan.workers.dev>.
- Astro `7.4.11`, Cloudflare adapter `14.4.7`, Wrangler `4.160.1`.
- pnpm `12.18.0`, pinned in `package.json`. Keep `pnpm-lock.yaml` as the only dependency lockfile.
- Node requirement: `>=22.23.4`. Select a Vercel-supported Node release that meets Astro’s requirements. Do not assume Vercel accepts an exact Node patch pin.
- Last recorded baseline: 53 passing unit tests, type, lint, format, build, and local runtime checks. Run the checks again during migration.

The user asked for a migration handoff. Do not treat this document alone as approval to migrate or deploy. When migration is requested, the request supersedes the Cloudflare-specific hosting rules in `AGENTS.md`. Update those rules to match the approved architecture. Keep the other rules.

## Preserve the product

Keep one public page with server-rendered content. Keep the approved full-screen hero, animated gauge, status ribbon, fonts, responsive video grid, match tooltips, lazy thumbnails, keyboard access, and reduced-motion behavior. Keep the flame-and-dial favicon and 1200 × 630 social image.

Keep these data rules:

- Use Fireship’s original YouTube RSS feed. Do not add a public relay or browser XML parser.
- Score the latest 15 uploads, using both titles and descriptions.
- Keep keyword rules in `src/lib/keywords.ts`, including NVIDIA.
- Keep the current score formula and limits. Do not change the meaning of the index during migration.
- Show the original successful fetch time when saved data is used. Do not label saved data as a new successful check.
- Keep Refresh, Share, animation controls, and browser-local checked times.
- Keep the unofficial satire notice and Built by Sasivarnan R footer link.
- Keep the existing Cloudflare Web Analytics script and token. A hosting change does not require its removal. Confirm collection after deployment; do not claim markup checks prove collection.

## Current server design

| File                        | Current role                                             | Migration work                                                                            |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `astro.config.mjs`          | Cloudflare adapter and canonical origin                  | Use a compatible Vercel adapter and ISR configuration.                                    |
| `src/lib/site.ts`           | Reads `import.meta.env.SITE`                             | Keep Astro’s `site` as the only source for the public origin.                             |
| `src/middleware.ts`         | Cloudflare Cache API, deployment cache keys, `waitUntil` | Remove this cache layer when ISR replaces it.                                             |
| `src/lib/response-cache.ts` | Custom HTML/API stale-while-revalidate cache             | Remove if unused after migration. Replace its tests with tests for the retained behavior. |
| `src/lib/feed-service.ts`   | Fetch, validate, save, and recover RSS snapshots         | Keep the logic; connect a replacement `SnapshotStore`.                                    |
| `src/pages/index.astro`     | Reads `FEED_CACHE` through `cloudflare:workers`          | Use the new shared feed-store access. Keep on-demand rendering for ISR.                   |
| `src/pages/api/feed.ts`     | Same KV binding, JSON response                           | Use the same store as the page. Preserve the response contract.                           |
| `src/client.ts`             | Refresh calls `/api/feed`; reads custom cache status     | Remove dependence on Cloudflare cache headers. Keep truthful status messages.             |
| `src/lib/settings.ts`       | Feed, timeout, and cache limits                          | Keep shared feed limits. Remove only unused response-cache limits.                        |
| `scripts/verify-build.mjs`  | Checks `dist/server/wrangler.json` and assets            | Verify the Vercel build output, ISR route config, static assets, and metadata.            |
| `scripts/check-runtime.mjs` | Verifies page, API, metadata, and `X-Index-Cache`        | Replace platform-specific cache checks. Keep the other checks.                            |
| `tests/server.test.ts`      | Snapshot and response-cache tests                        | Keep feed tests. Adapt or replace cache tests to match the new design.                    |

`SnapshotStore` currently exposes `get(key, "json")` and `put(key, value)`. The stored record contains validated videos and `fetchedAt`. The `stale` flag is calculated from its age. A platform adapter can preserve this interface.

## Proposed Vercel design

Use Astro, not a Next.js rewrite. Replace the custom response cache with Vercel ISR for `/`. Use a shared durable feed store for the page and API.

Illustrative configuration, to verify against the selected adapter version:

```js
adapter: vercel({
  isr: {
    expiration: 15 * 60,
    exclude: ["/api/feed"],
  },
}),
```

Do not set `prerender = true` on the home page. Astro’s Vercel ISR caches on-demand page output after a request. After expiration, a request can receive the old page while regeneration runs. This is request-driven, not a scheduled fetch every 15 minutes. See the [Astro adapter documentation](https://docs.astro.build/en/guides/integrations-guide/vercel/#isr).

Exclude `/api/feed` from ISR. Its existing `Cache-Control: no-store` response should reach the browser. The feed service and durable snapshot store still limit upstream reads to the shared 15-minute freshness window. Refresh asks for the current reading; it does not promise to bypass that window.

Do not layer the existing Cloudflare response cache over ISR. Check the existing `no-store` headers in middleware: copying them onto the ISR page can prevent the intended caching. Keep personal data, cookies, and browser-local formatting out of cached HTML.

### Decision 1: durable feed storage

Recommended: retain a durable last-valid snapshot through a Vercel-compatible service. This preserves the existing API fallback and shares the same reading across function instances. Select the provider and document its environment variables before implementation depends on it. Do not assume an account, integration, credentials, free allowance, or paid resource is available.

Process memory, a module variable, and the function filesystem are not substitutes for this store. They may be used for local tests, with their limits stated.

ISR alone can keep a previously rendered page, but it does not give `/api/feed` access to the parsed snapshot. A design without a durable feed store is a separate product tradeoff. It requires user approval to change API fallback or Refresh behavior. Do not silently remove those features.

### Decision 2: production origin

The final Vercel hostname or custom domain is not confirmed. Do not invent it. A Workers hostname cannot become a Vercel-owned hostname through an Astro setting.

Keep the approved production origin unchanged during local preparation until the replacement origin is confirmed. Before production release, set the confirmed URL once in Astro’s `site` config. Canonical links, structured data, social image URLs, robots, and sitemap must all use it. Keep `import.meta.env.SITE`; do not restore the custom `SITE_URL` requirement.

The portfolio entry is in a different repository, on its `data` branch:
`/Users/sasivarnan/Repos/GitHub/sasivarnan/sasivarnan.com/src/data/projects/2026/fireship-index/index.md`.
It currently points to the Workers URL. Update it and the GitHub repository website field only as authorized for the final address.

## Failure behavior

Keep the current feed validation, two-megabyte size limit, and eight-second timeout shared across attempts. Keep one bounded retry for HTTP 404, 408, and server errors. Do not retry HTTP 429 or responses with `Retry-After` immediately. Preserve the failure logs without logging secrets or feed bodies.

| Situation                                  | Required result                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Recent saved snapshot                      | Return it without another YouTube fetch.                                                                     |
| Old snapshot and valid upstream feed       | Validate, save, and return the new reading.                                                                  |
| Upstream error with a valid saved snapshot | Return the saved reading with `stale: true` and its original timestamp.                                      |
| No valid snapshot and upstream failure     | Return a real error, not a zero score or an empty successful page. API remains HTTP 503 with retry guidance. |
| Store read or write failure                | Keep current best-effort feed behavior and log the storage failure. Never pretend the write succeeded.       |

Important ISR distinction: Vercel retains old output when regeneration fails. However, a rendered HTTP 200 page containing a saved reading is a successful regeneration. It can be cached for the normal 15-minute interval. It does not automatically trigger Vercel’s error retry behavior. See [Vercel ISR documentation](https://vercel.com/docs/incremental-static-regeneration).

The proposed default accepts this 15-minute home-page interval. The uncached API can still attempt recovery through Refresh when the snapshot is old. If the current one-minute retry behavior for stale HTML must be preserved, implement and verify a separate policy. Do not claim the old retry timing is preserved by `expiration: 900` alone. Do not throw away a valid saved reading merely to force an ISR error.

## Implementation order

1. Read current instructions, Git status, feed tests, and platform code. Record the baseline. Preserve unrelated work.
2. Resolve the store choice. Keep the origin decision explicit. Check current official adapter documentation and registry versions. Choose a release compatible with Astro 7.4.11; do not upgrade unrelated packages.
3. Implement and test the store adapter. Share it between `/` and `/api/feed`; remove both `cloudflare:workers` imports there.
4. Switch the Astro adapter. Enable 15-minute ISR and exclude the API. Remove Cloudflare middleware caching and unused response-cache code.
5. Adapt Refresh status handling. `X-Index-Cache` will no longer exist. Preserve `X-Feed-Fetched-At`, `X-Feed-Stale`, and the API JSON fields. Do not rely on browser access to Vercel’s internal cache status headers for product copy.
6. Update scripts, package description, README, `AGENTS.md`, and build checks. Remove Wrangler type generation, dependencies, config, and generated type references when unused. Check `pnpm-workspace.yaml` and remove the `workerd` build permission if no dependency needs it. Keep the README short and in Simplified Technical English.
7. Run local checks and inspect generated Vercel output. Then verify a preview deployment if authorized. Record results and limits in `docs/ux-audit.md`.

Do not create a cron job or a public cache-invalidation endpoint unless the chosen design needs it. Never expose a revalidation secret in browser code.

## Verification and acceptance

Use the project’s pinned pnpm version. Complete builds before browser checks. Adapt `pnpm check` to the new platform; do not weaken it to hide failures.

- Type, lint, format, unit tests, and build pass.
- Feed tests cover freshness, saved fallback, invalid XML, missing descriptions, timeouts, retries, rate limits, and store failures.
- Runtime checks cover server HTML, up to 15 videos, title/description evidence, lazy images, API contract, metadata, analytics markup, favicon, social image, sitemap, robots, and 404.
- Build verification checks actual Vercel output rather than expecting Wrangler output. Inspect generated route configuration to confirm a 900-second ISR interval and API exclusion.
- In a Vercel preview, confirm initial generation, a cache hit, regeneration after expiration, upstream failure with a saved reading, and failure without a saved reading. Use controlled test conditions; do not wait for a real YouTube outage.
- Local preview does not prove Vercel ISR behavior. State which checks ran locally and which ran on Vercel. If needed, use a shorter interval only in a preview test, then restore and verify 900 seconds before release.
- Check Refresh, error text, time labels, tooltip access, pause/replay, reduced motion, and responsive layout. Do not redesign the site.
- Confirm page/API snapshot differences during regeneration do not cause false test failures. Compare scores only when their fetch timestamps match.
- Search active code for `cloudflare:workers`, `cfContext`, `FEED_CACHE`, `DEPLOYMENT`, Wrangler references, and the retired `X-Index-Cache` contract. Keep intentional analytics references and historical audit records.

## Release and rollback

A request to implement does not itself authorize commit, push, production deployment, DNS changes, or deletion of Cloudflare resources. Treat each action separately.

For an authorized Vercel setup: use the Astro preset, the project root, `pnpm install --frozen-lockfile`, and `pnpm build`. Let the adapter produce Vercel functions and assets; do not deploy only `dist/client` as a static site. Verify the current adapter’s preview workflow instead of assuming Cloudflare’s `astro preview` behavior transfers unchanged.

Configure storage secrets on the server in the required Vercel environments. Keep the canonical origin in Astro config. Do not copy Cloudflare’s deploy command into Vercel Git build settings.

Keep the working Cloudflare deployment and feed snapshot until Vercel checks pass and the user accepts the release. Keep the previous commit as the rollback point. Do not delete KV or change DNS as cleanup. Report any storage or origin decision still open before production release.
