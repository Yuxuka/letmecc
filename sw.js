const cacheName = 'linkbox-v2';
const filesToCache = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(filesToCache)));
  self.skipWaiting();
});
self.addEventListener('activate', event => event.waitUntil(
  caches.keys()
    .then(names => Promise.all(names.filter(name => name !== cacheName).map(name => caches.delete(name))))
    .then(() => clients.claim())
));
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  // 分享進來的 ?url=… 不另外存快取，統一用同一個快取鍵
  const cacheKey = new Request(url.origin + url.pathname);
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && response.type === 'basic') {
          const responseCopy = response.clone();
          caches.open(cacheName).then(cache => cache.put(cacheKey, responseCopy));
        }
        return response;
      })
      .catch(() => caches.match(cacheKey).then(cachedResponse => cachedResponse || caches.match('./index.html')))
  );
});