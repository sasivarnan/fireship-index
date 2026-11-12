import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateIndex,
  classifyVideos,
  DAY,
  matchKeywords,
  validateVideos,
} from "../src/index.ts";

const now = Date.parse("2026-11-06T12:00:00Z");
const video = (
  title: string,
  days: number,
  id = "abcdefghijk",
  description = "",
) => ({
  description,
  id,
  title,
  published: new Date(now - days * DAY).toISOString(),
});

test("AI detection uses word boundaries and handles named models", () => {
  assert.deepEqual(matchKeywords("Email fails again"), []);
  assert.deepEqual(matchKeywords("AI agents meet Claude and GPT-5"), [
    "AI",
    "GPT",
    "Claude",
  ]);
  assert.deepEqual(matchKeywords("DeepSeek and LLMs"), ["LLM", "DeepSeek"]);
  assert.deepEqual(
    matchKeywords("A new frontier model meets an open-weight model"),
    ["frontier model", "open-weight model"],
  );
});
test("index combines AI share with weekly posting pressure", () => {
  const result = calculateIndex(
    [video("AI update", 7), video("CSS update", 14, "abcdefghij2")],
    now,
  );
  assert.equal(result.days, 14);
  assert.equal(result.weeklyRate, 0.5);
  assert.equal(result.share, 0.5);
  assert.equal(result.score, 37);
});
test("score includes older uploads when they are still among the latest 15", () => {
  assert.equal(calculateIndex([], now).score, null);
  assert.equal(calculateIndex([video("AI update", 31)], now).score, 63);
  assert.equal(calculateIndex([video("CSS update", 1)], now).score, 0);
});
test("short samples are bounded to one day and pressure is capped", () => {
  const result = calculateIndex([video("AI update", 0.01)], now);
  assert.equal(result.days, 1);
  assert.equal(result.score, 100);
});
test("invalid, future, and duplicate videos do not inflate the sample", () => {
  const input = [
    video("AI update", 1),
    video("AI update", 1),
    video("Future", -1),
    { ...video("Bad id", 1), id: "invalid" },
    { ...video("Bad date", 1), published: "no" },
  ];
  assert.equal(validateVideos(input, now).length, 1);
  assert.throws(() => validateVideos([], now));
});
test("descriptions identify AI coverage when the title does not", () => {
  const videos = [
    video(
      "The last real programmers are dying out",
      7,
      "abcdefghijk",
      "A new Claude coding model now builds entire applications.",
    ),
  ];
  const [result] = classifyVideos(videos);
  assert.deepEqual(result.titleMatches, []);
  assert.deepEqual(result.descriptionMatches, ["Claude"]);
  assert.equal(calculateIndex(videos, now).matched.length, 1);
});

test("sponsors, links, and channel promotions do not count", () => {
  const description =
    "Try an AI coding assistant for free: https://sponsor.example\n\nThis video covers CSS layouts.\n\nWant more Fireship?\n\nNewsletter: https://ai.example";
  assert.deepEqual(
    classifyVideos([video("CSS layouts", 1, "abcdefghijk", description)])[0]
      .keywords,
    [],
  );
});

test("repeated description paragraphs are excluded across the feed", () => {
  const videos = [
    video("CSS", 1, "abcdefghijk", "AI tools for developers."),
    video("Rust", 2, "abcdefghij2", "AI tools for developers."),
    video("Linux", 3, "abcdefghij3", "AI tools for developers."),
  ];
  assert.equal(
    classifyVideos(videos).filter((item) => item.keywords.length).length,
    0,
  );
});

test("title matches remain valid when the description is promotional", () => {
  assert.deepEqual(
    classifyVideos([
      video(
        "OpenAI update",
        1,
        "abcdefghijk",
        "Get AI tools: https://sponsor.example",
      ),
    ])[0].keywords,
    ["OpenAI"],
  );
});

test("description validation supports old cached records and bounds text size", () => {
  const { description: _description, ...oldVideo } = video("CSS", 1);
  assert.equal(validateVideos([oldVideo], now)[0].description, "");
  assert.equal(
    validateVideos([{ ...oldVideo, description: "a".repeat(30000) }], now)[0]
      .description.length,
    20000,
  );
});

test("only the latest 15 unique published uploads affect the score", () => {
  const videos = Array.from({ length: 16 }, (_, i) =>
    video(
      i === 15 ? "AI breakthrough" : "CSS update",
      i + 1,
      `v${String(i).padStart(10, "0")}`,
    ),
  );
  const result = calculateIndex([...videos].reverse(), now);
  assert.equal(result.sample.length, 15);
  assert.equal(result.sample[0].id, videos[0].id);
  assert.equal(result.sample[14].id, videos[14].id);
  assert.equal(result.classifications.length, 15);
  assert.equal(result.matched.length, 0);
  assert.equal(result.score, 0);
});
test("small scoring samples exclude duplicate, future, and invalid dates", () => {
  const valid = video("AI update", 45);
  const result = calculateIndex(
    [
      valid,
      valid,
      video("AI future", -1, "abcdefghij2"),
      { ...video("AI invalid", 1, "abcdefghij3"), published: "invalid" },
    ],
    now,
  );
  assert.equal(result.sample.length, 1);
  assert.equal(result.matched.length, 1);
  assert.equal(result.days, 45);
  assert.equal(result.period.start, now - 45 * DAY);
  assert.equal(result.period.end, now);
});
