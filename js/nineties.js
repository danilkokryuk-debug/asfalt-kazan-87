// Девяностые: влияние над городом, статус, сделки с властью, криминальные авторитеты, свои задания и свой гардероб.
// С 1992 года (в Кампании — с главы 7) у тебя появляется Влияние 0–100. Стартовое — по тому, кем ты вышел из 80-х:
// чем сильнее была твоя моталка (сколько районов держала) и чем выше твоё звание и авторитет, тем выше старт.
const era90 = S => !!S && (S.mode === 'campaign' ? !!S.flags.ch7 : (S.day || 0) >= (typeof dayNum === 'function' ? dayNum(1992, 1, 1) : 1e9));
function gangPlace(S) {   // место твоей моталки среди всех по числу районов: 1 — сильнейшая
  if (!S.gang) return 99;
  const cnt = {}; DISTRICTS.forEach(d => { const o = S.ctrl[d.id]; if (o) cnt[o] = (cnt[o] || 0) + 1; });
  const mine = cnt[S.gang] || 0; return 1 + Object.values(cnt).filter(n => n > mine).length;
}
function vlInit(S) {
  if (S.vl != null || !era90(S)) return;
  const place = gangPlace(S), land = typeof myLand === 'function' ? myLand(S).length : 0;
  let v = land * 4 + S.rank * 6 + (S.st.avt || 0) * 0.12 + (S.biz || []).length * 3 + (S.points || []).length * 2;
  v += place === 1 ? 25 : place <= 3 ? 12 : 0;
  S.vl = Math.max(3, Math.min(60, Math.round(v)));   // «Хозяин города» (75) — только заработать
  S.flags.vl_start = place;
  log(`Девяностые. Твоё влияние в городе: ${S.vl}. ${vlTitle(S)}.`);
}
const VL_TIERS = [[0, 'Мелкая фигура'], [15, 'Коммерсант с крышей'], [30, 'Бригадир'], [50, 'Криминальный авторитет'], [75, 'Хозяин города']];
const vlTitle = S => VL_TIERS.reduce((a, t) => (S.vl || 0) >= t[0] ? t[1] : a, VL_TIERS[0][1]);
const vlAdd = (S, n) => { S.vl = Math.max(0, Math.min(100, (S.vl || 0) + n)); };
// раз в неделю: город платит долю тем, у кого есть влияние; без дел влияние понемногу тает
function vlWeek(S, w) {
  if (!era90(S)) return; vlInit(S);
  const inc = Math.round(S.vl || 0);
  if (inc) { S.st.dengi += inc; if (w) w.inc.push(['Доля с города (влияние)', inc]); }
  if (S.car && CAR[S.car.id].elite) vlAdd(S, 1);   // чёрный «Гелик» у ресторана — тоже влияние
  if (sinceF(S, 'vl_act') > 21) vlAdd(S, -2);
}
const vlHtml = S => { if (!era90(S)) return ''; vlInit(S);
  return `<div class="fame vlbox"><span>Влияние в городе</span><b>${S.vl}</b><em>${vlTitle(S)}</em><i style="width:${S.vl}%"></i></div>
    <div class="choices" style="margin:0 0 12px"><button class="btn main" onclick="vlScreen()">🏛 Влияние: сделки и люди</button></div>`; };

