// Проверка: все файлы из списка офлайн-кэша (sw.js) существуют — иначе новая версия не установится на телефоне.
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const self = { addEventListener() {} }, location = {};
eval(fs.readFileSync(path.join(root, 'sw.js'), 'utf8').replace(/^const /gm, 'var '));
const miss = FILES.filter(f => f !== './' && !fs.existsSync(path.join(root, f)));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), js = [...html.matchAll(/src="(js\/[^"]+)"/g)].map(m => m[1]).filter(f => !FILES.includes(f));
if (miss.length || js.length) { console.log('НЕТ ФАЙЛОВ:', miss, 'НЕ В КЭШЕ:', js); process.exit(1); }
console.log('files OK', FILES.length);
