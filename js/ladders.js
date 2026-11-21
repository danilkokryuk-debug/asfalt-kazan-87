// Карьерные лестницы: Улица (звания моталки), МВД (от дружинника до генерала), Власть (от комсорга до министра).
// В МВД и во Власть можно прийти в любой момент (с экрана героя), но у каждого пути свои условия и цена:
// милиция не берёт тех, кто в моталке или сидел; во власти нужны язык и голова. Служба — это задания своего пути,
// опыт, зарплата раз в неделю и повышения (сцена «приказа»). Взятки и «крыша» бандитам — путь «оборотня»: им займётся СБ.
const LAD = {
  mvd: { name: 'МВД', icon: '🚔', stat: 'um',
    t80: ['Дружинник', 'Курсант школы милиции', 'Сержант ППС', 'Лейтенант угрозыска', 'Капитан', 'Майор', 'Полковник', 'Генерал милиции'],
    t90: ['Дружинник', 'Курсант', 'Сержант ППС', 'Лейтенант РУБОП', 'Капитан РУБОП', 'Майор РУБОП', 'Полковник', 'Генерал'],
    pay: [0, 3, 8, 12, 16, 22, 30, 45] },
  gov: { name: 'Власть', icon: '🏛', stat: 'yaz',
    t80: ['Активист', 'Комсорг', 'Инструктор райкома ВЛКСМ', 'Секретарь райкома ВЛКСМ', 'Инструктор горкома партии', 'Завотделом исполкома', 'Зампред горисполкома', 'Член правительства'],
    t90: ['Активист', 'Помощник депутата', 'Специалист мэрии', 'Начальник отдела', 'Глава администрации района', 'Вице-мэр', 'Депутат', 'Министр'],
    pay: [0, 0, 6, 10, 15, 22, 32, 50] },
};
const LAD_XP = [0, 8, 20, 36, 56, 80, 110, 150];   // опыт для звания
const LAD_DAYS = 45;                                 // минимум дней на звании
const LADS = S => (S.lad = S.lad || {});
const ladTitle = (S, k) => { const L = LADS(S)[k]; if (!L) return null; const e = typeof era90 === 'function' && era90(S); return (e ? LAD[k].t90 : LAD[k].t80)[L.lvl]; };
const ladIn = (S, k) => !!LADS(S)[k];
function ladXp(S, k, n) { const L = LADS(S)[k]; if (!L) return; L.xp = Math.max(0, L.xp + n); }
const ladCanJoin = (S, k) => {
  if (ladIn(S, k)) return '';
  const age = typeof heroAge === 'function' ? heroAge(S) : 16;
  if (k === 'mvd') { if (age < 16) return 'с 16 лет'; if (S.flags.zona || S.flags.sidel) return 'с судимостью не берут'; if (S.st.mil >= 40) return 'на тебя слишком много есть у милиции'; return ''; }
  if (k === 'gov') { if (age < 14) return 'с 14 лет'; if (stat('um') < 3) return 'нужна смекалка 3'; if (S.flags.zona || S.flags.sidel) return 'с судимостью дорога закрыта'; return ''; }
  return '';
};
function ladJoin(k) {
  const why = ladCanJoin(S, k); if (why) return toast(why);
  if (k === 'mvd' && S.gang) {
    if (!confirm(`Чтобы пойти в милицию, придётся уйти из «${DIST[S.gang].gang}». Пацаны этого не простят. Уйти?`)) return;
    applyFx({ leave: true, uvazh: -25, sovest: 6 }); S.flags.ex_gang = S.day; log('Ушёл из моталки. Для пацанов ты теперь мусор.');
  }
  LADS(S)[k] = { lvl: 0, xp: 0, since: S.day };
  log(k === 'mvd' ? 'Записался в добровольную народную дружину. Красная повязка, свисток, удостоверение.' : (typeof era90 === 'function' && era90(S) ? 'Пошёл в штаб кандидата в депутаты. Листовки, звонки, знакомства.' : 'Вступил в комсомольский актив. Собрания, взносы, характеристики.'));
  toast(`${LAD[k].icon} ${ladTitle(S, k)}`); render();
}
// повышение: опыт + стаж; сцена приказа
{ const nd = onNewDay; onNewDay = S => { nd(S);
  for (const k of Object.keys(LAD)) { const L = LADS(S)[k]; if (!L || L.lvl >= 7) continue;
    if (L.xp >= LAD_XP[L.lvl + 1] && S.day - (L.since || 0) >= LAD_DAYS) { S.flags.ld_promo = k; break; } }
}; }
def('ld_promo', { mode: 'any', repeat: true, trigger: S => !!S.flags.ld_promo && !S.cur,
  title: S => S.flags.ld_promo === 'mvd' ? 'Приказ' : 'Решение бюро', bg: S => S.flags.ld_promo === 'mvd' ? 'otdel' : 't_r_kabinet', card: S => [S.flags.ld_promo === 'mvd' ? 'Приказ' : 'Повышение', ''],
  lines: S => { const k = S.flags.ld_promo, L = LADS(S)[k], next = (typeof era90 === 'function' && era90(S) ? LAD[k].t90 : LAD[k].t80)[L.lvl + 1];
    return [k === 'mvd' ? `Начальник отдела зачитывает приказ: «…присвоить звание — ${next}». Пацаны в коридоре делают вид, что тебя не знают.`
      : `Бюро единогласно: «…утвердить на должность — ${next}». Тебе жмут руку люди, которые вчера не здоровались.`,
      [k === 'mvd' ? 'militsioner:Начальник отдела' : 'official:Первый секретарь', 'Растёшь. Не подведи. Тут быстро взлетают — и быстро падают.']]; },
  choices: S => { const k = S.flags.ld_promo; return [
    { t: 'Поблагодарить и работать дальше', fx: s => { ladUp(s, k); return { sovest: 2 }; }, txt: 'Новое удостоверение, новый кабинет. Новые враги.' },
    { t: `Накрыть стол начальству (${20 * (typeof inflation === 'function' ? inflation(S) : 1)} р.)`, req: { dengi: 20 * (typeof inflation === 'function' ? inflation(S) : 1) },
      fx: s => { ladUp(s, k); ladXp(s, k, 6); return { dengi: -20 * (typeof inflation === 'function' ? inflation(s) : 1), uvazh: 3 }; }, txt: 'Коньяк, балык, тосты. Начальство запомнило тебя как «своего».' }]; } });
