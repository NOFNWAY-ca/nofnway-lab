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

// Retry transient upstream failures with exponential backoff, but do not
// assume timer APIs exist in every Worker runtime.
const RETRY_BACKOFF = [1000, 2000, 4000];
const MAX_RETRIES = RETRY_BACKOFF.length;
const FETCH_TIMEOUT_MS = 30000;

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
const inFlightRequests = new Map();

function buildSuccessHeaders() {
  return {
    ...CORS_HEADERS,
    'Content-Type': 'text/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=604800'
  };
}

function errorResponse(status, message) {
  return new Response(message, {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain' }
  });
}

function logRequestStart(url) {
  console.log(JSON.stringify({
    type: 'bgg_request_start',
    url
  }));
}

function logRequest(url, cache, duration, status, error) {
  const payload = {
    type: 'bgg_request',
    url,
    cache,
    duration_ms: duration,
    status
  };
  if (error) payload.error = error;
  console.log(JSON.stringify(payload));
}

function logError(url, cache, duration, status, error) {
  console.log(JSON.stringify({
    type: 'bgg_error',
    url,
    cache,
    duration_ms: duration,
    status,
    error
  }));
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
  const ip = (request.headers.get('CF-Connecting-IP') || '').trim();
  return ip || 'unknown';
}

function isAbortError(err) {
  return err?.name === 'AbortError';
}

function shouldRetryStatus(status) {
  return status === 500 || status === 503;
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

async function fetchBGGWithRetry(target, token, requestedUrl) {
  // Retries on upstream 202/500/503 and network errors.
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res;
    const fetchStartedAt = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const headers = new Headers(BGG_HEADERS);
      headers.set('Authorization', `Bearer ${token}`);

      res = await fetch(target, {
        headers,
        signal: controller.signal,
        cf: { cacheEverything: true, cacheTtl: 300 }
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const duration = Date.now() - fetchStartedAt;
      if (isAbortError(err)) {
        logError(requestedUrl, 'miss', duration, 504, 'BGG request timed out');
        return errorResponse(504, 'BGG request timed out.');
      }
      if (attempt < MAX_RETRIES) {
        logError(requestedUrl, 'miss', duration, 502, `Fetch failed on attempt ${attempt + 1}: ${err.message}`);
        await sleep(RETRY_BACKOFF[attempt]);
        continue;
      }
      logError(requestedUrl, 'miss', duration, 502, `Fetch failed after retries: ${err.message}`);
      return errorResponse(502, 'BGG temporarily unavailable.');
    }
    clearTimeout(timeoutId);
    const duration = Date.now() - fetchStartedAt;
    logRequest(requestedUrl, 'miss', duration, res.status);

    if (res.status === 202) {
      logError(requestedUrl, 'miss', duration, 202, `BGG request still processing on attempt ${attempt + 1}`);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BACKOFF[attempt]);
        continue;
      }
      return errorResponse(503, 'BGG request is still processing.');
    }

    if (!res.ok) {
      const upstreamText = (await res.text()).trim();
      logError(requestedUrl, 'miss', duration, res.status, upstreamText || res.statusText);
      if (shouldRetryStatus(res.status)) {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_BACKOFF[attempt]);
          continue;
        }
        return errorResponse(502, 'BGG temporarily unavailable.');
      }
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
    // on overloaded nodes. Forward a clear failure rather than silence.
    const body = await res.text();
    if (!body || body.length < MIN_BODY_LENGTH) {
      logError(requestedUrl, 'miss', duration, 502, 'BGG returned an empty response');
      return errorResponse(502, 'BGG returned an empty response.');
    }

    const response = new Response(body, {
      status: 200,
      headers: buildSuccessHeaders()
    });

    logRequest(requestedUrl, 'miss', duration, response.status);
    return response;
  }

  logError(requestedUrl, 'miss', 0, 502, 'BGG Origin Error');
  return errorResponse(502, 'BGG Origin Error');
}

export async function onRequest(context) {
  const requestStartedAt = Date.now();

  // Validate request URL is parseable before touching searchParams.
  let requestUrl;
  try {
    requestUrl = new URL(context.request.url);
  } catch (_) {
    logError(context.request.url, 'miss', Date.now() - requestStartedAt, 400, 'Malformed request URL');
    return errorResponse(400, 'Malformed request URL');
  }

  const clientIp = getClientIp(context.request);
  const rateLimit = takeRateLimitToken(clientIp);
  if (!rateLimit.allowed) {
    logRequest(requestUrl.toString(), 'miss', Date.now() - requestStartedAt, 429, 'Rate limit exceeded');
    return new Response('Rate limit exceeded. Please wait.', {
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
  const requestedUrl = target || requestUrl.toString();

  logRequestStart(requestedUrl);

  // Step 8 — Input validation
  if (!target) {
    logError(requestedUrl, 'miss', Date.now() - requestStartedAt, 400, 'Missing url parameter');
    return errorResponse(400, 'Missing url parameter');
  }

  // Reject non-BGG or non-XMLAPI2 URLs to prevent open-proxy abuse.
  if (!target.startsWith(ALLOWED_PREFIX)) {
    logError(requestedUrl, 'miss', Date.now() - requestStartedAt, 400, 'Target URL failed allowlist validation');
    return errorResponse(400, 'url must start with ' + ALLOWED_PREFIX);
  }

  // Confirm the target is itself a valid URL (catches truncated or
  // malformed values that pass the prefix check).
  try {
    new URL(target);
  } catch (_) {
    logError(requestedUrl, 'miss', Date.now() - requestStartedAt, 400, 'Malformed target URL');
    return errorResponse(400, 'Malformed target URL');
  }

  const cacheKey = new Request(context.request.url, { method: 'GET' });
  const canUseCache = !context.request.headers.has('Authorization');
  if (canUseCache) {
    const cachedResponse = await caches.default.match(cacheKey);
    if (cachedResponse) {
      logRequest(requestedUrl, 'hit', Date.now() - requestStartedAt, cachedResponse.status);
      return cachedResponse;
    }
  }

  logRequest(requestedUrl, 'miss', Date.now() - requestStartedAt, 0);

  if (!token) {
    logError(requestedUrl, 'miss', Date.now() - requestStartedAt, 503, 'BGG API token not configured');
    return errorResponse(
      503,
      'Live BGG lookup is not configured. Add BGG_API_TOKEN to the Cloudflare Pages environment for NOFNWAY Lab.'
    );
  }

  const coalesceKey = context.request.url;
  let inFlight = inFlightRequests.get(coalesceKey);

  if (!inFlight) {
    inFlight = (async () => {
      const response = await fetchBGGWithRetry(target, token, requestedUrl);

      if (canUseCache && response.status === 200) {
        await caches.default.put(cacheKey, response.clone());
      }

      return response;
    })();

    inFlightRequests.set(coalesceKey, inFlight);
    inFlight.finally(() => {
      if (inFlightRequests.get(coalesceKey) === inFlight) {
        inFlightRequests.delete(coalesceKey);
      }
    });
  }

  const sharedResponse = await inFlight;
  return sharedResponse.clone();
}
