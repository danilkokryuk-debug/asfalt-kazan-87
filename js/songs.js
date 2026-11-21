// «Магнитофон»: в игре звучит только своя музыка — сборник «Асфальт-87».
// Треки сами меняются по местам (дискотека, махач, сход, ночь, Наташа, зона, финал), или можно включить любой вручную.
// Один звуковой движок (AUDIO) — без второго проигрывателя, чтобы на iPhone ничего не перехватывало звук.
const PLAYER = { place: null, albPlace: null, albSpec: null, manual: null };
const SONG_PLACES = { title: 'Главное меню', disco: 'Дискотека, ДК', fight: 'Махач', shod: 'Коробка, сходы', city: 'Прогулка по городу',
  dawn: 'Утро', night: 'Ночь', love: 'С Наташей', home: 'Дома, осень', zona: 'Суд и зона', final: 'Финалы' };
// ---- Сборник «Асфальт-87»: свои мелодии в духе эпохи, играют по местам сами, без файлов ----
// Гармонии и мотивы написаны для игры (это не мелодии чужих песен). Аккорд: [нота MIDI, 'm' минор | 'M' мажор], мотив — 8 ступеней.
const T_ = (t, bpm, style, prog, mot) => ({ t, spec: { bpm, style, prog, mot } });
const ALBUM = {
  title: [T_('Пиала остывшего чая', 76, 'ballad', [[57, 'm'], [52, 'm'], [53, 'M'], [55, 'M'], [57, 'm'], [50, 'm'], [52, 'M'], [57, 'm']], [2, 1, 0, 1, 2, 3, 2, 0])],
  disco: [T_('Огни дискотеки', 124, 'disco', [[55, 'M'], [52, 'm'], [48, 'M'], [50, 'M']], [0, 2, 3, 2, 1, 2, 0, 1]),
          T_('Белая вьюга', 118, 'disco', [[52, 'm'], [48, 'M'], [55, 'M'], [50, 'M']], [3, 2, 1, 2, 3, 4, 3, 1]),
          T_('Танцы до утра', 128, 'disco', [[57, 'm'], [53, 'M'], [55, 'M'], [52, 'M'], [57, 'm'], [53, 'M'], [50, 'm'], [52, 'M']], [0, 1, 2, 4, 2, 1, 0, 2]),
          T_('Розовый закат над ДК', 112, 'disco', [[53, 'M'], [55, 'M'], [52, 'm'], [57, 'm']], [2, 2, 3, 1, 0, 1, 2, 3])],
  fight: [T_('Стенка на стенку', 132, 'epic', [[52, 'm'], [48, 'M'], [50, 'M'], [47, 'M']], [0, 0, 2, 1, 0, 3, 2, 1]),
          T_('Кровь на снегу', 126, 'epic', [[57, 'm'], [53, 'M'], [55, 'M'], [52, 'M']], [0, 2, 0, 3, 0, 2, 4, 2]),
          T_('Последний раунд', 138, 'epic', [[50, 'm'], [46, 'M'], [48, 'M'], [45, 'M']], [0, 1, 2, 4, 2, 1, 0, 3])],
  shod: [T_('Перемены близко', 116, 'epic', [[57, 'm'], [53, 'M'], [48, 'M'], [55, 'M']], [0, 1, 2, 1, 2, 3, 2, 0]),
         T_('Солнце над коробкой', 104, 'rock', [[52, 'm'], [48, 'M'], [55, 'M'], [50, 'M']], [2, 1, 2, 3, 2, 1, 0, 1])],
  city: [T_('Этот асфальт', 100, 'rock', [[50, 'M'], [55, 'M'], [52, 'm'], [57, 'M']], [1, 2, 3, 2, 1, 0, 1, 2]),
         T_('Сигарета у ларька', 92, 'dvor', [[57, 'm'], [62, 'm'], [52, 'M'], [57, 'm']], [0, 2, 1, 0, 2, 3, 1, 0])],
  dawn: [T_('На рассвете у Казанки', 84, 'ballad', [[48, 'M'], [55, 'M'], [57, 'm'], [53, 'M']], [0, 1, 2, 3, 2, 1, 2, 4])],
  night: [T_('Ночной троллейбус', 78, 'romance', [[57, 'm'], [53, 'M'], [55, 'M'], [52, 'm']], [2, 3, 2, 1, 0, 1, 2, 1]),
          T_('Седой снег', 72, 'ballad', [[50, 'm'], [55, 'm'], [57, 'M'], [50, 'm']], [0, 2, 3, 2, 4, 3, 2, 0]),
          T_('Спи, район', 66, 'dvor', [[52, 'm'], [57, 'm'], [47, 'M'], [52, 'm']], [2, 1, 0, 1, 2, 2, 1, 0])],
  love: [T_('Твой зелёный шарф', 76, 'romance', [[53, 'M'], [57, 'm'], [50, 'm'], [55, 'M']], [2, 3, 4, 3, 2, 1, 2, 3]),
         T_('Вечер на набережной', 84, 'romance', [[55, 'M'], [50, 'M'], [52, 'm'], [48, 'M']], [3, 2, 3, 4, 3, 2, 1, 2]),
         T_('Не уходи', 68, 'romance', [[57, 'm'], [53, 'M'], [48, 'M'], [52, 'M']], [0, 1, 2, 3, 3, 2, 1, 0])],
  home: [T_('Осенний двор', 78, 'dvor', [[52, 'm'], [57, 'm'], [50, 'M'], [55, 'M']], [0, 1, 2, 1, 0, 2, 3, 2])],
  zona: [T_('Этап', 68, 'dvor', [[57, 'm'], [52, 'm'], [57, 'm'], [52, 'M']], [0, 0, 1, 2, 1, 0, 2, 1]),
         T_('Цепи', 96, 'rock', [[52, 'm'], [53, 'M'], [52, 'm'], [50, 'M']], [0, 1, 0, 2, 0, 1, 3, 2])],
  final: [T_('Последняя глава', 66, 'romance', [[57, 'm'], [53, 'M'], [48, 'M'], [52, 'M'], [50, 'm'], [57, 'm'], [52, 'M'], [57, 'm']], [4, 3, 2, 1, 2, 3, 2, 0])],
};
const albumOn = () => { try { return localStorage.getItem('asfalt_album') !== '0'; } catch (e) { return true; } };
function albumCue(place) {
  if (typeof AUDIO === 'undefined' || !AUDIO.tape) return;
  const list = place && ALBUM[place];
  if (PLAYER.manual) return AUDIO.tape(PLAYER.manual.spec);                              // выбран трек вручную — играет он
  if (!list || !albumOn() || (S && !S.cur && S.tape)) { PLAYER.albPlace = null; return; }   // своя кассета на карте важнее
  if (PLAYER.albPlace === place) return AUDIO.tape(PLAYER.albSpec);
  const tr = list[Math.floor(Math.random() * list.length)];
  PLAYER.albPlace = place; PLAYER.albSpec = tr.spec; AUDIO.tape(tr.spec);
  if (AUDIO.musicOn()) cassetteShow({ t: tr.t, a: 'Сборник «Асфальт-87»' });
}
function songCue(place) {
  if (typeof __TEST !== 'undefined') return;
  PLAYER.place = place;
  albumCue(place);
}
// Какое «место» сейчас: по сцене, драке, фону, времени суток
function songPlace() {
  if (!S) return 'title';
  const ev = S.cur && EV[S.cur];
  const bg = ev ? T(ev.bg) : view === 'place' && typeof PLACE !== 'undefined' && PLACE[S.place] ? PLACE[S.place].bg : null;
  const id = S.cur || '';
  if (ev && ev.fight && S.fight) return 'fight';
  if (/^(z_|m_zona|k_uslovno)/.test(id) || /^t_(sud|barak|zona_dvor|svidanie)$/.test(bg)) return 'zona';
  if (/^(c6_final|z_gorod|z_volya|v01_end)$/.test(id) || S.ending) return 'final';
  if (/natasha|kafe|most|^n_|lilya/.test(id)) return 'love';
  if (['dk', 'pl_kino', 'pl_resto'].includes(bg)) return 'disco';
  if (['korobka', 'pustyr', 'garazhi'].includes(bg) || /shod|nabeg|war|strelk/.test(id)) return 'shod';
  if (['noch', 'ostanovka', 't_budka', 'pl_bar'].includes(bg)) return 'night';
  if (['kuhnya', 'shkola', 't_pochta'].includes(bg)) return 'home';
  if (ev) return null;                                     // прочие сцены — своя музыка игры
  const h = (S.min || 0) / 60;
  return h >= 21 ? 'night' : h < 10 ? 'dawn' : 'city';
}

