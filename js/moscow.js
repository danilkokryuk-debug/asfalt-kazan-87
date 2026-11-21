// Москва — вторая кампания (1985–1998). Открывается только после прохождения кампании Казани.
// Игра идёт по адресу ?city=moscow: своя карта, свои сохранения (asfalt_m_*), свои заведения и свой сюжет (события с msk: true).
// При каждом входе — ролик-вступление (vid/msk_intro.mp4) и заставка «МОСКВА». Ролик грузится целиком заранее, пока висит титул, — без подтормаживаний.
const MSK = CITY === 'moscow';
const MSK_D0 = dayNum(1985, 9, 1);
['t_m_kreml', 't_m_metro', 't_m_obshaga', 't_m_gorkogo', 't_m_arbat'].forEach(k => SCENE_IMG[k] = 1);

// общие события, которые имеют смысл и в Москве: незнакомцы, шоки 90-х, карьера, семья, бригада, кланы, арест и зона, долги
const MSK_RND = /^(x_|r_patrol$|r_militia$|r_wallet$)/;   // случайные встречи из Казани, которые подходят любому городу
const MSK_ANY = /^(x_|h9\d|ld_promo|ld_usb|fm_|bs_|cl_|g_|z_|k_uslovno|e_)/;
// ---------- московские люди: свои лица и портреты (img/p_m_*.jpg) ----------
const MA = (build, height, skin, hair, hairc, eyes, mark, x) => ({ build, height, skin, hair, hairc, eyes, mark: mark || 'none', ...x });
const MW = (hat, outer, shirt, pants, shoes, acc) => ({ hat, outer, shirt, pants, shoes, acc: acc || [] });
Object.assign(NPCS, {
  m_misha:   { name: 'Мишаня Казанский', app: MA('strong', 'normal', 's2', 'ezhik', 'black', 'brown'), wear: MW('h_none', 'o_kozhanka', 's_boi', 'p_levic', 'f_botinki') },
  m_sanych:  { name: 'Сан Саныч', app: MA('normal', 'normal', 's1', 'zaliz', 'grey', 'grey', 'none'), wear: MW('h_none', 'o_pidzhak', 's_vodolazka', 'p_school', 'f_tufli') },
  m_oleg:    { name: 'Олег', app: MA('thin', 'tall', 's1', 'zaliz', 'dark', 'grey'), wear: MW('h_none', 'o_pidzhak', 's_school', 'p_school', 'f_tufli') },
  m_georgiy: { name: 'Вор Георгий', app: MA('normal', 'normal', 's1', 'nol', 'grey', 'brown', 'scar'), wear: MW('h_none', 'o_dublenka', 's_vodolazka', 'p_school', 'f_tufli') },
  m_lena:    { name: 'Лена', app: MA('thin', 'short', 's1', 'kosa', 'blond', 'blue', 'none', { lips: true }), wear: MW('h_none', 'o_none', 's_kofta', 'p_varenki', 'f_kedy') },
  m_tolyan:  { name: 'Любер Толян', app: MA('strong', 'tall', 's1', 'nol', 'dark', 'grey'), wear: MW('h_none', 'o_none', 's_maika', 'p_triko', 'f_kedy') },
  m_vitek:   { name: 'Сосед Витёк', app: MA('thin', 'normal', 's1', 'chelka', 'rus', 'blue'), wear: MW('h_none', 'o_none', 's_telnyashka', 'p_triko', 'f_tapki') },
  m_garik:   { name: 'Валютчик Гарик', app: MA('thin', 'normal', 's2', 'probor', 'black', 'brown'), wear: MW('h_kozha', 'o_dublenka', 's_vodolazka', 'p_levic', 'f_salamandr') },
  m_komend:  { name: 'Валентина Петровна', app: MA('fat', 'short', 's1', 'zavivka', 'dark', 'brown', 'none', { lips: true }), wear: MW('h_none', 'o_none', 's_kofta', 'p_yubka', 'f_tapki') },
  m_arkadiy: { name: 'Кооператор Аркадий', app: MA('normal', 'normal', 's1', 'zaliz', 'dark', 'brown'), wear: MW('h_none', 'o_varenka', 's_vodolazka', 'p_varenki', 'f_botinki') },
});
['m_misha', 'm_sanych', 'm_oleg', 'm_georgiy', 'm_lena', 'm_tolyan', 'm_vitek', 'm_garik', 'm_komend', 'm_arkadiy'].forEach(k => { if (!PORTRAITS.includes(k)) PORTRAITS.push(k); });

// ---------- сюжет: в Казани не срабатывают московские события, в Москве — казанские ----------
checkStory = function () {
  for (const ev of Object.values(EV)) {
    const m = ev.mode || 'campaign';
    if (m !== 'any' && m !== S.mode) continue;
    if (m !== 'any' && !!ev.msk !== MSK) continue;
    if (MSK && !ev.msk && !MSK_ANY.test(ev.id)) continue;   // общие события в Москве — только городские системы, без казанского сюжета
    if (ev.trigger && (ev.repeat || !S.done[ev.id]) && ev.trigger(S)) { play(ev.id); return true; }
  }
  return false;
};
pickRandom = function (S, d) {
  const pool = Object.values(EV).filter(e => e.random && (MSK ? e.msk || MSK_RND.test(e.id) : !e.msk) && e.random(S, d));
  const w = e => MSK ? e.weight * (e.msk ? 3 : 0.5) : e.weight;   // в Москве свои встречи втрое чаще общих
  let r = Math.random() * pool.reduce((a, e) => a + w(e), 0);
  for (const e of pool) if ((r -= w(e)) < 0) return e.id;
  return MSK ? 'mk_r_tiho' : 'r_quiet';
};

