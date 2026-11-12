# Verification

## First version — 6 November 2026

- Single static page; all keyword matching, scoring, parsing, and caching run in the browser.
- Live Fireship RSS returned HTTP 200. Direct browser access is blocked by missing CORS permission. The rss2json relay returned HTTP 200 with browser access permission.
- Production static build loaded real relay data in the browser. Ten uploads were returned in this check. Titles, thumbnails, dates, keyword reasons, score, metrics, and activity chart appeared.
- AI-only filter showed five matched uploads; every visible row had the AI signal label.
- Original Fireship XML import succeeded with 15 uploads. The score recalculated and old entries were marked outside the score window. Imported files stay local.
- Desktop appearance reviewed at 1280 × 800. Gauge pointer adjusted to keep the numeric score clear.
- Narrow-screen review at 320 × 740 found a decorative symbol outside the page width. Its small-screen position was corrected.
- Rechecked the production build at widths of 320, 768, and 844 pixels. Document width matched the viewport width in each check.
- Browser fetch time is distinguished from source freshness. The relay can cache and truncate results. The UI does not claim the feed contains the complete channel history.
- Initial HTML includes the title, description, method, FAQ, attribution, source links, and WebSite JSON-LD. Scores are not fabricated in static HTML.
- Canonical URL, absolute social image URLs, and sitemap generation verified using a temporary test origin. Final build has no invented public origin.
- Type, lint, formatting, unit tests, and generated static HTML checks passed.

## Limits

- No deployment or public domain selected. Set `SITE_URL` at build time before release.
- Real-phone behavior and screen-reader speech output are not verified.
- Search indexing and answer-engine citations require a public deployment and are not guaranteed.
- Relay and YouTube uptime, rate limits, and cache policy are external dependencies.

## Minimal revision — 6 November 2026

- Replaced the dashboard with a narrow, plain page: one score, a short status, recent video links, About disclosure, and the required footer.
- Removed the gauge, chart, badges, filters, thumbnails, external fonts, decorative sections, and separate FAQ. Kept indexable project and method text in the initial HTML.
- Replaced the JSON relay with the original XML through proxy.cors.dev. The JSON relay had omitted descriptions. The XML proxy returned HTTP 200 with CORS permission and full descriptions.
- Classification now uses titles and descriptions. Sponsor calls to action, course links, and repeated channel paragraphs are excluded where possible. AI labels identify the source of each match. Missing descriptions are reported.
- Added tests for description-only matches, sponsor exclusions, repeated paragraphs, title matches with promotional descriptions, and legacy records.
- Production browser check loaded 15 original RSS entries with descriptions. A cybersecurity video matched Anthropic and Claude only in its description; it now counts correctly.
- The programmer-stereotypes video did not match AI in either its title or description; the unrelated search-API sponsor did not affect the result.
- Rechecked the minimal production page at 320 and 768 pixels wide; neither had horizontal overflow. Reviewed the 1280-pixel desktop layout.
- All ten unit tests, type, lint, format, build, and static metadata verification passed. Real-phone and screen-reader speech checks remain open.

## Astro and Workers revision — 12 November 2026

- User approved migration from browser-only fetching to an RSS API and cached HTML, then selected Astro on Cloudflare Workers instead of Pages.
- Added a warm colour accent, small flame mark, compact score scale, thumbnails, and restrained hover changes. Kept one public content page and the required footer.
- Moved the score and video list into server-rendered HTML. `/api/feed` uses the same validated data and classification rules. Removed the public CORS relay.
- Added a last-good RSS snapshot in KV and explicit 15-minute stale-while-revalidate response caching. Deployment-specific cache keys prevent old HTML from using old asset filenames. Failed refreshes do not overwrite valid cache entries.
- Added server tests for description parsing, invalid XML/channel rejection, fresh/expired snapshots, outage fallback, cold failure, HTML cache hits, background regeneration, and preservation of valid cached HTML on errors.
- Updated build and deployment instructions for Cloudflare Workers. Current Astro requires Node 22.23.4 or later; local verification uses a separate temporary runtime rather than changing the user's installed Node.
- Production deployment, real-phone behavior, and screen-reader speech output remain unverified.
- Live local Worker verification returned 15 YouTube RSS entries with descriptions and score 73. Raw HTML contained the score and all 15 video links before browser JavaScript. Repeat HTML and API requests returned cache hits; missing paths returned 404.
- Browser Refresh succeeded against the API. Desktop appearance and 320- and 768-pixel layouts were reviewed; neither small layout had horizontal overflow.
- Found and fixed a Worker runtime incompatibility: redirect mode `error` is unsupported. Requests now use `manual` and reject unexpected redirects. Added a regression test.

