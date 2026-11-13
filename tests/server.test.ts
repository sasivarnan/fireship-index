import { REVALIDATE_SECONDS } from "../src/lib/settings.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseXml } from "../src/lib/xml.ts";
import { getFeed, type SnapshotStore } from "../src/lib/feed-service.ts";
import {
  cachedResponse,
  type ResponseStore,
} from "../src/lib/response-cache.ts";

const now = Date.parse("2026-11-06T12:00:00Z");
const xml = await readFile(
  new URL("./fixtures/feed.xml", import.meta.url),
  "utf8",
);
const videos = parseXml(xml, now);

class MemorySnapshot implements SnapshotStore {
  value: unknown = null;
  async get() {
    return this.value;
  }
  async put(_key: string, value: string) {
    this.value = JSON.parse(value);
  }
}
class MemoryResponses implements ResponseStore {
  response: Response | undefined;
  async match() {
    return this.response?.clone();
  }
  async put(_key: Request, response: Response) {
    this.response = new Response(await response.text(), response);
  }
}

test("XML parsing preserves description text and decodes entities", () => {
  assert.equal(
    videos[0].description,
    "Claude now writes applications. & more.",
  );
  assert.equal(videos[0].id, "abcdefghijk");
  assert.equal(videos.length, 2);
});
test("XML rejects wrong channels, invalid XML and entity declarations", () => {
  assert.throws(() =>
    parseXml(xml.replace("UCsBjURrPoezykLs9EqgamOA", "someOtherChannel"), now),
  );
  assert.throws(() => parseXml("<feed><entry></feed>", now));
  assert.throws(() =>
    parseXml('<!DOCTYPE feed [<!ENTITY ai "AI">]>' + xml, now),
  );
});
test("fresh KV snapshot does not fetch YouTube", async () => {
  const store = new MemorySnapshot();
  store.value = { videos, fetchedAt: now - 1000 };
  const snapshot = await getFeed(
    store,
    async () => {
      throw new Error("Should not fetch");
    },
    now,
  );
  assert.equal(snapshot.stale, false);
  assert.equal(snapshot.fetchedAt, now - 1000);
});
test("expired snapshot is replaced only after a successful validated fetch", async () => {
  const store = new MemorySnapshot();
  store.value = { videos, fetchedAt: now - 3600000 };
  const snapshot = await getFeed(store, async () => new Response(xml), now);
  assert.equal(snapshot.stale, false);
  assert.equal(snapshot.fetchedAt, now);
  assert.equal((store.value as { fetchedAt: number }).fetchedAt, now);
});
test("upstream failures preserve the last good snapshot", async () => {
  const store = new MemorySnapshot();
  store.value = { videos, fetchedAt: now - 3600000 };
  for (const body of [
    new Response("Unavailable", { status: 503 }),
    new Response("<not-a-feed/>"),
  ]) {
    const snapshot = await getFeed(store, async () => body, now);
    assert.equal(snapshot.stale, true);
    assert.equal(snapshot.fetchedAt, now - 3600000);
    assert.deepEqual(snapshot.videos, videos);
  }
});
test("cold upstream failure returns an error instead of invented data", async () => {
  await assert.rejects(
    getFeed(
      new MemorySnapshot(),
      async () => new Response("", { status: 500 }),
      now,
    ),
  );
});

test("response cache serves fresh HTML without rendering again", async () => {
  const cache = new MemoryResponses();
  cache.response = new Response("<h1>Current</h1>", {
    headers: {
      "X-Generated-At": String(now - 1000),
      "X-Feed-Fetched-At": String(now - 1000),
    },
  });
  const result = await cachedResponse({
    cache,
    key: new Request("https://index.test/"),
    generate: async () => {
      throw new Error("Should not render");
    },
    waitUntil: () => assert.fail("Should not regenerate"),
    now,
  });
  assert.equal(result.headers.get("X-Index-Cache"), "HIT");
  assert.equal(await result.text(), "<h1>Current</h1>");
});
test("stale HTML is served while regeneration replaces the cache", async () => {
  const cache = new MemoryResponses();
  cache.response = new Response("Old reading", {
    headers: {
      "X-Generated-At": String(now - (REVALIDATE_SECONDS + 1) * 1000),
    },
  });
  const work: Promise<unknown>[] = [];
  const result = await cachedResponse({
    cache,
    key: new Request("https://index.test/"),
    generate: async () => new Response("New reading"),
    waitUntil: (promise) => {
      work.push(promise);
    },
    now,
  });
  assert.equal(result.headers.get("X-Index-Cache"), "STALE");
  assert.equal(await result.text(), "Old reading");
  await Promise.all(work);
  assert.equal(await cache.response!.clone().text(), "New reading");
});
test("background errors never overwrite a valid cached page", async () => {
  const cache = new MemoryResponses();
  cache.response = new Response("Valid saved page", {
    headers: { "X-Generated-At": String(now - 3600000) },
  });
  const work: Promise<unknown>[] = [];
  const result = await cachedResponse({
    cache,
    key: new Request("https://index.test/"),
    generate: async () => new Response("Feed unavailable", { status: 503 }),
    waitUntil: (promise) => {
      work.push(promise);
    },
    now,
  });
  assert.equal(await result.text(), "Valid saved page");
  await Promise.all(work);
  assert.equal(await cache.response!.clone().text(), "Valid saved page");
});

