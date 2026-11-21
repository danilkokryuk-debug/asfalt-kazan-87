// Своё дело и тёмные дела. Открывается с ранга «Супер»: экран «💼 Дела» на экране героя.
//  — свой бизнес: открыть, прокачать (3 уровня), получать доход раз в неделю; бывают наезды и проверки ОБХСС;
//  — крыша: обложить данью новую точку (раз в 3 дня);
//  — тёмные дела: грабежи с подготовкой — исход зависит от навыков, своей скорлупы, оружия и машины.
const BIZ = [
  { id: 'larek', name: 'Ларёк со жвачкой и кассетами', cost: 60, inc: 8, rank: 2, bg: 't_larek', desc: 'Маленький, но свой. «Турбо», «Love is», кассеты «Мираж».' },
  { id: 'video', name: 'Свой видеосалон', cost: 220, inc: 26, rank: 3, bg: 't_r_video', desc: 'Подвал, «Электроника», три десятка стульев. Рубль за сеанс.' },
  { id: 'avto', name: 'Автомастерская', cost: 420, inc: 45, rank: 3, bg: 'pl_sto', desc: 'Михалыч в доле. Чинят, перебивают номера — не спрашивай.' },
  { id: 'vodka', name: 'Палатка с «Роялем»', cost: 320, inc: 42, rank: 4, dark: 3, bg: 't_r_vodka', desc: 'Спирт в бутылках с наклейками. Деньги быстрые, милиция рядом.' },
  { id: 'kafe', name: 'Кооперативное кафе', cost: 750, inc: 75, rank: 4, bg: 't_r_kafe', desc: 'Неон, шашлык, магнитофон. Сюда ходят нужные люди.' },
  { id: 'salon', name: 'Продажа пригнанных иномарок', cost: 2400, inc: 230, rank: 5, dark: 4, bg: 't_v_salon', desc: 'Машины из Германии. Документы — «почти настоящие».' },
  { id: 'kazino', name: 'Подпольное казино', cost: 1600, inc: 170, rank: 5, dark: 6, bg: 't_r_kazino', desc: 'Рулетка, крупье в бабочках, валюта. Город сходит с ума.' },
  { id: 'resto', name: 'Ресторан «Чайка»', cost: 3200, inc: 280, rank: 5, bg: 'pl_resto', desc: 'Свой ресторан. Здесь решаются все вопросы города.' },
];
const BIZ_ = Object.fromEntries(BIZ.map(b => [b.id, b]));
const bizInc = (b, lv) => Math.round(b.inc * (1 + (lv - 1) * 0.7));
const bizUp = (b, lv) => Math.round(b.cost * 0.8 * lv);
const bizSum = S => (S.biz || []).reduce((a, x) => a + (x.closed ? 0 : bizInc(BIZ_[x.id], x.lv)), 0);

