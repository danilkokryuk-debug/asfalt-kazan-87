// Личные истории бойцов бригады: у каждого своя беда или мечта, в две части.
// Как поступишь в первой — так повернётся вторая: верность до смерти, уход, предательство, гибель.
const BSTORY = ['mat', 'afgan', 'ucheba', 'dolg', 'brat', 'svadba'];
const bsCur = S => (S.brig || []).find(b => b.id === S.flags.bs_who);
const BN = S => { const b = bsCur(S); return b ? `${b.name} «${b.nick}»` : 'Боец'; };
const BK = S => { const b = bsCur(S); return b ? `chuzhoy:${b.nick}` : 'chuzhoy'; };
const bL = (S, n) => { const b = bsCur(S); if (b) b.loyal = clamp(b.loyal + n, 0, 100); };
const bOut = (S, how) => { const b = bsCur(S); if (b) b[how] = S.day; };
// раз в неделю: у бойца без истории — выпадает история; через месяц — её продолжение
{ const bw = brigWeek; brigWeek = (S, w) => { bw(S, w);
  if (!brigOn(S) || S.cur) return;
  const al = brigAlive(S);
  al.forEach(b => { if (!b.story) { const used = (S.brig || []).map(x => x.story); b.story = BSTORY.find(s => !used.includes(s)) || pick(BSTORY); b.st = 0; } });
  const b1 = al.find(b => b.st === 1 && S.day - b.stDay >= 30), b0 = al.find(b => b.st === 0 && S.day - (b.since || 0) >= 14);
  const b = b1 || (Math.random() < 0.5 ? b0 : null); if (!b) return;
  S.flags.bs_go = 'bs_' + b.story + (b.st + 1); S.flags.bs_who = b.id; b.st++; b.stDay = S.day;
}; }
const BS = (id, o) => def(id, { mode: 'any', repeat: true, bg: o.bg || 't_9_brigada', ...o,
  trigger: S => S.flags.bs_go === id && !!bsCur(S), fx: S => { S.flags.bs_go = null; } });   // запускается из brigWeek

// ---- мать ----
BS('bs_mat1', { title: 'Мать', bg: 't_r_bolnica', lines: S => [[BK(S), 'Шеф… Мать в больнице. Сердце. Говорят, операция только в Москве. Я не прошу. Просто… сказал.', 'sad']],
  choices: S => [{ t: `Оплатить операцию (${50 * inflation(S)} р.)`, req: { dengi: 50 * inflation(S) }, fx: s => { bL(s, 40); s.flags['bs_mat_' + s.flags.bs_who] = 1; return { dengi: -50 * inflation(s), sovest: 8 }; }, txt: () => `${BN(S)} долго молчит. Потом просто жмёт руку. Двумя руками.` },
    { t: '«Дела есть дела»', fx: s => { bL(s, -25); }, txt: 'Он кивает. И уходит, не оборачиваясь.' }] });
BS('bs_mat2', { title: 'Мать', bg: 'kuhnya', lines: S => S.flags['bs_mat_' + S.flags.bs_who] ? [[BK(S), 'Мать жива. Передала тебе пирожки. Говорит, молится за тебя каждый вечер. Я за тебя — умру, понял?', 'smile']] : [`Мать ${BN(S)} умерла в больнице на Чистопольской. Он неделю пьёт и ни с кем не говорит.`],
  choices: S => S.flags['bs_mat_' + S.flags.bs_who] ? [{ t: 'Обнять', fx: s => { bL(s, 30); const b = bsCur(s); if (b) b.sila += 1; }, txt: 'Теперь он — твой самый верный человек.' }]
    : [{ t: 'Прийти на похороны', fx: s => { bL(s, 15); return { sovest: 4 }; }, txt: 'Он увидел тебя у могилы. Может, простит.' }, { t: 'Не идти', fx: s => { bL(s, -20); if (Math.random() < 0.5) bOut(s, 'gone'); }, txt: 'Через неделю его место за столом пустое.' }] });
