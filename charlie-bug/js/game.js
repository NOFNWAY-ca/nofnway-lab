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
  season: null,
  seasonIndex: -1,
  charlie: {
    x: WORLD_W / 2, y: WORLD_H / 2,
    vx: 0, vy: 0,
    facing: 0,
    dizzy: 0,
    target: null,
    cosmetics: { hat: null, wings: null, antennae: null, body: null, dress: null }
  },
  camera: { x: 0, y: 0 },
  items: [],           // world items this session
  particles: [],
  floatTexts: [],
  nameCards: [],
  footprints: [],
  confetti: [],
  windParticles: [],
  butterflies: [],
  snowflakes: [],
  shake: { x: 0, y: 0, trauma: 0 },
  spin: { lastFacing: null, total: 0, dir: 0 },
  footstepFrame: 0,
  ambientGain: null,
  ambientTimer: null,
  ambientStarted: false,
  nextBarTime: 0,
  ambientMuted: false,
  ambientStep: 2,
  scatterProgress: 0,  // 0..1 during scatter phase
  scatterDuration: 90, // frames
  scatterFrame: 0,
  collectCount: 0,
  allCollected: false,
  time: 0,
  startTime: 0,
  rafId: null,
};

const CHARLIE_SPEED = 2.8;
const COLLECT_RADIUS = 52;
const TOWER_RETURN_RADIUS = 60;
const DIZZY_SPIN_RADIANS = Math.PI * 6;
const DIZZY_DURATION = 180;
let deviceHasTouch = false;

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
    if (e.changedTouches) e.preventDefault();
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
    if (e.changedTouches) e.preventDefault();
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
  }

  base.addEventListener('touchstart', onStart, { passive: false });
  base.addEventListener('touchmove',  onMove,  { passive: false });
  base.addEventListener('touchend',   onEnd);
  base.addEventListener('touchcancel',onEnd);
  base.addEventListener('mousedown',  onStart);
  window.addEventListener('mousemove', e => { if (joystick.active) onMove(e); });
  window.addEventListener('mouseup',  onEnd);

  canvas.addEventListener('click', e => {
    if (state.screen !== 'game' || joystick.active) return;
    const scaleX = canvas.clientWidth / CANVAS_W;
    const scaleY = canvas.clientHeight / CANVAS_H;
    const worldX = e.offsetX / scaleX + state.camera.x;
    const worldY = e.offsetY / scaleY + state.camera.y;
    state.charlie.target = { x: worldX, y: worldY };
  });
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

function hasKeyboardInput() {
  return !!(
    keys['ArrowLeft'] || keys['a'] || keys['A'] ||
    keys['ArrowRight'] || keys['d'] || keys['D'] ||
    keys['ArrowUp'] || keys['w'] || keys['W'] ||
    keys['ArrowDown'] || keys['s'] || keys['S']
  );
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
  const now = ac.currentTime;

  // Spring pop: brief frequency sweep up
  const pop = ac.createOscillator();
  const popG = ac.createGain();
  pop.connect(popG); popG.connect(ac.destination);
  pop.type = 'sine';
  pop.frequency.setValueAtTime(180, now);
  pop.frequency.linearRampToValueAtTime(720, now + 0.05);
  popG.gain.setValueAtTime(0.18, now);
  popG.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  pop.start(now); pop.stop(now + 0.08);

  // Warm ascending arpeggio — triangle wave is fuller/warmer than sine
  [329.63, 392.00, 493.88, 659.25].forEach((freq, i) => { // E4 G4 B4 E5
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t = now + 0.04 + i * 0.09;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.start(t); osc.stop(t + 0.3);
  });
}

function playWin() {
  const ac = getAudio();
  const now = ac.currentTime;

  // Rising sweep intro
  const sweep = ac.createOscillator();
  const sweepG = ac.createGain();
  sweep.connect(sweepG); sweepG.connect(ac.destination);
  sweep.type = 'sine';
  sweep.frequency.setValueAtTime(220, now);
  sweep.frequency.exponentialRampToValueAtTime(880, now + 0.4);
  sweepG.gain.setValueAtTime(0.12, now);
  sweepG.gain.linearRampToValueAtTime(0.2, now + 0.3);
  sweepG.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  sweep.start(now); sweep.stop(now + 0.5);

  // Triumphant chord — staggered entry, triangle bass + sine highs
  [261.63, 329.63, 392.00, 523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = i < 3 ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    const t = now + 0.35 + i * 0.07;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.1);
    g.gain.setValueAtTime(0.14, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    osc.start(t); osc.stop(t + 2.6);
  });

  // Sparkle twinkles cascading in
  [1046.5, 1318.5, 1568.0].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = now + 0.8 + i * 0.18;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t); osc.stop(t + 0.45);
  });
}

