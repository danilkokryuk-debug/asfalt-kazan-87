// Машины как инструмент: угон, гараж для краденого, разборка, перебитые номера, перекуп битых машин, заказы на угон.
// Баланс (доля от цены машины): разборка 5%, перебитая 10% (минус 4% за номера), перекуп +8% при удаче. Рынок насыщается (каждая продажа −25% к цене, отходит за неделю), краденое в гараже греет милицию,
// гараж маленький (1 место, с «Супера» — 2, с «Автора» — 3), угон — раз в день, перекуп — раз в неделю.
// Быстро разбогатеть нельзя; с умом (перебить номера, продать через комиссионку, починить битую) можно заработать.
const GAR = S => (S.gar = S.gar || []);
const garCap = S => 1 + (S.rank >= 3) + (S.rank >= 5);
const CMKT = S => (S.cmkt = S.cmkt || { n: 0 });
const mkF = S => Math.pow(0.75, CMKT(S).n);
const rub = c => c.cur === '$' ? c.price * 4 : c.price;   // сравнить цены: доллар ≈ 4 р.
const cPay = (c, k, S) => { const v = Math.max(1, Math.round(c.price * k * mkF(S))); return c.cur === '$' ? { dol: v } : { dengi: v }; };
const payTxt = (c, k, S) => { const p = cPay(c, k, S); return p.dol ? '$' + p.dol : p.dengi + ' р.'; };
const sold = S => { CMKT(S).n++; };
// что можно угнать: по званию и эпохе
function theftPool(S) {
  const e = typeof era90 === 'function' && era90(S);
  return CARS.filter(c => c.t === 'car' && !c.elite && c.rank <= S.rank + 1 && (c.cur !== '$' || e));
}
// угон: на чужих и ничейных районах, ночью проще
function theftAct(S, d) {
  if (d === S.home || GAR(S).length >= garCap(S) || ageOf(S) < 14) return [];
  const night = S.min >= 20 * 60, pool = theftPool(S); if (!pool.length) return [];
  const c = pool[(S.day + d.length) % pool.length], diff = 4 + Math.min(4, Math.round(rub(c) / 1200)) - (night ? 1 : 0);
  return [{ t: `Угнать ${c.name} со двора${night ? '' : ' (днём опаснее)'}`, chk: ['lovk', diff], mini: 'zamok',
    ok: { txt: `Отвёртка в замок, провода под рулём — и ${c.name} твоя. Спрятал в гараже. Теперь её ищут.`, fx: s => { GAR(s).push({ id: c.id, hot: 1 }); s.cnt.ugon = (s.cnt.ugon || 0) + 1; return { mil: 6, sovest: -5, avt: 1 }; } },
    no: { txt: 'Сработала сигнализация — хозяин в трусах с монтировкой, соседи в окнах. Ноги в руки.', fx: s => Math.random() < 0.4 ? { mil: 14, zdor: -10 } : { mil: 10 } } }];
}
{ const ma = mechActions; mechActions = (S, d) => [...ma(S, d), ...theftAct(S, d)]; }