function ladUp(S, k) { const L = LADS(S)[k]; L.lvl++; L.since = S.day; S.flags.ld_promo = null; log(`Повышение: ${ladTitle(S, k)}.`);
  if (typeof pagerPush === 'function') pagerPush(S, { from: LAD[k].name, text: `Поздравляем: ${ladTitle(S, k)}` }); }
// зарплата раз в неделю; оборотней ловит СБ
{ const ew = economyWeek; economyWeek = S => { ew(S);
  const inf = typeof inflation === 'function' ? inflation(S) : 1;
  for (const k of Object.keys(LAD)) { const L = LADS(S)[k]; if (!L) continue; const p = LAD[k].pay[L.lvl] * inf; if (p) { S.st.dengi += p; log(`${LAD[k].name}: зарплата +${p} р.`); } }
  if (ladIn(S, 'mvd') && (S.flags.oboroten || 0) >= 3 && Math.random() < 0.35) S.flags.ld_usb = 1;
}; }
def('ld_usb', { mode: 'any', repeat: true, trigger: S => !!S.flags.ld_usb && !S.cur, title: 'Собственная безопасность', bg: 'otdel',
  fx: S => { S.flags.ld_usb = 0; },
  lines: S => [['militsioner:Майор из СБ', `Садитесь, ${ladTitle(S, 'mvd').toLowerCase()}. Нам рассказали, с кем вы пьёте чай. И сколько вам за это платят.`, 'angry']],
  choices: S => [
    { t: 'Отпираться', chk: ['yaz', 7], ok: { txt: 'Доказательств мало. Пока. Майор кладёт папку в сейф.', fx: s => { s.flags.oboroten = 1; } },
      no: { txt: 'Погоны снимают прямо в кабинете. Из милиции — с позором.', fx: s => { delete LADS(s).mvd; s.flags.oboroten = 0; return { uvazh: -10, mil: 30 }; } } },
    { t: `Занести майору (${60 * (typeof inflation === 'function' ? inflation(S) : 1)} р.)`, req: { dengi: 60 * (typeof inflation === 'function' ? inflation(S) : 1) },
      fx: s => { s.flags.oboroten = 1; return { dengi: -60 * (typeof inflation === 'function' ? inflation(s) : 1), sovest: -5 }; }, txt: 'Майор из СБ — тоже человек. С зарплатой.' },
    { t: 'Сдать своих бандитов, чтобы спасти себя', fx: s => { s.flags.oboroten = 0; ladXp(s, 'mvd', 10); if (typeof addEvidence === 'function') {} return { sovest: -10, avt: -15, flag: 'sdal_banditov' }; },
      txt: 'Ты чист перед системой. Бандиты, которые тебе платили, сели. Остальные помнят твоё лицо.' }] });

