// Редактор списка задач: пункты с галочкой и одним уровнем вложенности; слева сразу видно готовую страницу.
// В пункте — мини-markdown: `код`, **жирный**, *курсив*. Гофер — авто (место и поза по списку), нет или своя поза.
// Клавиши в пункте: Enter — новый пункт, Tab / Shift+Tab — вложить / вынести, Backspace в пустом — удалить,
// ↑ ↓ — соседний пункт, Alt+↑ ↓ — переставить, Ctrl+Enter — отметить.
import { h, clear } from './dom.js';
import { POSES } from './gopher.js';
import { FORMATS, STYLES, STYLE_KEYS, drawTasks, rngFrom } from './recap-draw.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

export function openTasksEditor({ card, format, acc, seed }) {
  return new Promise((resolve) => {
    const rng = rngFrom(seed || Date.now());
    const c = card ? clone(card) : {
      kind: 'tasks', bg: STYLE_KEYS[Math.floor(rng() * STYLE_KEYS.length)], title: 'Планы на неделю', gopher: 'auto', flip: false,
      tasks: [{ text: 'Дочитать про **горутины**', done: true, lvl: 0 }, { text: 'Разобрать `select` и `context`', done: false, lvl: 0 },
        { text: 'написать *маленький* пример', done: false, lvl: 1 }, { text: 'Повторить вопросы банка', done: false, lvl: 0 }],
    };
    if (!c.tasks.length) c.tasks.push({ text: '', done: false, lvl: 0 });
    const [W, H] = FORMATS[format];
    const cv = h('canvas', { class: 'as-editor__canvas', width: W, height: H, 'aria-label': 'Как будет выглядеть страница' });
    const g = cv.getContext('2d');
    const side = h('div', { class: 'as-editor__side' });
    const root = h('div', { class: 'as-editor as-editor--tasks', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Список задач' },
      h('div', { class: 'as-editor__stage' }, cv), side);
    const scrim = h('div', { class: 'as-scrim as-editor__scrim' }, root);
    (document.querySelector('.as-window') || document.body).append(scrim);

    let pending = false;
    const redraw = () => {
      if (pending) return; pending = true;
      requestAnimationFrame(async () => {
        pending = false;
        const off = document.createElement('canvas'); off.width = W; off.height = H;
        await drawTasks(off.getContext('2d'), W, H, c, acc);
        g.clearRect(0, 0, W, H); g.drawImage(off, 0, 0);
      });
    };
    const norm = () => { if (c.tasks[0]) c.tasks[0].lvl = 0; }; // первый пункт не бывает вложенным

    // ---------- пункты ----------
    const list = h('div', { class: 'as-tasks' });
    const inputs = [];
    const focusRow = (i, atEnd = true) => requestAnimationFrame(() => { const el = inputs[i]; if (!el) return; el.focus(); if (atEnd) el.setSelectionRange(el.value.length, el.value.length); });
    const insert = (i, lvl) => { c.tasks.splice(i, 0, { text: '', done: false, lvl }); norm(); rows(); focusRow(i); redraw(); };
    const remove = (i) => { c.tasks.splice(i, 1); if (!c.tasks.length) c.tasks.push({ text: '', done: false, lvl: 0 }); norm(); rows(); focusRow(Math.max(0, i - 1)); redraw(); };
    const move = (i, j) => { if (j < 0 || j >= c.tasks.length) return; const [x] = c.tasks.splice(i, 1); c.tasks.splice(j, 0, x); norm(); rows(); focusRow(j); redraw(); };
    const setLvl = (i, lvl) => { if (i === 0) lvl = 0; c.tasks[i].lvl = lvl; rows(); focusRow(i, false); redraw(); };
    function rows() {
      clear(list); inputs.length = 0;
      c.tasks.forEach((t, i) => {
        const cb = h('input', { type: 'checkbox', class: 'as-tasks__cb', checked: !!t.done, 'aria-label': 'Готово' });
        cb.addEventListener('change', () => { t.done = cb.checked; row.classList.toggle('is-done', t.done); redraw(); });
        const inp = h('input', { class: 'as-input as-tasks__text', value: t.text, placeholder: t.lvl ? 'Подпункт' : 'Задача', 'aria-label': 'Текст пункта' });
        inp.addEventListener('input', () => { t.text = inp.value; redraw(); });
        inp.dataset.i = String(i);
        inputs.push(inp);
        const ib = (txt, title, on, dis) => h('button', { class: 'as-iconbtn as-tasks__btn', title, 'aria-label': title, disabled: !!dis, onclick: on }, txt);
        const row = h('div', { class: 'as-tasks__row' + (t.lvl ? ' is-sub' : '') + (t.done ? ' is-done' : '') }, cb, inp,
          t.lvl ? ib('⇤', 'Вынести (Shift+Tab)', () => setLvl(i, 0)) : ib('⇥', 'Вложить (Tab)', () => setLvl(i, 1), i === 0),
          ib('↑', 'Выше (Alt+↑)', () => move(i, i - 1), i === 0),
          ib('↓', 'Ниже (Alt+↓)', () => move(i, i + 1), i === c.tasks.length - 1),
          ib('✕', 'Удалить', () => remove(i)));
        list.append(row);
      });
    }
    // клавиши пункта (вызываются из общего обработчика: он гасит горячие клавиши приложения)
    function rowKey(e, i) {
      const t = c.tasks[i], inp = inputs[i];
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); t.done = !t.done; rows(); focusRow(i); redraw(); return; }
      if (e.key === 'Enter') { e.preventDefault(); insert(i + 1, t.lvl); return; }
      if (e.key === 'Tab') { e.preventDefault(); setLvl(i, e.shiftKey ? 0 : 1); return; }
      if (e.key === 'Backspace' && !inp.value && c.tasks.length > 1) { e.preventDefault(); remove(i); return; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); const j = i + (e.key === 'ArrowUp' ? -1 : 1);
        if (e.altKey) move(i, j); else focusRow(j);
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); done(null); return; }
      if (e.target.classList && e.target.classList.contains('as-tasks__text')) rowKey(e, +e.target.dataset.i);
      e.stopImmediatePropagation(); // горячие клавиши приложения под редактором не срабатывают
    };
    window.addEventListener('keydown', onKey, true);
    function done(v) { window.removeEventListener('keydown', onKey, true); scrim.remove(); resolve(v); }

    // ---------- панель ----------
    const field = (label, ctl) => h('label', { class: 'as-editor__field' }, h('span', null, label), ctl);
    const title = h('input', { class: 'as-input', value: c.title || '', placeholder: 'Без заголовка' });
    title.addEventListener('input', () => { c.title = title.value; redraw(); });
    const gs = h('select', { class: 'as-input' },
      h('option', { value: 'auto', selected: c.gopher === 'auto' }, 'Авто'), h('option', { value: 'none', selected: c.gopher === 'none' }, 'Без гофера'),
      Object.entries(POSES).map(([k, p]) => h('option', { value: k, selected: c.gopher === k }, p.label)));
    gs.addEventListener('change', () => { c.gopher = gs.value; redraw(); });
    const fl = h('input', { type: 'checkbox', checked: !!c.flip }); fl.addEventListener('change', () => { c.flip = fl.checked; redraw(); });
    const bgs = h('div', { class: 'as-editor__bgs' });
    const drawBgs = () => { clear(bgs); STYLE_KEYS.forEach((k) => bgs.append(h('button', { class: 'as-editor__bg is-' + k + (c.bg === k ? ' is-on' : ''), title: STYLES[k].label, onclick: () => { c.bg = k; drawBgs(); redraw(); } }, STYLES[k].label))); };
    drawBgs(); rows();
    side.append(
      h('div', { class: 'as-editor__sec' }, h('div', { class: 'as-eyebrow' }, 'Заголовок'), title),
      h('div', { class: 'as-editor__sec' }, h('div', { class: 'as-eyebrow' }, 'Задачи'), list,
        h('button', { class: 'as-btn as-btn--secondary as-btn--sm as-tasks__add', onclick: () => insert(c.tasks.length, 0) }, '＋ Пункт'),
        h('div', { class: 'caption as-subtle' }, 'Enter — новый пункт, Tab — вложить, Shift+Tab — вынести, Alt+↑↓ — переставить, Ctrl+Enter — отметить. В тексте: `код`, **жирный**, *курсив*.')),
      h('div', { class: 'as-editor__sec' }, h('div', { class: 'as-eyebrow' }, 'Гофер'), field('Поза', gs), field('Зеркально', fl)),
      h('div', { class: 'as-editor__sec' }, h('div', { class: 'as-eyebrow' }, 'Фон'), bgs),
      h('div', { class: 'as-editor__actions' },
        h('button', { class: 'as-btn as-btn--ghost', onclick: () => done(null) }, 'Отмена'),
        h('button', { class: 'as-btn as-btn--primary', onclick: () => { c.tasks = c.tasks.filter((t) => t.text.trim()); norm(); done(c.tasks.length || (c.title || '').trim() ? c : null); } }, 'Готово')));
    redraw(); focusRow(c.tasks.length - 1);
  });
}