if (MSK) {
  // ---------- заведения Москвы ----------
  PLACES.splice(0, PLACES.length,
    { id: 'm_resto', name: 'Ресторан «Метрополь»', d: 'center', k: 'resto', bg: 't_m_metropol', npc: 'oficiant' },
    { id: 'm_resto2', name: 'Ресторан «Арагви»', d: 'bauman', k: 'resto', bg: 't_m_aragvi', npc: 'oficiant' },
    { id: 'm_kafe', name: 'Кооперативное кафе «Ветерок»', d: 'rizhsky', k: 'bar', bg: 't_m_kafe', npc: 'barmen' },
    { id: 'm_bar1', name: 'Пивбар «Жигули» на Калининском', d: 'center', k: 'bar', bg: 't_m_pivbar', npc: 'barmen' },
    { id: 'm_bar2', name: 'Пивнушка у платформы', d: 'perovo', k: 'bar', bg: 't_m_pivbar', npc: 'barmen' },
    { id: 'm_bar3', name: 'Рюмочная на Таганке', d: 'taganka', k: 'bar', bg: 't_m_kafe', npc: 'barmen' },
    { id: 'm_bar4', name: 'Шашлычная у МКАД', d: 'solntsevo', k: 'bar', bg: 't_m_aragvi', npc: 'barmen' },
    { id: 'm_bar5', name: 'Закусочная «Минутка»', d: 'chertanovo', k: 'bar', bg: 't_m_kafe', npc: 'barmen' },
    { id: 'm_menty', name: 'Петровка, 38', d: 'center', k: 'police', bg: 't_m_petrovka', npc: 'militsioner' },
    { id: 'm_menty2', name: 'Отделение милиции', d: 'lyubertsy', k: 'police', bg: 't_m_otdel', npc: 'militsioner' },
    { id: 'm_hosp', name: 'Институт Склифосовского', d: 'rizhsky', k: 'hosp', bg: 't_m_sklif', npc: 'vrach' },
    { id: 'm_hosp2', name: 'Травмпункт', d: 'orekhovo', k: 'hosp', bg: 't_m_sklif', npc: 'vrach' },
    { id: 'm_rynok', name: 'Рижский рынок', d: 'rizhsky', k: 'market', bg: 't_m_rizhsky', npc: 'm_arkadiy' },
    { id: 'm_rynok2', name: 'Вещевой рынок в Лужниках', d: 'kuntsevo', k: 'market', bg: 't_m_luzhniki', npc: 'm_garik' },
    { id: 'm_rynok3', name: 'Вернисаж в Измайлово', d: 'izmailovo', k: 'market', bg: 't_m_arbat', npc: 'm_garik' },
    { id: 'm_bank', name: 'Сберкасса на Арбате', d: 'center', k: 'bank', bg: 't_m_sber', npc: 'kassir' },
    { id: 'm_bank2', name: 'Сберкасса в Медведково', d: 'medvedkovo', k: 'bank', bg: 't_m_sber', npc: 'kassir' },
    { id: 'm_barber', name: 'Парикмахерская на Арбате', d: 'center', k: 'barber', bg: 't_m_barber', npc: 'parikm' },
    { id: 'm_barber2', name: 'Парикмахерская «Чародейка»', d: 'tushino', k: 'barber', bg: 't_m_barber', npc: 'parikm' },
    { id: 'm_video', name: 'Видеосалон в подвале', d: 'koptevo', k: 'video', bg: 't_m_video', npc: 'kinomeh' },
    { id: 'm_kino', name: 'Кинотеатр «Россия»', d: 'center', k: 'video', bg: 't_m_dk', npc: 'kinomeh' },
    { id: 'm_dk', name: 'Подвальная качалка', d: 'lyubertsy', k: 'dk', bg: 't_m_luber', npc: 'm_tolyan' },
    { id: 'm_dk2', name: 'ДК ЗИЛ', d: 'taganka', k: 'dk', bg: 't_m_dk', npc: 'm_komend' },
    { id: 'm_sto', name: 'Гаражи в Долгопрудном', d: 'dolgo', k: 'sto', bg: 't_m_garazh', npc: 'mehanik' },
    { id: 'm_sto2', name: 'СТО «Жигули» на Варшавке', d: 'chertanovo', k: 'sto', bg: 't_m_garazh', npc: 'mehanik' },
    { id: 'm_avto', name: 'Автомагазин в Южном порту', d: 'podolsk', k: 'auto', bg: 't_m_azs', npc: 'm_garik' },
    { id: 'm_azs', name: 'АЗС на МКАД', d: 'balashikha', k: 'azs', bg: 't_m_azs', npc: 'muzhik' },
    { id: 'm_azs2', name: 'АЗС на Ленинградке', d: 'tushino', k: 'azs', bg: 't_m_azs', npc: 'muzhik' },
  );

  // ---------- общие тексты: казанские слова в московской игре ----------
  const MSK_WORDS = [['в Казани', 'в Москве'], ['по Казани', 'по Москве'], ['Казани', 'Москвы'], ['Казань', 'Москва'], ['Казанке', 'Яузе'], ['Казанку', 'Яузу'], ['Казанка', 'Яуза'], ['моталк', 'бригад']];
  const fixText = root => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { let t = n.nodeValue; if (!/Казан[ьиекуа]|моталк/.test(t) || (n.parentNode.closest && n.parentNode.closest('[data-raw]'))) continue; t = t.replace(/(из|до) Казани/g, '$1 @@KZ@@');   // «приехал из Казани» — это про героя, не трогаем
      MSK_WORDS.forEach(([a, b]) => t = t.split(a).join(b)); n.nodeValue = t.split('@@KZ@@').join('Казани'); } };
  const obs = () => { const m = document.getElementById('main'); if (m) new MutationObserver(() => fixText(m)).observe(m, { childList: true, subtree: true }); };
  document.getElementById('main') ? obs() : document.addEventListener('DOMContentLoaded', obs);

  // ---------- меню: логотип и кнопки ----------
  window.mskTitle = () => {
    const s = document.querySelector('.logo .s'); if (s) s.textContent = 'МОСКВА · 1985';
    const art = document.querySelector('.menuart'); if (art) { art.outerHTML = artHtml('t_m_kreml', 'menuart'); }
    const play = $('#play'); if (play && !$('#tokzn')) { play.onclick = () => { AUDIO.click(); playScreen(); };
      const b = document.createElement('button'); b.className = 'btn'; b.id = 'tokzn'; b.dataset.raw = 1; b.textContent = '← Вернуться в Казань'; $('#set') ? $('#set').after(b) : play.after(b);
      b.onclick = () => { location.href = location.pathname; }; }
    const note = document.querySelector('.menu .note'); if (note) note.textContent = '16+. Вымышленная история по мотивам событий 1980–90-х в Москве. Все персонажи вымышлены.';
  };
  const ps = playScreen; playScreen = () => { ps();
    const sub = document.querySelector('#new .sub'); if (sub) sub.textContent = 'Москва, 1985. Лимитчик из Казани в большом городе';
    const h = document.querySelector('.scene h2'); if (h) h.textContent = 'Кампания: Москва';
    $('#new').onclick = () => { const a = migrate(loadRaw('auto', 'campaign')); if (a && !a.ending && !confirm('Начать Москву заново? Текущее прохождение сотрётся.')) return; AUDIO.start(); mskCreate(); };
  };
}

// ---------- новый герой в Москве: та же анкета, но старт — осень 1985, общага лимитчиков ----------
function mskCreate() {
  createHero();
  const h = document.querySelector('.scene h2'); if (h) h.textContent = 'Кто ты? Ты приехал из Казани';
  const lb = [...document.querySelectorAll('.scene label')].find(l => /Район/.test(l.textContent)); if (lb) lb.textContent = 'Район, где тебе дали общагу';
  $('#go').onclick = () => {
    const fam = $('#fm').value;
    S = newState({ name: $('#nm').value.trim() || 'Андрей', app: S0app(), wear: S0wear(), home: $('#hm').value, fam, dengi: 25, semya: fam === 'drunk' ? 30 : 60 });
    S.city = 'moscow'; S.day = MSK_D0; S.at = S.home; S.flags.msk = 1;
    S.age0 = 17 - Math.floor((MSK_D0 - 1) / 365.25);   // осенью 1985 герою 17: лимита на ЗИЛ, общага
    log(`${S.name} сходит с казанского поезда. Москва, ${DIST[S.home].name}.`);
    save('day'); view = 'map';
    card(['Москва', 'сентябрь 1985'], () => card(['Здесь никто', 'не знает твоего имени', 'Пока'], toMap, 3400, 't_m_metro'), 3000, 't_m_kreml');
  };
}
// createHero держит внешность в замыкании — берём её с превью
const S0app = () => { const c = $('#spr'); return (c && c.__app) || { ...DEFAULT_APP }; };
const S0wear = () => { const c = $('#spr'); return (c && c.__wear) || { ...DEFAULT_WEAR, acc: [...DEFAULT_WEAR.acc] }; };
{ const dh = drawHero; drawHero = (cv, app, wear, ...r) => { if (cv && cv.id === 'spr') { cv.__app = app; cv.__wear = wear; } return dh(cv, app, wear, ...r); }; }

// ---------- ролик-вступление: при каждом входе в Москву ----------
// качаем файл целиком в память ещё на титульном экране: дальше он играет из памяти, без рывков сети
const MSK_VID = MSK && typeof fetch === 'function' && typeof __TEST === 'undefined'
  ? fetch('vid/msk_intro.mp4').then(r => r.ok ? r.blob() : null).then(b => b && URL.createObjectURL(b)).catch(() => null) : Promise.resolve(null);