// ---- авторитеты ----
Object.assign(NPCS, {
  hasan: { name: 'Хасан-ага', app: { build: 'thin', height: 'normal', skin: 's2', hair: 'ezhik', hairc: 'grey', eyes: 'brown', mark: 'none' },
    wear: { hat: 'h_none', outer: 'o_plashch', shirt: 's_vodolazka', pants: 'p_school', shoes: 'f_tufli', acc: [] } },
  baron: { name: 'Барон', app: { build: 'fat', height: 'normal', skin: 's1', hair: 'zaliz', hairc: 'dark', eyes: 'brown', mark: 'none' },
    wear: { hat: 'h_none', outer: 'o_pidzhak', shirt: 's_school', pants: 'p_school', shoes: 'f_tufli', acc: ['a_ochki'] } },
  tatarin: { name: 'Тагир «Борец»', app: { build: 'strong', height: 'tall', skin: 's2', hair: 'nol', hairc: 'black', eyes: 'brown', mark: 'none' },
    wear: { hat: 'h_none', outer: 'o_none', shirt: 's_maika', pants: 'p_adibas', shoes: 'f_kedy', acc: [] } },
});
if (typeof PORTRAITS !== 'undefined') PORTRAITS.push('hasan', 'baron', 'tatarin');

// ---- сделки: экран «Влияние» ----
const DEALS = [
  { id: 'v_uvd', need: 0, cd: 7, t: 'Начальник УВД', d: 'Конверт генералу — и твоих не трогают. Чем выше влияние, тем дешевле.', bg: 't_9_rubop' },
  { id: 'v_prokuror', need: 15, cd: 7, t: 'Прокурор района', d: 'Закрыть дело, потерять бумаги, отпустить своих.', bg: 't_9_rubop' },
  { id: 'v_blago', need: 0, cd: 7, t: 'Благотворительность', d: 'Детдом, ветераны Афгана, хоккейная секция. Город запоминает добро.', bg: 't_hol_lineyka' },
  { id: 'v_podryad', need: 30, cd: 14, t: 'Городской подряд', d: 'Ремонт дорог за городской счёт. Половина денег — мимо асфальта.', bg: 't_r_direktor' },
  { id: 'v_port', need: 40, cd: 7, t: 'Речной порт', d: 'Таможня на Волге: всё, что плывёт, может плыть через тебя.', bg: 't_s_port' },
  { id: 'v_bank', need: 45, cd: 10, t: 'Свой банкир', d: 'Отмыть деньги, перевести доллары, купить нужного человека.', bg: 't_r_bank' },
  { id: 'v_shod', need: 50, cd: 30, t: 'Сходняк авторитетов', d: 'Хасан-ага, Барон, Тагир. Кто будет держать город?', bg: 't_9_restoran' },
];
function vlScreen() {
  vlInit(S);
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene in"><h2>🏛 Влияние</h2>
    <p class="sub">Влияние: <b>${S.vl}</b> — ${vlTitle(S)}. Раз в неделю город платит тебе долю: ${S.vl} р. Без дел влияние тает.
    ${S.flags.vl_start === 1 ? 'Твоя моталка вышла из 80-х сильнейшей — ты начал девяностые с большим весом.' : S.flags.vl_start <= 3 ? 'Твоя моталка была в тройке сильнейших.' : 'Ты начинал девяностые небольшой фигурой.'}</p>
    <div class="choices">${DEALS.map(d => { const lock = S.vl < d.need, cd = sinceF(S, 'deal_' + d.id) < d.cd;
      return `<div class="item biz"><div class="bimg" style="background-image:url(img/${bgPhoto(d.bg) || d.bg}.jpg)"></div><div style="flex:1"><b>${lock ? '🔒 ' : ''}${d.t}</b><div class="sub">${lock ? 'Нужно влияние ' + d.need : d.d}</div></div>
        ${lock ? '' : `<button class="btn main" data-deal="${d.id}" ${cd || S.ap <= 0 ? 'disabled' : ''}>${cd ? `через ${d.cd - sinceF(S, 'deal_' + d.id)} дн.` : 'Встреча'}</button>`}</div>`; }).join('')}</div>
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  $('#bk').onclick = () => { view = 'hero'; render(); };
  document.querySelectorAll('[data-deal]').forEach(b => b.onclick = () => { S.flags['deal_' + b.dataset.deal] = S.day; S.flags.vl_act = S.day; advanceTime(ACT_MIN); play(b.dataset.deal); });
}
const VL = (n, o = {}) => s => { vlAdd(s, n); return o; };
def('v_uvd', { mode: 'any', repeat: true, title: 'Начальник УВД', bg: 't_9_rubop',
  lines: S => [['garipov', `Генерал занят. Но для тебя у него есть пять минут. Цена вопроса — ${Math.max(60, 220 - S.vl * 2)} р. в месяц.`, 'smile']],
  choices: S => { const p = Math.max(60, 220 - S.vl * 2); return [
    { t: `Занести ${p} р.`, req: { dengi: p }, fx: s => { vlAdd(s, 4); return { dengi: -p, mil: -40 }; }, txt: 'Твои точки исчезают из оперативных сводок.' },
    { t: 'Предложить сдавать чужих', fx: s => { vlAdd(s, 6); return { mil: -30, sovest: -12, flag: 'red_roof' }; }, txt: 'Чужих стали брать пачками. Твоё имя в сводках больше не звучит.' },
    { t: 'Уйти ни с чем', txt: 'Генерал пожимает плечами: «Как знаешь».' }]; } });
