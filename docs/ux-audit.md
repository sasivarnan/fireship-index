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

## Maintenance cleanup — 12 November 2026

- Split the style entry into base, hero, gauge, controls, and content stylesheets. Kept component-specific responsive rules in order, combined reduced-motion overrides, and removed an unused colour variable and redundant mobile font rule.
- Added shared browser-safe settings for sample size, cache expiry, refresh cooldown, request timeouts, and XML import size. Kept the XML parser behind the existing dynamic browser import.
- Shared video card data between the Astro grid and browser refresh, including one upload-date formatter and the thumbnail attributes. Replaced feed-line string splitting with structured prefix, checked timestamp, and suffix fields.
- Removed the pnpm lockfile and its formatting exclusion. npm and package-lock.json remain the package manager and lockfile. No dependencies were added.
- All 42 tests and type, lint, formatting, build, and live Worker checks passed. New tests cover shared card metadata, lazy thumbnails, and structured feed timestamps.
- Recorded selected positions, sizes, fonts, colours, and grid columns before the refactor at 1280 × 720, 320 × 740, and 568 × 320. These measurements matched afterward, excluding the arrow’s animated vertical position. Browser review confirmed the established appearance.
- Initial server cards and refreshed browser cards had identical titles, dates, evidence, links, and thumbnail attributes. All 15 images retained lazy loading. Paused Refresh kept score 75, and the checked time remained local with GMT+5:30. Physical-device and screen-reader speech checks remain open.
- Cleanup changes are local; no commit, push, or deployment was performed for this pass.

## Status ribbon and title label — 12 November 2026

- Moved the score status from inside the gauge to the ribbon below it. The ribbon uses the gauge status colour and dark text. Added a small “Unofficial” label below the site title. Removed the old status styles and ribbon text.
- Kept the loose-board motion and straight finish. Browser checks confirmed that Pause held the same ribbon transform across observations and Resume finished at zero rotation. The gauge accessible label retains the status without duplicate ribbon speech.
- All 42 tests and type, lint, formatting, build, and live Worker checks passed. Browser review at 1280 × 720, 320 × 740, and 568 × 320 confirmed readable text, clear ribbon spacing, full-screen hero height, and no horizontal overflow. The live score 75 used the matching coral colour.
- Reduced-motion behaviour remains covered by unit tests and CSS; the browser system preference was not changed. Physical-device and screen-reader speech checks remain open. Changes are local; no commit, push, or deployment was performed.

## Score context, video scanning, sharing, and quiet motion — 12 November 2026

- Moved the sample summary below the ribbon without repeating it in the second fold. Kept the formula in About. Added saved-reading, unavailable-feed, and local-preview notices near the score, with extra space when needed. Refresh keeps the previous reading and original timestamp on failure.
- Added a small colour marker and text label for AI matches. Native details controls reveal keyword sources on demand. Unmatched videos retain a plain text label. Server rendering and browser refresh use the same card data. Thumbnails retain lazy loading.
- Added Share reading beside Refresh. Native sharing includes the actual target score, short joke, sample summary, checked time with timezone, satire label, and clean site URL. Clipboard and selectable-text fallbacks cover unsupported or blocked APIs. Local previews disable sharing. Cancellation does not trigger copying. No score history was added.
- Removed the critical marker pulses. The down arrow moves gently during the reveal and stops when the ribbon finishes straight. Pause, replay, visibility, and reduced-motion behaviour remain in place.
- All 47 tests and type, lint, format, build, and live Worker checks passed. Sharing tests cover payloads, clean URLs, native sharing, cancellation, clipboard content, and blocked or missing APIs. Existing feed/cache tests cover retained readings on upstream failure.
- Browser review covered 1280 × 720, 320 × 740, and 568 × 320. The hero retained full-screen height without horizontal overflow. Match details expanded correctly; Refresh retained score 75 and all 15 lazy-loaded cards. The final ribbon was fixed and the arrow animation was none. Screenshots are saved in /tmp/fireship-index-improved-hero.png and /tmp/fireship-index-improved-videos.png.
- The device share request was invoked, but the browser automation could not complete or inspect the system share menu. Native delivery, real clipboard permissions, manual-copy focus on physical devices, screen-reader speech, and browser-level reduced motion remain unverified. The browser was reloaded after the native-share check. No commit, push, or deployment was performed.

