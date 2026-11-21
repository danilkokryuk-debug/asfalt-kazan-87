// Живая карта: герой стоит на карте и ходит по улицам (на машине — едет), смена дня и ночи
// (сумерки, ночь, окна и фонари), дым из труб, голуби, граффити-метки группировок.
// Всё рисуется на том же холсте, что машины и прохожие (.trafcv), — SVG карты не перерисовывается.
const LIVE = { walk: null, lights: null, heroImg: null, heroKey: '' };
const MAPX0 = -MG * CELL, MAPY0 = -MG * CELL, MAPWU = (W + MG * 2) * CELL, MAPHU = (H + MG * 2) * CELL;

// ---------- путь по районам (через соседей), а не по прямой ----------
function mapPath(from, to) {
  if (!CENTROID[from] || !CENTROID[to]) return null;
  const prev = { [from]: null }, q = [from];
  while (q.length) { const c = q.shift(); if (c === to) break; for (const n of NEIGHBORS[c] || []) if (!(n in prev) && CENTROID[n]) { prev[n] = c; q.push(n); } }
  if (!(to in prev)) return [CENTROID[from], CENTROID[to]];
  const ids = []; for (let c = to; c; c = prev[c]) ids.unshift(c);
  // ломаная по «улицам»: сначала по горизонтали, потом по вертикали — как по кварталам
  const pts = [CENTROID[ids[0]]];
  for (let i = 1; i < ids.length; i++) { const [x0, y0] = pts[pts.length - 1], [x1, y1] = CENTROID[ids[i]]; pts.push([x1, y0], [x1, y1]); }
  return pts;
}
const pathLen = pts => pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
function pathAt(pts, k) {
  let need = pathLen(pts) * k;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0);
    if (need <= l || i === pts.length - 1) { const f = l ? Math.min(1, need / l) : 1; return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, x1 - x0, y1 - y0]; }
    need -= l; }
  return [...pts[pts.length - 1], 0, 0];
}
// идти по карте: анимация на холсте, игра ждёт окончания
{ const wt = walkTo; walkTo = (from, to, done) => {
  if (typeof __TEST !== 'undefined' || from === to || !document.querySelector('.trafcv')) return wt(from, to, done);
  const pts = mapPath(from, to); if (!pts) return done();
  const car = typeof carGo === 'function' && carGo();
  const dur = Math.max(700, Math.min(2400, pathLen(pts) * (car ? 9 : 16)));
  const w = LIVE.walk = { pts, t0: performance.now(), dur, done, car };
  setTimeout(() => { if (LIVE.walk === w) { LIVE.walk = null; done(); } }, dur + 900);   // страховка: вкладка свернулась или карта закрылась
  AUDIO.sfx && AUDIO.sfx(car ? 'door' : 'steps');
}; }

// ---------- спрайт героя для карты (перерисовывается, только если сменил одежду) ----------
function heroMapImg() {
  const key = JSON.stringify(S.wear) + S.app.hair + S.app.skin;
  if (LIVE.heroImg && LIVE.heroKey === key) return LIVE.heroImg;
  const c = document.createElement('canvas'); drawHero(c, S.app, S.wear); LIVE.heroImg = c; LIVE.heroKey = key; return c;
}

