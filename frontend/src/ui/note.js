import { h } from './dom.js';
import { icon } from './icons.js';
import { refresh } from '../actions.js';
import { commentList } from './comments.js';

let panel = null;

export function closeNote() { if (panel) { panel.remove(); panel = null; } }

// Комментарии к уроку (кнопка «Заметка»): несколько записей с датами и отметкой «сделано».
// Старая заметка урока перенесена первым комментарием с подписью «раньше».
export function openNote(l) {
  closeNote();
  panel = h('aside', { class: 'as-panel', role: 'complementary', 'aria-label': 'Комментарии к уроку' },
    h('div', { class: 'as-rowx as-rowx--between' },
      h('div', { style: { minWidth: 0 } }, h('div', { class: 'as-eyebrow' }, 'Комментарии'), h('div', { class: 'as-pill-id' }, l.id)),
      h('button', { class: 'as-iconbtn', 'aria-label': 'Закрыть', onclick: () => { closeNote(); refresh(); } }, icon('close'))),
    h('div', { class: 'callout as-muted', style: { overflowWrap: 'anywhere' } }, l.title.replace(/`/g, '')),
    commentList(l.id, { autofocus: true }));
  document.querySelector('.as-window__body').append(panel);
}
document.addEventListener('as-escape', () => { if (panel) { closeNote(); refresh(); } });
