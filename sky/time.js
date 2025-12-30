import { SKY_STATES } from "./atmosphere.js";

let time = 0;
const SPEED = 0.00005;

export function updateTime() {
  time += SPEED;
  return time;
}

export function getSkyBlend(t) {
  const phase = (Math.sin(t) + 1) / 2;

  if (phase < 0.33) {
    return {
      a: SKY_STATES[0],
      b: SKY_STATES[1],
      t: phase / 0.33
    };
  } else if (phase < 0.66) {
    return {
      a: SKY_STATES[1],
      b: SKY_STATES[2],
      t: (phase - 0.33) / 0.33
    };
  } else {
    return {
      a: SKY_STATES[2],
      b: SKY_STATES[0],
      t: (phase - 0.66) / 0.34
    };
  }
}