## Gauge and component revision — 12 November 2026

- Replaced the early bunker panel with a simple arc, large locally hosted type, a moving marker, and one short animated status. Removed casing, grid, rivets, extra scale markings, and warning graphics after visual feedback.
- Added the Fireship source logo, project title, and brief explanation above the fold. The hero uses a deep navy palette, warm ivory numbers, and high-contrast green, amber, orange, or coral accents based on score. The content below uses a warm light background.
- Increased captions and endpoint labels to readable HTML text rather than shrinking them inside SVG. Increased video, method, and footer text sizes.
- Split metadata, hero, source header, gauge, controls, recent videos, method, and footer into separate Astro components.
- Moved keyword rules and description classification into `src/lib/keywords.ts`, with no scoring or classification changes.
- Added tests for gauge thresholds, angle limits, and monotonic number animation. All 23 unit tests and the type, lint, format, and build checks passed before final browser review.
- The live runtime check accounts for valid stale-while-revalidate behavior: HTML and API snapshots can differ during refresh. Each server-rendered number is checked against its own embedded target, and matching feed timestamps must produce matching HTML/API scores.
- At 1280 × 720 and 320 × 740, hero height matched viewport height and recent content started below the fold. At 320 pixels, no horizontal overflow was present. Pause stopped the number and the pulsing arrow during the control check.
- Physical-device behavior and screen-reader speech output remain unverified. Reduced-motion handling is implemented in CSS and playback code; the browser's system preference was not changed during this review.

- Final saved-project checks passed: all 23 tests, type, lint, formatting, build verification, and live Worker checks. The feed returned 15 entries with descriptions and score 79.
- Final browser review covered 1280 × 720, 320 × 740, and 568 × 320. The hero matched viewport height and had no horizontal overflow. The small landscape layout kept the source header, score, status, and controls visible.
- Replay restarted the count. Pause held the displayed score at 31 across observations; resume restored playback. The down arrow moved focus to recent videos. The final displayed score matched the target of 79.

## Intro refinement — 12 November 2026

- Replaced the long hero paragraph with “More AI. Less us.” and a short explanation. Used serif type and an italic signal-colour accent to give the intro a clear hierarchy.
- All 23 tests and type, lint, formatting, and build checks passed. Browser review covered 1280 × 720, 320 × 740, and 568 × 320. The intro remained legible and the mobile hero retained its full viewport height without horizontal overflow. Physical-device checks remain open.

## Evidence, feed status, and motion — 12 November 2026

- Added a small marker overshoot and exact settling, plus two soft marker pulses for critical scores. Numeric values stay monotonic. Pause, page visibility, off-screen suspension, and reduced motion continue to control playback.
- Made title and description match terms visible below video titles. Marked older uploads outside the 30-day score window. The summary now states the window and counts only available videos in that window.
- Improved title hierarchy, spacing, date contrast, and thumbnail size. Added a matching 1200 × 630 social image with an unknown score so it cannot be confused with a current reading. The editable artwork is public/social.svg.
- Refresh keeps the reading visible and states its last UTC check time. The local browser failure check kept score 79, all 15 rows, and the exact original fetch timestamp after the preview server was stopped. A successful refresh also retained visible match evidence and window labels.
- Added coverage for marker settling and bounds, sample-window copy, evidence sources, and stale timestamps. All 27 tests and type, lint, format, and build checks passed before final layout polish.
- Desktop 1280 × 720 and mobile 320 × 740 were reviewed. The mobile list had no horizontal overflow. Physical devices and screen-reader speech remain unverified. Browser system reduced-motion preferences were not changed.

