# NOFNWAY Lab Sync

## Status
Experimental site with live tool work and Cloudflare Functions.

## Current Focus Areas
- `alarm.html` and its Cloudflare Functions
- `charlie-bug/`
- `king-navigator.html` and `functions/api/bgg.js`

## Recent Changes
- Added shared sync workflow so Codex and Claude use the same handoff file.
- Gave `charlie-bug/` a kid-facing art polish pass: smoother illustrated canvas rendering, brighter title screen, stronger collectible rings, richer garden/path depth, and cleaner HUD/joystick styling while preserving touch, keyboard, and gamepad controls.
- Added visible BoardGameGeek attribution to K.I.N.G. for XML API compliance.
- Added lightweight per-IP rate limiting to `/api/bgg` to reduce burst abuse risk.
- Reworked K.I.N.G. search so live BGG lookup fills a user-built local cache instead of relying on a seeded catalog.
- Updated `/api/bgg` and `king-navigator.html` to handle BGG's current bearer-token requirement cleanly instead of failing with opaque 502s or false "No results" messages.
- Added a 7-day server-side Cache API layer to `/api/bgg`, keyed by the full proxy request URL and limited to successful XML responses.
- Normalized `/api/bgg` Cache API keys to URL-only `Request` objects so request headers do not create duplicate cache entries.
- Added a strict 30-second outbound timeout to `/api/bgg` fetches so timed-out BGG requests fail cleanly with HTTP 504 after the retry path is exhausted.
- Added structured JSON logging and in-flight request coalescing to `/api/bgg` so concurrent identical cache misses share one upstream BGG fetch.
- Updated `/api/bgg` to retry BGG `202` processing responses on the same 1s/2s/4s backoff before returning a final 503.
- Added clearer K.I.N.G. search status messaging so BGG lookups now show local search, remote fetch, retry, and failure states in the existing results area.
- Updated the K.I.N.G. search field copy to explain the local-catalog-first flow and live BGG fallback more accurately.
- Updated K.I.N.G. library cards to render saved game thumbnails when present.
- Standardized K.I.N.G. library cards to always render a thumbnail slot with dedicated `.game-thumb` styling.
- Added a load-time library migration so older saved games inherit thumbnail data from nested details or legacy image fields.
- Fixed K.I.N.G. thumbnail parsing to read `<thumbnail>` from the current BGG `<item>` node and now persist a root-level `thumbnail` on new library saves.
- Hardened K.I.N.G. library thumbnail rendering so empty or broken thumbnail URLs no longer show broken image icons.
- Fixed the BGG attribution image host and made live BGG search result saves fetch full details before storing so thumbnails can be saved for remote-only games.
- Added thumbnail hydration for the first few visible K.I.N.G. search results so thumbnails appear before games are added to the library without exceeding the proxy burst limit.
- Removed the seeded `bgg-catalog.js` path. K.I.N.G. now uses a local `king_bgg_cache` built only from games this browser has viewed or saved from BGG responses.
- Stabilized K.I.N.G. thumbnail layout with fixed-size wrappers and safer lazy/error image handling for search and library rows.
- Improved K.I.N.G. local cached search ranking with lightweight scoring across title, categories, and mechanics.
- Added backward-compatible library favorites with favorite-first rendering and local-only toggle behavior.
- Added defensive BGG suggested-player parsing plus richer game detail and rules detail cards with covers, recommendations, and compact tags.
- Added optional per-game session templates in K.I.N.G. with tracker names, default notes, player roles, and a game-detail template editor.
- Expanded K.I.N.G. into a fuller local game-night cockpit: library sort/filter controls, shelf status, quick-reference notes, search-result detail overlays, recent-session resume/duplicate cards, in-session notes, richer end-session history snapshots, a dedicated history tab, a game-night picker, and full backup/restore for all local K.I.N.G. data.

## Next Recommended Step
- Track any `.env`, KV, or deployment assumptions here whenever alarm work is touched.
- Add `BGG_API_TOKEN` to the Cloudflare Pages environment for NOFNWAY Lab after registering/approving the app with BoardGameGeek.
- If K.I.N.G. moves closer to public rollout, replace the in-memory `/api/bgg` limiter with KV-backed rate limiting.
- Browser-preview K.I.N.G. and verify the new flows end-to-end: search-result detail add, shelf/status filtering, recent-session resume, history rendering, and full backup/restore import.
