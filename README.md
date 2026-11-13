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

Refresh uses the API. RSS parsing runs on the server. The page has no manual file importer, and the XML parser is not loaded in the browser.

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

Both titles and descriptions are checked for whole-word AI terms and model names. Sponsor calls to action, course links, newsletter text, and repeated description paragraphs are excluded where possible. Each matching video has an AI marker and a tooltip with the terms and their source. Missing descriptions are reported. These are text rules, not semantic analysis, and they can misclassify a video.

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

No analytics, account system, or video embeds are used. Fraunces and Public Sans load from Google Fonts with swap rendering; Barlow Condensed remains local for the gauge. System font fallbacks keep the reading available if Google Fonts cannot load. Thumbnails load from YouTube's image host, and video links open YouTube. Untrusted feed text is escaped; video URLs are constructed from validated IDs. XML with DTD or entity declarations is rejected.

## UI components

The site remains one public content page. `src/pages/index.astro` loads the feed and assembles these components:

- `PageHead`: search and social metadata, structured data, Google Fonts links, and the local gauge-font preload.
- `IndexHero`, `SiteHeader`, and `HeroCopy`: full-screen layout, official Fireship source logo and title, and the headline with its AI coverage explanation.
- `Gauge` and `GaugeControls`: the simple arc, score, status, scroll cue, pause, and replay.
- `RecentVideos` and `VideoGrid`: feed status, refresh, and recent uploads.
- `AboutIndex` and `SiteFooter`: a concise open method section and author credit.

Keyword rules, description exclusions, and classification are in `src/lib/keywords.ts`. Score calculation remains in `src/index.ts`. Gauge thresholds and geometry are in `src/lib/gauge.ts`; playback is in `src/gauge-animation.ts`.

The number animates from zero to the saved reading, with matching arc progress and a settling marker. Colours change with the reading. Reduced motion reveals the final reading directly. Pause and replay controls are provided; playback stops when the page is hidden or the hero is offscreen. The first section uses the dynamic viewport height, with videos below it.

## Reading the feed

The summary in the video section counts up to the latest 15 available uploads. One compact line shows their upload date range and the last check time. The scoring period and cache details are in About the index. Each AI match has a small colour marker and a tooltip with the title and description terms used by the classifier. These are keyword matches, not claims that a video is entirely about AI.

Refresh keeps the existing score and video list visible while checking. A failed request keeps that reading and its original check time, shown in the browser’s timezone.

The animated marker makes a small overshoot and settles at the score. The ribbon is the final decorative motion; the subtle down arrow stops when the ribbon settles. Pause and reduced motion apply to these effects. The social preview is a fixed illustration without a live score; its editable source is `public/social.svg`.

A small “Unofficial” label sits below the site title. The ribbon below the gauge shows the current score status, with a matching status colour and dark text. A clear gap separates it from the gauge. After the gauge settles, it holds crooked, catches, and nudges into a straight final position over 880 ms. Pause stops this motion; Replay starts the sequence again. Reduced motion shows it straight immediately. The satire explanation remains at the start of About the index. Refresh does not replay an unchanged score. Updates while paused show the actual score directly and keep motion paused. Replay starts the animation again and resumes motion. Hover and keyboard focus reveal control labels. Terms found in both title and description appear once, with both sources stated.

Desktop views at least 960 pixels wide and short landscape views (at least 568 pixels wide and at most 600 pixels high) use two hero columns: explanation on the left and gauge on the right, with branding above. Narrow portrait views stack the copy and gauge. The first section remains full-screen, with the down arrow centred on the viewport and videos below.

The second fold uses a responsive video grid: three columns on wide screens, two on tablets, and one on phones. Thumbnails use native lazy loading, asynchronous decoding, reserved 16:9 dimensions, and low fetch priority. Browsers can fetch lazy images near the viewport before scrolling.

Checked times use the browser’s timezone and language, with its short timezone label at the end. Labels can be IST, CST, CDT, or a GMT offset depending on locale and browser support. The initial server HTML uses UTC; the browser converts the timestamp directly on load. Refresh and failure messages use the same local formatter. Upload dates and scoring dates remain in UTC.

## Maintenance

Use npm and keep `package-lock.json` as the only package lockfile.

`src/style.css` imports styles grouped into base, hero, gauge, controls, and content files under `src/styles/`. Each group keeps its responsive rules with its main styles. Reduced-motion overrides are collected in the base stylesheet.

`src/lib/settings.ts` contains browser-safe sample, cache, timeout, and feed-size limits. `src/lib/video-presentation.ts` provides shared video titles, dates, links, evidence, and thumbnail attributes for Astro and browser rendering. Feed status exposes separate text and timestamp fields through `feedStatusParts`; it does not parse a formatted sentence.

## Sharing a reading

Share reading sits beside Refresh. It shares the actual score, status, sample summary, checked time, satire label, and clean home-page URL through the device share menu. Browsers without native sharing copy the reading. Blocked APIs offer selectable text for manual copying. Cancelling native sharing does not copy anything. No score history is stored.

A failed refresh keeps the last score and check time. The video section explains when a refresh failed and the last available reading is shown. An unavailable-feed notice appears below the gauge ribbon only when there is no reading. No valid reading means no numerical score.

The first screen keeps the logo, title, Unofficial label, “How much AI is Fireship posting?” headline, gauge, and status ribbon. A short subtitle explains: “An unofficial index of AI coverage and posting pace across his latest 15 uploads.” Sample counts remain in the video section and sharing text.

AI match tooltips appear on hover, keyboard focus, or a tap. Escape, focus exit, and outside taps dismiss them. Tooltip text wraps within the card width and does not expand the grid. The same controls work after Refresh.

About the index is open by default, with short sections for the signal, score, and satire. Source and scoring-period details follow. The down arrow has an accessible name without a visible caption.

## RSS failure diagnostics

Failed feed refreshes log the upstream status, attempt count, error reason, saved-reading use, and last successful fetch timestamp. A transient 404, 408, or server error gets at most one retry within the same eight-second request budget. Rate limits and responses with Retry-After do not trigger an immediate retry. Invalid XML and timeouts retain the last valid feed without changing its timestamp. A fresh validated feed replaces the saved reading and clears the failure notice.
