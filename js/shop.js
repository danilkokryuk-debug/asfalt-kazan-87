// Магазин «Берёзка»: премиальные вещи за «чеки» — внутриигровую валюту.
// Чеки и купленное — на весь аккаунт (не на одно сохранение): metaGet().cheki, metaGet().prem.
// Чеки дают: реклама за награду (3 раза в день, только в приложении) и наборы за реальные деньги (Google Play).
// Одежда и оружие появляются в гардеробе во всех сохранениях; машину можно «забрать» в каждую игру один раз.
const CHEK = 'чеков';
const AD_REWARD = 15, AD_PER_DAY = 3;
const PACKS = [   // id — как в Play Console → Монетизация → Товары. Цену в валюте страны игрока показывает Google Play
  { id: 'cheki_100', n: 100, tag: '' },
  { id: 'cheki_350', n: 350, tag: '+17%' },
  { id: 'cheki_1000', n: 1000, tag: 'выгодно' },
];

// ---- товары: одежда и оружие (видны в гардеробе, если куплены) ----
const P = (id, slot, name, prem, o) => ({ id, slot, name, price: 0, prem, limited: true, ...o });
const PREM_ITEMS = [
  P('h_p_pyzhik', 'hat', 'Шапка-«пыжик»', 40, { bonus: { yaz: 2 }, v: { k: 'ushanka', c: '#3a2a22' }, desc: 'Из оленьего меха. Носят завмаги и директора рынков. Теперь и ты.' }),
  P('h_p_kepka', 'hat', 'Кожаная кепка «Чемпион»', 30, { bonus: { yaz: 1, lovk: 1 }, v: { k: 'cap', c: '#151515', c2: GOLD, logo: 'text', lc: GOLD }, desc: 'Чёрная кожа, золотая надпись. Такую не сорвут — побоятся.' }),
  P('o_p_malina', 'outer', 'Малиновый пиджак «Золото»', 120, { bonus: { yaz: 2 }, v: { k: 'blazer', c: '#c0184a', btn: GOLD }, desc: 'С золотыми пуговицами. Девяностые приходят к тебе раньше всех.' }),
  P('o_p_olimp80', 'outer', 'Олимпийка «Олимпиада-80»', 50, { bonus: { lovk: 2 }, v: { k: 'zip', c: '#c8102e', s: W_, n: 3, col: W_, logo: 'adibas' }, desc: 'Та самая, со сборной. На районе таких нет ни у кого.' }),
  P('o_p_plash', 'outer', 'Кожаный плащ «Мюнхен»', 100, { bonus: { yaz: 2, sila: 1 }, v: { k: 'coat', c: '#0e0e10', fur: null }, desc: 'До пят, из Германии. Когда входишь — стихают разговоры.' }),
  P('o_p_shuba', 'outer', 'Шуба «Песец»', 150, { bonus: { yaz: 2 }, v: { k: 'coat', c: '#d8d4cc', fur: '#f2efe8', furry: true }, desc: 'Белая, пушистая, безумная. Город запомнит тебя навсегда.' }),
  P('o_p_bomber', 'outer', 'Бомбер «Top Gun»', 60, { bonus: { sila: 1, lovk: 1 }, v: { k: 'bomber', c: '#1f2a44', lin: GOLD, rib: BLK }, desc: 'Как у американских лётчиков из кино. Золотая подкладка.' }),
  P('p_p_mantana', 'pants', 'Джинсы «Mantana Gold»', 45, { bonus: { yaz: 2 }, v: { k: 'jeans', c: '#1c2c4a', seam: GOLD }, desc: 'Тёмные, с золотой строчкой. Фарцовщики за такие дерутся.' }),
  P('f_p_jordun', 'shoes', 'Кроссовки «Air Jordun Gold»', 60, { bonus: { lovk: 2 }, v: { k: 'sneaker', c: GOLD, s: BLK, sole: '#f0f0f0' }, desc: 'Золотые. Ноги сами несут на стрелку.' }),
  P('a_p_cep', 'acc', 'Цепь «Кайзер»', 90, { bonus: { yaz: 2 }, v: { k: 'chain' }, desc: 'Толще пальца, с крестом. Блестит даже в подъезде без лампочки.' }),
  P('a_p_rolex', 'acc', 'Часы «Ролекс» (настоящие)', 80, { bonus: { yaz: 2, um: 1 }, v: { k: 'watch', c: GOLD }, desc: 'Не «Электроника». Время на них стоит дороже.' }),
  P('a_p_ochki', 'acc', 'Очки в золотой оправе', 30, { bonus: { yaz: 1 }, v: { k: 'glasses', c: GOLD }, desc: 'Тёмные стёкла, золото. Взгляд не прочитать.' }),
  P('w_p_kastet', 'wpn', 'Латунный кастет «Медведь»', 80, { bonus: { sila: 2 }, wp: { hit: 3, heat: 3 }, v: { k: 'kastet', c: '#d4a640' }, desc: 'Тяжёлый, точёный, с гравировкой. Бьёт как медведь, а милиции — незаметно.' }),
  P('w_p_nunchaki', 'wpn', 'Хромированные нунчаки «Дракон»', 90, { bonus: { lovk: 2 }, wp: { hit: 3, heat: 3 }, v: { k: 'nunchaku' }, desc: 'Сталь и хром, как у Брюса Ли в кассетном фильме.' }),
  P('w_p_bita', 'wpn', 'Бита «Чикаго» с автографом', 130, { bonus: { sila: 2, lovk: 1 }, wp: { hit: 4, heat: 5 }, v: { k: 'bat' }, desc: 'Настоящая американская, с подписью звезды. Привёз моряк дальнего плавания.' }),
  P('w_p_gaz', 'wpn', 'Газовый пистолет «Удар»', 160, { bonus: { sila: 2, yaz: 1 }, wp: { hit: 3, heat: 4 }, v: { k: 'pistol', c: '#2a2a30' }, desc: 'Пугает как настоящий. Сажать за него не за что.' }),
];
// чем дороже вещь — тем сильнее: ступень по цене задаёт и статы, и прибавку к шансам (функцию вещи)
const TIER = p => p >= 150 ? { pct: 20, st: 3, n: 'легенда', c: '#e0703a' } : p >= 100 ? { pct: 15, st: 2, n: 'эпик', c: '#b070e0' } : p >= 60 ? { pct: 10, st: 2, n: 'редкая', c: '#5aa0e8' } : { pct: 5, st: 1, n: 'премиум', c: '#7ac07a' };
PREM_ITEMS.forEach(i => { const t = TIER(i.prem); i.bonus = Object.fromEntries(Object.keys(i.bonus || {}).map((k, j) => [k, j ? 1 : t.st])); });
PREM_ITEMS.forEach(i => { ITEMS.push(i); ITEM[i.id] = i; });   // в SHOP (барахолку) не попадают — он посчитан раньше

