import test from "node:test";
import assert from "node:assert/strict";
import {
  animatedReading,
  animatedNeedle,
  gaugeAngle,
  gaugePoint,
  gaugeState,
} from "../src/lib/gauge.ts";

test("gauge levels follow score thresholds and preserve missing data", () => {
  assert.equal(gaugeState(null).level, "unknown");
  assert.equal(gaugeState(0).level, "stable");
  assert.equal(gaugeState(24).level, "stable");
  assert.equal(gaugeState(25).level, "watch");
  assert.equal(gaugeState(50).level, "danger");
  assert.equal(gaugeState(75).level, "critical");
  assert.equal(gaugeState(100).label, "DOOMSDAY APPROACHES");
});
test("dial angles stay within the meter endpoints", () => {
  assert.equal(gaugeAngle(-10), 140);
  assert.equal(gaugeAngle(0), 140);
  assert.equal(gaugeAngle(50), 270);
  assert.equal(gaugeAngle(100), 400);
  assert.equal(gaugeAngle(110), 400);
  assert.ok(Math.abs(gaugePoint(50, 200).x - 400) < 0.001);
  assert.equal(gaugePoint(50, 200).y, 110);
});
test("animated numbers increase monotonically and finish at the actual score", () => {
  for (const target of [0, 24, 49, 73, 100]) {
    const frames = Array.from({ length: 101 }, (_, i) =>
      animatedReading(target, i / 100),
    );
    assert.equal(frames[0], 0);
    assert.equal(frames[100], target);
    assert.ok(
      frames.every(
        (value, i) =>
          value >= 0 && value <= target && (i === 0 || value >= frames[i - 1]),
      ),
    );
  }
});

test("needle overshoots briefly, settles exactly, and stays within the dial", () => {
  assert.equal(animatedNeedle(79, 0), 0);
  assert.ok(animatedNeedle(79, 0.85) > 79);
  assert.equal(animatedNeedle(79, 1), 79);
  assert.equal(animatedNeedle(0, 0.85), 0);
  for (const target of [0, 25, 79, 100]) {
    for (let frame = 0; frame <= 100; frame++) {
      const value = animatedNeedle(target, frame / 100);
      assert.ok(value >= 0 && value <= 100);
    }
  }
});
