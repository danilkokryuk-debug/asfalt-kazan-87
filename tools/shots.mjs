// Скриншоты для Play Маркета: Edge без окна, пустой профиль, телефон 1080×1920.
// node tools/shots.mjs  (нужен локальный сервер игры на :8787). Картинки — в store/shots/.
// Запросы к серверу игроков (script.google.com) блокируются — тестовые ники в таблицу не попадают.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'http://localhost:8787/';
const OUT = 'store/shots'; mkdirSync(OUT, { recursive: true });
const prof = mkdtempSync(join(tmpdir(), 'asf-shots-'));
const ed = spawn(EDGE, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${prof}`, '--autoplay-policy=no-user-gesture-required', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 40 && !ws; i++) { await sleep(250); try { const t = await (await fetch('http://127.0.0.1:9333/json')).json(); const p = t.find(x => x.type === 'page'); if (p) ws = p.webSocketDebuggerUrl; } catch (e) {} }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const wait = {};
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; } };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; wait[i] = r; sock.send(JSON.stringify({ id: i, method, params })); });
const js = async code => { const r = await cmd('Runtime.evaluate', { expression: `(async () => { ${code} })()`, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) console.log('JS error:', r.result.exceptionDetails.exception?.description?.slice(0, 300)); return r.result?.result?.value; };
await cmd('Network.enable'); await cmd('Network.setBlockedURLs', { urls: ['*script.google.com*', '*abacus*'] });
await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 640, deviceScaleFactor: 3, mobile: true });
const go = async url => { await cmd('Page.navigate', { url }); await sleep(2500); };
const shot = async name => { await sleep(1200); const r = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, 'base64')); console.log('saved', name); };
const PREP = `localStorage.setItem('asfalt_nick', 'Игрок'); localStorage.setItem('asfalt_meta', JSON.stringify({ kazanDone: true }));
  localStorage.setItem('asfalt_settings', JSON.stringify({ tutorial: false })); localStorage.setItem('asfalt_album', '0');`;
const GAME = `document.querySelector('#main').onclick = null; document.querySelectorAll('.mskintro').forEach(e => e.remove()); window.save = () => {}; timePaused = true; clearInterval(timeT); window.card = (l, then) => then && then(); splashDone = true;`;
const NEW = `${GAME} playScreen(); document.querySelector('#new').click(); await new Promise(r => setTimeout(r, 300)); document.querySelector('#go').click(); await new Promise(r => setTimeout(r, 600));`;
const TAP = `for (let i = 0; i < 4; i++) { document.querySelector('#main').click(); await new Promise(r => setTimeout(r, 400)); }`;

await go(BASE); await js(PREP);
// 1. главное меню Казани
await go(BASE + '?s=1'); await js(`${GAME} titleScreen(true);`); await shot('01_menu');
// 2. карта Казани
await js(`${NEW} S.cur = null; S.res = null; S.min = 15 * 60; view = 'map'; render();`); await sleep(2500); await shot('02_map_kazan');
// 3. уличная стычка
await js(`S.cur = null; S.res = null; play('r_patrol'); ${TAP}`); await shot('03_street');
// 4. Москва: заставка
await go(BASE + '?city=moscow&s=4'); await js(`${GAME} mskIntro(() => {}); const el = document.querySelector('.mskintro'); el.classList.add('rev'); el.querySelector('video').remove();`); await sleep(2500); await shot('04_moscow_title');
// 5. Москва: Мишаня в метро
await js(`document.querySelectorAll('.mskintro').forEach(e => e.remove()); ${NEW} S.cur = null; S.res = null; play('mk_metro'); ${TAP}`); await shot('05_moscow_metro');
// 6. Москва: Арбат, выбор
await js(`S.cur = null; S.res = null; play('mk_arbat'); for (let i = 0; i < 12; i++) { if (document.querySelector('#main .choices .btn')) break; document.querySelector('#main').click(); await new Promise(r => setTimeout(r, 400)); }`); await shot('06_moscow_choice');
// 7. карта Москвы
await js(`S.cur = null; S.res = null; S.min = 20 * 60; view = 'map'; render();`); await sleep(3000); await shot('07_map_moscow');
// 8. герой
await js(`view = 'hero'; render();`); await shot('08_hero');

sock.close(); ed.kill();