// ---- афганец ----
BS('bs_afgan1', { title: 'Срыв', bg: 't_9_restoran', lines: S => [`${BN(S)} — прошёл Афган. Ночью в ресторане он избил официанта: тот уронил поднос, и звон был как выстрел.`, ['oficiant', 'Он меня чуть не убил… За что?!', 'scared']],
  choices: S => [{ t: `Замять и отправить его в санаторий (${30 * inflation(S)} р.)`, req: { dengi: 30 * inflation(S) }, fx: s => { s.flags['bs_af_' + s.flags.bs_who] = 1; bL(s, 20); return { dengi: -30 * inflation(s) }; }, txt: 'Месяц под Зеленодольском: сосны, тишина, врач-психиатр, который сам был под Кандагаром.' },
    { t: 'Замять, но оставить при деле', fx: s => { bL(s, 5); return { mil: 8 }; }, txt: 'Официанту — конверт. Афганцу — «держи себя в руках».' },
    { t: 'Выгнать', fx: s => { bOut(s, 'gone'); return { sovest: -3 }; }, txt: 'Он уходит молча. Война так и не кончилась для него.' }] });
BS('bs_afgan2', { title: 'Афганец', lines: S => S.flags['bs_af_' + S.flags.bs_who] ? [[BK(S), 'Сплю. Первый раз за восемь лет — сплю. Спасибо, шеф.', 'smile']] : [`${BN(S)} снова сорвался. На этот раз — со стволом в руке, у кафе на Декабристов.`],
  choices: S => S.flags['bs_af_' + S.flags.bs_who] ? [{ t: 'Взять его своим заместителем', fx: s => { bL(s, 30); const b = bsCur(s); if (b) b.sila += 2; }, txt: 'Холодная голова, крепкие руки. Лучшего зама не найти.' }]
    : [{ t: 'Прикрыть ещё раз', fx: s => ({ mil: 25 }), txt: 'Прикрыл. Но дело на тебя потяжелело.' }, { t: 'Отпустить его', fx: s => { bOut(s, 'gone'); }, txt: 'Говорят, он уехал в деревню к деду. Может, там тихо.' }] });
// ---- учёба ----
BS('bs_ucheba1', { title: 'КАИ', bg: 'gazeta', lines: S => [[BK(S), 'Шеф, тут такое… Я в авиационный поступил. На вечерний. Хочу уйти. Можно?', 'scared']],
  choices: [{ t: '«Иди. И не возвращайся сюда никогда»', fx: s => { s.flags['bs_uc_' + s.flags.bs_who] = 1; bOut(s, 'gone'); return { sovest: 10 }; }, txt: 'Он уходит с рюкзаком, в котором учебник по сопромату. Первый из вас, кто вышел живым.' },
    { t: '«Из бригады не уходят»', fx: s => { bL(s, -30); }, txt: 'Он остаётся. Но смотрит теперь мимо тебя.' }] });
BS('bs_ucheba2', { title: 'Инженер', lines: S => S.flags['bs_uc_' + S.flags.bs_who] ? [['official:Инженер в очках', 'Не узнаёшь? Это я. Работаю в мэрии, в отделе стройки. Если что — звони. Должен.', 'smile']] : [`${BN(S)} ушёл ночью. Вместе с кассой за неделю.`],
  choices: S => S.flags['bs_uc_' + S.flags.bs_who] ? [{ t: 'Пожать руку', fx: s => { if (typeof vlAdd === 'function') vlAdd(s, 5); return { sovest: 4 }; }, txt: 'Свой человек в мэрии. Влияние +5.' }]
    : [{ t: 'Искать', chk: ['um', 6], ok: { txt: 'Нашёл в общаге. Деньги вернул. Его не тронул.', fx: { avt: 2 } }, no: { txt: 'Как в воду канул.', fx: { dengi: -20 } } }] });
// ---- долг ----
BS('bs_dolg1', { title: 'Долг', bg: 't_r_katran', lines: S => [`${BN(S)} проигрался в катране на Гвардейской. Должен ${40 * inflation(S)} р. Катала даёт три дня — или палец.`],
  choices: S => [{ t: `Отдать долг за него (${40 * inflation(S)} р.)`, req: { dengi: 40 * inflation(S) }, fx: s => { bL(s, 25); s.flags['bs_dl_' + s.flags.bs_who] = 1; return { dengi: -40 * inflation(s) }; }, txt: 'Катала берёт деньги и улыбается: «Хорошие у тебя друзья».' },
    { t: 'Наехать на катран', go: 'f_random', fx: s => { bL(s, 15); return { avt: 3, mil: 6 }; } },
    { t: '«Сам влез — сам и выбирайся»', fx: s => { bL(s, -20); const b = bsCur(s); if (b) b.sila = Math.max(1, b.sila - 2); }, txt: 'Через три дня он приходит с перебинтованной рукой.' }] });
