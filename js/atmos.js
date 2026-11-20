// Атмосфера (кассеты, вкладыши, дневник, фотоальбом) и соревнование (код судьбы, вызов дня, рекорды, «поделиться»).

// ===================== КАССЕТЫ =====================================================================
// Названия — пародии. Каждая кассета включает свой трек вместо обычной музыки на карте.
const TAPES = [
  { id: 't_krov', name: '«Группа Кровь» — Звезда по имени Солнце', track: 'noch' },
  { id: 't_laskoviy', name: '«Ласковый Мой» — Белые розы', track: 'disco' },
  { id: 't_modern', name: '«Модерн Толкинг» — Шери-шери', track: 'disco' },
  { id: 't_nautilus', name: '«Наутилус Пампилиус» — Скованные', track: 'noch' },
  { id: 't_karmen', name: '«Кар-Мен» — Лондон, гуд бай', track: 'disco' },
  { id: 't_alisa', name: '«Алиса в Стране» — Трасса Е95', track: 'fight' },
  { id: 't_sektor', name: '«Сектор Глаза» — Колхозный панк', track: 'dvor' },
  { id: 't_eurob', name: '«Эуроп» — Последний отсчёт', track: 'kino' },
  { id: 't_mirah', name: '«Мирах» — Музыка нас связала', track: 'disco' },
  { id: 't_blatnyak', name: 'Сборник «Дворовые песни»', track: 'dvor' },
];
const TAPE = Object.fromEntries(TAPES.map(t => [t.id, t]));
function buyTape() {
  const have = S.tapes || [], left = TAPES.filter(t => !have.includes(t.id));
  if (!left.length) return { txt: 'У тебя уже все кассеты, что есть на рынке.' };
  const t = pick(left); S.tapes = [...have, t.id]; S.tape = t.id;
  return { txt: `Кассета: ${t.name}. Сразу ставишь в магнитофон.` };
}

// ===================== ВКЛАДЫШИ ======================================================================
const CARDS = [
  'Ferrari Testarossa', 'Lamborghini Countach', 'Porsche 959', 'BMW M1', 'Mercedes 190', 'Ford Mustang', 'Chevrolet Corvette',
  'Lotus Esprit', 'Audi Quattro', 'Jaguar XJS', 'ВАЗ-2108 «Восьмёрка»', 'ГАЗ-24 «Волга»', 'Москвич-412', 'Ferrari F40',
  'Love is… вместе на катке', 'Love is… делиться жвачкой', 'Love is… ждать у подъезда', 'Love is… помнить её день рождения',
  'Love is… нести её портфель', 'Love is… не опаздывать',
];
function buyGum() {
  const c = rnd(CARDS.length); S.cards = S.cards || [];
  const isNew = !S.cards.includes(c); if (isNew) S.cards.push(c);
  return { txt: `Жвачка «Turbo»: вкладыш «${CARDS[c]}»${isNew ? ' — новый!' : ' — такой уже есть, можно махнуться.'} Коллекция: ${S.cards.length}/${CARDS.length}.` };
}

// ===================== ДНЕВНИК =====================================================================
// В конце дня — запись от первого лица по событиям дня и самочувствию
function diaryWrite(prev) {
  const today = dateStr(S.day - 1);
  const ev = S.log.filter(l => l.d === today && !l.t.startsWith('Неделя')).map(l => l.t.replace(/\.$/, '')).slice(0, 3);
  const dz = S.st.zdor - prev.zdor, dm = S.st.dengi - prev.dengi;
  const mood = dz < -15 ? pick(['Всё болит.', 'Рёбра ноют, еле дошёл до кровати.']) : S.st.lyub > 40 && Math.random() < 0.4 ? 'Опять думал про Наташу.'
    : dm > 10 ? 'В кармане звенит. Хорошо.' : S.st.mil > 50 ? 'Кажется, за мной следят.' : pick(['Обычный день.', 'Ничего особенного.', 'Устал.', 'Хочется, чтобы всё было по-другому.']);
  S.diary = S.diary || [];
  S.diary.unshift({ d: today, t: (ev.length ? ev.join('. ') + '. ' : '') + mood });
  S.diary.length = Math.min(S.diary.length, 200);
}

