# AGENTS.md

## Deployment

No build step. Deploy = `git add … && git commit && git push` to `main`. Cloudflare Pages auto-deploys on push.

To test Cloudflare Functions locally (the alarm API):
```
npx wrangler pages dev .
```
This requires a local `.env` (git-ignored) with `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_JWK`, and the `NOFNWAY_LAB` KV namespace binding. There is no `wrangler.toml` in the repo.

## Architecture Overview

**NOFNWAY Lab** is a small dark-themed site (`--bg: #0a0a0a`, `--blue: #4d9eff`) with two live tools and one game. No framework, no bundler, no shared CSS file -- each page is self-contained.

### Tool pattern (alarm.html, medical.html)

Single HTML files with all CSS embedded in `<style>` and all JS inline before `</body>`. CSS variables defined per-page in `:root`. Pages include `<script src="privacy.js">` for the shared privacy-panel toggle (the only shared JS).

`alarm.html` is the primary live tool. Its JS is ~650 lines covering:
- **URL-based identity** -- `?code=XXXX` identifies the alarm instance; no accounts
- **Multi-view state machine** -- `landing → loading → alarm → ringing → edit` driven by `show(viewId)`
- **Web Audio API** -- synthesised alarm sounds (no audio files); three sound styles built from oscillators
- **Service worker** -- registers `/sw.js`, enables Web Push via VAPID
- **API calls** to `/api/alarm/:code` for read/write, `/api/alarm/:code/sub` for push subscriptions, `/api/alarm/:code/push` to trigger notifications

### Cloudflare Functions (functions/api/)

`functions/api/alarm/[[code]].js` handles all alarm routes via `onRequestGet`, `onRequestPost`, `onRequestDelete` exports. The `[[code]]` is Cloudflare Pages catch-all routing syntax.

KV storage key patterns:
- `alarm:${code}` -- alarm data, 90-day TTL
- `alarm-subs:${code}` -- push subscriptions array, 60-day TTL, max 20 entries

`functions/api/config.js` returns the VAPID public key from `env.VAPID_PUBLIC_KEY`.

VAPID signing for Web Push is done inline in the functions file (no external library).

### charlie-bug/ (canvas game)

Four JS files loaded via `<script>` tags (no bundler), each with a distinct role:

| File | Role |
|------|------|
| `js/data.js` | Constants only: `WORLD_W/H` (1440×1440), `THEMES` (6), `DECORATIONS`, `SCATTER_ZONES`, `PATH_SEGMENTS` |
| `js/draw.js` | All Canvas 2D rendering -- world, decorations, Charlie sprite, collectible items, particles, float text |
| `js/game.js` | Game loop (`requestAnimationFrame`), central `state` object, input (keyboard/touch/gamepad), camera, Web Audio, collection logic |
| `js/ui.js` | Celebration overlay rendering, screen-reader announcements |

**State flow:** `'title'` → `'scatter'` (90-frame wind animation) → `'game'` → `'celebrate'`

**Title screen is canvas-rendered** -- there is no DOM title overlay. The canvas `click` handler in `index.html` calls `startDay()` when `state.screen === 'title'`.

**Camera:** World space is 1440×1440; canvas is 480×480 CSS-scaled. All world coords translated by `-camera.x / -camera.y` before drawing.

**Input normalisation:** All movement sources (WASD/arrows, virtual joystick, gamepad axes 0/1 and d-pad buttons 12--15) write to a shared `keys` object read each frame.

**Collectible items** have `color1`/`color2` from their theme definition. `drawItem()` uses `item.color1` for the bubble border.

## CSS Variables

Each page defines its own `:root` block. Lab/tool pages use the dark palette:
- `--blue: #4d9eff` -- primary accent
- `--bg: #0a0a0a` -- page background
- `--card: #141414`, `--border: #2a2a2a`, `--text: #e0e0e0`, `--dim: #666`

charlie-bug uses a separate bright/cheerful palette (sky blue, grass green) defined in its own `index.html`.

## Shared Utilities

**`privacy.js`** -- exports `togglePrivacy()`. Toggles the `hidden` attribute on `#privacy-panel` and closes on outside click or Escape. Required by any page that has a privacy shield button.

**`sw.js`** -- service worker for `alarm.html`. Stores the alarm code, converts incoming push payloads to browser notifications, and focuses/opens the alarm page on notification click.

## Agent Sync

- Read `SYNC.md` before starting work.
- Update `SYNC.md` after meaningful changes so Codex and Claude share the current state.
