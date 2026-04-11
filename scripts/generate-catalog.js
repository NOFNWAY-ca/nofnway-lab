#!/usr/bin/env node
// generate-catalog.js
// Run on your local machine to build bgg-catalog.js.
//
// Usage:
//   BGG_USER=yourname BGG_PASS=yourpassword node scripts/generate-catalog.js
//
// Or just run it and it'll ask:
//   node scripts/generate-catalog.js
//
// Output: bgg-catalog.js in the repo root. Commit that file.
// Requires Node 18+. No dependencies.

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'bgg-catalog.js');

const BATCH_SIZE = 20;
const DELAY_MS   = 2000;

// ── Popular game IDs ────────────────────────────────────────────────────────
const POPULAR_IDS = [
  174430, 161936, 224517, 167791, 233078, 237182, 266192, 169786, 316554, 342942,
  291457, 220308, 182028, 183394, 162886, 198928, 173346, 68448,  148228, 163412,
  36218,  31260,  822,    13,     9209,   124361, 72125,  84876,  128882, 30549,
  2651,   25613,  45692,  96848,  12333,  37111,  40692,  146021, 15987,  205637,
  39856,  178900, 157354, 84227,  120677, 175914, 2181,   159675, 193738, 295486,
  216132, 241600, 300531, 276025, 359986, 357563, 336986, 295770, 325169, 226320,
  136888, 192508, 264220, 329175, 331106, 312067, 367220, 374173, 351538, 351913,
  312484, 187645, 230802, 246784, 102794, 155426, 126163, 180263, 129622, 254640,
  317311, 246900, 219217, 9217,   478,    463,    42,     220,    2511,   65244,
  160499, 176494, 194591, 233867, 302168, 339960, 366013, 350184, 312067, 270844,
];

// ── Prompt helper ───────────────────────────────────────────────────────────
function ask(question, hidden = false) {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      let input = '';
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', function handler(ch) {
        ch = ch + '';
        if (ch === '\r' || ch === '\n') {
          process.stdin.setRawMode?.(false);
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          rl.close();
          resolve(input);
        } else if (ch === '\u0003') {
          process.exit();
        } else {
          input += ch;
          process.stdout.write('*');
          process.stdin.once('data', handler);
        }
      });
    } else {
      rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
    }
  });
}

// ── BGG login ───────────────────────────────────────────────────────────────
async function bggLogin(username, password) {
  process.stdout.write('Logging in to BGG... ');
  const res = await fetch('https://boardgamegeek.com/login/api/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credentials: { username, password } }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Login failed (${res.status}): ${body.slice(0, 100)}`);
  }
  // Collect Set-Cookie headers
  const raw = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie') ?? ''];
  const cookies = raw
    .map(c => c.split(';')[0])
    .filter(Boolean)
    .join('; ');
  if (!cookies) throw new Error('Login appeared to succeed but no cookies returned');
  console.log('OK');
  return cookies;
}

