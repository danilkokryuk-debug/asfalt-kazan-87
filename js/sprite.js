// Пиксельные персонажи 32×64, собираются слоями как бумажная кукла. Без картинок — всё в коде.
// Вещь описывается данными: v = { k: форма, c: цвет, c2/s/...: детали, logo: значок }.

// --- Внешность ------------------------------------------------------------------------
const LOOKS = {
  build:  { thin: 'Худой', normal: 'Обычный', strong: 'Крепкий', fat: 'Полный' },
  height: { short: 'Мелкий', normal: 'Средний', tall: 'Высокий' },
  skin:   { s1: 'Светлая', s2: 'Смуглая', s3: 'Загорелая', s4: 'Тёмная' },
  hair:   { ezhik: 'Ёжик', chelka: 'Чёлка набок', probor: 'Пробор набок', bobrik: 'Бобрик', gorshok: 'Под горшок', kudri: 'Кудри',
            mallet: 'Маллет', zaliz: 'Зализанные назад', dlinnye: 'Длинные', nol: 'Под ноль' },
  hairc:  { black: 'Чёрные', dark: 'Тёмно-русые', kashtan: 'Каштановые', rus: 'Русые', ginger: 'Рыжие', blond: 'Светлые' },
  eyes:   { brown: 'Карие', grey: 'Серые', blue: 'Голубые', green: 'Зелёные' },
  mark:   { none: 'Нет', scar: 'Шрам на щеке', brov: 'Шрам на брови', fingal: 'Фингал', plaster: 'Пластырь', freckles: 'Веснушки',
            usiki: 'Пушок над губой', zub: 'Золотой зуб', serga: 'Серьга', tatu: 'Наколка на руке' },
};
const LOOK_NAMES = { build: 'Телосложение', height: 'Рост', skin: 'Кожа', hair: 'Причёска', hairc: 'Цвет волос', eyes: 'Глаза', mark: 'Приметы' };
const DEFAULT_APP = { build: 'normal', height: 'normal', skin: 's1', hair: 'ezhik', hairc: 'rus', eyes: 'grey', mark: 'none' };
const SKIN = { s1: '#f1c9a5', s2: '#e0ac85', s3: '#c68863', s4: '#9c6644' };
const HAIRC = { black: '#26201c', dark: '#4a3426', kashtan: '#6a3a22', rus: '#8a6a45', ginger: '#b5562a', blond: '#d9b45a', grey: '#9a968e' };
const EYEC = { brown: '#5a3a1e', grey: '#6d7b85', blue: '#3f6fb5', green: '#4f7d3a' };
const BUILD = { thin: 5, normal: 6, strong: 7, fat: 7 };   // полуширина плеч
const lookText = a => `${LOOKS.build[a.build]}, ${LOOKS.height[a.height].toLowerCase()} рост, ${LOOKS.hairc[a.hairc].toLowerCase()} волосы`;

