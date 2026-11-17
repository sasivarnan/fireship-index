# Verification

Updated 17 November 2026. This file records the current implementation and known limits.
Use the [README](../README.md) for setup and build commands.

## Current implementation

- One public Astro page on Vercel. The page renders the score and up to 15 videos on the server. The original YouTube RSS feed is parsed on the server.
- The score uses titles and descriptions, with 60% AI coverage and 40% capped weekly posting pace. Keyword checks can misclassify videos. The index is unofficial satire.
- The home page uses 900-second ISR. The feed API is excluded from ISR and returns `Cache-Control: no-store`. Both routes share the last valid snapshot in private Vercel Blob storage. A fresh snapshot is reused for 15 minutes. Refresh does not bypass this window.
- Failed upstream reads can use a valid saved snapshot with its original timestamp. A saved-reading page can be cached for another 15 minutes. No valid snapshot plus upstream failure returns HTTP 503. Storage errors are logged; writes remain best effort.
- The confirmed production origin is set once in Astro's `site`. Canonical, social metadata, robots, and sitemap use `import.meta.env.SITE`. Local settings use `getSecret` from `astro:env/server` for the Blob token. The token was absent from generated Vercel files in the local secret-loading check.
- Allo is served locally for the hero, About heading, body text, and controls. The hero uses the real medium oblique for its italic phrase. Barlow Condensed remains on the score and other section headings. The two Allo WOFF2 files total 277,788 bytes. All page fonts are local; Google Fonts requests are removed. Font and logo credits are in [brand assets](brand-assets.md).

## Completed checks

- Node 24.14.0 and pnpm 12.18.0: all 60 unit tests, Astro type checks, lint, format, production build, and controlled built-function checks passed before this content update. The latest content checks are recorded below.
- Build checks inspect the generated Vercel functions, Node runtime, 900-second ISR config, API exclusion, assets, robots, and sitemap.
- Feed and Blob tests cover freshness, saved fallback, invalid XML and snapshots, missing descriptions, oversized feeds, retries, rate limits, deadlines, denied storage access, file replacement, and missing credentials. Mock HTTP dispatchers block external connections during Blob tests.
- Built-function checks use controlled Blob and RSS responses. They cover a shared fresh snapshot, saved data during outages, HTTP 503 without a snapshot, and valid upstream data when storage fails. These checks do not simulate Vercel's ISR cache.
- Local development page and API reads matched the real private Blob snapshot's videos and original timestamp. The built runtime check passed with 15 real RSS entries, server HTML, evidence, lazy images, API output, metadata, assets, robots, sitemap, and 404. A separate real Blob write was not forced.
- The current Allo heading review passed at 1280 × 720, 320 × 740, and 568 × 320. The hero and italic phrase fit without horizontal overflow, including the full-height landscape hero. The About heading uses Allo. Browser warning/error logs were empty. The earlier body-font review also checked 375 × 812, aligned cards, Refresh, local times, and match tooltips. Temporary viewport settings were reset.
- During the origin check, read-only requests to the deployed Vercel page and API returned HTTP 200. The page reported a cache HIT; the API reported MISS and `no-store`. The deployed metadata still used the old origin at that check. This result does not verify later deployment state.

## Open limits

- Verify the deployed origin and SEO content after commit `a48d506`. The local Allo heading change still needs an authorized commit, push, and deployment. Confirm search indexing separately; it is not guaranteed.
- Vercel ISR expiration, regeneration, and controlled outage behavior remain unverified on the hosting service. A cache HIT alone does not prove these paths.
- Confirm durable storage across Vercel function instances. One local preview request logged a storage read warning without a cause; the page/API and full runtime check still succeeded.
- Cloudflare analytics markup is present. Actual analytics collection has not been confirmed.
- Physical-device behavior and screen-reader speech remain unverified. Reduced motion is covered by unit tests and CSS, but a new browser preference check has not been run. Native sharing completion was not verified; sharing and fallback paths have unit coverage.
- Keep the previous Cloudflare deployment and snapshot until the Vercel release is accepted. No resource deletion or DNS change is authorized by this record.

## SEO, answer-system text, and documentation cleanup — 17 November 2026

- Set the page and social title to `The Fireship Index | Unofficial AI Coverage Score`. The shared description now states the sample limit, title/description evidence, AI coverage, posting pace, and unofficial satire. Kept the WebSite structured-data name as the project name and used the same description in metadata and structured data. No score or prediction was added to static metadata.
- Rewrote `/llms.txt` to describe server RSS parsing, Vercel ISR, the uncached feed API, private Blob storage, original fetch timestamps, saved-data behavior, and real HTTP 503 responses. Kept the score formula and latest-15 selection rules. Removed the retired Cloudflare/KV caching claims. The file is a static project overview, not a live reading or a guarantee of answer-system inclusion.
- Replaced the visible fixed-cache phrase with a short explanation of request-driven updates, Refresh, and saved timestamps. The score formula, page structure, and current source links are unchanged.
- Removed the obsolete migration handoff and older audit entries. Git history retains the earlier records. The active audit contains the current implementation, completed checks, and open limits. Removed links to the discarded archive copies.
- All 60 unit tests, type, lint, format, production build, and controlled built-function checks passed. Build verification checks the generated discovery file for Vercel/Blob storage and the 900-second interval. Runtime checks confirm the page/social titles, matching descriptions, WebSite JSON-LD, visible update explanation, and canonical/social/discovery URLs. The full runtime check passed on port 5182 with 15 real RSS entries.
- Inspected the built About section in the in-app browser at 1280 × 720 and 320 × 740. The longer update text wrapped without horizontal overflow. The browser tab displayed the new title. Reset the viewport override. No physical-device, screen-reader, or new reduced-motion preference checks were run.
- The origin and SEO content changes were committed and pushed in `a48d506`. No later hosting-state check is recorded here.

## Current Allo heading check — 17 November 2026

- Replaced Fraunces on the hero and About heading with Allo. Added the unmodified 48,760-byte `Allo-MediumOblique.woff2` from the same credited upstream commit. Removed Google Fonts stylesheet and preconnect links. The page needs no external font requests. The existing social image remains static artwork.
- All 60 tests, type, lint, format, production build, and controlled built-function checks passed. The local built-output runtime check on port 5183 passed with 15 real RSS entries and verifies the absence of Google Fonts and Fraunces in page HTML. Browser checks and physical-device limits are recorded above.
- No scoring, feed, Node version, or hosting settings changed. No commit, push, deployment, or social image regeneration was performed for this font change.
