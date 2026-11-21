// Пейджер и сотовый в девяностых: сообщения приходят сами — задания, войны кланов, семья, бригада, люди из власти.
// Значок 📟 в углу карты/героя с числом новых. Нажми сообщение — поедешь на место (или перезвонишь, если есть «Моторола»).
// Сообщения живут два дня. Без «Моторолы» — пейджер (только читать и ехать), с ней — сотовый (можно решить вопрос по телефону).
const PAGER_MAX = 12;
const hasPhone = S => (S.owned || []).includes('a_9_trubka');
function pagerPush(S, m) {
  if (!S || typeof era90 !== 'function' || !era90(S)) return;
  S.pg = S.pg || []; if (m.key && S.pg.some(x => x.key === m.key)) return;
  S.pg.unshift({ id: (S.pgN = (S.pgN || 0) + 1), day: S.day, min: S.min, read: false, ...m });
  S.pg = S.pg.slice(0, PAGER_MAX);
  if (typeof __TEST === 'undefined') { try { AUDIO.sfx && AUDIO.sfx('coin'); } catch (e) {} toast(`${hasPhone(S) ? '📱' : '📟'} ${m.from}: ${m.text.slice(0, 48)}`); }
}
const pagerLive = S => (S.pg || []).filter(m => S.day - m.day <= 2);
// значок поверх экрана: только в девяностых и не во время сцены
function pagerUpdate() {
  let b = document.getElementById('pager');
  const show = typeof S !== 'undefined' && S && era90(S) && !S.cur && !S.res && (view === 'map' || view === 'hero') && !S.ending;
  if (!show) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('button'); b.id = 'pager'; b.onclick = e => { e.stopPropagation(); pagerScreen(); }; document.body.appendChild(b); }
  const n = pagerLive(S).filter(m => !m.read).length;
  b.innerHTML = `${hasPhone(S) ? '📱' : '📟'}${n ? `<i>${n}</i>` : ''}`;
}
{ const r = render; render = (...a) => { r(...a); pagerUpdate(); }; }
function pagerScreen() {
  const b = document.getElementById('pager'); if (b) b.remove();
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  const list = pagerLive(S), phone = hasPhone(S);
  $('#main').innerHTML = `<div class="scene in"><h2>${phone ? '📱 Сотовый «Моторола»' : '📟 Пейджер'}</h2>
    <p class="sub">${phone ? 'Можно перезвонить и решить вопрос, не выезжая (не всё).' : 'Пейджер только принимает. Чтобы перезванивать — купи «Моторолу» (гардероб, аксессуары).'}</p>
    <div class="pg-screen">${list.length ? list.map(m => `<div class="pg-msg${m.read ? '' : ' new'}"><div class="pg-h">${dateStr(m.day).replace(/ \d{4}$/, '')} · ${m.from.toUpperCase()}</div>
      <div class="pg-t">${m.text.toUpperCase()}</div>${m.act ? `<button class="btn" data-pg="${m.id}">${phone && m.call ? 'Перезвонить' : m.btn || 'Поехать'}</button>` : ''}</div>`).join('') : '<div class="pg-t">НЕТ СООБЩЕНИЙ</div>'}</div>
    <div class="choices"><button class="btn" id="bk">Назад</button></div></div>`;
  list.forEach(m => m.read = true);
  $('#bk').onclick = () => { view = view === 'hero' ? 'hero' : 'map'; render(); };
  document.querySelectorAll('[data-pg]').forEach(x => x.onclick = () => { const m = S.pg.find(y => y.id === +x.dataset.pg); if (!m) return;
    S.pg = S.pg.filter(y => y !== m); pagerAct(m, phone && m.call); });
}
function pagerAct(m, byPhone) {
  const [k, v] = String(m.act).split(':');
  if (byPhone && m.call) { const r = m.call; applyFx(r.fx || {}); log(r.txt); toast(r.txt); view = 'map'; return render(); }
  if (k === 'job') { const j = (S.jobs || []).find(x => x.uid === +v); if (!j) { toast('Опоздал — уже без тебя'); view = 'map'; return render(); } return takeJob(j.uid); }
  if (k === 'ev') { advanceTime(ACT_MIN); return play(v); }
  if (k === 'scr') return ({ fam: () => famScreen(), vl: () => vlScreen(), brig: () => brigScreen(), case: () => caseScreen(), map: () => { view = 'map'; render(); } })[v]();
}
// новые задания в девяностых приходят на пейджер
{ const jh = jobsHour; jobsHour = () => { const n0 = (S.jobs || []).length; jh(); const j = (S.jobs || [])[S.jobs.length - 1];
  if (S.jobs && S.jobs.length > n0 && j && era90(S)) pagerPush(S, { from: TPL[j.id].special ? 'Особое' : 'Свои', text: `${TPL[j.id].title(j.p)} · ${DIST[j.d].name}`, act: 'job:' + j.uid, key: 'job' + j.uid }); }; }
// раз в неделю: родня, люди из власти, клановые новости
function pagerWeek(S) {
  if (!era90(S)) return;
  if (Math.random() < 0.5) pagerPush(S, pick([
    { from: MOM(S) === 'мама' ? 'Мама' : 'Мать', text: 'Сынок, позвони. Сердце что-то болит.', act: 'scr:fam', btn: 'Навестить', call: { txt: 'Ты позвонил маме. Голос у неё сразу стал другим.', fx: { semya: 6 } } },
    ...(S.flags.zhena ? [{ from: GIRLS[S.flags.zhena], text: 'Ты где? Ужин остыл. Опять.', act: 'scr:fam', btn: 'Домой', call: { txt: 'Ты позвонил жене: «Скоро буду». Она не верит, но улыбается.', fx: { lyub: 4 } } }] : []),
    { from: 'УВД', text: 'Генерал ждёт. Конверт не забудь.', act: 'scr:vl', btn: 'К влиянию' },
    { from: 'Барон', text: 'Есть тема. Подъезжай в «Акчарлак».', act: 'scr:vl', btn: 'К влиянию' },
  ]));
}
