// Cloudflare Pages Function — handles /api/alarm/:code
// GET  → read alarm data for this code
// POST → write alarm data for this code

export async function onRequestGet({ params, env }) {
    const code = params.code?.[0];
    if (!code) return json({ error: 'No code' }, 400);

    const data = await env.NOFNWAY_LAB.get(`alarm:${code}`, { type: 'json' });
    if (!data) return json({ error: 'Not found' }, 404);

    return json(data, 200);
}

export async function onRequestPost({ params, env, request }) {
    const code = params.code?.[0];
    if (!code) return json({ error: 'No code' }, 400);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

    const { time, label } = body;
    if (!time || typeof time !== 'string') return json({ error: 'time required' }, 400);

    // Validate time format HH:MM
    if (!/^\d{2}:\d{2}$/.test(time)) return json({ error: 'Invalid time format' }, 400);

    const label_safe = typeof label === 'string' ? label.slice(0, 64) : '';

    await env.NOFNWAY_LAB.put(`alarm:${code}`, JSON.stringify({
        time,
        label: label_safe,
        updated: Date.now(),
    }), { expirationTtl: 60 * 60 * 24 * 90 }); // 90 days

    return json({ ok: true }, 200);
}

function json(data, status) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
