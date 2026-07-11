import { createWindowTracker } from "../src/index.ts";

const output = document.querySelector<HTMLPreElement>("#state");
const panel = document.querySelector<HTMLDivElement>(".panel");
const arrow = document.querySelector<HTMLDivElement>("#arrow");
const angle = document.querySelector<HTMLSpanElement>("#angle");
const position = document.querySelector<HTMLSpanElement>("#position");
const speed = document.querySelector<HTMLSpanElement>("#speed");
const accel = document.querySelector<HTMLSpanElement>("#accel");
const shake = document.querySelector<HTMLSpanElement>("#shake");

const tracker = createWindowTracker();

if (!tracker.supportsWinertia) {
  if (output) output.textContent = "This device is not supported.";
  if (panel) panel.style.opacity = "0.3";
}

const loop = () => {
  if (!tracker.supportsWinertia) return;
  const state = tracker.update(performance.now(), 4000);

  if (state) {
    const { direction, coord, velocity, acceleration, shakeCount } = state;

    if (output) output.textContent = JSON.stringify(state, null, 2);

    if (arrow) {
      arrow.style.transform = `rotate(${-direction.angleDeg}deg)`;
      arrow.classList.toggle("idle", direction.idle);
    }

    if (angle) angle.textContent = direction.angleDeg.toFixed(0);

    if (position) {
      position.textContent = `${coord.x.toFixed(0)}, ${coord.y.toFixed(0)}`;
    }

    if (speed) speed.textContent = velocity.speed.toFixed(0);

    if (accel) accel.textContent = acceleration.magnitude.toFixed(0);

    if (shake) shake.textContent = String(shakeCount);
  }

  requestAnimationFrame(loop);
};

requestAnimationFrame(loop);
