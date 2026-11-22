// Офлайн-кэш. При изменении файлов игры увеличивай VERSION, иначе телефон покажет старую версию.
const VERSION = 'asfalt-v1.11.0';
const FILES = ['./', 'index.html', 'css/style.css', 'js/map.js', 'js/citymap.js', 'js/sprite.js', 'js/audio.js', 'js/game.js', 'js/story.js', 'js/career.js', 'js/mini.js', 'js/world.js', 'js/economy.js', 'js/mechanics.js', 'js/atmos.js', 'js/story2.js', 'js/street.js', 'js/settings.js', 'js/scenes.js', 'js/menu.js', 'js/time.js', 'js/places.js', 'js/stats.js', 'js/ranks.js', 'js/fame.js', 'js/slang.js', 'js/natasha.js', 'js/special.js', 'js/vehicles.js', 'js/business.js', 'js/social.js', 'js/arcs.js', 'js/calendar.js', 'js/goals.js', 'js/story3.js', 'js/prison.js', 'js/eggs.js', 'js/nineties.js', 'js/family.js', 'js/cars.js', 'js/clans.js', 'js/epilog90.js', 'js/pager.js', 'js/brigade.js', 'js/people.js', 'js/strangers.js', 'js/body.js', 'js/livemap.js', 'js/fightfx.js', 'js/depth.js', 'js/shocks.js', 'js/case.js', 'js/brigstory.js', 'js/minis2.js', 'js/jobtune.js', 'js/exchange.js', 'js/status.js', 'js/cities.js', 'js/ladders.js', 'js/fate.js', 'js/moscow.js', 'js/shop.js', 'js/songs.js', 'js/accounts.js', 'js/android.js',
  ...['kazan', 'chase', 'vokzal', 'kuhnya', 'pustyr', 'korobka', 'zona', 'dvor', 'pl_dk', 'pl_video', 'pl_hosp', 'pl_police',
    'pl_sto', 'pl_bank', 'pl_barber', 'pl_bar', 'pl_resto', 'pl_rynok',
    ...'dvor noch ostanovka garazhi korobka kuhnya shkola pustyr gazeta'.split(' ').map(n => 'bg_' + n),
    ...'mama ildar bacha natasha garipov sedoy zima starsh zavuch chuzhoy'.split(' ').map(n => 'p_' + n)].map(n => `img/${n}.jpg`),
  'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

// Установка: все файлы версии скачиваются заново, мимо HTTP-кэша (иначе можно получить смесь старых и новых файлов)
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION)
  .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Сначала кэш: игра открывается мгновенно и без сети. Новая версия приходит целиком при смене VERSION.
// Чего нет в кэше (картинки сцен) — из сети, и сразу в кэш.
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(VERSION).then(x => x.put(r, c)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
