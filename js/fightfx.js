// Драка как сцена: шкалы здоровья, противник со своим лицом (по названию драки), выпад атакующего,
// искры, «БАХ!», цифры урона, вспышка. После драки на герое — синяк или пластырь, пока не заживёт.
// Анимации — только transform/opacity (не нагружают телефон).
{ const pl = play; play = id => { const r = pl(id); if (EV[id] && EV[id].fight && S.fight) S.fight.ehp0 = S.fight.ehp0 || S.fight.ehp; return r; }; }
// запомнить, сколько отняли за раунд
{ const fr = fightRound; fightRound = (ev, c, forced) => {
  const st = S.fight; if (st) { st.z0r = S.st.zdor; st.e0r = st.ehp; st.lastAct = c.talk ? 'talk' : c.flee ? 'flee' : c.wpn ? 'wpn' : 'hit'; }
  return fr(ev, c, forced);
}; }
const HIT_WORDS = ['БАХ!', 'ХРЯСЬ!', 'БУМ!', 'ТРЕСК!', 'ШМЯК!'], HURT_WORDS = ['ОХ!', 'УФ!', 'АЙ!'];
{ const rf = renderFight; renderFight = ev => {
  const st = S.fight, anim = st && st.anim, f = ev.fight;
  rf(ev);
  if (!st || !$('.hp')) return;
  // противник: своё лицо по названию драки (если у драки нет конкретного NPC)
  if (!T(f.npc) && typeof npcVar === 'function') { stage.npc = npcVar('chuzhoy', String(T(f.name) || 'Чужой'), ''); drawStage(); }
  const e0 = st.ehp0 || Math.max(1, st.ehp), ep = Math.max(0, st.ehp) / e0 * 100;
  $('.hp').innerHTML = `<div class="fb me"><span>Ты</span><i class="hearts">${'<b></b>'.repeat(st.php)}${'<b class="off"></b>'.repeat(Math.max(0, 3 - st.php))}</i>
      <div class="fbar"><i style="width:${S.st.zdor}%"></i></div><em>♥ ${S.st.zdor}</em></div>
    <div class="fb foe"><span>${T(f.name)}</span><div class="fbar foe"><i style="width:${ep}%"></i></div></div>`;
  const stg = $('.stage'); if (!stg || !anim) return;
  // выпад: атакующий бросается к противнику, удар — искры и надпись у цели
  const hit = anim === 'hit', who = hit ? '#me' : '#spk', tgt = hit ? '#spk' : '#me';
  $(who) && $(who).classList.add(hit ? 'lungeL' : 'lungeR');
  const fx = document.createElement('div'); fx.className = 'fhit ' + (hit ? 'atfoe' : 'atme');
  const dmg = hit ? (st.e0r != null ? st.e0r - st.ehp : 1) : (st.z0r != null ? st.z0r - S.st.zdor : 0);
  fx.innerHTML = `<b class="word">${pick(hit ? (st.lastAct === 'talk' ? ['БЛА-БЛА!', 'ЧЁ?!'] : HIT_WORDS) : HURT_WORDS)}</b>`
    + Array.from({ length: 9 }, (_, i) => `<i style="--a:${i * 40}deg;--d:${18 + (i % 3) * 10}px"></i>`).join('')
    + (dmg > 0 ? `<em class="dmg">−${dmg}</em>` : '');
  stg.appendChild(fx);
  if (!hit) { stg.classList.add('redflash'); }
  setTimeout(() => fx.remove(), 900);
}; }
// синяк/пластырь на герое, пока есть травмы
const injMark = S => { const L = (S.body && S.body.inj) || []; if (!L.length) return null;
  return L.some(i => /perelom|nozh|pulya/.test(i.id)) ? 'plaster' : 'fingal'; };
{ const dh = drawHero; drawHero = (c, app, wear, opt) => {
  const m = typeof S !== 'undefined' && S && app === S.app ? injMark(S) : null;
  return dh(c, m ? { ...app, mark: m } : app, wear, opt);
}; }
