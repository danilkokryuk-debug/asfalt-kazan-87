// Особые задания: появляются крайне редко (в среднем раз в 2–3 недели игры), горят на карте фиолетовым.
// Награда — лимитированная вещь, которой нет на барахолке. Висят всего сутки.
const W2 = '#f0f0f0', G2 = '#e5c04a';
const LIMITED = [
  { id: 'lim_olimp80', slot: 'outer', name: 'Олимпийка сборной СССР-80', bonus: { lovk: 1, yaz: 1 }, v: { k: 'zip', c: '#b02020', s: G2, n: 2, col: G2 }, desc: 'Настоящая, с Олимпиады. Таких в Казани три штуки.' },
  { id: 'lim_volk', slot: 'outer', name: 'Кожанка «Ночной волк»', bonus: { sila: 1, yaz: 1 }, v: { k: 'leather', c: '#0e0e10', hl: '#7a1a1a', zipd: true }, desc: 'Чёрная, с красной подкладкой. Говорят, снята с байкера из Риги.' },
  { id: 'lim_dublenka', slot: 'outer', name: 'Дублёнка «Югославия»', bonus: { yaz: 2 }, v: { k: 'coat', c: '#5a3a22', fur: '#f4ecdc' }, desc: 'Импортная, мягкая как масло. Директор универмага плакал.' },
  { id: 'lim_dzhins', slot: 'outer', name: 'Джинсовка «Левайс»', bonus: { lovk: 1, yaz: 1 }, v: { k: 'jacket', c: '#3a5a8a', sp: '#7a9ac4', btn: '#c8a040' }, desc: 'Привезена моряком из Гамбурга. Пахнет заграницей.' },
  { id: 'lim_aerodrom', slot: 'hat', name: 'Кепка-аэродром Седого', bonus: { yaz: 2 }, v: { k: 'aerodrom', c: '#1a1612' }, desc: 'Седой отдал её сам. Это больше, чем кепка.' },
  { id: 'lim_dinamo', slot: 'hat', name: 'Петушок «Динамо»', bonus: { lovk: 1 }, v: { k: 'knit', c: '#1f3f9e', c2: W2, s: W2, pom: W2 }, desc: 'С хоккея, из рук самого вратаря.' },
  { id: 'lim_ushanka', slot: 'hat', name: 'Ушанка из ондатры', bonus: { sila: 1, yaz: 1 }, v: { k: 'ushanka', c: '#3a2a1e' }, desc: 'Ондатра. Такая шапка — как погоны: сразу видно, кто ты.' },
  { id: 'lim_kepka_m', slot: 'hat', name: 'Кепка таксиста-«бомбилы»', bonus: { um: 1, yaz: 1 }, v: { k: 'flat', c: '#2a2a2a', c2: '#141414', band: '#c8402f' }, desc: 'Помнит все дворы Казани.' },
  { id: 'lim_vdv', slot: 'shirt', name: 'Тельняшка ВДВ', bonus: { sila: 2 }, v: { k: 'stripes', c: W2, c2: '#2a7ac0' }, desc: 'Голубые полоски. Подарок дембеля, который вернулся из Афгана.' },
  { id: 'lim_lm', slot: 'shirt', name: 'Футболка с концерта «Ласкового мая»', bonus: { yaz: 1 }, v: { k: 'tee', c: '#f0a0c0' }, desc: 'Розовая, с автографом. Девчонки смотрят иначе.' },
  { id: 'lim_montana', slot: 'pants', name: 'Варёнки «Монтана» (оригинал)', bonus: { lovk: 1, yaz: 1 }, v: { k: 'jeans', c: '#9ab8d8', sp: '#e0ecf6' }, desc: 'Не самопал. Настоящая «Монтана» с орлом на заклёпке.' },
  { id: 'lim_adidas', slot: 'shoes', name: 'Кроссовки «Adidas» (фирма)', bonus: { lovk: 2 }, v: { k: 'sneaker', c: '#f8f8f8', s: '#2a4a9e', sole: '#e8e0c8' }, desc: 'Три полоски, не четыре. Фирма, а не «Адибас».' },
  { id: 'lim_komand', slot: 'acc', name: 'Часы «Командирские»', bonus: { um: 1 }, v: { k: 'watch', c: '#2a2a2a' }, desc: 'С танком на циферблате. Подарок генерала.' },
  { id: 'lim_pechatka', slot: 'acc', name: 'Перстень-печатка', bonus: { yaz: 2 }, v: { k: 'ring' }, desc: 'Золото, с вензелем. Такие носят только серьёзные люди.' },
  { id: 'lim_bismark', slot: 'acc', name: 'Цепь «Бисмарк»', bonus: { yaz: 1, sila: 1 }, v: { k: 'chain' }, desc: 'Толщиной в палец. Видно с другого конца рынка.' },
  { id: 'lim_finka', slot: 'wpn', name: 'Финка с наборной рукоятью', bonus: { sila: 2, lovk: 1 }, wp: { hit: 3, heat: 8, sovest: -2 }, v: { k: 'knife' }, desc: 'Сделана на зоне. Рукоять из цветного плексигласа.' },
  { id: 'lim_kastet', slot: 'wpn', name: 'Латунный кастет «Сапог»', bonus: { sila: 3 }, wp: { hit: 3, heat: 5 }, v: { k: 'kastet', c: '#d8b040' }, desc: 'Довоенный, тяжёлый, блестит как золото.' },
  { id: 'lim_nagan', slot: 'wpn', name: 'Наган деда', bonus: { sila: 4, yaz: 1 }, wp: { hit: 4, heat: 15, sovest: -5 }, v: { k: 'pistol', c: '#3a3a42' }, desc: 'Прошёл всю войну. Теперь — твой. Лучше бы так и лежал в сундуке.' },
];
for (const it of LIMITED) { Object.assign(it, { price: 0, limited: true }); ITEMS.push(it); ITEM[it.id] = it; }
const limFree = S => LIMITED.filter(i => !S.owned.includes(i.id));
function limGive(s, id) { const it = ITEM[id]; if (!it || s.owned.includes(id)) return null; s.owned.push(id); log(`Лимитированная вещь: «${it.name}».`); return it; }

