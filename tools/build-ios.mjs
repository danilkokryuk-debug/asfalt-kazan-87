// iOS-версия без Москвы: ios/index.html — та же игра (файлы берутся из корня через <base>), но города «Москва» нет.
// Открывается на iPhone по адресу …/asfalt-kazan-87/ios/ → Safari → «Поделиться» → «На экран Домой».
// node tools/build-ios.mjs (запускать после изменений index.html). Основную версию не меняет.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('ios', { recursive: true });
let html = readFileSync('index.html', 'utf8');
const head = '<meta charset="utf-8">';
html = html.replace(head, `${head}\n<base href="../">`)   // все пути игры — от корня сайта
  .replace('<link rel="manifest" href="manifest.webmanifest">', '<link rel="manifest" href="ios/manifest.webmanifest">')
  .replace('<title>Асфальт. Казань-87</title>', '<title>Асфальт. Казань-87 · iOS</title>');
// перед запуском игры: убрать Москву; Киев — «откроется после Казани, в разработке»
const NO_MSK = `<script>
  if (typeof CITY !== 'undefined' && CITY !== 'kazan') location.replace('ios/');   // в этой версии только Казань
  if (typeof CITIES !== 'undefined') { for (let i = CITIES.length - 1; i >= 0; i--) if (CITIES[i].id === 'moscow') CITIES.splice(i, 1);
    const kv = CITIES.find(c => c.id === 'kiev'); if (kv) Object.assign(kv, { need: 'kazanDone', needName: 'кампании Казани', desc: 'Следующий город. Откроется после прохождения Казани. Пока в разработке.' }); }
  window.ASF_IOS_LITE = true;
</script>
`;
const BOOT = html.lastIndexOf('<script>');
if (BOOT < 0) throw new Error('index.html: не найден скрипт запуска');
html = html.slice(0, BOOT) + NO_MSK + html.slice(BOOT);
writeFileSync('ios/index.html', html);
writeFileSync('ios/manifest.webmanifest', JSON.stringify({
  id: './', name: 'Асфальт. Казань-87', short_name: 'Асфальт', lang: 'ru', start_url: './', scope: './',
  display: 'standalone', orientation: 'portrait', background_color: '#1b1814', theme_color: '#1b1814',
  icons: [{ src: '../icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '../icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 2));
console.log('готово: ios/index.html');