// ---- транспорт: только в CAR (в автосалоне не продаётся) ----
const PREM_CARS = [
  { id: 'p_java', t: 'moto', name: '«Ява» «Красная молния»', prem: 180, price: 1500, rank: 0, age: 16, speed: 0.55, yaz: 3, use: 8, tank: 5, desc: 'Хромированный бак, наклейка-молния. Самая быстрая на районе.' },
  { id: 'p_zubilo', t: 'car', name: 'ВАЗ-2108 «Зубило» на литье', prem: 220, price: 3200, rank: 0, age: 18, speed: 0.55, yaz: 3, use: 11, tank: 10, desc: 'Чёрная, тонировка, литые диски. Под окнами общаги — и все девчонки у окна.' },
  { id: 'p_chaika', t: 'car', name: 'ГАЗ-13 «Чайка»', prem: 350, price: 6000, rank: 0, age: 18, speed: 0.5, yaz: 4, use: 14, tank: 14, seats: 4, desc: 'Правительственная. Гаишники отдают честь, не разобравшись, кто внутри.' },
  { id: 'p_bmw', t: 'car', name: 'BMW «Вишня»', prem: 400, price: 1600, cur: '$', rank: 0, age: 18, speed: 0.45, yaz: 4, use: 13, tank: 13, seats: 4, desc: 'Тёмно-вишнёвая, пригнана из Германии. Акула, которую видно издалека.' },
];
PREM_CARS.forEach(c => { CAR[c.id] = c; if (typeof SCENE_IMG !== 'undefined') SCENE_IMG['veh_' + c.id] = 1; });
// премиальную машину нельзя продать в СТО: убираем «Продать…», если она под тобой
{ const pa = placeActions; placeActions = (S, p) => { const a = pa(S, p); const c = S && S.car && CAR[S.car.id]; return c && c.prem ? a.filter(x => !String(T(x.t)).startsWith('Продать ' + c.name)) : a; }; }

