// Мир вокруг: своя скорлупа, сезоны, газета, история СССР на фоне, режим «Выживание», достижения.

// ===================== СВОЯ СКОРЛУПА ==========================================================
const PERKS = [
  { name: 'Боксёр', b: { sila: 1 } }, { name: 'Шустрый', b: { lovk: 1 } }, { name: 'Голова', b: { um: 1 } },
  { name: 'Балабол', b: { yaz: 1 } }, { name: 'Везучий', b: { lovk: 1, yaz: 1 } }, { name: 'Бешеный', b: { sila: 2, um: -1 } },
];
const SQ_NICKS = ['Шкет', 'Кузя', 'Сопля', 'Пятак', 'Мелкий', 'Гвоздь', 'Тюбик', 'Хомяк', 'Лом', 'Зубр', 'Косой', 'Пельмень', 'Чика', 'Рыба'];
const perkText = b => Object.entries(b).map(([k, v]) => `${NAMES[k]} ${v > 0 ? '+' : ''}${v}`).join(', ');

function genRecruit(nick) {
  const app = {}; for (const k of Object.keys(LOOKS)) app[k] = pick(Object.keys(LOOKS[k]));
  app.height = pick(['short', 'normal']);
  const it = slot => pick(SHOP.filter(i => i.slot === slot && (i.price || 0) <= 25)).id;
  const used = (S.squad || []).map(m => m.nick);
  return { nick: nick || pick(SQ_NICKS.filter(n => !used.includes(n))), perk: pick(PERKS), loyal: 50 + rnd(20), app,
    wear: { hat: it('hat'), outer: it('outer'), shirt: it('shirt'), pants: it('pants'), shoes: it('shoes'), acc: [] } };
}
// персонаж для сцены: из NPCS, кандидат или член скорлупы ('sq0'…)
function npcOf(key) {
  if (key === 'cand') return S.cand && { name: S.cand.nick, ...S.cand };
  if (/^sq\d$/.test(key)) { const m = S.squad[+key[2]]; return m && { name: m.nick, ...m }; }
  return NPCS[key];
}
const comp = () => S.squad && S.withMe != null ? S.squad[S.withMe] : null;

def('g_recruit', {
  mode: 'any', repeat: true, title: 'Новенький', bg: 'korobka',
  trigger: S => S.gang && S.rank >= 2 && S.squad.length < 4 && S.day >= (S.flags.next_recruit || 0) && S.at === S.home,
  fx: S => { S.flags.next_recruit = S.day + 6; S.cand = genRecruit(); },
  lines: S => [
    'К тебе на коробке подходит пацан помладше. Мнёт кепку в руках.',
    ['cand', V(`Говорят, ты скорлупу набираешь. Я ${S.cand.nick}. Возьми меня.`, `Я ${S.cand.nick}. Я всё могу. Возьми, а?`, `Меня ${S.cand.nick} зовут. Хочу с тобой ходить.`)],
    `${S.cand.nick} — «${S.cand.perk.name}» (${perkText(S.cand.perk.b)}).`,
  ],
  choices: S => [
    { t: 'Взять в свою скорлупу', fx: s => { s.squad.push(s.cand); log(`${s.cand.nick} теперь в твоей скорлупе.`); return { uvazh: 3 }; },
      txt: `${S.cand.nick} сияет. Теперь у тебя на одного своего больше. Бери его с собой на вкладке «Герой».` },
    { t: 'Отправить домой', txt: '«Подрасти сначала». Он уходит, опустив голову.' },
  ],
});

def('g_squad_betray', {
  mode: 'any', repeat: true, title: 'Крыса в скорлупе', bg: 'noch',
  trigger: S => S.squad.some(m => m.loyal < 12),
  fx: S => { S.flags.trai = S.squad.findIndex(m => m.loyal < 12); },
  lines: S => { const m = S.squad[S.flags.trai]; return [
    `${m.nick} пропал. А вечером к тебе домой пришёл участковый.`,
    ['garipov', `Твой ${m.nick} нам много интересного рассказал. Обиженный он на тебя.`, 'smile'],
  ]; },
  choices: [{ t: 'Стиснуть зубы', fx: s => { const m = s.squad.splice(s.flags.trai, 1)[0]; if (s.withMe === s.flags.trai) s.withMe = null; else if (s.withMe > s.flags.trai) s.withMe--; log(`${m.nick} сдал тебя ментам.`); return { mil: 20, uvazh: -5 }; },
    txt: 'Скорлупу надо кормить, беречь и не бросать. Иначе она кусает.' }],
});

