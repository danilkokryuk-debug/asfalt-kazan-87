// Экономика: деньги конечны. Приток ограничен, есть обязательные траты, доллары — твёрдая и опасная валюта.

// --- Справочник ----------------------------------------------------------------------------
const DUES = [0, 2, 5, 10, 25, 40];          // взнос в общак в неделю по рангу
const SHARE = [1, 0.3, 0.35, 0.45, 0.6, 0.8]; // какую долю добычи с заданий оставляешь себе
const CAP = [0, 8, 20, 35, 55, 80];   // больше не используется для точек (см. pointsCalc); оставлен для совместимости
const SQUAD_PAY = 2;                          // содержание одного из скорлупы в неделю
const RATE_BUY = 4, RATE_SELL = 3;            // фарца: продаёт 1$ за 4 р., покупает за 3 р.

// Импортные вещи (бренд латиницей в «») — только за доллары. Цена в $ ≈ рубли / 5.
for (const i of ITEMS) if (/«[A-Za-z]/.test(i.name || '') && !i.start && !i.reward && !i.limited) { i.cur = '$'; i.price = Math.max(2, Math.round(i.price / 5)); }
const priceTxt = i => i.cur === '$' ? `$${i.price}` : `${i.price} р.`;
const canAfford = i => (i.cur === '$' ? S.st.dol : S.st.dengi) >= i.price;
function payFor(i) { if (i.cur === '$') S.st.dol -= i.price; else S.st.dengi -= i.price; }

// Доля добычи после общака
const pay = n => Math.max(1, Math.round(n * SHARE[S.rank]));

// --- Точки под крышей ---------------------------------------------------------------------------
// S.points = [{ name, amt }] — каждую неделю платят, но их могут отжать
function addPoint(name, amt) {
  S.points = S.points || [];
  const had = S.points.find(p => p.name === name);   // та же точка второй раз — не новая, а пересмотр условий
  if (had) { had.base = had.base || had.amt; const v = Math.min(Math.round(had.base * 1.5), had.amt + Math.round(amt * 0.25)); if (v > had.amt) log(`«${name}» платит больше: ${had.amt} → ${v} р.`); had.amt = Math.max(had.amt, v); return; }
  S.points.push({ name, amt, base: amt }); log(`Под крышей: ${name} (+${amt} р. в неделю).`);
}
// Доход с точек считается честно, без «потолка»: валовые − то, что не успел собрать − доля старшим − менты.
// Объезд: сам и с пацанами ты успеваешь к (2 + звание + скорлупа/бригада) точкам; остальные приносят четверть.
const POINT_CUT_ELDERS = [0.3, 0.3, 0.3, 0.2, 0.2, 0];   // доля старшим по рангу (автор — сам себе старший)
function pointsCalc(S, skip = []) {
  const P = (S.points || []).map((p, i) => ({ p, i })).filter(x => !skip.includes(x.i));
  const gross = P.reduce((a, x) => a + x.p.amt, 0);
  if (!gross) return { gross: 0, net: 0, rows: [] };
  const e90 = typeof era90 === 'function' && era90(S);
  const crew = Math.min(4, (S.squad || []).length) + (e90 && typeof brigAlive === 'function' ? brigAlive(S).length : 0) + (S.car ? 1 : 0);
  const cap = 2 + S.rank + crew;
  const far = P.sort((a, b) => b.p.amt - a.p.amt).slice(cap), lostFar = Math.round(far.reduce((a, x) => a + x.p.amt, 0) * 0.75);
  let left = gross - lostFar; const rows = [['Точки, валовые', gross]];
  if (lostFar) rows.push([`Не успеваешь объехать ${far.length} из ${P.length} (людей и колёс на ${cap})`, -lostFar]);
  let eld = 0;
  if (e90) { const pat = S.clan && Object.values(S.clan).includes('me') ? 0 : 0.2; eld = Math.round(left * pat); if (eld) rows.push([S.flags.red_roof ? 'Доля «красной крыше»' : 'Доля покровителю', -eld]); }
  else if (S.gang) { eld = Math.round(left * POINT_CUT_ELDERS[S.rank]); if (eld) rows.push([`Доля старшим (${Math.round(POINT_CUT_ELDERS[S.rank] * 100)}%)`, -eld]); }
  left -= eld;
  const ment = P.length >= 3 ? Math.round(left * (S.flags.red_roof ? 0.05 : 0.1)) : 0;
  if (ment) rows.push([e90 ? 'РУБОПу, чтобы не трогали' : 'Участковому и ОБХСС', -ment]);
  return { gross, net: Math.max(0, left - ment), rows, cap };
}
const pointsSum = () => pointsCalc(S).net;
// раз в неделю у точек своя жизнь: кто-то не платит, кого-то закрывают
function pointsWeek(S, w) {
  const P = S.points || []; if (!P.length) return 0;
  const skip = [];
  P.forEach((p, i) => { const r = Math.random();
    if (r < 0.08) { skip.push(i); w.warn.push(`«${p.name}» не заплатили: «выручки нет, приходи потом».`); }
    else if (r < 0.1 && P.length > 1) { skip.push(i); p.gone = 1; w.warn.push(`«${p.name}» закрыли ${typeof era90 === 'function' && era90(S) ? 'налоговая и ОМОН' : 'ОБХСС'}. Точки больше нет.`); } });
  S.points = P.filter(p => !p.gone);
  const c = pointsCalc(S, skip.filter(i => !P[i].gone).map(i => S.points.indexOf(P[i])));
  return c;
}

