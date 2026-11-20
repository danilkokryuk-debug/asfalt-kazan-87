// Звук без файлов: синтез через WebAudio. Несколько треков «под 80-е», переключаются по обстановке.
const AUDIO = (() => {
  let ctx = null, master = null, mus = null, timer = null;
  let on = (() => { try { return localStorage.getItem('asfalt_music') !== '0'; } catch (e) { return true; } })();
  let cur = 'theme', want = 'theme', step = 0, nextT = 0;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    mus = ctx.createGain(); mus.gain.value = 0.16; mus.connect(master);
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);         // MIDI → Гц
  function tone(freq, dur, type = 'square', vol = 0.15, dest = master, t = 0) {
    if (!ctx) return;
    t = t || ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol = 0.3, dest = master, t = 0, hp = 0) {
    if (!ctx) return;
    t = t || ctx.currentTime;
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = vol; s.buffer = b;
    if (hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; s.connect(f); f.connect(g); } else s.connect(g);
    g.connect(dest); s.start(t);
  }
  const kick = (t, v = 0.9) => { if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2); o.connect(g); g.connect(mus); o.start(t); o.stop(t + 0.25); };
  const snare = (t, v = 0.35) => noise(0.15, v, mus, t, 1200);
  const hat = (t, v = 0.12) => noise(0.04, v, mus, t, 6000);

  // Аккорд = [корень MIDI, 'm' минор | 'M' мажор]; ноты аккорда
  const triad = ([r, q]) => [r, r + (q === 'm' ? 3 : 4), r + 7];
  // Треки: bpm, аккорды (по такту), play(шаг 0..15, аккорд, время, длина шага)
  const TRACKS = {
    // титул: медленное арпеджио ля минор, как в фильмах тех лет
    theme: { bpm: 96, ch: [[57, 'm'], [53, 'M'], [48, 'M'], [55, 'M']], play(s, c, t, d) {
      const n = triad(c); tone(hz(n[[0, 1, 2, 1][s % 4]] + 12), d * 3, 'triangle', 0.5, mus, t);
      if (s === 0) tone(hz(c[0] - 12), d * 16, 'sawtooth', 0.18, mus, t);
      if (s === 0 || s === 8) kick(t, 0.5);
    } },
    // двор: дворовая гитара, перебор Am–Dm–E–Am
    dvor: { bpm: 100, ch: [[57, 'm'], [62, 'm'], [52, 'M'], [57, 'm']], play(s, c, t, d) {
      const n = triad(c);
      if (s === 0 || s === 8) tone(hz(c[0] - 12), d * 6, 'triangle', 0.6, mus, t);
      if ([2, 4, 6, 10, 12, 14].includes(s)) tone(hz(n[(s / 2) % 3] + 12), d * 2.5, 'square', 0.12, mus, t);
      if (s === 4 || s === 12) noise(0.06, 0.08, mus, t, 3000);
    } },
    // дискотека в ДК: итало-диско, бочка в пол и октавный бас
    disco: { bpm: 124, ch: [[52, 'm'], [48, 'M'], [50, 'M'], [47, 'm']], play(s, c, t, d) {
      const n = triad(c);
      if (s % 4 === 0) kick(t, 0.8);
      if (s % 4 === 2) hat(t, 0.16);
      if (s === 4 || s === 12) snare(t, 0.25);
      tone(hz(c[0] - 12 + (s % 2 ? 12 : 0)), d * 0.9, 'sawtooth', 0.35, mus, t);
      if (s % 2 === 0) tone(hz(n[(s / 2) % 3] + 24), d * 1.5, 'square', 0.12, mus, t);
    } },
    // драка: быстрый пульс, тревожные аккорды
    fight: { bpm: 150, ch: [[50, 'm'], [46, 'M'], [48, 'M'], [45, 'M']], play(s, c, t, d) {
      tone(hz(c[0] - 12), d * 0.8, 'sawtooth', 0.4, mus, t);
      if (s % 4 === 0) kick(t, 0.9);
      if (s === 4 || s === 12) snare(t, 0.4);
      if (s % 2) hat(t, 0.1);
      if (s === 0 || s === 6 || s === 10) triad(c).forEach(m => tone(hz(m + 12), d * 1.5, 'square', 0.07, mus, t));
    } },
    // ночь: медленный пэд и редкая мелодия
    noch: { bpm: 70, ch: [[48, 'm'], [44, 'M'], [51, 'M'], [46, 'M']], play(s, c, t, d) {
      if (s === 0) triad(c).forEach(m => tone(hz(m), d * 16, 'triangle', 0.25, mus, t));
      if ([3, 7, 11].includes(s) && Math.random() < 0.6) tone(hz(triad(c)[Math.floor(Math.random() * 3)] + 24), d * 4, 'sine', 0.25, mus, t);
    } },
    // милиция, разборки: гул и тиканье часов
    trevoga: { bpm: 80, ch: [[45, 'm'], [45, 'm'], [46, 'M'], [44, 'M']], play(s, c, t, d) {
      if (s === 0) { tone(hz(c[0] - 12), d * 16, 'sawtooth', 0.22, mus, t); tone(hz(c[0] - 6), d * 16, 'sine', 0.12, mus, t); }
      if (s % 4 === 0) tone(2400, 0.02, 'square', 0.06, mus, t);
      if (s === 8) tone(hz(c[0] + 15), d * 6, 'triangle', 0.15, mus, t);
    } },
    // дом, школа: тихая музыкальная шкатулка
    dom: { bpm: 92, ch: [[60, 'M'], [57, 'm'], [53, 'M'], [55, 'M']], play(s, c, t, d) {
      const n = triad(c);
      if (s % 2 === 0) tone(hz(n[[0, 1, 2, 1, 2, 0, 1, 2][s / 2]] + 12), d * 3, 'sine', 0.35, mus, t);
      if (s === 0) tone(hz(c[0] - 12), d * 12, 'triangle', 0.3, mus, t);
    } },
  };

  function tick() {
    if (!ctx || !on) return;
    while (nextT < ctx.currentTime + 0.12) {
      if (step % 16 === 0 && want !== cur) { cur = want; step = 0; }   // смена трека на сильной доле
      const tr = TRACKS[cur], d = 60 / tr.bpm / 4, bar = Math.floor(step / 16) % tr.ch.length;
      tr.play(step % 16, tr.ch[bar], Math.max(nextT, ctx.currentTime), d);
      nextT += d; step++;
    }
  }
  function startMusic() { if (!ctx || timer || !on) return; nextT = ctx.currentTime + 0.05; timer = setInterval(tick, 25); }
  function stopMusic() { clearInterval(timer); timer = null; }

  return {
    start() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); startMusic(); },
    track(name) { if (TRACKS[name]) want = name; },
    click() { tone(660, 0.05, 'square', 0.05); },
    ok() { tone(523, 0.1); tone(784, 0.18, 'square', 0.15, master, ctx && ctx.currentTime + 0.1); },
    no() { tone(196, 0.25, 'sawtooth', 0.15); },
    hit() { noise(0.15, 0.4); tone(90, 0.15, 'sine', 0.4); },
    type() { tone(1400 + Math.random() * 300, 0.015, 'square', 0.025); },
    whoosh() { noise(0.5, 0.12); tone(110, 1.2, 'sawtooth', 0.08); tone(55, 1.6, 'sine', 0.2); },
    musicOn: () => on,
    toggleMusic() { on = !on; try { localStorage.setItem('asfalt_music', on ? '1' : '0'); } catch (e) {} on ? (init(), startMusic()) : stopMusic(); },
  };
})();
