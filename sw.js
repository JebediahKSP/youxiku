const CACHE_NAME = 'game-hub-cache';
const ASSETS = [
  '/', '/index.html', '/404.html', '/manifest.json',
  '/pages/mods.html', '/pages/game.html', '/admin.html',
  '/css/common.css', '/css/home.css', '/css/game.css',
  '/js/common.js', '/js/home.js', '/js/game.js',
  '/data/games.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  // 核心逻辑：网络优先。只要联网，永远拿最新代码。
  e.respondWith(
    fetch(e.request).then(response => {
      if (!response || response.status !== 200 || response.type !== 'basic') return response;
      var resClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
      return response;
    }).catch(() => caches.match(e.request))
  );
});