// js/draw.js — Canvas rendering for Charlie-Bug

// ── World ─────────────────────────────────────────────────────────────────────

function drawWorld(ctx, camera, time, bgTint, theme) {
  const W = WORLD_W, H = WORLD_H;
  const cx = -camera.x, cy = -camera.y; // canvas offset
  const isNova = theme && theme.id === 'nova';
  const season = theme && theme.season ? theme.season : null;
  const isMoon = season && season.id === 'moon';
  const grassColors = season ? season.grass : ['#9BE283', '#78C96E', '#62B85D'];
  const patchColors = season ? season.patches : ['#B8EC8A', '#A9E77E', '#9EDB73'];
  const pathColors = season ? season.path : ['#AF835A', '#E8C48D'];

  if (isNova) {
    drawNovaSky(ctx, time);
  } else if (isMoon) {
    drawMoonSky(ctx, time);
  }

  // Base grass with a soft storybook gradient.
  const grass = ctx.createLinearGradient(cx, cy, cx + W, cy + H);
  grass.addColorStop(0, grassColors[0]);
  grass.addColorStop(0.45, grassColors[1]);
  grass.addColorStop(1, grassColors[2]);
  ctx.fillStyle = grass;
  ctx.fillRect(cx, cy, W, H);

  if (bgTint) {
    ctx.fillStyle = bgTint;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(cx, cy, W, H);
    ctx.globalAlpha = 1;
  }

  if (season && season.overlay) {
    ctx.fillStyle = season.overlay;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  if (theme && theme.id === 'flora') {
    ctx.fillStyle = 'rgba(252,228,236,0.12)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Big rounded garden patches keep the map readable for kids.
  drawGardenPatch(ctx, cx + 245, cy + 315, 165, 115, patchColors[0], time * 0.0004);
  drawGardenPatch(ctx, cx + 1160, cy + 295, 170, 118, patchColors[1], -0.2);
  drawGardenPatch(ctx, cx + 330, cy + 1120, 180, 125, patchColors[0], 0.25);
  drawGardenPatch(ctx, cx + 1070, cy + 1045, 190, 130, patchColors[2], -0.35);
  drawGardenPatch(ctx, cx + 720, cy + 760, 220, 145, patchColors[1], 0.12);

  // Subtle grass texture patches (lighter/darker spots)
  const patches = [
    [ 180, 180,80,70,'#72be70'],[ 450, 120,100,60,'#82d07e'],[ 750, 240,90,80,'#78c975'],
    [1050, 180,110,70,'#6dbd6a'],[1275, 450,80,90,'#82d07e'],[ 150, 600,90,100,'#72be70'],
    [ 300, 900,100,80,'#78c975'],[ 600,1050,80,90,'#82d07e'],[ 975,1200,110,70,'#6dbd6a'],
    [1200, 975,90,80,'#72be70'],[ 825, 750,70,60,'#82d07e'],[ 525, 525,80,70,'#6dbd6a'],
    [ 900, 300,90,70,'#82d07e'],[ 200,1050,100,80,'#6dbd6a'],[1100, 850,90,80,'#72be70'],
    [ 450, 480,80,70,'#78c975'],[ 750,1100,100,80,'#82d07e'],[1200, 400,80,90,'#6dbd6a'],
    [ 500, 900,70,60,'#72be70'],[1050, 620,90,70,'#82d07e'],[ 280, 720,80,80,'#6dbd6a'],
    [ 680, 400,90,70,'#78c975'],[1150,1150,80,80,'#72be70'],[ 200, 350,70,60,'#82d07e'],
  ];
  patches.forEach(([px,py,pw,ph,col]) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(cx+px, cy+py, pw, ph, 0, 0, Math.PI*2);
    ctx.fill();
  });

  // Tiny blades and dots add texture without turning the scene noisy.
  for (let i = 0; i < 90; i++) {
    const gx = (i * 137) % W;
    const gy = (i * 263) % H;
    const sx = cx + gx;
    const sy = cy + gy;
    if (sx < -10 || sx > CANVAS_W + 10 || sy < -10 || sy > CANVAS_H + 10) continue;
    const sway = Math.sin(time * 0.001 + i) * 1.5;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(52,128,58,0.22)' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 4);
    ctx.quadraticCurveTo(sx + sway, sy - 2, sx + sway * 1.5, sy - 8);
    ctx.stroke();
  }

  // Winding dirt path
  ctx.beginPath();
  const pts = PATH_SEGMENTS;
  ctx.moveTo(cx + pts[0].x, cy + pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i+1].x) / 2;
    const my = (pts[i].y + pts[i+1].y) / 2;
    ctx.quadraticCurveTo(cx + pts[i].x, cy + pts[i].y, cx + mx, cy + my);
  }
  ctx.lineWidth = 40;
  ctx.strokeStyle = pathColors[0];
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 34;
  ctx.strokeStyle = pathColors[1];
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.setLineDash([18, 26]);
  ctx.stroke();
  ctx.setLineDash([]);

  drawPathPebbles(ctx, cx, cy);

  if (isNova) {
    ctx.save();
    ctx.globalAlpha = 0.45;
  }

  if (theme && theme.id === 'flora') {
    drawFloraBlooms(ctx, cx, cy);
  }

  // Decorations
  DECORATIONS.forEach(d => {
    const sx = cx + d.x;
    const sy = cy + d.y;
    if (sx < -80 || sx > CANVAS_W + 80 || sy < -80 || sy > CANVAS_H + 80) return;
    drawDecoration(ctx, d, cx, cy, time, theme);
  });

  if (isNova) ctx.restore();

  drawButterflies(ctx, camera, time, theme);
  drawSnowflakes(ctx, camera, theme);

  // Soft edge vignette gives the camera view a toy-diorama feel.
  const vignette = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, 120, CANVAS_W / 2, CANVAS_H / 2, 360);
  vignette.addColorStop(0, 'rgba(255,255,255,0)');
  vignette.addColorStop(1, season ? season.vignette : 'rgba(48,100,50,0.18)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawSparkleLayer(ctx, time, theme);
}

