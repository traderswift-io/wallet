const cachePrefix = 'traderswift-wallet:' + self.registration.scope + ':';
const cacheName = cachePrefix + 'f593098c6766573e';
const assets = [{"name":"app.23f83ed5ac07d68d.js","integrity":"sha256-I/g+1awH1o1h2fPOD6pNQVmhh5oQeS/ip2NuMpK044I="},{"name":"app.b8756bf597ef9782.css","integrity":"sha256-uHVr9Zfvl4L2ps8dQSY+LYuIW7Cr/T+cZXg5psYeEqs="},{"name":"approval.html","integrity":"sha256-rc1TjEbmRRwz0wqgRGvINFlBChuqET9DVywawz/3If0="},{"name":"charts.html","integrity":"sha256-Y5ccWJnQFYJZT9pYEJv6Nie7b9bgwsCY/HcqxmMrYa8="},{"name":"frame-guard.4831d1f5ddee1642.js","integrity":"sha256-SDHR9d3uFkIbovCyOY0tVZxZxyp4+VUDyLY3PaFtxhA="},{"name":"icon-192.png","integrity":"sha256-UjKT4JSgUFWNkhVosUoxMjxlMCfD20QD76rAmICwMiI="},{"name":"icon-512.png","integrity":"sha256-qp9GAptW3f3nwNnpXhgJztoD5usxCf2oAGuCQwI3UhA="},{"name":"icon.svg","integrity":"sha256-Czex5xd2UE37z7/+F8FrG30Q64L9KjTiAcHiahhkoqU="},{"name":"index.html","integrity":"sha256-j+sVjW1eNz6O3Wg1gSA8U1EcQj+yZDHz/NDWV39eG24="},{"name":"manifest.webmanifest","integrity":"sha256-thim4d9MhhMF9BtUTXiTPImbfRDuSH9lNPFg7xHNf6Y="},{"name":"signals.html","integrity":"sha256-EmC28QaliTl7klEjdGewsDpRZXyvPvhdxSTMiYWmfgI="},{"name":"solve.html","integrity":"sha256-D9+Ps2Ef7uIE/l9MU8D6Cg9jxJ8WuCF6R4zALrf9im8="}];
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
    event.respondWith(Promise.resolve(new Response('f593098c6766573e', { headers: { 'Cache-Control': 'no-store' } })));
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