const SPECIAL = [
  { id: 's_olimp', bg: 'pl_kino', who: 'chuzhoy:Фарцовщик Жора', title: () => '★ Груз из Москвы',
    text: p => `Из Москвы идёт посылка с олимпийской формой. Кто первый встретит проводника на вокзале — тот и заберёт. Чужие тоже знают. Награда: «${ITEM[p.prize].name}».`,
    choices: (S, p) => [
      { t: 'Успеть первым', chk: ['lovk', 6], mini: 'pobeg', ok: { txt: 'Проводник отдаёт свёрток тебе. Чужие опоздали на минуту.', fx: { avt: 4, limit: p.prize } }, no: { txt: 'Чужие были быстрее.', go: 'f_random' } },
      { t: 'Перекупить у проводника', req: { dengi: 40 }, fx: { dengi: -40, limit: p.prize }, txt: 'Деньги решают. Свёрток твой.' }] },
  { id: 's_sedoy', bg: 'garazhi', who: 'sedoy', title: () => '★ Просьба Седого',
    text: p => `Седой просит лично: найти того, кто обнёс его гараж. Тихо, без милиции. «Сделаешь — не забуду». Награда: «${ITEM[p.prize].name}».`,
    choices: (S, p) => [
      { t: 'Искать по рынкам', chk: ['um', 6], ok: { txt: 'Вор — сосед по гаражу. Седой разбирается сам. А тебе протягивает подарок.', fx: { avt: 6, uvazh: 4, limit: p.prize } }, no: { txt: 'След оборвался. Седой молча кивает.', fx: { uvazh: -2 } } },
      { t: 'Расспросить скорлупу', chk: ['yaz', 6], ok: { txt: 'Малой видел, кто грузил «Жигули». Седой доволен.', fx: { avt: 5, limit: p.prize } }, no: { txt: 'Скорлупа ничего не знает. Или боится.', fx: {} } }] },
  { id: 's_hokkey', bg: 'korobka', who: 'muzhik:Тренер «Динамо»', title: () => '★ Матч на коробке',
    text: p => `Мастера из «Динамо» играют показательный матч с дворовыми. Забьёшь им — получишь подарок из рук вратаря: «${ITEM[p.prize].name}».`,
    choices: (S, p) => [
      { t: 'Выйти на лёд', chk: ['lovk', 7], mini: 'udar', ok: { txt: 'Шайба в девятке! Вратарь снимает шапку и бросает тебе.', fx: { uvazh: 6, limit: p.prize } }, no: { txt: 'Мастера обыграли вас всухую. Зато было весело.', fx: { zdor: -4 } } }] },
  { id: 's_moryak', bg: 't_pristan', who: 'muzhik:Моряк из загранки', title: () => '★ Моряк из Гамбурга',
    text: p => `На пристани моряк из загранки распродаёт свой баул. Самое ценное отдаст только тому, кто поможет пронести мимо таможни. Награда: «${ITEM[p.prize].name}».`,
    choices: (S, p) => [
      { t: 'Пронести баул', chk: ['lovk', 7], ok: { txt: 'Таможенник смотрел в другую сторону. Моряк хлопает тебя по плечу.', fx: { mil: 4, limit: p.prize } }, no: { txt: 'Таможня! Баул изъят, вас отпустили с испугом.', fx: { mil: 12 } } },
      { t: 'Отвлечь таможенника', chk: ['yaz', 7], ok: { txt: 'Пока ты рассказывал про больную бабушку, всё пронесли.', fx: { limit: p.prize } }, no: { txt: 'Таможенник не поверил ни слову.', fx: { mil: 8 } } }] },
  { id: 's_dembel', bg: 't_r_vokzal', who: 'bacha', title: () => '★ Встреча героя',
    text: p => `С Афгана возвращается пацан с нашего двора — с орденом. Его надо встретить и защитить от вокзальных, которые уже ждут. Награда: «${ITEM[p.prize].name}».`,
    choices: (S, p) => [
      { t: 'Встать стеной', fx: fight('Вокзальные', 4, 7, { txt: 'Вокзальные разбежались. Дембель снимает с себя подарок и отдаёт тебе.', fx: { uvazh: 8, limit: p.prize } }, { txt: 'Отбились, но с потерями.', fx: { zdor: -15 } }, { flee: false }), go: 'k_fight' }] },
  { id: 's_ded', bg: 'kuhnya', who: 'babka:Бабушка-фронтовичка', title: () => '★ Медаль деда',
    text: p => `У бабушки-соседки украли дедовские медали. Говорят, их видели у скупщика на рынке. Она плачет и обещает отдать за это самое дорогое, что осталось: «${ITEM[p.prize].name}».`,
    choices: (S, p) => [
      { t: 'Вернуть медали', chk: ['sila', 6], ok: { txt: 'Скупщик отдал всё сам, увидев твоих пацанов. Бабушка крестит тебя и отдаёт свёрток.', fx: { sovest: 10, limit: p.prize } }, no: { txt: 'Скупщик успел продать. Бабушка всё равно благодарит.', fx: { sovest: 4 } } },
      { t: 'Выкупить (50 р.)', req: { dengi: 50 }, fx: { dengi: -50, sovest: 8, limit: p.prize }, txt: 'Медали снова на кителе деда. Бабушка не может говорить.' }] },
  { id: 's_koncert', bg: 't_r_koncert', who: 'natasha', title: () => '★ За кулисами',
    text: p => `«Ласковый май» даёт концерт во Дворце спорта. Если пробраться за кулисы — можно получить автограф и сувенир для Наташи. И для себя: «${ITEM[p.prize].name}».`,
    choices: (S, p) => [
      { t: 'Через служебный вход', chk: ['lovk', 7], ok: { txt: 'Вы за кулисами! Наташа визжит. Солист раздаёт сувениры.', fx: { lyub: 12, natasha: 10, limit: p.prize } }, no: { txt: 'Охрана поймала у двери. Зато Наташа смеётся до слёз.', fx: { lyub: 4 } } },
      { t: 'Договориться с администратором', chk: ['yaz', 7], ok: { txt: '«Проходите, молодые люди». Лучший вечер в её жизни.', fx: { lyub: 10, natasha: 8, limit: p.prize } }, no: { txt: 'Администратор вызывает милицию.', fx: { mil: 6 } } }] },
  { id: 's_vor', bg: 't_r_kabinet', who: 'chuzhoy:Старый вор', title: () => '★ Старый вор',
    text: p => `Старый вор в законе проездом в Казани. Ему нужен надёжный человек на одну ночь — отвезти конверт. Не спрашивать, что внутри. Награда: «${ITEM[p.prize].name}».`,
    choices: (S, p) => [
      { t: 'Отвезти конверт', chk: ['um', 7], ok: { txt: 'Довёз, не открыл, не попался. Вор снимает с пальца перстень.', fx: { avt: 10, mil: 6, flag: 'vor_znakom', limit: p.prize } }, no: { txt: 'Хвост от самого вокзала. Конверт пришлось выбросить. Вор недоволен.', fx: { avt: -5, mil: 10 } } },
      { t: 'Отказаться', fx: { avt: -2 }, txt: '«Умный. Или трус». Он не уточняет, что именно.' }] },
];
SPECIAL.forEach(t => { const def0 = { min: 0, special: true, gen: S => { const free = limFree(S).filter(i => t.only ? t.only.includes(i.slot) : true); return free.length ? { prize: pick(free).id } : null; } };
  const full = { ...def0, ...t }; TASKS.push(full); TPL[t.id] = full; });

// Крайне редко: шанс ~0.4% в игровой час (примерно раз в 2–3 игровые недели), одно особое за раз, висит сутки
function specialHour() {
  if (!S) return;
  if ((S.jobs || []).some(j => TPL[j.id] && TPL[j.id].special) || Math.random() > 0.004) return;
  const t = pick(SPECIAL), p = TPL[t.id].gen(S); if (!p) return;
  const d = pick([S.home, 'center', ...[...NEIGHBORS[S.home]]].filter(x => DIST[x]));
  S.jobs.push({ uid: Date.now() % 1e9 + rnd(1000), id: t.id, p: { ...p, d }, d, until: now() + 1440, special: true });
  if (typeof toast === 'function') toast('На карте появилось особое задание ★');
}