function playAmbient() {
  if (!state.ambientStarted) return;

  const ac = getAudio();
  if (ac.state === 'suspended') ac.resume();
  if (!state.ambientGain) {
    state.ambientGain = ac.createGain();
    state.ambientGain.gain.value = state.ambientMuted ? 0 : 0.07;
    state.ambientGain.connect(ac.destination);
  }

  const notes = [261.63, 293.66, 329.63, 392.00, 440.00];
  const noteDur = 0.35;
  const gap = 0.05;
  const beat = noteDur + gap;
  const totalNotes = 32;
  const barDuration = totalNotes * beat;
  if (!state.nextBarTime || state.nextBarTime < ac.currentTime + 0.1) {
    state.nextBarTime = ac.currentTime + 0.1;
  }

  for (let i = 0; i < totalNotes; i++) {
    const step = Math.random() < 0.55 ? 0 : (Math.random() < 0.5 ? -1 : 1);
    state.ambientStep = Math.max(0, Math.min(notes.length - 1, state.ambientStep + step));
    const t = state.nextBarTime + i * beat;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'triangle';
    osc.frequency.value = notes[state.ambientStep];
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
    gain.gain.linearRampToValueAtTime(0, t + noteDur);

    osc.connect(gain);
    gain.connect(state.ambientGain);
    osc.start(t);
    osc.stop(t + noteDur + 0.02);
  }

  state.nextBarTime += barDuration;
  clearTimeout(state.ambientTimer);
  state.ambientTimer = setTimeout(
    playAmbient,
    Math.max(0, (state.nextBarTime - ac.currentTime - 0.1) * 1000)
  );
}

function toggleMute() {
  state.ambientMuted = !state.ambientMuted;
  if (state.ambientGain) state.ambientGain.gain.value = state.ambientMuted ? 0 : 0.07;
  const btn = document.getElementById('mute-btn');
  if (btn) {
    btn.textContent = state.ambientMuted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', state.ambientMuted ? 'Unmute music' : 'Mute music');
  }
}

function playWind() {
  const ac = getAudio();
  const dur = 1.4;
  const bufSize = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;

  // Two sweeping bandpass filters for a richer whoosh
  const f1 = ac.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.setValueAtTime(300, ac.currentTime);
  f1.frequency.linearRampToValueAtTime(1100, ac.currentTime + 0.7);
  f1.frequency.linearRampToValueAtTime(500, ac.currentTime + dur);
  f1.Q.value = 0.8;

  const f2 = ac.createBiquadFilter();
  f2.type = 'bandpass';
  f2.frequency.setValueAtTime(600, ac.currentTime);
  f2.frequency.linearRampToValueAtTime(1600, ac.currentTime + 0.6);
  f2.frequency.linearRampToValueAtTime(800, ac.currentTime + dur);
  f2.Q.value = 1.2;

  const g = ac.createGain();
  src.connect(f1); f1.connect(g);
  src.connect(f2); f2.connect(g);
  g.connect(ac.destination);

  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(0.18, ac.currentTime + 0.25);
  g.gain.setValueAtTime(0.18, ac.currentTime + 0.9);
  g.gain.linearRampToValueAtTime(0, ac.currentTime + dur);
  src.start(); src.stop(ac.currentTime + dur + 0.05);
}

// ── Session / theme ───────────────────────────────────────────────────────────

function getStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch(e) {
    return null;
  }
}

function clearSavedDay() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem('charlie-bug-day');
  } catch(e) {}
}

function hasSavedDay() {
  const storage = getStorage();
  if (!storage) return false;
  try {
    return !!storage.getItem('charlie-bug-day');
  } catch(e) {
    clearSavedDay();
    return false;
  }
}