def('e_point', {
  mode: 'any', repeat: true, title: 'Точку отжимают', bg: 'rynok',
  trigger: S => S.flags.point_threat != null && S.points && S.points[S.flags.point_threat],
  fx: S => { S.ptCur = S.points[S.flags.point_threat]; S.ptIdx = S.flags.point_threat; delete S.flags.point_threat; },
  lines: S => [`На «${S.ptCur.name}» пришли чужие. Говорят, теперь платить будут им.`,
    ['chuzhoy', 'Ваше время кончилось. Теперь это наше.', 'angry']],
  choices: S => [
    { t: 'Отбить точку', fx: s => { s.kf = { name: 'Чужие', hp: 3, pow: 4 + s.rank, win: { txt: 'Отбили. Точка снова наша.', fx: { avt: 4 } },
      lose: { txt: `«${s.ptCur.name}» потеряна.`, fx: { uvazh: -3, unpoint: s.ptIdx } } }; }, go: 'k_fight' },
    { t: 'Отдать', fx: { unpoint: S.ptIdx, uvazh: -5 }, txt: 'Минус доход. Пацаны видели, что ты сдал.' },
  ],
});

// --- Неделя: доходы и обязательные траты -------------------------------------------------------
function economyWeek(S) {
  const w = { inc: [], out: [], warn: [] };
  const big = typeof heroAge === 'function' && heroAge(S) >= 18, allowance = big ? 0 : S.fam === 'full' ? 5 : S.fam === 'drunk' ? 1 : 2;   // взрослому карманных не дают
  if (allowance) w.inc.push(['Карманные от семьи', allowance]);
  if (S.points && S.points.length) { const c = pointsWeek(S, w); if (c && c.gross) { w.inc.push([`Точки под крышей (из ${c.gross} валовых — остальное старшим, ментам и не собрано)`, c.net]); } }
  S.st.dengi += w.inc.reduce((a, x) => a + x[1], 0);

  // взнос в общак
  if (S.gang && DUES[S.rank]) {
    const due = DUES[S.rank];
    if (S.st.dengi >= due) { S.st.dengi -= due; w.out.push(['Взнос в общак', due]); S.flags.debt = 0; }
    else {
      S.flags.debt = (S.flags.debt || 0) + 1; S.st.uvazh = Math.max(0, S.st.uvazh - 8);
      w.warn.push(`Не хватило на взнос в общак (${due} р.). Уважение −8. Долг: ${S.flags.debt} нед.`);
    }
  }
  // содержание своей скорлупы
  if (S.squad && S.squad.length) {
    const need = S.squad.length * SQUAD_PAY;
    if (S.st.dengi >= need) { S.st.dengi -= need; w.out.push([`Своя скорлупа (${S.squad.length})`, need]); }
    else { S.squad.forEach(m => m.loyal = Math.max(0, m.loyal - 10)); w.warn.push('Скорлупе не заплатил — верность −10 у всех.'); }
  }
  // доллары на руках — риск
  if (S.st.dol > 0) { const r = Math.min(8, Math.ceil(S.st.dol / 8)); S.st.mil = Math.min(100, S.st.mil + r); w.warn.push(`Доллары дома: внимание милиции +${r}.`); }
  // любовь гаснет без внимания
  if (S.st.lyub > 0 && S.flags.gift !== Math.floor(S.day / 7)) S.st.lyub = Math.max(0, S.st.lyub - 3);
  // точки под угрозой
  if (S.points && S.points.length && Math.random() < 0.15) S.flags.point_threat = rnd(S.points.length);
  if (typeof vlWeek === 'function') vlWeek(S, w);
  if (typeof clanWeek === 'function') clanWeek(S, w);
  if (typeof brigWeek === 'function') brigWeek(S, w);
  if (typeof pagerWeek === 'function') pagerWeek(S);
  if (typeof theftWeek === 'function') theftWeek(S, w);
  S.week = w;
  const sum = a => a.reduce((x, y) => x + y[1], 0);
  log(`Неделя: +${sum(w.inc)} р., −${sum(w.out)} р.${w.warn.length ? ' ' + w.warn.join(' ') : ''}`);
}
def('e_debt', {
  mode: 'any', repeat: true, title: 'Разговор про общак', bg: 'korobka',
  trigger: S => (S.flags.debt || 0) >= 2,
  lines: S => [['starsh', `Ты, ${S.nick || S.name}, общак две недели не кормишь. Это как понимать?`, 'angry']],
  choices: S => [
    { t: `Отдать вдвойне (${DUES[S.rank] * 2} р.)`, req: { dengi: DUES[S.rank] * 2 }, fx: s => { s.flags.debt = 0; return { dengi: -DUES[s.rank] * 2 }; }, txt: '«Ладно. Но чтоб последний раз».' },
    { t: 'Просить отсрочку', chk: ['yaz', 5 + S.rank], ok: { txt: '«Неделя. Потом спросим по-другому».', fx: s => { s.flags.debt = 1; } },
      no: { txt: 'Тебя бьют при всех. Для порядка.', fx: s => { s.flags.debt = 0; return { zdor: -20, uvazh: -10 }; } } },
  ],
});

