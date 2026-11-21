// Семья и возраст.
// Возраст на старте случайный: в Кампании 15–16 (сюжет про школу), в Карьере и Выживании 15–21.
// После 17 героя нет в школе (ПТУ, после 19 — завод), повестка — в 18.
// Вкладка «Семья»: мать, отец, брат, девушка или жена, дети. С каждым можно поговорить; с девушкой — свидание, предложение, свадьба.
// Близость — только когда обоим есть 18, показана цензурно: размытое окно и пара строк.
const ageOf = S => typeof heroAge === 'function' ? heroAge(S) : 15;
const school = S => ageOf(S) < 17;
const girlAge = S => ageOf(S) - 1;   // девушки на год младше героя
const adultPair = S => ageOf(S) >= 18 && girlAge(S) >= 18;

// ---- случайный возраст ----
{ const ns = newState; newState = o => { const s = ns(o); s.age0 = 15 + rnd(2); return s; }; }
function ageStart(lo, hi) {
  S.age0 = lo + rnd(hi - lo + 1);
  const a = ageOf(S), what = a < 17 ? 'ты в девятом классе' : a < 19 ? 'ты учишься в ПТУ' : 'ты работаешь на заводе';
  log(`Тебе ${a}. ${what[0].toUpperCase() + what.slice(1)}.`);
  if (typeof __TEST === 'undefined') setTimeout(() => toast(`Тебе ${a} лет — ${what}`), 3800);
  save('auto');
}
{ const sc = startCareer; startCareer = f => { sc(f); ageStart(15, 21); };
  const sv = startSurv; startSurv = f => { sv(f); ageStart(15, 21); }; }
if (EV.m_army) EV.m_army.trigger = S => ageOf(S) >= 18 && S.day > 3;
if (EV.m_army) { const l = EV.m_army.lines; EV.m_army.lines = S => l(S).map(x => typeof x === 'string' ? x.replace('восемнадцать', `${ageOf(S)}`) : x); }

// ---- кто есть в семье ----
Object.assign(NPCS, {
  zhena_kid: { name: 'Ребёнок', app: { build: 'thin', height: 'short', skin: 's1', hair: 'gorshok', hairc: 'rus', eyes: 'blue', mark: 'none' },
    wear: { hat: 'h_none', outer: 'o_none', shirt: 's_maika', pants: 'p_triko', shoes: 'f_kedy', acc: [] } },
});
const FAM = S => (S.fam2 = S.fam2 || { rel: { mama: 60, otec: S.fam === 'drunk' ? 25 : 55, brat: 50, lilya: 30, sveta: 30 }, kids: [], last: {} });
const GIRLS = { natasha: 'Наташа', lilya: 'Лиля', sveta: 'Света' };
function partner(S) {
  const f = S.flags;
  if (f.zhena) return f.zhena;
  if (f.met_natasha && !f.natasha_gone && !f.natasha_lost && (f.n_para || f.zhenat)) return 'natasha';
  if (f.lilya_s_toboy) return 'lilya';
  if (f.sveta_para) return 'sveta';
  return null;
}
const pRel = (S, g) => g === 'natasha' ? S.rel.natasha : FAM(S).rel[g];
const pAdd = (S, g, n) => { if (g === 'natasha') S.rel.natasha = Math.max(0, Math.min(100, S.rel.natasha + n)); else FAM(S).rel[g] = Math.max(0, Math.min(100, (FAM(S).rel[g] || 0) + n)); };
const famFree = (S, who) => FAM(S).last[who] !== S.day;
function members(S) {
  const f = S.flags, m = [];
  if (f.syn && !FAM(S).kids.length) FAM(S).kids.push({ boy: true, name: S.name, born: Math.max(1, S.day - 200), rel: 60 });   // сын из сюжета
  m.push({ id: 'mama', name: MOM(S) === 'мама' ? 'Мама' : 'Мать', role: 'дома ждёт', rel: () => S.st.semya });
  if (S.fam !== 'mother' && !f.otec_ushel) m.push({ id: 'otec', name: 'Отец', role: S.fam === 'drunk' ? (f.otec_rabota ? 'бросил пить, работает' : 'пьёт') : 'работает на заводе', rel: () => FAM(S).rel.otec });
  if (S.done.a_brat1 || S.day > 60) m.push({ id: 'brat', name: 'Мелкий', role: `брат, ${Math.max(9, ageOf(S) - 5)} лет${f.brat_brigada ? ', в бригаде' : f.brat_spasen ? ', учится' : ''}`, rel: () => FAM(S).rel.brat });
  const p = partner(S);
  if (p) m.push({ id: p, name: GIRLS[p], role: f.zhenat ? 'жена' : 'твоя девушка', rel: () => pRel(S, p), girl: true });
  FAM(S).kids.forEach((k, i) => m.push({ id: 'kid' + i, kid: k, name: k.name, role: `${k.boy ? 'сын' : 'дочь'}, ${kidAge(S, k)}`, rel: () => k.rel }));
  return m;
}
const kidAge = (S, k) => { const d = S.day - k.born; return d < 365 ? `${Math.max(1, Math.round(d / 30))} мес.` : `${Math.floor(d / 365)} г.`; };