// ---- осенняя распродажа: до конца 30 ноября 2026, у каждой вещи своя скидка ----
const SALE_END = new Date(2026, 11, 1);   // 1 декабря 00:00 по времени игрока
const SALE = { h_p_kepka: 30, a_p_ochki: 30, h_p_pyzhik: 25, p_p_mantana: 25, o_p_olimp80: 35, o_p_bomber: 30, f_p_jordun: 40, a_p_rolex: 30, a_p_cep: 35,
  o_p_plash: 40, o_p_malina: 45, o_p_shuba: 50, w_p_kastet: 30, w_p_nunchaki: 35, w_p_bita: 40, w_p_gaz: 45, p_java: 30, p_zubilo: 35, p_chaika: 45, p_bmw: 50 };
const saleOn = () => Date.now() < SALE_END.getTime();
const priceOf = it => saleOn() && SALE[it.id] ? Math.max(1, Math.round(it.prem * (1 - SALE[it.id] / 100))) : it.prem;

// ---- кошелёк и владение ----
const SHM = () => { const m = metaGet(); m.cheki = m.cheki || 0; m.prem = m.prem || []; m.ads = m.ads || { d: '', n: 0 }; return m; };
const chekiN = () => SHM().cheki;
const premOwned = id => SHM().prem.includes(id);
const giveToSave = s => { if (!s || !s.owned) return; const own = SHM().prem.filter(id => ITEM[id]); s.owned = [...new Set([...s.owned, ...own])]; };
{ const ns = newState; newState = (...a) => { const s = ns(...a); giveToSave(s); return s; }; }   // новые игры — сразу с купленным
{ const tm = toMap; toMap = (...a) => { giveToSave(S); return tm(...a); }; }                     // старые сохранения — тоже
const addCheki = (n, why) => { const m = SHM(); m.cheki += n; metaPut(m); toast(`+${n} ${CHEK}${why ? ' · ' + why : ''}`); };

function buyPrem(id) {
  const m = SHM(), it = ITEM[id] || CAR[id], price = priceOf(it);
  if (m.prem.includes(id)) return;
  if (m.cheki < price) return toast(`Не хватает ${price - m.cheki} ${CHEK}`);
  m.cheki -= price; m.prem.push(id); metaPut(m);
  AUDIO.sfx && AUDIO.sfx('achievement'); toast(`Куплено: ${it.name}`);
  if (S && ITEM[id]) giveToSave(S);
}
// забрать машину в текущую игру (один раз на сохранение)
function takeCar(id) {
  const c = CAR[id]; if (!S) return;
  if (heroAge(S) < c.age) return toast(`Тебе ещё рано: ${VTYPE[c.t]} — с ${c.age} лет`);
  S.flags['prem_' + id] = 1;
  if (S.car && typeof GAR === 'function') { GAR(S).push({ ...S.car, legal: 1 }); toast('Старый транспорт — в гараже'); }
  S.car = { id, cond: 100, fuel: 100 }; save('auto'); AUDIO.ok(); toast(`${c.name} — твоя в этой игре`);
}

// ---- реклама за награду и покупки: через приложение (Capacitor-плагины), на сайте недоступны ----
const NATIVE = () => window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
const today = () => new Date().toISOString().slice(0, 10);
const adsLeft = () => { const a = SHM().ads; return a.d === today() ? Math.max(0, AD_PER_DAY - a.n) : AD_PER_DAY; };
async function watchAd() {
  if (!adsLeft()) return toast('На сегодня всё. Завтра будет ещё 3 раза');
  if (!(typeof ADS !== 'undefined' && ADS.ready())) return toast('Реклама доступна в приложении из Google Play');
  const ok = await ADS.rewarded();
  if (!ok) return toast('Реклама не досмотрена — чеки не начислены');
  const m = SHM(); if (m.ads.d !== today()) m.ads = { d: today(), n: 0 }; m.ads.n++; metaPut(m);
  addCheki(AD_REWARD, 'за рекламу');
}
async function buyPack(id) {
  if (!(typeof IAP !== 'undefined' && IAP.ready())) return toast('Покупки доступны в приложении из Google Play');
  const p = PACKS.find(x => x.id === id); const ok = await IAP.buy(id);
  if (ok) addCheki(p.n, 'спасибо за покупку!');
}

