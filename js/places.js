// Места на карте (как здания в GTA): значок в районе → экран заведения с работником, картинкой и действиями.

// ===================== РАБОТНИКИ ЗАВЕДЕНИЙ ===========================================================
Object.assign(NPCS, {
  parikm: { name: 'Парикмахерша Зоя', app: { build: 'fat', height: 'short', skin: 's1', hair: 'zavivka', hairc: 'ginger', eyes: 'green', mark: 'none', lips: true },
    wear: { hat: 'h_none', outer: 'o_none', shirt: 's_platye', pants: 'p_yubka', shoes: 'f_tapki', acc: [] } },
  oficiant: { name: 'Официант', app: { build: 'thin', height: 'tall', skin: 's1', hair: 'zaliz', hairc: 'black', eyes: 'brown', mark: 'usy' },
    wear: { hat: 'h_none', outer: 'o_pidzhak', shirt: 's_school', pants: 'p_school', shoes: 'f_tufli', acc: [] } },
  barmen: { name: 'Буфетчица Галя', app: { build: 'fat', height: 'normal', skin: 's2', hair: 'zavivka', hairc: 'blond', eyes: 'brown', mark: 'none', lips: true },
    wear: { hat: 'h_none', outer: 'o_halat', shirt: 's_kofta', pants: 'p_yubka', shoes: 'f_tapki', acc: [] } },
  mehanik: { name: 'Механик Михалыч', app: { build: 'strong', height: 'normal', skin: 's3', hair: 'ezhik', hairc: 'grey', eyes: 'grey', mark: 'usy' },
    wear: { hat: 'h_vosmi', outer: 'o_telogreika', shirt: 's_telnyashka', pants: 'p_triko', shoes: 'f_sapogi', acc: [] } },
  kassir: { name: 'Кассирша', app: { build: 'normal', height: 'normal', skin: 's1', hair: 'zavivka', hairc: 'dark', eyes: 'blue', mark: 'none', lips: true },
    wear: { hat: 'h_none', outer: 'o_pidzhak', shirt: 's_school', pants: 'p_yubka', shoes: 'f_tufli', acc: ['a_ochki'] } },
  vrach: { name: 'Врач', app: { build: 'normal', height: 'tall', skin: 's1', hair: 'zaliz', hairc: 'grey', eyes: 'grey', mark: 'none' },
    wear: { hat: 'h_none', outer: 'o_none', shirt: 's_school', pants: 'p_school', shoes: 'f_tufli', acc: ['a_ochki'] } },
  kinomeh: { name: 'Киномеханик', app: { build: 'thin', height: 'normal', skin: 's1', hair: 'mallet', hairc: 'dark', eyes: 'brown', mark: 'none' },
    wear: { hat: 'h_none', outer: 'o_varenka', shirt: 's_metal', pants: 'p_varenki', shoes: 'f_kedy', acc: [] } },
  zhora: { name: 'Фарцовщик Жора', app: { build: 'thin', height: 'normal', skin: 's1', hair: 'probor', hairc: 'black', eyes: 'brown', mark: 'none' },
    wear: { hat: 'h_usa', outer: 'o_mantana', shirt: 's_boi', pants: 'p_levic', shoes: 'f_adibas', acc: ['a_ochki', 'a_mantana'] } },
});