BS('bs_dolg2', { title: 'Катран', bg: 't_r_katran', lines: S => [`${BN(S)} снова за столом. Глаза горят. «Я отыграюсь, шеф, вот увидишь».`],
  choices: [{ t: 'Выгнать из бригады', fx: s => { bOut(s, 'gone'); }, txt: 'Игрок — это дыра в бригаде. Ты её закрыл.' }, { t: 'Поставить его смотреть за катраном', fx: s => { bL(s, 20); if (typeof addPoint === 'function') addPoint('Катран на Гвардейской', 20); }, txt: 'Теперь он не играет — он следит, чтобы играли другие. И платили тебе.' }] });
// ---- брат ----
BS('bs_brat1', { title: 'Брат', lines: S => [[BK(S), 'Шеф, скажу сам, пока другие не сказали. Мой брат — у Тагира. Спортсмены. Я с ним не общаюсь. Почти.', 'scared']],
  choices: [{ t: '«Через брата узнавай, что у Тагира»', fx: s => { s.flags['bs_br_' + s.flags.bs_who] = 1; bL(s, 10); }, txt: 'Опасная игра. Но информация дороже денег.' },
    { t: '«Верю. Работаем дальше»', fx: s => { bL(s, 20); }, txt: 'Он выдыхает. Доверие — тоже валюта.' }, { t: 'Выгнать на всякий случай', fx: s => { bOut(s, 'gone'); return { avt: 1 }; }, txt: 'Береженого бог бережёт.' }] });
BS('bs_brat2', { title: 'Братья', lines: S => S.flags['bs_br_' + S.flags.bs_who] ? [[BK(S), 'Брат шепнул: в пятницу спортсмены едут на твой склад. Встречай.', 'angry']] : [`Брат ${BN(S)} погиб в разборке спортсменов. ${BN(S)} спрашивает, можно ли ему отомстить.`],
  choices: S => S.flags['bs_br_' + S.flags.bs_who] ? [{ t: 'Устроить засаду', go: 'f_random', fx: { avt: 6, flag: 'tagir_vrag' } }, { t: 'Перевезти склад', fx: { dengi: -20, avt: 2 }, txt: 'Спортсмены приехали к пустому складу.' }]
    : [{ t: '«Мстим вместе»', go: 'f_random', fx: s => { bL(s, 30); if (s.crel) s.crel.tatarin = 'voyna'; return { avt: 4 }; } }, { t: '«Не время. Остынь»', fx: s => { bL(s, -15); }, txt: 'Он остывает. Но не забывает.' }] });
// ---- свадьба ----
BS('bs_svadba1', { title: 'Свадьба бойца', bg: 't_v_svadba', lines: S => [[BK(S), 'Шеф! Женюсь! Будь свидетелем, а? Ты ж мне как брат.', 'smile']],
  choices: S => [{ t: `Быть свидетелем, подарок (${20 * inflation(S)} р.)`, req: { dengi: 20 * inflation(S) }, fx: s => { bL(s, 25); brigAlive(s).forEach(b => b.loyal = Math.min(100, b.loyal + 5)); return { dengi: -20 * inflation(s), sovest: 4, uvazh: 4 }; }, txt: '«Горько!» Ты держишь кольца и ловишь себя на мысли, что улыбаешься по-настоящему.' },
    { t: '«Некогда, дела»', fx: s => { bL(s, -15); }, txt: 'На свадьбе твоё место за столом пустует.' }] });
BS('bs_svadba2', { title: 'Отец', bg: 't_r_bolnica', lines: S => [[BK(S), 'Дочка родилась! Шеф, можно я… ну… поменьше буду в делах? Хотя бы год.', 'smile']],
  choices: [{ t: '«Конечно. Дочь — главное»', fx: s => { bL(s, 20); const b = bsCur(s); if (b) b.sila = Math.max(1, b.sila - 1); return { sovest: 6 }; }, txt: 'Он плачет от счастья. В бригаде он теперь на «тихих» делах.' },
    { t: '«Бригада — тоже семья»', fx: s => { bL(s, -10); }, txt: 'Он кивает. И на следующий день выходит на стрелку.' }] });
