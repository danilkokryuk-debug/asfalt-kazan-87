// Обмен долларов. Курс зависит от времени (как в жизни), а между покупкой и продажей — разница ~30%:
// купил и сразу продал — всегда в минус. Заработать можно только временем: купил до «чёрного вторника» или дефолта.
// 80-е: валютчик у гостиницы «Татарстан» (это статья — внимание милиции), Жора. 90-е: обменники в центре и в сберкассах,
// фарцовщик Жора закрыл лавочку — один курс на весь город, никакой разницы между двумя менялами.
function fxBase(S) {   // рублей за доллар «посередине»
  const d = S.day, D = (y, m, dd) => dayNum(y, m, dd);
  if (S.flags && S.flags.default98) return 15;
  if (d >= D(1995, 1, 1)) return 6.5;
  if (d >= D(1994, 10, 11)) return 6;   // «чёрный вторник»
  if (d >= D(1993, 1, 1)) return 4.5;
  if (d >= D(1992, 1, 1)) return 4;
  return 4;   // 80-е: только чёрный рынок
}
const fxBuy = S => Math.round(fxBase(S) * 1.15 * 10) / 10;    // ты покупаешь $
const fxSell = S => Math.round(fxBase(S) * 0.85 * 10) / 10;   // ты продаёшь $
const fxRub = (n, r) => Math.round(n * r);
function fxActs(S, where) {
  const e = typeof era90 === 'function' && era90(S), a = [], b = fxBuy(S), s = fxSell(S);
  const illegal = !e, heat = illegal ? 4 : 0, who = illegal ? 'Валютчик у «Татарстана»' : where;
  const note = illegal ? ' (статья 88 — внимание милиции)' : '';
  for (const n of [10, 50]) if (S.st.dengi >= fxRub(n, b)) a.push({ t: `${who}: купить $${n} за ${fxRub(n, b)} р.${note}`, lim: 0, cost: 0.25,
    fx: s2 => ({ dengi: -fxRub(n, b), dol: n, ...(heat ? { mil: heat } : {}) }), txt: illegal ? 'Пачка мятых бумажек из рукава. «Не свети тут».' : 'Окошко, табличка с курсом, кассирша пересчитывает дважды.' });
  if (S.st.dol > 0) {
    const n = Math.min(S.st.dol, 10);
    a.push({ t: `${who}: продать $${n} за ${fxRub(n, s)} р.`, lim: 0, cost: 0.25, fx: () => ({ dengi: fxRub(n, s), dol: -n, ...(heat ? { mil: heat } : {}) }), txt: 'Рубли — в карман. Доллары — уже не твои.' });
    if (S.st.dol > 10) a.push({ t: `${who}: продать все $${S.st.dol} за ${fxRub(S.st.dol, s)} р.`, lim: 0, cost: 0.25,
      fx: s2 => ({ dengi: fxRub(s2.st.dol, s), dol: -s2.st.dol, ...(heat ? { mil: heat } : {}) }), txt: 'Толстая пачка рублей. Курс сегодня такой.' });
  }
  a.push({ t: `Курс: покупка $1 = ${b} р., продажа $1 = ${s} р.`, cost: 0, lim: 0, txt: e ? 'Табличку переписывают каждую неделю. Вверх.' : 'В газетах курс — 60 копеек. На улице — совсем другой.' });
  return a;
}
// центр города: обменник (в 80-х — валютчик); в 90-х Жора с долларами больше не работает
{ const la = locActions; locActions = (S, d) => {
  let a = la(S, d);
  if (d === 'center') {
    if (typeof era90 === 'function' && era90(S)) a = a.filter(x => !/Жор[аы]/.test(T(x.t)) || !/\$/.test(T(x.t)));
    a.push(...fxActs(S, 'Обменник'));
  }
  return a;
}; }
// сберкасса в 90-х — тоже обменный пункт
{ const pa = placeActions; placeActions = (S, p) => {
  const a = pa(S, p);
  if (p.k === 'bank' && typeof era90 === 'function' && era90(S)) a.push(...fxActs(S, 'Обменный пункт'));
  return a;
}; }