// ---- кассета-плашка: «играет…» ----
function cassetteShow(s) {
  if (!s || typeof document === 'undefined') return;
  document.querySelectorAll('.cassette').forEach(e => e.remove());
  const el = document.createElement('div'); el.className = 'cassette';
  el.innerHTML = `<div class="cs-body"><i class="reel"></i><i class="reel"></i></div><div class="cs-txt"><b>${s.t}</b><span>${s.a}</span></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), 5200); setTimeout(() => el.remove(), 6000);
}

// ---- экран «Магнитофон» ----
function magScreen(back) {
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const all = Object.entries(ALBUM).flatMap(([p, list]) => list.map((tr, i) => ({ ...tr, p, k: p + i })));
  const cur = PLAYER.manual ? PLAYER.manual.k : null;
  $('#main').innerHTML = `<div class="scene in"><h2>📼 Магнитофон</h2>
    <p class="sub">Сборник «Асфальт-87» — ${all.length} мелодий, написанных для игры. В режиме «по местам» они сами меняются: дискотека, махач, сход, ночь, свидания, зона.</p>
    <div class="choices"><button class="btn ${PLAYER.manual ? '' : 'main'}" id="auto">${PLAYER.manual ? 'Вернуть режим «по местам»' : '✔ Играет по местам'}</button>
      <button class="btn" id="albTg">Музыка сборника: ${albumOn() ? 'вкл' : 'выкл'}</button></div>
    ${!AUDIO.musicOn() ? '<p class="sub" style="color:var(--bad)">Музыка выключена в меню игры («Музыка: выкл»). Включи её там.</p>' : ''}
    ${Object.entries(SONG_PLACES).map(([p, name]) => ALBUM[p] ? `<h3 class="mag-h">${name}</h3><div class="choices">${ALBUM[p].map((tr, i) => `<div class="item mag ${cur === p + i ? 'worn' : ''}">
      <div class="mag-reel${cur === p + i ? ' spin' : ''}"></div><div style="flex:1"><b>${tr.t}</b><div class="sub">${tr.spec.bpm} уд/мин</div></div>
      <button class="btn" data-play="${p + i}">${cur === p + i ? '■' : '▶'}</button></div>`).join('')}</div>` : '').join('')}
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  const redraw = () => magScreen(back);
  $('#auto').onclick = () => { PLAYER.manual = null; PLAYER.albPlace = null; songCue('title'); redraw(); };
  $('#albTg').onclick = () => { try { localStorage.setItem('asfalt_album', albumOn() ? '0' : '1'); } catch (e) {} PLAYER.albPlace = null; songCue('title'); redraw(); };
  document.querySelectorAll('[data-play]').forEach(b => b.onclick = () => {
    AUDIO.start();
    const tr = all.find(x => x.k === b.dataset.play);
    if (cur === tr.k) { PLAYER.manual = null; PLAYER.albPlace = null; songCue('title'); }
    else { PLAYER.manual = tr; AUDIO.tape(tr.spec); cassetteShow({ t: tr.t, a: 'Сборник «Асфальт-87»' }); }
    redraw();
  });
  $('#bk').onclick = () => { (back || titleScreen)(); };
}

// iPhone «замораживает» звук, когда приложение сворачивают или приходит звонок. Любое касание экрана будит его снова.
if (typeof document !== 'undefined' && document.addEventListener && typeof __TEST === 'undefined')
  document.addEventListener('pointerdown', () => { if (typeof AUDIO !== 'undefined' && AUDIO.start && AUDIO.musicOn()) AUDIO.start(); }, { capture: true, passive: true });
