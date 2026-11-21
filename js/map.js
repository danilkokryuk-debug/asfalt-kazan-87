// Стилизованная карта Казани: мелкая сетка, неровные границы районов, кварталы, улицы, вода, мосты, значки.
// shortcut: география условная (не по спутнику), уточнять центры районов при желании.
const W = 40, H = 60, CELL = 8;   // 320×480 в координатах SVG

// id, название района, группировка, центр (x,y в старых клетках 20×30), цвет, описание, значок
const DISTRICTS = [
  { id: 'socgorod', name: 'Соцгород',    gang: 'Соцгород',     x: 11, y: 2,  color: '#8a6438', desc: 'Авиастроительный. Заводские пацаны, держатся особняком.', icon: 'zavod' },
  { id: 'zhilka',   name: 'Жилка',       gang: 'Жилка',        x: 5,  y: 4,  color: '#7a3e3e', desc: 'Жилплощадка. Старые бараки, злые и многочисленные.' },
  { id: 'kinoplenka', name: 'Кинопленка', gang: 'Кинопленка',  x: 5,  y: 8,  color: '#3d607a', desc: 'Московский район, у фабрики кинопленки.', icon: 'zavod' },
  { id: 'savinovo', name: 'Савиново',    gang: 'Савиново',     x: 15, y: 7,  color: '#557a3d', desc: 'Новостройки за Казанкой. Молодая, дерзкая моталка.' },
  { id: 'center',   name: 'Центр',       gang: null,           x: 7,  y: 13, color: '#6a665c', desc: 'Кремль, Баумана, ДК, рынок. Ничья земля — здесь милиция.', icon: 'kreml' },
  { id: 'borisk',   name: 'Борисково',   gang: 'Борисково',    x: 17, y: 13, color: '#7a6630', desc: 'Окраина, частный сектор. Своих не сдают.' },
  { id: 'novotat',  name: 'Новотатарка', gang: 'Новотатарская', x: 3, y: 16, color: '#653f7a', desc: 'Старая слобода у Кабана. Здесь всё решают по-старому.', icon: 'mechet' },
  { id: 'tyap',     name: 'Теплоконтроль', gang: 'Тяп-Ляп',    x: 10, y: 16, color: '#9a3030', desc: 'Тяп-Ляп. Самая известная моталка города.', icon: 'zavod' },
  { id: 'universam', name: 'Универсам',  gang: 'Универсам',    x: 15, y: 18, color: '#2e5f96', desc: 'Дворы вокруг универсама. Дружные, своих не бросают.', icon: 'magazin' },
  { id: 'taktash',  name: 'Хади Такташ', gang: 'Хади Такташ',  x: 7,  y: 21, color: '#9a6230', desc: 'Улица Хади Такташа. Старые враги Тяп-Ляпа.' },
  { id: 'pavluha',  name: 'Павлюха',     gang: 'Павлюхина',    x: 11, y: 22, color: '#2e7a66', desc: 'Улица Павлюхина. Хитрые, держат рынок.', icon: 'rynok' },
  { id: 'perv',     name: 'Перваки',     gang: 'Перваки',      x: 16, y: 24, color: '#7a2e66', desc: 'Первые Горки. Спортсмены, качалки в каждом подвале.' },
  { id: 'gryaz',    name: 'Грязь',       gang: 'Грязь',        x: 4,  y: 25, color: '#5a5a30', desc: 'Низина у озера. Название говорит само за себя.' },
  { id: 'mirny',    name: 'Мирный',      gang: 'Мирный',       x: 11, y: 28, color: '#45457a', desc: 'Посёлок на юге. Далеко, но если придут — придут все.' },
];
const DIST = Object.fromEntries(DISTRICTS.map(d => [d.id, d]));

