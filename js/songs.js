// «Магнитофон»: настоящие песни эпохи в нужных местах игры.
// Записи принадлежат авторам — в игру они не вшиты. Игрок добавляет свои файлы с телефона,
// они лежат только на этом устройстве (IndexedDB), а игра включает их по месту: дискотека, махач, сход, ночь, зона…
// Нет файла — играет своя музыка игры, как раньше.

const SONGS = [
  { id: 'pyala', a: 'АИГЕЛ', t: 'Пыяла', at: ['title', 'final'] },
  { id: 'sedaya', a: 'Ласковый май', t: 'Седая ночь', at: ['night', 'disco'] },
  { id: 'nazare', a: 'Альянс', t: 'На заре', at: ['dawn', 'final'] },
  { id: 'pachka', a: 'Кино', t: 'Пачка сигарет', at: ['city', 'zona', 'night'] },
  { id: 'rozy', a: 'Ласковый май', t: 'Белые розы', at: ['disco'] },
  { id: 'krovi', a: 'Кино', t: 'Группа крови', at: ['fight', 'shod'] },
  { id: 'zvezda', a: 'Кино', t: 'Звезда по имени Солнце', at: ['shod', 'city'] },
  { id: 'muzyka', a: 'Мираж', t: 'Музыка нас связала', at: ['disco'] },
  { id: 'american', a: 'Комбинация', t: 'American Boy', at: ['disco'] },
  { id: 'cep', a: 'Наутилус Помпилиус', t: 'Скованные одной цепью', at: ['zona', 'fight'] },
  { id: 'rozoviy', a: 'Ласковый май', t: 'Розовый вечер', at: ['love', 'disco'] },
  { id: 'gorod', a: 'Браво', t: 'Этот город', at: ['city'] },
  { id: 'peremen', a: 'Кино', t: 'Перемен', at: ['shod', 'final'] },
  { id: 'belaya', a: 'Форум', t: 'Белая ночь', at: ['disco', 'night'] },
  { id: 'neproshu', a: 'Мираж', t: 'Я больше не прошу', at: ['love', 'disco'] },
  { id: 'spokoynaya', a: 'Кино', t: 'Спокойная ночь', at: ['night'] },
  { id: 'lirika', a: 'Сектор Газа', t: 'Лирика', at: ['love'] },
  { id: 'voyna', a: 'Агата Кристи', t: 'Как на войне', at: ['fight'] },
  { id: 'osen', a: 'ДДТ', t: 'Что такое осень', at: ['home'] },
  { id: 'koni', a: 'Электроклуб', t: 'Кони в яблоках', at: ['disco'] },
];
const SONG = Object.fromEntries(SONGS.map(s => [s.id, s]));
const SONG_PLACES = { title: 'Главное меню', disco: 'Дискотека, ДК, видеосалон', fight: 'Махач', shod: 'Коробка, сходы, стрелки',
  city: 'Прогулка по карте', dawn: 'Утро на карте', night: 'Ночь', love: 'С Наташей', home: 'Дома, школа, осень', zona: 'Суд и зона', final: 'Финалы' };

// ---- хранилище файлов на устройстве ----
const songDb = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((ok, no) => {
    const r = indexedDB.open('asfalt_music', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('songs');
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  }));
  const tx = (mode, fn) => open().then(db => new Promise((ok, no) => {
    const t = db.transaction('songs', mode), st = t.objectStore('songs'), r = fn(st);
    t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error);
  }));
  return { get: id => tx('readonly', s => s.get(id)), put: (id, blob) => tx('readwrite', s => s.put(blob, id)),
    del: id => tx('readwrite', s => s.delete(id)), keys: () => tx('readonly', s => s.getAllKeys()) };
})();
const SONG_HAVE = new Set();

