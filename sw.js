/* =========================================================================
   YUROSO HAIR SALON | 통합 KPI & CRM 모바일 앱 Service Worker (PWA)
   ========================================================================= */
const CACHE_NAME = 'yuroso-hair-pwa-v15';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-64.png'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_ASSETS).catch(function() {});
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Supabase 등 외부 API 통신은 항상 실시간 네트워크 요청 유지
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/')) {
    return;
  }

  // 페이지 네비게이션 및 주요 정적 파일은 Network-First 후 오프라인 시 캐시 폴백
  if (req.mode === 'navigate' || url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then(function(networkRes) {
          if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(req, resClone);
            });
          }
          return networkRes;
        })
        .catch(function() {
          return caches.match(req).then(function(cachedRes) {
            if (cachedRes) return cachedRes;
            if (req.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
        })
    );
  }
});