## Less first-screen text — 12 November 2026

- Removed the hero subtitle and its unused responsive styles. Moved the sample summary back to the video section. Removed the summary prop from Gauge. The first screen keeps branding, headline, score, and ribbon; feed notices remain hidden unless needed. Sharing still reads the same summary element in its new location.
- All 47 tests and type, lint, formatting, and build checks passed. Browser review at 1280 × 720, 568 × 320, and 320 × 740 confirmed clear ribbon spacing and a full-screen hero. The phone layout had no horizontal overflow, the summary was inside the video section, and the normal feed notice was hidden.
- Updated the live HTML verifier to reject the old subtitle and require the summary after the video-section boundary. Physical-device and screen-reader speech checks remain open. No commit, push, or deployment was performed.

## AI match tooltips — 13 November 2026

- Replaced the expandable AI match panels with tooltip buttons. Shared presentation data supplies stable tooltip IDs for server rendering and browser refresh. Buttons use aria-describedby; explanations use role=tooltip. Tooltips appear on hover, focus, or click and close with Escape, focus exit, or an outside pointer action. Tooltip content remains hoverable and wraps within the card width without changing grid height.
- All 47 tests and type, lint, formatting, and build checks passed. The live HTML verifier now checks tooltip markup and rejects the old match details element.
- Browser checks confirmed click opening, Escape dismissal, and reopening through keyboard focus. At 320 pixels wide, the tooltip stayed between x=20 and x=300 without horizontal overflow. After Refresh, all 12 tooltip controls and all 15 lazy-loaded thumbnails remained intact; the new NVIDIA video showed its title and description match.
- Pointer-hover rules were inspected in CSS; physical touch, screen-reader speech, and real-device hover behaviour remain unverified. Changes remain local. No commit, push, or deployment was performed.

## Tooltip below the match label — 13 November 2026

- Positioned match tooltips below the 44-pixel trigger so they do not cover the current video image, title, or date. Kept the existing CSS and TypeScript implementation without an external tooltip library.
- All 47 tests and type, lint, formatting, and build checks passed. Browser checks at the normal desktop size and 320 × 740 confirmed the tooltip top equals the trigger bottom. The phone layout had no horizontal overflow. Physical-device checks remain open. No commit, push, or deployment was performed.

## Compact video metadata — 13 November 2026

- Put the upload date and match label in one shared metadata row in server HTML and refreshed cards. Kept the match button target at 44 pixels high and the tooltip below it. Tooltip width stays within the remaining card space.
- All 47 tests and type, lint, formatting, and build checks passed. Desktop and 320-pixel browser checks confirmed equal date and label vertical centres, readable tooltips, and no horizontal overflow. After Refresh, all 15 metadata rows remained aligned and all thumbnails retained lazy loading. Physical-device checks remain open. Changes remain local; no commit, push, or deployment was performed.

## Metadata space-between alignment — 13 November 2026

- Aligned upload dates to the left and match labels to the right. Kept tooltips below the label and aligned their right edge within the card.
- All 47 tests and type, lint, formatting, and build checks passed. Desktop and 320-pixel browser checks confirmed the label right edge matched the row right edge. The phone had no horizontal overflow. Changes remain local; no commit, push, or deployment was performed.

## Tighter video bottom padding — 13 November 2026

- Reduced video-card bottom padding from 22 to 10 pixels. All 47 tests and type, lint, formatting, and build checks passed. The browser confirmed 10-pixel computed padding and working tooltip dismissal. The feed used a labelled saved reading during this check. No commit, push, or deployment was performed.

## Clearer last-reading notice — 13 November 2026