// СТО и комиссионка
function carPlaceActs(S, p) {
  const a = [], g = GAR(S);
  if (p.k === 'sto') g.forEach((x, i) => { const c = CAR[x.id];
    if (x.broken) a.push({ t: `Восстановить битую ${c.name} (${payTxt(c, 0.12, { cmkt: { n: 0 } })}, день)`, req: cPay(c, 0.12, { cmkt: { n: 0 } }), cost: 1, chk: ['um', 5],
      ok: { txt: 'Михалыч рихтует, ты красишь. К вечеру — как с завода.', fx: s => { const r = cPay(c, 0.12, { cmkt: { n: 0 } }); GAR(s)[i].broken = 0; return r.dol ? { dol: -r.dol } : { dengi: -r.dengi }; } },
      no: { txt: 'Перекосило раму. Деньги ушли, машина всё ещё битая.', fx: () => { const r = cPay(c, 0.06, { cmkt: { n: 0 } }); return r.dol ? { dol: -r.dol } : { dengi: -r.dengi }; } } });
    if (x.hot) a.push({ t: `Сдать ${c.name} на разборку (${payTxt(c, 0.05, S)})`, cost: 0.5, fx: s => { const r = cPay(c, 0.05, s); GAR(s).splice(i, 1); sold(s); return { ...r, mil: 3 }; },
      txt: 'К утру от машины остаются только номера в Казанке. Запчасти уйдут по всему Союзу.' });
    if (x.hot) { const fee = Math.round(rub(c) * 0.04); a.push({ t: `Перебить номера на ${c.name} (${fee} р.)`, req: { dengi: fee }, cost: 1,
      fx: s => { GAR(s)[i].hot = 0; GAR(s)[i].num = 1; return { dengi: -fee, sovest: -2 }; }, txt: 'Новые номера на кузове и двигателе, новый техпаспорт. Теперь её можно продать как свою.' }); }
    if (!S.car && !x.broken && ageOf(S) >= c.age) a.push({ t: `Сесть за руль: ${c.name}${x.hot ? ' (краденая!)' : ''}`, cost: 0.25,
      fx: s => { s.car = { id: c.id, cond: 70, fuel: 30, hot: !!x.hot, st: x.legal ? 0 : 1 }; GAR(s).splice(i, 1); return x.hot ? { mil: 5 } : {}; }, txt: x.hot ? 'Ездить на краденой — до первого гаишника.' : 'Теперь это твоя машина.' });
  });
  if (p.k === 'auto') {
    g.forEach((x, i) => { const c = CAR[x.id]; if (x.hot || x.broken) return;
      const k = x.num ? 0.1 : 0.5;
      a.push({ t: `Продать ${x.num ? 'перебитую' : 'восстановленную'} ${c.name} (≈${payTxt(c, k, S)})`, cost: 0.5, chk: ['yaz', x.num ? 6 : 4],
        ok: { txt: 'Покупатель долго пинает колёса, но платит. Рукопожатие, ключи, «счастливого пути».', fx: s => { const r = cPay(c, k, s); GAR(s).splice(i, 1); sold(s); return r; } },
        no: { txt: x.num ? 'Покупатель узнал машину брата. Еле ушёл, отдал за полцены.' : 'Торговался плохо — отдал дешевле.', fx: s => { const r = cPay(c, k * 0.6, s); GAR(s).splice(i, 1); sold(s); return x.num ? { ...r, mil: 12 } : r; } } });
    });
    if (S.rank >= 1 && g.length < garCap(S) && sinceF(S, 'perekup') >= 7) theftPool(S).slice(-3).forEach(c => a.push({
      t: `Перекуп: битая ${c.name} за ${payTxt(c, 0.3, { cmkt: { n: 0 } })}`, req: cPay(c, 0.3, { cmkt: { n: 0 } }), cost: 0.5,
      fx: s => { s.flags.perekup = s.day; GAR(s).push({ id: c.id, broken: 1, legal: 1 }); const r = cPay(c, 0.3, { cmkt: { n: 0 } }); return r.dol ? { dol: -r.dol } : { dengi: -r.dengi }; },
      txt: 'Мятое крыло, разбитая фара, «не на ходу». Починишь в СТО — продашь дороже. Если повезёт.' }));
    if (S.car) { const c = CAR[S.car.id], k = S.car.hot || S.car.st ? 0.1 : 0.55; a.push({ t: `Продать свою ${c.name} (≈${payTxt(c, k, S)})`, cost: 0.5,
      fx: s => { const r = cPay(c, k, s); s.car = null; sold(s); return r; }, txt: 'Ключи в чужой ладони. Немного жаль.' }); }
    a.push({ t: `Справка: гараж ${g.length}/${garCap(S)}, цены на рынке ${Math.round(mkF(S) * 100)}%`, cost: 0, txt: () => CMKT(S).n ? 'Рынок завален машинами — цены упали. Подожди неделю-другую.' : 'Рынок голодный: сейчас продашь дороже всего.' });
  }
  return a;
}
{ const pa = placeActions; placeActions = (S, p) => [...pa(S, p), ...carPlaceActs(S, p)]; }

// раз в неделю: краденое греет милицию, рынок отходит
function theftWeek(S, w) {
  const g = GAR(S), hot = g.filter(x => x.hot).length;
  CMKT(S).n = Math.max(0, CMKT(S).n - 2);
  if (hot) { S.st.mil = Math.min(100, S.st.mil + hot * 4); w.warn.push(`Краденое в гараже (${hot}): внимание милиции +${hot * 4}.`); }
  if (hot && Math.random() < 0.08 * hot) { const x = g.find(y => y.hot); g.splice(g.indexOf(x), 1); S.st.mil = Math.min(100, S.st.mil + 15); w.warn.push(`Милиция нашла в гараже ${CAR[x.id].name}. Машину забрали.`); }
  if (S.car && S.car.hot) { S.st.mil = Math.min(100, S.st.mil + 5); w.warn.push('Ездишь на краденой: +5 к вниманию.'); }
}

