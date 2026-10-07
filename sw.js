/* ঘুরে দেখা বাংলাদেশ - service worker.
   Only page navigations are handled: network first, and the small offline page when there is no connection.
   Scripts, images, data and API calls are not intercepted at all, so nothing on the site can go stale.
   Push: the admin's own devices get a notification for each new local seller and each report (api/_push.js);
   tapping it opens /admin on the products tab.
   To ship a new offline page or icons, bump VERSION. */
const VERSION = 'v1';
const CACHE = 'gd-offline-' + VERSION;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('gd-') && k !== CACHE).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (e) {} }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode !== 'navigate' || req.method !== 'GET') return; // everything else: straight to the network
  event.respondWith((async () => {
    try {
      const preloaded = await event.preloadResponse;
      if (preloaded) return preloaded;
      return await fetch(req);
    } catch (err) {
      const cache = await caches.open(CACHE);
      const offline = await cache.match(OFFLINE_URL);
      return offline || new Response('ইন্টারনেট সংযোগ নেই। সংযোগ ফিরলে আবার চেষ্টা করুন।', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
  })());
});

self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.title || 'ঘুরে দেখা বাংলাদেশ', {
    body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png', tag: d.tag || undefined, data: { url: d.url || '/admin#shops' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/admin#shops';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if (new URL(c.url).pathname === '/admin' && 'focus' in c) { try { await c.navigate(url); } catch (e) {} return c.focus(); } }
    return self.clients.openWindow(url);
  })());
});
