// Дело на тебя. Каждое громкое дело (внимание милиции резко растёт, улики после драк) кладёт в папку
// улику: свидетеля, вещдок, запись с камеры (90-е), показания стукача. Когда папка весит 30+ — дело заведено:
// в 80-х его ведёт капитан Гарипов, в 90-х — РУБОП. Папка 100+ — арест.
// С каждой уликой можно работать: договориться со свидетелем, запугать, выкрасть вещдок, купить запись,
// подкупить следователя, нанять адвоката, а с влиянием — «потерять» всё дело через прокурора.
const CASE = S => (S.case = S.case || { items: [], open: false, n: 0 });
const caseW = S => CASE(S).items.reduce((a, i) => a + Math.round(i.w * (S.day - i.day > 120 ? 0.5 : 1)), 0);
const caseBy = S => typeof era90 === 'function' && era90(S) ? 'РУБОП' : 'капитан Гарипов';
const EVI = {
  svid: ['Продавщица с рынка видела твоё лицо', 'Таксист запомнил номер', 'Соседка по подъезду всё слышала', 'Сторож гаражей узнал тебя', 'Пострадавший пришёл в себя и дал показания'],
  ulika: ['Нож с отпечатками', 'Куртка с кровью', 'Твоя кепка на месте драки', 'Лом из твоего гаража', 'Гильза от «Макарова»'],
  zapis: ['Запись с камеры у банка', 'Фото из газеты: ты на заднем плане', 'Плёнка с камеры в обменнике'],
  stukach: ['Показания «своего» — кто-то из пацанов говорит', 'Записка в почтовом ящике участкового'],
};
function addEvidence(S, w, kind) {
  const c = CASE(S), e = typeof era90 === 'function' && era90(S);
  kind = kind || pick(e ? ['svid', 'ulika', 'zapis', 'svid'] : ['svid', 'ulika', 'svid']);
  const names = EVI[kind].filter(n => e || !/Макаров|камер|обменник/.test(n));   // в 80-х ни пистолетов, ни камер
  c.items.push({ id: ++c.n, kind, name: pick(names.length ? names : EVI[kind]), w, day: S.day });
  if (!c.open && caseW(S) >= 30) { c.open = true; c.opened = S.day; log(`На тебя завели дело. Ведёт: ${caseBy(S)}.`);
    if (typeof pagerPush === 'function') pagerPush(S, { from: 'Адвокат', text: 'На тебя завели дело. Не дури.', act: 'scr:case', btn: 'К делу' }); }
  if (caseW(S) >= 100) S.st.mil = 100;   // папка толстая — придут брать (g_arrest)
}
// громкое дело → улика; драка с уликами → вещдок; низкая верность бойца → стукач
{ const af = applyFx; applyFx = fx => {
  if (typeof S === 'undefined' || !S || !S.st) return af(fx);
  const m0 = S.st.mil, out = af(fx), dm = S.st.mil - m0;
  if (dm >= 8 && S.cur && !/^(g_arrest|z_|k_)/.test(S.cur) && Math.random() < 0.6) addEvidence(S, Math.min(30, 6 + dm));
  return out;
}; }
{ const aft = afterFight; afterFight = (how, ev) => { const u0 = S.ulik || 0; aft(how, ev); if ((S.ulik || 0) > u0 && Math.random() < 0.5) addEvidence(S, 10, 'ulika'); }; }
// раз в неделю: стукач, если в бригаде/скорлупе есть недовольные; старые улики теряют вес
{ const ew = economyWeek; economyWeek = S => { ew(S);
  const low = [...(S.brig || []).filter(b => !b.dead && !b.gone && b.loyal < 25), ...(S.squad || []).filter(m => m.loyal < 20)];
  if (low.length && Math.random() < 0.25) addEvidence(S, 20, 'stukach');
  const c = CASE(S); c.items = c.items.filter(i => S.day - i.day < 365);   // через год улика уже ничего не стоит
  if (c.open && !c.items.length) { c.open = false; log('Дело закрыли за недостатком улик.'); }
}; }
// арест закрывает папку (дальше — суд и зона по сюжету)
{ const pl = play; play = id => { if (id === 'g_arrest' && S && S.case) { S.case.items = []; S.case.open = false; } return pl(id); }; }