// ---- проигрыватель: свой AudioContext — нужен для плавных переходов (на iPhone громкость <audio> не меняется) ----
const PLAYER = { el: null, ctx: null, g: null, cur: null, place: null, url: null, ready: false };
function playerInit() {
  if (PLAYER.ready || typeof Audio === 'undefined') return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    PLAYER.el = new Audio(); PLAYER.el.playsInline = true; PLAYER.el.preload = 'auto';
    PLAYER.ctx = new AC(); PLAYER.g = PLAYER.ctx.createGain(); PLAYER.g.gain.value = 0;
    PLAYER.ctx.createMediaElementSource(PLAYER.el).connect(PLAYER.g); PLAYER.g.connect(PLAYER.ctx.destination);
    PLAYER.el.onended = () => { PLAYER.cur = null; songCue(PLAYER.place, true); };
    PLAYER.ready = true;
  } catch (e) { PLAYER.ready = false; }
}
// первый тап по экрану разрешает звук (правило iPhone)
if (typeof document !== 'undefined' && document.addEventListener && typeof __TEST === 'undefined') document.addEventListener('pointerdown', () => {
  playerInit(); if (PLAYER.ctx && PLAYER.ctx.state === 'suspended') PLAYER.ctx.resume();
  if (PLAYER.el && !PLAYER.el.src) { PLAYER.el.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; PLAYER.el.play().then(() => PLAYER.el.pause()).catch(() => {}); }
}, { capture: true });
const songVol = () => (typeof SET !== 'undefined' ? (SET.vol ?? 1) * (SET.music ?? 1) : 1) * 0.9;
function songFade(to, sec) { if (!PLAYER.g) return; const t = PLAYER.ctx.currentTime; PLAYER.g.gain.cancelScheduledValues(t); PLAYER.g.gain.setValueAtTime(PLAYER.g.gain.value, t); PLAYER.g.gain.linearRampToValueAtTime(to, t + sec); }

async function songPlay(id) {
  if (!PLAYER.ready) return;
  const blob = await songDb.get(id).catch(() => null); if (!blob) { SONG_HAVE.delete(id); return; }
  const start = () => {
    if (PLAYER.url) URL.revokeObjectURL(PLAYER.url);
    PLAYER.url = URL.createObjectURL(blob); PLAYER.el.src = PLAYER.url; PLAYER.cur = id;
    PLAYER.el.play().then(() => { songFade(songVol(), 2.5); cassetteShow(SONG[id]); AUDIO.duck && AUDIO.duck(true); }).catch(() => { PLAYER.cur = null; });
  };
  if (PLAYER.cur && !PLAYER.el.paused) { songFade(0, 1.2); setTimeout(start, 1200); } else start();
}
function songStop() {
  if (!PLAYER.cur) return;
  PLAYER.cur = null; songFade(0, 1.5); setTimeout(() => { if (!PLAYER.cur) PLAYER.el.pause(); }, 1600);
  AUDIO.duck && AUDIO.duck(false);
}
// Сменилось место — подобрать песню. Если текущая подходит и играет — пусть играет.
function songCue(place, next) {
  if (typeof __TEST !== 'undefined' || !PLAYER.ready) { PLAYER.place = place; return; }
  PLAYER.place = place;
  if (!AUDIO.musicOn() || !place) return songStop();
  const pool = SONGS.filter(s => s.at.includes(place) && SONG_HAVE.has(s.id));
  if (!pool.length) return songStop();
  if (!next && PLAYER.cur && pool.some(s => s.id === PLAYER.cur)) return;
  const fresh = pool.filter(s => s.id !== PLAYER.cur);
  songPlay((fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length || pool.length))].id);
}
// Какое «место» сейчас: по сцене, драке, фону, времени суток
function songPlace() {
  if (!S) return 'title';
  const ev = S.cur && EV[S.cur];
  const bg = ev ? T(ev.bg) : view === 'place' && typeof PLACE !== 'undefined' && PLACE[S.place] ? PLACE[S.place].bg : null;
  const id = S.cur || '';
  if (ev && ev.fight && S.fight) return 'fight';
  if (/^(z_|m_zona|k_uslovno)/.test(id) || /^t_(sud|barak|zona_dvor|svidanie)$/.test(bg)) return 'zona';
  if (/^(c6_final|z_gorod|z_volya|v01_end)$/.test(id) || S.ending) return 'final';
  if (/natasha|kafe|most/.test(id)) return 'love';
  if (['dk', 'pl_kino', 'pl_resto'].includes(bg)) return 'disco';
  if (['korobka', 'pustyr', 'garazhi'].includes(bg) || /shod|nabeg|war|strelk/.test(id)) return 'shod';
  if (['noch', 'ostanovka', 't_budka', 'pl_bar'].includes(bg)) return 'night';
  if (['kuhnya', 'shkola', 't_pochta'].includes(bg)) return 'home';
  if (ev) return null;                                     // прочие сцены — своя музыка игры
  const h = (S.min || 0) / 60;
  return h >= 21 ? 'night' : h < 10 ? 'dawn' : 'city';
}