// Пиксельные значки (смещения в клетке 5×3)
const LOGO = {
  adibas: [[0, 2], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  naik: [[0, 0], [0, 1], [1, 2], [2, 2], [3, 1], [4, 0]],
  pama: [[0, 2], [1, 1], [2, 1], [3, 0], [4, 0]],
  star: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  heart: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  text: [[0, 0], [2, 0], [4, 0], [0, 1], [1, 1], [2, 1], [4, 1]],
  dot: [[0, 0], [1, 0], [0, 1], [1, 1]],
  eagle: [[0, 0], [4, 0], [1, 1], [2, 1], [3, 1], [2, 2]],
};

// --- Гардероб ---------------------------------------------------------------------------------
// start — есть с начала; rank — с какого ранга продадут; bonus — к проверкам; npc — только для персонажей.
// Бренды нарочно искажены (Adibas, Naik, Pama…): узнаваемо, но не настоящие марки.
const SLOTS = { hat: 'Шапки', outer: 'Верх', shirt: 'Футболки и кофты', pants: 'Штаны', shoes: 'Обувь', acc: 'Аксессуары', wpn: 'Оружие' };
const W_ = '#f0f0f0', BLK = '#1a1a1a', RED = '#c02a2a', NAVY = '#1f2f6b', GOLD = '#e5c04a';
const ITEMS = [
  // ===== шапки
  { id: 'h_none', slot: 'hat', name: 'Без шапки', price: 0, start: true, v: { k: 'none' }, desc: 'Ветер в голове, во всех смыслах.' },
  { id: 'h_petushok', slot: 'hat', name: 'Шапка-петушок', price: 0, start: true, v: { k: 'knit', c: '#b03030', c2: '#d8d8d8', s: W_, pom: W_ }, desc: 'Вязаная, с помпоном. Её срывают первой.' },
  { id: 'h_ushanka', slot: 'hat', name: 'Ушанка', price: 5, v: { k: 'ushanka', c: '#6b5a4a' }, desc: 'Кроличья, от деда. Тепло и немодно.' },
  { id: 'h_usa', slot: 'hat', name: 'Кепка «USA»', price: 8, v: { k: 'cap', c: '#f2f2f2', c2: RED, logo: 'text', lc: '#2b4fa0' }, desc: 'Белая, с красным козырьком. Откуда привезли — неизвестно, но хотят все.' },
  { id: 'h_vosmi', slot: 'hat', name: 'Кепка-восьмиклинка', price: 10, v: { k: 'flat', c: '#5a5048', c2: '#3a332c' }, desc: 'Клетчатая, как у шпаны в старых фильмах.' },
  { id: 'h_adibas', slot: 'hat', name: 'Петушок «Adibas»', price: 12, v: { k: 'knit', c: NAVY, c2: NAVY, s: W_, pom: W_ }, desc: 'Синий, с белыми полосками. Самая желанная шапка двора.' },
  { id: 'h_mantana', slot: 'hat', name: 'Бейсболка «Mantana»', price: 14, v: { k: 'cap', c: '#2b4fa0', c2: '#1b2f60', logo: 'text', lc: GOLD }, desc: 'Как джинсы «Mantana», только на голову.' },
  { id: 'h_naik', slot: 'hat', name: 'Кепка «Naik»', price: 15, v: { k: 'cap', c: BLK, c2: BLK, logo: 'naik', lc: W_ }, desc: 'Чёрная, с галочкой. Ну почти с галочкой.' },
  { id: 'h_bulz', slot: 'hat', name: 'Кепка «Chicago Bulz»', price: 20, v: { k: 'cap', c: RED, c2: BLK, logo: 'eagle', lc: BLK }, desc: 'Девяностые. Баскетбол по телевизору, бык на кепке.' },
  { id: 'h_kozha', slot: 'hat', name: 'Кожаная кепка', price: 30, rank: 2, bonus: { yaz: 1 }, v: { k: 'flat', c: '#2a2220', c2: '#151110' }, desc: 'Как у старших. Скорлупе такую не носят.' },
  { id: 'h_aerodrom', slot: 'hat', name: 'Кепка-«аэродром»', price: 40, rank: 3, bonus: { yaz: 1 }, v: { k: 'aerodrom', c: '#3a3633' }, desc: 'Огромная, как взлётная полоса. Сразу видно серьёзного человека.' },
  { id: 'h_norka', slot: 'hat', name: 'Норковая шапка', price: 150, rank: 4, bonus: { yaz: 2 }, v: { k: 'fur', c: '#5a3a24', c2: '#7a5638', tall: true }, desc: 'Статус. Снять такую — главный трофей улицы.' },
  { id: 'h_platok', slot: 'hat', npc: true, v: { k: 'platok', c: '#7a3a5a', c2: '#e0b0c0' } },
  { id: 'h_militsia', slot: 'hat', npc: true, v: { k: 'flat', c: '#4a5a7a', c2: '#2a3448', band: RED } },

  // ===== верх
  { id: 'o_none', slot: 'outer', name: 'Без куртки', price: 0, start: true, v: { k: 'none' }, desc: 'Пока тепло.' },
  { id: 'o_telogreika', slot: 'outer', name: 'Телогрейка', price: 0, start: true, v: { k: 'quilt', c: '#3d4034' }, desc: 'От деда осталась. Тёплая, но позорная.' },
  { id: 'o_pidzhak', slot: 'outer', name: 'Пиджак старшего брата', price: 10, bonus: { um: 1 }, v: { k: 'blazer', c: '#5b5550' }, desc: 'На размер больше. Зато похож на комсорга.' },
  { id: 'o_olimp', slot: 'outer', name: 'Олимпийка сборной', price: 20, bonus: { lovk: 1 }, v: { k: 'zip', c: '#b52a2a', s: W_, n: 2, col: W_ }, desc: 'Красная, на молнии. Почти как у сборной СССР.' },
  { id: 'o_sport', slot: 'outer', name: 'Синяя спортивная куртка', price: 25, bonus: { lovk: 1 }, v: { k: 'zip', c: '#2c55b8', s: W_, n: 2, col: W_ }, desc: 'Синяя, с белыми полосами на рукавах. Та самая, которую после сериала про пацанов узнаёт вся страна.' },
  { id: 'o_naik', slot: 'outer', name: 'Ветровка «Naik»', price: 28, bonus: { lovk: 1 }, v: { k: 'zip', c: '#2f8a7a', s: '#7a3a8a', n: 1, col: '#7a3a8a' }, desc: 'Шуршащая, бирюзовая с фиолетовым. Девяностые в чистом виде.' },
  { id: 'o_pama', slot: 'outer', name: 'Олимпийка «Pama»', price: 30, bonus: { lovk: 1 }, v: { k: 'zip', c: '#1f4a8a', s: W_, n: 1, col: W_, logo: 'pama' }, desc: 'С прыгающей кошкой на груди. Кошка, правда, кривая.' },
  { id: 'o_adibas', slot: 'outer', name: 'Олимпийка «Adibas»', price: 35, bonus: { lovk: 1 }, v: { k: 'zip', c: BLK, s: W_, n: 3, col: W_, logo: 'adibas' }, desc: 'Чёрная, три белые полосы. Если есть такая — ты король района.' },
  { id: 'o_varenka', slot: 'outer', name: 'Джинсовка-«варёнка»', price: 40, bonus: { yaz: 1 }, v: { k: 'jacket', c: '#6f8fb8', sp: '#a7bfdc', btn: '#d9c070' }, desc: 'Пятнистая, будто её кипятили с хлоркой. Так и было.' },
  { id: 'o_alyaska', slot: 'outer', name: 'Аляска', price: 45, v: { k: 'parka', c: '#2f4a33', lin: '#e07a26', fur: '#9a8a70' }, desc: 'Тёмно-зелёная, оранжевая подкладка, мех на капюшоне. Мечта школьника.' },
  { id: 'o_mantana', slot: 'outer', name: 'Джинсовка «Mantana»', price: 50, bonus: { yaz: 1 }, v: { k: 'jacket', c: '#3b5b8a', btn: GOLD }, desc: 'Фирменная, с орлом на пуговицах. У фарцы — полстипендии.' },
  { id: 'o_pilat', slot: 'outer', name: 'Бомбер «Pilat»', price: 55, bonus: { sila: 1 }, v: { k: 'bomber', c: '#3a4a2a', lin: '#e07a26', rib: BLK }, desc: 'Как у американских лётчиков. Оранжевая подкладка — на случай, если собьют.' },
  { id: 'o_kolumbia', slot: 'outer', name: 'Пуховик «Kolumbia»', price: 60, v: { k: 'parka', c: '#1a3a6a', lin: '#c02a2a', fur: null }, desc: 'Толстый, как подушка. Девяностые, Турция, рынок.' },
  { id: 'o_kosuha', slot: 'outer', name: 'Косуха', price: 70, rank: 1, bonus: { yaz: 1 }, v: { k: 'leather', c: '#151515', hl: '#3c3c44', zipd: true }, desc: 'Рокерская, на косой молнии. Металлистам привет.' },
  { id: 'o_kozhanka', slot: 'outer', name: 'Кожанка', price: 80, rank: 2, bonus: { yaz: 1, sila: 1 }, v: { k: 'leather', c: '#1c1c1e', hl: '#3c3c44' }, desc: 'Чёрная кожа. Сразу видно, кто тут решает.' },
  { id: 'o_dublenka', slot: 'outer', name: 'Дублёнка', price: 120, rank: 3, bonus: { yaz: 1 }, v: { k: 'coat', c: '#8a6a45', fur: '#e8dcc0' }, desc: 'Овчина, мех на воротнике. Тепло и солидно.' },
  { id: 'o_plashch', slot: 'outer', name: 'Кожаный плащ', price: 140, rank: 4, bonus: { yaz: 1, sila: 1 }, v: { k: 'coat', c: '#161616', fur: null }, desc: 'Длинный, до колен. Как в сериалах про бандитов девяностых.' },
  { id: 'o_malina', slot: 'outer', name: 'Малиновый пиджак', price: 200, rank: 5, bonus: { yaz: 2 }, v: { k: 'blazer', c: '#b0204a' }, desc: 'Девяностые наступают. Для тех, кто уже на самом верху.' },
  { id: 'o_afganka', slot: 'outer', npc: true, v: { k: 'jacket', c: '#6a6a3a', btn: '#3a3a20' } },
  { id: 'o_militsia', slot: 'outer', npc: true, v: { k: 'blazer', c: '#4a5a7a', btn: GOLD } },
  { id: 'o_halat', slot: 'outer', npc: true, v: { k: 'quilt', c: '#8a4a5a', line: '#6a3a4a' } },

  // ===== футболки, рубашки, кофты
  { id: 's_school', slot: 'shirt', name: 'Школьная рубашка', price: 0, start: true, v: { k: 'shirt', c: '#e9eef2', col: '#ffffff' }, desc: 'Белая, мама гладит.' },
  { id: 's_vest', slot: 'shirt', name: 'Жилетка с рубашкой', price: 0, start: true, v: { k: 'vest', c: '#b9cbe0', c2: '#3a3a3e' }, desc: 'Тёмная жилетка, голубая рубашка. Мальчик из хорошей семьи. Пока что.' },
  { id: 's_maika', slot: 'shirt', name: 'Белая футболка', price: 3, v: { k: 'tee', c: '#ececec' }, desc: 'Простая. Под ней — характер.' },
  { id: 's_telnyashka', slot: 'shirt', name: 'Тельняшка', price: 10, bonus: { sila: 1 }, v: { k: 'stripes', c: W_, c2: '#2a3c7a' }, desc: 'Кто служил — поймёт. Кто не служил — всё равно носит.' },
  { id: 's_laskoviy', slot: 'shirt', name: 'Футболка «Ласковый Мой»', price: 10, v: { k: 'tee', c: '#e07aa8', logo: 'heart', lc: W_ }, desc: 'С сердечком. Девчонки визжат, пацаны ржут.' },
  { id: 's_vodolazka', slot: 'shirt', name: 'Чёрная водолазка', price: 12, bonus: { um: 1 }, v: { k: 'turtle', c: '#1e1e22' }, desc: 'Как у поэта. Или как у бандита.' },
  { id: 's_pama', slot: 'shirt', name: 'Футболка «Pama»', price: 12, v: { k: 'tee', c: RED, logo: 'pama', lc: W_ }, desc: 'Красная, с прыгающей кошкой.' },
  { id: 's_modern', slot: 'shirt', name: 'Футболка «Modern Tolking»', price: 12, v: { k: 'tee', c: '#7ac0e0', logo: 'text', lc: W_ }, desc: 'Два немца с причёсками. Шери-шери-леди.' },
  { id: 's_adibas', slot: 'shirt', name: 'Футболка «Adibas»', price: 14, v: { k: 'tee', c: NAVY, logo: 'adibas', lc: W_ }, desc: 'Тёмно-синяя, с тремя полосками на груди.' },
  { id: 's_naik', slot: 'shirt', name: 'Футболка «Naik»', price: 14, v: { k: 'tee', c: '#e8e8e8', logo: 'naik', lc: BLK }, desc: 'Белая, с галочкой. Ну, похожей на галочку.' },
  { id: 's_oleni', slot: 'shirt', name: 'Свитер с оленями', price: 15, v: { k: 'sweater', c: '#8a2b2b', c2: '#eeeeee' }, desc: 'Бабушка вязала. Тёплый и смешной.' },
  { id: 's_krov', slot: 'shirt', name: 'Футболка «Группа крови»', price: 15, v: { k: 'tee', c: '#141414', logo: 'text', lc: RED }, desc: 'Чёрная, надпись от руки. Цой жив.' },
  { id: 's_metal', slot: 'shirt', name: 'Футболка «Iron Madin»', price: 18, v: { k: 'tee', c: '#141414', logo: 'star', lc: '#d0d0d0' }, desc: 'Металлист? В Казани восемьдесят седьмого это смело.' },
  { id: 's_hawaii', slot: 'shirt', name: 'Гавайская рубашка', price: 18, v: { k: 'hawaii', c: '#2a7a6a', c2: '#e8c050' }, desc: 'Девяностые. Пальмы на Казанке.' },
  { id: 's_boi', slot: 'shirt', name: 'Свитер «Boi London»', price: 25, bonus: { yaz: 1 }, v: { k: 'sweater', c: '#141414', c2: GOLD, logo: 'eagle' }, desc: 'С орлом на груди. Самое модное, что можно достать у фарцы.' },
  { id: 's_tomi', slot: 'shirt', name: 'Кофта «Tomi Hilfigur»', price: 30, v: { k: 'sweater', c: NAVY, c2: RED }, desc: 'Девяностые, рынок, Турция. Флажок на груди.' },
  { id: 's_kofta', slot: 'shirt', npc: true, v: { k: 'sweater', c: '#6a5a8a', c2: '#8a7aaa' } },
  { id: 's_platye', slot: 'shirt', npc: true, v: { k: 'shirt', c: '#3a6a5a', col: '#e8e8e8' } },

  // ===== штаны
  { id: 'p_school', slot: 'pants', name: 'Школьные брюки', price: 0, start: true, v: { k: 'plain', c: '#55565e' }, desc: 'Серые, со стрелками. Стрелки быстро кончаются.' },
  { id: 'p_triko', slot: 'pants', name: 'Трико с пузырями', price: 2, v: { k: 'triko', c: '#2c3a6b' }, desc: 'С пузырями на коленях. На улицу — только если ничего не боишься.' },
  { id: 'p_sport', slot: 'pants', name: 'Спортивки с лампасами', price: 12, bonus: { lovk: 1 }, v: { k: 'stripes', c: '#1f2a5a', s: '#e8e8e8', n: 1 }, desc: 'Тёмно-синие, с белой полоской. Униформа двора.' },
  { id: 'p_banan', slot: 'pants', name: 'Брюки-«бананы»', price: 20, v: { k: 'banan', c: '#6a6a72' }, desc: 'Широкие сверху, узкие снизу. Писк моды.' },
  { id: 'p_pama', slot: 'pants', name: 'Спортивки «Pama»', price: 20, bonus: { lovk: 1 }, v: { k: 'stripes', c: RED, s: W_, n: 1 }, desc: 'Красные. Видно с другого конца района.' },
  { id: 'p_adibas', slot: 'pants', name: 'Штаны «Adibas»', price: 25, bonus: { lovk: 1 }, v: { k: 'stripes', c: BLK, s: W_, n: 3 }, desc: 'Чёрные, три полоски. Классика, которой не будет конца.' },
  { id: 'p_varenki', slot: 'pants', name: 'Варёнки', price: 35, bonus: { yaz: 1 }, v: { k: 'jeans', c: '#7f9fc4', sp: '#b8cde3' }, desc: 'Джинсы, выбеленные в кастрюле. Вершина моды восемьдесят седьмого.' },
  { id: 'p_wrangel', slot: 'pants', name: 'Джинсы «Wrangel»', price: 40, bonus: { yaz: 1 }, v: { k: 'jeans', c: '#2a3f66' }, desc: 'Тёмные, жёсткие. Стоят колом.' },
  { id: 'p_mantana', slot: 'pants', name: 'Джинсы «Mantana»', price: 45, bonus: { yaz: 1 }, v: { k: 'jeans', c: '#2f4f80', seam: GOLD }, desc: 'С орлом на заклёпках. Мечта.' },
  { id: 'p_levic', slot: 'pants', name: 'Джинсы «Levic 501»', price: 55, bonus: { yaz: 1 }, v: { k: 'jeans', c: '#3a5a8a', seam: '#c08a3a' }, desc: 'Настоящие американские. Ну, почти настоящие.' },
  { id: 'p_kozha', slot: 'pants', name: 'Кожаные штаны', price: 60, rank: 2, v: { k: 'plain', c: '#151515' }, desc: 'Скрипят при ходьбе. Летом — пытка.' },
  { id: 'p_yubka', slot: 'pants', npc: true, v: { k: 'skirt', c: '#3a3a5a', t: '#c8a890' } },
  { id: 'p_militsia', slot: 'pants', npc: true, v: { k: 'stripes', c: '#3a4a6a', s: RED, n: 1 } },

  // ===== обувь
  { id: 'f_kedy', slot: 'shoes', name: 'Кеды «Два мяча»', price: 0, start: true, v: { k: 'kedy', c: '#2b3b5c' }, desc: 'Резиновый нос, белая подошва. Классика.' },
  { id: 'f_botinki', slot: 'shoes', name: 'Ботинки «Прощай, молодость»', price: 5, v: { k: 'boot', c: '#5a3a24', h: 1 }, desc: 'Войлочные, страшные и вечные.' },
  { id: 'f_sapogi', slot: 'shoes', name: 'Кирзачи', price: 8, bonus: { sila: 1 }, v: { k: 'boot', c: '#252525', h: 7 }, desc: 'Армейские. Пинаются хорошо.' },
  { id: 'f_tufli', slot: 'shoes', name: 'Лакированные туфли', price: 15, v: { k: 'tufli', c: '#20140e' }, desc: 'Для дискотеки в ДК. Скользят на льду.' },
  { id: 'f_konvers', slot: 'shoes', name: 'Кеды «Konvers»', price: 18, v: { k: 'kedy', c: BLK, star: true, h: 2 }, desc: 'Высокие, со звездой на щиколотке.' },
  { id: 'f_dutyshi', slot: 'shoes', name: 'Сапоги-«дутыши»', price: 20, v: { k: 'moon', c: RED, c2: W_ }, desc: 'Луноходы! Все смотрят, особенно милиция.' },
  { id: 'f_romyka', slot: 'shoes', name: 'Ботинки «Romyka»', price: 22, v: { k: 'boot', c: '#6a4428', h: 3 }, desc: 'Немецкие, на толстой подошве. Носятся десять лет.' },
  { id: 'f_ribok', slot: 'shoes', name: 'Кроссовки «Ribok»', price: 28, bonus: { lovk: 1 }, v: { k: 'sneaker', c: '#f2f2f2', s: '#c8c8c8', sole: '#d8c8a0' }, desc: 'Белые-белые. Отмывать каждый вечер.' },
  { id: 'f_adibas', slot: 'shoes', name: 'Кроссовки «Adibas»', price: 30, bonus: { lovk: 1 }, v: { k: 'sneaker', c: '#efefef', s: '#2b4fa0' }, desc: 'Белые, с синими полосками. Снимут вместе с ногами.' },
  { id: 'f_pama', slot: 'shoes', name: 'Кроссовки «Pama»', price: 30, bonus: { lovk: 1 }, v: { k: 'sneaker', c: NAVY, s: W_ }, desc: 'Тёмно-синие, белый зигзаг сбоку.' },
  { id: 'f_salamandr', slot: 'shoes', name: 'Туфли «Salamandr»', price: 35, bonus: { yaz: 1 }, v: { k: 'tufli', c: '#3a2216' }, desc: 'Импорт из ГДР. Скрипят по-богатому.' },
  { id: 'f_naik', slot: 'shoes', name: 'Кроссовки «Naik Air»', price: 40, bonus: { lovk: 1 }, v: { k: 'sneaker', c: '#f2f2f2', s: RED, sole: '#d0d0d0' }, desc: 'С воздухом в подошве. Говорят, прыгаешь выше.' },
  { id: 'f_martin', slot: 'shoes', name: 'Ботинки «Doc Martin»', price: 45, bonus: { sila: 1 }, v: { k: 'boot', c: '#3a1a1a', h: 5, sole: '#e5c04a' }, desc: 'Высокие, жёлтая строчка. Один пинок — и разговор окончен.' },
  { id: 'f_tapki', slot: 'shoes', npc: true, v: { k: 'tufli', c: '#7a4a5a' } },

  // ===== аксессуары (можно несколько)
  { id: 'a_znachok', slot: 'acc', name: 'Комсомольский значок', price: 0, start: true, v: { k: 'badge' }, desc: 'Пока ещё носишь.' },
  { id: 'a_sigareta', slot: 'acc', name: 'Сигарета за ухом', price: 1, v: { k: 'cig' }, desc: '«Космос». Не куришь, но так солиднее.' },
  { id: 'a_chetki', slot: 'acc', name: 'Чётки', price: 4, bonus: { um: 1 }, v: { k: 'beads' }, desc: 'Щёлкаешь — думаешь лучше. Ну, так говорят.' },
  { id: 'a_chasy', slot: 'acc', name: 'Часы «Электроника»', price: 20, bonus: { um: 1 }, v: { k: 'watch', c: '#c9c9c9' }, desc: 'Электронные. Весь класс завидует.' },
  { id: 'a_casiyo', slot: 'acc', name: 'Часы «Casiyo» с калькулятором', price: 25, bonus: { um: 1 }, v: { k: 'watch', c: '#2a2a2a' }, desc: 'Можно считать общак прямо на руке.' },
  { id: 'a_ochki', slot: 'acc', name: 'Очки «Ray-Bon»', price: 25, bonus: { yaz: 1 }, v: { k: 'glasses' }, desc: 'Тёмные. Даже зимой. Особенно зимой.' },
  { id: 'a_mantana', slot: 'acc', name: 'Часы «Mantana» с мелодиями', price: 35, bonus: { yaz: 1 }, v: { k: 'watch', c: GOLD }, desc: 'Шестнадцать мелодий! Звенят на уроке — учитель в бешенстве.' },
  { id: 'a_barsetka', slot: 'acc', name: 'Барсетка', price: 40, rank: 3, v: { k: 'bag', c: '#2a1a12' }, desc: 'Девяностые. Внутри пейджер и пачка денег.' },
  { id: 'a_pleer', slot: 'acc', name: 'Плеер «Sany Walkmen»', price: 60, v: { k: 'phones' }, desc: 'Кассетный, с наушниками. В Казани таких штук пять.' },
  { id: 'a_pechatka', slot: 'acc', name: 'Печатка', price: 60, rank: 3, bonus: { yaz: 1 }, v: { k: 'ring' }, desc: 'Золотая, с буквой. Блестит, когда бьёшь.' },
  { id: 'a_cep', slot: 'acc', name: 'Золотая цепь', price: 120, rank: 4, bonus: { yaz: 1 }, v: { k: 'chain' }, desc: 'Толщиной с палец. Блестит на всю улицу.' },
  { id: 'a_gitara', slot: 'acc', npc: true, v: { k: 'guitar' } },
];
// Ещё вещи: многие открываются только с ранга (rank), импорт — за доллары (см. economy.js)
ITEMS.push(
  { id: 'h_bandana', slot: 'hat', name: 'Бандана', price: 6, v: { k: 'bandana', c: '#8a1a1a', c2: '#f0f0f0' }, desc: 'Как у рокеров. Бабушки на лавке крестятся.' },
  { id: 'h_ny', slot: 'hat', name: 'Шапка «NY»', price: 15, v: { k: 'knit', c: BLK, c2: BLK, s: W_, pom: BLK }, desc: 'Чёрная, с белыми буквами. Привезли моряки.' },
  { id: 'h_pilot', slot: 'hat', name: 'Кожаная ушанка-«пилот»', price: 25, rank: 2, v: { k: 'ushanka', c: '#2a1e18' }, desc: 'Кожа и мех. Тепло и с понтами.' },
  { id: 'h_shlyapa', slot: 'hat', name: 'Шляпа', price: 60, rank: 4, bonus: { yaz: 1 }, v: { k: 'shlyapa', c: '#2a2622', c2: '#6a1a1a' }, desc: 'Как у гангстеров в кино. На районе так никто не ходит. Пока.' },
  { id: 'o_pilot', slot: 'outer', name: 'Кожаный «пилот»', price: 70, rank: 2, bonus: { sila: 1 }, v: { k: 'bomber', c: '#1e1612', lin: '#5a3a24', rib: '#3a2a20' }, desc: 'Короткая кожанка с мехом. Классика старших.' },
  { id: 'o_ankara', slot: 'outer', name: 'Турецкая кожанка «Анкара»', price: 90, rank: 3, bonus: { yaz: 1 }, v: { k: 'leather', c: '#4a2a1a', hl: '#6a4a3a' }, desc: 'Коричневая, на кнопках. Девяностые близко.' },
  { id: 'o_shuba', slot: 'outer', name: 'Шуба', price: 250, rank: 5, bonus: { yaz: 2 }, v: { k: 'coat', c: '#5a3a24', fur: '#7a5638', furry: true }, desc: 'Норковая, до колен. Автор должен быть виден издалека.' },
  { id: 's_kletka', slot: 'shirt', name: 'Рубашка в клетку', price: 8, v: { k: 'plaid', c: '#2a4a6a', c2: '#8a2a2a' }, desc: 'Фланелевая. Тёплая и надёжная, как батя.' },
  { id: 's_bulz', slot: 'shirt', name: 'Майка «Chicago Bulz»', price: 16, v: { k: 'tee', c: RED, logo: 'eagle', lc: BLK }, desc: 'Номер двадцать три на спине. Кто это — никто не знает.' },
  { id: 's_apash', slot: 'shirt', name: 'Рубашка с воротником «апаш»', price: 12, v: { k: 'shirt', c: '#d8c8a0', col: '#f0e8d0' }, desc: 'Воротник поверх пиджака. Как у старшего брата на выпускном.' },
  { id: 's_shelk', slot: 'shirt', name: 'Шёлковая рубашка', price: 40, rank: 4, bonus: { yaz: 1 }, v: { k: 'shirt', c: '#5a2a6a', col: '#7a3a8a' }, desc: 'Фиолетовый шёлк. Блестит под фонарём.' },
  { id: 'p_klesh', slot: 'pants', name: 'Клёши', price: 15, v: { k: 'banan', c: '#3a3a5a' }, desc: 'Штанины-колокола. Мамины, из семидесятых. Снова в моде?' },
  { id: 'p_kamo', slot: 'pants', name: 'Камуфляжные штаны', price: 18, rank: 1, bonus: { sila: 1 }, v: { k: 'jeans', c: '#4a5a34', sp: '#2a3a20' }, desc: 'Армейские. Дембель подогнал.' },
  { id: 'f_valenki', slot: 'shoes', name: 'Валенки', price: 4, v: { k: 'valenki', c: '#6a6a66' }, desc: 'Зимой лучше не придумаешь. Но в ДК — позор.' },
  { id: 'f_jordun', slot: 'shoes', name: 'Кроссовки «Air Jordun»', price: 70, rank: 2, bonus: { lovk: 2 }, v: { k: 'sneaker', c: RED, s: BLK, sole: '#f0f0f0' }, desc: 'Красно-чёрные, высокие. В Казани таких две пары. Обе — у старших.' },
  { id: 'f_kazaki', slot: 'shoes', name: 'Казаки', price: 50, rank: 3, bonus: { yaz: 1 }, v: { k: 'kazaki', c: '#6a3a1a' }, desc: 'Ковбойские сапоги со скошенным каблуком. Стучат на всю улицу.' },
  { id: 'a_cepochka', slot: 'acc', name: 'Тонкая цепочка', price: 30, rank: 2, v: { k: 'thinchain' }, desc: 'Пока не цепь. Но уже и не значок.' },
  { id: 'a_zipa', slot: 'acc', name: 'Зажигалка «Zipa»', price: 15, v: { k: 'lighter' }, desc: 'Щёлк — и огонь. Даже если не куришь, щёлкаешь.' },
  { id: 'a_pager', slot: 'acc', name: 'Пейджер', price: 80, rank: 4, bonus: { um: 1 }, v: { k: 'pager' }, desc: 'Девяносто первый. «Срочно перезвони Седому».' },
  { id: 'a_mobila', slot: 'acc', name: 'Мобильник-«кирпич»', price: 300, rank: 5, bonus: { yaz: 2 }, v: { k: 'phone' }, desc: 'Весит как кирпич, стоит как машина. Звонить некому, но все видят.' },
);
// Награды из сундука: только за достижения, в магазине их нет (reward: id достижения)
ITEMS.push(
  { id: 'rw_boec', slot: 'outer', reward: 'wins10', name: 'Олимпийка «Уличный боец»', price: 0, bonus: { sila: 1 }, v: { k: 'zip', c: '#141414', s: '#e5c04a', n: 3, col: '#e5c04a' }, desc: 'Чёрная с золотом. Её не купишь — её зарабатывают кулаками.' },
  { id: 'rw_adibas', slot: 'outer', reward: 'adibas', name: 'Золотая «Adibas»', price: 0, bonus: { lovk: 1 }, v: { k: 'zip', c: '#c8a030', s: '#1a1a1a', n: 3, col: '#1a1a1a' }, desc: 'Таких в Казани одна. Твоя.' },
  { id: 'rw_land', slot: 'outer', reward: 'land5', name: 'Кожанка «Пол-Казани»', price: 0, bonus: { sila: 1, yaz: 1 }, v: { k: 'leather', c: '#3a0e0e', hl: '#6a2a2a' }, desc: 'Бордовая кожа. Носит тот, под кем полгорода.' },
  { id: 'rw_avtor', slot: 'hat', reward: 'avtor', name: 'Кепка автора', price: 0, bonus: { yaz: 2 }, v: { k: 'flat', c: '#1a1410', c2: '#0a0806', band: '#e5c04a' }, desc: 'С золотой лентой. Все знают, кто под ней.' },
  { id: 'rw_zima', slot: 'hat', reward: 'winter', name: 'Шапка «Первый снег»', price: 0, v: { k: 'knit', c: '#f0f0f0', c2: '#2a4f9e', s: '#2a4f9e', pom: '#2a4f9e' }, desc: 'Белая, с синими полосками. Дожил до зимы — заслужил.' },
  { id: 'rw_belt', slot: 'acc', reward: 'kachok', name: 'Пояс чемпиона', price: 0, bonus: { sila: 1 }, v: { k: 'belt' }, desc: 'Золотая бляха на всё пузо. Качалка не прошла даром.' },
  { id: 'rw_ochki', slot: 'acc', reward: 'prof', name: 'Очки отличника', price: 0, bonus: { um: 1 }, v: { k: 'glasses', c: '#e5c04a' }, desc: 'В золотой оправе. Умный, но не ботаник.' },
  { id: 'rw_pleer', slot: 'acc', reward: 'tapes5', name: 'Золотой плеер', price: 0, v: { k: 'phones', c: '#e5c04a' }, desc: 'Для настоящего меломана. Звучит так же, но выглядит дороже.' },
  { id: 'rw_sharf', slot: 'acc', reward: 'love', name: 'Шарф Наташи', price: 0, bonus: { yaz: 1 }, v: { k: 'scarf', c: '#3a8a4a' }, desc: 'Зелёный, вязаный. Она связала его для тебя.' },
);
ITEMS.push(
  // ===== оружие (одно в руке). hit — урон в драке, heat — сколько внимания милиции, когда достаёшь
  { id: 'w_none', slot: 'wpn', name: 'Без оружия', price: 0, start: true, v: { k: 'none' }, desc: 'Кулаки — тоже аргумент.' },
  { id: 'w_rogatka', slot: 'wpn', name: 'Рогатка', price: 2, bonus: { lovk: 1 }, wp: { hit: 1, heat: 0 }, v: { k: 'sling' }, desc: 'Резинка от трусов и рогулька. Окна соседей трепещут.' },
  { id: 'w_palka', slot: 'wpn', name: 'Штакетина', price: 1, bonus: { sila: 1 }, wp: { hit: 1, heat: 1 }, v: { k: 'stick', c: '#8a6a3a' }, desc: 'Выломана из забора у детсада. Зато своя.' },
  { id: 'w_cep', slot: 'wpn', name: 'Велосипедная цепь', price: 5, rank: 1, bonus: { sila: 1, lovk: 1 }, wp: { hit: 2, heat: 2 }, v: { k: 'chain' }, desc: 'Намотал на кулак — и уже не скорлупа.' },
  { id: 'w_armatura', slot: 'wpn', name: 'Арматура', price: 4, rank: 1, bonus: { sila: 2 }, wp: { hit: 2, heat: 3 }, v: { k: 'stick', c: '#7a3a22', long: 1 }, desc: 'Ржавая, тяжёлая, со стройки. Классика махача.' },
  { id: 'w_kastet', slot: 'wpn', name: 'Самодельный кастет', price: 12, rank: 1, bonus: { sila: 2 }, wp: { hit: 2, heat: 4 }, v: { k: 'kastet', c: '#a8a8b0' }, desc: 'Отлит в гараже из свинца. Удар как у слона.' },
  { id: 'w_nunchaki', slot: 'wpn', name: 'Нунчаки', price: 20, rank: 2, bonus: { lovk: 2 }, wp: { hit: 2, heat: 3 }, v: { k: 'nunchaku' }, desc: 'Посмотрел Брюса Ли в видеосалоне — и выточил сам.' },
  { id: 'w_bita', slot: 'wpn', name: 'Бейсбольная бита', price: 35, rank: 2, bonus: { sila: 2, lovk: 1 }, wp: { hit: 3, heat: 5 }, v: { k: 'bat' }, desc: 'Привёз моряк из загранки. В Казани в бейсбол не играют.' },
  { id: 'w_nozh', slot: 'wpn', name: 'Нож-выкидуха', price: 30, rank: 3, bonus: { sila: 2, yaz: 1 }, wp: { hit: 3, heat: 10, sovest: -3 }, v: { k: 'knife' }, desc: 'Щелчок — и все замолкают. Достал — значит, готов применить.' },
  { id: 'w_samopal', slot: 'wpn', name: 'Самопал', price: 45, rank: 3, bonus: { sila: 3 }, wp: { hit: 3, heat: 12, sovest: -4 }, v: { k: 'pistol', c: '#4a3a2a' }, desc: 'Трубка, изолента, спички. Может выстрелить. Может — в тебя.' },
  { id: 'w_obrez', slot: 'wpn', name: 'Обрез', price: 140, rank: 4, bonus: { sila: 4 }, wp: { hit: 4, heat: 18, sovest: -6 }, v: { k: 'shotgun' }, desc: 'Дедова двустволка, отпиленная в гараже. Это уже не махач — это статья.' },
  { id: 'w_tt', slot: 'wpn', name: 'Пистолет ТТ', price: 300, rank: 5, bonus: { sila: 5, yaz: 1 }, wp: { hit: 5, heat: 22, sovest: -8 }, v: { k: 'pistol', c: '#1e1e22' }, desc: 'Настоящий ствол. Им не пугают — его достают, только если всё решено.' },
);
const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const SHOP = ITEMS.filter(i => !i.npc && !i.reward);
const DEFAULT_WEAR = { hat: 'h_none', outer: 'o_none', shirt: 's_school', pants: 'p_school', shoes: 'f_kedy', acc: ['a_znachok'], wpn: 'w_none' };
const wornIds = w => [w.hat, w.outer, w.shirt, w.pants, w.shoes, ...w.acc, w.wpn].filter(Boolean);

// --- Рисование -------------------------------------------------------------------------------
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.max(0, Math.min(255, Math.round(c * k)));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(c => f(c).toString(16).padStart(2, '0')).join('');
}

