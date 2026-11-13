import {
  REVALIDATE_SECONDS,
  RESPONSE_CACHE_SECONDS,
  STALE_RETRY_MS,
} from "./settings.ts";

export interface ResponseStore {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export async function cachedResponse(options: {
  cache: ResponseStore;
  key: Request;
  generate: () => Promise<Response>;
  waitUntil: (work: Promise<unknown>) => void;
  now?: number;
}) {
  const { cache, key, generate, waitUntil, now = Date.now() } = options;
  let saved: Response | undefined;
  try {
    saved = await cache.match(key);
  } catch {
    console.warn("Response cache unavailable.");
  }
  const renderAndSave = async () => {
    const response = await generate();
    const result = new Response(response.body, response);
    result.headers.set("Cache-Control", "no-store");
    result.headers.set("X-Index-Cache", "MISS");
    if (result.status === 200 && !result.headers.has("Set-Cookie")) {
      const stored = result.clone();
      stored.headers.set(
        "Cache-Control",
        `public, max-age=${RESPONSE_CACHE_SECONDS}`,
      );
      stored.headers.set("X-Generated-At", String(now));
      try {
        await cache.put(key, stored);
      } catch {
        console.warn("Response cache write failed.");
      }
    }
    return result;
  };
  if (!saved) return renderAndSave();
  const generatedAt = Number(saved.headers.get("X-Generated-At"));
  const fetchedAt =
    Number(saved.headers.get("X-Feed-Fetched-At")) || generatedAt;
  const age = now - Math.min(generatedAt, fetchedAt);
  const fresh =
    generatedAt > 0 &&
    (saved.headers.get("X-Feed-Stale") === "1"
      ? now - generatedAt < STALE_RETRY_MS
      : age < REVALIDATE_SECONDS * 1000);
  const result = new Response(saved.body, saved);
  result.headers.set("Cache-Control", "no-store");
  result.headers.set("X-Index-Cache", fresh ? "HIT" : "STALE");
  if (!fresh)
    waitUntil(
      renderAndSave()
        .then(() => undefined)
        .catch(() => console.warn("Background regeneration failed.")),
    );
  return result;
}
