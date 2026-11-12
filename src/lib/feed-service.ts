import { FEED_URL, validateVideos, type Video } from "../index.ts";
import { parseXml } from "./xml.ts";

export const REVALIDATE_SECONDS = 15 * 60;
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
  try {
    const response = await fetcher(FEED_URL, {
      signal: AbortSignal.timeout(8000),
      redirect: "manual",
      headers: { Accept: "application/atom+xml, application/xml, text/xml" },
    });
    if (!response.ok) throw new Error(`RSS returned ${response.status}.`);
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
    if (saved) return { ...saved, stale: true };
    console.warn(
      "RSS fetch failed:",
      error instanceof Error ? error.message : "Unknown feed error",
    );
    throw error;
  }
}
