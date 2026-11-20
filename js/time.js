// Живое время и задания-маячки на карте.
// Часы идут сами, пока ты на карте/в герое/гардеробе/журнале. Сцена, выбор, мини-игра, меню — пауза.
// Действие занимает ACT_MIN минут. В 23:00 герой идёт спать сам.

const DAY_START = 7 * 60, DAY_END = 23 * 60, ACT_MIN = 240;
const TSPEED = { slow: 1, normal: 2, fast: 5 };        // игровых минут за 1 секунду
const now = () => S.day * 1440 + S.min;
const clock = () => `${String(S.min / 60 | 0).padStart(2, '0')}:${String(S.min % 60 | 0).padStart(2, '0')}`;
const apLeft = () => Math.max(0, Math.floor((DAY_END - S.min) / ACT_MIN));
let timePaused = false, timeT = null, lastJobsSig = '';

function advanceTime(m) {
  const before = S.min | 0;
  S.min = Math.min(DAY_END, S.min + m);
  for (let h = (before / 60 | 0) + 1; h <= (S.min / 60 | 0); h++) jobsHour();
  S.jobs = (S.jobs || []).filter(j => j.until > now());
  S.ap = apLeft();
}

function timeRunning() {
  return S && !S.cur && !S.res && !S.ended && !timePaused && ['map', 'hero', 'ward', 'log', 'place'].includes(view)
    && !document.querySelector('.card,.mini,.tut,.menu') && $('#nav') && !$('#nav').classList.contains('hidden') && !document.hidden;
}
function timeStart() {
  if (typeof __TEST !== 'undefined' || timeT) return;
  timeT = setInterval(() => {
    if (!timeRunning()) return;
    const apBefore = S.ap;
    advanceTime((TSPEED[SET.tspeed] || 2) * 0.5);
    renderTop();
    const sig = (S.jobs || []).map(j => j.uid).join(',');
    if (S.min >= DAY_END) { save('auto'); return sleep(); }
    if (view === 'map' && (sig !== lastJobsSig || S.ap !== apBefore)) { lastJobsSig = sig; render(); }
    if (S.min % 30 < 1) save('auto');
  }, 500);
}

