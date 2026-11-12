import { calculateIndex, validateVideos } from "./index.ts";
import {
  sampleSummary,
  samplePeriod,
  matchReason,
  feedLine,
  checkedTime,
} from "./lib/presentation.ts";
import { createGauge } from "./gauge-animation.ts";
const gauge = createGauge();

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing element: ${id}`);
  return result as T;
}
const list = element("video-list");
const status = element("feed-status");
const refresh = element<HTMLButtonElement>("refresh");
const fileInput = element<HTMLInputElement>("feed-file");
let loading = false;
let lastAttempt = 0;
let lastFetchedAt = Number(status.dataset.fetchedAt) || null;
let localPreview = false;
const localTime = {
  timeZone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale: navigator.language,
};
const checkedElement = status.querySelector<HTMLTimeElement>(
  "time[data-checked-time]",
);
if (lastFetchedAt && checkedElement) {
  checkedElement.textContent = checkedTime(lastFetchedAt, localTime);
}

function setStatus(message: string, state: string) {
  status.textContent = message;
  status.dataset.state = state;
}

function keptReading(): string {
  if (localPreview) return "The local file preview is still shown.";
  return lastFetchedAt
    ? `The saved reading is still shown. Last checked ${checkedTime(lastFetchedAt, localTime)}.`
    : "No reading yet. Try again later, or import XML under About the index.";
}

function render(videos: ReturnType<typeof validateVideos>) {
  const index = calculateIndex(videos);
  gauge.animate(index.score);
  element("sample-summary").textContent = sampleSummary(index);
  element("sample-period").textContent = samplePeriod(index);
  list.replaceChildren();
  for (const {
    video,
    titleMatches,
    descriptionMatches,
    keywords,
  } of index.classifications) {
    const row = document.createElement("li");
    row.className = "video-card";
    const time = document.createElement("time");
    time.dateTime = video.published;
    time.textContent = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(video.published));
    const link = document.createElement("a");
    link.className = "video-link";
    link.href = `https://www.youtube.com/watch?v=${video.id}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const image = document.createElement("img");
    image.alt = "";
    image.width = 320;
    image.height = 180;
    image.loading = "lazy";
    image.decoding = "async";
    image.setAttribute("fetchpriority", "low");
    image.referrerPolicy = "no-referrer";
    image.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
    const title = document.createElement("span");
    title.textContent = video.title;
    link.appendChild(image);
    link.appendChild(title);
    row.appendChild(link);
    row.appendChild(time);
    const evidence = document.createElement("p");
    evidence.className = "video-evidence";
    evidence.textContent = keywords.length
      ? matchReason(titleMatches, descriptionMatches)
      : "No AI terms matched";
    row.appendChild(evidence);
    list.appendChild(row);
  }
  return index;
}

element<HTMLFormElement>("refresh-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    if (loading) return;
    if (Date.now() - lastAttempt < 60_000) {
      setStatus(
        `Please wait one minute before refreshing again. ${keptReading()}`,
        "saved",
      );
      return;
    }
    lastAttempt = Date.now();
    loading = true;
    refresh.disabled = true;
    fileInput.disabled = true;
    list.setAttribute("aria-busy", "true");
    refresh.textContent = "Checking…";
    setStatus(`Checking Fireship’s feed… ${keptReading()}`, "checking");
    try {
      const response = await fetch("/api/feed", {
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error("Feed unavailable");
      const data = await response.json();
      if (
        !data ||
        typeof data !== "object" ||
        !("fetchedAt" in data) ||
        typeof data.fetchedAt !== "number" ||
        !Number.isFinite(data.fetchedAt) ||
        data.fetchedAt > Date.now() ||
        !("videos" in data)
      )
        throw new Error("Invalid feed");
      const videos = validateVideos(data.videos);
      const index = render(videos);
      lastFetchedAt = data.fetchedAt;
      localPreview = false;
      status.dataset.fetchedAt = String(lastFetchedAt);
      const stale = "stale" in data && data.stale === true;
      const renewing = response.headers.get("X-Index-Cache") === "STALE";
      const missing = index.sample.filter(
        (video) => !video.description.trim(),
      ).length;
      setStatus(
        `${feedLine(index, lastFetchedAt, stale, missing, localTime)}${renewing ? " Updating in the background." : ""}`,
        stale || renewing ? "saved" : "ready",
      );
    } catch {
      setStatus(`Refresh failed. ${keptReading()}`, "error");
    } finally {
      loading = false;
      refresh.disabled = false;
      refresh.textContent = "↻ Refresh";
      fileInput.disabled = false;
      list.setAttribute("aria-busy", "false");
    }
  },
);

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000)
      throw new Error("Select an XML file smaller than 2 MB.");
    const { parseXml } = await import("./lib/xml.ts");
    render(parseXml(await file.text()));
    localPreview = true;
    setStatus(
      "Local file preview. The public reading has not changed.",
      "local",
    );
    element("import-status").textContent = "Feed imported locally.";
  } catch (error) {
    element("import-status").textContent =
      error instanceof Error ? error.message : "Invalid XML file.";
  }
  fileInput.value = "";
});
if (
  lastFetchedAt &&
  Date.now() - lastFetchedAt > 15 * 60_000 &&
  status.dataset.stale !== "true"
) {
  setStatus(
    `${status.textContent?.trim()} · Saved reading. Use Refresh to check for updates.`,
    "saved",
  );
}
