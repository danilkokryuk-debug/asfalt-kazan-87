// Пиксельные иллюстрации 160×100, рисуются кодом и анимируются (окна мерцают, снег идёт, прожектор ходит).
// Используются на главном экране, во вступлении и на карточках глав.
const SC_W = 160, SC_H = 100;

function sceneRng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function drawScene(cv, name, t = 0) {
  cv.width = SC_W; cv.height = SC_H;
  const g = cv.getContext('2d'); if (!g || !g.fillRect) return;
  const R = sceneRng(name.length * 977 + 13);
  const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  const sky = (a, b, h = SC_H) => { for (let y = 0; y < h; y += 2) { const k = y / h; r(0, y, SC_W, 2, mix(a, b, k)); } };
  const stars = n => { for (let i = 0; i < n; i++) { const x = R() * SC_W, y = R() * 45; if ((t / 20 + i) % 7 > 0.6) r(x, y, 1, 1, i % 5 ? '#c8c8e0' : '#fff'); } };
  const snow = (n, c = '#fff') => { for (let i = 0; i < n; i++) { const x = (R() * SC_W + t * 0.3 * (0.5 + i % 3 * 0.3) + Math.sin(t / 30 + i) * 3) % SC_W, y = (R() * SC_H + t * (0.4 + i % 4 * 0.15)) % SC_H; r(x, y, 1, 1, c); } };
  const block = (x, y, w, h, c, win = '#e8c050', lit = 0.35) => {     // панельный дом с окнами
    r(x, y, w, h, c); r(x, y, w, 1, mix(c, '#000', 0.4));
    for (let wy = y + 3; wy < y + h - 3; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 4) {
      const on = R() < lit, fl = on && R() < 0.08 && Math.sin(t / 7 + wx * wy) > 0.6;
      r(wx, wy, 2, 2, on && !fl ? win : mix(c, '#000', 0.35));
    }
  };
  const man = (x, y, c = '#0a0806', h = 9) => { r(x + 1, y, 2, 2, c); r(x, y + 2, 4, h - 6, c); r(x, y + h - 4, 1, 4, c); r(x + 3, y + h - 4, 1, 4, c); };
  const lamp = (x, y, h) => {
    r(x, y, 1, h, '#2a2a30'); r(x - 2, y, 5, 2, '#3a3a40'); r(x - 1, y + 2, 3, 1, '#ffe8a0');
    g.fillStyle = 'rgba(255,220,140,0.13)'; g.beginPath && (g.beginPath(), g.moveTo(x - 1, y + 3), g.lineTo(x - 14, y + h), g.lineTo(x + 15, y + h), g.lineTo(x + 2, y + 3), g.fill());
  };

  switch (name) {
    case 'kazan': {
      sky('#0a0c24', '#3a2850', 70); stars(40);
      r(128, 12, 10, 10, '#f0e6c0'); r(130, 12, 8, 2, '#fffbe8'); r(126, 14, 2, 6, '#0a0c24');            // луна
      for (let i = 0; i < 9; i++) block(i * 18 - 4, 44 + (i * 37) % 12, 16, 40, i % 2 ? '#1c1e2c' : '#22243a', '#e8c050', 0.3);
      // Кремль: стена, Спасская башня со звездой, башня Сююмбике
      r(40, 56, 80, 14, '#d8d2c0'); for (let x = 40; x < 120; x += 4) r(x, 54, 2, 2, '#d8d2c0');
      r(70, 38, 10, 18, '#e8e2d0'); r(72, 32, 6, 6, '#e8e2d0'); r(74, 26, 2, 6, '#3a6a4a'); r(74, 24, 2, 2, (t / 15 | 0) % 2 ? '#ff3030' : '#c02020');
      r(98, 30, 8, 26, '#c84a3a'); r(99, 24, 6, 6, '#c84a3a'); r(100, 18, 4, 6, '#c84a3a'); r(101, 12, 2, 6, '#3a7a5a'); r(101, 10, 2, 2, '#e8c050');
      r(52, 46, 12, 10, '#e8e2d0'); r(55, 40, 6, 6, '#3a6a4a');
      // Казанка с отражениями
      r(0, 70, SC_W, 30, '#0c1424');
      for (let i = 0; i < 40; i++) { const x = R() * SC_W, y = 72 + R() * 26; r(x + Math.sin(t / 10 + i) * 2, y, 3 + R() * 4, 1, R() < 0.5 ? '#2a3a5a' : '#e8c05044'); }
      snow(30);
      break;
    }
    case 'dvor': {
      sky('#0c1020', '#28304a', 60); stars(20);
      block(0, 18, 60, 60, '#252838'); block(100, 22, 60, 56, '#20232f');
      r(0, 78, SC_W, 22, '#2a2622'); r(0, 78, SC_W, 2, '#3a342c');
      lamp(80, 40, 40);
      r(60, 86, 18, 2, '#5a4a3a'); r(61, 88, 1, 4, '#3a2a1a'); r(76, 88, 1, 4, '#3a2a1a');                      // лавка
      r(120, 70, 1, 16, '#4a4a50'); r(132, 70, 1, 16, '#4a4a50'); r(120, 70, 13, 1, '#4a4a50');                  // качели
      const sw = Math.sin(t / 15) * 3; r(124 + sw, 80, 6, 1, '#7a5a3a');
      man(64, 76); man(70, 77, '#120e0b', 8); man(88, 77);
      if (season && season() === 'winter') snow(60); else snow(12, '#c86a2a');
      break;
    }
    case 'korobka': {
      sky('#0a0c18', '#202838', 50); stars(15);
      block(110, 10, 50, 50, '#1e2130');
      r(10, 60, 140, 30, '#c8ccd4'); r(10, 58, 140, 4, '#4a6a9a'); r(10, 58, 2, 32, '#4a6a9a'); r(148, 58, 2, 32, '#4a6a9a');
      lamp(20, 20, 40); lamp(140, 20, 40);
      for (let i = 0; i < 14; i++) man(30 + i * 7 + (i % 3), 62 + (i % 2) * 2, i === 6 ? '#3a1010' : '#0a0806', 10);
      snow(25);
      break;
    }
    case 'pustyr': {
      sky('#6a7488', '#c8ccd8', 60);
      r(0, 60, SC_W, 40, '#e4e8ee'); for (let i = 0; i < 30; i++) r(R() * SC_W, 62 + R() * 36, 4, 1, '#c8ced8');
      block(0, 30, 30, 30, '#4a4e5a', '#a89060', 0.15); block(130, 26, 30, 34, '#4a4e5a', '#a89060', 0.15);
      for (let i = 0; i < 9; i++) man(18 + i * 5 + (i % 2), 64 + (i % 3), '#1a1010', 11);
      for (let i = 0; i < 9; i++) man(96 + i * 5 + (i % 2), 64 + (i % 3), '#10101a', 11);
      const sway = Math.sin(t / 8); r(66 + sway, 66, 4, 1, '#3a2a2a'); r(88 - sway, 66, 4, 1, '#2a2a3a');      // арматура
      snow(90, '#f8f8ff');
      break;
    }
    case 'dk': {
      sky('#120820', '#2a1438', 60); stars(15);
      r(30, 30, 100, 50, '#c8b89a'); r(26, 28, 108, 4, '#e0d4bc');
      for (let x = 38; x < 126; x += 14) r(x, 34, 4, 46, '#e8dcc4');
      const neon = (t / 10 | 0) % 3; ['#ff3c8e', '#3cf0ff', '#f0e040'].forEach((c, i) => { if (i === neon || i === (neon + 1) % 3) r(46 + i * 24, 20, 20, 5, c); });
      g.fillStyle = 'rgba(255,60,142,0.15)'; g.fillRect(30, 14, 100, 16);
      r(72, 60, 16, 20, '#2a1a10'); r(74, 62, 12, 18, (t / 6 | 0) % 2 ? '#ff3c8e' : '#3c8eff');
      r(0, 80, SC_W, 20, '#2a2228');
      for (let i = 0; i < 8; i++) man(10 + i * 18 + Math.sin(t / 5 + i) * 2, 72, '#0a0608', 9);
      break;
    }
    case 'vokzal': {
      sky('#1a1c28', '#4a4e60', 50);
      r(0, 50, SC_W, 4, '#6a6a70'); for (let x = 0; x < SC_W; x += 12) r(x, 40, 2, 10, '#4a4a52');
      const off = -((t * 0.6) % 220) + 160;
      for (let c = 0; c < 5; c++) { const x = off + c * 44; r(x, 56, 40, 18, '#3a5a3a'); r(x + 2, 58, 36, 6, '#2a3a2a'); for (let w = 4; w < 38; w += 8) r(x + w, 59, 5, 4, '#e8c050'); r(x + 6, 74, 6, 4, '#111'); r(x + 28, 74, 6, 4, '#111'); }
      r(0, 78, SC_W, 22, '#5a5a60'); r(0, 78, SC_W, 2, '#8a8a90');
      for (let i = 0; i < 10; i++) man(8 + i * 15, 70, i === 4 ? '#3a2a4a' : '#141418', 9);
      snow(20);
      break;
    }
    case 'kuhnya': {
      r(0, 0, SC_W, 100, '#4a3424'); r(0, 70, SC_W, 30, '#6a4a30');
      for (let x = 0; x < SC_W; x += 8) r(x, 0, 1, 70, '#55402e');
      r(100, 14, 40, 30, '#e8dcc0'); r(104, 18, 32, 22, '#1a2a44'); stars && r(110 + Math.sin(t / 20) * 4, 24, 1, 1, '#fff');
      r(20, 40, 36, 28, '#2a2a2a'); r(24, 44, 28, 20, mix('#8ab0d0', '#d0e0f0', (Math.sin(t / 3) + 1) / 2));   // телевизор
      g.fillStyle = 'rgba(160,200,255,0.12)'; g.fillRect(10, 30, 60, 50);
      r(60, 64, 60, 4, '#8a6a4a'); r(64, 68, 4, 20, '#6a4a30'); r(112, 68, 4, 20, '#6a4a30');
      r(80, 58, 10, 6, '#e8e8e8'); r(82, 54, 1, 3 + Math.sin(t / 6) * 1, '#ffffff66');                         // чайник и пар
      break;
    }
    case 'chase': {   // погоня для вступления: пацан убегает от «лунохода»
      sky('#05060e', '#141a30', 60); stars(25);
      const sc = t * 1.6;
      for (let i = 0; i < 12; i++) { const x = ((i * 26 - sc * 0.35) % 312 + 312) % 312 - 30; block(x, 22 + (i * 13) % 14, 24, 56, i % 2 ? '#141622' : '#181a28', '#d8b048', 0.25); }
      r(0, 78, SC_W, 22, '#1a1816');
      for (let i = 0; i < 8; i++) { const x = ((i * 40 - sc) % 320 + 320) % 320 - 20; r(x, 88, 18, 2, '#c8c0a0'); }   // разметка
      for (let i = 0; i < 4; i++) { const x = ((i * 90 - sc * 0.8) % 360 + 360) % 360 - 30; lamp(x, 34, 44); }
      // бегущий пацан
      const px = 100 + Math.sin(t / 40) * 4, leg = (t / 3 | 0) % 2;
      r(px + 1, 66, 3, 3, '#0a0806'); r(px, 69, 5, 6, '#2c55b8'); r(px - 1 + leg, 75, 2, 5, '#0a0806'); r(px + 3 - leg, 75, 2, 5, '#0a0806');
      r(px - 2, 70 + leg, 2, 3, '#2c55b8'); r(px + 5, 71 - leg, 2, 3, '#2c55b8');
      // «луноход» с мигалкой
      const cx = 18 + Math.min(30, t * 0.12) + Math.sin(t / 12) * 2;
      r(cx, 68, 34, 12, '#d8d4c8'); r(cx + 4, 62, 22, 7, '#d8d4c8'); r(cx + 7, 63, 7, 5, '#2a3a50'); r(cx + 16, 63, 7, 5, '#2a3a50');
      r(cx, 73, 34, 2, '#2a4a8a'); r(cx + 4, 80, 6, 4, '#111'); r(cx + 24, 80, 6, 4, '#111');
      const blink = (t / 6 | 0) % 2;
      r(cx + 10, 59, 4, 3, blink ? '#3c6cff' : '#1a2a5a'); r(cx + 16, 59, 4, 3, blink ? '#3a1010' : '#ff3030');
      g.fillStyle = 'rgba(255,240,180,0.18)'; g.beginPath && (g.beginPath(), g.moveTo(cx + 34, 71), g.lineTo(cx + 110, 60), g.lineTo(cx + 110, 92), g.fill());
      g.fillStyle = blink ? 'rgba(60,100,255,0.16)' : 'rgba(255,40,40,0.14)'; g.fillRect(0, 0, SC_W, SC_H);
      snow(30, '#9aa');
      break;
    }
    case 'zona': {
      sky('#0a0a10', '#1a1a24', 70); stars(12);
      r(0, 60, SC_W, 40, '#2a2a2a');
      for (let x = 0; x < SC_W; x += 10) r(x, 44, 1, 20, '#5a5a5a');
      for (let y = 46; y < 62; y += 4) for (let x = 0; x < SC_W; x += 3) r(x, y + (x % 2), 1, 1, '#7a7a7a');
      r(120, 20, 4, 44, '#3a3a3a'); r(114, 16, 16, 8, '#4a4a4a');
      const a = Math.sin(t / 25) * 0.9;
      g.fillStyle = 'rgba(255,255,220,0.16)'; g.beginPath && (g.beginPath(), g.moveTo(122, 20), g.lineTo(122 + Math.sin(a) * 140 - 20, 100), g.lineTo(122 + Math.sin(a) * 140 + 20, 100), g.fill());
      r(10, 66, 60, 24, '#3a3a34'); for (let x = 14; x < 66; x += 8) r(x, 72, 4, 4, '#c8b060');
      snow(30, '#aaa');
      break;
    }
  }
  // виньетка
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, SC_W, 3); g.fillRect(0, SC_H - 3, SC_W, 3);
}

function mix(a, b, k) {
  const p = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
}

// Анимировать сцену на холсте, пока он в документе
function animScene(cv, name) {
  if (typeof __TEST !== 'undefined' || !cv) return;
  let t = 0;
  const loop = () => { if (!document.body.contains(cv)) return; drawScene(cv, name, t++); requestAnimationFrame(loop); };
  loop();
}

// Какая иллюстрация к какой карточке
function sceneFor(title) {
  const s = String(title || '');
  if (/Пролог|Кухня|Новости/.test(s)) return 'kuhnya';
  if (/Глава 1|Глава 2|Скорлупа|31 декабря/.test(s)) return 'korobka';
  if (/Глава 3|Супер|Казань/.test(s)) return 'dvor';
  if (/Глава 4|Молодой|Дембель|Май 1991/.test(s)) return 'vokzal';
  if (/Глава 5|Старший|Москва/.test(s)) return 'dk';
  if (/Глава 6|Автор|26 декабря|Конец/.test(s)) return 'kazan';
  if (/Колония|Освобождение|Через год/.test(s)) return 'zona';
  if (/стрелка|Стрелка/.test(s)) return 'pustyr';
  return null;
}
