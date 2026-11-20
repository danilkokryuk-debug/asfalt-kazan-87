// Режим «Карьера»: случайная судьба, цель со сроком, доска заданий, живая карта, хардкор.
// По мотивам Hoosegow: каждый забег — новый персонаж, мета-прогресс между забегами.

const dayNum = (y, m, d) => Math.round((new Date(y, m - 1, d) - new Date(1987, 8, 1)) / 864e5) + 1;
const pick = a => a[rnd(a.length)];
const myLand = S => DISTRICTS.filter(d => S.gang && S.ctrl[d.id] === S.gang).map(d => d.id);
const gangOf = id => DIST[id].gang;
// чужие районы, граничащие с нашими
function targets(S) {
  const mine = new Set(myLand(S));
  return DISTRICTS.filter(d => S.ctrl[d.id] && S.ctrl[d.id] !== S.gang && [...NEIGHBORS[d.id]].some(n => mine.has(n))).map(d => d.id);
}

// --- Судьба ----------------------------------------------------------------------------
const FATE_NAMES = ['Андрей', 'Ринат', 'Серёга', 'Ильнур', 'Димка', 'Айдар', 'Рустам', 'Олег', 'Вовка', 'Тимур', 'Костя', 'Женька', 'Радик', 'Лёха', 'Наиль', 'Санька'];
// у каждой черты есть плюс и минус, чтобы не было дисбаланса
const TRAITS = [
  { id: 'boxer', name: 'Ходил на бокс', desc: 'Сила +1, Смекалка −1', st: { sila: 1, um: -1 } },
  { id: 'otlichnik', name: 'Отличник', desc: 'Смекалка +1, Сила −1', st: { um: 1, sila: -1 } },
  { id: 'balabol', name: 'Балабол', desc: 'Язык +1, Ловкость −1', st: { yaz: 1, lovk: -1 } },
  { id: 'begun', name: 'Бегал за школу', desc: 'Ловкость +1, Язык −1', st: { lovk: 1, yaz: -1 } },
  { id: 'brat', name: 'Брат сидит', desc: 'Уважение +15, внимание милиции +15', st: { uvazh: 15, mil: 15 } },
  { id: 'mentovskoy', name: 'Отец — милиционер', desc: 'Милиция не трогает (−20), но свои не доверяют (уважение −10)', st: { mil: -20, uvazh: -10 } },
  { id: 'detdom', name: 'Детдомовский', desc: 'Семьи нет, но ты злой: Сила +1, Семья 0', st: { sila: 1, semya: -100 } },
  { id: 'fartsa', name: 'Фарцует с детства', desc: 'Деньги +30, Совесть −15', st: { dengi: 30, sovest: -15 } },
];
const GOALS = [
  { id: 'avtor', text: 'Стать автором моталки до весны 1989 года', until: dayNum(1989, 3, 1), ok: S => S.rank >= 5 },
  { id: 'starsh', text: 'Стать старшим до осени 1988 года', until: dayNum(1988, 9, 1), ok: S => S.rank >= 4 },
  { id: 'land', text: 'Твоя моталка держит 5 районов — до лета 1988', until: dayNum(1988, 6, 1), ok: S => myLand(S).length >= 5 },
  { id: 'money', text: 'Накопить 1500 рублей до конца 1988 года', until: dayNum(1988, 12, 31), ok: S => S.st.dengi >= 1500 },
];
const goalOf = S => GOALS.find(g => g.id === S.goal);

function rollFate() {
  const app = {}; for (const k of Object.keys(LOOKS)) app[k] = pick(Object.keys(LOOKS[k]));
  const st = { sila: 2, lovk: 2, um: 2, yaz: 2 };
  // бюджет как в кампании (12 очков), случайно разбросан, максимум 4
  for (let n = 4; n > 0;) { const k = pick(Object.keys(st)); if (st[k] < 4) { st[k]++; n--; } }
  const start = k => SHOP.filter(i => i.slot === k && (i.start || meta().unlocked.includes(i.id)));
  const wear = { hat: pick(start('hat')).id, outer: pick(start('outer')).id, shirt: pick(start('shirt')).id,
    pants: pick(start('pants')).id, shoes: pick(start('shoes')).id, acc: [] };
  return { name: pick(FATE_NAMES), app, st, wear, home: pick(DISTRICTS.filter(d => d.gang)).id,
    fam: pick(['mother', 'full', 'drunk']), trait: pick(TRAITS).id, goal: pick(GOALS).id };
}

