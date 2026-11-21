// Своя бригада в девяностых: бойцы по именам и кличкам. Каждого надо кормить (жалованье раз в неделю),
// они держат твои районы в войнах кланов, гибнут на стрелках, садятся, а недовольные — уходят или сдают.
// Из скорлупы 80-х в бригаду переходят те, кто остался верен. Размер — до 2 + влияние/15 (не больше 8).
const BR_NAMES = ['Ринат', 'Марат', 'Айдар', 'Серёга', 'Вован', 'Тимур', 'Ильнур', 'Димон', 'Руслан', 'Альберт', 'Костя', 'Фарид', 'Женёк', 'Рустам', 'Олег', 'Булат'];
const BR_NICKS = ['Кабан', 'Сивый', 'Боцман', 'Татарин', 'Шрам', 'Хохол', 'Малой', 'Танк', 'Бизон', 'Лысый', 'Профессор', 'Чечен', 'Сапёр', 'Кот', 'Гена-Крокодил', 'Афганец'];
const BR_PAY = 15;
const brigOn = S => typeof era90 === 'function' && era90(S);
const BRIG = S => (S.brig = S.brig || []);
const brigAlive = S => BRIG(S).filter(b => !b.dead && !b.gone && !b.sit);
const brigCap = S => Math.min(8, 2 + Math.floor((S.vl || 0) / 15));
const brigPower = S => brigAlive(S).reduce((a, b) => a + b.sila, 0);
const brigName = b => `${b.name} «${b.nick}»`;
function brigNew(S, from) {
  const used = BRIG(S).map(b => b.nick);
  return { id: (S.brN = (S.brN || 0) + 1), name: pick(BR_NAMES), nick: from ? from.nick : pick(BR_NICKS.filter(n => !used.includes(n))) || 'Новый',
    sila: 3 + rnd(4), loyal: from ? Math.max(50, from.loyal) : 45 + rnd(25), app: from ? from.app : null, since: S.day };
}
// переход в девяностые: верная скорлупа становится бригадой
function brigInit(S) {
  if (S.brig || !brigOn(S)) return;
  S.brig = (S.squad || []).filter(m => (m.loyal || 0) >= 40).slice(0, 4).map(m => brigNew(S, m));
  if (S.brig.length) log(`Твоя скорлупа выросла: ${S.brig.map(brigName).join(', ')} — теперь твоя бригада.`);
}
const brigHtml = S => brigOn(S) ? (brigInit(S), `<div class="choices" style="margin:0 0 12px"><button class="btn main" onclick="brigScreen()">👥 Бригада · ${brigAlive(S).length}/${brigCap(S)}</button></div>`) : '';
function brigScreen() {
  brigInit(S);
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const all = BRIG(S), can = brigAlive(S).length < brigCap(S), last = S.flags.br_hire === S.day;
  $('#main').innerHTML = `<div class="scene in"><h2>👥 Бригада</h2>
    <p class="sub">Сила бригады: <b>${brigPower(S)}</b>. Жалованье — ${BR_PAY} р. в неделю каждому. Не заплатишь — верность падает, и тогда жди беды. Бригада держит твои районы в войнах кланов.</p>
    <div class="choices">${all.map(b => `<div class="item${b.dead ? ' lockedi' : ''}"><div style="flex:1"><b>${b.dead ? '✝ ' : b.sit ? '⛓ ' : b.gone ? '✗ ' : ''}${brigName(b)}</b>
      <div class="sub">${b.dead ? `Погиб ${dateStr(b.dead)}.` : b.sit ? 'Сидит. Ждёт, что ты поможешь.' : b.gone ? 'Ушёл.' : `Сила ${b.sila} · верность ${b.loyal}`}</div></div>
      ${!b.dead && !b.gone ? `<div class="fam-b">${b.sit ? `<button class="btn" data-br="${b.id}|out">Выкупить (150 р.)</button>` : `<button class="btn" data-br="${b.id}|bonus">Премия 30 р.</button><button class="btn" data-br="${b.id}|kick">Выгнать</button>`}</div>` : ''}</div>`).join('') || '<div class="item"><div>Пока никого. Набери людей.</div></div>'}</div>
    <div class="choices"><button class="btn main" id="hire" ${can && !last && S.st.dengi >= 50 ? '' : 'disabled'}>${!can ? `Больше не прокормишь (нужно влияние ${(brigAlive(S).length - 1) * 15})` : last ? 'Сегодня уже набирал' : 'Набрать бойца (50 р.)'}</button>
    <button class="btn" id="bk">Назад</button></div></div>`;
  $('#bk').onclick = () => { view = 'hero'; render(); };
  $('#hire').onclick = () => { S.flags.br_hire = S.day; S.st.dengi -= 50; const b = brigNew(S); BRIG(S).push(b); log(`В бригаде новый боец: ${brigName(b)}.`); toast(`${brigName(b)} теперь с тобой`); brigScreen(); };
  document.querySelectorAll('[data-br]').forEach(x => x.onclick = () => { const [id, k] = x.dataset.br.split('|'), b = BRIG(S).find(y => y.id === +id); if (!b) return;
    if (k === 'bonus') { if (S.st.dengi < 30 || b.bonus === S.day) return toast(b.bonus === S.day ? 'Сегодня уже давал' : 'Нужно 30 р.'); S.st.dengi -= 30; b.bonus = S.day; b.loyal = Math.min(100, b.loyal + 15); }
    if (k === 'kick') { b.gone = S.day; if (b.loyal < 40 && Math.random() < 0.5) { S.st.mil = Math.min(100, S.st.mil + 15); log(`${brigName(b)} ушёл злым — и пошёл к ментам.`); } }
    if (k === 'out') { if (S.st.dengi < 150) return toast('Нужно 150 р.'); S.st.dengi -= 150; b.sit = 0; b.loyal = Math.min(100, b.loyal + 30); log(`Выкупил ${brigName(b)}. Теперь он за тебя в огонь.`); }
    brigScreen(); });
}
// потери: на стрелках и в войнах
function brigLoss(S, chance, why) {
  const al = brigAlive(S); if (!al.length || Math.random() > chance) return null;
  const b = pick(al); b.dead = S.day; log(`${brigName(b)} погиб: ${why}.`);
  if (typeof pagerPush === 'function') pagerPush(S, { from: 'Бригада', text: `${b.nick} погиб. ${why}.`, act: 'scr:brig', btn: 'К бригаде' });
  brigAlive(S).forEach(x => x.loyal = Math.max(0, x.loyal - 5));
  return b;
}
// раз в неделю: жалованье, верность, аресты, предательство
function brigWeek(S, w) {
  if (!brigOn(S)) return; brigInit(S);
  const al = brigAlive(S); if (!al.length) return;
  const need = al.length * BR_PAY;
  if (S.st.dengi >= need) { S.st.dengi -= need; w.out.push([`Бригада (${al.length})`, need]); al.forEach(b => b.loyal = Math.min(100, b.loyal + 1)); }
  else { al.forEach(b => b.loyal = Math.max(0, b.loyal - 15)); w.warn.push('Бригаде не заплатил — верность −15.'); }
  if (S.st.mil > 50 && Math.random() < 0.15) { const b = pick(al); b.sit = S.day; w.warn.push(`${brigName(b)} задержан.`); typeof pagerPush === 'function' && pagerPush(S, { from: 'Адвокат', text: `${b.nick} в СИЗО. Можно выкупить.`, act: 'scr:brig', btn: 'К бригаде' }); }
  const bad = al.find(b => b.loyal < 20);
  if (bad && Math.random() < 0.4) {
    bad.gone = S.day;
    if (Math.random() < 0.5) { const st = Math.min(S.st.dengi, 100); S.st.dengi -= st; w.warn.push(`${brigName(bad)} ушёл и прихватил ${st} р. из общака.`); }
    else { S.st.mil = Math.min(100, S.st.mil + 20); w.warn.push(`${brigName(bad)} ушёл — и, говорят, разговаривает с РУБОПом.`); }
  }
}
// бригада воюет за районы: сила бригады мешает кланам отжимать твои районы, а на стрелках кто-то может погибнуть
{ const cw = clanWeek; clanWeek = (S, w) => { const sv = S.st.avt; S.st.avt = (S.st.avt || 0) + brigPower(S) * 3; try { cw(S, w); } finally { S.st.avt = sv; }
  if ((w.warn || []).some(x => /отжали/.test(x))) brigLoss(S, 0.5, 'когда отбивали район');
  (w.warn || []).filter(x => /отжали|полезли/.test(x)).forEach(x => typeof pagerPush === 'function' && pagerPush(S, { from: 'Бригада', text: x, act: 'scr:map', btn: 'На карту' })); }; }
{ const e = EV.cl_otzhat; if (e) { const ch = e.choices; e.choices = S => ch(S).map((c, i) => i ? c : { ...c, fx: s => { const r = typeof c.fx === 'function' ? c.fx(s) : c.fx; brigLoss(s, 0.25, 'на стрелке за район'); return r; } }); } }
