// Задания по статусу и заметные сверхзадания.
// — Мелкая работа (почта, бабушки, картошка, собака, овощебаза, бомбить на машине…) — только до звания «Супер».
//   С «Молодого» и выше — не по статусу: такие маячки больше не появляются.
// — Особое задание (★) видно издалека: столб красно-фиолетового света над районом и мигающая плашка над картой.
const PETTY = ['j_posylka', 'j_shuher', 'j_kiosk', 'j_sobaka', 'j_zapiska', 'j_deficit', 'j_zhiguli', 'j_vagon', 'j_pensiya', 'j_magnitofon',
  'j_sobranie', 'j_tramvay', 'j_stroyka', 'j_kotelnaya', 'j_golubi', 'j_kachalka', 'j_podezd', 'j_ovoshebaza', 'j_pochta', 'j_larek', 'j_budka',
  'j_park', 'j_svalka', 'j_avtobus', 'j_stolovaya', 'j_kafe', 'j_taksi', 'j_sportzal', 'j_v_bomb', 'j_v_katat', 'j_a_brat_dvoika', 'j_d_drova',
  'j_a_habib_pens', 'j_c_taksi90', 'j_9_chelnok'];
PETTY.forEach(id => { if (TPL[id]) TPL[id].max = Math.min(TPL[id].max ?? 9, 2); });
// уже висящие мелкие маячки исчезают, когда вырос
{ const jh = jobsHour; jobsHour = () => { if (S && S.jobs) S.jobs = S.jobs.filter(j => !(PETTY.includes(j.id) && S.rank > 2)); return jh(); }; }

// ---------- особое задание: плашка над картой ----------
{ const rm = renderMap_; renderMap_ = sel => {
  rm(sel);
  const j = (S.jobs || []).find(x => x.special && TPL[x.id]), wrap = $('#mapwrap');
  if (!j || !wrap) return;
  const h = Math.max(1, Math.round((j.until - now()) / 60));
  const b = document.createElement('button'); b.className = 'sp-banner';
  b.innerHTML = `<span>★ ОСОБОЕ ДЕЛО</span><b>${TPL[j.id].title(j.p)}</b><em>${DIST[j.d].name} · ещё ${h} ч</em>`;
  b.onclick = e => { e.stopPropagation(); selDist = j.d; AUDIO.click(); renderMap(); };
  wrap.appendChild(b);
}; }
// звук и уведомление, когда появилось
{ const sh = specialHour; specialHour = () => { const had = (S.jobs || []).some(j => j.special); sh();
  const j = (S.jobs || []).find(x => x.special);
  if (!had && j && typeof __TEST === 'undefined') { try { AUDIO.sfx && AUDIO.sfx('coin'); } catch (e) {}
    if (typeof pagerPush === 'function') pagerPush(S, { from: '★ Особое', text: `${TPL[j.id].title(j.p)} · ${DIST[j.d].name}`, act: 'job:' + j.uid, key: 'sp' + j.uid }); } }; }
// ---------- столб света над районом особого задания (на холсте карты) ----------
{ const me = mapExtra; mapExtra = (ctx, t, v) => { me(ctx, t, v);
  const j = S && (S.jobs || []).find(x => x.special); if (!j || !CENTROID[j.d]) return;
  const [x, y] = CENTROID[j.d], { k, ox, oy, dpr } = v, s = 1 / k;
  ctx.setTransform(k * dpr, 0, 0, k * dpr, ox * dpr, oy * dpr);
  const pulse = 0.65 + Math.sin(t / 260) * 0.35, hgt = 120 * s * 3, w = 16 * s * 2;
  const g = ctx.createLinearGradient(x, y, x, y - hgt);
  g.addColorStop(0, `rgba(255,60,90,${0.75 * pulse})`); g.addColorStop(0.35, `rgba(176,76,255,${0.45 * pulse})`); g.addColorStop(1, 'rgba(176,76,255,0)');
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - w * 0.5, y); ctx.lineTo(x - w * 0.15, y - hgt); ctx.lineTo(x + w * 0.15, y - hgt); ctx.lineTo(x + w * 0.5, y); ctx.fill();
  for (let i = 0; i < 2; i++) { const r = ((t / 900 + i / 2) % 1) * 22 * s * 2; ctx.strokeStyle = `rgba(255,80,160,${(1 - ((t / 900 + i / 2) % 1)) * 0.9})`; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0, 7); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over';
}; }