function careerNew(mode = 'career') {
  if (typeof mode !== 'string') mode = 'career';
  const surv = mode === 'surv';
  let f = rollFateSeeded((Math.random() * 2 ** 31) >>> 0), rerolls = 3, daily = null;
  const fams = { mother: 'Мать одна', full: 'Полная семья', drunk: 'Отец пьёт' };
  const draw = () => {
    const tr = TRAITS.find(t => t.id === f.trait);
    $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
    $('#main').innerHTML = `<div class="scene"><div class="when">${surv ? 'Выживание чушпана' : 'Карьера'} · новая судьба</div>
      <div class="herohead"><canvas class="sprite big" id="spr"></canvas><div>
        <h2>${f.name}</h2><div class="sub">${lookText(f.app)}.<br>${DIST[f.home].name} — «${DIST[f.home].gang}».<br>${fams[f.fam]}.</div></div></div>
      <div class="grid">${Object.keys(STATS).map(k => `<div class="stat">${NAMES[k]}<span class="v">${f.st[k] + (tr.st[k] || 0)}</span></div>`).join('')}</div>
      <div class="result">Черта: <b>${tr.name}</b> — ${tr.desc}</div>
      <div class="result ok">Цель: <b>${surv ? 'Дожить до Нового года, не пришиваясь ни к кому' : goalOf(f).text}</b></div>
      <p class="note">${surv ? 'Каждый день трясут всё чаще. Пришьёшься — проиграл. Смерть или тюрьма — конец.' : 'Смерть или тюрьма — конец забега. Задания берёшь у старших на вкладке «Задания».'}</p>
      <div class="result">Код судьбы: <b>${fateCode(f.seed)}</b>${daily ? ' · <b>вызов дня</b> — у всех сегодня эта судьба' : ''}</div>
      <div class="choices">
        <button class="btn main" id="go">Начать жизнь</button>
        <button class="btn" id="rr" ${rerolls ? '' : 'disabled'}>Другая судьба (осталось ${rerolls})</button>
        <button class="btn" id="dl">Вызов дня: одна судьба на всех</button>
        <button class="btn" id="cd">Ввести код друга</button>
        <button class="btn" id="back">Назад</button></div></div>`;
    drawHero($('#spr'), f.app, f.wear);
    $('#rr').onclick = () => { rerolls--; daily = null; f = rollFateSeeded((Math.random() * 2 ** 31) >>> 0); AUDIO.click(); draw(); };
    $('#dl').onclick = () => { daily = new Date().toLocaleDateString('ru-RU'); f = rollFateSeeded(todaySeed() * (surv ? 7 : 3)); AUDIO.click(); draw(); };
    $('#cd').onclick = () => { const c = prompt('Код судьбы (например КЗН-1A2B3C):'); const s = c && codeSeed(c); if (s) { daily = null; f = rollFateSeeded(s); AUDIO.ok(); draw(); } };
    $('#back').onclick = titleScreen;
    $('#go').onclick = () => { surv ? startSurv(f) : startCareer(f); S.seed = f.seed; S.daily = daily; save('auto'); };
  };
  draw();
}

function startCareer(f) {
  S = newState({ name: f.name, app: f.app, wear: f.wear, home: f.home, fam: f.fam,
    dengi: f.fam === 'full' ? 15 : 5, semya: f.fam === 'drunk' ? 30 : 65 });
  S.mode = 'career'; S.goal = f.goal; S.trait = f.trait;
  S.owned = [...new Set([...S.owned, ...meta().unlocked, ...wornIds(f.wear)])];
  Object.assign(S.st, f.st);
  applyFx(TRAITS.find(t => t.id === f.trait).st);
  S.flags.enemy = pickEnemy(S);
  S.board = genBoard(S); S.boardDay = 1;
  log(`Судьба: ${S.name}, ${DIST[S.home].name}. Цель — ${goalOf(S).text.toLowerCase()}.`);
  dropSave('slot1', 'career');
  save('auto'); view = 'map';
  card([S.name, DIST[S.home].name + ', 1987', goalOf(S).text], toMap, 3200);
}

