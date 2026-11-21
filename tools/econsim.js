// Автосимуляция экономики: node tools/econsim.js [забегов=12] [до года=1995]
// Бот играет Карьеру «жадно»: берёт задания, заходит в заведения, угоняет, торгует, ведёт сделки 90-х.
// Концовки и тюрьма отключены — смотрим только деньги. Печатает богатство по годам и главные источники дохода.
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const RUNS = +process.argv[2] || 12, UNTIL = +process.argv[3] || 1995;
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
const list = fs.readFileSync(path.join(__dirname, 'selfcheck.js'), 'utf8').match(/const src = (\[[^\]]+\])/)[1];
const src = eval(list).map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
vm.runInContext(src + `
;save = () => {};
const __inc = {}, __add = (k, v) => { if (v) __inc[k] = (__inc[k] || 0) + v; };
const __ew = economyWeek; economyWeek = S => { __ew(S); (S.week.inc || []).forEach(([k, v]) => __add('неделя: ' + k, v)); (S.week.out || []).forEach(([k, v]) => __add('неделя: ' + k, -v)); };
const worth = () => S.st.dengi + (S.st.dol || 0) * 4 + (S.bank || 0);
function __econ(until) {
  startCareer(rollFate()); S.goal = 'avtor';
  const marks = {}; let label = '';
  const end = dayNum(until, 1, 1);
  for (let i = 0; i < 400000 && S.day < end; i++) {
    S.ended = false; S.over = null; S.ending = null; if (S.st.zdor < 30) S.st.zdor = 80; if (S.st.mil > 60) S.st.mil = 20;   // без тюрьмы и смертей
    const y = new Date(1987, 8, S.day).getFullYear(); if (!marks[y]) marks[y] = { worth: worth(), rank: S.rank, vl: S.vl || 0 };
    const m0 = S.st.dengi + (S.st.dol || 0) * 4;
    if (S.res) { next(S.res.go); }
    else if (S.cur) {
      const ev = EV[S.cur]; label = label || 'событие: ' + S.cur;
      if (ev.fight) { const o = fightOptions(ev.fight); fightRound(ev, o[0]); }
      else { const ch = (T(ev.choices) || []).filter(c => !c.if || c.if(S)).filter(c => !c.req || Object.entries(c.req).every(([k, v]) => k === 'dengi' ? S.st.dengi >= v : stat(k) >= v));
        if (!ch.length) { S.cur = null; continue; }
        // жадность: вариант, который больше всего обещает денег
        const val = c => { const f = c.fx || (c.ok && c.ok.fx); const o = typeof f === 'object' && f ? f : {}; return (o.dengi || 0) + (o.dol || 0) * 4; };
        doChoice(ch.slice().sort((a, b) => val(b) - val(a))[0]); }
    } else if (S.ap > 0) {
      const r = Math.random();
      if (S.jobs.length && r < 0.45) { label = 'задание: ' + S.jobs[0].id; takeJob(S.jobs[0].uid); }
      else if (r < 0.75) {
        const pl = pick(PLACES), acts = limFilter(S, pl.id, placeActions(S, pl).filter(a => !a.barber && a.cost !== 0 && (!a.if || a.if(S)) && (!a.req || Object.entries(a.req).every(([k, v]) => (S.st[k] || 0) >= v))));
        if (acts.length) { const a = pick(acts); label = 'место ' + pl.k + ': ' + String(T(a.t)).replace(/[\\d$.,()≈]+/g, '').slice(0, 40); limUse(S, a); S.at = pl.d; doChoice({ ...a, cost: 0.5 }); } else sleep();
      } else {
        const ds = DISTRICTS.map(d => d.id), d = pick(ds);
        const acts = limFilter(S, d, [...locActions(S, d), ...mechActions(S, d)].filter(a => (!a.if || a.if(S)) && (!a.req || S.st.dengi >= (a.req.dengi || 0))));
        if (acts.length) { const a = pick(acts); label = 'район: ' + String(T(a.t)).replace(/[\\d$.,()«»]+/g, '').slice(0, 40); limUse(S, a); S.at = d; doChoice({ ...a, cost: 1 }); } else sleep();
      }
    } else { label = ''; sleep(); }
    const m1 = S.st.dengi + (S.st.dol || 0) * 4; if (m1 !== m0 && label) __add(label, m1 - m0);
    if (!S.cur && !S.res) label = '';
  }
  return { marks, final: worth(), rank: S.rank, vl: S.vl || 0, gar: (S.gar || []).length, days: S.day };
}
globalThis.__econ = __econ; globalThis.__inc = __inc;`, ctx);

const res = [];
for (let k = 0; k < RUNS; k++) { try { res.push(ctx.__econ(UNTIL)); } catch (e) { console.log('ошибка в забеге:', e.stack.split(String.fromCharCode(10)).slice(0, 4).join(' | ')); } }
const years = [...new Set(res.flatMap(r => Object.keys(r.marks)))].sort();
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
console.log(`Забегов: ${res.length}. Богатство (деньги + $×4 + книжка) на 1 января, медиана [мин–макс]:`);
for (const y of years) { const w = res.map(r => r.marks[y] && r.marks[y].worth).filter(v => v != null);
  console.log(`  ${y}: ${med(w)} [${Math.min(...w)}–${Math.max(...w)}]  ранг ~${med(res.map(r => r.marks[y] ? r.marks[y].rank : 0))}  влияние ~${med(res.map(r => r.marks[y] ? r.marks[y].vl : 0))}`); }
console.log(`  финал: ${med(res.map(r => r.final))}`);
const top = Object.entries(ctx.__inc).map(([k, v]) => [k, Math.round(v / res.length)]).sort((a, b) => b[1] - a[1]);
console.log('Главные источники дохода (в среднем за забег):'); top.slice(0, 22).forEach(([k, v]) => console.log(`  ${String(v).padStart(7)}  ${k}`));
console.log('Главные траты:'); top.slice(-10).reverse().forEach(([k, v]) => console.log(`  ${String(v).padStart(7)}  ${k}`));
