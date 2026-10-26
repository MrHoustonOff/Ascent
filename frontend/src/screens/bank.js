import { api, win } from '../api.js';
import { S } from '../state.js';
import { h, clear, pluralRu } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openId, copy, setMarker } from '../actions.js';
import { checkbox } from './today.js';
import { markerMeta } from './path.js';
import { rich, gem, idTag, markerLabel } from '../ui/dom.js';

const f = { stage: 0, block: '', markers: false, unchecked: false, q: '', random: 0 };
let seed = 0;

export async function render(root, arg) {
  if (arg) { f.block = arg; f.stage = 0; }
  const data = await api.Bank({ stage: f.stage, block: f.block, markers: f.markers, unchecked: f.unchecked, q: f.q, random: f.random, seed });
  const stages = [...new Set(data.blocks.map((b) => b.done))].sort((a, b) => a - b); // Done=stage в NodeDTO банка

  const sel = (opts, val, onChange, label) => {
    const s = h('select', { class: 'as-select', 'aria-label': label, onchange: (e) => onChange(e.target.value) }, opts.map(([v, t]) => h('option', { value: v, selected: String(v) === String(val) }, t)));
    return s;
  };
  const search = h('input', { class: 'as-input', type: 'search', placeholder: 'Поиск по тексту', value: f.q, 'aria-label': 'Поиск по тексту', style: { flex: '1 1 200px', minWidth: '160px' } });
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter') { f.q = search.value; f.random = 0; redo(); } });
  search.addEventListener('change', () => { f.q = search.value; f.random = 0; redo(); });
  const toggle = (label, on, set) => h('label', { class: 'as-row', style: { fontSize: '14px', gap: '8px', whiteSpace: 'nowrap' } },
    h('button', { class: 'as-toggle', role: 'switch', 'aria-checked': String(on), 'aria-label': label, onclick: () => { set(!on); f.random = 0; redo(); } }), label);

  const total = data.items.length;
  const filtered = f.stage || f.block || f.markers || f.unchecked || f.q || f.random;

  root.append(
    h('header', { class: 'as-head' },
      h('div', { class: 'as-eyebrow' }, 'Банк вопросов'),
      h('h1', { class: 'large-title', style: { margin: '4px 0 0' } }, 'Вопросы с собесов'),
      h('p', { class: 'as-lead as-tnum' }, `${data.total} ${pluralRu(data.total, 'вопрос', 'вопроса', 'вопросов')}, из них ${data.markers} — маркеры. Маркеры закрывают блок.`)),
    h('section', { class: 'as-card', style: { gap: '12px' } },
      h('div', { class: 'as-rowx' },
        sel([[0, 'Все этапы'], ...stages.map((n) => [n, 'Этап ' + n])], f.stage, (v) => { f.stage = +v; f.block = ''; f.random = 0; redo(); }, 'Этап'),
        sel([['', 'Все блоки'], ...data.blocks.filter((b) => !f.stage || b.done === f.stage).map((b) => [b.id, b.id + ' ' + b.title.replace(/\.$/, '')])], f.block, (v) => { f.block = v; f.random = 0; redo(); }, 'Блок'),
        search),
      h('div', { class: 'as-rowx', style: { gap: '20px' } },
        toggle('Только маркеры', f.markers, (v) => (f.markers = v)),
        toggle('Только неотмеченные', f.unchecked, (v) => (f.unchecked = v))),
      h('div', { class: 'as-rowx as-rowx--between' },
        h('span', { class: 'callout as-muted as-tnum' }, f.random ? `Случайные ${total} маркеров` : `Показано: ${total}`),
        h('div', { class: 'as-actions' },
          filtered ? h('button', { class: 'as-btn as-btn--ghost', onclick: () => { Object.assign(f, { stage: 0, block: '', markers: false, unchecked: false, q: '', random: 0 }); redo(); } }, 'Сбросить фильтры') : null,
          h('button', { class: 'as-btn as-btn--secondary', title: 'Мини-квиз для ПРОГОН-7', onclick: async () => { f.random = 10; f.markers = true; seed = Date.now(); await redo(); const keys = [...document.querySelectorAll('[data-key]')].map((e) => e.dataset.key); api.CopyBank(keys).then(() => copyToast()); } }, 'Случайные 10 маркеров'),
          h('button', { class: 'as-btn as-btn--primary', disabled: !total, onclick: async () => { const keys = [...document.querySelectorAll('[data-key]')].map((e) => e.dataset.key); await api.CopyBank(keys); copyToast(); } }, icon('copy'), 'Скопировать для Гермеса')))));

  if (!data.items.length) root.append(h('div', { class: 'as-empty' }, 'По этому фильтру вопросов нет.'));
  else {
    let cur = null, list = null;
    for (const q of data.items) {
      if (q.block !== cur) {
        cur = q.block;
        root.append(h('div', { class: 'as-group-title' }, idTag(q.block, 'as-pill-id'), q.blockTitle.replace(/\.$/, '')));
        list = h('ul', { class: 'as-qlist as-card', style: { padding: '8px 12px 8px 4px', gap: '2px' } });
        root.append(list);
      }
      const box = q.marker ? checkbox(q.done, (v) => setMarker(q.block, q.n, v), 'Маркер отвечен', true) : h('span', { style: { width: '32px', height: '32px', display: 'grid', placeItems: 'center', color: 'var(--ink-subtle)', fontSize: '12px' }, title: 'Обычный вопрос, не маркер' }, '·');
      list.append(h('li', { class: 'as-q' + (q.done ? ' is-done' : '') + (q.marker ? ' is-marker' : ''), 'data-key': q.key },
        box,
        h('div', null,
          q.marker ? markerLabel(q.done) : null,
          h('div', { class: 'as-q__text' }, rich(q.text)),
          markerMeta(q))));
    }
  }

  root.append(h('section', { class: 'as-section', style: { marginTop: '8px' } },
    h('h2', { class: 'as-h2' }, 'Источники'),
    h('ul', { class: 'as-sourcelist' }, data.sources.map((s) => h('li', null,
      h('span', { class: 'as-badge', style: { justifySelf: 'start' } }, s.key),
      h('a', { class: 'as-a', onclick: () => win.openURL(s.url), title: s.url }, s.title)))),
    h('p', { class: 'caption as-subtle', style: { margin: 0 } }, 'Ссылки открываются во внешнем браузере. «типовой» — вопрос добавлен по устройству темы, «ловушка» — известная задача «что выведет код».')));
  return 'Банк вопросов';
}

import { toast } from '../ui/toast.js';
import { emit } from '../state.js';
const copyToast = () => toast({ title: 'Скопировано', body: 'Вопросы для Гермеса' });
const redo = () => emit();
