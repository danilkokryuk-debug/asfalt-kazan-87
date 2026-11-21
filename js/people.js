// Разные лица. Раньше каждый «мужик», «чужой», «бабушка» или «мент» был одним и тем же спрайтом.
// Теперь внешность собирается по роли (подпись после двоеточия: «muzhik:Таксист») и характеру:
// таксист — в кепке и кожанке, кооператор — в пиджаке и очках, бандит — в спортивном и со шрамом, челночница — в пуховике.
// Один и тот же человек (одна подпись) выглядит всегда одинаково; разные — по-разному. В девяностых одежда другая.
const PPL_HASH = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const ARCH = {
  ment: { re: /серж|гаи|инспект|мент|рубоп|милиц|опер|участк|подполк|капитан|лейтен|майор|дежурн|конвой/i,
    m: 1, build: ['normal', 'strong', 'fat', 'thin'], hair: ['ezhik', 'bobrik', 'probor'], mark: ['none', 'usy', 'none', 'brov'],
    hat: ['h_militsia'], outer: ['o_militsia'], shirt: ['s_school'], pants: ['p_militsia'], shoes: ['f_sapogi', 'f_botinki'], acc: [[], ['a_sigareta'], []] },
  worker: { re: /таксист|шоф|дальноб|грузчик|механ|бригадир|рабоч|сантех|сторож|водит|хозяин|мужик|сосед|кочегар|дворник|слесар|токар|прораб|рыбак|охотн/i,
    m: 1, build: ['fat', 'strong', 'normal', 'thin'], hair: ['gorshok', 'ezhik', 'bobrik', 'probor', 'zaliz'], mark: ['usy', 'none', 'zub', 'tatu', 'scar'],
    hat: ['h_ushanka', 'h_vosmi', 'h_none', 'h_kozha', 'h_shlyapa'], outer: ['o_telogreika', 'o_kozhanka', 'o_alyaska', 'o_none', 'o_pidzhak'],
    shirt: ['s_telnyashka', 's_kletka', 's_maika', 's_vodolazka'], pants: ['p_triko', 'p_school', 'p_sport'], shoes: ['f_botinki', 'f_sapogi', 'f_kedy'], acc: [[], ['a_sigareta'], ['a_chasy']] },
  biz: { re: /кооп|барыг|коммерс|директор|покупат|делец|банкир|фарц|спекул|торгаш|завмаг|продавец|завскладом|снабж|брокер|бизнес|москвичи|из москвы/i,
    m: 1, build: ['fat', 'normal', 'thin'], hair: ['zaliz', 'probor', 'mallet', 'kudri'], mark: ['none', 'zub', 'usiki', 'none'],
    hat: ['h_none', 'h_shlyapa', 'h_norka', 'h_kozha'], outer: ['o_pidzhak', 'o_kozhanka', 'o_plashch', 'o_dublenka', 'o_varenka'],
    shirt: ['s_vodolazka', 's_school', 's_hawaii', 's_shelk'], pants: ['p_school', 'p_varenki', 'p_levic'], shoes: ['f_tufli', 'f_salamandr', 'f_romyka'],
    acc: [['a_ochki'], ['a_chasy'], ['a_barsetka'], ['a_pechatka', 'a_cep'], ['a_ochki', 'a_chasy']] },
  thug: { re: /чуж|гонщ|угонщ|старш|бандит|спортсм|боец|кидал|бык|качок|братв|залётн|урка|вор|блатн|ершов|савин|хади|перв/i,
    m: 1, build: ['strong', 'strong', 'normal', 'thin', 'fat'], hair: ['nol', 'ezhik', 'mallet', 'bobrik', 'chelka'], mark: ['fingal', 'scar', 'brov', 'zub', 'tatu', 'plaster', 'none'],
    hat: ['h_adibas', 'h_none', 'h_petushok', 'h_kozha', 'h_vosmi'], outer: ['o_adibas', 'o_kosuha', 'o_kozhanka', 'o_telogreika', 'o_olimp', 'o_varenka'],
    shirt: ['s_maika', 's_adibas', 's_telnyashka', 's_vodolazka'], pants: ['p_adibas', 'p_sport', 'p_varenki', 'p_banan'], shoes: ['f_adibas', 'f_kedy', 'f_martin'],
    acc: [['a_sigareta'], [], ['a_cep'], ['a_pechatka'], ['a_chetki']] },
  woman: { re: /бабк|бабуш|тёт|тет|соседк|челноч|продавщ|буфетч|кассирш|учительн|мать|медсестр|женщин|вахтёр|дворничих|гадалк|цыганк|проводниц/i,
    f: 1, build: ['fat', 'normal', 'thin'], hair: ['zavivka', 'kosa', 'dlinnye', 'kudri'], mark: ['none', 'none', 'freckles'],
    hat: ['h_platok', 'h_none', 'h_none', 'h_norka'], outer: ['o_halat', 'o_none', 'o_alyaska', 'o_shuba', 'o_dublenka'],
    shirt: ['s_kofta', 's_platye', 's_kletka'], pants: ['p_yubka'], shoes: ['f_botinki', 'f_tufli', 'f_tapki', 'f_valenki'], acc: [[], ['a_ochki'], []] },
  girl: { re: /девуш|девчонк|студентк|невест|подруг|танцовщ|официантк|певиц|модел/i,
    f: 1, young: 1, build: ['thin', 'normal'], hair: ['dlinnye', 'kosa', 'zavivka', 'chelka', 'kudri'], mark: ['none', 'freckles', 'serga'],
    hat: ['h_none', 'h_none', 'h_bandana'], outer: ['o_varenka', 'o_none', 'o_alyaska', 'o_kozhanka'], shirt: ['s_platye', 's_kofta', 's_laskoviy', 's_modern'],
    pants: ['p_yubka', 'p_varenki'], shoes: ['f_tufli', 'f_kedy', 'f_konvers'], acc: [[], ['a_pleer'], ['a_cepochka']] },
  old: { re: /дед|ветеран|старик|абый|пенсион|фронтов|афган/i,
    m: 1, old: 1, build: ['thin', 'normal', 'fat'], hair: ['zaliz', 'probor', 'nol'], mark: ['usy', 'none', 'scar'],
    hat: ['h_ushanka', 'h_shlyapa', 'h_vosmi', 'h_none'], outer: ['o_telogreika', 'o_pidzhak', 'o_afganka', 'o_dublenka'],
    shirt: ['s_school', 's_kletka', 's_vodolazka'], pants: ['p_school', 'p_triko'], shoes: ['f_botinki', 'f_valenki', 'f_tufli'], acc: [['a_znachok'], [], ['a_ochki']] },
  youth: { re: /мал|пацан|школьн|студент|скорлуп|шкет|первокурс|пионер|сын/i,
    m: 1, young: 1, build: ['thin', 'normal', 'thin'], hair: ['chelka', 'gorshok', 'ezhik', 'mallet', 'kudri'], mark: ['freckles', 'none', 'fingal', 'plaster'],
    hat: ['h_usa', 'h_petushok', 'h_none', 'h_adibas'], outer: ['o_sport', 'o_olimp', 'o_none', 'o_varenka', 'o_adibas'],
    shirt: ['s_school', 's_maika', 's_pama', 's_metal'], pants: ['p_school', 'p_sport', 'p_varenki'], shoes: ['f_kedy', 'f_konvers', 'f_dutyshi'], acc: [[], ['a_pleer'], ['a_znachok']] },
  official: { re: /прокур|комсорг|депутат|чиновн|завуч|учител|секретар|инструкт|судья|адвокат|врач|доктор|журналист|корреспонд|редактор|профессор|тренер/i,
    m: 1, build: ['normal', 'fat', 'thin'], hair: ['probor', 'zaliz', 'bobrik'], mark: ['none', 'usiki', 'none'],
    hat: ['h_none', 'h_shlyapa', 'h_none'], outer: ['o_pidzhak', 'o_plashch', 'o_dublenka'], shirt: ['s_school', 's_vodolazka'], pants: ['p_school'],
    shoes: ['f_tufli', 'f_salamandr'], acc: [['a_ochki'], ['a_chasy'], ['a_ochki', 'a_chasy'], ['a_znachok']] },
};
// девяностые: та же роль, но время другое
const ARCH90 = { thug: { outer: ['o_malina', 'o_kozhanka', 'o_kosuha', 'o_adibas'], acc: [['a_cep'], ['a_pager'], ['a_cep', 'a_pechatka'], ['a_mobila']] },
  biz: { outer: ['o_malina', 'o_plashch', 'o_pidzhak'], acc: [['a_mobila'], ['a_cep', 'a_chasy'], ['a_barsetka', 'a_pager']] } };