- Final checks after mobile evidence spacing passed: 27 tests, type, lint, format, build, and live Worker checks including the 1200 × 630 share image. The final browser review covered desktop, 320-pixel mobile, and 568 × 320 landscape. The hero stayed full height. Pause held the score at 31 across observations; resume completed at the target of 79 with the settled state set.

## Laws of UX follow-up — 12 November 2026

- Fixed the reproduced pause → Refresh error. A paused refresh now shows the actual reading immediately and preserves pause. Unchanged refreshes do not restart a completed gauge; Replay explicitly starts and resumes playback.
- Added “AI coverage · past 30 days · satire” near the gauge, the 15-minute cache renewal explanation beside feed status, and visible Replay/Pause/Resume labels on hover or keyboard focus. Restored the landscape logo link to 44 × 44 pixels.
- Combined repeated evidence terms while preserving their sources, such as “Anthropic — title and description”. Server and browser rendering use the same formatter.
- Added regression tests for completed and partial paused refreshes, changed scores while paused, unchanged refresh, and Replay. All 31 tests and type, lint, format, build, and live Worker checks passed.
- Browser checks confirmed paused Refresh retained visible score 79 and target 79 after completion. An unpaused unchanged refresh also retained 79 with its settled state. Keyboard focus showed the Replay and Pause labels. Desktop 1280 × 720, mobile 320 × 740, and landscape 568 × 320 were reviewed; mobile had no horizontal overflow and the hero stayed full height. Landscape logo height measured 44 pixels.
- Physical-device behavior, screen-reader speech, and browser system reduced-motion preference checks remain open.

## Landscape composition — 12 November 2026

- Added two columns for landscape viewports at least 568 pixels wide and at most 600 pixels high. Branding and left-aligned text sit beside the gauge. The headline uses two lines, and the gauge scales to its column.
- Kept the first section at full viewport height, the down arrow at the viewport centre, and recent videos below the fold. Portrait and taller desktop layouts retain the centred composition.
- All 31 tests and type, lint, formatting, and build checks passed. Browser review covered 568 × 320, 844 × 390, 1024 × 600, 1280 × 720, and 320 × 740. No horizontal overflow was observed. At 844 × 390, hero height and video start were 390 pixels; arrow centre was 422 pixels in an 844-pixel viewport.
- Physical-device and screen-reader speech checks remain open.

## Human-focused headline — 12 November 2026

- Changed the hero and social preview headline to “More AI. Fewer humans.” and updated image alternative text. Kept the italic phrase together when wrapping.
- All 31 tests and type, lint, formatting, and build checks passed. Browser review at 320 × 740, 568 × 320, and 1280 × 720 confirmed readable wrapping and no horizontal overflow. The share image was visually reviewed. Physical-device checks remain open.

## Latest-15 scoring and video grid — 12 November 2026

- Replaced the 30-day selection rule with the latest 15 unique, published uploads. Older uploads remain eligible. Short feeds use their available count; empty feeds have no score. Kept the 60% AI-share and 40% posting-pressure weights, with pace measured from the oldest sampled upload through the calculation time.
- Updated the gauge caption, visible summary, sample dates, method, README, and LLM overview. Server and browser rendering use the same scoring and presentation functions.
- Replaced VideoList with VideoGrid. The grid has three columns on wide screens, two on tablets, and one on phones. All thumbnails remain visible on phones and use native lazy loading, asynchronous decoding, low fetch priority, and reserved 16:9 dimensions. Browser refresh sets lazy-loading options before assigning image URLs. Native lazy loading permits browser prefetch near the viewport.
- Added scoring coverage for more than 15 unsorted uploads, older eligible uploads, shorter feeds, duplicate/future/invalid dates, sample dates, and actual sample captions. All 34 tests and type, lint, format, build, and live Worker checks passed.
- Browser checks at 1280 × 720, 768 × 1024, and 320 × 740 confirmed three, two, and one grid columns without horizontal overflow. All 15 thumbnails retained lazy/async settings after Refresh; the displayed score and summary remained 75 and 12 of 15. The server HTML and API also matched.
- The full-screen hero and landscape composition were checked. Physical-device and screen-reader speech checks remain open. No deployment was performed.

