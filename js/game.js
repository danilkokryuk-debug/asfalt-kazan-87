// Движок: состояние, сцены, проверки, бои, день, сохранения.
const RANKS = ['Чушпан', 'Скорлупа', 'Супер', 'Молодой', 'Старший', 'Автор'];
const STATS = { sila: 'Сила', lovk: 'Ловкость', um: 'Смекалка', yaz: 'Язык' };
const METERS = { zdor: 'Здоровье', uvazh: 'Уважение своих', mil: 'Внимание милиции', sovest: 'Совесть', semya: 'Семья', lyub: 'Любовь' };
const RELS = { ildar: 'Ильдар (друг)', natasha: 'Наташа', bacha: 'Бача (старший)' };
const NAMES = { ...STATS, ...METERS, ...RELS, dengi: 'Деньги', dol: 'Доллары', avt: 'Авторитет' };
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
    day: 1, ap: AP_PER_DAY, at: o.home, min: 7 * 60, jobs: [],
    points: [], torn: [],
    st: { sila: 3, lovk: 3, um: 3, yaz: 3, zdor: 100, dengi: o.dengi, dol: 0, avt: 0,
          uvazh: 0, mil: 0, sovest: 70, semya: o.semya, lyub: 0 },
    rel: { ildar: 50, natasha: 0, bacha: 0 },
    flags: {}, done: {}, ctrl, log: [], cur: null, fight: null, res: null,
    cnt: {}, squad: [], withMe: null,   // счётчики для достижений, своя скорлупа, кто идёт с тобой
  };
}