function mskIntro(done) {
  const el = document.createElement('div'); el.className = 'mskintro';
  el.innerHTML = `<div class="mi-back" style="background-image:url('vid/msk_poster.jpg')"></div><video playsinline preload="auto"></video><div class="mi-load">Москва…</div><div class="mi-vign"></div><button class="mi-skip">Пропустить ›</button>
    <div class="mi-title"><div class="mi-bg" style="background-image:url('img/t_m_kreml.jpg')"></div><div class="mi-snow"></div>
      <h1>МОСКВА</h1><div class="mi-y">1985 — 1998</div><div class="mi-t">Новый город. Новые правила. Ты здесь чужой.</div><div class="mi-tap">нажми, чтобы начать</div></div>`;
  document.body.appendChild(el);
  const v = el.querySelector('video'); AUDIO.duck && AUDIO.duck(true);
  let stage = 0;
  const reveal = () => { if (stage) return; stage = 1; v.pause(); el.classList.add('rev'); AUDIO.sfx && AUDIO.sfx('slam');
    setTimeout(() => { stage = 2; }, 1600); };
  const finish = () => { if (stage !== 2) return; stage = 3; el.classList.add('out'); AUDIO.duck && AUDIO.duck(false);
    setTimeout(() => { el.remove(); done(); }, 700); };
  v.onended = reveal; v.onerror = reveal;
  el.querySelector('.mi-skip').onclick = e => { e.stopPropagation(); reveal(); };
  el.onclick = () => (stage === 2 ? finish() : null);
  setTimeout(() => el.querySelector('.mi-skip').classList.add('on'), 1500);
  const start = src => { if (stage) return; v.src = src || 'vid/msk_intro.mp4'; el.classList.add('play');
    const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(reveal); }); };
  Promise.race([MSK_VID, new Promise(r => setTimeout(() => r(null), 6000))]).then(start);   // медленная сеть — играем потоком
  setTimeout(() => { if (!stage) reveal(); }, 20000);   // ролик так и не пошёл — всё равно идём дальше
}

// ---------- концовки Москвы ----------
Object.assign(ENDINGS, {
  msk_street: { title: 'Хозяин Рижского', text: S => `Девяносто восьмой год. Доллар снова скачет, банки лопаются, а твои ларьки, автосервисы и рынок работают.
Мишани больше нет — Солнцево так и не простило ту стрелку. Ты стоишь на Красной площади в метель и думаешь, что Москва никого не любит. Она просто платит тем, кто не отвёл глаза.

Что будет дальше — неизвестно.` },
  msk_mvd: { title: 'Полковник с Петровки', text: S => `Девяносто восьмой. На твоём столе — дела всех, с кем ты когда-то стоял на Рижском рынке.
Сан Саныч ушёл на пенсию и оставил тебе сейф и совет: «Сажай тех, кого можешь, и не трогай тех, кого не надо». Ты пока не решил, какая половина совета правильная.

Что будет дальше — неизвестно.` },
  msk_gov: { title: 'Человек из Белого дома', text: S => `Девяносто восьмой. Дефолт смыл банк Олега, но не тебя: ты успел пересесть в кабинет на Краснопресненской.
Тебе звонят те, кому ты когда-то носил коробки. Ты отвечаешь не всем. Лимитчик из казанской общаги теперь решает, кому в этой стране давать подряды.

Что будет дальше — неизвестно.` },
  msk_lost: { title: 'Москва не поверила', text: S => `Девяносто восьмой. Ты так и не выбрал, с кем ты. Общага, рынок, стройка, снова общага.
Москва пропустила тебя сквозь себя, как пропускает миллионы. Билет до Казани стоит недорого. Ты пока его не купил.` },
});
{ const en = ending; ending = (...a) => { if (MSK && S && S.ending && /^msk_/.test(S.ending)) { const m = metaGet(); if (!m.mskDone) { m.mskDone = true; metaPut(m); } } return en(...a); }; }

// ---------- сюжет Москвы ----------
const MD = (y, m, d) => dayNum(y, m, d);
const after = (id, y, m, d) => S => !!S.flags.msk && !!S.done[id] && S.day >= MD(y, m, d);
const line = S => S.flags.m_line || 'none';
const M = (id, o) => def(id, { msk: true, ...o });

M('mk_start', { title: 'Общага лимитчиков', bg: 't_m_obshaga', trigger: S => !!S.flags.msk,
  lines: ['Четыре железные кровати, плитка на тумбочке, в окне — трубы ЗИЛа. Комендантша выдала ключ и бельё и сказала: «Водку не пить, баб не водить, через год — пропишем».',
    ['m_vitek', 'Казанский? Слыхали про ваших. У вас там, говорят, район на район ходят. Тут, брат, всё иначе: тут район на район — это ещё цветочки.'],
    'Москва шумит за окном. До Красной площади — сорок минут на метро. До настоящей жизни — неизвестно сколько.'],
  choices: [
    { t: 'Завтра на завод. По-честному', fx: { dengi: 10, sovest: 5, flag: 'm_zil' }, txt: 'Конвейер, мастер, талоны на обед. Деньги небольшие, зато свои.' },
    { t: 'Сначала посмотреть город', fx: { um: 1, flag: 'm_walk' }, txt: 'Ты гуляешь до ночи: Арбат, Горького, метро. Город огромный и чужой — и в нём можно стать кем угодно.' },
  ] });

M('mk_metro', { title: 'Маяковская', bg: 't_m_metro', trigger: after('mk_start', 1985, 10, 5),
  lines: ['Мраморные арки, мозаика на потолке, поезд гудит в тоннеле. Рядом встаёт парень в кожанке и вдруг говорит по-татарски.',
    ['m_misha', 'Земляк? Я ж слышу — казанский говор. Я Мишаня, с Хади Такташ. Мы тут на Рижском рынке стоим, наших человек сорок. Москва — она большая, а свои — они свои.'],
    ['m_misha', 'Будет туго — приходи на Рижский. Спросишь Мишаню Казанского.']],
  choices: [
    { t: 'Записать, где его найти', fx: { flag: 'm_mishanya', uvazh: 2 }, txt: 'Мишаня хлопает по плечу: «Свои своих не бросают». Поезд уносит его к центру.' },
    { t: 'Вежливо кивнуть и уйти', fx: { sovest: 3 }, txt: 'Ты не для того уехал из Казани, чтобы снова стоять за кем-то.' },
  ] });

M('mk_arbat', { title: 'Арбат', bg: 't_m_arbat', card: ['Весна 1986', 'Арбат стал пешеходным'], trigger: after('mk_metro', 1986, 5, 10),
  lines: ['Фонари, художники, гитары. Панки с ирокезами, хиппи с фенечками. Девушка с этюдником просит не загораживать свет.',
    ['m_lena', 'Ты не местный, да? Тут все чужие, не стесняйся.'],
    'И тут с переулка выходят они: клетчатые штаны, короткие стрижки, плечи шире дверей. Любера приехали «чистить» центр от неформалов.',
    ['m_tolyan', 'Э, волосатые! Москва — для нормальных пацанов! А ты, крепкий, чего с ними стоишь? Ты с нами или с ними?']],
  choices: [
    { t: 'Встать с люберами', fx: { flag: 'm_luber', sila: 1, uvazh: 4, sovest: -6 }, txt: 'Ты идёшь с ними по Арбату. Гитары летят в стороны. Лена смотрит на тебя так, что лучше бы ударила.' },
    { t: 'Заступиться за Лену', chk: ['sila', 4], ok: { txt: 'Ты ставишь Толяна на колено. Любера отходят, обещая вернуться. Лена пишет на этюднике свой телефон.', fx: { flag: 'm_lena', uvazh: 3, sovest: 5, lyub: 5 } },
      no: { txt: 'Тебя сбивают с ног, но Лену не трогают — пока ты лежал, она убежала. Вечером она находит тебя в общаге с бинтами.', fx: { flag: 'm_lena', zdor: -18, sovest: 5, lyub: 4 } } },
    { t: 'Уйти в переулок', fx: { sovest: -2 }, txt: 'Не твоя война. Пока не твоя.' },
  ] });

