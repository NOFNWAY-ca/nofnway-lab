// js/game.js — Game loop, state, input, camera, audio for Charlie-Bug

// ── Canvas setup ──────────────────────────────────────────────────────────────

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
const CANVAS_W = 480;
const CANVAS_H = 480;
canvas.width  = CANVAS_W;
canvas.height = CANVAS_H;

// ── Game state ────────────────────────────────────────────────────────────────

let state = {
  screen: 'title',     // 'title' | 'scatter' | 'game' | 'celebrate'
  theme: null,
  themeIndex: -1,
  charlie: {
    x: WORLD_W / 2, y: WORLD_H / 2,
    vx: 0, vy: 0,
    facing: 0,
    cosmetics: { hat: null, wings: null, antennae: null, body: null }
  },
  camera: { x: 0, y: 0 },
  items: [],           // world items this session
  particles: [],
  floatTexts: [],
  windParticles: [],
  scatterProgress: 0,  // 0..1 during scatter phase
  scatterDuration: 90, // frames
  scatterFrame: 0,
  collectCount: 0,
  time: 0,
  rafId: null,
};

const CHARLIE_SPEED = 2.8;
const COLLECT_RADIUS = 32;

// ── Input ─────────────────────────────────────────────────────────────────────

const keys = {};

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (state.screen === 'title') startDay();
  if (state.screen === 'celebrate' && (e.key === ' ' || e.key === 'Enter')) playAgain();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Touch / virtual joystick
const joystick = { active: false, bx: 0, by: 0, tx: 0, ty: 0, dx: 0, dy: 0, id: null };
const JOY_RADIUS = 55;

function setupJoystick() {
  const base = document.getElementById('joy-base');
  if (!base) return;

  function onStart(e) {
    const t = e.changedTouches ? e.changedTouches[0] : e;
    joystick.active = true;
    joystick.id = t.identifier !== undefined ? t.identifier : 'mouse';
    const rect = base.getBoundingClientRect();
    joystick.bx = rect.left + rect.width / 2;
    joystick.by = rect.top  + rect.height / 2;
    updateJoy(t);
    if (state.screen === 'title') startDay();
  }
  function onMove(e) {
    if (!joystick.active) return;
    const t = e.changedTouches
      ? [...e.changedTouches].find(t2 => t2.identifier === joystick.id) || e.changedTouches[0]
      : e;
    updateJoy(t);
  }
  function onEnd() {
    joystick.active = false;
    joystick.dx = 0; joystick.dy = 0;
    document.getElementById('joy-thumb').style.transform = 'translate(-50%,-50%)';
  }
  function updateJoy(t) {
    const dx = t.clientX - joystick.bx;
    const dy = t.clientY - joystick.by;
    const dist = Math.hypot(dx, dy);
    const cx = dist > JOY_RADIUS ? (dx / dist) * JOY_RADIUS : dx;
    const cy = dist > JOY_RADIUS ? (dy / dist) * JOY_RADIUS : dy;
    joystick.dx = cx / JOY_RADIUS;
    joystick.dy = cy / JOY_RADIUS;
    const thumb = document.getElementById('joy-thumb');
    if (thumb) thumb.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
    e && e.preventDefault && e.preventDefault();
  }

  base.addEventListener('touchstart', onStart, { passive: false });
  base.addEventListener('touchmove',  onMove,  { passive: false });
  base.addEventListener('touchend',   onEnd);
  base.addEventListener('touchcancel',onEnd);
  base.addEventListener('mousedown',  onStart);
  window.addEventListener('mousemove', e => { if (joystick.active) onMove(e); });
  window.addEventListener('mouseup',  onEnd);
}

function getInputDelta() {
  let dx = 0, dy = 0;

  // Keyboard
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx -= 1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) dy -= 1;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) dy += 1;

  // Joystick
  if (joystick.active) { dx += joystick.dx; dy += joystick.dy; }

  // Gamepad
  const gp = getGamepad();
  if (gp) {
    const ax = gp.axes[0], ay = gp.axes[1];
    const dead = 0.15;
    if (Math.abs(ax) > dead) dx += ax;
    if (Math.abs(ay) > dead) dy += ay;
    if (gp.buttons[14] && gp.buttons[14].pressed) dx -= 1;
    if (gp.buttons[15] && gp.buttons[15].pressed) dx += 1;
    if (gp.buttons[12] && gp.buttons[12].pressed) dy -= 1;
    if (gp.buttons[13] && gp.buttons[13].pressed) dy += 1;
  }

  // Normalise
  const mag = Math.hypot(dx, dy);
  if (mag > 1) { dx /= mag; dy /= mag; }
  return { dx, dy };
}

