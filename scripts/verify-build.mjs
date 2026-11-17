import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
for (const file of [
  ".vercel/output/config.json",
  ".vercel/output/functions/_isr.prerender-config.json",
  ".vercel/output/static/favicon.svg",
  ".vercel/output/static/social.png",
  ".vercel/output/static/robots.txt",
  ".vercel/output/static/sitemap.xml",
  ".vercel/output/static/llms.txt",
])
  await access(file);
const config = JSON.parse(await readFile(".vercel/output/config.json", "utf8"));
assert.equal(config.version, 3);
const isr = JSON.parse(
  await readFile(".vercel/output/functions/_isr.prerender-config.json", "utf8"),
);
assert.equal(isr.expiration, 900);
const routeFor = (pathname) =>
  config.routes.find(
    (route) => route.src && route.dest && new RegExp(route.src).test(pathname),
  );
assert.match(routeFor("/").dest, /^\/_isr\?/);
assert.equal(routeFor("/api/feed").dest, "_render");
assert.ok(
  !config.routes.some(
    (route) =>
      route.src &&
      route.dest?.startsWith("/_isr") &&
      new RegExp(route.src).test("/api/feed"),
  ),
);
for (const name of ["_isr", "_render"]) {
  const directory = `.vercel/output/functions/${name}.func/`;
  const functionConfig = JSON.parse(
    await readFile(`${directory}.vc-config.json`, "utf8"),
  );
  assert.equal(functionConfig.runtime, "nodejs24.x");
  await access(`${directory}${functionConfig.handler}`);
}
const robots = await readFile(".vercel/output/static/robots.txt", "utf8");
assert.match(robots, /Disallow: \/api\//);
const { default: astroConfig } = await import("../astro.config.mjs");
const origin = new URL(astroConfig.site).origin;
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
const sitemap = await readFile(".vercel/output/static/sitemap.xml", "utf8");
assert.ok(sitemap.includes(`<loc>${origin}/</loc>`));
const overview = await readFile(".vercel/output/static/llms.txt", "utf8");
assert.match(overview, /Vercel ISR/);
assert.match(overview, /private Vercel Blob/);
assert.match(overview, /900 seconds \(15 minutes\)/);
assert.match(overview, /Cache-Control: no-store/);
assert.doesNotMatch(
  overview,
  /Cloudflare fetches|saved in KV|Cloudflare location/,
);
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
await access(".vercel/output/static/fireship-logo.svg");
console.log(
  "Vercel functions, 900-second ISR, uncached API route, assets, and SEO output verified.",
);