// --- Задания -------------------------------------------------------------------------------
// Шаблон: min/max ранг, gen(S) → параметры или null, title/text(p), choices(S, p).
// Бой: fx ставит S.kf (параметры боя, только простые данные — сохраняются), go: 'k_fight'.
const fight = (name, hp, pow, win, lose, extra = {}) => S => { S.kf = { name, hp, pow, win, lose, ...extra }; };
const TASKS = [
  { id: 'prish', min: 0, max: 0, gen: S => S.gang ? null : {},
    title: () => `Пришиться к «${G(S)}»`,
    text: () => `Старшие «${G(S)}» согласны на тебя посмотреть. Проверка простая: круг против супера. Упал — встал. Побежал — до свидания.`,
    choices: S => [
      { t: 'Выйти в круг', fx: fight('Супер', 3, 4, { txt: 'Тебя хлопают по плечу. Ты свой.', fx: { join: true, rank: 1, uvazh: 15, avt: 5 } },
        { txt: 'Ты падал и вставал. Этого хватило.', fx: { join: true, rank: 1, uvazh: 5 } }, { flee: false }), go: 'k_fight' },
      { t: 'Не сейчас' },
    ] },
  { id: 'obshak', min: 1, max: 3, gen: () => ({}),
    title: () => 'Общак',
    text: () => 'Старшие ждут денег в общак. С чушпанов района — по рублю в неделю.',
    choices: S => [
      { t: 'Трясти жёстко', fx: { avt: 4, uvazh: 3, sovest: -8, mil: 6, dengi: 2 }, txt: 'Собрал. Чушпаны обходят тебя за километр.' },
      { t: 'Договориться без рук', chk: ['yaz', 4 + S.rank], ok: { txt: 'Платят без слёз. Почти честная сделка.', fx: { avt: 3, uvazh: 2, dengi: 1 } },
        no: { txt: 'Тебя не боятся. Половина отказалась.', fx: { uvazh: -3 } } },
      { t: 'Доложить своих 5 р.', req: { dengi: 5 }, fx: { dengi: -5, avt: 2, uvazh: 2, sovest: 2 }, txt: 'Никто не узнает, откуда деньги.' },
    ] },
  { id: 'dezhur', min: 1, max: 4, gen: () => ({}),
    title: () => 'Дежурство у ДК',
    text: () => 'Субботняя дискотека. Задача — чтобы чужие не лезли к нашим девчонкам и не пели свои песни.',
    choices: S => [
      { t: 'Стоять у входа до конца', chk: ['sila', 3 + S.rank], ok: { txt: 'Чужие посмотрели на тебя и передумали.', fx: { avt: 4, uvazh: 3 } },
        no: { txt: 'Чужие не передумали.', fx: fight('Чужие на танцах', 3, 4 + S.rank, { fx: { avt: 5, uvazh: 4 } }, { fx: { uvazh: -2 } }), go: 'k_fight' } },
      { t: 'Слинять пораньше', fx: { uvazh: -4 }, txt: 'Ты ушёл. Кто-то это заметил.' },
    ] },
  { id: 'razv', min: 1, max: 4, gen: S => { const t = targets(S); return t.length ? { d: pick(t) } : null; },
    title: p => `Разведка: ${DIST[p.d].name}`,
    text: p => `Надо узнать, сколько пацанов у «${gangOf(S.ctrl[p.d])}» на ${DIST[p.d].name} и где они собираются.`,
    choices: (S, p) => [
      { t: 'Пройтись дворами', chk: ['lovk', 4 + S.rank], ok: { txt: 'Всё посчитал, никто не заметил.', fx: s => { s.flags['scout_' + p.d] = 1; return { avt: 3 }; } },
        no: { txt: 'Заметили.', fx: fight('Местные', 3, 4 + S.rank, { fx: { avt: 4 } }, { fx: { zdor: -5 } }), go: 'k_fight' } },
      { t: 'Расспросить знакомую девчонку оттуда', chk: ['yaz', 5 + S.rank], ok: { txt: 'Она рассказала всё, и даже больше.', fx: s => { s.flags['scout_' + p.d] = 1; return { avt: 2, lyub: 3 }; } },
        no: { txt: 'Она рассказала всё своему парню.', fx: { uvazh: -2 } } },
    ] },
  { id: 'dolg', min: 2, gen: () => ({ who: pick(['кооператор с ларьком', 'спекулянт джинсами', 'мясник с рынка', 'таксист-«бомбила»']) }),
    title: () => 'Вернуть долг',
    text: p => `${p.who[0].toUpperCase() + p.who.slice(1)} задолжал старшим и не торопится отдавать.`,
    choices: (S, p) => [
      { t: 'Поговорить убедительно', chk: ['yaz', 5 + S.rank], ok: { txt: 'Отдал всё, ещё и чаю налил. Большая часть ушла в общак.', fx: { dengi: pay(10 * S.rank), avt: 4, mil: 4 } }, no: { txt: 'Послал тебя. Вежливо, но послал.', fx: { uvazh: -3 } } },
      { t: 'Надавить силой', chk: ['sila', 4 + S.rank], ok: { txt: 'Деньги в общак, твоя доля в кармане. Человек в синяках.', fx: { dengi: pay(12 * S.rank), avt: 5, mil: 10, sovest: -6 } }, no: { txt: 'Он вызвал милицию.', fx: { mil: 14, zdor: -8 } } },
      { t: 'Отказаться', fx: { uvazh: -5 }, txt: 'Старшие запомнили.' },
    ] },
  { id: 'nabeg', min: 2, gen: S => { const t = targets(S); return t.length ? { d: pick(t) } : null; },
    title: p => `Набег на ${DIST[p.d].name}`,
    text: (p) => `Старшие дают добро: идём на ${DIST[p.d].name}. Асфальт держит «${gangOf(S.ctrl[p.d])}». Возьмём — район наш.${S.flags['scout_' + p.d] ? '\n\nТы там всё разведал: знаешь, где их подъезды и подворотни.' : ''}`,
    choices: (S, p) => [
      { t: 'Вести пацанов', fx: fight(gangOf(S.ctrl[p.d]), 4, 4 + S.rank - (S.flags['scout_' + p.d] ? 1 : 0),
        { txt: `${DIST[p.d].name} — наш асфальт!`, fx: { avt: 12, uvazh: 8, mil: 8, ctrl: { [p.d]: S.gang } } },
        { txt: 'Отбились. Уходим.', fx: { uvazh: -5, zdor: -10, mil: 5 } }), go: 'k_fight' },
      { t: 'Отложить', txt: 'Не сегодня.' },
    ] },
  { id: 'menty', min: 2, gen: () => ({ who: pick(['Шкет', 'Сопля', 'Кузя', 'Мелкий', 'Пятак']) }),
    title: p => `Вытащить ${p.who}`,
    text: p => `Пацана из скорлупы по кличке ${p.who} взяли менты. Будут колоть на своих. Надо вытащить, пока не раскололся.`,
    choices: (S, p) => [
      { t: 'Придумать ему алиби', chk: ['um', 5 + S.rank], ok: { txt: 'Через три свидетеля и одну справку — отпустили.', fx: { uvazh: 8, avt: 3 } }, no: { txt: 'Алиби развалилось. Теперь вопросы и к тебе.', fx: { mil: 10 } } },
      { t: 'Занести 20 р. дежурному', req: { dengi: 20 }, fx: { dengi: -20, uvazh: 6 }, txt: 'Деньги решают.' },
      { t: 'Не лезть', fx: { uvazh: -6 }, txt: `${p.who} просидел трое суток. Своих он не сдал. А вот тебя запомнил.` },
    ] },
  { id: 'rynok', min: 3, gen: () => ({}),
    title: () => 'Рынок',
    text: () => 'Ряды на Колхозном рынке платят то одним, то другим. Пора сделать так, чтобы платили нам.',
    choices: S => [
      { t: 'Договориться с торгашами', chk: ['yaz', 5 + S.rank], ok: { txt: 'Каждую неделю — конверт. Пока не отожмут.', fx: s => { addPoint('Ряды на рынке', 5 * s.rank); return { avt: 6, mil: 5 }; } },
        no: { txt: 'Торгаши позвали своих.', fx: fight('Рыночные', 4, 5 + S.rank, { fx: { avt: 6 } }, { fx: { zdor: -10 } }), go: 'k_fight' } },
    ] },
  { id: 'mir', min: 3, gen: S => { const t = targets(S); return t.length ? { g: S.ctrl[pick(t)] } : null; },
    title: p => `Сходка с «${gangOf(p.g)}»`,
    text: p => `Старшие «${gangOf(p.g)}» предлагают поговорить. Можно замириться, а можно показать, кто тут главный.`,
    choices: (S, p) => [
      { t: 'Договориться о мире', chk: ['yaz', 6 + S.rank], ok: { txt: 'Мир на полгода. Набегов от них не будет.', fx: s => { s.flags['peace_' + p.g] = s.day + 180; return { avt: 6 }; } }, no: { txt: 'Не договорились. Разошлись злые.', fx: { uvazh: -3 } } },
      { t: 'Наехать по-жёсткому', fx: fight(gangOf(p.g), 4, 5 + S.rank, { fx: { avt: 10, uvazh: 6, mil: 8 } }, { fx: { uvazh: -6, zdor: -10 } }), go: 'k_fight' },
    ] },
  { id: 'farca', min: 1, gen: () => ({ who: pick(['финны у гостиницы «Татарстан»', 'немцы-туристы у Кремля', 'моряк из загранки', 'студенты-арабы из общаги']) }),
    title: () => 'Валютная сделка',
    text: p => `${p.who[0].toUpperCase() + p.who.slice(1)} меняют доллары и джинсы. Можно взять — но ОБХСС не дремлет.`,
    choices: S => [
      { t: 'Провернуть сделку', chk: ['yaz', 4 + S.rank], ok: { txt: 'Зелёные в кармане. Сердце колотится.', fx: { dol: 3 + S.rank * 2, mil: 5, avt: 2 } },
        no: { txt: 'Подстава. Из-за угла выходит дружинник с повязкой.', fx: { mil: 18 }, go: 'r_militia' } },
      { t: 'Не связываться', txt: 'Валюта — это статья. Ну её.' },
    ] },
  { id: 'skorl', min: 3, gen: () => ({}),
    title: () => 'Натаскать скорлупу',
    text: () => 'Пришила новая скорлупа: десяток пацанов, глаза горят, кулаки чешутся. Их надо учить.',
    choices: S => [
      { t: 'Учить по-умному', chk: ['um', 4 + S.rank], ok: { txt: 'Скорлупа за тобой в огонь и в воду.', fx: { uvazh: 7, avt: 3 } }, no: { txt: 'Они тебя не поняли.', fx: { uvazh: -2 } } },
      { t: 'Гонять до седьмого пота', fx: { uvazh: 3, sovest: -3, sila: 0 }, txt: 'Боятся. Уважают? Это вопрос.' },
    ] },
  { id: 'krysha', min: 4, gen: () => ({ what: pick(['видеосалон', 'кооперативное кафе', 'автомастерская', 'ларёк с жвачкой']) }),
    title: p => `Крыша: ${p.what}`,
    text: p => `Новый ${p.what} открылся на твоей земле. Кооператоры. Деньги у них есть, а защиты нет.`,
    choices: (S, p) => [
      { t: 'Предложить защиту', chk: ['yaz', 6 + S.rank], ok: { txt: 'Каждую неделю — конверт. Кооперация, однако.', fx: s => { addPoint(p.what[0].toUpperCase() + p.what.slice(1), 15); return { avt: 8, mil: 8, dengi: pay(30) }; } }, no: { txt: 'Они уже платят другим.', fx: { uvazh: -3 } } },
      { t: 'Не трогать', fx: { sovest: 3 }, txt: 'Пусть работают.' },
    ] },
];
const TPL = Object.fromEntries(TASKS.map(t => [t.id, t]));

