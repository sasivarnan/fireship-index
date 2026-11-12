export type GaugeLevel = "unknown" | "stable" | "watch" | "danger" | "critical";

export function gaugeState(value: number | null): {
  level: GaugeLevel;
  label: string;
} {
  if (value === null || !Number.isFinite(value))
    return { level: "unknown", label: "SIGNAL LOST" };
  if (value < 25) return { level: "stable", label: "STILL EMPLOYABLE" };
  if (value < 50) return { level: "watch", label: "REMAIN CALM. PROBABLY." };
  if (value < 75) return { level: "danger", label: "HUMANITY: ON NOTICE" };
  return {
    level: "critical",
    label: value < 90 ? "WE MIGHT BE COOKED" : "DOOMSDAY APPROACHES",
  };
}

export function gaugeAngle(value: number): number {
  return 140 + Math.max(0, Math.min(100, value)) * 2.6;
}

export function gaugePoint(
  value: number,
  radius: number,
): { x: number; y: number } {
  const angle = (gaugeAngle(value) * Math.PI) / 180;
  return {
    x: 400 + Math.cos(angle) * radius,
    y: 310 + Math.sin(angle) * radius,
  };
}

export function animatedReading(target: number, progress: number): number {
  const normalized = Math.max(0, Math.min(1, progress));
  return Math.round(
    Math.max(0, Math.min(100, target)) * (1 - (1 - normalized) ** 3),
  );
}

export function animatedNeedle(target: number, progress: number): number {
  const bounded = Math.max(0, Math.min(100, target));
  const normalized = Math.max(0, Math.min(1, progress));
  if (normalized <= 0.82) return bounded * (1 - (1 - normalized / 0.82) ** 3);
  const settle = (normalized - 0.82) / 0.18;
  return Math.max(
    0,
    Math.min(
      100,
      bounded +
        Math.sin(settle * Math.PI * 2) *
          Math.min(2.2, bounded / 10) *
          (1 - settle) ** 2,
    ),
  );
}
