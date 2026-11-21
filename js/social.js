// Положение в моталке может не только расти: разбор, понижение, отшив.
// Свою скорлупу ты тоже судишь сам. И по району ходят слухи — про тебя и от тебя.
const sinceF = (S, f) => S.flags[f] == null ? 1e9 : S.day - S.flags[f];

// ---- разбор: уважение упало — спрашивают ----
def('s_razbor', { mode: 'any', repeat: true, title: 'Разбор', bg: 't_a_razbor',
  trigger: S => S.gang && S.rank >= 1 && S.st.uvazh <= 10 && sinceF(S, 'razbor') >= 12,
  fx: S => { S.flags.razbor = S.day; },
  lines: S => ['Вечер. Коробка. Пацаны стоят кругом, ты — в середине. Старшие молчат долго, нарочно.',
    ['starsh', `${S.nick || S.name}, про тебя много разговоров. Пацаны тебя не уважают. Объясни, почему ты ещё ${RANKS[S.rank].toLowerCase()}.`, 'angry']],
  choices: S => [
    { t: 'Оправдаться', chk: ['yaz', 6 + S.rank], ok: { txt: 'Ты говоришь твёрдо и по делу. Старшие переглядываются: «Ладно. Последний раз».', fx: { uvazh: 15 } },
      no: { txt: S.rank > 1 ? `Не убедил. С сегодняшнего дня ты — ${RANKS[S.rank - 1].toLowerCase()}.` : 'Не убедил. Тебя отшивают. Ты больше не в моталке.',
        fx: s => s.rank > 1 ? { rank: s.rank - 1, uvazh: 20 } : { leave: true, flag: 'otshit_razbor', uvazh: 0 } } },
    { t: 'Принять наказание', fx: s => s.rank > 1 ? { rank: s.rank - 1, uvazh: 25, zdor: -10 } : { uvazh: 15, zdor: -20 }, txt: 'Удар по лицу — при всех. Потом руку жмут. Начинаешь заново, ступенькой ниже.' },
    { t: 'Уйти самому', fx: { leave: true, sovest: 5, uvazh: 0 }, txt: 'Ты снимаешь кепку и уходишь с коробки. Никто не останавливает.' }] });
// ---- досрочное повышение в Карьере: за дела, а не за выслугу ----
def('s_povyshenie', { mode: 'career', repeat: true, title: 'Досрочно', bg: 'korobka',
  trigger: S => S.gang && S.rank >= 1 && S.rank < 4 && S.st.uvazh >= 70 && S.st.avt >= 30 + S.rank * 25 && sinceF(S, 'povysh') >= 30,
  fx: S => { S.flags.povysh = S.day; },
  lines: S => [['sedoy', `Пацаны за тебя просят. Говорят, ты за троих работаешь. Будешь ${RANKS[S.rank + 1].toLowerCase()}м — досрочно.`, 'smile']],
  choices: S => [{ t: 'Принять', fx: { rank: S.rank + 1, avt: 5 }, txt: 'Новое звание — новые дела и новый спрос.' },
    { t: '«Рано мне»', fx: { uvazh: 8, sovest: 3 }, txt: 'Седой хмыкает: «Скромный. Это тоже хорошо».' }] });

// ---- твоя скорлупа: косяки и суд ----
const SQ_SINS = ['взял из общака пятёрку', 'сбежал с махача первым', 'болтал с участковым', 'трясёт малышню на чужом районе', 'обещал прийти на стрелку — и не пришёл', 'хвастался девчонкам, где лежит общак'];
def('s_kosyak', { mode: 'any', repeat: true, title: 'Косяк в скорлупе', bg: 'korobka',
  random: S => (S.squad || []).length > 0, weight: 1.6,
  fx: S => { S.sqI = rnd(S.squad.length); S.sqSin = pick(SQ_SINS); },
  lines: S => { const m = S.squad[S.sqI]; return [`Из твоей скорлупы ${m ? m.nick : 'один'} ${S.sqSin}. Все ждут, что решишь ты.`,
    [`sq${S.sqI}`, 'Прости… бес попутал. Больше не буду.', 'scared']]; },
  choices: S => [
    { t: 'Простить', fx: s => { const m = s.squad[s.sqI]; if (m) m.loyal = Math.min(100, m.loyal + 15); return { uvazh: -2, sovest: 3 }; }, txt: 'Он смотрит на тебя как на старшего брата. Остальные — как на мягкого.' },
    { t: 'Наказать при всех', fx: s => { const m = s.squad[s.sqI]; if (m) m.loyal = Math.max(0, m.loyal - 10); return { uvazh: 4, sovest: -2 }; }, txt: 'Сто отжиманий на снегу и неделя на шухере. Скорлупа поняла.' },
    { t: 'Отшить его', fx: s => { const m = s.squad.splice(s.sqI, 1)[0]; if (s.withMe === s.sqI) s.withMe = null; log(`Отшил из скорлупы: ${m ? m.nick : ''}.`); return { uvazh: 5, sovest: -3 }; }, txt: 'Его больше нет с вами. Его можно бить любому. Ты знал, что так будет.' }] });
def('s_pohvala', { mode: 'any', repeat: true, title: 'Свой пацан', bg: 'dvor',
  random: S => (S.squad || []).length > 0, weight: 0.8,
  fx: S => { S.sqI = rnd(S.squad.length); },
  lines: S => { const m = S.squad[S.sqI]; return [`${m ? m.nick : 'Один из скорлупы'} сам, без приказа, отбил у чужих пацана с вашего двора. Об этом говорит весь район.`]; },
  choices: S => [
    { t: 'Похвалить при всех и дать 5 р.', req: { dengi: 5 }, fx: s => { const m = s.squad[s.sqI]; if (m) m.loyal = Math.min(100, m.loyal + 25); return { dengi: -5, uvazh: 4 }; }, txt: 'Он краснеет до ушей. За тебя он теперь — в огонь.' },
    { t: 'Попросить старших принять его в супера', fx: s => { const m = s.squad[s.sqI]; if (m) { m.loyal = 100; m.nick = m.nick + ' (супер)'; } return { avt: 3, uvazh: 3 }; }, txt: 'Старшие соглашаются: «Твой человек — твоё слово».' }] });