// opt: { emo: 'angry'|'smile'|'scared'|'sad', blink: true, mouth: true (рот открыт — говорит) }
function drawHero(canvas, app, wear, opt = {}) {
  // оброс — причёска теряет форму, пока не подстрижёшься
  if (app.overgrown && app.hair !== 'nol') app = { ...app, hair: app.hair === 'dlinnye' ? 'dlinnye' : 'mallet' };
  const SW = 32, SH = 64, buf = new Array(SW * SH).fill(null);
  const px = (x, y, c) => { if (c && x >= 0 && y >= 0 && x < SW && y < SH) buf[y * SW + x] = c; };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
  const clr = (x, y) => { buf[y * SW + x] = null; };
  const at = (x, y) => buf[y * SW + x];
  const logo = (name, x, y, c) => (LOGO[name] || []).forEach(([a, b]) => px(x + a, y + b, c));
  const V = id => (ITEM[id] || {}).v || { k: 'none' };

  const dy = { tall: 0, normal: 2, short: 4 }[app.height];
  const sw = BUILD[app.build], fat = app.build === 'fat';
  const hy = 5 + dy, ey = hy + 5, sy = hy + 13, wy = sy + 15, ly = wy + 1;
  const cx = 16, tl = cx - sw, tr = cx + sw - 1;
  const skin = SKIN[app.skin], hc = HAIRC[app.hairc];
  const L0 = tl + 1 - (fat ? 1 : 0), R1 = tr - 1 + (fat ? 1 : 0);
  const hat = V(wear.hat), out = V(wear.outer), sh = V(wear.shirt), pa = V(wear.pants), fo = V(wear.shoes);

  // --- длинные волосы рисуем первыми (лежат за спиной)
  if (app.hair === 'dlinnye' || app.hair === 'zavivka') { rect(9, hy + 1, 3, sy - hy + 5, hc); rect(20, hy + 1, 3, sy - hy + 5, hc); }

  // --- штаны
  if (pa.k === 'skirt') {
    rect(L0, ly, R1 - L0 + 1, 57 - ly, pa.t); for (let y = ly; y < 57; y++) px(cx - 1, y, shade(pa.t, 0.8));
    for (let y = wy; y <= ly + 8; y++) { const e = Math.floor((y - wy) / 3); rect(L0 - e, y, R1 - L0 + 1 + e * 2, 1, pa.c); }
  } else {
    const wide = pa.k === 'banan' ? 1 : 0;
    rect(L0, ly, R1 - L0 + 1, 57 - ly, pa.c);
    if (wide) for (let y = ly; y < ly + 8; y++) { px(L0 - 1, y, pa.c); px(R1 + 1, y, pa.c); }
    for (let y = ly + 2; y < 57; y++) { px(cx - 1, y, shade(pa.c, 0.7)); px(R1, y, shade(pa.c, 0.8)); px(cx, y, shade(pa.c, 1.1)); }
    if (pa.k === 'stripes') for (let y = ly; y < 57; y++) {
      px(L0, y, pa.s); px(R1, y, pa.s);
      if (pa.n >= 3) { px(L0 + 2, y, pa.s); px(R1 - 2, y, pa.s); }
    }
    if (pa.k === 'jeans') {
      if (pa.sp) for (let y = ly; y < 57; y++) for (let x = L0; x <= R1; x++) if ((x * 7 + y * 3) % 5 === 0) px(x, y, pa.sp);
      if (pa.seam) for (let y = ly + 1; y < 57; y += 2) { px(L0 + 1, y, pa.seam); px(R1 - 1, y, pa.seam); }
    }
    if (pa.k === 'triko') { const k = ly + Math.floor((57 - ly) / 2); rect(L0 - 1, k, 1, 3, pa.c); rect(R1 + 1, k, 1, 3, pa.c); }
  }

  // --- обувь
  const lw = cx - L0 + 1, rw = R1 - cx + 2;
  const shoe = (c, top = 57) => { rect(L0 - 1, top, lw, 60 - top, c); rect(cx, top, rw, 60 - top, c); };
  const sole = c => { rect(L0 - 1, 59, lw, 1, c); rect(cx, 59, rw, 1, c); };
  switch (fo.k) {
    case 'kedy': shoe(fo.c, 57 - (fo.h || 0)); sole('#eeeeee'); px(L0 - 1, 58, '#eeeeee'); px(R1 + 1, 58, '#eeeeee');
      if (fo.star) { px(L0, 56, W_); px(R1, 56, W_); } break;
    case 'sneaker': shoe(fo.c); rect(L0, 58, 2, 1, fo.s); rect(R1 - 1, 58, 2, 1, fo.s); px(L0 + 1, 57, fo.s); px(R1 - 1, 57, fo.s); sole(fo.sole || '#b8b8b8'); break;
    case 'boot': shoe(fo.c, 57 - fo.h); sole(fo.sole || '#1a100a'); if (fo.h > 4) { px(L0, 57 - fo.h + 1, shade(fo.c, 1.5)); px(R1, 57 - fo.h + 1, shade(fo.c, 1.5)); } break;
    case 'moon': rect(L0 - 2, 53, lw + 1, 7, fo.c); rect(cx, 53, rw + 1, 7, fo.c); rect(L0 - 2, 55, lw + 1, 1, fo.c2); rect(cx, 55, rw + 1, 1, fo.c2); sole('#555555'); break;
    case 'tufli': shoe(fo.c, 58); px(L0, 58, shade(fo.c, 2.5)); px(R1, 58, shade(fo.c, 2.5)); sole(shade(fo.c, 0.6)); break;
    case 'kazaki': shoe(fo.c, 51); sole('#1a100a'); rect(L0, 59, 2, 1, '#3a2010'); rect(R1 - 1, 59, 2, 1, '#3a2010');
      for (let y = 52; y < 58; y += 2) { px(L0, y, shade(fo.c, 1.4)); px(R1, y, shade(fo.c, 1.4)); } px(L0 - 1, 58, shade(fo.c, 1.3)); px(R1 + 1, 58, shade(fo.c, 1.3)); break;
    case 'valenki': shoe(fo.c, 49); for (let y = 49; y < 59; y++) for (let x = L0 - 1; x <= R1 + 1; x++) if (at(x, y) === fo.c && (x * 3 + y * 7) % 5 === 0) px(x, y, shade(fo.c, 1.15)); sole(shade(fo.c, 0.7)); break;
  }

  // --- ремень
  if (pa.k !== 'skirt') { rect(L0, wy, R1 - L0 + 1, 1, '#3b2a1e'); rect(cx - 1, wy, 2, 1, '#c9c9c9'); }

  // --- торс и рукава
  const torso = (c, to = wy - 1, flare = 0) => {
    rect(tl, sy, tr - tl + 1, to - sy + 1, c);
    if (fat) for (let y = wy - 7; y <= Math.min(to, wy + 1); y++) { px(tl - 1, y, c); px(tr + 1, y, c); }
    for (let y = wy; y <= to && flare; y++) { const e = Math.min(2, Math.floor((y - wy) / 3) + 1); rect(tl - e, y, tr - tl + 1 + e * 2, 1, c); }
    clr(tl, sy); clr(tr, sy);
    for (let y = sy + 1; y <= to; y++) px(tr, y, shade(c, 0.85));
  };
  const sleeves = (c, o = {}) => {
    for (const x0 of [tl - 3, tr + 1]) {
      const end = o.short ? sy + 5 : wy + 1;
      rect(x0, sy + 1, 3, wy - sy + 1, o.short ? skin : c);
      rect(x0, sy + 1, 3, end - sy, c);
      for (let y = sy + 2; y <= end; y++) px(x0 === tl - 3 ? x0 + 2 : x0, y, shade(c, 0.8));
      if (o.s) for (let y = sy + 1; y <= end; y++) {
        px(x0 + 1, y, o.s);
        if (o.n >= 2) px(x0 === tl - 3 ? x0 : x0 + 2, y, (o.n >= 3 || y % 2) ? o.s : c);
      }
      if (o.cuff) rect(x0, end, 3, 1, o.cuff);
    }
  };
  const vneck = (n, c) => { for (let k = 0; k < n; k++) for (let x = cx - 3 + Math.floor(k / 2); x <= cx + 2 - Math.floor(k / 2); x++) px(x, sy + k, c); };

  // рубашка / футболка / свитер
  const shirtTop = sh.k === 'vest' ? sh.c2 : sh.c;
  torso(sh.c);
  sleeves(sh.c, { short: sh.k === 'tee' || sh.k === 'hawaii', cuff: sh.k === 'vest' ? '#dfe8f3' : null });
  switch (sh.k) {
    case 'shirt': rect(cx - 3, sy, 2, 2, sh.col); rect(cx + 1, sy, 2, 2, sh.col); for (let y = sy + 3; y < wy; y += 3) px(cx - 1, y, shade(sh.c, 0.75)); break;
    case 'vest': torso(sh.c2); vneck(5, sh.c); rect(cx - 3, sy, 1, 2, '#dfe8f3'); rect(cx + 2, sy, 1, 2, '#dfe8f3'); break;
    case 'tee': rect(cx - 2, sy, 4, 1, shade(sh.c, 0.8)); if (sh.logo) logo(sh.logo, cx - 3, sy + 4, sh.lc); break;
    case 'stripes': for (let y = sy; y <= wy + 1; y += 2) for (let x = tl - 3; x <= tr + 3; x++) if (at(x, y) === sh.c || at(x, y) === shade(sh.c, 0.8) || at(x, y) === shade(sh.c, 0.85)) px(x, y, sh.c2); break;
    case 'sweater':
      for (let x = tl; x <= tr; x++) { px(x, sy + 5, sh.c2); px(x, sy + 8, sh.c2); if (!sh.logo && x % 3 === 0) { px(x, sy + 6, sh.c2); px(x + 1, sy + 7, sh.c2); } }
      if (sh.logo) logo(sh.logo, cx - 3, sy + 1, sh.c2);
      rect(tl, wy - 1, tr - tl + 1, 1, shade(sh.c, 0.7)); break;
    case 'turtle': rect(13, sy - 2, 6, 2, sh.c); break;
    case 'plaid':
      for (let y = sy; y <= wy + 1; y++) for (let x = tl - 3; x <= tr + 3; x++) { const v = at(x, y); if (v === sh.c || v === shade(sh.c, 0.8) || v === shade(sh.c, 0.85)) { if (y % 3 === 0) px(x, y, sh.c2); else if (x % 3 === 0) px(x, y, shade(sh.c2, 1.2)); } }
      rect(cx - 3, sy, 2, 2, sh.c2); rect(cx + 1, sy, 2, 2, sh.c2); break;
    case 'hawaii': for (let y = sy; y < wy; y++) for (let x = tl - 3; x <= tr + 3; x++) if (at(x, y) === sh.c && (x * 3 + y * 5) % 7 === 0) px(x, y, sh.c2); vneck(3, skin); break;
  }

  // верхняя одежда
  if (out.k !== 'none') {
    const len = { parka: wy + 4, leather: wy + 1, blazer: wy + 2, quilt: wy + 2, coat: ly + 9, bomber: wy }[out.k] || wy - 1;
    torso(out.c, len, out.k === 'coat' ? 1 : 0);
    sleeves(out.c, { s: out.s, n: out.n, cuff: out.k === 'bomber' ? out.rib : shade(out.c, 0.7) });
    const inner = sh.k === 'turtle' ? sh.c : shirtTop;
    switch (out.k) {
      case 'zip':
        rect(cx - 3, sy, 6, 1, out.col);
        for (let y = sy + 1; y <= len; y++) px(cx - 1, y, out.col === W_ ? '#d9d9d9' : out.col);
        if (out.logo) logo(out.logo, cx - 6, sy + 3, out.s);
        break;
      case 'parka':
        for (let y = sy; y <= len; y++) { px(cx - 1, y, out.lin); px(cx, y, out.lin); }
        if (out.fur) for (let x = cx - 5; x <= cx + 4; x++) { px(x, sy - 1, x % 2 ? out.fur : shade(out.fur, 0.85)); px(x, sy, x % 2 ? shade(out.fur, 0.85) : shade(out.fur, 1.15)); }
        else for (let y = sy + 3; y <= len; y += 3) for (let x = tl - 3; x <= tr + 3; x++) if (at(x, y) === out.c) px(x, y, shade(out.c, 0.75));
        break;
      case 'leather':
        vneck(6, inner);
        for (let y = sy; y <= len; y++) px(tl + 1, y, out.hl);
        if (out.zipd) for (let k = 0; k < 10; k++) px(cx + 2 - Math.floor(k / 2), sy + 4 + k, '#9a9a9a');
        else for (let y = sy + 6; y <= len; y++) px(cx - 1, y, '#55555c');
        break;
      case 'blazer': vneck(8, inner); px(cx - 1, wy - 3, out.btn || '#2a2622'); px(cx - 1, wy, out.btn || '#2a2622'); break;
      case 'jacket':
        if (out.sp) for (let y = sy; y <= len; y++) for (let x = tl - 3; x <= tr + 3; x++) if (at(x, y) === out.c && (x * 5 + y * 3) % 4 === 0) px(x, y, out.sp);
        vneck(4, inner); for (let y = sy + 4; y <= len; y += 3) px(cx - 2, y, out.btn);
        px(tl + 2, sy + 4, out.btn); px(tr - 2, sy + 4, out.btn);
        break;
      case 'quilt':
        for (let y = sy + 2; y <= len; y += 3) for (let x = tl - 3; x <= tr + 3; x++) if (at(x, y)) px(x, y, out.line || '#2a2c24');
        for (let y = sy + 1; y <= len; y++) px(cx - 1, y, out.line || '#2a2c24');
        break;
      case 'bomber':
        rect(cx - 3, sy, 6, 1, out.rib); rect(tl, len, tr - tl + 1, 1, out.rib);
        for (let y = sy + 1; y < len; y++) px(cx - 1, y, '#9a9a9a'); px(tl - 2, sy + 3, out.lin);
        break;
      case 'coat':
        vneck(6, inner);
        if (out.fur) { rect(cx - 5, sy - 1, 10, 2, out.fur); for (let y = sy + 2; y <= len; y++) px(cx - 1, y, out.fur); }
        else for (let y = sy + 6; y <= len; y++) px(cx - 1, y, '#3a3a3a');
        rect(tl - 3, wy + 1, 3, 1, out.fur || shade(out.c, 0.7)); rect(tr + 1, wy + 1, 3, 1, out.fur || shade(out.c, 0.7));
        if (out.furry) for (let y = sy; y <= len; y++) for (let x = tl - 4; x <= tr + 4; x++) if (at(x, y) === out.c && (x * 5 + y * 3) % 4 === 0) px(x, y, shade(out.c, 1.3));
        break;
    }
  }

  // --- кисти рук
  const handY = wy + 2;
  rect(tl - 3, handY, 3, 2, skin); rect(tr + 1, handY, 3, 2, skin);
  px(tl - 1, handY + 1, shade(skin, 0.85)); px(tr + 3, handY + 1, shade(skin, 0.85));

  // --- шея и голова
  rect(14, hy + 11, 4, sy - hy - 11, shade(skin, 0.85));
  if (sh.k === 'turtle') rect(13, sy - 2, 6, 2, sh.c);
  rect(11, hy, 10, 11, skin);
  [[11, hy], [20, hy], [11, hy + 10], [20, hy + 10], [11, hy + 9], [20, hy + 9]].forEach(([x, y]) => clr(x, y));
  for (let y = hy + 1; y <= hy + 9; y++) px(20, y, shade(skin, 0.88));
  rect(10, ey, 1, 3, shade(skin, 0.9)); rect(21, ey, 1, 3, shade(skin, 0.85));
  // лицо: глаза, брови, нос, рот — с эмоцией
  const emo = opt.emo || 'calm', brow = shade(hc, 0.8), lip = app.lips ? '#b04050' : '#8a4a3a';
  if (opt.blink) { rect(13, ey, 2, 1, shade(skin, 0.7)); rect(17, ey, 2, 1, shade(skin, 0.7)); }
  else {
    px(13, ey, '#ffffff'); px(14, ey, EYEC[app.eyes]); px(17, ey, EYEC[app.eyes]); px(18, ey, '#ffffff');
    if (emo === 'scared') { px(13, ey - 1, '#ffffff'); px(18, ey - 1, '#ffffff'); }
  }
  if (emo === 'angry') { px(13, ey - 2, brow); px(14, ey - 1, brow); px(18, ey - 2, brow); px(17, ey - 1, brow); }
  else if (emo === 'scared' || emo === 'sad') { px(13, ey - 1 - (emo === 'scared'), brow); px(14, ey - 2, brow); px(17, ey - 2, brow); px(18, ey - 1 - (emo === 'scared'), brow); }
  else { rect(13, ey - 1, 2, 1, brow); rect(17, ey - 1, 2, 1, brow); }
  px(15, ey + 2, shade(skin, 0.82)); px(16, ey + 2, shade(skin, 0.75));
  if (opt.mouth) { rect(14, ey + 4, 4, 1, lip); rect(15, ey + 5, 2, 1, '#3a1010'); if (emo !== 'smile') rect(15, ey + 4, 2, 1, '#3a1010'); }
  else if (emo === 'smile') { rect(15, ey + 4, 2, 1, lip); px(14, ey + 3, lip); px(17, ey + 3, lip); }
  else if (emo === 'sad') { rect(15, ey + 3, 2, 1, lip); px(14, ey + 4, lip); px(17, ey + 4, lip); }
  else if (emo === 'scared') { rect(15, ey + 4, 2, 2, '#3a1010'); }
  else if (emo === 'angry') { rect(14, ey + 4, 4, 1, shade(lip, 0.7)); }
  else { rect(14, ey + 4, 4, 1, lip); px(17, ey + 3, shade(skin, 0.9)); }
  switch (app.mark) {
    case 'scar': px(19, ey + 1, '#c77a6a'); px(18, ey + 2, '#c77a6a'); px(19, ey + 3, '#c77a6a'); break;
    case 'fingal': [[12, ey], [12, ey + 1], [13, ey + 1], [14, ey + 1], [13, ey - 1]].forEach(([x, y]) => px(x, y, '#6b4a7a')); break;
    case 'plaster': rect(17, ey + 2, 3, 1, '#e8d2a8'); px(18, ey + 1, '#e8d2a8'); px(18, ey + 3, '#e8d2a8'); break;
    case 'freckles': [[12, ey + 2], [13, ey + 3], [18, ey + 2], [19, ey + 3], [16, ey + 1]].forEach(([x, y]) => px(x, y, shade(skin, 0.78))); break;
    case 'usiki': rect(14, ey + 3, 4, 1, shade(hc, 1.15)); break;
    case 'usy': rect(13, ey + 3, 6, 1, hc); break;
    case 'brov': px(17, ey - 1, skin); px(18, ey - 2, '#c77a6a'); px(17, ey - 2, '#c77a6a'); break;
    case 'zub': px(16, ey + 4, '#f0c040'); break;
    case 'serga': px(21, ey + 3, '#f0c040'); px(21, ey + 4, '#f0c040'); break;
  }

  // --- причёска
  const hl = shade(hc, 1.35), hd = shade(hc, 0.75);
  switch (app.hair) {
    case 'ezhik': rect(11, hy - 1, 10, 2, hc); rect(11, hy + 1, 1, 3, hc); rect(20, hy + 1, 1, 3, hc); for (let x = 12; x < 20; x += 2) px(x, hy - 1, hl); break;
    case 'nol': rect(12, hy, 8, 2, shade(skin, 0.8)); break;
    case 'chelka':
      rect(11, hy - 2, 10, 4, hc); rect(10, hy - 1, 1, 5, hc); rect(21, hy - 1, 1, 4, hc);
      rect(11, hy + 2, 6, 1, hc); rect(11, hy + 3, 3, 1, hc); rect(20, hy + 2, 1, 3, hc);
      for (let x = 13; x < 19; x++) px(x, hy - 2 + (x % 2), hl); px(16, hy + 2, hd); break;
    case 'gorshok': rect(10, hy - 2, 12, 6, hc); rect(10, hy + 4, 2, 3, hc); rect(20, hy + 4, 2, 3, hc); for (let x = 11; x < 21; x++) px(x, hy + 3, hd); for (let x = 12; x < 20; x += 3) px(x, hy - 1, hl); break;
    case 'kudri': case 'zavivka':
      for (let y = hy - 3; y <= hy + 2; y++) for (let x = 10; x <= 21; x++) if (!(y === hy - 3 && (x % 3 === 0))) px(x, y, (x + y) % 3 === 0 ? hl : hc);
      rect(10, hy + 3, 1, 3, hc); rect(21, hy + 3, 1, 3, hc); break;
    case 'mallet': rect(11, hy - 1, 10, 2, hc); rect(10, hy + 1, 1, 11, hc); rect(21, hy + 1, 1, 11, hc); rect(11, hy + 1, 1, 2, hc); rect(20, hy + 1, 1, 2, hc); for (let x = 12; x < 20; x += 2) px(x, hy - 1, hl); break;
    case 'dlinnye': case 'kosa':
      rect(11, hy - 2, 10, 4, hc); rect(10, hy - 1, 2, 9, hc); rect(20, hy - 1, 2, 9, hc); for (let x = 12; x < 20; x += 2) px(x, hy - 2, hl);
      if (app.hair === 'kosa') for (let y = hy + 8; y <= sy + 9; y++) px(21 + (y % 2), y, y % 3 ? hc : hd);
      break;
    case 'probor': rect(11, hy - 2, 10, 4, hc); rect(10, hy, 1, 4, hc); rect(21, hy, 1, 4, hc); rect(15, hy - 2, 1, 3, shade(skin, 0.8));
      rect(16, hy + 2, 5, 1, hc); for (let x = 16; x < 21; x += 2) px(x, hy - 2, hl); break;
    case 'bobrik': rect(11, hy - 3, 10, 3, hc); rect(11, hy, 1, 3, hc); rect(20, hy, 1, 3, hc); for (let x = 11; x < 21; x++) px(x, hy - 3, x % 2 ? hl : hd); break;
    case 'zaliz': rect(11, hy - 2, 10, 3, hc); rect(11, hy + 1, 1, 3, hc); rect(20, hy + 1, 1, 3, hc); for (let x = 11; x < 21; x++) px(x, hy - 2, x % 3 ? hl : hc); break;
  }

  // --- шапка
  switch (hat.k) {
    case 'knit':
      rect(10, hy, 12, 2, hat.c2); rect(11, hy - 2, 10, 2, hat.c); rect(12, hy - 3, 8, 1, hat.s); rect(13, hy - 5, 6, 2, hat.c);
      rect(14, hy - 7, 4, 2, hat.pom); for (let x = 11; x < 21; x += 2) px(x, hy - 1, shade(hat.c, 0.75));
      if (hat.c2 === hat.c) { px(12, hy, hat.s); px(13, hy + 1, hat.s); px(14, hy, hat.s); } break;
    case 'ushanka':
      rect(9, hy - 3, 14, 4, hat.c); rect(9, hy + 1, 2, ey - hy + 3, hat.c); rect(21, hy + 1, 2, ey - hy + 3, hat.c);
      for (let x = 9; x < 23; x += 2) px(x, hy - 3, shade(hat.c, 1.3)); rect(10, hy, 12, 1, shade(hat.c, 1.15)); break;
    case 'cap':
      rect(10, hy - 3, 12, 4, hat.c); clr(10, hy - 3); clr(21, hy - 3); for (let y = hy - 2; y <= hy; y++) px(21, y, shade(hat.c, 0.85));
      rect(9, hy + 1, 14, 1, hat.c2); rect(10, hy + 2, 12, 1, shade(hat.c2, 0.8));
      if (hat.logo) logo(hat.logo, 13, hy - 2, hat.lc); break;
    case 'flat':
      rect(10, hy - 2, 12, 3, hat.c); rect(10, hy + 1, 12, 1, hat.c2); px(13, hy - 2, shade(hat.c, 1.5)); px(14, hy - 2, shade(hat.c, 1.5));
      if (hat.band) rect(10, hy, 12, 1, hat.band); break;
    case 'aerodrom': rect(7, hy - 3, 18, 3, hat.c); clr(7, hy - 3); clr(24, hy - 3); rect(9, hy, 14, 1, shade(hat.c, 0.65)); rect(10, hy + 1, 12, 1, shade(hat.c, 0.45)); for (let x = 9; x < 23; x += 3) px(x, hy - 3, shade(hat.c, 1.4)); break;
    case 'fur': for (let y = hy - 6; y <= hy + 1; y++) for (let x = 9; x <= 22; x++) if (!(y === hy - 6 && (x < 11 || x > 20))) px(x, y, (x * 3 + y) % 4 === 0 ? hat.c2 : hat.c); break;
    case 'bandana':
      rect(10, hy - 2, 12, 4, hat.c); for (let x = 10; x < 22; x++) for (let y = hy - 2; y < hy + 2; y++) if ((x + y) % 3 === 0) px(x, y, hat.c2);
      rect(21, hy + 1, 2, 2, hat.c); px(23, hy + 2, hat.c); break;
    case 'shlyapa':
      rect(7, hy, 18, 2, hat.c); rect(10, hy - 5, 12, 5, hat.c); clr(10, hy - 5); clr(21, hy - 5);
      rect(10, hy - 1, 12, 1, hat.c2); rect(13, hy - 5, 6, 1, shade(hat.c, 0.75)); rect(7, hy + 1, 18, 1, shade(hat.c, 0.7)); break;
    case 'platok':
      rect(10, hy - 2, 12, 5, hat.c); rect(9, hy + 2, 2, ey - hy + 4, hat.c); rect(21, hy + 2, 2, ey - hy + 4, hat.c);
      for (let y = hy - 2; y <= ey + 3; y++) for (let x = 9; x <= 22; x++) if (at(x, y) === hat.c && (x + y) % 3 === 0) px(x, y, hat.c2);
      rect(14, hy + 11, 4, 1, hat.c); break;
  }

  // --- аксессуары
  for (const id of wear.acc) {
    const a = V(id);
    switch (a.k) {
      case 'badge': px(cx - 4, sy + 3, '#c8302a'); px(cx - 3, sy + 3, GOLD); break;
      case 'chain': for (let x = cx - 4; x <= cx + 3; x++) px(x, sy + 1 + (Math.abs(x - cx + 0.5) < 2 ? 1 : 0), x % 2 ? GOLD : '#b8902a'); px(cx - 1, sy + 3, GOLD); px(cx, sy + 3, GOLD); break;
      case 'watch': rect(tl - 3, wy + 1, 3, 1, a.c); px(tl - 2, wy + 1, a.c === '#2a2a2a' ? '#7ac080' : '#222'); break;
      case 'beads': for (let y = handY + 2; y <= handY + 6; y++) px(tr + 2, y, y % 2 ? '#6b3a2a' : '#a0603a'); break;
      case 'cig': px(21, hy + 2, W_); px(22, hy + 2, W_); px(22, hy + 1, '#d0a060'); break;
      case 'glasses': { const f = a.c || '#111'; rect(12, ey, 3, 1, f); rect(17, ey, 3, 1, f); px(15, ey, f); px(16, ey, f); px(13, ey, '#3a4a5a'); px(18, ey, '#3a4a5a'); break; }
      case 'phones': rect(11, hy - 2, 10, 1, '#333'); rect(9, ey - 1, 2, 3, a.c || '#e07a26'); rect(21, ey - 1, 2, 3, a.c || '#e07a26'); break;
      case 'belt': rect(L0, wy, R1 - L0 + 1, 1, '#5a3a1a'); rect(cx - 2, wy - 1, 4, 3, GOLD); px(cx - 1, wy, '#fff3b0'); break;
      case 'scarf': rect(cx - 4, sy - 1, 8, 2, a.c); rect(cx + 1, sy + 1, 2, 6, a.c); for (let y = sy + 1; y < sy + 7; y += 2) px(cx + 1, y, shade(a.c, 1.3)); break;
      case 'ring': px(tr + 3, handY, GOLD); break;
      case 'tatu': break;
      case 'bag': rect(tl - 4, handY + 1, 4, 4, a.c); px(tl - 3, handY + 1, GOLD); break;
      case 'pager': rect(R1 - 1, wy - 1, 3, 3, '#1a1a1a'); px(R1, wy - 1, '#7ac080'); break;
      case 'phone': rect(tr + 2, handY - 4, 3, 6, '#1e1e1e'); px(tr + 3, handY - 3, '#7ac080'); rect(tr + 4, handY - 7, 1, 3, '#333'); break;
      case 'lighter': rect(tl - 2, handY + 1, 2, 2, '#c8c8c8'); px(tl - 2, handY, '#ff9a30'); break;
      case 'thinchain': for (let x = cx - 3; x <= cx + 2; x += 2) px(x, sy + 1 + (Math.abs(x - cx + 0.5) < 2 ? 1 : 0), GOLD); break;
      case 'guitar': rect(tr - 2, wy - 4, 6, 6, '#a0602a'); rect(tr + 1, sy - 2, 1, 10, '#5a3a1a'); px(tr, wy - 2, '#3a2010'); break;
    }
  }

  // --- оружие в правой руке
  { const w = V(wear.wpn), hx = tr + 3, hy2 = handY;
    switch (w.k) {
      case 'stick': rect(hx, hy2 - (w.long ? 17 : 13), 2, w.long ? 20 : 16, w.c); rect(hx, hy2 - (w.long ? 17 : 13), 1, w.long ? 20 : 16, shade(w.c, 1.25)); break;
      case 'bat': rect(hx - 1, hy2 - 16, 3, 10, '#c8a070'); rect(hx, hy2 - 6, 2, 3, '#b89060'); rect(hx, hy2 - 3, 1, 6, '#8a6040'); px(hx - 1, hy2 - 16, '#e8cc98'); px(hx, hy2 - 16, '#e8cc98'); break;
      case 'chain': for (let y = hy2; y < hy2 + 12; y++) { px(hx + (y % 2), y, y % 2 ? '#b8c0c8' : '#6a7078'); px(hx + 1 - (y % 2), y, '#4a5058'); } break;
      case 'sling': rect(hx, hy2 - 3, 1, 4, '#8a5a2a'); px(hx - 1, hy2 - 4, '#8a5a2a'); px(hx + 1, hy2 - 4, '#8a5a2a'); px(hx - 1, hy2 - 5, '#8a5a2a'); px(hx + 1, hy2 - 5, '#8a5a2a'); break;
      case 'kastet': rect(hx - 1, hy2 - 1, 4, 2, w.c); px(hx - 1, hy2 - 2, shade(w.c, 1.3)); px(hx + 1, hy2 - 2, shade(w.c, 1.3)); px(hx + 3, hy2 - 2, shade(w.c, 1.3)); break;
      case 'knife': rect(hx, hy2 - 1, 2, 3, '#2a2a2a'); rect(hx, hy2 - 7, 1, 6, '#d8dde2'); rect(hx + 1, hy2 - 6, 1, 5, '#a8b0b8'); px(hx, hy2 - 8, '#ffffff'); break;
      case 'nunchaku': rect(hx, hy2 - 7, 2, 8, '#2a1a10'); px(hx + 2, hy2 + 1, '#9a9a9a'); px(hx + 3, hy2 + 2, '#9a9a9a'); rect(hx + 3, hy2 + 3, 2, 7, '#2a1a10'); break;
      case 'pistol': rect(hx - 1, hy2 - 1, 6, 2, w.c); rect(hx - 1, hy2 + 1, 2, 3, shade(w.c, 0.8)); px(hx + 4, hy2 - 1, shade(w.c, 1.8)); px(hx, hy2 - 1, shade(w.c, 1.5)); break;
      case 'shotgun': rect(hx - 1, hy2 - 2, 9, 2, '#2a2a2e'); px(hx + 7, hy2 - 2, '#6a6a70'); rect(hx - 4, hy2 - 2, 4, 4, '#6a4a2a'); rect(hx - 4, hy2 + 1, 2, 2, '#4a3220'); break;
    }
  }

  if (app.mark === 'tatu') { px(tl - 3, handY, '#3a4a8a'); px(tl - 2, handY + 1, '#3a4a8a'); }

  // --- контур и тень
  // Цветной контур (тёмный оттенок соседней детали) + блик по левому краю — объём, как в хорошем пиксель-арте
  const res = buf.slice();
  const solid = c => c && c[0] === '#';
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const c = buf[y * SW + x];
    if (c) { if (solid(c) && x > 0 && !buf[y * SW + x - 1]) res[y * SW + x] = shade(c, 1.18); continue; }
    let nb = null;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + a, Y = y + b; if (X >= 0 && Y >= 0 && X < SW && Y < SH && solid(buf[Y * SW + X])) { nb = buf[Y * SW + X]; break; } }
    if (nb) res[y * SW + x] = shade(nb, 0.28);
  }
  for (let x = 8; x <= 23; x++) for (const y of [61, 62]) if (!res[y * SW + x] && (y === 61 || (x > 9 && x < 22))) res[y * SW + x] = 'rgba(0,0,0,0.3)';

  canvas.width = SW; canvas.height = SH;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, SW, SH);
  res.forEach((c, i) => { if (c) { g.fillStyle = c; g.fillRect(i % SW, Math.floor(i / SW), 1, 1); } });
}

