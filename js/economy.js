// Экономика: деньги конечны. Приток ограничен, есть обязательные траты, доллары — твёрдая и опасная валюта.

// --- Справочник ----------------------------------------------------------------------------
const DUES = [0, 2, 5, 10, 25, 40];          // взнос в общак в неделю по рангу
const SHARE = [1, 0.3, 0.35, 0.45, 0.6, 0.8]; // какую долю добычи с заданий оставляешь себе
const CAP = [0, 10, 30, 60, 120, 220];        // потолок дохода с точек в неделю по рангу
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
  S.points.push({ name, amt }); log(`Под крышей: ${name} (+${amt} р. в неделю).`);
}
const pointsSum = () => Math.min((S.points || []).reduce((a, p) => a + p.amt, 0), CAP[S.rank]);

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
  if (S.points && S.points.length) w.inc.push(['Точки под крышей', pointsSum()]);
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
  const inc = pointsSum() + (S.fam === 'full' ? 5 : S.fam === 'drunk' ? 1 : 2);
  const next = 7 - (S.day % 7 || 7);
  const short = S.st.dengi + inc < due + sq;
  return `<div class="wallet"><div class="wrow"><b>${S.st.dengi} р.</b><b>$${S.st.dol || 0}</b></div>
    <div class="sub">Через ${next || 7} дн.: доход +${inc} р. · взнос в общак −${due} · скорлупа −${sq}</div>
    ${(S.points || []).length ? `<div class="sub">Точки: ${S.points.map(p => `${p.name} (+${p.amt})`).join(', ')}${pointsSum() < S.points.reduce((a, p) => a + p.amt, 0) ? ` — потолок на твоём ранге ${CAP[S.rank]} р.` : ''}</div>` : ''}
    ${S.flags.debt ? `<div class="sub" style="color:var(--bad)">Долг перед общаком: ${S.flags.debt} нед.</div>` : ''}
    ${short ? `<div class="sub" style="color:var(--bad)">Не хватит на обязательные траты!</div>` : ''}
    ${S.st.dol ? `<div class="sub">Доллары дома повышают внимание милиции каждую неделю.</div>` : ''}</div>`;
}
