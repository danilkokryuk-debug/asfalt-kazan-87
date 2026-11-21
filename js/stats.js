// Счётчик игроков без своего сервера: бесплатный abacus (анонимные числа, никаких личных данных).
// players — уникальные устройства, d_ГГГГММДД — играли сегодня, on_<5 мин> — сейчас в игре.
const STATS_NS = 'asfalt-kazan87', STATS_API = 'https://abacus.jasoncameron.dev';
const PSTATS = { players: null, today: null, now: null };
const statsDay = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const statsSlot = () => Math.floor(Date.now() / 300000);
async function statsCall(op, key) {
  try { const r = await fetch(`${STATS_API}/${op}/${STATS_NS}/${key}`, { cache: 'no-store' }); return r.ok ? (await r.json()).value : null; }
  catch (e) { return null; }                                         // офлайн — просто без цифр
}
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
async function statsPing() {
  if (typeof __TEST !== 'undefined' || !navigator.onLine || /^(localhost|127.)/.test(location.hostname)) return;   // разработка не считается
  PSTATS.players = await statsCall(lsGet('asfalt_pid') ? 'get' : 'hit', 'players');
  if (PSTATS.players != null) lsSet('asfalt_pid', '1');   // засчитываем, только если сервер ответил
  const d = statsDay();
  PSTATS.today = await statsCall(lsGet('asfalt_pday') === d ? 'get' : 'hit', 'd_' + d);
  if (PSTATS.today != null) lsSet('asfalt_pday', d);
  const s = statsSlot();
  if (lsGet('asfalt_pslot') !== String(s) && !document.hidden) { PSTATS.now = await statsCall('hit', 'on_' + s); if (PSTATS.now != null) lsSet('asfalt_pslot', s); }
  else PSTATS.now = await statsCall('get', 'on_' + s);
  const el = document.getElementById('stats'); if (el) el.innerHTML = statsHtml();
}
function statsHtml() {
  return `Версия ${typeof APP_VER !== 'undefined' ? APP_VER : ''}`;   // внизу меню — версия игры, а не число игроков
}
if (typeof __TEST === 'undefined') { statsPing(); setInterval(statsPing, 300000); }
