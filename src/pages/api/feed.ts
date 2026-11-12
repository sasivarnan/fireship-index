import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { calculateIndex, FEED_URL } from "../../index.ts";
import { getFeed, type SnapshotStore } from "../../lib/feed-service.ts";

export const GET: APIRoute = async () => {
  try {
    const snapshot = await getFeed(
      (env as unknown as { FEED_CACHE: SnapshotStore }).FEED_CACHE,
    );
    return Response.json(
      { ...snapshot, source: FEED_URL, index: calculateIndex(snapshot.videos) },
      {
        headers: {
          "X-Feed-Fetched-At": String(snapshot.fetchedAt),
          "X-Feed-Stale": snapshot.stale ? "1" : "0",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "Fireship RSS is unavailable. Please try again later." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "60" },
      },
    );
  }
};
