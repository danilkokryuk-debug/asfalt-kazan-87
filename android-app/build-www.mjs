// Собирает www/ для Android-приложения из той же игры, что на сайте (корень проекта).
// Отличия от сайта: нет сервис-воркера (файлы и так внутри приложения), флаг window.ASF_APP.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const ROOT = '..', OUT = 'www';
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT);
for (const d of ['css', 'js', 'img', 'icons', 'vid']) cpSync(`${ROOT}/${d}`, `${OUT}/${d}`, { recursive: true });
for (const f of ['manifest.webmanifest', 'privacy.html']) if (existsSync(`${ROOT}/${f}`)) cpSync(`${ROOT}/${f}`, `${OUT}/${f}`);
let html = readFileSync(`${ROOT}/index.html`, 'utf8');
const SW = "if ('serviceWorker' in navigator && location.protocol !== 'file:') {";
if (!html.includes(SW)) throw new Error('index.html: не найдена регистрация сервис-воркера');
html = html.replace(SW, "if (false) {   // в приложении сервис-воркер не нужен")
  .replace('<link rel="manifest" href="manifest.webmanifest">', '<link rel="manifest" href="manifest.webmanifest">\n<script>window.ASF_APP = true;</script>');
writeFileSync(`${OUT}/index.html`, html);
console.log('www готов');
