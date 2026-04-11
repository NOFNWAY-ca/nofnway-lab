#!/usr/bin/env node
// generate-catalog.js
// Run this on your local machine (not via Cloudflare) to build bgg-catalog.js.
// BGG blocks Cloudflare IPs; your home IP works fine.
//
// Setup (one time):
//   cd scripts
//   npm init -y
//   npm install jsdom
//   cd ..
//
// Run:
//   node scripts/generate-catalog.js
//
// Output: bgg-catalog.js in the repo root — commit this file.
// Time:   ~3-5 minutes (rate-limited fetching, ~150-200 games).
//
// Requires Node 18+.

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'bgg-catalog.js');

const BATCH_SIZE = 20;
const DELAY_MS   = 2000; // between batches, be polite to BGG

// ── Hardcoded popular game IDs ─────────────────────────────────────────────
// Add or remove IDs here to adjust the catalog.
const POPULAR_IDS = [
  174430, // Gloomhaven
  161936, // Pandemic Legacy: Season 1
  224517, // Brass: Birmingham
  167791, // Terraforming Mars
  233078, // Spirit Island
  237182, // Root
  266192, // Wingspan
  169786, // Scythe
  316554, // Dune: Imperium
  342942, // Ark Nova
  291457, // Everdell
  266830, // Clank! In! Space!
  220308, // Gaia Project
  187645, // Dead of Winter: A Crossroads Game
  180263, // The Castles of Burgundy (2019 reprint)
  182028, // Through the Ages: A New Story of Civilization
  183394, // Viticulture Essential Edition
  187645, // Dead of Winter
  220308, // Gaia Project
  162886, // Blood Rage
  198928, // Azul
  230802, // Azul: Stained Glass of Sintra
  246900, // Pandemic: Fall of Rome
  269385, // Wingspan: European Expansion
  102794, // Caverna: The Cave Farmers
  68448,  // 7 Wonders
  173346, // 7 Wonders Duel
  155426, // Broom Service
  148228, // Splendor
  163412, // Patchwork
  178900, // The Voyages of Marco Polo
  160499, // Viticulture
  36218,  // Dominion
  31260,  // Agricola
  822,    // Carcassonne
  13,     // Catan
  9209,   // Ticket to Ride
  124361, // Concordia
  72125,  // Eclipse
  84876,  // The Resistance
  128882, // Coup
  131835, // Pandemic: In the Lab
  30549,  // Pandemic
  463,    // Diplomacy
  2651,   // Power Grid
  65244,  // Ora et Labora
  220,    // Puerto Rico
  25613,  // Hanabi
  45692,  // Small World
  96848,  // Love Letter
  822,    // Carcassonne
  12333,  // Twilight Struggle
  37111,  // Battlestar Galactica
  37904,  // Container
  70323,  // Kings of Air and Steam
  40692,  // Le Havre
  25554,  // Agricola (2007)
  126163, // Caverna
  146021, // Eldritch Horror
  15987,  // Arkham Horror
  205637, // Arkham Horror: The Card Game
  2511,   // Acquire
  9217,   // Stone Age
  39856,  // Dixit
  41114,  // Quarriors!
  171,    // Chess
  188,    // Go
  3076,   // Backgammon
  432,    // Risk
  5,      // Acquire (original)
  6249,   // Labyrinth: The War on Terror
  42,     // Tigris & Euphrates
  478,    // Citadels
  463,    // Diplomacy
  521,    // Brittania
  241600, // Pandemic Legacy: Season 2
  300531, // Pandemic Legacy: Season 0
  276025, // The Crew: The Quest for Planet Nine
  359986, // The Crew: Mission Deep Sea
  357563, // Cascadia
  336986, // Lost Ruins of Arnak
  312484, // Lost Ruins of Arnak: Expedition Leaders
  295770, // Sleeping Gods
  317311, // Oath
  325169, // Cartographers
  246784, // Tainted Grail: The Fall of Avalon
  219217, // Pandemic Iberia
  324856, // Dune: House Secrets
  187645, // Dead of Winter
  271320, // Catan: Dawn of Humankind
  226320, // Twilight Imperium: 4th Ed
  136888, // Twilight Imperium: 3rd Ed
  176494, // Viticulture World
  205398, // Keyflower
  175914, // Food Chain Magnate
  84227,  // King of Tokyo
  157354, // Five Tribes
  129622, // Star Wars: X-Wing
  120677, // Terra Mystica
  254640, // Mombasa
  68448,  // 7 Wonders
  159675, // Hive Pocket
  2181,   // Hive
  209778, // Keyflower: The Farmers
  193738, // Great Western Trail
  233867, // Great Western Trail: Rails to the North
  295486, // Underwater Cities
  216132, // Clans of Caledonia
  192508, // Alien Frontiers
  194594, // Small World of Warcraft
  264220, // Wingspan: Oceania Expansion
  302168, // Vindication
  339960, // Voidfall
  350184, // Lands of Galzyr
  351538, // Lacrimosa
  367220, // Arcs
  374173, // Hegemony: Lead Your Class to Victory
  366013, // Molly House
  351913, // Sky Team
  329175, // Ark Nova: Marine Worlds
  331106, // Tiletum
  312067, // Flamecraft
  321608, // Lands of Galzyr
  308765, // Sleeping Gods: Distant Skies
];

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getText(doc, tag) {
  return doc.getElementsByTagName(tag)?.[0]?.getAttribute('value')
      || doc.getElementsByTagName(tag)?.[0]?.textContent?.trim()
      || '';
}

function getAttr(item, tag, attr) {
  return item.getElementsByTagName(tag)?.[0]?.getAttribute(attr) || '';
}

