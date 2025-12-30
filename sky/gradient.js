import { lerpColor, rgb } from "../utils/math.js";

export function drawGradient(ctx, width, height, stateA, stateB, t) {
  const top = lerpColor(stateA.top, stateB.top, t);
  const bottom = lerpColor(stateA.bottom, stateB.bottom, t);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, rgb(top));
  gradient.addColorStop(1, rgb(bottom));

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