def('v_prokuror', { mode: 'any', repeat: true, title: 'Прокурор', bg: 't_9_rubop',
  lines: [['muzhik:Прокурор района', 'Дело можно потерять. Бумаги иногда горят сами. Но всё стоит денег. Или услуги.']],
  choices: [
    { t: 'Заплатить (150 р.)', req: { dengi: 150 }, fx: s => { vlAdd(s, 3); return { dengi: -150, mil: -50 }; }, txt: 'Твоё дело уходит в архив. Навсегда.' },
    { t: 'Оказать услугу: «поговорить» с его зятем-должником', fx: s => { vlAdd(s, 5); return { avt: 4, sovest: -6, mil: -30 }; }, go: 'f_random', txt: 'Зять вернул долг. Прокурор теперь твой.' },
    { t: 'Уйти', txt: '«Заходите, если что». Он знает, что ты зайдёшь.' }] });
def('v_blago', { mode: 'any', repeat: true, title: 'Благотворительность', bg: 't_hol_lineyka',
  lines: ['Детский дом на окраине: протекает крыша, нет обуви на зиму. Директриса смотрит на тебя с надеждой и страхом.'],
  choices: [
    { t: 'Купить обувь и починить крышу (100 р.)', req: { dengi: 100 }, fx: s => { vlAdd(s, 5); return { dengi: -100, sovest: 10 }; }, txt: 'Газета пишет: «Бизнесмен помог детдому». Город запоминает добро.' },
    { t: 'Хоккейная форма для дворовой команды (50 р.)', req: { dengi: 50 }, fx: s => { vlAdd(s, 3); return { dengi: -50, sovest: 5, uvazh: 4 }; }, txt: 'Пацаны с коробки играют в форме с твоим ресторанным логотипом.' },
    { t: 'Пообещать и забыть', fx: { sovest: -5 }, txt: 'Директриса ждёт до весны. Потом перестаёт ждать.' }] });
def('v_podryad', { mode: 'any', repeat: true, title: 'Городской подряд', bg: 't_r_direktor',
  lines: [['baron', 'Мэрия делит ремонт дорог. Подряд на сто миллионов. Асфальт положим тонко, деньги — толсто. Тебе — доля, мне — откат.', 'smile']],
  choices: [
    { t: 'Взять подряд', chk: ['yaz', 7], ok: { txt: 'Каждую неделю — конверт из мэрии. Асфальт на Сибирском тракте треснул через месяц.', fx: s => { vlAdd(s, 6); if (typeof addPoint === 'function') addPoint('Городской подряд', 60); return { sovest: -6 }; } },
      no: { txt: 'Подряд ушёл людям Барона. Ты ему это припомнишь.', fx: VL(-2) } },
    { t: 'Положить асфальт по-честному', fx: s => { vlAdd(s, 8); return { sovest: 10, dengi: 40 }; }, txt: 'Дороги на твоих районах держатся десять лет. Люди говорят: «Это при нём делали».' }] });
