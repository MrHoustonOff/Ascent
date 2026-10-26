import { api } from '../api.js';
import { h, clear, pluralRu } from '../ui/dom.js';
import { icon, stateDot } from '../ui/icons.js';
import { openId, copy } from '../actions.js';

let q = '';

export async function render(root, arg) {
  if (arg) q = arg;
  const terms = await api.Glossary(q);
  const input = h('input', { class: 'as-input', type: 'search', placeholder: 'Найти термин', value: q, 'aria-label': 'Поиск по термину', style: { width: '100%' } });
  const list = h('div', { class: 'as-section' });
  root.append(
    h('header', { class: 'as-head' },
      h('div', { class: 'as-eyebrow' }, 'Словарь'),
      h('h1', { class: 'large-title', style: { margin: '4px 0 0' } }, 'Термины плана'),
      h('p', { class: 'as-lead' }, 'Каждый термин привязан к уроку, где он вводится. Клик копирует строку «термин — ID урока».')),
    input, list);
  const paint = (items) => {
    clear(list);
    if (!items.length) { list.append(h('div', { class: 'as-empty' }, 'Ничего не нашлось. Попробуйте другое слово.')); return; }
    let stage = null, block = null, card = null;
    for (const t of items) {
      if (t.stage !== stage) { stage = t.stage; block = null; list.append(h('h2', { class: 'as-h2', style: { marginTop: '12px' } }, 'Этап ' + stage)); }
      if (t.block !== block) {
        block = t.block;
        list.append(h('div', { class: 'as-group-title' }, h('span', { class: 'as-pill-id' }, t.block), (t.blockTitle || '').replace(/\.$/, '')));
        card = h('div', { class: 'as-card', style: { padding: '6px', gap: '0' } });
        list.append(card);
      }
      card.append(h('button', { class: 'as-term', title: t.pattern ? 'Шаблон поиска: ' + t.pattern : '', onclick: () => copy('term', t.name + ' — ' + (t.refId || t.ref)) },
        h('span', { class: 'as-term__name' }, t.name),
        h('span', { class: 'as-term__ref' },
          t.refId ? stateDot(t.lessonDone ? 'done' : 'todo') : null,
          t.refId ? h('a', { class: 'as-a', title: t.lessonTitle, onclick: (e) => { e.stopPropagation(); openId(t.refId); } }, t.refId) : t.ref)));
    }
  };
  paint(terms);
  let seq = 0;
  input.addEventListener('input', async () => {
    q = input.value; const my = ++seq;
    const r = await api.Glossary(q);
    if (my === seq) paint(r);
  });
  return 'Словарь';
}
