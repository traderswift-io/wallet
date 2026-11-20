const cachePrefix = 'traderswift-wallet:' + self.registration.scope + ':';
const cacheName = cachePrefix + '8d8c3b07ade047c4';
const assets = [{"name":"app.1055f3c94bb1e0b9.css","integrity":"sha256-EFXzyUux4LkPBSwFwQXb4qVRarC+ulnP1a4Lkdh766E="},{"name":"app.dabbacdc25410044.js","integrity":"sha256-2rus3CVBAEREpA5X01u0WrnlflUsYF3z1/a+TO5scX0="},{"name":"approval.html","integrity":"sha256-0iIaa4zqNLIKEHCqshTvuJ3LrZwYP0tN0Q+lh6sgFjc="},{"name":"charts.html","integrity":"sha256-d0c56fiHpWDKlSF6sQVvWJnrD9MiQmcaR0Or7Y+CncM="},{"name":"frame-guard.4831d1f5ddee1642.js","integrity":"sha256-SDHR9d3uFkIbovCyOY0tVZxZxyp4+VUDyLY3PaFtxhA="},{"name":"icon-192.png","integrity":"sha256-UjKT4JSgUFWNkhVosUoxMjxlMCfD20QD76rAmICwMiI="},{"name":"icon-512.png","integrity":"sha256-qp9GAptW3f3nwNnpXhgJztoD5usxCf2oAGuCQwI3UhA="},{"name":"icon.svg","integrity":"sha256-Czex5xd2UE37z7/+F8FrG30Q64L9KjTiAcHiahhkoqU="},{"name":"index.html","integrity":"sha256-xbNUoRQoK0grVWefyFFhdyJJhZtCoQXxB13vWZlT58s="},{"name":"manifest.webmanifest","integrity":"sha256-thim4d9MhhMF9BtUTXiTPImbfRDuSH9lNPFg7xHNf6Y="},{"name":"signals.html","integrity":"sha256-ZYBOJHxCh2/qBA6TMwdD78uVLbvOV2N6nYTbbI4ZSas="},{"name":"solve.html","integrity":"sha256-aZBBvNnN616X1v9/3ppjiaDbDJI/29rwq5rBqk3+Z5I="}];
const assetUrls = new Map(assets.map(asset => [new URL(asset.name, self.registration.scope).href, asset]));
async function verified(response, asset) {
  if (!response.ok || response.redirected || response.type === 'opaque') throw new Error('Offline asset unavailable');
  const bytes = await response.clone().arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  if ('sha256-' + btoa(String.fromCharCode(...digest)) !== asset.integrity) throw new Error('Offline asset integrity mismatch');
  return response;
}
async function download(url, asset) {
  return verified(await fetch(new Request(url, { cache: 'reload', redirect: 'error', integrity: asset.integrity })), asset);
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    for (const [url, asset] of assetUrls) await cache.put(url, await download(url, asset));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(cachePrefix) && name !== cacheName) await caches.delete(name);
    }
    await self.clients.claim();
    for (const client of await self.clients.matchAll({ type: 'window' })) {
      if (client.url.startsWith(self.registration.scope)) void client.navigate(client.url).catch(() => {});
    }
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.href === new URL('wallet-build-version', self.registration.scope).href) {
    event.respondWith(Promise.resolve(new Response('8d8c3b07ade047c4', { headers: { 'Cache-Control': 'no-store' } })));
    return;
  }
  if (url.href === self.registration.scope) url.pathname += 'index.html';
  const asset = assetUrls.get(url.href);
  if (!asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(url.href);
    return cached ? verified(cached, asset) : download(url.href, asset);
  })());
});
