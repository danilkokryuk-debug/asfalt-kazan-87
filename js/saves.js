// Несколько игр сразу: у каждой игры своя ячейка в «Сохранениях» (S.gid — номер игры, S.slot — её ячейка).
// Автосохранение пишет и в «Продолжить», и в ячейку своей игры. Новая игра не стирает старую — та остаётся в ячейке.
// В «Сохранениях» можно переключаться между играми; ручное «Сохранить в слот» работает как раньше.
(() => {
  if (typeof __TEST !== 'undefined') return;
  const gidNew = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  // найти ячейку этой игры или свободную
  function slotFor(s) {
    for (let i = 0; i < SLOTS_N; i++) { const x = slotGet(i); if (x && x.gid === s.gid) return i; }
    if (s.slot != null && !slotGet(s.slot)) return s.slot;
    for (let i = 0; i < SLOTS_N; i++) if (!slotGet(i)) return i;
    return null;
  }
  let warned = false;
  function mirror(s) {
    if (!s || s.mode !== 'campaign' || s.flags && s.flags.preview) return;
    s.gid = s.gid || gidNew();
    const i = slotFor(s);
    if (i == null) { if (!warned) { warned = true; toast('Все ячейки сохранений заняты — эта игра сохраняется только в «Продолжить»'); } return; }
    s.slot = i;
    try { localStorage.setItem(slotKey(i), JSON.stringify(s)); } catch (e) {}
  }
  const sv = save; save = (slot, ...r) => { if (slot === 'auto' && S) { S.gid = S.gid || gidNew(); mirror(S); } return sv(slot, ...r); };

  // «Новая игра»: текущая остаётся в своей ячейке, ничего не стирается
  const ps = playScreen; playScreen = (...a) => { ps(...a);
    const nb = $('#new'); if (!nb) return;
    const auto = migrate(loadRaw('auto', 'campaign'));
    if (auto && !auto.ending) { const sub = nb.querySelector('.sub'); nb.querySelector('b').textContent = 'Новая игра';
      if (sub) sub.textContent += ' · текущая останется в «Сохранениях»'; }
    nb.onclick = () => {
      if (auto && !auto.ending) { auto.gid = auto.gid || gidNew(); mirror(auto); if (auto.slot == null && !confirm('Ячейки сохранений заняты — текущая игра пропадёт. Начать новую?')) return;
        if (auto.slot != null) toast(`Текущая игра — в «Сохранениях», ячейка ${auto.slot + 1}`); }
      AUDIO.start(); (typeof MSK !== 'undefined' && MSK && typeof mskCreate === 'function' ? mskCreate : createHero)();
    };
  };
  // новая игра — новый номер игры, без старой ячейки
  { const ns = newState; newState = (...a) => { const s = ns(...a); s.gid = gidNew(); delete s.slot; return s; }; }

  // экран сохранений: пометить игру, которая идёт сейчас; перед загрузкой другой — текущую сохранить в её ячейку
  const ss = slotsScreen; slotsScreen = (...a) => { ss(...a);
    const cur = S && S.gid ? S.gid : (migrate(loadRaw('auto', 'campaign')) || {}).gid;
    for (let i = 0; i < SLOTS_N; i++) { const x = slotGet(i), b = document.querySelector(`[data-ld="${i}"]`);
      if (x && cur && x.gid === cur && b) { const t = b.closest('.slot').querySelector('b'); if (t) t.insertAdjacentHTML('afterend', ' <span class="ch hi">▶ идёт сейчас</span>'); } }
    document.querySelectorAll('[data-ld]').forEach(b => { const ld = b.onclick; b.onclick = e => { if (S && S.mode === 'campaign') mirror(S); ld(e); }; });
    const note = document.querySelector('.scene .note'); if (note) note.textContent = 'Каждая игра сама сохраняется в свою ячейку. Начни новую — старая останется здесь, переключайся когда захочешь.';
  };
})();