function genBoard(S) {
  const ok = TASKS.filter(t => S.rank >= t.min && S.rank <= (t.max ?? 9));
  const out = [];
  for (const t of [...ok].sort(() => Math.random() - 0.5)) {
    const p = t.gen(S); if (p) out.push({ id: t.id, p });
    if (out.length >= 3) break;
  }
  return out;
}

def('k_task', {
  mode: 'career',
  title: S => TPL[S.kt.id].title(S.kt.p),
  bg: S => ({ dezhur: 'dk', rynok: 'rynok', menty: 'otdel', nabeg: 'pustyr', razv: 'dvor', mir: 'pustyr' })[S.kt.id] || 'korobka',
  lines: S => [[TPL[S.kt.id].who || 'starsh', TPL[S.kt.id].text(S.kt.p)]],
  choices: S => TPL[S.kt.id].choices(S, S.kt.p),
});
def('k_fight', {
  mode: 'career', title: S => 'Махач: ' + S.kf.name,
  text: S => `Против тебя «${S.kf.name}». Стой крепко.`,
  fight: { name: S => S.kf.name, hp: S => S.kf.hp, pow: S => S.kf.pow, call: true,
    flee: S => S.kf.flee === false ? false : { txt: 'Убежал. Об этом узнают.', fx: { uvazh: -5 } },
    win: S => S.kf.win, lose: S => S.kf.lose },
});

