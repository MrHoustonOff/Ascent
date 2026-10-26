import { api } from '../api.js';
import { h } from '../ui/dom.js';
import { go, openId } from '../actions.js';

const NAMES = { '00': 'Карта', '98': 'ТЗ А', '99': 'ТЗ Б' };

export async function render(root, arg) {
  const key = NAMES[arg] ? arg : '00';
  const d = await api.Doc(key);
  const body = h('article', { class: 'as-prose', html: d.html });
  body.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.goto) return openId(a.dataset.goto);
    if (a.dataset.doc) return openDoc(a.dataset.doc, a.dataset.anchor);
    if (a.href && /^https?:/.test(a.href)) window.runtime && window.runtime.BrowserOpenURL ? window.runtime.BrowserOpenURL(a.href) : window.open(a.href, '_blank', 'noopener');
  });
  root.append(
    h('header', { class: 'as-head' },
      h('div', { class: 'as-eyebrow' }, 'Документы'),
      h('div', { class: 'as-tabs', role: 'tablist', style: { marginTop: '10px', alignSelf: 'flex-start' } }, Object.entries(NAMES).map(([k, t]) =>
        h('button', { class: 'as-tab' + (k === key ? ' is-active' : ''), role: 'tab', 'aria-selected': k === key, onclick: () => go('#/docs/' + k) }, t)))),
    body);
  return 'Документы · ' + d.title;
}

// Ссылки на файлы плана: этапы → «Путь», банк → экран банка, словарь → экран словаря.
export function openDoc(prefix, anchor) {
  const n = parseInt(prefix, 10);
  if (n >= 1 && n <= 7) return go('#/path/stage-' + n);
  if (prefix === '90') return go('#/bank' + (anchor && /-/.test(anchor) ? '/' + anchor : ''));
  if (prefix === '91') return go('#/glossary');
  if (['00', '98', '99'].includes(prefix)) return go('#/docs/' + prefix);
}
