// Поздний старт: ползунок «год появления» в Карьере. Годы до него игра проживает за тебя сама —
// исход случайный и сбалансированный: от авторитета до бродяги. Перед началом — «Твоя жизнь до этого» (что было; что будет — неизвестно).
const ARCH_FATE = [
  { id: 'avtoritet', w: 7, minN: 3, title: 'Авторитет' }, { id: 'brigadir', w: 11, minN: 2, title: 'Бригадир' },
  { id: 'boets', w: 14, minN: 0, title: 'Боец моталки' }, { id: 'kommers', w: 10, minN: 1, title: 'Коммерсант' },
  { id: 'ment', w: 10, minN: 1, title: 'Милиционер' }, { id: 'chinovnik', w: 8, minN: 1, title: 'Человек во власти' },
  { id: 'rabotyaga', w: 12, minN: 0, title: 'Работяга' }, { id: 'sidel', w: 10, minN: 2, title: 'Только что откинулся' },
  { id: 'brodyaga', w: 8, minN: 1, title: 'Бродяга' }, { id: 'sportsmen', w: 10, minN: 0, title: 'Спортсмен' },
];
function rollArch(n) {
  const pool = ARCH_FATE.filter(a => n >= a.minN); let r = Math.random() * pool.reduce((s, a) => s + a.w, 0);
  for (const a of pool) if ((r -= a.w) < 0) return a; return pool[0];
}
const fYear = (y0, n) => y0 + Math.min(n, 1 + rnd(Math.max(1, n)));
// лучшие вещи, которые «по карману» судьбе: по слотам, в пределах бюджета и звания
function dressUp(S, budget) {
  for (const slot of ['outer', 'pants', 'shoes', 'hat', 'shirt']) {
    const opts = SHOP.filter(i => i.slot === slot && (i.rank || 0) <= S.rank && !i.era90 && (i.cur === '$' ? i.price * 5 : i.price) <= budget / 3);
    if (!opts.length) continue; const it = opts.sort((a, b) => (b.cur === '$' ? b.price * 5 : b.price) - (a.cur === '$' ? a.price * 5 : a.price))[rnd(Math.min(3, opts.length))];
    if (!S.owned.includes(it.id)) S.owned.push(it.id); S.wear[slot] = it.id;
  }
}
function applyFate(S, Y) {
  const n = Y - 1987, e90 = Y >= 1992, inf = e90 ? 3 : 1, A = rollArch(n), bio = [];
  S.day = dayNum(Y, 9, 1); S.min = typeof DAY_START !== 'undefined' ? DAY_START : 420;
  const age = typeof heroAge === 'function' ? heroAge(S) : 15 + n;
  const yr = () => fYear(1987, n), hm = DIST[S.home];
  const rank = r => { S.rank = r; if (r > 0) S.gang = S.home; };
  // ---- по архетипу ----
  switch (A.id) {
    case 'avtoritet':
      rank(5); Object.assign(S.st, { avt: 280 + rnd(120), uvazh: 70, dengi: 400 * inf + rnd(300) * inf, dol: e90 ? 300 + rnd(500) : 40, sila: 6, yaz: 6, um: 5, mil: 35 });
      bio.push(`${yr()}: пришился к «${hm.gang}». Через год тебя знал весь район.`, `${fYear(1988, n)}: стал старшим — после большой драки на коробке.`, `${fYear(1989, n)}: «автор». Своё слово в моталке весит больше, чем кулаки.`);
      if (typeof addPoint === 'function') { addPoint('Колхозный рынок', 60); addPoint('Ресторан', 40); }
      if (e90) { S.vl = 55 + rnd(15); S.car = { id: pick(['bmw', 'mers', 'volga']), cond: 85, fuel: 80 }; bio.push('1992: твоя моталка стала бригадой. Город делят авторитеты — ты один из них.'); }
      else S.car = { id: 'volga', cond: 80, fuel: 70 };
      break;
    case 'brigadir':
      rank(4); Object.assign(S.st, { avt: 160 + rnd(60), uvazh: 55, dengi: 180 * inf + rnd(150) * inf, dol: e90 ? 80 + rnd(150) : 10, sila: 6, lovk: 5, mil: 30 });
      bio.push(`${yr()}: пришился к «${hm.gang}».`, `${fYear(1989, n)}: стал старшим, держишь своих пацанов и пару точек.`);
      if (typeof addPoint === 'function') addPoint('Ряды на рынке', 25);
      if (e90) { S.vl = 25 + rnd(15); S.car = { id: pick(['devyatka', 'bmw']), cond: 70, fuel: 60 }; } else S.car = { id: pick(['kopeyka', 'devyatka']), cond: 70, fuel: 60 };
      break;
    case 'boets':
      rank(Math.min(3, 1 + rnd(3))); Object.assign(S.st, { avt: 30 + rnd(50), uvazh: 25 + rnd(20), dengi: 20 * inf + rnd(40), sila: 4 + rnd(2), mil: 15 });
      bio.push(`${yr()}: пришился к «${hm.gang}». Скорлупа, потом суперы — обычный путь.`, pick(['Сломанный нос, два привода, ни одной сданной фамилии.', 'Пару раз чуть не сел, но обошлось.', 'Друга зарезали на стрелке у ДК. Ты стоял рядом.']));
      break;
    case 'kommers':
      Object.assign(S.st, { dengi: 300 * inf + rnd(400) * inf, dol: e90 ? 150 + rnd(300) : 30, um: 6, yaz: 5, avt: 10, mil: 20 });
      bio.push(`${fYear(1988, n)}: открыл кооператив — видеосалон, потом ещё и кафе.`, pick(['Платишь «за крышу» каждую неделю. Пока платишь — живёшь.', 'Первый миллион, первая взятка, первая пуля в витрину.']));
      if (typeof addPoint === 'function') addPoint('Свой кооператив', 30);
      S.car = { id: e90 ? pick(['bmw', 'mers', 'devyatka']) : pick(['kopeyka', 'moskvich']), cond: 80, fuel: 80 };
      break;
    case 'ment': {
      const lvl = Math.min(5, 1 + Math.floor(n / 2) + rnd(2));
      (S.lad = S.lad || {}).mvd = { lvl, xp: LAD_XP[lvl], since: S.day - 30 };
      Object.assign(S.st, { dengi: 40 * inf + rnd(80) * inf, sila: 5, um: 5, mil: 0, avt: 0, uvazh: 10 });
      bio.push(`${yr()}: школа милиции. Мать плакала от счастья, пацаны со двора перестали здороваться.`, `Сейчас ты — ${ladTitle(S, 'mvd').toLowerCase()}.`,
        pick(['Брал взятки — не больше, чем все.', 'Ни одной взятки. Над тобой смеются в отделе.', 'Однажды отпустил пацана со своего двора. Никто не узнал.']));
      if (Math.random() < 0.3) S.flags.oboroten = 1;
      break; }
    case 'chinovnik': {
      const lvl = Math.min(5, 1 + Math.floor(n / 2) + rnd(2));
      (S.lad = S.lad || {}).gov = { lvl, xp: LAD_XP[lvl], since: S.day - 30 };
      Object.assign(S.st, { dengi: 80 * inf + rnd(150) * inf, yaz: 6, um: 6, sila: 2, uvazh: 5 });
      bio.push(`${yr()}: комсомольский актив, характеристики, собрания.`, `Сейчас ты — ${ladTitle(S, 'gov').toLowerCase()}.`,
        e90 ? 'В 1991-м вовремя сжёг партбилет и встал на сторону новой власти.' : pick(['Распределял путёвки и дефицит. Друзей стало много.', 'Тебя прочат в горком.']));
      S.wear.outer = 'o_pidzhak'; if (!S.owned.includes('o_pidzhak')) S.owned.push('o_pidzhak');
      if (lvl >= 3) S.car = { id: 'volga', cond: 85, fuel: 80 };
      break; }
    case 'rabotyaga':
      Object.assign(S.st, { dengi: 25 * inf + rnd(40), semya: 75, sovest: 85, sila: 5, mil: 0 });
      bio.push(`${yr()}: ПТУ, потом завод. Смена, получка, гастроном.`, pick(['Женился на девчонке из соседнего подъезда.', 'Мастер цеха говорит, что у тебя золотые руки.', 'В девяностые зарплату платят продукцией — кастрюлями.']));
      if (age >= 20 && Math.random() < 0.6) { S.flags.zhenat = true; S.flags.zhena = pick(['sveta', 'lilya']); if (Math.random() < 0.6 && typeof FAM === 'function') FAM(S).kids.push({ boy: Math.random() < 0.5, name: pick(['Тимур', 'Алсу', 'Артём', 'Настя']), born: S.day - 300 - rnd(700), rel: 70 }); bio.push('Дома — жена и ребёнок. Ради них ты встаёшь в шесть утра.'); }
      break;
    case 'sidel':
      rank(Math.max(2, rnd(4))); S.flags.sidel = 1; S.flags.zona = S.day - 10;
      Object.assign(S.st, { dengi: 3, uvazh: 45, avt: 60 + rnd(60), sila: 6, sovest: 50, mil: 20, zdor: 70 });
      bio.push(`${yr()}: взяли после драки, где погиб человек. Своих не сдал.`, `${Math.max(1, Math.min(n - 1, 2 + rnd(3)))} года в колонии под Казанью. Наколки, понятия, туберкулёзный кашель соседа по шконке.`, 'Неделю назад вышел. Город другой. Моталка — другая.');
      if (typeof injure === 'function' && Math.random() < 0.4) injure(S, 'rebro', 'память о зоне');
      break;
    case 'brodyaga':
      Object.assign(S.st, { dengi: 0, dol: 0, semya: 5, zdor: 55, uvazh: 0, avt: 0, sovest: 60, mil: 10 });
      if (S.body) { S.body.rat = 'golod'; S.body.syt = 25; }
      bio.push(`${yr()}: ${pick(['мать умерла, квартиру забрали родственники', 'выгнали из дома за пьянку отца — пил он, а виноват оказался ты', 'вернулся из армии — а дома чужие люди'])}.`, 'Ночуешь на теплотрассе за вокзалом. Знаешь всех бомжей, ментов и проводниц.', 'Терять тебе нечего. Иногда это сила.');
      S.wear = { ...S.wear, outer: 'o_telogreika' }; if (!S.owned.includes('o_telogreika')) S.owned.push('o_telogreika');
      break;
    case 'sportsmen':
      Object.assign(S.st, { sila: 7, lovk: 6, zdor: 100, dengi: 30 * inf + rnd(60), avt: 20, uvazh: 20 });
      S.flags.boks = true;
      bio.push(`${yr()}: секция бокса во Дворце спорта. Кандидат в мастера.`, e90 ? 'Тренер ушёл к Тагиру. Зовёт и тебя: «Спортсмены сейчас нужнее, чем на ринге».' : 'Тренер говорит: ещё год — и сборная республики.');
      break;
  }
  // ---- общее: одежда по деньгам, возраст, история страны ----
  dressUp(S, S.st.dengi + (S.st.dol || 0) * 4);
  if (S.rank > 0 && !S.gang) S.gang = S.home;
  if (n >= 3 && Y > 1990) bio.push('1991: путч, три дня по телевизору «Лебединое озеро». Потом — другая страна.');
  if (Y >= 1993) bio.push('1992: цены отпустили. Кто держал деньги на книжке — остался ни с чем.');
  S.flags.fate = A.id; S.flags.fate_title = A.title; S.flags.fate_bio = bio; S.flags.fate_show = 1;
  // цель, которую ещё не выполнил; срок — от года появления
  const ok = GOALS.filter(g => !g.ok(S)), pref = A.id === 'ment' ? 'mvd5' : A.id === 'chinovnik' ? 'gov5' : null;
  S.goal = (pref && ok.find(g => g.id === pref) || pick(ok.length ? ok : GOALS)).id;
  S.goalShift = S.day - 1;
  log(`Судьба: ${A.title}. ${Y} год.`);
  save('auto');
}
{ const sc = startCareer; startCareer = f => { sc(f); if (FATE_YEAR > 1987) applyFate(S, FATE_YEAR); }; }
// «Твоя жизнь до этого» — один раз, после заставки
function fateBio() {
  const b = S.flags.fate_bio || []; S.flags.fate_show = 0;
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene in"><h2>Твоя жизнь до ${dateStr().replace(/^\d+ \S+ /, '')}</h2>
    <div class="result ok">Ты — <b>${S.flags.fate_title}</b>. ${S.name}, ${typeof heroAge === 'function' ? heroAge(S) : ''} лет.</div>
    <div class="fate-tl">${b.map(x => `<div class="fate-i">${x}</div>`).join('')}</div>
    <p class="note">Что было — ты знаешь. Что будет дальше — не знает никто.</p>
    <div class="choices"><button class="btn main" id="fb-go">Жить дальше</button></div></div>`;
  $('#fb-go').onclick = () => { AUDIO.click(); view = 'map'; render(); };
}
{ const tm = toMap; toMap = () => { if (S && S.flags && S.flags.fate_show) return fateBio(); return tm(); }; }