// ---------- ночь: окна и фонари — заранее на отдельном холсте ----------
function nightLights() {
  if (LIVE.lights) return LIVE.lights;
  const K = 3, c = document.createElement('canvas'); c.width = MAPWU * K; c.height = MAPHU * K;
  const x = c.getContext('2d'); if (!x) return null;
  x.setTransform(K, 0, 0, K, -MAPX0 * K, -MAPY0 * K);
  let seed = 87; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) {
    if (!cellAt(gx, gy) || isWater(gx, gy)) continue;
    const road = gx % 6 === 0 || gy % 7 === 0;
    if (road) {   // фонари вдоль улиц
      if ((gx + gy) % 3) continue;
      const lx = gx * CELL + 4, ly = gy * CELL + 4, g = x.createRadialGradient(lx, ly, 0, lx, ly, 6);
      g.addColorStop(0, 'rgba(255,210,130,.55)'); g.addColorStop(1, 'rgba(255,210,130,0)'); x.fillStyle = g; x.fillRect(lx - 6, ly - 6, 12, 12);
      x.fillStyle = 'rgba(255,240,200,.95)'; x.fillRect(lx - .4, ly - .4, .8, .8);
      continue;
    }
    for (let i = 0; i < 4; i++) { if (R() < 0.45) continue;   // горит не каждое окно
      x.fillStyle = R() < 0.15 ? 'rgba(170,200,255,.9)' : 'rgba(255,214,120,.92)';   // голубоватый — телевизор
      x.fillRect(gx * CELL + 1 + R() * 6, gy * CELL + 1 + R() * 6, .9, .7); }
  }
  LIVE.lights = c; return c;
}
// темнота по часам: 0 днём, ~0.6 глубокой ночью; сумерки — тёплые
function darkness() {
  const h = (S && S.min || 720) / 60;
  if (h >= 22 || h < 5) return { d: 0.6, warm: 0 };
  if (h >= 19) return { d: (h - 19) / 3 * 0.6, warm: Math.max(0, 1 - Math.abs(h - 19.5) / 1.5) };
  if (h < 7) return { d: (7 - h) / 2 * 0.6, warm: Math.max(0, 1 - Math.abs(h - 6) / 1) * 0.6 };
  return { d: 0, warm: 0 };
}

// ---------- дым и голуби ----------
const SMOKE = [];
function smokeSrc() {
  if (SMOKE.src) return SMOKE.src;
  let s = 5; const R = () => (s = (s * 16807) % 2147483647) / 2147483647, src = [];
  for (let k = 0; k < 400 && src.length < 7; k++) { const gx = Math.floor(R() * W), gy = Math.floor(R() * H);
    if (cellAt(gx, gy) && !isWater(gx, gy) && gx % 6 && gy % 7) src.push([gx * CELL + 4, gy * CELL + 3]); }
  return (SMOKE.src = src);
}
const BIRDS = { x: -50, y: 0, vx: 0, vy: 0, n: 9, next: 0 };

