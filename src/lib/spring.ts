/** Apple-style fluid motion helpers (WWDC Designing Fluid Interfaces). */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Exponential-decay projection. `decelerationRate` ≈ 0.998 for scroll, 0.99 for snappier. */
export function project(velocity: number, decelerationRate = 0.998): number {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

/** Progressive resistance past a bound. */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55,
): number {
  if (dimension <= 0) return 0;
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

export function rubberbandT(t: number, min = 0, max = 1, dimension = 1): number {
  if (t < min) return min - rubberband(min - t, dimension);
  if (t > max) return max + rubberband(t - max, dimension);
  return t;
}

/**
 * Step a damped harmonic spring toward `target`.
 * `damping` 1.0 = critical (no bounce). ~0.8 = flick overshoot.
 * `response` is Apple's settle-feel in seconds (not a fixed duration).
 */
export function springStep(
  current: number,
  target: number,
  velocity: number,
  dt: number,
  damping = 1,
  response = 0.4,
): { value: number; velocity: number } {
  const omega = (2 * Math.PI) / Math.max(0.08, response);
  const zeta = damping;
  const x = current - target;
  const accel = -(omega * omega) * x - 2 * zeta * omega * velocity;
  const nextVelocity = velocity + accel * dt;
  return {
    value: current + nextVelocity * dt,
    velocity: nextVelocity,
  };
}

export function settled(current: number, target: number, velocity: number): boolean {
  return Math.abs(current - target) < 0.0008 && Math.abs(velocity) < 0.02;
}