// детерминированный «шум» — чтобы карта была одинаковой каждый раз
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const kazankaY = gx => 21 + Math.sin(gx * 0.3) * 1.8;            // гх, гу — клетки 40×60
function isWater(gx, gy) {
  if (gx <= 3 + (gy > 36 ? 2 : 0) + (gy > 50 ? 2 : 0) + Math.round(Math.sin(gy * 0.4))) return true;   // Волга
  if (Math.abs(gy - kazankaY(gx)) < 1.4 && gx < 38) return true;                                        // Казанка
  if ((gx - 12) ** 2 / 4 + (gy - 37) ** 2 / 20 < 1) return true;                                         // озеро Кабан
  return false;
}
const BRIDGES = [11, 19, 28];   // столбцы мостов через Казанку
const isBridge = (gx, gy) => BRIDGES.includes(gx) && Math.abs(gy - kazankaY(gx)) < 1.6;

// Клетки → район: ближайший центр (с шумом для неровных границ) по ту же сторону Казанки
const CELLS = [];
for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) {
  if (isWater(gx, gy) && !isBridge(gx, gy)) { CELLS.push(null); continue; }
  const north = gy < kazankaY(gx);
  let best = null, bd = 1e9;
  for (const d of DISTRICTS) {
    if ((d.y < 11) !== north) continue;
    const dd = (d.x * 2 + 1 - gx) ** 2 + (d.y * 2 + 1 - gy) ** 2 + hash(gx, gy) * 9;
    if (dd < bd) { bd = dd; best = d.id; }
  }
  CELLS.push(best);
}
const cellAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? undefined : CELLS[y * W + x];

const NEIGHBORS = {};
DISTRICTS.forEach(d => NEIGHBORS[d.id] = new Set());
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const a = cellAt(x, y); if (!a) continue;
  for (const [dx, dy] of [[1, 0], [0, 1]]) { const b = cellAt(x + dx, y + dy); if (b && b !== a) { NEIGHBORS[a].add(b); NEIGHBORS[b].add(a); } }
}
[['kinoplenka', 'center'], ['savinovo', 'borisk'], ['zhilka', 'center']].forEach(([a, b]) => { NEIGHBORS[a].add(b); NEIGHBORS[b].add(a); });

// Центр района по клеткам (для подписи)
const CENTROID = {};
for (const d of DISTRICTS) {
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cellAt(x, y) === d.id) { sx += x; sy += y; n++; }
  CENTROID[d.id] = n ? [(sx / n + 0.5) * CELL, (sy / n + 0.5) * CELL] : [d.x * 16, d.y * 16];
}

// Пиксельные значки (5×5), рисуются поверх района
const ICONS = {
  kreml: ['..#..', '.###.', '#.#.#', '#####', '#####'],
  zavod: ['#...#', '#...#', '##.##', '#####', '#####'],
  rynok: ['#####', '#.#.#', '#####', '#...#', '#...#'],
  magazin: ['#####', '#...#', '#.#.#', '#...#', '#####'],
  mechet: ['..#..', '.###.', '.###.', '#####', '#.#.#'],
};

let mapView = { s: 1, x: 0, y: 0 }, PLACE_POS = {};
// Тайные места за городом (пасхалки): еле заметный огонёк, тап — сцена
const EGG_POS = { m_dacha: [150, -22], m_les: [352, 300], m_volga: [-14, 400], m_moskva: [-40, 236] };
const ns = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs) => { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const lighten = (hex, k) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.substr(i, 2), 16) * k))).toString(16).padStart(2, '0')).join('');

