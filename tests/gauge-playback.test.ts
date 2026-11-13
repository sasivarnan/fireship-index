import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createGauge } from "../src/gauge-animation.ts";

class GaugeElement {
  textContent = "";
  hidden = false;
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  listeners = new Map<string, () => void>();
  style = { setProperty() {} };
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  replaceChildren() {}
  addEventListener(name: string, listener: () => void) {
    this.listeners.set(name, listener);
  }
  click() {
    this.listeners.get("click")?.();
  }
}

function setup(t: TestContext, reducedMotion = false) {
  const elements = new Map(
    [
      "gauge-section",
      "score",
      "gauge-needle",
      "gauge-state",
      "gauge-announcement",
      "gauge-pause",
      "gauge-replay",
      "gauge-progress",
      "status-ribbon",
    ].map((id) => [id, new GaugeElement()]),
  );
  const get = (id: string) => elements.get(id)!;
  get("gauge-section").dataset.score = "79";
  let nextFrame = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const globals = {
    document: {
      hidden: false,
      getElementById: get,
      createElement: () => new GaugeElement(),
      addEventListener() {},
    },
    matchMedia: () => ({ matches: reducedMotion, addEventListener() {} }),
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      const id = ++nextFrame;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    IntersectionObserver: class {
      observe() {}
    },
  };
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  const gauge = createGauge();
  function finish() {
    for (let time = 20; time <= 4000; time += 20) {
      const pending = [...frames.values()];
      frames.clear();
      for (const callback of pending) callback(time);
    }
  }
  return { gauge, get, frames, finish };
}

test("refresh while paused preserves the actual score and pause state", (t) => {
  const { gauge, get, frames, finish } = setup(t);
  finish();
  get("gauge-pause").click();
  gauge.animate(79);
  assert.equal(get("score").textContent, "79");
  assert.equal(get("gauge-section").dataset.paused, "true");
  assert.equal(frames.size, 0);
  gauge.animate(84);
  assert.equal(get("score").textContent, "84");
  assert.equal(get("gauge-section").dataset.ribbon, "fixed");
  assert.match(
    get("gauge-section").attributes.get("aria-label")!,
    /84 out of 100/,
  );
  assert.equal(frames.size, 0);
});

test("unchanged refresh leaves a completed gauge still", (t) => {
  const { gauge, get, frames, finish } = setup(t);
  finish();
  gauge.animate(79);
  assert.equal(get("score").textContent, "79");
  assert.equal(get("gauge-section").dataset.settled, "true");
  assert.equal(frames.size, 0);
});

test("refresh during a paused reveal shows the final reading", (t) => {
  const { gauge, get, frames } = setup(t);
  get("gauge-pause").click();
  gauge.animate(79);
  assert.equal(get("score").textContent, "79");
  assert.equal(frames.size, 0);
});

test("Replay explicitly restarts and resumes a paused gauge", (t) => {
  const { get, finish } = setup(t);
  finish();
  get("gauge-pause").click();
  get("gauge-replay").click();
  assert.equal(get("score").textContent, "0");
  assert.equal(get("gauge-section").dataset.paused, "false");
  finish();
  assert.equal(get("score").textContent, "79");
});

test("ribbon adjustment waits for the gauge to settle", (t) => {
  const { get, finish } = setup(t);
  assert.equal(get("gauge-section").dataset.ribbon, "waiting");
  finish();
  assert.equal(get("score").textContent, "79");
  assert.equal(get("gauge-section").dataset.ribbon, "repairing");
});
test("reduced motion reveals a fixed ribbon without playback", (t) => {
  const { get, frames } = setup(t, true);
  assert.equal(get("score").textContent, "79");
  assert.equal(get("gauge-section").dataset.ribbon, "fixed");
  assert.equal(frames.size, 0);
});