// ===================== МАШИНЫ ======================================================================
// t: moped / moto / car. age — с какого возраста продадут (права), use — расход бака в день (%), tank — полный бак в рублях
const CARS = [
  { id: 'riga', t: 'moped', name: 'Мопед «Рига-13»', price: 80, rank: 0, age: 14, speed: 0.9, yaz: 0, use: 6, tank: 2, desc: 'Тарахтит на весь район. Первая свобода.' },
  { id: 'voshod', t: 'moto', name: 'Мотоцикл «Восход-3М»', price: 250, rank: 1, age: 16, speed: 0.8, yaz: 1, use: 9, tank: 4, desc: 'Красный бак, хромированный глушитель. Девчонки оборачиваются.' },
  { id: 'izh', t: 'moto', name: 'Мотоцикл «ИЖ Планета-5»', price: 420, rank: 2, age: 16, speed: 0.75, yaz: 1, use: 10, tank: 5, desc: 'Тяжёлый, надёжный, рычит как зверь.' },
  { id: 'ural', t: 'moto', name: '«Урал» с коляской', price: 600, rank: 2, age: 16, speed: 0.78, yaz: 1, use: 12, tank: 6, seats: 2, desc: 'В коляску влезает двое пацанов. Или ящик чего угодно.' },
  { id: 'java', t: 'moto', name: '«Ява-350»', price: 950, rank: 3, age: 16, speed: 0.65, yaz: 2, use: 10, tank: 5, desc: 'Чехословацкая. Мечта любого пацана Союза.' },
  { id: 'zapor', t: 'car', name: '«Запорожец»', price: 650, rank: 1, age: 18, speed: 0.8, yaz: 0, use: 12, tank: 8, desc: 'Ушастый. Едет, если толкнуть.' },
  { id: 'moskvich', t: 'car', name: '«Москвич-412»', price: 1000, rank: 2, age: 18, speed: 0.72, yaz: 1, use: 13, tank: 9, desc: 'Зелёный, с багажником на крыше.' },
  { id: 'kopeyka', t: 'car', name: 'ВАЗ-2101 «Копейка»', price: 1300, rank: 2, age: 18, speed: 0.7, yaz: 1, use: 12, tank: 9, desc: 'Белая, с занавесками на заднем стекле.' },
  { id: 'devyatka', t: 'car', name: 'ВАЗ-2109 «Девятка»', price: 2500, rank: 3, age: 18, speed: 0.62, yaz: 2, use: 12, tank: 10, desc: 'Мокрый асфальт, тонировка в ноль. Мечта района.' },
  { id: 'volga', t: 'car', name: 'ГАЗ-24 «Волга»', price: 4000, rank: 4, age: 18, speed: 0.6, yaz: 2, use: 15, tank: 12, seats: 4, desc: 'Чёрная. На такой ездят серьёзные люди.' },
  { id: 'bmw', t: 'car', name: 'BMW «пятёрка»', price: 600, cur: '$', rank: 4, age: 18, speed: 0.5, yaz: 3, use: 14, tank: 14, desc: 'Пригнана из Германии. Акула на асфальте.' },
  { id: 'mers', t: 'car', name: 'Мерседес-«шестисотый»', price: 1200, cur: '$', rank: 5, age: 18, speed: 0.45, yaz: 3, use: 16, tank: 16, seats: 4, desc: 'Девяносто первый. Весь город оборачивается.' },
];
const VTYPE = { moped: 'мопед', moto: 'мотоцикл', car: 'машина' };
// Возраст героя: в сентябре 1987-го ему 15, дальше — по календарю
const heroAge = S => 15 + Math.floor(((S.day || 1) - 1) / 365.25);
const CAR = Object.fromEntries(CARS.map(c => [c.id, c]));
const carTxt = c => c.cur === '$' ? `$${c.price}` : `${c.price} р.`;

