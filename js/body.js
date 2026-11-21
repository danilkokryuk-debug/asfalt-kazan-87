// Тело героя: еда, травмы, лечение, навыки, которые без дела слабеют.
// — Сытость 0–100 тает каждый день; рацион выбираешь сам, он стоит денег (в 90-х — дороже). Голод режет силу и здоровье.
// — Сильный урон даёт травму: ушиб, сотрясение, ребро, перелом, нож, пуля. Пока не вылечишься — штрафы,
//   с переломом не берут на задания, с ножевым и пулевым не выйти из дома (только в больницу), без врача — кровотечение.
// — Больница: бесплатно с очередью и риском осложнений, «отблагодарить врача», частная клиника и «свой врач» (90-е), стационар.
// — Навыки: без практики падают (сила и ловкость быстрее), высокие растут всё труднее, травмы и голод их режут.
const BODY_START = 70;
const SYT_DAY = 35;   // сколько сытости уходит за день
const inflation = S => typeof era90 === 'function' && era90(S) ? 3 : 1;
const RATION = {
  golod: { n: 'Впроголодь', d: 'Чай и хлеб, если есть', syt: 12, cost: 0, heal: 0 },
  deshevo: { n: 'Дёшево', d: 'Макароны, килька, картошка', syt: 30, cost: 1, heal: 3 },
  norm: { n: 'Как все', d: 'Щи, котлеты, столовая', syt: 38, cost: 2, heal: 5 },
  rynok: { n: 'С рынка', d: 'Мясо, творог, фрукты', syt: 45, cost: 4, heal: 7, bonus: 'Сила растёт легче' },
  resto: { n: 'По ресторанам', d: 'Шашлык, коньяк, икра', syt: 50, cost: 10, heal: 7, bonus: 'Язык +1, уважение' },
};
// дома кормит мама, пока ты школьник и в семье мир
const momFeeds = S => (typeof heroAge !== 'function' || heroAge(S) < 18) && S.st.semya >= 40;
const ratCost = (S, id) => id === 'norm' && momFeeds(S) ? 0 : RATION[id].cost * inflation(S);
const BODY = S => { if (!S.body) S.body = { syt: BODY_START, rat: 'norm', inj: [], used: {} }; return S.body; };