M('mk_luber', { title: 'Подвалы', bg: S => S.flags.m_luber ? 't_m_luber' : 't_m_arbat', trigger: after('mk_arbat', 1986, 9, 1),
  lines: S => S.flags.m_luber ? ['Подвал пятиэтажки. Штанга из трамвайной оси, гантели из чугуна. Лампочка без абажура.',
      ['m_tolyan', 'Ты казанский, а казанских тут уважают: у вас там всё по-взрослому. Качайся с нами. В Москве без своих не выжить.']]
    : ['Лена ведёт тебя в подвальный рок-клуб. Гитары, дым, ребята, которые поют то, за что ещё вчера сажали.',
      ['m_lena', 'Видишь? Тут свобода. А там, на улице, — ваши драки. Выбирай, с кем ты.']],
  choices: S => S.flags.m_luber ? [
    { t: 'Остаться с люберами', fx: { join: 'lyubertsy', sila: 2, uvazh: 5 }, txt: 'Теперь ты свой в Люберцах. Клетчатые штаны выдают на следующий день.' },
    { t: 'Покачаться — и только', fx: { sila: 1 }, txt: 'Железо — да. Ходить строем — нет.' },
  ] : [
    { t: 'Остаться с Леной', fx: { lyub: 8, sovest: 4, um: 1 }, txt: 'Вы гуляете до утра по пустой Москве. Впервые этот город кажется своим.' },
    { t: 'Это не моё', fx: { lyub: -3 }, txt: 'Лена пожимает плечами. Её телефон у тебя остаётся.' },
  ] });

M('mk_rizhsky', { title: 'Рижский рынок', bg: 't_m_rizhsky', card: ['1987', 'Кооперативы'], trigger: after('mk_luber', 1987, 11, 15),
  lines: S => ['Закон о кооперации — и рынок взорвался. Ларьки, кожанки, варёнки, видеокассеты, джинсы «Монтана». Деньги, которых тут не видели никогда.',
    ['m_misha', S.flags.m_mishanya ? 'Земляк! Я ж говорил — найдёшь. Видишь, кооператоры? Они все платят. Нам. Кто не платит — у того товар горит.' : 'Ты, что ли, казанский из общаги? Мне про тебя говорили. Кооператоры платят нам. Хочешь — будешь собирать.'],
    ['m_misha', 'Солнцевские хотят рынок себе. Нам нужны свои, кто не побежит.']],
  choices: [
    { t: 'Встать с казанскими', fx: { join: 'rizhsky', dengi: 40, mil: 5, uvazh: 4, flag: 'm_kazanskie' }, txt: 'Первую пачку тебе суёт в карман кооператор-обувщик. Руки у него трясутся. Твои — нет.' },
    { t: 'Отказаться', fx: { sovest: 5 }, txt: 'Мишаня пожимает плечами: «Москва передумывать не даёт два раза. Но ты заходи».' },
  ] });

M('mk_fork', { title: 'Три двери', bg: 't_m_raikom', card: ['Зима 1988', 'Каждый выбирает дверь'], trigger: after('mk_rizhsky', 1988, 2, 1),
  lines: ['За одну неделю к тебе приходят трое.',
    ['m_sanych', 'Сан Саныч, Петровка, тридцать восемь. Ты парень крепкий и с головой. Мне нужны такие — в розыск. Пока вы режете друг друга на рынках, Москву растаскивают. Иди к нам.'],
    ['m_oleg', 'Олег, райком комсомола. Мы открываем молодёжный кооператив — центр научно-технического творчества. Деньги будут, связи будут. Через пять лет у этих людей будет вся страна. Нам нужны свои.'],
    ['m_misha', 'А мы — твои. Казанские. С нами уже не пропадёшь.']],
  choices: [
    { t: 'Петровка: в милицию', fx: S => { S.flags.m_line = 'mvd'; if (S.gang) { applyFx({ leave: true, uvazh: -15 }); } return { sovest: 6, um: 1, log: 'Сан Саныч взял тебя в розыск.' }; },
      txt: 'Удостоверение пахнет клеем. Мишаня при встрече отворачивается. Сан Саныч говорит: «Привыкай. Теперь ты для них — мусор, а для меня — опер».' },
    { t: 'Райком: кооператив и власть', fx: S => { S.flags.m_line = 'gov'; return { yaz: 1, dengi: 30, log: 'Ты в комсомольском кооперативе Олега.' }; },
      txt: 'Кабинет с портретом Ленина, графин, зелёное сукно. Олег наливает коньяк: «За новую экономику». Деньги здесь ходят тише, чем на рынке, — и больше.' },
    { t: 'Улица: остаться со своими', fx: S => { S.flags.m_line = 'street'; if (!S.gang) applyFx({ join: 'rizhsky' }); return { uvazh: 5, avt: 2 }; },
      txt: 'Мишаня обнимает тебя: «Казанские своих не сдают». Через неделю у тебя свои пять человек.' },
  ] });

M('mk_kafe', { title: 'Кооперативное кафе', bg: 't_m_kafe', trigger: after('mk_fork', 1988, 9, 10),
  lines: S => ['Маленькое кафе: самодельная вывеска, кассетник, на стенах — фото Парижа из журнала. Хозяин считает деньги. В дверях — двое бритых.',
    line(S) === 'mvd' ? ['m_sanych', 'Вот они, рэкетиры. Возьмём с поличным — будет первое твоё дело.']
      : line(S) === 'gov' ? ['m_oleg', 'Хозяину нужна регистрация в исполкоме. Без нас он её не получит. С нас — бумага, с него — процент.']
      : ['m_misha', 'Кафе новое, платить не хочет. Объясни ему, что в Москве так не принято.']],
  choices: S => line(S) === 'mvd' ? [
    { t: 'Брать с поличным', chk: ['lovk', 5], ok: { txt: 'Пачка меченых денег, наручники, протокол. Сан Саныч кивает: «Первый пошёл».', fx: { uvazh: 5, avt: 3, sovest: 4 } },
      no: { txt: 'Один ушёл через кухню. Второго взяли. Хозяин теперь боится и вас, и их.', fx: { uvazh: 2, zdor: -10 } } },
  ] : line(S) === 'gov' ? [
    { t: 'Оформить «помощь в регистрации»', fx: { dengi: 50, sovest: -5, yaz: 1 }, txt: 'Конверт уходит в исполком, второй — тебе. Никто никого не бил. Это и пугает.' },
    { t: 'Сделать по закону', fx: { sovest: 6, dengi: 10 }, txt: 'Олег морщится: «По закону у нас ещё никто не богател».' },
  ] : [
    { t: 'Объяснить хозяину', chk: ['avt', 4], ok: { txt: 'Он платит. С тех пор кофе тебе — за счёт заведения.', fx: { dengi: 60, mil: 8, uvazh: 4 } },
      no: { txt: 'Он звонит на Петровку. Уходите через чёрный ход.', fx: { mil: 12 } } },
    { t: 'Оставить его в покое', fx: { sovest: 6, uvazh: -3 }, txt: 'Мишаня молчит весь вечер.' },
  ] });

M('mk_metropol', { title: '«Метрополь»', bg: 't_m_metropol', trigger: after('mk_kafe', 1989, 12, 1),
  lines: S => ['Витражный купол, фонтан, красные скатерти. Иностранцы, артисты, люди без профессии с золотыми часами.',
    ['m_georgiy', `Садись, ${S.name}. Я о тебе слышал. Казанский, а держишься как москвич. Скоро в этой стране всё будет продаваться — и заводы, и люди. Кто окажется рядом с правильными людьми, тот и будет жить.`],
    ['m_georgiy', 'Мне нужен человек, который умеет молчать.']],
  choices: S => [
    { t: 'Принять предложение', fx: { flag: 'm_vor', dengi: 80, avt: 4, mil: 6, sovest: -4 }, txt: line(S) === 'mvd' ? 'Ты соглашаешься — и вечером всё рассказываешь Сан Санычу. Теперь ты внутри. Опасная игра.' : 'Георгий кивает. Под тарелкой у тебя оказывается конверт.' },
    { t: 'Отказать вежливо', fx: { sovest: 4, uvazh: 2 }, txt: 'Георгий улыбается: «Умный. Ещё встретимся». Почему-то от этих слов холодно.' },
  ] });