// control: {districtId: владелец}; home — твой район; sel — выбранный; at — где ты сейчас
// Внешний мир вокруг города (недоступен, но виден): Волга дальше, леса, поля, дачи, дороги на выезд
const MG = 6;   // ширина каймы в клетках
const ROADS = [   // [выход из клетки города, направление, подпись]
  { from: [33, 26], to: [W + MG, 22], label: '→ Оренбург' },
  { from: [22, 2], to: [24, -MG], label: '↑ Арск' },
  { from: [22, 57], to: [20, H + MG], label: '↓ Ульяновск' },
  { from: [8, 26], to: [-MG, 30], label: '← Москва' },
];
function drawOutskirts(svg) {
  const paths = {}, add = (c, x, y) => (paths[c] = paths[c] || []).push(`M${x * CELL} ${y * CELL}h${CELL}v${CELL}h${-CELL}z`);
  for (let gy = -MG; gy < H + MG; gy++) for (let gx = -MG; gx < W + MG; gx++) {
    if (gx >= 0 && gy >= 0 && gx < W && gy < H) continue;
    const h = hash(gx + 99, gy + 77);
    const volga = gx < 4 && gx >= -3 + Math.round(Math.sin(gy * 0.3)) && !(gy < 0 && gx < -1);
    if (volga) continue;                                                       // вода — фоновые волны
    const field = (gx > W + 1 || gy > H + 1) && hash(gx >> 2, gy >> 2) > 0.55;
    const dacha = gy < 0 && gx > 10 && gx < 30 && hash(gx >> 1, gy) > 0.7;
    if (dacha) { add('#4a4238', gx, gy); if (h > 0.5) add('#6a5a48', gx, gy); continue; }
    add(field ? (h > 0.5 ? '#4e5a3a' : '#556142') : (h > 0.3 ? '#22301f' : '#1a2618'), gx, gy);
    if (!field && h > 0.55) add('#2f4a2a', gx, gy);                         // крона
  }
  for (const c in paths) svg.appendChild(svgEl('path', { d: paths[c].join(''), fill: c, opacity: 0.95 }));
  drawRoadsOut(svg);
}
function drawRoadsOut(svg) {
  // дороги на выезд + подписи
  for (const r of ROADS) {
    const [x0, y0] = r.from, [x1, y1] = r.to;
    svg.appendChild(svgEl('path', { d: `M${(x0 + .5) * CELL} ${(y0 + .5) * CELL} L${(x1 + .5) * CELL} ${(y1 + .5) * CELL}`, stroke: '#3a3630', 'stroke-width': 5, fill: 'none' }));
    svg.appendChild(svgEl('path', { d: `M${(x0 + .5) * CELL} ${(y0 + .5) * CELL} L${(x1 + .5) * CELL} ${(y1 + .5) * CELL}`, stroke: '#c8c0a0', 'stroke-width': .8, 'stroke-dasharray': '4 4', fill: 'none' }));
    const lx = Math.max(-MG + 1, Math.min(W + MG - 9, x1)) * CELL, ly = Math.max(-MG + 2, Math.min(H + MG - 1, y1)) * CELL;
    const t = svgEl('text', { x: lx, y: ly, class: 'roadlabel' }); t.textContent = r.label; svg.appendChild(t);
  }
}

