import { drawGradient } from "./sky/gradient.js";
import { drawStars } from "./sky/stars.js";
import { updateTime, getSkyBlend } from "./sky/time.js";
import { lerp } from "./utils/math.js";

const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function loop() {
  const t = updateTime();
  const { a, b, t: blend } = getSkyBlend(t);

  drawGradient(ctx, canvas.width, canvas.height, a, b, blend);

  const starAlpha = lerp(a.stars, b.stars, blend);
  drawStars(ctx, canvas.width, canvas.height, starAlpha);

  requestAnimationFrame(loop);
}

loop();