function renderTasks() {
  if (S.boardDay + 3 <= S.day) { S.board = genBoard(S); S.boardDay = S.day; }
  const g = goalOf(S), need = RANK_NEED[S.rank + 1];
  $('#main').innerHTML = `<div class="scene"><h2>Задания</h2>
    <div class="result ok">Цель: <b>${g.text}</b><br>Срок: ${dateStr(g.until)}</div>
    <div class="result">Ранг: <b>${RANKS[S.rank]}</b>${need ? ` · до «${RANKS[S.rank + 1]}»: авторитет ${S.st.avt}/${need.avt}, уважение ${S.st.uvazh}/${need.uvazh}${need.land ? `, районов ${myLand(S).length}/${need.land}` : ''}` : ' · вершина'}
    ${(S.points || []).length ? `<br>Доход с точек: ${pointsSum()} р. в неделю (потолок ранга ${CAP[S.rank]})` : ''}
    <br>Твоя доля с заданий: ${Math.round(SHARE[S.rank] * 100)}%, остальное — в общак</div>
    <p class="sub">Старшие раздают задания. Новые — раз в три дня. Каждое отнимает одно действие.</p>
    <div class="choices">${S.board.map((t, i) => `<div class="item"><div><b>${TPL[t.id].title(t.p)}</b>
      <div class="sub">${TPL[t.id].text(t.p).split('\n')[0]}</div></div>
      <button class="btn" data-k="${i}" ${S.ap ? '' : 'disabled'}>${S.ap ? 'Взяться' : 'Нет сил'}</button></div>`).join('') || `<p class="sub">Заданий пока нет. Новые будут ${dateStr(S.boardDay + 3)}.</p>`}</div></div>`;
  document.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    AUDIO.click(); S.kt = S.board.splice(+b.dataset.k, 1)[0]; S.ap--; play('k_task');
  });
}

