// Комментарии к уроку или теме: несколько на цель, у каждого — дата и отметка «сделано» (сделанные — серые).
// Общий список для панели урока, окна комментариев к темам в итогах и страницы «Комментарии».
// В тексте — мини-markdown: `код`, **жирный**, *курсив*. Старые заметки перенесены с подписью «раньше».
import { h, clear } from './dom.js';
import { api } from '../api.js';
import { toastError } from './toast.js';

const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
// «2 ноя», «2 ноя 2025» для прошлых лет; пусто — «раньше»
export function commentDate(c) {
  if (!c.created) return 'раньше';
  const [y, m, d] = c.created.split('-').map(Number);
  return `${d} ${MON[m - 1]}` + (y !== new Date().getFullYear() ? ` ${y}` : '');
}

// мини-markdown → узлы (без innerHTML)
export function mdNodes(text) {
  const out = []; const re = /`([^`]+)`|\*\*(.+?)\*\*|\*(.+?)\*/g; let last = 0, m;
  const plain = (s) => s.split('\n').forEach((p, i) => { if (i) out.push(h('br')); if (p) out.push(p); });
  while ((m = re.exec(text))) {
    if (m.index > last) plain(text.slice(last, m.index));
    if (m[1] != null) out.push(h('code', { class: 'code-sm' }, m[1]));
    else if (m[2] != null) out.push(h('b', null, m[2]));
    else out.push(h('i', null, m[3]));
    last = re.lastIndex;
  }
  if (last < text.length) plain(text.slice(last));
  return out;
}

const CHK = '<svg viewBox="0 0 10 10"><path d="M1.8 5.4l2.2 2.2 4.4-4.8"/></svg>';

// одна строка комментария: галочка, текст, дата, изменить, удалить. meta — узел под текстом (тема на странице).
export function commentRow(c, { onChange, meta } = {}) {
  const row = h('div', { class: 'as-cm' + (c.done ? ' is-done' : '') });
  const draw = () => {
    clear(row); row.className = 'as-cm' + (c.done ? ' is-done' : '');
    const box = h('button', { class: 'as-kbox' + (c.done ? ' is-on' : ''), role: 'checkbox', 'aria-checked': String(c.done), 'aria-label': 'Сделано', title: c.done ? 'Сделано — снять отметку' : 'Отметить «сделано»', html: c.done ? CHK : '',
      onclick: async () => { c.done = !c.done; draw(); try { await api.SetCommentDone(c.id, c.done); onChange && onChange(c); } catch { c.done = !c.done; draw(); toastError(); } } });
    row.append(box,
      h('div', { class: 'as-cm__body' }, h('div', { class: 'as-cm__text' }, mdNodes(c.text)), meta || null),
      h('span', { class: 'as-cm__date', title: c.created ? c.created : 'Перенесён из старых заметок' }, commentDate(c)),
      h('button', { class: 'as-iconbtn as-cm__btn', title: 'Изменить', 'aria-label': 'Изменить', onclick: edit }, '✎'),
      h('button', { class: 'as-iconbtn as-cm__btn', title: 'Удалить', 'aria-label': 'Удалить', onclick: del }, '✕'));
  };
  const edit = () => {
    clear(row); row.className = 'as-cm is-edit';
    const ta = h('textarea', { class: 'as-textarea as-cm__ta', rows: 2, 'aria-label': 'Текст комментария' }); ta.value = c.text;
    const save = async () => {
      const v = ta.value.trim();
      try { await api.UpdateComment(c.id, v); } catch { toastError(); return; }
      if (!v) { row.remove(); onChange && onChange(null); return; }
      c.text = v; draw(); onChange && onChange(c);
    };
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); draw(); } });
    row.append(ta, h('div', { class: 'as-cm__editbar' },
      h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: draw }, 'Отмена'),
      h('button', { class: 'as-btn as-btn--primary as-btn--sm', onclick: save }, 'Сохранить')));
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  };
  const del = async () => { try { await api.DeleteComment(c.id); row.remove(); onChange && onChange(null); } catch { toastError(); } };
  draw();
  return row;
}

// список комментариев цели и поле «новый комментарий». Enter — добавить, Shift+Enter — новая строка.
export function commentList(target, { onChange, autofocus } = {}) {
  const box = h('div', { class: 'as-cmlist' });
  const list = h('div', { class: 'as-cmlist__items' });
  const ta = h('textarea', { class: 'as-textarea as-cm__new', rows: 1, placeholder: 'Новый комментарий…', title: 'Enter — добавить, Shift+Enter — новая строка', 'aria-label': 'Новый комментарий' });
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight + 2) + 'px'; };
  const add = async () => {
    const v = ta.value.trim(); if (!v) return;
    try { const c = await api.AddComment(target, v); list.append(commentRow(c, { onChange })); ta.value = ''; grow(); onChange && onChange(c); } catch { toastError(); }
  };
  ta.addEventListener('input', grow);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); } });
  box.append(list, h('div', { class: 'as-cm__add' }, ta, h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: add }, '＋ Добавить')));
  api.CommentsFor(target).then((cs) => { cs.forEach((c) => list.append(commentRow(c, { onChange }))); if (autofocus) ta.focus(); }).catch(toastError);
  return box;
}