// ---------- экран «Дело» ----------
const caseHtml = S => CASE(S).open ? `<div class="choices" style="margin:0 0 12px"><button class="btn main case-btn" onclick="caseScreen()">📁 Дело на тебя · ${caseW(S)}/100</button></div>` : '';
function caseActs(S, i) {
  const inf = typeof inflation === 'function' ? inflation(S) : 1, a = [];
  if (i.kind === 'svid') {
    a.push({ k: 'pay', t: `Договориться (${25 * inf} р.)`, cost: 25 * inf, txt: 'Конверт, разговор на кухне. Свидетель «ничего не помнит».' });
    a.push({ k: 'scare', t: 'Запугать', txt: '' });
  }
  if (i.kind === 'ulika') { a.push({ k: 'steal', t: 'Выкрасть из вещдоков', txt: '' }); a.push({ k: 'pay', t: `Подкупить следователя (${40 * inf} р.)`, cost: 40 * inf, txt: 'Вещдок «утерян при переезде отдела».' }); }
  if (i.kind === 'zapis') a.push({ k: 'pay', t: `Купить плёнку у охранника (${30 * inf} р.)`, cost: 30 * inf, txt: 'Охранник отдал кассету и забыл твоё лицо.' });
  if (i.kind === 'stukach') a.push({ k: 'find', t: 'Вычислить стукача', txt: '' });
  return a;
}
function caseScreen() {
  const c = CASE(S), inf = typeof inflation === 'function' ? inflation(S) : 1, w = caseW(S), used = c.last === S.day;
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene in"><h2>📁 Дело</h2>
    <div class="case-board"><div class="case-h">Ведёт: <b>${caseBy(S)}</b> · вес папки <b class="${w >= 70 ? 'lo' : ''}">${w}</b> / 100 — при 100 придут брать</div>
      <div class="bar"><i style="width:${Math.min(100, w)}%"></i></div>
      ${c.items.map(i => `<div class="case-card ${i.kind}"><div class="pin"></div><b>${i.name}</b><span>${{ svid: 'свидетель', ulika: 'вещдок', zapis: 'запись', stukach: 'стукач' }[i.kind]} · вес ${i.w}${S.day - i.day > 120 ? ' (старое)' : ''}</span>
        <div class="fam-b">${caseActs(S, i).map(x => `<button class="btn" data-cs="${i.id}|${x.k}" ${used || (x.cost && S.st.dengi < x.cost) ? 'disabled' : ''}>${x.t}</button>`).join('')}</div></div>`).join('')}
    </div>
    <div class="choices">
      <button class="btn" id="cs-adv" ${used || S.st.dengi < 80 * inf ? 'disabled' : ''}>Нанять адвоката: вся папка легче на треть (${80 * inf} р.)</button>
      ${S.vl >= 40 ? `<button class="btn" id="cs-pro" ${used ? 'disabled' : ''}>Прокурор «теряет» дело (влияние −10)</button>` : ''}
      <div class="sub">${used ? 'Сегодня ты уже занимался делом.' : 'С делом можно работать раз в день.'}</div>
      <button class="btn" id="bk">Назад</button></div></div>`;
  $('#bk').onclick = () => { view = 'hero'; render(); };
  const done = msg => { c.last = S.day; advanceTime(ACT_MIN); log(msg); toast(msg); if (!caseW(S)) { c.open = false; } caseScreen(); };
  if ($('#cs-adv')) $('#cs-adv').onclick = () => { S.st.dengi -= 80 * inf; c.items.forEach(i => i.w = Math.round(i.w * 0.66)); done('Адвокат разнёс папку в пух: улики «получены с нарушениями».'); };
  if ($('#cs-pro')) $('#cs-pro').onclick = () => { S.vl -= 10; c.items = []; done('Прокурор позвонил кому надо. Дела больше нет. Совсем.'); };
  document.querySelectorAll('[data-cs]').forEach(b => b.onclick = () => {
    const [id, k] = b.dataset.cs.split('|'), i = c.items.find(x => x.id === +id); if (!i) return;
    const drop = () => { c.items = c.items.filter(x => x !== i); };
    const act = caseActs(S, i).find(x => x.k === k);
    if (k === 'pay') { S.st.dengi -= act.cost; drop(); return done(act.txt); }
    if (k === 'scare') { if (Math.random() < chance(['sila', 6])) { drop(); S.st.sovest = clamp(S.st.sovest - 8, 0, 100); return done('Свидетель понял всё с полуслова. Совесть потом не даёт спать.'); }
      i.w += 15; return done('Свидетель написал заявление о давлении. Папка потяжелела.'); }
    if (k === 'steal') { if (Math.random() < chance(['lovk', 7])) { drop(); return done('Ночью в отделе тихо. Вещдока больше нет.'); }
      S.st.mil = clamp(S.st.mil + 20, 0, 100); addEvidence(S, 15, 'ulika'); return done('Сработала сигнализация. Теперь у них ещё и твои отпечатки на сейфе.'); }
    if (k === 'find') { if (Math.random() < chance(['um', 6])) { drop(); const bad = (S.brig || []).find(x => !x.dead && !x.gone && x.loyal < 25); if (bad) bad.gone = S.day;
        return done(bad ? `Стукач — ${bad.name} «${bad.nick}». Его больше нет в бригаде.` : 'Стукача вычислили. Больше он говорить не будет.'); }
      return done('Не вычислил. Подозреваешь всех — и это хуже всего.'); }
  });
}