// ---------- кадр: вызывается из mapTraffic.draw ----------
function mapExtra(ctx, t, v) {
  if (!S) return;
  const { k, ox, oy, dpr, cw, ch } = v;
  ctx.setTransform(k * dpr, 0, 0, k * dpr, ox * dpr, oy * dpr);
  // дым из труб (зимой гуще)
  const win = typeof season === 'function' && season() === 'winter';
  for (const [sx, sy] of smokeSrc()) for (let i = 0; i < (win ? 5 : 3); i++) {
    const ph = ((t / 2600 + i / 5 + sx * 0.01) % 1), r = 0.8 + ph * 2.6;
    ctx.fillStyle = `rgba(${win ? 230 : 190},${win ? 232 : 190},${win ? 238 : 195},${(1 - ph) * (win ? 0.5 : 0.35)})`;
    ctx.beginPath(); ctx.arc(sx + ph * 5 + Math.sin(ph * 6 + i) * 0.6, sy - ph * 9, r, 0, 7); ctx.fill();
  }
  // голуби: стайка иногда пролетает над городом
  if (t > BIRDS.next && BIRDS.x < -40) { BIRDS.x = MAPX0 - 10; BIRDS.y = Math.random() * MAPHU * 0.7; BIRDS.vx = 0.9; BIRDS.vy = (Math.random() - 0.5) * 0.3; BIRDS.next = t + 9000 + Math.random() * 12000; }
  if (BIRDS.x > -40 && BIRDS.x < MAPX0 + MAPWU + 20) { BIRDS.x += BIRDS.vx; BIRDS.y += BIRDS.vy; ctx.fillStyle = '#2a2a2e';
    for (let i = 0; i < BIRDS.n; i++) { const bx = BIRDS.x - (i % 3) * 2.2 - i * 0.6, by = BIRDS.y + ((i * 7) % 5) - 2 + Math.sin(t / 90 + i) * 0.4, f = Math.sin(t / 70 + i) > 0 ? 0.9 : 0.2;
      ctx.fillRect(bx - 0.9, by - f * 0.5, 0.8, 0.3); ctx.fillRect(bx + 0.1, by - f * 0.5, 0.8, 0.3); ctx.fillRect(bx - 0.15, by - 0.15, 0.3, 0.4); } }
  else if (BIRDS.x >= MAPX0 + MAPWU + 20) BIRDS.x = -50;
  // ночь
  const { d, warm } = darkness();
  if (d > 0 || warm > 0) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (warm > 0) { ctx.fillStyle = `rgba(255,120,60,${warm * 0.14})`; ctx.fillRect(0, 0, cw, ch); }
    if (d > 0) { ctx.fillStyle = `rgba(8,12,34,${d})`; ctx.fillRect(0, 0, cw, ch);
      const L = nightLights(); if (L) { ctx.setTransform(k * dpr, 0, 0, k * dpr, ox * dpr, oy * dpr); ctx.globalAlpha = Math.min(1, d * 1.7);
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(L, MAPX0, MAPY0, MAPWU, MAPHU); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; } }
  }
  // герой: стоит на своём районе или идёт по улицам
  ctx.setTransform(k * dpr, 0, 0, k * dpr, ox * dpr, oy * dpr);
  let px, py, moving = false, dx = 0;
  const w = LIVE.walk;
  if (w) { const kk = Math.min(1, (t - w.t0) / w.dur), e = kk < 0.5 ? 2 * kk * kk : 1 - (-2 * kk + 2) ** 2 / 2; [px, py, dx] = pathAt(w.pts, e); moving = true;
    if (kk >= 1) { LIVE.walk = null; setTimeout(w.done, 60); } }
  else if (CENTROID[S.at]) [px, py] = CENTROID[S.at];
  if (px == null) return;
  const sz = 26 / k;   // на экране всегда ~26 px, при любом приближении
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(px, py + 0.2 * sz, sz * 0.28, sz * 0.09, 0, 0, 7); ctx.fill();
  if (moving && w.car && typeof CAR !== 'undefined' && S.car) {   // едет на своей машине
    ctx.save(); ctx.translate(px, py); ctx.rotate(Math.abs(dx) > 0.01 ? (dx > 0 ? Math.PI / 2 : -Math.PI / 2) : 0);
    ctx.fillStyle = '#c8402f'; ctx.fillRect(-sz * 0.16, -sz * 0.3, sz * 0.32, sz * 0.6); ctx.fillStyle = 'rgba(20,30,40,.85)'; ctx.fillRect(-sz * 0.12, -sz * 0.14, sz * 0.24, sz * 0.14); ctx.restore();
  } else {
    const bob = moving ? Math.abs(Math.sin(t / 90)) * sz * 0.06 : 0, img = heroMapImg();
    ctx.save(); ctx.translate(px, py - bob); if (dx < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -sz * 0.25, -sz * 0.8, sz * 0.5, sz);
    ctx.restore();
  }
  // метка «ты здесь»
  if (!moving) { const pulse = (t % 1400) / 1400; ctx.strokeStyle = `rgba(240,192,64,${1 - pulse})`; ctx.lineWidth = 1.2 / k; ctx.beginPath(); ctx.ellipse(px, py + 0.2 * sz, sz * (0.3 + pulse * 0.4), sz * (0.1 + pulse * 0.13), 0, 0, 7); ctx.stroke(); }
}

// ---------- граффити-метки группировок на районах (статичный SVG — не нагружает) ----------
function mapTags() {
  const svg = document.getElementById('map'); if (!svg || !svg.appendChild || typeof svgEl !== 'function') return;
  const ctl = typeof mapControl === 'function' ? mapControl(S) : S.ctrl, g = svgEl('g', { class: 'tags', 'pointer-events': 'none' });
  for (const d of DISTRICTS) {
    const o = DIST[ctl[d.id]]; if (!o || d.id === 'center' || !CENTROID[d.id]) continue;
    const word = String(o.gang || o.name).replace(/[«»"]/g, '').split(/[\s-]/).filter(w => w.length > 2)[0] || '';
    const tag = word.slice(0, 5).toUpperCase(), [cx, cy] = CENTROID[d.id], rot = ((d.id.length * 37) % 20) - 10;
    const tx = svgEl('text', { x: cx + 9, y: cy - 9, class: 'gtag', transform: `rotate(${rot} ${cx + 9} ${cy - 9})`, fill: o.color });
    tx.textContent = tag; g.appendChild(tx);
  }
  svg.appendChild(g);
}
{ const rm = renderMap_; renderMap_ = sel => { rm(sel); try { mapTags(); } catch (e) {} }; }
