const cachePrefix = 'traderswift-wallet:' + self.registration.scope + ':';
const cacheName = cachePrefix + '0f21738fa35d6f23';
const assets = [{"name":"app.34bd062939d44ed6.js","integrity":"sha256-NL0GKTnUTtZ4FmXQ4vmOI2F0GO3W5cfY82x3EymlvGs="},{"name":"app.7d2a49d4abadaef3.css","integrity":"sha256-fSpJ1KutrvOeBYSHWY/QcFmVQ3rJW6gPSKDz2frZ+/Q="},{"name":"approval.html","integrity":"sha256-g9carmA1gVaErcNiYOOfLaYlcLcBsNx6s1vCutdGcJw="},{"name":"charts.html","integrity":"sha256-1h3RYbXEWBM0zaMlzxLQzVKNfCOscIWzeittEsimioQ="},{"name":"frame-guard.4831d1f5ddee1642.js","integrity":"sha256-SDHR9d3uFkIbovCyOY0tVZxZxyp4+VUDyLY3PaFtxhA="},{"name":"icon-192.png","integrity":"sha256-UjKT4JSgUFWNkhVosUoxMjxlMCfD20QD76rAmICwMiI="},{"name":"icon-512.png","integrity":"sha256-qp9GAptW3f3nwNnpXhgJztoD5usxCf2oAGuCQwI3UhA="},{"name":"icon.svg","integrity":"sha256-d2eRWj8OldZrikS3oA51rFjHA8aHls4kx8HNBp8+I5g="},{"name":"index.html","integrity":"sha256-lb1gjB235P1WVtHjqVY+E9ZMejOMRR/RAbJXbOK34KI="},{"name":"manifest.webmanifest","integrity":"sha256-W3Lio0oTvCSK8/o222ins50VmDH/7r0iNJ1TNNmcNP4="},{"name":"signals.html","integrity":"sha256-3ZOy8PcOGSupW0mLWO4FIa8M05/86nKk+Vmo5aHNzKY="},{"name":"solve.html","integrity":"sha256-az0NQoXwDWsSEr9MySPe7I5IsFb7nv+/ay/e/UV0d8I="}];
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
    event.respondWith(Promise.resolve(new Response('0f21738fa35d6f23', { headers: { 'Cache-Control': 'no-store' } })));
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