// ---- чеки в самой игре (немного, чтобы не ломать баланс) ----
const DAILY = 5, ACH_REWARD = 10, END_REWARD = 25;
const PRICES = {};   // цены наборов из Google Play, в валюте игрока
function dailyCheki() { const m = SHM(); if (m.daily === today()) return; m.daily = today(); m.cheki += DAILY; metaPut(m); setTimeout(() => toast(`+${DAILY} ${CHEK} · за то, что заглянул сегодня`), 1500); }
{ const ca = checkAch; checkAch = (...a) => { const n0 = metaGet().ach.length; const r = ca(...a); const n = metaGet().ach.length - n0; if (n > 0) addCheki(n * ACH_REWARD, 'за достижение'); return r; }; }
{ const ne = noteEnding; noteEnding = (name, ...a) => { const fresh = !metaGet().ends.includes(name); const r = ne(name, ...a); if (fresh) addCheki(END_REWARD, 'за новую концовку'); return r; }; }

// картинки предметов крупно (img/i_<id>.jpg); у кого нет — только спрайт на герое
const SHOP_PICS = Object.fromEntries(PREM_ITEMS.map(i => [i.id, 1]));   // у всех 16 вещей есть img/i_<id>.jpg

// ---- экран «Берёзки» ----
let shopTab = 'odezhda', shopBack = null;
const SHOP_TABS = { odezhda: 'Одежда', oruzhie: 'Оружие', transport: 'Транспорт', cheki: 'Чеки' };
function shopScreen(back, tab) {
  if (back) shopBack = back; if (tab) shopTab = tab;
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const m = SHM(), hero = S || { app: { ...DEFAULT_APP }, wear: { ...DEFAULT_WEAR, acc: [] } };
  const list = shopTab === 'odezhda' ? PREM_ITEMS.filter(i => i.slot !== 'wpn') : shopTab === 'oruzhie' ? PREM_ITEMS.filter(i => i.slot === 'wpn') : shopTab === 'transport' ? PREM_CARS : [];
  const bonus = b => b ? Object.entries(b).map(([k, v]) => `${STATS[k] || k} +${v}`).join(', ') : '';
  const card = it => {
    const own = premOwned(it.id), car = !!CAR[it.id] && !ITEM[it.id];
    const pr = priceOf(it), t = TIER(it.prem);
    const act = !own ? `<button class="btn main" data-buy="${it.id}" ${m.cheki < pr ? 'disabled' : ''}>🎫 ${pr !== it.prem ? `<s>${it.prem}</s> ` : ''}${pr} ${CHEK}${pr !== it.prem ? ` <span class="sh-sale">−${SALE[it.id]}%</span>` : ''}</button>`
      : car ? (S && !S.flags['prem_' + it.id] ? `<button class="btn main" data-take="${it.id}">Забрать в эту игру</button>` : `<span class="ch hi">${S ? 'уже в этой игре' : 'куплено'}</span>`)
      : `<span class="ch hi">куплено · в гардеробе</span>`;
    // вещь крупно (картинка из Flow, img/i_<id>.jpg) и рядом — как она сидит на герое
    const pic = car ? `<div class="sh-img" style="background-image:url('img/veh_${it.id}.jpg')"></div>`
      : `<div class="sh-pics">${SHOP_PICS[it.id] ? `<div class="sh-icon" style="background-image:url('img/i_${it.id}.jpg')"></div>` : ''}<canvas class="sh-spr" data-spr="${it.id}"></canvas></div>`;
    return `<div class="sh-item${own ? ' own' : ''}">${pic}
      <div class="sh-t"><span class="sh-tier" style="color:${t.c}">● ${t.n}</span><br><b>${it.name}</b><div class="sub">${it.desc}</div>
        <div class="sub hi">${car ? `${VTYPE[it.t]} · быстрее по городу · стиль +${it.yaz}` : bonus(it.bonus)}${it.wp ? ` · урон ${it.wp.hit}, внимание милиции ${it.wp.heat}` : ''}</div>
        ${PERK[it.id] ? `<div class="sub sh-perk">★ ${premPerkText(it.id)}</div>` : ''}
        <div class="fam-b">${act}</div></div></div>`;
  };
  const chekiTab = `<div class="sh-item"><div class="sh-t"><b>📺 Посмотреть рекламу</b><div class="sub">+${AD_REWARD} ${CHEK} за ролик. Сегодня осталось: ${adsLeft()} из ${AD_PER_DAY}.</div>
      <div class="fam-b"><button class="btn main" id="sh-ad" ${adsLeft() ? '' : 'disabled'}>Смотреть</button></div></div></div>
    <div class="sh-item"><div class="sh-t"><b>🎮 Чеки в самой игре</b><div class="sub">Каждый день, когда заходишь, — +${DAILY} ${CHEK}. Новое достижение — +${ACH_REWARD}. Новая концовка — +${END_REWARD}.</div></div></div>
    ${PACKS.map(p => `<div class="sh-item"><div class="sh-t"><b>🎫 ${p.n} ${CHEK}</b> ${p.tag ? `<span class="ch hi">${p.tag}</span>` : ''}<div class="sub">Набор чеков. Оплата через Google Play в валюте твоей страны.</div>
      <div class="fam-b"><button class="btn" data-pack="${p.id}">${PRICES[p.id] || (NATIVE() ? 'Загрузка цены…' : 'В приложении')}</button></div></div></div>`).join('')}
    ${NATIVE() ? '' : '<p class="note">Реклама и покупки работают в приложении из Google Play. В браузере можно тратить уже накопленные чеки.</p>'}`;
  if (shopTab === 'cheki' && typeof IAP !== 'undefined' && IAP.ready() && !PRICES._asked) { PRICES._asked = 1; IAP.prices().then(r => { if (r) { Object.assign(PRICES, r); if (document.querySelector('.shop')) shopScreen(); } }); }
  $('#main').innerHTML = `<div class="scene in shop" data-raw>
    ${saleOn() ? `<div class="sh-salebar">🍂 Осенняя распродажа — скидки до 50% до конца 30 ноября</div>` : ''}
    <div class="sh-head" style="background-image:url('img/t_shop.jpg')"><h2>«Берёзка»</h2><div class="sh-bal">🎫 ${m.cheki} ${CHEK}</div></div>
    <div class="tabs">${Object.entries(SHOP_TABS).map(([k, v]) => `<button class="${k === shopTab ? 'on' : ''}" data-tab="${k}">${v}</button>`).join('')}</div>
    ${shopTab === 'cheki' ? chekiTab : list.map(card).join('')}
    <p class="note">Премиальные вещи — навсегда и во всех сохранениях. У каждой есть своя функция, а высший статус «Король» — только с ними. Пройти игру можно и без них.</p>
    <div class="choices"><button class="btn" id="sh-back">Назад</button></div></div>`;
  document.querySelectorAll('[data-spr]').forEach(cv => { const it = ITEM[cv.dataset.spr]; const w = { ...hero.wear, acc: [...(hero.wear.acc || [])] };
    if (it.slot === 'acc') w.acc = [...w.acc, it.id]; else w[it.slot] = it.id; drawHero(cv, hero.app, w); });
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { AUDIO.click(); shopScreen(null, b.dataset.tab); });
  document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const it = ITEM[b.dataset.buy] || CAR[b.dataset.buy]; if (!confirm(`Купить «${it.name}» за ${priceOf(it)} ${CHEK}?`)) return; buyPrem(b.dataset.buy); shopScreen(); });
  document.querySelectorAll('[data-take]').forEach(b => b.onclick = () => { takeCar(b.dataset.take); shopScreen(); });
  document.querySelectorAll('[data-pack]').forEach(b => b.onclick = async () => { await buyPack(b.dataset.pack); shopScreen(); });
  if ($('#sh-ad')) $('#sh-ad').onclick = async () => { await watchAd(); shopScreen(); };
  $('#sh-back').onclick = () => { AUDIO.click(); (shopBack || titleScreen)(); };
}

