const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");
const clock = document.getElementById("clock");
const menu = document.getElementById("menu");
const menuToggle = document.getElementById("menu-toggle");
const timeMode = document.getElementById("time-mode");
const timeModeButtons = Array.from(timeMode.querySelectorAll(".segment"));
const simSpeedInput = document.getElementById("sim-speed");
const simSpeedValue = document.getElementById("sim-speed-value");
const starDensityInput = document.getElementById("star-density");
const starDensityValue = document.getElementById("star-density-value");
const twinkleSpeedInput = document.getElementById("twinkle-speed");
const twinkleSpeedValue = document.getElementById("twinkle-speed-value");
const showTimeInput = document.getElementById("show-time");

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
const clouds = [];
const planets = [
  { name: "Venus", color: "#fff4e6", size: 1.4, rise: 5.5 / 24, set: 19 / 24, brightness: 0.5 },
  { name: "Jupiter", color: "#f4e4c1", size: 1.6, rise: 20 / 24, set: 6 / 24, brightness: 0.45 },
  { name: "Mars", color: "#ffb4a0", size: 1.2, rise: 22 / 24, set: 8 / 24, brightness: 0.4 }
];

const meteorTiers = [
  { name: "common", chance: 0.7, speed: [800, 1100], size: [1.2, 1.8], life: [0.7, 1.1], glow: 0.4 },
  { name: "rare", chance: 0.22, speed: [1100, 1500], size: [1.6, 2.4], life: [0.9, 1.4], glow: 0.55 },
  { name: "legendary", chance: 0.08, speed: [1500, 1900], size: [2.2, 3.2], life: [1.2, 1.8], glow: 0.7 }
];

const skyKeyframes = [
  { t: 0, top: "#0a0f2b", bottom: "#050814" },
  { t: 5 / 24, top: "#1b2a5b", bottom: "#0d1230" },
  { t: 6.5 / 24, top: "#5c4a6f", bottom: "#1c2345" },
  { t: 7.5 / 24, top: "#ff9b6a", bottom: "#ffd1a8" },
  { t: 12 / 24, top: "#7ec8ff", bottom: "#cfe9ff" },
  { t: 17 / 24, top: "#78c0ff", bottom: "#c7e5ff" },
  { t: 18.5 / 24, top: "#ff9b6a", bottom: "#ffd1a8" },
  { t: 19.5 / 24, top: "#3a2c5e", bottom: "#120f2b" },
  { t: 1, top: "#0a0f2b", bottom: "#050814" }
];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  seedStars();
  seedClouds();
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

function seedClouds() {
  clouds.length = 0;
  const layers = [
    { count: 4, speed: 8, yRange: [0.05, 0.25], scale: [0.8, 1.2], alpha: 0.04 },
    { count: 3, speed: 5, yRange: [0.2, 0.45], scale: [1.0, 1.5], alpha: 0.035 },
    { count: 3, speed: 3, yRange: [0.4, 0.65], scale: [1.2, 1.8], alpha: 0.025 }
  ];
  
  layers.forEach((layer) => {
    for (let i = 0; i < layer.count; i += 1) {
      clouds.push({
        x: Math.random() * canvas.width * 1.5 - canvas.width * 0.25,
        y: canvas.height * randRange(layer.yRange[0], layer.yRange[1]),
        scale: randRange(layer.scale[0], layer.scale[1]),
        speed: layer.speed,
        alpha: layer.alpha,
        offset: Math.random() * Math.PI * 2
      });
    }
  });
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

function getMoonPhase() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const knownNewMoon = new Date(2000, 0, 6, 18, 14);
  const diff = now - knownNewMoon;
  const daysSince = diff / (1000 * 60 * 60 * 24);
  const lunarCycle = 29.53058867;
  const phase = (daysSince % lunarCycle) / lunarCycle;
  return phase;
}

