// Звук без файлов: синтез через WebAudio. Треки «под 80-е» с вариациями, эмбиент локаций и эффекты.
const AUDIO = (() => {
  let ctx = null, master, mus, musFx, amb, dly, nbuf, timer = null;
  let on = (() => { try { return localStorage.getItem('asfalt_music') !== '0'; } catch (e) { return true; } })();
  let cur = 'theme', want = 'theme', s = 0, bar = 0, vi = 0, fill = false, nextT = 0;
  let tapeSpec = null, retape = false, ducked = false;   // ducked — играет настоящая песня с телефона, своя музыка молчит
  let MUSV = 0.12, VOL = 0.5; const AMBV = 0.55, NB = 6;   // музыка тише эффектов; меняются в настройках
  const R = Math.random, rnd = n => Math.floor(R() * n), pick = a => a[rnd(a.length)];
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);       // MIDI → Гц

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();          // чтобы наложения не хрипели
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.25;
    comp.connect(ctx.destination);
    master = gain(VOL, comp);
    // музыка идёт через тёплый фильтр: без режущих верхов, приятнее на телефоне
    const warm = filt('lowpass', 2100, 0.5); warm.connect(master);
    mus = gain(on ? MUSV : 0, warm);
    musFx = gain(1, mus);                                 // лиды с эхом
    dly = ctx.createDelay(1); dly.delayTime.value = 45 / 96;
    const dlp = filt('lowpass', 2200), fb = gain(0.3, dly), wet = gain(0.22, mus);
    musFx.connect(dly); dly.connect(dlp); dlp.connect(fb); dlp.connect(wet);
    amb = gain(AMBV, master);
    nbuf = ctx.createBuffer(1, ctx.sampleRate * NB, ctx.sampleRate);
    const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1;
  }
  function gain(v, to) { const g = ctx.createGain(); g.gain.value = v; if (to) g.connect(to); return g; }
  function filt(type, f, q) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; return b; }
  // огибающая: мягкая атака, затем экспоненциальный спад (или удержание + релиз, если o.rel)
  function env(g, t, vol, dur, atk, rel, lin) {
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + atk);
    if (rel) { g.gain.setValueAtTime(vol, t + Math.max(atk, dur - rel)); g.gain.linearRampToValueAtTime(0, t + dur); }
    else if (lin) g.gain.linearRampToValueAtTime(0, t + dur);
    else g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function chain(src, o, t, dur) {
    if (!o.ft) return src;
    const f = filt(o.ft, o.f, o.q); if (o.fto) f.frequency.exponentialRampToValueAtTime(o.fto, t + dur);
    src.connect(f); return f;
  }
  // o: atk, rel, to (глиссандо), glide, det, vib [Гц, глубина], ft/f/q/fto (фильтр)
  function tone(freq, dur, type = 'square', vol = 0.15, dest = master, t = 0, o = {}) {
    if (!ctx) return;
    t = t || ctx.currentTime;
    const atk = o.atk || 0.006, osc = ctx.createOscillator(), g = ctx.createGain();
    dur = Math.max(dur, atk + 0.03);
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    if (o.det) osc.detune.value = o.det;
    if (o.vib) { const l = ctx.createOscillator(), lg = gain(o.vib[1]); l.frequency.value = o.vib[0]; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.05); }
    env(g, t, vol, dur, atk, o.rel);
    chain(osc, o, t, dur).connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function noise(dur, vol = 0.3, dest = master, t = 0, hp = 0, o = {}) {
    if (!ctx) return;
    t = t || ctx.currentTime;
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = nbuf; src.loop = dur > NB - 0.5;
    if (hp) o = Object.assign({ ft: 'highpass', f: hp }, o);
    env(g, t, vol, dur, o.atk || 0.002, o.rel, true);
    chain(src, o, t, dur).connect(g); g.connect(dest);
    src.start(t, R() * Math.max(0, NB - dur)); src.stop(t + dur + 0.05);
  }

  // ===== ударные и инструменты (в шину музыки) =====
  const hv = v => v * (0.85 + R() * 0.3);                // живая сила удара
  function kick(t, v = 0.9) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(hv(v), t + 0.003); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(mus); o.start(t); o.stop(t + 0.25);
  }
  const snare = (t, v = 0.35) => { noise(0.15, hv(v), mus, t, 1200); tone(190, 0.08, 'triangle', v * 0.5, mus, t); };
  const hat = (t, v = 0.12, open) => noise(open ? 0.14 : 0.03, hv(v) * 0.5, mus, t, 7000);
  const clap = (t, v = 0.2) => [0, 0.012, 0.024].forEach(dt => noise(dt ? 0.03 : 0.12, hv(v), mus, t + dt, 0, { ft: 'bandpass', f: 1500, q: 1.2 }));
  const tom = (t, f, v = 0.4) => tone(f, 0.25, 'sine', hv(v), mus, t, { to: f * 0.6 });
  // мягкие тембры: квадрат и пила заменены на треугольник/синус там, где они резали ухо
  const soft = type => type === 'square' ? 'triangle' : type;
  const bass = (m, t, len, v = 0.3, type = 'sawtooth') => tone(hz(m), len, type, hv(v) * 0.9, mus, t, { ft: 'lowpass', f: 480, atk: 0.01 });
  const lead = (m, t, len, v = 0.1, type = 'square') => tone(hz(m), len, soft(type), hv(v) * 1.3, musFx, t, { ft: 'lowpass', f: 1900, atk: 0.02 });
  const pluck = (m, t, len, v = 0.1) => { tone(hz(m), len, 'triangle', hv(v) * 1.4, mus, t, { ft: 'lowpass', f: 1500, atk: 0.004 }); tone(hz(m) * 2, len * 0.3, 'sine', v * 0.25, mus, t); };
  const bell = (m, t, len, v = 0.2) => { tone(hz(m), len, 'sine', hv(v), musFx, t, { atk: 0.004 }); tone(hz(m) * 2.76, len * 0.4, 'sine', v * 0.15, musFx, t); };
  function pad(ns, t, len, v) {                           // два расстроенных пилообразных на ноту, медленно «дышит»
    const f = filt('lowpass', 1000, 0.5), g = ctx.createGain();
    env(g, t, v, len, len * 0.2, len * 0.3);
    f.connect(g); g.connect(mus);
    ns.forEach(m => [-8, 8].forEach(dt => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + len + 0.05); }));
  }
  function roll({ s, t, d }, kind) {                      // сбивка в конце фразы
    const i = s - 12;
    kind === 'tom' ? tom(t, [220, 180, 150, 120][i], 0.35) : snare(t, 0.12 + i * 0.07);
    if (s === 15 && R() < 0.5) noise(0.7, 0.1, mus, t + d, 5000);   // тарелка на сильную долю
  }

  // Аккорд = [корень MIDI, 'm' | 'M']; трек: bpm, v — 2–3 варианта гармонии (чередуются), drums — вид сбивки
  const triad = ([r, q]) => [r, r + (q === 'm' ? 3 : 4), r + 7];
  const at = (k, n) => n[k % 3] + 12 * Math.floor(k / 3);   // k-я нота аккорда вверх по октавам
  let rk = 2, tk = 0;                                       // мелодия рынка (случайное блуждание), тик часов
  const FIN = [                                             // финал: написанная мелодия [шаг, MIDI, длина]
    [[[0, 76, 6], [6, 74, 2], [8, 72, 8]], [[0, 72, 4], [4, 74, 4], [8, 69, 8]], [[0, 67, 4], [4, 72, 4], [8, 71, 6], [14, 72, 2]], [[0, 71, 12], [12, 68, 4]]],
    [[[0, 69, 6], [6, 72, 2], [8, 74, 8]], [[0, 72, 4], [4, 71, 4], [8, 69, 8]], [[0, 68, 6], [6, 71, 2], [8, 76, 8]], [[0, 72, 8], [8, 69, 8]]],
  ];
  const TRACKS = {
    // титул: медленное арпеджио ля минор, как в фильмах тех лет
    theme: { bpm: 96, drums: 'snare', v: [
      [[57, 'm'], [53, 'M'], [48, 'M'], [55, 'M']], [[57, 'm'], [52, 'm'], [53, 'M'], [52, 'M']], [[50, 'm'], [57, 'm'], [53, 'M'], [52, 'M']]],
      play({ s, c, n, t, d, v, roll }) {
        lead(n[[[0, 1, 2, 1], [0, 2, 1, 2], [2, 1, 0, 1]][v][s % 4]] + 12, t, d * 3, 0.35, 'triangle');
        if (s === 0) tone(hz(c[0] - 12), d * 16, 'sawtooth', 0.15, mus, t, { ft: 'lowpass', f: 600, atk: 0.05, rel: d * 4 });
        if (s === 0 && R() < 0.4) lead(n[2] + 24, t + d * 2, d * 10, 0.06, 'sine');
        if (s === 0 || s === 8) kick(t, 0.5);
        if (v && s % 4 === 2) hat(t, 0.05);
        if (v === 2 && (s === 4 || s === 12) && !roll) snare(t, 0.14);
      } },
    // двор: дворовая гитара, перебор с басом-квинтой
    dvor: { bpm: 100, v: [
      [[57, 'm'], [62, 'm'], [52, 'M'], [57, 'm']], [[57, 'm'], [60, 'M'], [55, 'M'], [52, 'M']], [[62, 'm'], [55, 'M'], [60, 'M'], [52, 'M']]],
      play({ s, c, n, t, d, v, last }) {
        if (s === 0) bass(c[0] - 12, t, d * 6, 0.5, 'triangle');
        if (s === 8) bass(c[0] - (R() < 0.6 ? 17 : 12), t, d * 6, 0.45, 'triangle');
        if ([[2, 4, 6, 10, 12, 14], [2, 3, 6, 10, 11, 14], [2, 4, 5, 6, 10, 12, 13, 14]][v].includes(s) && R() > 0.08)
          pluck(n[(s >> 1) % 3] + 12 + (R() < 0.08 ? 12 : 0), t, d * 2.5, 0.11);
        if (s === 4 || s === 12) noise(0.06, 0.07, mus, t, 3000);
        if (last && s === 14 && R() < 0.45) [2, 1, 0].forEach((k, i) => pluck(n[k] + 12, t + i * d / 3, d, 0.08));   // пробежка
      } },
    // дискотека в ДК: итало-диско, бочка в пол и октавный бас
    disco: { bpm: 124, drums: 'tom', v: [
      [[52, 'm'], [48, 'M'], [50, 'M'], [47, 'm']], [[57, 'm'], [53, 'M'], [55, 'M'], [52, 'M']], [[52, 'm'], [55, 'M'], [50, 'M'], [48, 'M']]],
      play({ s, c, n, t, d, v, bar, roll }) {
        const brk = v === 1 && bar === 0;                     // брейк: такт без бочки
        if (s % 4 === 0 && !brk) kick(t, 0.8);
        if (s % 4 === 2) hat(t, 0.15, true); else if (s % 2 && R() < 0.6) hat(t, 0.05);
        if ((s === 4 || s === 12) && !roll) clap(t, 0.2);
        bass(c[0] - 12 + (s % 2 ? 12 : 0), t, d * 0.9, 0.3);
        if (v === 2) { const k = [3, -1, 4, -1, 5, 4, -1, 3, 2, -1, 3, -1, 1, -1, 2, -1][s]; if (k >= 0) lead(at(k, n) + 12, t, d * 1.6, 0.09); if (s === 0) pad(n, t, d * 16, 0.03); }
        else if (s % 2 === 0) lead(n[(s / 2) % 3] + 24, t, d * 1.5, 0.08);
      } },
    // драка: быстрый пульс, тревожные аккорды, случайные лишние бочки
    fight: { bpm: 150, drums: 'snare', v: [
      [[50, 'm'], [46, 'M'], [48, 'M'], [45, 'M']], [[50, 'm'], [50, 'm'], [46, 'M'], [45, 'M']], [[43, 'm'], [50, 'm'], [45, 'M'], [45, 'M']]],
      play({ s, c, n, t, d, v, roll }) {
        bass(c[0] - 12 + (v === 1 && s % 4 === 3 ? 12 : 0), t, d * 0.8, 0.34);
        if (s % 4 === 0 || (s === 10 && R() < 0.5) || (s === 14 && R() < 0.3)) kick(t, 0.9);
        if ((s === 4 || s === 12) && !roll) snare(t, 0.4);
        if (s % 2) hat(t, 0.08);
        if ([0, 6, 10].includes(s)) n.forEach(m => tone(hz(m + 12), d * 1.5, 'triangle', 0.06, mus, t, { ft: 'lowpass', f: 1600 }));
        const r = [0, 3, 6, 8, 11, 14].indexOf(s);
        if (v === 2 && r >= 0) lead(n[[0, 1, 2, 0, 2, 1][r]] + 24, t, d * 1.2, 0.07);
      } },
    // ночь: медленный пэд и редкая мелодия
    noch: { bpm: 70, v: [[[48, 'm'], [44, 'M'], [51, 'M'], [46, 'M']], [[53, 'm'], [48, 'm'], [44, 'M'], [43, 'M']]],
      play({ s, c, n, t, d, v }) {
        if (s === 0) { pad(n, t, d * 16, 0.05); tone(hz(c[0] - 12), d * 16, 'sine', 0.15, mus, t, { atk: 0.3, rel: d * 4 }); }
        if ([3, 7, 11, 14].includes(s) && R() < 0.5) bell(n[rnd(3)] + 24 + (v ? 12 : 0), t, d * 5, 0.13);
        if (s === 8 && R() < 0.3) noise(0.03, 0.05, mus, t, 2000);
      } },
    // милиция, разборки: гул, тиканье, сердцебиение
    trevoga: { bpm: 80, v: [[[45, 'm'], [45, 'm'], [46, 'M'], [44, 'M']], [[45, 'm'], [51, 'm'], [45, 'm'], [44, 'M']]],
      play({ s, c, t, d, v }) {
        if (s === 0) { tone(hz(c[0] - 12), d * 16, 'sawtooth', 0.18, mus, t, { ft: 'lowpass', f: 500, atk: 0.3, rel: 0.8 }); tone(hz(c[0] - 6), d * 16, 'sine', 0.1, mus, t, { atk: 0.5, rel: 1 }); }
        if (s % 4 === 0) tone(2400, 0.02, 'square', 0.04, mus, t);
        if (v === 1 && [0, 2, 8, 10].includes(s)) kick(t, s % 8 ? 0.28 : 0.42);
        if (s === 8 && R() < 0.7) lead(c[0] + 15 + (R() < 0.3 ? 6 : 0), t, d * 6, 0.09, 'triangle');
      } },
    // дом, школа: тихая музыкальная шкатулка
    dom: { bpm: 92, v: [[[60, 'M'], [57, 'm'], [53, 'M'], [55, 'M']], [[53, 'M'], [55, 'M'], [52, 'm'], [57, 'm']], [[50, 'm'], [55, 'M'], [60, 'M'], [60, 'M']]],
      play({ s, c, n, t, d, v }) {
        if (s % 2 === 0) bell(n[[[0, 1, 2, 1, 2, 0, 1, 2], [0, 2, 1, 2, 0, 2, 1, 0], [2, 1, 0, 1, 2, 1, 0, 2]][v][s / 2]] + 12, t, d * 3, 0.22);
        else if (R() < 0.1) bell(n[rnd(3)] + 24, t, d * 1.5, 0.06);
        if (s === 0) tone(hz(c[0] - 12), d * 12, 'triangle', 0.26, mus, t);
      } },
    // видеосалон: синт-боевик, остинато баса, гейтованный малый с эхом
    kino: { bpm: 112, drums: 'tom', v: [
      [[52, 'm'], [52, 'm'], [48, 'M'], [50, 'M']], [[57, 'm'], [53, 'M'], [52, 'm'], [52, 'm']], [[52, 'm'], [55, 'M'], [50, 'M'], [48, 'M']]],
      play({ s, c, n, t, d, v, roll }) {
        bass(c[0] - 24 + (s % 4 === 3 ? 12 : 0), t, d * 0.7, 0.28);
        if (s === 0) pad(n, t, d * 16, 0.035);
        if (s === 0 || s === 8 || (s === 10 && v === 2) || (s === 7 && R() < 0.2)) kick(t, 0.85);
        if ((s === 4 || s === 12) && !roll) noise(0.25, hv(0.28), musFx, t, 0, { ft: 'bandpass', f: 1800, q: 0.6 });
        if (s % 2) hat(t, 0.05);
        if (v === 1) { const m = { 0: [2, 6], 6: [1, 2], 8: [0, 8] }[s]; if (m) lead(n[m[0]] + 12, t, d * m[1], 0.08, 'sawtooth'); }
        if (v === 2) lead(n[s % 3] + 24, t, d * 0.8, 0.035);
      } },
    // рынок: суетливая полька, гармошка гуляет по аккорду
    rynok: { bpm: 132, drums: 'snare', v: [
      [[60, 'M'], [55, 'M'], [55, 'M'], [60, 'M']], [[53, 'M'], [60, 'M'], [55, 'M'], [60, 'M']], [[57, 'm'], [50, 'm'], [55, 'M'], [60, 'M']]],
      play({ s, c, n, t, d, roll }) {
        if (s % 4 === 0) bass(c[0] - 12 - (s % 8 ? 5 : 0), t, d * 1.5, 0.3, 'triangle');
        if (s % 4 === 2) { n.forEach(m => tone(hz(m), d * 1.2, 'triangle', 0.045, mus, t, { ft: 'lowpass', f: 1500 })); if (!roll) snare(t, 0.06); }
        if (s % 2) hat(t, 0.04);
        if (s % 2 === 0 && R() < 0.8) {
          rk = Math.max(0, Math.min(6, rk + pick([-1, 0, 1, 1, -1, 2, -2])));
          const f = hz(at(rk, n) + 12);
          tone(f, d * 1.8, 'triangle', 0.07, musFx, t, { ft: 'lowpass', f: 1800, vib: [6, 4] });
          tone(f, d * 1.8, 'sawtooth', 0.03, mus, t, { ft: 'lowpass', f: 2200, det: 12 });
        }
      } },
    // зима: колокольчики, пэд и снежное шуршание
    zima: { bpm: 76, v: [[[50, 'm'], [46, 'M'], [53, 'M'], [48, 'M']], [[50, 'm'], [45, 'm'], [46, 'M'], [48, 'M']], [[43, 'm'], [50, 'm'], [46, 'M'], [45, 'M']]],
      play({ s, c, n, t, d, v }) {
        if (s === 0) { pad(n.map(m => m + 12), t, d * 16, 0.03); tone(hz(c[0] - 12), d * 16, 'sine', 0.12, mus, t, { atk: 0.4, rel: d * 4 }); }
        if ([0, 3, 6, 10, 13].includes(s) && R() < 0.75) bell(n[rnd(3)] + 24 + (R() < 0.3 ? 12 : 0), t, d * 6, 0.11);
        if (R() < 0.3) noise(0.05, 0.012, mus, t, 8000);
        if (v === 2 && s % 2 === 0) noise(0.08, 0.025, mus, t, 7000);   // бубенцы
      } },
    // финал: медленно и грустно, одна мелодия над пэдом
    // кассета: параметры (темп, гармония, стиль, мотив) задаёт AUDIO.tape(spec)
    tape: { bpm: 90, v: [[[57, 'm'], [53, 'M'], [48, 'M'], [55, 'M']]],
      play({ s, c, n, t, d, bar }) {
        const sp = tapeSpec || {}, st = sp.style || 'ballad', mot = sp.mot || [0, 2, 1, 2, 0, 1, 2, 1];
        const ep = (m, len, v) => { tone(hz(m), len, 'sine', v, mus, t, { atk: 0.006 }); tone(hz(m), len * 0.7, 'triangle', v * 0.35, mus, t, { atk: 0.006, det: 6 }); };
        if (st === 'ballad') {
          if (s === 0 || s === 8) n.forEach(m => ep(m, d * 7, 0.07));
          if (s % 2 === 0) lead(at(mot[(s / 2 + bar) % 8], n) + 12, t, d * 2.2, 0.05, 'sine');
          if (s === 0) bass(c[0] - 12, t, d * 8, 0.35, 'triangle');
          if (s === 0) kick(t, 0.35); if (s === 8) snare(t, 0.08);
        } else if (st === 'disco') {
          if (s % 4 === 0) kick(t, 0.6); if (s % 4 === 2) hat(t, 0.12, true);
          if (s === 4 || s === 12) clap(t, 0.12);
          bass(c[0] - 12 + (s % 2 ? 12 : 0), t, d * 0.9, 0.25, 'triangle');
          if (s % 4 === 2) n.forEach(m => ep(m + 12, d * 1.2, 0.04));
          if ([0, 3, 6, 10].includes(s)) lead(at(mot[(s + bar) % 8], n) + 12, t, d * 1.8, 0.06, 'triangle');
        } else if (st === 'rock') {
          if (s % 2 === 0) bass(c[0] - 12, t, d * 1.6, 0.3, 'triangle');
          if ([0, 6, 8].includes(s)) kick(t, 0.6); if (s === 4 || s === 12) snare(t, 0.16);
          if (s % 4 === 0) [c[0], c[0] + 7, c[0] + 12].forEach(m => tone(hz(m), d * 3.5, 'sawtooth', 0.025, mus, t, { ft: 'lowpass', f: 900 }));
          if (s % 4 === 2) lead(at(mot[(s / 2 + bar) % 8], n) + 12, t, d * 2, 0.05, 'triangle');
        } else {   // dvor: гитарный перебор
          if (s === 0 || s === 8) bass(c[0] - 12, t, d * 6, 0.4, 'triangle');
          if (s % 2 === 0 && s % 8) pluck(n[(s >> 1) % 3] + 12, t, d * 2.5, 0.1);
          if (s === 6 || s === 14) lead(at(mot[bar % 8], n) + 12, t, d * 3, 0.05, 'sine');
        }
      } },
    final: { bpm: 64, v: [[[57, 'm'], [53, 'M'], [48, 'M'], [52, 'M']], [[50, 'm'], [57, 'm'], [52, 'M'], [57, 'm']]],
      play({ s, c, n, t, d, v, bar }) {
        if (s === 0) { pad(n, t, d * 16, 0.04); tone(hz(c[0] - 12), d * 16, 'sine', 0.17, mus, t, { atk: 0.4, rel: 1 }); }
        FIN[v][bar].forEach(([st, m, l]) => { if (st === s && R() > 0.06) tone(hz(m), d * l, 'triangle', 0.13, musFx, t, { atk: 0.03, rel: d * l * 0.4 }); });
        if (s % 4 === 2) tone(hz(n[(s >> 2) % 3] + 12), d * 3, 'sine', 0.05, mus, t);
      } },
  };

  function tick() {
    if (!ctx || !on) return;
    if (nextT < ctx.currentTime - 0.25) nextT = ctx.currentTime + 0.05;   // вкладка спала — не догоняем пачкой
    while (nextT < ctx.currentTime + 0.15) {
      let tr = TRACKS[cur];
      if (s === 0) {
        if (want !== cur || retape) { retape = false; cur = want; tr = TRACKS[cur]; bar = 0; vi = rnd(tr.v.length); dly.delayTime.setTargetAtTime(45 / tr.bpm, ctx.currentTime, 0.1); }
        else if (bar >= tr.v[vi].length) { bar = 0; vi = (vi + (R() < 0.75 ? 1 : 2)) % tr.v.length; }
        fill = R() < 0.55;
      }
      const prog = tr.v[vi], c = prog[bar], last = bar === prog.length - 1;
      const p = { s, c, n: triad(c), t: Math.max(nextT, ctx.currentTime), d: 60 / tr.bpm / 4, v: vi, bar, last, roll: !!tr.drums && last && fill && s >= 12 };
      if (p.roll) roll(p, tr.drums);
      tr.play(p);
      nextT += p.d; if (++s === 16) { s = 0; bar++; }
    }
  }
  function startMusic() {
    if (!ctx || timer || !on) return;
    mus.gain.setTargetAtTime(ducked ? 0 : MUSV, ctx.currentTime, 0.3);
    nextT = ctx.currentTime + 0.05; timer = setInterval(tick, 25);
  }
  function stopMusic() { clearInterval(timer); timer = null; if (ctx) mus.gain.setTargetAtTime(0, ctx.currentTime, 0.15); }

  // ===== эмбиент: шумовая «постель» + редкие случайные события =====
  const dog = t => { const f = 380 + R() * 200; for (let i = 0, k = 1 + rnd(3); i < k; i++) { const tt = t + i * (0.25 + R() * 0.15);
    tone(f, 0.13, 'sawtooth', 0.08, amb, tt, { to: f * 0.6, ft: 'bandpass', f: 900, q: 2, atk: 0.01 }); noise(0.08, 0.04, amb, tt, 0, { ft: 'bandpass', f: 1200, q: 1 }); } };
  const tram = t => {
    noise(7, 0.2, amb, t, 0, { ft: 'lowpass', f: 140, atk: 3, rel: 3 });
    [2.5, 2.65, 3.8, 3.95].forEach(dt => noise(0.05, 0.12, amb, t + dt, 0, { ft: 'lowpass', f: 400 }));   // тук-тук на стыках
    if (R() < 0.6) [1, 1.35].forEach(dt => tone(1250, 1.2, 'triangle', 0.035, amb, t + dt));          // звонок
    if (R() < 0.5) tone(2300 + R() * 500, 2, 'sine', 0.012, amb, t + 2 + R() * 2, { atk: 0.4, rel: 1, vib: [6, 30] });   // скрип на повороте
  };
  const bird = t => { for (let i = 0, k = 2 + rnd(3); i < k; i++) tone(3000 + R() * 1500, 0.08, 'sine', 0.02, amb, t + i * 0.15, { to: 2000 + R() * 1000 }); };
  const car = t => { noise(4, 0.12, amb, t, 0, { ft: 'lowpass', f: 250, atk: 1.8, rel: 2 }); tone(70, 4, 'sawtooth', 0.02, amb, t, { to: 50, ft: 'lowpass', f: 200, atk: 1.8, rel: 2 }); };
  const train = t => { noise(5, 0.1, amb, t, 0, { ft: 'lowpass', f: 180, atk: 2, rel: 2 }); [311, 370].forEach(f => tone(f, 1.6, 'sawtooth', 0.015, amb, t + 1.5, { ft: 'lowpass', f: 900, atk: 0.2, rel: 0.6 })); };
  const shout = (t, dest = amb, v = 0.05) => { const f = 180 + R() * 200;
    tone(f, 0.25 + R() * 0.3, 'sawtooth', v, dest, t, { to: f * (R() < 0.5 ? 1.3 : 0.8), ft: 'bandpass', f: 900 + R() * 600, q: 2, vib: [5, 8], atk: 0.03 }); };
  const laugh = t => { const f = 220 + R() * 120; for (let i = 0, k = 3 + rnd(3); i < k; i++) tone(f * (1 - i * 0.03), 0.09, 'sawtooth', 0.035, amb, t + i * 0.14, { ft: 'bandpass', f: 1000, q: 2, atk: 0.01 }); };
  const clatter = t => { for (let i = 0, k = 2 + rnd(3); i < k; i++) noise(0.05, 0.06, amb, t + i * (0.06 + R() * 0.1), 0, { ft: 'bandpass', f: 2500 + R() * 2000, q: 8 }); };
  const jingle = (t, dest = amb, v = 0.03) => { for (let i = 0; i < 4; i++) tone(3000 + R() * 2000, 0.15, 'sine', v, dest, t + i * 0.05 + R() * 0.03); };
  const clink = t => { const f = 2600 + R() * 800; tone(f, 0.5, 'sine', 0.03, amb, t); tone(f * 2.7, 0.2, 'sine', 0.01, amb, t); };
  const whoop = t => tone(1200, 0.5, 'sine', 0.025, amb, t, { to: 2000, glide: 0.25, atk: 0.03 });
  const clock = t => noise(0.012, 0.07, amb, t, 0, { ft: 'bandpass', f: (tk ^= 1) ? 3500 : 2800, q: 6 });
  const typewriter = t => {
    for (let i = 0, k = 6 + rnd(18); i < k; i++) {
      noise(0.015, 0.12, amb, t, 0, { ft: 'bandpass', f: 1800 + R() * 1200, q: 3 }); tone(150, 0.02, 'square', 0.015, amb, t);
      t += 0.07 + R() * 0.12 + (R() < 0.1 ? 0.3 : 0);
    }
    if (R() < 0.6) { tone(2100, 0.6, 'sine', 0.035, amb, t + 0.1); noise(0.35, 0.05, amb, t + 0.3, 0, { ft: 'bandpass', f: 900, q: 1, fto: 2000 }); }   // дзынь и каретка
  };
  const drip = t => { tone(1500 + R() * 700, 0.08, 'sine', 0.05, amb, t, { to: 500, glide: 0.05 }); tone(900, 0.06, 'sine', 0.008, amb, t + 0.12, { to: 400 }); };
  const radioTune = t => { for (let i = 0, k = 3 + rnd(3); i < k; i++) tone(hz(pick([69, 72, 74, 76, 79])), 0.25, 'square', 0.012, amb, t + i * 0.28, { ft: 'bandpass', f: 1200, q: 3 }); };
  const gust = t => {
    noise(3 + R() * 3, 0.2, amb, t, 0, { ft: 'bandpass', f: 500, q: 1.5, fto: 1400 + R() * 600, atk: 1.2, rel: 1.8 });
    if (R() < 0.5) tone(700 + R() * 300, 2.5, 'sine', 0.01, amb, t + 0.5, { to: 1000 + R() * 400, atk: 0.8, rel: 1.2 });   // подвывание
  };
  // bed: [фильтр, Гц, Q, громкость, [частота, глубина] модуляции громкости, [частота, Гц] качания фильтра]; gap: пауза между событиями, с
  const AMB = {
    dvor:   { bed: [['lowpass', 380, 0.5, 0.22, [0.07, 0.12], [0.05, 150]]], gap: [4, 11], ev: t => pick([dog, tram, bird, bird, car])(t) },
    noch:   { bed: [['lowpass', 300, 0.5, 0.2, [0.05, 0.12], [0.04, 120]]], gap: [5, 14], ev: t => pick([dog, dog, car, train, tram])(t) },
    rynok:  { bed: [['bandpass', 350, 0.8, 0.25, [0.3, 0.1]], ['bandpass', 1100, 1.2, 0.12, [0.45, 0.07], [0.2, 300]]], gap: [0.8, 3], ev: t => pick([shout, shout, clatter, jingle, laugh])(t) },
    dk:     { bed: [['lowpass', 500, 0.7, 0.28, [0.2, 0.1]], ['bandpass', 1000, 1, 0.1, [0.35, 0.06]]], gap: [2, 6], ev: t => pick([laugh, shout, clink, whoop])(t) },
    otdel:  { bed: [['lowpass', 120, 0.7, 0.12]], gap: [1, 1], ev: t => { clock(t); if (R() < 0.07) typewriter(t + 0.4); } },
    kuhnya: { bed: [['lowpass', 90, 1, 0.1], ['bandpass', 1400, 1.5, 0.035, [4.3, 0.03]]], gap: [1.2, 4.5], ev: t => R() < 0.8 ? drip(t) : radioTune(t) },
    pustyr: { bed: [['bandpass', 600, 0.8, 0.3, [0.11, 0.2], [0.07, 400]], ['highpass', 3000, 0.5, 0.05, [0.17, 0.04]]], gap: [3, 8], ev: gust },
  };
  const AMB_OF = { dvor: 'dvor', garazhi: 'dvor', korobka: 'dvor', ostanovka: 'noch', noch: 'noch', rynok: 'rynok', dk: 'dk', shkola: 'dk',
    otdel: 'otdel', kuhnya: 'kuhnya', gazeta: 'kuhnya', pustyr: 'pustyr' };
  let ambCur = null, ambWant = null, ambBed = null, ambGen = 0;
  function lfo(rate, depth, param, list) { const o = ctx.createOscillator(), g = gain(depth); o.frequency.value = rate * (0.8 + R() * 0.4); o.connect(g); g.connect(param); o.start(); list.push(o); }
  function bed(layers) {
    const out = gain(0, amb), t = ctx.currentTime, nodes = [];
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(1, t + 2.5);
    layers.forEach(([ft, f, q, vol, am, sw]) => {
      const src = ctx.createBufferSource(), fl = filt(ft, f, q), g = gain(vol, out);
      src.buffer = nbuf; src.loop = true; src.connect(fl); fl.connect(g);
      if (am) lfo(am[0], am[1], g.gain, nodes);
      if (sw) lfo(sw[0], sw[1], fl.frequency, nodes);
      src.start(t, R() * NB); nodes.push(src);
    });
    return { out, nodes };
  }
  function setAmb(name) {
    if (!ctx || name === ambCur) return;
    ambCur = name; const gen = ++ambGen;
    if (ambBed) { const b = ambBed, t = ctx.currentTime;
      b.out.gain.cancelScheduledValues(t); b.out.gain.setValueAtTime(b.out.gain.value, t); b.out.gain.linearRampToValueAtTime(0, t + 1.5);
      setTimeout(() => b.nodes.forEach(n => n.stop()), 1700); ambBed = null; }
    const A = AMB[name]; if (!A) return;
    ambBed = bed(A.bed);
    const loop = () => { if (gen !== ambGen) return; A.ev(ctx.currentTime + 0.05); setTimeout(loop, 1000 * (A.gap[0] + R() * (A.gap[1] - A.gap[0]))); };
    setTimeout(loop, 1000 * (1 + R() * A.gap[1] / 2));
  }

  // ===== эффекты =====
  function bellUi(f, t, v) { tone(f, 0.6, 'sine', v, master, t, { atk: 0.004 }); tone(f * 2.01, 0.25, 'sine', v * 0.3, master, t, { atk: 0.004 }); }
  const SFX = {
    coin(t) { bellUi(988, t, 0.07); bellUi(1319, t + 0.08, 0.07); jingle(t + 0.02, master, 0.04); },
    door(t) {
      tone(90, 0.7, 'sawtooth', 0.09, master, t, { to: 140, ft: 'bandpass', f: 700, q: 4, vib: [18, 25], atk: 0.05 });   // скрип
      tone(80, 0.25, 'sine', 0.35, master, t + 0.7, { to: 45 }); noise(0.15, 0.2, master, t + 0.7, 0, { ft: 'lowpass', f: 500 });   // хлоп
    },
    whistle(t) { [[0, 0.3], [0.45, 0.7]].forEach(([dt, l]) => { tone(2900, l, 'sine', 0.09, master, t + dt, { vib: [28, 180], atk: 0.02 }); noise(l, 0.03, master, t + dt, 0, { ft: 'bandpass', f: 3000, q: 2 }); }); },
    crowd(t) { noise(1.4, 0.14, master, t, 0, { ft: 'bandpass', f: 900, q: 0.8, atk: 0.15, rel: 0.8 }); for (let i = 0; i < 6; i++) shout(t + R() * 0.6, master, 0.06); },
    swish(t) { noise(0.28, 0.25, master, t, 0, { ft: 'bandpass', f: 500, q: 1.5, fto: 3500, atk: 0.08 }); },
    page(t) { noise(0.18, 0.12, master, t, 0, { ft: 'highpass', f: 2500, atk: 0.03 }); noise(0.12, 0.08, master, t + 0.16, 0, { ft: 'bandpass', f: 4000, q: 1 }); noise(0.1, 0.1, master, t + 0.05, 0, { ft: 'lowpass', f: 600 }); },
    // сирена «лунохода»: вой вверх-вниз 4 секунды, с удалением
    siren(t) { for (let i = 0; i < 5; i++) tone(620, 0.42, 'sawtooth', 0.05, master, t + i * 0.8, { to: 980, ft: 'lowpass', f: 1800, atk: 0.05 }),
      tone(980, 0.38, 'sawtooth', 0.05, master, t + i * 0.8 + 0.4, { to: 620, ft: 'lowpass', f: 1800, atk: 0.03 }); },
    steps(t) { for (let i = 0; i < 10; i++) noise(0.05, 0.18, master, t + i * 0.24 + R() * 0.03, 0, { ft: 'lowpass', f: 400 }); },
    slam(t) { tone(55, 1.4, 'sine', 0.6, master, t, { to: 30 }); noise(0.6, 0.35, master, t, 0, { ft: 'lowpass', f: 900 });
      tone(hz(45), 2, 'sawtooth', 0.08, master, t, { ft: 'lowpass', f: 600 }); tone(hz(57), 2, 'sawtooth', 0.06, master, t, { ft: 'lowpass', f: 800 }); },
    achievement(t) { [72, 76, 79, 84].forEach((m, i) => tone(hz(m), 0.25, 'triangle', 0.09, master, t + i * 0.08, { ft: 'lowpass', f: 2600 })); tone(hz(88), 0.8, 'triangle', 0.06, master, t + 0.32); noise(0.5, 0.04, master, t + 0.32, 7000); },
  };

  return {
    start() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); startMusic(); if (on) setAmb(ambWant); },
    track(name) { if (TRACKS[name]) want = name; },
    // кассета: { bpm, prog: [[MIDI, 'm'|'M'] ×4], style: 'ballad'|'disco'|'rock'|'dvor', mot: [8 индексов] }
    tape(spec) {
      if (!spec) return;
      if (tapeSpec !== spec) { tapeSpec = spec; TRACKS.tape.bpm = spec.bpm; TRACKS.tape.v = [spec.prog]; retape = true; }
      want = 'tape';
    },
    // all, music: 0..1 из настроек
    setVolume(all, music) {
      VOL = 0.5 * all; MUSV = 0.12 * 2 * music;
      if (ctx) { master.gain.setTargetAtTime(VOL, ctx.currentTime, 0.05); if (on) mus.gain.setTargetAtTime(ducked ? 0 : MUSV, ctx.currentTime, 0.05); }
    },
    duck(d) { ducked = !!d; if (ctx && on) mus.gain.setTargetAtTime(ducked ? 0 : MUSV, ctx.currentTime, 0.5); },
    ambience(bg) { ambWant = AMB_OF[bg] || null; if (on) setAmb(ambWant); },   // null или неизвестный фон — тишина
    sfx(name) { if (ctx && SFX[name]) SFX[name](ctx.currentTime); },
    // мягкий деревянный клик и тихий колокольчик вместо писка
    click() { if (!ctx) return; noise(0.02, 0.12, master, 0, 0, { ft: 'bandpass', f: 1800, q: 2 }); tone(320, 0.04, 'sine', 0.08); },
    ok() { if (!ctx) return; const t = ctx.currentTime; bellUi(hz(76), t, 0.1); bellUi(hz(83), t + 0.09, 0.09); },
    no() { tone(196, 0.25, 'sawtooth', 0.15); },
    hit() { noise(0.15, 0.4); tone(90, 0.15, 'sine', 0.4); },
    // пишущая машинка: щелчок рычага + удар литеры по бумаге на валике; в конце строки — перевод каретки
    type() {
      if (!ctx) return; const t = ctx.currentTime, v = 0.7 + R() * 0.5;
      noise(0.012, 0.16 * v, master, t, 0, { ft: 'bandpass', f: 3200 + R() * 1400, q: 1.5 });
      noise(0.035, 0.22 * v, master, t + 0.006, 0, { ft: 'bandpass', f: 900 + R() * 300, q: 1.2 });
      tone(140 + R() * 30, 0.05, 'sine', 0.07 * v, master, t + 0.006);
    },
    ret() {
      if (!ctx) return; const t = ctx.currentTime;
      noise(0.28, 0.07, master, t, 0, { ft: 'bandpass', f: 1400, q: 0.8, fto: 700, atk: 0.04 });
      bellUi(hz(93), t + 0.02, 0.025);
    },
    whoosh() { noise(0.5, 0.12); tone(110, 1.2, 'sawtooth', 0.08); tone(55, 1.6, 'sine', 0.2); },
    musicOn: () => on,
    // выключатель гасит и музыку, и эмбиент; эффекты остаются
    toggleMusic() { on = !on; try { localStorage.setItem('asfalt_music', on ? '1' : '0'); } catch (e) {} if (on) { init(); startMusic(); setAmb(ambWant); } else { stopMusic(); setAmb(null); } },
  };
})();