M('mk_gorkogo', { title: 'Улица Горького', bg: 't_m_gorkogo', card: ['1990', 'В Москве открылся «Макдоналдс»'], trigger: after('mk_metropol', 1990, 2, 1),
  lines: ['На Пушкинской — очередь в «Макдоналдс» длиннее, чем в Мавзолей. Неон гостиниц, «Волги», такси, фарцовщики шепчут «чейндж, чейндж».',
    ['m_garik', 'Доллар по десять. Завтра будет по двадцать, вот увидишь. Бери, пока я добрый.']],
  choices: [
    { t: 'Купить долларов на всё', fx: S => { const n = Math.min(100, Math.max(0, S.st.dengi)); return { dengi: -n, flag: 'm_usd', log: `Отдал ${n} р. валютчику. Риск.` }; }, txt: 'Вы считаете купюры в подворотне. Он не обманул. В этот раз.' },
    { t: 'Не связываться', fx: { sovest: 2 }, txt: 'Восемьдесят восьмая статья — валютные операции. Ещё действует.' },
  ] });
// доллары, купленные в 1990, после 1992 стоят в десятки раз дороже
M('mk_usd_win', { title: 'Твои доллары', bg: 't_m_bank', trigger: S => !!S.flags.msk && S.flags.m_usd && S.day >= MD(1992, 3, 1),
  lines: ['Цены отпустили. Рубль рухнул. Доллары, которые ты прятал под матрасом, стоят теперь как квартира.'], fx: { dengi: 400, um: 1 }, choices: [{ t: 'Вот это Москва', txt: 'Ты впервые понимаешь, как делаются деньги в новой стране: не руками — головой и временем.' }] });

M('mk_putch', { title: 'Белый дом', bg: 't_m_belyi1991', card: ['19 августа 1991', 'По телевизору — «Лебединое озеро»'], trigger: after('mk_gorkogo', 1991, 8, 19),
  lines: S => ['Танки на Калининском. У Белого дома — баррикады из троллейбусов и арматуры. Дождь, костры, триколоры.',
    line(S) === 'mvd' ? ['m_sanych', 'Приказ — не вмешиваться. Мой приказ тебе — смотри, кто где стоит. Через три дня эти люди будут страной править.']
      : line(S) === 'gov' ? ['m_oleg', 'Райкома больше нет. Комсомола больше нет. Решай быстро: мы сейчас — или с ними, или никто.']
      : ['m_misha', 'Пока все на баррикадах, ларьки на Рижском без присмотра. Солнцевские уже там.']],
  choices: [
    { t: 'Встать на баррикаду', fx: { sovest: 10, uvazh: 4, flag: 'm_barric', zdor: -5 }, txt: 'Три ночи под дождём. Утром двадцать второго толпа сносит памятник на Лубянке. Ты был здесь — это навсегда.' },
    { t: 'Пока все там — работать', fx: { dengi: 80, sovest: -8, mil: 8 }, txt: 'Город без власти. Три дня, за которые одни стали героями, а другие — богатыми.' },
    { t: 'Сидеть в общаге у телевизора', fx: { um: 1 }, txt: 'Ты смотришь, как рождается новая страна, по чёрно-белому «Рекорду».' },
  ] });

M('mk_luzh', { title: 'Лужники', bg: 't_m_luzhniki', card: ['1992', 'Цены отпущены'], trigger: after('mk_putch', 1992, 4, 1),
  lines: S => ['Вокруг стадиона — бесконечные ряды. Челноки с клетчатыми сумками из Турции и Польши. Инженеры продают свитера, учительницы — сапоги.',
    line(S) === 'street' ? ['m_misha', 'Здесь сто тысяч человек в день. Каждый ряд кому-то платит. Нам нужен этот угол.']
      : line(S) === 'mvd' ? ['m_sanych', 'Каждый ряд кому-то платит. Узнай кому — и мы узнаем, кто в Москве главный.']
      : ['m_oleg', 'Я уже не инструктор — председатель правления банка. Аренду земли под рынок выдаёт исполком. А исполком — это мы.']],
  choices: S => [
    { t: line(S) === 'street' ? 'Взять ряд под себя' : line(S) === 'mvd' ? 'Составить схему рынка' : 'Оформить аренду на «своих»',
      fx: line(S) === 'street' ? { dengi: 90, mil: 10, uvazh: 5 } : line(S) === 'mvd' ? { uvazh: 4, avt: 3, um: 1 } : { dengi: 120, sovest: -6, yaz: 1 },
      txt: 'Лужники гудят, как улей. Теперь часть этого гула — твоя.' },
    { t: 'Помочь знакомой учительнице продать сапоги', fx: { sovest: 6, dengi: -5 }, txt: 'Мелочь. Но вечером ты вспоминаешь мать.' },
  ] });

M('mk_belyi1993', { title: 'Октябрь', bg: 't_m_belyi1993', card: ['4 октября 1993', 'Танки бьют по Белому дому'], trigger: after('mk_luzh', 1993, 10, 4),
  lines: S => ['Холодное утро. Танки на Калининском мосту бьют по зданию, которое два года назад защищали. Верхние этажи в чёрном дыму. На набережной — зеваки, как в кино.',
    line(S) === 'mvd' ? 'Ты в оцеплении. Мимо проносят раненых. Сан Саныч молчит и курит одну за другой.'
      : line(S) === 'gov' ? 'Олег звонит с утра: «Мы на правильной стороне. Запомни: на правильной». Вчера он говорил иначе.'
      : 'Мишаня смотрит из джипа: «Кто бы ни победил — ларьки нужны всем».'],
  choices: [
    { t: 'Помогать выносить раненых', fx: { sovest: 10, zdor: -8, uvazh: 3 }, txt: 'Кровь на рукавах до вечера. Ты не спрашиваешь, на чьей они стороне.' },
    { t: 'Продать съёмку иностранцам', fx: { dengi: 120, sovest: -6 }, txt: 'CNN платит наличными. Ты смотришь на доллары и не можешь вспомнить, что снимал.' },
  ] });

M('mk_strelka', { title: 'Стрелка у МКАД', bg: 't_m_strelka', trigger: after('mk_belyi1993', 1993, 11, 20),
  lines: S => ['Пустырь за кольцевой. Туман. Джипы с включёнными фарами друг против друга. Кожанки, руки в карманах.',
    line(S) === 'mvd' ? ['m_sanych', 'Солнцевские и казанские делят Рижский. Наш человек внутри — ты. Если начнётся стрельба — мы рядом.']
      : ['m_misha', 'Солнцевские хотят Рижский. Говорить будешь ты — у тебя язык подвешен. Если не договоримся...']],
  choices: S => [
    { t: 'Договориться', chk: ['yaz', 6], ok: { txt: 'Рынок делят пополам. Никто не стреляет. Через месяц про эту стрелку говорит вся Москва.', fx: { avt: 6, uvazh: 6, flag: 'm_strelka_ok' } },
      no: { txt: 'Слово за слово — и выстрел из тумана. Мишаню увозят в Склиф. Он не доживает до утра.', fx: { zdor: -20, uvazh: 3, flag: 'm_mishanya_dead' } } },
    { t: line(S) === 'mvd' ? 'Дать сигнал группе захвата' : 'Ударить первыми', chk: ['sila', 6],
      ok: { txt: line(S) === 'mvd' ? 'ОМОН кладёт обе стороны лицом в грязь. Тебя «задерживают» вместе со всеми — легенда цела.' : 'Солнцевские уезжают. Рижский — ваш. Надолго ли?', fx: { avt: 5, mil: 10, uvazh: 5 } },
      no: { txt: 'Тебя везут в Склиф с дырой в плече. Москва запомнила: казанские слабее.', fx: { zdor: -35, uvazh: -4 } } },
  ] });

