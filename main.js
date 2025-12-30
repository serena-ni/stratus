const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// sky colors
const sky_states = [
  { top: "#64b4ff", bottom: "#b4dcff" }, // day
  { top: "#ff7878", bottom: "#ffb464" }, // dusk
  { top: "#141e46", bottom: "#050a19" }  // night
];

// stars
const star_count = 300;
const stars = Array.from({ length: star_count }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 1.2 + 0.4,
  twinkle: Math.random() * Math.PI * 2
}));

// time
let time = 0;
const time_speed = 0.00005; // slower
function update_time() { time += time_speed; return time; }
function get_formatted_time() {
  const n = time % 1;
  const h = Math.floor(n * 24);
  const m = Math.floor((n * 24 * 60) % 60);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

// helpers
function lerp(a,b,t){return a+(b-a)*t;}
function lerp_color_hex(a,b,t){
  const c1 = parseInt(a.slice(1),16);
  const c2 = parseInt(b.slice(1),16);
  const r = Math.round(((c1>>16)&255)*(1-t)+((c2>>16)&255)*t);
  const g = Math.round(((c1>>8)&255)*(1-t)+((c2>>8)&255)*t);
  const bval = Math.round((c1&255)*(1-t)+(c2&255)*t);
  return `rgb(${r},${g},${bval})`;
}

// draw gradient
function draw_gradient(){
  const day_progress = time % 1;
  let top,bottom;
  if(day_progress<0.33){
    const t = day_progress/0.33;
    top = lerp_color_hex(sky_states[0].top, sky_states[1].top, t);
    bottom = lerp_color_hex(sky_states[0].bottom, sky_states[1].bottom, t);
  } else if(day_progress<0.66){
    const t = (day_progress-0.33)/0.33;
    top = lerp_color_hex(sky_states[1].top, sky_states[2].top, t);
    bottom = lerp_color_hex(sky_states[1].bottom, sky_states[2].bottom, t);
  } else {
    const t = (day_progress-0.66)/0.34;
    top = lerp_color_hex(sky_states[2].top, sky_states[0].top, t);
    bottom = lerp_color_hex(sky_states[2].bottom, sky_states[0].bottom, t);
  }
  const grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

// draw stars
function draw_stars(){
  const star_alpha = 0.5;
  ctx.fillStyle = "white";
  ctx.globalAlpha = star_alpha;
  for(const s of stars){
    s.twinkle += 0.01;
    const size = s.size * (0.5 + 0.5 * Math.sin(s.twinkle));
    ctx.beginPath();
    ctx.arc(s.x, s.y, size, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// draw time
function draw_time(){
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "16px monospace";
  ctx.fillText(get_formatted_time(), 16, 24);
}

// main loop
function loop(){
  update_time();
  draw_gradient();
  draw_stars();
  draw_time();
  requestAnimationFrame(loop);
}

loop();