// --- Повышения, набеги, войны -------------------------------------------------------------------
const RANK_NEED = [null, null, { avt: 60, uvazh: 25 }, { avt: 200, uvazh: 40 }, { avt: 420, uvazh: 55 }, { avt: 700, uvazh: 70, land: 4 }];
const canPromote = S => { const n = RANK_NEED[S.rank + 1]; return S.gang && n && S.st.avt >= n.avt && S.st.uvazh >= n.uvazh && (!n.land || myLand(S).length >= n.land); };

def('k_promo', {
  mode: 'career', repeat: true, trigger: canPromote,
  title: S => S.rank + 1 === 5 ? 'Сходка' : 'Повышение',
  text: S => S.rank + 1 === 5
    ? `Старый автор «${G(S)}» уходит: кто-то говорит, что в кооператоры, кто-то — что на зону. На сходке решают, кто встанет вместо него. Все смотрят на тебя.`
    : `На коробке старшие отводят тебя в сторону.\n— Ты, ${S.nick || S.name}, вырос. С сегодняшнего дня ты ${RANKS[S.rank + 1].toLowerCase()}.`,
  choices: S => S.rank + 1 === 5 ? [
    { t: 'Выступить на сходке', chk: ['yaz', 7], ok: { txt: 'Тишина. Потом один за другим кивают. Ты — автор.', fx: { rank: 5, uvazh: 10 } },
      no: { txt: 'Тебя не поддержали. Придётся доказывать ещё.', fx: { uvazh: -15, avt: -30 } } },
    { t: 'Положить на стол общак района', req: { dengi: 300 }, fx: { dengi: -300, rank: 5 }, txt: 'Деньги говорят громче слов. Ты — автор.' },
  ] : [{ t: 'Принять', fx: S => ({ rank: S.rank + 1, uvazh: 5 }), txt: 'Пацаны жмут руку. Скорлупа смотрит снизу вверх.' }],
});

