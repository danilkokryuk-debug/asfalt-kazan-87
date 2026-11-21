// Механики: репутация у каждой моталки, слухи, улики, армия и зона (в Карьере — главы, а не конец).

// ===================== РЕПУТАЦИЯ У МОТАЛОК =========================================================
// S.rep[gangId] от −100 (кровники) до 100 (союзники). ≥30 — не трогают на их асфальте, ≥60 — союз (не нападают).
const repOf = (S, g) => (S.rep || {})[g] || 0;
function repAdd(g, v) {
  if (!g || g === S.gang) return;
  S.rep = S.rep || {};
  S.rep[g] = Math.max(-100, Math.min(100, repOf(S, g) + v));
}
const repWord = v => v >= 60 ? 'союзники' : v >= 30 ? 'уважают' : v > -30 ? 'нейтрально' : v > -60 ? 'враги' : 'кровники';

// ===================== СЛУХИ ======================================================================
// S.rumors = [{ kind, g, due }] — через несколько дней доходят до людей
function rumor(kind, g, days) { S.rumors = S.rumors || []; S.rumors.push({ kind, g, due: S.day + days }); }
const RUMOR = {
  revenge: { title: 'Старший брат', lines: S => [`Слух дошёл: ты побил пацана с ${DIST[S.ru.g].name}. Его старший брат ищет тебя.`,
    ['chuzhoy:Старший брат', V('Ты моего младшего тронул? Ну всё.', 'Слышь. Это ты моего брата отделал?', 'Пошли поговорим. За гаражи.'), 'angry']],
    choices: S => [
      { t: 'Ответить', fx: s => { s.kf = { name: 'Старший брат', hp: 4, pow: 4 + s.rank, win: { txt: 'Теперь слух другой: тебя лучше не трогать.', fx: { avt: 5 } }, lose: { txt: 'Брат своё взял.', fx: { zdor: -10 } } }; }, go: 'k_fight' },
      { t: 'Откупиться (10 р.)', req: { dengi: 10 }, fx: { dengi: -10, uvazh: -3 }, txt: '«Ладно. Но ещё раз — и разговора не будет».' },
      { t: 'Объясниться', chk: ['yaz', 5 + S.rank], ok: { txt: 'Он выслушал. «Сам нарвался, говоришь? Ладно».', fx: s => repAdd(s.ru.g, 10) }, no: { txt: 'Слушать не стал.', go: 'k_fight', fx: s => { s.kf = { name: 'Старший брат', hp: 4, pow: 4 + s.rank, win: { fx: { avt: 5 } }, lose: { fx: { zdor: -10 } } }; } } },
    ] },
  coward: { title: 'Слухи', lines: () => ['По району ползёт слух: ты сбежал из драки.', ['chuzhoy:Пацан со двора', V('О, бегун пришёл!', 'Здорово, спринтер.', 'Говорят, ты быстрее «Жигулей».'), 'smile']],
    choices: [{ t: 'Стерпеть', fx: { uvazh: -4 }, txt: 'Смешки за спиной. Это надо будет смыть.' },
      { t: 'Врезать шутнику', fx: { uvazh: 2, mil: 3 }, txt: 'Больше не шутит. Но слух от этого не умер.' }] },
  hero: { title: 'Слухи', lines: S => [`О тебе говорят по всему району: «${S.nick || S.name} — чёткий пацан».`, ['sq0', 'Слышь, про тебя даже на Жилке знают!', 'smile']],
    choices: [{ t: 'Приятно', fx: { avt: 3, uvazh: 3 } }] },
};
def('m_rumor', {
  mode: 'any', repeat: true, bg: 'dvor',
  trigger: S => (S.rumors || []).some(r => r.due <= S.day),
  fx: S => { const i = S.rumors.findIndex(r => r.due <= S.day); S.ru = S.rumors.splice(i, 1)[0]; },
  title: S => RUMOR[S.ru.kind].title,
  lines: S => RUMOR[S.ru.kind].lines(S),
  choices: S => T(RUMOR[S.ru.kind].choices),
});