// Раз в неделю: доход, «грязные» дела греют милицию, иногда — наезд или проверка
function bizWeek(S) {
  if (!S.biz || !S.biz.length) return;
  let inc = 0, heat = 0;
  for (const x of S.biz) { const b = BIZ_[x.id]; if (x.closed) { x.closed--; continue; } inc += bizInc(b, x.lv); heat += b.dark || 0; }
  S.st.dengi += inc; S.st.mil = Math.min(100, S.st.mil + heat);
  if (S.week) S.week.inc.push(['Свой бизнес', inc]);
  log(`Бизнес принёс ${inc} р.${heat ? ` Внимание милиции +${heat}.` : ''}`);
  if (Math.random() < 0.22) S.flags.biz_threat = rnd(S.biz.length);
}
def('e_biz', { mode: 'any', repeat: true, title: 'Наезд на бизнес', bg: 'rynok',
  trigger: S => S.flags.biz_threat != null && S.biz && S.biz[S.flags.biz_threat],
  fx: S => { S.bzIdx = S.flags.biz_threat; delete S.flags.biz_threat; S.bzKind = Math.random() < 0.5 ? 'naezd' : 'obhss'; },
  lines: S => { const b = BIZ_[S.biz[S.bzIdx].id];
    return S.bzKind === 'naezd' ? [`На «${b.name}» пришли чужие: «Теперь платите нам. Или сгорит».`, ['chuzhoy', 'Думал, раз своё — значит, никто не тронет?', 'angry']]
      : [`В «${b.name}» нагрянула проверка ОБХСС. Книги, накладные, вопросы про «левый» товар.`, ['militsioner:Инспектор ОБХСС', 'Интересная у вас бухгалтерия, гражданин. Очень интересная.']]; },
  choices: S => S.bzKind === 'naezd' ? [
    { t: 'Выйти с пацанами', fx: s => { s.kf = { name: 'Чужие', hp: 4, pow: 5 + s.rank, win: { txt: 'Отбились. Бизнес под защитой.', fx: { avt: 5 } },
      lose: { txt: 'Чужие разгромили точку. Неделю она не работает.', fx: { zdor: -10, flag: 'biz_lost' } } }; }, go: 'k_fight' },
    { t: 'Платить им треть', fx: s => { const x = s.biz[s.bzIdx]; x.lv = Math.max(1, x.lv - 1); return { uvazh: -5 }; }, txt: 'Доход упал. Зато спокойно. Пока.' },
  ] : [
    { t: 'Занести инспектору (40 р.)', req: { dengi: 40 }, fx: { dengi: -40 }, txt: '«Нарушений не выявлено». Конверт исчезает в портфеле.' },
    { t: 'Показать «чистые» книги', chk: ['um', 7], ok: { txt: 'Комар носа не подточит. Инспектор уходит ни с чем.', fx: {} },
      no: { txt: 'Нашли «левак». Точка закрыта на две недели.', fx: s => { s.biz[s.bzIdx].closed = 2; return { mil: 15 }; } } },
  ] });
def('e_biz_lost', { mode: 'any', repeat: true, trigger: S => S.flags.biz_lost && S.biz && S.biz.length, title: 'Разгром', bg: 'noch',
  fx: S => { delete S.flags.biz_lost; const x = S.biz[S.bzIdx || 0]; if (x) x.closed = 1; },
  lines: ['Утром ты видишь разбитые стёкла и перевёрнутые полки. Неделя без дохода.'], choices: [{ t: 'Восстановить' }] });