// ===================== МЕСТА ========================================================================
// d — район, k — вид значка, bg — фон сцены, npc — кто встречает
const PLACES = [
  { id: 'barber', name: 'Парикмахерская «Чародейка»', d: 'center', k: 'barber', bg: 'pl_barber', npc: 'parikm' },
  { id: 'barber2', name: 'Парикмахерская у универсама', d: 'universam', k: 'barber', bg: 'pl_barber', npc: 'parikm' },
  { id: 'resto', name: 'Ресторан «Акчарлак» с варьете', d: 'center', k: 'resto', bg: 'pl_resto', npc: 'oficiant' },
  { id: 'bar1', name: 'Пивбар «Жигули»', d: 'tyap', k: 'bar', bg: 'pl_bar', npc: 'barmen' },
  { id: 'bar2', name: 'Рюмочная «Встреча»', d: 'zhilka', k: 'bar', bg: 'pl_bar', npc: 'barmen' },
  { id: 'bar3', name: 'Пивной ларёк «Бочка»', d: 'perv', k: 'bar', bg: 'pl_bar', npc: 'barmen' },
  { id: 'sto', name: 'СТО «Автосервис»', d: 'socgorod', k: 'sto', bg: 'pl_sto', npc: 'mehanik' },
  { id: 'sto2', name: 'Гаражи-мастерская', d: 'savinovo', k: 'sto', bg: 'pl_sto', npc: 'mehanik' },
  { id: 'bank', name: 'Сберкасса № 8610', d: 'center', k: 'bank', bg: 'pl_bank', npc: 'kassir' },
  { id: 'menty', name: 'Отделение милиции', d: 'center', k: 'police', bg: 'otdel', npc: 'garipov' },
  { id: 'menty2', name: 'Опорный пункт', d: 'taktash', k: 'police', bg: 'otdel', npc: 'militsioner' },
  { id: 'hosp', name: 'Больница № 7', d: 'kinoplenka', k: 'hosp', bg: 'pl_hosp', npc: 'vrach' },
  { id: 'rynok', name: 'Колхозный рынок', d: 'pavluha', k: 'market', bg: 'rynok', npc: 'zhora' },
  { id: 'video', name: 'Видеосалон в подвале', d: 'center', k: 'video', bg: 'pl_kino', npc: 'kinomeh' },
  { id: 'dk', name: 'ДК «Строитель»', d: 'center', k: 'dk', bg: 'dk', npc: 'bacha' },
  { id: 'kino', name: 'Кинотеатр «Родина»', d: 'universam', k: 'video', bg: 'pl_kino', npc: 'kinomeh' },
  // автомагазины, заправки, мастерские
  { id: 'avto1', name: 'Магазин «Автомобили»', d: 'center', k: 'auto', bg: 't_v_salon', npc: 'zhora' },
  { id: 'avto2', name: 'Мотосалон «Восход»', d: 'socgorod', k: 'auto', bg: 't_v_salon', npc: 'mehanik' },
  { id: 'avto3', name: 'Комиссионка подержанных машин', d: 'borisk', k: 'auto', bg: 't_v_salon', npc: 'zhora' },
  { id: 'azs1', name: 'АЗС на Сибирском тракте', d: 'borisk', k: 'azs', bg: 't_v_azs', npc: 'muzhik' },
  { id: 'azs2', name: 'АЗС у Ленинградского моста', d: 'kinoplenka', k: 'azs', bg: 't_v_azs', npc: 'muzhik' },
  { id: 'azs3', name: 'АЗС на Оренбургском тракте', d: 'mirny', k: 'azs', bg: 't_v_azs', npc: 'muzhik' },
  { id: 'azs4', name: 'Заправка «Интурист»', d: 'savinovo', k: 'azs', bg: 't_v_azs', npc: 'muzhik' },
  { id: 'azs5', name: 'Колонка у гаражей', d: 'gryaz', k: 'azs', bg: 't_v_azs', npc: 'muzhik' },
  { id: 'sto3', name: 'Автосервис на Гвардейской', d: 'tyap', k: 'sto', bg: 'pl_sto', npc: 'mehanik' },
  { id: 'sto4', name: 'Гаражный кооператив «Мотор»', d: 'gryaz', k: 'sto', bg: 't_v_garazh', npc: 'mehanik' },
  { id: 'sto5', name: 'СТО «Жигули»', d: 'perv', k: 'sto', bg: 'pl_sto', npc: 'mehanik' },
  { id: 'sto6', name: 'Мастерская мотоциклов', d: 'novotat', k: 'sto', bg: 't_v_garazh', npc: 'mehanik' },
  // остальное — чтобы в каждом районе было куда зайти
  { id: 'bar4', name: 'Пивнушка «Под мостом»', d: 'novotat', k: 'bar', bg: 'pl_bar', npc: 'barmen' },
  { id: 'bar5', name: 'Чебуречная', d: 'taktash', k: 'bar', bg: 'pl_bar', npc: 'barmen' },
  { id: 'bar6', name: 'Пивбар «Три медведя»', d: 'mirny', k: 'bar', bg: 'pl_bar', npc: 'barmen' },
  { id: 'bar7', name: 'Закусочная «Минутка»', d: 'kinoplenka', k: 'bar', bg: 'pl_bar', npc: 'barmen' },
  { id: 'barber3', name: 'Парикмахерская «Локон»', d: 'savinovo', k: 'barber', bg: 'pl_barber', npc: 'parikm' },
  { id: 'barber4', name: 'Цирюльня в слободе', d: 'novotat', k: 'barber', bg: 'pl_barber', npc: 'parikm' },
  { id: 'barber5', name: 'Парикмахерская «Улыбка»', d: 'pavluha', k: 'barber', bg: 'pl_barber', npc: 'parikm' },
  { id: 'video2', name: 'Видеосалон «Плаза»', d: 'perv', k: 'video', bg: 'pl_kino', npc: 'kinomeh' },
  { id: 'kino2', name: 'Кинотеатр «Комсомолец»', d: 'socgorod', k: 'video', bg: 'pl_kino', npc: 'kinomeh' },
  { id: 'video3', name: 'Видеосалон в общаге', d: 'gryaz', k: 'video', bg: 'pl_kino', npc: 'kinomeh' },
  { id: 'dk2', name: 'ДК Химиков', d: 'zhilka', k: 'dk', bg: 'dk', npc: 'bacha' },
  { id: 'dk3', name: 'ДК им. Ленина', d: 'mirny', k: 'dk', bg: 'dk', npc: 'bacha' },
  { id: 'dk4', name: 'Клуб «Юность»', d: 'taktash', k: 'dk', bg: 'dk', npc: 'bacha' },
  { id: 'hosp2', name: 'Травмпункт', d: 'gryaz', k: 'hosp', bg: 'pl_hosp', npc: 'vrach' },
  { id: 'hosp3', name: 'Поликлиника № 4', d: 'savinovo', k: 'hosp', bg: 'pl_hosp', npc: 'vrach' },
  { id: 'rynok2', name: 'Барахолка у железной дороги', d: 'borisk', k: 'market', bg: 'rynok', npc: 'zhora' },
  { id: 'rynok3', name: 'Рынок на Тукая', d: 'tyap', k: 'market', bg: 'rynok', npc: 'zhora' },
  { id: 'bank2', name: 'Сберкасса № 4', d: 'socgorod', k: 'bank', bg: 'pl_bank', npc: 'kassir' },
  { id: 'bank3', name: 'Сберкасса на Павлюхина', d: 'pavluha', k: 'bank', bg: 'pl_bank', npc: 'kassir' },
  { id: 'menty3', name: 'Опорный пункт на Перваках', d: 'perv', k: 'police', bg: 'otdel', npc: 'militsioner' },
  { id: 'menty4', name: 'Отдел милиции Ленинского района', d: 'zhilka', k: 'police', bg: 'otdel', npc: 'militsioner' },
  { id: 'resto2', name: 'Кафе «Сказка»', d: 'universam', k: 'resto', bg: 'pl_resto', npc: 'oficiant' },
  { id: 'resto3', name: 'Ресторан «Татарстан»', d: 'kinoplenka', k: 'resto', bg: 'pl_resto', npc: 'oficiant' },
  { id: 'resto4', name: 'Кафе «Чайка»', d: 'borisk', k: 'resto', bg: 'pl_resto', npc: 'oficiant' },
];
const PLACE = Object.fromEntries(PLACES.map(p => [p.id, p]));
const placesIn = d => PLACES.filter(p => p.d === d);

