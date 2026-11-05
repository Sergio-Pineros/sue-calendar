import { clamp, project, rubberband, rubberbandT, settled, springStep } from "./spring";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runSpringTests(): void {
  assert(clamp(5, 0, 3) === 3, "clamp high");
  assert(clamp(-2, 0, 3) === 0, "clamp low");
  assert(project(0) === 0, "no velocity projects nowhere");
  assert(project(1000) > 0, "positive velocity projects forward");
  assert(project(-1000) < 0, "negative velocity projects backward");
  const far = project(2000, 0.998);
  const near = project(2000, 0.99);
  assert(far > near, "0.998 coasts farther than 0.99");

  const soft = rubberband(40, 100);
  assert(soft > 0 && soft < 40, "rubberband resists");
  assert(rubberband(80, 100) < 80, "more overshoot still resists");
  assert(rubberbandT(-0.2) < 0 && rubberbandT(-0.2) > -0.2, "t rubberbands below 0");
  assert(rubberbandT(1.2) > 1 && rubberbandT(1.2) < 1.2, "t rubberbands above 1");
  assert(rubberbandT(0.4) === 0.4, "inside range is 1:1");

  let value = 0;
  let velocity = 0;
  for (let i = 0; i < 90; i += 1) {
    const next = springStep(value, 1, velocity, 1 / 60, 1, 0.35);
    value = next.value;
    velocity = next.velocity;
  }
  assert(Math.abs(value - 1) < 0.02, "critical spring settles on target");
  assert(settled(1, 1, 0), "settled helper");

  console.log("spring: all checks passed");
}

runSpringTests();
