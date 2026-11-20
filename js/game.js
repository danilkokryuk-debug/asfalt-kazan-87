// Движок: состояние, сцены, проверки, бои, день, сохранения.
const RANKS = ['Чушпан', 'Скорлупа', 'Супер', 'Молодой', 'Старший', 'Автор'];
const STATS = { sila: 'Сила', lovk: 'Ловкость', um: 'Смекалка', yaz: 'Язык' };
const METERS = { zdor: 'Здоровье', uvazh: 'Уважение своих', mil: 'Внимание милиции', sovest: 'Совесть', semya: 'Семья', lyub: 'Любовь' };
const RELS = { ildar: 'Ильдар (друг)', natasha: 'Наташа', bacha: 'Бача (старший)' };
const NAMES = { ...STATS, ...METERS, ...RELS, dengi: 'Деньги', avt: 'Авторитет' };
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const AP_PER_DAY = 3;

const EV = {};                       // все события, заполняет story.js
const def = (id, ev) => { ev.id = id; EV[id] = ev; };
let S = null;                        // состояние игры
let view = 'map', selDist = null;
const $ = sel => document.querySelector(sel);
const rnd = n => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const T = v => typeof v === 'function' ? v(S) : v;

function dateStr(day = S.day) {
  const d = new Date(1987, 8, 1); d.setDate(d.getDate() + day - 1);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function newState(o) {
  const ctrl = {}; DISTRICTS.forEach(d => ctrl[d.id] = d.gang ? d.id : null);
  return {
    v: 2, mode: 'campaign', name: o.name, app: o.app, home: o.home, fam: o.fam, gang: null, rank: 0, nick: null,
    wear: o.wear, owned: ITEMS.filter(i => i.start).map(i => i.id),
    day: 1, ap: AP_PER_DAY, at: o.home,
    st: { sila: 3, lovk: 3, um: 3, yaz: 3, zdor: 100, dengi: o.dengi, avt: 0,
          uvazh: 0, mil: 0, sovest: 70, semya: o.semya, lyub: 0 },
    rel: { ildar: 50, natasha: 0, bacha: 0 },
    flags: {}, done: {}, ctrl, log: [], cur: null, fight: null, res: null,
    cnt: {}, squad: [], withMe: null,   // счётчики для достижений, своя скорлупа, кто идёт с тобой
  };
}

// --- Проверки ---------------------------------------------------------------
function gear(k) { return wornIds(S.wear).reduce((a, id) => a + (ITEM[id]?.bonus?.[k] || 0), 0); }
function stat(k) { return (S.st[k] ?? S.rel[k] ?? 0) + (k in STATS ? gear(k) + ((comp() || {}).perk?.b[k] || 0) : 0); }
function chance(chk) {
  const [k, d] = chk;
  return clamp(0.5 + (stat(k) - d) * 0.1, 0.05, 0.95);
}
function chanceBadge(p) {
  const cls = p >= 0.65 ? 'hi' : p >= 0.4 ? 'mid' : 'lo';
  return `<span class="ch ${cls}">${Math.round(p * 100)}%</span>`;
}

// --- Применение эффектов ------------------------------------------------------
function applyFx(fx) {
  const out = [];
  if (!fx) return out;
  if (typeof fx === 'function') { const r = fx(S); return r ? applyFx(r) : out; }
  for (const [k, v] of Object.entries(fx)) {
    if (k === 'flag') [].concat(v).forEach(f => S.flags[f] = true);
    else if (k === 'unflag') [].concat(v).forEach(f => delete S.flags[f]);
    else if (k === 'join') { S.gang = v === true ? S.home : v; log(`Пришился к моталке «${DIST[S.gang].gang}».`); out.push(`<b>Ты теперь в «${DIST[S.gang].gang}»</b>`); }
    else if (k === 'leave') { log(`Отшился от «${DIST[S.gang].gang}».`); S.gang = null; S.rank = 0; }
    else if (k === 'rank') { S.rank = v; log(`Новый ранг: ${RANKS[v]}.`); out.push(`<b>Ранг: ${RANKS[v]}</b>`); AUDIO.ok(); }
    else if (k === 'nick') { S.nick = v; log(`Теперь тебя зовут «${v}».`); out.push(`Погоняло: «${v}»`); }
    else if (k === 'ctrl') for (const [d, o] of Object.entries(v)) { S.ctrl[d] = o; out.push(`${DIST[d].name} теперь под «${DIST[o].gang}»`); }
    else if (k === 'ap') S.ap = Math.max(0, S.ap + v);
    else if (k === 'day') skipDays(v);
    else if (k === 'log') log(v);
    else if (k === 'end') S.ending = v;
    else if (k in S.rel) { S.rel[k] = clamp(S.rel[k] + v, 0, 100); out.push(delta(k, v)); }
    else if (k in S.st) {
      const max = k in STATS ? 10 : k === 'dengi' || k === 'avt' ? 1e6 : 100;
      S.st[k] = clamp(S.st[k] + v, 0, max); out.push(delta(k, v));
    }
  }
  return out.filter(Boolean);
}
function delta(k, v) { return v ? `${NAMES[k]} ${v > 0 ? '+' : ''}${v}` : ''; }
function log(t) { S.log.unshift({ d: dateStr(), t }); S.log.length = Math.min(S.log.length, 150); }
function skipDays(n) { S.day += n; S.ap = AP_PER_DAY; }

// --- Сцены --------------------------------------------------------------------
function play(id) {
  const ev = EV[id];
  if (!ev) { console.warn('нет события', id); return toMap(); }
  S.done[id] = (S.done[id] || 0) + 1;
  S.cur = id; S.res = null;
  if (ev.fight) S.fight = { id, ehp: T(ev.fight.hp), php: 3 };
  if (ev.fx) applyFx(ev.fx);
  if (ev.log) log(T(ev.log));
  save('auto');
  if (ev.card) return card(T(ev.card), render, 2600);
  render();
}

function sceneHead(ev) {
  const where = ev.where ? T(ev.where) : DIST[S.at]?.name || '';
  return `<div class="when">${dateStr()}${where ? ' · ' + where : ''}</div><h2>${T(ev.title) || ''}</h2>`;
}

// --- Подача: печать текста, сцена с персонажами, переходы ----------------------------------
let typing = null;
function typeInto(el, text, done) {
  stopTyping();
  let i = 0;
  typing = { el, text, done, timer: null };
  const step = () => {
    if (!typing) return;
    if (i >= text.length) { typing = null; done && done(); return; }
    const ch = text[i++]; el.textContent = text.slice(0, i);
    if (i % 3 === 0 && ch.trim()) AUDIO.type();
    typing.timer = setTimeout(step, '.!?…'.includes(ch) ? 260 : ',—:'.includes(ch) ? 120 : 26);
  };
  step();
}
function skipTyping() {
  if (!typing) return false;
  clearTimeout(typing.timer); typing.el.textContent = typing.text;
  const d = typing.done; typing = null; d && d(); return true;
}
function stopTyping() { if (typing) { clearTimeout(typing.timer); typing = null; } }

// Реплики: строка = рассказчик (абзацы через пустую строку), ['кто', 'текст'] = персонаж.
// 'кто' — ключ из NPCS или 'hero'; можно 'chuzhoy:Пацан с Перваков', чтобы сменить подпись.
function normLines(x) {
  const out = [];
  for (const l of [].concat(x || '')) {
    if (Array.isArray(l)) out.push(l);
    else String(l).split(/\n\s*\n/).map(s => s.trim()).filter(Boolean).forEach(s => out.push([null, s]));
  }
  return out.length ? out : [[null, '']];
}
function stageHtml(bg) {
  bg = bg || 'dvor';
  const wx = OUTDOOR.includes(bg) ? `<div class="wx wx-${season()}"></div>` : '';
  return `<div class="stage bg-${bg}">${wx}<canvas class="sprite npc hidden" id="spk"></canvas><canvas class="sprite me" id="me"></canvas></div>`;
}
// Оживление сцены: моргание и рот, пока печатается реплика
let stage = { who: null, npc: null, emo: null, heroEmo: null }, stageT = null;
function drawStage(t = 0) {
  const talk = !!typing && t % 2 === 1;
  if ($('#me')) drawHero($('#me'), S.app, S.wear, { emo: stage.heroEmo, blink: t % 31 === 0 && t > 0, mouth: talk && stage.who === 'hero' });
  if (stage.npc && $('#spk')) drawHero($('#spk'), stage.npc.app, stage.npc.wear, { emo: stage.emo, blink: t % 37 === 7, mouth: talk && stage.who !== 'hero' });
}
function stageStart() {
  clearInterval(stageT); let t = 0;
  stageT = setInterval(() => { if (!$('#me')) return clearInterval(stageT); drawStage(++t); }, 140);
}
function setSpeaker(who, emo) {
  const [key, label] = (who || '').split(':');
  const npc = key && key !== 'hero' ? npcOf(key) : null;
  if (npc) stage = { who: key, npc, emo, heroEmo: stage.heroEmo };
  else stage = { ...stage, who: key || null, heroEmo: key === 'hero' ? emo : stage.heroEmo };
  $('#spk').classList.toggle('hidden', !stage.npc);
  $('#spk').classList.toggle('talk', !!npc); $('#me').classList.toggle('talk', key === 'hero');
  $('#me').classList.toggle('dim', !!npc); $('#spk').classList.toggle('dim', key === 'hero');
  drawStage();
  return key === 'hero' ? (S.nick || S.name) : npc ? (label || npc.name) : '';
}

function renderScene() {
  const ev = EV[S.cur];
  if (S.res) return renderResult();
  if (ev.fight) return renderFight(ev);
  const lines = normLines(ev.lines ? T(ev.lines) : T(ev.text));
  const choices = (T(ev.choices) || []).filter(c => !c.if || c.if(S));
  $('#main').innerHTML = `<div class="scene in">${sceneHead(ev)}${stageHtml(T(ev.bg))}
    <div class="say" id="say"><div class="who" id="who"></div><div class="line" id="line"></div><div class="more hidden" id="more">▼</div></div>
    <div class="choices hidden" id="chs">${choices.map((c, i) => choiceBtn(c, i)).join('')}</div></div>`;
  stage = { who: null, npc: null, emo: null, heroEmo: null };
  drawHero($('#me'), S.app, S.wear); stageStart();
  let i = 0;
  const show = () => {
    const [who, t, emo] = lines[i];
    const name = setSpeaker(who, emo);
    $('#who').textContent = name; $('#who').classList.toggle('hidden', !name);
    $('#say').classList.toggle('narr', !who);
    $('#more').classList.add('hidden');
    typeInto($('#line'), t, () => {
      if (i < lines.length - 1) $('#more').classList.remove('hidden');
      else { $('#chs').classList.remove('hidden'); $('#chs').classList.add('in'); }
    });
  };
  $('#say').onclick = $('.stage').onclick = () => { if (skipTyping()) return; if (i < lines.length - 1) { i++; AUDIO.click(); show(); } };
  bindChoices(choices, c => { stopTyping(); doChoice(c); });
  show();
}

// Полноэкранная карточка-переход: глава, дата, судьба
function card(lines, then, ms = 2200) {
  if (typeof __TEST !== 'undefined') return then && then();   // самопроверка: без анимаций
  stopTyping(); AUDIO.whoosh();
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = [].concat(lines).map((l, i) => `<div class="${i ? 'c2' : 'c1'}">${l}</div>`).join('');
  document.body.appendChild(el);
  let done = false;
  const end = () => { if (done) return; done = true; el.classList.add('out'); setTimeout(() => { el.remove(); then && then(); }, 400); };
  el.onclick = end; setTimeout(end, ms);
}

function choiceBtn(c, i) {
  const lock = c.req && !Object.entries(c.req).every(([k, v]) => k === 'dengi' ? S.st.dengi >= v : stat(k) >= v);
  const reqTxt = c.req ? ` <span class="ch lo">нужно: ${Object.entries(c.req).map(([k, v]) => NAMES[k] + ' ' + v).join(', ')}</span>` : '';
  const badge = c.chk ? (c.mini ? '<span class="ch mg">▶ игра</span> ' : '') + chanceBadge(chance(c.chk)) + ` <span class="ch">${NAMES[c.chk[0]]}</span>` : '';
  return `<button class="btn" data-i="${i}" ${lock ? 'disabled' : ''}><span>${T(c.t)}</span><span>${lock ? reqTxt : badge}</span></button>`;
}
function bindChoices(list, fn) {
  document.querySelectorAll('.choices .btn[data-i]').forEach(b => b.onclick = () => { AUDIO.click(); fn(list[+b.dataset.i]); });
}

function doChoice(c, forced) {
  if (c.mini && c.chk && forced === undefined) { stopTyping(); return MINI.run(c.mini, chance(c.chk), ok => doChoice(c, ok)); }
  let branch = c, ok = null;
  if (c.chk) { ok = forced ?? Math.random() < chance(c.chk); branch = ok ? c.ok : c.no; ok ? AUDIO.ok() : AUDIO.no(); }
  const fxs = [...applyFx(c.fx), ...(branch !== c ? applyFx(branch.fx) : [])];
  if (c.cost) S.ap = Math.max(0, S.ap - c.cost);
  const go = T(branch.go !== undefined ? branch.go : c.go);
  const txt = T(branch.txt);
  if (!txt && (go || !fxs.length)) return next(go);   // без текста — сразу дальше, эффекты видны в герое
  S.res = { txt: txt || '', ok, fxs, go };
  save('auto'); render();
}

function renderResult() {
  const r = S.res, ev = EV[S.cur];
  const cls = r.ok === true ? 'ok' : r.ok === false ? 'no' : '';
  const label = r.ok === true ? '✔ Получилось' : r.ok === false ? '✘ Не вышло' : '';
  $('#main').innerHTML = `<div class="scene in ${cls ? 'flash-' + cls : ''}">${ev ? sceneHead(ev) : ''}
    ${label ? `<div class="verdict ${cls}">${label}</div>` : ''}
    <div class="say narr" id="say"><div class="line" id="line"></div></div>
    <div id="after" class="hidden">${r.fxs.length ? `<div class="result ${cls}">${r.fxs.join(' · ')}</div>` : ''}
    <div class="choices"><button class="btn main" id="nx">Дальше</button></div></div></div>`;
  const reveal = () => { $('#after').classList.remove('hidden'); $('#after').classList.add('in'); };
  $('#say').onclick = skipTyping;
  r.txt ? typeInto($('#line'), r.txt, reveal) : reveal();
  $('#nx').onclick = () => { stopTyping(); AUDIO.click(); next(r.go); };
}

function next(go) {
  S.res = null;
  if (S.st.zdor <= 0) return death();
  if (S.ending) return ending();
  if (go) return play(go);
  S.cur = null; S.fight = null;
  toMap();
}

// --- Бой ----------------------------------------------------------------------
function fightOptions(f) {
  const p = T(f.pow);
  const o = [
    { t: 'Ударить первым', chk: ['sila', p], hit: 2, dmg: 12, mini: 'udar' },
    { t: 'Уйти в сторону и подсечь', chk: ['lovk', p], hit: 1, dmg: 6 },
    { t: 'Забазарить, сбить с толку', chk: ['yaz', p + 1], hit: 1, dmg: 8, talk: true },
  ];
  if (f.call && S.gang && S.ctrl[S.at] === S.gang) o.push({ t: 'Свистнуть своих', chk: ['uvazh', 2], call: true, dmg: 4 });
  if (T(f.flee) !== false) o.push({ t: 'Бежать', chk: ['lovk', p - 1], flee: true, dmg: 8 });
  return o;
}
function renderFight(ev) {
  const f = ev.fight, st = S.fight;
  const opts = fightOptions(f);
  const hearts = '■'.repeat(st.php) + '□'.repeat(3 - st.php);
  const enemy = '■'.repeat(Math.max(0, st.ehp));
  const anim = st.anim; st.anim = null;
  $('#main').innerHTML = `<div class="scene ${anim ? 'shake flash-' + (anim === 'hit' ? 'ok' : 'no') : 'in'}">${sceneHead(ev)}
    ${stageHtml(T(ev.bg) || 'noch')}
    <div class="hp"><span>Ты ${hearts} ♥${S.st.zdor}</span><span>${T(f.name)} ${enemy}</span></div>
    <div class="say ${st.msg ? '' : 'narr'}"><div class="line">${st.msg || T(ev.text)}</div></div>
    <div class="choices">${opts.map((c, i) => choiceBtn(c, i)).join('')}</div></div>`;
  const foe = NPCS[T(f.npc) || 'chuzhoy'];
  stage = { who: null, npc: foe, emo: anim === 'hit' ? 'scared' : 'angry', heroEmo: anim === 'hurt' ? 'scared' : 'angry' };
  $('#spk').classList.remove('hidden'); drawStage(); stageStart();
  if (anim) $(anim === 'hit' ? '#spk' : '#me').classList.add('hurt');
  bindChoices(opts, c => fightRound(ev, c));
}
function fightRound(ev, c, forced) {
  if (c.mini && forced === undefined) return MINI.run(c.mini, chance(c.chk), ok => fightRound(ev, c, ok));
  const f = ev.fight, st = S.fight;
  const ok = forced ?? Math.random() < chance(c.chk);
  st.ok = ok;
  if (c.call) { if (ok) return fightEnd(ev, 'win', 'Свистнул — из подъезда вылетели свои. Чужие сразу сдулись.'); }
  if (c.flee) {
    if (ok) return fightEnd(ev, 'flee', 'Ноги унёс. Но пацаны узнают, что ты побежал.');
  }
  if (ok && !c.flee && !c.call) {
    st.ehp -= c.hit; AUDIO.hit(); st.anim = 'hit';
    st.msg = c.talk ? 'Ты что-то ляпнул — они замешкались, и ты этим воспользовался.' : 'Попал. Противник поплыл.';
    if (st.ehp <= 0) return fightEnd(ev, 'win', 'Противник лёг или сбежал. Асфальт твой.');
  } else {
    st.php--; S.st.zdor = clamp(S.st.zdor - c.dmg - rnd(6), 0, 100); AUDIO.hit(); st.anim = 'hurt';
    st.msg = c.flee ? 'Не убежал — догнали и добавили.' : c.call ? 'Никто не вышел. Ты один.' : 'Пропустил. В глазах звёзды.';
    if (S.st.zdor <= 0) return death();
    if (st.php <= 0) return fightEnd(ev, 'lose', 'Тебя сбили с ног и запинали. Лежишь на асфальте.');
  }
  save('auto'); render();
}
function fightEnd(ev, how, msg) {
  const out = T(ev.fight[how]) || (how === 'flee' ? { fx: { uvazh: -5 } } : {});
  const base = how === 'win' ? { avt: 3 } : how === 'lose' ? { uvazh: -3 } : {};
  S.cnt[how] = (S.cnt[how] || 0) + 1; if (how === 'win') S.cnt.wins = (S.cnt.wins || 0) + 1;
  if (comp()) comp().loyal = clamp(comp().loyal + (how === 'win' ? 5 : how === 'flee' ? -10 : -3), 0, 100);
  const fxs = [...applyFx(base), ...applyFx(out.fx)];
  S.fight = null;
  S.res = { txt: msg + (out.txt ? '\n\n' + T(out.txt) : ''), ok: how === 'win', fxs, go: T(out.go) };
  save('auto'); render();
}

// --- День и карта ---------------------------------------------------------------
function sleep() {
  skipDays(1);
  const heal = 8 + (S.st.semya > 50 ? 4 : 0);
  S.st.zdor = clamp(S.st.zdor + heal, 0, 100);
  S.st.mil = clamp(S.st.mil - 3, 0, 100);
  S.at = S.home;
  if (typeof onNewDay === 'function') onNewDay(S);
  if (S.over) return endCareer(S.over.win, S.over.reason);
  save('auto'); save('day');
  card(['Утро', dateStr()], toMap, 1300);
}
function checkStory() {
  for (const ev of Object.values(EV)) {
    const m = ev.mode || 'campaign';
    if (m !== 'any' && m !== S.mode) continue;
    if (ev.trigger && (ev.repeat || !S.done[ev.id]) && ev.trigger(S)) { play(ev.id); return true; }
  }
  return false;
}
function toMap() {
  S.cur = null; view = 'map';
  if (checkStory()) return;
  render();
}

function renderMap() {
  const d = DIST[selDist || S.at];
  const owner = S.ctrl[d.id] ? DIST[S.ctrl[d.id]] : null;
  const rel = !owner ? 'ничья земля' : S.gang === owner.id ? 'твои' : S.home === d.id ? 'твой район' : 'чужие';
  const acts = (S.ap > 0 ? locActions(S, d.id) : []).filter(a => !a.if || a.if(S));
  $('#main').innerHTML = `<div id="mapwrap"><svg id="map"></svg></div>
    <div class="sheet"><h3>${d.name}${S.at === d.id ? ' · ты здесь' : ''}</h3>
    <div class="sub">${owner ? 'Моталка «' + owner.gang + '»' : 'Центр'} — ${rel}. ${d.desc}</div>
    <div class="choices">
      ${S.ap > 0 ? acts.map((c, i) => choiceBtn(c, i)).join('') : '<div class="sub">Сил на сегодня больше нет. Пора домой.</div>'}
      <button class="btn main" id="sleep">Домой, спать (новый день)</button>
    </div></div>`;
  renderMap_(d.id);
  bindChoices(acts, c => { S.at = d.id; S.cur = null; doChoice({ ...c, cost: 1 }); });
  $('#sleep').onclick = () => { AUDIO.click(); sleep(); };
}
function renderMap_(sel) {
  drawMapSvg($('#map'), S.ctrl, S.home, sel, id => { selDist = id; AUDIO.click(); renderMap(); });
}

// --- Экраны героя, журнала, меню -----------------------------------------------
function bar(v, max = 100) { return `<div class="bar"><i style="width:${clamp(v / max * 100, 0, 100)}%"></i></div>`; }
function renderHero() {
  const g = S.gang ? `«${DIST[S.gang].gang}»` : 'не пришит';
  $('#main').innerHTML = `<div class="scene"><div class="herohead"><canvas class="sprite" id="spr"></canvas><div>
    <h2>${S.name}${S.nick ? ' «' + S.nick + '»' : ''}</h2>
    <div class="sub">${lookText(S.app)}.<br>Район: ${DIST[S.home].name}.<br>Моталка: ${g}.<br>Ранг: <b>${RANKS[S.rank]}</b></div></div></div>
    <div class="grid">
      ${Object.keys(STATS).map(k => `<div class="stat">${NAMES[k]}<span class="v">${S.st[k]}${gear(k) ? ' +' + gear(k) : ''}</span>${bar(S.st[k], 10)}</div>`).join('')}
      <div class="stat">Деньги<span class="v">${S.st.dengi} р.</span></div>
      <div class="stat">Авторитет<span class="v">${S.st.avt}</span></div>
      ${Object.keys(METERS).map(k => `<div class="stat">${NAMES[k]}<span class="v">${S.st[k]}</span>${bar(S.st[k])}</div>`).join('')}
      ${Object.keys(RELS).filter(k => S.flags['met_' + k]).map(k => `<div class="stat">${NAMES[k]}<span class="v">${S.rel[k]}</span>${bar(S.rel[k])}</div>`).join('')}
    </div>
    ${S.squad.length ? `<h2 style="margin-top:18px">Твоя скорлупа</h2><div class="choices">${S.squad.map((m, i) => `<div class="item${S.withMe === i ? ' worn' : ''}">
      <canvas class="sprite mini-spr" data-sq="${i}"></canvas><div style="flex:1"><b>${m.nick}</b> <span class="ch hi">${m.perk.name}: ${perkText(m.perk.b)}</span>
      <div class="sub">Верность ${m.loyal}</div>${bar(m.loyal)}</div>
      <button class="btn" data-w="${i}">${S.withMe === i ? 'С тобой' : 'Взять'}</button></div>`).join('')}</div>
      <p class="note">Кого берёшь с собой — его бонус работает во всех проверках. Верность растёт от побед и угощений, падает, если бросаешь своих.</p>` : ''}
    <p class="note">Сила, ловкость, смекалка и язык растут от поступков: качалка, школа, драки, разговоры. «+1» — бонус от одежды и напарника.</p></div>`;
  drawHero($('#spr'), S.app, S.wear);
  document.querySelectorAll('[data-sq]').forEach(c => { const m = S.squad[+c.dataset.sq]; drawHero(c, m.app, m.wear); });
  document.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { AUDIO.click(); S.withMe = S.withMe === +b.dataset.w ? null : +b.dataset.w; save('auto'); renderHero(); });
}

