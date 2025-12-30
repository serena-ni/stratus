export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpColor(c1, c2, t) {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t))
  };
}

export function rgb(c) {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}