// ===================== ФОТОАЛЬБОМ ==================================================================
// Ключевые сцены сохраняются «фотографией»: фон, ты в тогдашней одежде и тот, кто был рядом
const PHOTO = {
  c1_prisheli: ['Пришился', 'bacha', 'korobka'], c1_natasha: ['Наташа на остановке', 'natasha', 'ostanovka'],
  f_proverka: ['Проверка. Против Зимы', 'zima', 'korobka'], c2_war_end: ['После стрелки', 'sedoy', 'korobka'],
  c2_natasha2: ['У подъезда', 'natasha', 'noch'], c2_newyear: ['Новый, 1988', 'ildar', 'korobka'],
  c3_skorlupa: ['Своя скорлупа', 'sq0', 'korobka'], c3_bacha: ['Ночь с Бачей', 'bacha', 'garazhi'],
  m_zona3: ['Освобождение', 'starsh', 'noch'], g_recruit: ['Новенький', 'cand', 'korobka'],
  c4_afgan: ['Пятнадцатое февраля', 'bacha', 'garazhi'], c4_army: ['Эшелон', 'mama', 'ostanovka'], c4_dembel: ['Дембель', 'ildar', 'dvor'],
  c4_natasha: ['Наташа', 'natasha', 'ostanovka'], c5_moskva: ['Гастроли в Москве', 'starsh', 'rynok'], c5_raskol: ['Раскол', 'sedoy', 'korobka'],
  c6_shod_end: ['Сход', 'sedoy', 'korobka'], c6_putch: ['Девятнадцатое августа', 'mama', 'kuhnya'], c6_final: ['26 декабря 1991', 'ildar', 'noch'],
};
function photo(id) {
  const p = PHOTO[id]; if (!p || (S.album || []).some(x => x.id === id)) return;
  const n = npcOf(p[1]);
  S.album = [...(S.album || []), { id, cap: p[0], d: dateStr(), bg: p[2], wear: JSON.parse(JSON.stringify(S.wear)), app: { ...S.app }, npc: n ? { app: n.app, wear: n.wear } : null }];
  toast('Новое фото в альбоме: ' + p[0]);
}
function albumScreen() {
  const al = S.album || [];
  $('#main').innerHTML = `<div class="scene"><h2>Фотоальбом</h2>
    ${al.length ? `<div class="album">${al.map((p, i) => `<div class="photo"><div class="stage bg-${p.bg}">
      <canvas class="sprite npc" data-pn="${i}"></canvas><canvas class="sprite me" data-pm="${i}"></canvas></div>
      <div class="pcap">${p.cap}<br><span class="sub">${p.d}</span></div></div>`).join('')}</div>` : '<p class="sub">Пока ни одной фотографии. Они появятся в главные моменты жизни.</p>'}
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  al.forEach((p, i) => {
    drawHero(document.querySelector(`[data-pm="${i}"]`), p.app, p.wear);
    const c = document.querySelector(`[data-pn="${i}"]`);
    if (p.npc) drawHero(c, p.npc.app, p.npc.wear, { emo: 'smile' }); else c.remove();
  });
  $('#bk').onclick = () => { view = 'hero'; render(); };
}

// ===================== КОД СУДЬБЫ И ВЫЗОВ ДНЯ ========================================================
// Детерминированный генератор: одинаковый код → одинаковая судьба у всех
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function seeded(seed, fn) { const m = Math.random; Math.random = rng(seed); try { return fn(); } finally { Math.random = m; } }
const fateCode = seed => 'КЗН-' + (seed >>> 0).toString(36).toUpperCase().padStart(6, '0');
const codeSeed = code => parseInt(String(code).trim().toUpperCase().replace(/^КЗН-?/, '').replace(/[^0-9A-Z]/g, ''), 36) || 0;
const todaySeed = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
function rollFateSeeded(seed) { const f = seeded(seed, () => rollFate()); f.seed = seed; return f; }

// ===================== ПОДЕЛИТЬСЯ ==================================================================
async function share(text) {
  try { if (navigator.share) return await navigator.share({ text }); } catch (e) { return; }
  try { await navigator.clipboard.writeText(text); toast('Скопировано — отправь другу'); } catch (e) { prompt('Скопируй и отправь:', text); }
}

// ===================== РЕКОРДЫ ======================================================================
function recordsHtml(mode) {
  const runs = metaGet().runs.filter(r => (r.mode || 'career') === mode).sort((a, b) => b.slava - a.slava).slice(0, 10);
  return runs.length ? `<div class="log">${runs.map((r, i) => `<p><b>${i + 1}. ${r.name}${r.nick ? ' «' + r.nick + '»' : ''}</b> — слава ${r.slava}<br><span class="d">${RANKS[r.rank]}, ${r.days} дн. ${r.daily ? '· вызов дня ' + r.daily : ''}</span></p>`).join('')}</div>` : '<p class="sub">Пока пусто.</p>';
}