const GREET = {
  barber: () => V('Садись, касатик. Обрастать будем или стричься?', 'Ой, ну ты и оброс! Садись.', 'Тебе как всегда — под «полубокс»?'),
  resto: () => V('Столик на одного? Варьете в девять.', 'Молодой человек, у нас по записи… Ну, для вас найдём.', 'Проходите. Сегодня поёт сама Римма.'),
  bar: () => V('Чего тебе, малой? Пиво только с восемнадцати… ладно, наливаю.', 'Кружки кончились. Неси свою банку.', 'Мужики сегодня злые, ты осторожней.'),
  sto: () => V('Что, тачку хочешь? Это дело. Деньги покажи.', 'Опять стучит? Загоняй.', 'Михалыч всё починит. За деньги.'),
  bank: () => V('Сберкасса. Вклады принимаем под проценты.', 'Сберегательная книжка с собой?', 'Храните деньги в сберегательной кассе!'),
  police: () => V('Чего пришёл? Сам сдаваться?', 'Ну, проходи, раз пришёл.', 'Опять ты. Садись.'),
  hosp: () => V('Где болит? Раздевайся по пояс.', 'Опять ты с разбитой мордой?', 'Очередь — за мной.'),
  market: () => V('Джинсы, кассеты, жвачка, доллары — всё есть, всё дорого.', 'Тсс… Чего надо?', 'Для тебя — по особой цене.'),
  video: () => V('Сеанс через пять минут. Рубль.', 'Сегодня «Терминатор»! Мест нет… для тебя найдём.', 'Только тихо: у нас тут проверка была.'),
  dk: () => V('Танцы по субботам, бокс по вторникам.', 'Ты на танцы или на бокс?', 'Опять скорлупа набилась…'),
  azs: () => V('Бензин — по талонам. Талонов нет? Договоримся.', 'Девяносто третьего нет, есть семьдесят шестой.', 'Очередь видишь? Вставай в конец.'),
  auto: () => V('Очередь на «Жигули» — на пять лет. Но для тебя…', 'Права есть? А деньги есть?', 'Что берём? Мотоцикл или машину?'),
};

