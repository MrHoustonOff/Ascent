// Комментарии: все комментарии к урокам и темам на одной странице — чтобы к ним вернуться.
// Лента по датам («Раньше» — перенесённые старые заметки) или по плану: этап → тема.
// Фильтры: поиск, «все / открытые / сделано», «темы / уроки», сортировка. Выбор фильтров запоминается.
import { api } from '../api.js';
import { h, clear, pluralRu } from '../ui/dom.js';
import { lsGet, lsSet } from '../state.js';
import { openId } from '../actions.js';
import { commentRow } from '../ui/comments.js';

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const dayTitle = (c) => { if (!c.created) return 'Раньше'; const [y, m, d] = c.created.split('-').map(Number); return `${d} ${MONTHS[m - 1]}` + (y !== new Date().getFullYear() ? ` ${y}` : ''); };

export async function render(root) {
  const f = { q: '', status: 'all', kind: 'all', sort: 'new', ...lsGet('comments.filter', {}) };
  f.q = '';
  let all = await api.Comments();
  const save = () => lsSet('comments.filter', { status: f.status, kind: f.kind, sort: f.sort });
  const sub = h('p', { class: 'as-lead' });
  const list = h('div', { class: 'as-cmpage__list' });
  const input = h('input', { class: 'as-input', type: 'search', placeholder: 'Поиск по комментариям и темам', 'aria-label': 'Поиск по комментариям', style: { width: '260px' } });
  input.addEventListener('input', () => { f.q = input.value.trim().toLowerCase(); paint(); });
  const chips = h('div', { class: 'as-cmpage__bar' });

  const seg = (items, cur, on) => h('div', { class: 'as-seg', role: 'tablist' }, items.map(([k, l]) => h('button', { class: 'as-seg__tab' + (k === cur ? ' is-on' : ''), role: 'tab', 'aria-selected': String(k === cur), onclick: () => { on(k); save(); paint(); } }, l)));
  const drawBar = () => {
    clear(chips);
    const n = (pred) => all.filter(pred).length;
    chips.append(input,
      seg([['all', `Все · ${all.length}`], ['open', `Открытые · ${n((c) => !c.done)}`], ['done', `Сделано · ${n((c) => c.done)}`]], f.status, (k) => { f.status = k; }),
      seg([['all', 'Всё'], ['theme', 'Темы'], ['lesson', 'Уроки']], f.kind, (k) => { f.kind = k; }),
      h('span', { class: 'as-cmpage__grow' }),
      seg([['new', 'Новые сверху'], ['old', 'Старые сверху'], ['plan', 'По плану']], f.sort, (k) => { f.sort = k; }));
  };
  const meta = (c) => h('div', { class: 'as-cm__meta' },
    h('a', { title: 'Открыть в плане', onclick: () => openId(c.target) }, c.target),
    h('span', null, c.title),
    c.kind === 'lesson' && c.theme ? h('span', null, '· ' + c.theme) : c.block ? h('span', null, '· ' + c.block) : null);
  const onChange = async () => { all = await api.Comments(); paint(); };

  function paint() {
    drawBar();
    clear(list);
    let xs = all.filter((c) => (f.status === 'all' || (f.status === 'done') === c.done) && (f.kind === 'all' || c.kind === f.kind)
      && (!f.q || (c.text + ' ' + c.target + ' ' + c.title + ' ' + c.theme).toLowerCase().includes(f.q)));
    const open = all.filter((c) => !c.done).length, targets = new Set(all.map((c) => c.target)).size;
    sub.textContent = all.length
      ? `${all.length} ${pluralRu(all.length, 'комментарий', 'комментария', 'комментариев')} к ${targets} ${pluralRu(targets, 'теме или уроку', 'темам и урокам', 'темам и урокам')} · открытых ${open}`
      : 'Пока пусто. Комментарий к уроку — кнопка «Комментарии» в строке урока, к теме — «Редактировать» под страницей «Пройдено» в итогах.';
    if (!xs.length) { if (all.length) list.append(h('div', { class: 'as-empty' }, 'Под фильтр ничего не подходит.')); return; }
    if (f.sort === 'plan') { // по плану: этап → тема (или урок), внутри — по дате
      xs = xs.slice().sort((a, b) => a.ord - b.ord || a.ts - b.ts);
      let stage = null, grp = null, key = null;
      for (const c of xs) {
        if (c.stage !== stage) { stage = c.stage; list.append(h('h2', { class: 'as-h2 as-cmpage__stage' }, `Этап ${c.stage}` + (c.stageTitle ? ' · ' + c.stageTitle : ''))); key = null; }
        const k = c.themeId || c.target;
        if (k !== key) {
          key = k;
          grp = h('div', { class: 'as-cmpage__items' });
          list.append(h('div', { class: 'as-cmpage__group' }, h('div', { class: 'as-group-title' }, h('a', { class: 'as-pill-id', onclick: () => openId(k) }, k), c.theme || c.title), grp));
        }
        grp.append(commentRow(c, { onChange, meta: c.kind === 'lesson' ? meta(c) : null }));
      }
      return;
    }
    // по датам: новые или старые сверху; «Раньше» (перенесённые) — в конце или в начале
    xs = xs.slice().sort((a, b) => (f.sort === 'new' ? b.ts - a.ts : a.ts - b.ts) || a.id - b.id);
    if (f.sort === 'new') xs = [...xs.filter((c) => c.ts), ...xs.filter((c) => !c.ts)];
    let day = null, grp = null;
    for (const c of xs) {
      const t = dayTitle(c);
      if (t !== day) { day = t; grp = h('div', { class: 'as-cmpage__items' }); list.append(h('div', { class: 'as-cmpage__day' }, t), grp); }
      grp.append(commentRow(c, { onChange, meta: meta(c) }));
    }
  }
  root.append(h('header', { class: 'as-head' },
    h('div', { class: 'as-eyebrow' }, 'Комментарии'),
    h('h1', { class: 'large-title', style: { margin: '4px 0 0' } }, 'Мои комментарии'), sub), chips, list);
  paint();
}
