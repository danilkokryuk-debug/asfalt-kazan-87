// Офлайн-кэш. При изменении файлов игры увеличивай VERSION, иначе телефон покажет старую версию.
const VERSION = 'asfalt-v0.4.0';
const FILES = ['./', 'index.html', 'css/style.css', 'js/map.js', 'js/sprite.js', 'js/audio.js', 'js/game.js', 'js/story.js', 'js/career.js', 'js/mini.js', 'js/world.js',
  'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Сначала сеть (свежая версия), без сети — кэш
self.addEventListener('fetch', e => e.respondWith(
  fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request))));
