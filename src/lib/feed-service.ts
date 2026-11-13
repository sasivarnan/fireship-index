import { FEED_URL, validateVideos, type Video } from "../index.ts";
import { parseXml } from "./xml.ts";

import { REVALIDATE_SECONDS, FEED_REQUEST_TIMEOUT_MS } from "./settings.ts";
const SNAPSHOT_KEY = "fireship:feed:v3";

export interface SnapshotStore {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
}

export interface FeedSnapshot {
  videos: Video[];
  fetchedAt: number;
  stale: boolean;
}

export function validateSnapshot(
  value: unknown,
  now = Date.now(),
): FeedSnapshot | null {
  try {
    if (!value || typeof value !== "object") return null;
    const snapshot = value as FeedSnapshot;
    if (
      !Number.isFinite(snapshot.fetchedAt) ||
      snapshot.fetchedAt > now ||
      snapshot.fetchedAt < 1_104_537_600_000
    )
      return null;
    return {
      videos: validateVideos(snapshot.videos, now),
      fetchedAt: snapshot.fetchedAt,
      stale: now - snapshot.fetchedAt >= REVALIDATE_SECONDS * 1000,
    };
  } catch {
    return null;
  }
}

export async function getFeed(
  store: SnapshotStore,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<FeedSnapshot> {
  let saved: FeedSnapshot | null = null;
  try {
    saved = validateSnapshot(await store.get(SNAPSHOT_KEY, "json"), now);
  } catch {
    console.warn("Feed snapshot could not be read.");
  }
  if (saved && !saved.stale) return saved;
  const signal = AbortSignal.timeout(FEED_REQUEST_TIMEOUT_MS);
  let attempts = 0;
  let upstreamStatus: number | null = null;
  try {
    let response: Response;
    while (true) {
      attempts += 1;
      response = await fetcher(FEED_URL, {
        signal,
        redirect: "manual",
        headers: { Accept: "application/atom+xml, application/xml, text/xml" },
      });
      upstreamStatus = response.status;
      const retryable =
        response.status === 404 ||
        response.status === 408 ||
        response.status >= 500;
      if (
        !retryable ||
        attempts >= 2 ||
        signal.aborted ||
        response.headers.has("Retry-After")
      )
        break;
      await response.body?.cancel().catch(() => undefined);
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error(`RSS returned ${response.status}.`);
    }
    const snapshot: FeedSnapshot = {
      videos: parseXml(await response.text(), now),
      fetchedAt: now,
      stale: false,
    };
    try {
      await store.put(SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch {
      console.warn("Feed snapshot could not be saved.");
    }
    return snapshot;
  } catch (error) {
    console.warn("Fireship RSS refresh failed.", {
      source: FEED_URL,
      status: upstreamStatus,
      attempts,
      reason: signal.aborted
        ? "Request timed out."
        : error instanceof Error
          ? error.message
          : "Unknown feed error.",
      usingSavedReading: saved !== null,
      lastSuccessfulFetchAt: saved
        ? new Date(saved.fetchedAt).toISOString()
        : null,
    });
    if (saved) return { ...saved, stale: true };
    throw error;
  }
}