M('mk_bank', { title: 'Чёрный вторник', bg: 't_m_bank', card: ['11 октября 1994', 'Рубль упал на четверть'], trigger: after('mk_strelka', 1994, 10, 11),
  lines: S => ['Мраморный холл, охрана в камуфляже, пейджеры пищат не переставая. В кассе — очередь. Курс на табло меняют каждые полчаса.',
    ['m_oleg', line(S) === 'gov' ? 'Это не кризис, это возможность. Кто сегодня в рублях — тот завтра никто. Переводи всё в доллары через наш банк.' : 'Мы старые знакомые. Хочешь — открою тебе счёт. Под хороший процент. Очень хороший.']],
  choices: [
    { t: 'Вложить деньги в банк Олега', fx: S => { const n = Math.min(200, Math.max(0, S.st.dengi)); S.flags.m_bankin = n; return { dengi: -n, log: `Положил ${n} р. в банк Олега.` }; }, txt: 'Олег жмёт руку двумя руками. Так жмут, когда очень нужны деньги.' },
    { t: 'Держать наличными', fx: { um: 1 }, txt: 'Под матрасом не платят процентов. Зато и не исчезают.' },
  ] });

M('mk_dacha', { title: 'Рублёвка', bg: 't_m_dacha', card: ['Лето 1996', 'Выборы'], trigger: after('mk_bank', 1996, 6, 20),
  lines: S => ['Кирпичный особняк с башенками в соснах. Чёрные джипы и «мерседесы», охрана у ворот. Внутри — те, кто два года назад стоял на рынках, и те, кто их сажал.',
    ['m_oleg', 'Выборы. От них зависит всё — будет ли у нас эта дача через год. Нужно отвезти коробку. Не спрашивай, что в ней.']],
  choices: S => [
    { t: 'Отвезти коробку', fx: { dengi: 150, avt: 5, sovest: -8, flag: 'm_box' }, txt: 'Коробка из-под ксерокса тяжелее, чем кажется. Ты не открываешь её. Это и есть пропуск наверх.' },
    { t: 'Отказаться', fx: { sovest: 8, avt: -2 }, txt: 'Олег улыбается ровно так, как когда-то Георгий в «Метрополе».' },
    ...(S.flags.m_bankin ? [{ t: 'Забрать свои деньги из банка', fx: S => ({ dengi: S.flags.m_bankin * 2, log: 'Олег вернул вклад с процентами — перед выборами ему нужны друзья.' }), txt: 'Пачки в целлофане. Ты пересчитываешь их в машине.' }] : []),
  ] });

M('mk_final', { title: 'Красная площадь', bg: 't_m_kreml', card: ['Декабрь 1998', 'После дефолта'], trigger: after('mk_dacha', 1998, 12, 1),
  lines: S => ['Метель. Красная стена, Спасская башня, звезда в снегу. Ты стоишь один посреди площади, где тринадцать лет назад был туристом из Казани.',
    S.flags.m_mishanya_dead ? 'Мишаню хоронили на Хованском. Казанских пришло меньше, чем ты думал.' : 'Мишаня теперь владеет тремя автосервисами и говорит, что «завязал».',
    'Банки лопнули в августе. Кто-то разорился, кто-то купил полстраны за копейки. А ты — ты ещё здесь.'],
  choices: S => [{ t: 'Подвести итог', fx: { end: S.flags.m_line === 'street' ? 'msk_street' : S.flags.m_line === 'mvd' ? 'msk_mvd' : S.flags.m_line === 'gov' ? 'msk_gov' : 'msk_lost' }, txt: 'Москва. Девяносто восьмой. Что будет дальше — неизвестно.' }] });
// после событий 1992 года Москва живёт по правилам девяностых (влияние, кланы, бригады)
M('mk_era90', { title: 'Новая страна', bg: 't_m_gorkogo', trigger: S => !!S.flags.msk && !S.flags.ch7 && S.day >= MD(1992, 1, 2),
  lines: ['Нет больше Союза. На Горького — уже Тверская. Ларьки, «Сникерсы», первые «мерседесы». Москва девяностых начинается.'], fx: { flag: 'ch7' }, choices: [{ t: 'Дальше', txt: '' }] });

