# NOFNWAY Lab Sync

## Status
Experimental site with live tool work and Cloudflare Functions.

## Current Focus Areas
- `alarm.html` and its Cloudflare Functions
- `charlie-bug/`
- `king-navigator.html` and `functions/api/bgg.js`

## Recent Changes
- Added shared sync workflow so Codex and Claude use the same handoff file.
- Added visible BoardGameGeek attribution to K.I.N.G. for XML API compliance.
- Added lightweight per-IP rate limiting to `/api/bgg` to reduce burst abuse risk.
- Re-enabled live BGG lookup in K.I.N.G. for uncataloged game IDs, URLs, and text searches that miss the local catalog.

## Next Recommended Step
- Track any `.env`, KV, or deployment assumptions here whenever alarm work is touched.
- If K.I.N.G. moves closer to public rollout, replace the in-memory `/api/bgg` limiter with KV-backed rate limiting and add longer-lived response caching.
