/* ============================================================
SERVICE WORKER — 名古屋親子旅行 App
版本號更新時，舊快取自動清除
============================================================ */
const CACHE_NAME = ‘nagoya-trip-v1’;

/* 離線時優先快取的資源 */
const PRECACHE_URLS = [
‘./’,
‘./index.html’,
‘./manifest.webmanifest’,
];

/* 外部 CDN 資源（選擇性快取） */
const CDN_PATTERNS = [
‘fonts.googleapis.com’,
‘fonts.gstatic.com’,
‘cdnjs.cloudflare.com’,
‘cdn.tailwindcss.com’,
];

/* ============================================================
Install — 預快取本地資源
============================================================ */
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => {
return cache.addAll(PRECACHE_URLS).catch(() => {
// 若部分資源快取失敗，不阻止 SW 安裝
});
}).then(() => self.skipWaiting())
);
});

/* ============================================================
Activate — 清除舊快取
============================================================ */
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(
keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
)
).then(() => self.clients.claim())
);
});

/* ============================================================
Fetch — 網路優先，失敗回 Cache
============================================================ */
self.addEventListener(‘fetch’, event => {
const url = new URL(event.request.url);

// 跳過非 GET / POST 以外的請求
if (event.request.method !== ‘GET’) return;

// CDN 資源：快取優先（Cache First）
const isCDN = CDN_PATTERNS.some(p => url.hostname.includes(p));
if (isCDN) {
event.respondWith(
caches.match(event.request).then(cached => {
if (cached) return cached;
return fetch(event.request).then(response => {
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
}
return response;
}).catch(() => cached);
})
);
return;
}

// 本地資源：網路優先，失敗回 Cache（Network First）
event.respondWith(
fetch(event.request).then(response => {
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
}
return response;
}).catch(() =>
caches.match(event.request).then(cached =>
cached || caches.match(’./index.html’)
)
)
);
});