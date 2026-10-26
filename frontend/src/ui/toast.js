import { h } from './dom.js';
import { icon } from './icons.js';

let host;
export function mountToasts(parent) {
  host = h('div', { class: 'as-toasts', role: 'status', 'aria-live': 'polite' });
  parent.append(host);
}

// kind: 'ok' | 'streak'. action: { label, onClick }
export function toast({ title, body, kind = 'ok', action, ms = 6000 }) {
  if (!host) return;
  const ico = h('div', { class: 'as-toast__icon' + (kind === 'ok' ? ' as-toast__icon--ok' : '') });
  ico.innerHTML = kind === 'streak'
    ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12.6 2.2c.3 3.6 4.9 5.8 4.9 11a5.5 5.5 0 0 1-11 0c0-2.2 1.1-3.7 2.3-4.8.1 1.6.8 2.6 1.9 3C10 7.3 11 4.3 12.6 2.2z"/></svg>'
    : '<svg class="as-glyph" viewBox="0 0 10 10" aria-hidden="true" style="width:14px;height:14px;stroke-width:1.6"><path d="M1.8 5.4l2.2 2.2 4.4-4.8"/></svg>';
  const el = h('div', { class: 'as-toast' },
    ico,
    h('div', { class: 'as-toast__text' },
      h('div', { class: 'as-toast__title' }, title),
      body ? h('div', { class: 'as-toast__body' }, body) : null),
    action ? h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => { action.onClick(); close(); } }, action.label) : null);
  let t;
  const close = () => {
    clearTimeout(t);
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 220);
  };
  [...host.children].forEach((c) => { const t = c.querySelector('.as-toast__title'); if (t && t.textContent === title) c.remove(); });
  host.append(el);
  while (host.children.length > 3) host.firstChild.remove();
  t = setTimeout(close, ms);
  return close;
}

export const toastError = (msg) => toast({ title: msg || 'Не удалось сохранить. Попробуйте ещё раз', kind: 'streak' });