// ── XML helpers ─────────────────────────────────────────────────────────────
function decodeXmlEntities(s) {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g,  '\n')
    .replace(/&#xA;/g,  '\n')
    .replace(/&amp;#10;/g, '\n');
}

function getFirstAttrByType(xml, tag, typeVal, attr) {
  const re  = new RegExp(`<${tag}[^>]*type="${typeVal}"[^>]*${attr}="([^"]*)"`, 'i');
  const re2 = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*type="${typeVal}"`, 'i');
  const m   = xml.match(re) || xml.match(re2);
  return m ? decodeXmlEntities(m[1]) : '';
}

function getAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, 'i');
  const m  = xml.match(re);
  return m ? decodeXmlEntities(m[1]) : '';
}

function getAllAttrByType(xml, tag, typeVal, attr) {
  const results = [];
  const seen    = new Set();
  for (const re of [
    new RegExp(`<${tag}[^>]*type="${typeVal}"[^>]*${attr}="([^"]*)"`, 'gi'),
    new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*type="${typeVal}"`, 'gi'),
  ]) {
    let m;
    while ((m = re.exec(xml)) !== null) {
      const v = decodeXmlEntities(m[1]);
      if (!seen.has(v)) { seen.add(v); results.push(v); }
    }
  }
  return results;
}

function getTagContent(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m  = xml.match(re);
  return m ? decodeXmlEntities(m[1].trim()) : '';
}

function splitItems(xml) {
  const items = [];
  const re    = /<item\s[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const idM = m[0].match(/\sid="(\d+)"/);
    if (idM) items.push({ id: idM[1], body: m[0] });
  }
  return items;
}

function parseThing(id, xml) {
  const name = getFirstAttrByType(xml, 'name', 'primary', 'value')
             || getAttr(xml, 'name', 'value')
             || '';
  if (!name) return null;

  let description = getTagContent(xml, 'description');
  description = description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 800);

  return {
    id,
    name,
    year:        getAttr(xml, 'yearpublished',  'value'),
    description,
    minplayers:  getAttr(xml, 'minplayers',     'value'),
    maxplayers:  getAttr(xml, 'maxplayers',     'value'),
    minplaytime: getAttr(xml, 'minplaytime',    'value'),
    maxplaytime: getAttr(xml, 'maxplaytime',    'value'),
    weight:      getAttr(xml, 'averageweight',  'value'),
    image:       getTagContent(xml, 'image').replace(/\s+/g, ''),
    categories:  getAllAttrByType(xml, 'link', 'boardgamecategory', 'value'),
    mechanics:   getAllAttrByType(xml, 'link', 'boardgamemechanic',  'value'),
  };
}

// ── Network ─────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchDetails(ids, cookies) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?stats=1&id=${ids.join(',')}`;
  process.stdout.write(`  Fetching IDs ${ids[0]}…${ids[ids.length-1]} `);

  for (let attempt = 0; attempt < 5; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: {
          'Cookie':     cookies,
          'User-Agent': 'Mozilla/5.0 (compatible; NOFNWAY-CatalogBuilder/1.0)',
          'Accept':     'application/xml',
        },
        signal: AbortSignal.timeout(30000),
      });
    } catch (e) {
      process.stdout.write('(network error, retry) ');
      await sleep(3000);
      continue;
    }

    if (res.status === 202) {
      process.stdout.write('(202, retry) ');
      await sleep(4000);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.log(`\n  HTTP ${res.status} — ${body.slice(0, 120)}`);
      return [];
    }

    const xml = await res.text();
    if (!xml || xml.length < 50) {
      process.stdout.write('(empty, retry) ');
      await sleep(3000);
      continue;
    }

    const items = splitItems(xml);
    const parsed = items.map(({ id, body }) => parseThing(id, body)).filter(Boolean);
    console.log(`got ${parsed.length}`);
    return parsed;
  }

  console.log('failed');
  return [];
}

async function fetchHotList(cookies) {
  process.stdout.write('Fetching BGG hot list... ');
  try {
    const res = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame', {
      headers: {
        'Cookie':     cookies,
        'User-Agent': 'Mozilla/5.0 (compatible; NOFNWAY-CatalogBuilder/1.0)',
        'Accept':     'application/xml',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { const b = await res.text().catch(() => ''); console.log(`HTTP ${res.status} — ${b.slice(0,80)}`); return []; }
    const xml  = await res.text();
    const ids  = [...xml.matchAll(/\sid="(\d+)"/g)].map(m => m[1]);
    console.log(`${ids.length} games`);
    return ids;
  } catch (e) {
    console.log('failed:', e.message);
    return [];
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== BGG Catalog Generator ===\n');

  const username = process.env.BGG_USER || await ask('BGG username: ');
  const password = process.env.BGG_PASS || await ask('BGG password: ', true);
  console.log('');

  const cookies = await bggLogin(username, password);

  const hotIds = await fetchHotList(cookies);
  await sleep(1500);

  const allIds = [...new Set([...hotIds, ...POPULAR_IDS.map(String)])];
  console.log(`\nTotal unique IDs: ${allIds.length}\n`);

  const catalog = [];
  const batches = Math.ceil(allIds.length / BATCH_SIZE);

  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    const batch = allIds.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${batches}: `);
    const results = await fetchDetails(batch, cookies);
    catalog.push(...results);
    if (i + BATCH_SIZE < allIds.length) await sleep(DELAY_MS);
  }

  catalog.sort((a, b) => a.name.localeCompare(b.name));

  const js = `// bgg-catalog.js — auto-generated by scripts/generate-catalog.js
// DO NOT edit by hand. Re-run the script to refresh.
// Generated: ${new Date().toISOString()}
// Games: ${catalog.length}
window.BGG_CATALOG = ${JSON.stringify(catalog, null, 2)};
`;

  writeFileSync(OUTPUT, js, 'utf8');
  const kb = (Buffer.byteLength(js) / 1024).toFixed(1);
  console.log(`\nDone. ${catalog.length} games written to bgg-catalog.js (${kb} KB)`);
  console.log('Now: git add bgg-catalog.js && git commit -m "Add BGG catalog" && git push');
}

main().catch(e => { console.error('\nError:', e.message); process.exit(1); });