// ===================== СЕЗОНЫ И ПОГОДА ========================================================
const OUTDOOR = ['dvor', 'garazhi', 'korobka', 'noch', 'ostanovka', 'pustyr', 'rynok'];
function season(day = S.day) {
  const d = new Date(1987, 8, 1); d.setDate(d.getDate() + day - 1);
  const m = d.getMonth();
  return m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';
}

// ===================== ГАЗЕТА «ВЕЧЕРНЯЯ КАЗАНЬ» ================================================
const ERA_NEWS = {
  1987: ['Перестройка: на заводе «Теплоконтроль» перевыполнили план', 'В кинотеатре «Родина» — «Курьер». Билеты раскуплены', 'Горком комсомола обеспокоен: подростки сбиваются в «группировки»'],
  1988: ['Разрешены кооперативы. Первое кооперативное кафе открылось на Баумана', 'Сеул: сборная СССР — золото по футболу!', 'Дефицит: за колбасой очередь с шести утра'],
  1989: ['Последний советский солдат покинул Афганистан', 'Съезд народных депутатов: вся страна у телевизоров', 'Видеосалоны: милиция проверяет, что показывают детям'],
  1990: ['Талоны на сахар и мыло', 'Погиб Виктор Цой. Казанские дворы в трауре', 'Рубль падает. Кооператоры богатеют'],
  1991: ['Путч в Москве. По телевизору «Лебединое озеро»', 'Цены отпущены? Пока слухи', 'Союз доживает последние месяцы'],
};
def('g_gazeta', {
  mode: 'any', repeat: true, title: '«Вечерняя Казань»', bg: 'gazeta', sfx: 'page',
  trigger: S => S.day >= 9 && S.day % 10 === 9 && S.flags.gaz !== S.day,
  fx: S => { S.flags.gaz = S.day; },
  lines: S => {
    const y = new Date(1987, 8, S.day).getFullYear();
    const wars = S.log.filter(l => l.t.includes('отжали')).slice(0, 2).map(l => 'Драка во дворах: ' + l.t.replace(/\.$/, ''));
    const me = S.st.avt > 40 ? [`На ${HOME(S)} опять неспокойно. Милиция ищет зачинщиков`] : [];
    const era = ERA_NEWS[Math.min(1991, y)];
    return ['Свежий номер «Вечерней Казани». Пахнет типографской краской.',
      ...[...wars, ...me, era[(S.day / 10 | 0) % era.length]].slice(0, 3).map(h => '▪ ' + h + '.')];
  },
  choices: [{ t: 'Отложить газету' }],
});

// ===================== ИСТОРИЯ НА ФОНЕ ===============================================================
const HIST = [
  { id: 'h_koop', at: [1988, 5, 26], lines: S => ['По телевизору: разрешили кооперативы.', ...(S.gang ? [['starsh', 'У кооператоров будут деньги. А у кого деньги — тому нужна защита.', 'smile']] : ['Мама вздыхает: «Теперь всё за деньги будет».'])] },
  { id: 'h_afgan', at: [1989, 2, 15], lines: S => ['По телевизору: последний советский солдат покинул Афганистан.', ...(S.flags.met_bacha ? [['bacha', 'Вот и всё. А пацанов не вернуть.', 'sad']] : [])] },
  { id: 'h_coi', at: [1990, 8, 15], lines: () => ['Погиб Виктор Цой. Во дворе кто-то включил «Группу крови» на весь район. Никто не возражает.'] },
  { id: 'h_putch', at: [1991, 8, 19], lines: () => ['По всем каналам «Лебединое озеро». В Москве танки. Взрослые шепчутся на кухнях.'] },
  { id: 'h_ussr', at: [1991, 12, 26], lines: () => ['Советского Союза больше нет. Ты засыпаешь в одной стране, а просыпаешься в другой.'] },
];
for (const h of HIST) def(h.id, { mode: 'any', title: 'Новости', bg: 'kuhnya', trigger: S => S.day >= dayNum(...h.at), lines: h.lines, choices: [{ t: 'Выключить телевизор' }] });

