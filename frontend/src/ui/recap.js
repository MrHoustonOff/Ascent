// Итоги: картинки за день, неделю, месяц или весь путь. Сторис 9:16 или квадрат 1:1, одна картинка или карусель.
// Обязательные карточки — сводка, пройденное и достижения; остальные выпадают случайно (или включаются вручную).
// Стиль, цвет, раскладка и поза гофера случайны на каждое открытие окна; в пределах окна не прыгают.
import { api } from '../api.js';
import { S } from '../state.js';
import { h, clear, pluralRu } from './dom.js';
import { openDialog } from './dialog.js';
import { toast } from './toast.js';
import { FORMATS, STYLES, STYLE_KEYS, EXTRA_CARDS, planCards, drawCard, listPages, rngFrom, pick } from './recap-draw.js';
import { openEditor } from './recap-editor.js';
import { openListEditor } from './recap-list.js';
import { openNotes } from './recap-notes.js';
import { openAnkiImport } from './recap-anki.js';
import { parseAnki, ankiInfo } from './anki.js';

const KINDS = [['day', 'День'], ['week', 'Неделя'], ['month', 'Месяц'], ['range', 'Период'], ['all', 'Весь путь']];
const TOGGLE_NEXT = { auto: 'on', on: 'off', off: 'auto' };
const TOGGLE_TEXT = { auto: 'случайно', on: 'всегда', off: 'нет' };

function loadPrefs() {
  const def = { format: 'story', mode: 'carousel', style: 'random', toggles: {}, custom: [], dayX: true };
  try { return { ...def, ...JSON.parse(S.settings.recap_prefs || '{}') }; } catch { return def; }
}
// комментарии к пройденным темам: id темы → текст (общие для всех периодов)
function loadNotes() { try { return JSON.parse(S.settings.theme_notes || '{}') || {}; } catch { return {}; } }
function saveNotes(n) {
  const v = JSON.stringify(n);
  S.settings.theme_notes = v;
  api.SetSetting('theme_notes', v).catch(() => {});
}
// итоги Anki: последний загруженный JSON (настройка anki_recap)
function loadAnki() { const r = parseAnki(S.settings.anki_recap || ''); return r.ok ? r.data : null; }
function saveAnki(a) {
  const v = a ? JSON.stringify(a) : '';
  S.settings.anki_recap = v;
  api.SetSetting('anki_recap', v).catch(() => {});
}
function savePrefs(p) {
  const v = JSON.stringify(p);
  S.settings.recap_prefs = v;
  api.SetSetting('recap_prefs', v).catch(() => {});
}

// один выбор из нескольких вариантов: сегментированный переключатель
function seg(items, cur, onPick) {
  const el = h('div', { class: 'as-seg as-recap__seg', role: 'tablist' });
  const draw = (v) => { clear(el); items.forEach(([k, l]) => el.append(h('button', { class: 'as-seg__tab' + (k === v ? ' is-on' : ''), role: 'tab', 'aria-selected': String(k === v), onclick: () => { draw(k); onPick(k); } }, l))); };
  draw(cur);
  return el;
}

