const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");
const clock = document.getElementById("clock");

const menu = document.getElementById("menu");
const menuToggle = document.getElementById("menu-toggle");
const timeMode = document.getElementById("time-mode");
const timeModeButtons = Array.from(timeMode.querySelectorAll(".segment"));
const showTimeInput = document.getElementById("show-time");

const simSpeedInput = document.getElementById("sim-speed");
const simSpeedValue = document.getElementById("sim-speed-value");
const starDensityInput = document.getElementById("star-density");
const starDensityValue = document.getElementById("star-density-value");
const twinkleSpeedInput = document.getElementById("twinkle-speed");
const twinkleSpeedValue = document.getElementById("twinkle-speed-value");

const state = {
  mode: "real",
  simSpeed: Number(simSpeedInput.value),
  starCount: Number(starDensityInput.value),
  twinkleSpeed: Number(twinkleSpeedInput.value),
  showTime: showTimeInput.checked
};

let stars = [];
let lastFrame = performance.now();
let simTime = 0;
let lastMeteorSpawn = performance.now();
const meteors = [];

const meteorTiers = [
  { name: "common", 
    chance: 0.7, 
    speed: [800, 1100], 
    size: [1.2, 1.8], 
    life: [0.7, 1.1], 
    glow: 0.4 
  },

  { name: "rare", 
    chance: 0.22, 
    speed: [1100, 1500], 
    size: [1.6, 2.4], 
    life: [0.9, 1.4], 
    glow: 0.55 
  },

  { name: "legendary", 
    chance: 0.08, 
    speed: [1500, 1900], 
    size: [2.2, 3.2], 
    life: [1.2, 1.8], 
    glow: 0.7 
  }
];

const skyKeyframes = [
  { t: 0, 
    top: "#0a0f2b", 
    bottom: "#050814" 
  },

  { t: 5 / 24, 
    top: "#1b2a5b", 
    bottom: "#0d1230" 
  },

  { t: 6.5 / 24, 
    top: "#5c4a6f", 
    bottom: "#1c2345" 
  },

  { t: 7.5 / 24, 
    top: "#ff9b6a", 
    bottom: "#ffd1a8" 
  },

  { t: 12 / 24, 
    top: "#7ec8ff", 
    bottom: "#cfe9ff" 
  },

  { t: 17 / 24, 
    top: "#78c0ff", 
    bottom: "#c7e5ff" 
  },

  { t: 18.5 / 24, 
    top: "#ff9b6a", 
    bottom: "#ffd1a8" 
  },

  { t: 19.5 / 24, 
    top: "#3a2c5e", 
    bottom: "#120f2b" 

  },

  { t: 1, 
    top: "#0a0f2b", 
    bottom: "#050814" 

  }
];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  seedStars();
}

window.addEventListener("resize", resize);
resize();

function seedStars() {
  stars = Array.from({ length: state.starCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.4 + 0.2,
    twinkle: Math.random() * Math.PI * 2
  }));
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function getRealDayProgress() {
  const now = new Date();
  return (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) / 24;
}