// ---- слухи про тебя ----
const BAD_RUMORS = ['что ты стучишь Гарипову', 'что ты первым сбежал с махача на пустыре', 'что ты крысишь из общака', 'что ты бегаешь за девчонкой из чужой моталки', 'что тебя опустили в отделе'];
const GOOD_RUMORS = ['что ты один раскидал пятерых с Жилки', 'что ты отбил бабушкину пенсию у шпаны', 'что тебя уважает сам вор в законе', 'что ты не сдал своих, когда тебя держали в отделе сутки'];
def('s_sluh_plohoy', { mode: 'any', repeat: true, title: 'Слух', bg: 't_a_lavochka',
  random: S => S.rank >= 1, weight: 1.1,
  fx: S => { S.sluh = pick(BAD_RUMORS); },
  lines: S => [`Бабки на лавочке замолкают, когда ты проходишь. Малой из скорлупы шепчет: по району говорят, ${S.sluh}.`],
  choices: S => [
    { t: 'Найти, кто пустил', chk: ['um', 5 + S.rank], ok: { txt: 'Это чужой с соседнего двора. Разговор короткий.', go: 'f_random', fx: { uvazh: 4 } }, no: { txt: 'Концов не найти. Слух живёт своей жизнью.', fx: { uvazh: -4 } } },
    { t: 'Опровергнуть при всех на коробке', chk: ['yaz', 5 + S.rank], ok: { txt: 'Пацаны верят тебе, а не сплетням.', fx: { uvazh: 6, avt: 2 } }, no: { txt: 'Ты оправдываешься — значит, что-то есть. Так думают многие.', fx: { uvazh: -8 } } },
    { t: 'Пустить встречный слух', fx: { flag: 'sluh_vojna', uvazh: 2, sovest: -4 }, txt: 'Через два дня весь район обсуждает уже другого. Слухи — тоже оружие.' },
    { t: 'Не обращать внимания', fx: { uvazh: -6 }, txt: 'Собака лает — ветер носит. Но ветер носит и до старших.' }] });
def('s_sluh_horoshiy', { mode: 'any', repeat: true, title: 'Говорят', bg: 'dvor',
  random: S => S.rank >= 1, weight: 0.9,
  fx: S => { S.sluh = pick(GOOD_RUMORS); },
  lines: S => [`Скорлупа смотрит на тебя с восхищением: по району говорят, ${S.sluh}.`],
  choices: [
    { t: 'Не отрицать', fx: { avt: 6, uvazh: 4 }, txt: 'Слава бежит впереди тебя. Только теперь от тебя ждут, что ты ей соответствуешь.' },
    { t: '«Врут всё»', fx: { sovest: 4, uvazh: 2 }, txt: 'Скромность тоже уважают. Но слух всё равно живёт.' }] });
// ---- пустить слух самому ----
def('s_pustit', { mode: 'any', repeat: true, title: 'Пустить слух', bg: 't_a_lavochka',
  fx: S => { S.flags.sluh_day = S.day; },
  lines: ['Слух в Казани летит быстрее «лунохода». Главное — правильно его запустить: через бабок на лавочке, буфетчицу Галю и болтливую скорлупу.'],
  choices: S => [
    { t: 'Про чужую моталку: «они ментам стучат»', chk: ['yaz', 5], ok: { txt: 'С чужими перестают здороваться даже их соседи.', fx: { avt: 4, sovest: -5 } }, no: { txt: 'Чужие узнали, кто пустил. Ждут тебя.', go: 'f_random' } },
    { t: 'Про Креста: «он крысит у своих»', if: s => !!s.flags.met_krest && !s.flags.krest_down, chk: ['yaz', 6], ok: { txt: 'У Креста начались проблемы со своими.', fx: { flag: 'krest_sluh', avt: 4, sovest: -6 } }, no: { txt: 'Крест узнал. Он этого не забудет.', fx: { flag: 'krest_zol' } } },
    { t: 'Про себя: «я с ворами знаком»', chk: ['yaz', 6], ok: { txt: 'С тобой здороваются люди, которые раньше не замечали.', fx: { avt: 7 } }, no: { txt: 'Слух дошёл до настоящих воров. Им не понравилось.', fx: { avt: -6, zdor: -10 } } },
    { t: 'Хорошее про друга: «Ильдар — железный пацан»', if: s => !!s.flags.met_ildar || s.rel.ildar > 0, fx: { ildar: 8, sovest: 3 }, txt: 'Ильдар не знает, кто это сказал. Но ходит, расправив плечи.' },
    { t: 'Передумать', txt: 'Слово — не воробей. Иногда лучше промолчать.' }] });
const socialHtml = S => S.gang && S.rank >= 1 ? `<div class="choices" style="margin:0 0 12px"><button class="btn" onclick="sluhGo()" ${S.ap > 0 && sinceF(S, 'sluh_day') >= 3 ? '' : 'disabled'}>🗣 Пустить слух${sinceF(S, 'sluh_day') >= 3 ? '' : ' (раз в 3 дня)'}</button></div>` : '';
function sluhGo() { advanceTime(ACT_MIN / 2); play('s_pustit'); }