function seededRandom(seed) {
  let n = seed || 1;
  return function next() {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}

function initButterflies() {
  const rand = seededRandom((state.themeIndex + 1) * 971);
  state.butterflies = [];
  for (let i = 0; i < 5; i++) {
    state.butterflies.push({
      cx: 120 + rand() * (WORLD_W - 240),
      cy: 120 + rand() * (WORLD_H - 240),
      radius: 40 + rand() * 50,
      speed: 0.0008 + rand() * 0.0006,
      phase: rand() * Math.PI * 2,
    });
  }
}

function initSnowflakes() {
  state.snowflakes = [];
  if (!state.theme || state.theme.id !== 'aurora') return;
  for (let i = 0; i < 30; i++) {
    state.snowflakes.push({
      x: Math.random() * WORLD_W,
      y: Math.random() * -200,
      speed: 0.3 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.3,
      size: 0.8 + Math.random() * 0.8,
    });
  }
}

function resetSpinTracker() {
  state.spin = { lastFacing: null, total: 0, dir: 0 };
}

function loadOrPickTheme() {
  const storage = getStorage();
  if (!storage) return false;

  let saved = null;
  try {
    saved = storage.getItem('charlie-bug-day');
  } catch(e) {
    clearSavedDay();
    return false;
  }

  if (saved) {
    try {
      const data = JSON.parse(saved);
      const theme = THEMES[data.themeIndex];
      if (!theme) throw new Error();
      state.themeIndex = data.themeIndex;
      state.theme = theme;
      state.seasonIndex = Number.isInteger(data.seasonIndex) && SEASONS[data.seasonIndex]
        ? data.seasonIndex
        : Math.floor(Math.random() * SEASONS.length);
      state.season = SEASONS[state.seasonIndex];
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
      if (state.collectCount >= state.items.length) {
        // Day was already completed — clear it and start fresh
        clearSavedDay();
        return false;
      }
      return true; // resume
    } catch(e) {
      clearSavedDay();
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

function pickNewSeason(avoid) {
  let idx;
  do { idx = Math.floor(Math.random() * SEASONS.length); }
  while (SEASONS.length > 1 && idx === avoid);
  state.seasonIndex = idx;
  state.season = SEASONS[idx];
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
  const storage = getStorage();
  if (!storage) return;
  const data = {
    themeIndex: state.themeIndex,
    seasonIndex: state.seasonIndex,
    scatter: state.items.map(i => ({ x: i.x, y: i.y })),
    collected: state.items.map(i => i.collected),
  };
  try {
    storage.setItem('charlie-bug-day', JSON.stringify(data));
  } catch(e) {}
}

// ── Game lifecycle ────────────────────────────────────────────────────────────

function startDay() {
  if (state.screen !== 'title') return;
  if (!state.ambientStarted) {
    state.ambientStarted = true;
    playAmbient();
  }

  const resumed = loadOrPickTheme();
  if (!resumed) {
    pickNewTheme(state.themeIndex);
    pickNewSeason(state.seasonIndex);
    scatterItems();
  }
  initButterflies();
  initSnowflakes();

  state.charlie.x = TOWER_X;
  state.charlie.y = TOWER_Y;
  state.charlie.vx = 0;
  state.charlie.vy = 0;
  state.charlie.facing = 0;
  state.charlie.dizzy = 0;
  state.charlie.target = null;
  state.confetti = [];
  state.nameCards = [];
  state.footprints = [];
  state.shake = { x: 0, y: 0, trauma: 0 };
  state.footstepFrame = 0;
  resetSpinTracker();
  state.allCollected = false;
  if (!resumed) {
    state.charlie.cosmetics = { hat: null, wings: null, antennae: null, body: null, dress: null };
    state.collectCount = 0;
  }

  // Snap camera to Charlie before scatter begins
  state.camera.x = Math.max(0, Math.min(WORLD_W - CANVAS_W, state.charlie.x - CANVAS_W / 2));
  state.camera.y = Math.max(0, Math.min(WORLD_H - CANVAS_H, state.charlie.y - CANVAS_H / 2));

  updateHUD();
  setScreen('scatter');
  state.scatterFrame = 0;
  spawnWindParticles();
  playWind();

  saveDay();
}

function playAgain() {
  clearSavedDay();
  const prev = state.themeIndex;
  const prevSeason = state.seasonIndex;
  pickNewTheme(prev);
  pickNewSeason(prevSeason);
  scatterItems();
  state.charlie.cosmetics = { hat: null, wings: null, antennae: null, body: null, dress: null };
  state.charlie.x = TOWER_X;
  state.charlie.y = TOWER_Y;
  state.charlie.vx = 0;
  state.charlie.vy = 0;
  state.charlie.facing = 0;
  state.charlie.dizzy = 0;
  state.charlie.target = null;
  state.collectCount = 0;
  state.allCollected = false;
  state.particles = [];
  state.floatTexts = [];
  state.nameCards = [];
  state.confetti = [];
  state.footprints = [];
  state.shake = { x: 0, y: 0, trauma: 0 };
  state.footstepFrame = 0;
  resetSpinTracker();
  initButterflies();
  initSnowflakes();

  // Snap camera to Charlie before scatter begins
  state.camera.x = Math.max(0, Math.min(WORLD_W - CANVAS_W, state.charlie.x - CANVAS_W / 2));
  state.camera.y = Math.max(0, Math.min(WORLD_H - CANVAS_H, state.charlie.y - CANVAS_H / 2));

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

function categoryEmoji(category) {
  return {
    hat: '🎩',
    wings: '🦋',
    antennae: '✨',
    body: '⭐',
    dress: '👗',
  }[category] || '⭐';
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
      state.shake.trauma = 0.45;
      state.nameCards.push({
        text: item.name,
        emoji: categoryEmoji(item.category),
        x: item.x - state.camera.x,
        y: item.y - state.camera.y,
        life: 1.6,
        phase: 'rise',
      });
      state.collectCount++;
      if (state.collectCount >= state.items.length) {
        state.allCollected = true;
      }
      applyCosmetic(item, true);
      updateHUD();
      saveDay();
    }
  });
}

function checkTowerReturn() {
  if (!state.allCollected) return;
  const dist = Math.hypot(state.charlie.x - TOWER_X, state.charlie.y - TOWER_Y);
  if (dist < TOWER_RETURN_RADIUS) {
    state.allCollected = false;
    setTimeout(() => {
      setScreen('celebrate');
      playWin();
    }, 400);
  }
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
  state.nameCards = state.nameCards.filter(card => {
    card.life -= 0.016;
    return card.life > 0;
  });
  if (state.nameCards.length > 4) state.nameCards = state.nameCards.slice(-4);
}

function updateFootprints(isMoving) {
  if (isMoving) {
    state.footstepFrame++;
  } else {
    state.footstepFrame = 0;
  }

  if (isMoving && state.footstepFrame % 12 === 0) {
    const c = state.charlie;
    state.footprints.push({ x: c.x, y: c.y, life: 1, facing: c.facing });
    if (state.footprints.length > 20) state.footprints.shift();
  }

  state.footprints = state.footprints.filter(print => {
    print.life -= 0.018;
    return print.life > 0;
  });
}

function updateShake() {
  state.shake.trauma *= 0.82;
  if (state.shake.trauma < 0.01) state.shake.trauma = 0;
  state.shake.x = (Math.random() - 0.5) * state.shake.trauma * 10;
  state.shake.y = (Math.random() - 0.5) * state.shake.trauma * 10;
}

function updateSnowflakes() {
  if (!state.theme || state.theme.id !== 'aurora') return;
  state.snowflakes.forEach(flake => {
    flake.y += flake.speed;
    flake.x += flake.drift;
    if (flake.x < 0) flake.x = WORLD_W;
    if (flake.x > WORLD_W) flake.x = 0;
    if (flake.y - state.camera.y > CANVAS_H + 20) {
      flake.y = state.camera.y - 20 - Math.random() * 80;
      flake.x = state.camera.x + Math.random() * CANVAS_W;
    }
  });
}

function angleDelta(next, prev) {
  return Math.atan2(Math.sin(next - prev), Math.cos(next - prev));
}

function updateDizzySpin(isMoving) {
  const c = state.charlie;

  if (c.dizzy > 0) {
    c.dizzy--;
    if (c.dizzy === 0) resetSpinTracker();
    return;
  }

  if (!isMoving) {
    state.spin.lastFacing = c.facing;
    state.spin.total *= 0.9;
    if (state.spin.total < 0.05) {
      state.spin.total = 0;
      state.spin.dir = 0;
    }
    return;
  }

  if (state.spin.lastFacing === null) {
    state.spin.lastFacing = c.facing;
    return;
  }

  const delta = angleDelta(c.facing, state.spin.lastFacing);
  state.spin.lastFacing = c.facing;
  if (Math.abs(delta) < 0.015) return;

  const dir = Math.sign(delta);
  if (state.spin.dir && dir !== state.spin.dir) {
    state.spin.total = Math.abs(delta);
  } else {
    state.spin.total += Math.abs(delta);
  }
  state.spin.dir = dir;

  if (state.spin.total >= DIZZY_SPIN_RADIANS) {
    c.dizzy = DIZZY_DURATION;
    resetSpinTracker();
    state.floatTexts.push({
      text: 'Dizzy!',
      x: c.x - state.camera.x,
      y: c.y - state.camera.y - 48,
      life: 1,
    });
  }
}

function initConfetti() {
  state.confetti = [];
  for (let i = 0; i < 60; i++) {
    state.confetti.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * -CANVAS_H,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
      w: 8 + Math.random() * 8,
      h: 5 + Math.random() * 5,
      color: RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)],
    });
  }
}