// ---- тёмные дела: грабежи ----
const HEISTS = [
  { id: 'kvartira', name: 'Квартира цеховика', rank: 3, loot: 160, heat: 25, need: '', bg: 't_h_kvartira', desc: 'Подпольный миллионер уехал в Сочи. Сейф за картиной.' },
  { id: 'sklad', name: 'Склад универмага', rank: 3, loot: 220, heat: 30, need: 'car', bg: 't_h_sklad', desc: 'Дефицит в коробках: магнитофоны, джинсы, сапоги. Нужна машина вывезти.' },
  { id: 'vagon', name: 'Вагон с дефицитом', rank: 4, loot: 340, heat: 35, need: 'car', bg: 't_sortirovka', desc: 'На сортировочной стоит вагон с японской техникой.' },
  { id: 'sberkassa', name: 'Сберкасса на окраине', rank: 4, loot: 520, heat: 50, need: 'wpn', bg: 'pl_bank', desc: 'Две кассирши, один старый сторож. Без ствола не ходи.' },
  { id: 'inkass', name: 'Инкассаторская машина', rank: 5, loot: 900, heat: 60, need: 'wpn car', bg: 't_h_inkass', desc: 'Каждый четверг в семь вечера. Охрана с автоматами.' },
  { id: 'yuvelir', name: 'Ювелирный «Яхонт»', rank: 5, loot: 1300, heat: 55, need: 'wpn', bg: 't_h_yuvelir', desc: 'Витрины с золотом. Сигнализация — на пульте у вневедомственной охраны.' },
];
const HEIST = Object.fromEntries(HEISTS.map(h => [h.id, h]));
const hasWpn = S => S.wear && ITEM[S.wear.wpn] && (ITEM[S.wear.wpn].wp || {}).heat >= 8;
const hasCar = S => typeof carGo === 'function' && carGo() && CAR[S.car.id].t === 'car';
// бонус к шансу: своя скорлупа, ствол, машина
const heistBonus = S => Math.min(0.3, (S.squad || []).length * 0.04 + (hasWpn(S) ? 0.08 : 0) + (hasCar(S) ? 0.08 : 0));
def('h_go', { mode: 'any', repeat: true, title: S => HEIST[S.hz].name, bg: S => HEIST[S.hz].bg,
  lines: S => { const h = HEIST[S.hz]; return [h.desc, ['starsh', `Ты старший. Решай, как идём. Своих — ${(S.squad || []).length}, ${hasWpn(S) ? 'ствол есть' : 'без ствола'}, ${hasCar(S) ? 'машина под окном' : 'без машины'}.`]]; },
  choices: S => { const h = HEIST[S.hz], b = heistBonus(S), win = s => { s.flags.heist_day = s.day; return { dengi: h.loot, mil: Math.round(h.heat * 0.4), avt: 8, sovest: -8 }; };
    const lose = s => { s.flags.heist_day = s.day; return { mil: h.heat + 20, zdor: -15, uvazh: -5 }; };
    return [
      { t: 'Тихо, ночью', chk: ['lovk', 6 + S.rank - Math.round(b * 10)], mini: 'zamok', ok: { txt: `Ни шороха. Добыча — ${h.loot} р.`, fx: win }, no: { txt: 'Сработала сигнализация. Уходили по крышам, с пустыми руками.', fx: lose } },
      { t: 'Нахрапом, со стволом', if: s => hasWpn(s), chk: ['sila', 5 + S.rank - Math.round(b * 10)], ok: { txt: `Всё за три минуты. ${h.loot} р. и дрожь в руках.`, fx: s => ({ ...win(s), mil: h.heat, sovest: -15 }) }, no: { txt: 'Охрана открыла огонь. Чудом ушёл.', fx: s => ({ ...lose(s), zdor: -30 }) } },
      { t: 'Через своего человека (50 р.)', req: { dengi: 50 }, chk: ['yaz', 6 + S.rank - Math.round(b * 10)], ok: { txt: 'Наводчик открыл дверь изнутри. Чисто.', fx: s => ({ ...win(s), dengi: h.loot - 50, mil: Math.round(h.heat * 0.2) }) }, no: { txt: 'Наводчик сдал вас ментам.', fx: s => ({ ...lose(s), dengi: -50 }) } },
      { t: 'Отменить дело', txt: 'Не сегодня. Пацаны ворчат, но расходятся.' },
    ]; } });

