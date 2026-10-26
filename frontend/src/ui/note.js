import { h } from './dom.js';
import { icon } from './icons.js';
import { api } from '../api.js';
import { toastError } from './toast.js';
import { refresh } from '../actions.js';

let panel = null;

export function closeNote() { if (panel) { panel.remove(); panel = null; } }

// Заметка к уроку. Сохраняется при потере фокуса и через секунду после ввода.
export function openNote(l) {
  closeNote();
  let timer, last = l.note || '';
  const ta = h('textarea', { class: 'as-textarea', placeholder: 'Что хочется запомнить об этом уроке', 'aria-label': 'Заметка' });
  ta.value = last;
  const save = async () => {
    clearTimeout(timer);
    if (ta.value === last) return;
    try { await api.SetNote(l.id, ta.value); last = ta.value; } catch { toastError(); }
  };
  ta.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(save, 1000); });
  ta.addEventListener('blur', save);
  panel = h('aside', { class: 'as-panel', role: 'complementary', 'aria-label': 'Заметка к уроку' },
    h('div', { class: 'as-rowx as-rowx--between' },
      h('div', { style: { minWidth: 0 } }, h('div', { class: 'as-eyebrow' }, 'Заметка'), h('div', { class: 'as-pill-id' }, l.id)),
      h('button', { class: 'as-iconbtn', 'aria-label': 'Закрыть', onclick: async () => { await save(); closeNote(); refresh(); } }, icon('close'))),
    h('div', { class: 'callout as-muted', style: { overflowWrap: 'anywhere' } }, l.title.replace(/`/g, '')),
    ta);
  document.querySelector('.as-window__body').append(panel);
  ta.focus();
}
document.addEventListener('as-escape', () => closeNote());