function getTimeInfo(deltaSeconds) {
  if (state.mode === "real") {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return {
      progress: getRealDayProgress(),
      label: `${pad2(hours)}:${pad2(minutes)}`
    };
  }

  const minutesPerSecond = state.simSpeed;
  const dayDelta = (deltaSeconds * minutesPerSecond) / (24 * 60);
  simTime = (simTime + dayDelta) % 1;
  const totalMinutes = Math.floor(simTime * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return {
    progress: simTime,
    label: `${pad2(hours)}:${pad2(minutes)}`
  };
}

// blend colors
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColorHex(a, b, t) {
  const c1 = parseInt(a.slice(1), 16);
  const c2 = parseInt(b.slice(1), 16);
  const r = Math.round(((c1 >> 16) & 255) * (1 - t) + ((c2 >> 16) & 255) * t);
  const g = Math.round(((c1 >> 8) & 255) * (1 - t) + ((c2 >> 8) & 255) * t);
  const bval = Math.round((c1 & 255) * (1 - t) + (c2 & 255) * t);
  return `rgb(${r},${g},${bval})`;
}

function getSkyColors(progress) {
  for (let i = 0; i < skyKeyframes.length - 1; i += 1) {
    const current = skyKeyframes[i];
    const next = skyKeyframes[i + 1];
    if (progress >= current.t && progress <= next.t) {
      const t = (progress - current.t) / (next.t - current.t);
      return {
        top: lerpColorHex(current.top, next.top, t),
        bottom: lerpColorHex(current.bottom, next.bottom, t)
      };
    }
  }
  return skyKeyframes[skyKeyframes.length - 1];
}

function getNightFactor(progress) {
  const cycle = Math.sin((progress - 0.25) * Math.PI * 2);
  const daylight = Math.max(0, cycle);
  return Math.pow(1 - daylight, 1.4);
}

function drawGradient(progress) {
  const colors = getSkyColors(progress);
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, colors.top);
  grad.addColorStop(1, colors.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawStars(nightFactor) {
  if (nightFactor <= 0.01) {
    return;
  }
  ctx.fillStyle = "white";
  ctx.globalAlpha = nightFactor * 0.9;
  const twinkleStep = state.twinkleSpeed / 2000;
  for (const star of stars) {
    star.twinkle += twinkleStep;
    const size = star.size * (0.6 + 0.5 * Math.sin(star.twinkle));
    ctx.beginPath();
    ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSunGlow(progress) {
  const dayFactor = 1 - getNightFactor(progress);
  if (dayFactor < 0.1) return;
  
  const sunRise = 6.5 / 24;
  const sunSet = 18.5 / 24;
  
  if (progress < sunRise || progress > sunSet) return;
  
  const sunProgress = (progress - sunRise) / (sunSet - sunRise);
  const arc = Math.PI;
  const angle = sunProgress * arc;
  const sunX = canvas.width * 0.2 + Math.cos(Math.PI - angle) * canvas.width * 0.6;
  const sunY = canvas.height * 0.85 - Math.sin(Math.PI - angle) * canvas.height * 0.55;
  
  const isDawn = progress < 8 / 24;
  const isDusk = progress > 17 / 24;
  
  if (isDawn || isDusk) {
    const intensity = isDawn ? (progress - sunRise) / (8 / 24 - sunRise) : 1 - (progress - 17 / 24) / (sunSet - 17 / 24);
    const grad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 350);
    grad.addColorStop(0, `rgba(255, 200, 120, ${intensity * 0.08})`);
    grad.addColorStop(0.3, `rgba(255, 160, 100, ${intensity * 0.04})`);
    grad.addColorStop(1, "rgba(255, 140, 80, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function chooseMeteorTier() {
  const roll = Math.random();
  let total = 0;
  for (const tier of meteorTiers) {
    total += tier.chance;
    if (roll <= total) {
      return tier;
    }
  }
  return meteorTiers[0];
}

function spawnMeteor() {
  const tier = chooseMeteorTier();
  const startX = randRange(-0.1 * canvas.width, 0.8 * canvas.width);
  const startY = randRange(-0.2 * canvas.height, 0.3 * canvas.height);
  const angle = randRange(Math.PI * 0.1, Math.PI * 0.25);
  const slowStreak = Math.random() < 0.22;
  const speed = randRange(tier.speed[0], tier.speed[1]) * (slowStreak ? 0.55 : 1);
  const life = randRange(tier.life[0], tier.life[1]) * (slowStreak ? 1.4 : 1);
  meteors.push({
    x: startX,
    y: startY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life,
    age: 0,
    size: randRange(tier.size[0], tier.size[1]),
    glow: tier.glow
  });
}

function updateMeteors(deltaSeconds) {
  for (let i = meteors.length - 1; i >= 0; i -= 1) {
    const meteor = meteors[i];
    meteor.age += deltaSeconds;
    meteor.x += meteor.vx * deltaSeconds;
    meteor.y += meteor.vy * deltaSeconds;
    if (meteor.age > meteor.life) {
      meteors.splice(i, 1);
    }
  }
}

function drawMeteors() {
  for (const meteor of meteors) {
    const lifeProgress = meteor.age / meteor.life;
    const alpha = (1 - lifeProgress) * meteor.glow;
    const tailLength = 180 * (1 - lifeProgress);
    const tailX = meteor.x - meteor.vx * (tailLength / 1000);
    const tailY = meteor.y - meteor.vy * (tailLength / 1000);

    const grad = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = meteor.size;
    ctx.beginPath();
    ctx.moveTo(meteor.x, meteor.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(meteor.x, meteor.y, meteor.size * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function updateClock(label) {
  clock.textContent = label;
  clock.style.display = state.showTime ? "inline-flex" : "none";
}

function updateMenuState() {
  menu.classList.toggle("open", menuToggle.getAttribute("aria-expanded") === "true");
}

function syncModeControls() {
  const isSim = state.mode === "sim";
  simSpeedInput.disabled = !isSim;
  simSpeedValue.style.opacity = isSim ? "1" : "0.5";
  timeModeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.setAttribute("aria-pressed", String(isActive));
  });
}

menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  updateMenuState();
});

timeModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    if (state.mode === "sim") {
      simTime = getRealDayProgress();
    }
    syncModeControls();
  });
});

simSpeedInput.addEventListener("input", (event) => {
  state.simSpeed = Number(event.target.value);
  simSpeedValue.textContent = String(state.simSpeed);
});

starDensityInput.addEventListener("input", (event) => {
  state.starCount = Number(event.target.value);
  starDensityValue.textContent = String(state.starCount);
  seedStars();
});

twinkleSpeedInput.addEventListener("input", (event) => {
  state.twinkleSpeed = Number(event.target.value);
  twinkleSpeedValue.textContent = String(state.twinkleSpeed);
});

showTimeInput.addEventListener("change", (event) => {
  state.showTime = event.target.checked;
});

updateMenuState();
syncModeControls();
simSpeedValue.textContent = String(state.simSpeed);
starDensityValue.textContent = String(state.starCount);
twinkleSpeedValue.textContent = String(state.twinkleSpeed);
seedStars();

function loop(timestamp) {
  const deltaSeconds = (timestamp - lastFrame) / 1000;
  lastFrame = timestamp;
  const timeInfo = getTimeInfo(deltaSeconds);
  drawGradient(timeInfo.progress);
  drawSunGlow(timeInfo.progress);
  const nightFactor = getNightFactor(timeInfo.progress);
  drawStars(nightFactor);
  if (nightFactor > 0.2) {
    const spawnInterval = 6500 - nightFactor * 2500;
    if (timestamp - lastMeteorSpawn > spawnInterval && Math.random() < 0.12) {
      spawnMeteor();
      lastMeteorSpawn = timestamp;
    }
  }
  updateMeteors(deltaSeconds);
  drawMeteors();
  updateClock(timeInfo.label);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);