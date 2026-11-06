// Окно «Данные практики»: вставить JSON ответа /практика или прикрепить файл (кнопкой или перетаскиванием).
// Вставка и файл разбираются сразу и, если всё верно, добавляются без лишних нажатий. Устроено как окно Anki.
import { h, pluralRu } from './dom.js';
import { parsePractice, practiceInfo, hm } from './recap-practice.js';

const HINT = 'Вставьте ответ /практика (сегодня, неделя или период) или прикрепите файл .json.';
export function openPracticeImport() {
  return new Promise((resolve) => {
    let parsed = null;
    const ta = h('textarea', { class: 'as-textarea as-anki__ta', rows: 9, spellcheck: 'false', placeholder: '{\n  "range": { "from": "2026-11-06", "to": "2026-11-06" },\n  "practices": [ … ],\n  "total": { … }\n}', 'aria-label': 'JSON практики' });
    const status = h('div', { class: 'as-anki__status', role: 'status' }, HINT);
    const file = h('input', { type: 'file', accept: '.json,application/json,text/plain', hidden: true });
    const add = h('button', { class: 'as-btn as-btn--primary', disabled: true, onclick: () => parsed && done(parsed) }, 'Добавить');
    const check = (auto) => {
      const r = parsePractice(ta.value);
      parsed = r.ok ? r.data : null;
      add.disabled = !parsed;
      status.className = 'as-anki__status' + (ta.value.trim() ? (r.ok ? ' is-ok' : ' is-err') : '');
      if (!ta.value.trim()) { status.textContent = HINT; return; }
      if (!r.ok) { status.textContent = r.error; return; }
      const i = practiceInfo(parsed), t = parsed.total;
      status.textContent = `${i.period} · ${t.count} ${pluralRu(t.count, 'практика', 'практики', 'практик')} · ${hm(t.duration_min)} из ${hm(t.planned_min)} по плану`;
      if (auto) done(parsed); // вставка или файл — добавляем сразу
    };
    const readFile = (f) => { if (!f) return; f.text().then((t) => { ta.value = t; check(true); }); };
    ta.addEventListener('input', (e) => check(e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop'));
    file.addEventListener('change', () => readFile(file.files[0]));
    const drop = h('div', { class: 'as-anki__drop' }, ta);
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
    drop.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (!f) return; e.preventDefault(); drop.classList.remove('is-over'); readFile(f); });
    const root = h('div', { class: 'as-notes as-anki', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Данные практики' },
      h('div', null, h('h2', { class: 'as-notes__title' }, 'Данные практики'),
        h('div', { class: 'caption as-subtle' }, 'Карточка «Практика» встанет в итоги, если её даты пересекаются с периодом итогов. Новые данные заменяют прежние.')),
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