// --- Гардероб ------------------------------------------------------------------------
let wardSlot = 'outer';
function renderWardrobe() {
  const list = SHOP.filter(i => i.slot === wardSlot);
  const worn = id => wardSlot === 'acc' ? S.wear.acc.includes(id) : S.wear[wardSlot] === id;
  const bon = i => i.bonus ? Object.entries(i.bonus).map(([k, v]) => `${NAMES[k]} +${v}`).join(', ') : '';
  $('#main').innerHTML = `<div class="scene"><div class="herohead"><canvas class="sprite" id="spr"></canvas><div>
    <h2>Гардероб</h2><div class="sub">Барахолка у фарцовщика Жоры. Денег: <b>${S.st.dengi} р.</b><br>Некоторые вещи продают только тем, кто в авторитете.</div></div></div>
    <div class="tabs">${Object.entries(SLOTS).map(([k, v]) => `<button class="${k === wardSlot ? 'on' : ''}" data-s="${k}">${v}</button>`).join('')}</div>
    <div class="choices">${list.map((i, n) => {
      const own = S.owned.includes(i.id), lockR = (i.rank || 0) > S.rank;
      const act = own ? (worn(i.id) ? (wardSlot === 'acc' ? 'Снять' : 'Надето') : 'Надеть')
        : lockR ? `с ранга «${RANKS[i.rank]}»` : `Купить ${i.price} р.`;
      const dis = (!own && (lockR || S.st.dengi < i.price)) || (own && worn(i.id) && wardSlot !== 'acc');
      return `<div class="item${worn(i.id) ? ' worn' : ''}"><div><b>${i.name}</b>${bon(i) ? ` <span class="ch hi">${bon(i)}</span>` : ''}
        <div class="sub">${i.desc}</div></div><button class="btn" data-i="${n}" ${dis ? 'disabled' : ''}>${act}</button></div>`;
    }).join('')}</div></div>`;
  drawHero($('#spr'), S.app, S.wear);
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { AUDIO.click(); wardSlot = b.dataset.s; renderWardrobe(); });
  document.querySelectorAll('.item .btn').forEach(b => b.onclick = () => {
    const i = list[+b.dataset.i];
    if (!S.owned.includes(i.id)) { S.st.dengi -= i.price; S.owned.push(i.id); log(`Купил: ${i.name}.`); AUDIO.ok(); }
    else AUDIO.click();
    if (wardSlot === 'acc') S.wear.acc = worn(i.id) ? S.wear.acc.filter(x => x !== i.id) : [...S.wear.acc, i.id];
    else S.wear[wardSlot] = i.id;
    save('auto'); renderTop(); renderWardrobe();
  });
}
function renderLog() {
  $('#main').innerHTML = `<div class="scene"><h2>Журнал</h2><div class="log">
    ${S.log.map(l => `<p><span class="d">${l.d}</span><br>${l.t}</p>`).join('') || '<p>Пока пусто.</p>'}</div></div>`;
}
function renderMenu() {
  const slot = loadRaw('slot1');
  $('#main').innerHTML = `<div class="scene"><h2>Меню</h2><div class="choices">
    <button class="btn" id="sv">Сохранить в слот</button>
    <button class="btn" id="ld" ${slot ? '' : 'disabled'}>Загрузить слот${slot ? ' (' + dateStr(slot.day) + ')' : ''}</button>
    <button class="btn" id="snd">Музыка: ${AUDIO.musicOn() ? 'вкл' : 'выкл'}</button>
    ${S.mode === 'career' ? '<button class="btn" id="jr">Журнал</button>' : ''}
    <button class="btn" id="ng">В главное меню</button></div>
    <p class="note">Игра сохраняется автоматически. Все персонажи вымышлены, совпадения случайны.
    Игра не пропагандирует насилие и криминал: у каждого выбора есть цена.</p></div>`;
  $('#sv').onclick = () => { save('slot1'); AUDIO.ok(); renderMenu(); };
  $('#ld').onclick = () => { S = migrate(loadRaw('slot1')); view = 'map'; render(); };
  $('#snd').onclick = () => { AUDIO.toggleMusic(); renderMenu(); };
  if ($('#jr')) $('#jr').onclick = () => { view = 'log'; render(); };
  $('#ng').onclick = () => { save('auto'); titleScreen(); };
}

