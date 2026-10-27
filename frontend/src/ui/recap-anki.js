// Окно «Данные из Anki»: вставить JSON или прикрепить файл (кнопкой или перетаскиванием).
// Вставка и файл разбираются сразу и, если всё верно, добавляются без лишних нажатий.
import { h } from './dom.js';
import { parseAnki, ankiInfo } from './anki.js';

export function openAnkiImport() {
  return new Promise((resolve) => {
    let parsed = null;
    const ta = h('textarea', { class: 'as-textarea as-anki__ta', rows: 9, spellcheck: 'false', placeholder: '{\n  "period_from": "2026-10-27",\n  "period_to": "2026-10-27",\n  "deck": "Прога",\n  …\n}', 'aria-label': 'JSON из Anki' });
    const status = h('div', { class: 'as-anki__status', role: 'status' }, 'Вставьте JSON из расширения «Итоги периода (JSON)» или прикрепите файл.');
    const file = h('input', { type: 'file', accept: '.json,application/json,text/plain', hidden: true });
    const add = h('button', { class: 'as-btn as-btn--primary', disabled: true, onclick: () => parsed && done(parsed) }, 'Добавить');
    const check = (auto) => {
      const r = parseAnki(ta.value);
      parsed = r.ok ? r.data : null;
      add.disabled = !parsed;
      status.className = 'as-anki__status' + (ta.value.trim() ? (r.ok ? ' is-ok' : ' is-err') : '');
      if (!ta.value.trim()) { status.textContent = 'Вставьте JSON из расширения «Итоги периода (JSON)» или прикрепите файл.'; return; }
      if (!r.ok) { status.textContent = r.error; return; }
      const i = ankiInfo(parsed);
      status.textContent = `${parsed.deck} · ${i.period} · ${parsed.unique_cards_reviewed} карточек, ${parsed.minutes_spent} мин`;
      if (auto) done(parsed); // вставка или файл — добавляем сразу
    };
    const readFile = (f) => { if (!f) return; f.text().then((t) => { ta.value = t; check(true); }); };
    ta.addEventListener('input', (e) => check(e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop'));
    file.addEventListener('change', () => readFile(file.files[0]));
    const drop = h('div', { class: 'as-anki__drop' }, ta);
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
    drop.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (!f) return; e.preventDefault(); drop.classList.remove('is-over'); readFile(f); });
    const root = h('div', { class: 'as-notes as-anki', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Данные из Anki' },
      h('div', null, h('h2', { class: 'as-notes__title' }, 'Данные из Anki'),
        h('div', { class: 'caption as-subtle' }, 'Карточка «Anki» встанет в итоги. Новые данные заменяют прежние.')),
      drop, status,
      h('div', { class: 'as-editor__actions' },
        h('button', { class: 'as-btn as-btn--secondary', style: { marginRight: 'auto' }, onclick: () => file.click() }, 'Прикрепить файл'), file,
        h('button', { class: 'as-btn as-btn--ghost', onclick: () => done(null) }, 'Отмена'), add));
    const scrim = h('div', { class: 'as-scrim as-editor__scrim' }, root);
    (document.querySelector('.as-window') || document.body).append(scrim);
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); done(null); }
      e.stopImmediatePropagation(); // горячие клавиши приложения и окна итогов не срабатывают
    };
    window.addEventListener('keydown', onKey, true);
    function done(v) { window.removeEventListener('keydown', onKey, true); scrim.remove(); resolve(v); }
    ta.focus();
  });
}
