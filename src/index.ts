import { SAMPLE_SIZE } from "./lib/settings.ts";
import { classifyVideos } from "./lib/keywords.ts";
export { classifyVideos, matchKeywords } from "./lib/keywords.ts";

export const CHANNEL_ID = "UCsBjURrPoezykLs9EqgamOA";
export const CHANNEL_URL = `https://www.youtube.com/channel/${CHANNEL_ID}`;
export const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
export const DAY = 86_400_000;

export interface Video {
  id: string;
  title: string;
  published: string;
  description: string;
}

export function validateVideos(input: unknown, now = Date.now()): Video[] {
  if (!Array.isArray(input) || input.length > 100)
    throw new Error("Invalid video list.");
  const unique = new Map<string, Video>();
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const { id, title, published, description } = item;
    if (typeof id !== "string" || !/^[\w-]{11}$/.test(id)) continue;
    if (typeof title !== "string" || !title.trim() || title.length > 500)
      continue;
    if (typeof published !== "string") continue;
    const timestamp = Date.parse(published);
    if (
      !Number.isFinite(timestamp) ||
      timestamp < 1_104_537_600_000 ||
      timestamp > now + 300_000
    )
      continue;
    unique.set(id, {
      id,
      title: title.trim(),
      description:
        typeof description === "string" ? description.slice(0, 20000) : "",
      published: new Date(timestamp).toISOString(),
    });
  }
  const videos = [...unique.values()].sort(
    (a, b) => Date.parse(b.published) - Date.parse(a.published),
  );
  if (!videos.length) throw new Error("No valid Fireship uploads found.");
  return videos;
}

export function calculateIndex(videos: Video[], now = Date.now()) {
  const eligible = videos.filter((video) => {
    const published = Date.parse(video.published);
    return (
      Number.isFinite(published) &&
      published >= 1_104_537_600_000 &&
      published <= now
    );
  });
  const sample = [
    ...new Map(eligible.map((video) => [video.id, video])).values(),
  ]
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published))
    .slice(0, SAMPLE_SIZE);
  const classifications = classifyVideos(sample);
  const matchedIds = new Set(
    classifications
      .filter((item) => item.keywords.length)
      .map((item) => item.video.id),
  );
  const matched = sample.filter((video) => matchedIds.has(video.id));
  const oldest = sample.length
    ? Math.min(...sample.map((video) => Date.parse(video.published)))
    : now;
  const days = Math.max(1, (now - oldest) / DAY);
  const share = sample.length ? matched.length / sample.length : 0;
  const weeklyRate = (matched.length / days) * 7;
  const score = sample.length
    ? Math.round(100 * (0.6 * share + 0.4 * Math.min(1, weeklyRate / 3)))
    : null;
  return {
    sample,
    matched,
    days,
    share,
    weeklyRate,
    score,
    classifications,
    period: { start: oldest, end: now },
  };
}