// Действия заведения. cost: доля «дела» по времени (1 = 4 часа)
function placeActions(S, p) {
  const a = [];
  switch (p.k) {
    case 'barber':
      a.push({ t: 'Подстричься (2 р.) — выбрать причёску', req: { dengi: 2 }, cost: 0.25, go: null, barber: true });
      a.push({ t: 'Побрить и освежить «Шипром» (1 р.)', req: { dengi: 1 }, cost: 0.25, fx: { dengi: -1, yaz: 0 }, txt: 'Пахнешь как директор завода. Девчонки оборачиваются.' });
      break;
    case 'resto':
      a.push({ t: 'Заказать столик (15 р.)', if: () => S.rank >= 2, req: { dengi: 15 }, cost: 0.75, fx: { dengi: -15, avt: 4, uvazh: 3, zdor: 5 },
        txt: () => V('Котлета по-киевски, лимонад «Тархун». Старшие за соседним столом кивают тебе.', 'Варьете, оркестр, дым коромыслом. Ты здесь свой.') });
      a.push({ t: 'Пригласить Наташу (20 р.)', if: () => S.flags.met_natasha, req: { dengi: 20 }, cost: 1, fx: { dengi: -20, lyub: 18, natasha: 12 },
        txt: 'Она в платье, которое шила сама. Оркестр играет «Миллион алых роз». Вы танцуете.' });
      a.push({ t: 'Посмотреть варьете с порога', cost: 0.5, chk: ['yaz', 4], ok: { txt: 'Швейцар пропустил «на минутку». Перья, блёстки, саксофон.', fx: { zdor: 4 } },
        no: { txt: '«Без галстука нельзя». Швейцар захлопывает дверь.' } });
      a.push({ t: 'Устроить разборку с чужими за столиком', if: () => S.rank >= 3, cost: 0.75, go: 'f_random', fx: { mil: 8 } });
      break;
    case 'bar':
      a.push({ t: 'Кружка «Жигулёвского» (1 р.)', req: { dengi: 1 }, cost: 0.25, fx: { dengi: -1, zdor: 2, sovest: -1 }, txt: () => V('Пена до краёв. Мужики спорят про хоккей.', 'Кислое, разбавленное. Но холодное.') });
      a.push({ t: 'Послушать, что говорят мужики', cost: 0.5, fx: s => { jobsHour(); jobsHour(); return { um: 0 }; },
        txt: () => V('«На Перваках стрелка будет». «У Тофика новый салон». Ты всё запоминаешь. На карте появились новые дела.', 'Слухи, сплетни, кто кого побил. Кое-что пригодится — на карте новые маячки.') });
      a.push({ t: 'Домино на деньги (ставка 3 р.)', req: { dengi: 3 }, cost: 0.5, chk: ['um', 5], fx: { dengi: -3 },
        ok: { txt: '«Рыба!» Ты сгребаешь банк.', fx: { dengi: 7 } }, no: { txt: 'Мужики хлопают костяшками по столу и забирают ставку.' } });
      a.push({ t: 'Сцепиться с пьяным', cost: 0.5, go: 'f_random' });
      break;
    case 'sto':
      if (!S.car) a.push({ t: 'Купить транспорт — в автомагазине или мотосалоне', cost: 0, txt: 'Михалыч машет рукой: «Я чиню, а не продаю. Иди в «Автомобили» в центре или в мотосалон на Соцгороде».' });
      if (S.car) {
        const c = CAR[S.car.id], fix = Math.ceil((100 - S.car.cond) * c.price / 400) || 0;
        a.push({ t: `Ремонт (${fix} р.) — состояние ${S.car.cond}%`, if: () => S.car.cond < 100, req: { dengi: fix }, cost: 0.5,
          fx: s => { s.car.cond = 100; return { dengi: -fix }; }, txt: 'Михалыч копается под капотом, ругается и в конце вытирает руки: «Едет».' });
        a.push({ t: 'Тонировка и магнитола (40 р.)', if: () => !S.car.tuned, req: { dengi: 40 }, cost: 0.5,
          fx: s => { s.car.tuned = true; return { dengi: -40, avt: 3 }; }, txt: 'Стёкла чёрные, в магнитоле «Модерн Толкинг». Солидно.' });
        a.push({ t: `Продать ${c.name} (за полцены)`, cost: 0.25, fx: s => { const half = Math.round(c.price / 2); s.car = null; return c.cur === '$' ? { dol: half } : { dengi: half }; }, txt: 'Михалыч пересчитывает деньги и хлопает по капоту: «Прощай, ласточка».' });
      }
      a.push({ t: 'Подработать в мастерской', cost: 1, chk: ['um', 4], ok: { txt: 'Перебрал карбюратор. Михалыч доволен и платит.', fx: { dengi: 5, um: 0 } }, no: { txt: 'Уронил ключ в двигатель. Михалыч выгоняет тебя.' } });
      break;
    case 'auto': {
      const age = heroAge(S);
      if (S.car) a.push({ t: `У тебя уже есть: ${CAR[S.car.id].name}. Продать можно в СТО`, cost: 0, txt: 'Две машины — это уже кооператив, — смеётся продавец.' });
      else CARS.forEach(c => a.push({ t: `${c.name} — ${carTxt(c)}${age < c.age ? ` · с ${c.age} лет` : S.rank < c.rank ? ` · с ранга «${RANKS[c.rank]}»` : ''}`,
        req: c.cur === '$' ? { dol: c.price } : { dengi: c.price }, if: () => age >= c.age && S.rank >= c.rank, cost: 0.5,
        fx: s => { s.car = { id: c.id, cond: 100, fuel: 100 }; log(`Купил: ${c.name}.`); setTimeout(() => toast(`${VTYPE[c.t][0].toUpperCase() + VTYPE[c.t].slice(1)} твой! Открылись новые задания`), 900); return c.cur === '$' ? { dol: -c.price } : { dengi: -c.price }; },
        txt: `${c.name}! ${c.desc} Теперь по городу быстрее, и все видят, кто едет.` }));
      if (!S.car && age < 18) a.push({ t: age < 16 ? `Тебе ${age}. Мотоцикл — с 16, машина — с 18` : `Тебе ${age}. Машину продадут с 18 — пока мотоциклы`, cost: 0, txt: 'Продавец смотрит на тебя поверх очков: «Права покажи, юноша».' });
      break;
    }
    case 'azs': {
      if (!S.car) { a.push({ t: 'Купить канистру и продать водителям (3 р.)', req: { dengi: 3 }, cost: 0.5, chk: ['yaz', 4], fx: { dengi: -3 }, ok: { txt: 'Очередь на три часа — канистры уходят влёт.', fx: { dengi: 8 } }, no: { txt: 'Заправщик прогнал: «Тут я торгую».' } }); break; }
      const c = CAR[S.car.id], need = Math.ceil((100 - (S.car.fuel ?? 100)) * c.tank / 100);
      a.push({ t: `Залить полный бак (${need} р.) — сейчас ${S.car.fuel ?? 100}%`, if: () => (S.car.fuel ?? 100) < 100, req: { dengi: need }, cost: 0.25,
        fx: s => { s.car.fuel = 100; return { dengi: -need }; }, txt: () => V('Пахнет бензином и свободой. Бак полный.', 'Заправщик недолил литр, но спорить некогда.') });
      a.push({ t: 'Залить без очереди (+5 р. заправщику)', if: () => (S.car.fuel ?? 100) < 100, req: { dengi: need + 5 }, cost: 0.1,
        fx: s => { s.car.fuel = 100; return { dengi: -need - 5 }; }, txt: 'Очередь ворчит. Ты уже уезжаешь.' });
      a.push({ t: 'Слить бензин у чужих «Жигулей» на стоянке', cost: 0.5, chk: ['lovk', 5], ok: { txt: 'Шланг, канистра, пять минут. Бак полный.', fx: s => { s.car.fuel = 100; return { sovest: -4, mil: 3 }; } }, no: { txt: 'Хозяин вышел из подъезда с монтировкой.', go: 'f_random' } });
      break;
    }
    case 'bank': {
      const pct = Math.max(1, Math.round((S.bank || 0) * 0.01));
      a.push({ t: 'Положить на книжку 10 р.', req: { dengi: 10 }, cost: 0.25, fx: s => { s.bank = (s.bank || 0) + 10; return { dengi: -10 }; }, txt: 'Кассирша ставит штамп. На книжке деньги не отберёт шпана.' });
      a.push({ t: `Положить всё (${S.st.dengi} р.)`, if: () => S.st.dengi > 0, cost: 0.25, fx: s => { s.bank = (s.bank || 0) + s.st.dengi; return { dengi: -s.st.dengi }; }, txt: 'Все наличные — на сберкнижку. Спокойнее.' });
      a.push({ t: `Снять всё (${S.bank || 0} р.)`, if: () => (S.bank || 0) > 0, cost: 0.25, fx: s => { const v = s.bank; s.bank = 0; return { dengi: v }; }, txt: 'Кассирша долго пересчитывает. Деньги в кармане.' });
      a.push({ t: `Справка: на книжке ${S.bank || 0} р., +1% в неделю (≈${pct} р.)`, cost: 0, txt: 'Хранить деньги в сберегательной кассе выгодно и надёжно!' });
      break;
    }
    case 'police':
      a.push({ t: 'Заплатить штраф (20 р.)', if: () => S.st.mil >= 15, req: { dengi: 20 }, cost: 0.5, fx: { dengi: -20, mil: -30 }, txt: 'Квитанция, печать. Тебя вычёркивают из одного списка.' });
      a.push({ t: 'Узнать, что на тебя есть', cost: 0.25, txt: () => `Дежурный листает журнал: «Внимание к тебе — ${S.st.mil}. Улик — ${S.ulik || 0}. Гуляй пока».` });
      a.push({ t: 'Явка с повинной', if: () => S.st.mil >= 40, cost: 1, fx: { mil: -60, uvazh: -25, sovest: 15 }, txt: 'Ты всё рассказал. Про себя. Своих не назвал. Тебя отпустили — под подписку. Пацаны смотрят косо.' });
      break;
    case 'hosp':
      a.push({ t: 'Травмпункт (5 р.)', if: () => S.st.zdor < 90, req: { dengi: 5 }, cost: 0.5, fx: { dengi: -5, zdor: 30 }, txt: 'Зелёнка, бинт, укол от столбняка.' });
      a.push({ t: 'Лечь в стационар (2 дня, 10 р.)', if: () => S.st.zdor < 60, req: { dengi: 10 }, cost: 0, fx: s => { skipDays(2); return { dengi: -10, zdor: 100 }; }, txt: 'Белые простыни, манная каша, мама приносит апельсины. Ты как новый.' });
      break;
    case 'market':
      if (S.flags.gruz !== S.day) a.push({ t: 'Подработать грузчиком', cost: 1, fx: s => { s.flags.gruz = s.day; return { dengi: 4, zdor: -8 }; }, txt: 'Ящики с яблоками до вечера.' });
      break;
    case 'video': {
      const FILMS = [['rambo', '«Рэмбо»', 'lovk'], ['bruce', '«Выход дракона» с Брюсом Ли', 'sila'], ['termin', '«Терминатор»', 'um'], ['komando', '«Коммандо»', 'yaz']];
      FILMS.forEach(([id, n, st]) => a.push({ t: `Фильм ${n} (1 р.)`, req: { dengi: 1 }, cost: 0.5,
        fx: s => s.flags['film_' + id] ? { dengi: -1, zdor: 3 } : (s.flags['film_' + id] = 1, { dengi: -1, [st]: 1 }),
        txt: `Тесный подвал, «Электроника», гнусавый переводчик. ${S.flags['film_' + id] ? 'Пересмотрел — всё равно круто.' : 'Ты выходишь другим человеком.'}` }));
      break;
    }
    case 'dk':
      a.push({ t: 'Танцы (1 р.)', req: { dengi: 1 }, cost: 0.75, chk: ['yaz', 4], fx: { dengi: -1 },
        ok: { txt: '«Белый танец» — тебя приглашают! Медляк под «Ласковый май».', fx: { lyub: 6, zdor: 3 } }, no: { txt: 'Простоял у стенки весь вечер.', fx: {} } });
      a.push({ t: 'Секция бокса (2 р.)', req: { dengi: 2 }, cost: 1, chk: ['sila', 5], mini: 'udar', fx: { dengi: -2 },
        ok: { txt: 'Тренер хлопает по плечу: «Будет толк».', fx: { sila: 1 } }, no: { txt: 'Пропустил прямой. Звёздочки.', fx: { zdor: -6 } } });
      break;
  }
  return a;
}

