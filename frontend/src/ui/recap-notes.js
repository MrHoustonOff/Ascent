// Комментарии к пройденным темам для итогов: добавить, изменить, удалить. Мини-markdown: `код`, **жирный**, *курсив*.
// Комментарий хранится по id темы (настройка theme_notes) и рисуется под темой на карточке «Пройдено».
import { h, clear } from './dom.js';

export function openNotes({ themes, notes }) {
  return new Promise((resolve) => {
    const n = { ...notes };
    const list = h('div', { class: 'as-notes__list' });
    const root = h('div', { class: 'as-notes', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Комментарии к темам' },
      h('div', { class: 'as-notes__head' }, h('h2', { class: 'as-notes__title' }, 'Комментарии к темам'),
        h('div', { class: 'caption as-subtle' }, 'Комментарий встанет под темой на картинке «Пройдено». В тексте: `код`, **жирный**, *курсив*.')),
      list,
      h('div', { class: 'as-editor__actions' },
        h('button', { class: 'as-btn as-btn--ghost', onclick: () => done(null) }, 'Отмена'),
        h('button', { class: 'as-btn as-btn--primary', onclick: () => { for (const k in n) if (!String(n[k]).trim()) delete n[k]; done(n); } }, 'Готово')));
    const scrim = h('div', { class: 'as-scrim as-editor__scrim' }, root);
    (document.querySelector('.as-window') || document.body).append(scrim);

    function draw(focusId) {
      clear(list); let focus = null;
      for (const t of themes) {
        const row = h('div', { class: 'as-notes__row' },
          h('div', { class: 'as-notes__theme' }, h('span', { class: 'as-notes__id' }, t.id), h('span', null, String(t.title).replace(/`/g, ''))));
        if (n[t.id] != null) {
          const ta = h('textarea', { class: 'as-textarea as-notes__ta', rows: 2, placeholder: 'Что понравилось, что запомнилось…', 'aria-label': 'Комментарий к теме ' + t.id });
          ta.value = n[t.id];
          ta.addEventListener('input', () => { n[t.id] = ta.value; });
          row.append(ta, h('button', { class: 'as-btn as-btn--ghost as-btn--sm as-notes__del', onclick: () => { delete n[t.id]; draw(); } }, 'Удалить комментарий'));
          if (focusId === t.id) focus = ta;
        } else {
          row.append(h('button', { class: 'as-btn as-btn--secondary as-btn--sm as-notes__add', onclick: () => { n[t.id] = ''; draw(t.id); } }, '＋ Комментарий'));
        }
        list.append(row);
      }
      if (focus) focus.focus();
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); done(null); }
      e.stopImmediatePropagation(); // горячие клавиши приложения и окна итогов не срабатывают
    };
    window.addEventListener('keydown', onKey, true);
    function done(v) { window.removeEventListener('keydown', onKey, true); scrim.remove(); resolve(v); }
    draw();
  });
}
