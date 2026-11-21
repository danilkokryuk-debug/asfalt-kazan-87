// Офлайн-кэш. При изменении файлов игры увеличивай VERSION, иначе телефон покажет старую версию.
const VERSION = 'asfalt-v1.1.0';
const FILES = ['./', 'index.html', 'css/style.css', 'js/map.js', 'js/citymap.js', 'js/sprite.js', 'js/audio.js', 'js/game.js', 'js/story.js', 'js/career.js', 'js/mini.js', 'js/world.js', 'js/economy.js', 'js/mechanics.js', 'js/atmos.js', 'js/story2.js', 'js/street.js', 'js/settings.js', 'js/scenes.js', 'js/menu.js', 'js/time.js', 'js/places.js', 'js/stats.js', 'js/ranks.js', 'js/fame.js', 'js/slang.js', 'js/natasha.js', 'js/special.js', 'js/vehicles.js', 'js/business.js', 'js/social.js', 'js/arcs.js', 'js/calendar.js', 'js/goals.js', 'js/story3.js', 'js/prison.js', 'js/eggs.js', 'js/songs.js',
  ...['kazan', 'chase', 'vokzal', 'kuhnya', 'pustyr', 'korobka', 'zona', 'dvor', 'pl_dk', 'pl_video', 'pl_hosp', 'pl_police',
    'pl_sto', 'pl_bank', 'pl_barber', 'pl_bar', 'pl_resto', 'pl_rynok',
    ...'dvor noch ostanovka garazhi korobka kuhnya shkola pustyr gazeta'.split(' ').map(n => 'bg_' + n),
    ...'mama ildar bacha natasha garipov sedoy zima starsh zavuch chuzhoy'.split(' ').map(n => 'p_' + n)].map(n => `img/${n}.jpg`),
  'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Сначала сеть (свежая версия), без сети — кэш
self.addEventListener('fetch', e => new URL(e.request.url).origin === location.origin && e.respondWith(
  fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request))));
