// Сезонные мини-игры: хоккей на коробке (зимой), бильярд в барах (90-е), ремонт кассетников (рынок).
// hokkey — бросок, когда вратарь открыл угол; bilyard — кий качается, жми, когда прицел на лузе;
// remont — запомни порядок винтиков и открути в том же порядке.
MINI.add('hokkey', 'Хоккей на коробке', 'Жми, когда вратарь откроет угол ворот. Забей 2 из 3.', (body, p, finish, loop) => {
  body.innerHTML = `<div class="hk-rink"><div class="hk-goal"><div class="hk-keeper" id="hkk"></div></div><div class="hk-puck" id="hkp"></div><div class="hk-score" id="hks"></div></div>`;
  let x = 50, dir = 1, shots = 0, goals = 0, busy = false;
  const sp = 1.1 + (1 - p) * 1.4, kw = 46 - p * 16;   // слабее — вратарь быстрее и шире
  const score = () => body.querySelector('#hks').textContent = `Голы: ${goals} · броски: ${3 - shots}`;
  score(); body.querySelector('#hkk').style.width = kw + '%';
  loop(() => { if (busy) return; x += dir * sp; if (x > 100 - kw / 2 || x < kw / 2) dir *= -1; body.querySelector('#hkk').style.left = (x - kw / 2) + '%'; });
  body.onclick = () => {
    if (busy) return; busy = true; shots++;
    const tgt = x > 50 ? 18 : 82, open = Math.abs(tgt - x) > kw / 2 + 6;   // бросаем в дальний от вратаря угол
    const pk = body.querySelector('#hkp'); pk.style.left = tgt + '%'; pk.classList.add('fly');
    AUDIO.hit();
    setTimeout(() => { if (open) { goals++; AUDIO.ok(); body.classList.add('goal'); } else AUDIO.no(); score();
      setTimeout(() => { body.classList.remove('goal'); pk.classList.remove('fly'); pk.style.left = '50%'; busy = false;
        if (goals >= 2) finish(true, '✔ ГОЛ! Двор орёт'); else if (shots >= 3) finish(false, '✘ Вратарь — стена'); }, 500); }, 380);
  };
});
MINI.add('bilyard', 'Бильярд', 'Кий качается. Жми, когда прицел ляжет на лузу. Забей 2 шара из 3.', (body, p, finish, loop) => {
  body.innerHTML = `<div class="bl-table"><div class="bl-pocket"></div><div class="bl-ball" id="blb"></div><div class="bl-cue" id="blc"></div><div class="bl-aim" id="bla"></div><div class="hk-score" id="bls"></div></div>`;
  let a = -40, dir = 1, shots = 0, pots = 0, busy = false;
  const sp = 1.2 + (1 - p) * 1.6, tol = 4 + p * 7;
  const score = () => body.querySelector('#bls').textContent = `Забито: ${pots} · шаров: ${3 - shots}`;
  score();
  loop(() => { if (busy) return; a += dir * sp; if (a > 40 || a < -40) dir *= -1;
    body.querySelector('#blc').style.transform = `rotate(${a}deg)`; body.querySelector('#bla').style.transform = `rotate(${a}deg)`; });
  body.onclick = () => {
    if (busy) return; busy = true; shots++;
    const ok = Math.abs(a) <= tol, b = body.querySelector('#blb');
    b.style.transform = `rotate(${a}deg) translateY(-120px)`; AUDIO.hit();
    setTimeout(() => { if (ok) { pots++; AUDIO.ok(); b.classList.add('in'); } else AUDIO.no(); score();
      setTimeout(() => { b.classList.remove('in'); b.style.transform = ''; busy = false;
        if (pots >= 2) finish(true, '✔ Партия твоя'); else if (shots >= 3) finish(false, '✘ Мимо лузы'); }, 450); }, 450);
  };
});
MINI.add('remont', 'Ремонт кассетника', 'Запомни, в каком порядке мигают винтики, и открути их так же.', (body, p, finish) => {
  const n = p > 0.6 ? 4 : p > 0.35 ? 5 : 6, seq = Array.from({ length: n }, () => Math.floor(Math.random() * 6));
  body.innerHTML = `<div class="rm-deck"><div class="rm-reels"><i></i><i></i></div>${Array.from({ length: 6 }, (_, i) => `<button class="rm-scr" data-s="${i}"></button>`).join('')}<div class="hk-score" id="rms">Смотри…</div></div>`;
  const scr = [...body.querySelectorAll('.rm-scr')]; let i = 0, input = false, pos = 0;
  const show = () => { if (i >= n) { input = true; body.querySelector('#rms').textContent = 'Теперь ты'; return; }
    const s = scr[seq[i]]; s.classList.add('lit'); AUDIO.click(); setTimeout(() => { s.classList.remove('lit'); i++; setTimeout(show, 160); }, 420); };
  setTimeout(show, 500);
  scr.forEach(s => s.onclick = e => { e.stopPropagation(); if (!input) return;
    const k = +s.dataset.s; s.classList.add('lit'); setTimeout(() => s.classList.remove('lit'), 180);
    if (k !== seq[pos]) return finish(false, '✘ Сорвал резьбу');
    pos++; AUDIO.hit(); body.querySelector('#rms').textContent = `Открутил ${pos} из ${n}`;
    if (pos >= n) finish(true, '✔ Заиграл!'); });
});

// ---------- где играть ----------
{ const la = locActions; locActions = (S, d) => {
  const a = la(S, d);
  if (d === S.home && typeof season === 'function' && season() === 'winter' && (typeof injBlock !== 'function' || injBlock(S) < 1))
    a.push({ t: 'Хоккей на коробке с пацанами', chk: ['lovk', 5], mini: 'hokkey', lim: 1,
      ok: { txt: 'Шайба в девятке! Малышня за бортом орёт твою кличку.', fx: { uvazh: 3, lovk: 1, zdor: 3 } },
      no: { txt: 'Соседский вратарь в валенках — непробиваемый. Зато разрумянился.', fx: { zdor: 2 } } });
  return a;
}; }
{ const pa = placeActions; placeActions = (S, p) => {
  const a = pa(S, p), inf = typeof inflation === 'function' ? inflation(S) : 1;
  if (p.k === 'bar' && typeof era90 === 'function' && era90(S)) a.push({ t: `Бильярд на деньги (ставка ${15 * inf} р.)`, req: { dengi: 15 * inf }, chk: ['um', 5], mini: 'bilyard', lim: 2, cost: 0.5,
    ok: { txt: 'Чистая партия. Соперник кладёт деньги на сукно и уходит молча.', fx: { dengi: 15 * inf, yaz: 0 } },
    no: { txt: 'Соперник — шулер с Казанки. Ставка уплыла.', fx: { dengi: -15 * inf } } });
  if (p.k === 'market') a.push({ t: 'Чинить кассетники на барахолке', chk: ['um', 5], mini: 'remont', lim: 1, cost: 1,
    ok: { txt: '«Электроника» заиграла «Ласковый май». Хозяин платит и обещает привести друзей.', fx: { dengi: 4 * inf, um: 1 } },
    no: { txt: 'Пружина улетела под прилавок. Плёнку зажевало навсегда.', fx: { dengi: -1 * inf } } });
  return a;
}; }