test("Worker fetch uses supported redirect handling and rejects redirects", async () => {
  const store = new MemorySnapshot();
  await assert.rejects(
    getFeed(
      store,
      async (_url, options) => {
        assert.equal(options?.redirect, "manual");
        return new Response(null, {
          status: 302,
          headers: { Location: "https://other.test/feed" },
        });
      },
      now,
    ),
  );
  assert.equal(store.value, null);
});

test("a transient RSS 404 retries once and replaces the saved reading", async () => {
  const store = new MemorySnapshot();
  store.value = { videos, fetchedAt: now - 3600000 };
  const signals: (AbortSignal | null | undefined)[] = [];
  let attempts = 0;
  const snapshot = await getFeed(
    store,
    async (_url, options) => {
      signals.push(options?.signal);
      attempts += 1;
      return attempts === 1
        ? new Response("Not found", { status: 404 })
        : new Response(xml);
    },
    now,
  );
  assert.equal(attempts, 2);
  assert.equal(signals[0], signals[1]);
  assert.equal(snapshot.stale, false);
  assert.equal(snapshot.fetchedAt, now);
  assert.equal((store.value as { fetchedAt: number }).fetchedAt, now);
});

test("persistent RSS 404 logs the cause before using the last good reading", async (t) => {
  const warning = t.mock.method(console, "warn", () => {});
  const store = new MemorySnapshot();
  const fetchedAt = now - 3600000;
  store.value = { videos, fetchedAt };
  let attempts = 0;
  const snapshot = await getFeed(
    store,
    async () => {
      attempts += 1;
      return new Response("Not found", { status: 404 });
    },
    now,
  );
  assert.equal(attempts, 2);
  assert.equal(snapshot.stale, true);
  assert.equal(snapshot.fetchedAt, fetchedAt);
  assert.equal((store.value as { fetchedAt: number }).fetchedAt, fetchedAt);
  assert.deepEqual(warning.mock.calls[0].arguments, [
    "Fireship RSS refresh failed.",
    {
      source:
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA",
      status: 404,
      attempts: 2,
      reason: "RSS returned 404.",
      usingSavedReading: true,
      lastSuccessfulFetchAt: new Date(fetchedAt).toISOString(),
    },
  ]);
});

test("rate limiting is logged without an immediate retry", async (t) => {
  const warning = t.mock.method(console, "warn", () => {});
  let attempts = 0;
  await assert.rejects(
    getFeed(
      new MemorySnapshot(),
      async () => {
        attempts += 1;
        return new Response("Rate limited", {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      },
      now,
    ),
    /429/,
  );
  assert.equal(attempts, 1);
  assert.equal(warning.mock.calls[0].arguments[1].status, 429);
  assert.equal(warning.mock.calls[0].arguments[1].usingSavedReading, false);
});

test("invalid RSS is logged and does not trigger repeated requests", async (t) => {
  const warning = t.mock.method(console, "warn", () => {});
  const store = new MemorySnapshot();
  store.value = { videos, fetchedAt: now - 3600000 };
  let attempts = 0;
  const snapshot = await getFeed(
    store,
    async () => {
      attempts += 1;
      return new Response("<feed><entry></feed>");
    },
    now,
  );
  assert.equal(attempts, 1);
  assert.equal(snapshot.stale, true);
  assert.match(warning.mock.calls[0].arguments[1].reason, /closing tag/);
  assert.equal(warning.mock.calls[0].arguments[1].status, 200);
});

test("timeouts are logged and retain the original saved timestamp", async (t) => {
  const warning = t.mock.method(console, "warn", () => {});
  const expired = AbortSignal.abort(
    new DOMException("Timed out", "TimeoutError"),
  );
  t.mock.method(AbortSignal, "timeout", (milliseconds: number) => {
    assert.equal(milliseconds, 8000);
    return expired;
  });
  const store = new MemorySnapshot();
  const fetchedAt = now - 3600000;
  store.value = { videos, fetchedAt };
  const snapshot = await getFeed(
    store,
    async (_url, options) => {
      assert.equal(options?.signal, expired);
      throw expired.reason;
    },
    now,
  );
  assert.equal(snapshot.stale, true);
  assert.equal(snapshot.fetchedAt, fetchedAt);
  assert.equal(warning.mock.calls[0].arguments[1].reason, "Request timed out.");
  assert.equal(warning.mock.calls[0].arguments[1].status, null);
  assert.equal(warning.mock.calls[0].arguments[1].attempts, 1);
});

test("upstream Retry-After prevents immediate retry", async (t) => {
  t.mock.method(console, "warn", () => {});
  let attempts = 0;
  await assert.rejects(
    getFeed(
      new MemorySnapshot(),
      async () => {
        attempts += 1;
        return new Response("Unavailable", {
          status: 503,
          headers: { "Retry-After": "60" },
        });
      },
      now,
    ),
    /503/,
  );
  assert.equal(attempts, 1);
});