// ===================== УЛИКИ =========================================================================
// После серьёзных драк копятся улики (S.ulik). При 3+ приходит Гарипов.
def('m_ulik', {
  mode: 'any', repeat: true, title: 'Улики', bg: 'otdel', where: 'Отдел милиции',
  trigger: S => (S.ulik || 0) >= 3 && S.mode !== 'surv',
  lines: S => [
    ['garipov', V('Свидетельница видела тебя у гаражей. Куртку опознала.', 'На месте драки нашли пуговицу. От твоей куртки, а?', 'Соседка говорит, ты пришёл домой весь в крови. Объяснишь?'), 'smile'],
    ['garipov', 'Ещё немного — и дело заведу. Думай.'],
  ],
  choices: S => [
    { t: 'Сжечь куртку в мусорке', if: () => !ITEM[S.wear.outer].start, fx: s => { const id = s.wear.outer; s.owned = s.owned.filter(x => x !== id); s.wear.outer = 'o_none'; s.ulik = 0; return { mil: 5 }; },
      txt: 'Любимая куртка горит в баке за гаражами. Зато пуговицу теперь не к чему примерить.' },
    { t: 'Договориться со свидетелем (10 р.)', req: { dengi: 10 }, fx: s => { s.ulik = 1; return { dengi: -10, sovest: -3 }; }, txt: 'Соседка вдруг «ничего не помнит».' },
    { t: 'Ничего не делать', fx: s => { s.ulik = 0; return { mil: 25 }; }, txt: 'Гарипов заводит папку с твоим именем.' },
  ],
});

// ===================== ПОСЛЕ ДРАКИ (вызывается из движка) =====================================================
function afterFight(how, ev) {
  const g = S.ctrl[S.at] && S.ctrl[S.at] !== S.gang ? S.ctrl[S.at] : null;
  if (g) repAdd(g, how === 'win' ? -8 : -3);
  if (how === 'win' && g && Math.random() < 0.35) rumor('revenge', g, 3 + rnd(5));
  if (how === 'flee' && Math.random() < 0.6) rumor('coward', null, 2 + rnd(3));
  if (how === 'win' && S.cnt.wins % 5 === 0) rumor('hero', null, 2);
  if (T(ev.fight.hp) >= 4 || Math.random() < 0.3) S.ulik = (S.ulik || 0) + 1;
}

// Действие на карте: замести следы (дома)
function mechActions(S, d) {
  const a = [];
  if (d === S.home && (S.ulik || 0) > 0) a.push({ t: `Замести следы (улик: ${S.ulik})`, req: { dengi: 2 }, fx: s => { s.ulik--; return { dengi: -2 }; },
    txt: 'Застирал кровь хозяйственным мылом, выбросил разбитые часы. Чище.' });
  if (d === 'center') {
    a.push({ t: 'Кассета у ларька (3 р.)', req: { dengi: 3 }, fx: s => { s._t = buyTape().txt; return { dengi: -3 }; }, txt: s => s._t });
    a.push({ t: 'Жвачка «Turbo» с вкладышем (1 р.)', req: { dengi: 1 }, fx: s => { s._t = buyGum().txt; return { dengi: -1 }; }, txt: s => s._t });
  }
  const g = S.ctrl[d];
  if (g && g !== S.gang && S.rank >= 2 && !(typeof era90 === 'function' && era90(S))) a.push({ t: `Переговоры со старшими «${DIST[g].gang}» (${repWord(repOf(S, g))})`, chk: ['yaz', 5 + Math.max(0, -repOf(S, g) / 20 | 0)],
    ok: { txt: 'Посидели, поговорили. Друг друга поняли.', fx: s => { repAdd(g, 15); return { avt: 2 }; } },
    no: { txt: 'Разговора не вышло. Ушли злые.', fx: s => { repAdd(g, -5); } } });
  return a;
}