// ===================== ЗАДАНИЯ-МАЯЧКИ =================================================================
// Бытовые задания — с самого начала и во всех режимах. Плюс задания старших из Карьеры (по рангу, если ты в моталке).
const pay0 = n => typeof pay === 'function' && S.gang ? pay(n) : n;
const JOBS_EXTRA = [
  { id: 'j_posylka', min: 0, who: 'babka', gen: () => ({ to: pick(DISTRICTS.filter(d => d.gang && d.id !== S.home)).id }),
    title: p => `Посылка на ${DIST[p.to].name}`, text: p => `Отнеси, внучек, посылку сестре на ${DIST[p.to].name}. Я тебе рубль дам. Только там, говорят, неспокойно…`,
    choices: (S, p) => [
      { t: 'Дворами, быстро', chk: ['lovk', 4], mini: 'pobeg', ok: { txt: 'Донёс. Сестра бабушки накормила пирожками.', fx: { dengi: 2, sovest: 3 } }, no: { txt: 'Перехватили местные.', go: 'f_random' } },
      { t: 'Отказаться', txt: '«Ну, найду кого другого…»' }] },
  { id: 'j_shuher', min: 0, who: 'starsh', gen: () => ({}), title: () => 'Постоять на шухере',
    text: () => 'Старшим надо кое-что выгрузить из «Жигулей» у гаражей. Постой на углу, свистни, если что. Не спрашивай, что в ящиках.',
    choices: S => [
      { t: 'Постоять', chk: ['um', 4], ok: { txt: 'Свистнул вовремя — патруль прошёл мимо. Тебе сунули трёшку.', fx: { dengi: 3, avt: 2, mil: 3 } }, no: { txt: 'Проморгал патруль. Все разбежались, тебя запомнили в лицо.', fx: { mil: 12 } } },
      { t: '«Я в таком не участвую»', fx: { sovest: 3, uvazh: -2 }, txt: 'Старший пожимает плечами.' }] },
  { id: 'j_kiosk', min: 0, who: 'babka:Киоскёрша', gen: () => ({}), title: () => 'Киоск «Союзпечать»',
    text: () => 'Шпана повадилась трясти мой киоск. Отгони их — журналы бесплатно читать будешь!',
    choices: S => [
      { t: 'Поговорить с ними', chk: ['yaz', 4 + S.rank], ok: { txt: 'Ушли. Киоскёрша суёт тебе «Огонёк» и жвачку.', fx: { avt: 2, sovest: 2 } }, no: { txt: 'Слов не поняли.', go: 'f_random' } },
      { t: 'Прогнать силой', go: 'f_random' }] },
  { id: 'j_sobaka', min: 0, who: 'babka:Соседка', gen: () => ({}), title: () => 'Пропала собака',
    text: () => 'Шарик убежал! Рыжий такой, ухо надорвано. Найдёшь — век не забуду.',
    choices: S => [
      { t: 'Искать по дворам', chk: ['um', 3], ok: { txt: 'Шарик сидел у столовой и ел котлету. Соседка плачет от счастья.', fx: { sovest: 5, dengi: 1, semya: 2 } }, no: { txt: 'Обошёл полрайона — без толку.', fx: { zdor: -3 } } }] },
  { id: 'j_zapiska', min: 0, who: 'ildar', gen: () => ({}), title: () => 'Записка',
    text: () => 'Слушай, передай записку Ленке из восьмого «В». Только сам не читай! Ну… можешь прочитать. Нет, не читай.',
    choices: S => [
      { t: 'Передать', fx: { ildar: 5 }, txt: 'Ленка краснеет и прячет записку в портфель. Ильдар потом неделю ходит счастливый.' },
      { t: 'Прочитать и передать', fx: { ildar: 2, sovest: -2 }, txt: '«Ты красивая как Алла Пугачёва». Ты еле сдерживаешь смех.' }] },
  { id: 'j_deficit', min: 0, who: 'muzhik:Сосед', gen: () => ({ what: pick(['палку сырокопчёной', 'банку растворимого кофе', 'джинсы на сына', 'югославские сапоги жене']) }),
    title: p => 'Достать дефицит', text: p => `Выручай. Нужна ${p.what}. У тебя ж знакомые есть? Заплачу сверху.`,
    choices: (S, p) => [
      { t: 'Через знакомых', chk: ['um', 5], ok: { txt: 'Достал! Сосед жмёт руку двумя руками.', fx: { dengi: 4, avt: 1 } }, no: { txt: 'Обманули. Деньги взяли — товара нет.', fx: { dengi: -2 } } },
      { t: 'Не связываться', txt: '«Эх. Ладно…»' }] },
  { id: 'j_zhiguli', min: 0, who: 'muzhik', gen: () => ({}), title: () => '«Копейка» не заводится',
    text: () => 'Помоги толкнуть, а? Аккумулятор сел, а мне на работу.',
    choices: S => [{ t: 'Толкать', chk: ['sila', 3], ok: { txt: 'Завелась! Мужик довозит тебя до Центра и даёт рубль.', fx: { dengi: 1, sila: 0, sovest: 2 } }, no: { txt: 'Толкали полчаса. Без толку. Зато согрелись.', fx: { zdor: -3 } } }] },
  { id: 'j_vagon', min: 0, who: 'muzhik:Бригадир', gen: () => ({}), title: () => 'Вагон с картошкой',
    text: () => 'Ночью на сортировочной разгружаем вагон. Шесть рублей на руки. Справишься?',
    choices: S => [{ t: 'Разгружать', chk: ['sila', 4], mini: 'kach', ok: { txt: 'К утру спина отваливается, но шесть рублей в кармане.', fx: { dengi: 6, zdor: -10 } }, no: { txt: 'Уронил мешок на ногу. Бригадир платит половину.', fx: { dengi: 3, zdor: -15 } } }] },
  { id: 'j_pensiya', min: 0, who: 'babka', gen: () => ({}), title: () => 'Пенсия',
    text: () => 'Проводи до дома, милок. Пенсию получила, а у почты шпана крутится…',
    choices: S => [
      { t: 'Проводить', chk: ['sila', 3 + S.rank], ok: { txt: 'Шпана посмотрела на тебя и отвернулась. Бабушка суёт пирожок.', fx: { sovest: 5, zdor: 3 } }, no: { txt: 'Шпана решила проверить.', go: 'f_random' } }] },
  { id: 'j_magnitofon', min: 0, who: 'muzhik:Сосед', gen: () => ({}), title: () => 'Украли магнитофон',
    text: () => 'У меня «Электронику-302» из машины вытащили. Говорят, на рынке уже продают. Вернёшь — трёшка твоя.',
    choices: S => [
      { t: 'Выкупить по-тихому', chk: ['yaz', 5], ok: { txt: 'Торгаш отдал за полцены. Сосед доволен.', fx: { dengi: 2, avt: 1 } }, no: { txt: 'Торгаш позвал друзей.', go: 'f_random' } },
      { t: 'Отнять', go: 'f_random', fx: { mil: 4 } }] },
  { id: 'j_sobranie', min: 0, who: 'zavuch', gen: () => ({}), title: () => 'Комсомольское собрание',
    text: () => 'Тебе слово! Расскажи товарищам, как ты борешься с хулиганством. Все знают, кто ты, но слово скажешь.',
    choices: S => [
      { t: 'Толкнуть речь', chk: ['yaz', 5], ok: { txt: 'Аплодисменты. Завуч растрогана. Пацаны ржут, но уважают.', fx: { semya: 5, yaz: 1 } }, no: { txt: 'Запутался в словах. Класс лежит.', fx: { uvazh: -2 } } },
      { t: 'Прогулять', fx: { semya: -4 }, txt: 'Маме позвонят. Точно позвонят.' }] },
  { id: 'j_provodit', min: 0, who: 'natasha', gen: () => S.flags.met_natasha ? {} : null, title: () => 'Проводить Наташу',
    text: () => 'Проводишь меня? После танцев страшно идти одной…',
    choices: S => [
      { t: 'Проводить через чужой асфальт', chk: ['lovk', 4], ok: { txt: 'Дошли без приключений. У подъезда она долго не уходит.', fx: { lyub: 10, natasha: 8 } }, no: { txt: 'Чужие увидели вас.', go: 'f_random', fx: { lyub: 4 } } },
      { t: 'Длинной дорогой, в обход', fx: { lyub: 6, zdor: -2 }, txt: 'Час пешком. Зато всю дорогу разговаривали.' }] },
];
if (typeof TASKS !== 'undefined') JOBS_EXTRA.forEach(t => { TASKS.push(t); TPL[t.id] = t; });