// ---------- травмы ----------
const INJ = {
  ushib: { n: 'Ушибы и синяки', days: 3, pen: { sila: -1 }, block: 0, bleed: 0, price: 3 },
  sotr: { n: 'Сотрясение', days: 7, pen: { um: -2, yaz: -1 }, block: 0, bleed: 0, price: 8 },
  rebro: { n: 'Сломано ребро', days: 14, pen: { sila: -2, lovk: -2 }, block: 0, bleed: 0, price: 10 },
  perelom: { n: 'Перелом руки', days: 28, pen: { sila: -3, lovk: -2 }, block: 1, bleed: 0, price: 20, crooked: 'sila' },
  nozh: { n: 'Ножевое ранение', days: 20, pen: { sila: -3, lovk: -3 }, block: 2, bleed: 10, price: 30 },
  pulya: { n: 'Огнестрельное ранение', days: 30, pen: { sila: -4, lovk: -3, um: -1 }, block: 2, bleed: 15, price: 50, police: true },
};
const BLOCK_TXT = ['', 'на задания нельзя', 'из дома не выйти — только в больницу'];
const injList = S => BODY(S).inj;
const injBlock = S => injList(S).reduce((m, i) => Math.max(m, INJ[i.id].block), 0);
const hurtWord = i => i.q ? (i.q >= 2 ? 'лечится отлично' : i.q >= 1.4 ? 'лечится' : 'лечится кое-как') : INJ[i.id].bleed ? 'не перевязано — кровь!' : 'не лечится';
function injure(S, id, why) {
  const L = injList(S), had = L.find(i => i.id === id);
  if (had) { had.left = Math.max(had.left, INJ[id].days); had.q = 0; }
  else L.push({ id, left: INJ[id].days, q: 0, since: S.day });
  BODY(S).injN = (BODY(S).injN || 0) + 1; BODY(S).injT = BODY(S).injT || {}; BODY(S).injT[id] = (BODY(S).injT[id] || 0) + 1;
  log(`Травма: ${INJ[id].n.toLowerCase()}${why ? ' — ' + why : ''}.`);
  if (typeof __TEST === 'undefined' && typeof toast === 'function') setTimeout(() => toast(`🩹 ${INJ[id].n}! ${BLOCK_TXT[INJ[id].block] || 'Лечись'}`), 400);
}
const gunCtx = S => { const ev = EV[S.cur] || {}; return /стрел|ствол|выстр|пистол|автомат|обрез|перестр|рубоп|засад/i.test(`${ev.id} ${T(ev.title) || ''} ${ev.bg || ''}`); };
const knifeCtx = S => { const ev = EV[S.cur] || {}; return /нож|перо|заточ|резн|бритв/i.test(`${T(ev.title) || ''}`); };
// урон → может быть травма. Чем больше урон и чем «взрослее» время, тем серьёзнее
function rollInjury(S, loss, lost) {
  if (loss < 12) return;
  const r = Math.random(), e = typeof era90 === 'function' && era90(S);
  if (loss >= 35 || (lost && loss >= 28)) {
    if (r > 0.6) return injure(S, r < 0.8 ? 'sotr' : 'rebro', 'в драке');   // повезло — без серьёзного
    if (gunCtx(S) || (e && r < 0.15)) return injure(S, 'pulya', 'на стрелке');
    if (knifeCtx(S) || r < (e ? 0.3 : 0.18)) return injure(S, 'nozh', 'в драке');
    return injure(S, 'perelom', 'в драке');
  }
  if (loss >= 20) { if (r < 0.55) injure(S, r < 0.3 ? 'ushib' : r < 0.45 ? 'sotr' : 'rebro'); return; }
  if (r < 0.3) injure(S, 'ushib');
}
// ловим урон в любом событии
{ const af = applyFx; applyFx = fx => {
  if (typeof S === 'undefined' || !S || !S.st) return af(fx);
  const z0 = S.st.zdor, st0 = { sila: S.st.sila, lovk: S.st.lovk, um: S.st.um, yaz: S.st.yaz };
  const out = af(fx);
  // навыки: высокий растёт всё труднее; практика отмечается
  for (const k of Object.keys(st0)) if (S.st[k] > st0[k]) {
    const d = S.st[k] - st0[k], p = Math.max(0.25, 1 - (st0[k] - 5) * 0.15);
    if (st0[k] >= 6 && d > 0 && Math.random() > p) { S.st[k] = st0[k]; out.push(`${NAMES[k]}: предел — нужно больше практики`); }
    BODY(S).used[k] = S.day;
  }
  if (!S._noInj && z0 - S.st.zdor >= 8 && S.st.zdor > 0) rollInjury(S, z0 - S.st.zdor, false);
  return out;
}; }
// драка: урон за всю драку → травма (проигрыш — тяжелее)
{ const pl = play; play = id => { const r = pl(id); if (EV[id] && EV[id].fight && S.fight) S.fight.z0 = S.st.zdor; return r; };
  const fe = fightEnd; fightEnd = (ev, how, msg) => { const z0 = S.fight && S.fight.z0; S._noInj = 1; let r; try { r = fe(ev, how, msg); } finally { S._noInj = 0; }
    if (z0 != null && S.st.zdor > 0) rollInjury(S, z0 - S.st.zdor + (how === 'lose' ? 5 : 0), how === 'lose'); return r; }; }

// ---------- навыки: штрафы и практика ----------
const NEED_PRACTICE = { sila: 12, lovk: 12, um: 20, yaz: 16 };   // дней без дела до потери единицы
function bodyPen(S, k) {
  const b = BODY(S); let p = 0;
  for (const i of b.inj) p += INJ[i.id].pen[k] || 0;
  if (b.syt < 30 && (k === 'sila' || k === 'lovk')) p -= 1;
  if (b.syt < 10) p -= 1;
  if (b.rat === 'resto' && k === 'yaz') p += 1;
  return p;
}
{ const st = stat; stat = k => k in STATS && S && S.st ? Math.max(0, st(k) + bodyPen(S, k)) : st(k); }
{ const ch = chance; chance = c => { if (S && S.st && c && c[0] in NEED_PRACTICE) BODY(S).used[c[0]] = S.day; return ch(c); }; }