// ---------- задания путей ----------
const LJ = (id, track, lvl, o) => ({ id, track, lvl, min: 0, gen: () => ({}), ...o });
const inf0 = S => typeof inflation === 'function' ? inflation(S) : 1;
const LJOBS = [
  // --- МВД ---
  LJ('j_m_patrul', 'mvd', 0, { bg: 't_r_vokzal', who: 'militsioner:Старшина', title: () => 'Патруль у вокзала', text: () => 'Ночь, вокзал, пьяный дебошир бьёт витрину буфета. Старшина кивает тебе: «Давай, стажёр».',
    choices: S => [{ t: 'Задержать по форме', chk: ['sila', 4], ok: { txt: 'Протокол, отделение, благодарность от начальника смены.', fx: s => { ladXp(s, 'mvd', 4); return {}; } }, no: { txt: 'Дебошир оказался боксёром. Синяк — тоже опыт.', fx: s => { ladXp(s, 'mvd', 2); return { zdor: -12 }; } } },
      { t: 'Отпустить за трёшку', fx: s => { ladXp(s, 'mvd', 1); s.flags.oboroten = (s.flags.oboroten || 0) + 0.5; return { dengi: 3 * inf0(s), sovest: -4 }; }, txt: 'Трёшка в нагрудном кармане. Старшина делает вид, что не видел. Он тоже так начинал.' }] }),
  LJ('j_m_karman', 'mvd', 1, { bg: 't_avtobus', who: 'babka:Пострадавшая', title: () => 'Карманник в трамвае', text: () => 'Бабушка в слезах: вытащили кошелёк с пенсией на «семёрке». Карманник ещё в вагоне.',
    choices: S => [{ t: 'Взять с поличным', chk: ['lovk', 5], mini: 'pobeg', ok: { txt: 'Кошелёк в руке у вора, рука — в наручниках. Бабушка крестит тебя.', fx: s => { ladXp(s, 'mvd', 6); return { sovest: 4 }; } }, no: { txt: 'Ушёл на остановке. Бабушке ты отдаёшь свою трёшку.', fx: s => { ladXp(s, 'mvd', 1); return { dengi: -3, sovest: 3 }; } } }] }),
  LJ('j_m_katran', 'mvd', 2, { bg: 't_r_katran', who: 'chuzhoy:Катала', title: () => 'Облава на катран', text: () => 'Подпольный карточный клуб в подвале на Гвардейской. На столе — пачки денег. Катала шепчет: «Начальник, давай по-людски».',
    choices: S => [{ t: 'Оформить всех', go: 'f_random', fx: s => { ladXp(s, 'mvd', 8); return { avt: -2 }; } },
      { t: `Взять «по-людски» (${40 * inf0(S)} р.)`, fx: s => { ladXp(s, 'mvd', 2); s.flags.oboroten = (s.flags.oboroten || 0) + 1; return { dengi: 40 * inf0(s), sovest: -8 }; }, txt: 'Пачка перекочевала в твою папку. Катран работает дальше — теперь под тобой.' }] }),
  LJ('j_m_razbor', 'mvd', 2, { bg: 'pustyr', who: 'starsh', title: () => 'Драка моталок', text: () => 'Две моталки сошлись на пустыре. Сотня пацанов с арматурой. Ты с двумя сержантами.',
    choices: S => [{ t: 'Разогнать — свисток, сирена, в воздух', chk: ['yaz', 6], ok: { txt: 'Разбежались. Задержали троих. В рапорте — «предотвращена массовая драка».', fx: s => { ladXp(s, 'mvd', 7); return {}; } }, no: { txt: 'Досталось и тебе.', fx: s => { ladXp(s, 'mvd', 2); return { zdor: -18 }; } } },
      { t: 'Договориться со старшими: без крови', chk: ['yaz', 5], ok: { txt: 'Старшие уважают того, кто говорит по делу. Обошлось без больниц.', fx: s => { ladXp(s, 'mvd', 5); return { avt: 3 }; } }, no: { txt: 'Тебя не услышали.', fx: {} } }] }),
  LJ('j_m_obhss', 'mvd', 3, { bg: 'rynok', who: 'koop', title: () => 'ОБХСС: завмаг', text: () => 'Завмаг продуктового гонит дефицит «налево». Вагон колбасы ушёл мимо прилавка. Он предлагает «решить вопрос».',
    choices: S => [{ t: 'Завести дело', chk: ['um', 6], ok: { txt: 'Документы, понятые, изъятие. Громкое дело — в газете.', fx: s => { ladXp(s, 'mvd', 10); return { sovest: 4 }; } }, no: { txt: 'Бумаги «потерялись». У завмага связи выше твоих.', fx: s => { ladXp(s, 'mvd', 2); return {}; } } },
      { t: 'Взять долю', fx: s => { s.flags.oboroten = (s.flags.oboroten || 0) + 1; return { dengi: 60 * inf0(s), sovest: -10 }; }, txt: 'Теперь у тебя каждый месяц — колбаса и конверт.' }] }),
  LJ('j_m_stukach', 'mvd', 3, { bg: 'kuhnya', who: 'chuzhoy:Пацан из скорлупы', title: () => 'Завербовать стукача', text: () => 'Пацан попался на краже магнитолы. Если будет рассказывать, что творится в его моталке, — дело закроют.',
    choices: S => [{ t: 'Завербовать', chk: ['yaz', 6], ok: { txt: 'Теперь у тебя есть уши в моталке. Раскрываемость растёт.', fx: s => { ladXp(s, 'mvd', 8); s.flags.mvd_agent = 1; return { sovest: -3 }; } }, no: { txt: 'Пацан лучше сядет, чем станет стукачом. Уважаешь.', fx: s => { ladXp(s, 'mvd', 2); } } },
      { t: 'Отпустить: пусть живёт', fx: { sovest: 6 }, txt: 'Пацан смотрит на тебя, как будто ты не мент.' }] }),
  LJ('j_m_rubop', 'mvd', 4, { era90: true, bg: 't_9_rubop', who: 'militsioner:Командир СОБРа', title: () => 'РУБОП: задержание', text: () => 'Оперативная информация: бригадир и пятеро бойцов в сауне на Ершова. Маски, автоматы, рассвет.',
    choices: S => [{ t: 'Брать жёстко', go: 'f_random', fx: s => { ladXp(s, 'mvd', 12); return { mil: -10 }; } },
      { t: `Позвонить бригадиру заранее ($${50})`, fx: s => { s.flags.oboroten = (s.flags.oboroten || 0) + 1.5; return { dol: 50, sovest: -12 }; }, txt: 'Сауна пустая. Бригадир передал «спасибо». В отделе ищут крота.' }] }),
  LJ('j_m_zvonok', 'mvd', 5, { bg: 't_r_kabinet', who: 'official:Голос из трубки', title: () => 'Звонок сверху', text: () => 'Задержан сын депутата: пьяным сбил человека. Звонят сверху: «Отпустить. Ничего не было».',
    choices: S => [{ t: 'Подчиниться', fx: s => { ladXp(s, 'mvd', 10); return { sovest: -12 }; }, txt: 'Протокол исчез. Тебя повысят. Ты не будешь спать.' },
      { t: 'Довести дело до суда', chk: ['yaz', 7], ok: { txt: 'Дело в суде. Газеты пишут о «честном милиционере». Начальство тебя ненавидит.', fx: s => { ladXp(s, 'mvd', 4); return { sovest: 15, uvazh: 10 }; } },
        no: { txt: 'Тебя переводят в ППС на окраину. Карьера откатилась.', fx: s => { const L = LADS(s).mvd; if (L) { L.lvl = Math.max(0, L.lvl - 1); L.xp = LAD_XP[L.lvl]; } return { sovest: 10 }; } } }] }),
  // --- Власть ---
  LJ('j_g_subbotnik', 'gov', 0, { bg: 'dvor', who: 'official:Секретарь райкома', title: () => 'Субботник', text: () => 'Ленинский субботник. Нужно вывести на уборку весь двор, а пацаны смеются: «Комсомолец пришёл».',
    choices: S => [{ t: 'Вывести всех', chk: ['yaz', 4], ok: { txt: 'Двор блестит. Фото в районной газете. Тебя заметили.', fx: s => { ladXp(s, 'gov', 4); return { uvazh: -2, semya: 3 }; } }, no: { txt: 'Пришли три бабушки и ты.', fx: s => { ladXp(s, 'gov', 1); } } }] }),
  LJ('j_g_doklad', 'gov', 1, { bg: 'shkola', who: 'official:Секретарь райкома', title: () => 'Доклад на пленуме', text: () => 'Нужно выступить на пленуме райкома: «О задачах молодёжи в свете решений съезда». Зал на триста человек.',
    choices: S => [{ t: 'Выступить без бумажки', chk: ['yaz', 6], ok: { txt: 'Аплодисменты. Первый секретарь записывает твою фамилию.', fx: s => { ladXp(s, 'gov', 8); return {}; } }, no: { txt: 'Сбился на втором абзаце. Зал скучал.', fx: s => { ladXp(s, 'gov', 2); } } },
      { t: 'Прочитать по бумажке', fx: s => { ladXp(s, 'gov', 4); }, txt: 'Скучно, но правильно. Так растут в аппарате.' }] }),
  LJ('j_g_kvartiry', 'gov', 2, { bg: 't_r_kabinet', who: 'babka:Очередница', title: () => 'Очередь на квартиры', text: () => 'Распределяешь квартиры в новом доме. Очередь — двадцать лет. За дверью — люди с конвертами.',
    choices: S => [{ t: 'Строго по очереди', fx: s => { ladXp(s, 'gov', 5); return { sovest: 10 }; }, txt: 'Ветеран с семьёй въезжает в двухкомнатную. Плачет у тебя в кабинете.' },
      { t: `Взять конверт (${50 * inf0(S)} р.)`, fx: s => { ladXp(s, 'gov', 3); if (typeof addEvidence === 'function' && Math.random() < 0.4) addEvidence(s, 15, 'svid'); return { dengi: 50 * inf0(s), sovest: -10 }; }, txt: 'Квартиру получил зять завбазой. Очередь сдвинулась ещё на год.' },
      { t: 'Дать квартиру семье своего пацана', if: s => !!s.gang || (s.brig && s.brig.length), fx: s => { ladXp(s, 'gov', 2); return { avt: 5, sovest: -3 }; }, txt: 'На районе говорят: «Наш человек во власти».' }] }),
  LJ('j_g_kooperativ', 'gov', 3, { bg: 't_r_koop', who: 'koop', title: () => 'Регистрация кооператива', text: () => 'Кооператор хочет зарегистрировать видеосалон. Бумаги в порядке — почти. Он кладёт на стол видеомагнитофон «Панасоник».',
    choices: S => [{ t: 'Зарегистрировать честно', fx: s => { ladXp(s, 'gov', 5); return { sovest: 4 }; }, txt: 'Кооператор жмёт руку. Через год он будет миллионером — и помнить тебя.' },
      { t: 'Взять «Панасоник»', fx: s => { ladXp(s, 'gov', 4); return { dengi: 40 * inf0(s), sovest: -6, flag: 'koop_svyaz' }; }, txt: 'Видик у тебя дома. Кооператор теперь «твой».' }] }),
  LJ('j_g_vybory', 'gov', 4, { bg: 't_r_vybory', who: 'official:Председатель комиссии', title: () => 'Выборы', text: () => 'Впервые выбирают из нескольких кандидатов. Твой — отстаёт. Председатель комиссии смотрит на урны и на тебя.',
    choices: S => [{ t: 'Агитировать честно', chk: ['yaz', 7], ok: { txt: 'Твой кандидат прошёл. Ты — его правая рука.', fx: s => { ladXp(s, 'gov', 12); return { sovest: 4 }; } }, no: { txt: 'Проиграли. Но тебя запомнили как бойца.', fx: s => { ladXp(s, 'gov', 4); } } },
      { t: 'Досыпать бюллетеней', fx: s => { ladXp(s, 'gov', 10); if (typeof addEvidence === 'function') addEvidence(s, 18, 'svid'); return { sovest: -12 }; }, txt: 'Победа с перевесом в два процента. Наблюдатель всё видел.' }] }),
  LJ('j_g_privat', 'gov', 4, { era90: true, bg: 't_9_zavod', who: 'baron', title: () => 'Приватизация завода', text: () => 'Завод на аукционе. Барон хочет купить его за копейки — через твою подпись. Рабочие — против.',
    choices: S => [{ t: 'Подписать за долю', fx: s => { ladXp(s, 'gov', 8); if (typeof addPoint === 'function') addPoint('Доля в заводе (через мэрию)', 40); return { sovest: -12 }; }, txt: 'Завод ушёл за цену двух «Мерседесов». Тебе — доля. Рабочим — сокращение.' },
      { t: 'Провести честный аукцион', chk: ['um', 7], ok: { txt: 'Завод купил трудовой коллектив. Барон тебе этого не простит.', fx: s => { ladXp(s, 'gov', 6); return { sovest: 12, flag: 'baron_vrag' }; } }, no: { txt: 'Аукцион сорвали. Завод разворовывают без тебя.', fx: s => { ladXp(s, 'gov', 2); } } }] }),
  LJ('j_g_ministr', 'gov', 6, { bg: 't_r_kabinet', who: 'official:Министр', title: () => 'Москва вызывает', text: () => 'Звонок из Москвы: на тебя «посмотрели». Нужно приехать, показать себя, принести подарки нужным людям.',
    choices: S => [{ t: `Поехать с подарками (${150 * inf0(S)} р.)`, req: { dengi: 150 * inf0(S) }, fx: s => { ladXp(s, 'gov', 20); return { dengi: -150 * inf0(s) }; }, txt: 'Икра, коньяк, янтарь. В Москве улыбаются. Ты в списке.' },
      { t: 'Поехать с цифрами и проектами', chk: ['um', 8], ok: { txt: 'Тебя слушают. Редкий случай: в Москве ценят работу.', fx: s => { ladXp(s, 'gov', 15); return { sovest: 4 }; } }, no: { txt: 'Цифры никого не интересовали.', fx: s => { ladXp(s, 'gov', 3); } } }] }),
];
LJOBS.forEach(t => { TASKS.push(t); TPL[t.id] = t; });
// задания пути — только тем, кто на нём, и только своего уровня
{ const je = jobEraOk; jobEraOk = (S, t) => { if (t.track) { const L = LADS(S)[t.track]; if (!L || L.lvl < (t.lvl || 0)) return false; } return je(S, t); }; }

