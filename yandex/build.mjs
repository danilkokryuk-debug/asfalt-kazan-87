// Сборка для Яндекс Игр: yandex/asfalt-yandex.zip — загрузить в консоль разработчика Яндекс Игр (Черновик → Архив с игрой).
// node yandex/build.mjs
// Отличия от сайта: подключён SDK Яндекса (/sdk.js), нет сервис-воркера, нет файлов для Android и Play.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const ROOT = '.', OUT = 'yandex/www';
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
for (const d of ['css', 'js', 'img', 'icons', 'vid']) cpSync(`${ROOT}/${d}`, `${OUT}/${d}`, { recursive: true });
cpSync(`${ROOT}/privacy.html`, `${OUT}/privacy.html`);
let html = readFileSync(`${ROOT}/index.html`, 'utf8');
const SW = "if ('serviceWorker' in navigator && location.protocol !== 'file:') {";
if (!html.includes(SW)) throw new Error('index.html: не найдена регистрация сервис-воркера');
html = html.replace(SW, "if (false) {   // на Яндекс Играх сервис-воркер не нужен")
  .replace('<link rel="manifest" href="manifest.webmanifest">', '<script src="/sdk.js"></script>');
writeFileSync(`${OUT}/index.html`, html);
rmSync('yandex/asfalt-yandex.zip', { force: true });
execFileSync('python', ['-c', `import shutil; shutil.make_archive('yandex/asfalt-yandex', 'zip', '${OUT}')`], { stdio: 'inherit' });
console.log('готово: yandex/asfalt-yandex.zip');
