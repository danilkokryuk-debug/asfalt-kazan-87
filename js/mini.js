// Мини-игры. MINI.run(вид, p, done): p — шанс по статам (0..1), чем выше — тем легче. done(true/false).
const MINI = (() => {
  const NAMES = { kach: 'Качалка', udar: 'Удар', naperstki: 'Напёрстки', pobeg: 'Побег' };
  const HINT = {
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
  };
  return { run };
})();
