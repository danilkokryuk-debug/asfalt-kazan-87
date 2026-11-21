// Главный экран, слоты сохранений, обучение для новичка.

// ===================== ГЛАВНЫЙ ЭКРАН ================================================================
let splashDone = false;

// Вступление ~4 с, без текста: «кадры» как в боевике — погоня с мигалками, двор, ночная Казань → затемнение → меню
function playIntro(done) {
  const el = document.createElement('div'); el.className = 'intro';
  const shots = ['chase', 'dvor', 'kazan'];
  el.innerHTML = shots.map((s, i) => `<div class="shot s${i}">${artHtml(s, 'shotart')}</div>`).join('') +
    '<div class="lights"></div><div class="vign"></div><div class="iskip">нажми, чтобы пропустить</div>';
  document.body.appendChild(el); artStart(el);
  AUDIO.track('fight'); AUDIO.sfx && (AUDIO.sfx('siren'), AUDIO.sfx('steps'));
  const cut = (i, at) => setTimeout(() => {
    el.querySelectorAll('.shot').forEach((s, k) => s.classList.toggle('on', k === i));
    el.classList.toggle('police', i === 0); if (i) AUDIO.sfx && AUDIO.sfx('swish');
  }, at);
  cut(0, 30); cut(1, 1700); cut(2, 2600);
  let fin = false;
  const end = () => {
    if (fin) return; fin = true;
    el.classList.add('out'); AUDIO.sfx && AUDIO.sfx('slam');
    setTimeout(() => { el.remove(); done(); }, 600);
  };
  el.onclick = end; setTimeout(end, 4000);
}

function titleScreen(epic) {
  AUDIO.track('theme'); if (AUDIO.ambience) AUDIO.ambience(null);
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const saves = ['campaign', 'career', 'surv'].map(m => migrate(loadRaw('auto', m))).filter(s => s && !s.ending && !s.ended)
    .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  const last = saves[0];
  const MODE = { campaign: 'Кампания', career: 'Карьера', surv: 'Выживание' };
  if (!splashDone) ['chase', 'dvor'].forEach(n => { const s = typeof sceneImg === 'function' && sceneImg(n); if (s) (new Image()).src = s; });   // вступление грузится заранее
  $('#main').innerHTML = `<div class="menu">
    ${artHtml('kazan', 'menuart')}<div class="snowfall"></div>
    <div class="logo${epic ? ' epic' : ''}"><h1>АСФАЛЬТ</h1><div class="s">КАЗАНЬ · 1987</div></div>
    ${!splashDone ? '<div class="tapstart" id="tap">нажми, чтобы начать</div>' : `<div class="choices menu-btns">
      ${last ? `<button class="btn main" id="cont"><span>Продолжить</span><span class="ch">${MODE[last.mode]}: ${last.name}, ${dateStr(last.day)}</span></button>` : ''}
      <button class="btn" id="play">Новая игра</button>
      <button class="btn" id="slots">Сохранения</button>
      <button class="btn" id="ach">Достижения и концовки</button>
      <button class="btn" id="chron">Летопись судеб</button>
      <button class="btn" id="mag">📼 Магнитофон</button>
      <button class="btn" id="set">Настройки</button></div>`}
    <p class="note">16+. Вымышленная история по мотивам событий 1980-х в Казани. Все персонажи вымышлены.</p><div id="stats" class="stats">${typeof statsHtml === 'function' ? statsHtml() : ''}</div></div>`;
  artStart($('#main'));
  // первый тап нужен iPhone, чтобы разрешить звук; дальше — вступление
  if (!splashDone) { $('#main').onclick = () => { $('#main').onclick = null; splashDone = true; AUDIO.start(); playIntro(() => titleScreen(true)); }; return; }
  AUDIO.track('theme');
  const last0 = last; setTimeout(() => { if (typeof cityImage === 'function' && $('.menu')) try { cityImage(season(last0 ? last0.day : 1) === 'winter'); } catch (e) {} }, 700);   // карта готова до входа в игру
  const resume = s => { AUDIO.start(); S = s; view = 'map'; S.cur || S.res ? render() : toMap(); };
  if ($('#cont')) $('#cont').onclick = () => resume(last);
  $('#play').onclick = () => { AUDIO.click(); playScreen(); };
  $('#slots').onclick = () => { AUDIO.click(); slotsScreen(); };
  $('#ach').onclick = () => { AUDIO.click(); achScreen(); };
  $('#chron').onclick = () => { AUDIO.click(); chronicle(); };
  $('#set').onclick = () => { AUDIO.click(); settingsScreen(); };
  $('#mag').onclick = () => { AUDIO.click(); magScreen(); };
  if (typeof songCue === 'function') songCue('title');
}

