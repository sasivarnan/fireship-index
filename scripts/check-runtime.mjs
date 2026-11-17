import assert from "node:assert/strict";

const { default: astroConfig } = await import("../astro.config.mjs");
const origin = new URL(astroConfig.site).origin;
const base = process.env.BASE_URL || "http://127.0.0.1:5174";
const api = await fetch(`${base}/api/feed`);
assert.equal(api.status, 200, "RSS API must serve a valid feed");
const data = await api.json();
assert.ok(data.videos.length > 0);
assert.ok(data.videos.some((video) => video.description.length > 0));
assert.equal(
  data.source,
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA",
);
const page = await fetch(base);
assert.equal(page.status, 200);
const html = await page.text();
assert.match(html, /<h1[\s>]/);
assert.match(html, /The Fireship Index/);
const title = "The Fireship Index | Unofficial AI Coverage Score";
assert.ok(html.includes(`<title>${title}</title>`));
assert.ok(html.includes(`<meta property="og:title" content="${title}"`));
assert.ok(html.includes(`<meta name="twitter:title" content="${title}"`));
const description = html.match(
  /<meta name="description" content="([^"]+)"/,
)?.[1];
assert.ok(description?.includes("up to 15 recent Fireship YouTube uploads"));
assert.ok(
  html.includes(`<meta property="og:description" content="${description}"`),
);
assert.ok(
  html.includes(`<meta name="twitter:description" content="${description}"`),
);
const structured = JSON.parse(
  html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
  )?.[1] ?? "null",
);
assert.equal(structured?.name, "The Fireship Index");
assert.equal(structured?.description, description);
assert.equal(structured?.url, `${origin}/`);
assert.match(
  html,
  /Updates are checked on request after 15 minutes, not on a fixed schedule/,
);
assert.match(html, /Saved readings keep their original check time/);
const analyticsScripts = (html.match(/<script\b[^>]*>/g) || []).filter((tag) =>
  tag.includes('src="https://static.cloudflareinsights.com/beacon.min.js"'),
);
assert.equal(analyticsScripts.length, 1);
assert.match(analyticsScripts[0], /type="module"/);
assert.ok(analyticsScripts[0].includes("aea23303049c483bbc19425c4adef7d1"));
assert.ok(html.includes(`<link rel="canonical" href="${origin}/"`));
assert.ok(html.includes(`<meta property="og:url" content="${origin}/"`));
assert.ok(
  html.includes(`<meta property="og:image" content="${origin}/social.png"`),
);
assert.ok(
  html.includes(`<meta name="twitter:image" content="${origin}/social.png"`),
);
const sitemap = await fetch(`${base}/sitemap.xml`);
assert.equal(sitemap.status, 200);
assert.ok((await sitemap.text()).includes(`<loc>${origin}/</loc>`));
const renderedScore = html.match(/data-score="(\d+|)"/)?.[1];
assert.notEqual(renderedScore, undefined);
assert.match(
  html,
  new RegExp(`<span id="score">${renderedScore || "—"}</span>`),
);
const rows = (html.match(/class="video-card"/g) || []).length;
assert.ok(rows > 0 && rows <= 15);
const images = html.match(/<img[^>]*loading="lazy"[^>]*>/g) || [];
assert.equal(images.length, rows);
assert.ok(
  images.every(
    (image) =>
      /decoding="async"/.test(image) && /fetchpriority="low"/.test(image),
  ),
);
if (
  page.headers.get("X-Feed-Fetched-At") === api.headers.get("X-Feed-Fetched-At")
) {
  assert.equal(Number(renderedScore), data.index.score);
  assert.equal(rows, data.index.sample.length);
}
assert.match(html, /application\/ld\+json/);
assert.match(html, /of the latest \d+ videos cover AI/);
assert.match(html, /class="video-evidence"/);
assert.match(html, /class="unofficial-label">Unofficial/);
assert.match(html, /id="status-ribbon"/);
assert.match(html, /class="gauge-caption"/);
assert.match(html, /How much AI is/);
assert.doesNotMatch(
  html,
  /fonts\.googleapis\.com|fonts\.gstatic\.com|Fraunces/,
);
assert.doesNotMatch(html, /Public\+Sans|Public Sans/);
const bodyFontPath = html.match(
  /href="([^"]*AlloVariableFriendly[^"]*\.woff2)"/,
)?.[1];
assert.ok(bodyFontPath, "Allo must be preloaded from a local asset");
const bodyFont = await fetch(new URL(bodyFontPath, base));
assert.equal(bodyFont.status, 200);
assert.equal(
  Buffer.from(await bodyFont.arrayBuffer()).toString("ascii", 0, 4),
  "wOF2",
);
assert.equal((await fetch(`${base}/allo-license.txt`)).status, 200);
assert.match(html, /class="hero-copy"/);
assert.doesNotMatch(html, /class="scroll-label"|id="feed-file"|import XML/);
assert.match(html, /<section id="method"/);
assert.match(html, /id="about-title"/);
assert.doesNotMatch(html, /<details id="method"/);
assert.match(html, /Fireship posting\?/);
assert.match(
  html,
  /An unofficial index of AI coverage and posting pace across his latest 15 uploads\./,
);
assert.ok(
  html.indexOf('id="sample-summary"') > html.indexOf('id="recent-videos"'),
);
assert.match(html, /class="video-match"/);
assert.match(html, /role="tooltip"/);
assert.match(html, /aria-describedby="match-/);
assert.doesNotMatch(html, /<details class="video-match"/);
assert.match(html, /id="share-reading"/);
assert.match(html, /id="share-fallback"/);
assert.doesNotMatch(html, /class="gauge-status"|VERY UNOFFICIAL/);
assert.doesNotMatch(html, /gauge-context|class="ai-label"/);
assert.match(html, /in title|in description/);
const social = await fetch(`${base}/social.png`);
assert.equal(social.status, 200);
const png = Buffer.from(await social.arrayBuffer());
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);
assert.match(html, /Built by/);
assert.doesNotMatch(html, /proxy\.cors\.dev|rss2json/);
assert.equal(api.headers.get("Cache-Control"), "no-store");
assert.equal(api.headers.get("X-Feed-Fetched-At"), String(data.fetchedAt));
assert.equal(api.headers.get("X-Feed-Stale"), data.stale ? "1" : "0");
assert.equal(typeof data.stale, "boolean");
assert.ok(Number.isFinite(data.fetchedAt));
const favicon = await fetch(`${base}/favicon.svg`);
assert.equal(favicon.status, 200);
assert.match(await favicon.text(), /<svg/);
assert.equal((await fetch(`${base}/missing-page`)).status, 404);
assert.match(
  await (await fetch(`${base}/robots.txt`)).text(),
  /Disallow: \/api\//,
);
console.log(
  `Runtime verified: ${data.videos.length} RSS entries with descriptions, score ${data.index.score}, raw server HTML, uncached feed API, metadata, assets, and 404.`,
);