// ---------- день: еда, заживление, навыки ----------
// заменяет «само заживает»: сколько вернуть здоровья за ночь
function bodyHeal(S) {
  const b = BODY(S);
  if (b.inj.some(i => INJ[i.id].bleed && !i.q)) return 0;        // кровоточит — не заживает
  return RATION[b.rat].heal + (S.st.semya > 50 ? 2 : 0) - (b.syt < 20 ? 4 : 0);
}
function bodyDay(S, mult = 1) {
  const b = BODY(S), msgs = [];
  // еда
  let rat = b.rat, cost = ratCost(S, rat);
  while (cost > S.st.dengi && rat !== 'golod') { rat = { resto: 'rynok', rynok: 'norm', norm: 'deshevo', deshevo: 'golod' }[rat]; cost = ratCost(S, rat); }
  if (rat !== b.rat) msgs.push(`Денег не хватило на «${RATION[b.rat].n.toLowerCase()}» — ел «${RATION[rat].n.toLowerCase()}».`);
  S.st.dengi -= cost; S.body.spent = (S.body.spent || 0) + cost;
  b.syt = clamp(b.syt - SYT_DAY + RATION[rat].syt, 0, 100);
  if (rat === 'resto') S.st.uvazh = clamp(S.st.uvazh + 1, 0, 100);
  if (b.syt <= 0) { S.st.zdor = clamp(S.st.zdor - 8, 0, 100); msgs.push('Истощение: здоровье −8.'); }
  if (injBlock(S)) b.blockDays = (b.blockDays || 0) + 1;
  // травмы
  for (const i of [...b.inj]) {
    const t = INJ[i.id];
    if (t.bleed && !i.q) { S.st.zdor = clamp(S.st.zdor - t.bleed, 0, 100); msgs.push(`${t.n}: кровь не остановлена, здоровье −${t.bleed}.`); continue; }
    i.left -= (i.q || 0.5) * mult;
    if (i.left <= 0) { b.inj.splice(b.inj.indexOf(i), 1); msgs.push(`${t.n} — зажило.`);
      if (t.crooked && (i.q || 0.5) < 1 && Math.random() < 0.5) { S.st[t.crooked] = Math.max(1, S.st[t.crooked] - 1); msgs.push('Срослось криво: сила −1 навсегда.'); } }
  }
  // навыки: без практики падают (но не ниже 3); на рыночной еде сила держится дольше
  for (const [k, days] of Object.entries(NEED_PRACTICE)) {
    const last = b.used[k] ?? S.day, lim = days + (k === 'sila' && (rat === 'rynok' || rat === 'resto') ? 6 : 0);
    if (S.st[k] > 3 && S.day - last > lim) { S.st[k]--; b.used[k] = S.day; msgs.push(`${NAMES[k]} −1: давно без практики.`); }
  }
  msgs.forEach(m => log(m));
  return msgs;
}
{ const nd = onNewDay; onNewDay = S => { nd(S); bodyDay(S); }; }

// ---------- запреты: задания и передвижение ----------
{ const tj = takeJob; takeJob = uid => { const bl = injBlock(S);
  if (bl) { toast(`🩹 Ты ранен — ${BLOCK_TXT[bl]}. Сначала вылечись.`); return render(); } return tj(uid); }; }
{ const la = locActions; locActions = (S, d) => {
  const bl = injBlock(S), a = la(S, d);
  if (bl < 2) return a;
  if (d !== S.home) return [{ t: '🩹 Ты ранен — сюда не дойти. «Герой» → «Вызвать скорую»', cost: 0, txt: 'Каждый шаг отдаётся болью. Нужен врач.' }];
  return a.filter(x => /Дома|помочь матери|Замести/.test(T(x.t)));
}; }
{ const ma = mechActions; mechActions = (S, d) => injBlock(S) >= 2 ? [] : ma(S, d); }

