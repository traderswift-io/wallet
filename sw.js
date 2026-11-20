const cachePrefix = 'traderswift-wallet:' + self.registration.scope + ':';
const cacheName = cachePrefix + '3e7993d970e896fe';
const assets = [{"name":"app.dac056a2eb11f874.css","integrity":"sha256-2sBWousR+HQdXqFy+PMfnN85sP+5z654Mg8IpljKiX8="},{"name":"app.fd7205e84e0e047a.js","integrity":"sha256-/XIF6E4OBHp+AKSjukuHSWGiSGqia/LbzJKNoJt/Bsc="},{"name":"approval.html","integrity":"sha256-zpvB/gQOX40OCI9AW1XQhyo3O0FpnPAwJ55CUDpjo/E="},{"name":"charts.html","integrity":"sha256-rQmH/HrvTUgiFW/gy0wktJxu6eVF+YPPVj5SG7t9eZQ="},{"name":"frame-guard.4831d1f5ddee1642.js","integrity":"sha256-SDHR9d3uFkIbovCyOY0tVZxZxyp4+VUDyLY3PaFtxhA="},{"name":"icon-192.png","integrity":"sha256-UjKT4JSgUFWNkhVosUoxMjxlMCfD20QD76rAmICwMiI="},{"name":"icon-512.png","integrity":"sha256-qp9GAptW3f3nwNnpXhgJztoD5usxCf2oAGuCQwI3UhA="},{"name":"icon.svg","integrity":"sha256-d2eRWj8OldZrikS3oA51rFjHA8aHls4kx8HNBp8+I5g="},{"name":"index.html","integrity":"sha256-sw8b39gmQitieE54ik0JbUV9EnrGJey+p0EdChmtcbg="},{"name":"manifest.webmanifest","integrity":"sha256-W3Lio0oTvCSK8/o222ins50VmDH/7r0iNJ1TNNmcNP4="},{"name":"signals.html","integrity":"sha256-MfKpQ87D0CYZ22xl5Rc7X6ZcdxnmQRQeh3PmnyMvInk="},{"name":"solve.html","integrity":"sha256-/zsoddT4/f+uCv94oFmrfhhU3/HHywUwfLclgoTEsCk="}];
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
    event.respondWith(Promise.resolve(new Response('3e7993d970e896fe', { headers: { 'Cache-Control': 'no-store' } })));
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
