import assert from "node:assert/strict";

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
assert.match(html, /VERY UNOFFICIAL/);
assert.doesNotMatch(html, /gauge-context|class="ai-label"/);
assert.match(html, /in title|in description/);
const social = await fetch(`${base}/social.png`);
assert.equal(social.status, 200);
const png = Buffer.from(await social.arrayBuffer());
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);
assert.match(html, /Built by/);
assert.doesNotMatch(html, /proxy\.cors\.dev|rss2json/);
const cachedPage = await fetch(base);
assert.ok(["HIT", "STALE"].includes(cachedPage.headers.get("X-Index-Cache")));
const cachedApi = await fetch(`${base}/api/feed`);
assert.ok(["HIT", "STALE"].includes(cachedApi.headers.get("X-Index-Cache")));
assert.equal((await fetch(`${base}/missing-page`)).status, 404);
assert.match(
  await (await fetch(`${base}/robots.txt`)).text(),
  /Disallow: \/api\//,
);
console.log(
  `Runtime verified: ${data.videos.length} RSS entries with descriptions, score ${data.index.score}, raw server HTML, cached HTML/API hits, and 404.`,
);