function updateConfetti() {
  state.confetti.forEach(piece => {
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.rot += piece.rotV;
    if (piece.y > CANVAS_H) {
      piece.x = Math.random() * CANVAS_W;
      piece.y = -10;
    }
  });
  state.charlie.facing += 0.05;
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
  if (!state.startTime) state.startTime = ts;
  const t = ts - state.startTime;
  state.time = t;
  state.rafId = requestAnimationFrame(loop);

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  if (state.screen === 'scatter') {
    updateScatter(t);
  } else if (state.screen === 'game') {
    updateGame();
  } else if (state.screen === 'celebrate') {
    updateConfetti();
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
  const manualInput = hasKeyboardInput() || joystick.active || dx !== 0 || dy !== 0;

  const c = state.charlie;
  c.vx = dx * CHARLIE_SPEED;
  c.vy = dy * CHARLIE_SPEED;

  if (manualInput) {
    c.target = null;
  }

  if (c.target && dx === 0 && dy === 0 && !joystick.active) {
    const tdx = c.target.x - c.x;
    const tdy = c.target.y - c.y;
    const targetDist = Math.hypot(tdx, tdy);
    if (targetDist < 10) {
      c.target = null;
      c.vx = 0;
      c.vy = 0;
    } else {
      c.vx = (tdx / targetDist) * CHARLIE_SPEED;
      c.vy = (tdy / targetDist) * CHARLIE_SPEED;
      c.facing = Math.atan2(tdy, tdx) + Math.PI / 2;
    }
  } else if (dx !== 0 || dy !== 0) {
    c.facing = Math.atan2(dy, dx) + Math.PI / 2;
  }

  c.x = Math.max(20, Math.min(WORLD_W - 20, c.x + c.vx));
  c.y = Math.max(20, Math.min(WORLD_H - 20, c.y + c.vy));
  const moving = Math.hypot(c.vx || 0, c.vy || 0) > 0.5;

  updateDizzySpin(moving);
  updateFootprints(moving);
  updateShake();
  updateCamera();
  updateSnowflakes();
  updateFlyingItems();
  checkCollection();
  checkTowerReturn();
  updateParticles();
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  const cam = state.camera;
  const worldTheme = state.theme
    ? { ...state.theme, season: state.season, butterflies: state.butterflies, snowflakes: state.snowflakes, allCollected: state.allCollected }
    : null;

  if (state.screen === 'title') {
    renderTitle();
    return;
  }

  if (state.screen === 'celebrate') {
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    drawWorld(ctx, cam, state.time, state.theme ? state.theme.bgTint : '#E8F5E9', worldTheme);
    drawCelebration(ctx, state.charlie, state.confetti, cam, state.time);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(state.shake.x, state.shake.y);

  // Draw world
  drawWorld(ctx, cam, state.time, state.theme ? state.theme.bgTint : '#E8F5E9', worldTheme);

  // Draw items
  state.items.forEach(item => {
    if (item.collected && !item.flying) return;
    const drawItem_ = { ...item };
    if (state.screen === 'scatter') {
      drawItem_.x = item._drawX || WORLD_W/2;
      drawItem_.y = item._drawY || WORLD_H/2;
    }
    drawItem(ctx, drawItem_, state.time, cam, state.charlie.x, state.charlie.y);
  });

  // Wind particles (screen space)
  if (state.screen === 'scatter') drawWindParticles(ctx, state.windParticles);

  // Charlie
  drawFootprints(ctx, state.footprints, cam);
  drawTapRipple(ctx, state.charlie.target, cam, state.time);
  drawCharlie(ctx, state.charlie, state.time, cam);

  // Particles + float text (screen space, no camera offset needed — already in screen coords)
  drawParticles(ctx, state.particles);
  drawFloatTexts(ctx, state.floatTexts);
  drawNameCards(ctx, state.nameCards);

  if (state.screen === 'game') {
    drawGuideArrow(ctx, state.charlie, state.items, state.camera, state.time);
    if (state.allCollected) {
      drawTowerReturnPrompt(ctx, state.time);
    }
  }

  ctx.restore();
}

function renderTitle() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  drawTitleScenery(ctx, state.time);

  // Bouncing Charlie, large enough to be the focus.
  const bob = Math.sin(state.time * 0.003) * 6;
  drawCharlieMini(ctx, state.charlie.cosmetics, CANVAS_W / 2, 300 + bob, 1.45, state.time);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Title "Charlie-Bug"
  ctx.font = '900 50px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E94F62';
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
  ctx.shadowColor = 'rgba(0,0,0,0.13)'; ctx.shadowBlur = 0;
  ctx.strokeText('Charlie-Bug', CANVAS_W / 2, 22);
  ctx.fillText('Charlie-Bug', CANVAS_W / 2, 22);
  ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'rgba(0,0,0,0)';

  // Subtitle
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#2D2D2D';
  ctx.fillText('Dress up and return to your tower!', CANVAS_W / 2, 84);

  drawControlBadge(ctx, 110, 124, 'Touch', 'drag the circle', '#29B6F6');
  drawControlBadge(ctx, 240, 124, 'Keys', 'WASD or arrows', '#FF9800');
  drawControlBadge(ctx, 370, 124, 'Gamepad', 'stick or d-pad', '#7E57C2');

  // Theme name + palette dots
  if (state.theme) {
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#2D2D2D';
    ctx.fillText(state.theme.emoji + ' ' + state.theme.name, CANVAS_W / 2, 170);
    if (state.season) {
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#4E6655';
      ctx.fillText(state.season.emoji + ' ' + state.season.name + ' garden', CANVAS_W / 2, 224);
    }

    if (state.theme.palette) {
      const n = state.theme.palette.length;
      const gap = 26;
      const dotX = CANVAS_W / 2 - ((n - 1) * gap) / 2;
      state.theme.palette.forEach((col, i) => {
        ctx.beginPath();
        ctx.arc(dotX + i * gap, 202, 9, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.shadowBlur = 5; ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
      });
    }

    // Resume indicator
    if (hasSavedDay()) {
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#4CAF50';
      ctx.fillText('Continue where you left off', CANVAS_W / 2, 240);
    }
  }

  // Start prompt.
  const pulse = 0.55 + Math.sin(state.time * 0.004) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#2D7D46';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(132, CANVAS_H - 62, 216, 42, 21);
  ctx.stroke();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = '900 17px sans-serif';
  ctx.fillStyle = '#2D7D46';
  ctx.fillText('Tap to begin', CANVAS_W / 2, CANVAS_H - 51);
  ctx.globalAlpha = 1;

  ctx.restore();
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
  showEl('celebrate-overlay', s === 'celebrate', 'flex');
  showEl('joy-container',    deviceHasTouch && (s === 'game' || s === 'scatter'));
  showEl('hud-items',        s !== 'title' && s !== 'celebrate', 'flex');

  if (s === 'celebrate') {
    initConfetti();
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
  const cats = ['hat','wings','antennae','body','dress'];
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

  deviceHasTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

  state.screen = 'title';
  showEl('celebrate-overlay', false);
  showEl('hud-items', false);

  // Pre-load saved theme so the canvas title screen can render it immediately.
  // If the day was already completed, clear it — don't resume a finished game.
  const storage = getStorage();
  let saved = null;
  if (storage) {
    try {
      saved = storage.getItem('charlie-bug-day');
    } catch(e) {
      clearSavedDay();
    }
  }
  if (saved) {
    try {
      const data = JSON.parse(saved);
      const allDone = data.collected && data.collected.every(Boolean);
      if (allDone) {
        clearSavedDay();
      } else {
        state.theme = THEMES[data.themeIndex];
        state.themeIndex = data.themeIndex;
        state.seasonIndex = Number.isInteger(data.seasonIndex) && SEASONS[data.seasonIndex]
          ? data.seasonIndex
          : Math.floor(Math.random() * SEASONS.length);
        state.season = SEASONS[state.seasonIndex];
      }
    } catch(e) { clearSavedDay(); }
  }

  requestAnimationFrame(loop);
  document.getElementById('loading')?.remove();
}
