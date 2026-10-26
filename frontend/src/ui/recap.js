// Итоги: картинки за день, неделю, месяц или весь путь. Сторис 9:16 или квадрат 1:1, одна картинка или карусель.
// Обязательные карточки — сводка, пройденное и достижения; остальные выпадают случайно (или включаются вручную).
// Стиль, цвет, раскладка и поза гофера случайны на каждое открытие окна; в пределах окна не прыгают.
import { api } from '../api.js';
import { S } from '../state.js';
import { h, clear, pluralRu } from './dom.js';
import { openDialog } from './dialog.js';
import { toast } from './toast.js';
import { FORMATS, STYLES, STYLE_KEYS, EXTRA_CARDS, planCards, drawCard, rngFrom, pick } from './recap-draw.js';
import { openEditor } from './recap-editor.js';

const KINDS = [['day', 'День'], ['week', 'Неделя'], ['month', 'Месяц'], ['all', 'Весь путь']];
const TOGGLE_NEXT = { auto: 'on', on: 'off', off: 'auto' };
const TOGGLE_TEXT = { auto: 'случайно', on: 'всегда', off: 'нет' };

function loadPrefs() {
  const def = { format: 'story', mode: 'carousel', style: 'random', toggles: {}, custom: [] };
  try { return { ...def, ...JSON.parse(S.settings.recap_prefs || '{}') }; } catch { return def; }
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

  const preview = h('div', { class: 'as-recap__pages' });
  const info = h('div', { class: 'caption as-subtle' }, '');
  const dateInp = h('input', { class: 'as-input', type: 'date', 'aria-label': 'Дата', style: { width: '160px' } });
  dateInp.addEventListener('change', () => { date = dateInp.value; build(); });
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
  };
  drawToggles();

  const body = h('div', { class: 'as-recap__body' },
    h('div', { class: 'as-rowx' }, seg(KINDS, kind, (k) => { kind = k; build(); }), dateInp),
    h('div', { class: 'as-rowx' },
      seg([['story', '9:16'], ['square', '1:1']], p.format, (v) => { p.format = v; savePrefs(p); build(); }),
      seg([['carousel', 'Карусель'], ['one', 'Одна']], p.mode, (v) => { p.mode = v; savePrefs(p); build(); }),
      seg([['random', 'Случайно'], ...STYLE_KEYS.map((k) => [k, STYLES[k].label])], p.style, (v) => { p.style = v; savePrefs(p); build(); })),
    toggles,
    preview,
    h('div', { class: 'as-rowx as-rowx--between' }, info,
      h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: () => edit(null) }, '＋ Своя карточка')));

  const dlg = openDialog({
    title: 'Итоги', body, cls: 'as-recap', focus: '.as-dialog__actions .as-btn',
    actions: [
      { label: 'Закрыть', onClick: (d) => d.close() },
      { label: 'Сохранить картинки', kind: 'primary', onClick: save },
    ],
  });

  const styleNow = () => (p.style === 'random' ? randStyle : p.style);
  const accent = () => pick(rngFrom(seed + 5), STYLES[styleNow()].accents);

  async function edit(i) {
    const card = await openEditor({ card: i == null ? null : p.custom[i], format: p.format, acc: accent(), seed: seed + 11 + (i ?? p.custom.length) });
    if (!card) return;
    if (i == null) p.custom.push(card); else p.custom[i] = card;
    savePrefs(p); build();
  }

  async function build() {
    const my = ++buildNo;
    clear(preview);
    preview.append(h('div', { class: 'as-recap__loading' }, 'Собираю…'));
    try {
      data = await api.Recap(kind, date);
      if (!dateInp.value) dateInp.value = data.date;
      list = planCards(data, { mode: p.mode, toggles: p.toggles, seed, format: p.format });
      p.custom.forEach((c, i) => list.push({ key: 'custom', name: 'Своя карточка', card: c, ci: i }));
      const style = styleNow(), acc = accent();
      const out = [];
      for (let i = 0; i < list.length; i++) {
        out.push(await drawCard(list[i], data, { format: p.format, style, acc, seed, index: i, total: list.length, full: p.mode === 'one' }));
        if (my !== buildNo) return;
      }
      canvases = out;
      clear(preview);
      const [W, H] = FORMATS[p.format];
      out.forEach((cv, i) => {
        const img = h('img', { src: cv.toDataURL('image/png'), alt: list[i].name, class: 'as-recap__thumb', style: { aspectRatio: `${W} / ${H}` } });
        const c = list[i];
        preview.append(c.key !== 'custom' ? img : h('div', { class: 'as-recap__custom' }, img,
          h('div', { class: 'as-recap__customtools' },
            h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: () => edit(c.ci) }, 'Изменить'),
            h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => { p.custom.splice(c.ci, 1); savePrefs(p); build(); } }, 'Убрать'))));
      });
      const n = out.length;
      info.textContent = `${data.title} · ${data.period} · ${n} ${pluralRu(n, 'картинка', 'картинки', 'картинок')} · ${STYLES[style].label.toLowerCase()}`;
    } catch (e) { console.error(e); clear(preview); preview.append(h('div', { class: 'as-recap__loading' }, 'Не удалось собрать итоги.')); }
  }

  async function save() {
    if (!canvases.length || !data) return;
    const urls = canvases.map((cv) => cv.toDataURL('image/png'));
    const names = list.map((c) => c.name);
    try {
      const dir = await api.SaveImages(kind, data.date, names, urls);
      if (dir) toast({ title: 'Картинки сохранены', body: dir });
    } catch (e) {
      if (window.go && window.go.app) { toast({ title: 'Не удалось сохранить', body: String(e.message || e), kind: 'streak' }); return; }
      // в браузере (веб-версия, разработка) — обычная загрузка файлов
      urls.forEach((u, i) => { const a = document.createElement('a'); a.href = u; a.download = `${data.title} ${data.date} ${String(i + 1).padStart(2, '0')} ${names[i]}.png`; a.click(); });
      toast({ title: 'Картинки скачаны' });
    }
  }

  build();
  return dlg;
}
