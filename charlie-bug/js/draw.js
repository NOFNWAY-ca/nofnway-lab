// js/draw.js — Canvas rendering for Charlie-Bug

// ── World ─────────────────────────────────────────────────────────────────────

function drawWorld(ctx, camera, time, bgTint) {
  const W = WORLD_W, H = WORLD_H;
  const cx = -camera.x, cy = -camera.y; // canvas offset

  // Base grass with a soft storybook gradient.
  const grass = ctx.createLinearGradient(cx, cy, cx + W, cy + H);
  grass.addColorStop(0, '#9BE283');
  grass.addColorStop(0.45, '#78C96E');
  grass.addColorStop(1, '#62B85D');
  ctx.fillStyle = grass;
  ctx.fillRect(cx, cy, W, H);

  if (bgTint) {
    ctx.fillStyle = bgTint;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(cx, cy, W, H);
    ctx.globalAlpha = 1;
  }

  // Big rounded garden patches keep the map readable for kids.
  drawGardenPatch(ctx, cx + 245, cy + 315, 165, 115, '#B8EC8A', time * 0.0004);
  drawGardenPatch(ctx, cx + 1160, cy + 295, 170, 118, '#A9E77E', -0.2);
  drawGardenPatch(ctx, cx + 330, cy + 1120, 180, 125, '#B7EA7E', 0.25);
  drawGardenPatch(ctx, cx + 1070, cy + 1045, 190, 130, '#9EDB73', -0.35);
  drawGardenPatch(ctx, cx + 720, cy + 760, 220, 145, '#A8E080', 0.12);

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
    const sway = Math.sin(time * 0.001 + i) * 1.5;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(52,128,58,0.22)' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + gx, cy + gy + 4);
    ctx.quadraticCurveTo(cx + gx + sway, cy + gy - 2, cx + gx + sway * 1.5, cy + gy - 8);
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
  ctx.strokeStyle = '#AF835A';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 34;
  ctx.strokeStyle = '#E8C48D';
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.setLineDash([18, 26]);
  ctx.stroke();
  ctx.setLineDash([]);

  drawPathPebbles(ctx, cx, cy);

  // Decorations
  DECORATIONS.forEach(d => drawDecoration(ctx, d, cx, cy, time));

  // Soft edge vignette gives the camera view a toy-diorama feel.
  const vignette = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, 120, CANVAS_W / 2, CANVAS_H / 2, 360);
  vignette.addColorStop(0, 'rgba(255,255,255,0)');
  vignette.addColorStop(1, 'rgba(48,100,50,0.18)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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

function drawDecoration(ctx, d, cx, cy, time) {
  const x = cx + d.x, y = cy + d.y;
  if (d.type === 'flower') {
    const bob = Math.sin(time * 0.002 + d.x) * 1.5;
    const s = d.size || 1;
    ctx.save();
    ctx.translate(x, y + bob);
    // Stem
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 10 * s);
    ctx.strokeStyle = '#4a8f46';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Leaf pair
    ctx.fillStyle = '#5BBE5A';
    ctx.beginPath();
    ctx.ellipse(-3 * s, 4 * s, 4 * s, 2 * s, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3 * s, 6 * s, 4 * s, 2 * s, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Petals
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 5 * s, -8 + Math.sin(a) * 5 * s, 4 * s, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
    }
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
    ctx.strokeStyle = d.color;
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
      [sway,    -36, 20, '#388E3C'],
      [sway-12, -26, 16, '#2E7D32'],
      [sway+12, -26, 16, '#2E7D32'],
      [sway,    -20, 14, '#66BB6A'],
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
    ctx.fillStyle = 'rgba(100,190,230,0.82)';
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

  ctx.save();
  ctx.translate(sx, sy + bob);
  ctx.rotate(charlie.facing);

  // Shadow (unrotated, flat on ground)
  ctx.save();
  ctx.rotate(-charlie.facing);
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
  drawAntennaTip(ctx, -11, -40, tipType, tipCol1, tipCol2);
  drawAntennaTip(ctx,  11, -40, tipType, tipCol1, tipCol2);

  // Hat (topmost layer)
  if (cos.hat) drawHat(ctx, cos.hat, time);

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
  }
}

// ── Cosmetic: Body patterns ───────────────────────────────────────────────────

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
  } else if (type === 'rainbowstripes') {
    RAINBOW_COLORS.forEach((rc, i) => {
      ctx.fillStyle = rc;
      ctx.fillRect(-12, -15 + i * 5, 24, 5);
    });
  }
}

// ── Cosmetic: Antennae tips ───────────────────────────────────────────────────

function drawAntennaTip(ctx, x, y, type, color1, color2) {
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
    ctx.arc(0, -28, 13, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#BBDEFB';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Visor glass
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(0, -28, 9, 0, Math.PI*2);
    ctx.fill();
    // Reflection glint
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(-3,-32,3,0,Math.PI*2); ctx.fill();

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
  }
}

// ── Collectible items in the world ────────────────────────────────────────────

function drawItem(ctx, item, time, camera) {
  if (item.collected) return;

  const sx = item.x - camera.x;
  const sy = item.y - camera.y;
  const bob = Math.sin(time * 0.003 + item.x) * 5;
  const spin = time * 0.001;
  const pulse = 0.85 + Math.sin(time * 0.005 + item.y) * 0.15;

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