// Gamepad
let gpIndex = null;
window.addEventListener('gamepadconnected', e => { gpIndex = e.gamepad.index; });
window.addEventListener('gamepaddisconnected', () => { gpIndex = null; });
function getGamepad() {
  if (gpIndex === null) return null;
  return navigator.getGamepads()[gpIndex] || null;
}

// ── Audio ─────────────────────────────────────────────────────────────────────

let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playCollect() {
  const ac = getAudio();
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4 E4 G4 C5
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ac.currentTime + i * 0.1;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t); osc.stop(t + 0.26);
  });
}

function playWin() {
  const ac = getAudio();
  const chord = [261.63, 329.63, 392.00, 523.25, 659.25];
  chord.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ac.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.08);
    g.gain.setValueAtTime(0.18, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
    osc.start(t + i * 0.06);
    osc.stop(t + 2.3);
  });
}

function playWind() {
  const ac = getAudio();
  const bufSize = ac.sampleRate * 0.8;
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.5;
  const g = ac.createGain();
  src.connect(filter); filter.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(0.15, ac.currentTime + 0.2);
  g.gain.setValueAtTime(0.15, ac.currentTime + 0.5);
  g.gain.linearRampToValueAtTime(0, ac.currentTime + 0.8);
  src.start(); src.stop(ac.currentTime + 0.85);
}

// ── Session / theme ───────────────────────────────────────────────────────────

function loadOrPickTheme() {
  const saved = localStorage.getItem('charlie-bug-day');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      const theme = THEMES[data.themeIndex];
      if (!theme) throw new Error();
      state.themeIndex = data.themeIndex;
      state.theme = theme;
      // Rebuild items from saved positions
      state.items = theme.items.map((item, i) => ({
        ...item,
        x: data.scatter[i].x,
        y: data.scatter[i].y,
        collected: data.collected[i],
        flyX: null, flyY: null, flying: false,
      }));
      // Apply already-collected cosmetics
      state.items.forEach(item => {
        if (item.collected) applyCosmetic(item, false);
      });
      state.collectCount = state.items.filter(i => i.collected).length;
      return true; // resume
    } catch(e) {
      localStorage.removeItem('charlie-bug-day');
    }
  }
  return false;
}

function pickNewTheme(avoid) {
  let idx;
  do { idx = Math.floor(Math.random() * THEMES.length); }
  while (THEMES.length > 1 && idx === avoid);
  state.themeIndex = idx;
  state.theme = THEMES[idx];
}

function scatterItems() {
  // Shuffle zones so each item goes to a different quadrant
  const zones = [...SCATTER_ZONES].sort(() => Math.random() - 0.5);
  state.items = state.theme.items.map((item, i) => {
    const z = zones[i];
    return {
      ...item,
      x: z.minX + Math.random() * (z.maxX - z.minX),
      y: z.minY + Math.random() * (z.maxY - z.minY),
      collected: false,
      flying: false, flyX: null, flyY: null,
    };
  });
}

function saveDay() {
  const data = {
    themeIndex: state.themeIndex,
    scatter: state.items.map(i => ({ x: i.x, y: i.y })),
    collected: state.items.map(i => i.collected),
  };
  localStorage.setItem('charlie-bug-day', JSON.stringify(data));
}

// ── Game lifecycle ────────────────────────────────────────────────────────────

function startDay() {
  if (state.screen !== 'title') return;

  const resumed = loadOrPickTheme();
  if (!resumed) {
    pickNewTheme(state.themeIndex);
    scatterItems();
  }

  state.charlie.x = WORLD_W / 2;
  state.charlie.y = WORLD_H / 2;
  state.charlie.vx = 0;
  state.charlie.vy = 0;
  state.charlie.facing = 0;
  if (!resumed) {
    state.charlie.cosmetics = { hat: null, wings: null, antennae: null, body: null };
    state.collectCount = 0;
  }

  updateTitleTheme();
  updateHUD();

  setScreen('scatter');
  state.scatterFrame = 0;
  spawnWindParticles();
  playWind();

  saveDay();
}

function playAgain() {
  localStorage.removeItem('charlie-bug-day');
  const prev = state.themeIndex;
  pickNewTheme(prev);
  scatterItems();
  state.charlie.cosmetics = { hat: null, wings: null, antennae: null, body: null };
  state.charlie.x = WORLD_W / 2;
  state.charlie.y = WORLD_H / 2;
  state.charlie.vx = 0;
  state.charlie.vy = 0;
  state.charlie.facing = 0;
  state.collectCount = 0;
  state.particles = [];
  state.floatTexts = [];

  updateTitleTheme();
  updateHUD();
  setScreen('scatter');
  state.scatterFrame = 0;
  spawnWindParticles();
  playWind();
  saveDay();
}

// ── Wind scatter ──────────────────────────────────────────────────────────────