- Removed the Saved reading label from the hero in server HTML and client updates. A failed feed refresh now says “Couldn’t refresh. Showing the last available reading.” beside the checked time. Age-only cache notices ask users to refresh without claiming a failed request. Local previews and a feed with no available reading retain their hero notices.
- All 47 tests and type, lint, formatting, and build checks passed. Browser review used an actual stale feed response: the gauge notice was empty and hidden, while the checked-time line showed the approved explanation and original timestamp. No commit, push, or deployment was performed.

## AI future headline — 13 November 2026

- Added the approved headline “AI has a future. Are we in it?” and subtitle “An unofficial doom index from Fireship’s latest 15 uploads.” Kept the question italic and coloured to match the gauge. Updated sharing text, social image alt text, and SVG/PNG social artwork. No project dependency was added.
- All 47 tests and type, lint, formatting, and build checks passed. Browser review at 1280 × 720, 320 × 740, and 568 × 320 confirmed readable copy without horizontal overflow and a full-screen first section. The social PNG was rendered and visually checked. Physical-device and screen-reader speech checks remain open. No commit, push, or deployment was performed.

## Imagegen editorial layout and Google Fonts — 13 November 2026

- Implemented the approved imagegen direction: branding across the top, editorial copy on the left, and the simple gauge on the right on desktop. Added HeroCopy as a separate component. Narrow portrait screens stack the content; short landscape uses two columns. Kept a full dynamic-viewport first section.
- Added Newsreader regular and real italic for the headline, and Public Sans for interface text through Google Fonts with preconnect and display=swap. The gauge keeps locally hosted Barlow Condensed. Browser font checks reported both Google Fonts loaded. System fallbacks keep text available when the font service is unavailable; cross-site font caching is not assumed.
- Replaced the subtitle with “Tracking AI coverage in Fireship’s latest 15 uploads.” Added Recent uploads below the centred down arrow. Kept the single gauge marker, score animation, status colours, straight ribbon finish, pause/replay, and quiet settled state. Updated the social SVG/PNG with the same copy and fonts. No project dependency was added.
- All 47 tests and type, lint, formatting, and build checks passed. Live HTML checks now verify the Google Fonts links, separate copy component, source explanation, and scroll label.
- Browser review covered 1280 × 720, 768 × 1024, 320 × 740, and 568 × 320 without horizontal overflow. The hero height matched the viewport. Pause held an intermediate score; Resume completed at 77 with a fixed ribbon and no arrow animation. The phone video section retained 12 tooltips and 15 lazy-loaded thumbnails. The social artwork was rendered and visually checked.
- The feed used its last available reading with the explanatory notice beside the checked time. Physical devices, screen-reader speech, font-service outage emulation, and browser-level reduced motion remain unverified. Reduced motion remains covered by the existing unit tests and CSS. No commit, push, or deployment was performed.

## Direct purpose copy and Fraunces — 13 November 2026

- Applied both approved changes: Fraunces Medium with real italic from Google Fonts, and the headline “How much AI is Fireship posting?” The supporting line explains “An unofficial index of AI coverage and posting pace across his latest 15 uploads.” Public Sans remains the body font and Barlow Condensed remains the gauge font. The gauge and ribbon carry the humour.
- Used restrained Fraunces softness with its alternate letterforms. Updated sharing text, image alt text, and social SVG/PNG. Adjusted responsive headline sizes to keep the question readable on narrow screens.
- All 47 tests and type, lint, formatting, and build checks passed. Browser review at 1280 × 720, 320 × 740, and 568 × 320 confirmed loaded regular and italic fonts, full-screen hero height, and no horizontal overflow. The social artwork was rendered and visually checked. Physical-device checks remain open. No commit, push, or deployment was performed.

## Quiet arrow, open About, and server-only RSS — 13 November 2026

