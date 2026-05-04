# NOFNWAY Lab Sync

## Status
Experimental site with live tool work and Cloudflare Functions.

## Current Focus Areas
- `alarm.html` and its Cloudflare Functions
- `charlie-bug/`
- `king-navigator.html` and `functions/api/bgg.js`

## Recent Changes
- Upgraded `mcmahon-ranch.html` in place from record keeping toward daily ranch operations: added default Today alerts, cattle group selection and bulk notes/move prefill, animal history timelines, pasture density, data export/import/reset, activity log, versioned meta, guarded saves, rolling local backups, manual file/clipboard sync, import preview with Replace/Merge conflict handling, and large-dataset warnings.
- Extended `mcmahon-ranch.html` shared-use support with local user identity, Personal/Shared mode, per-record `updatedAt`/`updatedBy` stamping on write paths, user-aware recent activity, import summaries showing last editor/change counts, merge conflict logging by `updatedAt`, soft edit warnings, and optional shared JSON endpoint pull/push controls.
- Added separate CCIA tag support to `mcmahon-ranch.html` cattle records, including seed/default normalization, sortable cattle table column, add/edit modal field, save logic, and backward-compatible handling for existing localStorage data.
- Tightened `mcmahon-ranch.html` responsive layout: centered max-width content on desktop, horizontal scrolling for tab/table overflow, mobile toolbar/form/modal wrapping, and reduced mobile padding so width behaves consistently.
- Removed the temporary Garage Terminal preview from NOFNWAY Lab, including its landing-page card and copied TerminalF JS files.
- Fixed four BGG collection overlay issues from review: modal reopen now seeds selection from current library instead of re-running auto-select; import always does a fresh BGG fetch (cache no longer substitutes for import data); terminal 202 now surfaces a descriptive retry message instead of false "No collection found"; "Select All" renamed to "Select Up To 50".
- Fixed K.I.N.G. collection import failing due to rate limit exhaustion: import loop now delays 500ms between requests, rate limiter tuned to 10 tokens / 500ms refill.
- Bug sweep on king-navigator.html: removed dead addToLibrary function, added favorite and sessionTemplate to addToLibraryWithDetails, removed redundant img.onerror on search thumbnails, fixed mixed tab/space indentation, added playCount increment on session end.
- Added K.I.N.G. BGG collection import with stored username support, owned-game fetch, optional play-history import, top-50 auto-selection, manual selection controls, sequential detail import, and later collection management from saved local data.
- Refreshed the temporary `garage-terminal-preview.html` mobile test page with a bug-sweep pass that clears stuck inputs on blur, tab hide, game launch/exit, and touch-control pointer cancellation.
- Refreshed the temporary `garage-terminal-preview.html` mobile test page with the refactored multi-file garage terminal build, including external JS modules, storage migration guards, and quieter Home Assistant offline alerting.
- Refreshed the temporary `garage-terminal-preview.html` mobile test page with the rebuilt `RED MENACE` pass, including authored girder-stage art, character silhouettes, animated barrels, and cleaner in-game feedback.
- Refreshed the temporary `garage-terminal-preview.html` mobile test page with the rebuilt `ZETA INVADERS` pass, including original arcade-style sprites, stepped formation pacing, saucer runs, bunker damage visuals, and stronger wave behavior.
- Added a temporary `garage-terminal-preview.html` page to NOFNWAY Lab for mobile testing of the Fallout-style garage terminal app, plus a matching temporary landing-page card.
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
- Added a UI-clarity pass to K.I.N.G. with helper copy for library filters, backup scope, rules shortcuts, session persistence, picker behavior, history scope, quick reference, templates, and in-session editing gestures.
- Added a mobile-fit pass to K.I.N.G. so the header and nav wrap cleanly on phones, touch targets are larger during play, and detail/template overlays stack their controls instead of forcing cramped horizontal rows.
- Expanded K.I.N.G.'s next-priority session layer: last-played tracking in the library, broader keyboard shortcuts, a visible save-status indicator, template-driven setup assistant and victory reminders, active turn-order controls, session undo, richer history stats, duration logging, and normalization for imported/restored sessions and history.

## Next Recommended Step
- Track any `.env`, KV, or deployment assumptions here whenever alarm work is touched.
- Add `BGG_API_TOKEN` to the Cloudflare Pages environment for NOFNWAY Lab after registering/approving the app with BoardGameGeek.
- If K.I.N.G. moves closer to public rollout, replace the in-memory `/api/bgg` limiter with KV-backed rate limiting.
- Browser-preview K.I.N.G. and verify the new flows end-to-end: search-result detail add, shelf/status filtering, recent-session resume, history rendering, and full backup/restore import.
