// Самопроверка: node tools/selfcheck.js — случайные прохождения + проверка ссылок между событиями.
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const el = () => new Proxy({ classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, style: {}, dataset: {} },
  { get: (t, k) => k in t ? t[k] : (k === 'innerHTML' ? '' : () => el()), set: (t, k, v) => (t[k] = v, true) });
const store = {};
const ctx = {
  console, Math, JSON, Object, Date, Set, setInterval() {}, clearInterval() {}, setTimeout() {}, clearTimeout() {}, confirm: () => true, __TEST: true,
  document: { querySelector: el, querySelectorAll: () => [], createElementNS: el, createElement: el, getElementById: el, body: el() },
  navigator: {}, location: { href: '' }, prompt: () => null,
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v },
};
vm.createContext(ctx);
const src = ['js/map.js', 'js/citymap.js', 'js/sprite.js', 'js/audio.js', 'js/settings.js', 'js/game.js', 'js/story.js', 'js/career.js', 'js/mini.js', 'js/world.js', 'js/economy.js', 'js/mechanics.js', 'js/atmos.js', 'js/story2.js', 'js/street.js', 'js/scenes.js', 'js/menu.js', 'js/time.js', 'js/places.js', 'js/ranks.js', 'js/fame.js', 'js/slang.js', 'js/natasha.js', 'js/special.js', 'js/vehicles.js', 'js/prison.js', 'js/eggs.js', 'js/songs.js', 'js/stats.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
vm.runInContext(src + `
;globalThis.EV = EV; globalThis.DISTRICTS = DISTRICTS; save = () => {};
function __run(seedHome, steps) {
  S = newState({ name: 'Тест', app: { ...DEFAULT_APP }, wear: { ...DEFAULT_WEAR, acc: [] }, home: seedHome, fam: 'mother', dengi: 5, semya: 60 });
  for (const n of Object.values(NPCS)) drawHero(document.querySelector(), n.app, n.wear);
  // гардероб: каждая вещь и каждая внешность должны рисоваться без ошибок
  for (const i of ITEMS) { const w = { ...DEFAULT_WEAR, acc: [] }; i.slot === 'acc' ? w.acc.push(i.id) : (w[i.slot] = i.id); drawHero(document.querySelector(), DEFAULT_APP, w); }
  for (const [k, o] of Object.entries(LOOKS)) for (const v of Object.keys(o)) drawHero(document.querySelector(), { ...DEFAULT_APP, [k]: v }, DEFAULT_WEAR);
  toMap();
  const seen = new Set();
  for (let i = 0; i < steps; i++) {
    if (globalThis.__arrestAt === i && !S.cur && !S.res) S.st.mil = 100;   // принудительный арест: проверка веток тюрьмы/подписи
    if (S.ending || S.st.zdor <= 0) return { end: S.ending || 'death', day: S.day, seen };
    if (S.res) { next(S.res.go); continue; }
    if (S.cur) {
      const ev = EV[S.cur]; seen.add(S.cur);
      if (!ev) throw new Error('нет события ' + S.cur);
      if (ev.fight) { const o = fightOptions(ev.fight); fightRound(ev, o[rnd(o.length)]); continue; }
      const ch = (T(ev.choices) || []).filter(c => !c.if || c.if(S))
        .filter(c => !c.req || Object.entries(c.req).every(([k, v]) => k === 'dengi' ? S.st.dengi >= v : stat(k) >= v));
      if (!ch.length) throw new Error('нет доступных выборов в ' + S.cur);
      const c = ch[rnd(ch.length)]; T(c.t); T(ev.text); doChoice(c); continue;
    }
    if (S.ap > 0 && S.jobs.length && Math.random() < 0.3) { takeJob(S.jobs[0].uid); continue; }
    if (S.ap > 0 && nOk(S) && nFree(S) && Math.random() < 0.15) { natDate(); continue; }   // свидания с Наташей
    if (S.ap > 0 && Math.random() < 0.15) {   // заходим в случайное заведение
      const pl = pick(PLACES), acts = placeActions(S, pl).filter(a => !a.barber && (!a.if || a.if(S)) && (!a.req || Object.entries(a.req).every(([k, v]) => S.st[k] >= v)));
      if (acts.length) { S.at = pl.d; doChoice({ ...pick(acts), cost: 0.5 }); continue; }
    }
    if (S.ap > 0 && Math.random() < 0.8) {
      const ds = [S.home, ...NEIGHBORS[S.home], 'center'];
      const d = ds[rnd(ds.length)];
      const acts = locActions(S, d).filter(a => !a.req || S.st.dengi >= (a.req.dengi || 0));
      S.at = d; doChoice({ ...acts[rnd(acts.length)], cost: 1 });
    } else sleep();
  }
  return { end: 'шагов не хватило', day: S.day, seen };
}
// Карьера: случайная судьба, задания с доски, до конца забега
function __career(steps, surv) {
  surv ? startSurv(rollFate()) : startCareer(rollFate());
  const seen = new Set();
  for (let i = 0; i < steps; i++) {
    if (S.ended) return { end: metaGet().runs[0].reason.split(':')[0] + (S.over && S.over.win ? ' [' + S.goal + ']' : ''), rank: S.rank, day: S.day, seen };
    if (S.res) { next(S.res.go); continue; }
    if (S.cur) {
      const ev = EV[S.cur]; seen.add(S.cur);
      if (ev.fight) { const o = fightOptions(ev.fight); fightRound(ev, o[rnd(o.length)]); continue; }
      const ch = (T(ev.choices) || []).filter(c => !c.if || c.if(S))
        .filter(c => !c.req || Object.entries(c.req).every(([k, v]) => k === 'dengi' ? S.st.dengi >= v : stat(k) >= v));
      if (!ch.length) throw new Error('нет доступных выборов в ' + S.cur);
      // в карьере бот осторожнее: предпочитает первый вариант (обычно «взяться»)
      const c = Math.random() < 0.6 ? ch[0] : ch[rnd(ch.length)]; T(c.t); T(ev.text); T(ev.title); doChoice(c); continue;
    }
    if (S.ap > 0) {
      if (S.jobs.length && Math.random() < 0.6) { takeJob(S.jobs[0].uid); continue; }
      const acts = locActions(S, S.home).filter(a => !a.req || S.st.dengi >= (a.req.dengi || 0));
      S.at = S.home; doChoice({ ...acts[rnd(acts.length)], cost: 1 });
    } else sleep();
  }
  return { end: 'шагов не хватило', rank: S.rank, seen };
}
globalThis.__career = __career;`, ctx);

const pick0 = a => a[Math.floor(Math.random() * a.length)];
// 1) Статические ссылки go → существующие события
const bad = [];
for (const ev of Object.values(ctx.EV)) {
  const walk = c => { for (const b of [c, c.ok, c.no]) if (b && typeof b.go === 'string' && !ctx.EV[b.go]) bad.push(ev.id + ' → ' + b.go); };
  if (Array.isArray(ev.choices)) ev.choices.forEach(walk);
  if (ev.fight) ['win', 'lose', 'flee'].forEach(k => ev.fight[k] && walk(ev.fight[k]));
}
console.assert(!bad.length, 'Битые ссылки: ' + bad.join(', '));

// 2) Случайные прохождения за каждый район
const ends = {}, allSeen = new Set();
for (const d of ctx.DISTRICTS.filter(d => d.gang)) for (let k = 0; k < 15; k++) {
  const r = ctx.__run(d.id, 1500);
  ends[r.end] = (ends[r.end] || 0) + 1; r.seen.forEach(s => allSeen.add(s));
}
// 2б) Арест в кампании: обе ветки (подписал / сел) должны доходить до конца без ошибок
const aEnds = {};
for (let k = 0; k < 80; k++) {
  ctx.__arrestAt = 40 + Math.floor(Math.random() * 600);
  const r = ctx.__run(pick0(ctx.DISTRICTS.filter(d => d.gang)).id, 2500);
  const path = r.seen.has('z_sud') ? 'сел' : r.seen.has('k_uslovno') ? 'подписал' : 'без ареста';
  aEnds[path + ': ' + r.end] = (aEnds[path + ': ' + r.end] || 0) + 1; r.seen.forEach(s => allSeen.add(s));
}
ctx.__arrestAt = undefined;
console.log('Арест, исходы:', aEnds);
const cEnds = {}, ranks = [0, 0, 0, 0, 0, 0]; let maxDay = 0;
ctx.__seen = new Set();
const vmRun = code => vm.runInContext(code, ctx);
for (let k = 0; k < 60; k++) {
  const r = ctx.__career(6000);
  cEnds[r.end] = (cEnds[r.end] || 0) + 1; ranks[r.rank]++; r.seen.forEach(s => allSeen.add(s));
  maxDay = Math.max(maxDay, r.day || 0);
}
console.log('Самый долгий забег карьеры, дней:', maxDay);
// История на фоне: отдельный длинный прогон — бот только спит и смотрит, что выпадет
ctx.__career(1, false); ctx.S = undefined;
vmRun(`S.ended = false; S.over = null; S.st.mil = 0; S.mode = 'campaign'; for (let i = 0; i < 40000 && S.day < dayNum(1991, 12, 30); i++) {
  if (S.res) { next(S.res.go); continue; }
  if (S.cur) { const ev = EV[S.cur]; __seen.add(S.cur); if (ev.fight) { fightRound(ev, fightOptions(ev.fight).slice(-1)[0], true); continue; }
    const ch = (T(ev.choices) || []).filter(c => !c.if || c.if(S)).filter(c => !c.req); doChoice(ch[0]); S.over = null; S.ending = null; continue; }
  S.st.zdor = 100; S.st.mil = 0; S.goal = 'avtor'; sleep(); S.over = null; S.ended = false; }`);
ctx.__seen.forEach(s => allSeen.add(s));
console.log('Исторический прогон дошёл до:', vmRun('dateStr()'), '| сцена:', vmRun('S.cur'));
console.log('Карьера, исходы:', cEnds, 'достигнутые ранги [0..5]:', ranks.join(' '));
const sEnds = {};
for (let k = 0; k < 40; k++) { const r = ctx.__career(4000, true); sEnds[r.end] = (sEnds[r.end] || 0) + 1; r.seen.forEach(s => allSeen.add(s)); }
console.log('Выживание, исходы:', sEnds);
const never = Object.keys(ctx.EV).filter(id => !allSeen.has(id));
console.log('Исходы:', ends);
console.log('Ни разу не встретились:', never.join(', ') || 'нет');
console.log(bad.length ? 'ОШИБКИ' : 'OK');