// ===================== ЭКРАН ЗАВЕДЕНИЯ =================================================================
function openPlace(id) {
  const p = PLACE[id]; if (!p) return;
  AUDIO.click(); AUDIO.sfx && AUDIO.sfx('door');
  walkTo(S.at, p.d, () => { S.at = p.d; S.place = id; view = 'place'; render(); });
}
function renderPlace() {
  const p = PLACE[S.place];
  if (!p) { view = 'map'; return render(); }
  let acts = placeActions(S, p);
  if (p.k === 'market') acts = acts.concat(locActions(S, 'center').filter(x => /Напёрстки|Жоры|Жоре|Кассета|Жвачка|Видеосалон/.test(T(x.t))), mechActions(S, 'center'));
  acts = acts.filter(a => !a.if || a.if(S));
  $('#main').innerHTML = `<div class="scene in"><div class="when">${DIST[p.d].name} · ${clock()}</div><h2>${p.name}</h2>
    ${stageHtml(p.bg)}
    <div class="say" id="say"><div class="who" id="who">${npcOf(p.npc).name}</div><div class="line" id="line"></div></div>
    <div class="choices" id="chs">${acts.map((c, i) => choiceBtn(c, i)).join('')}
      <button class="btn" id="out">← На карту</button></div></div>`;
  drawHero($('#me'), S.app, S.wear);
  stage = { who: p.npc, npc: npcOf(p.npc), emo: 'smile', heroEmo: null };
  $('#spk').classList.remove('hidden'); drawStage(); stageStart();
  typeInto($('#line'), (GREET[p.k] || (() => 'Заходи.'))());
  bindChoices(acts, c => {
    if (c.barber) { stopTyping(); return barberScreen(); }
    if (c.cost === 0 && !c.fx && !c.chk) { stopTyping(); return typeInto($('#line'), T(c.txt)); }
    stopTyping(); S.cur = null; view = 'map'; doChoice({ ...c, cost: c.cost ?? 0.5 });
  });
  $('#out').onclick = () => { AUDIO.click(); stopTyping(); view = 'map'; render(); };
}