function drawMapSvg(svg, control, homeId, selectedId, onTap, atId, jobs) {
  if (typeof __TEST !== 'undefined') return;   // самопроверка: карта не нужна, а рисовать её тысячи раз долго
  svg.setAttribute('viewBox', `${-MG * CELL} ${-MG * CELL} ${(W + MG * 2) * CELL} ${(H + MG * 2) * CELL}`);
  svg.innerHTML = '';
  const defs = svgEl('defs', {});
  defs.innerHTML = `<pattern id="waves" width="12" height="6" patternUnits="userSpaceOnUse">
      <rect width="12" height="6" fill="#26394a"/><path d="M0 4 q3 -2 6 0 t6 0" stroke="#3a5670" fill="none" stroke-width="1"/></pattern>
    <filter id="glow"><feGaussianBlur stdDeviation="2.5"/></filter>
    <radialGradient id="fog" cx="50%" cy="50%" r="72%"><stop offset="62%" stop-color="#0c0e14" stop-opacity="0"/><stop offset="100%" stop-color="#0c0e14" stop-opacity=".85"/></radialGradient>`;
  svg.appendChild(defs);
  svg.appendChild(svgEl('rect', { x: -MG * CELL, y: -MG * CELL, width: (W + MG * 2) * CELL, height: (H + MG * 2) * CELL, fill: 'url(#waves)' }));
  // подробный город одной картинкой (citymap.js); без него — простая клеточная карта
  const city = typeof cityImage === 'function' && cityImage(typeof season === 'function' && season() === 'winter');
  if (city) { svg.appendChild(svgEl('image', { href: city, x: -MG * CELL, y: -MG * CELL, width: (W + MG * 2) * CELL, height: (H + MG * 2) * CELL, preserveAspectRatio: 'none' })); drawRoadsOut(svg); }
  else drawOutskirts(svg);

  // Суша: один path на цвет (быстро даже на телефоне)
  const paths = {};
  const add = (c, x, y, w = CELL, h = CELL) => { (paths[c] = paths[c] || []).push(`M${x} ${y}h${w}v${h}h${-w}z`); };
  for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) {
    const id = cellAt(gx, gy); if (!id) continue;
    const X = gx * CELL, Y = gy * CELL;
    if (city) { if (!isWater(gx, gy)) add(id === 'center' ? '#b8b0a0' : (DIST[control[id]] || DIST[id]).color, X, Y); continue; }   // цвет района — полупрозрачной заливкой
    if (isWater(gx, gy)) { add('#7a6a55', X, Y); add('#5a4a38', X, Y + 3, CELL, 2); continue; }   // мост
    const owner = DIST[control[id]] || DIST[id];
    const base = id === 'center' ? DIST.center.color : owner.color;
    const street = gx % 6 === 0 || gy % 7 === 0;
    const park = hash(gx * 3, gy * 7) > 0.93 && !street;
    add(street ? lighten(base, 0.62) : park ? '#3f5a34' : lighten(base, 0.86 + hash(gx, gy) * 0.18), X, Y);
    if (!street && !park) add(lighten(base, 1.25), X + 2, Y + 2, 4, 3);          // крыша дома
    if (park) add('#557a44', X + 2, Y + 2, 3, 3);
  }
  for (const c in paths) svg.appendChild(svgEl('path', { d: paths[c].join(''), fill: c, ...(city ? { 'fill-opacity': 0.2 } : {}) }));
  // названия улиц — проявляются при приближении
  if (city && typeof STREETS !== 'undefined') {
    const g = svgEl('g', { class: 'streets' });
    for (const s of STREETS) {
      const x = s.v ? s.x * CELL + 4 : s.x * CELL, y = s.v ? s.y * CELL : s.y * CELL + 4;
      const t = svgEl('text', { x, y, class: 'street', transform: s.v ? `rotate(90 ${x} ${y})` : '' }); t.textContent = s.n; g.appendChild(t);
    }
    svg.appendChild(g);
  }

  // Границы: толстые — между разными владельцами, тонкие — между районами одной моталки
  let thick = '', thin = '';
  const own = id => control[id] || id;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = cellAt(x, y); if (!a) continue;
    const r = cellAt(x + 1, y), b = cellAt(x, y + 1);
    if (r && r !== a) (own(r) !== own(a) ? (thick += `M${(x + 1) * CELL} ${y * CELL}v${CELL}`) : (thin += `M${(x + 1) * CELL} ${y * CELL}v${CELL}`));
    if (b && b !== a) (own(b) !== own(a) ? (thick += `M${x * CELL} ${(y + 1) * CELL}h${CELL}`) : (thin += `M${x * CELL} ${(y + 1) * CELL}h${CELL}`));
  }
  svg.appendChild(svgEl('path', { d: thin, stroke: 'rgba(0,0,0,.35)', 'stroke-width': 1, 'stroke-dasharray': '2 2', fill: 'none', 'vector-effect': 'non-scaling-stroke' }));
  svg.appendChild(svgEl('path', { d: thick, stroke: '#120e0b', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'square', 'vector-effect': 'non-scaling-stroke' }));

  // Подсветка выбранного района
  if (selectedId) {
    let sel = '';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cellAt(x, y) === selectedId) sel += `M${x * CELL} ${y * CELL}h${CELL}v${CELL}h${-CELL}z`;
    svg.appendChild(svgEl('path', { d: sel, fill: 'rgba(255,240,200,.18)', class: 'selpulse' }));
  }

  // Значки и подписи-плашки
  for (const d of DISTRICTS) {
    const [cx, cy] = CENTROID[d.id];
    if (d.icon && !city) {
      const g = svgEl('g', { transform: `translate(${cx - 7} ${cy - 22})`, opacity: 0.85 });
      ICONS[d.icon].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') g.appendChild(svgEl('rect', { x: i * 3, y: j * 3, width: 3, height: 3, fill: '#1a1612' })); }));
      svg.appendChild(g);
    }
    const owner = DIST[control[d.id]] || d;
    const txt = (d.id === homeId ? '★ ' : '') + d.name;
    const w = txt.length * 4.6 + 14;
    const g = svgEl('g', { class: 'chip' + (d.id === homeId ? ' home' : '') + (d.id === selectedId ? ' sel' : '') });
    g.appendChild(svgEl('rect', { x: cx - w / 2, y: cy - 6, width: w, height: 12, rx: 2, fill: 'rgba(18,14,11,.82)', stroke: d.id === selectedId ? '#f0e6c0' : 'none', 'stroke-width': 1 }));
    g.appendChild(svgEl('rect', { x: cx - w / 2 + 3, y: cy - 3, width: 6, height: 6, fill: d.id === 'center' ? '#bbb' : owner.color }));
    const t = svgEl('text', { x: cx - w / 2 + 12, y: cy + 0.5, class: 'label' + (d.id === homeId ? ' home' : '') });
    t.textContent = txt; g.appendChild(t);
    svg.appendChild(g);
  }

  // Ты здесь
  if (atId && CENTROID[atId]) {
    const [cx, cy] = CENTROID[atId];
    svg.appendChild(svgEl('circle', { cx, cy: cy + 13, r: 6, fill: '#f0c040', opacity: 0.5, class: 'youpulse' }));
    svg.appendChild(svgEl('circle', { cx, cy: cy + 13, r: 3, fill: '#f0c040', stroke: '#000', 'stroke-width': 1 }));
  }

  // Места (здания): цветной значок с пиксельной иконкой
  const OFF = [[-24, 12], [24, 12], [-24, -12], [24, -14], [0, 24], [0, -26], [-40, 0], [40, 0], [-14, 34]];
  const slot = {};
  PLACE_POS = {};
  for (const p of (typeof PLACES !== 'undefined' ? PLACES : [])) {
    if (!CENTROID[p.d]) continue;
    const k = slot[p.d] = (slot[p.d] || 0); slot[p.d]++;
    const [cx, cy] = CENTROID[p.d], x = cx + OFF[k % OFF.length][0], y = cy + OFF[k % OFF.length][1];
    PLACE_POS[p.id] = [x, y];
    const pg = svgEl('g', { class: 'ov' }); svg.appendChild(pg);
    pg.appendChild(svgEl('rect', { x: x - 6, y: y - 6, width: 12, height: 12, rx: 2, fill: '#120e0b', stroke: PLACE_COL[p.k], 'stroke-width': 1.2 }));
    PLACE_ICONS[p.k].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') pg.appendChild(svgEl('rect', { x: x - 4 + i * 1.6, y: y - 4 + j * 1.6, width: 1.6, height: 1.6, fill: PLACE_COL[p.k] })); }));
  }

  // Маячки заданий
  const seenD = {};
  for (const j of jobs || []) {
    if (!CENTROID[j.d]) continue;
    const k = seenD[j.d] = (seenD[j.d] || 0) + 1;
    const [cx, cy] = CENTROID[j.d], x = cx + 14 + (k - 1) * 9, y = cy - 16;
    const jg = svgEl('g', { class: 'ov' }); svg.appendChild(jg);
    const sp = j.special, col = sp ? '#b04cff' : '#f0c040';   // особое задание — фиолетовое, со звездой
    if (sp) jg.appendChild(svgEl('circle', { cx: x, cy: y, r: 11, fill: col, opacity: 0.35, class: 'youpulse' }));
    jg.appendChild(svgEl('circle', { cx: x, cy: y, r: 7, fill: col, opacity: 0.4, class: 'youpulse' }));
    jg.appendChild(svgEl('circle', { cx: x, cy: y, r: sp ? 5.5 : 4.5, fill: col, stroke: sp ? '#fff' : '#000', 'stroke-width': 1 }));
    const t = svgEl('text', { x: x - (sp ? 2.4 : 1.5), y: y + 0.5, class: 'jobmark' + (sp ? ' sp' : '') }); t.textContent = sp ? '★' : '!'; jg.appendChild(t);
  }

  for (const [, [x, y]] of Object.entries(EGG_POS)) svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 1.6, class: 'eggspot' }));
  // дымка по краям: мир дальше есть, но туда не попасть
  svg.appendChild(svgEl('rect', { x: -MG * CELL, y: -MG * CELL, width: (W + MG * 2) * CELL, height: (H + MG * 2) * CELL, fill: 'url(#fog)', 'pointer-events': 'none' }));
  // рамка старой карты, компас и картуш — у карты есть свои края
  const fx = -MG * CELL, fy = -MG * CELL, fw = (W + MG * 2) * CELL, fh = (H + MG * 2) * CELL;
  svg.appendChild(svgEl('rect', { x: fx + 2, y: fy + 2, width: fw - 4, height: fh - 4, fill: 'none', stroke: '#d8c49a', 'stroke-width': 1.4, opacity: 0.7, 'pointer-events': 'none' }));
  svg.appendChild(svgEl('rect', { x: fx + 4.5, y: fy + 4.5, width: fw - 9, height: fh - 9, fill: 'none', stroke: '#d8c49a', 'stroke-width': 0.5, 'stroke-dasharray': '6 2', opacity: 0.55, 'pointer-events': 'none' }));
  const cmp = svgEl('g', { transform: `translate(${fx + fw - 22} ${fy + 22})`, class: 'compass', 'pointer-events': 'none' });
  cmp.innerHTML = '<circle r="11" fill="rgba(18,14,11,.7)" stroke="#d8c49a" stroke-width=".8"/><path d="M0 -9 L2.6 0 L0 9 L-2.6 0Z" fill="#d8c49a"/><path d="M0 -9 L2.6 0 L-2.6 0Z" fill="#c8402f"/><text y="-12.5" class="cmpN">С</text>';
  svg.appendChild(cmp);
  const cart = svgEl('g', { transform: `translate(${fx + 10} ${fy + fh - 24})`, 'pointer-events': 'none' });
  cart.innerHTML = '<rect width="78" height="16" rx="2" fill="rgba(18,14,11,.78)" stroke="#d8c49a" stroke-width=".7"/><text x="6" y="7" class="cartT">КАЗАНЬ · 1987</text><text x="6" y="12.5" class="cartS">план города · масштаб условный</text>';
  svg.appendChild(cart);

  if (city) mapTraffic(svg);
  // Тап по карте → район (координаты с учётом масштаба)
  svg.onclick = e => {
    if (svg._dragged) return;
    const r = svg.getBoundingClientRect();
    // координаты с учётом каймы внешнего мира вокруг города
    const vb = svg.viewBox.baseVal, sx = vb.x + (e.clientX - r.left) / r.width * vb.width, sy = vb.y + (e.clientY - r.top) / r.height * vb.height;
    for (const [eid, [x, y]] of Object.entries(EGG_POS)) if (Math.hypot(sx - x, sy - y) < 7 && typeof playEgg === 'function') return playEgg(eid);
    for (const [pid, [x, y]] of Object.entries(PLACE_POS)) if (Math.hypot(sx - x, sy - y) < 9) return openPlace(pid);   // тап по зданию
    const gx = Math.floor(sx / CELL), gy = Math.floor(sy / CELL);
    const id = cellAt(gx, gy); if (id) onTap(id);
  };
  enableZoom(svg);
}

