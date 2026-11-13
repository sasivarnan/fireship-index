import test from "node:test";
import assert from "node:assert/strict";
import { classifyVideos } from "../src/index.ts";
import { videoPresentation } from "../src/lib/video-presentation.ts";

function card(title: string, description = "") {
  return videoPresentation(
    classifyVideos([
      {
        id: "abcdefghijk",
        title,
        description,
        published: "2026-11-12T00:30:00.000Z",
      },
    ])[0],
  );
}

test("server and browser card data keeps links, UTC dates, and match sources", () => {
  const video = card("OpenAI news", "Claude builds an app.");
  assert.equal(video.matched, true);
  assert.equal(card("CSS layouts").matched, false);
  assert.equal(video.title, "OpenAI news");
  assert.equal(video.href, "https://www.youtube.com/watch?v=abcdefghijk");
  assert.equal(video.date, "Nov 12");
  assert.equal(video.published, "2026-11-12T00:30:00.000Z");
  assert.equal(video.evidence, "OpenAI in title · Claude in description");
  assert.equal(card("CSS layouts").evidence, "No AI terms matched");
});
test("shared thumbnail data preserves lazy loading, privacy, and 16:9 dimensions", () => {
  const thumbnail = card("CSS layouts").thumbnail;
  assert.equal(
    thumbnail.src,
    "https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg",
  );
  assert.equal(thumbnail.width / thumbnail.height, 16 / 9);
  assert.equal(thumbnail.loading, "lazy");
  assert.equal(thumbnail.decoding, "async");
  assert.equal(thumbnail.fetchpriority, "low");
  assert.equal(thumbnail.referrerpolicy, "no-referrer");
  assert.equal(thumbnail.alt, "");
});