// ---- экран «Семья» ----
const famHtml = S => `<div class="choices" style="margin:0 0 12px"><button class="btn main" onclick="famScreen()">👪 Семья${FAM(S).kids.length ? ' · дети: ' + FAM(S).kids.length : ''}</button></div>`;
function famScreen() {
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const ms = members(S), f = S.flags;
  const acts = m => {
    if (m.kid) return [['Погулять с ребёнком', 'kid']];
    if (m.girl) { const a = [['Свидание', 'date']];
      if (adultPair(S) && pRel(S, m.id) >= 60 && (m.id !== 'natasha' || f.n_noch || f.n_roditeli)) a.push(['Остаться на ночь · 18+', 'night']);
      if (!f.zhenat && adultPair(S) && pRel(S, m.id) >= 80) a.push(['Сделать предложение', 'wed']);
      return a; }
    return [['Поговорить', 'talk'], ['Подарок (10 р.)', 'gift']];
  };
  $('#main').innerHTML = `<div class="scene in"><h2>👪 Семья</h2>
    <p class="sub">${HN(S)}, ${ageOf(S)} лет. ${school(S) ? 'Школьник.' : ageOf(S) < 19 ? 'Учишься в ПТУ.' : f.zhenat ? 'Женат.' : 'Взрослый.'} С каждым можно видеться раз в день.</p>
    <div class="choices">${ms.map(m => `<div class="item fam">${m.kid ? `<div class="fface kid">${kidAge(S, m.kid).includes('мес') ? '👶' : m.kid.boy ? '👦' : '👧'}</div>` : `<div class="fface" style="background-image:url(img/p_${m.id}.jpg)"></div>`}
      <div style="flex:1"><b>${m.name}</b> <span class="ch mid">${m.role}</span><div class="bar"><i style="width:${Math.max(0, Math.min(100, m.rel()))}%"></i></div>
      <div class="fam-b">${acts(m).map(([t, k]) => `<button class="btn" data-fm="${m.id}|${k}" ${famFree(S, m.id) && S.ap > 0 ? '' : 'disabled'}>${t}</button>`).join('')}</div></div></div>`).join('')}
    ${!partner(S) ? `<div class="item"><div><b>Сердце свободно</b><div class="sub">${famSingle(S)}</div></div></div>` : ''}</div>
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  $('#bk').onclick = () => { view = 'hero'; render(); };
  document.querySelectorAll('[data-fm]').forEach(b => b.onclick = () => { const [id, k] = b.dataset.fm.split('|'); famAct(id, k); });
  document.querySelectorAll('[data-girl]').forEach(b => b.onclick = () => { S.flags.sveta_para = 1; FAM(S).rel.sveta += 10; log('Ты позвал Свету гулять. Она согласилась.'); famScreen(); });
}
function famSingle(S) {
  const f = S.flags;
  if (f.sveta_drug && !f.sveta_para && (f.natasha_gone || f.natasha_lost || !f.met_natasha)) return `Света из школы Наташи давно на тебя смотрит. <button class="btn" data-girl="sveta" style="margin-top:6px">Позвать Свету гулять</button>`;
  if (!f.met_natasha) return 'Наташа появится в твоей жизни — гуляй по району.';
  return 'Познакомиться можно на танцах, в кино, во дворе.';
}
function famAct(id, k) {
  FAM(S).last[id] = S.day; S.flags.fm_who = id; advanceTime(ACT_MIN);
  if (k === 'date' && id === 'natasha' && typeof natDate === 'function') return natDate();
  if (k === 'gift') { if (S.st.dengi < 10) { toast('Нужно 10 р.'); return famScreen(); } S.st.dengi -= 10; }
  play({ talk: 'fm_talk', gift: 'fm_gift', date: 'fm_date', night: 'fm_night', wed: 'fm_wed', kid: 'fm_kid' }[k]);
}
const WHO = S => S.flags.fm_who;
const famRel = (S, n) => { const w = WHO(S); if (w === 'mama') S.st.semya = Math.max(0, Math.min(100, S.st.semya + n)); else if (GIRLS[w]) pAdd(S, w, n); else if (w.startsWith('kid')) { const k = FAM(S).kids[+w.slice(3)]; if (k) k.rel = Math.min(100, k.rel + n); } else FAM(S).rel[w] = Math.max(0, Math.min(100, (FAM(S).rel[w] || 0) + n)); };

// разговоры: свои слова у каждого, зависят от возраста, эпохи и того, кем ты стал
const TALK = {
  mama: S => [S.flags.ch7 || era90(S) ? 'Ты ешь хоть? По телевизору опять показывали, как стреляли у рынка. Я каждый раз смотрю — не ты ли.' : school(S) ? 'Классная звонила. Говорит, ты опять прогулял. Где ты бываешь целыми днями?' : 'Ты совсем взрослый стал. Только домой приходишь всё позже.',
    'Отец твой в молодости тоже… Ладно. Не буду.', S.st.dengi > 200 ? 'Откуда у тебя такие деньги? Не говори. Не хочу знать.' : 'Хлеба купи на обратном пути.'],
  otec: S => [S.fam === 'drunk' && !S.flags.otec_rabota ? 'Сын… дай трёшку. Отдам в пятницу. Честно.' : 'На заводе опять зарплату задерживают. Чем жить — непонятно.',
    era90(S) ? 'Я сорок лет у станка, а ты за год заработал больше. Это неправильно. Но я не знаю, что правильно.' : 'В моё время за асфальт тоже дрались. Только ножей не было.'],
  brat: S => [S.flags.brat_brigada ? 'Меня теперь тоже уважают. Как тебя.' : 'Научи драться. Меня во дворе зовут чушпаном.', 'А правда, что ты с ними? С моталкой?'],
  lilya: S => ['Крест опять спрашивал про тебя. Я сказала — не знаю такого.', 'Увези меня на море. Хоть раз в жизни.'],
  sveta: S => ['Я всегда знала, что ты не такой, как они.', 'Наташка дура, что тебя упустила. Ой. Я этого не говорила.'],
  natasha: S => ['Ты обещал, что завяжешь. Я помню.', S.flags.zhenat ? 'Давай в выходные просто побудем дома. Без телефона, без пейджера.' : 'Мама спрашивает, когда ты придёшь к нам на ужин.'],
};
const spk = S => { const w = WHO(S); return w.startsWith('kid') ? null : w; };
def('fm_talk', { mode: 'any', repeat: true, title: 'Разговор', bg: S => WHO(S) === 'otec' || WHO(S) === 'mama' ? 'kuhnya' : 'dvor',
  lines: S => { const w = WHO(S), L = TALK[w] ? TALK[w](S) : ['…']; return [[w, pick(L)]]; },
  choices: S => [
    { t: 'Выслушать и обнять', fx: s => { famRel(s, 6); return { sovest: 3 }; }, txt: 'Немного тепла. Его всегда не хватает.' },
    { t: 'Рассказать правду о себе', fx: s => { famRel(s, Math.random() < 0.5 ? 8 : -6); return { sovest: 4 }; }, txt: 'Тишина. Потом — кивок. Или слёзы.' },
    { t: 'Отмахнуться: «Некогда»', fx: s => { famRel(s, -4); }, txt: 'Ты уходишь. За спиной — тишина.' }] });
def('fm_gift', { mode: 'any', repeat: true, title: 'Подарок', bg: 'kuhnya',
  lines: S => [`Ты принёс подарок: ${era90(S) ? 'импортные конфеты в железной коробке' : 'кулёк апельсинов с рынка'}.`],
  choices: [{ t: 'Отдать', fx: s => { famRel(s, 8); return { sovest: 2 }; }, txt: 'Улыбка. Ради таких минут и живут.' }] });
def('fm_date', { mode: 'any', repeat: true, title: 'Свидание', bg: () => pick(['t_n_park', 't_n_naberezh', 't_r_kino', 't_n_krysha']),
  lines: S => [`Вы с ${GIRLS[WHO(S)] === 'Лиля' ? 'Лилей' : 'Светой'} гуляете до темноты.`, [WHO(S), pick(TALK[WHO(S)](S)), 'smile']],
  choices: [{ t: 'Поцеловать', fx: s => { famRel(s, 8); return { lyub: 6 }; }, txt: 'Она не отстраняется.' }, { t: 'Просто проводить', fx: s => { famRel(s, 4); return { lyub: 3 }; }, txt: 'У подъезда она долго не уходит.' }] });
// близость: только взрослые, цензура — размытое окно и пара строк
def('fm_night', { mode: 'any', repeat: true, title: 'Ночь', bg: 't_n_utro', card: ['18+', 'Сцена скрыта цензурой'], art: 't_n_okno',
  fx: S => { famRel(S, 10); S.flags.fm_noch = S.day; if (WHO(S) === 'natasha') S.flags.n_noch = true; S.st.lyub = Math.min(100, S.st.lyub + 12); S.st.zdor = Math.min(100, S.st.zdor + 8); famBaby(S); },
  lines: S => [`Свет гаснет. Её дыхание у самого уха, холодные руки на твоей спине, шорох простыни. Вы забываете обо всём — об асфальте, о стрелках, о городе за окном.`,
    'Камера уходит к окну: на запотевшем стекле — два силуэта, потом только снег. Утро.',
    [WHO(S), S.flags.zhenat ? 'Доброе утро, муж. Чайник уже вскипел.' : 'Не уходи так рано. Хоть раз.', 'smile']],
  choices: [{ t: 'Остаться на завтрак', fx: { sovest: 2 }, txt: 'Две чашки, одна сигарета на двоих, её смех.' }, { t: 'Уйти по делам', fx: s => { famRel(s, -3); }, txt: 'Она смотрит из окна, как ты садишься в машину.' }] });
function famBaby(S) {
  if (!S.flags.zhenat || FAM(S).kids.length >= 3 || Math.random() > 0.12 || S.flags.fm_baby) return;
  S.flags.fm_baby = S.day + 270;   // роды через девять месяцев
}
def('fm_wed', { mode: 'any', title: 'Предложение', bg: 't_n_naberezh',
  lines: S => [`Ты достаёшь кольцо. ${GIRLS[WHO(S)]} закрывает лицо ладонями.`, [WHO(S), 'Ты серьёзно?.. Да. Да!', 'smile']],
  fx: S => { S.flags.zhenat = true; S.flags.zhena = WHO(S); },
  choices: [
    { t: 'Свадьба в ресторане (150 р.)', req: { dengi: 150 }, fx: { dengi: -150, uvazh: 10, avt: 4, lyub: 20 }, go: 'fm_svadba' },
    { t: 'Тихо расписаться в ЗАГСе', fx: { lyub: 15, sovest: 4 }, txt: 'Два свидетеля, гвоздики, шампанское в подъезде. Вы — муж и жена.' }] });
def('fm_svadba', { mode: 'any', title: 'Свадьба', bg: 't_v_svadba', card: ['Свадьба', ''], art: 't_v_svadba',
  lines: S => ['Кортеж с кольцами на крыше, «Горько!» на весь ресторан, тамада, драка в конце — всё как положено.', ['mama', 'Сынок… Будь счастлив. Пожалуйста.', 'sad']],
  choices: [{ t: 'Танцевать с женой', fx: s => { famRel(s, 10); }, txt: 'Белое платье кружится под «Ласковый май» с кассеты. Самая счастливая ночь в твоей жизни.' }] });
def('fm_rody', { mode: 'any', repeat: true, title: 'Роддом', bg: 't_r_bolnica', card: ['Роддом', ''],
  trigger: S => S.flags.fm_baby && S.day >= S.flags.fm_baby,
  fx: S => { const boy = Math.random() < 0.5; S.flags.fm_baby = 0; S._kid = { boy, name: boy ? pick(['Тимур', 'Артём', 'Руслан', 'Денис', 'Ильдар']) : pick(['Алсу', 'Настя', 'Камила', 'Лена', 'Аня']), born: S.day, rel: 70 }; FAM(S).kids.push(S._kid); S.flags.syn = S.flags.syn || boy; },
  lines: S => [`Окно роддома, третий этаж. ${GIRLS[S.flags.zhena] || 'Жена'} показывает тебе свёрток.`, `${S._kid.boy ? 'Сын' : 'Дочь'}. ${S._kid.name}. Ты стоишь внизу с цветами и не можешь сказать ни слова.`],
  choices: [{ t: '«Я завяжу. Ради тебя»', fx: { sovest: 15, lyub: 15, avt: -5 }, txt: 'Ты обещаешь это свёртку в окне.' }, { t: 'Накрыть поляну пацанам', fx: { uvazh: 8, dengi: -30 }, txt: 'Вся бригада пьёт за наследника.' }] });
def('fm_kid', { mode: 'any', repeat: true, title: 'С ребёнком', bg: S => pick(['t_n_park', 'korobka', 't_n_katok']),
  lines: S => { const k = FAM(S).kids[+WHO(S).slice(3)], a = Math.floor((S.day - k.born) / 365);
    return [a < 2 ? `${k.name} спит у тебя на руках. Маленькая ладонь держит твой палец.` : a < 6 ? `${k.name} тащит тебя на горку: «Папа, ещё раз!»` : `${k.name} спрашивает: «Пап, а кем ты работаешь?»`]; },
  choices: [{ t: 'Побыть рядом весь день', fx: s => { famRel(s, 10); return { sovest: 6, zdor: 4 }; }, txt: 'Ради этого стоит жить. И, может быть, ради этого стоит завязать.' }] });

// Наташа: близость по возрасту, а не по дате
if (EV.n_vecher) EV.n_vecher.lines = S => [`Тебе ${ageOf(S)}, ей ${girlAge(S)}. Её родители уехали на дачу до понедельника.`,
  'Третий этаж, дверь в коричневом дерматине. Она открывает раньше, чем ты успеваешь позвонить.', ['natasha', 'Заходи. Я пирог испекла. Первый раз в жизни. Не смейся.', 'smile']];
if (EV.n_vecher) EV.n_vecher.card = ['Её дом', ''];

// ---- школа или ПТУ, или завод: действие дома зависит от возраста ----
{ const la = locActions; locActions = (S, d) => la(S, d).map(a => {
  if (a.t !== 'Сходить в школу' || school(S)) return a;
  return ageOf(S) < 19
    ? { t: 'Пары в ПТУ', chk: ['um', 4], ok: { txt: 'Мастер показал, как точить резец. Пригодится. Наверное.', fx: { um: 1, semya: 2 } }, no: { txt: 'Проспал «Технологию металлов».', fx: { zdor: 3 } } }
    : { t: 'Смена на заводе', fx: { dengi: 6, zdor: -6, semya: 3 }, txt: 'Восемь часов у станка. Шесть рублей и ломота в спине.' };
}); }
if (TPL.j_sportzal) TPL.j_sportzal.age = [0, 16];