// ---- экран «Дела» ----
function bizScreen() {
  S.biz = S.biz || [];
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const owned = id => S.biz.find(x => x.id === id);
  const heistOk = !S.flags.heist_day || S.day - S.flags.heist_day >= 5, kryOk = !S.flags.kry_day || S.day - S.flags.kry_day >= 3;
  const row = (img, body, btn) => `<div class="item biz"><div class="bimg" style="background-image:url(img/${bgPhoto(img) || img}.jpg)"></div><div style="flex:1">${body}</div>${btn}</div>`;
  $('#main').innerHTML = `<div class="scene in"><h2>💼 Дела</h2>
    <p class="sub">Твои деньги: ${S.st.dengi} р. · Бизнес приносит ${bizSum(S)} р. в неделю · Крыша чистыми: ${pointsSum()} р.</p>
    <h3 class="mag-h">Свой бизнес</h3><div class="choices">${BIZ.map(b => { const x = owned(b.id);
      if (x) return row(b.bg, `<b>${b.name}</b><div class="sub">Уровень ${x.lv}/3 · +${bizInc(b, x.lv)} р./нед${x.closed ? ' · <span style="color:var(--bad)">закрыт</span>' : ''}${b.dark ? ' · греет милицию' : ''}</div>`,
        x.lv < 3 ? `<button class="btn" data-up="${b.id}" ${S.st.dengi >= bizUp(b, x.lv) ? '' : 'disabled'}>Расширить ${bizUp(b, x.lv)} р.</button>` : '<span class="ch hi">✔ макс</span>');
      const lock = S.rank < b.rank;
      return row(b.bg, `<b>${lock ? '🔒 ' : ''}${b.name}</b><div class="sub">${lock ? 'С ранга «' + RANKS[b.rank] + '»' : b.desc + ` Доход +${b.inc} р./нед.`}</div>`,
        lock ? '' : `<button class="btn main" data-buy="${b.id}" ${S.st.dengi >= b.cost ? '' : 'disabled'}>Открыть ${b.cost} р.</button>`); }).join('')}</div>
    <h3 class="mag-h">Крыша</h3><div class="choices">
      <button class="btn" id="kry" ${kryOk && S.ap > 0 ? '' : 'disabled'}>Обложить данью новую точку${kryOk ? '' : ' (раз в 3 дня)'}</button>
      ${(S.points || []).map(p => `<div class="item"><div><b>${p.name}</b><div class="sub">+${p.amt} р./нед</div></div></div>`).join('')}</div>
    ${S.rank >= 3 ? `<h3 class="mag-h">Тёмные дела</h3><p class="sub">Шансы выше со своей скорлупой (${(S.squad || []).length}), со стволом и машиной. После дела нужно затаиться на 5 дней.</p>
    <div class="choices">${HEISTS.map(h => { const lock = S.rank < h.rank, miss = (h.need.includes('wpn') && !hasWpn(S) ? 'нужен ствол или нож ' : '') + (h.need.includes('car') && !hasCar(S) ? 'нужна машина на ходу' : '');
      return row(h.bg, `<b>${lock ? '🔒 ' : ''}${h.name}</b><div class="sub">${lock ? 'С ранга «' + RANKS[h.rank] + '»' : `${h.desc} Добыча ≈ ${h.loot} р.${miss ? ' · <span style="color:var(--bad)">' + miss + '</span>' : ''}`}</div>`,
        lock ? '' : `<button class="btn main" data-heist="${h.id}" ${!miss && heistOk && S.ap > 0 ? '' : 'disabled'}>${heistOk ? 'На дело' : 'Затаись'}</button>`); }).join('')}</div>` : ''}
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  const back = () => { view = 'hero'; render(); };
  $('#bk').onclick = back;
  document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const z = BIZ_[b.dataset.buy]; S.st.dengi -= z.cost; S.biz.push({ id: z.id, lv: 1 }); log(`Открыл своё дело: ${z.name}.`); AUDIO.ok(); toast(`Открыто: ${z.name}`); save('auto'); bizScreen(); });
  document.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const x = owned(b.dataset.up), z = BIZ_[x.id]; S.st.dengi -= bizUp(z, x.lv); x.lv++; AUDIO.ok(); save('auto'); bizScreen(); });
  document.querySelectorAll('[data-heist]').forEach(b => b.onclick = () => { S.hz = b.dataset.heist; advanceTime(ACT_MIN); play('h_go'); });
  if ($('#kry')) $('#kry').onclick = () => { S.flags.kry_day = S.day; S.kt = { id: 'krysha', p: { what: pick(['видеосалон', 'кооперативное кафе', 'автомастерская', 'ларёк с жвачкой', 'шашлычная', 'кооператив по пошиву джинсов', 'точка обмена валюты']) } };
    if (!TPL.krysha) return; advanceTime(ACT_MIN); play('k_task'); };
}
const bizHtml = S => S.rank >= 2 ? `<div class="choices" style="margin:0 0 12px"><button class="btn main" onclick="bizScreen()">💼 Дела: бизнес, крыша${S.rank >= 3 ? ', тёмные дела' : ''}</button></div>` : '';
