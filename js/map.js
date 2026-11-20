// Стилизованная карта Казани: сетка клеток, каждая клетка суши принадлежит ближайшему району.
// shortcut: география условная (не по спутнику), уточнять центры районов при желании.
const W = 20, H = 30, CELL = 16;

// id, название района, группировка, центр (x,y в клетках), цвет, описание
const DISTRICTS = [
  { id: 'socgorod', name: 'Соцгород',    gang: 'Соцгород',     x: 11, y: 2,  color: '#7a5c3a', desc: 'Авиастроительный. Заводские пацаны, держатся особняком.' },
  { id: 'zhilka',   name: 'Жилка',       gang: 'Жилка',        x: 5,  y: 4,  color: '#6b3d3d', desc: 'Жилплощадка. Старые бараки, злые и многочисленные.' },
  { id: 'kinoplenka', name: 'Кинопленка', gang: 'Кинопленка',  x: 5,  y: 8,  color: '#3d5a6b', desc: 'Московский район, у фабрики кинопленки.' },
  { id: 'savinovo', name: 'Савиново',    gang: 'Савиново',     x: 15, y: 7,  color: '#4f6b3d', desc: 'Новостройки за Казанкой. Молодая, дерзкая моталка.' },
  { id: 'center',   name: 'Центр',       gang: null,           x: 7,  y: 13, color: '#55524a', desc: 'Кремль, Баумана, ДК. Ничья земля — здесь милиция.' },
  { id: 'borisk',   name: 'Борисково',   gang: 'Борисково',    x: 17, y: 13, color: '#6b5a2e', desc: 'Окраина, частный сектор. Своих не сдают.' },
  { id: 'novotat',  name: 'Новотатарка', gang: 'Новотатарская', x: 3, y: 16, color: '#5a3d6b', desc: 'Старая слобода у Кабана. Здесь всё решают по-старому.' },
  { id: 'tyap',     name: 'Теплоконтроль', gang: 'Тяп-Ляп',    x: 10, y: 16, color: '#8a2e2e', desc: 'Тяп-Ляп. Самая известная моталка города.' },
  { id: 'universam', name: 'Универсам',  gang: 'Универсам',    x: 15, y: 18, color: '#2e5a8a', desc: 'Дворы вокруг универсама. Дружные, своих не бросают.' },
  { id: 'taktash',  name: 'Хади Такташ', gang: 'Хади Такташ',  x: 7,  y: 21, color: '#8a5a2e', desc: 'Улица Хади Такташа. Старые враги Тяп-Ляпа.' },
  { id: 'pavluha',  name: 'Павлюха',     gang: 'Павлюхина',    x: 11, y: 22, color: '#2e6b5a', desc: 'Улица Павлюхина. Хитрые, держат рынок.' },
  { id: 'perv',     name: 'Перваки',     gang: 'Перваки',      x: 16, y: 24, color: '#6b2e5a', desc: 'Первые Горки. Спортсмены, качалки в каждом подвале.' },
  { id: 'gryaz',    name: 'Грязь',       gang: 'Грязь',        x: 4,  y: 25, color: '#4a4a2e', desc: 'Низина у озера. Название говорит само за себя.' },
  { id: 'mirny',    name: 'Мирный',      gang: 'Мирный',       x: 11, y: 28, color: '#3d3d6b', desc: 'Посёлок на юге. Далеко, но если придут — придут все.' },
];
const DIST = Object.fromEntries(DISTRICTS.map(d => [d.id, d]));

function isWater(x, y) {
  if (x <= 1 + (y > 18 ? 1 : 0) + (y > 25 ? 1 : 0)) return true;           // Волга
  const ky = 10.5 + Math.sin(x * 0.6) * 0.9;                                  // Казанка
  if (Math.abs(y - ky) < 0.9 && x < 19) return true;
  if ((x - 6) ** 2 / 2 + (y - 18.5) ** 2 / 5 < 1) return true;               // озеро Кабан
  return false;
}

// Клетки: owner района (ближайший центр по ту же сторону Казанки)
const CELLS = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (isWater(x, y)) { CELLS.push(null); continue; }
  const north = y < 10.5 + Math.sin(x * 0.6) * 0.9;
  let best = null, bd = 1e9;
  for (const d of DISTRICTS) {
    if ((d.y < 11) !== north) continue;
    const dd = (d.x - x) ** 2 + (d.y - y) ** 2;
    if (dd < bd) { bd = dd; best = d.id; }
  }
  CELLS.push(best);
}
const cellAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? undefined : CELLS[y * W + x];

// Соседи районов (по общей границе клеток или через мост через Казанку)
const NEIGHBORS = {};
DISTRICTS.forEach(d => NEIGHBORS[d.id] = new Set());
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const a = cellAt(x, y); if (!a) continue;
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const b = cellAt(x + dx, y + dy);
    if (b && b !== a) { NEIGHBORS[a].add(b); NEIGHBORS[b].add(a); }
  }
}
[['kinoplenka', 'center'], ['savinovo', 'borisk'], ['zhilka', 'center']].forEach(([a, b]) => { NEIGHBORS[a].add(b); NEIGHBORS[b].add(a); });

// Отрисовка SVG. control: {districtId: gangOwnerDistrictId}
function drawMapSvg(svg, control, homeId, selectedId, onTap) {
  const ns = 'http://www.w3.org/2000/svg';
  svg.setAttribute('viewBox', `0 0 ${W * CELL} ${H * CELL}`);
  svg.innerHTML = '';
  const g = document.createElementNS(ns, 'g');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const id = cellAt(x, y);
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', x * CELL); r.setAttribute('y', y * CELL);
    r.setAttribute('width', CELL); r.setAttribute('height', CELL);
    if (!id) { r.setAttribute('class', 'water'); g.appendChild(r); continue; }
    const owner = DIST[control[id]] || DIST[id];
    r.setAttribute('fill', id === 'center' ? DIST.center.color : owner.color);
    r.setAttribute('class', 'land' + (id === selectedId ? ' sel' : ''));
    r.dataset.id = id;
    g.appendChild(r);
  }
  // Границы районов
  let path = '';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = cellAt(x, y); if (!a) continue;
    if (cellAt(x + 1, y) !== a) path += `M${(x + 1) * CELL} ${y * CELL}v${CELL}`;
    if (cellAt(x, y + 1) !== a) path += `M${x * CELL} ${(y + 1) * CELL}h${CELL}`;
  }
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', path); p.setAttribute('class', 'border');
  g.appendChild(p);
  for (const d of DISTRICTS) {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', d.x * CELL + CELL / 2); t.setAttribute('y', d.y * CELL + CELL / 2);
    t.setAttribute('class', 'label' + (d.id === homeId ? ' home' : ''));
    t.textContent = (d.id === homeId ? '★ ' : '') + d.name;
    g.appendChild(t);
  }
  svg.appendChild(g);
  svg.onclick = e => { const id = e.target.dataset && e.target.dataset.id; if (id) onTap(id); };
}