// ---------- август 1991: выбор для людей во власти и в погонах ----------
def('ld_putch', { mode: 'any', title: '19 августа 1991', bg: 'gazeta', card: ['19 августа 1991', 'ГКЧП'],
  trigger: S => (ladIn(S, 'gov') || ladIn(S, 'mvd')) && S.day >= dayNum(1991, 8, 19) && S.day < dayNum(1991, 8, 25),
  lines: S => ['По телевизору «Лебединое озеро». Потом — пресс-конференция ГКЧП: трясутся руки у вице-президента.',
    [ladIn(S, 'gov') ? 'official:Первый секретарь' : 'militsioner:Начальник отдела', 'Надо определяться. Сегодня. Завтра будет поздно.']],
  choices: S => [
    { t: 'Поддержать ГКЧП', fx: s => { s.flags.putch_gkchp = 1; for (const k of Object.keys(LAD)) if (ladIn(s, k)) { const L = LADS(s)[k]; L.lvl = Math.max(0, L.lvl - 2); L.xp = LAD_XP[L.lvl]; } return { sovest: -2 }; },
      txt: 'Через три дня ГКЧП арестован. Твою фамилию вычёркивают из всех списков. Карьеру придётся начинать заново.' },
    { t: 'Встать за Ельцина', fx: s => { s.flags.putch_elcin = 1; for (const k of Object.keys(LAD)) if (ladIn(s, k)) ladXp(s, k, 30); return { sovest: 4, uvazh: 3 }; },
      txt: 'Ты на баррикадах у Белого дома — или на митинге у своего горсовета. Через неделю ты в новой команде.' },
    { t: 'Заболеть и переждать', fx: s => { for (const k of Object.keys(LAD)) if (ladIn(s, k)) ladXp(s, k, 5); return {}; }, txt: 'Три дня с градусником. Потом ты «всегда был за демократию».' }] });