- Removed the visible Recent uploads caption and its unused styles. The arrow remains a 48 × 48 control with the accessible name Scroll to recent videos. Its reveal motion and settled pause behaviour remain in place.
- Replaced the About accordion with an open section: The signal, The score, and The joke. Kept the source, cache fallback, scoring period, and independence notice. Removed the long repeated explanations and manual file importer. Desktop uses three short columns; phones stack them.
- Removed browser file-input handling, local-preview state, and the browser XML-parser import. RSS parsing stays on the server, which already stores the last valid feed. Removed obsolete import suggestions from error messages. Server XML validation and its tests remain intact.
- All 47 tests and type, lint, formatting, build, and live Worker checks passed. Browser review at 1280 × 720 and 320 × 740 confirmed open About content, no importer, no visible arrow caption, and no horizontal overflow. Refresh completed with 15 cards and the original check time while showing the saved feed notice.
- Generated and corrected an imagegen concept for the below-fold video design. This remains a preview, not the implemented grid. Its sample rows illustrate the design; production continues to show the actual 15-upload feed. Physical-device and screen-reader speech checks remain open. No commit, push, or deployment was performed.

## Fewer dividers — 13 November 2026

- Removed divider rules below the video heading, below video items, and above the footer. Kept only the divider before About the index. Existing spacing, compact metadata, and tooltips remain unchanged.
- All 47 tests and type, lint, formatting, and build checks passed. Browser inspection confirmed zero-width heading, card, and footer borders and the one-pixel About top border. The 320-pixel layout had no horizontal overflow. Changes remain local; no commit, push, or deployment was performed.

## Video title spacing — 13 November 2026

- Reserved a minimum of three title lines in multi-column layouts without clipping text. Reduced video row gaps to 24 pixels. Phone titles keep their natural height.
- All 47 tests and type, lint, formatting, and build checks passed. Browser measurements at 1280, 768, and 581 pixels wide confirmed aligned metadata within each row for the current feed. At 320 pixels, title minimum height remained auto, full text stayed visible, and there was no horizontal overflow.
- The review showed visible empty space under short titles with a fixed three-line minimum. Natural title heights with metadata aligned to each row’s bottom were recommended as a possible follow-up; that further change was not made. No commit, push, or deployment was performed.

## Natural video titles with aligned metadata — 13 November 2026

- Replaced the fixed three-line title minimum with natural title heights. Multi-column cards use a column layout with metadata pushed to the row bottom. Full titles remain visible; phones keep their existing natural layout.
- All 47 tests and type, lint, formatting, and build checks passed. At 1280 pixels, browser measurements showed one- and two-line title heights while metadata bottoms matched within each row. At 320 pixels, cards remained list items, title minimum height was auto, and no horizontal overflow occurred.
- Discussed a possible AI spotted thumbnail sticker. No overlay was implemented. No commit, push, or deployment was performed.

## RSS recovery and diagnostics — 13 November 2026

- Confirmed the original Fireship channel page still advertises the configured RSS URL. Direct requests from this machine returned HTTP 404 with the current, identified-client, and browser-style headers. A header change did not resolve it. The feed subsequently recovered during verification.
- Added structured failure logging before the saved-feed return. Logs include source URL, upstream HTTP status, attempt count, failure reason, fallback use, and original successful fetch time. No response body is logged.
- Added one retry for transient HTTP 404, 408, and server errors. Both attempts share the existing eight-second timeout. Retry-After responses and HTTP 429 are not immediately retried. Invalid data and timeouts preserve the last good feed and its original timestamp.
- All 53 tests and type, lint, formatting, build, and live Worker checks passed. New tests cover 404 recovery, persistent failure diagnostics, rate limits, Retry-After, invalid XML, timeout logs, and unchanged fallback timestamps.
- The live API eventually returned stale=false and a newer fetchedAt timestamp. Rendered HTML showed the current checked time without the refresh-failure message. The in-app browser was unavailable, so interactive Refresh and a new browser screenshot were not verified in this pass. No UI layout was changed.
- These changes improve retries and diagnostics; they do not establish a permanent fix for YouTube’s intermittent upstream failures. No commit, push, or deployment was performed.
