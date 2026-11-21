// Статус — как ты живёшь: во что одет, что ешь, на чём ездишь, как идут дела, сколько денег и кто за тобой стоит.
// Статус 0–100 складывается из шести частей и сам влияет на всё:
// — уважение раз в неделю растёт, если живёшь не ниже своего звания, и падает, если «не по статусу ходишь»;
// — известность в городе (fame) прибавляет от статуса;
// — с высоким статусом твой язык весит больше (+1 к проверкам языка), в обносках с высоким званием — −1;
// — девушки замечают: отношения с Наташей/женой растут; в 80-х слишком шикуешь — ОБХСС интересуется.
const ST_TIERS = [[0, 'Чушпан в обносках'], [15, 'Как все'], [30, 'Модный пацан'], [50, 'При деньгах'], [70, 'Хозяин жизни'], [88, 'Король Казани']];
const stVal = i => i ? (i.cur === '$' ? i.price * 5 : i.price || 0) : 0;
function statusParts(S) {
  const torn = S.torn || [];
  const wear = (typeof wornIds === 'function' ? wornIds(S.wear) : []).map(id => ITEM[id]).filter(i => i && !torn.includes(i.id) && i.slot !== 'wpn');
  const wv = wear.reduce((a, i) => a + stVal(i), 0);
  const clothes = Math.min(30, Math.round(Math.sqrt(wv) * 1.7));
  const rat = S.body ? S.body.rat : 'norm';
  const food = { golod: 0, deshevo: 3, norm: 6, rynok: 10, resto: 15 }[rat] ?? 6;
  let car = 0;
  if (S.car && typeof CAR !== 'undefined' && CAR[S.car.id]) { const c = CAR[S.car.id];
    car = c.elite ? 25 : c.t === 'moped' ? 4 : c.t === 'moto' ? 8 : Math.min(22, 8 + Math.round(stVal(c) / 400));
    if ((S.car.cond ?? 100) < 40) car = Math.round(car * 0.6); }   // ржавое корыто — не статус
  const pts = typeof pointsSum === 'function' ? pointsSum() : 0;
  const deals = Math.min(15, Math.round(pts / 8) + (S.biz || []).length * 2 + Math.round((S.vl || 0) / 10));
  const worth = (S.st.dengi || 0) + (S.st.dol || 0) * 4;
  const money = Math.min(10, Math.max(0, Math.round(Math.log10(worth + 1) * 3)));
  const crew = Math.min(10, (typeof brigAlive === 'function' && typeof era90 === 'function' && era90(S) ? brigAlive(S).length * 2 : 0) + Math.round((S.squad || []).length * 1.5));
  return { clothes, food, car, deals, money, crew };
}
const statusScore = S => { const p = statusParts(S); return Math.min(100, p.clothes + p.food + p.car + p.deals + p.money + p.crew); };
const statusTitle = S => ST_TIERS.reduce((a, t) => statusScore(S) >= t[0] ? t[1] : a, ST_TIERS[0][1]);
const statusNeed = S => S.rank * 14;   // чего ждут от твоего звания

// ---------- влияние статуса ----------
// раз в неделю: уважение по статусу, девушка, ОБХСС
{ const ew = economyWeek; economyWeek = S => { ew(S);
  const s = statusScore(S), need = statusNeed(S), d = s - need;
  const du = Math.max(-4, Math.min(3, Math.round(d / 8)));
  if (du) { S.st.uvazh = clamp(S.st.uvazh + du, 0, 100); log(du > 0 ? `Живёшь красиво — уважение +${du}.` : `Не по статусу ходишь — уважение ${du}.`); }
  if (s >= 40 && S.flags.met_natasha && !S.flags.natasha_gone && !S.flags.natasha_lost) S.rel.natasha = Math.min(100, S.rel.natasha + 1);
  if (s >= 70 && !(typeof era90 === 'function' && era90(S))) { S.st.mil = clamp(S.st.mil + 3, 0, 100); log('Слишком шикуешь для советского человека — ОБХСС интересуется (+3).'); }
  S.flags.st_last = s;
}; }
// язык: в высоком статусе тебя слушают, в обносках при высоком звании — нет
{ const st = stat; stat = k => { const v = st(k); if (k !== 'yaz' || !S || !S.st) return v;
  const s = statusScore(S); return Math.max(0, v + (s >= 60 ? 1 : 0) - (s < 15 && S.rank >= 2 ? 1 : 0)); }; }

// ---------- панель на экране героя ----------
const ST_PART = [['clothes', '👔 Одежда', 30], ['food', '🍽 Еда', 15], ['car', '🚗 Транспорт', 25], ['deals', '💼 Дела', 15], ['money', '💰 Деньги', 10], ['crew', '👥 Окружение', 10]];
function statusHtml(S) {
  const p = statusParts(S), s = statusScore(S), need = statusNeed(S), d = s - need;
  return `<div class="stbox"><div class="st-h"><span>Статус</span><b>${s}</b><em>${statusTitle(S)}</em></div>
    <div class="st-bar"><i style="width:${s}%"></i><u style="left:${Math.min(100, need)}%" title="ждут от звания"></u></div>
    <div class="st-parts">${ST_PART.map(([k, n, m]) => `<div><span>${n}</span><div class="bar"><i style="width:${p[k] / m * 100}%"></i></div><b>${p[k]}/${m}</b></div>`).join('')}</div>
    <div class="sub">${d >= 8 ? `Живёшь выше звания — уважение растёт каждую неделю.` : d <= -8 ? `<span class="lo">Для звания «${RANKS[S.rank]}» живёшь бедно (ждут ${need}) — уважение тает.</span>` : 'Живёшь по званию.'}
      ${s >= 60 ? ' Тебя слушают: язык +1.' : ''}${s < 15 && S.rank >= 2 ? ' <span class="lo">В обносках тебя не слушают: язык −1.</span>' : ''}${s >= 70 && !(typeof era90 === 'function' && era90(S)) ? ' <span class="lo">ОБХСС замечает твою роскошь.</span>' : ''}</div></div>`;
}
// известность тоже от статуса — правка формулы fame в fame.js