function renderTop() {
  const ap = '●'.repeat(S.ap) + '○'.repeat(Math.max(0, AP_PER_DAY - S.ap));
  $('#top').innerHTML = `<span>${dateStr()}</span><span><b>${RANKS[S.rank]}</b></span>
    <span>${S.st.dengi} р.</span><span>♥ ${S.st.zdor}</span><span>${ap}</span>`;
}

function render() {
  $('#top').classList.remove('hidden'); $('#nav').classList.remove('hidden');
  renderTop();
  const inScene = S.cur || S.res;
  $('#nav').classList.toggle('hidden', !!inScene);
  const b4 = $('#nav [data-v="log"], #nav [data-v="tasks"]');   // в карьере вместо журнала — задания
  b4.dataset.v = S.mode === 'career' ? 'tasks' : 'log'; b4.textContent = S.mode === 'career' ? 'Задания' : 'Журнал';
  checkAch();
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
  const BG_TRACK = { kuhnya: 'dom', shkola: 'dom', dk: 'disco', otdel: 'trevoga', pustyr: 'trevoga', noch: 'noch', ostanovka: 'noch' };
  const ev = S.cur && EV[S.cur];
  AUDIO.track(ev && ev.fight && S.fight ? 'fight' : ev ? BG_TRACK[T(ev.bg)] || 'dvor' : view === 'ward' ? 'disco' : 'dvor');
  if (inScene) renderScene();
  else ({ map: renderMap, hero: renderHero, ward: renderWardrobe, log: renderLog, tasks: renderTasks, menu: renderMenu })[view]();
  $('#main').scrollTop = 0;
}

