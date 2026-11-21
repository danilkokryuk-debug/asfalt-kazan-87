// Подробный город для карты: рисуется один раз на холсте и кладётся в SVG картинкой.
// Вид сверху «в 3D»: у каждого дома крыша, видимая южная стена с окнами и тень. При приближении видны дворы, деревья, машины.
// Зима — свой вариант (снег на крышах и во дворах). Кэшируется на сессию.
const CITY_K = 5;                      // пикселей на единицу SVG: хватает для приближения ×6
const CITY_CACHE = {};
function cityRng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const DTYPE = { center: 'center', socgorod: 'zavod', kinoplenka: 'zavod', tyap: 'zavod', borisk: 'chastny', gryaz: 'chastny', mirny: 'chastny', novotat: 'sloboda' };

function cityImage(winter) {
  const key = winter ? 'w' : 's';
  if (CITY_CACHE[key]) return CITY_CACHE[key];
  const U = CELL, X0 = -MG * U, Y0 = -MG * U, WU = (W + MG * 2) * U, HU = (H + MG * 2) * U;
  const cv = document.createElement('canvas'); cv.width = WU * CITY_K; cv.height = HU * CITY_K;
  const c = cv.getContext('2d'); if (!c) return null;
  c.setTransform(CITY_K, 0, 0, CITY_K, -X0 * CITY_K, -Y0 * CITY_K);
  const R = cityRng(1987 + (winter ? 1 : 0));
  const P = winter
    ? { forest: '#2a3a30', tree: '#30483a', treeHi: '#e8eef2', field: '#d8dee4', field2: '#cdd4da', ground: '#c9d0d6', yard: '#d6dce2', road: '#5a5a60', walk: '#9aa0a6', roof: ['#e4e9ee', '#dfe5ea', '#d2d8de'], water: '#3c566e', ice: '#9fb4c6' }
    : { forest: '#1f2e1c', tree: '#2c4a28', treeHi: '#4f7a3e', field: '#5a6a3c', field2: '#66743f', ground: '#4a4a42', yard: '#53573f', road: '#2c2c30', walk: '#6a665c', roof: ['#7a6e62', '#6a6058', '#8a5a48', '#5e6670'], water: '#23384c', ice: '#2e4a62' };
  const rect = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  // карта занятости города (1 ячейка = 1 единица): чтобы дома не налезали друг на друга и не оставалось пустот
  const OW = W * U, OH = H * U, occ = new Uint8Array(OW * OH);
  const markOcc = (x, y, w, d) => { for (let yy = Math.max(0, Math.floor(y)); yy < Math.min(OH, Math.ceil(y + d)); yy++) for (let xx = Math.max(0, Math.floor(x)); xx < Math.min(OW, Math.ceil(x + w)); xx++) occ[yy * OW + xx] = 1; };
  const freeA = (x, y, w, d) => { for (let yy = Math.max(0, Math.floor(y)); yy < Math.min(OH, Math.ceil(y + d)); yy++) for (let xx = Math.max(0, Math.floor(x)); xx < Math.min(OW, Math.ceil(x + w)); xx++) if (occ[yy * OW + xx]) return false; return true; };
  const tree = (x, y, r) => {
    markOcc(x - r * 0.6, y - r * 0.6, r * 1.2, r * 1.2);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x + r * 0.5, y + r * 0.5, r, 0, 7); c.fill();
    c.fillStyle = P.tree; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = P.treeHi; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 0, 7); c.fill();
  };
  // Дом «в 3D»: тень → стена (юг) → крыша. h — высота в единицах карты.
  const boxes = [];
  const box = (x, y, w, d, h, roof, opt = {}) => { boxes.push({ x, y, w, d, h, roof, ...opt }); markOcc(x - 0.4, y - h * 0.42 - 0.4, w + 0.8, d + h * 0.42 + 0.8); };
  const drawBox = b => {
    const k = 0.42, lift = b.h * k;
    c.fillStyle = 'rgba(0,0,0,.32)';                                             // тень вправо-вниз
    c.beginPath(); c.moveTo(b.x + b.w, b.y); c.lineTo(b.x + b.w + b.h * 0.55, b.y + b.h * 0.35); c.lineTo(b.x + b.w + b.h * 0.55, b.y + b.d + b.h * 0.35);
    c.lineTo(b.x + b.h * 0.55, b.y + b.d + b.h * 0.35); c.lineTo(b.x, b.y + b.d); c.closePath(); c.fill();
    const wall = shade(b.roof, winter ? 0.55 : 0.68);
    rect(b.x, b.y + b.d - lift, b.w, lift, wall);                                  // южная стена
    if (b.h > 1.5) {                                                                // окна: ряды по этажам
      const fl = Math.max(1, Math.round(b.h / 0.9)), rows = Math.min(fl, 9);
      for (let r = 0; r < rows; r++) for (let wx = b.x + 0.5; wx < b.x + b.w - 0.4; wx += 1.1) {
        const lit = R() < 0.28; c.fillStyle = lit ? '#f2c870' : 'rgba(20,24,30,.55)';
        c.fillRect(wx, b.y + b.d - lift + 0.25 + r * (lift - 0.4) / rows, 0.45, Math.max(0.2, (lift - 0.4) / rows * 0.5));
      }
    }
    rect(b.x, b.y - lift, b.w, b.d, b.roof);                                       // крыша
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(b.x, b.y - lift, b.w, 0.35);
    if (b.saw) for (let sx = b.x; sx < b.x + b.w - 1; sx += 2) { c.fillStyle = shade(b.roof, 0.8); c.fillRect(sx, b.y - lift, 1, b.d); }
    if (b.chimney) { rect(b.x + b.w - 1.6, b.y - lift - b.h * 1.4, 1.1, b.h * 1.4, '#6a5048'); rect(b.x + b.w - 1.6, b.y - lift - b.h * 1.4, 1.1, 0.4, '#c8402f');
      c.fillStyle = 'rgba(200,200,200,.25)'; c.beginPath(); c.arc(b.x + b.w - 0.4, b.y - lift - b.h * 1.8, 1.6, 0, 7); c.fill(); }
    if (b.dome) { c.fillStyle = b.dome; c.beginPath(); c.arc(b.x + b.w / 2, b.y - lift, Math.min(b.w, b.d) * 0.35, 0, 7); c.fill(); }
  };

  // ---------- 1. земля, лес, поля, дачи за городом ----------
  rect(X0, Y0, WU, HU, P.forest);
  const volgaOut = (gx, gy) => gx < 4 && gx >= -3 + Math.round(Math.sin(gy * 0.3)) && !(gy < 0 && gx < -1);
  const water = (gx, gy) => (gx >= 0 && gy >= 0 && gx < W && gy < H) ? isWater(gx, gy) && !isBridge(gx, gy) : volgaOut(gx, gy);
  for (let gy = -MG; gy < H + MG; gy++) for (let gx = -MG; gx < W + MG; gx++) {
    if (gx >= 0 && gy >= 0 && gx < W && gy < H) continue;
    if (water(gx, gy)) continue;
    const x = gx * U, y = gy * U;
    if (onExtCell(gx, gy) || gx === W + 3) { rect(x, y, U, U, winter ? P.field : '#3a4a30'); continue; }   // полоса отвода у трассы и железки
    const field = (gx > W + 1 || gy > H + 1) && hash(gx >> 2, gy >> 2) > 0.55;
    const dacha = gy < 0 && gx > 10 && gx < 30 && hash(gx >> 1, gy) > 0.7;
    if (field) { rect(x, y, U, U, hash(gx >> 2, gy >> 2) > 0.75 ? P.field2 : P.field); c.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < U; i += 1.6) c.fillRect(x, y + i, U, 0.4); }
    else if (dacha) { rect(x, y, U, U, winter ? P.field : '#4e5a36'); box(x + 2, y + 2, 2.6, 2.2, 1.2, P.roof[(gx + gy) & 1 ? 0 : 2]); tree(x + 6, y + 6, 1); }
    else for (let i = 0; i < 3; i++) tree(x + R() * U, y + R() * U, 1.4 + R() * 1.3);
  }
  // ---------- 2. вода ----------
  for (let gy = -MG; gy < H + MG; gy++) for (let gx = -MG; gx < W + MG; gx++) if (water(gx, gy)) {
    rect(gx * U, gy * U, U + 0.1, U + 0.1, P.water);
    c.fillStyle = winter ? 'rgba(200,220,235,.35)' : 'rgba(120,160,190,.22)';
    for (let i = 0; i < 2; i++) c.fillRect(gx * U + R() * 6, gy * U + R() * 7, 1.5 + R() * 2, 0.25);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!water(gx + dx, gy + dy) && !(cellAt(gx + dx, gy + dy) === undefined && gx + dx >= 0 && gx + dx < W && gy + dy >= 0 && gy + dy < H)) {
      c.fillStyle = winter ? P.ice : '#8a7a5a';                                    // берег
      if (dx) c.fillRect(gx * U + (dx > 0 ? U - 0.6 : 0), gy * U, 0.6, U); else c.fillRect(gx * U, gy * U + (dy > 0 ? U - 0.6 : 0), U, 0.6);
    }
  }
  // ---------- 2б. трассы на выезд, мост через Волгу, железная дорога ----------
  const extH = (x0, x1, y) => { for (let x = Math.min(x0, x1); x < Math.max(x0, x1); x += U) { const gx = Math.floor(x / U), br = water(gx, Math.floor(y / U));
      rect(x, y - 2.5, U + 0.05, 5, br ? '#6a6258' : P.walk); rect(x, y - 1.8, U + 0.05, 3.6, br ? '#5a5650' : P.road);
      c.fillStyle = winter ? '#9a9aa0' : '#d8c880'; c.fillRect(x + 1, y - 0.08, 3, 0.16);
      if (br) { rect(x, y - 2.6, U + 0.05, 0.35, '#c8c0a8'); rect(x, y + 2.3, U + 0.05, 0.35, '#c8c0a8'); if (gx % 2 === 0) rect(x + 3.5, y + 2.6, 1, 2.5, '#4a4640'); } } };
  const extV = (x, y0, y1) => { for (let y = Math.min(y0, y1); y < Math.max(y0, y1); y += U) {
      rect(x - 2.5, y, 5, U + 0.05, P.walk); rect(x - 1.8, y, 3.6, U + 0.05, P.road); c.fillStyle = winter ? '#9a9aa0' : '#d8c880'; c.fillRect(x - 0.08, y + 1, 0.16, 3); } };
  // железная дорога: насыпь, шпалы, рельсы
  rect(RAIL_X - 2, -MG * U, 4, (H + MG * 2) * U, winter ? '#8a8a8a' : '#5a5048');
  for (let y = -MG * U; y < (H + MG) * U; y += 1.2) rect(RAIL_X - 1.6, y, 3.2, 0.45, '#3a2a20');
  rect(RAIL_X - 1.05, -MG * U, 0.3, (H + MG * 2) * U, '#a8a8b0'); rect(RAIL_X + 0.75, -MG * U, 0.3, (H + MG * 2) * U, '#a8a8b0');
  extH(W * U, (W + MG) * U, EXT.east.line * U + 4);
  extV(EXT.north.line * U + 4, -MG * U, 0);
  extV(EXT.south.line * U + 4, H * U, (H + MG) * U);
  extH(-MG * U, westLand(EXT.west.line) * U, EXT.west.line * U + 4);
  // переезд: шлагбаумы у железки на оренбургской трассе
  { const y = EXT.east.line * U + 4; rect(RAIL_X - 3.5, y - 3.2, 0.5, 0.5, '#c8402f'); rect(RAIL_X + 3, y + 2.7, 0.5, 0.5, '#c8402f');
    for (let i = 0; i < 4; i++) rect(RAIL_X - 4 + i * 1.2, y - 3.4, 0.6, 0.3, i % 2 ? '#f0f0f0' : '#c8402f'); }
  // ---------- 3. город: земля, дороги, кварталы ----------
  const isRoadCol = gx => gx % 6 === 0, isRoadRow = gy => gy % 7 === 0;
  for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) {
    const id = cellAt(gx, gy); if (!id) continue;
    const x = gx * U, y = gy * U;
    if (isWater(gx, gy)) {                                                           // мост
      rect(x, y, U, U, P.water); rect(x + 1.5, y - 0.5, U - 3, U + 1, '#6a6258'); rect(x + 1.5, y, 0.4, U, '#c8c0a8'); rect(x + U - 1.9, y, 0.4, U, '#c8c0a8'); continue;
    }
    const t = DTYPE[id] || 'micro';
    rect(x, y, U + 0.05, U + 0.05, t === 'chastny' ? (winter ? P.yard : '#4c5636') : t === 'center' ? (winter ? '#cfd3d6' : '#57534a') : P.ground);
  }
  // дороги поверх земли
  for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) {
    if (!cellAt(gx, gy) || isWater(gx, gy)) continue;
    const x = gx * U, y = gy * U;
    if (isRoadCol(gx)) markOcc(x + 1.2, y, 5.6, U);
    if (isRoadRow(gy)) markOcc(x, y + 1.2, U, 5.6);
    if (isRoadCol(gx)) { rect(x + 1.5, y, 5, U + 0.05, P.walk); rect(x + 2.2, y, 3.6, U + 0.05, P.road); if (!isRoadRow(gy)) { c.fillStyle = winter ? '#8a8a90' : '#c8b878'; c.fillRect(x + 3.95, y + 1, 0.15, 3); } }
    if (isRoadRow(gy)) { rect(x, y + 1.5, U + 0.05, 5, P.walk); rect(x, y + 2.2, U + 0.05, 3.6, P.road); if (!isRoadCol(gx)) { c.fillStyle = winter ? '#8a8a90' : '#c8b878'; c.fillRect(x + 1, y + 3.95, 3, 0.15); } }
  }
  // машины на дорогах
  const CARS = ['#e8e4d8', '#c8402f', '#2e5f96', '#d8a441', '#3a6a3a', '#202020', '#9aa4ae'];
  for (let i = 0; i < 420; i++) {
    const gx = Math.floor(R() * W), gy = Math.floor(R() * H); if (!cellAt(gx, gy) || isWater(gx, gy)) continue;
    const col = CARS[Math.floor(R() * CARS.length)];
    if (isRoadCol(gx) && !isRoadRow(gy)) { const lane = R() < 0.5 ? 2.6 : 4.4; rect(gx * U + lane, gy * U + R() * 5, 1, 1.9, col); rect(gx * U + lane + 0.15, gy * U + 0.5, 0.7, 0.3, 'rgba(255,255,255,.4)'); }
    else if (isRoadRow(gy) && !isRoadCol(gx)) { const lane = R() < 0.5 ? 2.6 : 4.4; rect(gx * U + R() * 5, gy * U + lane, 1.9, 1, col); }
  }
  // кварталы: прямоугольники между дорогами
  for (let by = 0; by < H; by += 7) for (let bx = 0; bx < W; bx += 6) {
    const x0 = (bx + 1) * U - 1.5, y0 = (by + 1) * U - 1.5, x1 = Math.min(W, bx + 6) * U + 1.5, y1 = Math.min(H, by + 7) * U + 1.5;
    const cx = Math.min(W - 1, bx + 3), cy = Math.min(H - 1, by + 3), id = cellAt(cx, cy);
    if (!id) continue;
    const t = DTYPE[id] || 'micro', bw = x1 - x0, bh = y1 - y0;
    const land = (x, y) => { const g = cellAt(Math.floor(x / U), Math.floor(y / U)); return g && !isWater(Math.floor(x / U), Math.floor(y / U)); };
    const ok = (x, y, w, d) => land(x, y) && land(x + w, y) && land(x, y + d) && land(x + w, y + d);
    const roof = () => P.roof[Math.floor(R() * P.roof.length)];
    const park = hash(bx * 7, by * 3) > 0.88 && t !== 'zavod';
    if (park) {                                                                      // сквер: дорожки, пруд, деревья
      rect(x0 + 1, y0 + 1, bw - 2, bh - 2, winter ? '#dde3e8' : '#3a5530');
      c.strokeStyle = winter ? '#b8c0c8' : '#8a7a5a'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x0 + 1, y0 + 1); c.lineTo(x1 - 1, y1 - 1); c.moveTo(x1 - 1, y0 + 1); c.lineTo(x0 + 1, y1 - 1); c.stroke();
      for (let i = 0; i < 22; i++) { const tx = x0 + 2 + R() * (bw - 4), ty = y0 + 2 + R() * (bh - 4); if (land(tx, ty)) tree(tx, ty, 1 + R() * 0.9); }
      continue;
    }
    if (t === 'micro') {                                                             // микрорайон: панельки в ряд, дворы
      const vertical = hash(bx, by) > 0.5;
      if (!vertical) for (let yy = y0 + 4; yy < y1 - 4; yy += 10) { const len = bw * (0.55 + R() * 0.35), xx = x0 + 2 + R() * (bw - len - 4), h = R() < 0.35 ? 7 : 4; if (ok(xx, yy, len, 3.2)) box(xx, yy, len, 3.2, h, roof()); }
      else for (let xx = x0 + 3; xx < x1 - 5; xx += 9) { const len = bh * (0.5 + R() * 0.3), yy = y0 + 4 + R() * (bh - len - 6), h = R() < 0.35 ? 7 : 4; if (ok(xx, yy, 3.2, len)) box(xx, yy, 3.2, len, h, roof()); }
      for (let i = 0; i < 14; i++) { const tx = x0 + 2 + R() * (bw - 4), ty = y0 + 2 + R() * (bh - 4); if (land(tx, ty)) tree(tx, ty, 0.9 + R() * 0.7); }
      if (R() < 0.5) { const px = x0 + bw / 2 - 2, py = y0 + bh - 7; if (ok(px, py, 4, 3)) { rect(px, py, 4, 3, winter ? '#e8ecf0' : '#7a6a4a'); rect(px + 0.5, py + 0.5, 1, 1, '#c8402f'); rect(px + 2.4, py + 1.2, 1.2, 0.4, '#d8a441'); } }   // детская площадка
      for (let i = 0; i < 5; i++) { const cx2 = x0 + 2 + R() * (bw - 4), cy2 = y0 + bh - 3.2; if (land(cx2, cy2)) rect(cx2, cy2, 1, 1.8, CARS[Math.floor(R() * 7)]); }
    } else if (t === 'center') {                                                     // старый центр: дома по периметру, двор-колодец
      const h = 3 + R() * 1.5, dpt = 4;
      for (let xx = x0 + 1.5; xx < x1 - 4; xx += 5 + R() * 2) { const w = 4 + R() * 2; if (ok(xx, y0 + 1.5, w, dpt)) box(xx, y0 + 1.5, w, dpt, h, roof()); if (ok(xx, y1 - dpt - 1.5, w, dpt)) box(xx, y1 - dpt - 1.5, w, dpt, h + R(), roof()); }
      for (let yy = y0 + 6.5; yy < y1 - 9; yy += 6) { if (ok(x0 + 1.5, yy, dpt, 5)) box(x0 + 1.5, yy, dpt, 5, h, roof()); if (ok(x1 - dpt - 1.5, yy, dpt, 5)) box(x1 - dpt - 1.5, yy, dpt, 5, h, roof()); }
      for (let i = 0; i < 4; i++) { const tx = x0 + bw * (0.3 + R() * 0.4), ty = y0 + bh * (0.3 + R() * 0.4); if (land(tx, ty)) tree(tx, ty, 1.1); }
    } else if (t === 'zavod') {                                                      // заводы: цеха с «пилой», трубы, склады
      if (R() < 0.6) { const w = bw * 0.6, d = bh * 0.35, xx = x0 + 3, yy = y0 + 4; if (ok(xx, yy, w, d)) box(xx, yy, w, d, 3.2, winter ? P.roof[0] : '#5a5a5e', { saw: true, chimney: R() < 0.7 }); }
      for (let yy = y0 + bh * 0.55; yy < y1 - 6; yy += 8) { const xx = x0 + 3 + R() * 6; if (ok(xx, yy, 9, 4)) box(xx, yy, 9, 4, 4, roof()); if (ok(xx + 13, yy, 9, 4)) box(xx + 13, yy, 9, 4, 6, roof()); }
      for (let i = 0; i < 6; i++) { const tx = x0 + 2 + R() * (bw - 4), ty = y0 + 2 + R() * (bh - 4); if (land(tx, ty)) tree(tx, ty, 0.8); }
    } else if (t === 'chastny' || t === 'sloboda') {                                 // частный сектор: домики с огородами
      for (let yy = y0 + 2; yy < y1 - 4; yy += 5) for (let xx = x0 + 2; xx < x1 - 4; xx += 5) {
        if (!ok(xx, yy, 4, 4)) continue;
        rect(xx, yy, 4.4, 4.4, winter ? '#e2e7ec' : R() < 0.5 ? '#4a5a30' : '#5a5030');
        if (!winter) { c.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0.6; i < 4.4; i += 0.9) c.fillRect(xx + 2.2, yy + i, 2, 0.3); }
        box(xx + 0.4, yy + 0.6, 2, 1.8, t === 'sloboda' ? 1.8 : 1.2, t === 'sloboda' ? '#6a4a3a' : roof());
        if (R() < 0.4) tree(xx + 3.4, yy + 3.4, 0.8);
      }
      if (t === 'sloboda' && R() < 0.5) { const xx = x0 + bw / 2 - 2, yy = y0 + bh / 2 - 2; if (ok(xx, yy, 4, 4)) box(xx, yy, 4, 4, 2.5, '#2e6a5a', { dome: '#3a8a6a' }); }  // мечеть
    }
  }
  // ---------- 4. Кремль на мысу у Казанки ----------
  const [kx, ky] = CENTROID.center || [80, 150];
  const KX = kx - 18, KY = ky - 30;
  markOcc(KX - 3, KY - 12, 32, 36);
  // ---------- 3б. дозастройка: в городе не должно быть пустырей ----------
  const landP = (x, y) => { const gx = Math.floor(x / U), gy = Math.floor(y / U); return cellAt(gx, gy) && !isWater(gx, gy); };
  const okP = (x, y, w, d) => landP(x, y) && landP(x + w, y) && landP(x, y + d) && landP(x + w, y + d) && freeA(x - 0.3, y - 1.5, w + 0.6, d + 1.8);
  const roofR = () => P.roof[Math.floor(R() * P.roof.length)];
  const FILL = {
    garazhi: (x, y) => { if (!okP(x, y, 7.2, 3)) return false; const col = winter ? '#d8dde2' : R() < 0.5 ? '#5e5a56' : '#6a5a4a';
      for (let i = 0; i < 3; i++) { box(x + i * 2.4, y, 2.2, 3, 1.3, col); rect(x + i * 2.4 + 0.4, y + 3 - 0.1, 1.4, 0.15, ['#3a5a7a', '#6a3a2a', '#3a5a3a'][i % 3]); } return true; },
    korobka: (x, y) => { if (!okP(x, y, 7, 4.5)) return false; rect(x, y, 7, 4.5, winter ? '#eef2f6' : '#7a8a6a'); c.strokeStyle = '#8a6a3a'; c.lineWidth = 0.45; c.strokeRect(x, y, 7, 4.5);
      rect(x + 0.2, y + 2.15, 0.6, 0.2, '#c8402f'); rect(x + 6.2, y + 2.15, 0.6, 0.2, '#c8402f'); markOcc(x, y, 7, 4.5); return true; },
    magazin: (x, y) => { if (!okP(x, y, 6.5, 3.6)) return false; box(x, y, 6.5, 3.6, 2.1, winter ? '#e0e5ea' : '#7a7a80'); rect(x + 0.5, y + 3.6 - 0.95, 5.5, 0.25, '#c8402f'); return true; },
    sad: (x, y) => { if (!okP(x, y, 6, 5)) return false; box(x, y, 3, 2.4, 1.6, '#c88a4a'); box(x + 3.4, y + 1, 2.6, 2.4, 1.6, '#c88a4a');
      rect(x, y + 3.6, 6, 1.4, winter ? '#e8ecf0' : '#8a7a4a'); rect(x + 0.6, y + 3.9, 0.8, 0.8, '#d8a441'); rect(x + 2.6, y + 3.9, 1.2, 0.5, '#3a8ac8'); return true; },
    kiosk: (x, y) => { if (!okP(x, y, 1.8, 1.4)) return false; box(x, y, 1.8, 1.4, 1, R() < 0.5 ? '#2e6a5a' : '#a84030'); return true; },
    dom: (x, y) => { if (!okP(x, y, 4.2, 4)) return false; box(x, y, 4.2, 4, 2.4 + R(), roofR()); return true; },
    sklad: (x, y) => { if (!okP(x, y, 6.5, 4)) return false; box(x, y, 6.5, 4, 2.6, winter ? '#d8dde2' : '#6a6a6e', { saw: R() < 0.5 }); return true; },
    saray: (x, y) => { if (!okP(x, y, 2.2, 1.8)) return false; box(x, y, 2.2, 1.8, 1, '#6a4a3a'); return true; },
    derevya: (x, y) => { let n = 0; for (let i = 0; i < 5; i++) { const tx = x + R() * 6, ty = y + R() * 6; if (landP(tx, ty) && freeA(tx - 0.8, ty - 0.8, 1.6, 1.6)) { tree(tx, ty, 0.8 + R() * 0.6); n++; } } return n > 0; },
  };
  const FILL_BY = { micro: ['garazhi', 'garazhi', 'korobka', 'magazin', 'sad', 'kiosk', 'derevya', 'dom'], center: ['dom', 'dom', 'magazin', 'kiosk', 'derevya', 'garazhi'],
    zavod: ['sklad', 'sklad', 'garazhi', 'saray', 'derevya'], chastny: ['saray', 'dom', 'derevya', 'saray'], sloboda: ['saray', 'dom', 'derevya'] };
  for (let pass = 0; pass < 3; pass++) for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) {
    const id = cellAt(gx, gy); if (!id || isWater(gx, gy)) continue;
    const list = FILL_BY[DTYPE[id] || 'micro'];
    for (let k = 0; k < 4; k++) { const f = list[Math.floor(R() * list.length)]; if (FILL[f](gx * U + R() * 4, gy * U + R() * 4)) break; }
  }
  for (let i = 0; i < 2600; i++) { const x = R() * OW, y = R() * OH; if (landP(x, y) && freeA(x - 0.7, y - 0.7, 1.4, 1.4)) tree(x, y, 0.6 + R() * 0.5); }   // остатки — деревья и кусты
  c.fillStyle = winter ? '#e8e4dc' : '#d8d0c0'; c.strokeStyle = '#e8e2d4'; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(KX, KY + 6); c.lineTo(KX + 14, KY); c.lineTo(KX + 26, KY + 4); c.lineTo(KX + 24, KY + 18); c.lineTo(KX + 4, KY + 20); c.closePath();
  c.fillStyle = winter ? '#dfe4e8' : '#5a6a48'; c.fill(); c.stroke();
  for (const [tx, ty] of [[KX, KY + 6], [KX + 14, KY], [KX + 26, KY + 4], [KX + 24, KY + 18], [KX + 4, KY + 20]]) box(tx - 1.2, ty - 1.2, 2.4, 2.4, 3, '#e8e2d4', { dome: '#2e6a4a' });
  box(KX + 8, KY + 7, 5, 6, 3, '#f0ece2', { dome: '#d8a441' });                // собор
  box(KX + 16, KY + 9, 2.4, 2.4, 9, '#c8402f');                                  // башня Сююмбике
  // ---------- 5. дома рисуем от дальних к ближним ----------
  boxes.sort((a, b) => (a.y + a.d) - (b.y + b.d)).forEach(drawBox);
  // лёгкая виньетка за городом — внешний мир темнее
  const url = cv.toDataURL('image/jpeg', 0.86);
  cv.width = cv.height = 1;                                                       // освободить память (iPhone)
  return (CITY_CACHE[key] = url);
}
function shade(hex, k) { return '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.substr(i, 2), 16) * k))).toString(16).padStart(2, '0')).join(''); }

// Названия улиц — видны при приближении
const STREETS = [
  { x: 6, y: 14, v: true, n: 'ул. Баумана' }, { x: 12, y: 28, v: true, n: 'ул. Декабристов' }, { x: 18, y: 35, v: false, n: 'ул. Гвардейская' },
  { x: 24, y: 42, v: true, n: 'ул. Хади Такташа' }, { x: 30, y: 49, v: false, n: 'ул. Павлюхина' }, { x: 12, y: 56, v: false, n: 'Оренбургский тракт' },
  { x: 24, y: 7, v: false, n: 'пр. Ибрагимова' }, { x: 30, y: 21, v: true, n: 'Сибирский тракт' }, { x: 18, y: 7, v: true, n: 'ул. Копылова' },
  { x: 6, y: 35, v: false, n: 'ул. Тукая' }, { x: 36, y: 28, v: false, n: 'ул. Николая Ершова' },
];