export function openRecap() {
  const p = loadPrefs();
  const seed = Math.floor(Math.random() * 2 ** 31);
  const rnd = rngFrom(seed);
  const randStyle = pick(rnd, STYLE_KEYS);
  let kind = 'day', date = '', data = null, list = [], canvases = [], buildNo = 0;
  // правки готовых страниц: id → { hidden, style }; сбрасываются при смене периода, формата или режима
  let over = {};
  const cardId = (c) => c.key === 'custom' ? 'custom:' + c.ci + ':' + (c.page || 0) : c.key + ':' + (c.from || 0);
  let order = []; // порядок страниц (id), если его меняли стрелками или перетаскиванием
  const reset = () => { over = {}; order = []; };

  const preview = h('div', { class: 'as-recap__pages' });
  const info = h('div', { class: 'caption as-subtle' }, '');
  const dateInp = h('input', { class: 'as-input', type: 'date', 'aria-label': 'Дата', style: { width: '160px' } });
  dateInp.addEventListener('change', () => { date = dateInp.value; reset(); build(); });
  // произвольный период: с … по …; пока не выбран — последние две недели
  let rFrom = '', rTo = '';
  const fromInp = h('input', { class: 'as-input', type: 'date', 'aria-label': 'Начало периода', style: { width: '160px' } });
  const toInp = h('input', { class: 'as-input', type: 'date', 'aria-label': 'Конец периода', style: { width: '160px' } });
  const onRange = () => { if (!fromInp.value || !toInp.value) return; rFrom = fromInp.value; rTo = toInp.value; reset(); build(); };
  fromInp.addEventListener('change', onRange); toInp.addEventListener('change', onRange);
  const dates = h('div', { class: 'as-recap__dates' });
  const drawDates = () => {
    clear(dates);
    if (kind === 'range') dates.append(h('span', null, 'с'), fromInp, h('span', null, 'по'), toInp);
    else if (kind !== 'all') dates.append(dateInp);
  };
  const query = () => (kind === 'range' ? (rFrom && rTo ? `${rFrom}..${rTo}` : '') : date);
  const toggles = h('div', { class: 'as-recap__chips' });
  const drawToggles = () => {
    clear(toggles);
    toggles.append(h('span', { class: 'as-recap__label' }, 'Карточки'));
    for (const [k, l] of EXTRA_CARDS) {
      const st = p.toggles[k] || 'auto';
      toggles.append(h('button', {
        class: 'as-recap__chip is-' + st, title: 'Щелчок: случайно → всегда → нет',
        onclick: () => { p.toggles[k] = TOGGLE_NEXT[st]; savePrefs(p); drawToggles(); build(); },
      }, l, h('span', { class: 'as-recap__chipst' }, TOGGLE_TEXT[st])));
    }
    // «учу Go · день X» на первой карточке: считается от первой закрытой темы
    toggles.append(h('button', {
      class: 'as-recap__chip is-' + (p.dayX ? 'on' : 'off'), title: 'Надпись «учу Go · день X» на первой карточке',
      onclick: () => { p.dayX = !p.dayX; savePrefs(p); drawToggles(); build(); },
    }, 'День X', h('span', { class: 'as-recap__chipst' }, p.dayX ? 'есть' : 'нет')));
  };
  drawToggles();

  // кнопка «Данные из Anki»; когда данные есть — колода и дата, рядом ✕ убрать
  const ankiBtns = h('div', { class: 'as-recap__anki' });
  const drawAnkiBtns = () => {
    clear(ankiBtns);
    const a = loadAnki();
    ankiBtns.append(h('button', { class: 'as-btn as-btn--secondary as-btn--sm', title: 'Вставить JSON или прикрепить файл из Anki', onclick: importAnki },
      a ? `Anki · ${a.deck} · ${ankiInfo(a).short}` : 'Данные из Anki'));
    if (a) ankiBtns.append(h('button', { class: 'as-iconbtn', title: 'Убрать данные Anki', 'aria-label': 'Убрать данные Anki', onclick: () => { saveAnki(null); drawAnkiBtns(); reset(); build(); } }, '✕'));
  };
  async function importAnki() {
    const a = await openAnkiImport();
    if (!a) return;
    saveAnki(a); drawAnkiBtns(); reset(); build();
  }
  drawAnkiBtns();

  const body = h('div', { class: 'as-recap__body' },
    h('div', { class: 'as-rowx' }, seg(KINDS, kind, (k) => { kind = k; drawDates(); reset(); build(); }), dates),
    h('div', { class: 'as-rowx' },
      seg([['story', '9:16'], ['square', '1:1']], p.format, (v) => { p.format = v; savePrefs(p); reset(); build(); }),
      seg([['carousel', 'Карусель'], ['one', 'Одна']], p.mode, (v) => { p.mode = v; savePrefs(p); reset(); build(); }),
      seg([['random', 'Случайно'], ...STYLE_KEYS.map((k) => [k, STYLES[k].label])], p.style, (v) => { p.style = v; savePrefs(p); build(); })),
    toggles,
    preview,
    h('div', { class: 'as-rowx as-rowx--between' }, info,
      h('div', { class: 'as-rowx' }, ankiBtns,
        h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: () => edit(null, 'list') }, '＋ Список'),
        h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: () => edit(null) }, '＋ Своя карточка'))));

  const dlg = openDialog({
    title: 'Итоги', body, cls: 'as-recap', focus: '.as-dialog__actions .as-btn',
    actions: [
      { label: 'Закрыть', onClick: (d) => d.close() },
      { label: 'Сохранить картинки', kind: 'primary', onClick: save },
    ],
  });

  const styleNow = () => (p.style === 'random' ? randStyle : p.style);
  const accent = () => pick(rngFrom(seed + 5), STYLES[styleNow()].accents);

  // своя карточка: свободный холст или список
  async function edit(i, kind) {
    const old = i == null ? null : p.custom[i];
    const open = (old ? old.kind : kind) ? openListEditor : openEditor;
    const card = await open({ card: old, format: p.format, acc: accent(), seed: seed + 11 + (i ?? p.custom.length) });
    if (!card) return;
    if (i == null) p.custom.push(card); else p.custom[i] = card;
    savePrefs(p); build();
  }

  async function editNotes() {
    const res = await openNotes({ themes: data.themes, notes: loadNotes() });
    if (!res) return;
    saveNotes(res); reset(); build(); // страниц с темами могло стать больше
  }

  async function build() {
    const my = ++buildNo;
    clear(preview);
    preview.append(h('div', { class: 'as-recap__loading' }, 'Собираю…'));
    try {
      data = await api.Recap(kind, query());
      if (my !== buildNo) return;
      data.notes = loadNotes();
      data.anki = loadAnki();
      if (kind === 'range') { fromInp.value = data.from; toInp.value = data.date; rFrom = data.from; rTo = data.date; }
      else if (!dateInp.value && kind !== 'all') dateInp.value = data.date;
      const all = planCards(data, { mode: p.mode, toggles: p.toggles, seed, format: p.format, tasks: !!p.tasks });
      p.custom.forEach((c, i) => {
        if (!c.kind) { all.push({ key: 'custom', name: 'Своя карточка', card: c, ci: i }); return; }
        const n = listPages(c, p.format); // длинный список — несколько страниц
        for (let k = 0; k < n; k++) all.push({ key: 'custom', name: n > 1 ? `Список ${k + 1}` : 'Список', card: c, ci: i, page: k });
      });
      const hidden = all.filter((c) => over[cardId(c)]?.hidden).length;
      list = all.filter((c) => !over[cardId(c)]?.hidden);
      if (order.length) { // переставленные — в своём порядке, новые — следом в исходном
        const rank = (c, i) => { const k = order.indexOf(cardId(c)); return k >= 0 ? k : 1000 + i; };
        list = list.map((c, i) => [rank(c, i), c]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      }
      const style = styleNow(), acc = accent();
      const out = [];
      for (let i = 0; i < list.length; i++) {
        const st = over[cardId(list[i])]?.style || style; // свой фон у страницы
        const a = st === style ? acc : pick(rngFrom(seed + 5), STYLES[st].accents);
        out.push(await drawCard(list[i], data, { format: p.format, style: st, acc: a, seed, index: i, total: list.length, full: p.mode === 'one', dayX: p.dayX, tasks: !!p.tasks }));
        if (my !== buildNo) return;
      }
      canvases = out;
      clear(preview);
      const [W, H] = FORMATS[p.format];
      // перестановка: стрелками или перетаскиванием миниатюры
      const moveTo = (from, to) => {
        if (to < 0 || to >= list.length || from === to) return;
        const ids = list.map(cardId); const [x] = ids.splice(from, 1); ids.splice(to, 0, x);
        order = ids; build();
      };
      let dragFrom = -1;
      out.forEach((cv, i) => {
        const img = h('img', { src: cv.toDataURL('image/png'), alt: list[i].name, class: 'as-recap__thumb', style: { aspectRatio: `${W} / ${H}` }, draggable: 'false' });
        const c = list[i], id = cardId(c);
        const arrows = [
          h('button', { class: 'as-iconbtn as-recap__mv', title: 'Раньше', 'aria-label': 'Переместить раньше', disabled: i === 0, onclick: () => moveTo(i, i - 1) }, '‹'),
          h('button', { class: 'as-iconbtn as-recap__mv', title: 'Позже', 'aria-label': 'Переместить позже', disabled: i === out.length - 1, onclick: () => moveTo(i, i + 1) }, '›')];
        let tools;
        if (c.key === 'custom') {
          tools = h('div', { class: 'as-recap__customtools' }, arrows[0],
            h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: () => edit(c.ci) }, 'Изменить'),
            h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => { p.custom.splice(c.ci, 1); savePrefs(p); reset(); build(); } }, 'Убрать'), arrows[1]);
        } else {
          // фон страницы и удаление
          const bg = h('select', { class: 'as-input as-recap__bgsel', 'aria-label': 'Фон страницы', title: 'Фон этой страницы' },
            STYLE_KEYS.map((k) => h('option', { value: k, selected: k === (over[id]?.style || style) }, STYLES[k].label)));
          bg.addEventListener('change', () => { over[id] = { ...over[id], style: bg.value }; build(); });
          const notesBtn = c.key === 'themes' && data.themes.length
            ? h('button', { class: 'as-btn as-btn--secondary as-btn--sm', title: 'Комментарии к пройденным темам', onclick: editNotes }, 'Редактировать') : null;
          // «Показывать задачи» — темы раскрываются в свои задачи
          const tasksChk = c.key === 'themes' && data.themes.length ? h('label', { class: 'as-recap__chk', title: 'Показывать задачи каждой темы' },
            (() => { const i = h('input', { type: 'checkbox', checked: !!p.tasks }); i.addEventListener('change', () => { p.tasks = i.checked; savePrefs(p); reset(); build(); }); return i; })(), 'задачи') : null;
          tools = h('div', { class: 'as-recap__customtools' }, arrows[0], tasksChk, notesBtn, bg,
            h('button', { class: 'as-iconbtn as-recap__del', title: 'Удалить страницу', 'aria-label': 'Удалить страницу', onclick: () => { over[id] = { ...over[id], hidden: true }; build(); } }, '✕'), arrows[1]);
        }
        const page = h('div', { class: 'as-recap__custom', draggable: 'true', title: 'Перетащите, чтобы поменять порядок' }, img, tools);
        page.addEventListener('dragstart', (e) => { dragFrom = i; page.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); });
        page.addEventListener('dragend', () => page.classList.remove('is-drag'));
        page.addEventListener('dragover', (e) => { e.preventDefault(); page.classList.add('is-over'); });
        page.addEventListener('dragleave', () => page.classList.remove('is-over'));
        page.addEventListener('drop', (e) => { e.preventDefault(); page.classList.remove('is-over'); moveTo(dragFrom, i); });
        preview.append(page);
      });
      if (hidden) preview.append(h('button', { class: 'as-btn as-btn--ghost as-btn--sm as-recap__restore', onclick: () => { for (const k in over) if (over[k].hidden) delete over[k].hidden; build(); } }, `Вернуть удалённые (${hidden})`));
      const n = out.length;
      info.textContent = `${data.title} · ${data.period} · ${n} ${pluralRu(n, 'картинка', 'картинки', 'картинок')} · ${STYLES[style].label.toLowerCase()}`;
    } catch (e) { console.error(e); clear(preview); preview.append(h('div', { class: 'as-recap__loading' }, 'Не удалось собрать итоги.')); }
  }

  async function save() {
    if (!canvases.length || !data) return;
    const urls = canvases.map((cv) => cv.toDataURL('image/png'));
    const names = list.map((c) => c.name);
    try {
      const dir = await api.SaveImages(kind, kind === 'range' ? `${data.from}..${data.date}` : data.date, names, urls);
      if (dir) toast({ title: 'Картинки сохранены', body: dir });
    } catch (e) {
      if (window.go && window.go.app) { toast({ title: 'Не удалось сохранить', body: String(e.message || e), kind: 'streak' }); return; }
      // в браузере (веб-версия, разработка) — обычная загрузка файлов
      urls.forEach((u, i) => { const a = document.createElement('a'); a.href = u; a.download = `${data.title} ${data.date} ${String(i + 1).padStart(2, '0')} ${names[i]}.png`; a.click(); });
      toast({ title: 'Картинки скачаны' });
    }
  }

  drawDates();
  build();
  return dlg;
}