function parseThing(item) {
  const id = item.getAttribute('id');

  // Name
  let name = '';
  const names = item.getElementsByTagName('name');
  for (const n of names) {
    if (n.getAttribute('type') === 'primary') { name = n.getAttribute('value') || ''; break; }
  }
  if (!name && names[0]) name = names[0].getAttribute('value') || names[0].textContent.trim();

  const year        = getAttr(item, 'yearpublished', 'value');
  const minplayers  = getAttr(item, 'minplayers', 'value');
  const maxplayers  = getAttr(item, 'maxplayers', 'value');
  const minplaytime = getAttr(item, 'minplaytime', 'value');
  const maxplaytime = getAttr(item, 'maxplaytime', 'value');
  const image       = item.getElementsByTagName('image')?.[0]?.textContent?.trim() || '';

  // Description (strip CDATA markers if present)
  let description = item.getElementsByTagName('description')?.[0]?.textContent?.trim() || '';
  description = description.replace(/&amp;#10;/g, '\n').replace(/&#10;/g, '\n').slice(0, 800);

  // Categories and mechanics
  const categories = [];
  const mechanics  = [];
  const links = item.getElementsByTagName('link');
  for (const l of links) {
    if (l.getAttribute('type') === 'boardgamecategory') categories.push(l.getAttribute('value'));
    if (l.getAttribute('type') === 'boardgamemechanic')  mechanics.push(l.getAttribute('value'));
  }

  // Weight (average complexity)
  const weight = item.getElementsByTagName('averageweight')?.[0]?.getAttribute('value') || '';

  return { id, name, year, description, minplayers, maxplayers, minplaytime, maxplaytime, categories, mechanics, weight, image };
}

// ── XML parser (Node doesn't have DOMParser, use regex fallback) ───────────
// We use a small dependency-free approach: parse the XML with a lightweight
// hand-rolled parser focused on the fields we need.

import { JSDOM } from 'jsdom';

async function fetchDetails(ids) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?stats=1&id=${ids.join(',')}`;
  console.log(`  Fetching ${ids.length} games: ${ids.slice(0, 3).join(',')}...`);

  let attempts = 0;
  while (attempts < 4) {
    attempts++;
    let res;
    try {
      res = await fetch(url, {
        headers: {
          'User-Agent': 'NOFNWAY-CatalogBuilder/1.0 (personal project; contact: admin@nofnway.ca)',
          'Accept': 'application/xml',
        }
      });
    } catch (e) {
      console.warn(`  Fetch error (attempt ${attempts}):`, e.message);
      await sleep(3000);
      continue;
    }

    if (res.status === 202) {
      console.log(`  202 queue — waiting 4s...`);
      await sleep(4000);
      continue;
    }

    if (!res.ok) {
      console.warn(`  HTTP ${res.status} — skipping batch`);
      return [];
    }

    const xml = await res.text();
    if (!xml || xml.length < 50) {
      console.warn(`  Empty body (attempt ${attempts}) — retrying...`);
      await sleep(3000);
      continue;
    }

    // Parse with jsdom
    const dom  = new JSDOM(xml, { contentType: 'text/xml' });
    const items = dom.window.document.getElementsByTagName('item');
    const results = [];
    for (const item of items) {
      try {
        results.push(parseThing(item));
      } catch (e) {
        console.warn('  Parse error for item:', e.message);
      }
    }
    return results;
  }

  console.warn('  All attempts exhausted for batch');
  return [];
}

async function fetchHotList() {
  console.log('Fetching BGG hot list...');
  const res = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame', {
    headers: { 'User-Agent': 'NOFNWAY-CatalogBuilder/1.0 (contact: admin@nofnway.ca)' }
  });
  if (!res.ok) { console.warn('Hot list failed:', res.status); return []; }
  const xml = await res.text();
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const items = dom.window.document.getElementsByTagName('item');
  const ids = [];
  for (const item of items) ids.push(item.getAttribute('id'));
  console.log(`  Got ${ids.length} hot games`);
  return ids;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== BGG Catalog Generator ===\n');

  // Check for jsdom
  try {
    await import('jsdom');
  } catch {
    console.error('Missing dependency: run  npm install jsdom  first');
    process.exit(1);
  }

  // Gather all IDs
  const hotIds = await fetchHotList();
  await sleep(1500);

  const allIds = [...new Set([...hotIds, ...POPULAR_IDS.map(String)])];
  console.log(`\nTotal unique IDs to fetch: ${allIds.length}`);

  // Batch fetch
  const catalog = [];
  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    const batch = allIds.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(allIds.length / BATCH_SIZE)}`);
    const results = await fetchDetails(batch);
    catalog.push(...results);
    console.log(`  Got ${results.length} games (catalog total: ${catalog.length})`);
    if (i + BATCH_SIZE < allIds.length) await sleep(DELAY_MS);
  }

  // Sort by name
  catalog.sort((a, b) => a.name.localeCompare(b.name));

  // Write output
  const js = `// bgg-catalog.js — auto-generated by scripts/generate-catalog.js
// DO NOT edit by hand. Re-run the script to refresh.
// Generated: ${new Date().toISOString()}
// Games: ${catalog.length}
window.BGG_CATALOG = ${JSON.stringify(catalog, null, 2)};
`;

  writeFileSync(OUTPUT, js, 'utf8');
  console.log(`\nDone. Wrote ${catalog.length} games to bgg-catalog.js`);
  console.log(`File size: ${(Buffer.byteLength(js, 'utf8') / 1024).toFixed(1)} KB`);
}

main().catch(e => { console.error(e); process.exit(1); });
