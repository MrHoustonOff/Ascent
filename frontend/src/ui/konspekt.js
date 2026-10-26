// Конспект урока: вкладки «Вопросы / Гуглить / Должен знать» внутри строки урока.
// Отметки вопросов — помощь в учёбе: на закрытие темы и темп они не влияют.
import { h, rich, clear } from './dom.js';
import { icon, stateDot } from './icons.js';
import { api, win } from '../api.js';
import { copy, openId } from '../actions.js';
import { toastError } from './toast.js';

const cache = new Map(); // id → KonspektDTO: строка не мигает при перерисовке экрана
const opened = new Map(); // id → раскрыт ли (по умолчанию раскрыт текущий урок)
const TABS = [['qs', 'Вопросы'], ['google', 'Гуглить'], ['know', 'Должен знать']];
const CHK = '<svg viewBox="0 0 10 10"><path d="M1.8 5.4l2.2 2.2 4.4-4.8"/></svg>';

function loadTab() { try { return localStorage.getItem('as-ktab') || 'qs'; } catch { return 'qs'; } }
function saveTab(t) { try { localStorage.setItem('as-ktab', t); } catch { /* без памяти вкладки */ } }

export const isOpen = (id, cur) => (opened.has(id) ? opened.get(id) : id === cur);
export const setOpen = (id, v) => opened.set(id, v);

// Тонкая полоска прогресса вопросов под заголовком урока.
export function kbar(done, total) {
  if (!total) return null;
  const el = h('span', { class: 'as-kbar', title: `Вопросы конспекта: ${done} из ${total}`, 'aria-label': `Вопросы конспекта: ${done} из ${total}` },
    h('span', { class: 'as-kbar__track' }, h('i', { style: { width: Math.round(done * 100 / total) + '%' } })),
    h('span', { class: 'as-kbar__num as-tnum' }, `${done}/${total}`));
  return el;
}

// Панель конспекта. onCount(done, total) — чтобы строка обновила свою полоску без перерисовки экрана.
export function konspektPanel(id, { onCount, fixedTab } = {}) {
  const box = h('div', { class: 'as-kx' });
  let tab = fixedTab || loadTab();
  let k = cache.get(id);
  const draw = () => {
    clear(box);
    if (!k) { box.append(h('div', { class: 'as-kx__loading caption as-subtle' }, 'Загружаю конспект…')); return; }
    if (!k.qs.length && !k.know.length) { box.append(h('div', { class: 'caption as-subtle' }, 'Для этого урока конспекта нет.')); return; }
    const isRun = k.qs.some((q) => q.refs.length);
    const tabs = isRun ? [['qs', 'Вопросы'], ['know', 'Должен знать']] : TABS;
    if (!tabs.some(([t]) => t === tab)) tab = 'qs';
    const seg = h('div', { class: 'as-seg', role: 'tablist', 'aria-label': 'Конспект урока' },
      tabs.map(([t, label]) => h('button', {
        class: 'as-seg__tab' + (t === tab ? ' is-on' : ''), role: 'tab', 'aria-selected': String(t === tab), tabindex: t === tab ? '0' : '-1',
        onclick: () => { tab = t; if (!fixedTab) saveTab(t); draw(); box.querySelector('.as-seg__tab.is-on')?.focus(); },
      }, label, t === 'qs' ? h('span', { class: 'as-seg__num as-tnum' }, ` · ${k.done}/${k.qs.length}`) : null)));
    seg.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); e.stopPropagation();
      const i = tabs.findIndex(([t]) => t === tab), j = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      seg.children[j].click();
    });
    const copyBtn = h('button', {
      class: 'as-btn as-btn--ghost as-btn--sm as-kx__copy', title: tab === 'qs' ? 'Скопировать вопросы' : tab === 'google' ? 'Скопировать все запросы' : 'Скопировать конспект целиком',
      onclick: () => (tab === 'qs' ? copy('konspekt_qs', id) : tab === 'google' ? copy('text', allQueries(k).join('\n')) : copy('konspekt', id)),
    }, icon('copy'), tab === 'know' ? 'Весь конспект' : 'Копировать');
    box.append(h('div', { class: 'as-kx__head' }, seg, copyBtn),
      tab === 'qs' ? questions(id, k, draw, onCount) : tab === 'google' ? google(k) : know(k));
  };
  draw();
  api.Konspekt(id).then((x) => { k = x; cache.set(id, x); draw(); onCount && onCount(x.done, x.qs.length); }).catch(() => { if (!k) { clear(box); box.append(h('div', { class: 'caption as-subtle' }, 'Для этого урока конспекта нет.')); } });
  return box;
}

const allQueries = (k) => [...k.qs.map((q) => q.query).filter(Boolean), ...k.google];

