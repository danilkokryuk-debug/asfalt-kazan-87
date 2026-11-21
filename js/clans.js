// Карта девяностых: кланы вместо моталок.
// С 1992-го (в Кампании — с главы «Бригада») районы — уже не асфальт моталок, а территории структур:
// воры Хасана-аги, коммерсы Барона, спортсмены Тагира, «красная крыша» (менты) и — если хватит влияния — ты сам.
// Твоя бывшая моталка уходит под того, с кем ты дружишь; с влиянием 30+ ты держишь её сам.
// С каждой структурой — союз, мир или война. Война: раз в неделю они пытаются отжать твой район, а ты можешь отжать их.
const CLANS = {
  me: { name: 'Твои люди', color: '#c8402f' },
  hasan: { name: 'Воры Хасана-аги', color: '#d8a441' },
  baron: { name: 'Коммерсы Барона', color: '#a02a6a' },
  tatarin: { name: 'Спортсмены Тагира', color: '#3a7ac8' },
  menty: { name: 'Под ментами (РУБОП)', color: '#7a8496' },
};
Object.entries(CLANS).forEach(([id, c]) => { DIST['cl_' + id] = { id: 'cl_' + id, name: c.name, gang: c.name, color: c.color }; });
const CREL = { soyuz: 'союз', mir: 'мир', voyna: 'война' };
function clanInit(S) {
  if (S.clan || !era90(S)) return; vlInit(S);
  const f = S.flags, patron = f.red_roof ? 'menty' : f.hasan_drug ? 'hasan' : f.baron_drug ? 'baron' : 'hasan';
  const mineSide = S.vl >= 30 ? 'me' : patron, others = ['hasan', 'baron', 'tatarin', 'menty'];
  S.clan = {};
  DISTRICTS.forEach((d, i) => {
    if (d.id === 'center') S.clan[d.id] = 'menty';
    else if (S.gang && S.ctrl[d.id] === S.gang) S.clan[d.id] = mineSide;
    else S.clan[d.id] = others[(i * 7 + (S.name || '').length) % 4];   // бывшие моталки разошлись по структурам
  });
  if (S.vl >= 30 && !Object.values(S.clan).includes('me')) S.clan[S.home] = 'me';
  S.crel = { hasan: f.hasan_drug ? 'soyuz' : 'mir', baron: f.baron_drug ? 'soyuz' : 'mir', tatarin: f.tagir_vrag || f.tagir_down ? 'voyna' : 'mir', menty: f.red_roof ? 'soyuz' : 'mir' };
  if (mineSide !== 'me') S.crel[mineSide] = 'soyuz';
  log(mineSide === 'me' ? 'Девяностые. Твоя моталка стала твоей бригадой — ты сам себе крыша.' : `Девяностые. Твои районы теперь ходят под структурой «${CLANS[mineSide].name}».`);
}
const clanCount = (S, c) => DISTRICTS.filter(d => S.clan[d.id] === c).length;
// цвет карты: районы по структурам
function mapControl(S) {
  if (!era90(S)) return S.ctrl; clanInit(S);
  return Object.fromEntries(DISTRICTS.map(d => [d.id, 'cl_' + S.clan[d.id]]));
}
const clanOn = S => era90(S) && !!S.clan;
function clanLegend(S) {
  return Object.keys(CLANS).map(c => { const n = clanCount(S, c); if (!n) return '';
    return `<span class="lg${c === 'me' ? ' mine' : ''}"><i style="background:${CLANS[c].color}"></i>${CLANS[c].name} ${n}${c !== 'me' ? ' · ' + CREL[S.crel[c]] : ''}</span>`; }).join('');
}
function clanSheet(S, d) {
  const c = S.clan[d]; return c === 'me' ? 'Твоя территория — платят тебе.' : `Ходит под структурой «${CLANS[c].name}». К тебе: ${CREL[S.crel[c]]}.`;
}
// действия на районе в девяностых
function clanActs(S, d) {
  if (!clanOn(S)) return []; const c = S.clan[d], a = [];
  if (c === 'me') return [{ t: 'Объехать свои точки, собрать долю', fx: s => ({ dengi: 10 + clanCount(s, 'me') * 4, avt: 1 }), txt: 'Ларьки, кафе, автосервис. Конверты в бардачке.' }];
  const rel = S.crel[c], nm = CLANS[c].name;
  if (rel !== 'soyuz') a.push({ t: `Переговоры: «${nm}»`, chk: ['yaz', 6 + (rel === 'voyna' ? 2 : 0)],
    ok: { txt: rel === 'voyna' ? 'Мир. Стрелку отменили, все живы.' : 'Ударили по рукам: теперь вы союзники.', fx: s => { s.crel[c] = rel === 'voyna' ? 'mir' : 'soyuz'; vlAdd(s, 2); return {}; } },
    no: { txt: 'Не договорились. Расстались холодно.', fx: s => { if (rel === 'mir' && Math.random() < 0.4) s.crel[c] = 'voyna'; return {}; } } });
  if (c !== 'menty') a.push({ t: `Отжать район у «${nm}»`, if: s => s.vl >= 20, fx: s => { s.crel[c] = 'voyna'; s.flags.cl_target = d; return { mil: 8 }; }, go: 'cl_otzhat' });
  else a.push({ t: 'Занести в РУБОП, чтобы район стал твоим (200 р.)', if: s => s.vl >= 40, req: { dengi: 200 }, fx: s => { s.clan[d] = 'me'; vlAdd(s, 3); return { dengi: -200, mil: -10 }; }, txt: 'Подполковник прячет конверт. Ваши ларьки здесь больше никто не трогает.' });
  if (rel === 'soyuz' && c !== 'menty') a.push({ t: `Общее дело с «${nm}»`, fx: () => ({ dengi: 30, avt: 2 }), txt: 'Совместный «наезд» на залётных. Делите поровну.' });
  return a;
}
{ const ma = mechActions; mechActions = (S, d) => [...ma(S, d), ...clanActs(S, d)]; }
def('cl_otzhat', { mode: 'any', repeat: true, title: 'Передел', bg: 't_9_perestrelka',
  lines: S => [`Стрелка на пустыре. Против тебя — люди «${CLANS[S.clan[S.flags.cl_target]].name}».`, ['chuzhoy:Их старший', 'Здесь всё давно поделено. Уезжай, пока можешь.', 'angry']],
  choices: S => [{ t: 'Начинать', fx: fight('Чужая бригада', 5, 8 + Math.round((S.vl || 0) / 25),
      { txt: 'Район твой. Ларьки платят тебе с понедельника.', fx: s => { s.clan[s.flags.cl_target] = 'me'; vlAdd(s, 4); return { avt: 6 }; } },
      { txt: 'Пришлось отступить. В городе говорят: зубы не по размеру.', fx: s => { vlAdd(s, -4); return { zdor: -25 }; } }, { flee: false }), go: 'k_fight' },
    { t: 'Отступить', fx: s => { vlAdd(s, -2); }, txt: 'Ты уезжаешь. Война остаётся.' }] });
// раз в неделю: войны двигают границы, свои районы платят
function clanWeek(S, w) {
  if (!era90(S)) return; clanInit(S);
  const mine = DISTRICTS.filter(d => S.clan[d.id] === 'me');
  if (mine.length) { const inc = mine.length * 12; S.st.dengi += inc; w.inc.push([`Свои районы (${mine.length})`, inc]); }
  for (const c of ['hasan', 'baron', 'tatarin']) if (S.crel[c] === 'voyna' && mine.length && Math.random() < 0.3) {
    const d = pick(mine); if ((S.st.avt || 0) / 10 + S.vl / 5 > 12 + rnd(12)) { w.warn.push(`«${CLANS[c].name}» полезли на ${d.name} — отбились.`); continue; }
    S.clan[d.id] = c; vlAdd(S, -3); w.warn.push(`«${CLANS[c].name}» отжали ${d.name}!`);
  }
  if (Math.random() < 0.25) { const a = pick(DISTRICTS.filter(d => S.clan[d.id] !== 'me' && d.id !== 'center')); if (a) S.clan[a.id] = pick(['hasan', 'baron', 'tatarin', 'menty']); }   // структуры делят город и без тебя
}