function spawnWindParticles() {
  state.windParticles = [];
  for (let i = 0; i < 40; i++) {
    state.windParticles.push({
      x: Math.random() * CANVAS_W * 1.5,
      y: Math.random() * CANVAS_H,
      vx: -(4 + Math.random() * 6),
      vy: (Math.random() - 0.5) * 1.5,
      len: 20 + Math.random() * 40,
      lean: (Math.random() - 0.5) * 8,
      r: 1 + Math.random() * 2,
      life: 0.5 + Math.random() * 0.5,
      delay: Math.random() * 30,
    });
  }
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

// ── Collection ────────────────────────────────────────────────────────────────

function applyCosmetic(item, withSound) {
  state.charlie.cosmetics[item.category] = item;
  if (withSound) playCollect();
}

function spawnCollectParticles(sx, sy) {
  const colors = ['#FFEB3B','#FF6B9D','#7EC8FF','#A8FF78','#FFB347'];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const spd = 2 + Math.random() * 3;
    state.particles.push({
      x: sx, y: sy,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      r: 3 + Math.random() * 4,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function checkCollection() {
  const c = state.charlie;
  state.items.forEach(item => {
    if (item.collected || item.flying) return;
    const dist = Math.hypot(c.x - item.x, c.y - item.y);
    if (dist < COLLECT_RADIUS) {
      item.flying = true;
      item.flyStartX = item.x;
      item.flyStartY = item.y;
      item.flyProgress = 0;

      // Float text in screen space
      const sx = item.x - state.camera.x;
      const sy = item.y - state.camera.y;
      state.floatTexts.push({ text: item.name + '!', x: sx, y: sy - 20, life: 1 });
      spawnCollectParticles(sx, sy);
    }
  });
}

function updateFlyingItems() {
  const c = state.charlie;
  state.items.forEach(item => {
    if (!item.flying || item.collected) return;
    item.flyProgress = Math.min(1, item.flyProgress + 0.08);
    const t = easeOutCubic(item.flyProgress);
    item.x = item.flyStartX + (c.x - item.flyStartX) * t;
    item.y = item.flyStartY + (c.y - item.flyStartY) * t;
    if (item.flyProgress >= 1) {
      item.collected = true;
      item.flying = false;
      state.collectCount++;
      applyCosmetic(item, true);
      updateHUD();
      saveDay();
      if (state.collectCount >= state.items.length) {
        setTimeout(() => {
          setScreen('celebrate');
          playWin();
        }, 600);
      }
    }
  });
}

// ── Camera ────────────────────────────────────────────────────────────────────

function updateCamera() {
  const c = state.charlie;
  const targetX = c.x - CANVAS_W / 2;
  const targetY = c.y - CANVAS_H / 2;
  const maxX = WORLD_W - CANVAS_W;
  const maxY = WORLD_H - CANVAS_H;
  // Smooth follow
  state.camera.x += (Math.max(0, Math.min(maxX, targetX)) - state.camera.x) * 0.12;
  state.camera.y += (Math.max(0, Math.min(maxY, targetY)) - state.camera.y) * 0.12;
}

// ── Particles / float text ────────────────────────────────────────────────────

function updateParticles() {
  state.particles = state.particles.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.08; // gravity
    p.life -= 0.025;
    return p.life > 0;
  });
  state.floatTexts = state.floatTexts.filter(t => {
    t.y -= 0.8;
    t.life -= 0.018;
    return t.life > 0;
  });
}

function updateWindParticles() {
  state.windParticles.forEach(p => {
    if (p.delay > 0) { p.delay--; return; }
    p.x += p.vx; p.y += p.vy;
    p.life -= 0.012;
  });
  state.windParticles = state.windParticles.filter(p => p.life > 0 || p.delay > 0);
}

// ── Main loop ─────────────────────────────────────────────────────────────────

function loop(ts) {
  state.time = ts;
  state.rafId = requestAnimationFrame(loop);

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  if (state.screen === 'scatter') {
    updateScatter(ts);
  } else if (state.screen === 'game') {
    updateGame();
  }

  render();
}

function updateScatter(ts) {
  state.scatterFrame++;
  updateWindParticles();

  const t = Math.min(1, state.scatterFrame / state.scatterDuration);

  // Animate items from center outward
  state.items.forEach(item => {
    if (!item.collected) {
      const ease = easeOutCubic(t);
      item._drawX = WORLD_W/2 + (item.x - WORLD_W/2) * ease;
      item._drawY = WORLD_H/2 + (item.y - WORLD_H/2) * ease;
    }
  });

  if (t >= 1) {
    state.screen = 'game';
    state.items.forEach(item => { delete item._drawX; delete item._drawY; });
  }
}

function updateGame() {
  const { dx, dy } = getInputDelta();

  const c = state.charlie;
  c.vx = dx * CHARLIE_SPEED;
  c.vy = dy * CHARLIE_SPEED;

  if (dx !== 0 || dy !== 0) c.facing = Math.atan2(dy, dx) + Math.PI / 2;

  c.x = Math.max(20, Math.min(WORLD_W - 20, c.x + c.vx));
  c.y = Math.max(20, Math.min(WORLD_H - 20, c.y + c.vy));

  updateCamera();
  updateFlyingItems();
  checkCollection();
  updateParticles();
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  const cam = state.camera;

  if (state.screen === 'title') {
    renderTitle();
    return;
  }

  if (state.screen === 'celebrate') {
    // Still draw the world behind celebration overlay
    drawWorld(ctx, cam, state.time, state.theme ? state.theme.bgTint : '#E8F5E9');
    drawCharlie(ctx, state.charlie, state.time, cam);
    return;
  }

  // Draw world
  drawWorld(ctx, cam, state.time, state.theme ? state.theme.bgTint : '#E8F5E9');

  // Draw items
  state.items.forEach(item => {
    if (item.collected && !item.flying) return;
    const drawItem_ = { ...item };
    if (state.screen === 'scatter') {
      drawItem_.x = item._drawX || WORLD_W/2;
      drawItem_.y = item._drawY || WORLD_H/2;
    }
    drawItem(ctx, drawItem_, state.time, cam);
  });

  // Wind particles (screen space)
  if (state.screen === 'scatter') drawWindParticles(ctx, state.windParticles);

  // Charlie
  drawCharlie(ctx, state.charlie, state.time, cam);

  // Particles + float text (screen space, no camera offset needed — already in screen coords)
  drawParticles(ctx, state.particles);
  drawFloatTexts(ctx, state.floatTexts);
}

function renderTitle() {
  // Title drawn as DOM, canvas just shows animated Charlie
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Sky background
  ctx.fillStyle = state.theme ? state.theme.bgTint : '#C8EAF5';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Bouncing Charlie in centre for title
  const bob = Math.sin(state.time * 0.003) * 6;
  const fakeCharlie = {
    x: CANVAS_W / 2, y: CANVAS_H / 2 + bob,
    vx: 0, vy: 0, facing: 0,
    cosmetics: state.charlie.cosmetics,
  };
  drawCharlie(ctx, fakeCharlie, state.time, { x: 0, y: 0 });
}

// ── Screen helpers (called from ui.js) ───────────────────────────────────────

function showEl(id, show, displayVal) {
  const el = document.getElementById(id);
  if (!el) return;
  if (show) {
    el.removeAttribute('hidden');
    el.style.display = displayVal || 'block';
  } else {
    el.style.display = 'none';
  }
}

function setScreen(s) {
  state.screen = s;
  showEl('title-overlay',    s === 'title',    'flex');
  showEl('celebrate-overlay', s === 'celebrate', 'flex');
  showEl('joy-container',    s === 'game' || s === 'scatter');

  if (s === 'celebrate') {
    const themeEl = document.getElementById('celebrate-theme');
    if (themeEl && state.theme) themeEl.textContent = state.theme.emoji + ' ' + state.theme.name;
    setTimeout(() => { if (typeof renderCelebrateCharlie === 'function') renderCelebrateCharlie(); }, 50);
  }
}

function updateTitleTheme() {
  const theme = state.theme;
  if (!theme) return;
  const el = document.getElementById('title-theme');
  if (el) el.textContent = theme.emoji + ' ' + theme.name;
  const dots = document.getElementById('title-palette');
  if (dots && theme.palette) {
    dots.innerHTML = theme.palette.map(c => `<span style="background:${c}"></span>`).join('');
  }
}

function updateHUD() {
  const cats = ['hat','wings','antennae','body'];
  cats.forEach(cat => {
    const el = document.getElementById('hud-' + cat);
    if (!el) return;
    const found = state.charlie.cosmetics[cat] !== null;
    el.classList.toggle('found', found);
    if (found && state.charlie.cosmetics[cat]) {
      el.style.color = state.charlie.cosmetics[cat].color1;
    }
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────

function init() {
  setupJoystick();

  // Show touch controls only for touch/coarse pointer devices
  const hasTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const joy = document.getElementById('joy-container');
  if (joy && !hasTouch) joy.style.display = 'none';

  state.screen = 'title';
  showEl('title-overlay', true, 'flex');
  showEl('celebrate-overlay', false);

  // If there's a saved day, show its theme on title
  const saved = localStorage.getItem('charlie-bug-day');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      state.theme = THEMES[data.themeIndex];
      state.themeIndex = data.themeIndex;
      updateTitleTheme();
      showEl('title-resume', true);
    } catch(e) { localStorage.removeItem('charlie-bug-day'); }
  }

  requestAnimationFrame(loop);
}
