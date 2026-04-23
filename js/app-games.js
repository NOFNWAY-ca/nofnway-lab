    function createAtomicCommand(savedData) {
      const defaults = {
        wave: 1,
        score: 0,
        missilesLeft: 18,
        waveQuota: 8,
        destroyedThisWave: 0,
        gameOver: false,
        silos: [
          { x: 140, alive: true },
          { x: 360, alive: true },
          { x: 580, alive: true }
        ],
        missiles: [],
        enemyMissiles: [],
        explosions: [],
        spawnTimer: 0,
        flashTimer: 0,
        message: "DEFEND THE VAULT SILOS"
      };
      const restored = mergeGameState(defaults, savedData?.data);
      const game = {
        id: "atomic-command",
        name: "ATOMIC COMMAND",
        ...restored,
        loaded: false,
        actions: [{ label: "RESTART", handler: () => launchGame("atomic-command", null) }],
        touchControls: [{ label: "FIRE", handler: (on) => on && fireAt(360, 300) }],
        update(dt) {
          game.flashTimer = Math.max(0, game.flashTimer - dt * 2);
          if (game.gameOver) {
            return;
          }
          if (savedData && !game.loaded) {
            game.loaded = true;
          }
          game.spawnTimer -= dt;
          if (game.spawnTimer <= 0 && game.destroyedThisWave < game.waveQuota) {
            game.spawnTimer = Math.max(0.28, 1.12 - game.wave * 0.05);
            spawnEnemyMissile();
          }
          updateHomingMissiles(game.enemyMissiles, dt);
          updateHomingMissiles(game.missiles, dt);
          game.missiles.forEach((missile) => {
            if (Math.hypot(missile.tx - missile.x, missile.ty - missile.y) < 16) {
              missile.done = true;
              game.explosions.push({ x: missile.tx, y: missile.ty, r: 18, max: 82, growth: 220 });
            }
          });
          game.explosions.forEach((explosion) => explosion.r += explosion.growth * dt);
          game.enemyMissiles.forEach((enemy) => {
            game.explosions.forEach((explosion) => {
              if (!enemy.hit && Math.hypot(enemy.x - explosion.x, enemy.y - explosion.y) <= explosion.r) {
                enemy.hit = true;
                game.score += 25;
                game.destroyedThisWave += 1;
                playSound("beep");
              }
            });
            if (!enemy.hit && enemy.y >= enemy.ty - 12) {
              enemy.hit = true;
              const silo = game.silos.find((entry) => entry.alive && Math.abs(entry.x - enemy.tx) < 6);
              if (silo) {
                silo.alive = false;
                game.flashTimer = 1;
                game.explosions.push({ x: silo.x, y: 980, r: 30, max: 110, growth: 240 });
              }
              playSound("error");
            }
          });
          game.missiles = game.missiles.filter((missile) => !missile.done);
          game.enemyMissiles = game.enemyMissiles.filter((enemy) => !enemy.hit);
          game.explosions = game.explosions.filter((explosion) => explosion.r < explosion.max);
          if (game.destroyedThisWave >= game.waveQuota && !game.enemyMissiles.length) {
            game.wave += 1;
            game.missilesLeft = 16 + game.wave * 2;
            game.waveQuota = 8 + game.wave * 2;
            game.destroyedThisWave = 0;
            game.message = "WAVE " + game.wave + " ACTIVE";
            playSound("success");
          }
          if (!game.silos.some((silo) => silo.alive)) {
            game.gameOver = true;
            game.message = "ALL SILOS LOST";
            storeHighScore(game.id, game.score);
          }
        },
        draw(ctx2, w, h) {
          clearGameCanvas(ctx2, w, h);
          drawGameGrid(ctx2, w, h);
          const col = getThemeColor();
          const fnt = getComputedStyle(document.documentElement).getPropertyValue("--font");
          const red = "#ff4040";
          const scale = Math.min(w / 720, h / 1080);
          const offX = (w - 720 * scale) / 2;
          const offY = (h - 1080 * scale) / 2;
          ctx2.save();
          ctx2.translate(offX, offY);
          ctx2.scale(scale, scale);

          // Ground
          ctx2.strokeStyle = col;
          ctx2.lineWidth = 2;
          ctx2.shadowColor = col;
          ctx2.shadowBlur = 8;
          ctx2.beginPath();
          ctx2.moveTo(0, 1006);
          for (let gx = 0; gx <= 720; gx += 18) {
            ctx2.lineTo(gx, 1006 + Math.sin(gx * 0.11) * 3);
          }
          ctx2.stroke();
          ctx2.shadowBlur = 0;

          // SILOS
          ["I", "II", "III"].forEach((label, idx) => {
            const silo = game.silos[idx];
            const sx = silo.x;
            if (silo.alive) {
              ctx2.shadowColor = col;
              ctx2.shadowBlur = 8;
              ctx2.lineWidth = 1.5;
              // Base platform
              ctx2.strokeStyle = col;
              ctx2.fillStyle = hexToRgba(col, 0.1);
              ctx2.fillRect(sx - 36, 998, 72, 8);
              ctx2.strokeRect(sx - 36, 998, 72, 8);
              // Main body
              ctx2.fillStyle = hexToRgba(col, 0.07);
              ctx2.fillRect(sx - 22, 928, 44, 70);
              ctx2.strokeRect(sx - 22, 928, 44, 70);
              // Armour bands
              ctx2.shadowBlur = 0;
              ctx2.strokeStyle = hexToRgba(col, 0.4);
              ctx2.lineWidth = 1;
              [945, 962, 979].forEach(function(by) {
                ctx2.beginPath();
                ctx2.moveTo(sx - 22, by);
                ctx2.lineTo(sx + 22, by);
                ctx2.stroke();
              });
              // Interior strut
              ctx2.beginPath();
              ctx2.moveTo(sx, 928);
              ctx2.lineTo(sx, 998);
              ctx2.stroke();
              // Blast door cap
              ctx2.strokeStyle = col;
              ctx2.lineWidth = 2;
              ctx2.shadowColor = col;
              ctx2.shadowBlur = 12;
              ctx2.fillStyle = hexToRgba(col, 0.12);
              ctx2.beginPath();
              ctx2.moveTo(sx - 22, 928);
              ctx2.lineTo(sx - 11, 910);
              ctx2.lineTo(sx + 11, 910);
              ctx2.lineTo(sx + 22, 928);
              ctx2.closePath();
              ctx2.fill();
              ctx2.stroke();
              // Hatch lines on cap
              ctx2.lineWidth = 1;
              ctx2.shadowBlur = 0;
              ctx2.strokeStyle = hexToRgba(col, 0.35);
              ctx2.beginPath();
              ctx2.moveTo(sx - 5, 910); ctx2.lineTo(sx - 8, 928);
              ctx2.moveTo(sx + 5, 910); ctx2.lineTo(sx + 8, 928);
              ctx2.stroke();
              // Antenna mast
              ctx2.strokeStyle = col;
              ctx2.lineWidth = 1.5;
              ctx2.shadowColor = col;
              ctx2.shadowBlur = 8;
              ctx2.beginPath();
              ctx2.moveTo(sx, 910); ctx2.lineTo(sx, 888);
              ctx2.stroke();
              // Radar dish
              ctx2.beginPath();
              ctx2.moveTo(sx - 10, 888);
              ctx2.quadraticCurveTo(sx, 880, sx + 10, 888);
              ctx2.stroke();
              ctx2.beginPath();
              ctx2.moveTo(sx, 888); ctx2.lineTo(sx, 884);
              ctx2.stroke();
              // Label
              ctx2.shadowBlur = 4;
              ctx2.fillStyle = col;
              ctx2.font = "14px " + fnt;
              ctx2.textAlign = "center";
              ctx2.fillText("SILO " + label, sx, 1024);
              ctx2.shadowBlur = 0;
            } else {
              // Rubble
              ctx2.shadowBlur = 0;
              ctx2.strokeStyle = hexToRgba(col, 0.28);
              ctx2.lineWidth = 1.5;
              ctx2.beginPath();
              ctx2.moveTo(sx - 34, 1006);
              ctx2.lineTo(sx - 20, 994); ctx2.lineTo(sx - 8, 1000);
              ctx2.lineTo(sx + 2, 986);  ctx2.lineTo(sx + 14, 994);
              ctx2.lineTo(sx + 26, 988); ctx2.lineTo(sx + 36, 1006);
              ctx2.stroke();
              ctx2.strokeRect(sx - 28, 978, 14, 9);
              ctx2.strokeRect(sx + 10, 974, 11, 10);
              ctx2.strokeStyle = hexToRgba(red, 0.3);
              ctx2.setLineDash([2, 4]);
              ctx2.beginPath();
              ctx2.moveTo(sx - 4, 978); ctx2.lineTo(sx - 9, 960);
              ctx2.moveTo(sx + 8, 974); ctx2.lineTo(sx + 12, 956);
              ctx2.stroke();
              ctx2.setLineDash([]);
              ctx2.fillStyle = hexToRgba(red, 0.65);
              ctx2.font = "12px " + fnt;
              ctx2.textAlign = "center";
              ctx2.fillText("DESTROYED", sx, 1024);
            }
          });

          // ENEMY MISSILES
          game.enemyMissiles.forEach(function(missile) {
            if (missile.hit) return;
            const dx = missile.tx - missile.x;
            const dy = missile.ty - missile.y;
            const angle = Math.atan2(dy, dx);
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len; const uy = dy / len;
            for (let t = 1; t <= 9; t++) {
              ctx2.strokeStyle = hexToRgba(red, (9 - t) / 9 * 0.55);
              ctx2.lineWidth = Math.max(0.5, 2.8 - t * 0.25);
              ctx2.shadowColor = red;
              ctx2.shadowBlur = t < 4 ? 8 : 0;
              ctx2.beginPath();
              ctx2.moveTo(missile.x - ux * (t - 1) * 9, missile.y - uy * (t - 1) * 9);
              ctx2.lineTo(missile.x - ux * t * 9, missile.y - uy * t * 9);
              ctx2.stroke();
            }
            ctx2.save();
            ctx2.translate(missile.x, missile.y);
            ctx2.rotate(angle - Math.PI / 2);
            ctx2.fillStyle = red;
            ctx2.strokeStyle = red;
            ctx2.shadowColor = red;
            ctx2.shadowBlur = 16;
            ctx2.lineWidth = 1;
            ctx2.fillRect(-4, -2, 8, 14);
            ctx2.beginPath();
            ctx2.moveTo(-4, -2); ctx2.lineTo(0, -13); ctx2.lineTo(4, -2);
            ctx2.closePath(); ctx2.fill();
            ctx2.beginPath();
            ctx2.moveTo(-4, 10); ctx2.lineTo(-11, 19); ctx2.lineTo(-4, 14);
            ctx2.closePath(); ctx2.fill();
            ctx2.beginPath();
            ctx2.moveTo(4, 10); ctx2.lineTo(11, 19); ctx2.lineTo(4, 14);
            ctx2.closePath(); ctx2.fill();
            ctx2.shadowBlur = 14;
            ctx2.fillStyle = "rgba(255,180,0,0.75)";
            ctx2.beginPath();
            ctx2.arc(0, 17, 4, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.restore();
            ctx2.shadowBlur = 0;
          });

          // PLAYER MISSILES
          game.missiles.forEach(function(missile) {
            if (missile.done) return;
            const dx = missile.tx - missile.x;
            const dy = missile.ty - missile.y;
            const angle = Math.atan2(dy, dx);
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len; const uy = dy / len;
            ctx2.strokeStyle = hexToRgba(col, 0.38);
            ctx2.lineWidth = 1.5;
            ctx2.shadowBlur = 0;
            ctx2.setLineDash([7, 5]);
            ctx2.beginPath();
            ctx2.moveTo(missile.x, missile.y);
            ctx2.lineTo(missile.x - ux * 65, missile.y - uy * 65);
            ctx2.stroke();
            ctx2.setLineDash([]);
            ctx2.save();
            ctx2.translate(missile.x, missile.y);
            ctx2.rotate(angle - Math.PI / 2);
            ctx2.fillStyle = col;
            ctx2.shadowColor = col;
            ctx2.shadowBlur = 12;
            ctx2.fillRect(-3, -2, 6, 11);
            ctx2.beginPath();
            ctx2.moveTo(-3, -2); ctx2.lineTo(0, -11); ctx2.lineTo(3, -2);
            ctx2.closePath(); ctx2.fill();
            ctx2.beginPath();
            ctx2.moveTo(-3, 8); ctx2.lineTo(-8, 14); ctx2.lineTo(-3, 11);
            ctx2.closePath(); ctx2.fill();
            ctx2.beginPath();
            ctx2.moveTo(3, 8); ctx2.lineTo(8, 14); ctx2.lineTo(3, 11);
            ctx2.closePath(); ctx2.fill();
            ctx2.restore();
            ctx2.strokeStyle = hexToRgba(col, 0.5);
            ctx2.lineWidth = 1;
            ctx2.shadowBlur = 0;
            ctx2.beginPath();
            ctx2.arc(missile.tx, missile.ty, 14, 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.beginPath();
            ctx2.moveTo(missile.tx - 22, missile.ty); ctx2.lineTo(missile.tx - 16, missile.ty);
            ctx2.moveTo(missile.tx + 16, missile.ty); ctx2.lineTo(missile.tx + 22, missile.ty);
            ctx2.moveTo(missile.tx, missile.ty - 22); ctx2.lineTo(missile.tx, missile.ty - 16);
            ctx2.moveTo(missile.tx, missile.ty + 16); ctx2.lineTo(missile.tx, missile.ty + 22);
            ctx2.stroke();
          });

          // EXPLOSIONS
          game.explosions.forEach(function(expl) {
            const progress = expl.r / expl.max;
            const alpha = Math.max(0, 1 - progress);
            ctx2.shadowColor = col;
            ctx2.shadowBlur = 24;
            ctx2.strokeStyle = hexToRgba(col, alpha);
            ctx2.lineWidth = 2.5;
            ctx2.beginPath();
            ctx2.arc(expl.x, expl.y, expl.r, 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.fillStyle = hexToRgba(col, alpha * 0.09);
            ctx2.fill();
            if (expl.r > 18) {
              ctx2.strokeStyle = hexToRgba(col, alpha * 0.42);
              ctx2.lineWidth = 1;
              ctx2.shadowBlur = 8;
              ctx2.beginPath();
              ctx2.arc(expl.x, expl.y, expl.r * 0.52, 0, Math.PI * 2);
              ctx2.stroke();
            }
            ctx2.shadowBlur = 0;
          });

          // HUD
          ctx2.strokeStyle = hexToRgba(col, 0.2);
          ctx2.lineWidth = 1;
          ctx2.strokeRect(8, 8, 704, 1064);
          ctx2.fillStyle = col;
          ctx2.shadowColor = col;
          ctx2.shadowBlur = 6;
          ctx2.font = "22px " + fnt;
          ctx2.textAlign = "left";
          ctx2.fillText("WAVE " + game.wave, 24, 46);
          ctx2.textAlign = "right";
          ctx2.fillText(String(game.score), 696, 46);
          ctx2.font = "12px " + fnt;
          ctx2.fillStyle = hexToRgba(col, 0.5);
          ctx2.fillText("SCORE", 660, 62);
          ctx2.textAlign = "center";
          const pipStart = 360 - (game.missilesLeft * 7) / 2;
          for (let pi = 0; pi < game.missilesLeft; pi++) {
            ctx2.fillStyle = hexToRgba(col, 0.65);
            ctx2.fillRect(pipStart + pi * 7, 56, 5, 10);
          }
          ctx2.fillStyle = hexToRgba(col, 0.32);
          ctx2.font = "11px " + fnt;
          ctx2.fillText("AMMO", 360, 76);
          ctx2.shadowBlur = 4;
          ctx2.fillStyle = hexToRgba(col, 0.78);
          ctx2.font = "16px " + fnt;
          ctx2.fillText(game.message, 360, 100);
          if (game.enemyMissiles.length > 0 && !game.gameOver) {
            const pulse = 0.6 + Math.sin(Date.now() * 0.01) * 0.4;
            ctx2.fillStyle = hexToRgba(red, pulse);
            ctx2.font = "13px " + fnt;
            ctx2.fillText("! INCOMING !", 360, 120);
          }
          ctx2.shadowBlur = 0;
          if (game.flashTimer > 0) {
            ctx2.fillStyle = hexToRgba(red, game.flashTimer * 0.4);
            ctx2.fillRect(0, 0, 720, 1080);
          }
          if (game.gameOver) {
            ctx2.fillStyle = "rgba(0,0,0,0.72)";
            ctx2.fillRect(70, 450, 580, 200);
            ctx2.strokeStyle = hexToRgba(red, 0.9);
            ctx2.lineWidth = 2;
            ctx2.shadowColor = red;
            ctx2.shadowBlur = 18;
            ctx2.strokeRect(70, 450, 580, 200);
            ctx2.fillStyle = red;
            ctx2.font = "28px " + fnt;
            ctx2.textAlign = "center";
            ctx2.fillText("VAULT DEFENCE FAILED", 360, 516);
            ctx2.shadowBlur = 0;
            ctx2.fillStyle = col;
            ctx2.font = "20px " + fnt;
            ctx2.fillText("FINAL SCORE  " + game.score, 360, 562);
            ctx2.fillStyle = hexToRgba(col, 0.45);
            ctx2.font = "14px " + fnt;
            ctx2.fillText("TAP RESTART TO PLAY AGAIN", 360, 600);
          }
          ctx2.restore();
        },
        meta() {
          return [
            "SCORE " + game.score,
            "WAVE " + game.wave,
            "AMMO " + game.missilesLeft,
            "SILOS " + game.silos.filter((silo) => silo.alive).length
          ];
        },
        serialize() {
          return {
            summary: "SCORE " + game.score + " | WAVE " + game.wave,
            data: snapshotGameState(game, [
              "wave", "score", "missilesLeft", "waveQuota", "destroyedThisWave", "gameOver",
              "silos", "missiles", "enemyMissiles", "explosions", "spawnTimer", "flashTimer", "message"
            ])
          };
        },
        onKeyDown(event) {
          if (event.key === " ") {
            fireAt(360, 280);
          }
        }
      };
      el.gameCanvas.onclick = (event) => {
        if (!state.activeGame || state.activeGame.id !== game.id || game.gameOver) {
          return;
        }
        const point = getCanvasPoint(event);
        fireAt(point.x, point.y);
      };
      function spawnEnemyMissile() {
        const living = game.silos.filter((silo) => silo.alive);
        const target = living[Math.floor(Math.random() * living.length)] || { x: 360 };
        game.enemyMissiles.push({
          x: Math.random() * 700 + 10,
          y: -20,
          tx: target.x,
          ty: 980,
          speed: 90 + game.wave * 18
        });
      }
      function fireAt(x, y) {
        if (game.gameOver || game.missilesLeft <= 0) {
          playSound("error");
          return;
        }
        const living = game.silos.filter((silo) => silo.alive);
        if (!living.length) {
          return;
        }
        const source = living.reduce((best, silo) => Math.abs(silo.x - x) < Math.abs(best.x - x) ? silo : best, living[0]);
        game.missilesLeft -= 1;
        game.missiles.push({ x: source.x, y: 980, tx: x, ty: y, speed: 340 });
        playSound("click");
      }
      return game;
    }

    function createZetaInvaders(savedData) {
      const defaults = {
        wave: 1,
        score: 0,
        lives: 3,
        cooldown: 0,
        dir: 1,
        enemySpeed: 22,
        player: { x: 327, y: 972, w: 66, h: 30 },
        bullets: [],
        enemyBullets: [],
        bunkers: [
          { x: 84, y: 850, w: 92, h: 56, hp: 12, maxHp: 12, cells: [] },
          { x: 224, y: 850, w: 92, h: 56, hp: 12, maxHp: 12, cells: [] },
          { x: 404, y: 850, w: 92, h: 56, hp: 12, maxHp: 12, cells: [] },
          { x: 544, y: 850, w: 92, h: 56, hp: 12, maxHp: 12, cells: [] }
        ],
        invaders: [],
        message: "HOLD THE LINE",
        gameOver: false,
        winFlash: 0,
        invulnerable: 0,
        explosions: [],
        stepTimer: 0,
        stepInterval: 0.72,
        animFrame: 0,
        enemyFireTimer: 0.65,
        saucer: null,
        saucerTimer: 7,
        messageTimer: 0,
        formationDrop: 0
      };
      const restored = mergeGameState(defaults, savedData?.data);
      restored.bunkers = (restored.bunkers || defaults.bunkers).map((bunker, index) => normalizeInvaderBunker(bunker, defaults.bunkers[index]));
      const game = {
        id: "zeta-invaders",
        name: "ZETA INVADERS",
        ...restored,
        loaded: false,
        actions: [{ label: "RESTART", handler: () => launchGame("zeta-invaders", null) }],
        touchControls: [
          { label: "LEFT", handler: (on) => state.keys.arrowleft = on },
          { label: "FIRE", handler: (on) => on && fire() },
          { label: "RIGHT", handler: (on) => state.keys.arrowright = on }
        ],
        update(dt) {
          if (savedData && !game.loaded) {
            game.loaded = true;
          }
          if (!game.invaders.length) {
            seedWave();
          }
          game.winFlash = Math.max(0, game.winFlash - dt);
           game.invulnerable = Math.max(0, game.invulnerable - dt);
          game.messageTimer = Math.max(0, game.messageTimer - dt);
          game.stepTimer += dt;
          game.enemyFireTimer -= dt;
          game.saucerTimer -= dt;
          game.formationDrop = Math.max(0, game.formationDrop - dt * 3.2);
          game.explosions.forEach((blast) => blast.t += dt);
          game.explosions = game.explosions.filter((blast) => blast.t < blast.life);
          if (game.messageTimer <= 0 && !game.gameOver) {
            game.message = game.saucer ? "SAUCER IN RANGE" : "HOLD THE LINE";
          }
          if (game.gameOver) {
            return;
          }
          if (state.keys.arrowleft || state.keys.a) game.player.x -= 260 * dt;
          if (state.keys.arrowright || state.keys.d) game.player.x += 260 * dt;
          game.player.x = clamp(game.player.x, 16, 720 - game.player.w - 16);
          game.cooldown -= dt;
          updateFormation(dt);
          updateSaucer(dt);
          game.bullets.forEach((bullet) => bullet.y -= bullet.vy * dt);
          game.enemyBullets.forEach((bullet) => {
            bullet.y += bullet.vy * dt;
            bullet.phase = (bullet.phase || 0) + dt * bullet.wobble;
            bullet.x += Math.sin(bullet.phase) * bullet.amp * dt;
          });
          game.invaders.forEach((invader) => {
            if (!invader.alive) return;
            game.bullets.forEach((bullet) => {
              if (!bullet.hit && hitRect(bullet.x, bullet.y, invader.x, invader.y, invader.w, invader.h)) {
                bullet.hit = true;
                invader.alive = false;
                spawnInvaderExplosion(invader.x + invader.w / 2, invader.y + invader.h / 2, "alien");
                game.score += invader.score;
                game.enemySpeed += 0.7;
                game.animFrame = 1 - game.animFrame;
                playSound("beep");
              }
            });
            if (invader.y + invader.h > 860) {
              loseLife();
            }
          });
          if (game.saucer) {
            game.bullets.forEach((bullet) => {
              if (!bullet.hit && hitRect(bullet.x, bullet.y, game.saucer.x, game.saucer.y, game.saucer.w, game.saucer.h)) {
                bullet.hit = true;
                game.score += 125 + game.wave * 10;
                spawnInvaderExplosion(game.saucer.x + game.saucer.w / 2, game.saucer.y + game.saucer.h / 2, "saucer");
                game.saucer = null;
                setMessage("SAUCER SCRAPPED", 0.9);
                playSound("success");
              }
            });
          }
          handleInvaderBunkerHits(game.bunkers, game.enemyBullets);
          handleInvaderBunkerHits(game.bunkers, game.bullets);
          game.enemyBullets.forEach((bullet) => {
            if (hitRect(bullet.x, bullet.y, game.player.x, game.player.y, game.player.w, game.player.h)) {
              bullet.hit = true;
              loseLife();
            }
          });
          if (!aliveInvaders() && !game.gameOver) {
            game.wave += 1;
            game.score += 150 + game.wave * 20;
            game.enemySpeed = 22 + game.wave * 2.5;
            game.bullets = [];
            game.enemyBullets = [];
            game.dir = 1;
            game.winFlash = 0.4;
            game.stepTimer = 0;
            game.enemyFireTimer = 0.55;
            game.stepInterval = 0.72;
            restoreBunkers(2);
            setMessage("WAVE " + game.wave, 1.2);
            seedWave();
            playSound("success");
          }
          game.bullets = game.bullets.filter((bullet) => bullet.y > 0 && !bullet.hit);
          game.enemyBullets = game.enemyBullets.filter((bullet) => bullet.y < 1080 && !bullet.hit);
        },
        draw(ctx2, w, h) {
          clearGameCanvas(ctx2, w, h);
          drawGameGrid(ctx2, w, h);
          const scaleX = w / 720;
          const scaleY = h / 1080;
          ctx2.save();
          ctx2.scale(scaleX, scaleY);
          ctx2.strokeStyle = getCss("--text");
          ctx2.fillStyle = getCss("--text");
          drawZetaInvadersBackdrop(ctx2, game);
          drawZetaPlayerCannon(ctx2, game.player, game.invulnerable > 0);
          game.invaders.forEach((invader) => {
            if (!invader.alive) return;
            drawZetaInvaderSprite(ctx2, invader, game.animFrame);
          });
          if (game.saucer) {
            drawZetaSaucer(ctx2, game.saucer, game.animFrame);
          }
          game.bunkers.forEach((bunker) => {
            if (bunker.hp <= 0) return;
            drawZetaBunker(ctx2, bunker);
          });
          game.bullets.forEach((bullet) => drawZetaPlayerBolt(ctx2, bullet));
          game.enemyBullets.forEach((bullet) => drawZetaEnemyBolt(ctx2, bullet));
          game.explosions.forEach((blast) => drawZetaExplosion(ctx2, blast));
          drawCenteredText(ctx2, game.message, 360, 72, 18);
          if (game.winFlash > 0) {
            ctx2.fillStyle = hexToRgba(getThemeColor(), game.winFlash * 0.25);
            ctx2.fillRect(0, 0, 720, 1080);
          }
          if (game.gameOver) {
            drawCenteredText(ctx2, "INVASION SUCCESSFUL", 360, 520, 28);
          }
          ctx2.restore();
        },
        meta() {
          return ["SCORE " + game.score, "LIVES " + game.lives, "WAVE " + game.wave, "INVADERS " + aliveInvaders()];
        },
        serialize() {
          return {
            summary: "SCORE " + game.score + " | WAVE " + game.wave,
            data: snapshotGameState(game, [
              "wave", "score", "lives", "cooldown", "dir", "enemySpeed", "player", "bullets",
              "enemyBullets", "bunkers", "invaders", "message", "gameOver", "winFlash", "invulnerable",
              "explosions", "stepTimer", "stepInterval", "animFrame", "enemyFireTimer", "saucer", "saucerTimer",
              "messageTimer", "formationDrop"
            ])
          };
        },
        onKeyDown(event) {
          if (event.key === " " || event.key === "ArrowUp") {
            fire();
          }
        }
      };
      function seedWave() {
        game.invaders = [];
        const rowTypes = ["overseer", "raider", "raider", "drone", "drone"];
        for (let row = 0; row < 5; row += 1) {
          for (let col = 0; col < 8; col += 1) {
            const type = rowTypes[row];
            game.invaders.push({
              x: 56 + col * 76,
              y: 120 + row * 58,
              alive: true,
              type,
              w: 42,
              h: 28,
              row,
              col,
              score: type === "overseer" ? 40 : type === "raider" ? 30 : 20
            });
          }
        }
        game.dir = 1;
        game.stepTimer = 0;
        game.enemyFireTimer = Math.max(0.26, 0.7 - game.wave * 0.03);
        game.stepInterval = 0.72;
        game.saucerTimer = 5.5;
      }
      function aliveInvaders() {
        return game.invaders.filter((invader) => invader.alive).length;
      }
      function fire() {
        if (game.cooldown > 0 || game.gameOver || game.bullets.length) {
          return;
        }
        game.bullets.push({ x: game.player.x + game.player.w / 2 - 2, y: game.player.y - 8, vy: 520 });
        game.cooldown = 0.28;
        playSound("click");
      }
      function loseLife() {
        if (game.invulnerable > 0 || game.gameOver) {
          return;
        }
        game.lives -= 1;
        game.invulnerable = 0.8;
        spawnInvaderExplosion(game.player.x + game.player.w / 2, game.player.y + 12, "player");
        setMessage("BATTERY HIT", 0.8);
        game.bullets = [];
        game.enemyBullets = [];
        playSound("error");
        if (game.lives <= 0) {
          game.gameOver = true;
          storeHighScore(game.id, game.score);
        }
      }
      function updateFormation(dt) {
        const alive = game.invaders.filter((invader) => invader.alive);
        if (!alive.length) {
          return;
        }
        const edgeLeft = Math.min(...alive.map((invader) => invader.x));
        const edgeRight = Math.max(...alive.map((invader) => invader.x + invader.w));
        const step = 10 + game.wave * 0.8;
        const dropStep = 22;
        const pace = 0.82 - Math.min(0.56, (40 - alive.length) * 0.012) - Math.min(0.12, game.wave * 0.018);
        game.stepInterval = Math.max(0.11, pace);
        if (game.stepTimer >= game.stepInterval) {
          game.stepTimer = 0;
          let hitEdge = false;
          if (game.dir < 0 && edgeLeft - step < 20) hitEdge = true;
          if (game.dir > 0 && edgeRight + step > 700) hitEdge = true;
          if (hitEdge) {
            game.dir *= -1;
            game.formationDrop = 1;
            alive.forEach((invader) => {
              invader.y += dropStep;
            });
          } else {
            alive.forEach((invader) => {
              invader.x += game.dir * step;
            });
          }
          game.animFrame = 1 - game.animFrame;
          playSound("beep");
        }
        if (game.enemyFireTimer <= 0) {
          fireEnemyVolley();
          game.enemyFireTimer = Math.max(0.18, 0.86 - game.wave * 0.04 - (40 - alive.length) * 0.008);
        }
      }
      function fireEnemyVolley() {
        const shooters = bottomInvadersByColumn();
        if (!shooters.length) {
          return;
        }
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        game.enemyBullets.push({
          x: shooter.x + shooter.w / 2,
          y: shooter.y + shooter.h,
          vy: 280 + game.wave * 14,
          amp: 18 + Math.random() * 10,
          wobble: 6 + Math.random() * 4,
          phase: Math.random() * Math.PI * 2
        });
      }
      function bottomInvadersByColumn() {
        const map = new Map();
        game.invaders.forEach((invader) => {
          if (!invader.alive) return;
          const current = map.get(invader.col);
          if (!current || invader.y > current.y) {
            map.set(invader.col, invader);
          }
        });
        return Array.from(map.values());
      }
      function updateSaucer(dt) {
        if (game.saucer) {
          game.saucer.x += game.saucer.vx * dt;
          if (game.saucer.x < -game.saucer.w - 20 || game.saucer.x > 740) {
            game.saucer = null;
            game.saucerTimer = 6 + Math.random() * 5;
          }
          return;
        }
        if (game.saucerTimer <= 0) {
          const fromLeft = Math.random() > 0.5;
          game.saucer = {
            x: fromLeft ? -72 : 740,
            y: 74,
            w: 62,
            h: 24,
            vx: fromLeft ? 110 : -110
          };
          game.saucerTimer = 8 + Math.random() * 7;
          setMessage("UNIDENTIFIED CONTACT", 0.8);
        }
      }
      function restoreBunkers(amount) {
        game.bunkers.forEach((bunker) => {
          bunker.hp = Math.min(bunker.maxHp, bunker.hp + amount);
          repairBunkerCells(bunker);
        });
      }
      function setMessage(text, duration) {
        game.message = text;
        game.messageTimer = duration;
      }
      function spawnInvaderExplosion(x, y, kind) {
        game.explosions.push({ x, y, kind, t: 0, life: kind === "player" ? 0.46 : 0.3 });
      }
      return game;
    }

    function createPipfall(savedData) {
      const defaults = {
        distance: 0,
        caps: 0,
        speed: 206,
        roomsCleared: 0,
        player: {
          x: 118,
          y: 854,
          vy: 0,
          onGround: true,
          ducking: false,
          height: 68,
          width: 34,
          coyote: 0.12,
          jumpBuffer: 0,
          attachedRope: null,
          facing: 1
        },
        hazards: [],
        nextRoomAt: 760,
        gameOver: false,
        message: "WATCH THE LOGS. TIME THE SWING.",
        messageTimer: 0,
        scorePulse: 0,
        terrainFlash: 0,
        lastRoom: "start"
      };
      const restored = mergeGameState(defaults, savedData?.data);
      const groundY = 922;
      const game = {
        id: "pipfall",
        name: "PIPFALL",
        ...restored,
        loaded: false,
        actions: [{ label: "RESTART", handler: () => launchGame("pipfall", null) }],
        touchControls: [
          { label: "JUMP", handler: (on) => on && jump() },
          { label: "DUCK", handler: (on) => state.keys.arrowdown = on },
          { label: "RELEASE", handler: (on) => on && releaseRope() }
        ],
        update(dt) {
          if (savedData && !game.loaded) {
            game.loaded = true;
          }
          if (game.gameOver) {
            return;
          }
          const nextDucking = !!state.keys.arrowdown && game.player.onGround;
          const oldHeight = game.player.height;
          game.player.ducking = nextDucking;
          game.player.height = game.player.ducking ? 42 : 68;
          if (oldHeight !== game.player.height) {
            game.player.y += oldHeight - game.player.height;
          }
          game.distance += dt * 11;
          game.speed = 206 + Math.min(92, game.distance * 0.18);
          game.player.jumpBuffer = Math.max(0, game.player.jumpBuffer - dt);
          game.player.coyote = Math.max(0, game.player.coyote - dt);
          game.messageTimer = Math.max(0, game.messageTimer - dt);
          game.player.facing = 1;
          if (!game.hazards.length) {
            seedOpeningRooms();
          }
          const farthestHazardX = game.hazards.reduce((max, hazard) => Math.max(max, hazard.x + hazard.w), -Infinity);
          if (farthestHazardX < game.nextRoomAt) {
            spawnRoom();
          }
          game.hazards.forEach((hazard) => {
            hazard.x -= game.speed * dt;
            if (hazard.type === "log") {
              hazard.rotation = (hazard.rotation || 0) + (game.speed * dt * 0.08);
            }
            if (hazard.type === "caps") {
              hazard.yBase ??= hazard.y;
              hazard.y = hazard.yBase + Math.sin((game.distance + hazard.x) * 0.05) * 8;
            }
            if (hazard.type === "rope") {
              hazard.phase = (hazard.phase || 0) + dt * hazard.swingSpeed;
              hazard.tipX = hazard.x + Math.sin(hazard.phase) * hazard.swingWidth;
              hazard.tipY = hazard.anchorY + hazard.length;
            }
            if (hazard.type === "snake") {
              hazard.y = hazard.yBase + Math.sin((game.distance * 0.08) + hazard.waveOffset) * 6;
            }
          });

          if (game.player.attachedRope) {
            const rope = game.hazards.find((hazard) => hazard.id === game.player.attachedRope);
            if (!rope || rope.x < -120) {
              releaseRope();
            } else {
              game.player.x = rope.tipX - game.player.width / 2;
              game.player.y = rope.tipY - game.player.height + 10;
              game.player.vy = 0;
              game.player.onGround = false;
              if (Math.sin(rope.phase) > 0.96) {
                setPipfallMessage("RELEASE");
              }
            }
          } else {
            game.player.vy += 940 * dt;
            game.player.y += game.player.vy * dt;

            const supportLeft = game.player.x + 8;
            const supportRight = game.player.x + game.player.width - 8;
            const overPit = game.hazards.some((hazard) => hazard.type === "pit" && supportRight > hazard.x && supportLeft < hazard.x + hazard.w);
            if (!overPit && game.player.y >= groundY - game.player.height) {
              game.player.y = groundY - game.player.height;
              game.player.vy = 0;
              game.player.onGround = true;
              game.player.coyote = 0.12;
            } else {
              game.player.onGround = false;
              if (game.player.y > 1100 && !game.gameOver) {
                game.gameOver = true;
                game.message = "FELL INTO THE PIT";
                storeHighScore(game.id, Math.floor(game.distance));
                playSound("error");
              }
            }
          }
          if (!game.gameOver && game.player.jumpBuffer > 0 && game.player.coyote > 0) {
            doJump();
          }
          tryCatchRope();
          const playerRect = {
            x: game.player.x,
            y: game.player.y,
            w: game.player.width,
            h: game.player.height
          };
          game.hazards.forEach((hazard) => {
            const hit = rectsOverlap(playerRect, { x: hazard.x, y: hazard.y, w: hazard.w, h: hazard.h });
            if (!hit) return;
            if (hazard.type === "caps") {
              hazard.hit = true;
              game.caps += 1;
              game.scorePulse = 0.3;
              setPipfallMessage("CAPS STASH FOUND");
              playSound("success");
              return;
            }
            if (hazard.type === "idol") {
              hazard.hit = true;
              game.caps += 5;
              game.scorePulse = 0.45;
              setPipfallMessage("TREASURE RECOVERED");
              playSound("success");
              return;
            }
            if (hazard.type === "rope") {
              return;
            }
            if (hazard.type === "pit" && game.player.y + game.player.height <= hazard.y + 8) {
              return;
            }
            if (hazard.type === "branch" && game.player.ducking) {
              return;
            }
            game.gameOver = true;
            setPipfallMessage(hazard.label || "WASTELAND CLAIMED YOU", 99);
            game.terrainFlash = 0.4;
            storeHighScore(game.id, Math.floor(game.distance));
            playSound("error");
          });
          game.scorePulse = Math.max(0, (game.scorePulse || 0) - dt);
          game.terrainFlash = Math.max(0, (game.terrainFlash || 0) - dt);
          game.hazards = game.hazards.filter((hazard) => hazard.x > -220 && !hazard.hit);
        },
        draw(ctx2, w, h) {
          clearGameCanvas(ctx2, w, h);
          drawGameGrid(ctx2, w, h);
          const scaleX = w / 720;
          const scaleY = h / 1080;
          ctx2.save();
          ctx2.scale(scaleX, scaleY);
          ctx2.strokeStyle = getCss("--text");
          ctx2.fillStyle = getCss("--text");
          drawPipfallBackdrop(ctx2, game);
          ctx2.beginPath();
          ctx2.moveTo(0, groundY);
          ctx2.lineTo(720, groundY);
          ctx2.stroke();
          drawPipfallPlayer(ctx2, game);
          game.hazards.forEach((hazard) => {
            if (hazard.type === "pit") {
              ctx2.clearRect(hazard.x, groundY, hazard.w, 158);
              ctx2.strokeRect(hazard.x, groundY, hazard.w, 44);
            } else if (hazard.type === "caps") {
              ctx2.beginPath();
              ctx2.arc(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2, 12, 0, Math.PI * 2);
              ctx2.stroke();
            } else if (hazard.type === "idol") {
              ctx2.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h);
              ctx2.beginPath();
              ctx2.moveTo(hazard.x + hazard.w / 2, hazard.y - 12);
              ctx2.lineTo(hazard.x + hazard.w / 2, hazard.y);
              ctx2.stroke();
            } else if (hazard.type === "rope") {
              ctx2.beginPath();
              ctx2.moveTo(hazard.x, hazard.anchorY);
              ctx2.lineTo(hazard.tipX, hazard.tipY);
              ctx2.stroke();
              ctx2.beginPath();
              ctx2.arc(hazard.tipX, hazard.tipY, 8, 0, Math.PI * 2);
              ctx2.stroke();
              if (game.player.attachedRope === hazard.id) {
                ctx2.beginPath();
                ctx2.moveTo(hazard.tipX, hazard.tipY);
                ctx2.lineTo(game.player.x + game.player.width / 2, game.player.y + 12);
                ctx2.stroke();
              }
            } else if (hazard.type === "log") {
              ctx2.save();
              ctx2.translate(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2);
              ctx2.rotate(hazard.rotation || 0);
              ctx2.strokeRect(-hazard.w / 2, -hazard.h / 2, hazard.w, hazard.h);
              ctx2.restore();
            } else if (hazard.type === "scorpion") {
              ctx2.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h);
              ctx2.beginPath();
              ctx2.moveTo(hazard.x, hazard.y + hazard.h);
              ctx2.lineTo(hazard.x - 10, hazard.y + hazard.h + 8);
              ctx2.moveTo(hazard.x + hazard.w, hazard.y + hazard.h);
              ctx2.lineTo(hazard.x + hazard.w + 10, hazard.y + hazard.h + 8);
              ctx2.stroke();
            } else if (hazard.type === "fire") {
              ctx2.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h);
              ctx2.beginPath();
              ctx2.moveTo(hazard.x + 4, hazard.y + hazard.h);
              ctx2.lineTo(hazard.x + hazard.w / 2, hazard.y - 10);
              ctx2.lineTo(hazard.x + hazard.w - 4, hazard.y + hazard.h);
              ctx2.stroke();
            } else if (hazard.type === "branch") {
              ctx2.strokeRect(hazard.x, hazard.y, hazard.w, 14);
              ctx2.beginPath();
              ctx2.moveTo(hazard.x, hazard.y + 14);
              ctx2.lineTo(hazard.x - 16, hazard.y + 2);
              ctx2.moveTo(hazard.x + hazard.w, hazard.y + 14);
              ctx2.lineTo(hazard.x + hazard.w + 16, hazard.y + 2);
              ctx2.stroke();
            } else if (hazard.type === "snake") {
              ctx2.beginPath();
              ctx2.moveTo(hazard.x, hazard.y + hazard.h);
              ctx2.quadraticCurveTo(hazard.x + hazard.w / 2, hazard.y - 12, hazard.x + hazard.w, hazard.y + hazard.h);
              ctx2.stroke();
            } else {
              ctx2.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h);
            }
          });
          drawCenteredText(ctx2, game.message, 360, 70, 18);
          if (game.scorePulse > 0) {
            ctx2.fillStyle = hexToRgba(getThemeColor(), game.scorePulse * 0.2);
            ctx2.fillRect(0, 0, 720, 1080);
          }
          if (game.terrainFlash > 0) {
            ctx2.fillStyle = hexToRgba(getThemeColor(), game.terrainFlash * 0.24);
            ctx2.fillRect(0, 0, 720, 1080);
          }
          if (game.gameOver) {
            drawCenteredText(ctx2, "RUN TERMINATED", 360, 520, 28);
          }
          ctx2.restore();
        },
        meta() {
          return [
            "DISTANCE " + Math.floor(game.distance),
            "CAPS " + game.caps,
            "ROOMS " + game.roomsCleared,
            "SPEED " + Math.floor(game.speed)
          ];
        },
        serialize() {
          return {
            summary: "DIST " + Math.floor(game.distance) + " | CAPS " + game.caps,
            data: snapshotGameState(game, [
              "distance", "caps", "speed", "roomsCleared", "player", "hazards", "nextRoomAt", "gameOver", "message", "messageTimer", "scorePulse", "terrainFlash", "lastRoom"
            ])
          };
        },
        onKeyDown(event) {
          if (event.key === " " || event.key === "ArrowUp") {
            queueJump();
          }
        }
      };
      function seedOpeningRooms() {
        spawnCapsTrail(740);
        spawnRollingLogs(1160);
        game.nextRoomAt = 1180;
      }
      function spawnRoom() {
        const x = getNextRoomX();
        game.roomsCleared += 1;
        const rooms = [
          { id: "logs", fn: spawnRollingLogs },
          { id: "pit", fn: (roomX) => spawnWidePit(roomX, false) },
          { id: "rope", fn: (roomX) => spawnWidePit(roomX, true) },
          { id: "branch", fn: spawnLowBranchRoom },
          { id: "fire", fn: spawnFireRoom },
          { id: "caps", fn: spawnCapsTrail },
          { id: "snake", fn: spawnSnakeRoom },
          { id: "idol", fn: spawnTreasureRoom }
        ];
        const filtered = rooms.filter((room) => room.id !== game.lastRoom);
        const room = filtered[Math.floor(Math.random() * filtered.length)];
        room.fn(x);
        game.nextRoomAt = x + 420;
        if (game.roomsCleared % 5 === 0) {
          setPipfallMessage("ROOM " + game.roomsCleared);
        }
      }
      function getNextRoomX() {
        const farthestHazardX = game.hazards.reduce((max, hazard) => Math.max(max, hazard.x + hazard.w), 720);
        return Math.max(760, farthestHazardX + 180);
      }
      function setPipfallMessage(text, duration = 0.9) {
        if (game.messageTimer > 0.2 && duration < game.messageTimer) {
          return;
        }
        game.message = text;
        game.messageTimer = duration;
      }
      function spawnRollingLogs(x) {
        game.lastRoom = "logs";
        const count = Math.random() > 0.45 ? 2 : 3;
        for (let i = 0; i < count; i += 1) {
          game.hazards.push({
            id: crypto.randomUUID(),
            x: x + i * 68,
            y: 890,
            w: 46,
            h: 30,
            type: "log",
            rotation: i * 0.6,
            label: "LOG ROLLED YOU"
          });
        }
        if (count === 2) {
          game.hazards.push({ id: crypto.randomUUID(), x: x + 138, y: 842, w: 22, h: 22, type: "caps" });
        }
      }
      function spawnWidePit(x, withRope) {
        game.lastRoom = withRope ? "rope" : "pit";
        const pitWidth = withRope ? 164 : 122;
        game.hazards.push({ id: crypto.randomUUID(), x, y: 922, w: pitWidth, h: 40, type: "pit", label: "MISSED THE PIT" });
        if (withRope) {
          game.hazards.push({
            id: crypto.randomUUID(),
            x: x + pitWidth / 2,
            y: 0,
            w: 18,
            h: 150,
            type: "rope",
            anchorY: 240,
            length: 312,
            swingWidth: 72,
            swingSpeed: 2.8,
            phase: Math.PI / 2,
            tipX: x + pitWidth / 2,
            tipY: 552
          });
          game.hazards.push({ id: crypto.randomUUID(), x: x + pitWidth + 36, y: 842, w: 22, h: 22, type: "caps" });
        } else {
          game.hazards.push({ id: crypto.randomUUID(), x: x + pitWidth + 20, y: 890, w: 46, h: 30, type: "log", rotation: 0.4, label: "MISSED THE LANDING" });
        }
      }
      function spawnLowBranchRoom(x) {
        game.lastRoom = "branch";
        game.hazards.push({ id: crypto.randomUUID(), x, y: 812, w: 132, h: 20, type: "branch", label: "DUCK NEXT TIME" });
        game.hazards.push({ id: crypto.randomUUID(), x: x + 172, y: 890, w: 46, h: 30, type: "log", rotation: 0, label: "LOG ROLLED YOU" });
      }
      function spawnFireRoom(x) {
        game.lastRoom = "fire";
        game.hazards.push({ id: crypto.randomUUID(), x, y: 866, w: 28, h: 56, type: "fire", label: "WALKED INTO FIRE" });
        game.hazards.push({ id: crypto.randomUUID(), x: x + 74, y: 866, w: 28, h: 56, type: "fire", label: "WALKED INTO FIRE" });
        game.hazards.push({ id: crypto.randomUUID(), x: x + 44, y: 834, w: 22, h: 22, type: "caps" });
      }
      function spawnSnakeRoom(x) {
        game.lastRoom = "snake";
        game.hazards.push({ id: crypto.randomUUID(), x, y: 886, yBase: 886, w: 46, h: 26, type: "snake", waveOffset: Math.random() * Math.PI * 2, label: "SNAKE BITE" });
        game.hazards.push({ id: crypto.randomUUID(), x: x + 86, y: 886, yBase: 886, w: 46, h: 26, type: "snake", waveOffset: Math.random() * Math.PI * 2, label: "SNAKE BITE" });
        game.hazards.push({ id: crypto.randomUUID(), x: x + 52, y: 836, w: 22, h: 22, type: "caps" });
      }
      function spawnTreasureRoom(x) {
        game.lastRoom = "idol";
        game.hazards.push({ id: crypto.randomUUID(), x, y: 922, w: 132, h: 40, type: "pit", label: "TREASURE PIT" });
        game.hazards.push({
          id: crypto.randomUUID(),
          x: x + 66,
          y: 0,
          w: 18,
          h: 150,
          type: "rope",
          anchorY: 220,
          length: 298,
          swingWidth: 78,
          swingSpeed: 3,
          phase: Math.PI / 2,
          tipX: x + 66,
          tipY: 518
        });
        game.hazards.push({ id: crypto.randomUUID(), x: x + 180, y: 820, w: 26, h: 40, type: "idol" });
      }
      function spawnCapsTrail(x) {
        game.lastRoom = "caps";
        for (let i = 0; i < 4; i += 1) {
          game.hazards.push({
            id: crypto.randomUUID(),
            x: x + i * 34,
            y: 842 - Math.sin(i * 0.8) * 26,
            w: 22,
            h: 22,
            type: "caps"
          });
        }
        game.hazards.push({ id: crypto.randomUUID(), x: x + 162, y: 894, w: 34, h: 28, type: "scorpion", label: "RADSCORPION STRIKE" });
      }
      function queueJump() {
        if (game.gameOver) return;
        if (game.player.attachedRope) {
          releaseRope();
          return;
        }
        game.player.jumpBuffer = 0.14;
      }
      function doJump() {
        game.player.vy = -500;
        game.player.onGround = false;
        game.player.coyote = 0;
        game.player.jumpBuffer = 0;
        setPipfallMessage("JUMP", 0.35);
        playSound("click");
      }
      function tryCatchRope() {
        if (game.player.attachedRope || game.player.onGround) {
          return;
        }
        const handsX = game.player.x + game.player.width / 2;
        const handsY = game.player.y + 14;
        const rope = game.hazards.find((hazard) => {
          if (hazard.type !== "rope") return false;
          return Math.hypot(handsX - hazard.tipX, handsY - hazard.tipY) < 26;
        });
        if (!rope) {
          return;
        }
        game.player.attachedRope = rope.id;
        game.player.vy = 0;
        game.player.jumpBuffer = 0;
        setPipfallMessage("SWING", 0.45);
        playSound("success");
      }
      function releaseRope() {
        if (!game.player.attachedRope) {
          return;
        }
        const rope = game.hazards.find((hazard) => hazard.id === game.player.attachedRope);
        game.player.attachedRope = null;
        game.player.onGround = false;
        game.player.vy = -160;
        if (rope) {
          game.player.x = rope.tipX - game.player.width / 2 + 18;
        }
        setPipfallMessage("RELEASED", 0.45);
        playSound("click");
      }
      function jump() {
        queueJump();
        if (game.player.onGround || game.player.coyote > 0) {
          doJump();
        }
      }
      return game;
    }

    function createRedMenace(savedData) {
      const ladders = [
        { x: 162, y1: 970, y2: 758 },
        { x: 446, y1: 810, y2: 598 },
        { x: 232, y1: 650, y2: 438 },
        { x: 512, y1: 490, y2: 278 },
        { x: 314, y1: 330, y2: 138 }
      ];
      const platforms = [
        { x1: 20, x2: 700, y: 952, tilt: 0 },
        { x1: 20, x2: 700, y: 792, tilt: 24 },
        { x1: 20, x2: 700, y: 632, tilt: -22 },
        { x1: 20, x2: 700, y: 472, tilt: 22 },
        { x1: 20, x2: 700, y: 312, tilt: -20 },
        { x1: 20, x2: 700, y: 152, tilt: 0 }
      ];
      const defaults = {
        level: 1,
        score: 0,
        lives: 3,
        player: { x: 70, y: 904, w: 28, h: 44, vy: 0, climbing: false },
        barrels: [],
        barrelTimer: 1.1,
        barrelPhase: 0,
        invulnerable: 0,
        gameOver: false,
        message: "REACH THE VAULT DWELLER"
      };
      const restored = mergeGameState(defaults, savedData?.data);
      const game = {
        id: "red-menace",
        name: "RED MENACE",
        mutant: { x: 562, y: 96, w: 62, h: 48 },
        target: { x: 624, y: 102, w: 34, h: 42 },
        ...restored,
        loaded: false,
        actions: [{ label: "RESTART", handler: () => launchGame("red-menace", null) }],
        touchControls: [
          { label: "◄", handler: (on) => state.keys.arrowleft = on },
          { label: "▲", handler: (on) => state.keys.arrowup = on },
          { label: "►", handler: (on) => state.keys.arrowright = on },
          { label: "JUMP", handler: (on) => on && jump() },
          { label: "▼", handler: (on) => state.keys.arrowdown = on }
        ],
        update(dt) {
          if (savedData && !game.loaded) {
            game.loaded = true;
            if (typeof game.invulnerable !== "number") {
              game.invulnerable = game.invulnerable ? 0.4 : 0;
            }
          }
          if (game.gameOver) return;
          game.invulnerable = Math.max(0, game.invulnerable - dt);
          game.barrelPhase += dt * 6;
          const ladder = activeLadder();
          if (ladder && state.keys.arrowup) {
            game.player.climbing = true;
            game.player.y -= 190 * dt;
          } else if (ladder && state.keys.arrowdown) {
            game.player.climbing = true;
            game.player.y += 190 * dt;
          } else {
            game.player.climbing = false;
          }
          if (!game.player.climbing) {
            if (state.keys.arrowleft || state.keys.a) game.player.x -= 170 * dt;
            if (state.keys.arrowright || state.keys.d) game.player.x += 170 * dt;
            game.player.vy += 820 * dt;
            game.player.y += game.player.vy * dt;
            const floorY = getSupportedY(game.player.x + game.player.w / 2);
            if (floorY !== null && game.player.y + game.player.h >= floorY && game.player.y + game.player.h <= floorY + 38) {
              game.player.y = floorY - game.player.h;
              game.player.vy = 0;
            }
          }
          game.player.x = clamp(game.player.x, 0, 690);
          game.player.y = clamp(game.player.y, 96, 930);
          game.barrelTimer -= dt;
          if (game.barrelTimer <= 0) {
            game.barrelTimer = Math.max(0.55, 1.6 - game.level * 0.07);
            game.barrels.push({
              x: 580,
              y: 138,
              vx: -120 - game.level * 10,
              floor: 4,
              radius: 14,
              spin: 0,
              heat: 0.7 + Math.random() * 0.3
            });
          }
          game.barrels.forEach((barrel) => {
            barrel.x += barrel.vx * dt;
            barrel.spin = (barrel.spin || 0) + (barrel.vx / Math.max(8, barrel.radius * 3.2)) * dt;
            const floor = platforms[Math.max(0, Math.min(platforms.length - 1, barrel.floor))];
            barrel.y = platformY(floor, barrel.x) - barrel.radius;
            if (barrel.x <= floor.x1 + 10 || barrel.x >= floor.x2 - 10) {
              barrel.floor += barrel.vx < 0 ? -1 : 1;
              barrel.floor = clamp(barrel.floor, 0, platforms.length - 1);
              barrel.vx *= -1;
              game.score += 5;
              playSound("beep");
            }
            if (circleHitsRect(barrel.x, barrel.y, barrel.radius, game.player.x, game.player.y, game.player.w, game.player.h)) {
              loseLife();
            }
          });
          game.barrels = game.barrels.filter((barrel) => barrel.floor >= 0 && barrel.floor < platforms.length);
          if (rectsOverlap(game.player, game.target)) {
            game.level += 1;
            game.score += 300;
            game.message = "LEVEL " + game.level;
            game.player.x = 70;
            game.player.y = 904;
            game.player.vy = 0;
            game.barrels = [];
            playSound("success");
          }
        },
        draw(ctx2, w, h) {
          clearGameCanvas(ctx2, w, h);
          drawGameGrid(ctx2, w, h);
          const scaleX = w / 720;
          const scaleY = h / 1080;
          ctx2.save();
          ctx2.scale(scaleX, scaleY);
          ctx2.strokeStyle = getCss("--text");
          ctx2.fillStyle = getCss("--text");
          drawRedMenaceBackdrop(ctx2, game, platforms, ladders, platformY);
          game.barrels.forEach((barrel) => drawRedMenaceBarrel(ctx2, barrel));
          drawRedMenaceMutant(ctx2, game.mutant, game.level);
          drawRedMenaceCaptive(ctx2, game.target, game.level);
          drawRedMenaceRunner(ctx2, game.player, game.invulnerable > 0);
          drawCenteredText(ctx2, game.message, 360, 70, 18);
          if (game.gameOver) {
            drawCenteredText(ctx2, "THE MUTANT PREVAILS", 360, 520, 28);
          }
          ctx2.restore();
        },
        meta() {
          return ["SCORE " + game.score, "LEVEL " + game.level, "LIVES " + game.lives, "BARRELS " + game.barrels.length];
        },
        serialize() {
          return {
            summary: "SCORE " + game.score + " | LEVEL " + game.level,
            data: snapshotGameState(game, ["level", "score", "lives", "player", "barrels", "barrelTimer", "barrelPhase", "invulnerable", "gameOver", "message"])
          };
        },
        onKeyDown(event) {
          if (event.key === " ") {
            jump();
          }
        }
      };
      function platformY(platform, x) {
        const centerOffset = ((x - platform.x1) / (platform.x2 - platform.x1)) - 0.5;
        return platform.y + platform.tilt * centerOffset * 2;
      }
      function getSupportedY(x) {
        const floor = platforms.find((platform) => x >= platform.x1 && x <= platform.x2 && Math.abs(game.player.y + game.player.h - platformY(platform, x)) < 24);
        return floor ? platformY(floor, x) : null;
      }
      function activeLadder() {
        return ladders.find((ladder) =>
          Math.abs((ladder.x + 10) - (game.player.x + game.player.w / 2)) < 22 &&
          game.player.y < ladder.y1 + 30 &&
          game.player.y + game.player.h > ladder.y2
        );
      }
      function jump() {
        if (game.gameOver || game.player.climbing || game.player.vy !== 0) return;
        game.player.vy = -430;
        playSound("click");
      }
      function loseLife() {
        if (game.invulnerable > 0) return;
        game.lives -= 1;
        game.invulnerable = 0.75;
        game.player.x = 70;
        game.player.y = 904;
        game.player.vy = 0;
        game.barrels = [];
        game.message = "BARREL HIT";
        playSound("error");
        if (game.lives <= 0) {
          game.gameOver = true;
          storeHighScore(game.id, game.score);
        } else {
          window.setTimeout(() => {
            if (!game.gameOver) {
              game.message = "REACH THE VAULT DWELLER";
            }
          }, 600);
        }
      }
      return game;
    }

    function createRadPong(savedData) {
      const defaults = {
        scoreLeft: 0,
        scoreRight: 0,
        mode: "ai",
        left: { y: 430, h: 180 },
        right: { y: 430, h: 180 },
        ball: { x: 360, y: 540, vx: 240, vy: 180, r: 14 },
        flash: 0,
        shake: 0,
        roundOver: 0,
        winner: "",
        blastSide: "",
        spin: 0
      };
      const restored = mergeGameState(defaults, savedData?.data);
      const game = {
        id: "rad-pong",
        name: "RAD PONG",
        ...restored,
        loaded: false,
        actions: [
          { label: "MODE AI", handler: () => { game.mode = "ai"; } },
          { label: "MODE 2P", handler: () => { game.mode = "2p"; } },
          { label: "RESTART", handler: () => launchGame("rad-pong", null) }
        ],
        touchControls: [
          { label: "P1 UP", handler: (on) => state.keys.w = on },
          { label: "P1 DOWN", handler: (on) => state.keys.s = on },
          { label: "P2 UP", handler: (on) => state.keys.arrowup = on },
          { label: "P2 DOWN", handler: (on) => state.keys.arrowdown = on }
        ],
        update(dt) {
          if (savedData && !game.loaded) {
            game.loaded = true;
          }
          game.flash = Math.max(0, game.flash - dt * 1.8);
          game.shake = Math.max(0, game.shake - dt * 3);
          if (state.keys.w) game.left.y -= 320 * dt;
          if (state.keys.s) game.left.y += 320 * dt;
          if (game.mode === "2p") {
            if (state.keys.arrowup) game.right.y -= 320 * dt;
            if (state.keys.arrowdown) game.right.y += 320 * dt;
          } else {
            const aiTarget = game.ball.y - game.right.h / 2;
            game.right.y += (aiTarget - game.right.y) * 3.2 * dt;
          }
          game.left.y = clamp(game.left.y, 0, 900);
          game.right.y = clamp(game.right.y, 0, 900);
          if (game.roundOver > 0) {
            game.roundOver -= dt;
            if (game.roundOver <= 0) {
              resetServe(game.lastPoint || "left");
            }
            return;
          }
          game.ball.x += game.ball.vx * dt;
          game.ball.y += game.ball.vy * dt;
          game.spin += dt * 8;
          if (game.ball.y < game.ball.r || game.ball.y > 1080 - game.ball.r) {
            game.ball.vy *= -1;
            playSound("beep");
          }
          if (circleHitsRect(game.ball.x, game.ball.y, game.ball.r, 26, game.left.y, 20, game.left.h) && game.ball.vx < 0) {
            game.ball.vx = Math.abs(game.ball.vx) * 1.05;
            game.ball.vy += ((game.ball.y - (game.left.y + game.left.h / 2)) * 2.2);
            playSound("click");
          }
          if (circleHitsRect(game.ball.x, game.ball.y, game.ball.r, 674, game.right.y, 20, game.right.h) && game.ball.vx > 0) {
            game.ball.vx = -Math.abs(game.ball.vx) * 1.05;
            game.ball.vy += ((game.ball.y - (game.right.y + game.right.h / 2)) * 2.2);
            playSound("click");
          }
          if (game.ball.x < -40) score("right");
          if (game.ball.x > 760) score("left");
        },
        draw(ctx2, w, h) {
          clearGameCanvas(ctx2, w, h);
          drawGameGrid(ctx2, w, h);
          const scaleX = w / 720;
          const scaleY = h / 1080;
          ctx2.save();
          ctx2.scale(scaleX, scaleY);
          if (game.shake > 0) {
            ctx2.translate((Math.random() - 0.5) * 12 * game.shake, (Math.random() - 0.5) * 18 * game.shake);
          }
          ctx2.strokeStyle = getCss("--text");
          ctx2.fillStyle = getCss("--text");
          drawCenteredText(ctx2, "MUTANT GRENADE CATCH", 360, 48, 16);
          drawCenteredText(ctx2, game.mode === "2p" ? "TWO MUTANTS" : "MUTANT VS AUTO-TURRET", 360, 78, 12);
          ctx2.setLineDash([12, 12]);
          ctx2.beginPath();
          ctx2.moveTo(360, 0);
          ctx2.lineTo(360, 1080);
          ctx2.stroke();
          ctx2.setLineDash([]);
          drawRadPongMutantLane(ctx2, 90, "MUTANT A");
          drawRadPongMutantLane(ctx2, 630, game.mode === "2p" ? "MUTANT B" : "AUTO TURRET");
          drawRadPongHand(ctx2, 36, game.left.y, game.left.h, false);
          drawRadPongHand(ctx2, 664, game.right.y, game.right.h, true);
          drawRadPongGrenade(ctx2, game.ball, game.spin);
          if (game.flash > 0) {
            drawRadPongExplosion(ctx2, game.blastSide === "left" ? 132 : 588, game.ball.y, game.flash);
            ctx2.fillStyle = hexToRgba(getThemeColor(), game.flash * 0.6);
            ctx2.fillRect(0, 0, 720, 1080);
          }
          drawCenteredText(ctx2, String(game.scoreLeft), 250, 110, 42);
          drawCenteredText(ctx2, String(game.scoreRight), 470, 110, 42);
          if (game.winner) {
            drawCenteredText(ctx2, game.winner, 360, 200, 24);
          }
          ctx2.restore();
        },
        meta() {
          return ["MODE " + game.mode.toUpperCase(), "LEFT " + game.scoreLeft, "RIGHT " + game.scoreRight];
        },
        serialize() {
          return {
            summary: "LEFT " + game.scoreLeft + " | RIGHT " + game.scoreRight,
            data: snapshotGameState(game, ["scoreLeft", "scoreRight", "mode", "left", "right", "ball", "flash", "shake", "roundOver", "winner", "lastPoint", "blastSide", "spin"])
          };
        }
      };
      function resetServe(side) {
        game.ball = {
          x: 360,
          y: 540,
          vx: side === "left" ? 260 : -260,
          vy: (Math.random() * 2 - 1) * 180,
          r: 14
        };
        game.winner = "";
        game.blastSide = "";
      }
      function score(side) {
        if (side === "left") {
          game.scoreLeft += 1;
        } else {
          game.scoreRight += 1;
        }
        game.lastPoint = side;
        game.blastSide = side === "left" ? "right" : "left";
        game.flash = 1;
        game.shake = 1;
        game.roundOver = 0.7;
        playSound("error");
        if (game.scoreLeft >= 7 || game.scoreRight >= 7) {
          const max = Math.max(game.scoreLeft, game.scoreRight);
          storeHighScore(game.id, max);
          game.winner = game.scoreLeft > game.scoreRight ? "LEFT SIDE WINS" : "RIGHT SIDE WINS";
          game.scoreLeft = 0;
          game.scoreRight = 0;
        }
      }
      return game;
    }

    function createZetaLaunch(savedData) {
      const defaults = {
        score: 0,
        sectionsPlaced: 0,
        currentWidth: 170,
        stack: [],
        swing: { x: 360, dir: 1, speed: 220 },
        launchTimer: 0,
        gameOver: false,
        stageIndex: 0,
        message: "ALIGN THE NEXT STAGE"
      };
      const stages = [
        { label: "FINS", height: 34 },
        { label: "TANK", height: 46 },
        { label: "TANK", height: 46 },
        { label: "FUSELAGE", height: 40 },
        { label: "FUSELAGE", height: 40 },
        { label: "CAPSULE", height: 34 },
        { label: "NOSE", height: 28 }
      ];
      const restored = mergeGameState(defaults, savedData?.data);
      const game = {
        id: "zeta-launch",
        name: "ZETA LAUNCH PROTOCOL",
        ...restored,
        loaded: false,
        actions: [
          { label: "STACK", handler: placeSection },
          { label: "RESTART", handler: () => launchGame("zeta-launch", null) }
        ],
        touchControls: [{ label: "STACK", handler: (on) => on && placeSection() }],
        update(dt) {
          if (savedData && !game.loaded) {
            game.loaded = true;
          }
          if (game.launchTimer > 0) {
            game.launchTimer += dt;
            if (game.launchTimer > 5.2) {
              storeHighScore(game.id, game.score);
              launchGame(game.id, null);
            }
            return;
          }
          if (game.gameOver) {
            return;
          }
          game.swing.x += game.swing.dir * game.swing.speed * dt;
          if (game.swing.x < 110 || game.swing.x > 610) {
            game.swing.dir *= -1;
          }
          game.swing.speed = 220 + game.sectionsPlaced * 16;
        },
        draw(ctx2, w, h) {
          clearGameCanvas(ctx2, w, h);
          drawGameGrid(ctx2, w, h);
          const scaleX = w / 720;
          const scaleY = h / 1080;
          ctx2.save();
          ctx2.scale(scaleX, scaleY);
          ctx2.strokeStyle = getCss("--text");
          ctx2.fillStyle = getCss("--text");
          drawCenteredText(ctx2, game.message, 360, 80, 18);
          let y = 930;
          game.stack.forEach((section) => {
            ctx2.strokeRect(section.x - section.w / 2, y, section.w, section.h);
            drawCenteredText(ctx2, section.label, section.x, y + section.h - 8, 10);
            y -= section.h + 6;
          });
          if (game.launchTimer > 0) {
            const flameHeight = Math.min(260, game.launchTimer * 72);
            ctx2.beginPath();
            ctx2.moveTo(360, 980);
            ctx2.lineTo(330, 980 + flameHeight);
            ctx2.lineTo(390, 980 + flameHeight);
            ctx2.closePath();
            ctx2.stroke();
            ctx2.strokeRect(280, Math.max(20, 930 - game.launchTimer * 180), 160, 900);
            drawCenteredText(ctx2, "LAUNCH CONFIRMED", 360, 220, 26);
          } else if (!game.gameOver) {
            const stage = stages[Math.min(game.stageIndex, stages.length - 1)];
            const topY = 930 - stackHeight();
            ctx2.strokeRect(game.swing.x - game.currentWidth / 2, topY, game.currentWidth, stage.height);
            drawCenteredText(ctx2, stage.label, game.swing.x, topY + stage.height - 8, 10);
          }
          if (game.gameOver) {
            drawCenteredText(ctx2, "STACK COLLAPSED", 360, 220, 26);
          }
          ctx2.restore();
        },
        meta() {
          return ["STACK " + game.sectionsPlaced, "WIDTH " + Math.floor(game.currentWidth), "SCORE " + game.score];
        },
        serialize() {
          return {
            summary: "STACK " + game.sectionsPlaced + " | SCORE " + game.score,
            data: snapshotGameState(game, ["score", "sectionsPlaced", "currentWidth", "stack", "swing", "launchTimer", "gameOver", "stageIndex", "message"])
          };
        },
        onKeyDown(event) {
          if (event.key === " ") {
            placeSection();
          }
        }
      };
      function stackHeight() {
        return game.stack.reduce((total, section) => total + section.h + 6, 0);
      }
      function placeSection() {
        if (game.gameOver || game.launchTimer > 0) return;
        const stage = stages[Math.min(game.stageIndex, stages.length - 1)];
        const previous = game.stack[game.stack.length - 1];
        let x = game.swing.x;
        let width = game.currentWidth;
        if (previous) {
          const overlap = previous.w - Math.abs(previous.x - x);
          width = Math.max(0, overlap);
          if (width <= 24) {
            game.gameOver = true;
            game.message = "ROCKET LOST IN ASSEMBLY";
            playSound("error");
            storeHighScore(game.id, game.score);
            return;
          }
          x = (previous.x + x) / 2;
          game.currentWidth = width;
        }
        game.stack.push({ x, w: width, h: stage.height, label: stage.label });
        game.sectionsPlaced += 1;
        game.score += Math.floor(width * (game.stageIndex + 1));
        game.stageIndex += 1;
        game.message = stage.label + " LOCKED";
        playSound("click");
        if (game.stageIndex >= stages.length) {
          game.launchTimer = 0.01;
          game.message = "IGNITION";
          playSound("success");
          storeHighScore(game.id, game.score);
        }
      }
      return game;
    }

    function mergeGameState(defaults, saved) {
      if (!saved) {
        return structuredClone(defaults);
      }
      return Object.assign(structuredClone(defaults), structuredClone(saved));
    }

    function snapshotGameState(game, keys) {
      return structuredClone(keys.reduce((acc, key) => {
        acc[key] = game[key];
        return acc;
      }, {}));
    }

    function normalizeInvaderBunker(bunker, fallback) {
      const base = {
        x: fallback?.x ?? bunker.x ?? 0,
        y: fallback?.y ?? bunker.y ?? 850,
        w: fallback?.w ?? bunker.w ?? 92,
        h: fallback?.h ?? bunker.h ?? 56,
        hp: bunker.hp ?? fallback?.hp ?? 12,
        maxHp: bunker.maxHp ?? fallback?.maxHp ?? 12,
        cells: Array.isArray(bunker.cells) ? bunker.cells.slice(0, 15) : []
      };
      while (base.cells.length < 15) {
        base.cells.push(true);
      }
      if (!base.cells.some(Boolean)) {
        base.cells = base.cells.map((_, index) => index < Math.max(0, base.hp) ? true : false);
      }
      repairBunkerCells(base);
      return base;
    }

    function repairBunkerCells(bunker) {
      const target = Math.max(0, Math.min(bunker.maxHp, Math.round(bunker.hp)));
      const current = bunker.cells.filter(Boolean).length;
      if (current > target) {
        let remove = current - target;
        for (let i = bunker.cells.length - 1; i >= 0 && remove > 0; i -= 1) {
          if (bunker.cells[i]) {
            bunker.cells[i] = false;
            remove -= 1;
          }
        }
      } else if (current < target) {
        let add = target - current;
        for (let i = 0; i < bunker.cells.length && add > 0; i += 1) {
          if (!bunker.cells[i]) {
            bunker.cells[i] = true;
            add -= 1;
          }
        }
      }
    }

    function damageInvaderBunker(bunker) {
      if (bunker.hp <= 0) {
        return;
      }
      bunker.hp -= 1;
      const liveCells = bunker.cells.map((alive, index) => alive ? index : -1).filter((index) => index >= 0);
      if (liveCells.length) {
        const hitIndex = liveCells[Math.floor(Math.random() * liveCells.length)];
        bunker.cells[hitIndex] = false;
      }
    }

    function handleInvaderBunkerHits(bunkers, bullets) {
      bunkers.forEach((bunker) => {
        bullets.forEach((bullet) => {
          if (bunker.hp > 0 && !bullet.hit && hitRect(bullet.x, bullet.y, bunker.x, bunker.y, bunker.w, bunker.h)) {
            damageInvaderBunker(bunker);
            bullet.hit = true;
          }
        });
      });
    }

    function updateHomingMissiles(missiles, dt) {
      missiles.forEach((missile) => {
        const dx = missile.tx - missile.x;
        const dy = missile.ty - missile.y;
        const len = Math.hypot(dx, dy) || 1;
        missile.x += (dx / len) * missile.speed * dt;
        missile.y += (dy / len) * missile.speed * dt;
      });
    }

    function rectsOverlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
      const nearestX = clamp(cx, rx, rx + rw);
      const nearestY = clamp(cy, ry, ry + rh);
      return Math.hypot(cx - nearestX, cy - nearestY) <= r;
    }

