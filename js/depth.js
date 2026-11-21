// Глубина в сценах: фото-фон делится на слои — медленно «дышащий» основной план, размытый дальний план сверху
// (глубина резкости), туман у горизонта, виньетка; у персонажей тени на земле.
// При движении пальца или мыши фон и персонажи смещаются по-разному — параллакс. Только transform/opacity.
{ const sh = stageHtml; stageHtml = bg => {
  const html = sh(bg), f = bgPhoto(bg || 'dvor');
  if (!f) return html;
  const url = `url(img/${f}.jpg)`;
  const layers = `<div class="dp dp-near" style="background-image:${url}"></div><div class="dp dp-far" style="background-image:${url}"></div><div class="dp dp-haze"></div><div class="dp dp-vig"></div>`
    + `<i class="shadow s-npc"></i><i class="shadow s-me"></i>`;
  return html.replace(/(<div class="stage[^>]*>)/, `$1${layers}`);
}; }
// параллакс от пальца/мыши: фон смещается сильнее, чем персонажи
let DP_T = 0;
function dpMove(e) {
  const st = document.querySelector('.stage.ph'); if (!st) return;
  const now = performance.now(); if (now - DP_T < 32) return; DP_T = now;   // не чаще 30 раз в секунду
  const r = st.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
  const nx = ((p.clientX - r.left) / r.width - 0.5) * 2, ny = ((p.clientY - r.top) / r.height - 0.5) * 2;
  st.style.setProperty('--px', Math.max(-1, Math.min(1, nx)).toFixed(3));
  st.style.setProperty('--py', Math.max(-1, Math.min(1, ny)).toFixed(3));
}
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('pointermove', dpMove, { passive: true });
  document.addEventListener('touchmove', dpMove, { passive: true });
}