function drawNovaSky(ctx, time) {
  ctx.save();
  ctx.fillStyle = '#0D0126';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  for (let i = 0; i < 40; i++) {
    const x = (i * 137 + 71) % CANVAS_W;
    const y = (i * 97 + 53) % CANVAS_H;
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(time * 0.002 + i);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  const nebula = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, 20, CANVAS_W / 2, CANVAS_H / 2, 280);
  nebula.addColorStop(0, 'rgba(100,0,180,0.18)');
  nebula.addColorStop(1, 'rgba(100,0,180,0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

function drawMoonSky(ctx, time) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, '#11173A');
  sky.addColorStop(1, '#26324F');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 28; i++) {
    const x = (i * 89 + 33) % CANVAS_W;
    const y = (i * 131 + 27) % CANVAS_H;
    ctx.globalAlpha = 0.25 + 0.35 * Math.sin(time * 0.0017 + i);
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#FFF7C2';
  ctx.beginPath();
  ctx.arc(CANVAS_W - 68, 64, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#11173A';
  ctx.beginPath();
  ctx.arc(CANVAS_W - 58, 58, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFloraBlooms(ctx, cx, cy) {
  for (let i = 0; i < 15; i++) {
    const x = cx + ((i * 211 + 97) % WORLD_W);
    const y = cy + ((i * 149 + 131) % WORLD_H);
    if (x < -20 || x > CANVAS_W + 20 || y < -20 || y > CANVAS_H + 20) continue;
    drawSimpleBloom(ctx, x, y, 6, i % 2 ? '#FFD700' : '#F48FB1');
  }
}

function drawSimpleBloom(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * r, Math.sin(a) * r, 3, 5, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawButterflies(ctx, camera, time, theme) {
  if (!theme || !theme.butterflies || !theme.palette) return;

  const color1 = theme.palette[0] || '#FFEB3B';
  const color2 = theme.palette[1] || '#FF6B9D';

  theme.butterflies.forEach(b => {
    const wx = b.cx + Math.cos(time * b.speed + b.phase) * b.radius;
    const wy = b.cy + Math.sin(time * b.speed * 0.7 + b.phase) * b.radius * 0.5;
    const sx = wx - camera.x;
    const sy = wy - camera.y;
    if (sx < -20 || sx > CANVAS_W + 20 || sy < -20 || sy > CANVAS_H + 20) return;

    const flutter = Math.sin(time * 0.018 + b.phase) * 0.45;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.globalAlpha = 0.7;
    ctx.rotate(Math.sin(time * b.speed + b.phase) * 0.4);

    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.ellipse(-5, 0, 10, 6, -0.55 + flutter, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.ellipse(5, 0, 10, 6, 0.55 - flutter, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(46,91,42,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 6);
    ctx.stroke();

    ctx.restore();
  });
}

function drawSnowflakes(ctx, camera, theme) {
  if (!theme || theme.id !== 'aurora' || !theme.snowflakes) return;

  theme.snowflakes.forEach(flake => {
    const sx = flake.x - camera.x;
    const sy = flake.y - camera.y;
    if (sx < -12 || sx > CANVAS_W + 12 || sy < -12 || sy > CANVAS_H + 12) return;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r = 4 * flake.size;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * -r, Math.sin(a) * -r);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawSparkleLayer(ctx, time, theme) {
  if (!theme || theme.id !== 'princess') return;

  for (let i = 0; i < 12; i++) {
    const baseX = (i * 83 + 38) % CANVAS_W;
    const baseY = (i * 137 + 54) % CANVAS_H;
    const y = baseY + Math.sin(time * 0.002 + i) * 12;
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(time * 0.003 + i * 0.8);
    drawStar(ctx, baseX, y, 4, 4, 1.5, i % 2 ? '#F8BBD9' : '#FFD700');
    ctx.restore();
  }
}

function drawGardenPatch(ctx, x, y, w, h, color, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.42;
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, w - 12, h - 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPathPebbles(ctx, cx, cy) {
  [
    [348, 396, 4], [410, 520, 3], [620, 610, 4], [815, 585, 3],
    [1030, 468, 4], [1220, 668, 3], [1120, 898, 4], [940, 1075, 3],
    [810, 1240, 4], [612, 220, 3], [285, 300, 4], [1320, 742, 3],
  ].forEach(([px, py, r], i) => {
    ctx.fillStyle = i % 2 ? 'rgba(135,96,58,0.22)' : 'rgba(255,255,255,0.32)';
    ctx.beginPath();
    ctx.ellipse(cx + px, cy + py, r + 2, r, 0.25, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawTower(ctx, cx, cy, time, allCollected, themeColor) {
  const glowPulse = 0.4 + 0.3 * Math.sin(time * 0.005);
  const flagWave = Math.sin(time * 0.004) * 3;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  ctx.beginPath();
  ctx.ellipse(0, 72, 32, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (allCollected) {
    [[-10, -1], [10, -1]].forEach(([gx, gy]) => {
      const glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, 14);
      glow.addColorStop(0, '#FFE082');
      glow.addColorStop(1, 'rgba(255,224,130,0)');
      ctx.save();
      ctx.globalAlpha = 0.6 * glowPulse;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(gx, gy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  ctx.fillStyle = '#9E9E9E';
  ctx.strokeStyle = '#757575';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-28, -20, 56, 90, 6);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const y = -10 + i * 10;
    ctx.beginPath();
    ctx.moveTo(-24, y);
    ctx.lineTo(24, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#9E9E9E';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(-28 + i * 12, -32, 10, 14);
  }
  ctx.strokeStyle = '#757575';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-28, -32, 10, 14);
  ctx.strokeRect(-16, -32, 10, 14);
  ctx.strokeRect(-4, -32, 10, 14);
  ctx.strokeRect(8, -32, 10, 14);
  ctx.strokeRect(20, -32, 10, 14);

  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.roundRect(-10, 30, 20, 40, [10, 10, 0, 0]);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 30, 10, Math.PI, 0);
  ctx.fill();

  [[-15, -10], [5, -10]].forEach(([wx, wy]) => {
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.roundRect(wx, wy, 10, 18, 4);
    ctx.fill();
  });

  ctx.fillStyle = '#757575';
  ctx.fillRect(-2, -55, 2, 26);
  ctx.fillStyle = themeColor || '#FF6B9D';
  ctx.beginPath();
  ctx.moveTo(0, -55);
  ctx.lineTo(18 + flagWave, -48);
  ctx.lineTo(0, -41);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawDecoration(ctx, d, cx, cy, time, theme) {
  const x = cx + d.x, y = cy + d.y;
  const season = theme?.season || null;
  if (d.type === 'tower') {
    drawTower(ctx, x, y, time, theme?.allCollected || false, theme?.palette?.[0] || '#FF6B9D');
  } else if (d.type === 'castle') {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#CE93D8';
    ctx.fillRect(-30, -12, 16, 52);
    ctx.fillRect(-12, -28, 24, 68);
    ctx.fillRect(14, -12, 16, 52);
    [-30, -25, -20, -10, -5, 0, 5, 14, 19, 24].forEach(px => {
      ctx.fillRect(px, px > -14 && px < 12 ? -34 : -18, 5, 6);
    });
    ctx.fillStyle = '#F48FB1';
    ctx.beginPath();
    ctx.moveTo(-15, -28);
    ctx.lineTo(0, -50);
    ctx.lineTo(15, -28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(94,53,117,0.45)';
    ctx.beginPath();
    ctx.moveTo(-6, 40);
    ctx.lineTo(-6, 22);
    ctx.quadraticCurveTo(0, 12, 6, 22);
    ctx.lineTo(6, 40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (d.type === 'flower') {
    const bob = Math.sin(time * 0.002 + d.x) * 1.5;
    const s = d.size || 1;
    ctx.save();
    ctx.translate(x, y + bob);
    // Stem
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 10 * s);
    ctx.strokeStyle = season?.stemColor ?? '#4a8f46';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Leaf pair
    ctx.fillStyle = season?.leafColor ?? '#5BBE5A';
    ctx.beginPath();
    ctx.ellipse(-3 * s, 4 * s, 4 * s, 2 * s, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3 * s, 6 * s, 4 * s, 2 * s, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Petals
    const petalColor = season?.flowerTint ? blendColor(d.color, season.flowerTint, 0.45) : d.color;
    ctx.globalAlpha = season ? (season.flowerAlpha ?? 1) : 1;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 5 * s, -8 + Math.sin(a) * 5 * s, 4 * s, 0, Math.PI * 2);
      ctx.fillStyle = petalColor;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Center
    ctx.beginPath();
    ctx.arc(0, -8, 3.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#FFEB3B';
    ctx.fill();
    ctx.strokeStyle = 'rgba(126,87,33,0.25)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  } else if (d.type === 'mushroom') {
    ctx.save();
    ctx.translate(x, y);
    // Stem
    ctx.fillStyle = '#EFE0D0';
    ctx.beginPath();
    ctx.ellipse(0, 2, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cap
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.ellipse(0, -6, 13, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(93,64,55,0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Spots
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    [[-4,-8],[4,-7],[0,-4]].forEach(([sx,sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  } else if (d.type === 'rock') {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(-3, -2, 4, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (d.type === 'grass') {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = season?.grassTuftColor ?? d.color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    const sway = Math.sin(time * 0.0015 + d.x) * 2;
    [[-6,0],[-2,0],[2,0],[6,0]].forEach(([gx]) => {
      ctx.beginPath();
      ctx.moveTo(gx, 4);
      ctx.quadraticCurveTo(gx + sway, -4, gx + sway * 1.5, -10);
      ctx.stroke();
    });
    ctx.restore();

  } else if (d.type === 'tree') {
    ctx.save();
    ctx.translate(x, y);
    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.beginPath();
    ctx.ellipse(4, 2, 18, 7, 0, 0, Math.PI*2);
    ctx.fill();
    // Trunk
    ctx.fillStyle = '#7A4B2A';
    ctx.beginPath();
    ctx.roundRect(-6, -20, 12, 25, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-3, -18, 2, 17);
    // Canopy with overlapping blobs and gentle sway.
    const sway = Math.sin(time * 0.001 + d.x * 0.01) * 2;
    [
      [sway,    -36, 20, season?.treeColors?.[0] ?? '#388E3C'],
      [sway-12, -26, 16, season?.treeColors?.[1] ?? '#2E7D32'],
      [sway+12, -26, 16, season?.treeColors?.[1] ?? '#2E7D32'],
      [sway,    -20, 14, season?.treeColors?.[2] ?? '#66BB6A'],
    ].forEach(([tx, ty, r, col]) => {
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI*2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = 'rgba(26,90,36,0.18)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(sway - 7, -38, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  } else if (d.type === 'pond') {
    const s = d.size || 1;
    ctx.save();
    ctx.translate(x, y);
    // Water shadow/depth
    ctx.fillStyle = 'rgba(0,60,100,0.18)';
    ctx.beginPath();
    ctx.ellipse(3, 3, 36*s, 22*s, 0, 0, Math.PI*2);
    ctx.fill();
    // Water body
    ctx.fillStyle = season?.pondColor ?? 'rgba(100,190,230,0.82)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 34*s, 20*s, 0, 0, Math.PI*2);
    ctx.fill();
    // Highlight shimmer
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-6*s, -4*s, 12*s, 5*s, -0.3, 0, Math.PI*2);
    ctx.fill();
    // Animated ripple ring
    const ripA = 0.15 + Math.abs(Math.sin(time * 0.003 + d.x * 0.01)) * 0.25;
    ctx.strokeStyle = `rgba(255,255,255,${ripA})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(6*s, 3*s, 10*s, 5*s, 0.2, 0, Math.PI*2);
    ctx.stroke();
    // Lily pad with notch
    ctx.save();
    ctx.translate(-14*s, 5*s);
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 7*s, 0.4, Math.PI*2 - 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();

  } else if (d.type === 'clover') {
    const bob = Math.sin(time * 0.0015 + d.x) * 1;
    ctx.save();
    ctx.translate(x, y + bob);
    // Stem
    ctx.beginPath();
    ctx.moveTo(0, 4); ctx.lineTo(0, 12);
    ctx.strokeStyle = '#4a8f46'; ctx.lineWidth = 1.5; ctx.stroke();
    // 4 leaves in + pattern
    ctx.fillStyle = '#4CAF50';
    [[0, -5], [5, 0], [0, 5], [-5, 0]].forEach(([lx, ly]) => {
      ctx.beginPath();
      ctx.arc(lx, ly, 4.5, 0, Math.PI*2);
      ctx.fill();
    });
    // Center
    ctx.fillStyle = '#81C784';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Charlie-Bug ───────────────────────────────────────────────────────────────

function drawCharlie(ctx, charlie, time, camera) {
  const sx = charlie.x - camera.x;
  const sy = charlie.y - camera.y;
  const cos = charlie.cosmetics;
  const moving = Math.hypot(charlie.vx || 0, charlie.vy || 0) > 0.5;
  const bob = moving ? 0 : Math.sin(time * 0.003) * 1.5;
  const lookAngle = moving ? 0 : Math.sin(time * 0.0008) * 0.22;
  const blinkPhase = (time * 0.001) % 6.28;
  const blinking = !moving && Math.sin(blinkPhase * 2.5) > 0.96;
  const dizzy = charlie.dizzy || 0;
  const dizzyWobble = dizzy > 0 ? Math.sin(time * 0.03) * 0.12 : 0;

  ctx.save();
  ctx.translate(sx, sy + bob);
  ctx.rotate(charlie.facing + dizzyWobble);

  // Shadow (unrotated, flat on ground)
  ctx.save();
  ctx.rotate(-(charlie.facing + dizzyWobble));
  ctx.scale(1.4, 0.3);
  ctx.beginPath();
  ctx.arc(0, 62, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();
  ctx.restore();

  // Wings (behind everything)
  if (cos.wings) drawWings(ctx, cos.wings, time);

  // Legs (behind body)
  drawLegs(ctx, time, charlie);

  // Body pattern (clipped)
  if (cos.body) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 7, 13, 14, 0, 0, Math.PI * 2);
    ctx.clip();
    drawBodyPattern(ctx, cos.body, time);
    ctx.restore();
  }

  // Body shell, rounder and slightly shorter.
  ctx.beginPath();
  ctx.ellipse(0, 7, 13, 14, 0, 0, Math.PI * 2);
  const shell = ctx.createLinearGradient(-8, -8, 9, 22);
  shell.addColorStop(0, cos.body ? 'rgba(255,138,128,0.86)' : '#FF6B5F');
  shell.addColorStop(1, cos.body ? 'rgba(211,47,47,0.8)' : '#D83232');
  ctx.fillStyle = shell;
  ctx.fill();
  ctx.strokeStyle = '#C62828';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(-5, 1, 4, 8, -0.45, 0, Math.PI * 2);
  ctx.fill();

  // Default spots (3 classic ladybug dots)
  if (!cos.body) {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    [[-5, 4],[5, 4],[0, 13]].forEach(([bx,by]) => {
      ctx.beginPath(); ctx.arc(bx, by, 3.2, 0, Math.PI*2); ctx.fill();
    });
  }

  // Wing seam line
  ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(0, 20);
  ctx.strokeStyle = 'rgba(198,40,40,0.5)';
  ctx.lineWidth = 1; ctx.stroke();

  if (cos.dress) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 18, 16, 20, 0, 0, Math.PI * 2);
    ctx.clip();
    drawDress(ctx, cos.dress, time);
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(0, 18, 16, 20, 0, 0, Math.PI * 2);
    ctx.strokeStyle = cos.dress.color1;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.save();
  ctx.rotate(lookAngle);

  // Head — bigger and rounder for chibi proportions
  ctx.beginPath();
  ctx.arc(0, -14, 12, 0, Math.PI * 2);
  const head = ctx.createRadialGradient(-4, -18, 3, 0, -14, 14);
  head.addColorStop(0, '#3C3C3C');
  head.addColorStop(1, '#171717');
  ctx.fillStyle = head;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Big cute eyes
  ctx.fillStyle = 'white';
  if (blinking) {
    ctx.fillRect(-9, -16, 5, 1.5);
    ctx.fillRect(0, -16, 5, 1.5);
  } else {
    ctx.beginPath(); ctx.ellipse(-4.8, -15, 5, 5.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 4.8, -15, 5, 5.5, 0, 0, Math.PI*2); ctx.fill();

    // Pupils (offset slightly up-center for that wide-eyed look)
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(-4.2, -15.8, 2.8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 5.4, -15.8, 2.8, 0, Math.PI*2); ctx.fill();

    // Eye shine — two dots per eye for extra sparkle
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(-3.2, -17.2, 1.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-5.8, -15.2, 0.6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 6.4, -17.2, 1.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 3.8, -15.2, 0.6, 0, Math.PI*2); ctx.fill();
  }

  // Blush marks
  ctx.fillStyle = 'rgba(255,120,120,0.38)';
  ctx.beginPath(); ctx.ellipse(-9.5, -12, 4.5, 2.8, 0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 9.5, -12, 4.5, 2.8, -0.3, 0, Math.PI*2); ctx.fill();

  // Tiny smile.
  ctx.beginPath();
  ctx.arc(0, -11.5, 4, 0.25, Math.PI - 0.25);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.stroke();

  // Antennae (from top of head)
  const tipType = cos.antennae ? cos.antennae.type   : 'dot';
  const tipCol1 = cos.antennae ? cos.antennae.color1 : '#1a1a1a';
  const tipCol2 = cos.antennae ? cos.antennae.color2 : null;
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5,-25); ctx.quadraticCurveTo(-14,-33,-11,-40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 5,-25); ctx.quadraticCurveTo( 14,-33, 11,-40); ctx.stroke();
  drawAntennaTip(ctx, -11, -40, tipType, tipCol1, tipCol2, time);
  drawAntennaTip(ctx,  11, -40, tipType, tipCol1, tipCol2, time);

  // Hat (topmost layer)
  if (cos.hat) drawHat(ctx, cos.hat, time);

  ctx.restore();

  if (dizzy > 0) drawDizzyStars(ctx, time, dizzy);

  ctx.restore();
}

function drawDizzyStars(ctx, time, dizzy) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, dizzy / 30);
  const orbit = time * 0.011;
  [
    ['#FFD700', 0],
    ['#FFFFFF', Math.PI * 0.7],
    ['#FF6B9D', Math.PI * 1.4],
  ].forEach(([color, offset]) => {
    const x = Math.cos(orbit + offset) * 17;
    const y = -39 + Math.sin(orbit + offset) * 5;
    drawStar(ctx, x, y, 5, 5, 2.2, color);
  });
  ctx.restore();
}

function drawLegs(ctx, time, charlie) {
  const speed = Math.hypot(charlie.vx || 0, charlie.vy || 0);
  const walk  = speed > 0.5 ? time * 0.013 : 0;
  // Shorter, stubbier legs — thick and rounded
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  [[0, 0], [7, 1.1], [13, 2.2]].forEach(([ly, phase]) => {
    const lw = Math.sin(walk + phase) * 3.5;
    const rw = -Math.sin(walk + phase) * 3.5;
    ctx.beginPath(); ctx.moveTo(-12, ly); ctx.lineTo(-19, ly + lw + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 12, ly); ctx.lineTo( 19, ly + rw + 4); ctx.stroke();
  });
}

// ── Cosmetic: Wings ───────────────────────────────────────────────────────────

function drawWings(ctx, cosmetic, time) {
  const { type, color1, color2 } = cosmetic;
  const flap = Math.sin(time * 0.004) * 0.08;

  if (type === 'butterfly') {
    ctx.save();
    ctx.globalAlpha = 0.82;
    // Upper wings
    [[-1, -1], [1, -1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.bezierCurveTo(8 + flap * 60, -20, 28, -14, 22, 2);
      ctx.bezierCurveTo(16, 12, 4, 6, 0, -4);
      ctx.fillStyle = color1;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Lower wings
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(14, 6, 22, 18, 14, 22);
      ctx.bezierCurveTo(6, 24, 2, 14, 0, 0);
      ctx.fillStyle = color2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();

  } else if (type === 'cape') {
    ctx.save();
    ctx.globalAlpha = 0.9;
    // Two flowing cape panels
    [[-1, -1], [1, -1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(20 + flap * 30, 4, 16, 22);
      ctx.quadraticCurveTo(8, 26, 0, 18);
      ctx.closePath();
      ctx.fillStyle = color1;
      ctx.fill();
      // Gold trim
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(20, 4, 16, 22);
      ctx.strokeStyle = color2;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();

  } else if (type === 'seagull') {
    ctx.save();
    ctx.globalAlpha = 0.85;
    [[-1, -1], [1, -1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.quadraticCurveTo(16, -16 - flap * 40, 28, -8);
      ctx.quadraticCurveTo(20, -4, 0, -2);
      ctx.fillStyle = color1;
      ctx.fill();
      ctx.strokeStyle = color2;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();

  } else if (type === 'leaf') {
    ctx.save();
    ctx.globalAlpha = 0.88;
    [[-1, -1], [1, -1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(12, -18, 28, -12, 22, 4);
      ctx.bezierCurveTo(16, 14, 4, 8, 0, 0);
      ctx.fillStyle = color1;
      ctx.fill();
      // Leaf vein
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(18, -6);
      ctx.strokeStyle = color2;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();

  } else if (type === 'rocket') {
    ctx.save();
    ctx.globalAlpha = 0.9;
    [[-1, -1], [1, -1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      // Rocket fin shape
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(20, -16);
      ctx.lineTo(22, -4);
      ctx.lineTo(18, 10);
      ctx.lineTo(0, 8);
      ctx.closePath();
      ctx.fillStyle = color1;
      ctx.fill();
      ctx.strokeStyle = color2;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Flame (at bottom)
      ctx.beginPath();
      ctx.moveTo(4, 8);
      ctx.lineTo(2 + flap * 20, 20);
      ctx.lineTo(8, 8);
      ctx.fillStyle = '#FFEB3B';
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();

  } else if (type === 'rainbowwings') {
    ctx.save();
    ctx.globalAlpha = 0.82;
    [[-1, -1], [1, -1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      RAINBOW_COLORS.forEach((rc, i) => {
        ctx.beginPath();
        const r = 10 + i * 4;
        ctx.arc(0, 4, r, -Math.PI * 0.9, -Math.PI * 0.1);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = rc;
        ctx.stroke();
      });
      ctx.restore();
    });
    ctx.restore();

  } else if (type === 'smokewings') {
    ctx.save();
    [[-1, -1], [1, -1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = color1;
      ctx.beginPath();
      ctx.ellipse(18, -6, 18, 24, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = color2;
      ctx.beginPath();
      ctx.ellipse(15, -4, 11, 16, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();

  } else if (type === 'spellwings') {
    ctx.save();
    [[-1, -1], [1, -1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      const grad = ctx.createLinearGradient(0, -4, 30, -12);
      grad.addColorStop(0, color2);
      grad.addColorStop(1, color1);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.bezierCurveTo(12, -24, 34, -18, 26, 0);
      ctx.bezierCurveTo(20, 12, 7, 8, 0, -4);
      ctx.fill();
      ctx.strokeStyle = color2;
      ctx.lineWidth = 1;
      ctx.stroke();
      [[10, -16], [18, -11], [24, -5]].forEach(([x, y]) => {
        drawStar(ctx, x, y, 5, 2.8, 1.1, '#FFFFFF');
      });
      ctx.restore();
    });
    ctx.restore();

  } else if (type === 'palettewings') {
    ctx.save();
    ctx.globalAlpha = 0.7;
    [[-1, -1], [1, -1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 4, 8 + i * 4, -Math.PI * 0.85, -Math.PI * 0.08);
        ctx.lineWidth = 5;
        ctx.strokeStyle = RAINBOW_COLORS[(i * 2) % RAINBOW_COLORS.length];
        ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();

  } else if (type === 'ovenmitts') {
    ctx.save();
    [[-1, -1], [1, -1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      ctx.fillStyle = color1;
      ctx.beginPath();
      ctx.roundRect(10, -4, 14, 18, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(17, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color2;
      ctx.fillRect(10, 9, 14, 4);
      ctx.restore();
    });
    ctx.restore();

  } else if (type === 'energywings') {
    ctx.save();
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.85;
    [-1, 1].forEach(side => {
      const grad = ctx.createRadialGradient(side * 12, 0, 2, side * 20, 4, 34);
      grad.addColorStop(0, 'rgba(57,255,20,0.9)');
      grad.addColorStop(1, 'rgba(57,255,20,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(side * 14, -22, side * 36, -6, side * 30, 20);
      ctx.bezierCurveTo(side * 24, 32, side * 8, 14, 0, 0);
      ctx.fill();
      ctx.save();
      ctx.scale(0.55, 0.55);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(side * 14, -22, side * 36, -6, side * 30, 20);
      ctx.bezierCurveTo(side * 24, 32, side * 8, 14, 0, 0);
      ctx.fill();
      ctx.restore();
      [[8, -13], [16, -16], [24, -8], [28, 4]].forEach(([ox, oy]) => {
        ctx.strokeStyle = 'rgba(57,255,20,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(side * ox, oy, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = color1;
        ctx.beginPath();
        ctx.arc(side * ox, oy, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.shadowBlur = 0;
    ctx.restore();

  } else if (type === 'frostwings') {
    ctx.save();
    ctx.shadowColor = color1;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.75;
    [-1, 1].forEach(side => {
      const grad = ctx.createLinearGradient(0, 0, side * 32, -18);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * 8, -18);
      ctx.lineTo(side * 24, -22);
      ctx.lineTo(side * 32, -10);
      ctx.lineTo(side * 28, 8);
      ctx.lineTo(side * 14, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      [[8, -18, 28, 8], [24, -22, 14, 16], [0, 0, 32, -10]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(side * x1, y1);
        ctx.lineTo(side * x2, y2);
        ctx.stroke();
      });
    });
    ctx.restore();

  } else if (type === 'petalwings') {
    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = color1;
    [-1, 1].forEach(side => {
      [0, 15, 28, 40].forEach((deg, i) => {
        ctx.save();
        ctx.globalAlpha = [0.9, 0.75, 0.6, 0.45][i];
        ctx.rotate(side * deg * Math.PI / 180);
        ctx.fillStyle = i === 3 ? color2 : color1;
        ctx.strokeStyle = color2;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(side * 6, -12, side * 18, -14, side * 16, 0);
        ctx.bezierCurveTo(side * 14, 10, side * 4, 8, 0, 0);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
    });
    ctx.restore();

  } else if (type === 'fairywings') {
    ctx.save();
    ctx.globalAlpha = 0.72;
    [[-1, -1], [1, 1]].forEach(([sx, side]) => {
      const grad = ctx.createRadialGradient(8 * side, -16, 2, 10 * side, -4, 28);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, color1);
      ctx.save();
      ctx.scale(sx, 1);
      ctx.fillStyle = grad;
      ctx.strokeStyle = color2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(14, -10, 16, 22, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(10, 8, 12, 14, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.beginPath();
      ctx.ellipse(8, -18, 4, 8, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }
}

// ── Cosmetic: Body patterns ───────────────────────────────────────────────────

function drawDress(ctx, cosmetic, time) {
  const { type, color1, color2 } = cosmetic;

  if (type === 'ballgown') {
    const gown = ctx.createRadialGradient(0, 10, 2, 0, 18, 22);
    gown.addColorStop(0, color2);
    gown.addColorStop(1, color1);
    ctx.fillStyle = gown;
    ctx.fillRect(-18, -4, 36, 44);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    [6, 11, 16].forEach(r => {
      ctx.beginPath();
      ctx.arc(0, 18, r, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    });
    [[-7, 6], [6, 8], [0, 14], [-6, 23], [7, 27]].forEach(([x, y]) => {
      drawStar(ctx, x, y, 5, 2, 0.9, color2);
    });

  } else if (type === 'turnoutcoat') {
    ctx.fillStyle = color1;
    ctx.fillRect(-18, -4, 36, 44);
    ctx.fillStyle = color2;
    ctx.fillRect(-16, 10, 32, 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    [0, 8].forEach(offset => {
      ctx.beginPath();
      ctx.moveTo(-14, 6 + offset);
      ctx.lineTo(0, 2 + offset);
      ctx.lineTo(14, 6 + offset);
      ctx.stroke();
    });
    ctx.fillStyle = color2;
    [[-4, 16], [4, 16]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (type === 'starryrobe') {
    const robe = ctx.createRadialGradient(0, 8, 2, 0, 18, 24);
    robe.addColorStop(0, color1);
    robe.addColorStop(1, shadeColor(color1, -35));
    ctx.fillStyle = robe;
    ctx.fillRect(-18, -4, 36, 44);
    [[-8, 3], [6, 2], [-2, 8], [9, 12], [-9, 15], [1, 19], [-5, 27], [8, 29]].forEach(([x, y]) => {
      drawStar(ctx, x, y, 5, 2.5, 1, color2);
    });
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(3, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'flightsuit') {
    ctx.fillStyle = color1;
    ctx.fillRect(-18, -4, 36, 44);
    ctx.fillStyle = color2;
    ctx.fillRect(-16, -4, 8, 6);
    ctx.fillRect(8, -4, 8, 6);
    ctx.beginPath();
    ctx.arc(0, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    drawStar(ctx, 0, 8, 5, 3.2, 1.3, '#FFFFFF');
    ctx.strokeStyle = hexToRgba(color2, 0.4);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.stroke();

  } else if (type === 'chefapron') {
    ctx.fillStyle = color1;
    ctx.fillRect(-18, -4, 36, 44);
    ctx.fillStyle = color2;
    ctx.fillRect(-16, 2, 32, 5);
    [[-10, 12], [2, 12]].forEach(([x, y]) => {
      ctx.fillStyle = hexToRgba(color2, 0.3);
      ctx.fillRect(x, y, 10, 10);
      ctx.strokeStyle = color2;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, 10, 10);
    });
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.bezierCurveTo(-3, -5, -7, -2, -4, 2);
    ctx.bezierCurveTo(-2, 5, 0, 6, 0, 6);
    ctx.bezierCurveTo(0, 6, 2, 5, 4, 2);
    ctx.bezierCurveTo(7, -2, 3, -5, 0, -1);
    ctx.fill();

  } else if (type === 'paintsmock') {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = color1;
    ctx.fillRect(-18, -4, 36, 44);
    ctx.restore();
    for (let i = 0; i < 10; i++) {
      const x = -11 + ((i * 7) % 24);
      const y = 1 + ((i * 11) % 32);
      ctx.fillStyle = RAINBOW_COLORS[i % RAINBOW_COLORS.length];
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    RAINBOW_COLORS.slice(0, 3).forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-12, 8 + i * 7);
      ctx.quadraticCurveTo(-2, 4 + i * 7, 12, 10 + i * 7);
      ctx.stroke();
    });

  } else if (type === 'cosmicoutfit') {
    const suit = ctx.createLinearGradient(0, -6, 0, 38);
    suit.addColorStop(0, color1);
    suit.addColorStop(1, shadeColor(color1, -20));
    ctx.fillStyle = suit;
    ctx.fillRect(-18, -6, 36, 46);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = color1;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, 14);
    ctx.bezierCurveTo(-20, 20, -22, 32, -16, 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, 14);
    ctx.bezierCurveTo(20, 20, 22, 32, 16, 38);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = color2;
    ctx.fillRect(-16, 6, 32, 5);
    ctx.fillRect(-16, -8, 6, 4);
    ctx.fillRect(10, -8, 6, 4);
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, -6);
    ctx.lineTo(5, 2);
    ctx.lineTo(-5, 2);
    ctx.lineTo(-6, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#CC00FF';
    [[0, -5], [-3, -1], [3, -1]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (type === 'frostgown') {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#E1F5FE';
    ctx.beginPath();
    ctx.ellipse(0, 21, 17, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const frost = ctx.createLinearGradient(0, -8, 0, 38);
    frost.addColorStop(0, color2);
    frost.addColorStop(1, color1);
    ctx.fillStyle = frost;
    ctx.fillRect(-18, -8, 36, 48);
    [[-8, 2], [5, 1], [0, 8], [-7, 15], [8, 18], [1, 27]].forEach(([x, y], i) => {
      ctx.save();
      if (i < 3) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 0.004 + i * 1.2);
      drawStar(ctx, x, y, 6, 4, 2, color2);
      ctx.restore();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-16, 4, 32, 2);
    [-12, -4, 4, 12].forEach(x => {
      ctx.fillStyle = color1;
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x + 2, 24);
      ctx.lineTo(x, 28);
      ctx.lineTo(x - 2, 24);
      ctx.closePath();
      ctx.fill();
    });

  } else if (type === 'gardengown') {
    const garden = ctx.createRadialGradient(0, 8, 2, 0, 18, 24);
    garden.addColorStop(0, 'rgba(255,255,255,0.9)');
    garden.addColorStop(1, color1);
    ctx.fillStyle = garden;
    ctx.fillRect(-18, -8, 36, 48);
    ctx.fillStyle = color2;
    ctx.fillRect(-16, 4, 32, 4);
    [[-2, 6], [0, 4], [2, 6]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = color1;
      ctx.fill();
    });
    [-12, -6, 0, 6, 12].forEach((x, i) => {
      drawSimpleBloom(ctx, x, 20 + Math.abs(i - 2), 2.4, color1);
    });
    [[-7, 0], [7, 10], [0, 27]].forEach(([x, y], i) => {
      ctx.save();
      if (i === 0) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 0.004);
      drawStar(ctx, x, y, 5, 3.5, 1.5, color2);
      ctx.restore();
    });
  }
}

function drawBodyPattern(ctx, cosmetic, time) {
  const { type, color1, color2 } = cosmetic;

  if (type === 'royaldots') {
    ctx.fillStyle = color1;
    [[-5,-4],[5,-4],[0,4],[-5,11],[5,11]].forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI*2); ctx.fill();
    });
  } else if (type === 'floral') {
    ctx.fillStyle = color1;
    [[-4,0],[4,0],[0,8]].forEach(([fx,fy]) => {
      for (let i = 0; i < 4; i++) {
        const a = (i/4)*Math.PI*2;
        ctx.beginPath();
        ctx.arc(fx+Math.cos(a)*3, fy+Math.sin(a)*3, 2.5, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.fillStyle = color2;
      ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = color1;
    });
  } else if (type === 'waves') {
    ctx.strokeStyle = color1;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    [-6, 0, 6, 12].forEach(wy => {
      ctx.beginPath();
      ctx.moveTo(-11, wy);
      ctx.quadraticCurveTo(-5, wy-4, 0, wy);
      ctx.quadraticCurveTo(5, wy+4, 11, wy);
      ctx.stroke();
    });
  } else if (type === 'mossyspots') {
    [[-5,-2],[5,-2],[-2,8],[4,9],[0,15]].forEach(([x,y]) => {
      ctx.fillStyle = color1;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = color2;
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
    });
  } else if (type === 'galaxy') {
    // Swirling gradient-like pattern
    ctx.strokeStyle = color2;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = (i/3)*Math.PI*2 + time*0.001;
      ctx.beginPath();
      ctx.arc(Math.cos(a)*4, 4+Math.sin(a)*5, 4, 0, Math.PI*1.2);
      ctx.stroke();
    }
    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    [[-4,-4],[5,2],[-2,10],[4,14]].forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI*2); ctx.fill();
    });
  } else if (type === 'stararmor') {
    const armor = ctx.createRadialGradient(0, 2, 2, 0, 7, 18);
    armor.addColorStop(0, shadeColor(color1, 18));
    armor.addColorStop(1, shadeColor(color1, -28));
    ctx.fillStyle = armor;
    ctx.fillRect(-14, -10, 28, 32);
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(8, -4);
    ctx.lineTo(6, 7);
    ctx.lineTo(-6, 7);
    ctx.lineTo(-8, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color2;
    ctx.fillRect(-14, -5, 5, 3);
    ctx.fillRect(9, -5, 5, 3);
    ctx.fillStyle = '#CC00FF';
    [[0, -2], [-3, 3], [3, 3]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === 'icepattern') {
    ctx.fillStyle = color1;
    ctx.fillRect(-14, -10, 28, 32);
    ctx.save();
    ctx.globalAlpha = 0.7;
    [[0, -8], [8, 4], [-8, 4], [0, 10], [-4, -2]].forEach(([x, y]) => {
      drawMiniSnowflake(ctx, x, y, 4, color2);
    });
    ctx.restore();
    const shimmer = ctx.createLinearGradient(-13, 2, 13, 2);
    shimmer.addColorStop(0, 'rgba(255,255,255,0)');
    shimmer.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    shimmer.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shimmer;
    ctx.fillRect(-13, 0, 26, 5);
  } else if (type === 'rosepattern') {
    ctx.fillStyle = color1;
    ctx.fillRect(-14, -10, 28, 32);
    drawRose(ctx, 0, 0, color1, color2, 0.7);
    ctx.fillStyle = color2;
    [[-6, 6, -1], [6, 6, 1]].forEach(([x, y, dir]) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + dir * 4, y - 4, x + dir * 8, y - 1, x + dir * 5, y + 3);
      ctx.bezierCurveTo(x + dir * 2, y + 5, x, y + 2, x, y);
      ctx.fill();
    });
    [[-6, -6], [7, -4], [-8, 10], [6, 12], [0, 15]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === 'rainbowstripes') {
    RAINBOW_COLORS.forEach((rc, i) => {
      ctx.fillStyle = rc;
      ctx.fillRect(-12, -15 + i * 5, 24, 5);
    });
  } else if (type === 'sparkledress') {
    const dress = ctx.createLinearGradient(0, -12, 0, 20);
    dress.addColorStop(0, color1);
    dress.addColorStop(1, color2);
    ctx.fillStyle = dress;
    ctx.fillRect(-14, -16, 28, 34);
    [
      [-6, -7], [3, -5], [-1, 0], [7, 3],
      [-7, 6], [2, 9], [-3, 14], [6, 15],
    ].forEach(([sx, sy], i) => {
      ctx.save();
      if (i < 3) ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 0.005 + i);
      drawStar(ctx, sx, sy, 5, 3, 1.2, '#FFFFFF');
      ctx.restore();
    });
  }
}

// ── Cosmetic: Antennae tips ───────────────────────────────────────────────────

function drawAntennaTip(ctx, x, y, type, color1, color2, time = 0) {
  ctx.save();
  ctx.translate(x, y);

  if (type === 'dot') {
    ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI*2);
    ctx.fillStyle = '#212121'; ctx.fill();

  } else if (type === 'heart') {
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.bezierCurveTo(-5, -4, -8, 0, -4, 4);
    ctx.bezierCurveTo(-2, 6, 0, 7, 0, 7);
    ctx.bezierCurveTo(0, 7, 2, 6, 4, 4);
    ctx.bezierCurveTo(8, 0, 5, -4, 0, 1);
    ctx.scale(0.6, 0.6); ctx.fill();
    // revert scale effect by drawing in parent
    ctx.restore();
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.moveTo(0, 0.6);
    ctx.bezierCurveTo(-3, -2.5, -4.8, 0, -2.4, 2.4);
    ctx.bezierCurveTo(-1.2, 3.5, 0, 4, 0, 4);
    ctx.bezierCurveTo(0, 4, 1.2, 3.5, 2.4, 2.4);
    ctx.bezierCurveTo(4.8, 0, 3, -2.5, 0, 0.6);
    ctx.fill();

  } else if (type === 'star') {
    drawStar(ctx, 0, 0, 5, 4.5, 2.2, color1);

  } else if (type === 'diamond') {
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.moveTo(0, -4); ctx.lineTo(3.5, 0); ctx.lineTo(0, 4); ctx.lineTo(-3.5, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color2 || 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

  } else if (type === 'starfish') {
    drawStar(ctx, 0, 0, 5, 5, 2, color1);

  } else if (type === 'acorn') {
    // Cap
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.ellipse(0, -1.5, 4, 3, 0, 0, Math.PI*2); ctx.fill();
    // Stem nub
    ctx.fillStyle = '#5D4037';
    ctx.beginPath(); ctx.rect(-0.7, -4.5, 1.4, 2); ctx.fill();
    // Body
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.ellipse(0, 3, 3.5, 4.5, 0, 0, Math.PI*2); ctx.fill();

  } else if (type === 'rainbowtips') {
    RAINBOW_COLORS.slice(0,5).forEach((rc, i) => {
      ctx.fillStyle = rc;
      ctx.beginPath();
      ctx.arc(0, 0, 5 - i, 0, Math.PI*2);
      ctx.fill();
    });
  } else if (type === 'wand') {
    ctx.strokeStyle = hexToRgba(color2 || '#F48FB1', 0.25);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();
    drawStar(ctx, 0, 0, 5, 7, 3, color1);
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 11, Math.sin(a) * 11, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'flame') {
    const flame = ctx.createLinearGradient(0, 4, 0, -12);
    flame.addColorStop(0, color2 || '#FFEB3B');
    flame.addColorStop(1, color1 || '#FF6F00');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-5, -2, -3, -10, 0, -12);
    ctx.bezierCurveTo(3, -10, 5, -2, 0, 4);
    ctx.fill();

  } else if (type === 'satellite') {
    ctx.fillStyle = color1;
    ctx.fillRect(-6, -1, 12, 3);
    ctx.fillRect(-1, -6, 3, 12);
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'spoon') {
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-1, 0, 2, 8);

  } else if (type === 'paintbrush') {
    ctx.fillStyle = '#BDBDBD';
    ctx.fillRect(-2, -2, 4, 6);
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.ellipse(0, -6, 3, 6, 0, Math.PI, 0);
    ctx.fill();

  } else if (type === 'plasma') {
    const r = 4.5 + Math.sin(time * 0.008) * 1.5;
    const plasma = ctx.createRadialGradient(0, 0, 1, 0, 0, r + 6);
    plasma.addColorStop(0, color1);
    plasma.addColorStop(1, 'rgba(57,255,20,0)');
    ctx.fillStyle = plasma;
    ctx.beginPath();
    ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(57,255,20,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = color1;
    ctx.lineWidth = 1.5;
    [0, Math.PI / 2, Math.PI / 4, Math.PI * 0.75].forEach(a => {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 2, Math.sin(a) * 2);
      ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
      ctx.stroke();
    });
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'snowflake') {
    const scale = 0.85 + 0.15 * Math.sin(time * 0.006);
    ctx.scale(scale, scale);
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#4FC3F7';
    drawDetailedSnowflake(ctx, 0, 0, 7, color1);
    ctx.shadowBlur = 0;
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'starpetal') {
    const scale = 0.9 + 0.1 * Math.sin(time * 0.005);
    ctx.scale(scale, scale);
    ctx.strokeStyle = hexToRgba(color2 || '#FFD700', 0.3);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();
    drawStar(ctx, 0, 0, 5, 6, 3, color1);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = color1;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
      ctx.save();
      ctx.translate(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Cosmetic: Hats ────────────────────────────────────────────────────────────

function drawHat(ctx, cosmetic, time) {
  const { type, color1, color2 } = cosmetic;

  if (type === 'crown') {
    ctx.fillStyle = color1;
    // Base band
    ctx.fillRect(-10, -30, 20, 6);
    // Spikes
    [[-7,-38],[0,-44],[7,-38]].forEach(([sx,sy]) => {
      ctx.beginPath();
      ctx.moveTo(sx-4,-30); ctx.lineTo(sx,sy); ctx.lineTo(sx+4,-30);
      ctx.closePath(); ctx.fill();
    });
    // Gems
    ctx.fillStyle = color2;
    ctx.beginPath(); ctx.arc(0,-44,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-5,-27,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 5,-27,2,0,Math.PI*2); ctx.fill();

  } else if (type === 'flowercrown') {
    const sway = Math.sin(time * 0.002) * 1;
    ctx.save(); ctx.translate(sway, 0);
    // Band (arc)
    ctx.beginPath();
    ctx.arc(0, -14, 13, Math.PI+0.3, -0.3);
    ctx.strokeStyle = color2;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Three flowers
    [[-10,-23],[0,-27],[10,-23]].forEach(([fx,fy]) => {
      for (let i = 0; i < 5; i++) {
        const a = (i/5)*Math.PI*2;
        ctx.beginPath();
        ctx.arc(fx+Math.cos(a)*4, fy+Math.sin(a)*4, 3, 0, Math.PI*2);
        ctx.fillStyle = color1; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(fx,fy,2.5,0,Math.PI*2);
      ctx.fillStyle = '#FFEB3B'; ctx.fill();
    });
    ctx.restore();

  } else if (type === 'sunhat') {
    ctx.fillStyle = color1;
    // Wide brim
    ctx.beginPath();
    ctx.ellipse(0, -26, 18, 5, 0, 0, Math.PI*2);
    ctx.fill();
    // Dome
    ctx.beginPath();
    ctx.ellipse(0, -32, 11, 9, 0, Math.PI, 0);
    ctx.fill();
    // Band
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.ellipse(0, -27.5, 11, 2.5, 0, 0, Math.PI*2);
    ctx.fill();

  } else if (type === 'mushroom') {
    // Stem
    ctx.fillStyle = '#EFE0D0';
    ctx.beginPath();
    ctx.ellipse(0, -24, 5, 5, 0, 0, Math.PI*2); ctx.fill();
    // Cap
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.ellipse(0, -32, 14, 10, 0, Math.PI, 0);
    ctx.fill();
    // Spots
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    [[-5,-32],[4,-29],[0,-36]].forEach(([sx,sy]) => {
      ctx.beginPath(); ctx.arc(sx,sy,2.5,0,Math.PI*2); ctx.fill();
    });

  } else if (type === 'astronaut') {
    // Visor dome
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.arc(0, -16, 16, 0, Math.PI*2);
    ctx.fill();
    const domeGlass = ctx.createRadialGradient(0, -16, 2, 0, -16, 16);
    domeGlass.addColorStop(0, 'rgba(255,255,255,0.18)');
    domeGlass.addColorStop(1, 'rgba(180,220,255,0.35)');
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = domeGlass;
    ctx.beginPath();
    ctx.arc(0, -16, 16, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#BBDEFB';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = shadeColor(color1, -15);
    ctx.fillRect(-7, -4, 14, 5);
    // Visor glass
    const visorGlass = ctx.createRadialGradient(0, -16, 2, 0, -16, 11);
    visorGlass.addColorStop(0, 'rgba(180,220,255,0.7)');
    visorGlass.addColorStop(1, 'rgba(100,160,220,0.3)');
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = visorGlass;
    ctx.beginPath();
    ctx.arc(0, -16, 11, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(100,180,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Reflection glint
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(-4, -22, 3.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(-1, -25, 1.5, 0, Math.PI*2); ctx.fill();

  } else if (type === 'rainbowhat') {
    // Rainbow arches
    RAINBOW_COLORS.forEach((rc, i) => {
      ctx.beginPath();
      ctx.arc(0, -22, 14 - i*1.8, Math.PI, 0);
      ctx.lineWidth = 3;
      ctx.strokeStyle = rc;
      ctx.stroke();
    });
    // Base
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-14, -23, 28, 4);
  } else if (type === 'tiara') {
    ctx.fillStyle = color1;
    ctx.fillRect(-10, -27, 20, 5);
    [[-7, -35], [0, -40], [7, -35]].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.moveTo(px - 4, -27);
      ctx.lineTo(px, py);
      ctx.lineTo(px + 4, -27);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color2;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color1;
    });
    ctx.fillStyle = color2;
    for (let px = -8; px <= 8; px += 4) {
      ctx.beginPath();
      ctx.arc(px, -24.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'wizardhat') {
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.ellipse(0, -22, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-16, -22);
    ctx.lineTo(0, -56);
    ctx.lineTo(16, -22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = color2;
    ctx.fillRect(-10, -28, 20, 4);
    drawStar(ctx, 0, -56, 5, 4, 1.8, color2);

  } else if (type === 'firehelmet') {
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.ellipse(0, -22, 14, 9, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = shadeColor(color1, -20);
    ctx.fillRect(-16, -22, 32, 4);
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(0, -25, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -26);
    ctx.lineTo(10, -26);
    ctx.stroke();

  } else if (type === 'chefhat') {
    ctx.fillStyle = color2;
    ctx.fillRect(-12, -22, 24, 5);
    ctx.fillStyle = color1;
    [[0, -34, 10], [-10, -31, 7], [-5, -39, 7], [5, -39, 7], [10, -31, 7]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (type === 'beret') {
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.ellipse(-2, -26, 13, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -24, 2, 0, Math.PI * 2);
    ctx.fillStyle = shadeColor(color1, -20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-3, -28, 8, Math.PI * 1.1, Math.PI * 1.75);
    ctx.stroke();
  } else if (type === 'coppercrown') {
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.ellipse(0, -20, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color1;
    ctx.lineCap = 'round';
    [[-1, -15, -18, -28, -8, -34, 18, -26, 42], [1, 15, -18, 28, -8, 34, 18, 26, 42]].forEach(([side, x1, y1, x2, y2, x3, y3, x4, y4]) => {
      ctx.strokeStyle = color1;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x2, y2, x3, y3, x4, y4);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(220,100,30,0.5)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x1 + side * 2, y1);
      ctx.bezierCurveTo(x2 + side * 2, y2, x3 + side * 2, y3, x4 + side * 2, y4);
      ctx.stroke();
    });
    ctx.strokeStyle = color1;
    ctx.lineWidth = 4;
    [[-8, -22, -10, -30, -6, -34], [0, -22, -1, -31, 3, -35], [8, -22, 10, -30, 6, -34]].forEach(([x1, y1, cx, cy, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cx, cy, x2, y2);
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -22, 7, 0, Math.PI * 2);
    ctx.stroke();
    drawStar(ctx, 0, -22, 5, 4, 2.5, color2);

  } else if (type === 'icecrown') {
    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#81D4FA';
    ctx.fillStyle = color2;
    ctx.strokeStyle = color1;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, -22, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    [[0, -48, 1], [-7, -40, 0.75], [7, -40, 0.75], [-13, -34, 0.55], [13, -32, 0.55]].forEach(([x, tip, scale]) => {
      ctx.save();
      ctx.translate(x, -22);
      ctx.scale(scale, scale);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = color1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(3, tip + 26);
      ctx.lineTo(0, tip + 22);
      ctx.lineTo(-3, tip + 26);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color2;
      ctx.beginPath();
      ctx.arc(0, tip + 22, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.strokeStyle = color2;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * -4, -22 + Math.sin(a) * -4);
      ctx.lineTo(Math.cos(a) * 4, -22 + Math.sin(a) * 4);
      ctx.stroke();
    }
    ctx.restore();

  } else if (type === 'gardencrown') {
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.ellipse(0, -22, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    [[0, -24, 8], [-9, -22, 6], [9, -22, 6], [-16, -20, 5], [16, -20, 5]].forEach(([x, y, r]) => {
      drawFlowerBloom(ctx, x, y, r, color1, color2);
    });
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -40, 7, 0, Math.PI * 2);
    ctx.stroke();
    drawStar(ctx, 0, -40, 5, 5, 2.2, color2);
    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-13, -21);
    ctx.quadraticCurveTo(0, -25, 13, -21);
    ctx.stroke();
  }
}

// ── Collectible items in the world ────────────────────────────────────────────

function drawItem(ctx, item, time, camera, charlieWorldX, charlieWorldY) {
  if (item.collected) return;

  const sx = item.x - camera.x;
  const sy = item.y - camera.y;
  const bob = Math.sin(time * 0.003 + item.x) * 5;
  const spin = time * 0.001;
  const pulse = 0.85 + Math.sin(time * 0.005 + item.y) * 0.15;
  const hasCharlie = Number.isFinite(charlieWorldX) && Number.isFinite(charlieWorldY);
  const dist = hasCharlie ? Math.hypot(item.x - charlieWorldX, item.y - charlieWorldY) : Infinity;
  const excitement = 1 + 0.18 * Math.sin(time * 0.012) * Math.max(0, (160 - dist) / 160);

  // Ground glow stays on the ground.
  ctx.save();
  ctx.translate(sx, sy);
  const groundGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 30);
  groundGlow.addColorStop(0, `rgba(255,240,100,${0.4 * pulse})`);
  groundGlow.addColorStop(1, 'rgba(255,240,100,0)');
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI*2);
  ctx.fillStyle = groundGlow;
  ctx.fill();
  const innerGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
  innerGlow.addColorStop(0, item.color1);
  innerGlow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fillStyle = innerGlow;
  ctx.fill();
  ctx.restore();

  // A clear "come get this" ring helps new players understand the goal.
  ctx.save();
  ctx.translate(sx, sy);
  ctx.strokeStyle = `rgba(255,255,255,${0.45 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 32 + pulse * 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,214,90,${0.6 * pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 39 + pulse * 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(sx, sy + bob);
  ctx.scale(excitement, excitement);

  // Outer spinning sparkle star (larger than before)
  ctx.save();
  ctx.rotate(spin);
  drawStar(ctx, 0, 0, 4, 26, 5, `rgba(255,230,60,${0.5 * pulse})`);
  ctx.restore();

  // Inner counter-spinning star
  ctx.save();
  ctx.rotate(-spin * 1.3);
  drawStar(ctx, 0, 0, 6, 18, 7, `rgba(255,255,255,${0.4 * pulse})`);
  ctx.restore();

  [[-14, -14], [14, -10], [0, 16]].forEach(([dotX, dotY], i) => {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 0.007 + i * 1.2);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // White bubble backing with item-coloured border.
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0,0,0,0.14)';
  ctx.strokeStyle = item.color1;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.shadowColor = 'rgba(0,0,0,0)';

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(-7, -8, 6, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Icon at larger scale
  ctx.scale(0.75, 0.75);
  drawItemIcon(ctx, item, time);

  ctx.restore();
}

function drawFootprints(ctx, footprints, camera) {
  footprints.forEach(print => {
    const sx = print.x - camera.x;
    const sy = print.y - camera.y;
    if (sx < -20 || sx > CANVAS_W + 20 || sy < -20 || sy > CANVAS_H + 20) return;
    const px = Math.cos(print.facing) * 4;
    const py = Math.sin(print.facing) * 4;

    ctx.save();
    ctx.globalAlpha = print.life * 0.35;
    ctx.fillStyle = '#2E5B2A';
    [[-px, -py], [px, py]].forEach(([fx, fy]) => {
      ctx.save();
      ctx.translate(sx + fx, sy + fy);
      ctx.rotate(print.facing);
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  });
}

function drawGuideArrow(ctx, charlie, items, camera, time) {
  const target = items
    .filter(item => !item.collected && !item.flying)
    .sort((a, b) => {
      const da = Math.hypot(a.x - charlie.x, a.y - charlie.y);
      const db = Math.hypot(b.x - charlie.x, b.y - charlie.y);
      return da - db;
    })[0];

  if (!target) return;

  const sx = target.x - camera.x;
  const sy = target.y - camera.y;
  if (sx >= 0 && sx <= CANVAS_W && sy >= 0 && sy <= CANVAS_H) return;

  const centerX = CANVAS_W / 2;
  const centerY = CANVAS_H / 2;
  const angle = Math.atan2(sy - centerY, sx - centerX);
  const edge = 36;
  const ax = Math.max(edge, Math.min(CANVAS_W - edge, sx));
  const ay = Math.max(edge, Math.min(CANVAS_H - edge, sy));
  const ringPulse = 0.5 + 0.5 * Math.sin(time * 0.006);

  ctx.save();
  ctx.translate(ax, ay);

  ctx.globalAlpha = 0.32 + ringPulse * 0.28;
  ctx.strokeStyle = target.color1;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 18 + ringPulse * 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-10, -13);
  ctx.lineTo(-10, 13);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = target.color1;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.restore();
}

function drawTapRipple(ctx, target, camera, time) {
  if (!target) return;

  const sx = target.x - camera.x;
  const sy = target.y - camera.y;

  ctx.save();
  ctx.translate(sx, sy);
  [0, 0.42].forEach(offset => {
    const t = ((time % 600) / 600 + offset) % 1;
    const radius = 6 + t * 16;
    ctx.globalAlpha = (1 - t) * (0.72 + 0.28 * Math.sin(time * (Math.PI * 2 / 600)));
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.strokeStyle = '#FFD65A';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  ctx.restore();
}

function drawTowerReturnPrompt(ctx, time) {
  const alpha = 0.7 + 0.3 * Math.sin(time * 0.005);
  const x = CANVAS_W / 2;
  const y = CANVAS_H - 30;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#9B59B6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x - 92, y - 17, 184, 34, 17);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#2D2D2D';
  ctx.fillText('🏰 Return to your tower!', x, y + 1);
  ctx.restore();
}

function drawNameCards(ctx, nameCards) {
  nameCards.forEach(card => {
    const age = 1.6 - card.life;
    const y = card.y - age * 55;
    const alpha = card.life > 1.2
      ? Math.min(1, (1.6 - card.life) / 0.4)
      : card.life > 0.35 ? 1 : card.life / 0.35;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFEB3B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(card.x - 65, y - 17, 130, 34, 17);
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.stroke();

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#2D2D2D';
    ctx.fillText(card.emoji, card.x - 53, y + 1);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(card.text, card.x - 27, y);
    ctx.restore();
  });
}

function drawCelebration(ctx, charlie, confetti, camera, time) {
  confetti.forEach(piece => {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rot);
    ctx.fillStyle = piece.color;
    ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
    ctx.restore();
  });

  const centerX = CANVAS_W / 2;
  const centerY = CANVAS_H / 2;
  const starPhase = time * 0.003;

  [
    [40 + Math.sin(starPhase) * 8, '#FFEB3B', 0.7],
    [70 + Math.sin(starPhase + 1) * 8, '#7EC8FF', 0.45],
    [100 + Math.sin(starPhase + 2) * 8, '#FF6B9D', 0.28],
  ].forEach(([radius, color, alpha], ringIndex) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + ringIndex * 0.22;
      drawStar(
        ctx,
        centerX + Math.cos(a) * radius,
        centerY + Math.sin(a) * radius,
        5,
        10,
        4,
        color
      );
    }
    ctx.restore();
  });

  const celebrationCharlie = {
    ...charlie,
    x: centerX + camera.x,
    y: centerY + camera.y,
    vx: 0,
    vy: 0,
  };
  drawCharlie(ctx, celebrationCharlie, time, camera);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 52px sans-serif';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#E94F62';
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeText('You did it! 🎉', CANVAS_W / 2, 60);
  ctx.fillText('You did it! 🎉', CANVAS_W / 2, 60);
  ctx.restore();
}

function drawItemIcon(ctx, item, time) {
  // Small preview icon for ground items — simplified cosmetic drawing
  const { type, color1, color2 } = item;

  if (type === 'crown') {
    ctx.fillStyle = color1;
    ctx.fillRect(-10,-8,20,6);
    [[-6,-16],[0,-20],[6,-16]].forEach(([sx,sy]) => {
      ctx.beginPath(); ctx.moveTo(sx-4,-8); ctx.lineTo(sx,sy); ctx.lineTo(sx+4,-8); ctx.fill();
    });
    ctx.fillStyle = color2;
    ctx.beginPath(); ctx.arc(0,-20,2.5,0,Math.PI*2); ctx.fill();

  } else if (type === 'flowercrown') {
    ctx.strokeStyle = color2; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0,0,10,Math.PI+0.4,-0.4); ctx.stroke();
    [[-8,-8],[0,-12],[8,-8]].forEach(([fx,fy]) => {
      for (let i=0;i<5;i++){const a=(i/5)*Math.PI*2;ctx.beginPath();ctx.arc(fx+Math.cos(a)*3,fy+Math.sin(a)*3,2.5,0,Math.PI*2);ctx.fillStyle=color1;ctx.fill();}
      ctx.beginPath();ctx.arc(fx,fy,2,0,Math.PI*2);ctx.fillStyle='#FFEB3B';ctx.fill();
    });

  } else if (type === 'sunhat') {
    ctx.fillStyle = color1;
    ctx.beginPath(); ctx.ellipse(0,2,16,5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0,-4,10,8,0,Math.PI,0); ctx.fill();
    ctx.fillStyle = color2;
    ctx.beginPath(); ctx.ellipse(0,0,10,2.5,0,0,Math.PI*2); ctx.fill();

  } else if (type === 'mushroom') {
    ctx.fillStyle = '#EFE0D0'; ctx.beginPath(); ctx.ellipse(0,6,5,7,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = color1; ctx.beginPath(); ctx.ellipse(0,-4,14,10,0,Math.PI,0); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.8)';[[-4,-4],[4,-2],[0,-8]].forEach(([sx,sy])=>{ctx.beginPath();ctx.arc(sx,sy,2.5,0,Math.PI*2);ctx.fill();});

  } else if (type === 'astronaut') {
    ctx.fillStyle = color1; ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#BBDEFB';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=color2;ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)';ctx.beginPath();ctx.arc(-3,-4,3,0,Math.PI*2);ctx.fill();

  } else if (type === 'rainbowhat') {
    RAINBOW_COLORS.forEach((rc,i)=>{ctx.beginPath();ctx.arc(0,6,14-i*1.8,Math.PI,0);ctx.lineWidth=3;ctx.strokeStyle=rc;ctx.stroke();});
    ctx.fillStyle='#fff';ctx.fillRect(-14,4,28,4);

  } else if (type === 'tiara') {
    ctx.fillStyle = color1;
    ctx.fillRect(-11, 2, 22, 5);
    [[-7, -7], [0, -14], [7, -7]].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.moveTo(px - 4, 2);
      ctx.lineTo(px, py);
      ctx.lineTo(px + 4, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color2;
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color1;
    });

  } else if (type === 'butterfly') {
    ctx.globalAlpha = 0.85;
    [[-1,1],[1,1]].forEach(([sx])=>{
      ctx.save();ctx.scale(sx,1);
      ctx.beginPath();ctx.moveTo(0,-4);ctx.bezierCurveTo(8,-16,22,-10,18,2);ctx.bezierCurveTo(12,10,4,6,0,-4);ctx.fillStyle=color1;ctx.fill();
      ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(12,6,18,16,12,18);ctx.bezierCurveTo(5,20,2,12,0,0);ctx.fillStyle=color2;ctx.fill();
      ctx.restore();
    });
    ctx.globalAlpha = 1;

  } else if (type === 'cape') {
    ctx.globalAlpha = 0.9;
    [[-1,1],[1,1]].forEach(([sx])=>{
      ctx.save();ctx.scale(sx,1);
      ctx.beginPath();ctx.moveTo(0,-6);ctx.quadraticCurveTo(18,4,14,22);ctx.quadraticCurveTo(6,24,0,16);ctx.fillStyle=color1;ctx.fill();
      ctx.restore();
    });
    ctx.strokeStyle=color2;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14,22);ctx.lineTo(14,22);ctx.stroke();
    ctx.globalAlpha = 1;

  } else if (type === 'seagull') {
    ctx.globalAlpha=0.85;
    [[-1,1],[1,1]].forEach(([sx])=>{ctx.save();ctx.scale(sx,1);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(14,-14,26,-6);ctx.quadraticCurveTo(18,-2,0,0);ctx.fillStyle=color1;ctx.fill();ctx.restore();});
    ctx.globalAlpha=1;

  } else if (type === 'leaf') {
    ctx.globalAlpha=0.88;
    [[-1,1],[1,1]].forEach(([sx])=>{ctx.save();ctx.scale(sx,1);ctx.beginPath();ctx.moveTo(0,2);ctx.bezierCurveTo(10,-14,24,-8,18,6);ctx.bezierCurveTo(12,14,4,8,0,2);ctx.fillStyle=color1;ctx.fill();ctx.restore();});
    ctx.globalAlpha=1;

  } else if (type === 'rocket') {
    ctx.globalAlpha=0.9;
    [[-1,1],[1,1]].forEach(([sx])=>{ctx.save();ctx.scale(sx,1);ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(18,-14);ctx.lineTo(20,-4);ctx.lineTo(16,10);ctx.lineTo(0,8);ctx.fillStyle=color1;ctx.fill();ctx.restore();});
    ctx.globalAlpha=1;

  } else if (type === 'rainbowwings') {
    ctx.globalAlpha=0.8;
    [[-1,1],[1,1]].forEach(([sx])=>{ctx.save();ctx.scale(sx,1);RAINBOW_COLORS.forEach((rc,i)=>{ctx.beginPath();ctx.arc(0,4,10+i*3.5,-Math.PI*0.9,-Math.PI*0.1);ctx.lineWidth=3;ctx.strokeStyle=rc;ctx.stroke();});ctx.restore();});
    ctx.globalAlpha=1;

  } else if (type === 'fairywings') {
    ctx.globalAlpha = 0.72;
    [[-1,1],[1,1]].forEach(([sx]) => {
      ctx.save();
      ctx.scale(sx, 1);
      ctx.fillStyle = color1;
      ctx.strokeStyle = color2;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(10, -6, 10, 15, 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(8, 8, 8, 10, 0.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    });
    ctx.globalAlpha = 1;

  } else if (type === 'heart') {
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.moveTo(0,1);ctx.bezierCurveTo(-5,-6,-12,0,-6,8);ctx.bezierCurveTo(-3,12,0,14,0,14);
    ctx.bezierCurveTo(0,14,3,12,6,8);ctx.bezierCurveTo(12,0,5,-6,0,1);
    ctx.fill();

  } else if (type === 'diamond') {
    ctx.fillStyle=color1;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(8,0);ctx.lineTo(0,12);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();
    ctx.strokeStyle=color2||'rgba(255,255,255,0.5)';ctx.lineWidth=1;ctx.stroke();

  } else if (type === 'star') {
    drawStar(ctx,0,0,5,14,6,color1);

  } else if (type === 'starfish') {
    drawStar(ctx,0,0,5,13,5,color1);

  } else if (type === 'acorn') {
    ctx.fillStyle=color2;ctx.beginPath();ctx.ellipse(0,-4,10,7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5D4037';ctx.beginPath();ctx.rect(-1.5,-12,3,5);ctx.fill();
    ctx.fillStyle=color1;ctx.beginPath();ctx.ellipse(0,6,8,10,0,0,Math.PI*2);ctx.fill();

  } else if (type === 'rainbowtips') {
    RAINBOW_COLORS.slice(0,5).forEach((rc,i)=>{ctx.beginPath();ctx.arc(0,0,12-i*2,0,Math.PI*2);ctx.fillStyle=rc;ctx.fill();});

  } else if (type === 'wand') {
    ctx.strokeStyle = color2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 10);
    ctx.lineTo(5, -4);
    ctx.stroke();
    drawStar(ctx, 8, -8, 5, 8, 3, color1);

  } else if (type === 'royaldots' || type === 'mossyspots') {
    ctx.fillStyle = color1;
    ctx.beginPath(); ctx.ellipse(0,0,12,16,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = color2;
    [[-4,-4],[4,-4],[0,4]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fill();});

  } else if (type === 'floral') {
    ctx.fillStyle=color2;ctx.beginPath();ctx.ellipse(0,0,12,16,0,0,Math.PI*2);ctx.fill();
    [[-4,0],[4,0],[0,8]].forEach(([fx,fy])=>{for(let i=0;i<4;i++){const a=(i/4)*Math.PI*2;ctx.beginPath();ctx.arc(fx+Math.cos(a)*4,fy+Math.sin(a)*4,3,0,Math.PI*2);ctx.fillStyle=color1;ctx.fill();}ctx.beginPath();ctx.arc(fx,fy,2,0,Math.PI*2);ctx.fillStyle='#FFEB3B';ctx.fill();});

  } else if (type === 'waves') {
    ctx.fillStyle='#BBDEFB';ctx.beginPath();ctx.ellipse(0,0,12,16,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=color1;ctx.lineWidth=2.5;
    [-4,2,8].forEach(wy=>{ctx.beginPath();ctx.moveTo(-11,wy);ctx.quadraticCurveTo(-5,wy-5,0,wy);ctx.quadraticCurveTo(5,wy+5,11,wy);ctx.stroke();});

  } else if (type === 'galaxy') {
    const grd=ctx.createRadialGradient(0,0,2,0,0,14);grd.addColorStop(0,color2);grd.addColorStop(1,color1);
    ctx.fillStyle=grd;ctx.beginPath();ctx.ellipse(0,0,12,16,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.7)';[[-5,-5],[4,2],[-2,8],[5,12]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fill();});

  } else if (type === 'rainbowstripes') {
    ctx.save();
    ctx.beginPath();ctx.ellipse(0,0,12,16,0,0,Math.PI*2);ctx.clip();
    RAINBOW_COLORS.forEach((rc,i)=>{ctx.fillStyle=rc;ctx.fillRect(-14,-16+i*5.5,28,5.5);});
    ctx.restore();

  } else if (type === 'sparkledress') {
    const grd = ctx.createLinearGradient(0, -16, 0, 16);
    grd.addColorStop(0, color1);
    grd.addColorStop(1, color2);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    [[-5, -5], [4, -2], [-2, 6], [5, 10]].forEach(([sx, sy]) => {
      drawStar(ctx, sx, sy, 5, 3, 1.2, '#FFFFFF');
    });
  } else {
    ctx.save();
    if (item.category === 'hat') {
      ctx.translate(0, 18);
      drawHat(ctx, item, time);
    } else if (item.category === 'wings') {
      ctx.scale(0.72, 0.72);
      drawWings(ctx, item, time);
    } else if (item.category === 'antennae') {
      drawAntennaTip(ctx, 0, 0, type, color1, color2, time);
    } else if (item.category === 'body') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
      ctx.clip();
      drawBodyPattern(ctx, item, time);
    } else if (item.category === 'dress') {
      ctx.translate(0, -12);
      ctx.scale(0.75, 0.75);
      drawDress(ctx, item, time);
    } else {
      drawStar(ctx, 0, 0, 5, 12, 5, color1);
    }
    ctx.restore();
  }
}

// ── Particles ─────────────────────────────────────────────────────────────────

function drawParticles(ctx, particles) {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawWindParticles(ctx, windParticles) {
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineCap = 'round';
  windParticles.forEach(p => {
    ctx.globalAlpha = p.life * 0.4;
    ctx.lineWidth = p.r;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.len, p.y + p.lean);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

// ── Float text ────────────────────────────────────────────────────────────────

function drawFloatTexts(ctx, floatTexts) {
  floatTexts.forEach(t => {
    ctx.save();
    ctx.globalAlpha = t.life;
    ctx.font = `bold ${Math.round(14 + (1 - t.life) * 4)}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFEB3B';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  });
}

// Title screen helpers
function drawTitleScenery(ctx, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, '#BFEFFF');
  sky.addColorStop(0.62, '#DDF8FF');
  sky.addColorStop(1, '#BFEA85');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawCloud(ctx, 78, 76, 0.95, time, 0);
  drawCloud(ctx, 380, 62, 0.8, time, 1.4);
  drawCloud(ctx, 320, 155, 0.58, time, 2.6);

  ctx.fillStyle = '#8EDC72';
  ctx.beginPath();
  ctx.ellipse(110, 430, 210, 82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78CC62';
  ctx.beginPath();
  ctx.ellipse(370, 438, 245, 94, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(0, 0);
  ctx.lineWidth = 8;
  RAINBOW_COLORS.forEach((col, i) => {
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.arc(240, 276, 142 - i * 7, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  });
  ctx.restore();

  // Friendly trail leading the eye to Charlie.
  ctx.strokeStyle = '#E6BE82';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(120, 480);
  ctx.quadraticCurveTo(210, 390, 240, 320);
  ctx.stroke();
}

function drawCloud(ctx, x, y, scale, time, phase) {
  const bob = Math.sin(time * 0.001 + phase) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  [[-22, 4, 20], [0, -4, 25], [24, 5, 18], [5, 12, 28]].forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawControlBadge(ctx, x, y, label, detail, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-58, -18, 116, 36, 18);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#263238';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(label, 0, -5);
  ctx.font = '10px sans-serif';
  ctx.globalAlpha = 0.75;
  ctx.fillText(detail, 0, 8);
  ctx.restore();
}

// ── Utility ───────────────────────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  const clean = String(hex || '#000000').replace('#', '');
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function shadeColor(hex, percent) {
  const clean = String(hex || '#000000').replace('#', '');
  if (clean.length !== 6) return hex || '#000000';
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, parseInt(clean.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(clean.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(clean.slice(4, 6), 16) + amt));
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function blendColor(hex1, hex2, t) {
  const a = parseHexColor(hex1);
  const b = parseHexColor(hex2);
  if (!a || !b) return hex1 || '#000000';
  const mix = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${mix.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function parseHexColor(hex) {
  const clean = String(hex || '').replace('#', '');
  if (clean.length !== 6) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function drawMiniSnowflake(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * -r, Math.sin(a) * -r);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDetailedSnowflake(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const tx = Math.cos(a) * r;
    const ty = Math.sin(a) * r;
    ctx.beginPath();
    ctx.moveTo(-tx, -ty);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - Math.cos(a + dir * Math.PI / 4) * 3, ty - Math.sin(a + dir * Math.PI / 4) * 3);
      ctx.stroke();
    });
  }
  ctx.restore();
}

function drawFlowerBloom(ctx, x, y, r, petalColor, centerColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = petalColor;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = centerColor;
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRose(ctx, x, y, petalColor, accentColor, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate(i * Math.PI / 5);
    ctx.fillStyle = i === 0 ? shadeColor(petalColor, -25) : shadeColor(petalColor, i * 7);
    ctx.beginPath();
    ctx.ellipse(0, -3, 5 - i * 0.45, 8 - i * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx, cx, cy, points, outerR, innerR, color) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Mini Charlie for title/celebrate screens
function drawCharlieMini(ctx, cosmetics, x, y, scale, time) {
  const fakeCharlie = {
    x: x / scale, y: y / scale,
    vx: 0, vy: 0, facing: 0,
    cosmetics
  };
  const fakeCamera = { x: 0, y: 0 };
  ctx.save();
  ctx.scale(scale, scale);
  drawCharlie(ctx, fakeCharlie, time, fakeCamera);
  ctx.restore();
}
