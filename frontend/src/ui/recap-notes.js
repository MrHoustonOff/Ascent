// Комментарии к пройденным темам для итогов: у каждой темы — несколько комментариев с датами и отметкой «сделано».
// Изменения сохраняются сразу; на картинке «Пройдено» комментарии темы — бабблы под ней.
import { h } from './dom.js';
import { commentList } from './comments.js';

export function openNotes({ themes }) {
  return new Promise((resolve) => {
    const list = h('div', { class: 'as-notes__list' }, themes.map((t) => h('div', { class: 'as-notes__row' },
      h('div', { class: 'as-notes__theme' }, h('span', { class: 'as-notes__id' }, t.id), h('span', null, String(t.title).replace(/`/g, ''))),
      commentList(t.id))));
    const root = h('div', { class: 'as-notes', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Комментарии к темам' },
      h('div', { class: 'as-notes__head' }, h('h2', { class: 'as-notes__title' }, 'Комментарии к темам'),
        h('div', { class: 'caption as-subtle' }, 'Несколько комментариев к теме, у каждого — дата. Галочка — «сделано». Все комментарии видны и на странице «Комментарии». В тексте: `код`, **жирный**, *курсив*.')),
      list,
      h('div', { class: 'as-editor__actions' }, h('button', { class: 'as-btn as-btn--primary', onclick: () => done(true) }, 'Готово')));
    const scrim = h('div', { class: 'as-scrim as-editor__scrim' }, root);
    (document.querySelector('.as-window') || document.body).append(scrim);
    // Esc закрывает окно (если не правится комментарий); клавиши внутри окна доходят до полей,
    // но не всплывают к горячим клавишам приложения и окна итогов
    const onKey = (e) => {
      if (root.contains(e.target) && e.target.closest('.as-cm.is-edit')) return; // Esc в правке — отмена правки
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); done(true); return; }
      if (!root.contains(e.target)) e.stopImmediatePropagation();
    };
    root.addEventListener('keydown', (e) => e.stopPropagation());
    window.addEventListener('keydown', onKey, true);
    function done(v) { window.removeEventListener('keydown', onKey, true); scrim.remove(); resolve(v); }
  });
}