def('v_port', { mode: 'any', repeat: true, title: 'Речной порт', bg: 't_s_port',
  lines: ['Таможенный пост на Волге. Баржи с «гуманитаркой», в ящиках — сигареты и спирт. Капитан порта ждёт ответа.'],
  choices: [
    { t: 'Провести баржу без досмотра', chk: ['um', 7], ok: { txt: 'Баржа ушла. Конверт пришёл.', fx: s => { vlAdd(s, 4); return { dengi: 300, mil: 15 }; } }, no: { txt: 'ФСБ досмотрела баржу. Ты теперь в разработке.', fx: s => { vlAdd(s, -5); return { mil: 40 }; } } },
    { t: 'Поставить своего человека на таможню', req: { dengi: 200 }, fx: s => { vlAdd(s, 7); if (typeof addPoint === 'function') addPoint('Речной порт', 50); return { dengi: -200 }; }, txt: 'Теперь всё, что плывёт по Волге, платит тебе.' }] });
def('v_bank', { mode: 'any', repeat: true, title: 'Свой банкир', bg: 't_r_bank',
  lines: [['koop', 'Деньги любят тишину. Отмоем через кредит заводу, вернём через фонд ветеранов. Комиссия — десять процентов.']],
  choices: [
    { t: 'Отмыть кассу', fx: s => { vlAdd(s, 3); const d = Math.round(s.st.dengi * 0.1); return { dengi: -d, mil: -25, dol: Math.round(d / 4) }; }, txt: 'Твои деньги теперь чистые. Почти.' },
    { t: 'Купить нужного депутата', req: { dengi: 250 }, fx: s => { vlAdd(s, 10); return { dengi: -250, flag: 'svoy_deputat' }; }, txt: 'У тебя свой голос в горсовете.' }] });
def('v_shod', { mode: 'any', repeat: true, title: 'Сходняк', bg: 't_9_restoran',
  lines: S => ['Отдельный кабинет ресторана. За столом — те, кто держит город.',
    ['hasan', `Мы тебя знаем, ${HN(S)}. Ты молодой, но с головой. Город большой — места хватит всем, если без беспредела.`],
    ['baron', 'Я предлагаю делить по-деловому: рынки — тебе, банки — мне, спорт — Тагиру.', 'smile'],
    ['tatarin', 'А я предлагаю делить по-спортивному. Кто сильнее — тот и прав.', 'angry']],
  choices: S => [
    { t: 'Поддержать Хасана: «по понятиям»', fx: s => { vlAdd(s, 10); return { flag: 'hasan_drug', avt: 8 }; }, txt: 'Старый вор кивает. Тебе отходят рынки и вокзал. Барон улыбается, но не глазами.' },
    { t: 'Поддержать Барона: «по-деловому»', fx: s => { vlAdd(s, 8); return { flag: 'baron_drug', dengi: 200 }; }, txt: 'Деловые люди — деловые решения. Деньги текут, а Хасан смотрит на тебя как на чужого.' },
    { t: 'Выступить против Тагира', fx: fight('Тагир «Борец» и его спортсмены', 5, 9 + Math.round(S.vl / 20), { txt: 'Спортсмены разбиты. Тагир уехал в Москву. Город — твой и стариков.', fx: { flag: 'tagir_down', avt: 15 } }, { txt: 'Спортсмены сильнее. Влияние уходит к Тагиру.', fx: { zdor: -30, flag: 'tagir_win' } }, { flee: false }), go: 'k_fight' },
    { t: 'Объявить себя хозяином города', if: s => s.vl >= 70, chk: ['yaz', 10], ok: { txt: 'Тишина. Потом Хасан встаёт и жмёт тебе руку. Ты — хозяин города.', fx: s => { vlAdd(s, 20); return { flag: 'hozyain', avt: 20 }; } },
      no: { txt: 'Тебя слушают молча. Ночью твой «Мерседес» взрывается у ресторана — пустой. Это предупреждение.', fx: s => { vlAdd(s, -15); return { mil: 20 }; } } }] });

