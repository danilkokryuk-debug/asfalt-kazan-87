// Заставка студии Kryuk Labs при запуске (≈2,5 с, тап — пропустить) и подпись «© Kryuk Labs» внизу меню.
// Логотип проявляется из темноты, по его линиям пробегает блик (маска img/kryuk_labs_mask.png), затем всё гаснет.
(() => {
  if (typeof __TEST !== 'undefined') return;
  let shown = false;
  const ts = titleScreen;
  titleScreen = (...a) => {
    if (shown) { ts(...a); credit(); return; }
    shown = true;
    const el = document.createElement('div'); el.className = 'kl-intro';
    el.innerHTML = '<div class="kl-logo"><img src="img/kryuk_labs.jpg" alt="Kryuk Labs"><div class="kl-glow"></div><div class="kl-glint"></div></div>';
    document.body.appendChild(el);
    let done = false;
    const end = () => { if (done) return; done = true; el.classList.add('out'); setTimeout(() => { el.remove(); }, 600); ts(...a); credit(); };
    el.onclick = end;
    const img = el.querySelector('img');
    const go = () => { el.classList.add('on'); setTimeout(end, 2600); };
    img.complete ? go() : (img.onload = go, img.onerror = end);
  };
  // «© Kryuk Labs» под версией в главном меню
  function credit() { const st = document.getElementById('stats'); if (st && !document.getElementById('kl-credit')) st.insertAdjacentHTML('afterend', '<div id="kl-credit" class="kl-credit">© Kryuk Labs</div>'); }
})();
