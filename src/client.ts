import {
  CLIENT_REQUEST_TIMEOUT_MS,
  REFRESH_COOLDOWN_MS,
  REVALIDATE_SECONDS,
} from "./lib/settings.ts";
import { videoPresentation } from "./lib/video-presentation.ts";
import { calculateIndex, validateVideos } from "./index.ts";
import {
  sampleSummary,
  samplePeriod,
  feedLine,
  checkedTime,
} from "./lib/presentation.ts";
import { createMatchTooltips } from "./match-tooltips.ts";
import { createSharing } from "./share-reading.ts";
import { createGauge } from "./gauge-animation.ts";
const gauge = createGauge();
const sharing = createSharing();

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing element: ${id}`);
  return result as T;
}
const list = element("video-list");
createMatchTooltips(list);
const status = element("feed-status");
const refresh = element<HTMLButtonElement>("refresh");
let loading = false;
let lastAttempt = 0;
let lastFetchedAt = Number(status.dataset.fetchedAt) || null;
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
  const note = element("reading-note");
  note.textContent =
    state === "error" && !lastFetchedAt ? "Feed unavailable" : "";
  note.hidden = !note.textContent;
}

function keptReading(): string {
  return lastFetchedAt
    ? `Showing the last available reading. Last checked ${checkedTime(lastFetchedAt, localTime)}.`
    : "No reading yet. Try Refresh again later.";
}

function render(videos: ReturnType<typeof validateVideos>) {
  const index = calculateIndex(videos);
  gauge.animate(index.score);
  element("sample-summary").textContent = sampleSummary(index);
  element("sample-period").textContent = samplePeriod(index);
  list.replaceChildren();
  for (const card of index.classifications.map(videoPresentation)) {
    const row = document.createElement("li");
    row.className = "video-card";
    const time = document.createElement("time");
    time.dateTime = card.published;
    time.textContent = card.date;
    const link = document.createElement("a");
    link.className = "video-link";
    link.href = card.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const image = document.createElement("img");
    const { src, ...attributes } = card.thumbnail;
    for (const [name, value] of Object.entries(attributes))
      image.setAttribute(name, String(value));
    image.src = src;
    const title = document.createElement("span");
    title.textContent = card.title;
    link.appendChild(image);
    link.appendChild(title);
    row.appendChild(link);
    const metadata = document.createElement("div");
    metadata.className = "video-meta";
    metadata.appendChild(time);
    row.appendChild(metadata);
    const evidence = document.createElement("p");
    evidence.className = "video-evidence";
    evidence.textContent = card.evidence;
    if (card.matched) {
      const matchContainer = document.createElement("div");
      matchContainer.className = "video-match";
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "match-trigger";
      trigger.setAttribute("aria-describedby", card.tooltipId);
      evidence.id = card.tooltipId;
      evidence.setAttribute("role", "tooltip");
      const dot = document.createElement("span");
      dot.className = "match-dot";
      dot.setAttribute("aria-hidden", "true");
      trigger.appendChild(dot);
      trigger.appendChild(document.createTextNode("AI match"));
      matchContainer.appendChild(trigger);
      matchContainer.appendChild(evidence);
      metadata.appendChild(matchContainer);
    } else {
      evidence.className = "no-match";
      evidence.textContent = "No AI match";
      metadata.appendChild(evidence);
    }
    list.appendChild(row);
  }
  return index;
}

element<HTMLFormElement>("refresh-form").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    if (loading) return;
    if (Date.now() - lastAttempt < REFRESH_COOLDOWN_MS) {
      setStatus(
        `Please wait one minute before refreshing again. ${keptReading()}`,
        "saved",
      );
      return;
    }
    lastAttempt = Date.now();
    loading = true;
    refresh.disabled = true;
    list.setAttribute("aria-busy", "true");
    refresh.textContent = "Checking…";
    setStatus(`Checking Fireship’s feed… ${keptReading()}`, "checking");
    try {
      const response = await fetch("/api/feed", {
        signal: AbortSignal.timeout(CLIENT_REQUEST_TIMEOUT_MS),
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
      sharing.update(index.score !== null);
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
      setStatus(`Couldn’t refresh. ${keptReading()}`, "error");
    } finally {
      loading = false;
      refresh.disabled = false;
      refresh.textContent = "↻ Refresh";
      list.setAttribute("aria-busy", "false");
    }
  },
);

if (
  lastFetchedAt &&
  Date.now() - lastFetchedAt > REVALIDATE_SECONDS * 1000 &&
  status.dataset.stale !== "true"
) {
  setStatus(
    `${status.textContent?.trim()} · Last available reading. Use Refresh to check for updates.`,
    "saved",
  );
}
