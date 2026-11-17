import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from "undici";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const originalFetch = globalThis.fetch;
const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
const xml = await readFile("tests/fixtures/feed.xml", "utf8");
const output = resolve(".vercel/output");
const config = JSON.parse(await readFile(`${output}/config.json`, "utf8"));
async function loadFunction(name) {
  const directory = `${output}/functions/${name}.func`;
  const functionConfig = JSON.parse(
    await readFile(`${directory}/.vc-config.json`, "utf8"),
  );
  return (
    await import(pathToFileURL(`${directory}/${functionConfig.handler}`).href)
  ).default;
}
const render = await loadFunction("_render");
const isr = await loadFunction("_isr");
const homeRoute = config.routes.find((route) =>
  route.dest?.startsWith("/_isr"),
);
const homeRequest = () =>
  new Request(
    `https://local.example${"/".replace(new RegExp(homeRoute.src), homeRoute.dest)}`,
  );
let saved = null;
let upstreamAvailable = true;
let storeAvailable = true;
let upstreamRequests = 0;
process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_teststore_localtesttoken";
const originalDispatcher = getGlobalDispatcher();
const mockAgent = new MockAgent();
mockAgent.disableNetConnect();
setGlobalDispatcher(mockAgent);
const blobPath = "feed-snapshots/fireship:feed:v3.json";
mockAgent
  .get("https://teststore.private.blob.vercel-storage.com")
  .intercept({ path: `/${blobPath}?cache=0`, method: "GET" })
  .reply(() => ({
    statusCode: !storeAvailable ? 403 : saved === null ? 404 : 200,
    data: saved ?? "",
  }))
  .persist();
mockAgent
  .get("https://vercel.com")
  .intercept({
    path: `/api/blob/?pathname=${encodeURIComponent(blobPath)}`,
    method: "PUT",
  })
  .reply((options) => {
    if (!storeAvailable)
      return {
        statusCode: 403,
        data: JSON.stringify({ error: { code: "forbidden" } }),
      };
    saved = String(options.body);
    return { statusCode: 200, data: JSON.stringify({ pathname: blobPath }) };
  })
  .persist();
globalThis.fetch = async (input) => {
  const url = String(input);
  assert.match(url, /^https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?/);
  upstreamRequests += 1;
  return upstreamAvailable
    ? new Response(xml)
    : new Response(null, { status: 503 });
};
const feedRequest = () =>
  render.fetch(new Request("https://local.example/api/feed"));
try {
  const first = await feedRequest();
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("Cache-Control"), "no-store");
  const data = await first.json();
  assert.equal(data.videos.length, 2);
  assert.equal(data.stale, false);
  assert.equal(upstreamRequests, 1);
  assert.equal(first.headers.get("X-Feed-Fetched-At"), String(data.fetchedAt));
  const page = await isr.fetch(homeRequest());
  assert.equal(page.status, 200);
  assert.notEqual(page.headers.get("Cache-Control"), "no-store");
  assert.equal(page.headers.get("X-Feed-Fetched-At"), String(data.fetchedAt));
  assert.ok((await page.text()).includes(`data-score="${data.index.score}"`));
  await feedRequest();
  assert.equal(upstreamRequests, 1);

  const oldTime = Date.now() - 3600000;
  saved = JSON.stringify({ ...JSON.parse(saved), fetchedAt: oldTime });
  upstreamAvailable = false;
  const staleResponse = await feedRequest();
  const stale = await staleResponse.json();
  assert.equal(staleResponse.status, 200);
  assert.equal(staleResponse.headers.get("X-Feed-Stale"), "1");
  assert.equal(stale.stale, true);
  assert.equal(stale.fetchedAt, oldTime);
  const savedPage = await isr.fetch(homeRequest());
  assert.equal(savedPage.status, 200);
  assert.equal(savedPage.headers.get("X-Feed-Fetched-At"), String(oldTime));
  assert.match(await savedPage.text(), /data-state="saved"/);

  saved = null;
  const failedApi = await feedRequest();
  assert.equal(failedApi.status, 503);
  assert.equal(failedApi.headers.get("Retry-After"), "60");
  assert.equal(failedApi.headers.get("Cache-Control"), "no-store");
  assert.equal(typeof (await failedApi.json()).error, "string");
  const failedPage = await isr.fetch(homeRequest());
  assert.equal(failedPage.status, 503);
  assert.equal(failedPage.headers.get("Retry-After"), "60");
  assert.match(await failedPage.text(), /No reading yet/);

  storeAvailable = false;
  upstreamAvailable = true;
  const bestEffort = await feedRequest();
  assert.equal(bestEffort.status, 200);
  assert.equal((await bestEffort.json()).stale, false);
  assert.equal(saved, null);
  console.log(
    "Built functions verified with local fixtures: shared snapshot, saved fallback, 503 responses, and store failure. Vercel ISR caching is not simulated.",
  );
} finally {
  globalThis.fetch = originalFetch;
  setGlobalDispatcher(originalDispatcher);
  await mockAgent.close();
  for (const [name, value] of [["BLOB_READ_WRITE_TOKEN", originalToken]]) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
