const CACHE_NAME = 'mangaflip-v1.0.153';
const ASSETS = [
  './',
  './index.html',
  './mobile.html',
  './css/style.css',
  './css/mobile.css',
  './js/app.js',
  './js/mobile.js',
  './js/reading_guide.json',
  './js/reading_guide_tr.json',
  './js/core/eventManager.js',
  './js/core/imagePreloader.js',
  './js/core/readingGuideLoader.js',
  './js/core/readingState.js',
  './manifest.json',
  './logo.svg',
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Trim cache to prevent disk bloat (LRU Cache logic)
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      // Filter request keys that are manga page images
      const mangaImages = keys.filter(request => request.url.includes('/mangas/'));
      if (mangaImages.length > maxItems) {
        // Delete the oldest item
        cache.delete(mangaImages[0]).then(() => {
          trimCache(cacheName, maxItems);
        });
      }
    });
  });
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Dynamic json index files: Network First, fallback to Cache (Offline support)
  if (url.pathname.endsWith('mangas.json') || url.pathname.includes('reading_guide')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(e.request, { ignoreSearch: true });
        })
    );
    return;
  }
  
  // App Shell caching strategy: Cache First
  const isAppShell = ASSETS.some(asset => {
    if (asset.startsWith('http')) return e.request.url.startsWith(asset);
    const cleanAsset = asset.replace(/^\.\//, '');
    if (!cleanAsset) return false;
    return url.pathname.endsWith(cleanAsset);
  }) || url.pathname === '/';

  if (isAppShell) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(e.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // Manga images & dynamic pages: Network First, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If image or json, cache it for offline reading
        if (response.status === 200 && (url.pathname.includes('/mangas/') || url.pathname.endsWith('.json'))) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone).then(() => {
              // Limit the cached manga images to 200 items to prevent storage bloat
              if (url.pathname.includes('/mangas/')) {
                trimCache(CACHE_NAME, 200);
              }
            });
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request, { ignoreSearch: true });
      })
  );
});
