# The Fireship Index

The more Fireship posts about AI, the closer humans get to being permanently removed.

A single-page Astro site by [Sasivarnan R](https://sasivarnan.com). Independent and not affiliated with Fireship.

## Local development

Use Node **22.23.4 or later**. The current Astro release requires this version. `.node-version` records it.

```sh
npm ci
npm run dev
```

The Cloudflare adapter runs the app in the local Workers runtime, with a local KV namespace. No Cloudflare account is needed for local use. No public resources are created by these commands.

```sh
npm run check
npm run preview
```

Build before preview. `npm run check` generates Worker types, checks Astro and TypeScript, lints, checks formatting, runs unit tests, builds, and verifies the Worker output.

## Deploy to Cloudflare Workers

The current Astro Cloudflare adapter supports **Workers**, not server rendering on Pages. This change was approved for this project. Static assets and the API deploy together. No separate server is needed.

Set the public HTTPS origin as a build variable, then build and deploy:

```sh
SITE_URL=https://your-domain.example npm run build
npm run deploy
```

`SITE_URL` is not a secret. It supplies canonical, sitemap, and absolute social image URLs. Until it is set, domain-specific metadata is omitted. In Cloudflare's connected Git build, set Node to 22.23.4 or later, build with `npm run build`, and use `npm run deploy` as the deployment command.

`wrangler.jsonc` defines the Worker and one `FEED_CACHE` KV binding. Wrangler automatically provisions that KV namespace on the first deployment and links it to the Worker. Review the provisioning prompt at deploy time. No account resource or deployment was created as part of local implementation.

The build creates `dist/client` for assets and `dist/server` for the Worker, plus Wrangler's generated deployment configuration. **Do not upload only `dist/client` to Pages**: this app needs its Worker for the API and server-rendered home page. Run the build and Wrangler deploy from this project.

## Routes

- `/`: server-rendered score, recent videos, source information, method, and footer. The reading works without JavaScript.
- `/api/feed`: JSON with the original feed's parsed videos, descriptions, fetch time, stale flag, source URL, and calculated index.
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`: search discovery files. The sitemap is only available when `SITE_URL` is configured.
- Missing pages return 404 and are not indexed.

Refresh uses the API. Manual XML import remains a local preview and never changes the public reading. Only this interaction loads the XML parser into the browser.

## RSS and caching

The Worker fetches this fixed source directly; the public relay has been removed:

```text
https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA
```

1. A validated feed snapshot is saved in Workers KV. Fresh snapshots are reused for 15 minutes.
2. HTML and API responses are cached through the Workers Cache API. Fresh cached responses are served immediately.
3. After 15 minutes, a request can receive the previous response while `waitUntil` regenerates it. This is explicit stale-while-revalidate behavior; it does not depend on unsupported Cache API cache-control directives.
4. A cold cache request waits for rendering. Upstream failure uses the last valid KV snapshot and marks it as stale. With no valid snapshot, the app returns 503 and no invented score. Errors do not replace valid cached responses.
5. Response entries are retained for up to 24 hours, subject to Cloudflare eviction. Cache entries are local to each Cloudflare data center. KV provides the last-good feed across locations, with normal eventual consistency. No strict global single-fetch guarantee is made.
6. Cache keys include the deployment version so an old page cannot reference old asset filenames after a release. Browser responses use `no-store`; the Worker controls the shared cache explicitly.

Regeneration is request-driven, not a timer or cron job. Check timestamps before calling data current. YouTube can serve cached data or reject a request. Cloudflare KV usage and Function requests count against the account's limits.

## Classification and score

Both titles and descriptions are checked for whole-word AI terms and model names. Sponsor calls to action, course links, newsletter text, and repeated description paragraphs are excluded where possible. Each matching video lists the terms and their source. Missing descriptions are reported. These are text rules, not semantic analysis, and they can misclassify a video.

The latest 15 available uploads count, regardless of age. The sample is sorted newest first and deduplicated; a shorter feed uses its available count:

```text
coverage days = max(1, days since oldest included upload)
AI share = AI matches / included uploads
AI uploads per week = AI matches / coverage days × 7
posting pressure = min(1, AI uploads per week / 3)
score = round(100 × (0.6 × AI share + 0.4 × posting pressure))
```

No included uploads means no score. The feed is only a recent sample. The score is satire, not a prediction or probability.

## Search and privacy

The home page sends the actual reading and video list in its HTML, along with title, description, method, author, and WebSite JSON-LD. Social metadata, favicon, robots, sitemap, and an informational llms.txt are included. Search indexing and AI citations are not guaranteed. Failed cold responses are marked noindex.

No analytics, account system, external fonts, or video embeds are used. Thumbnails load from YouTube's image host, and video links open YouTube. Imported XML stays in the browser. Untrusted feed text is escaped; video URLs are constructed from validated IDs. XML with DTD or entity declarations is rejected.

## UI components

The site remains one public content page. `src/pages/index.astro` loads the feed and assembles these components:

- `PageHead`: search and social metadata, structured data, and the local font preload.
- `IndexHero` and `SiteHeader`: full-screen first section, official Fireship source logo, title, and introduction.
- `Gauge` and `GaugeControls`: the simple arc, score, status, scroll cue, pause, and replay.
- `RecentVideos` and `VideoGrid`: feed status, refresh, and recent uploads.
- `AboutIndex` and `SiteFooter`: method, local XML import, and author credit.

Keyword rules, description exclusions, and classification are in `src/lib/keywords.ts`. Score calculation remains in `src/index.ts`. Gauge thresholds and geometry are in `src/lib/gauge.ts`; playback is in `src/gauge-animation.ts`.

The number animates from zero to the saved reading, with matching arc progress and a settling marker. Colours change with the reading. Reduced motion reveals the final reading directly. Pause and replay controls are provided; playback stops when the page is hidden or the hero is offscreen. The first section uses the dynamic viewport height, with videos below it.

## Reading the feed

The summary counts up to the latest 15 available uploads. One compact line shows their upload date range and the last check time. The scoring period and cache details are in About the index. Each AI match shows the title and description terms used by the classifier. These are keyword matches, not claims that a video is entirely about AI.

Refresh keeps the existing score and video list visible while checking. A failed request keeps that reading and its original check time, shown in the browser’s timezone. Local XML previews are labelled separately.

The animated marker makes a small overshoot and settles at the score. Critical scores trigger two soft marker pulses. Pause and reduced motion apply to these effects. The social preview is a fixed illustration without a live score; its editable source is `public/social.svg`.

A small “VERY UNOFFICIAL” ribbon sits below the gauge with a clear gap. After the gauge settles, it holds crooked, catches, and nudges into a straight final position over 880 ms. Pause stops this motion; Replay starts the sequence again. Reduced motion shows it straight immediately. The satire explanation remains at the start of About the index. Refresh does not replay an unchanged score. Updates while paused show the actual score directly and keep motion paused. Replay starts the animation again and resumes motion. Hover and keyboard focus reveal control labels. Terms found in both title and description appear once, with both sources stated.

Short landscape views (at least 568 pixels wide and at most 600 pixels high) use two hero columns: branding and explanation on the left, gauge on the right. The first section remains full-screen, with the down arrow centred on the viewport and videos below. Portrait and taller desktop views use the centred composition.

The second fold uses a responsive video grid: three columns on wide screens, two on tablets, and one on phones. Thumbnails use native lazy loading, asynchronous decoding, reserved 16:9 dimensions, and low fetch priority. Browsers can fetch lazy images near the viewport before scrolling.

Checked times use the browser’s timezone and language, with its short timezone label at the end. Labels can be IST, CST, CDT, or a GMT offset depending on locale and browser support. The initial server HTML uses UTC; the browser converts the timestamp directly on load. Refresh and failure messages use the same local formatter. Upload dates and scoring dates remain in UTC.
