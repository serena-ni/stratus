import { lerp } from "../utils/math.js";
import { mulberry32 } from "../utils/random.js";

const STAR_COUNT = 300;
const seed = Math.floor(Math.random() * 100000);
const rand = mulberry32(seed);

const stars = Array.from({ length: STAR_COUNT }, () => ({
  x: rand(),
  y: rand(),
  size: rand() * 1.5 + 0.5,
  twinkle: rand() * Math.PI * 2
}));

export function drawStars(ctx, width, height, alpha) {
  if (alpha <= 0) return;

  for (const star of stars) {
    star.twinkle += 0.02;
    const brightness = (Math.sin(star.twinkle) + 1) / 2;

    ctx.globalAlpha = lerp(0, alpha, brightness);
    ctx.fillStyle = "white";

    ctx.beginPath();
    ctx.arc(
      star.x * width,
      star.y * height,
      star.size,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