// ---- задания девяностых (старые «школьные» уходят) ----
const PRE90 = ['j_zapiska', 'j_sobranie', 'j_ovoshebaza', 'j_r1_shkola', 'j_r1_kino', 'j_a_brat_dvoika', 'j_kiosk', 'j_r2_bilety', 'j_egg_kasseta', 'j_s_zapis', 'obshak', 'skorl', 'j_podezd', 'j_sportzal', 'j_r1_metka', 'j_r1_trenirovka', 'j_r2_turnik', 'j_r2_dk', 'j_r3_avtomaty', 'j_r4_sbor', 'j_sv_spletni'];
const J9 = (id, o) => ({ id, min: 0, era90: true, gen: () => ({}), ...o });
const JOBS90 = [
  J9('j_9_kiosk', { bg: 't_9_brigada', who: 'koop', title: () => 'Ларёчник не платит', text: () => 'Новый ларёк у остановки: «Сникерсы», «Амаретто», кассеты. Хозяин говорит, что уже платит «спортсменам».',
    choices: S => [{ t: 'Перекупить его у спортсменов', chk: ['yaz', 6], ok: { txt: 'Теперь он платит тебе. Спортсмены не в курсе — пока.', fx: s => { vlAdd(s, 2); if (typeof addPoint === 'function') addPoint('Ларёк у остановки', 12); return {}; } }, no: { txt: 'Спортсмены приехали на разборку.', go: 'f_random' } },
      { t: 'Сжечь ларёк для острастки', fx: { mil: 15, sovest: -10, avt: 4 }, txt: 'Утром на остановке — чёрный остов. Остальные ларёчники всё поняли.' }] }),
  J9('j_9_chelnok', { bg: 't_9_rynok', who: 'babka:Челночница', title: () => 'Челноки с Турции', text: () => 'Челночницы привезли из Стамбула клетчатые сумки с кожанками. Рынок требует с них «за место». Женщины плачут.',
    choices: S => [{ t: 'Взять по-божески', fx: { dengi: 30, sovest: -2 }, txt: 'Плачут меньше. Платят исправно.' }, { t: 'Взять всё', fx: { dengi: 70, sovest: -10, avt: 3 }, txt: 'Сумки опустели. Челночницы больше не приедут на этот рынок.' },
      { t: 'Пожалеть', fx: s => { vlAdd(s, 1); return { sovest: 6 }; }, txt: 'Одна из них потом шьёт тебе кожаный плащ бесплатно.' }] }),
  J9('j_9_inomarka', { bg: 't_r_trassa', who: 'moskvich', title: () => 'Иномарка из Германии', text: () => '«Ауди-сотка» пригнана из Германии. Документы — мутные. Надо переоформить через своего гаишника.',
    choices: S => [{ t: 'Переоформить и продать', chk: ['um', 6], ok: { txt: 'Машина ушла за полторы тысячи долларов.', fx: { dol: 60, mil: 5 } }, no: { txt: 'Машина в угоне в Германии. Интерпол.', fx: { mil: 25 } } }] }),
  J9('j_9_kazino', { once: true, bg: 't_r_kazino', who: 'baron', title: () => 'Долг в казино', text: () => 'Сын замминистра проиграл в казино Барона двадцать тысяч долларов и не отдаёт. Барон просит «напомнить».',
    choices: S => [{ t: 'Напомнить вежливо', chk: ['yaz', 7], ok: { txt: 'Замминистра сам привёз деньги. Барон доволен, ты — в доле.', fx: s => { vlAdd(s, 4); return { dol: 100, flag: 'baron_drug' }; } }, no: { txt: 'Замминистра позвонил в МВД.', fx: { mil: 30 } } },
      { t: 'Отказаться: с такими не связываюсь', fx: { sovest: 3 }, txt: 'Барон записал тебя в «ненадёжные».' }] }),
  J9('j_9_piramida', { once: true, bg: 't_9_vaucher', who: 'student', title: () => '«Казанский вкладчик»', text: () => 'Студент открыл финансовую компанию: обещает вкладчикам триста процентов годовых. Нужна крыша и лицо, которому верят.',
    choices: S => [{ t: 'Стать лицом пирамиды', fx: { dengi: 400, sovest: -15, mil: 20, flag: 'piramida' }, txt: 'Пенсионеры несут последние деньги. Через полгода касса пуста, а у твоего подъезда — толпа обманутых.' },
      { t: 'Предупредить людей', fx: s => { vlAdd(s, 5); return { sovest: 12, flag: 'student_vrag' }; }, txt: 'Пирамида лопнула раньше времени. Студент тебя ненавидит. Старики благодарят.' }] }),
  J9('j_9_vodka', { bg: 't_r_vodka', who: 'tatarin', title: () => 'Палёная водка', text: () => 'Тагир гонит «водку» из технического спирта. Двое отравились насмерть. Он предлагает долю за молчание.',
    choices: S => [{ t: 'Взять долю', fx: { dengi: 120, sovest: -15 }, txt: 'Деньги пахнут спиртом и смертью.' }, { t: 'Сдать цех Хабибуллину', if: s => !!s.flags.habib_drug, fx: s => { vlAdd(s, 4); return { sovest: 12, flag: 'tagir_vrag' }; }, txt: 'Цех закрыт. Тагир знает, кто это сделал.' },
      { t: 'Разгромить цех самому', go: 'f_random', fx: { sovest: 8, avt: 6, flag: 'tagir_vrag' } }] }),
  J9('j_9_zabastovka', { bg: 't_9_zavod', who: 'muzhik:Бригадир цеха', title: () => 'Забастовка на заводе', text: () => 'Рабочим восемь месяцев не платят. Они перекрыли трассу. Хозяева завода просят тебя «разогнать».',
    choices: S => [{ t: 'Разогнать', fx: { dengi: 100, sovest: -12, avt: 4 }, txt: 'Трасса свободна. Рабочие запомнили твоё лицо.' }, { t: 'Выбить им зарплату у хозяев', chk: ['yaz', 7], ok: { txt: 'Хозяева платят. Рабочие несут тебе хлеб-соль.', fx: s => { vlAdd(s, 6); return { sovest: 12, flag: 'rabochie_za_tebya' }; } }, no: { txt: 'Хозяева пожаловались в Москву.', fx: VL(-3) } }] }),
  J9('j_9_chechnya', { bg: 't_r_vokzal', who: 'bacha', title: () => 'Вернулся из Чечни', text: () => 'Парень с твоего двора вернулся из Грозного. Без ноги, без работы, без будущего. Стоит у вокзала с табличкой.',
    choices: S => [{ t: 'Взять в охрану, дать работу', fx: s => { vlAdd(s, 3); return { sovest: 10, uvazh: 4 }; }, txt: 'Он охраняет твой ресторан. За тебя он пойдёт куда угодно.' }, { t: 'Дать денег (30 р.)', req: { dengi: 30 }, fx: { dengi: -30, sovest: 5 }, txt: 'Он кивает. Молча.' }] }),
  J9('j_9_pejdzher', { bg: 't_9_brigada', who: null, title: () => 'Сообщение на пейджер', text: () => '«СРОЧНО. ПАРКОВКА У ЦУМА. 22:00. ОДИН». Без подписи. Пейджер пищит ещё дважды.',
    choices: S => [{ t: 'Поехать одному', chk: ['lovk', 6], ok: { txt: 'Это был человек от Хасана с важной информацией. Ты на шаг впереди.', fx: s => { vlAdd(s, 3); return { flag: 'hasan_drug' }; } }, no: { txt: 'Это была засада.', go: 'f_random' } },
      { t: 'Поехать с охраной', fx: { avt: 2 }, txt: 'На парковке никого. Кто-то проверял, насколько ты осторожен.' }, { t: 'Не ехать', txt: 'Пейджер замолкает. Утром ты узнаёшь, что на парковке взорвали машину.' }] }),
  J9('j_9_vybory', { once: true, bg: 't_r_vybory', who: 'baron', min: 3, title: () => 'Губернаторские выборы', text: () => 'Нужно «правильно» проголосовать три района. Бюллетени, автобусы, водка для пенсионеров.',
    choices: S => [{ t: 'Обеспечить результат', fx: s => { vlAdd(s, 8); return { sovest: -8, dengi: 150 }; }, txt: 'Кандидат победил с перевесом в полпроцента. Ты теперь вхож в кабинеты.' }, { t: 'Отказаться', fx: { sovest: 4 }, txt: 'Барон делает это без тебя. И запоминает.' }] }),
  J9('j_9_dom', { once: true, bg: 't_n_podezd', who: 'babka:Соседка', title: () => 'Расселение дома', text: () => 'Старый дом в центре под снос: место для офиса Барона. Старики не хотят уезжать на окраину.',
    choices: S => [{ t: 'Выдавить жильцов', fx: { dengi: 150, sovest: -15, avt: 4 }, txt: 'Подъезды пустеют. Одна старушка умирает через месяц в новой квартире.' }, { t: 'Выбить им нормальные квартиры', chk: ['yaz', 7], ok: { txt: 'Старики переезжают в новые дома в соседнем районе. Дом снесли, но по-людски.', fx: s => { vlAdd(s, 5); return { sovest: 10 }; } }, no: { txt: 'Барон не согласен. Ссора.', fx: VL(-3) } }] }),
  J9('j_9_metal', { bg: 't_9_barter', who: 'student', title: () => 'Цветмет за границу', text: () => 'Пять вагонов медных проводов со старых линий. Через Эстонию — как «лом». В Европе за это платят долларами.',
    choices: S => [{ t: 'Отправить', chk: ['um', 7], ok: { txt: 'Пять вагонов — сто тысяч долларов. Половина — тебе.', fx: { dol: 100, mil: 10 } }, no: { txt: 'Вагоны арестованы на границе.', fx: { mil: 35 } } }] }),
];
JOBS90.forEach(t => { TASKS.push(t); TPL[t.id] = t; });

