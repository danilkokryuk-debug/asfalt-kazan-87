// Android (приложение из Play Маркета) и телефоны вообще.
// «Назад» не закрывает игру сразу: закрывает ролик, окно, вложенный экран; на карте и в меню —
// «нажми ещё раз, чтобы выйти». Звук молчит, пока игра свёрнута. Вибрация на ударах (выключается в настройках).
(() => {
  if (typeof __TEST !== 'undefined' || typeof history === 'undefined') return;
  const arm = () => { try { history.pushState({ asf: Date.now() }, ''); } catch (e) {} };
  arm();
  const vis = el => el && el.offsetParent !== null;
  const BACK_RE = /^(←\s*)?(Назад|Закрыть|Отмена|Понятно)\b/;
  let exitAt = 0;
  addEventListener('popstate', () => {
    const intro = document.querySelector('.mskintro');
    if (intro) { const sk = intro.querySelector('.mi-skip'); (sk && vis(sk) ? sk : intro).click(); return arm(); }
    // верхнее окно/экран с кнопкой «Назад» — последняя видимая такая кнопка
    const btns = [...document.querySelectorAll('button')].filter(b => vis(b) && !b.disabled && BACK_RE.test(b.textContent.trim()));
    if (btns.length) { btns[btns.length - 1].click(); return arm(); }
    const nav = document.getElementById('nav');
    const inGame = typeof S !== 'undefined' && S && nav && !nav.classList.contains('hidden');
    if (inGame && typeof view !== 'undefined' && view !== 'map') { view = 'map'; render(); return arm(); }
    if (typeof S !== 'undefined' && S && (S.cur || S.res) && !inGame) return arm();   // идёт сцена — «Назад» её не пропускает
    if (Date.now() - exitAt < 2200) { history.back(); return; }   // второе нажатие — выход из приложения
    exitAt = Date.now(); if (typeof toast === 'function') toast('Нажми «Назад» ещё раз, чтобы выйти'); arm();
  });

  // свернул игру — тишина; вернулся — звук обратно
  document.addEventListener('visibilitychange', () => {
    if (typeof AUDIO === 'undefined') return;
    if (document.hidden) { AUDIO.pause && AUDIO.pause(); document.querySelectorAll('video').forEach(v => v.pause()); }
    else AUDIO.resume && AUDIO.resume();
  });

  // вибрация на ударах и громких событиях
  const buzz = ms => { try { if (navigator.vibrate && (typeof SET === 'undefined' || SET.vibro !== false)) navigator.vibrate(ms); } catch (e) {} };
  if (typeof AUDIO !== 'undefined') {
    const h = AUDIO.hit; if (h) AUDIO.hit = (...a) => { buzz(35); return h.apply(AUDIO, a); };
    const sf = AUDIO.sfx; if (sf) AUDIO.sfx = (n, ...a) => { if (n === 'slam') buzz([60, 40, 90]); else if (n === 'siren') buzz(20); return sf.call(AUDIO, n, ...a); };
  }
})();
