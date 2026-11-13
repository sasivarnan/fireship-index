import type { calculateIndex } from "../index.ts";
import { matchReason } from "./presentation.ts";

type Classification = ReturnType<
  typeof calculateIndex
>["classifications"][number];
const uploadDate = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function videoPresentation({
  video,
  titleMatches,
  descriptionMatches,
  keywords,
}: Classification) {
  return {
    tooltipId: `match-${video.id}`,
    matched: keywords.length > 0,
    title: video.title,
    href: `https://www.youtube.com/watch?v=${video.id}`,
    published: video.published,
    date: uploadDate.format(new Date(video.published)),
    evidence: keywords.length
      ? matchReason(titleMatches, descriptionMatches)
      : "No AI terms matched",
    thumbnail: {
      alt: "",
      width: 320,
      height: 180,
      loading: "lazy" as const,
      decoding: "async" as const,
      fetchpriority: "low" as const,
      referrerpolicy: "no-referrer" as const,
      src: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
    },
  };
}
