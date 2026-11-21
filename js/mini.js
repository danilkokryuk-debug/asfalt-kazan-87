// Мини-игры. MINI.run(вид, p, done): p — шанс по статам (0..1), чем выше — тем легче. done(true/false).
const MINI = (() => {
  const NAMES = { kach: 'Качалка', udar: 'Удар', naperstki: 'Напёрстки', pobeg: 'Побег', zamok: 'Взлом замка', karty: 'Двадцать одно', gonka: 'Гонка', tir: 'Тир', shuher: 'Шухер' };
  const HINT = {
    zamok: 'Жми, когда метка в тёмной щели штифта. 4 штифта — и замок открыт.',
    karty: 'Набери ближе к 21, чем катала. Перебор — проигрыш.',
    gonka: 'Жми по экрану как можно чаще — разгоняйся и обгони соперника.',
    tir: 'Стреляй по уткам на полке. Сбей 4 из 6 патронов.',
    shuher: 'Жми только на ментов в фуражках. Прохожих не трогай.',
    kach: 'Жми, когда бегунок в зелёной зоне. Нужно 3 повтора из 5.',
    udar: 'Жми, когда кольцо совпадёт с целью.',
    naperstki: 'Запомни, где шарик. Потом выбери стаканчик.',
    pobeg: 'Жми слева или справа, чтобы уходить от прохожих. Продержись 7 секунд.',
  };

  function run(kind, p, done) {
    if (typeof __TEST !== 'undefined' || (typeof SET !== 'undefined' && SET.skipMini)) return done(Math.random() < p);
    const el = document.createElement('div');
    el.className = 'mini';
    el.innerHTML = `<div class="mt">${NAMES[kind]}</div><div class="mhint">${HINT[kind]}</div>
      <div class="mbody" id="mb"></div><div class="mres" id="mr"></div>
      <button class="btn" id="mskip">Положиться на удачу (${Math.round(p * 100)}%)</button>`;
    document.body.appendChild(el);
    let over = false, raf = null;
    const finish = (ok, msg) => {
      if (over) return; over = true; cancelAnimationFrame(raf);
      ok ? AUDIO.ok() : AUDIO.no();
      el.querySelector('#mr').textContent = msg || (ok ? '✔ Получилось' : '✘ Не вышло');
      el.querySelector('#mr').className = 'mres ' + (ok ? 'ok' : 'no');
      setTimeout(() => { el.remove(); done(ok); }, 900);
    };
    el.querySelector('#mskip').onclick = e => { e.stopPropagation(); finish(Math.random() < p); };
    const body = el.querySelector('#mb');
    const loop = f => { const step = t => { if (over) return; f(t); raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); };
    GAMES[kind](body, p, finish, loop);
  }

  const GAMES = {
    kach(body, p, finish, loop) {
      const zw = 14 + p * 30, z0 = 10 + Math.random() * (80 - zw);
      body.innerHTML = `<div class="kbar"><div class="kzone" style="left:${z0}%;width:${zw}%"></div><div class="kmark" id="km"></div></div><div class="kreps" id="kr"></div>`;
      let x = 0, dir = 1, hits = 0, tries = 0;
      const sp = 1.3 - p * 0.6;
      const reps = () => body.querySelector('#kr').textContent = '■'.repeat(hits) + '□'.repeat(Math.max(0, 3 - hits)) + `   попыток: ${5 - tries}`;
      reps();
      loop(() => { x += dir * sp; if (x > 100 || x < 0) dir *= -1; body.querySelector('#km').style.left = x + '%'; });
      body.onclick = () => {
        tries++;
        if (x >= z0 && x <= z0 + zw) { hits++; AUDIO.hit(); body.classList.remove('shake'); void body.offsetWidth; body.classList.add('shake'); } else AUDIO.click();
        reps();
        if (hits >= 3) finish(true); else if (5 - tries < 3 - hits) finish(false);
      };
    },
    udar(body, p, finish, loop) {
      body.innerHTML = `<div class="uwrap"><div class="utarget"></div><div class="uring" id="ur"></div></div>`;
      const t0 = performance.now(), dur = 1300 - p * 300, tol = 8 + p * 22;
      let d = 200;
      loop(t => { d = 200 * (1 - (t - t0) / dur); if (d < 0) { finish(false); return; } const r = body.querySelector('#ur'); r.style.width = r.style.height = d + 'px'; });
      body.onclick = () => finish(Math.abs(d - 60) <= tol);
    },
    naperstki(body, p, finish) {
      body.innerHTML = `<div class="cups">${[0, 1, 2].map(i => `<div class="cup" data-i="${i}"><div class="ball"></div></div>`).join('')}</div>`;
      const cups = [...body.querySelectorAll('.cup')];
      let pos = [0, 1, 2], ball = Math.floor(Math.random() * 3);   // pos[i] — место стаканчика i
      const place = () => cups.forEach((c, i) => c.style.left = (pos[i] * 33 + 4) + '%');
      place(); cups[ball].classList.add('show');
      // Сложно: много быстрых перестановок, скорость растёт к концу, а напёрсточник иногда мухлюет
      const swaps = 11 + Math.round((1 - p) * 7);
      const cheat = Math.random() < 0.3 * (1 - p);   // шарик незаметно уходит в рукав
      let n = 0;
      cups.forEach(c => c.style.transitionDuration = '0.16s');
      setTimeout(() => {
        cups[ball].classList.remove('show');
        const step = () => {
          const a = Math.floor(Math.random() * 3), b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
          [pos[a], pos[b]] = [pos[b], pos[a]]; place(); AUDIO.click();
          if (++n >= swaps) {
            if (cheat) cups[ball].querySelector('.ball').remove();
            cups.forEach((c, i) => c.onclick = () => {
              cups.forEach(x => x.classList.add('show'));
              cheat ? finish(false, '✘ Шарика нет нигде. Мухлюет!') : finish(i === ball);
            });
            return;
          }
          setTimeout(step, Math.max(110, (230 + p * 150) * (1 - n / swaps * 0.45)));
        };
        step();
      }, 900);
    },
    pobeg(body, p, finish, loop) {
      body.innerHTML = `<div class="road"><div class="runner" id="rn"></div></div><div class="kreps" id="rl"></div>`;
      const road = body.querySelector('.road');
      let lane = 1, lives = 2, obs = [], last = 0;
      const t0 = performance.now(), speed = 0.35 + (1 - p) * 0.35;
      const lifeTxt = () => body.querySelector('#rl').textContent = 'Жизни: ' + '♥'.repeat(lives);
      lifeTxt();
      body.onclick = e => { const r = body.getBoundingClientRect(); lane = Math.max(0, Math.min(2, lane + (e.clientX < r.left + r.width / 2 ? -1 : 1))); };
      loop(t => {
        if (t - t0 > 7000) return finish(true);
        if (t - last > 650 - p * 200) {
          last = t; const o = document.createElement('div'); o.className = 'obst';
          o.dataset.l = Math.floor(Math.random() * 3); o.dataset.y = -10; road.appendChild(o); obs.push(o);
        }
        body.querySelector('#rn').style.left = (lane * 33 + 8) + '%';
        for (const o of obs) {
          o.dataset.y = +o.dataset.y + speed * 3; o.style.top = o.dataset.y + '%'; o.style.left = (o.dataset.l * 33 + 8) + '%';
          if (!o.hit && +o.dataset.y > 78 && +o.dataset.y < 92 && +o.dataset.l === lane) {
            o.hit = true; lives--; AUDIO.hit(); lifeTxt(); road.classList.remove('shake'); void road.offsetWidth; road.classList.add('shake');
            if (lives <= 0) return finish(false);
          }
        }
        obs = obs.filter(o => +o.dataset.y < 110 || (o.remove(), false));
      });
    },
    // Взлом замка: 4 штифта, у каждого своя щель; бегунок всё быстрее. Промах — штифт падает обратно.
    zamok(body, p, finish, loop) {
      const N = 4, gw = 10 + p * 14;
      const gaps = Array.from({ length: N }, () => 8 + Math.random() * (84 - gw));
      body.innerHTML = `<div class="lock">${gaps.map((g, i) => `<div class="pin" data-i="${i}"><div class="pgap" style="top:${g}%;height:${gw}%"></div><div class="pmark"></div></div>`).join('')}</div><div class="kreps" id="lk"></div>`;
      const pins = [...body.querySelectorAll('.pin')];
      let cur = 0, y = 0, dir = 1, miss = 0, maxMiss = 2 + Math.round(p * 2);
      const info = () => body.querySelector('#lk').textContent = `Штифты: ${'▮'.repeat(cur)}${'▯'.repeat(N - cur)}   срывов осталось: ${maxMiss - miss}`;
      info(); pins[0].classList.add('on');
      loop(() => { y += dir * (1.1 + cur * 0.35 + (1 - p) * 0.6); if (y > 100 || y < 0) dir *= -1; pins[cur] && (pins[cur].querySelector('.pmark').style.top = y + '%'); });
      body.onclick = () => {
        const g = gaps[cur];
        if (y >= g && y <= g + gw) { AUDIO.click(); pins[cur].classList.remove('on'); pins[cur].classList.add('set'); cur++; if (cur >= N) return finish(true, '✔ Щёлк! Открыто'); pins[cur].classList.add('on'); y = 0; dir = 1; }
        else { AUDIO.hit(); miss++; body.classList.remove('shake'); void body.offsetWidth; body.classList.add('shake'); if (miss >= maxMiss) return finish(false, '✘ Отмычка сломалась'); }
        info();
      };
    },
    // «Двадцать одно» против каталы: берёшь карты, пока не решишь остановиться. Перебор — проигрыш.
    karty(body, p, finish) {
      const deck = []; for (const v of [6, 7, 8, 9, 10, 2, 3, 4, 11]) for (let s = 0; s < 4; s++) deck.push(v);
      deck.sort(() => Math.random() - 0.5);
      const NAME = { 2: 'В', 3: 'Д', 4: 'К', 11: 'Т' };
      const me = [deck.pop(), deck.pop()];
      const sum = h => h.reduce((a, b) => a + b, 0);
      const card = v => `<div class="kcard">${NAME[v] || v}</div>`;
      const draw = (msg = '') => body.innerHTML = `<div class="ktable"><div class="ksub">Катала: ${'<div class="kcard back"></div>'.repeat(2)}</div>
        <div class="ksub">Ты (${sum(me)}): ${me.map(card).join('')}</div><div class="kbtns"><button class="btn" id="kmore">Ещё</button><button class="btn main" id="kstop">Хватит</button></div><div class="mhint">${msg}</div></div>`;
      const bind = () => {
        body.querySelector('#kmore').onclick = e => { e.stopPropagation(); me.push(deck.pop()); AUDIO.click(); if (sum(me) > 21) { draw('Перебор.'); return finish(false, `✘ Перебор: ${sum(me)}`); } draw(); bind(); };
        body.querySelector('#kstop').onclick = e => {
          e.stopPropagation();
          // катала тянет до 17, а если рука у тебя хорошая и он умелый — иногда «подтягивает» нужную карту
          const dl = [deck.pop(), deck.pop()]; while (sum(dl) < 17) dl.push(deck.pop());
          if (sum(dl) <= 21 && sum(dl) < sum(me) && Math.random() < 0.35 * (1 - p)) dl[dl.length - 1] += sum(me) - sum(dl) + 1;
          const d = sum(dl), m = sum(me);
          body.querySelector('.ksub').innerHTML = `Катала (${d}): ${dl.map(card).join('')}`;
          finish(d > 21 || m > d, d > 21 ? `✔ У каталы перебор (${d})` : m > d ? `✔ ${m} против ${d}` : `✘ ${m} против ${d}`);
        };
      };
      draw('Ближе к 21, но не больше. Туз — 11, валет — 2, дама — 3, король — 4.'); bind();
    },
    // Гонка: жми как можно чаще, чтобы обогнать соперника за 6 секунд
    gonka(body, p, finish, loop) {
      body.innerHTML = `<div class="race"><div class="lane"><div class="car me" id="cme">▶</div></div><div class="lane"><div class="car en" id="cen">▶</div></div><div class="finish"></div></div><div class="kreps" id="rt">Жми чаще!</div>`;
      let me = 0, en = 0, v = 0; const t0 = performance.now(), ev = 0.0115 + (1 - p) * 0.006;
      body.onclick = () => { v = Math.min(v + 0.55, 2.4); AUDIO.click(); };
      let last = t0;
      loop(t => {
        const dt = (t - last) / 16.7; last = t;
        v = Math.max(0, v - 0.035 * dt); me += v * 0.32 * dt; en += (ev * 100 * 0.32 + Math.sin(t / 400) * 0.05) * dt;
        body.querySelector('#cme').style.left = Math.min(92, me) + '%'; body.querySelector('#cen').style.left = Math.min(92, en) + '%';
        body.querySelector('#rt').textContent = `${Math.max(0, 6 - (t - t0) / 1000).toFixed(1)} с`;
        if (me >= 92 || en >= 92 || t - t0 > 6000) finish(me >= en, me >= en ? '✔ Первым на финише!' : '✘ Обошли на последних метрах');
      });
    },
    // Тир: мишени едут по полке, нужно сбить 4 за 7 секунд, патронов 6
    tir(body, p, finish, loop) {
      body.innerHTML = `<div class="tir" id="tr"></div><div class="kreps" id="ti"></div>`;
      const tr = body.querySelector('#tr'); let hits = 0, ammo = 6, ts = [], last = 0; const t0 = performance.now(), sp = 0.45 + (1 - p) * 0.45, size = 34 + p * 14;
      const info = () => body.querySelector('#ti').textContent = `Сбито: ${'●'.repeat(hits)}${'○'.repeat(Math.max(0, 4 - hits))}   патроны: ${'|'.repeat(ammo)}`;
      info();
      tr.onclick = e => {
        if (ammo <= 0) return; ammo--; AUDIO.hit();
        const hit = e.target.classList && e.target.classList.contains('duck') && !e.target.down;
        if (hit) { e.target.down = true; e.target.classList.add('down'); hits++; }
        info(); if (hits >= 4) finish(true, '✔ Главный приз твой'); else if (ammo <= 0) setTimeout(() => finish(false, '✘ Патроны кончились'), 200);
      };
      loop(t => {
        if (t - t0 > 7000) return finish(hits >= 4);
        if (t - last > 700) { last = t; const d = document.createElement('div'); d.className = 'duck'; d.style.width = d.style.height = size + 'px'; d.dataset.x = -15; d.style.top = (10 + Math.floor(Math.random() * 3) * 30) + '%'; tr.appendChild(d); ts.push(d); }
        for (const d of ts) { d.dataset.x = +d.dataset.x + sp; d.style.left = d.dataset.x + '%'; }
        ts = ts.filter(d => +d.dataset.x < 110 || (d.remove(), false));
      });
    },
    // Шухер: в окнах и из-за угла появляются люди. Жми только на ментов (фуражка), прохожих не трогай.
    shuher(body, p, finish, loop) {
      body.innerHTML = `<div class="shu">${Array.from({ length: 6 }, (_, i) => `<div class="win" data-i="${i}"></div>`).join('')}</div><div class="kreps" id="sh"></div>`;
      const wins = [...body.querySelectorAll('.win')]; let caught = 0, missed = 0, wrong = 0, last = 0; const t0 = performance.now(), life = 1100 + p * 700;
      const info = () => body.querySelector('#sh').textContent = `Заметил ментов: ${caught}/4   прозевал: ${missed}   ошибок: ${wrong}`;
      info();
      wins.forEach(w => w.onclick = e => { e.stopPropagation(); if (!w.who) return;
        if (w.who === 'cop') { caught++; AUDIO.ok(); } else { wrong++; AUDIO.no(); }
        w.who = null; w.className = 'win'; info();
        if (caught >= 4) finish(true, '✔ Свистнул вовремя'); else if (wrong >= 2) finish(false, '✘ Поднял шум из-за прохожих'); });
      loop(t => {
        if (t - t0 > 9000) return finish(caught >= 4);
        if (t - last > 650) { last = t; const free = wins.filter(w => !w.who); if (free.length) { const w = free[Math.floor(Math.random() * free.length)];
          w.who = Math.random() < 0.45 ? 'cop' : 'man'; w.className = 'win ' + w.who; w.t = t; } }
        for (const w of wins) if (w.who && t - w.t > life) { if (w.who === 'cop') { missed++; info(); if (missed >= 2) return finish(false, '✘ Менты подошли незамеченными'); } w.who = null; w.className = 'win'; }
      });
    },
  };
  // новые мини-игры из других файлов: MINI.add(вид, название, подсказка, (body, p, finish, loop) => {…})
  return { run, add(kind, name, hint, fn) { NAMES[kind] = name; HINT[kind] = hint; GAMES[kind] = fn; } };
})();
