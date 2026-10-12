/* Shani Traders app — offline support.
   App files: shown from the phone at once, refreshed in the background.
   Photos: downloaded once and kept on the phone. */
const APP = 'st-app-v3.2', IMG = 'st-img-v1', FONT = 'st-font-v1', MAX_IMG = 600;
const SHELL = ['app.html', 'index.html', 'app.css', 'app.js', 'i18n.js', 'config.js', 'manifest.webmanifest',
  'images/mark.png', 'images/logo.png', 'images/icon-192.png', 'images/favicon.png', 'images/owner.jpg'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's own cache, so a new version is really new
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // Only remove this app's old caches (ST Admin on the same site keeps its own)
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('st-') && ![APP, IMG, FONT].includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function trimImages() {
  const c = await caches.open(IMG), keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_IMG; i++) await c.delete(keys[i]);
}
async function cacheFirst(req, name) {
  const c = await caches.open(name);
  const hit = await c.match(req, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') c.put(req, res.clone()).then(() => name === IMG && trimImages()).catch(() => { });
  return res;
}
async function staleWhileRevalidate(req) {
  const c = await caches.open(APP);
  const hit = await c.match(req, { ignoreSearch: req.mode === 'navigate' });
  // Ask GitHub whether the file changed (cheap check), and keep the fresh copy for next time
  const net = (req.mode === 'navigate' ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req, { cache: 'no-cache' }))
    .then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || (req.mode === 'navigate' ? c.match('app.html') : Response.error());
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com') && url.pathname.startsWith('/macros')) return;
  if (url.hostname === 'commons.wikimedia.org') return;
  if (url.pathname.endsWith('/version.json')) return;   // always ask GitHub for the newest version number
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') { e.respondWith(cacheFirst(req, FONT)); return; }
  if (req.destination === 'image' || /\.(jpe?g|png|webp|gif|svg)$/i.test(url.pathname) || url.hostname === 'lh3.googleusercontent.com') {
    e.respondWith(cacheFirst(req, IMG).catch(() => Response.error())); return;
  }
  if (url.origin === location.origin) e.respondWith(staleWhileRevalidate(req));
});

/* The app sends the list of all product photos; download the missing ones quietly */
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'skip') { self.skipWaiting(); return; }
  if (!e.data || e.data.type !== 'warm') return;
  e.waitUntil((async () => {
    const c = await caches.open(IMG);
    for (const u of (e.data.urls || []).slice(0, MAX_IMG)) {
      const req = new Request(new URL(u, self.registration.scope).href, { mode: /^https?:/.test(u) && !u.startsWith(self.registration.scope) ? 'no-cors' : 'same-origin' });
      if (await c.match(req, { ignoreVary: true })) continue;
      try { const res = await fetch(req); if (res.ok || res.type === 'opaque') await c.put(req, res); } catch (err) { /* try again next time */ }
    }
  })());
});
