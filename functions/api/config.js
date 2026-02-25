// Serves the VAPID public key to the client so it can subscribe to push
export async function onRequestGet({ env }) {
    return new Response(JSON.stringify({
        vapidPublicKey: env.VAPID_PUBLIC_KEY || null,
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
