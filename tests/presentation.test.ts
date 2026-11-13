import test from "node:test";
import assert from "node:assert/strict";
import { calculateIndex, DAY } from "../src/index.ts";
import {
  sampleSummary,
  samplePeriod,
  matchReason,
  feedLine,
  feedStatusParts,
  checkedTime,
} from "../src/lib/presentation.ts";

test("sample summary uses the available count and includes older uploads", () => {
  const now = Date.UTC(2026, 10, 12);
  const video = (id: string, age: number) => ({
    id,
    title: "OpenAI news",
    description: "",
    published: new Date(now - age * DAY).toISOString(),
  });
  const index = calculateIndex(
    [video("abcdefghijk", 2), video("bcdefghijkl", 31)],
    now,
  );
  assert.equal(sampleSummary(index), "2 of the latest 2 videos cover AI.");
  assert.match(sampleSummary(calculateIndex([], now)), /No score yet/);
});
test("visible match evidence identifies both sources and handles no matches", () => {
  assert.equal(
    matchReason(["OpenAI"], ["Claude"]),
    "OpenAI in title · Claude in description",
  );
  assert.equal(matchReason([], ["Claude"]), "Claude in description");
  assert.equal(matchReason([], []), "");
  assert.doesNotMatch(matchReason(["OpenAI"], ["OpenAI", "Claude"]), /—/);
  assert.equal(
    matchReason(["Anthropic"], ["Anthropic"]),
    "Anthropic in title and description",
  );
  assert.equal(
    matchReason(["OpenAI", "GPT"], ["OpenAI", "Claude"]),
    "OpenAI in title and description · GPT in title · Claude in description",
  );
});
test("saved readings keep a specific UTC check time and missing-description limit", () => {
  const empty = calculateIndex([], Date.UTC(2026, 10, 12));
  const message = feedLine(empty, Date.UTC(2026, 10, 12, 3), true, 2);
  assert.match(message, /Couldn’t refresh. Showing the last available reading/);
  assert.match(message, /Nov 12, 2026/);
  assert.match(message, /UTC/);
  assert.match(message, /2 missing descriptions; titles used/);
  assert.doesNotMatch(
    feedLine(empty, Date.UTC(2026, 10, 12), false, 0),
    /could not|missing/,
  );
});

test("sample dates describe the available uploads and keep details out of the compact line", () => {
  const now = Date.UTC(2026, 10, 12);
  const index = calculateIndex(
    [
      {
        id: "abcdefghijk",
        title: "CSS",
        description: "",
        published: new Date(now - 45 * DAY).toISOString(),
      },
    ],
    now,
  );
  const period = samplePeriod(index);
  assert.match(period, /Sep 28, 2026/);
  assert.match(period, /45 days/);
  assert.match(period, /Nov 12, 2026/);
  const line = feedLine(index, now, false, 0);
  assert.match(line, /Sep 28/);
  assert.match(line, /Checked Nov 12, 2026/);
  assert.doesNotMatch(line, /Posting pace|—/);
});

test("checked time uses the requested local date and ends with a zone label", () => {
  const timestamp = Date.UTC(2026, 10, 12, 3);
  const india = checkedTime(timestamp, {
    timeZone: "Asia/Kolkata",
    locale: "en-IN",
  });
  assert.match(india, /8:30/);
  assert.match(india, /(?:IST|GMT\+5:30)$/);
  const chicago = checkedTime(timestamp, {
    timeZone: "America/Chicago",
    locale: "en-US",
  });
  assert.match(chicago, /Nov 11, 2026/);
  assert.match(chicago, /9:00/);
  assert.match(chicago, /(?:CST|GMT-6)$/);
  assert.match(checkedTime(timestamp), /UTC$/);
});
test("checked time follows daylight saving without a fixed abbreviation", () => {
  const options = { timeZone: "America/Chicago", locale: "en-US" };
  assert.match(
    checkedTime(Date.UTC(2026, 0, 12, 12), options),
    /6:00.*(?:CST|GMT-6)$/,
  );
  assert.match(
    checkedTime(Date.UTC(2026, 6, 12, 12), options),
    /7:00.*(?:CDT|GMT-5)$/,
  );
});
test("local feed status preserves stale and missing-description notices", () => {
  const now = Date.UTC(2026, 10, 12, 3);
  const index = calculateIndex([], now);
  const line = feedLine(index, now, true, 2, {
    timeZone: "Asia/Kolkata",
    locale: "en-IN",
  });
  assert.match(line, /8:30/);
  assert.match(line, /(?:IST|GMT\+5:30) · Couldn’t refresh/);
  assert.match(line, /2 missing descriptions/);
});

test("feed status exposes a raw timestamp and notices without parsing display text", () => {
  const timestamp = Date.UTC(2026, 10, 12, 3);
  const parts = feedStatusParts(
    calculateIndex([], timestamp),
    timestamp,
    true,
    2,
  );
  assert.equal(parts.checkedAt, "2026-11-12T03:00:00.000Z");
  assert.equal(parts.prefix, "Checked ");
  assert.match(parts.checked, /UTC$/);
  assert.equal(
    parts.suffix,
    " · Couldn’t refresh. Showing the last available reading. · 2 missing descriptions; titles used",
  );
});