// ===================== ПАРИКМАХЕРСКАЯ и отрастание волос ===================================================
function barberScreen() {
  const a = { ...S.app }, rows = [['hair', 'Причёска'], ['hairc', 'Цвет (хна, басма)'], ['mark', 'Приметы']];
  const draw = () => {
    $('#main').innerHTML = `<div class="scene in"><h2>Кресло парикмахера</h2>
      <div class="ward-top"><canvas class="sprite big" id="spr"></canvas><div class="sub">Зоя щёлкает ножницами. «Ну, как будем?»<br>Стрижка — 2 р., покраска — ещё 3 р.</div></div>
      ${rows.map(([k, l], i) => `<div class="cyc"><span class="lbl">${l}</span><button data-c="${i}" data-d="-1">◀</button><span class="val">${LOOKS[k][a[k]]}</span><button data-c="${i}" data-d="1">▶</button></div>`).join('')}
      <div class="choices"><button class="btn main" id="ok">Готово (${2 + (a.hairc !== S.app.hairc ? 3 : 0)} р.)</button><button class="btn" id="no">Передумал</button></div></div>`;
    drawHero($('#spr'), { ...a, overgrown: false }, S.wear, { emo: 'smile' });
    document.querySelectorAll('.cyc button').forEach(b => b.onclick = () => { const k = rows[+b.dataset.c][0], o = Object.keys(LOOKS[k]); a[k] = o[(o.indexOf(a[k]) + +b.dataset.d + o.length) % o.length]; AUDIO.click(); draw(); });
    $('#ok').onclick = () => {
      const cost = 2 + (a.hairc !== S.app.hairc ? 3 : 0);
      if (S.st.dengi < cost) { toast('Не хватает денег'); return; }
      S.st.dengi -= cost; S.app = { ...a, overgrown: false }; S.hairDays = 0; AUDIO.sfx && AUDIO.sfx('swish');
      advanceTime(60); log('Подстригся у Зои.'); save('auto'); toast('Свежая стрижка! Язык +1 на неделю'); S.fresh = S.day + 7;
      view = 'map'; render();
    };
    $('#no').onclick = () => { AUDIO.click(); view = 'place'; render(); };
  };
  draw();
}
// Каждый день волосы растут. Через 25 дней — оброс (неопрятно: язык −1). После стрижки неделю — язык +1.
function hairDay(S) {
  S.hairDays = (S.hairDays || 0) + 1;
  if (S.hairDays === 25 && S.app.hair !== 'nol') { S.app.overgrown = true; log('Ты оброс. Пора в парикмахерскую.'); toast('Ты оброс — пора в парикмахерскую'); }
}
const looksBonus = k => k === 'yaz' ? ((S.fresh || 0) >= S.day ? 1 : 0) - (S.app.overgrown ? 1 : 0) + (S.car && CAR[S.car.id] ? CAR[S.car.id].yaz : 0) : 0;

