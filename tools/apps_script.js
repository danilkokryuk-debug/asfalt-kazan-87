// «Асфальт»: сервер игроков на Google Таблицах (Apps Script, привязан к таблице «Асфальт — игроки»).
// Лист «Игроки» — ник, когда заходил, прогресс. Лист «Пожелания» — пожелания игроков (видны всем в игре).
// Скрытый код игрока хранится только как хэш (SHA-256) — по таблице его не восстановить.
// Публикация: Развернуть → Новое развёртывание → Веб-приложение, «Выполнять от моего имени», доступ «Все».
const NICK_RE = /^[A-Za-zА-Яа-яЁё0-9_.-]{3,16}$/;
const SS = () => SpreadsheetApp.openById('15-OQw0166iTl2CTkJ1lPQeLkfmQpgMItT4LXIA1smfA');   // таблица «Асфальт — игроки»
function sheet(name, head) {
  let s = SS().getSheetByName(name);
  if (!s) { s = SS().insertSheet(name); s.appendRow(head); s.setFrozenRows(1); s.getRange(1, 1, 1, head.length).setFontWeight('bold'); }
  return s;
}
const PL = () => sheet('Игроки', ['Ник', 'Создан', 'Последний вход', 'Версия', 'Город', 'Дата в игре', 'Ранг', 'Казань пройдена', 'Москва пройдена', 'Концовок', 'Код (хэш)']);
const WS = () => sheet('Пожелания', ['Когда', 'Ник', 'Пожелание', 'Код (хэш)']);
const hash = s => Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'asfalt:' + s, Utilities.Charset.UTF_8));
const safe = s => /^[=+\-@]/.test(s) ? "'" + s : s;   // текст игрока не должен стать формулой
const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
function rowOf(sh, col, val, ci) {
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) { const x = String(v[i][col]); if (ci ? x.toLowerCase() === String(val).toLowerCase() : x === val) return { row: i + 1, data: v[i] }; }
  return null;
}

function setup() { PL(); WS(); const l = SS().getSheetByName('Лист1'); if (l && SS().getSheets().length > 2) SS().deleteSheet(l); }

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.a === 'wishes') return out(WS().getDataRange().getValues().slice(1).reverse().slice(0, 60).map(r => ({ created_at: r[0], nick: r[1], text: r[2] })));
  if (p.a === 'free') return out(NICK_RE.test(p.nick || '') && !rowOf(PL(), 0, p.nick, true));
  return out({ ok: 1 });
}

function doPost(e) {
  let b = {}; try { b = JSON.parse(e.postData.contents || '{}'); } catch (x) { return out('bad'); }
  const secret = String(b.secret || '');
  if (secret.length < 20) return out('bad');
  const h = hash(secret), lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const pl = PL(), me = rowOf(pl, 10, h);
    if (b.a === 'claim') {
      if (me) { pl.getRange(me.row, 3).setValue(new Date()); return out('ok:' + me.data[0]); }   // игрок уже есть — ник не меняется
      const nick = String(b.nick || '');
      if (!NICK_RE.test(nick)) return out('bad');
      if (rowOf(pl, 0, nick, true)) return out('taken');
      pl.appendRow([safe(nick), new Date(), new Date(), '', '', '', '', '', '', '', h]);
      return out('ok:' + nick);
    }
    if (b.a === 'progress') {
      if (!me) return out(false);
      const g = b.p || {};
      pl.getRange(me.row, 3, 1, 8).setValues([[new Date(), String(g.v || ''), String(g.city || ''), String(g.date || ''), Number(g.rank) || 0, g.kazan ? 'да' : '', g.moscow ? 'да' : '', Number(g.ends) || 0]]);
      return out(true);
    }
    if (b.a === 'wish') {
      if (!me) return out('noacc');
      const t = String(b.text || '').trim();
      if (t.length < 3 || t.length > 300) return out('bad');
      const day = Date.now() - 864e5, ws = WS();
      const n = ws.getDataRange().getValues().slice(1).filter(r => r[3] === h && new Date(r[0]).getTime() > day).length;
      if (n >= 3) return out('limit');
      ws.appendRow([new Date(), me.data[0], safe(t), h]);
      return out('ok');
    }
    return out('bad');
  } finally { lock.releaseLock(); }
}
