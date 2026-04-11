const ALLOWED_PREFIX = 'https://boardgamegeek.com/xmlapi2/';

const BGG_HEADERS = {
  'User-Agent': 'NOFNWAY-King-Navigator/1.0 (contact: admin@nofnway.ca)',
  'Accept': 'application/xml, text/xml',
  'Referer': 'https://lab.nofnway.ca/'
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // BGG 202 processing window

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = url.searchParams.get('url');

  if (!target) {
    return new Response('Missing url parameter', { status: 400 });
  }
  if (!target.startsWith(ALLOWED_PREFIX)) {
    return new Response('Only BGG XML API URLs allowed', { status: 403 });
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch(target, {
        headers: BGG_HEADERS,
        cf: { cacheEverything: true, cacheTtl: 300 }
      });
    } catch (err) {
      // Network-level failure — no point retrying
      return new Response('Fetch error: ' + err.message, {
        status: 502,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // BGG 202: "queued, come back shortly"
    if (res.status === 202) {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        continue;
      }
      return new Response('BGG is still processing. Try again in a moment.', {
        status: 202,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!res.ok) {
      return new Response(`BGG returned ${res.status} ${res.statusText}`, {
        status: 502,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const text = await res.text();
    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
}