// ===================== АРМИЯ (Карьера) ==================================================================
def('m_army', {
  mode: 'career', title: 'Повестка', bg: 'kuhnya',
  trigger: S => S.day >= dayNum(1988, 6, 1),   // в Карьере герою уже под 18
  lines: S => ['В почтовом ящике повестка. Тебе восемнадцать.', ['mama', 'Сынок… может, справку? У тёти Розы знакомый врач…', 'sad']],
  choices: S => [
    { t: 'Откосить: справка за 60 р.', req: { dengi: 60 }, fx: { dengi: -60 }, txt: '«Плоскостопие третьей степени». Ты и не знал, что так болен.' },
    { t: 'Откосить: справка за $15', req: { dol: 15 }, fx: { dol: -15 }, txt: 'Доллары творят чудеса медицины.' },
    { t: 'Бегать от военкомата', fx: { mil: 30 }, txt: 'Теперь тебя ищет не только Гарипов.' },
    { t: 'Пойти служить (2 года)', fx: s => {
      s.day += 730; s.squad = []; s.withMe = null; s.points = [];
      DISTRICTS.forEach(d => { if (d.gang && d.id !== s.home && Math.random() < 0.3) s.ctrl[d.id] = pick(DISTRICTS.filter(x => x.gang)).id; });
      log('Два года армии позади. Город изменился.');
      return { sila: 2, lovk: 1, zdor: 100, uvazh: -20, mil: -100, avt: 20 };
    }, txt: 'Два года. Ты вернулся другим — сильнее и злее. Скорлупы твоей больше нет, точки отжаты, а город поделён по-новому.' },
  ],
});

// ===================== ЗОНА (Карьера: глава, а не конец) ============================================================
const ZONA_DAYS = 365;
def('m_zona1', {
  mode: 'career', title: 'Зона', bg: 'otdel', card: ['Колония', 'Год жизни'],
  fx: S => { S.flags.zona = S.day; S.st.mil = 0; },
  lines: [
    'Колония под Казанью. Барак на сорок человек.',
    ['starsh:Смотрящий', 'Ну, новенький. Кем по жизни будешь?'],
  ],
  choices: S => [
    { t: '«Пацан. Своих не сдал»', chk: ['yaz', 5], ok: { txt: '«Проверим». Тебе дают нижнюю шконку у окна.', fx: { uvazh: 10 } }, no: { txt: '«Все так говорят». Придётся доказывать.', go: 'm_zona2' } },
    { t: 'Промолчать', go: 'm_zona2' },
  ],
});
def('m_zona2', {
  mode: 'career', title: 'Место', bg: 'otdel',
  text: 'Ночью к тебе подходят трое. Место у окна кому-то нужнее.',
  fight: { name: 'Блатные', hp: 4, pow: 6, flee: false, call: false,
    win: { txt: 'Утром на тебя смотрят по-другому.', fx: { avt: 15 }, go: 'm_zona3' },
    lose: { txt: 'Ты отстоял себя, хоть и с разбитым лицом. Это засчитали.', fx: { zdor: -20 }, go: 'm_zona3' } },
});
def('m_zona3', {
  mode: 'career', title: 'Свобода', bg: 'noch', card: ['Через год', 'Освобождение'],
  fx: S => { S.day += ZONA_DAYS; S.squad = []; S.withMe = null; S.points = []; S.st.zdor = 80; },
  lines: S => ['Ворота открываются. Холодно, пахнет свободой и соляркой.',
    ['starsh', `${S.nick || S.name}! Живой. Отсидел — значит, свой. Тебя ждут.`, 'smile']],
  choices: [{ t: 'Домой', fx: { avt: 30, uvazh: 15 }, txt: 'Год вычеркнут из жизни. Но на районе тебя теперь называют уважительно — «отсидевший».' }],
});