## Quieter copy and unofficial ribbon — 12 November 2026

- Reduced the normal video introduction to one summary and a compact upload-range/check-time line. Moved detailed posting-period text into About the index; cache behaviour remains there. Saved readings, missing descriptions, and refresh failures remain visible when relevant.
- Replaced match explanations with plain phrases such as “Anthropic in title and description”. Removed em dashes and duplicate AI labels from explanations. Server and browser refresh use the same formatter.
- Removed the gauge caption and its unused sample-count props. Added a small, still, tilted “VERY UNOFFICIAL” ribbon at the top right. Portrait spacing keeps the ribbon clear of the logo and heading. The joke explanation remains at the start of About.
- All 34 tests and type, lint, formatting, build, and live Worker checks passed. Browser review covered 1280 × 720, 320 × 740, and 568 × 320. The ribbon did not overlap essential content, the hero remained full-screen, and the mobile grid had no horizontal overflow.
- Refresh completed with score 75 and 15 lazy-loaded cards. Match explanations contained no em dashes; detailed period text was inside About. Physical-device and screen-reader speech checks remain open.

## Ribbon below the gauge — 12 November 2026

- Moved the yellow unofficial ribbon below the gauge and centred it on the instrument. Removed the extra portrait top spacing used for its former corner position. Reserved lower gauge space to keep it clear of the scroll control.
- All 34 tests and type, lint, formatting, and build checks passed. Browser review at 1280 × 720, 320 × 740, and 568 × 320 confirmed full-screen layout and a visible gap below the gauge labels. Measured gaps were about 24, 20, and 18 pixels respectively, including the ribbon tilt. Mobile had no horizontal overflow. Physical-device checks remain open.

## Loose-sign ribbon animation — 12 November 2026

- Added an 880 ms repair motion after the gauge settles: crooked hold, a corrective nudge, a brief catch, and a straight finish. The ribbon stays visible and ends at zero rotation. Unchanged refreshes do not replay it; Replay restarts the sequence.
- Ribbon playback follows the existing pause, visibility, and off-screen rules. Reduced motion and paused data updates show a fixed ribbon directly. Added tests for trigger order and reduced-motion state, and checked the paused-update state. All 36 tests and type, lint, formatting, and build checks passed.
- In the browser, pause held the ribbon at the same -3 degree transform across observations. Resume completed with an unrotated transform and fixed state. Desktop, 320 × 740 mobile, and 568 × 320 landscape were reviewed. The resting ribbon retained a clear gap below the gauge and mobile had no horizontal overflow.
- The browser system reduced-motion preference was not changed; that path was checked in unit tests and CSS. Physical-device and screen-reader speech checks remain open.

## Browser-local checked time — 12 November 2026

- Added a shared checked-time formatter with a timezone label at the end. The server retains UTC HTML; a timestamp-backed time element is converted directly on browser load. Refresh, saved-reading, and failure messages use the browser’s timezone and language.
- Added coverage for India time, US Central time, previous-day rollover, daylight saving, and stale/missing-description messages. All 39 tests and type, lint, formatting, build, and live Worker checks passed.
- Browser review confirmed the source timestamp 2026-11-12T04:46:53.162Z displayed as Nov 12, 2026, 10:16 AM GMT+5:30 on initial load and after Refresh. The loading message also used this local time. The browser supplied GMT+5:30 instead of IST, as permitted by the approved native-label approach.
- Desktop and 320-pixel mobile wrapping were checked without horizontal overflow. Other timezone and daylight-saving behaviour was tested through explicit formatter inputs; the browser timezone setting was not changed. Physical-device and screen-reader speech checks remain open.

## Selected subtitle — 12 November 2026

- Replaced the hero explanation with the approved line: “AI’s future looks bright. We’re not in it.” Updated the editable social artwork and PNG to match.
- All 39 tests and type, lint, formatting, and build checks passed. The selected copy was confirmed in the browser at 320 pixels wide without horizontal overflow. The ribbon still completed in its straight final state. Physical-device checks remain open.
