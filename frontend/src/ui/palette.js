import { h, clear, idTag } from './dom.js';
import { icon } from './icons.js';
import { openDialog } from './dialog.js';
import { api } from '../api.js';

const KIND = { lesson: 'Урок', theme: 'Тема', block: 'Блок', term: 'Термин' };

export function openPalette(onPick) {
  let hits = [];
  let sel = 0;
  let seq = 0;
  const list = h('div', { class: 'as-palette__list', role: 'listbox' });
  const input = h('input', { class: 'as-input', placeholder: 'Поиск по ID и словам: GO-7.3, append', 'aria-label': 'Поиск' });
  const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, input, list);
  const d = openDialog({ body, cls: 'as-palette', top: true, focus: 'input' });

  const paint = () => {
    clear(list);
    if (!input.value.trim()) return;
    if (!hits.length) {
      list.append(h('div', { class: 'as-palette__empty' }, 'Ничего не нашлось. Попробуйте ID урока, например GO-7.3.'));
      return;
    }
    hits.forEach((x, i) => {
      list.append(h('div', {
        class: 'as-nav-item' + (i === sel ? ' is-active' : ''), role: 'option', 'aria-selected': i === sel,
        onmousemove: () => { if (sel !== i) { sel = i; paint(); } },
        onclick: () => pick(x),
      },
      h('span', { class: 'as-nav-text' }, x.id.length < 24 ? idTag(x.id) : '', x.title),
      h('span', { class: 'as-nav-sub' }, KIND[x.kind])));
    });
    const cur = list.children[sel];
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
  };
  const pick = (x) => { d.close(); onPick(x); };
  input.addEventListener('input', async () => {
    const my = ++seq;
    const q = input.value;
    const r = q.trim() ? await api.Search(q).catch(() => []) : [];
    if (my !== seq) return;
    hits = r; sel = 0; paint();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(hits.length - 1, sel + 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
    else if (e.key === 'Enter' && hits[sel]) { e.preventDefault(); pick(hits[sel]); }
  });
  return d;
}