// ---- кассета-плашка: «играет…» ----
function cassetteShow(s) {
  if (!s || typeof document === 'undefined') return;
  document.querySelectorAll('.cassette').forEach(e => e.remove());
  const el = document.createElement('div'); el.className = 'cassette';
  el.innerHTML = `<div class="cs-body"><i class="reel"></i><i class="reel"></i></div><div class="cs-txt"><b>${s.t}</b><span>${s.a}</span></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), 5200); setTimeout(() => el.remove(), 6000);
}

// ---- экран «Магнитофон» ----
const songNorm = x => String(x).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');
const songMatch = name => { const n = songNorm(name.replace(/\.[a-z0-9]+$/i, '')); return SONGS.find(s => n.includes(songNorm(s.t))) || null; };
async function magScreen(back) {
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const row = s => `<div class="item mag ${SONG_HAVE.has(s.id) ? 'worn' : ''}"><div class="mag-reel${PLAYER.cur === s.id ? ' spin' : ''}"></div>
      <div style="flex:1"><b>${s.t}</b><div class="sub">${s.a}</div></div>
      ${SONG_HAVE.has(s.id) ? `<button class="btn" data-play="${s.id}">${PLAYER.cur === s.id ? '■' : '▶'}</button><button class="btn" data-del="${s.id}">✕</button>`
        : `<label class="btn">Файл<input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg" data-one="${s.id}" hidden></label>`}</div>`;
  $('#main').innerHTML = `<div class="scene in"><h2>📼 Магнитофон</h2>
    <p class="sub">Песни эпохи звучат в нужных местах: на дискотеке, в махаче, на сходе, ночью, на зоне. Записи принадлежат их авторам, поэтому в игру они не вшиты — добавь свои файлы с телефона. Они останутся только на этом устройстве.</p>
    <div class="choices"><label class="btn main">Добавить файлы (можно все сразу)<input type="file" multiple accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg" id="magAll" hidden></label></div>
    <div id="magMsg" class="sub"></div>
    <p class="sub">Загружено: ${SONG_HAVE.size} из ${SONGS.length}. Файлы с названием песни в имени («Кино - Группа крови.mp3») разложатся сами.</p>
    ${Object.entries(SONG_PLACES).map(([p, name]) => { const list = SONGS.filter(s => s.at[0] === p); return list.length ? `<h3 class="mag-h">${name}</h3><div class="choices">${list.map(row).join('')}</div>` : ''; }).join('')}
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  const redraw = () => magScreen(back);
  const save1 = async (id, f) => { await songDb.put(id, f); SONG_HAVE.add(id); };
  $('#magAll').onchange = async e => {
    const files = [...e.target.files], miss = [];
    for (const f of files) { const s = songMatch(f.name); if (s) await save1(s.id, f); else miss.push(f.name); }
    await redraw();
    $('#magMsg').innerHTML = `Добавлено: ${files.length - miss.length}.` + (miss.length ? ` Не узнал: ${miss.map(n => '«' + n + '»').join(', ')} — добавь их кнопкой «Файл» у нужной песни.` : '');
  };
  document.querySelectorAll('[data-one]').forEach(i => i.onchange = async e => { if (e.target.files[0]) { await save1(i.dataset.one, e.target.files[0]); redraw(); } });
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (PLAYER.cur === b.dataset.del) songStop(); await songDb.del(b.dataset.del); SONG_HAVE.delete(b.dataset.del); redraw(); });
  document.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { playerInit(); if (PLAYER.cur === b.dataset.play) songStop(); else songPlay(b.dataset.play); setTimeout(redraw, 300); });
  $('#bk').onclick = () => { (back || titleScreen)(); };
}

if (typeof indexedDB !== 'undefined' && typeof __TEST === 'undefined') songDb.keys().then(ks => (ks || []).forEach(k => SONG[k] && SONG_HAVE.add(k))).catch(() => {});