function drawMoon(progress) {
  const nightFactor = getNightFactor(progress);
  if (nightFactor < 0.15) return;
  
  const moonRise = 0.75;
  const moonSet = 0.35;
  let moonVisible = false;
  let moonProgress = 0;
  
  if (progress >= moonRise || progress <= moonSet) {
    moonVisible = true;
    if (progress >= moonRise) {
      moonProgress = (progress - moonRise) / (1 - moonRise + moonSet);
    } else {
      moonProgress = (progress + (1 - moonRise)) / (1 - moonRise + moonSet);
    }
  }
  
  if (!moonVisible) return;
  
  const arc = Math.PI;
  const angle = moonProgress * arc - arc / 2;
  const moonX = canvas.width * 0.5 + Math.cos(angle) * canvas.width * 0.4;
  const moonY = canvas.height * 0.3 - Math.sin(angle) * canvas.height * 0.25;
  const moonSize = 28;
  
  const phase = getMoonPhase();
  const alpha = Math.min(1, nightFactor * 1.2);
  
  ctx.save();
  ctx.globalAlpha = alpha * 0.15;
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonSize + 12, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillStyle = "#f9f6e8";
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
  ctx.fill();
  
  if (phase > 0.03 && phase < 0.97) {
    ctx.fillStyle = "rgba(10, 15, 43, 0.4)";
    ctx.beginPath();
    const shadowPhase = (phase - 0.5) * 2;
    if (phase < 0.5) {
      ctx.arc(moonX, moonY, moonSize, -Math.PI / 2, Math.PI / 2, false);
      ctx.ellipse(moonX, moonY, Math.abs(shadowPhase) * moonSize, moonSize, 0, Math.PI / 2, -Math.PI / 2, phase < 0.5);
    } else {
      ctx.arc(moonX, moonY, moonSize, Math.PI / 2, -Math.PI / 2, false);
      ctx.ellipse(moonX, moonY, Math.abs(shadowPhase) * moonSize, moonSize, 0, -Math.PI / 2, Math.PI / 2, phase > 0.5);
    }
    ctx.fill();
  }
  
  ctx.restore();
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

function drawPlanets(progress) {
  const nightFactor = getNightFactor(progress);
  if (nightFactor < 0.3) return;
  
  planets.forEach((planet) => {
    let visible = false;
    let planetProgress = 0;
    
    if (planet.set < planet.rise) {
      visible = progress >= planet.rise || progress <= planet.set;
      if (progress >= planet.rise) {
        planetProgress = (progress - planet.rise) / (1 - planet.rise + planet.set);
      } else {
        planetProgress = (progress + (1 - planet.rise)) / (1 - planet.rise + planet.set);
      }
    } else {
      visible = progress >= planet.rise && progress <= planet.set;
      planetProgress = (progress - planet.rise) / (planet.set - planet.rise);
    }
    
    if (!visible) return;
    
    const arc = Math.PI * 0.6;
    const angle = planetProgress * arc + Math.PI * 0.2;
    const x = canvas.width * 0.5 + Math.cos(Math.PI - angle) * canvas.width * 0.45;
    const y = canvas.height * 0.25 - Math.sin(Math.PI - angle) * canvas.height * 0.15;
    
    ctx.save();
    ctx.globalAlpha = nightFactor * planet.brightness * 0.6;
    
    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, planet.size * 2.5);
    glowGrad.addColorStop(0, planet.color);
    glowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, planet.size * 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = planet.color;
    ctx.beginPath();
    ctx.arc(x, y, planet.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });
}

function updateClouds(deltaSeconds) {
  clouds.forEach((cloud) => {
    cloud.x += cloud.speed * deltaSeconds;
    if (cloud.x > canvas.width + 200) {
      cloud.x = -200;
    }
  });
}

function drawClouds(progress) {
  const dayFactor = 1 - getNightFactor(progress);
  const baseAlpha = 0.15 + dayFactor * 0.25;
  
  clouds.forEach((cloud) => {
    ctx.save();
    ctx.globalAlpha = cloud.alpha * baseAlpha;
    ctx.fillStyle = "#ffffff";
    
    const offsetX = Math.sin(cloud.offset) * 20;
    const x = cloud.x + offsetX;
    const y = cloud.y;
    const scale = cloud.scale;
    
    ctx.beginPath();
    ctx.arc(x, y, 40 * scale, 0, Math.PI * 2);
    ctx.arc(x + 35 * scale, y - 10 * scale, 50 * scale, 0, Math.PI * 2);
    ctx.arc(x + 70 * scale, y, 40 * scale, 0, Math.PI * 2);
    ctx.arc(x + 90 * scale, y + 10 * scale, 35 * scale, 0, Math.PI * 2);
    ctx.arc(x + 50 * scale, y + 15 * scale, 45 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    cloud.offset += 0.002;
  });
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
  drawClouds(timeInfo.progress);
  const nightFactor = getNightFactor(timeInfo.progress);
  drawPlanets(timeInfo.progress);
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
  updateClouds(deltaSeconds);
  updateClock(timeInfo.label);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);