// ---------- Москва: свои заказы на карте (казанские в Москве не появляются, и наоборот) ----------
const JM = (id, o) => ({ id, min: 0, msk: true, gen: () => ({}), ...o });
const MSK_JOBS = [
  JM('jm_vagon', { max: 2, bg: 't_m_obshaga', who: 'm_vitek', title: () => 'Разгрузить вагон', text: () => 'Витёк зовёт на товарную станцию: вагон с капустой, платят наличными, бригадир не спрашивает прописку.',
    choices: S => [{ t: 'Разгрузить до утра', fx: { dengi: 12, sila: 1, zdor: -4 }, txt: 'Спина гудит, зато в кармане хрустит.' },
      { t: 'Унести мешок себе', chk: ['lovk', 4], ok: { txt: 'Мешок картошки в общагу — пир на весь этаж.', fx: { dengi: 6, sovest: -2, semya: 2 } }, no: { txt: 'Бригадир заметил. Без расчёта.', fx: { mil: 4 } } }] }),
  JM('jm_ochered', { max: 2, bg: 't_m_gorkogo', who: 'm_garik', title: () => 'Очередь за сапогами', text: () => 'В ГУМ завезли югославские сапоги. Гарик платит, если отстоишь очередь и купишь две пары на его деньги.',
    choices: S => [{ t: 'Отстоять', fx: { dengi: 8, ap: -1 }, txt: 'Пять часов в толпе. Номер на ладони ручкой: 214.' },
      { t: 'Пролезть без очереди', chk: ['yaz', 4], ok: { txt: '«Я за мамой стоял!» — и ты у прилавка.', fx: { dengi: 10 } }, no: { txt: 'Очередь едва не порвала тебя на тряпки.', fx: { zdor: -6 } } }] }),
  JM('jm_fartsa', { max: 3, bg: 't_m_gorkogo', who: 'm_garik', title: () => 'Джинсы у «Интуриста»', text: () => 'У гостиницы «Интурист» финны продают джинсы и жвачку. Гарику нужен кто-то, кто постоит «на шухере».',
    choices: S => [{ t: 'Стоять на шухере', chk: ['lovk', 4], mini: 'shuher', ok: { txt: 'Сделка прошла. Гарик отсчитывает долю.', fx: { dengi: 18, mil: 3 } }, no: { txt: 'Оперотряд. Бежали через двор.', fx: { mil: 10 } } },
      { t: 'Отказаться', fx: { sovest: 2 }, txt: 'Гарик пожимает плечами: «Москва любит смелых».' }] }),
  JM('jm_arbat_portret', { max: 3, bg: 't_m_arbat', who: 'm_lena', title: () => 'Охрана художников', text: () => 'Лена просит: любера опять грозились порвать картины на Арбате. Постоять рядом в субботу?',
    choices: S => [{ t: 'Постоять', fx: { lyub: 4, sovest: 4, uvazh: 1 }, txt: 'Никто не пришёл. Лена рисует тебя углём — на память.' },
      { t: 'Взять деньги с художников «за охрану»', fx: { dengi: 15, sovest: -6, lyub: -6 }, txt: 'Платят. Лена с тобой больше не здоровается.' }] }),
  JM('jm_luber_rejd', { max: 3, bg: 't_m_luber', who: 'm_tolyan', title: () => 'Рейд в центр', text: () => 'Толян собирает своих: электричкой в Москву, «чистить» Пушкинскую от металлистов.',
    choices: S => [{ t: 'Поехать с люберами', fx: { uvazh: 4, sila: 1, sovest: -5, mil: 6 }, txt: 'Металлисты разбежались, но не все.', go: 'f_random' },
      { t: 'Не ехать', fx: { uvazh: -2 }, txt: 'Толян морщится: «Слабак».' }] }),
  JM('jm_koop_dolya', { min: 1, bg: 't_m_kafe', who: 'm_arkadiy', title: () => 'Доля с кооператива', text: () => 'Кооператор Аркадий шьёт варёнки в подвале. Ему нужна «крыша», пока его не нашли другие.',
    choices: S => [{ t: 'Взять под себя', chk: ['avt', 4], ok: { txt: 'Аркадий платит раз в неделю, точно в срок.', fx: s => { if (typeof addPoint === 'function') addPoint('Кооператив Аркадия', 10); return { mil: 5 }; } }, no: { txt: 'Аркадий уже платит солнцевским. Они приехали спросить, кто ты.', go: 'f_random' } },
      { t: 'Помочь по-честному с бумагами', fx: { dengi: 10, sovest: 4, um: 1 }, txt: 'Регистрация в исполкоме — твоими ногами и его деньгами.' }] }),
  JM('jm_rizhsky_sbor', { min: 1, bg: 't_m_rizhsky', who: 'm_misha', title: () => 'Сбор на Рижском', text: () => 'Мишаня: обойти ряды, собрать с кооператоров. Кто тянет — запомнить.',
    choices: S => [{ t: 'Собрать по-тихому', fx: { dengi: 25, mil: 6 }, txt: 'Конверты, рукопожатия, бегающие глаза.' },
      { t: 'Прижать того, кто тянет', fx: { dengi: 35, sovest: -6, avt: 2, mil: 10 }, txt: 'Больше он не тянет.' }] }),
  JM('jm_katran', { min: 2, bg: 't_m_metropol', who: 'm_georgiy', title: () => 'Катран на Бауманской', text: () => 'Георгий держит подпольную игру. Нужен человек у двери: впускать своих, не впускать чужих.',
    choices: S => [{ t: 'Стоять у двери', fx: { dengi: 30, avt: 2, mil: 6 }, txt: 'Ночь, дым, карты, тихие голоса. Утром Георгий кивает: «Надёжный».' },
      { t: 'Сыграть самому', chk: ['um', 6], mini: 'karty', ok: { txt: 'Обыграл цеховика с Таганки.', fx: { dengi: 60 } }, no: { txt: 'Проигрался в ноль.', fx: { dengi: -20 } } }] }),
  JM('jm_videosalon', { max: 4, bg: 't_m_video', who: 'm_garik', title: () => 'Кассеты для видеосалона', text: () => 'Гарику пришла партия кассет: боевики, ужастики. Отвезти в подвальный видеосалон в Коптево.',
    choices: S => [{ t: 'Отвезти', chk: ['lovk', 4], ok: { txt: 'Довёз. Хозяин салона жмёт руку и зовёт на вечерний сеанс.', fx: { dengi: 15 } }, no: { txt: 'ОБХСС на выходе из метро. Кассеты изъяли.', fx: { mil: 10, dengi: -5 } } }] }),
  JM('jm_sanych_info', { bg: 't_m_petrovka', who: 'm_sanych', title: () => 'Разговор на Петровке', text: () => 'Сан Саныч зовёт «на чай». Хочет знать, кто держит Рижский и кто новые люди у Георгия.',
    choices: S => [{ t: 'Рассказать', fx: { mil: -10, sovest: -4, uvazh: -3, flag: 'm_stuk' }, txt: 'Саныч записывает. «Ты ничего не говорил, я ничего не слышал».' },
      { t: 'Промолчать', fx: { mil: 5, uvazh: 2 }, txt: '«Ну-ну, — говорит Саныч. — Москва маленькая. Встретимся».' }] }),
  JM('jm_oleg_bumaga', { bg: 't_m_raikom', who: 'm_oleg', title: () => 'Бумага из исполкома', text: () => 'Олегу нужно, чтобы кто-то отвёз конверт в исполком и забрал оттуда подписанное разрешение.',
    choices: S => [{ t: 'Отвезти конверт', fx: { dengi: 20, yaz: 1, sovest: -3 }, txt: 'Чиновник даже не поднимает глаз. Конверт исчезает в ящике стола.' },
      { t: 'Заглянуть в конверт', chk: ['lovk', 5], ok: { txt: 'Там двести рублей и записка с фамилиями. Ты запомнил фамилии.', fx: { um: 1, flag: 'm_oleg_secret' } }, no: { txt: 'Олег заметил надорванный край. Холодный взгляд.', fx: { uvazh: -3 } } }] }),
  // девяностые
  JM('jm_9_kiosk', { era90: true, min: 1, bg: 't_m_luzhniki', who: 'm_arkadiy', title: () => 'Ларьки у метро', text: () => 'У «ВДНХ» выросли новые ларьки: «Сникерсы», спирт «Рояль», кассеты. Чьи они — непонятно.',
    choices: S => [{ t: 'Поставить под себя', chk: ['avt', 6], ok: { txt: 'Теперь платят тебе.', fx: s => { if (typeof addPoint === 'function') addPoint('Ларьки у ВДНХ', 14); if (typeof vlAdd === 'function') vlAdd(s, 2); return { mil: 8 }; } }, no: { txt: 'Ларьки — медведковских. Разговор на кулаках.', go: 'f_random' } }] }),
  JM('jm_9_chelnok', { era90: true, bg: 't_m_luzhniki', who: 'babka:Челночница', title: () => 'Челноки в Лужниках', text: () => 'Учительница-челночница привезла из Стамбула кожанки. С неё требуют «за место» сразу три бригады.',
    choices: S => [{ t: 'Взять по-божески', fx: { dengi: 30, sovest: -2 }, txt: 'Платит. И благодарит, что не трое.' },
      { t: 'Объяснить остальным, что она под тобой', chk: ['avt', 6], ok: { txt: 'Две бригады уходят. Учительница шьёт тебе кожаный плащ.', fx: { sovest: 6, avt: 2 } }, no: { txt: 'Объяснять пришлось руками.', go: 'f_random' } }] }),
  JM('jm_9_bank', { era90: true, min: 2, bg: 't_m_bank', who: 'm_oleg', title: () => 'Обналичка', text: () => 'Банку Олега нужно «обналичить» платёжки фирм-однодневок. Сумки с деньгами — через всю Москву.',
    choices: S => [{ t: 'Везти', chk: ['lovk', 6], ok: { txt: 'Доехал. Процент — твой.', fx: { dengi: 120, mil: 8 } }, no: { txt: 'На Садовом «пробили колесо». Сумку пытались увести.', go: 'f_random' } }] }),
  JM('jm_9_strelka', { era90: true, min: 3, bg: 't_m_strelka', who: 'm_misha', title: () => 'Стрелка за автосервис', text: () => 'Ореховские положили глаз на автосервис в Чертаново. Встреча — на пустыре у МКАД.',
    choices: S => [{ t: 'Договориться', chk: ['yaz', 7], ok: { txt: 'Сервис остаётся за тобой. Ореховские уехали без выстрелов.', fx: { avt: 4, uvazh: 4 } }, no: { txt: 'Слово за слово.', go: 'f_random' } },
      { t: 'Уступить', fx: { uvazh: -6, sovest: 3 }, txt: 'Живой — уже хорошо.' }] }),
  JM('jm_9_dacha', { era90: true, min: 3, bg: 't_m_dacha', who: 'm_georgiy', title: () => 'Охрана на Рублёвке', text: () => 'У Георгия гости — серьёзные люди из министерства. Нужны свои у ворот, без лишних вопросов.',
    choices: S => [{ t: 'Стоять у ворот', fx: { dengi: 80, avt: 3 }, txt: 'Чёрные машины всю ночь. Ты запомнил номера.' }] }),
];
MSK_JOBS.forEach(t => { TASKS.push(t); TPL[t.id] = t; });
if (typeof PRE90 !== 'undefined') PRE90.push('jm_vagon', 'jm_ochered', 'jm_fartsa', 'jm_arbat_portret', 'jm_luber_rejd', 'jm_videosalon');   // приметы 80-х — в 90-х их нет
{ const je = jobEraOk; jobEraOk = (S, t) => {
  if (MSK ? !(t.msk || /^j_[mg]_/.test(t.id)) : t.msk) return false;   // в Москве — московские заказы и служебные (милиция, власть)
  return je(S, t);
}; }

