// Shhhhh... service worker
// Handles push notifications and keeps the alarm code for background fetches

const CACHE = 'shhhhh-meta-v1';

// ── Store the alarm code sent from the page ──────────────────────────────────
self.addEventListener('message', event => {
    if (event.data?.type === 'SET_CODE') {
        caches.open(CACHE).then(cache => {
            cache.put('/sw-code', new Response(event.data.code));
        });
    }
});

// ── Handle incoming push ──────────────────────────────────────────────────────
self.addEventListener('push', event => {
    event.waitUntil(handlePush());
});

async function handlePush() {
    let title = '⏰ Alarm';
    let body  = 'Your alarm is going off.';
    let url   = '/alarm';

    try {
        const cache = await caches.open(CACHE);
        const stored = await cache.match('/sw-code');
        if (stored) {
            const code = await stored.text();
            url = `/alarm?code=${code}`;
            const res = await fetch(`/api/alarm/${code}`);
            if (res.ok) {
                const data = await res.json();
                if (data.label) body = data.label;
            }
        }
    } catch (e) {}

    return self.registration.showNotification(title, {
        body,
        icon:      '/favicon.svg',
        badge:     '/favicon.svg',
        tag:       'alarm',
        renotify:  true,
        vibrate:   [300, 100, 300, 100, 300],
        data:      { url },
    });
}

// ── Tap notification → open / focus the alarm page ───────────────────────────
self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = event.notification.data?.url || '/alarm';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if (client.url.includes('/alarm') && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
