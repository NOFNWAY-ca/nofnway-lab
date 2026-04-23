    function drawZetaInvadersBackdrop(ctx2, game) {
      ctx2.save();
      ctx2.globalAlpha = 0.2;
      for (let x = 44; x < 720; x += 128) {
        ctx2.beginPath();
        ctx2.moveTo(x, 1010);
        ctx2.lineTo(x + 20, 944);
        ctx2.lineTo(x + 40, 1010);
        ctx2.stroke();
      }
      ctx2.restore();
      drawLine(ctx2, 20, 936, 700, 936);
      drawCenteredText(ctx2, "ROBCO BATTERY COMMAND", 360, 1018, 14);
      drawCenteredText(ctx2, "WAVE " + game.wave, 104, 56, 14);
      if (game.saucer) {
        drawCenteredText(ctx2, "SKY CONTACT", 604, 56, 12);
      }
    }

    function drawZetaPlayerCannon(ctx2, player, invulnerable) {
      ctx2.save();
      if (invulnerable) {
        ctx2.globalAlpha = 0.35 + Math.sin(performance.now() * 0.02) * 0.25;
      }
      ctx2.strokeRect(player.x + 12, player.y + 12, player.w - 24, 14);
      ctx2.strokeRect(player.x + 20, player.y + 4, player.w - 40, 10);
      ctx2.beginPath();
      ctx2.moveTo(player.x + player.w / 2, player.y - 10);
      ctx2.lineTo(player.x + player.w / 2, player.y + 8);
      ctx2.moveTo(player.x + 8, player.y + player.h);
      ctx2.lineTo(player.x + 18, player.y + 18);
      ctx2.lineTo(player.x + player.w - 18, player.y + 18);
      ctx2.lineTo(player.x + player.w - 8, player.y + player.h);
      ctx2.stroke();
      ctx2.restore();
    }

    function drawZetaInvaderSprite(ctx2, invader, frame) {
      const x = invader.x;
      const y = invader.y;
      const wobble = frame ? 2 : -2;
      ctx2.strokeRect(x + 8, y + 6, invader.w - 16, invader.h - 12);
      if (invader.type === "overseer") {
        ctx2.beginPath();
        ctx2.moveTo(x + 8, y + 10);
        ctx2.lineTo(x + invader.w / 2, y);
        ctx2.lineTo(x + invader.w - 8, y + 10);
        ctx2.moveTo(x + 12, y + invader.h - 6);
        ctx2.lineTo(x + 6, y + invader.h + wobble);
        ctx2.moveTo(x + invader.w - 12, y + invader.h - 6);
        ctx2.lineTo(x + invader.w - 6, y + invader.h - wobble);
        ctx2.stroke();
      } else if (invader.type === "raider") {
        ctx2.beginPath();
        ctx2.moveTo(x + 6, y + 12);
        ctx2.lineTo(x, y + 6);
        ctx2.moveTo(x + invader.w - 6, y + 12);
        ctx2.lineTo(x + invader.w, y + 6);
        ctx2.moveTo(x + 10, y + invader.h - 4);
        ctx2.lineTo(x + 4, y + invader.h + wobble);
        ctx2.moveTo(x + invader.w - 10, y + invader.h - 4);
        ctx2.lineTo(x + invader.w - 4, y + invader.h - wobble);
        ctx2.stroke();
      } else {
        ctx2.beginPath();
        ctx2.moveTo(x + 8, y + 8);
        ctx2.lineTo(x + 2, y + 18);
        ctx2.moveTo(x + invader.w - 8, y + 8);
        ctx2.lineTo(x + invader.w - 2, y + 18);
        ctx2.moveTo(x + 10, y + invader.h - 4);
        ctx2.lineTo(x + 10 + wobble, y + invader.h + 8);
        ctx2.moveTo(x + invader.w - 10, y + invader.h - 4);
        ctx2.lineTo(x + invader.w - 10 - wobble, y + invader.h + 8);
        ctx2.stroke();
      }
      ctx2.beginPath();
      ctx2.moveTo(x + 14, y + 14);
      ctx2.lineTo(x + 18, y + 14);
      ctx2.moveTo(x + invader.w - 18, y + 14);
      ctx2.lineTo(x + invader.w - 14, y + 14);
      ctx2.stroke();
    }

    function drawZetaSaucer(ctx2, saucer, frame) {
      ctx2.strokeRect(saucer.x + 8, saucer.y + 8, saucer.w - 16, saucer.h - 10);
      ctx2.beginPath();
      ctx2.moveTo(saucer.x, saucer.y + 18);
      ctx2.lineTo(saucer.x + 10, saucer.y + 8);
      ctx2.lineTo(saucer.x + saucer.w - 10, saucer.y + 8);
      ctx2.lineTo(saucer.x + saucer.w, saucer.y + 18);
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(saucer.x + 14, saucer.y + saucer.h);
      ctx2.lineTo(saucer.x + 18 + frame * 2, saucer.y + saucer.h + 8);
      ctx2.moveTo(saucer.x + saucer.w - 14, saucer.y + saucer.h);
      ctx2.lineTo(saucer.x + saucer.w - 18 - frame * 2, saucer.y + saucer.h + 8);
      ctx2.stroke();
    }

    function drawZetaBunker(ctx2, bunker) {
      ctx2.save();
      ctx2.strokeRect(bunker.x, bunker.y + 12, bunker.w, bunker.h - 12);
      ctx2.clearRect(bunker.x + bunker.w / 2 - 12, bunker.y + bunker.h - 16, 24, 24);
      const cols = 5;
      const rows = 3;
      const cellW = bunker.w / cols;
      const cellH = (bunker.h - 10) / rows;
      bunker.cells.forEach((alive, index) => {
        if (!alive) return;
        const col = index % cols;
        const row = Math.floor(index / cols);
        const pad = 3;
        ctx2.strokeRect(
          bunker.x + col * cellW + pad,
          bunker.y + row * cellH + pad,
          cellW - pad * 2,
          cellH - pad * 2
        );
      });
      ctx2.restore();
    }

    function drawZetaPlayerBolt(ctx2, bullet) {
      ctx2.fillRect(bullet.x, bullet.y, 4, 16);
      ctx2.fillRect(bullet.x - 3, bullet.y + 5, 10, 2);
    }

    function drawZetaEnemyBolt(ctx2, bullet) {
      ctx2.beginPath();
      ctx2.moveTo(bullet.x, bullet.y);
      ctx2.lineTo(bullet.x - 6, bullet.y + 10);
      ctx2.lineTo(bullet.x + 3, bullet.y + 18);
      ctx2.lineTo(bullet.x - 3, bullet.y + 28);
      ctx2.stroke();
    }

    function drawZetaExplosion(ctx2, blast) {
      const progress = blast.t / blast.life;
      const radius = 8 + progress * (blast.kind === "saucer" ? 34 : blast.kind === "player" ? 28 : 18);
      ctx2.save();
      ctx2.globalAlpha = 1 - progress;
      for (let i = 0; i < 2; i += 1) {
        ctx2.beginPath();
        ctx2.arc(blast.x, blast.y, radius - i * 8, 0, Math.PI * 2);
        ctx2.stroke();
      }
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        ctx2.beginPath();
        ctx2.moveTo(blast.x + Math.cos(angle) * radius * 0.35, blast.y + Math.sin(angle) * radius * 0.35);
        ctx2.lineTo(blast.x + Math.cos(angle) * radius, blast.y + Math.sin(angle) * radius);
        ctx2.stroke();
      }
      ctx2.restore();
    }

    function drawPipfallBackdrop(ctx2, game) {
      const farOffset = -((game.distance * 0.25) % 240);
      const nearOffset = -((game.distance * 0.55) % 180);
      for (let x = farOffset; x < 820; x += 240) {
        ctx2.beginPath();
        ctx2.moveTo(x, 320);
        ctx2.lineTo(x + 40, 220);
        ctx2.lineTo(x + 90, 320);
        ctx2.stroke();
      }
      for (let x = nearOffset; x < 820; x += 180) {
        ctx2.strokeRect(x, 690, 26, 86);
        ctx2.beginPath();
        ctx2.moveTo(x - 18, 776);
        ctx2.lineTo(x + 13, 720);
        ctx2.lineTo(x + 44, 776);
        ctx2.stroke();
      }
      for (let x = farOffset + 80; x < 860; x += 280) {
        ctx2.beginPath();
        ctx2.moveTo(x, 860);
        ctx2.lineTo(x + 18, 806);
        ctx2.lineTo(x + 36, 860);
        ctx2.stroke();
      }
    }

    function drawRadPongMutantLane(ctx2, x, label) {
      ctx2.save();
      ctx2.globalAlpha = 0.24;
      ctx2.strokeRect(x - 56, 154, 112, 782);
      ctx2.restore();
      ctx2.beginPath();
      ctx2.moveTo(x - 18, 174);
      ctx2.lineTo(x, 128);
      ctx2.lineTo(x + 18, 174);
      ctx2.stroke();
      drawCenteredText(ctx2, label, x, 976, 12);
    }

    function drawRadPongHand(ctx2, x, y, h, flip) {
      const palmW = 34;
      const palmH = Math.max(68, h * 0.42);
      const palmX = x + (flip ? -palmW : 0);
      const palmY = y + (h - palmH) / 2;
      const fingerDir = flip ? -1 : 1;
      ctx2.strokeRect(palmX, palmY, palmW, palmH);
      for (let i = 0; i < 4; i += 1) {
        const fingerY = palmY + 8 + i * ((palmH - 24) / 3);
        ctx2.beginPath();
        ctx2.moveTo(palmX + (flip ? 0 : palmW), fingerY);
        ctx2.lineTo(palmX + (flip ? -18 : palmW + 18), fingerY - 8);
        ctx2.lineTo(palmX + (flip ? -26 : palmW + 26), fingerY + 2);
        ctx2.stroke();
      }
      ctx2.beginPath();
      ctx2.moveTo(palmX + (flip ? palmW : 0), palmY + palmH - 14);
      ctx2.lineTo(palmX + (flip ? palmW + 18 : -18), palmY + palmH + 10);
      ctx2.lineTo(palmX + (flip ? palmW + 8 : -8), palmY + palmH + 22);
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(x + (flip ? 10 : 24), y);
      ctx2.lineTo(x + (flip ? 10 : 24), y + h);
      ctx2.stroke();
      for (let i = 0; i < 3; i += 1) {
        const knuckleX = palmX + (flip ? 8 : palmW - 8);
        const knuckleY = palmY + 14 + i * ((palmH - 28) / 2);
        ctx2.beginPath();
        ctx2.arc(knuckleX, knuckleY, 3.5, 0, Math.PI * 2);
        ctx2.stroke();
      }
      ctx2.beginPath();
      ctx2.moveTo(palmX + (flip ? palmW : 0), palmY + 12);
      ctx2.lineTo(palmX + fingerDir * -26 + (flip ? palmW : 0), palmY - 10);
      ctx2.stroke();
    }

    function drawRadPongGrenade(ctx2, ball, spin) {
      ctx2.save();
      ctx2.translate(ball.x, ball.y);
      ctx2.rotate(spin);
      ctx2.beginPath();
      ctx2.arc(0, 0, ball.r, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.strokeRect(-6, -ball.r - 10, 12, 8);
      ctx2.beginPath();
      ctx2.moveTo(6, -ball.r - 8);
      ctx2.lineTo(16, -ball.r - 18);
      ctx2.lineTo(22, -ball.r - 8);
      ctx2.stroke();
      for (let i = -1; i <= 1; i += 1) {
        ctx2.beginPath();
        ctx2.moveTo(-ball.r + 6, i * 6);
        ctx2.lineTo(ball.r - 6, i * 6);
        ctx2.stroke();
      }
      ctx2.restore();
    }

    function drawRadPongExplosion(ctx2, x, y, intensity) {
      const radius = 68 + intensity * 120;
      ctx2.save();
      ctx2.strokeStyle = hexToRgba(getThemeColor(), Math.min(0.95, 0.35 + intensity * 0.6));
      ctx2.lineWidth = 2 + intensity * 4;
      for (let i = 0; i < 3; i += 1) {
        ctx2.beginPath();
        ctx2.arc(x, y, radius - i * 24, 0, Math.PI * 2);
        ctx2.stroke();
      }
      for (let i = 0; i < 12; i += 1) {
        const angle = (Math.PI * 2 * i) / 12;
        const inner = radius * 0.32;
        const outer = radius * (0.8 + (i % 2) * 0.2);
        ctx2.beginPath();
        ctx2.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
        ctx2.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        ctx2.stroke();
      }
      ctx2.restore();
    }

    function drawRedMenaceBackdrop(ctx2, game, platforms, ladders, platformY) {
      ctx2.save();
      ctx2.globalAlpha = 0.18;
      for (let i = 0; i < 34; i += 1) {
        const x = 24 + (i * 41) % 720;
        const y = 108 + (i * 73) % 960;
        ctx2.beginPath();
        ctx2.moveTo(x, y);
        ctx2.lineTo(x + 6, y + 10);
        ctx2.lineTo(x - 6, y + 10);
        ctx2.closePath();
        ctx2.stroke();
      }
      ctx2.restore();
      drawCenteredText(ctx2, "ROBCO GIRDERS - LEVEL " + game.level, 360, 48, 14);
      drawCenteredText(ctx2, "BARREL THREAT " + Math.min(9, game.level), 596, 48, 12);
      drawLine(ctx2, 24, 1002, 696, 1002);
      platforms.forEach((platform, index) => drawRedMenacePlatform(ctx2, platform, index, platformY));
      ladders.forEach((ladder) => drawRedMenaceLadder(ctx2, ladder));
      ctx2.save();
      ctx2.globalAlpha = 0.3;
      ctx2.strokeRect(520, 84, 168, 70);
      ctx2.beginPath();
      ctx2.moveTo(532, 148);
      ctx2.lineTo(676, 148);
      ctx2.stroke();
      ctx2.restore();
    }

    function drawRedMenacePlatform(ctx2, platform, index, platformY) {
      const y1 = platformY(platform, platform.x1);
      const y2 = platformY(platform, platform.x2);
      const slope = (y2 - y1) / (platform.x2 - platform.x1);
      ctx2.save();
      ctx2.lineWidth = 3;
      ctx2.beginPath();
      ctx2.moveTo(platform.x1, y1);
      ctx2.lineTo(platform.x2, y2);
      ctx2.stroke();
      ctx2.lineWidth = 1.5;
      for (let x = platform.x1 + 18; x < platform.x2; x += 56) {
        const y = y1 + (x - platform.x1) * slope;
        ctx2.beginPath();
        ctx2.moveTo(x - 14, y - 10);
        ctx2.lineTo(x + 14, y + 10);
        ctx2.moveTo(x - 14, y + 10);
        ctx2.lineTo(x + 14, y - 10);
        ctx2.stroke();
        ctx2.beginPath();
        ctx2.arc(x - 18, y, 1.5, 0, Math.PI * 2);
        ctx2.arc(x + 18, y, 1.5, 0, Math.PI * 2);
        ctx2.stroke();
      }
      if (index > 0 && index < 5) {
        const labelX = platform.x1 + 54;
        const labelY = y1 + slope * 54 - 18;
        drawCenteredText(ctx2, "G" + (index + 1), labelX, labelY, 10);
      }
      ctx2.restore();
    }

    function drawRedMenaceLadder(ctx2, ladder) {
      ctx2.save();
      ctx2.strokeRect(ladder.x, ladder.y2, 20, ladder.y1 - ladder.y2);
      for (let y = ladder.y2 + 12; y < ladder.y1 - 6; y += 18) {
        ctx2.beginPath();
        ctx2.moveTo(ladder.x + 2, y);
        ctx2.lineTo(ladder.x + 18, y);
        ctx2.stroke();
      }
      ctx2.restore();
    }

    function drawRedMenaceRunner(ctx2, player, invulnerable) {
      ctx2.save();
      ctx2.translate(player.x, player.y);
      if (invulnerable) {
        ctx2.globalAlpha = 0.35 + Math.sin(performance.now() * 0.03) * 0.25;
      }
      const frame = Math.floor(performance.now() / 120) % 2;
      const center = player.w / 2;
      const headX = center + (player.climbing ? 0 : (frame === 0 ? -1.5 : 1.5));
      ctx2.strokeRect(headX - 7, 0, 14, 14);
      ctx2.beginPath();
      ctx2.moveTo(center, 14);
      ctx2.lineTo(center, 29);
      ctx2.moveTo(center - 9, 18);
      ctx2.lineTo(center + 9, player.climbing ? 20 : 23);
      if (player.climbing) {
        ctx2.moveTo(center - 7, 17);
        ctx2.lineTo(center - 13, 27);
        ctx2.moveTo(center + 7, 21);
        ctx2.lineTo(center + 13, 31);
        ctx2.moveTo(center, 29);
        ctx2.lineTo(center - 7, 42);
        ctx2.moveTo(center, 29);
        ctx2.lineTo(center + 7, 42);
      } else if (player.vy !== 0) {
        ctx2.moveTo(center, 29);
        ctx2.lineTo(center - 10, 38);
        ctx2.moveTo(center, 29);
        ctx2.lineTo(center + 12, 35);
      } else {
        ctx2.moveTo(center, 29);
        ctx2.lineTo(center - 9, frame === 0 ? 41 : 36);
        ctx2.moveTo(center, 29);
        ctx2.lineTo(center + 9, frame === 0 ? 36 : 41);
      }
      ctx2.stroke();
      ctx2.restore();
    }

    function drawRedMenaceMutant(ctx2, mutant, level) {
      ctx2.save();
      ctx2.translate(mutant.x, mutant.y);
      const snarl = Math.sin(performance.now() * 0.003) * 2;
      ctx2.strokeRect(10, 12, 42, 22);
      ctx2.beginPath();
      ctx2.moveTo(4, 24);
      ctx2.lineTo(14, 12);
      ctx2.lineTo(14, 36);
      ctx2.moveTo(58, 24);
      ctx2.lineTo(48, 12);
      ctx2.lineTo(48, 36);
      ctx2.moveTo(22, 34);
      ctx2.lineTo(18, 48);
      ctx2.moveTo(40, 34);
      ctx2.lineTo(44, 48);
      ctx2.moveTo(18, 18);
      ctx2.lineTo(22, 18 + snarl);
      ctx2.moveTo(40, 18);
      ctx2.lineTo(36, 18 + snarl);
      ctx2.moveTo(23, 28);
      ctx2.lineTo(39, 28);
      ctx2.moveTo(18, 8);
      ctx2.lineTo(22, 2);
      ctx2.moveTo(44, 8);
      ctx2.lineTo(40, 2);
      ctx2.stroke();
      drawCenteredText(ctx2, "MUTANT", 31, -4, 10);
      drawCenteredText(ctx2, "MK " + level, 31, 62, 10);
      ctx2.restore();
    }

    function drawRedMenaceCaptive(ctx2, target, level) {
      ctx2.save();
      ctx2.translate(target.x, target.y);
      const pulse = 0.35 + ((Math.sin(performance.now() * 0.005) + 1) * 0.2);
      ctx2.globalAlpha = pulse;
      ctx2.beginPath();
      ctx2.moveTo(17, -8);
      ctx2.lineTo(24, 8);
      ctx2.lineTo(10, 8);
      ctx2.closePath();
      ctx2.stroke();
      ctx2.globalAlpha = 1;
      ctx2.strokeRect(10, 4, 14, 14);
      ctx2.beginPath();
      ctx2.moveTo(17, 18);
      ctx2.lineTo(17, 32);
      ctx2.moveTo(8, 23);
      ctx2.lineTo(26, 23);
      ctx2.moveTo(17, 32);
      ctx2.lineTo(10, 42);
      ctx2.moveTo(17, 32);
      ctx2.lineTo(24, 42);
      ctx2.stroke();
      drawCenteredText(ctx2, "DWELLER", 17, 58, 10);
      if (level >= 4) {
        drawCenteredText(ctx2, "HOLD FAST", 17, -18, 10);
      }
      ctx2.restore();
    }

    function drawRedMenaceBarrel(ctx2, barrel) {
      ctx2.save();
      ctx2.translate(barrel.x, barrel.y);
      ctx2.rotate(barrel.spin || 0);
      ctx2.beginPath();
      ctx2.arc(0, 0, barrel.radius, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.strokeRect(-barrel.radius + 3, -barrel.radius + 5, (barrel.radius - 3) * 2, (barrel.radius - 5) * 2);
      ctx2.beginPath();
      ctx2.moveTo(-barrel.radius + 1, -4);
      ctx2.lineTo(barrel.radius - 1, 4);
      ctx2.moveTo(-barrel.radius + 1, 4);
      ctx2.lineTo(barrel.radius - 1, -4);
      ctx2.stroke();
      ctx2.restore();
      ctx2.save();
      ctx2.globalAlpha = 0.16 * (barrel.heat || 1);
      ctx2.beginPath();
      ctx2.arc(barrel.x, barrel.y, barrel.radius + 7, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.restore();
    }

    function drawPipfallPlayer(ctx2, game) {
      const player = game.player;
      const stride = Math.sin(game.distance * 0.55) * 9;
      const arm = Math.sin(game.distance * 0.55 + Math.PI) * 8;
      ctx2.strokeRect(player.x, player.y, player.width, player.height);
      ctx2.beginPath();
      const centerX = player.x + player.width / 2;
      ctx2.moveTo(centerX, player.y);
      ctx2.lineTo(centerX, player.y - 16);
      if (player.attachedRope) {
        ctx2.moveTo(centerX, player.y + 18);
        ctx2.lineTo(player.x - 8, player.y + 6);
        ctx2.moveTo(centerX, player.y + 18);
        ctx2.lineTo(player.x + player.width + 8, player.y + 6);
        ctx2.moveTo(centerX, player.y + player.height);
        ctx2.lineTo(player.x + 8, player.y + player.height + 8);
        ctx2.moveTo(centerX, player.y + player.height);
        ctx2.lineTo(player.x + player.width - 8, player.y + player.height + 8);
      } else if (player.ducking) {
        ctx2.moveTo(player.x + 4, player.y + 16);
        ctx2.lineTo(player.x - 8, player.y + 8);
        ctx2.moveTo(player.x + player.width - 4, player.y + 16);
        ctx2.lineTo(player.x + player.width + 8, player.y + 8);
        ctx2.moveTo(player.x + 8, player.y + player.height);
        ctx2.lineTo(player.x + 4, player.y + player.height + 6);
        ctx2.moveTo(player.x + player.width - 8, player.y + player.height);
        ctx2.lineTo(player.x + player.width - 4, player.y + player.height + 6);
      } else if (!player.onGround) {
        ctx2.moveTo(player.x, player.y + 22);
        ctx2.lineTo(player.x - 10, player.y + 12);
        ctx2.moveTo(player.x + player.width, player.y + 22);
        ctx2.lineTo(player.x + player.width + 10, player.y + 12);
        ctx2.moveTo(player.x + 8, player.y + player.height);
        ctx2.lineTo(player.x - 4, player.y + player.height + 10);
        ctx2.moveTo(player.x + player.width - 8, player.y + player.height);
        ctx2.lineTo(player.x + player.width + 4, player.y + player.height + 10);
      } else {
        ctx2.moveTo(player.x, player.y + 22);
        ctx2.lineTo(player.x - 8, player.y + 12 + arm * 0.25);
        ctx2.moveTo(player.x + player.width, player.y + 22);
        ctx2.lineTo(player.x + player.width + 8, player.y + 12 - arm * 0.25);
        ctx2.moveTo(player.x + 8, player.y + player.height);
        ctx2.lineTo(player.x + 4 - stride * 0.35, player.y + player.height + 10);
        ctx2.moveTo(player.x + player.width - 8, player.y + player.height);
        ctx2.lineTo(player.x + player.width - 4 + stride * 0.35, player.y + player.height + 10);
      }
      ctx2.stroke();
    }

    function clearGameCanvas(ctx2, w, h) {
      ctx2.clearRect(0, 0, w, h);
      ctx2.fillStyle = "#050805";
      ctx2.fillRect(0, 0, w, h);
    }

    function drawGameGrid(ctx2, w, h) {
      ctx2.save();
      ctx2.strokeStyle = hexToRgba(getThemeColor(), 0.12);
      ctx2.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx2.beginPath();
        ctx2.moveTo(x, 0);
        ctx2.lineTo(x, h);
        ctx2.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx2.beginPath();
        ctx2.moveTo(0, y);
        ctx2.lineTo(w, y);
        ctx2.stroke();
      }
      ctx2.restore();
    }

    function drawCenteredText(ctx2, text, x, y, size) {
      ctx2.font = size + "px " + getComputedStyle(document.documentElement).getPropertyValue("--font");
      ctx2.textAlign = "center";
      ctx2.fillStyle = getCss("--text");
      ctx2.fillText(text, x, y);
    }

    function drawLine(ctx2, x1, y1, x2, y2) {
      ctx2.beginPath();
      ctx2.moveTo(x1, y1);
      ctx2.lineTo(x2, y2);
      ctx2.stroke();
    }

    function handleBunkerHits(bunkers, bullets, removeOnHit) {
      bunkers.forEach((bunker) => {
        bullets.forEach((bullet) => {
          if (bunker.hp > 0 && !bullet.hit && hitRect(bullet.x, bullet.y, bunker.x, 860, 70, 42)) {
            bunker.hp -= 1;
            bullet.hit = true;
          }
        });
      });
      if (removeOnHit) {
        bullets.forEach((bullet) => {
          if (bullet.hit) bullet.y = -100;
        });
      }
    }

    function hitRect(x, y, rx, ry, rw, rh) {
      return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
    }

    function getCanvasPoint(event) {
      const rect = el.gameCanvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * 720,
        y: ((event.clientY - rect.top) / rect.height) * 1080
      };
    }

    function initAudioContext() {
      if (state.audioReady) {
        return;
      }
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      state.audioReady = true;
    }

    function playSound(kind) {
      if (!state.settings.sound) {
        return;
      }
      if (!state.audioReady) {
        initAudioContext();
      }
      const ctxAudio = state.audioCtx;
      if (!ctxAudio) {
        return;
      }
      const now = ctxAudio.currentTime;
      const config = {
        click: [[780, 0.03], [620, 0.05]],
        beep: [[540, 0.06]],
        success: [[520, 0.05], [720, 0.08], [940, 0.08]],
        error: [[220, 0.12], [160, 0.12]]
      }[kind] || [[440, 0.05]];
      config.forEach(([freq, dur], index) => {
        const osc = ctxAudio.createOscillator();
        const gain = ctxAudio.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + index * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.08, now + index * 0.05 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.05 + dur);
        osc.connect(gain).connect(ctxAudio.destination);
        osc.start(now + index * 0.05);
        osc.stop(now + index * 0.05 + dur + 0.02);
      });
    }

    function formatTimestamp(value) {
      return new Date(value).toLocaleString([], {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    function getGameName(id) {
      return GAME_CATALOG.find((game) => game.id === id)?.name || id.toUpperCase();
    }

    function shuffle(array) {
      const copy = [...array];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function hexToRgba(hex, alpha) {
      const clean = hex.replace("#", "");
      const bigint = parseInt(clean, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    }

    function getThemeColor() {
      return THEMES[state.settings.theme]?.text || THEMES.green.text;
    }

    function getCss(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name);
    }