// ---------- Москва: случайные встречи на улицах ----------
const MR = (id, o) => def(id, { msk: true, weight: 2, ...o });
MR('mk_r_tiho', { random: () => true, weight: 3, title: 'Тихо', bg: 't_m_metro',
  lines: () => [V('Метро гудит. Женщина вяжет, мальчик спит на плече у отца. Сегодня тихо.', 'Снег на Садовом. Троллейбус медленно ползёт мимо. Москва занята своими делами.', 'В подземном переходе кто-то играет на баяне. Ты бросаешь двадцать копеек.')],
  choices: [{ t: 'Дальше', txt: '' }] });
MR('mk_r_luber', { random: (S, d) => !era90(S) && ['center', 'bauman', 'taganka'].includes(d), title: 'Любера', bg: 't_m_arbat',
  lines: [['chuzhoy:Любер', 'Э, патлатый! А, нет, не патлатый… Ты откуда? Москвич? Люберцы — вот где пацаны!']],
  choices: [{ t: '«Я казанский»', chk: ['avt', 3], ok: { txt: '«Казанский? Уважаем. Иди».', fx: { uvazh: 1 } }, no: { txt: '«Казанский? Сейчас проверим».', go: 'f_random' } },
    { t: 'Уйти в метро', chk: ['lovk', 4], mini: 'pobeg', ok: { txt: 'Двери закрылись перед их носом.' }, no: { txt: 'Догнали на эскалаторе.', go: 'f_random' } }] });
MR('mk_r_propiska', { random: (S, d) => S.st.mil > 10 || d === 'center', title: 'Проверка документов', bg: 't_m_gorkogo',
  lines: [['militsioner', 'Молодой человек, документы. Прописка московская? Лимитная? А в центре что забыл?']],
  choices: [{ t: 'Показать справку с ЗИЛа', chk: ['um', 4], ok: { txt: '«Ладно, иди, рабочий класс».' }, no: { txt: 'До утра в отделе «для выяснения».', fx: { mil: 6, ap: -2 } } },
    { t: 'Сунуть трёшку', fx: { dengi: -3, mil: -2 }, txt: 'Трёшка исчезает. Документы больше не интересны.' }] });
MR('mk_r_karman', { random: () => true, weight: 1, title: 'Карманник', bg: 't_m_metro',
  lines: ['В давке на «Площади Революции» чья-то рука лезет к тебе в карман.'],
  choices: [{ t: 'Схватить за руку', chk: ['lovk', 5], ok: { txt: 'Карманник вырывается и исчезает в толпе. Деньги на месте.', fx: { uvazh: 1 } }, no: { txt: 'Кошелька нет. Двери закрываются.', fx: S => ({ dengi: -Math.min(S.st.dengi, 5 + rnd(10)) }) } },
    { t: 'Не заметить', fx: S => ({ dengi: -Math.min(S.st.dengi, 3 + rnd(6)) }), txt: 'Дома карман пустой.' }] });
MR('mk_r_inostr', { random: (S, d) => d === 'center', title: 'Иностранец', bg: 't_m_kreml',
  lines: [['muzhik:Турист', 'Excuse me… Red Square? Kremlin? Я немного говорю. Ты помочь? Я дать доллар.']],
  choices: [{ t: 'Проводить', fx: { dol: 1, yaz: 1 }, txt: 'Он фотографирует тебя на фоне Спасской башни. Доллар жжёт карман.' },
    { t: 'Предложить «обмен по хорошему курсу»', chk: ['yaz', 5], ok: { txt: 'Обменял ему по-«хорошему». Для себя.', fx: { dengi: 15, sovest: -4, mil: 4 } }, no: { txt: 'Он позвал милиционера.', fx: { mil: 10 } } }] });
MR('mk_r_babka', { random: () => true, weight: 1, title: 'Бабушка с сумками', bg: 't_m_metro',
  lines: ['Бабушка с двумя авоськами застряла у эскалатора. Москвичи бегут мимо.'],
  choices: [{ t: 'Донести', fx: { sovest: 4, zdor: 2 }, txt: 'Бабушка суёт тебе пирожок с капустой: «Сразу видно — не москвич».' }, { t: 'Пройти мимо', txt: 'Так тут все делают.' }] });
MR('mk_r_metal', { random: (S, d) => !era90(S), title: 'Металлисты', bg: 't_m_arbat',
  lines: ['У Пушкинской металлисты в косухах и цепях. Один протягивает кассету: «Слышал? Это огонь».'],
  choices: [{ t: 'Взять послушать', fx: { sovest: 2, um: 1 }, txt: 'В общаге кассетник воет так, что соседи стучат по батарее.' }, { t: '«Не моё»', txt: 'Он пожимает плечами. Цепи звенят.' }] });
MR('mk_r_9_bratki', { random: (S, d) => era90(S), title: 'Джип на тротуаре', bg: 't_m_strelka',
  lines: [['chuzhoy:Бритый', 'Э, ты чей? Тут наша улица. Кто тебя сюда пустил?']],
  choices: [{ t: 'Назвать, под кем ходишь', chk: ['avt', 6], ok: { txt: 'Бритый морщится, но отходит: «Ладно, передавай привет».', fx: { uvazh: 2 } }, no: { txt: '«Не знаю таких».', go: 'f_random' } },
    { t: 'Уйти', fx: { uvazh: -1 }, txt: 'Джип газует вслед.' }] });
MR('mk_r_9_mmm', { random: (S, d) => era90(S) && S.day < MD(1994, 8, 1), title: 'Билеты пирамиды', bg: 't_m_bank',
  lines: ['Очередь у пункта продажи «билетов» до самого угла. Люди несут ваучеры, сбережения, деньги за проданные квартиры.', ['babka:Пенсионерка', 'Сынок, говорят, к лету в десять раз вырастет. Берёшь?']],
  choices: [{ t: 'Купить на все', fx: S => ({ dengi: -Math.min(80, Math.max(0, S.st.dengi)) }), txt: 'Бумажки с портретом. Ты прячешь их в книгу. Пусть растут.' }, { t: 'Не верить', fx: { um: 1 }, txt: 'Что-то тут нечисто.' }] });
MR('mk_r_9_sber', { random: (S, d) => era90(S), weight: 1, title: 'Сберкнижка', bg: 't_m_obshaga',
  lines: [['m_komend', 'У меня на книжке было пять тысяч. На машину копила. Теперь на них — батон хлеба. Это как же так, а?']],
  choices: [{ t: 'Помочь деньгами', fx: { dengi: -10, sovest: 6 }, txt: 'Валентина Петровна плачет и крестит тебя, хоть и комсомолка всю жизнь.' }, { t: 'Промолчать', txt: 'Таких, как она, — полстраны.' }] });
MR('mk_r_vitek', { random: (S, d) => d === S.home, weight: 1, title: 'Витёк', bg: 't_m_obshaga',
  lines: [['m_vitek', 'Слушай, земляк… ну, почти земляк. Займи пятёрку до получки? Я отдам, честное комсомольское.']],
  choices: [{ t: 'Занять', fx: S => { S.flags.mk_vitek = S.day; return { dengi: -5, sovest: 3 }; }, txt: 'Витёк сияет.' }, { t: 'Отказать', txt: '«Ну и ладно», — и полвечера дуется.' }] });
MR('mk_r_vitek2', { random: (S, d) => S.flags.mk_vitek && S.day - S.flags.mk_vitek > 14, weight: 3, title: 'Долг', bg: 't_m_obshaga',
  lines: [['m_vitek', 'Держи! Пять — и ещё рубль сверху, за терпение. Я ж говорил — отдам.']],
  fx: S => { delete S.flags.mk_vitek; return { dengi: 6 }; }, choices: [{ t: 'Взять', txt: 'В Москве, оказывается, бывают и честные люди.' }] });
