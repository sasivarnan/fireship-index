import type { Video } from "../index.ts";

export const keywordRules: [string, RegExp][] = [
  ["AI", /\bAI\b/i],
  ["AGI", /\bAGI\b/i],
  ["artificial intelligence", /\bartificial intelligence\b/i],
  ["LLM", /\bLLMs?\b/i],
  ["GPT", /\bGPT(?:[ -]?\d[\w.-]*)?\b/i],
  ["ChatGPT", /\bChatGPT\b/i],
  ["OpenAI", /\bOpenAI\b/i],
  ["Anthropic", /\bAnthropic\b/i],
  ["Claude", /\bClaude\b/i],
  ["Gemini", /\bGemini\b/i],
  ["DeepSeek", /\bDeepSeek\b/i],
  ["Copilot", /\bCopilot\b/i],
  ["Codex", /\bCodex\b/i],
  ["Grok", /\bGrok\b/i],
  ["agentic", /\bagentic\b/i],
  ["Midjourney", /\bMidjourney\b/i],
  ["Stable Diffusion", /\bstable diffusion\b/i],
  ["machine learning", /\bmachine learning\b/i],
  ["frontier model", /\bfrontier models?\b/i],
  ["open-weight model", /\bopen[ -]weight models?\b/i],
  ["neural network", /\bneural networks?\b/i],
  ["language model", /\blanguage models?\b/i],
  ["prompt injection", /\bprompt injection\b/i],
];

export function matchKeywords(title: string): string[] {
  return keywordRules
    .filter(([, expression]) => expression.test(title))
    .map(([label]) => label);
}

function descriptionParagraphs(description: string): string[] {
  return description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(
      (paragraph) =>
        paragraph &&
        !/want more fireship|newsletter|courses?:|subscribe|sponsored? by|paid promotion/i.test(
          paragraph,
        ),
    )
    .filter(
      (paragraph) =>
        !/(?:sponsor|try|start|get|sign up|check out|use code|download|buy|join|save|support|learn more)\b[\s\S]*https?:\/\//i.test(
          paragraph,
        ),
    )
    .map((paragraph) =>
      paragraph
        .replace(/https?:\/\/\S+/g, "")
        .replace(/<[^>]*>/g, "")
        .trim(),
    )
    .filter(Boolean);
}

export function classifyVideos(videos: Video[]) {
  const paragraphs = videos.map((video) =>
    descriptionParagraphs(video.description),
  );
  const occurrences = new Map<string, number>();
  const normalized = (paragraph: string) =>
    paragraph.toLowerCase().replace(/\s+/g, " ");
  for (const parts of paragraphs) {
    for (const part of new Set(parts.map(normalized)))
      occurrences.set(part, (occurrences.get(part) ?? 0) + 1);
  }
  const repeatedThreshold = Math.max(3, Math.ceil(videos.length / 2));
  return videos.map((video, index) => {
    const titleMatches = matchKeywords(video.title);
    const descriptionMatches = matchKeywords(
      paragraphs[index]
        .filter(
          (part) =>
            (occurrences.get(normalized(part)) ?? 0) < repeatedThreshold,
        )
        .join("\n"),
    );
    return {
      video,
      titleMatches,
      descriptionMatches,
      keywords: [...new Set([...titleMatches, ...descriptionMatches])],
    };
  });
}