// задания, где машина — инструмент
const CJ = (id, o) => ({ id, min: 1, gen: () => ({}), ...o });
const CAR_JOBS = [
  CJ('j_c_zakaz', { bg: 't_r_garazh', who: 'zhora', title: () => 'Заказ на угон', text: () => 'Жоре нужна «Девятка» цвета «мокрый асфальт». Под заказ. Есть адрес, где она ночует.',
    choices: S => [{ t: 'Взять заказ', chk: ['lovk', 6], mini: 'zamok', ok: { txt: 'К утру машина у Жоры. Он отсчитывает деньги, не глядя тебе в глаза.', fx: { dengi: pay0(60), mil: 8, sovest: -6 } }, no: { txt: 'Хозяин спал в машине. Драка.', go: 'f_random', fx: { mil: 10 } } },
      { t: 'Отказаться', txt: '«Как знаешь. Найду других».' }] }),
  CJ('j_c_vykup', { bg: 'dvor', who: 'muzhik:Хозяин «Москвича»', title: () => 'Вернуть угнанную', text: () => 'У мужика угнали «Москвич». В милиции разводят руками. Он слышал, что ты «можешь узнать».',
    choices: S => [{ t: 'Найти и вернуть за выкуп', chk: ['yaz', 5], ok: { txt: 'Угонщики с соседнего района отдают машину за четверть цены. Мужик платит вдвое — и благодарит.', fx: { dengi: pay0(60), uvazh: 3, sovest: 3 } }, no: { txt: 'Машину уже разобрали.', fx: { uvazh: -2 } } },
      { t: 'Вернуть бесплатно', chk: ['yaz', 6], ok: { txt: 'Мужик плачет у машины. Весь двор теперь за тебя.', fx: { uvazh: 6, sovest: 8, avt: 2 } }, no: { txt: 'Не нашёл.', fx: {} } }] }),
  CJ('j_c_kidok', { min: 2, bg: 't_v_salon', who: 'chuzhoy:Покупатель', title: () => 'Кидалово на авторынке', text: () => 'На авторынке в Сокурах приезжие хотят купить машину. Пачка денег толстая — подозрительно толстая.',
    choices: S => [{ t: 'Пересчитать при них', chk: ['um', 6], ok: { txt: '«Кукла»: сверху сотня, внутри резаная бумага. Кидалы уходят ни с чем, а ты — с репутацией.', fx: { avt: 4, uvazh: 3 } }, no: { txt: 'Кукла. Ты понял это уже дома.', fx: { dengi: -40 } } },
      { t: 'Кинуть кидал самому', chk: ['lovk', 6], ok: { txt: 'Пока они пересчитывали твою «куклу», ты уехал с их деньгами.', fx: { dengi: pay0(70), sovest: -6, mil: 6 } }, no: { txt: 'Их было больше.', go: 'f_random' } }] }),
  CJ('j_c_pogonya', { veh: 'car', bg: 't_r_trassa', who: 'militsioner:ГАИ', title: () => 'Погоня', text: () => 'Сине-красные огни в зеркале. «Водитель, остановитесь!» В багажнике — то, что видеть им не нужно.',
    choices: S => [{ t: 'Уходить по трассе', chk: ['lovk', 7], mini: 'gonka', ok: { txt: 'Ушёл дворами на Ершова. В гараже ты долго сидишь в темноте, слушая сердце.', fx: s => { s.car.cond = Math.max(0, s.car.cond - 20); return { avt: 3, mil: 8 }; } }, no: { txt: 'Перекрыли. Багажник открыт.', fx: { mil: 30, zdor: -10 } } },
      { t: 'Остановиться и договориться', req: { dengi: 30 }, fx: { dengi: -30 }, txt: 'Тридцать рублей под техпаспортом. «Счастливого пути».' }] }),
  CJ('j_c_peregon', { min: 2, era90: true, veh: 'car', bg: 't_r_trassa', who: 'moskvich', title: () => 'Перегон из Германии', text: () => 'Колонна иномарок из Бреста. Нужно сопровождать на своей машине: на трассе грабят перегонщиков.',
    choices: S => [{ t: 'Сопровождать', chk: ['sila', 6], ok: { txt: 'Три дня дороги, одна перестрелка под Смоленском. Колонна дошла.', fx: s => { s.car.cond = Math.max(0, s.car.cond - 25); return { dol: 60, avt: 4 }; } }, no: { txt: 'Колонну ограбили. Тебе досталось.', fx: { zdor: -30 } } }] }),
  CJ('j_c_taksi90', { era90: true, veh: 'car', min: 0, bg: 't_taksi', who: 'muzhik:Таксист', title: () => 'Частный извоз', text: () => 'В девяностых бомбят все — инженеры, учителя, офицеры. Вокзал, ночь, приезжие.',
    choices: S => [{ t: 'Бомбить до утра', fx: s => { s.car.fuel = Math.max(0, s.car.fuel - 30); s.car.cond = Math.max(0, s.car.cond - 5); return { dengi: pay0(25) }; }, txt: 'Двадцать пять рублей и сто историй про жизнь.' }] }),
];
CAR_JOBS.forEach(t => { TASKS.push(t); TPL[t.id] = t; });
