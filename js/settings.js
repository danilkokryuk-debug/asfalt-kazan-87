// Настройки игрока: хранятся отдельно от сохранений и действуют во всех режимах.
const SET_DEF = { tspeed: 'normal', speed: 'normal', vol: 0.8, music: 0.5, font: 'normal', skipMini: false, theme: 'classic', tutorial: true };
const SET = (() => { try { return { ...SET_DEF, ...JSON.parse(localStorage.getItem('asfalt_settings') || '{}') }; } catch (e) { return { ...SET_DEF }; } })();
const SPEED = { slow: 1.7, normal: 1, fast: 0.4, instant: 0 };
const THEMES = { classic: 'Классика', vhs: 'Видеокассета', gazeta: 'Газета', tetrad: 'Тетрадь в клетку' };

function saveSet() { try { localStorage.setItem('asfalt_settings', JSON.stringify(SET)); } catch (e) {} applySet(); }
function applySet() {
  if (typeof document === 'undefined' || !document.documentElement || !document.documentElement.setAttribute) return;
  document.documentElement.setAttribute('data-theme', SET.theme);
  document.documentElement.setAttribute('data-font', SET.font);
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta && meta.setAttribute) meta.setAttribute('content', { classic: '#1b1814', vhs: '#120a1f', gazeta: '#ece4d0', tetrad: '#f6f8ff' }[SET.theme]);
  if (typeof AUDIO !== 'undefined' && AUDIO.setVolume) AUDIO.setVolume(SET.vol, SET.music);
}

function settingsScreen(back) {
  const seg = (key, opts) => `<div class="seg">${Object.entries(opts).map(([v, t]) =>
    `<button data-k="${key}" data-v="${v}" class="${String(SET[key]) === v ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  const slider = (key, label) => `<label>${label}: <b id="v_${key}">${Math.round(SET[key] * 100)}%</b></label>
    <input type="range" min="0" max="1" step="0.05" value="${SET[key]}" data-r="${key}">`;
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  $('#main').innerHTML = `<div class="scene in"><h2>Настройки</h2>
    <label>Тема оформления</label>${seg('theme', THEMES)}
    <label>Скорость времени (пауза — кнопка ❚❚ вверху)</label>${seg('tspeed', { slow: 'Медленно', normal: 'Обычно', fast: 'Быстро' })}
    <label>Скорость текста</label>${seg('speed', { slow: 'Медленно', normal: 'Обычно', fast: 'Быстро', instant: 'Сразу' })}
    <label>Размер шрифта</label>${seg('font', { normal: 'Обычный', large: 'Крупный' })}
    ${slider('vol', 'Громкость')}${slider('music', 'Музыка')}
    <label>Мини-игры</label>${seg('skipMini', { false: 'Играть', true: 'Пропускать (бросок)' })}
    <label>Подсказки для новичка</label>${seg('tutorial', { true: 'Показывать', false: 'Выключить' })}
    <div class="choices"><button class="btn" id="tr">Сбросить обучение (показать заново)</button>
    <button class="btn main" id="bk">Готово</button></div>
    <p class="note">Настройки общие для всех сохранений.</p>
    <p class="note" id="scrinfo"></p></div>`;
  // строка для диагностики экрана iPhone (полосы сверху/снизу)
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);visibility:hidden';
  document.body.appendChild(probe); const ps = getComputedStyle(probe);
  $('#scrinfo').textContent = `Экран ${screen.width}×${screen.height} · окно ${innerWidth}×${innerHeight} · игра ${Math.round(document.body.getBoundingClientRect().height)} · `
    + `вырез ${parseInt(ps.paddingTop)}/${parseInt(ps.paddingBottom)} · ${matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 'приложение' : 'браузер'} · ${navigator.standalone ? 'st' : '-'} · v1.2.0`;
  probe.remove();
  document.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
    const v = b.dataset.v; SET[b.dataset.k] = v === 'true' ? true : v === 'false' ? false : v;
    AUDIO.click(); saveSet(); settingsScreen(back);
  });
  document.querySelectorAll('[data-r]').forEach(r => r.oninput = () => {
    SET[r.dataset.r] = +r.value; $('#v_' + r.dataset.r).textContent = Math.round(r.value * 100) + '%'; saveSet();
  });
  $('#tr').onclick = () => { try { localStorage.removeItem('asfalt_tut'); } catch (e) {} SET.tutorial = true; saveSet(); toast('Подсказки покажутся снова'); };
  $('#bk').onclick = () => { AUDIO.click(); (back || titleScreen)(); };
}
applySet();