// --- Проверки ---------------------------------------------------------------
function gear(k) { return wornIds(S.wear).filter(id => !(S.torn || []).includes(id)).reduce((a, id) => a + (ITEM[id]?.bonus?.[k] || 0), 0); }
function stat(k) { return (S.st[k] ?? S.rel[k] ?? 0) + (k in STATS ? gear(k) + ((comp() || {}).perk?.b[k] || 0) + looksBonus(k) : 0); }
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
    else if (k === 'rank') { if (v > S.rank && typeof toast === 'function') setTimeout(() => toast(`${RANKS[v]}: открылись новые задания`), 1200); S.rank = v; log(`Новый ранг: ${RANKS[v]}.`); out.push(`<b>Ранг: ${RANKS[v]}</b>`); AUDIO.ok(); }
    else if (k === 'nick') { S.nick = v; log(`Теперь тебя зовут «${v}».`); out.push(`Погоняло: «${v}»`); }
    else if (k === 'ctrl') for (const [d, o] of Object.entries(v)) { S.ctrl[d] = o; out.push(`${DIST[d].name} теперь под «${DIST[o].gang}»`); }
    else if (k === 'ap') S.ap = Math.max(0, S.ap + v);
    else if (k === 'unpoint') { const p = S.points.splice(v, 1)[0]; if (p) { log(`Потеряна точка: ${p.name}.`); out.push(`Потеряна точка: ${p.name}`); } }
    else if (k === 'day') skipDays(v);
    else if (k === 'log') log(v);
    else if (k === 'end') S.ending = v;
    else if (k in S.rel) { S.rel[k] = clamp(S.rel[k] + v, 0, 100); out.push(delta(k, v)); }
    else if (k in S.st) {
      const max = k in STATS ? 10 : k === 'dengi' || k === 'avt' || k === 'dol' ? 1e6 : 100;
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
  photo(id);
  if (ev.sfx) AUDIO.sfx && AUDIO.sfx(T(ev.sfx));
  if (ev.fight) AUDIO.sfx && AUDIO.sfx('crowd');
  save('auto');
  if (ev.card) return card(T(ev.card), render, 2600, ev.art);   // art — своя картинка к карточке
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
  const k = SPEED[SET.speed] ?? 1;
  if (!k) { el.textContent = text; done && done(); return; }
  let i = 0;
  typing = { el, text, done, timer: null };
  const step = () => {
    if (!typing) return;
    if (i >= text.length) { typing = null; AUDIO.ret && AUDIO.ret(); done && done(); return; }
    const ch = text[i++]; el.textContent = text.slice(0, i);
    if (i % 3 === 0 && ch.trim()) AUDIO.type();
    typing.timer = setTimeout(step, k * ('.!?…'.includes(ch) ? 260 : ',—:'.includes(ch) ? 120 : 26));
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
// Фоны-картинки из Google Flow: t_* — у каждого задания свой кадр (img/t_*.jpg)
const BG_PHOTO = { dvor: 'bg_dvor', noch: 'bg_noch', ostanovka: 'bg_ostanovka', garazhi: 'bg_garazhi', korobka: 'bg_korobka',
  kuhnya: 'bg_kuhnya', shkola: 'bg_shkola', pustyr: 'bg_pustyr', gazeta: 'bg_gazeta', otdel: 'pl_police', rynok: 'pl_rynok',
  dk: 'pl_dk', pl_kino: 'pl_video', pl_barber: 'pl_barber', pl_resto: 'pl_resto', pl_bar: 'pl_bar', pl_sto: 'pl_sto', pl_bank: 'pl_bank', pl_hosp: 'pl_hosp' };
const bgPhoto = bg => BG_PHOTO[bg] || (/^t_/.test(bg) ? bg : null);
const stageCls = bg => { const f = bgPhoto(bg); return `stage bg-${bg}${f ? ` ph" style="background-image:url(img/${f}.jpg)` : ''}`; };
function stageHtml(bg) {
  bg = bg || 'dvor';
  const wx = OUTDOOR.includes(bg) ? `<div class="wx wx-${season()}"></div>` : '';
  // живые слои поверх картинки: фонарь, пыль, дым, огни дискотеки, телевизор
  const FX = { dvor: 'lamp', noch: 'lamp', ostanovka: 'lamp', garazhi: 'lamp smoke', korobka: 'lamp', kuhnya: 'tv smoke', shkola: 'dust',
    otdel: 'dust', pl_bank: 'dust', pl_hosp: 'dust', pl_barber: 'dust', pl_resto: 'dust lamp', pl_bar: 'smoke lamp', pl_sto: 'smoke lamp',
    dk: 'disco', pl_kino: 'tv dust', rynok: 'dust', gazeta: 'dust' };
  const fx = (FX[bg] || '').split(' ').filter(Boolean).map(f => `<div class="fx fx-${f}"></div>`).join('');
  return `<div class="${stageCls(bg)}">${fx}${wx}<canvas class="sprite npc hidden" id="spk"></canvas><canvas class="sprite me" id="me"></canvas></div>`;
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
// Портреты из Google Flow (img/p_*.jpg). «Чужой» с прозвищем — это уже другой человек, без портрета.
const PORTRAITS = ['mama', 'ildar', 'bacha', 'natasha', 'garipov', 'sedoy', 'zima', 'starsh', 'zavuch', 'chuzhoy'];
const faceOf = who => { const [k, label] = (who || '').split(':'); return PORTRAITS.includes(k) && !label ? k : ''; };   // с прозвищем — уже другой человек
function setSpeaker(who, emo) {
  const [key, label] = (who || '').split(':');
  const npc = key && key !== 'hero' ? npcOf(key) : null;
  if (npc && $('#spk').classList.contains('hidden')) { $('#spk').classList.remove('enter'); void $('#spk').offsetWidth; $('#spk').classList.add('enter'); }
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
    <div class="say" id="say"><div class="who" id="who"></div><div class="face hidden" id="face"></div><div class="line" id="line"></div><div class="more hidden" id="more">▼</div></div>
    <div class="choices hidden" id="chs">${choices.map((c, i) => choiceBtn(c, i)).join('')}</div></div>`;
  stage = { who: null, npc: null, emo: null, heroEmo: null };
  drawHero($('#me'), S.app, S.wear); stageStart();
  let i = 0;
  const show = () => {
    const [who, t, emo] = lines[i];
    const name = setSpeaker(who, emo);
    $('#who').textContent = name; $('#who').classList.toggle('hidden', !name);
    $('#say').classList.toggle('narr', !who);
    const pk = faceOf(who), fc = $('#face');
    if (fc.dataset.k !== pk) { fc.dataset.k = pk; fc.style.backgroundImage = pk ? `url(img/p_${pk}.jpg)` : ''; fc.classList.toggle('hidden', !pk); }
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
function card(lines, then, ms = 2200, scene) {
  if (typeof __TEST !== 'undefined') return then && then();   // самопроверка: без анимаций
  stopTyping(); AUDIO.whoosh();
  const el = document.createElement('div');
  scene = scene === undefined ? sceneFor([].concat(lines).join(' ')) : scene;
  // если уже идёт другая заставка — новая появляется сразу целиком, без проявления (иначе сквозь обе виден экран)
  el.className = 'card' + (scene ? ' art' : '') + (document.querySelector('.card') ? ' instant' : '');
  el.innerHTML = (scene ? artHtml(scene, 'cardart') : '') + [].concat(lines).map((l, i) => `<div class="${i ? 'c2' : 'c1'}">${l}</div>`).join('');
  document.body.appendChild(el);
  if (scene) { artStart(el); ms += 800; }
  let done = false;
  // под непрозрачной заставкой убираем старый экран (выбор персонажа и т.п.), чтобы он нигде не мелькнул
  setTimeout(() => { if (!done && $('#nav').classList.contains('hidden')) $('#main').innerHTML = ''; }, 550);
  // Сначала готовим то, что будет дальше (следующая заставка ляжет поверх, экран — под нами),
  // и только потом плавно растворяемся: без мелькания предыдущего экрана между заставками.
  const end = () => {
    if (done) return; done = true;
    then && then();
    el.style.pointerEvents = 'none';
    requestAnimationFrame(() => { el.classList.add('out'); setTimeout(() => el.remove(), 700); });
  };
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
  if (c.cost) advanceTime(ACT_MIN * c.cost);   // действие занимает часы игрового времени
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
  if (!c.flee && !c.call) AUDIO.sfx && AUDIO.sfx('swish');
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
  afterFight(how, ev);
  const fxs = [...applyFx(base), ...applyFx(out.fx)];
  S.fight = null;
  S.res = { txt: msg + (out.txt ? '\n\n' + T(out.txt) : '') + wearAndTear(), ok: how === 'win', fxs, go: T(out.go) };
  save('auto'); render();
}

// --- День и карта ---------------------------------------------------------------
function sleep() {
  skipDays(1);
  S.min = DAY_START; S.ap = apLeft(); jobsHour(); jobsHour();
  const heal = 6 + (S.st.semya > 50 ? 3 : 0);   // само заживает медленно — травмпункт платный
  S.st.zdor = clamp(S.st.zdor + heal, 0, 100);
  S.st.mil = clamp(S.st.mil - 3, 0, 100);
  S.at = S.home;
  if (typeof onNewDay === 'function') onNewDay(S);
  diaryWrite(S.dayStart || { zdor: S.st.zdor, dengi: S.st.dengi });
  S.dayStart = { zdor: S.st.zdor, dengi: S.st.dengi };
  if (S.over) return endCareer(S.over.win, S.over.reason);
  save('auto'); save('day');
  card(['Утро', dateStr()], toMap, 1300, null);
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
  if (S.min >= DAY_END) return sleep();   // 23:00 — домой, спать
  render();
}

function renderMap() {
  const d = DIST[selDist || S.at];
  const owner = S.ctrl[d.id] ? DIST[S.ctrl[d.id]] : null;
  const rel = !owner ? 'ничья земля' : S.gang === owner.id ? 'твои' : S.home === d.id ? 'твой район' : 'к тебе: ' + repWord(repOf(S, owner.id));
  const acts = (S.ap > 0 ? [...locActions(S, d.id), ...mechActions(S, d.id)] : []).filter(a => !a.if || a.if(S));
  const land = {}; DISTRICTS.forEach(x => { const o = S.ctrl[x.id]; if (o) land[o] = (land[o] || 0) + 1; });
  const legend = Object.entries(land).sort((a, b) => b[1] - a[1]).map(([g, n]) =>
    `<span class="lg${g === S.gang ? ' mine' : ''}"><i style="background:${DIST[g].color}"></i>${DIST[g].gang} ${n}</span>`).join('');
  $('#main').innerHTML = `<div id="mapwrap"><svg id="map"></svg>
      <div class="zoom"><button data-z="1.4">+</button><button data-z="0.7">−</button><button data-z="0">⟲</button></div></div>
    <div class="legend">${legend}</div>
    <div class="sheet"><h3>${d.name}${S.at === d.id ? ' · ты здесь' : ''}</h3>
    <div class="sub">${owner ? 'Моталка «' + owner.gang + '»' : 'Центр'} — ${rel}. ${d.desc}</div>
    ${S.mode === 'career' ? `<div class="result ok">Цель: ${goalOf(S).text} (до ${dateStr(goalOf(S).until)})</div>` : ''}
    <div class="choices">
      ${S.ap > 0 ? jobsHtml(d.id) : ''}
      ${placesIn(d.id).map(p => `<button class="btn place" data-pl="${p.id}"><span><i class="pli" style="background:${PLACE_COL[p.k]}"></i>${p.name}</span><span class="ch">войти</span></button>`).join('')}
      ${S.ap > 0 ? acts.map((c, i) => choiceBtn(c, i)).join('') : '<div class="sub">Поздно. Скоро ночь — пора домой.</div>'}
      <p class="sub">Каждое дело — около 4 часов. ${(S.jobs || []).length ? `❗ Заданий на карте: ${S.jobs.length}` : 'Заданий пока нет — появятся на карте.'}</p>
      <button class="btn main" id="sleep">Домой, лечь спать</button>
    </div></div>`;
  renderMap_(d.id);
  bindChoices(acts, c => walkTo(S.at, d.id, () => { S.at = d.id; S.cur = null; doChoice({ ...c, cost: carSpeed() }); }));
  document.querySelectorAll('[data-pl]').forEach(b => b.onclick = () => openPlace(b.dataset.pl));
  $('#sleep').onclick = () => { AUDIO.click(); sleep(); };
}
function renderMap_(sel) {
  drawMapSvg($('#map'), S.ctrl, S.home, sel, id => { selDist = id; AUDIO.click(); renderMap(); }, S.at, S.jobs);
  document.querySelectorAll('[data-job]').forEach(b => b.onclick = () => { AUDIO.click(); walkTo(S.at, b.closest('.sheet') ? (selDist || S.at) : S.at, () => takeJob(+b.dataset.job)); });
  document.querySelectorAll('.zoom button').forEach(b => b.onclick = e => { e.stopPropagation(); zoomBy(+b.dataset.z); });
}

// --- Экраны героя, журнала, меню -----------------------------------------------
function bar(v, max = 100) { return `<div class="bar"><i style="width:${clamp(v / max * 100, 0, 100)}%"></i></div>`; }
function renderHero() {
  const g = S.gang ? `«${DIST[S.gang].gang}»` : 'не пришит';
  $('#main').innerHTML = `<div class="scene"><div class="herohead"><canvas class="sprite" id="spr"></canvas><div>
    <h2>${S.name}${S.nick ? ' «' + S.nick + '»' : ''}</h2>
    <div class="sub">${lookText(S.app)}.<br>Район: ${DIST[S.home].name}.<br>Моталка: ${g}.<br>Ранг: <b>${RANKS[S.rank]}</b></div></div></div>
    ${typeof fameHtml === 'function' ? fameHtml(S) : ''}
    ${walletHtml()}
    <div class="grid">
      ${Object.keys(STATS).map(k => `<div class="stat">${NAMES[k]}<span class="v">${S.st[k]}${gear(k) ? ' +' + gear(k) : ''}</span>${bar(S.st[k], 10)}</div>`).join('')}
      <div class="stat">Авторитет<span class="v">${S.st.avt}</span></div>
      ${Object.keys(METERS).map(k => `<div class="stat">${NAMES[k]}<span class="v">${S.st[k]}</span>${bar(S.st[k])}</div>`).join('')}
      ${Object.keys(RELS).filter(k => S.flags['met_' + k]).map(k => `<div class="stat">${NAMES[k]}<span class="v">${S.rel[k]}</span>${bar(S.rel[k])}</div>`).join('')}
    </div>
    ${S.squad.length ? `<h2 style="margin-top:18px">Твоя скорлупа</h2><div class="choices">${S.squad.map((m, i) => `<div class="item${S.withMe === i ? ' worn' : ''}">
      <canvas class="sprite mini-spr" data-sq="${i}"></canvas><div style="flex:1"><b>${m.nick}</b> <span class="ch hi">${m.perk.name}: ${perkText(m.perk.b)}</span>
      <div class="sub">Верность ${m.loyal}</div>${bar(m.loyal)}</div>
      <button class="btn" data-w="${i}">${S.withMe === i ? 'С тобой' : 'Взять'}</button></div>`).join('')}</div>
      <p class="note">Кого берёшь с собой — его бонус работает во всех проверках. Верность растёт от побед и угощений, падает, если бросаешь своих.</p>` : ''}
    <h2 style="margin-top:18px">Моталки о тебе</h2>
    <div class="legend" style="background:none;padding:0">${DISTRICTS.filter(x => x.gang && x.id !== S.gang).map(x => { const v = repOf(S, x.id);
      return `<span class="lg"><i style="background:${x.color}"></i>${x.gang}: <b style="color:${v >= 30 ? 'var(--good)' : v <= -30 ? 'var(--bad)' : 'var(--dim)'}">${repWord(v)}</b></span>`; }).join('')}</div>
    ${(S.tapes || []).length ? `<h2 style="margin-top:18px">Кассеты</h2><div class="choices">${S.tapes.map(id => `<button class="btn" data-tp="${id}"><span>${TAPE[id].name}</span><span class="ch ${S.tape === id ? 'hi' : ''}">${S.tape === id ? '▶ играет' : 'включить'}</span></button>`).join('')}
      ${S.tape ? '<button class="btn" data-tp="">Выключить магнитофон</button>' : ''}</div>` : ''}
    <div class="choices" style="margin-top:14px">
      <button class="btn" id="alb"><span>Фотоальбом</span><span class="ch">${(S.album || []).length} фото</span></button>
      <div class="btn"><span>Вкладыши от жвачки</span><span class="ch">${(S.cards || []).length}/${CARDS.length}</span></div>
      ${S.seed ? `<button class="btn" id="shc"><span>Код судьбы: ${fateCode(S.seed)}</span><span class="ch">поделиться</span></button>` : ''}
    </div>
    <p class="note">Сила, ловкость, смекалка и язык растут от поступков: качалка, школа, драки, разговоры. «+1» — бонус от одежды и напарника.</p></div>`;
  $('#alb').onclick = () => { AUDIO.click(); albumScreen(); };
  if ($('#shc')) $('#shc').onclick = () => share(`Асфальт. Казань-87 — сыграй мою судьбу: ${fateCode(S.seed)}\n${location.href}`);
  document.querySelectorAll('[data-tp]').forEach(b => b.onclick = () => { S.tape = b.dataset.tp || null; AUDIO.click(); save('auto'); render(); });
  drawHero($('#spr'), S.app, S.wear);
  document.querySelectorAll('[data-sq]').forEach(c => { const m = S.squad[+c.dataset.sq]; drawHero(c, m.app, m.wear); });
  document.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { AUDIO.click(); S.withMe = S.withMe === +b.dataset.w ? null : +b.dataset.w; save('auto'); renderHero(); });
}

// --- Гардероб ------------------------------------------------------------------------
let wardSlot = 'outer', tryOn = null;
function renderWardrobe() {
  syncRewards();
  const list = [...SHOP, ...rewardItems()].filter(i => i.slot === wardSlot).sort((a, b) => (a.rank || 0) - (b.rank || 0) || (a.cur === '$') - (b.cur === '$') || a.price - b.price);
  const worn = id => wardSlot === 'acc' ? S.wear.acc.includes(id) : S.wear[wardSlot] === id;
  const bon = i => i.bonus ? Object.entries(i.bonus).map(([k, v]) => `${NAMES[k]} +${v}`).join(', ') : '';
  // примерка: показать вещь на герое, даже если она ещё не куплена
  const tr = tryOn && ITEM[tryOn], prev = JSON.parse(JSON.stringify(S.wear));
  if (tr) { if (tr.slot === 'acc') { if (!prev.acc.includes(tr.id)) prev.acc.push(tr.id); } else prev[tr.slot] = tr.id; }
  $('#main').innerHTML = `<div class="scene"><div class="ward-top"><canvas class="sprite big" id="spr"></canvas><div>
    <h2>${tr ? 'Примерка' : 'Гардероб'}</h2>
    ${tr ? `<div class="sub"><b>${tr.name}</b><br>${S.owned.includes(tr.id) ? 'Уже твоё' : (tr.rank || 0) > S.rank ? '🔒 Продадут с ранга «' + RANKS[tr.rank] + '»' : 'Цена: ' + priceTxt(tr)}${bon(tr) ? '<br>' + bon(tr) : ''}</div>
      <button class="btn" id="tryoff" style="margin-top:8px">Снять примерку</button>`
      : `<div class="sub">Барахолка у фарцовщика Жоры. У тебя: <b>${S.st.dengi} р.</b> и <b>$${S.st.dol || 0}</b><br>Нажми на вещь — примеришь. Импорт — за доллары, некоторое — только с ранга.</div>`}</div></div>
    <div class="tabs">${Object.entries(SLOTS).map(([k, v]) => `<button class="${k === wardSlot ? 'on' : ''}" data-s="${k}">${v}</button>`).join('')}</div>
    <div class="choices">${list.map((i, n) => {
      const own = S.owned.includes(i.id), lockR = (i.rank || 0) > S.rank, torn = (S.torn || []).includes(i.id);
      const rc = repairCost(i), rcOk = (i.cur === '$' ? S.st.dol : S.st.dengi) >= rc;
      const act = own && torn ? `Починить ${i.cur === '$' ? '$' + rc : rc + ' р.'}`
        : own ? (worn(i.id) ? (wardSlot === 'acc' ? 'Снять' : 'Надето') : 'Надеть')
        : lockR ? `с ранга «${RANKS[i.rank]}»` : `Купить ${priceTxt(i)}`;
      const dis = own && torn ? !rcOk : (!own && (lockR || !canAfford(i))) || (own && worn(i.id) && wardSlot !== 'acc');
      return `<div class="item${worn(i.id) ? ' worn' : ''}${tryOn === i.id ? ' trying' : ''}${lockR && !own ? ' lockedi' : ''}" data-try="${i.id}">
        <canvas class="sprite mini-spr" data-ic="${i.id}"></canvas>
        <div style="flex:1"><b>${lockR && !own ? '🔒 ' : ''}${i.name}</b>${i.cur === '$' ? ' <span class="ch mid">импорт, $</span>' : ''}${torn ? ' <span class="ch lo">порвано</span>' : ''}${bon(i) ? ` <span class="ch hi">${bon(i)}</span>` : ''}
        <div class="sub">${i.desc}</div></div><button class="btn" data-i="${n}" ${dis ? 'disabled' : ''}>${act}</button></div>`;
    }).join('')}</div></div>`;
  drawHero($('#spr'), S.app, prev, { emo: tr ? 'smile' : null });
  // маленькая иконка вещи на манекене
  document.querySelectorAll('[data-ic]').forEach(c => { const i = ITEM[c.dataset.ic], w = { ...DEFAULT_WEAR, acc: [] };
    if (i.slot === 'acc') w.acc = [i.id]; else w[i.slot] = i.id; drawHero(c, S.app, w); });
  document.querySelectorAll('[data-try]').forEach(d => d.onclick = e => {
    if (e.target.closest('button')) return;
    AUDIO.click(); tryOn = tryOn === d.dataset.try ? null : d.dataset.try; renderWardrobe(); $('#main').scrollTop = 0;
  });
  if ($('#tryoff')) $('#tryoff').onclick = () => { tryOn = null; AUDIO.click(); renderWardrobe(); };
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { AUDIO.click(); wardSlot = b.dataset.s; tryOn = null; renderWardrobe(); });
  document.querySelectorAll('.item .btn').forEach(b => b.onclick = () => {
    const i = list[+b.dataset.i]; tryOn = null;
    if ((S.torn || []).includes(i.id)) { repair(i); AUDIO.ok(); save('auto'); renderTop(); return renderWardrobe(); }
    if (!S.owned.includes(i.id)) { payFor(i); S.owned.push(i.id); log(`Купил: ${i.name}.`); AUDIO.sfx ? AUDIO.sfx('coin') : AUDIO.ok(); }
    else AUDIO.click();
    if (wardSlot === 'acc') S.wear.acc = worn(i.id) ? S.wear.acc.filter(x => x !== i.id) : [...S.wear.acc, i.id];
    else S.wear[wardSlot] = i.id;
    save('auto'); renderTop(); renderWardrobe();
  });
}
let logTab = 'diary';
function renderLog() {
  const list = logTab === 'diary' ? (S.diary || []) : S.log;
  $('#main').innerHTML = `<div class="scene"><h2>${logTab === 'diary' ? 'Дневник' : 'Журнал событий'}</h2>
    <div class="tabs"><button data-l="diary" class="${logTab === 'diary' ? 'on' : ''}">Дневник</button><button data-l="log" class="${logTab === 'log' ? 'on' : ''}">События</button></div>
    <div class="log ${logTab === 'diary' ? 'diary' : ''}">
    ${list.map(l => `<p><span class="d">${l.d}</span><br>${l.t}</p>`).join('') || '<p>Пока пусто. Записи появятся в конце дня.</p>'}</div></div>`;
  document.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { logTab = b.dataset.l; AUDIO.click(); renderLog(); });
}
function renderMenu() {
  $('#main').innerHTML = `<div class="scene"><h2>Меню</h2><div class="choices">
    <button class="btn" id="sv">Сохранения (5 слотов)</button>
    <button class="btn" id="st">Настройки</button>
    <button class="btn" id="snd">Музыка: ${AUDIO.musicOn() ? 'вкл' : 'выкл'}</button>
    <button class="btn" id="mag">📼 Магнитофон</button>
    ${S.mode === 'career' ? '<button class="btn" id="jr">Журнал</button>' : ''}
    <button class="btn" id="ach">Достижения</button>
    <button class="btn" id="ng">В главное меню</button></div>
    <p class="note">Игра сохраняется автоматически. Все персонажи вымышлены, совпадения случайны.
    Игра не пропагандирует насилие и криминал: у каждого выбора есть цена.</p></div>`;
  const back = () => { view = 'menu'; render(); };
  $('#sv').onclick = () => { AUDIO.click(); slotsScreen(back); };
  $('#st').onclick = () => { AUDIO.click(); settingsScreen(back); };
  $('#ach').onclick = () => { AUDIO.click(); achScreen(back); };
  $('#snd').onclick = () => { AUDIO.toggleMusic(); typeof songCue === 'function' && songCue(songPlace()); renderMenu(); };
  $('#mag').onclick = () => { AUDIO.click(); magScreen(() => { view = 'menu'; render(); }); };
  if ($('#jr')) $('#jr').onclick = () => { view = 'log'; render(); };
  $('#ng').onclick = () => { save('auto'); titleScreen(); };
}

function renderTop() {
  const night = S.min >= 20 * 60;
  $('#top').innerHTML = `<span>${dateStr()}</span><span class="clock${night ? ' night' : ''}">${night ? '☾' : '☀'} ${clock()}</span>
    <button class="tp" id="tp">${timePaused ? '▶' : '❚❚'}</button>
    <span><b>${RANKS[S.rank]}</b></span><span>${S.st.dengi} р.${S.st.dol ? ' · $' + S.st.dol : ''}</span><span>♥ ${S.st.zdor}</span>`;
  $('#tp').onclick = () => { timePaused = !timePaused; AUDIO.click(); renderTop(); };
}

function render() {
  $('#top').classList.remove('hidden'); $('#nav').classList.remove('hidden');
  renderTop();
  const inScene = S.cur || S.res;
  $('#nav').classList.toggle('hidden', !!inScene);
  if (view === 'tasks') view = 'map';   // задания теперь маячки на карте
  checkAch(); typeof fameCheck === 'function' && fameCheck();
  setTimeout(() => tutorial(S.cur || S.res ? 'scene' : view), 450);
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
  const BG_TRACK = { kuhnya: 'dom', shkola: 'dom', dk: 'disco', otdel: 'trevoga', pustyr: 'trevoga', noch: 'noch', ostanovka: 'noch' };
  const ev = S.cur && EV[S.cur];
  const tape = !ev && S.tape && TAPE[S.tape];   // кассета играет везде, кроме сцен
  if (tape && AUDIO.tape) AUDIO.tape(tape.spec);
  else AUDIO.track(ev && ev.fight && S.fight ? 'fight' : ev ? BG_TRACK[T(ev.bg)] || 'dvor' : view === 'ward' ? 'disco' : season() === 'winter' ? 'zima' : 'dvor');
  if (typeof songCue === 'function') songCue(songPlace());   // настоящие песни с телефона, если добавлены
  if (AUDIO.ambience) AUDIO.ambience(ev ? T(ev.bg) || 'dvor' : view === 'map' ? (season() === 'winter' ? 'pustyr' : 'dvor') : null);
  if (inScene) renderScene();
  else ({ map: renderMap, hero: renderHero, ward: renderWardrobe, log: renderLog, tasks: renderTasks, menu: renderMenu, place: renderPlace })[view]();
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
function save(slot) { try { S.savedAt = Date.now(); localStorage.setItem(key(slot), JSON.stringify(S)); } catch (e) {} }
function loadRaw(slot, mode) { try { return JSON.parse(localStorage.getItem(key(slot, mode))); } catch (e) { return null; } }
function dropSave(slot, mode) { try { localStorage.removeItem(key(slot, mode)); } catch (e) {} }

// --- Титул и создание персонажа -------------------------------------------------
// Старые сохранения (до гардероба) получают внешность и одежду по умолчанию
function migrate(s) {
  if (s && !s.cnt) { s.cnt = {}; s.squad = []; s.withMe = null; }
  if (s && s.min == null) { s.min = 7 * 60; s.jobs = []; }
  if (s && !s.points) {
    s.points = s.flags.income ? [{ name: 'Старые точки', amt: s.flags.income }] : []; delete s.flags.income;
    s.torn = []; s.st.dol = s.st.dol || 0;
  }
  if (s && !s.app) {
    s.app = { ...DEFAULT_APP }; s.wear = { ...DEFAULT_WEAR, acc: [...DEFAULT_WEAR.acc] };
    s.owned = ITEMS.filter(i => i.start).map(i => i.id); s.mode = 'campaign';
  }
  return s;
}

// Выбор режима (главное меню — titleScreen в menu.js)
function playScreen() {
  const auto = migrate(loadRaw('auto', 'campaign')), car = migrate(loadRaw('auto', 'career')), sv = migrate(loadRaw('auto', 'surv'));
  AUDIO.track('theme');
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene in"><h2>Выбери режим</h2><div class="choices">
      ${auto && !auto.ending ? `<button class="btn main" id="cont">Продолжить кампанию (${dateStr(auto.day)})</button>` : ''}
      <button class="btn mode" id="new"><b>Кампания${auto && !auto.ending ? ' · заново' : ''}</b><span class="sub">Сюжет. Путь от чушпана до автора</span></button>
      ${car ? `<button class="btn main" id="ccont">Продолжить карьеру: ${car.name}, ${RANKS[car.rank].toLowerCase()} (${dateStr(car.day)})</button>` : ''}
      <button class="btn mode" id="car"><b>Карьера${car ? ' · новая судьба' : ''}</b><span class="sub">Случайная судьба и цель. Сам выбираешь задания. Смерть — конец</span></button>
      ${sv ? `<button class="btn main" id="scont">Продолжить выживание: ${sv.name} (${dateStr(sv.day)})</button>` : ''}
      <button class="btn mode" id="surv"><b>Выживание чушпана${sv ? ' · заново' : ''}</b><span class="sub">Ничей. Трясут каждый день. Дожить до Нового года</span></button>
      <button class="btn" id="back">Назад</button></div></div>`;
  $('#back').onclick = () => { AUDIO.click(); titleScreen(); };
  if ($('#cont')) $('#cont').onclick = () => { AUDIO.start(); S = auto; view = 'map'; S.cur || S.res ? render() : toMap(); };
  $('#new').onclick = () => { AUDIO.start(); createHero(); };
  if ($('#ccont')) $('#ccont').onclick = () => { AUDIO.start(); S = car; view = 'map'; S.cur || S.res ? render() : toMap(); };
  $('#car').onclick = () => {
    if (car && !confirm('Текущая судьба будет брошена и попадёт в летопись. Начать новую?')) return;
    if (car) { S = car; return endCareer(false, 'Бросил всё и уехал'); }
    AUDIO.start(); careerNew();
  };
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
    card(['Казань', 'сентябрь 1987'], () =>
      card(['Каждый двор', '— чей-то асфальт', 'Кто не с нами — тот чушпан'], toMap, 3400, 'dvor'), 3000, 'kazan');
  };
  upd();
}

function boot() {
  document.querySelectorAll('#nav button').forEach(b => b.onclick = () => { AUDIO.click(); view = b.dataset.v; selDist = null; render(); });
  timeStart();
  titleScreen();
}