// ===================== СЛОТЫ СОХРАНЕНИЙ ==============================================================
// 5 слотов на все режимы. Из игры можно сохранить, из меню — загрузить или удалить.
const SLOTS_N = 5;
const slotKey = i => 'asfalt_slot_' + i;
function slotGet(i) { try { return migrate(JSON.parse(localStorage.getItem(slotKey(i)))); } catch (e) { return null; } }
function slotsScreen(back) {
  const inGame = !!back && S;
  const MODE = { campaign: 'Кампания', career: 'Карьера', surv: 'Выживание' };
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene in"><h2>Сохранения</h2>
    <div class="choices">${Array.from({ length: SLOTS_N }, (_, i) => { const s = slotGet(i); return `<div class="item slot">
      ${s ? `<canvas class="sprite mini-spr" data-sl="${i}"></canvas>` : '<div class="emptyslot">пусто</div>'}
      <div style="flex:1"><b>Слот ${i + 1}</b>${s ? `<div class="sub">${MODE[s.mode] || ''} · ${s.name}${s.nick ? ' «' + s.nick + '»' : ''}<br>${RANKS[s.rank]} · ${dateStr(s.day)}<br>сохранено ${new Date(s.savedAt || 0).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>` : ''}</div>
      <div class="slotbtns">${inGame ? `<button class="btn" data-sv="${i}">Сохранить</button>` : ''}
        ${s ? `<button class="btn" data-ld="${i}">Загрузить</button><button class="btn" data-del="${i}">✕</button>` : ''}</div></div>`; }).join('')}</div>
    <p class="note">Кроме слотов, каждый режим сохраняется сам — кнопка «Продолжить» в главном меню.</p>
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  document.querySelectorAll('[data-sl]').forEach(c => { const s = slotGet(+c.dataset.sl); drawHero(c, s.app, s.wear); });
  document.querySelectorAll('[data-sv]').forEach(b => b.onclick = () => {
    const i = +b.dataset.sv;
    if (slotGet(i) && !confirm(`Перезаписать слот ${i + 1}?`)) return;
    S.savedAt = Date.now();
    try { localStorage.setItem(slotKey(i), JSON.stringify(S)); AUDIO.sfx ? AUDIO.sfx('page') : AUDIO.ok(); toast(`Сохранено в слот ${i + 1}`); } catch (e) { alert('Не удалось сохранить: мало места в браузере.'); }
    slotsScreen(back);
  });
  document.querySelectorAll('[data-ld]').forEach(b => b.onclick = () => { AUDIO.start(); S = slotGet(+b.dataset.ld); view = 'map'; save('auto'); S.cur || S.res ? render() : toMap(); });
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Удалить сохранение?')) { localStorage.removeItem(slotKey(+b.dataset.del)); slotsScreen(back); } });
  $('#bk').onclick = () => { AUDIO.click(); (back || titleScreen)(); };
}

// ===================== ОБУЧЕНИЕ ==================================================================
// Подсказки с подсветкой элемента. Каждая серия показывается один раз (можно сбросить в настройках).
const TUT = {
  map: [
    ['#map', 'Это Казань. Каждый цвет — асфальт своей моталки. Нажми на район, чтобы посмотреть, что там можно сделать.'],
    ['.zoom', 'Карту можно приближать двумя пальцами или кнопками.'],
    ['.legend', 'Здесь видно, какая моталка сколько районов держит.'],
    ['.sheet .choices', 'Действия в выбранном районе. У каждого рискованного — шанс в процентах. В день у тебя 3 действия (точки вверху).'],
    ['#sleep', 'Когда силы кончатся — иди домой спать. Начнётся новый день.'],
    ['#nav', 'Внизу: Герой (статы, кошелёк, скорлупа), Гардероб, Журнал и Меню с сохранениями и настройками.'],
  ],
  scene: [['#say', 'Нажимай на текст, чтобы он допечатался или пошла следующая реплика. Потом появятся варианты ответа.']],
  hero: [['.wallet', 'Кошелёк: деньги конечны. Раз в неделю — взнос в общак и содержание своих. Следи, чтобы хватало.'],
    ['.grid', 'Статы растут от поступков: качалка, турник, школа, разговоры на лавке.']],
  ward: [['.tabs', 'Разделы гардероба. Нажми на любую вещь — увидишь её на себе, даже если ещё не купил.'],
    ['.item', 'Импорт продаётся только за доллары, а некоторое — только с нужного ранга.']],
  tasks: [['.result', 'Цель этой судьбы и срок. Не успеешь — забег окончен.'], ['.item', 'Задания от старших. Новые появляются раз в три дня.']],
};
// Обучение по сюжету: в кампании объясняет Ильдар (вместо всплывающих подсказок)
def('t_ildar', {
  trigger: S => S.done.c1_intro && (S.done.c1_school || S.done.c1_garages) && !S.cur,
  title: 'Как тут всё устроено', bg: 'dvor',
  fx: S => { S.flags.met_ildar = true; },
  lines: S => [
    ['ildar', 'О, ты тут! Слушай, раз уж сам по городу ходишь — объясню, как всё устроено. А то пропадёшь.', 'smile'],
    ['ildar', `Карта — это весь город. Каждый цвет — чей-то асфальт. Твой район со звёздочкой, ${HOME(S)}. В чужие лучше не соваться.`],
    ['ildar', 'Время идёт само — часы наверху видишь? Любое дело — часа четыре. В одиннадцать вечера — домой, а то мать убьёт. Надо подумать — жми паузу.'],
    ['ildar', 'Жёлтые маячки с восклицательным знаком — это где кому-то нужна помощь: бабкам, мужикам, старшим. Долго ждать не будут.'],
    ['ildar', 'Квадратные значки — места: парикмахерская, пивбар, рынок, больница, милиция. Тапнешь — зайдёшь.'],
    ['ildar', 'Деньги — их мало. Мать даёт мелочь раз в неделю, остальное сам. А пришьёшься — ещё и в общак сдавать.', 'sad'],
    ['ildar', 'Внизу «Герой» — там твои силы и кошелёк. «Гардероб» — шмотки, на рынке у Жоры. «Журнал» — дневник твой. Ну всё, давай. Если что — я в школе.', 'smile'],
  ],
  choices: [{ t: 'Понял. Спасибо, Ильдар', fx: S => {
    const s = tutSeen(); ['map', 'hero', 'ward', 'scene'].forEach(k => s[k] = 1);
    try { localStorage.setItem('asfalt_tut', JSON.stringify(s)); } catch (e) {}
    return { ildar: 5 };
  } }],
});

function tutSeen() { try { return JSON.parse(localStorage.getItem('asfalt_tut') || '{}'); } catch (e) { return {}; } }
function tutorial(key) {
  if (typeof __TEST !== 'undefined' || !SET.tutorial || tutSeen()[key] || document.querySelector('.tut')) return;
  if (S && S.mode === 'campaign' && !S.done.t_ildar && ['map', 'hero', 'ward'].includes(key)) return;   // в кампании объяснит Ильдар
  const steps = (TUT[key] || []).filter(([sel]) => document.querySelector(sel));
  if (!steps.length) return;
  let i = 0;
  const ov = document.createElement('div'); ov.className = 'tut';
  document.body.appendChild(ov);
  const show = () => {
    document.querySelectorAll('.tut-hl').forEach(e => e.classList.remove('tut-hl'));
    const [sel, txt] = steps[i], target = document.querySelector(sel);
    if (target) { target.classList.add('tut-hl'); target.scrollIntoView({ block: 'nearest' }); }
    const r = target ? target.getBoundingClientRect() : { top: 200, bottom: 200 };
    const below = r.bottom < innerHeight * 0.6;
    ov.innerHTML = `<div class="tutbox" style="${below ? 'top:' + Math.min(innerHeight - 180, r.bottom + 10) : 'bottom:' + Math.min(innerHeight - 180, innerHeight - r.top + 10)}px">
      <div>${txt}</div><div class="tutnav"><span>${i + 1}/${steps.length}</span><button>${i < steps.length - 1 ? 'Дальше' : 'Понятно'}</button></div></div>`;
  };
  ov.onclick = () => {
    AUDIO.click();
    if (++i < steps.length) return show();
    document.querySelectorAll('.tut-hl').forEach(e => e.classList.remove('tut-hl'));
    ov.remove(); const s = tutSeen(); s[key] = 1; try { localStorage.setItem('asfalt_tut', JSON.stringify(s)); } catch (e) {}
  };
  show();
}