// --- Смерть, концовки ---------------------------------------------------------------
function death() {
  AUDIO.no();
  if (S.mode !== 'campaign') return endCareer(false, 'Погиб на асфальте');
  noteEnding('Погиб на асфальте');
  const auto = loadRaw('day'), slot = loadRaw('slot1');
  $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene"><div class="when">${dateStr()}</div><h2>Конец</h2>
    <div class="txt">Асфальт холодный. Последнее, что ты видишь, — фонарь над подъездом и чьи-то кеды.
    \n${S.name}, ${RANKS[S.rank].toLowerCase()}. Ему было пятнадцать.</div>
    <div class="choices">
      ${auto ? '<button class="btn" id="la">Загрузить начало дня</button>' : ''}
      ${slot ? '<button class="btn" id="ls">Загрузить слот</button>' : ''}
      <button class="btn main" id="ng">Новая игра</button></div></div>`;
  if (auto) $('#la').onclick = () => { S = migrate(auto); view = 'map'; toMap(); };
  if (slot) $('#ls').onclick = () => { S = migrate(slot); view = 'map'; render(); };
  $('#ng').onclick = titleScreen;
}
function ending() {
  const e = ENDINGS[S.ending];
  if (S.mode !== 'campaign') return endCareer(false, e.title);
  noteEnding(e.title);
  $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene"><div class="when">${dateStr()} · концовка</div><h2>${e.title}</h2>
    <div class="txt">${T(e.text)}</div>
    <div class="result">Ранг: ${RANKS[S.rank]} · Авторитет ${S.st.avt} · Совесть ${S.st.sovest} · Семья ${S.st.semya}</div>
    <div class="choices"><button class="btn" id="ls">Загрузить слот</button><button class="btn main" id="ng">Новая игра</button></div></div>`;
  $('#ls').onclick = () => { const s = loadRaw('slot1'); if (s) { S = s; view = 'map'; render(); } };
  $('#ng').onclick = titleScreen;
}