// ===================== РЕЖИМ «ВЫЖИВАНИЕ ЧУШПАНА» =======================================================
const SURV_END = dayNum(1987, 12, 31);
function startSurv(f) {
  S = newState({ name: f.name, app: f.app, wear: f.wear, home: f.home, fam: f.fam, dengi: 8, semya: f.fam === 'drunk' ? 30 : 65 });
  S.mode = 'surv'; S.trait = f.trait; Object.assign(S.st, f.st);
  applyFx(TRAITS.find(t => t.id === f.trait).st);
  S.flags.enemy = pickEnemy(S);
  log(`${S.name}, ничей. Задача — дожить до Нового года.`);
  save('auto'); view = 'map';
  card([S.name, 'Ничей', 'Продержись до Нового года'], toMap, 3000);
}
function survDay(S) {
  if (S.day > SURV_END) return (S.over = { win: true, reason: 'Дожил до Нового года, так и не став ничьим' });
  if (Math.random() < 0.35 + S.day / 300) S.flags.sv_threat = 1;
}
const SV_WHO = ['Трое с соседнего района', 'Скорлупа из твоего же двора', 'Двое пьяных старшеклассников', 'Пацаны на остановке', 'Компания у гаражей'];
def('sv_intro', {
  mode: 'surv', trigger: S => true, title: 'Ничей', bg: 'dvor',
  lines: ['Ты не пришился ни к кому. Значит, тебя может тряхнуть любой.',
    ['chuzhoy:Пацан со двора', 'Чушпан, ты ещё здесь? Ну-ну. Посмотрим, сколько протянешь.', 'smile'],
    'Задача — дожить до Нового года ничьим. Каждый день будет хуже.'],
  choices: [{ t: 'Поехали' }],
});
def('sv_tryas', {
  mode: 'surv', repeat: true, title: 'Опять', bg: 'dvor',
  trigger: S => !!S.flags.sv_threat,
  fx: S => { delete S.flags.sv_threat; S.flags.sv_who = pick(SV_WHO); },
  lines: S => [`${S.flags.sv_who}. Окружили.`, ['chuzhoy', V('Чушпан! Карманы.', 'Опа, наш кошелёк пришёл.', 'Шапку снимай. И деньги давай.', 'Ты куда так спешишь, а?'), 'angry']],
  choices: S => { const d = 4 + Math.floor(S.day / 25); return [
    { t: `Отдать деньги (${S.st.dengi} р.)`, fx: s => ({ dengi: -s.st.dengi, sovest: -1 }), txt: 'Отпустили. Пока что.' },
    { t: 'Заговорить зубы', chk: ['yaz', d], ok: { txt: 'Ты что-то врёшь про брата-боксёра. Верят. Пока.', fx: { yaz: 0 } }, no: { txt: 'Не поверили.', go: 'f_random' } },
    { t: 'Бежать', chk: ['lovk', d], mini: 'pobeg', ok: { txt: 'Ушёл. Дыхание сбито, сердце колотится.' }, no: { txt: 'Догнали.', go: 'f_random' } },
    { t: 'Драться', go: 'f_random' },
  ]; },
});
def('sv_offer', {
  mode: 'surv', repeat: true, title: 'Предложение', bg: 'korobka',
  trigger: S => S.day >= 30 && S.day % 30 === 0 && S.flags.svo !== S.day,
  fx: S => { S.flags.svo = S.day; },
  lines: S => [['starsh', `Хватит бегать. Пришивайся к «${G(S)}». У нас тебя никто не тронет.`], 'Это было бы так просто…'],
  choices: [
    { t: 'Пришиться', fx: { end: 'surv_broke' } },
    { t: '«Я сам по себе»', fx: { sovest: 5 }, txt: '«Ну смотри. Пожалеешь».' },
  ],
});
ENDINGS.surv_broke = { title: 'Сломался', text: () => 'Ты пришился. Больше никто не трясёт — теперь трясёшь ты.' };