// ---- входы: главное меню и игровое меню ----
{ const ts = titleScreen; titleScreen = (...a) => { ts(...a); if (typeof splashDone !== 'undefined' && splashDone && typeof __TEST === 'undefined') dailyCheki();
  const pl = $('#play'); if (pl && !$('#shop')) { const b = document.createElement('button'); b.className = 'btn'; b.id = 'shop'; b.innerHTML = `🛒 «Берёзка» <span class="ch hi">🎫 ${chekiN()}</span>`; ($('#cities') || pl).after(b); b.onclick = () => { AUDIO.click(); shopScreen(() => titleScreen()); }; }
}; }
{ const rm = renderMenu; renderMenu = (...a) => { rm(...a);
  const st = $('#st'); if (st && !$('#shop')) { const b = document.createElement('button'); b.className = 'btn'; b.id = 'shop'; b.innerHTML = `🛒 «Берёзка» <span class="ch hi">🎫 ${chekiN()}</span>`; st.before(b); b.onclick = () => { AUDIO.click(); shopScreen(() => { view = 'menu'; render(); }); }; }
}; }

// ---------------- что дают премиальные вещи ----------------
// chk — на какие проверки действует (первая — полная сила ступени, остальные — половина), week — эффект раз в неделю.
// Сила зависит от цены: премиум +5%, редкая +10%, эпик +15%, легенда +20%. Действует, пока вещь надета / машина под тобой.
const PERK = {
  o_p_malina: { chk: ['yaz', 'avt'], t: 'Сделки и переговоры' },
  o_p_shuba: { chk: ['yaz', 'avt'], t: 'Переговоры и авторитет на разборках' },
  o_p_plash: { chk: ['avt', 'yaz'], t: 'Разборки и стрелки' },
  o_p_olimp80: { chk: ['lovk'], t: 'Погони и уходы' },
  o_p_bomber: { chk: ['sila', 'lovk'], t: 'Драки' },
  h_p_pyzhik: { chk: ['yaz'], week: 'mil', t: 'Милиция не цепляется (−2 внимания в неделю), солидный вид' },
  h_p_kepka: { chk: ['sila'], t: 'Драки' },
  p_p_mantana: { chk: ['yaz'], week: 'lyub', t: 'Девушки замечают (любовь +1 в неделю)' },
  f_p_jordun: { chk: ['lovk'], t: 'Убежать от кого угодно' },
  a_p_cep: { chk: ['avt'], week: 'uvazh', t: 'Свои уважают (+1 уважения в неделю)' },
  a_p_rolex: { chk: ['um'], week: 'dengi', t: 'Время — деньги (+10 р. в неделю, в 90-х — больше)' },
  a_p_ochki: { chk: ['yaz', 'um'], t: 'Взгляд не прочитать' },
  w_p_kastet: { chk: ['sila'], t: 'Удар как у медведя, а милиция почти не замечает' },
  w_p_nunchaki: { chk: ['lovk', 'sila'], t: 'Быстрые удары' },
  w_p_bita: { chk: ['sila', 'avt'], t: 'Самый тяжёлый удар без огнестрела' },
  w_p_gaz: { chk: ['avt', 'sila'], t: 'Пугает как настоящий, статьи нет' },
};
PREM_CARS.forEach(c => { c.elite = true; PERK[c.id] = { chk: ['avt', 'yaz'], t: 'Элитный транспорт: статус и влияние как у авторитетов, переговоры и разборки' }; });
const perkChk = id => { const it = ITEM[id] || CAR[id], t = TIER(it.prem); return Object.fromEntries((PERK[id].chk || []).map((k, j) => [k, (j ? t.pct / 2 : t.pct) / 100])); };
const CHK_NAMES = { yaz: 'язык', avt: 'авторитет', sila: 'сила', lovk: 'ловкость', um: 'смекалка' };
const premPerkText = id => { const c = perkChk(id); return `${PERK[id].t}: ` + Object.entries(c).map(([k, v]) => `${CHK_NAMES[k] || k} +${Math.round(v * 100)}%`).join(', '); };
const premWorn = S => S ? [...(S.wear ? wornIds(S.wear) : []), ...(S.car ? [S.car.id] : [])].filter(id => PERK[id] && premOwned(id)) : [];
// часть статуса за премиум: вещь +3, машина +5, не больше 15
function premStatus(S) { return Math.min(16, premWorn(S).reduce((a, id) => { const it = ITEM[id] || CAR[id]; return a + (CAR[id] && !ITEM[id] ? 6 : Math.round(TIER(it.prem).pct / 5)); }, 0)); }
{ const ch = chance; chance = chk => { const p = ch(chk); if (!S || !chk) return p;
  let add = premWorn(S).reduce((a, id) => a + (perkChk(id)[chk[0]] || 0), 0);
  // обычные вещи из игры тоже чуть помогают: +1% (дешёвые), +2%, +3% (дорогие) к своим статам, всего не больше 5%
  let small = 0; for (const id of (S.wear ? wornIds(S.wear) : [])) { const it = ITEM[id]; if (!it || it.prem || !it.bonus || !it.bonus[chk[0]]) continue;
    const r = it.cur === '$' ? it.price * 5 : it.price || 0; small += r >= 100 ? 0.03 : r >= 30 ? 0.02 : 0.01; }
  add = Math.min(0.3, add) + Math.min(0.05, small);
  return add ? Math.min(0.97, p + add) : p; }; }
{ const ew = economyWeek; economyWeek = S => { ew(S);
  for (const id of premWorn(S)) { const w = PERK[id].week; if (!w) continue;
    if (w === 'mil') S.st.mil = clamp(S.st.mil - 2, 0, 100);
    else if (w === 'uvazh') S.st.uvazh = clamp(S.st.uvazh + 1, 0, 100);
    else if (w === 'lyub') S.st.lyub = clamp((S.st.lyub || 0) + 1, 0, 100);
    else if (w === 'dengi') S.st.dengi += Math.round(10 * (typeof inflation === 'function' ? inflation(S) : 1)); }
}; }