// ---- гардероб девяностых: до 1992 — «???», потом открывается по влиянию ----
const W90 = [
  ['o_9_malinovy', 'outer', 'Малиновый пиджак', 120, 10, { yaz: 2 }, { k: 'blazer', c: '#b0204a' }, 'Двубортный, малиновый. Униформа нового хозяина жизни.'],
  ['o_9_plashch', 'outer', 'Кожаный плащ до пят', 160, 20, { sila: 1, yaz: 1 }, { k: 'coat', c: '#0e0e10', fur: null }, 'Турецкая кожа, до пят. Едет — шуршит.'],
  ['o_9_kashemir', 'outer', 'Кашемировое пальто', 220, 40, { yaz: 2, um: 1 }, { k: 'coat', c: '#2a2a32', fur: null }, 'Тёмно-серое, итальянское. Так ходят те, кто уже не бегает.'],
  ['o_9_kostyum', 'outer', 'Спортивный костюм «Абибас-90»', 60, 5, { lovk: 1 }, { k: 'zip', c: '#1a1a6a', s: '#e8e8f0', n: 3, col: '#e8e8f0' }, 'Синий, с тремя полосками. Девяностые начинаются со спорткостюма.'],
  ['o_9_shelk', 'outer', 'Ветровка «Монтана»-шуршун', 70, 5, { lovk: 1 }, { k: 'zip', c: '#6a2a8a', s: '#2ac0a0', n: 2, col: '#e8c040' }, 'Фиолетово-бирюзовая. Шуршит на весь район.'],
  ['o_9_kozhanka', 'outer', 'Косуха «Бригада»', 140, 25, { sila: 2 }, { k: 'leather', c: '#0a0a0a', hl: '#5a5a62', zipd: true }, 'Чёрная кожа с заклёпками. Её узнают с другого конца рынка.'],
  ['s_9_vodolazka', 'shirt', 'Чёрная водолазка', 40, 5, { yaz: 1 }, { k: 'turtle', c: '#121214' }, 'Под пиджак. Без галстука, но со вкусом.'],
  ['s_9_rubaha', 'shirt', 'Шёлковая рубаха с узором', 70, 20, { yaz: 1 }, { k: 'hawaii', c: '#6a1a2a' }, 'Расстёгнута до третьей пуговицы. Голда наружу.'],
  ['p_9_klassika', 'pants', 'Брюки со стрелками', 50, 10, { yaz: 1 }, { k: 'plain', c: '#151515' }, 'Отглаженные. В таких не бегают — на таких ездят.'],
  ['p_9_sport', 'pants', 'Штаны «Абибас-90»', 40, 5, { lovk: 1 }, { k: 'stripes', c: '#1a1a6a', s: '#e8e8f0', n: 3 }, 'К пиджаку и к костюму — универсально.'],
  ['f_9_tufli', 'shoes', 'Лакированные итальянские туфли', 90, 15, { yaz: 1 }, { k: 'tufli', c: '#0a0a0a' }, 'Блестят так, что видно отражение. Ходят в них только по коврам.'],
  ['f_9_kross', 'shoes', 'Кроссовки «Рибок»', 60, 5, { lovk: 1 }, { k: 'sneaker', c: '#f8f8f8', s: '#c8202a', sole: '#e8e0c8' }, 'Белые, с красной полоской. Настоящие — не китай.'],
  ['h_9_norka', 'hat', 'Норковая кепка', 130, 30, { yaz: 2 }, { k: 'flat', c: '#3a2a1e', c2: '#2a1a12' }, 'Норка. Зимой и летом. Символ статуса.'],
  ['a_9_golda', 'acc', 'Голда в палец толщиной', 200, 35, { yaz: 2 }, { k: 'chain' }, 'Золотая цепь в палец. Звенит, когда смеёшься.'],
  ['a_9_rolex', 'acc', 'Часы «Ролекс» (настоящие)', 300, 50, { um: 1, yaz: 1 }, { k: 'watch', c: '#e5c04a' }, 'Настоящие. Их снимают только вместе с рукой.'],
  ['a_9_ochki', 'acc', 'Тёмные очки «Рэй-Бэн»', 80, 15, { yaz: 1 }, { k: 'glasses', c: '#0a0a0a' }, 'Ночью тоже. Особенно ночью.'],
  ['a_9_chetki', 'acc', 'Янтарные чётки', 60, 20, { um: 1 }, { k: 'beads' }, 'Перебираешь, когда думаешь. Думаешь много.'],
  ['a_9_trubka', 'acc', 'Сотовый «Моторола»', 250, 45, { um: 1, yaz: 1 }, { k: 'phone' }, 'Размером с кирпич. Звонит — все оборачиваются.'],
  ['w_9_makarov', 'wpn', 'Пистолет Макарова', 220, 30, { sila: 4 }, { k: 'pistol', c: '#2a2a30' }, 'Штатный, с потёртой рукоятью. Ты не спрашиваешь, у кого его забрали.', { hit: 4, heat: 16, sovest: -6 }],
];
for (const [id, slot, name, price, vl, bonus, v, desc, wp] of W90) { const it = { id, slot, name, price, era90: true, vl, bonus, v, desc, ...(wp ? { wp } : {}) }; ITEMS.push(it); ITEM[id] = it; SHOP.push(it); }
const lock90 = i => i.era90 && (!era90(S) || (S.vl || 0) < i.vl);
