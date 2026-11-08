// «Скопировать тему»: галочками выбрать, что взять из темы (бриф, уроки, их вопросы, вопросы темы), и скопировать одним текстом.
// Шапка темы — один раз, а не перед каждым уроком. Выбор частей запоминается, уроки — каждый раз все.
import { api } from '../api.js';
import { lsGet, lsSet } from '../state.js';
import { h, clear } from './dom.js';
import { openDialog } from './dialog.js';
import { toast } from './toast.js';

const PARTS = [
  ['brief', 'Тема и бриф', 'Строка «Тема …» и «зачем эта тема» — один раз в начале'],
  ['questions', 'Вопросы уроков', 'Вопросы из конспекта каждого урока'],
  ['know', 'Должен знать', 'Что нужно знать по уроку (из конспекта)'],
  ['arrows', 'Связи уроков', '«стоит на …», «см. также …»'],
  ['checks', 'Вопросы темы', '«Должен уметь ответить» — в конце'],
];
const DEF = { brief: true, questions: true, know: false, arrows: false, checks: false };

export function openThemeCopy(t) {
  const o = { ...DEF, ...lsGet('themecopy.parts', {}) };
  const pick = new Set(t.lessons.map((l) => l.id));
  const box = (on, onChange) => { const i = h('input', { type: 'checkbox', checked: on }); i.addEventListener('change', () => onChange(i.checked)); return i; };

  const parts = h('div', { class: 'as-tcopy__parts' }, PARTS.map(([k, label, hint]) =>
    h('label', { class: 'as-tcopy__opt', title: hint }, box(o[k], (v) => { o[k] = v; lsSet('themecopy.parts', o); upd(); }), label)));

  const lessons = h('div', { class: 'as-tcopy__lessons' });
  const drawLessons = () => {
    clear(lessons);
    for (const l of t.lessons) {
      const done = l.status === 'done';
      lessons.append(h('label', { class: 'as-tcopy__lesson' + (done ? ' is-done' : '') },
        box(pick.has(l.id), (v) => { if (v) pick.add(l.id); else pick.delete(l.id); upd(); }),
        h('span', { class: 'as-tcopy__lid' }, l.id),
        h('span', { class: 'as-tcopy__lt' }, l.title.replace(/★/g, '').trim()),
        l.kq ? h('span', { class: 'as-tcopy__lq', title: 'Вопросов в конспекте' }, `${l.kq} вопр.`) : null));
    }
  };
  const setAll = (fn) => { pick.clear(); t.lessons.filter(fn).forEach((l) => pick.add(l.id)); drawLessons(); upd(); };
  const quick = h('div', { class: 'as-tcopy__quick' },
    h('button', { class: 'as-recap__link', onclick: () => setAll(() => true) }, 'все'),
    h('button', { class: 'as-recap__link', onclick: () => setAll((l) => l.status !== 'done') }, 'не пройденные'),
    h('button', { class: 'as-recap__link', onclick: () => setAll(() => false) }, 'ни одного'));

  const pre = h('pre', { class: 'as-tcopy__pre' });
  const count = h('span', { class: 'as-tcopy__count' });
  const opts = (clip) => ({ ...o, lessons: t.lessons.map((l) => l.id).filter((id) => pick.has(id)), clip });
  let n = 0;
  async function upd() {
    const my = ++n;
    const txt = await api.CopyTheme(t.id, opts(false)).catch(() => '');
    if (my !== n) return;
    pre.textContent = txt || 'Ничего не выбрано.';
    pre.classList.toggle('is-empty', !txt);
    const lines = txt ? txt.split('\n').length : 0;
    count.textContent = txt ? `${lines} строк · ${txt.length} знаков` : '';
  }

  const body = h('div', { class: 'as-tcopy' },
    h('div', { class: 'as-tcopy__side' },
      h('div', { class: 'as-eyebrow' }, 'Что взять'), parts,
      h('div', { class: 'as-tcopy__head' }, h('div', { class: 'as-eyebrow' }, `Уроки · ${t.lessons.length}`), quick), lessons),
    h('div', { class: 'as-tcopy__view' }, h('div', { class: 'as-tcopy__head' }, h('div', { class: 'as-eyebrow' }, 'Что попадёт в буфер'), count), pre));

  const dlg = openDialog({
    title: `Скопировать тему ${t.id}`, body, cls: 'as-tcopy-dlg', focus: '.as-dialog__actions .as-btn--primary',
    actions: [
      { label: 'Закрыть', onClick: (d) => d.close() },
      { label: 'Скопировать', kind: 'primary', onClick: async (d) => {
        try {
          const txt = await api.CopyTheme(t.id, opts(true));
          if (!txt) { toast({ title: 'Нечего копировать — отметьте хотя бы что-нибудь', kind: 'streak' }); return; }
          if (navigator.clipboard && !(window.go && window.go.app)) navigator.clipboard.writeText(txt).catch(() => {}); // в Wails буфер ставит Go
          toast({ title: 'Скопировано', body: `Тема ${t.id} · ${txt.split('\n').length} строк` });
          d.close();
        } catch { toast({ title: 'Не удалось скопировать', kind: 'streak' }); }
      } },
    ],
  });
  drawLessons(); upd();
  return dlg;
}
