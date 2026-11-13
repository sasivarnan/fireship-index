import test from "node:test";
import assert from "node:assert/strict";
import { readingShareData, shareOrCopy } from "../src/lib/sharing.ts";

test("shared reading uses the real score and removes local URL parameters", () => {
  const data = readingShareData(
    75,
    "12 of the latest 15 videos cover AI.",
    "https://example.com/?test=1#recent-videos",
    "Checked today.",
    true,
  );
  assert.equal(data.url, "https://example.com/");
  assert.match(data.text, /75\/100.*WE MIGHT BE COOKED/);
  assert.match(data.text, /12 of the latest 15/);
  assert.match(data.text, /Saved reading/);
  assert.match(data.text, /Satire/);
});
test("native sharing passes the complete reading", async () => {
  const data = readingShareData(
    0,
    "No AI matches.",
    "https://example.com/",
    "",
    false,
  );
  assert.equal(
    await shareOrCopy(data, {
      share: async (received) => {
        assert.deepEqual(received, data);
      },
    }),
    "shared",
  );
});
test("cancelling native sharing does not copy or report failure", async () => {
  assert.equal(
    await shareOrCopy(
      {},
      {
        share: async () => {
          throw new DOMException("Cancelled", "AbortError");
        },
        copy: async () => {
          assert.fail("Do not copy after cancellation");
        },
      },
    ),
    "cancelled",
  );
});
test("clipboard fallback includes the text and URL", async () => {
  let copied = "";
  assert.equal(
    await shareOrCopy(
      { text: "Score 75", url: "https://example.com/" },
      {
        copy: async (text) => {
          copied = text;
        },
      },
    ),
    "copied",
  );
  assert.equal(copied, "Score 75\nhttps://example.com/");
});
test("blocked or absent APIs offer manual copying", async () => {
  assert.equal(await shareOrCopy({}, {}), "manual");
  assert.equal(
    await shareOrCopy(
      {},
      {
        copy: async () => {
          throw new Error("Blocked");
        },
      },
    ),
    "manual",
  );
  assert.equal(
    await shareOrCopy(
      {},
      {
        share: async () => {
          throw new Error("Blocked");
        },
      },
    ),
    "manual",
  );
});
