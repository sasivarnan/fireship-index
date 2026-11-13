import { gaugeState } from "./gauge.ts";

export function readingShareData(
  score: number,
  summary: string,
  url: string,
  checked: string,
  saved: boolean,
) {
  return {
    title: "The Fireship Index",
    text: `The Fireship Index: ${score}/100. ${gaugeState(score).label}.\nHow much AI is Fireship posting?\n${summary}\n${saved ? "Saved reading. " : ""}${checked}\nUnofficial. Satire.`,
    url: new URL("/", url).href,
  };
}

export async function shareOrCopy(
  data: ShareData,
  platform: {
    share?: (data: ShareData) => Promise<void>;
    copy?: (text: string) => Promise<void>;
  },
): Promise<"shared" | "copied" | "cancelled" | "manual"> {
  if (platform.share) {
    try {
      await platform.share(data);
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError")
        return "cancelled";
      return "manual";
    }
  }
  try {
    if (!platform.copy) return "manual";
    await platform.copy(`${data.text}\n${data.url}`);
    return "copied";
  } catch {
    return "manual";
  }
}
