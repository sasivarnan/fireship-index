import type { APIRoute } from "astro";
import { calculateIndex, FEED_URL } from "../../index.ts";
import { getStoredFeed } from "../../lib/feed-store.ts";

export const GET: APIRoute = async () => {
  try {
    const snapshot = await getStoredFeed();
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