// ---------------- реклама (AdMob) и покупки (Google Play Billing) — только в приложении ----------------
// Пока стоят ТЕСТОВЫЕ id Google: реклама показывается тестовая, денег не приносит.
// Перед выпуском: AdMob → приложение → рекламный блок «С вознаграждением» → вписать сюда REWARDED_ID,
// а id приложения AdMob — в android-app/android/app/src/main/AndroidManifest.xml (APPLICATION_ID).
const ADMOB = { rewarded: 'ca-app-pub-3940256099942544/5224354917', testing: true };
const plug = n => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[n];
const ADS = (() => { let init = null;
  const setup = async a => { await a.initialize({ initializeForTesting: ADMOB.testing });
    try { const c = await a.requestConsentInfo(); if (c.isConsentFormAvailable && c.status === 'REQUIRED') await a.showConsentForm(); } catch (e) {} };   // согласие (GDPR) — где требуется
  return {
    ready: () => NATIVE() && !!plug('AdMob'),
    async rewarded() {
      const a = plug('AdMob'); if (!a) return false;
      try { init = init || setup(a); await init;
        await a.prepareRewardVideoAd({ adId: ADMOB.rewarded, isTesting: ADMOB.testing });
        AUDIO.pause && AUDIO.pause();
        const r = await a.showRewardVideoAd();   // вернёт награду, только если ролик досмотрен
        return !!(r && (r.amount || r.type));
      } catch (e) { toast('Реклама сейчас недоступна. Попробуй позже'); return false; }
      finally { AUDIO.resume && AUDIO.resume(); }
    },
  }; })();
const IAP = {
  ready: () => NATIVE() && !!plug('NativePurchases'),
  async prices() {   // { id: '149,00 ₴' } — Google Play сам подставляет валюту и цену страны игрока
    try { const r = await plug('NativePurchases').getProducts({ productIdentifiers: PACKS.map(p => p.id), productType: 'inapp' });
      return Object.fromEntries((r.products || []).map(p => [p.identifier, p.priceString])); } catch (e) { return null; }
  },
  async buy(id) {
    const p = plug('NativePurchases'); if (!p) return false;
    try { const t = await p.purchaseProduct({ productIdentifier: id, productType: 'inapp', isConsumable: true }); return !!t; }
    catch (e) { if (!/cancel/i.test(String(e && e.message))) toast('Покупка не прошла'); return false; }
  },
};
