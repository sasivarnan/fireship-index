import { checkedTime } from "./lib/presentation.ts";
import { readingShareData, shareOrCopy } from "./lib/sharing.ts";

export function createSharing() {
  const button = document.getElementById("share-reading") as HTMLButtonElement;
  const status = document.getElementById("share-status")!;
  const fallback = document.getElementById("share-fallback")!;
  const text = document.getElementById("share-text") as HTMLTextAreaElement;
  const section = document.getElementById("gauge-section")!;
  let busy = false;
  let available = !button.disabled;
  button.hidden = false;
  const close = () => {
    fallback.hidden = true;
    text.value = "";
  };
  button.addEventListener("click", async () => {
    if (busy || !available) return;
    busy = true;
    close();
    status.hidden = true;
    button.disabled = true;
    const feed = document.getElementById("feed-status")!;
    const timestamp = Number(feed.dataset.fetchedAt);
    const data = readingShareData(
      Number(section.dataset.score),
      document.getElementById("sample-summary")!.textContent!.trim(),
      location.href,
      timestamp
        ? `Checked ${checkedTime(timestamp, { locale: navigator.language, timeZone: new Intl.DateTimeFormat().resolvedOptions().timeZone })}.`
        : "",
      ["saved", "error"].includes(feed.dataset.state ?? ""),
    );
    const result = await shareOrCopy(data, {
      share: navigator.share?.bind(navigator),
      copy: navigator.clipboard?.writeText.bind(navigator.clipboard),
    });
    if (result === "manual") {
      text.value = `${data.text}\n${data.url}`;
      fallback.hidden = false;
      text.focus();
      text.select();
    } else if (result !== "cancelled") {
      status.textContent =
        result === "copied"
          ? "Reading copied. Send it before AI takes the credit."
          : "Share request completed.";
      status.hidden = false;
    }
    busy = false;
    button.disabled = !available;
  });
  document.getElementById("share-close")!.addEventListener("click", () => {
    close();
    button.focus();
  });
  fallback.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      button.focus();
    }
  });
  return {
    update(value: boolean) {
      available = value;
      button.disabled = busy || !available;
      status.hidden = true;
      close();
    },
  };
}
