// js/ui.js — DOM overlays, HUD, celebration for Charlie-Bug

// Play Again button
document.getElementById('play-again-btn').addEventListener('click', () => playAgain());

// Celebrate overlay: draw dressed Charlie on the mini-canvas
function renderCelebrateCharlie() {
  const el = document.getElementById('celebrate-canvas');
  if (!el) return;
  const cc = el.getContext('2d');
  el.width = 120; el.height = 120;
  cc.clearRect(0, 0, 120, 120);
  // Sky tint background
  if (state.theme) {
    cc.fillStyle = state.theme.bgTint;
    cc.fillRect(0, 0, 120, 120);
  }
  drawCharlieMini(cc, state.charlie.cosmetics, 60, 60, 2, state.time);
}

// renderCelebrateCharlie is called by game.js's setScreen when celebrate starts

// Announce item collection for screen readers
function announceCollect(name) {
  const el = document.getElementById('sr-announce');
  if (el) { el.textContent = ''; setTimeout(() => { el.textContent = name + ' collected!'; }, 10); }
}