// ---------- больница ----------
function hospActs(S, p) {
  const a = [], L = injList(S), e = typeof era90 === 'function' && era90(S), inf = inflation(S);
  if (!L.length) {
    if (S.st.zdor < 90) a.push({ t: 'Осмотр и перевязка (3 р.)', req: { dengi: 3 * inf }, cost: 0.5, fx: { dengi: -3 * inf, zdor: 12 }, txt: 'Врач щупает рёбра, мажет зелёнкой: «До свадьбы заживёт».' });
    a.push({ t: 'Справка: травм нет', cost: 0, txt: `Здоровье ${S.st.zdor}. Сытость ${BODY(S).syt}. Врач советует нормально питаться.` });
    return a;
  }
  for (const i of L.filter(x => !x.q || x.q < 2)) {
    const t = INJ[i.id], pr = t.price * inf;
    if (!i.q) a.push({ t: `${t.n}: бесплатно, по полису (очередь, полдня)`, cost: 2, lim: 0,
      fx: s => { i.q = Math.random() < 0.15 ? 0.8 : 1; s.st.zdor = clamp(s.st.zdor + 5, 0, 100); return t.police ? { mil: 25 } : {}; },
      txt: () => i.q < 1 ? 'Очередь, хлорка, уставшая медсестра. Лечение есть, но сделано наспех — заживать будет дольше.' : t.police ? 'Пулю достали. А потом в палату зашёл участковый: «Огнестрел, гражданин. Рассказывайте».' : 'Отстоял очередь. Врач всё сделал как положено.' });
    if ((i.q || 0) < 1.5) a.push({ t: `${t.n}: отблагодарить врача (${pr} р.)`, req: { dengi: pr }, cost: 1, lim: 0,
      fx: s => { i.q = 1.5; s.st.zdor = clamp(s.st.zdor + 10, 0, 100); return t.police && Math.random() < 0.5 ? { dengi: -pr, mil: 10 } : { dengi: -pr }; },
      txt: 'Конверт в карман халата — и тебя ведут без очереди. Импортные бинты, хороший хирург, отдельная палата.' });
    if (e) a.push({ t: `${t.n}: частная клиника ($${Math.ceil(pr / 3)})`, req: { dol: Math.ceil(pr / 3) }, cost: 1, lim: 0,
      fx: s => { i.q = 2; s.st.zdor = clamp(s.st.zdor + 15, 0, 100); return { dol: -Math.ceil(pr / 3) }; },
      txt: 'Евроремонт, кондиционер, немецкие лекарства. Никто ничего не спрашивает.' });
  }
  if (S.st.zdor < 80 || L.length) a.push({ t: `Лечь в стационар на 3 дня (${6 * inf} р.)`, req: { dengi: 6 * inf }, cost: 0, lim: 0,
    fx: s => { injList(s).forEach(x => x.q = Math.max(x.q || 0, 1)); for (let k = 0; k < 3; k++) { skipDays(1); bodyDay(s, 2); } return { dengi: -6 * inf, zdor: 30 }; },
    txt: 'Белые простыни, манная каша, капельница. Мама приносит апельсины. Три дня — и ты почти человек.' });
  return a;
}
{ const pa = placeActions; placeActions = (S, p) => p.k === 'hosp' ? hospActs(S, p) : [...pa(S, p), ...foodActs(S, p)]; }
// поесть в заведениях — сразу сытость
function foodActs(S, p) {
  const inf = inflation(S), b = BODY(S);
  const m = { bar: ['Пельмени и пиво', 2, 30], resto: ['Поужинать как человек', 8, 45], market: ['Беляш и чебурек', 1, 20] }[p.k];
  return m && b.syt < 90 ? [{ t: `${m[0]} (${m[1] * inf} р.)`, req: { dengi: m[1] * inf }, cost: 0.25, lim: 2,
    fx: s => { BODY(s).syt = clamp(BODY(s).syt + m[2], 0, 100); return { dengi: -m[1] * inf }; }, txt: 'Горячее. Жизнь налаживается.' }] : [];
}
// вызвать врача, если из дома не выйти
function callDoctor() {
  const h = PLACES.find(p => p.k === 'hosp' && p.d === S.home) || PLACES.find(p => p.k === 'hosp');
  S.at = h.d; S.place = h.id; view = 'place'; render();
}

// ---------- экран «Здоровье» на герое ----------
const bodyHtml = S => {
  const b = BODY(S), inj = b.inj;
  return `<div class="body-box"><div class="body-row"><span>🍞 Сытость</span><div class="bar"><i style="width:${b.syt}%;background:${b.syt < 30 ? '#c8402f' : '#d8a441'}"></i></div><b>${b.syt}</b></div>
    <div class="sub">Рацион: <b>${RATION[b.rat].n}</b> — ${ratCost(S, b.rat) ? ratCost(S, b.rat) + ' р. в день' : momFeeds(S) && b.rat === 'norm' ? 'мама кормит' : 'бесплатно'}. ${b.syt < 30 ? '<span class="lo">Голодаешь: сила и ловкость ниже.</span>' : ''}</div>
    <div class="rat">${Object.entries(RATION).map(([id, r]) => `<button class="btn${id === b.rat ? ' on' : ''}" onclick="setRation('${id}')"><b>${r.n}</b><span>${ratCost(S, id) ? ratCost(S, id) + ' р./день' : id === 'norm' && momFeeds(S) ? 'мама' : '0'}</span></button>`).join('')}</div>
    ${inj.length ? `<div class="inj">${inj.map(i => `<div class="inj-i">🩹 <b>${INJ[i.id].n}</b> · ещё ~${Math.ceil(i.left / (i.q || 0.5))} дн. · ${hurtWord(i)}${INJ[i.id].block ? ` · <span class="lo">${BLOCK_TXT[INJ[i.id].block]}</span>` : ''}</div>`).join('')}
      <button class="btn main" onclick="callDoctor()">🚑 ${injBlock(S) >= 2 ? 'Вызвать скорую' : 'В больницу'}</button></div>` : ''}</div>`;
};
function setRation(id) { BODY(S).rat = id; toast(`Рацион: ${RATION[id].n.toLowerCase()}`); render(); }