const ARCH_ORDER = ['ment', 'woman', 'girl', 'old', 'youth', 'official', 'biz', 'thug', 'worker'];
const BASE_ARCH = { muzhik: 'worker', chuzhoy: 'thug', babka: 'woman', militsioner: 'ment', malek: 'youth', zavuch: 'official', starsh: 'thug', official: 'official', girl: 'girl', old: 'old' };
const GENERIC = Object.keys(BASE_ARCH);
function archOf(key, label) {
  for (const k of ARCH_ORDER) if (label && ARCH[k].re.test(label)) return k;   // женщины и старики — раньше «мужиков»
  return BASE_ARCH[key] || 'worker';
}
function npcVar(key, label, seed) {
  const k = archOf(key, label), a = { ...ARCH[k], ...((typeof era90 === 'function' && S && era90(S) && ARCH90[k]) || {}) };
  let h = PPL_HASH((label || key) + '|' + (seed || ''));
  const r = arr => { h = (h + 0x6D2B79F5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); t = (t ^ (t >>> 14)) >>> 0; return arr[t % arr.length]; };   // mulberry32
  const app = { build: r(a.build), height: a.young ? r(['short', 'normal']) : r(['short', 'normal', 'tall']), skin: r(['s1', 's1', 's2', 's3', 's2']),
    hair: r(a.hair), hairc: a.old ? 'grey' : r(['black', 'dark', 'kashtan', 'rus', 'ginger', 'blond', 'dark']), eyes: r(['brown', 'grey', 'blue', 'green']), mark: r(a.mark) };
  if (a.f) app.lips = true;
  const wear = { hat: r(a.hat), outer: r(a.outer), shirt: r(a.shirt), pants: r(a.pants), shoes: r(a.shoes), acc: [...r(a.acc)] };
  for (const sl of ['hat', 'outer', 'shirt', 'pants', 'shoes']) if (!ITEM[wear[sl]]) wear[sl] = DEFAULT_WEAR[sl];   // на всякий случай
  wear.acc = wear.acc.filter(id => ITEM[id]);
  return { name: label || (NPCS[key] && NPCS[key].name) || 'Прохожий', app, wear, arch: k };
}
// говорящий без своего портрета → своё лицо по роли
{ const ss = setSpeaker; setSpeaker = (who, emo) => {
  const [key, label] = (who || '').split(':');
  if (key && GENERIC.includes(key) && (label || !PORTRAITS.includes(key))) {
    const save = NPCS[key]; NPCS[key] = npcVar(key, label, label ? '' : S && S.cur);   // без подписи — новое лицо в каждом событии
    try { return ss(who, emo); } finally { if (save) NPCS[key] = save; else delete NPCS[key]; }
  }
  return ss(who, emo);
}; }

// портреты второстепенных (Flow, 1.5.1) и эмоции главных героев: p_<key>_angry|sad|smile.jpg
['zhora', 'mehanik', 'vrach', 'oficiant', 'barmen', 'kassir', 'parikm', 'kinomeh', 'koop', 'moskvich', 'voenkom', 'gop', 'tsyganka', 'fartsa', 'dembel', 'vor', 'svetka', 'otets']
  .forEach(k => { if (!PORTRAITS.includes(k)) PORTRAITS.push(k); });
const EMO_FACES = { natasha: 1, ildar: 1, zima: 1, garipov: 1 };   // у кого есть p_<key>_angry/sad/smile.jpg
