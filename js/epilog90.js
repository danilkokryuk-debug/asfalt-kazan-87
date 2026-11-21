// Связка систем девяностых с сюжетом Кампании и финалом:
// — убийцей на последней стрелке может стать авторитет, с чьим кланом ты воевал;
// — в главе 7 появляются Хасан-ага, Барон и Тагир; в главе 8 уже женатый герой не женится второй раз;
// — финальные титры помнят жену, детей, бригаду по именам, влияние, кланы и машину.
{ const k0 = KILLER; KILLER = S => {
  const k = k0(S);
  if (k !== 'zima' && k !== 'moskvich') return k;   // гарипов, Ильдар, Крест — их личные счёты важнее
  if (S.crel) { const war = ['tatarin', 'baron', 'hasan'].find(c => S.crel[c] === 'voyna'); if (war) return war; }
  if (S.flags.tagir_win) return 'tatarin';
  return k;
}; }
// глава 9: кто сдаёт и кто стреляет
const K90 = {
  hasan: { who: 'hasan', pred: 'Хасан-ага. Старый вор решил, что ты нарушил понятия. Он никогда не спешит — и никогда не прощает.', shot: 'Ты жил не по понятиям, сынок. Я долго ждал, что одумаешься.',
    cr: 'Хасана-агу короновали ещё раз — уже в Москве. Он умер своей смертью, в девяносто девять, в своей постели.' },
  baron: { who: 'baron', pred: 'Барон. Ты мешал его бизнесу. А бизнес — это когда ничего личного.', shot: 'Ничего личного. Ты просто стоил слишком дорого.',
    cr: 'Барон стал банкиром, потом депутатом, потом сенатором. Малиновый пиджак висит у него в музее «Казань девяностых».' },
  tatarin: { who: 'tatarin', pred: 'Тагир «Борец». Спортсмены не забыли войну за районы. Они просто ждали.', shot: 'Кто сильнее — тот и прав. Сегодня сильнее я.',
    cr: 'Тагира посадили в 2003-м. Его спортсмены открыли сеть фитнес-клубов.' },
};
{ const e = EV.c9_predatel; if (e) { const l = e.lines; e.lines = S => { const k = K90[S.flags.killer]; if (!k) return l(S);
  return ['Взяли твой склад. Потом машину с деньгами. Потом убили водителя. Кто-то сливает всё.', ['zima', k.pred, 'angry']]; }; } }
{ const e = EV.c9_strelka; if (e) { const l = e.lines; e.lines = S => { const k = K90[S.flags.killer], base = l(S); if (!k) return base;
  return base.map((x, i) => i === 1 ? [k.who, k.shot, 'angry'] : x); }; } }
// глава 7: город делят авторитеты
{ const e = EV.c7_start; if (e) { const l = e.lines; e.lines = S => [...l(S),
  'Город теперь держат не моталки, а структуры: воры старого Хасана-аги, коммерсы Барона в малиновых пиджаках, спортсмены Тагира и «красная крыша» в погонах. На карте — их территории.'];
  const fx = e.fx; e.fx = S => { const r = fx(S); if (typeof clanInit === 'function') clanInit(S); return r; }; } }
// глава 8: если уже женат (через «Семью») — разговор о детях, а не свадьба
{ const e = EV.c8_semya; if (e) { const ch = e.choices, ln = e.lines;
  e.lines = S => S.flags.zhenat && S.flags.zhena ? [[S.flags.zhena, (FAM(S).kids.length ? 'Дети спрашивают, почему папа приходит под утро.' : 'Я хочу ребёнка. Но не хочу растить его одна, когда тебя…') + ' Скажи честно: у нас будет семья — или фотография на кладбище?', 'sad']] : ln(S);
  e.choices = S => S.flags.zhenat && S.flags.zhena ? [
    { t: 'Отойти от дел. Ради семьи', fx: s => { if (!FAM(s).kids.length) FAM(s).kids.push({ boy: true, name: s.name, born: s.day, rel: 70 }); s.flags.syn = true; return { flag: 'otoshel', lyub: 20, sovest: 12, avt: -15 }; }, txt: 'Ты продал долю в ларьках. Месяц спишь по ночам. Почти поверил, что можно уйти.' },
    { t: 'Семья — семьёй, бригада — бригадой', fx: { lyub: -6 }, txt: 'По ночам — звонки на пейджер. Жена больше не спрашивает, куда ты едешь.' }] : ch(S); } }

// финальные титры: вся твоя жизнь
{ const cs = creditsSlides; creditsSlides = S => {
  const sl = cs(S), f = S.flags, add = [];
  const k = K90[f.killer]; if (k) { const i = sl.findIndex(x => x[0] === 't_9_defolt'); if (i >= 0) sl[i] = ['t_9_defolt', k.cr]; }
  const wife = f.zhena && f.zhena !== 'natasha' ? GIRLS[f.zhena] : null, kids = typeof FAM === 'function' ? FAM(S).kids : [];
  if (wife) add.push(['t_9_natasha', `${wife} осталась вдовой в ${typeof girlAge === 'function' ? girlAge(S) : 25}. Замуж больше не вышла.`]);
  if (kids.length > 1 || (kids.length && !f.syn)) add.push(['t_9_deti', kids.map(c => `${c.name} — ${c.boy ? 'сын' : 'дочь'}`).join(', ') + '. Они вырастут в другом городе и в другой стране. Отца будут помнить по фотографии с «Мерседесом».']);
  if (typeof vlTitle === 'function' && S.vl != null) add.push(['t_9_restoran', `В 1998-м тебя знали как «${vlTitle(S).toLowerCase()}». Влияние — ${S.vl}.` + (S.clan ? ` Твои люди держали ${clanCount(S, 'me')} районов. Через месяц их поделили другие.` : '')]);
  if (S.brig && S.brig.length) { const alive = S.brig.filter(b => !b.dead), dead = S.brig.filter(b => b.dead);
    add.push(['t_9_brigada', (alive.length ? `${alive.map(brigName).join(', ')} — ${alive.length > 1 ? 'твоя бригада — несли' : 'последний из твоей бригады — нёс'} гроб. ` : '') + (dead.length ? `${dead.map(brigName).join(', ')} — ${dead.length > 1 ? 'не дожили' : 'не дожил'} до этого дня.` : '')]); }
  if (S.car) add.push(['t_r_trassa', `${CAR[S.car.id].name} ещё год стоял у подъезда. Потом его угнали. Говорят, разобрали на запчасти в Савинове.`]);
  const at = sl.findIndex(x => x[0] === 't_9_defolt'); sl.splice(at >= 0 ? at : sl.length, 0, ...add);
  return sl;
}; }