function questions(id, k, redraw, onCount) {
  return h('ul', { class: 'as-kq' }, k.qs.map((q) => {
    const toggle = async () => {
      const v = !q.done;
      q.done = v; k.done += v ? 1 : -1; redraw(); onCount && onCount(k.done, k.qs.length);
      try { await api.SetKQ(id, q.n, v); } catch { q.done = !v; k.done += v ? -1 : 1; redraw(); onCount && onCount(k.done, k.qs.length); toastError(); }
    };
    const cb = h('button', { class: 'as-kbox' + (q.done ? ' is-on' : ''), role: 'checkbox', 'aria-checked': String(q.done), 'aria-label': 'Ответ найден', html: q.done ? CHK : '', onclick: toggle });
    cb.addEventListener('keydown', (e) => { if (e.key === ' ') { e.preventDefault(); toggle(); } });
    return h('li', { class: 'as-kq__item' + (q.done ? ' is-on' : '') }, cb,
      h('div', { class: 'as-kq__body' },
        h('div', { class: 'as-kq__text' }, rich(q.text)),
        q.refs.length ? h('div', { class: 'as-kq__refs' }, q.refs.map((r) => linkChip(r))) : null,
        q.query ? h('div', { class: 'as-kq__tools' }, queryChip(q.query, true)) : null));
  }));
}

function google(k) {
  const byQ = k.qs.filter((q) => q.query);
  return h('div', { class: 'as-kg' },
    byQ.length ? h('div', { class: 'as-kg__group' }, h('div', { class: 'as-ksec' }, 'К вопросам'),
      h('ol', { class: 'as-kg__list' }, byQ.map((q) => h('li', { class: 'as-kg__row' }, h('span', { class: 'as-kg__q' }, rich(q.text)), queryChip(q.query))))) : null,
    k.google.length ? h('div', { class: 'as-kg__group' }, h('div', { class: 'as-ksec' }, 'Общие запросы'),
      h('div', { class: 'as-chips' }, k.google.map((g) => queryChip(g)))) : null,
    h('div', { class: 'caption as-subtle' }, 'Щелчок по запросу копирует его, стрелка открывает поиск в браузере.'));
}

function queryChip(q, compact) {
  const en = !/[а-яё]/i.test(q);
  return h('span', { class: 'as-qchip' + (en ? ' is-en' : '') + (compact ? ' is-compact' : '') },
    h('button', { class: 'as-qchip__copy', title: 'Скопировать запрос', onclick: (e) => { e.stopPropagation(); copy('text', q); } }, icon('search'), h('span', { class: 'as-qchip__text' }, q)),
    h('button', { class: 'as-qchip__open', title: 'Открыть поиск в браузере', 'aria-label': 'Открыть поиск в браузере', onclick: (e) => { e.stopPropagation(); win.openURL('https://www.google.com/search?q=' + encodeURIComponent(q)); } }, icon('external')));
}

function know(k) {
  return h('div', { class: 'as-know' },
    h('div', { class: 'as-know__text' }, k.know.map((p) => h('p', null, rich(p)))),
    k.terms.length ? h('div', { class: 'as-know__terms' },
      h('div', { class: 'as-ksec' }, 'Термины'),
      h('dl', { class: 'as-kterms' }, k.terms.flatMap((t) => [
        h('dt', null, rich(t.name), t.new ? h('span', { class: 'as-knew', title: 'Новый термин словаря: впервые встречается здесь' }, 'новое') : null),
        h('dd', null, rich(t.desc))]))) : null,
    k.border || k.later.length ? h('div', { class: 'as-kedge' },
      k.border ? h('div', { class: 'as-kedge__row' }, h('span', { class: 'as-kedge__label' }, 'Граница'),
        h('div', { class: 'as-kedge__body' }, linkify(k.border, k.borderLinks))) : null,
      k.later.length ? h('div', { class: 'as-kedge__row' }, h('span', { class: 'as-kedge__label' }, 'Позже'),
        h('ul', { class: 'as-klater' }, k.later.map((x) => h('li', null,
          h('span', { class: 'as-klater__text' }, rich(cap(x.text))),
          x.links.length ? h('span', { class: 'as-klater__links' }, x.links.map((l) => linkChip(l))) : null)))) : null) : null);
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ID в тексте границы — ссылки с относительным положением в подсказке.
function linkify(text, links) {
  const by = new Map(links.map((l) => [l.id, l]));
  const out = [], re = /[A-ZА-ЯЁ]+-\d+(?:\.\d+){0,2}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(...rich(text.slice(last, m.index)));
    const l = by.get(m[0]) || { id: m[0], title: '', rel: '' };
    out.push(h('a', { class: 'as-a as-mono as-klink', title: [l.title, l.rel].filter(Boolean).join(' · '), onclick: () => openId(l.id) }, l.id));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...rich(text.slice(last)));
  return out;
}

function linkChip(l) {
  return h('button', { class: 'as-kref', title: l.title ? l.title.replace(/`/g, '') : l.id, onclick: (e) => { e.stopPropagation(); openId(l.id); } },
    l.status ? stateDot(l.status) : null,
    h('span', { class: 'as-kref__id' }, l.id),
    l.rel ? h('span', { class: 'as-kref__rel' }, l.rel) : null);
}
