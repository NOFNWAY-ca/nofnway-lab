// Cloudflare Pages Function — /api/alarm/:code[/:op]
//
// GET    /api/alarm/:code        → read alarm data
// POST   /api/alarm/:code        → write alarm data
// POST   /api/alarm/:code/sub    → store push subscription
// DELETE /api/alarm/:code/sub    → remove push subscription
// POST   /api/alarm/:code/push   → send Web Push to all subscribers

export async function onRequestGet({ params, env }) {
    const code = params.code?.[0];
    if (!code) return json({ error: 'No code' }, 400);

    const data = await env.NOFNWAY_LAB.get(`alarm:${code}`, { type: 'json' });
    if (!data) return json({ error: 'Not found' }, 404);
    return json(data, 200);
}

export async function onRequestPost({ params, env, request }) {
    const code = params.code?.[0];
    const op   = params.code?.[1];
    if (!code) return json({ error: 'No code' }, 400);

    if (op === 'sub')  return handleSubscribe(code, env, request);
    if (op === 'push') return handlePush(code, env);

    // Default: save alarm time
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

    const { time, label } = body;
    if (!time || typeof time !== 'string') return json({ error: 'time required' }, 400);
    if (!/^\d{2}:\d{2}$/.test(time))       return json({ error: 'Invalid time format' }, 400);

    const label_safe = typeof label === 'string' ? label.slice(0, 64) : '';

    await env.NOFNWAY_LAB.put(`alarm:${code}`, JSON.stringify({
        time, label: label_safe, updated: Date.now(),
    }), { expirationTtl: 60 * 60 * 24 * 90 });

    return json({ ok: true }, 200);
}

export async function onRequestDelete({ params, env, request }) {
    const code = params.code?.[0];
    const op   = params.code?.[1];
    if (!code || op !== 'sub') return json({ error: 'Not found' }, 404);
    return handleUnsubscribe(code, env, request);
}

// ── Subscription storage ──────────────────────────────────────────────────────

async function handleSubscribe(code, env, request) {
    let sub;
    try { sub = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
    if (!sub?.endpoint) return json({ error: 'Invalid subscription' }, 400);

    const key      = `alarm-subs:${code}`;
    const existing = await env.NOFNWAY_LAB.get(key, { type: 'json' }) || [];

    // Replace any existing sub from the same endpoint, then add the new one
    const updated = existing.filter(s => s.endpoint !== sub.endpoint);
    updated.push({ endpoint: sub.endpoint, keys: sub.keys, created: Date.now() });

    await env.NOFNWAY_LAB.put(key, JSON.stringify(updated), { expirationTtl: 60 * 60 * 24 * 90 });
    return json({ ok: true }, 200);
}

async function handleUnsubscribe(code, env, request) {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
    if (!body?.endpoint) return json({ error: 'endpoint required' }, 400);

    const key      = `alarm-subs:${code}`;
    const existing = await env.NOFNWAY_LAB.get(key, { type: 'json' }) || [];
    const updated  = existing.filter(s => s.endpoint !== body.endpoint);

    await env.NOFNWAY_LAB.put(key, JSON.stringify(updated), { expirationTtl: 60 * 60 * 24 * 90 });
    return json({ ok: true }, 200);
}

// ── Push sender ───────────────────────────────────────────────────────────────

async function handlePush(code, env) {
    const publicKey    = env.VAPID_PUBLIC_KEY;
    const privateJwkStr = env.VAPID_PRIVATE_JWK;
    if (!publicKey || !privateJwkStr) return json({ error: 'Push not configured' }, 503);

    const subs = await env.NOFNWAY_LAB.get(`alarm-subs:${code}`, { type: 'json' }) || [];
    if (!subs.length) return json({ sent: 0 }, 200);

    let sent = 0;
    const dead = [];

    for (const sub of subs) {
        try {
            const res = await sendWebPush(sub, publicKey, privateJwkStr);
            if (res.status >= 200 && res.status < 300) {
                sent++;
            } else if (res.status === 404 || res.status === 410) {
                dead.push(sub.endpoint); // expired subscription
            }
        } catch (e) {}
    }

    // Clean up expired subscriptions
    if (dead.length) {
        const remaining = subs.filter(s => !dead.includes(s.endpoint));
        await env.NOFNWAY_LAB.put(`alarm-subs:${code}`, JSON.stringify(remaining), {
            expirationTtl: 60 * 60 * 24 * 90
        });
    }

    return json({ sent }, 200);
}

// ── VAPID / Web Push (no payload — service worker fetches alarm data itself) ──

async function sendWebPush(subscription, publicKeyB64, privateJwkStr) {
    const audience = new URL(subscription.endpoint).origin;
    const jwt      = await makeVapidJwt(audience, privateJwkStr);

    return fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
            'Authorization':  `vapid t=${jwt},k=${publicKeyB64}`,
            'TTL':            '60',
            'Content-Length': '0',
        },
    });
}

async function makeVapidJwt(audience, privateJwkStr) {
    const now = Math.floor(Date.now() / 1000);

    const header  = b64u(JSON.stringify({ alg: 'ES256', typ: 'JWT' }));
    const payload = b64u(JSON.stringify({ aud: audience, exp: now + 43200, sub: 'mailto:hi@nofnway.ca' }));
    const data    = `${header}.${payload}`;

    const key = await crypto.subtle.importKey(
        'jwk',
        JSON.parse(privateJwkStr),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    );

    const rawSig = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        new TextEncoder().encode(data)
    );

    return `${data}.${b64u(rawSig)}`;
}

// base64url encode — accepts string or ArrayBuffer
function b64u(input) {
    const bytes = typeof input === 'string'
        ? new TextEncoder().encode(input)
        : new Uint8Array(input);
    let s = '';
    bytes.forEach(b => s += String.fromCharCode(b));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data, status) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
