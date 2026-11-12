import {
  animatedNeedle,
  animatedReading,
  gaugeAngle,
  gaugeState,
} from "./lib/gauge.ts";

export function createGauge() {
  const section = document.getElementById("gauge-section");
  const score = document.getElementById("score");
  const needle = document.getElementById("gauge-needle");
  const stateText = document.getElementById("gauge-state");
  const announcement = document.getElementById("gauge-announcement");
  const pause = document.getElementById("gauge-pause");
  const replay = document.getElementById("gauge-replay");
  const ribbon = document.getElementById("unofficial-ribbon");
  if (
    !section ||
    !score ||
    !needle ||
    !stateText ||
    !pause ||
    !replay ||
    !announcement
  )
    return { animate: (_value: number | null) => {} };
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  let target: number | null =
    section.dataset.score === "" ? null : Number(section.dataset.score);
  let frame = 0;
  let elapsed = 0;
  let previous = 0;
  let userPaused = false;
  let visible = true;
  let currentLabel = "";
  let complete = false;
  const duration = 2800;

  function label(value: number | null) {
    const state = gaugeState(value);
    section!.dataset.level = state.level;
    if (state.label === currentLabel) return;
    currentLabel = state.label;
    const letters = [...state.label].map((character, index) => {
      const letter = document.createElement("span");
      letter.className = "status-letter";
      letter.textContent = character === " " ? "\u00a0" : character;
      letter.style.setProperty("--letter-delay", `${index * 12}ms`);
      return letter;
    });
    stateText!.replaceChildren(...letters);
  }
  function display(value: number | null, angleValue = value ?? 0) {
    score!.textContent = value === null ? "—" : String(value);
    document
      .getElementById("gauge-progress")
      ?.setAttribute("stroke-dasharray", `${value ?? 0} 100`);
    needle!.setAttribute(
      "transform",
      `rotate(${gaugeAngle(angleValue)} 400 310)`,
    );
    label(value);
  }
  function finish() {
    display(target);
    complete = true;
    section!.dataset.settled = String(!media.matches);
    section!.dataset.ribbon =
      media.matches || userPaused || !visible || document.hidden
        ? "fixed"
        : "repairing";
    frame = 0;
    const state = gaugeState(target);
    const message =
      target === null
        ? "Fireship Index unavailable."
        : `Fireship Index ${target} out of 100. ${state.label}.`;
    section!.setAttribute("aria-label", message);
    announcement!.textContent = message;
  }
  function tick(timestamp: number) {
    if (userPaused || !visible || document.hidden) {
      frame = 0;
      previous = 0;
      return;
    }
    if (previous) elapsed += Math.min(64, timestamp - previous);
    previous = timestamp;
    const progress = Math.min(1, elapsed / duration);
    const value = animatedReading(target ?? 0, Math.min(1, progress / 0.82));
    display(value, animatedNeedle(target ?? 0, progress));
    if (progress === 1) finish();
    else frame = requestAnimationFrame(tick);
  }
  function synchronize() {
    const paused = userPaused || media.matches || !visible || document.hidden;
    section!.dataset.paused = String(paused);
    pause!.setAttribute("aria-pressed", String(userPaused));
    pause!.setAttribute(
      "aria-label",
      userPaused ? "Resume animations" : "Pause animations",
    );
    if (paused) {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    } else if (!complete && !frame) frame = requestAnimationFrame(tick);
  }
  function animate(value: number | null, replay = false) {
    if (value === target && !replay && !userPaused) return;
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    elapsed = 0;
    complete = false;
    section!.dataset.settled = "false";
    section!.dataset.ribbon = "waiting";
    target = value;
    section!.dataset.score = value?.toString() ?? "";
    if (
      media.matches ||
      userPaused ||
      !visible ||
      document.hidden ||
      target === null ||
      target === 0
    ) {
      finish();
      synchronize();
    } else {
      display(0);
      synchronize();
    }
  }
  ribbon?.addEventListener("animationend", (event) => {
    if (event.animationName === "ribbon-repair")
      section!.dataset.ribbon = "fixed";
  });
  pause.hidden = media.matches;
  replay.hidden = media.matches;
  pause.addEventListener("click", () => {
    userPaused = !userPaused;
    synchronize();
  });
  replay.addEventListener("click", () => {
    userPaused = false;
    animate(target, true);
  });
  document.addEventListener("visibilitychange", synchronize);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      synchronize();
    },
    { threshold: 0.05 },
  ).observe(section);
  media.addEventListener("change", () => {
    pause.hidden = media.matches;
    replay.hidden = media.matches;
    if (media.matches) {
      cancelAnimationFrame(frame);
      finish();
    }
    synchronize();
  });
  animate(target, true);
  return { animate };
}