// --- Персонажи (NPC) ---------------------------------------------------------------------------
const NPCS = {
  mama:    { name: 'Мама', app: { build: 'normal', height: 'normal', skin: 's1', hair: 'zavivka', hairc: 'dark', eyes: 'brown', mark: 'none', lips: true },
             wear: { hat: 'h_none', outer: 'o_halat', shirt: 's_kofta', pants: 'p_yubka', shoes: 'f_tapki', acc: [] } },
  ildar:   { name: 'Ильдар', app: { build: 'thin', height: 'short', skin: 's2', hair: 'chelka', hairc: 'black', eyes: 'brown', mark: 'none' },
             wear: { hat: 'h_none', outer: 'o_alyaska', shirt: 's_school', pants: 'p_sport', shoes: 'f_kedy', acc: [] } },
  bacha:   { name: 'Бача', app: { build: 'strong', height: 'tall', skin: 's2', hair: 'ezhik', hairc: 'dark', eyes: 'grey', mark: 'scar' },
             wear: { hat: 'h_none', outer: 'o_afganka', shirt: 's_telnyashka', pants: 'p_sport', shoes: 'f_sapogi', acc: ['a_gitara'] } },
  natasha: { name: 'Наташа', app: { build: 'thin', height: 'normal', skin: 's1', hair: 'kosa', hairc: 'rus', eyes: 'green', mark: 'none', lips: true },
             wear: { hat: 'h_none', outer: 'o_none', shirt: 's_platye', pants: 'p_yubka', shoes: 'f_tufli', acc: [] } },
  garipov: { name: 'Капитан Гарипов', app: { build: 'fat', height: 'normal', skin: 's2', hair: 'zaliz', hairc: 'black', eyes: 'brown', mark: 'usy' },
             wear: { hat: 'h_militsia', outer: 'o_militsia', shirt: 's_school', pants: 'p_militsia', shoes: 'f_tufli', acc: [] } },
  zima:    { name: 'Зима', app: { build: 'fat', height: 'tall', skin: 's1', hair: 'nol', hairc: 'blond', eyes: 'blue', mark: 'none' },
             wear: { hat: 'h_none', outer: 'o_kozhanka', shirt: 's_maika', pants: 'p_adibas', shoes: 'f_martin', acc: [] } },
  sedoy:   { name: 'Седой', app: { build: 'strong', height: 'normal', skin: 's1', hair: 'zaliz', hairc: 'grey', eyes: 'grey', mark: 'scar' },
             wear: { hat: 'h_aerodrom', outer: 'o_dublenka', shirt: 's_vodolazka', pants: 'p_school', shoes: 'f_salamandr', acc: ['a_chetki'] } },
  chuzhoy: { name: 'Чужой', app: { build: 'strong', height: 'normal', skin: 's1', hair: 'mallet', hairc: 'rus', eyes: 'grey', mark: 'fingal' },
             wear: { hat: 'h_adibas', outer: 'o_telogreika', shirt: 's_maika', pants: 'p_sport', shoes: 'f_kedy', acc: ['a_sigareta'] } },
  starsh:  { name: 'Старший', app: { build: 'strong', height: 'tall', skin: 's2', hair: 'ezhik', hairc: 'black', eyes: 'brown', mark: 'none' },
             wear: { hat: 'h_kozha', outer: 'o_kozhanka', shirt: 's_vodolazka', pants: 'p_varenki', shoes: 'f_adibas', acc: ['a_cep'] } },
  muzhik:  { name: 'Мужик', app: { build: 'fat', height: 'normal', skin: 's3', hair: 'gorshok', hairc: 'rus', eyes: 'grey', mark: 'usy' },
             wear: { hat: 'h_ushanka', outer: 'o_telogreika', shirt: 's_telnyashka', pants: 'p_triko', shoes: 'f_botinki', acc: [] } },
  zavuch:  { name: 'Завуч', app: { build: 'fat', height: 'short', skin: 's1', hair: 'zavivka', hairc: 'blond', eyes: 'grey', mark: 'none', lips: true },
             wear: { hat: 'h_none', outer: 'o_pidzhak', shirt: 's_school', pants: 'p_yubka', shoes: 'f_tufli', acc: ['a_ochki'] } },
  militsioner: { name: 'Сержант', app: { build: 'normal', height: 'tall', skin: 's1', hair: 'ezhik', hairc: 'rus', eyes: 'blue', mark: 'none' },
             wear: { hat: 'h_militsia', outer: 'o_militsia', shirt: 's_school', pants: 'p_militsia', shoes: 'f_sapogi', acc: [] } },
  babka:   { name: 'Бабушка', app: { build: 'fat', height: 'short', skin: 's1', hair: 'zavivka', hairc: 'grey', eyes: 'grey', mark: 'none' },
             wear: { hat: 'h_platok', outer: 'o_halat', shirt: 's_kofta', pants: 'p_yubka', shoes: 'f_botinki', acc: [] } },
};
