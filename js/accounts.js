// Аккаунты по никнейму + «Что нового» и «Что будет дальше» (анонсы и пожелания игроков, видны всем).
// Игрок выбирает уникальный ник. За ним закреплён скрытый код в браузере (asfalt_id) — его не видит никто, даже сам игрок.
// Сервер — Supabase (таблицы и функции: tools/supabase.sql). Пока ACC_CFG пустой, ник хранится только на устройстве
// и займётся на сервере при первом запуске после подключения.
const ACC_CFG = { url: '', key: '' };   // Supabase → Project Settings → API: Project URL и anon public key
const ACC_ON = !!(ACC_CFG.url && ACC_CFG.key);
const NICK_RE = /^[A-Za-zА-Яа-яЁё0-9_.-]{3,16}$/;
const accGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const accSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
function accSecret() {
  let s = accGet('asfalt_id');
  if (!s) { const a = new Uint8Array(24); (self.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 256);
    s = [...a].map(b => b.toString(16).padStart(2, '0')).join(''); accSet('asfalt_id', s); }
  return s;
}
const accNick = () => accGet('asfalt_nick');
async function accRpc(fn, args) {
  if (!ACC_ON) return null;
  try { const r = await fetch(`${ACC_CFG.url}/rest/v1/rpc/${fn}`, { method: 'POST', cache: 'no-store',
      headers: { apikey: ACC_CFG.key, Authorization: 'Bearer ' + ACC_CFG.key, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    return r.ok ? r.json() : null; } catch (e) { return null; }
}
const escH = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// при запуске: подтвердить ник на сервере (или занять тот, что выбран офлайн)
async function accSync() {
  if (!ACC_ON || typeof __TEST !== 'undefined') return;
  const r = await accRpc('claim_nick', { p_nick: accNick(), p_secret: accSecret() });
  if (typeof r !== 'string') return;
  if (r.startsWith('ok:')) { accSet('asfalt_nick', r.slice(3)); accSet('asfalt_nick_pending', null); }
  else if (r === 'taken' && accGet('asfalt_nick_pending')) { accSet('asfalt_nick', null); accSet('asfalt_nick_pending', null); }   // офлайн-ник заняли — выберет новый
}
const accReady = accSync();

// экран выбора ника — один раз, перед меню
function nickScreen(done) {
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene in" data-raw><h2>Твой ник</h2>
    <p class="note">Ник закрепится за тобой навсегда и больше ни у кого не повторится. Его увидят другие игроки — например, под пожеланиями.</p>
    <label>Ник: 3–16 букв или цифр</label><input id="nk" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false">
    <div class="sub" id="nkm"></div>
    <div class="choices"><button class="btn main" id="nkgo">Занять ник</button></div></div>`;
  const inp = $('#nk'), msg = t => $('#nkm').innerHTML = t;
  let tm; inp.oninput = () => { clearTimeout(tm); const v = inp.value.trim();
    if (!v) return msg(''); if (!NICK_RE.test(v)) return msg('<span class="lo">Только буквы, цифры, _ . -, от 3 до 16</span>');
    if (ACC_ON) tm = setTimeout(async () => { const f = await accRpc('nick_free', { p_nick: v }); if (inp.value.trim() === v && f != null) msg(f ? '<span class="hi">Свободен</span>' : '<span class="lo">Занят</span>'); }, 400); };
  $('#nkgo').onclick = async () => {
    const v = inp.value.trim(); if (!NICK_RE.test(v)) return msg('<span class="lo">Только буквы, цифры, _ . -, от 3 до 16</span>');
    AUDIO.click();
    if (!ACC_ON) { accSet('asfalt_nick', v); accSet('asfalt_nick_pending', '1'); return done(); }
    $('#nkgo').disabled = true; msg('Проверяю…');
    const r = await accRpc('claim_nick', { p_nick: v, p_secret: accSecret() });
    $('#nkgo').disabled = false;
    if (typeof r === 'string' && r.startsWith('ok:')) { accSet('asfalt_nick', r.slice(3)); return done(); }
    if (r === 'taken') return msg('<span class="lo">Этот ник уже занят. Придумай другой.</span>');
    if (r === 'bad') return msg('<span class="lo">Такой ник нельзя.</span>');
    accSet('asfalt_nick', v); accSet('asfalt_nick_pending', '1'); done();   // нет сети — займём при следующем запуске
  };
  inp.focus();
}
// меню: сначала ник (один раз), внизу — ник и версия (по нажатию — «Что нового»)
{ const ts = titleScreen; titleScreen = (...a) => {
  if (splashDone && !accNick() && typeof __TEST === 'undefined' && !(S && S.flags && S.flags.preview)) return accReady.then(() => accNick() ? titleScreen(...a) : nickScreen(() => titleScreen(...a)));
  ts(...a);
  const st = $('#stats'); if (st) { st.innerHTML = statsHtml(); st.classList.add('verlink'); st.onclick = e => { e.stopPropagation(); if (!splashDone) return; AUDIO.click(); newsScreen('new'); }; }
}; }
statsHtml = () => `${accNick() ? `👤 ${escH(accNick())} · ` : ''}Версия ${APP_VER} · <u>что нового</u>`;

// прогресс — на сервер не чаще раза в 5 минут (смотреть: Supabase → players)
{ const sv = save; let last = 0; save = (slot, ...r) => { sv(slot, ...r);
  if (!ACC_ON || !S || Date.now() - last < 300000) return; last = Date.now();
  let m = {}; try { m = metaGet(); } catch (e) {}
  accRpc('save_progress', { p_secret: accSecret(), p_progress: { v: APP_VER, city: CITY, date: dateStr(), rank: S.rank, gang: S.gang, ending: S.ending || null,
    kazan: !!m.kazanDone, moscow: !!m.mskDone, ends: (m.ends || []).length } });
}; }

// ---------------- «Что нового» и «Что будет дальше» ----------------
// Новое обновление — новая запись В НАЧАЛО списка. img — картинка из img/ (без .jpg).
const NEWS = [
  { ver: '1.9.1', title: 'Ники, ролик и Москва без казанских повторов', items: [
    { t: 'Ники игроков', d: 'У каждого теперь свой ник — он закреплён за тобой и больше ни у кого не повторится.' },
    { t: 'Ролик Москвы', d: 'Вступление теперь показывается при каждом входе в Москву, в полном качестве и без подтормаживаний.', img: 't_m_kreml' },
    { t: 'Москва отдельно', d: 'Свои люди, свои заказы и уличные встречи, свои заведения — никаких казанских историй в Москве.', img: 't_m_rizhsky' },
    { t: 'Что нового', d: 'Нажми на версию внизу меню — здесь будут все обновления, анонсы и пожелания игроков.' },
  ] },
  { ver: '1.9.0', title: 'Москва', items: [
    { t: 'Вторая кампания: Москва 1985–1998', d: 'Открывается после прохождения Казани. Лимитчик из Казани в большом городе: три пути — улица, Петровка или райком.', img: 't_m_metro' },
    { t: 'Москва глазами героя', d: 'Арбат и любера, Рижский рынок, «Метрополь», Белый дом в 1991 и 1993, Лужники, Чёрный вторник, Рублёвка.', img: 't_m_belyi1991' },
    { t: 'Четыре концовки', d: 'Своя для каждого пути — и одна для тех, кто так и не выбрал.', img: 't_m_strelka' },
  ] },
];
const NEXT = [
  { t: 'Киев', d: 'Третий город. Откроется после прохождения Москвы. Пока в разработке.' },
  { t: 'Москва: больше жизни на карте', d: 'Новые лица, заведения и истории в каждом районе.' },
];
let newsTab = 'new';
function newsScreen(tab) {
  newsTab = tab || newsTab;
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const tabs = `<div class="tabs nw-tabs"><button class="${newsTab === 'new' ? 'on' : ''}" data-nt="new">Что нового</button><button class="${newsTab === 'next' ? 'on' : ''}" data-nt="next">Что будет дальше</button></div>`;
  const card = (x, img) => `<div class="nw-item">${img ? `<div class="nw-img" style="background-image:url('img/${img}.jpg')"></div>` : ''}<b>${x.t}</b><div class="sub">${x.d}</div></div>`;
  const body = newsTab === 'new'
    ? NEWS.map((n, i) => `<div class="nw-ver${i ? ' old' : ''}"><h3>Версия ${n.ver}${i ? '' : ' <span class="ch hi">сейчас</span>'}</h3><div class="sub">${n.title}</div>${n.items.map(x => card(x, x.img)).join('')}</div>`).join('')
    : `<h3>Анонсы</h3>${NEXT.map(x => card(x)).join('')}
       <h3>Пожелания игроков</h3>
       ${ACC_ON ? `<textarea id="wtx" maxlength="300" placeholder="Что бы ты хотел увидеть в следующем обновлении?"></textarea>
         <div class="choices"><button class="btn main" id="wgo">Отправить</button></div><div class="sub" id="wmsg"></div>` : '<p class="note">Пожелания скоро можно будет оставлять прямо здесь.</p>'}
       <div id="wlist" class="nw-wishes">${ACC_ON ? '<div class="sub">Загружаю…</div>' : ''}</div>`;
  $('#main').innerHTML = `<div class="scene in nw" data-raw><h2>Обновления</h2>${tabs}${body}<div class="choices"><button class="btn" id="nwb">Назад</button></div></div>`;
  document.querySelectorAll('[data-nt]').forEach(b => b.onclick = () => { AUDIO.click(); newsScreen(b.dataset.nt); });
  $('#nwb').onclick = () => { AUDIO.click(); titleScreen(); };
  if (newsTab === 'next' && ACC_ON) {
    wishLoad();
    $('#wgo').onclick = async () => {
      const t = $('#wtx').value.trim(); if (t.length < 3) return;
      if (!accNick()) return $('#wmsg').textContent = 'Сначала выбери ник.';
      $('#wgo').disabled = true; const r = await accRpc('add_wish', { p_secret: accSecret(), p_text: t }); $('#wgo').disabled = false;
      $('#wmsg').textContent = r === 'ok' ? 'Спасибо! Пожелание видно всем.' : r === 'limit' ? 'Не больше трёх пожеланий в день.' : r === 'noacc' ? 'Ник ещё не подтверждён — нужен интернет.' : 'Не получилось отправить. Попробуй позже.';
      if (r === 'ok') { $('#wtx').value = ''; wishLoad(); }
    };
  }
}
async function wishLoad() {
  let list = null;
  try { const r = await fetch(`${ACC_CFG.url}/rest/v1/wishes?select=nick,text,created_at&order=id.desc&limit=60`, { cache: 'no-store', headers: { apikey: ACC_CFG.key, Authorization: 'Bearer ' + ACC_CFG.key } }); if (r.ok) list = await r.json(); } catch (e) {}
  const el = $('#wlist'); if (!el) return;
  el.innerHTML = !list ? '<div class="sub">Нет связи с сервером.</div>' : !list.length ? '<div class="sub">Пока пусто — будь первым.</div>'
    : list.map(w => `<div class="nw-wish"><b>${escH(w.nick)}</b> <span class="ch">${new Date(w.created_at).toLocaleDateString('ru-RU')}</span><div>${escH(w.text)}</div></div>`).join('');
}
