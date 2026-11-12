import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
for (const file of [
  "dist/server/wrangler.json",
  "dist/client/favicon.svg",
  "dist/client/social.png",
  "dist/client/robots.txt",
  "dist/client/llms.txt",
])
  await access(file);
const config = JSON.parse(await readFile("dist/server/wrangler.json", "utf8"));
assert.ok(config.main);
assert.ok(
  config.kv_namespaces.some((binding) => binding.binding === "FEED_CACHE"),
);
assert.ok(config.assets.directory);
const robots = await readFile("dist/client/robots.txt", "utf8");
assert.match(robots, /Disallow: \/api\//);
const page = await readFile("src/pages/index.astro", "utf8");
assert.match(page, /IndexHero/);
assert.match(page, /RecentVideos/);
assert.match(
  await readFile("src/components/AboutIndex.astro", "utf8"),
  /Titles and descriptions/,
);
assert.match(
  await readFile("src/components/SiteFooter.astro", "utf8"),
  /Built by/,
);
assert.match(
  await readFile("src/components/SiteFooter.astro", "utf8"),
  /Sasivarnan R/,
);
assert.doesNotMatch(page, /proxy\.cors\.dev|rss2json/);
await access("dist/client/fireship-logo.svg");
console.log(
  "Cloudflare Worker, assets, feed binding, and SEO output verified.",
);
