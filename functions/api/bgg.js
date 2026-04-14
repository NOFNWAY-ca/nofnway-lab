// /api/bgg — Cloudflare Pages Function
// Proxies requests to BGG XMLAPI2, handling BGG's quirky 202 queuing,
// empty 200 bodies, connection resets, and exponential backoff.
//
// API contract: GET /api/bgg?url=https://boardgamegeek.com/xmlapi2/...
// Returns: raw XML from BGG, or 4xx/502 with plain-text error body.

const ALLOWED_PREFIX = 'https://boardgamegeek.com/xmlapi2/';

// BGG responds better to identified traffic with a contact address.
const BGG_HEADERS = {
  'User-Agent': 'NOFNWAY-King-Navigator/1.0 (contact: admin@nofnway.ca)',
  'Accept': 'application/xml',
  'Referer': 'https://lab.nofnway.ca/'
};

// Exponential backoff delays per attempt (ms).
// BGG 202 processing typically resolves within 2–5 seconds.
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

  console.log('[bgg] target:', target);

  // Step 3 — Retry loop with exponential backoff.
  // Retries on: 202 (BGG queue), empty body, fetch throws.
  // Does NOT retry hard errors (4xx from BGG — those are deterministic).
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    console.log('[bgg] attempt:', attempt + 1, 'of', MAX_ATTEMPTS);

    let res;
    try {
      // 25s timeout inside the Worker so BGG slowness produces a handled
      // error and a retry, rather than Cloudflare killing the whole Worker
      // and emitting a raw 502 with no body.
      res = await fetch(target, {
        headers: BGG_HEADERS,
        signal: AbortSignal.timeout(25000),
        cf: { cacheEverything: true, cacheTtl: 300 }
      });
    } catch (err) {
      // Network-level failure (connection reset, DNS, timeout).
      // These are retryable — BGG connections drop intermittently.
      console.log('[bgg] fetch threw on attempt', attempt + 1, ':', err.message);
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise(r => setTimeout(r, BACKOFF[attempt]));
        continue;
      }
      return errorResponse(502, 'BGG Origin Error');
    }

    console.log('[bgg] response status:', res.status, 'attempt:', attempt + 1);

    // Step 3 — BGG 202: "request queued, try again shortly."
    // This is normal for popular or complex searches. Wait and retry.
    if (res.status === 202) {
      if (attempt < MAX_ATTEMPTS - 1) {
        console.log('[bgg] 202 received, waiting', BACKOFF[attempt], 'ms before retry');
        await new Promise(r => setTimeout(r, BACKOFF[attempt]));
        continue;
      }
      console.log('[bgg] 202 on final attempt — giving up');
      return errorResponse(502, 'BGG Origin Error');
    }

    // Hard errors from BGG (4xx, 5xx other than 202) are not retried.
    // A 429 or 403 from BGG won't improve with retrying.
    if (!res.ok) {
      console.log('[bgg] BGG hard error:', res.status, res.statusText);
      return errorResponse(502, 'BGG Origin Error');
    }

    // Step 4 — Empty body guard.
    // BGG occasionally returns HTTP 200 with an empty or malformed body
    // on overloaded nodes. Detect and retry rather than forwarding silence.
    const body = await res.text();
    if (!body || body.length < MIN_BODY_LENGTH) {
      console.log('[bgg] empty/short body detected (length:', body.length, ') on attempt', attempt + 1);
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise(r => setTimeout(r, BACKOFF[attempt]));
        continue;
      }
      return errorResponse(502, 'BGG Origin Error');
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