def('k_raid', {
  // копия в S.raidCur: флаг снимается выбором, а заголовок экрана результата ещё нужен
  mode: 'career', repeat: true, trigger: S => S.flags.raid ? !!(S.raidCur = S.flags.raid) : false,
  title: S => `Набег на ${DIST[S.raidCur.d].name}!`,
  where: S => DIST[S.raidCur.d].name,
  text: S => `Прибегает скорлупа: «${gangOf(S.raidCur.g)}» пришли на ${DIST[S.raidCur.d].name}! Человек двадцать, с арматурой.`,
  choices: S => { const { d, g } = S.raidCur; return [
    { t: 'Собрать своих и отбить', fx: s => { s.at = d; fight(gangOf(g), 4, 4 + s.rank, { txt: 'Отбились!', fx: { avt: 6, uvazh: 6, unflag: 'raid' } },
      { txt: `${DIST[d].name} потерян.`, fx: { ctrl: { [d]: g }, uvazh: -4, unflag: 'raid' } })(s); }, go: 'k_fight' },
    { t: 'Отдать район без драки', fx: { ctrl: { [d]: g }, uvazh: -8, unflag: 'raid' }, txt: 'Пацаны молча смотрят на тебя.' },
  ]; },
});

function careerDay(S) {
  const g = goalOf(S);
  // конец забега помечаем, а экран покажет sleep() — иначе он перезапишет сохранение
  if (g.ok(S)) return (S.over = { win: true, reason: 'Цель выполнена: ' + g.text.toLowerCase() });
  if (S.day > g.until) return (S.over = { win: false, reason: 'Не успел: ' + g.text.toLowerCase() });
  if (S.day % 7) return;
  // соседи нападают на наши районы (кроме родного)
  if (S.gang && Math.random() < 0.5) {
    const mine = myLand(S).filter(d => d !== S.home);
    const opts = mine.flatMap(d => [...NEIGHBORS[d]].filter(n => S.ctrl[n] && S.ctrl[n] !== S.gang && !((S.flags['peace_' + S.ctrl[n]] || 0) > S.day) && repOf(S, S.ctrl[n]) < 60).map(n => ({ d, g: S.ctrl[n] })));
    if (opts.length) S.flags.raid = pick(opts);
  }
  // чужие моталки воюют между собой
  if (Math.random() < 0.3) {
    const wars = DISTRICTS.flatMap(d => [...NEIGHBORS[d.id]].filter(n => S.ctrl[d.id] && S.ctrl[n] && S.ctrl[n] !== S.ctrl[d.id]
      && S.ctrl[d.id] !== S.gang && S.ctrl[n] !== S.gang && d.id !== S.home).map(n => ({ d: d.id, g: S.ctrl[n] })));
    if (wars.length) { const w = pick(wars); log(`«${gangOf(w.g)}» отжали ${DIST[w.d].name} у «${gangOf(S.ctrl[w.d])}».`); S.ctrl[w.d] = w.g; }
  }
}

