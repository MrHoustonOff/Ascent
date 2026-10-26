import { h } from './dom.js';

// Диалог поверх окна. Esc и клик по фону закрывают. Фокус ловится внутри.
export function openDialog({ title, body, actions = [], cls = '', top = false, focus, onClose }) {
  const prev = document.activeElement;
  const root = document.querySelector('.as-window') || document.body;
  const dlg = h('div', { class: 'as-dialog ' + cls, role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Диалог' },
    title ? h('h2', { class: 'as-dialog__title' }, title) : null,
    body,
    actions.length ? h('div', { class: 'as-dialog__actions' }, actions.map((a) =>
      h('button', {
        class: 'as-btn ' + (a.kind === 'primary' ? 'as-btn--primary' : a.kind === 'danger' ? 'as-btn--danger' : a.kind === 'ghost' ? 'as-btn--ghost' : 'as-btn--secondary'),
        disabled: a.disabled, 'data-act': a.id || a.label,
        onclick: () => a.onClick && a.onClick(api),
      }, a.label))) : null);
  const scrim = h('div', { class: 'as-scrim' + (top ? ' as-scrim--top' : '') }, dlg);
  let closed = false;
  const api = {
    el: dlg,
    close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      scrim.remove();
      if (prev && prev.focus) prev.focus();
      onClose && onClose();
    },
  };
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); api.close(); return; }
    if (e.key === 'Tab') {
      const f = [...dlg.querySelectorAll('button:not([disabled]),input,select,textarea,[tabindex="0"]')].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }
  scrim.addEventListener('mousedown', (e) => { if (e.target === scrim) api.close(); });
  document.addEventListener('keydown', onKey, true);
  root.append(scrim);
  const safe = focus ? dlg.querySelector(focus) : (dlg.querySelector('input,textarea') || dlg.querySelector('[data-act]:not(.as-btn--primary):not(.as-btn--danger)') || dlg.querySelector('button'));
  if (safe) safe.focus();
  return api;
}

// Подтверждение. Для необратимого — введите слово.
export function confirmDialog({ title, text, confirmLabel, danger, word }) {
  return new Promise((resolve) => {
    let input;
    const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
      h('p', { class: 'as-p-callout', style: { fontSize: '15px', lineHeight: '22px' } }, text),
      word ? (input = h('input', { class: 'as-input', placeholder: word, 'aria-label': 'Подтверждение', oninput: () => { ok.disabled = input.value.trim().toLowerCase() !== word; ok.classList.toggle('is-off', ok.disabled); } })) : null);
    let ok;
    const d = openDialog({
      title, body,
      actions: [
        { label: 'Отмена', kind: 'secondary', onClick: (x) => { x.close(); resolve(false); } },
        { label: confirmLabel, kind: danger ? 'danger' : 'primary', disabled: !!word, onClick: (x) => { x.close(); resolve(input ? input.value.trim() : true); } },
      ],
      onClose: () => resolve(false),
    });
    ok = d.el.querySelector('.as-dialog__actions .as-btn:last-child');
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !ok.disabled) ok.click(); });
  });
}
