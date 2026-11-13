import { SAMPLE_SIZE } from "./settings.ts";
import type { calculateIndex } from "../index.ts";

type Index = ReturnType<typeof calculateIndex>;

export function sampleSummary(index: Index): string {
  return index.sample.length
    ? `${index.matched.length} of the latest ${index.sample.length} videos cover AI.`
    : "No available uploads. No score yet.";
}

export function samplePeriod(index: Index): string {
  if (!index.sample.length)
    return `The score uses up to ${SAMPLE_SIZE} available uploads.`;
  const dates = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const newest = Date.parse(index.sample[0].published);
  const oldest = Date.parse(index.sample[index.sample.length - 1].published);
  const range = dates.formatRange(new Date(oldest), new Date(newest));
  return `Uploads: ${range}. Posting pace measured over ${Math.ceil(index.days)} days, through ${dates.format(new Date(index.period.end))}.`;
}

export function matchReason(
  titleMatches: string[],
  descriptionMatches: string[],
): string {
  const shared = titleMatches.filter((term) =>
    descriptionMatches.includes(term),
  );
  const titleOnly = titleMatches.filter((term) => !shared.includes(term));
  const descriptionOnly = descriptionMatches.filter(
    (term) => !shared.includes(term),
  );
  return [
    shared.length ? `${shared.join(", ")} in title and description` : "",
    titleOnly.length ? `${titleOnly.join(", ")} in title` : "",
    descriptionOnly.length
      ? `${descriptionOnly.join(", ")} in description`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export interface CheckedTimeOptions {
  timeZone?: string;
  locale?: string;
}

export function checkedTime(
  fetchedAt: number,
  { timeZone = "UTC", locale = "en" }: CheckedTimeOptions = {},
): string {
  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).formatToParts(new Date(fetchedAt));
  const zone =
    parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
  const date = parts
    .filter((part) => part.type !== "timeZoneName")
    .map((part) => part.value)
    .join("")
    .trim();
  return `${date} ${zone}`;
}

export function feedStatusParts(
  index: Index,
  fetchedAt: number,
  stale: boolean,
  missing: number,
  timeOptions: CheckedTimeOptions = {},
) {
  const dates = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...(index.sample.some(
      (video) =>
        new Date(video.published).getUTCFullYear() !==
        new Date(index.period.end).getUTCFullYear(),
    )
      ? { year: "numeric" as const }
      : {}),
  });
  const range = index.sample.length
    ? dates.formatRange(
        new Date(index.sample[index.sample.length - 1].published),
        new Date(index.sample[0].published),
      ) + " · "
    : "";
  return {
    prefix: `${range}Checked `,
    checked: checkedTime(fetchedAt, timeOptions),
    checkedAt: new Date(fetchedAt).toISOString(),
    suffix: `${stale ? " · Couldn’t refresh. Showing the last available reading." : ""}${missing ? ` · ${missing} missing descriptions; titles used` : ""}`,
  };
}

export function feedLine(
  index: Index,
  fetchedAt: number,
  stale: boolean,
  missing: number,
  timeOptions: CheckedTimeOptions = {},
): string {
  const parts = feedStatusParts(index, fetchedAt, stale, missing, timeOptions);
  return parts.prefix + parts.checked + parts.suffix;
}