// --- Сохранения -------------------------------------------------------------------
// У карьеры свои слоты (asfalt_c_*), чтобы не затирать кампанию
const key = (slot, mode = S && S.mode) => 'asfalt_' + ({ career: 'c_', surv: 's_' }[mode] || '') + slot;
function save(slot) { try { localStorage.setItem(key(slot), JSON.stringify(S)); } catch (e) {} }
function loadRaw(slot, mode) { try { return JSON.parse(localStorage.getItem(key(slot, mode))); } catch (e) { return null; } }
function dropSave(slot, mode) { try { localStorage.removeItem(key(slot, mode)); } catch (e) {} }

// --- Титул и создание персонажа -------------------------------------------------
// Старые сохранения (до гардероба) получают внешность и одежду по умолчанию
function migrate(s) {
  if (s && !s.cnt) { s.cnt = {}; s.squad = []; s.withMe = null; }
  if (s && !s.app) {
    s.app = { ...DEFAULT_APP }; s.wear = { ...DEFAULT_WEAR, acc: [...DEFAULT_WEAR.acc] };
    s.owned = ITEMS.filter(i => i.start).map(i => i.id); s.mode = 'campaign';
  }
  return s;
}

function titleScreen() {
  const auto = migrate(loadRaw('auto', 'campaign')), car = migrate(loadRaw('auto', 'career')), sv = migrate(loadRaw('auto', 'surv'));
  AUDIO.track('theme');
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="title"><h1>АСФАЛЬТ</h1><div class="s">КАЗАНЬ · 1987</div></div>
    <div class="scene"><div class="choices">
      ${auto && !auto.ending ? `<button class="btn main" id="cont">Продолжить кампанию (${dateStr(auto.day)})</button>` : ''}
      <button class="btn mode" id="new"><b>Кампания${auto && !auto.ending ? ' · заново' : ''}</b><span class="sub">Сюжет. Путь от чушпана до автора</span></button>
      ${car ? `<button class="btn main" id="ccont">Продолжить карьеру: ${car.name}, ${RANKS[car.rank].toLowerCase()} (${dateStr(car.day)})</button>` : ''}
      <button class="btn mode" id="car"><b>Карьера${car ? ' · новая судьба' : ''}</b><span class="sub">Случайная судьба и цель. Сам выбираешь задания. Смерть — конец</span></button>
      ${sv ? `<button class="btn main" id="scont">Продолжить выживание: ${sv.name} (${dateStr(sv.day)})</button>` : ''}
      <button class="btn mode" id="surv"><b>Выживание чушпана${sv ? ' · заново' : ''}</b><span class="sub">Ничей. Трясут каждый день. Дожить до Нового года</span></button>
      <button class="btn mode" id="chron"><b>Летопись судеб</b><span class="sub">Прошлые забеги и открытые вещи</span></button>
      <button class="btn mode" id="achv"><b>Достижения и концовки</b><span class="sub">Что уже открыто</span></button></div>
    <p class="note">16+. Вымышленная история по мотивам событий 1980-х в Казани.
    Все персонажи вымышлены. Карта стилизована.</p></div>`;
  if ($('#cont')) $('#cont').onclick = () => { AUDIO.start(); S = auto; view = 'map'; S.cur || S.res ? render() : toMap(); };
  $('#new').onclick = () => { AUDIO.start(); createHero(); };
  if ($('#ccont')) $('#ccont').onclick = () => { AUDIO.start(); S = car; view = 'map'; S.cur || S.res ? render() : toMap(); };
  $('#car').onclick = () => {
    if (car && !confirm('Текущая судьба будет брошена и попадёт в летопись. Начать новую?')) return;
    if (car) { S = car; return endCareer(false, 'Бросил всё и уехал'); }
    AUDIO.start(); careerNew();
  };
  $('#chron').onclick = chronicle;
  $('#achv').onclick = () => achScreen();
  if ($('#scont')) $('#scont').onclick = () => { AUDIO.start(); S = sv; view = 'map'; S.cur || S.res ? render() : toMap(); };
  $('#surv').onclick = () => {
    if (sv) { if (!confirm('Бросить текущее выживание?')) return; S = sv; return endCareer(false, 'Бросил всё и уехал'); }
    AUDIO.start(); careerNew('surv');
  };
}

// Создание героя: только внешность, одежда из стартовых вещей, район и семья.
// Характеристики не выбираются — у всех по 3, растут в игре (баланс).
function createHero() {
  const app = { ...DEFAULT_APP }, wear = { ...DEFAULT_WEAR, acc: [...DEFAULT_WEAR.acc] };
  const fams = { mother: 'Мать одна, работает на заводе', full: 'Полная семья, отец мастер на заводе', drunk: 'Отец пьёт, дома тяжело' };
  const homes = DISTRICTS.filter(d => d.gang);
  const rows = [
    ...Object.keys(LOOKS).map(k => ({ label: LOOK_NAMES[k], opts: Object.keys(LOOKS[k]), get: () => app[k], set: v => app[k] = v, name: v => LOOKS[k][v] })),
    ...['hat', 'outer', 'shirt'].map(s => ({ label: SLOTS[s], opts: ITEMS.filter(i => i.slot === s && i.start).map(i => i.id),
      get: () => wear[s], set: v => wear[s] = v, name: v => ITEM[v].name })),
  ];
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="preview"><canvas class="sprite big" id="spr"></canvas></div><div class="scene">
    <h2>Кто ты?</h2>
    ${rows.map((r, i) => `<div class="cyc"><span class="lbl">${r.label}</span>
      <button data-c="${i}" data-d="-1">◀</button><span class="val" id="cv${i}"></span><button data-c="${i}" data-d="1">▶</button></div>`).join('')}
    <div class="choices"><button class="btn" id="rnd">Случайная внешность</button></div><br>
    <label>Имя</label><input id="nm" value="Андрей" maxlength="16">
    <label>Район, где ты вырос (там твоя моталка)</label>
    <select id="hm">${homes.map(d => `<option value="${d.id}">${d.name} — «${d.gang}»</option>`).join('')}</select>
    <label>Семья</label><select id="fm">${Object.entries(fams).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <p class="note">Сила, ловкость, смекалка и язык у всех на старте равные. Остальное заработаешь на улице.
    Остальную одежду купишь на барахолке.</p>
    <div class="choices"><button class="btn main" id="go">Начать</button></div></div>`;
  const upd = () => { rows.forEach((r, i) => $('#cv' + i).textContent = r.name(r.get())); drawHero($('#spr'), app, wear); };
  document.querySelectorAll('.cyc button').forEach(b => b.onclick = () => {
    const r = rows[+b.dataset.c], i = r.opts.indexOf(r.get());
    r.set(r.opts[(i + +b.dataset.d + r.opts.length) % r.opts.length]); AUDIO.click(); upd();
  });
  $('#rnd').onclick = () => { rows.forEach(r => r.set(r.opts[rnd(r.opts.length)])); AUDIO.click(); upd(); };
  $('#go').onclick = () => {
    const fam = $('#fm').value;
    S = newState({ name: $('#nm').value.trim() || 'Андрей', app, wear, home: $('#hm').value, fam,
      dengi: fam === 'full' ? 15 : 5, semya: fam === 'drunk' ? 30 : 65 });
    if (fam === 'mother') S.st.sovest += 10;
    log(`${S.name} начинает свою историю. Район — ${DIST[S.home].name}.`);
    save('day'); view = 'map';
    card(['Казань', 'сентябрь 1987', 'Каждый двор — чей-то асфальт'], toMap, 3600);
  };
  upd();
}

function boot() {
  document.querySelectorAll('#nav button').forEach(b => b.onclick = () => { AUDIO.click(); view = b.dataset.v; selDist = null; render(); });
  titleScreen();
}