// Масштаб двумя пальцами, перетаскивание одним, колёсико на компьютере
function enableZoom(svg) {
  const wrap = svg.parentElement; if (!wrap || !wrap.addEventListener || wrap._zoom) return applyView(svg);
  wrap._zoom = true;
  const pts = new Map(); let start = null;
  const clampV = () => { mapView.s = Math.max(1, Math.min(6, mapView.s)); const m = (mapView.s - 1) * 160; mapView.x = Math.max(-m, Math.min(m, mapView.x)); mapView.y = Math.max(-m * 1.5, Math.min(m * 1.5, mapView.y)); };
  wrap.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); start = { ...mapView, pts: new Map(pts) }; svg._dragged = false; });
  wrap.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    const cur = [...pts.values()], st = [...start.pts.values()];
    if (cur.length === 1 && st.length === 1) {
      const dx = cur[0][0] - st[0][0], dy = cur[0][1] - st[0][1];
      if (Math.abs(dx) + Math.abs(dy) > 6) svg._dragged = true;
      if (mapView.s > 1) { mapView.x = start.x + dx; mapView.y = start.y + dy; }
    } else if (cur.length >= 2 && st.length >= 2) {
      const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
      mapView.s = start.s * d(cur[0], cur[1]) / d(st[0], st[1]); svg._dragged = true;
    }
    clampV(); applyView(svg);
  });
  const up = e => { pts.delete(e.pointerId); start = { ...mapView, pts: new Map(pts) }; setTimeout(() => svg._dragged = false, 50); };
  wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
  wrap.addEventListener('wheel', e => { e.preventDefault(); mapView.s *= e.deltaY < 0 ? 1.15 : 0.87; clampV(); applyView(svg); }, { passive: false });
  applyView(svg);
}
// Герой идёт по карте от района к району (~0.8 с), потом действие
function walkTo(from, to, done) {
  const svg = document.getElementById('map');
  if (typeof __TEST !== 'undefined' || !svg || !svg.appendChild || from === to || !CENTROID[from] || !CENTROID[to]) return done();
  const c = document.createElement('canvas'); drawHero(c, S.app, S.wear);
  const img = svgEl('image', { href: c.toDataURL(), width: 12, height: 24, class: 'walker' });
  svg.appendChild(img);
  const [x0, y0] = CENTROID[from], [x1, y1] = CENTROID[to];
  const t0 = performance.now(), dur = 800;
  (function step(t) {
    const k = Math.min(1, (t - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    const bob = Math.abs(Math.sin(k * Math.PI * 6)) * 2;
    img.setAttribute('x', x0 + (x1 - x0) * e - 6); img.setAttribute('y', y0 + (y1 - y0) * e - 12 - bob);
    if (k < 1) requestAnimationFrame(step); else setTimeout(done, 120);
  })(t0);
  AUDIO.sfx && AUDIO.sfx('swish');
}

function applyView(svg) {
  if (!svg.setAttribute || !svg.clientWidth) return;
  const X0 = -MG * CELL, Y0 = -MG * CELL, WU = (W + MG * 2) * CELL, HU = (H + MG * 2) * CELL, s = mapView.s;
  const vw = WU / s, vh = HU / s;
  let cx = X0 + WU / 2 - mapView.x / (svg.clientWidth * s) * WU, cy = Y0 + HU / 2 - mapView.y / (svg.clientHeight * s) * HU;
  cx = Math.max(X0 + vw / 2, Math.min(X0 + WU - vw / 2, cx)); cy = Math.max(Y0 + vh / 2, Math.min(Y0 + HU - vh / 2, cy));
  mapView.x = (X0 + WU / 2 - cx) * svg.clientWidth * s / WU; mapView.y = (Y0 + HU / 2 - cy) * svg.clientHeight * s / HU;   // упёрлись в край карты
  svg.setAttribute('viewBox', `${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`);
  svg.style.setProperty('--inv', Math.max(0.45, 1 / Math.pow(s, 0.62)).toFixed(3));
  svg.classList && svg.classList.toggle('z2', mapView.s >= 2.2); }   // ближе — видны названия улиц
function zoomBy(k) { mapView.s *= k; if (k === 0) mapView = { s: 1, x: 0, y: 0 }; mapView.s = Math.max(1, Math.min(6, mapView.s || 1)); const svg = document.getElementById('map'); if (svg) applyView(svg); }

// Живой город: машины ездят по улицам, по Волге идут теплоходы. Ночью у машин горят фары.
function mapTraffic(svg) {
  if (typeof __TEST !== 'undefined' || !svg.appendChild) return;
  const g = svgEl('g', { class: 'traffic', 'pointer-events': 'none' }); svg.appendChild(g);
  const night = S && (S.min >= 20 * 60 || S.min < 7 * 60);
  const COLS = ['#e8e4d8', '#c8402f', '#2e5f96', '#d8a441', '#3a6a3a', '#202020', '#9aa4ae', '#f07a30'];
  const land = (x, y) => { const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL); return cellAt(gx, gy) && !isWater(gx, gy) || isBridge(gx, gy); };
  const spawn = c => {
    for (let k = 0; k < 30; k++) {
      c.v = Math.random() < 0.5; c.dir = Math.random() < 0.5 ? 1 : -1;
      const line = c.v ? 6 * (1 + Math.floor(Math.random() * 6)) : 7 * (1 + Math.floor(Math.random() * 8));
      const lane = c.dir > 0 ? 4.6 : 2.6;
      c.x = c.v ? line * CELL + lane : Math.random() * W * CELL; c.y = c.v ? Math.random() * H * CELL : line * CELL + lane;
      if (land(c.x, c.y)) return;
    }
  };
  const cars = Array.from({ length: 34 }, () => {
    const c = { sp: 0.06 + Math.random() * 0.08 }; spawn(c);
    c.el = svgEl('g', {}); const col = COLS[Math.floor(Math.random() * COLS.length)];
    c.el.innerHTML = (night ? `<path d="M-0.6 -1.4 L-1.6 -5 L1.6 -5 L0.6 -1.4Z" fill="rgba(255,230,150,.28)"/>` : '') +
      `<rect x="-0.85" y="-1.5" width="1.7" height="3" rx=".45" fill="${col}" stroke="rgba(0,0,0,.6)" stroke-width=".25"/><rect x="-0.6" y="-0.75" width="1.2" height=".8" fill="rgba(20,30,40,.85)"/>` +
      (night ? `<rect x="-0.7" y="1.25" width="1.4" height=".25" fill="#ff4030"/>` : '');
    g.appendChild(c.el); return c;
  });
  // теплоходы на Волге
  const boats = Array.from({ length: 3 }, (_, i) => { const b = { y: 40 + i * 150, x: -22 + i * 6, sp: 0.03 + i * 0.01 };
    b.el = svgEl('g', {}); b.el.innerHTML = '<rect x="-1.3" y="-3.5" width="2.6" height="7" rx="1.2" fill="#e8e4dc"/><rect x="-0.8" y="-1.5" width="1.6" height="2.5" fill="#c8402f"/><path d="M0 3.5 L-1.6 8 M0 3.5 L1.6 8" stroke="rgba(200,220,235,.35)" stroke-width=".4"/>';
    g.appendChild(b.el); return b; });
  let last = performance.now();
  const step = t => {
    if (!document.body.contains(svg)) return;
    const dt = Math.min(50, t - last) / 16.7; last = t;
    if (!document.hidden) {
      for (const c of cars) {
        if (c.v) c.y += c.dir * c.sp * dt * 3; else c.x += c.dir * c.sp * dt * 3;
        if (!land(c.x, c.y) || c.x < 0 || c.y < 0 || c.x > W * CELL || c.y > H * CELL) spawn(c);
        c.el.setAttribute('transform', `translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) rotate(${c.v ? (c.dir > 0 ? 180 : 0) : (c.dir > 0 ? 90 : -90)})`);
      }
      for (const b of boats) { b.y -= b.sp * dt * 3; if (b.y < -40) b.y = H * CELL + 30; b.el.setAttribute('transform', `translate(${b.x} ${b.y.toFixed(2)})`); }
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