// --- Конец забега и летопись -----------------------------------------------------------------
function meta() {
  try { return JSON.parse(localStorage.getItem('asfalt_meta')) || { runs: [], unlocked: [] }; } catch (e) { return { runs: [], unlocked: [] }; }
}
function endCareer(win, reason) {
  S.ended = true;
  const m = meta();
  const slava = S.rank * 100 + S.st.avt + Math.floor(S.day / 10) + (win ? 500 : 0);
  let unlock = null;
  if (win || S.rank >= 2) {
    const pool = SHOP.filter(i => !i.start && !m.unlocked.includes(i.id));
    if (pool.length) { unlock = pick(pool); m.unlocked.push(unlock.id); }
  }
  m.runs.unshift({ name: S.name, nick: S.nick, home: S.home, rank: S.rank, days: S.day, reason, win, slava, date: dateStr(), mode: S.mode, daily: S.daily, code: S.seed && fateCode(S.seed) });
  m.runs = m.runs.slice(0, 30);
  try { localStorage.setItem('asfalt_meta', JSON.stringify(m)); } catch (e) {}
  noteEnding(reason);
  dropSave('auto', S.mode);
  win ? AUDIO.ok() : AUDIO.no();
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene"><div class="when">${dateStr()} · конец судьбы</div>
    <div class="herohead"><canvas class="sprite big" id="spr"></canvas><div>
      <h2>${win ? 'Получилось' : 'Конец'}</h2><div class="sub">${S.name}${S.nick ? ' «' + S.nick + '»' : ''}<br>${RANKS[S.rank]} «${DIST[S.gang || S.home].gang}»<br>Прожито дней: ${S.day}</div></div></div>
    <div class="result ${win ? 'ok' : 'no'}">${reason}</div>
    <div class="result">Слава: <b>${slava}</b> · Авторитет ${S.st.avt} · Районов ${myLand(S).length}</div>
    ${unlock ? `<div class="result ok">Открыта вещь для следующих судеб: <b>${unlock.name}</b></div>` : ''}
    <div class="choices"><button class="btn main" id="nf">Новая судьба</button><button class="btn" id="shr">Поделиться результатом</button><button class="btn" id="tm">В главное меню</button></div>
    <h2 style="margin-top:18px">Рекорды: ${S.mode === 'surv' ? 'выживание' : 'карьера'}</h2>${recordsHtml(S.mode)}</div>`;
  drawHero($('#spr'), S.app, S.wear);
  const shareTxt = `Асфальт. Казань-87${S.daily ? ' · вызов дня ' + S.daily : ''}: ${S.name}${S.nick ? ' «' + S.nick + '»' : ''}, ${RANKS[S.rank].toLowerCase()}, ${S.day} дн., слава ${slava}. ${reason}.${S.seed ? '\nСыграй мою судьбу: ' + fateCode(S.seed) : ''}\n${location.href}`;
  $('#shr').onclick = () => share(shareTxt);
  const md = S.mode; $('#nf').onclick = () => careerNew(md); $('#tm').onclick = titleScreen;
}

function chronicle() {
  const m = meta();
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene"><h2>Летопись судеб</h2>
    <div class="result">Открыто вещей: ${m.unlocked.length} из ${SHOP.filter(i => !i.start).length}. Открытые вещи бывают в гардеробе с самого начала новой судьбы.</div>
    <div class="log">${m.runs.map(r => `<p><span class="d">${r.date} · слава ${r.slava}</span><br>
      <b>${r.name}${r.nick ? ' «' + r.nick + '»' : ''}</b>${r.mode === 'surv' ? ' (выживание)' : ''}, ${RANKS[r.rank].toLowerCase()} (${DIST[r.home].name}), ${r.days} дн.<br>${r.win ? '✔' : '✘'} ${r.reason}</p>`).join('') || '<p>Ещё ни одной судьбы.</p>'}</div>
    <div class="choices"><button class="btn" id="tm">Назад</button></div></div>`;
  $('#tm').onclick = titleScreen;
}
