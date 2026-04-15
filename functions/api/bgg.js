// /api/bgg — Cloudflare Pages Function
// Proxies requests to BGG XMLAPI2 and forwards actionable plain-text errors.
//
// API contract: GET /api/bgg?url=https://boardgamegeek.com/xmlapi2/...
// Returns: raw XML from BGG, or 4xx/5xx with plain-text error body.

const ALLOWED_PREFIX = 'https://boardgamegeek.com/xmlapi2/';

// BGG now requires a registered application token. Keep the contact address
// for auditability, but attach Authorization when configured in Cloudflare.
const BGG_HEADERS = {
  'User-Agent': 'NOFNWAY-King-Navigator/1.0 (contact: admin@nofnway.ca)',
  'Accept': 'application/xml',
  'Referer': 'https://lab.nofnway.ca/'
};

// Retry queued requests a few times, but do not assume timer APIs exist in
// every Worker runtime.
const BACKOFF = [2000, 3000, 5000];
const MAX_ATTEMPTS = BACKOFF.length;

// Minimum valid XML body length. BGG occasionally returns HTTP 200 with
// an empty or near-empty body on overloaded nodes. Anything under this
// is treated as a failed response and retried.
const MIN_BODY_LENGTH = 50;
const RATE_LIMIT_CAPACITY = 5;
const RATE_LIMIT_REFILL_MS = 2000;
const RATE_LIMIT_TTL_MS = 10 * 60 * 1000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*'
};

const rateLimitBuckets = new Map();

function errorResponse(status, message) {
  return new Response(message, {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain' }
  });
}

async function sleep(ms) {
  if (typeof scheduler !== 'undefined' && typeof scheduler.wait === 'function') {
    await scheduler.wait(ms);
    return;
  }
  if (typeof setTimeout === 'function') {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

function getClientIp(request) {
  const forwarded = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
  const ip = forwarded.split(',')[0].trim();
  return ip || 'unknown';
}

function takeRateLimitToken(ip) {
  const now = Date.now();

  for (const [key, bucket] of rateLimitBuckets) {
    if (now - bucket.updatedAt > RATE_LIMIT_TTL_MS) rateLimitBuckets.delete(key);
  }

  const bucket = rateLimitBuckets.get(ip) || {
    tokens: RATE_LIMIT_CAPACITY,
    updatedAt: now
  };

  const elapsed = now - bucket.updatedAt;
  const refillTokens = Math.floor(elapsed / RATE_LIMIT_REFILL_MS);
  if (refillTokens > 0) {
    bucket.tokens = Math.min(RATE_LIMIT_CAPACITY, bucket.tokens + refillTokens);
    bucket.updatedAt += refillTokens * RATE_LIMIT_REFILL_MS;
  }

  if (bucket.tokens < 1) {
    rateLimitBuckets.set(ip, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((RATE_LIMIT_REFILL_MS - (now - bucket.updatedAt)) / 1000))
    };
  }

  bucket.tokens -= 1;
  bucket.updatedAt = now;
  rateLimitBuckets.set(ip, bucket);

  return {
    allowed: true,
    remaining: bucket.tokens
  };
}

export async function onRequest(context) {
  // Validate request URL is parseable before touching searchParams.
  let requestUrl;
  try {
    requestUrl = new URL(context.request.url);
  } catch (_) {
    return errorResponse(400, 'Malformed request URL');
  }

  const clientIp = getClientIp(context.request);
  const rateLimit = takeRateLimitToken(clientIp);
  if (!rateLimit.allowed) {
    return new Response('Too many BGG requests. Wait a moment and try again.', {
      status: 429,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/plain',
        'Retry-After': String(rateLimit.retryAfterSeconds)
      }
    });
  }

  const target = requestUrl.searchParams.get('url');
  const token = context.env?.BGG_API_TOKEN?.trim();

  // Step 8 — Input validation
  if (!target) {
    return errorResponse(400, 'Missing url parameter');
  }

  // Reject non-BGG or non-XMLAPI2 URLs to prevent open-proxy abuse.
  if (!target.startsWith(ALLOWED_PREFIX)) {
    return errorResponse(400, 'url must start with ' + ALLOWED_PREFIX);
  }

  // Confirm the target is itself a valid URL (catches truncated or
  // malformed values that pass the prefix check).
  try {
    new URL(target);
  } catch (_) {
    return errorResponse(400, 'Malformed target URL');
  }

  if (!token) {
    return errorResponse(
      503,
      'Live BGG lookup is not configured. Add BGG_API_TOKEN to the Cloudflare Pages environment for NOFNWAY Lab.'
    );
  }

  console.log('[bgg] target:', target);

  // Step 3 — Retry loop with exponential backoff.
  // Retries on: 202 (BGG queue), empty body, fetch throws.
  // Does NOT retry hard errors (4xx from BGG — those are deterministic).
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    console.log('[bgg] attempt:', attempt + 1, 'of', MAX_ATTEMPTS);

    let res;
    try {
      const headers = new Headers(BGG_HEADERS);
      headers.set('Authorization', `Bearer ${token}`);

      res = await fetch(target, {
        headers,
        cf: { cacheEverything: true, cacheTtl: 300 }
      });
    } catch (err) {
      console.log('[bgg] fetch threw on attempt', attempt + 1, ':', err.message);
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(BACKOFF[attempt]);
        continue;
      }
      return errorResponse(502, 'BGG request failed before a response came back.');
    }

    console.log('[bgg] response status:', res.status, 'attempt:', attempt + 1);

    if (res.status === 202) {
      if (attempt < MAX_ATTEMPTS - 1) {
        console.log('[bgg] 202 received, waiting', BACKOFF[attempt], 'ms before retry');
        await sleep(BACKOFF[attempt]);
        continue;
      }
      return errorResponse(503, 'BGG queued the request for too long. Try again in a moment.');
    }

    if (!res.ok) {
      const upstreamText = (await res.text()).trim();
      console.log('[bgg] BGG hard error:', res.status, res.statusText, upstreamText);
      if (res.status === 401) {
        return errorResponse(
          502,
          'BGG rejected the request. Confirm the NOFNWAY Lab application is approved and BGG_API_TOKEN is a valid Bearer token.'
        );
      }
      if (res.status === 429) {
        return errorResponse(503, 'BGG rate-limited the request. Wait a moment and try again.');
      }
      return errorResponse(502, upstreamText || `BGG returned ${res.status} ${res.statusText}.`);
    }

    // Step 4 — Empty body guard.
    // BGG occasionally returns HTTP 200 with an empty or malformed body
    // on overloaded nodes. Detect and retry rather than forwarding silence.
    const body = await res.text();
    if (!body || body.length < MIN_BODY_LENGTH) {
      console.log('[bgg] empty/short body detected (length:', body.length, ') on attempt', attempt + 1);
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(BACKOFF[attempt]);
        continue;
      }
      return errorResponse(502, 'BGG returned an empty response.');
    }

    console.log('[bgg] success on attempt', attempt + 1, '— body length:', body.length);

    return new Response(body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/xml; charset=utf-8',
        // 5-minute browser cache on top of CF edge cache.
        'Cache-Control': 'public, max-age=300'
      }
    });
  }

  // Fallthrough (should not be reachable, but Workers require a return).
  return errorResponse(502, 'BGG Origin Error');
}