// ---------- панель «Карьера» на экране героя ----------
function ladderHtml(S) {
  const rows = [`<div class="ld-row"><span>🥊 Улица</span><b>${S.gang ? RANKS[S.rank] + ' · «' + DIST[S.gang].gang + '»' : S.rank ? RANKS[S.rank] : 'не пришит'}</b></div>`];
  for (const k of Object.keys(LAD)) {
    const L = LADS(S)[k];
    if (L) { const need = LAD_XP[Math.min(7, L.lvl + 1)], prev = LAD_XP[L.lvl], p = L.lvl >= 7 ? 100 : Math.min(100, Math.round((L.xp - prev) / (need - prev) * 100));
      rows.push(`<div class="ld-row"><span>${LAD[k].icon} ${LAD[k].name}</span><b>${ladTitle(S, k)}</b><div class="bar"><i style="width:${Math.max(0, p)}%"></i></div><em>${L.lvl >= 7 ? 'вершина' : `опыт ${L.xp}/${need}`} · ${LAD[k].pay[L.lvl] ? 'зарплата ' + LAD[k].pay[L.lvl] * inf0(S) + ' р./нед' : 'без зарплаты'}</em></div>`); }
    else { const why = ladCanJoin(S, k);
      rows.push(`<div class="ld-row"><span>${LAD[k].icon} ${LAD[k].name}</span><button class="btn" onclick="ladJoin('${k}')" ${why ? 'disabled' : ''}>${why ? 'Закрыто: ' + why : k === 'mvd' ? 'Пойти в милицию' : (typeof era90 === 'function' && era90(S) ? 'Пойти во власть' : 'Вступить в актив')}</button></div>`); }
  }
  return `<div class="ldbox"><div class="ld-h">🪜 Карьера</div>${rows.join('')}</div>`;
}
