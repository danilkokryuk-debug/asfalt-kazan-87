// Города. Перед новой игрой — выбор города; в меню — вкладка «Города» со всеми городами и их статусом.
// Пока город в разработке, его можно только посмотреть: карта открывается по адресу ?city=moscow, сохранения отключены.
const CITIES = [
  { id: 'kazan', name: 'Казань', years: '1987–1998', status: 'play', desc: 'Моталки, асфальт, «Тяп-Ляп» и «Универсам». Полная история от чушпана до последней стрелки.' },
  { id: 'moscow', name: 'Москва', years: '1985–1998', status: 'dev', needKazan: true, desc: 'Любера, солнцевские, ореховские, казанские на Рижском рынке. Карта готова — история пишется.', map: true },
];
const cityTag = c => c.status === 'play' ? '' : c.status === 'dev' ? ' (в разработке)' : ' (скоро)';
// Москва и следующие города — только после прохождения кампании Казани (любая сюжетная концовка, не гибель на улице)
const kazanDone = () => { try { return !!metaGet().kazanDone; } catch (e) { return false; } };
{ const en = ending; ending = (...a) => { if (S && S.mode === 'campaign' && S.ending) { const m = metaGet(); if (!m.kazanDone) { m.kazanDone = true; metaPut(m); } } return en(...a); }; }
function citiesScreen(forNewGame) {
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene in"><h2>${forNewGame ? 'Выбери город' : '🏙 Города'}</h2>
    <div class="choices">${CITIES.map(c => `<div class="item city ${c.status}"><div style="flex:1"><b>${c.name}${cityTag(c)}</b> <span class="ch mid">${c.years}</span><div class="sub">${c.desc}</div>
      ${c.needKazan ? `<div class="sub ${kazanDone() ? 'hi' : 'lo'}">${kazanDone() ? '✔ Кампания Казани пройдена' : '🔒 Откроется после прохождения кампании Казани'}</div>` : ''}
      <div class="fam-b">${c.status === 'play' && (!c.needKazan || kazanDone()) ? (forNewGame ? `<button class="btn main" data-city="${c.id}">Играть</button>` : '<span class="ch hi">доступно</span>') : `<button class="btn" disabled>${c.status === 'dev' ? 'В разработке' : c.needKazan && !kazanDone() ? 'Закрыто' : 'Скоро'}</button>`}
        ${c.map ? `<button class="btn" data-map="${c.id}">Посмотреть карту</button>` : ''}</div></div></div>`).join('')}</div>
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  $('#bk').onclick = () => { AUDIO.click(); titleScreen(); };
  document.querySelectorAll('[data-city]').forEach(b => b.onclick = () => { AUDIO.click(); playScreen(); });
  document.querySelectorAll('[data-map]').forEach(b => b.onclick = () => { location.href = location.pathname + '?city=' + b.dataset.map; });
}
// меню: «Новая игра» → выбор города; кнопка «Города»
{ const ts = titleScreen; titleScreen = (...a) => {
  if (CITY !== 'kazan') return cityPreview();
  ts(...a);
  const play = $('#play'); if (!play) return;
  play.onclick = () => { AUDIO.click(); citiesScreen(true); };
  if (!$('#cities')) { const b = document.createElement('button'); b.className = 'btn'; b.id = 'cities'; b.textContent = '🏙 Города'; play.after(b); b.onclick = () => { AUDIO.click(); citiesScreen(false); }; }
}; }

// ---------- просмотр карты города в разработке ----------
function cityPreview() {
  window.save = () => {}; window.dropSave = () => {};   // ничего не сохраняем: игра — казанская
  const c = CITIES.find(x => x.id === CITY);
  S = newState({ name: 'Гость', app: { ...DEFAULT_APP }, wear: { ...DEFAULT_WEAR, acc: [] }, home: 'center', fam: 'full', dengi: 0, semya: 60 });
  S.min = 13 * 60; S.at = 'center'; S.flags.preview = 1;
  if (typeof PLACES !== 'undefined') PLACES.splice(0);   // заведения пока казанские — в Москве их ещё нет
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const legend = DISTRICTS.filter(d => d.gang).map(d => `<span class="lg"><i style="background:${d.color}"></i>${d.gang}</span>`).join('');
  $('#main').innerHTML = `<div id="mapwrap"><svg id="map"></svg><div class="zoom"><button data-z="1.4">+</button><button data-z="0.7">−</button><button data-z="0">⟲</button></div></div>
    <div class="legend">${legend}</div>
    <div class="sheet"><h3>${c ? c.name : CITY} · ${c ? c.years : ''} · в разработке</h3><div class="sub" id="cp-d">Нажми на район, чтобы узнать, кто его держит. Играть пока нельзя — история пишется.</div>
    <div class="choices"><button class="btn main" id="cp-back">← Вернуться в Казань</button></div></div>`;
  const svg = $('#map');
  drawMapSvg(svg, S.ctrl, null, null, id => { const d = DIST[id]; if (d) $('#cp-d').innerHTML = `<b>${d.name}</b>${d.gang ? ` — «${d.gang}»` : ''}. ${d.desc}`; }, 'center', []);
  if (typeof applyView === 'function') applyView(svg);
  document.querySelectorAll('.zoom button').forEach(b => b.onclick = e => { e.stopPropagation(); zoomBy(+b.dataset.z); });
  $('#cp-back').onclick = () => { location.href = location.pathname; };
}