// --- Износ одежды -----------------------------------------------------------------------------
// После драки вещь может порваться: бонус пропадает, пока не починишь (30% цены)
function wearAndTear() {
  if (Math.random() > 0.15) return '';
  const cand = ['outer', 'pants', 'shirt', 'shoes'].map(s => S.wear[s]).filter(id => !ITEM[id].start && !(S.torn || []).includes(id));
  if (!cand.length) return '';
  const id = pick(cand); S.torn = [...(S.torn || []), id];
  return `\n\nВ драке порвал: ${ITEM[id].name}. Почини в гардеробе — иначе бонус не работает.`;
}
const repairCost = i => Math.max(1, Math.round(i.price * 0.3));
function repair(i) {
  if (i.cur === '$') S.st.dol -= repairCost(i); else S.st.dengi -= repairCost(i);
  S.torn = S.torn.filter(x => x !== i.id); log(`Починил: ${i.name}.`);
}

// --- Кошелёк -----------------------------------------------------------------------------------
function walletHtml() {
  const due = S.gang ? DUES[S.rank] : 0, sq = (S.squad || []).length * SQUAD_PAY;
  const big = typeof heroAge === 'function' && heroAge(S) >= 18;
  const inc = pointsSum() + (big ? 0 : S.fam === 'full' ? 5 : S.fam === 'drunk' ? 1 : 2);
  const food = typeof ratCost === 'function' ? ratCost(S, BODY(S).rat) * 7 : 0;
  const next = 7 - (S.day % 7 || 7);
  const short = S.st.dengi + inc < due + sq + food;
  return `<div class="wallet"><div class="wrow"><b>${S.st.dengi} р.</b><b>$${S.st.dol || 0}</b></div>
    <div class="sub">Через ${next || 7} дн.: доход +${inc} р. · взнос в общак −${due} · скорлупа −${sq} · еда за неделю −${food}</div>
    ${(S.points || []).length ? `<div class="pts">${pointsCalc(S).rows.map(([k, v]) => `<div class="ptr"><span>${k}</span><b class="${v < 0 ? 'lo' : ''}">${v > 0 ? '+' : ''}${v} р.</b></div>`).join('')}<div class="ptr tot"><span>Чистыми с точек (если все заплатят)</span><b>+${pointsSum()} р.</b></div></div>` : ''}
    ${S.flags.debt ? `<div class="sub" style="color:var(--bad)">Долг перед общаком: ${S.flags.debt} нед.</div>` : ''}
    ${short ? `<div class="sub" style="color:var(--bad)">Не хватит на обязательные траты!</div>` : ''}
    ${S.st.dol ? `<div class="sub">Доллары дома повышают внимание милиции каждую неделю.</div>` : ''}</div>`;
}
