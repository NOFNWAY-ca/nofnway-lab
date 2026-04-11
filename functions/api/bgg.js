const ALLOWED_PREFIX = 'https://boardgamegeek.com/xmlapi2/';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = url.searchParams.get('url');

  if (!target) {
    return new Response('Missing url parameter', { status: 400 });
  }

  if (!target.startsWith(ALLOWED_PREFIX)) {
    return new Response('Only BGG XML API URLs allowed', { status: 403 });
  }

  try {
    const res = await fetch(target, {
      headers: {
        'User-Agent': 'KING-Navigator-Bot-v1',
        'Accept': 'application/xml, text/xml, */*'
      }
    });
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
  } catch (err) {
    return new Response('Fetch error: ' + err.message, { status: 502 });
  }
}
