// Журнал целей: куда идти дальше. Главная цель, следующее звание и что оно откроет, линии с людьми, ближайший праздник.
function goalsScreen() {
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const f = S.flags, row = (title, txt, done) => `<div class="item ${done ? 'worn' : ''}"><div><b>${done ? '✔ ' : ''}${title}</b><div class="sub">${txt}</div></div></div>`;
  // главная цель
  let main;
  if (S.mode === 'career' && typeof goalOf === 'function' && S.goal) { const g = goalOf(S); main = row('Цель судьбы', `${g.text}. Срок — ${dateStr(g.until)}.`); }
  else if (S.mode === 'surv') main = row('Выжить', 'Продержаться как можно дольше: не попасть в больницу, не сесть, не сломаться.');
  else {
    const ch = f.ch6 ? 6 : f.ch5 ? 5 : f.ch4 ? 4 : S.done.c3_skorlupa ? 3 : S.done.c2_obshak ? 2 : 1;
    const HINT = { 1: 'Пришейся к моталке, разберись с Ильдаром и познакомься с Наташей. Сюжет идёт сам — гуляй по району и выполняй задания.',
      2: 'Общак, дискотека, первая большая война за асфальт. Решения здесь определят, кто ты в моталке.', 3: 'Своя скорлупа, кровь на снегу. Готовься стать молодым.',
      4: 'Молодой: армия или откос, Афган, суд над Ильдаром.', 5: 'Старший: раскол между Седым и Зимой. Выбери сторону.', 6: 'Автор: сход, путч, 26 декабря 1991-го. Финал близко.' };
    main = row(`Кампания · глава ${ch}`, HINT[ch]);
  }
  // звание
  const next = S.rank + 1, need = typeof RANK_NEED !== 'undefined' ? RANK_NEED[next] : null;
  const opens = [];
  if (typeof RANK_JOBS !== 'undefined') { const n = RANK_JOBS.filter(t => t.min === next).length; if (n) opens.push(`${n} новых заданий`); }
  if (typeof BIZ !== 'undefined') { const b = BIZ.filter(x => x.rank === next).map(x => x.name); if (b.length) opens.push('бизнес: ' + b.join(', ')); }
  if (typeof HEISTS !== 'undefined') { const h = HEISTS.filter(x => x.rank === next).map(x => x.name); if (h.length) opens.push('дела: ' + h.join(', ')); }
  const wp = ITEMS.filter(i => i.slot === 'wpn' && i.rank === next).map(i => i.name); if (wp.length) opens.push('оружие: ' + wp.join(', '));
  if (typeof CARS !== 'undefined') { const c = CARS.filter(x => x.rank === next).map(x => x.name); if (c.length) opens.push('транспорт: ' + c.join(', ')); }
  const rankRow = next > 5 ? row('Звание: ' + RANKS[S.rank], 'Выше некуда. Теперь главное — удержаться.', true)
    : row(`Звание: ${RANKS[S.rank]} → ${RANKS[next]}`, (need ? `Нужно: авторитет ${S.st.avt}/${need.avt}, уважение ${S.st.uvazh}/${need.uvazh}${need.land ? `, районов ${myLand(S).length}/${need.land}` : ''}. ` : S.mode === 'campaign' ? 'В Кампании звание дают по сюжету. ' : '')
      + (opens.length ? 'Откроется: ' + opens.join('; ') + '.' : ''));
  // линии
  const L = [];
  if (f.met_natasha) L.push(row('Наташа', f.natasha_gone || f.natasha_lost ? 'Вы расстались.' : `${typeof nStage === 'function' ? N_STAGES[nStage(S)] : ''}. Зови гулять с экрана героя — раз в день. Отношения: ${S.rel.natasha}/100.`, f.n_noch));
  if (S.done.a_brat1) L.push(row('Младший брат', f.brat_spasen ? 'Брат пошёл своей дорогой.' : f.brat_propal ? 'Брат обижен на тебя.' : 'Присматривай за ним — скоро что-то случится.', !!f.brat_spasen));
  if (f.met_krest) L.push(row('Крест', f.krest_down ? 'Вопрос с Крестом закрыт.' : 'Он не успокоится. Готовься к встрече один на один (нужно звание «Супер»).', !!f.krest_down));
  if (f.lilya_met) L.push(row('Лиля', f.lilya_s_toboy ? 'Вы вместе. Крест против.' : f.lilya_tayna ? 'Тайные встречи. Рано или поздно всё откроется.' : 'Встретились на танцах.'));
  if (f.boks) L.push(row('Бокс', f.sport_path ? 'Ты выбрал ринг.' : f.boks_ushel ? 'Ты выбрал улицу.' : 'Тренируйся — впереди турнир.', !!f.sport_path));
  if (S.done.a_otec1) L.push(row('Отец', f.otec_ushel ? 'Ты выставил его.' : f.otec_rabota ? 'Отец работает, в семье спокойно.' : f.otec_tract ? 'Отец связался с мужиками с тракта.' : 'Отец дома. Что дальше — зависит от тебя.', !!f.otec_rabota));
  if (S.done.a_habib1) L.push(row('Участковый Хабибуллин', f.habib_dolg ? 'Он тебе должен.' : f.habib_drug ? 'Вы договорились ловить квартирных воров.' : 'Ты отказался с ним работать.', !!f.habib_dolg));
  if (S.biz && S.biz.length) L.push(row('Свой бизнес', `${S.biz.length} точек, ${bizSum(S)} р. в неделю. Береги от наездов и ОБХСС.`));
  // праздник
  const HOL = [[9, 1, 'Первое сентября'], [11, 1, 'Первый снег'], [12, 28, 'Новый год'], [3, 5, '8 Марта'], [5, 8, 'День Победы'], [6, 15, 'Сабантуй'], [7, 10, 'Пляж на Волге']];
  const d = typeof gDate === 'function' ? gDate(S) : new Date(1987, 8, S.day);
  const nextHol = HOL.map(([m, dd, n]) => { let y = d.getFullYear(), t = new Date(y, m - 1, dd); if (t < d) t = new Date(y + 1, m - 1, dd); return [t, n]; }).sort((a, b) => a[0] - b[0])[0];
  const days = Math.round((nextHol[0] - d) / 864e5);
  $('#main').innerHTML = `<div class="scene in"><h2>🎯 Цели</h2>
    <div class="choices">${main}${rankRow}</div>
    ${L.length ? `<h3 class="mag-h">Линии</h3><div class="choices">${L.join('')}</div>` : ''}
    <h3 class="mag-h">Скоро</h3><div class="choices">${row(nextHol[1], days ? `Через ${days} дн.` : 'Сегодня!')}
      ${row('Каждый день', 'Заработок и тренировки — раз в день, остальные дела — пару раз. Задания-маячки появляются сами, особые ★ — очень редко.')}</div>
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  $('#bk').onclick = () => { view = 'hero'; render(); };
}
const goalsHtml = () => `<div class="choices" style="margin:0 0 12px"><button class="btn main" onclick="goalsScreen()">🎯 Цели: что делать дальше</button></div>`;