// Каждый игровой час: шанс нового маячка (до 4), у каждого свой срок жизни
function jobsHour() {
  S.jobs = S.jobs || [];
  if (S.jobs.length >= 4 || Math.random() > 0.35) return;
  const pool = TASKS.filter(t => S.rank >= (t.min || 0) && S.rank <= (t.max ?? 9) && !S.jobs.some(j => j.id === t.id)
    && (t.id.startsWith('j_') || (t.id === 'prish' ? S.mode === 'career' && !S.gang : S.gang && S.mode !== 'surv')));
  // в Карьере без моталки — сначала приглашение пришиться
  if (S.mode === 'career' && !S.gang && !S.jobs.some(j => j.id === 'prish')) { S.jobs.push({ uid: Date.now() % 1e9 + rnd(1000), id: 'prish', p: {}, d: S.home, until: now() + 2880 }); return; }
  if (!pool.length) return;
  const t = pick(pool), p = t.gen(S); if (!p) return;
  const d = p.d || pick([S.home, 'center', ...[...NEIGHBORS[S.home]]].filter(x => DIST[x]));
  S.jobs.push({ uid: Date.now() % 1e9 + rnd(1000), id: t.id, p, d, until: now() + 360 + rnd(1440) });
}
function takeJob(uid) {
  const j = S.jobs.find(x => x.uid === uid); if (!j) return;
  S.jobs = S.jobs.filter(x => x !== j);
  S.at = j.d; S.kt = { id: j.id, p: j.p };
  advanceTime(ACT_MIN);
  play('k_task');
}
function jobsHtml(d) {
  const list = (S.jobs || []).filter(j => j.d === d);
  return list.map(j => { const h = Math.max(1, Math.round((j.until - now()) / 60));
    return `<button class="btn job" data-job="${j.uid}"><span>❗ ${TPL[j.id].title(j.p)}</span><span class="ch mid">${h < 24 ? 'ещё ' + h + ' ч' : 'ещё ' + Math.round(h / 24) + ' дн'}</span></button>`; }).join('');
}
