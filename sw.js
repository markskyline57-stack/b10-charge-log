/* B10 Charge Log — service worker
   เอกสารหลักใช้ network-first เพื่อให้ได้เวอร์ชันใหม่เสมอเมื่อมีเน็ต
   ไฟล์ static ใช้ cache-first เพื่อให้เปิดแอปได้แม้ไม่มีสัญญาณ */
const CACHE = 'b10-charge-v14';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './ev-scene.webp', './ev-scene.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // ไม่แคชการเรียก API ภายนอก (อากาศ / พิกัด / Google Sheet)
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }))
  );
});