// Транспорт: раз в неделю износ, каждый день расход бензина
function carWeek(S) {
  if (!S.car || !CAR[S.car.id]) return;
  S.car.cond = Math.max(0, S.car.cond - 6 - rnd(8));
  if (S.car.cond < 20) toast('Транспорт еле едет — в СТО!');
}
function carDay(S) {
  if (!S.car || !CAR[S.car.id]) return;
  const f = S.car.fuel ?? 100; S.car.fuel = Math.max(0, f - CAR[S.car.id].use);
  if (f > 0 && S.car.fuel === 0) toast('Бак пустой — на заправку');
}
const carGo = () => S.car && CAR[S.car.id] && S.car.cond >= 20 && (S.car.fuel ?? 100) > 0;
const carSpeed = () => carGo() ? CAR[S.car.id].speed : 1;

// Значки мест (5×5) для карты
const PLACE_ICONS = {
  barber: ['#...#', '.#.#.', '..#..', '.#.#.', '##.##'], resto: ['#.#.#', '#.#.#', '#####', '..#..', '..#..'],
  bar: ['#####', '#...#', '#...#', '.###.', '..#..'], sto: ['.###.', '#####', '#.#.#', '#####', '.#.#.'],
  bank: ['..#..', '.####', '..#..', '####.', '..#..'], police: ['..#..', '#####', '.###.', '.#.#.', '#...#'],
  hosp: ['.....', '..#..', '.###.', '..#..', '.....'], market: ['#####', '#.#.#', '#####', '.#.#.', '.#.#.'],
  video: ['#####', '#.#.#', '#####', '#.#.#', '#####'], dk: ['.###.', '#####', '#.#.#', '#.#.#', '#####'],
  azs: ['###..', '#.#.#', '###.#', '###.#', '###..'], auto: ['.###.', '#...#', '#####', '#####', '.#.#.'],
};
const PLACE_COL = { barber: '#e07aa8', resto: '#e5c04a', bar: '#d8902a', sto: '#7ab0e0', bank: '#6fc06f', police: '#4a7ae0', hosp: '#f0f0f0', market: '#c8a070', video: '#b07ae0', dk: '#e0605a', azs: '#f07a30', auto: '#40d0c0' };
