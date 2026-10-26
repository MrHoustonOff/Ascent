import { h, clear, idTag } from './dom.js';
import { icon, stateDot } from './icons.js';
import { S, lsGet, lsSet } from '../state.js';
import { go } from '../actions.js';

const SCREENS = [
  { id: 'today', label: 'Сегодня', icon: 'today', hash: '#/today', key: 'Ctrl+1' },
  { id: 'path', label: 'Путь', icon: 'path', hash: '#/path', key: 'Ctrl+2', meta: true },
  { id: 'speed', label: 'Скорость', icon: 'gauge', hash: '#/speed', key: 'Ctrl+3' },
  { id: 'stats', label: 'Статистика', icon: 'stats', hash: '#/stats', key: 'Ctrl+4' },
  { id: 'achievements', label: 'Достижения', icon: 'trophy', hash: '#/achievements', key: 'Ctrl+5', ach: true },
  { id: 'bank', label: 'Банк вопросов', icon: 'bank', hash: '#/bank', key: 'Ctrl+6' },
  { id: 'glossary', label: 'Словарь', icon: 'glossary', hash: '#/glossary', key: 'Ctrl+7' },
  { id: 'docs', label: 'Документы', icon: 'docs', hash: '#/docs/00', key: 'Ctrl+8' },
  { id: 'settings', label: 'Настройки', icon: 'settings', hash: '#/settings', key: 'Ctrl+,' },
];

let open = new Set(lsGet('tree.open', []));
let seeded = lsGet('tree.seeded', false);

export function renderSidebar(el, onNavigate) {
  const tree = S.tree;
  const rt = S.route;
  clear(el);
  if (!tree) return;
  if (!seeded && tree.curStage) {
    open.add('stage-' + tree.curStage);
    if (tree.curBlock) open.add(tree.curBlock);
    seeded = true; lsSet('tree.seeded', true); lsSet('tree.open', [...open]);
  }
  const inPath = rt.name === 'path' && rt.arg;
  const activeId = inPath ? rt.arg.replace(/^(.+-\d+\.\d+)\.\d+$/, '$1') : null;

  el.append(h('div', { class: 'as-nav-label' }, 'Ascent'));
  for (const s of SCREENS) {
    const active = rt.name === s.id && !inPath;
    el.append(h('button', { class: 'as-nav-item as-nav-item--screen' + (active ? ' is-active' : ''), title: s.label + ' (' + s.key + ')', onclick: () => { go(s.hash === '#/path' ? pathHash() : s.hash); onNavigate(); } },
      icon(s.icon), h('span', { class: 'as-nav-text' }, s.label),
      s.meta ? h('span', { class: 'as-nav-meta' }, tree.pct + ' %') : null,
      s.ach ? h('span', { class: 'as-nav-meta' }, tree.achNew ? h('span', { class: 'as-note-dot', style: { marginRight: '6px' }, title: 'Есть новые' }) : null, tree.achUnlocked + '/' + tree.achTotal) : null));
  }
  el.append(h('div', { class: 'as-nav-sep' }));
  el.append(h('div', { class: 'as-nav-label' }, 'Курс'));

  for (const st of tree.stages) {
    const isOpen = open.has(st.id);
    const sActive = activeId === st.id;
    el.append(h('button', {
      class: 'as-nav-item as-nav-item--stage' + (isOpen ? ' is-open' : '') + (sActive ? ' is-active' : ''), title: 'Этап ' + st.num + '. ' + st.title,
      'aria-expanded': isOpen,
      onclick: () => { toggle(st.id); go('#/path/' + st.id); },
    }, icon('chevR', 'as-nav-chev'), h('span', { class: 'as-nav-text' }, 'Этап ' + st.num + ' · ' + shortStage(st.title)), h('span', { class: 'as-nav-meta' }, st.pct + ' %')));
    if (!isOpen) continue;
    for (const b of st.blocks) {
      const bOpen = open.has(b.id);
      const bActive = activeId === b.id;
      el.append(h('button', {
        class: 'as-nav-item as-nav-item--block' + (bActive ? ' is-active' : ''), title: b.id + ' ' + b.title,
        onclick: () => { if (!b.isRun) { if (!bOpen) toggle(b.id, true); } go('#/path/' + b.id); onNavigate(); },
      }, stateDot(b.state), h('span', { class: 'as-nav-text' }, idTag(b.id), shortBlock(b.title))));
      if (b.isRun || !bOpen) continue;
      for (const t of b.themes) {
        const tActive = activeId === t.id;
        el.append(h('button', {
          class: 'as-nav-item as-nav-item--theme' + (tActive ? ' is-active' : ''), title: t.id + ' ' + t.title + (t.checkPending ? ' — проверка темы' : '') + (t.closedAt ? ' — закрыта ' + t.closedAt : ''),
          onclick: () => { go('#/path/' + t.id); onNavigate(); },
        }, stateDot(t.state), h('span', { class: 'as-nav-text' }, t.title), h('span', { class: 'as-nav-meta' }, t.done + '/' + t.total)));
      }
    }
  }
  const act = el.querySelector('.as-nav-item.is-active');
  if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
}

function toggle(id, force) {
  if (force === true) open.add(id);
  else if (open.has(id)) open.delete(id);
  else open.add(id);
  lsSet('tree.open', [...open]);
  S.hooks.sidebar && S.hooks.sidebar();
}

export function revealInTree(id) {
  const t = S.tree; if (!t) return;
  for (const st of t.stages) for (const b of st.blocks) {
    if (b.id === id || b.themes.some((x) => x.id === id)) { open.add(st.id); open.add(b.id); }
    if (st.id === id) open.add(st.id);
  }
  lsSet('tree.open', [...open]);
}

export function pathHash() {
  const t = S.tree;
  if (t && t.curTheme) return '#/path/' + t.curTheme;
  if (t && t.curBlock) return '#/path/' + t.curBlock;
  return '#/path/stage-1';
}

const shortStage = (t) => t.split(':')[0];
// «От исходника к процессу» → без точки в конце
const shortBlock = (t) => t.replace(/\.$/, '');