// ===================== ДОСТИЖЕНИЯ ===================================================================
const ACH = [
  { id: 'first_win', name: 'Первая кровь', d: 'Выиграть первую драку', c: S => S.cnt.wins >= 1 },
  { id: 'wins10', name: 'Уличный боец', d: 'Выиграть 10 драк', c: S => S.cnt.wins >= 10 },
  { id: 'pacan', name: 'Пацан', d: 'Пришиться к моталке', c: S => !!S.gang },
  { id: 'traitor', name: 'Перебежчик', d: 'Пришиться к врагам своего района', c: S => !!S.flags.traitor_home },
  { id: 'krysa', name: 'Крыса', d: 'Согласиться стучать', c: S => !!S.flags.stukach },
  { id: 'saved', name: 'Своих не бросаем', d: 'Вытащить Ильдара от ментов', c: S => !!S.flags.saved_ildar },
  { id: 'love', name: 'Ласковый май', d: 'Любовь 60+', c: S => S.st.lyub >= 60 },
  { id: 'kachok', name: 'Качок', d: 'Сила 8', c: S => S.st.sila >= 8 },
  { id: 'prof', name: 'Профессор', d: 'Смекалка 8', c: S => S.st.um >= 8 },
  { id: 'balabol', name: 'Язык без костей', d: 'Язык 8', c: S => S.st.yaz >= 8 },
  { id: 'rich', name: 'Кооператор', d: 'Накопить 300 р.', c: S => S.st.dengi >= 300 },
  { id: 'land5', name: 'Пол-Казани', d: 'Моталка держит 5 районов', c: S => myLand(S).length >= 5 },
  { id: 'super', name: 'Супер', d: 'Дорасти до супера', c: S => S.rank >= 2 },
  { id: 'avtor', name: 'Автор', d: 'Стать автором моталки', c: S => S.rank >= 5 },
  { id: 'moda', name: 'Модник', d: 'Собрать 20 вещей', c: S => S.owned.length >= 20 },
  { id: 'adibas', name: 'Весь в Adibas', d: 'Надеть 3 вещи «Adibas»', c: S => wornIds(S.wear).filter(i => i.includes('adibas')).length >= 3 },
  { id: 'naperstki', name: 'Глаз-алмаз', d: 'Обыграть напёрсточника 3 раза', c: S => S.cnt.naperstki >= 3 },
  { id: 'squad4', name: 'Своя скорлупа', d: 'Набрать четверых в скорлупу', c: S => S.squad.length >= 4 },
  { id: 'winter', name: 'Первый снег', d: 'Дожить до зимы', c: S => season() === 'winter' },
  { id: 'chapter3', name: 'Супер-сюжет', d: 'Дойти до главы 3', c: S => !!S.flags.ch3 },
  { id: 'tapes5', name: 'Меломан', d: 'Собрать 5 кассет', c: S => (S.tapes || []).length >= 5 },
  { id: 'cards10', name: 'Вкладыши', d: 'Собрать 10 вкладышей', c: S => (S.cards || []).length >= 10 },
  { id: 'album5', name: 'Фотограф', d: '5 фото в альбоме', c: S => (S.album || []).length >= 5 },
  { id: 'ally', name: 'Дипломат', d: 'Союз с чужой моталкой', c: S => Object.values(S.rep || {}).some(v => v >= 60) },
  { id: 'dollar', name: 'Валютчик', d: 'Иметь $50', c: S => (S.st.dol || 0) >= 50 },
  { id: 'zona', name: 'Отсидевший', d: 'Выйти с зоны', c: S => !!S.done.m_zona3 },
];
function metaGet() { const m = meta(); m.ach = m.ach || []; m.ends = m.ends || []; return m; }
function metaPut(m) { try { localStorage.setItem('asfalt_meta', JSON.stringify(m)); } catch (e) {} }
function checkAch() {
  if (!S || !S.cnt) return;
  const m = metaGet(); let got = null;
  for (const a of ACH) if (!m.ach.includes(a.id) && a.c(S)) { m.ach.push(a.id); got = a; }
  if (got) { metaPut(m); toast('Достижение: ' + got.name); }
}
function noteEnding(name) { const m = metaGet(); if (!m.ends.includes(name)) { m.ends.push(name); metaPut(m); } }
function toast(t) {
  if (typeof __TEST !== 'undefined') return;
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = '★ ' + t;
  document.body.appendChild(el); AUDIO.sfx ? AUDIO.sfx('achievement') : AUDIO.ok(); setTimeout(() => el.remove(), 3200);
}
const ALL_ENDS = ['Ничей', 'Колония', 'Крыса', 'Сломался', 'Погиб на асфальте', 'Цель выполнена', 'Не успел', 'Дожил до Нового года'];
function achScreen(back) {
  const m = metaGet();
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene"><h2>Достижения ${m.ach.length}/${ACH.length}</h2>
    <div class="choices">${ACH.map(a => `<div class="item ${m.ach.includes(a.id) ? 'worn' : 'locked'}"><div><b>${m.ach.includes(a.id) ? '★' : '☆'} ${a.name}</b><div class="sub">${a.d}</div></div></div>`).join('')}</div>
    <h2 style="margin-top:20px">Концовки ${ALL_ENDS.filter(e => m.ends.some(x => x.startsWith(e))).length}/${ALL_ENDS.length}</h2>
    <div class="choices">${ALL_ENDS.map(e => { const ok = m.ends.some(x => x.startsWith(e)); return `<div class="item ${ok ? 'worn' : 'locked'}"><b>${ok ? e : '???'}</b></div>`; }).join('')}</div>
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  $('#bk').onclick = back || titleScreen;
}
