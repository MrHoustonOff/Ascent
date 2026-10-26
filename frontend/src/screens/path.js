import { api } from '../api.js';
import { S } from '../state.js';
import { h, rich, $$ } from '../ui/dom.js';
import { icon, stateDot } from '../ui/icons.js';
import { go, openId, copy, startLesson, completeLesson, undoLesson, setCheck, setChecksAll, setMarker } from '../actions.js';
import { checkbox, qRow } from './today.js';
import { openNote } from '../ui/note.js';

let keyHandler = null;

export async function render(root, arg) {
  if (/^stage-\d+$/.test(arg)) return stageScreen(root, +arg.slice(6));
  const dots = (arg.match(/\./g) || []).length;
  if (dots === 0) return blockScreen(root, arg);
  const themeId = dots >= 2 ? arg.replace(/\.\d+$/, '') : arg;
  const t = await api.Theme(themeId);
  return themeScreen(root, t, dots >= 2 ? arg : null);
}

const crumbs = (...items) => h('nav', { class: 'as-crumbs', 'aria-label': 'Где вы' },
  items.flatMap((it, i) => [i ? icon('chevR') : null, it.to ? h('a', { onclick: () => go(it.to) }, it.label) : h('span', null, it.label)]));

const stageShort = (t) => t.split(':')[0];

function progressBar(pct, label) {
  return h('div', { class: 'as-bar', role: 'progressbar', 'aria-valuenow': pct, 'aria-label': label }, h('i', { style: { width: pct + '%' } }));
}

function lessonRow(l, cur, onNote) {
  const done = l.status === 'done';
  const box = checkbox(done, () => (done ? undoLesson(l.id) : completeLesson(l.id)), done ? 'Урок пройден' : 'Отметить урок пройденным');
  box.setAttribute('aria-checked', done ? 'true' : l.status === 'doing' ? 'mixed' : 'false');
  if (l.status === 'doing') { box.replaceChildren(stateDot('doing')); }
  const row = h('div', { class: 'as-lesson' + (cur === l.id ? ' is-current' : ''), 'data-id': l.id, tabindex: '-1' },
    box,
    h('div', { class: 'as-lesson__main' },
      h('span', { class: 'as-lesson__id' }, l.id),
      h('span', { class: 'as-lesson__title' }, rich(l.title)),
      l.stars ? h('span', { class: 'as-stars', title: 'Как часто встречается на собеседованиях', 'aria-label': l.stars + ' из 3' }, '★'.repeat(l.stars)) : null,
      l.note ? h('span', { class: 'as-note-dot', title: 'Есть заметка' }) : null,
      l.doneAt ? h('span', { class: 'as-when' }, l.doneAt) : null),
    h('div', { class: 'as-lesson__actions' },
      h('button', { class: 'as-iconbtn', title: 'Скопировать для Гермеса (C)', 'aria-label': 'Скопировать для Гермеса', onclick: () => copy('lesson', l.id) }, icon('copy')),
      h('button', { class: 'as-iconbtn', title: 'Заметка', 'aria-label': 'Заметка', onclick: () => onNote(l) }, icon('note')),
      !done ? h('button', { class: 'as-btn as-btn--ghost as-btn--sm', title: 'Начать и скопировать', onclick: () => startLesson(l.id) }, l.status === 'doing' ? 'Продолжить' : 'Начать') : null),
    l.arrows.length ? h('div', { class: 'as-lesson__arrows' }, l.arrows.map((a) => h('div', { class: 'as-lesson__arrow' },
      h('b', null, a.kind + ': '),
      a.kind === 'стоит на' ? idLinks(a) : rich(a.text)))) : null);
  return row;
}

// «стоит на: GO-6.2, GO-6.3 …» — ID кликабельны
function idLinks(a) {
  const out = [];
  const re = /[A-ZА-ЯЁ]+-\d+(?:\.\d+){0,2}/g;
  let last = 0, m;
  while ((m = re.exec(a.text))) {
    if (m.index > last) out.push(...rich(a.text.slice(last, m.index)));
    const id = m[0];
    out.push(h('a', { class: 'as-a as-mono', style: { fontSize: '12px' }, onclick: () => openId(id) }, id));
    last = m.index + id.length;
  }
  if (last < a.text.length) out.push(...rich(a.text.slice(last)));
  return out;
}

async function themeScreen(root, t, focusLesson) {
  const cur = t.curLesson;
  root.append(
    h('header', { class: 'as-head' },
      crumbs({ label: 'Этап ' + t.stage, to: '#/path/stage-' + t.stage }, { label: t.block + ' ' + t.blockTitle.replace(/\.$/, ''), to: '#/path/' + t.block }, { label: t.id }),
      h('h1', { class: 'large-title', style: { margin: '6px 0 0' } }, rich(t.title)),
      closedBadge(t.closedAt, 'Тема закрыта')),
    t.brief.length ? h('section', { class: 'as-card' },
      h('div', { class: 'as-eyebrow' }, 'Зачем эта тема'),
      h('div', { class: 'body', style: { textWrap: 'pretty' } }, t.brief.map((p, i) => h('p', { style: { margin: i ? '8px 0 0' : '0' } }, rich(p))))) : null,
    h('div', { class: 'as-actions' },
      h('button', { class: 'as-btn as-btn--secondary', onclick: () => copy('theme_start', t.id) }, icon('copy'), 'Скопировать бриф и следующий урок'),
      h('button', { class: 'as-btn as-btn--ghost', onclick: () => copy('theme_check', t.id) }, 'Скопировать проверку темы')),
    h('section', { class: 'as-section' },
      h('div', { class: 'as-section__head' },
        h('h2', { class: 'as-h2' }, 'Уроки'),
        h('span', { class: 'callout as-muted as-tnum' }, `${t.done} из ${t.total}`)),
      h('div', { class: 'as-card', style: { padding: '8px', gap: '0' } }, t.lessons.map((l) => lessonRow(l, cur, (x) => openNote(x))))),
    h('section', { class: 'as-card' },
      h('div', { class: 'as-section__head' },
        h('h2', { class: 'as-h2' }, 'Должен уметь ответить'),
        h('span', { class: 'callout as-muted as-tnum' }, `${t.checksDone} из ${t.checks.length}`)),
      progressBar(Math.round(t.checksDone * 100 / (t.checks.length || 1)), 'Вопросы темы'),
      h('ul', { class: 'as-qlist', style: { marginTop: '4px' } }, t.checks.map((c) => qRow(c.text, c.done, (v) => setCheck(t.id, c.n, v), c.doneAt ? h('div', { class: 'as-q__meta' }, 'Отвечено · ' + c.doneAt) : null))),
      t.checksDone < t.checks.length ? h('div', { class: 'as-actions' }, h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => setChecksAll(t.id, true) }, 'Отметить все')) : null),
    t.nextTheme ? h('div', { class: 'as-rowx', style: { justifyContent: 'space-between' } },
      t.prevTheme ? h('button', { class: 'as-btn as-btn--ghost', onclick: () => go('#/path/' + t.prevTheme) }, icon('chevL'), 'Назад') : h('span'),
      h('button', { class: 'as-btn as-btn--ghost', onclick: () => go('#/path/' + t.nextTheme), title: t.nextThemeTitle }, 'Следующая тема', icon('arrowR'))) : null);

  if (focusLesson) requestAnimationFrame(() => {
    const el = root.querySelector(`.as-lesson[data-id="${CSS.escape(focusLesson)}"]`);
    if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('is-flash'); }
  });
  hotkeys(t);
  return `Путь · ${t.id} ${t.title.replace(/`/g, '')}`;
}

function hotkeys(t) {
  if (keyHandler) document.removeEventListener('as-key', keyHandler);
  keyHandler = (ev) => {
    if (S.route.name !== 'path') return;
    const e = ev.detail;
    const items = $$('.as-lesson .as-check, .as-qlist .as-check');
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]) && (items[i + 1] || items[0]).focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const p = items[i - 1] || items[items.length - 1]; p && p.focus(); }
    else if ((e.key === 'c' || e.key === 'C') && document.activeElement.closest('.as-lesson')) copy('lesson', document.activeElement.closest('.as-lesson').dataset.id);
  };
  document.addEventListener('as-key', keyHandler);
}

async function blockScreen(root, id) {
  const b = await api.Block(id);
  const isRun = b.themes.length === 0 && b.run;
  root.append(
    h('header', { class: 'as-head' },
      crumbs({ label: 'Этап ' + b.stage, to: '#/path/stage-' + b.stage }, { label: b.id }),
      h('h1', { class: 'large-title', style: { margin: '6px 0 0' } }, b.title.replace(/\.$/, '')),
      closedBadge(b.closedAt, 'Блок закрыт')),
    b.why ? h('section', { class: 'as-card' }, h('div', { class: 'as-eyebrow' }, 'Зачем этот блок'), h('div', { class: 'body', style: { textWrap: 'pretty' } }, rich(b.why))) : null,
    b.deps.length ? h('section', { class: 'as-section' },
      h('h2', { class: 'as-h2' }, 'Стоит на'),
      h('div', { class: 'as-rowx' }, b.deps.map((d) =>
        h('button', { class: 'as-btn as-btn--secondary as-btn--sm', title: d.title, onclick: () => openId(d.id) }, stateDot(d.state), h('span', { class: 'as-mono', style: { fontWeight: 500 } }, d.id))))) : null,
    isRun ? h('section', { class: 'as-card' }, h('div', { class: 'as-eyebrow' }, 'Прогон'), h('div', { class: 'body' }, rich(b.run.title)),
      h('div', { class: 'as-actions' }, h('button', { class: 'as-btn as-btn--secondary', onclick: () => copy('stage_run', String(b.stage)) }, icon('copy'), 'Скопировать прогон для Гермеса'),
        h('button', { class: 'as-btn as-btn--ghost', onclick: () => (b.run.status === 'done' ? undoLesson(b.run.id) : completeLesson(b.run.id)) }, b.run.status === 'done' ? 'Снять отметку' : 'Пройдено'))) : null,
    b.themes.length ? h('section', { class: 'as-section' },
      h('div', { class: 'as-section__head' }, h('h2', { class: 'as-h2' }, 'Темы'), h('span', { class: 'callout as-muted as-tnum' }, `${b.done} из ${b.total} уроков`)),
      h('div', { class: 'as-card', style: { padding: '8px', gap: '0' } }, b.themes.map((t) =>
        h('div', { class: 'as-lesson', style: { cursor: 'default', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center' }, onclick: () => go('#/path/' + t.id) },
          h('span', { style: { display: 'grid', placeItems: 'center', width: '32px' } }, stateDot(t.state)),
          h('div', { class: 'as-lesson__main' },
            h('div', { class: 'as-lesson__title' }, h('span', { class: 'as-lesson__id' }, t.id), rich(t.title), t.checkPending ? h('span', { class: 'as-badge as-badge--accent', style: { marginLeft: '8px' } }, 'Проверка темы') : null),
            h('div', { style: { marginTop: '6px', maxWidth: '280px' } }, progressBar(t.pct, 'Прогресс темы'))),
          h('span', { class: 'callout as-muted as-tnum', style: { textAlign: 'right' } }, t.done + '/' + t.total, t.closedAt ? h('div', { class: 'caption as-subtle' }, t.closedAt === 'ранее' ? 'закрыта ранее' : 'закрыта ' + t.closedAt) : null))))) : null,
    b.markers.length ? h('section', { class: 'as-card' },
      h('div', { class: 'as-section__head' }, h('h2', { class: 'as-h2' }, 'Маркеры ◆ блока'),
        h('span', { class: 'callout as-muted as-tnum' }, `${b.markers.filter((m) => m.done).length} из ${b.markers.length}`)),
      h('p', { class: 'as-p-callout' }, 'Вопросы с собесов. Ответьте на все вслух, без конспекта — и блок закрыт.'),
      h('ul', { class: 'as-qlist' }, b.markers.map((m) => qRow(m.text, m.done, (v) => setMarker(m.block, m.n, v), markerMeta(m)))),
      h('div', { class: 'as-actions' }, h('button', { class: 'as-btn as-btn--secondary', onclick: () => copy('block_markers', b.id) }, icon('copy'), 'Скопировать маркеры для Гермеса'))) : null);
  return `Путь · ${b.id} ${b.title.replace(/\.$/, '')}`;
}

export function closedBadge(when, label) {
  if (!when) return null;
  return h('div', { style: { marginTop: '10px' } }, h('span', { class: 'as-badge as-badge--success' },
    h('span', { html: '<svg class="as-glyph" viewBox="0 0 10 10"><path d="M1.8 5.4l2.2 2.2 4.4-4.8"/></svg>' }),
    when === 'ранее' ? label + ' ранее' : label + ' · ' + when));
}

export function markerMeta(m) {
  return h('div', { class: 'as-q__meta' },
    m.doneAt ? h('span', null, 'Отвечено · ' + m.doneAt) : null,
    m.lessons.length ? ['Уроки: ', m.lessons.map((l) => h('a', { class: 'as-a as-mono', title: l.title, onclick: () => openId(l.id) }, l.id))] : null,
    m.sources.map((s) => sourceBadge(s)));
}

export function sourceBadge(s) {
  const label = s.kind === 'typical' ? 'типовой' : s.kind === 'trap' ? 'ловушка' : s.key;
  return h('span', { class: 'as-badge' + (s.kind === 'trap' ? ' as-badge--streak' : ''), title: s.title || label }, label);
}

async function stageScreen(root, num) {
  const s = await api.Stage(num);
  root.append(
    h('header', { class: 'as-head' },
      crumbs({ label: 'Путь', to: '#/path/stage-1' }, { label: 'Этап ' + s.num }),
      h('h1', { class: 'large-title', style: { margin: '6px 0 0' } }, s.title),
      h('p', { class: 'as-lead as-tnum' }, `${s.done} из ${s.total} уроков · ${s.pct} %`),
      closedBadge(s.closedAt, 'Этап закрыт')),
    s.intro.length ? h('section', { class: 'as-card' }, h('div', { class: 'as-eyebrow' }, 'О чём этап'),
      h('div', { class: 'body', style: { textWrap: 'pretty' } }, s.intro.filter((x) => x.trim() && !/^(Порядок блоков|Как читать)/.test(x.replace(/\*/g, ''))).map((p, i) => h('p', { style: { margin: i ? '8px 0 0' : '0' } }, rich(p.replace(/\*\*/g, '')))))) : null,
    s.order ? h('section', { class: 'as-section' }, h('h2', { class: 'as-h2' }, 'Порядок блоков'), h('p', { class: 'as-p-callout as-mono', style: { fontSize: '13px', overflowWrap: 'anywhere' } }, s.order)) : null,
    h('section', { class: 'as-section' },
      h('h2', { class: 'as-h2' }, 'Блоки'),
      h('div', { class: 'as-card', style: { padding: '8px', gap: '0' } }, s.blocks.map((b) =>
        h('div', { class: 'as-lesson', style: { alignItems: 'center' }, onclick: () => go('#/path/' + b.id) },
          h('span', { style: { display: 'grid', placeItems: 'center', width: '32px' } }, stateDot(b.state)),
          h('div', { class: 'as-lesson__main' },
            h('div', { class: 'as-lesson__title' }, h('span', { class: 'as-lesson__id' }, b.id), b.title.replace(/\.$/, '')),
            h('div', { style: { marginTop: '6px', maxWidth: '280px' } }, progressBar(b.pct, 'Прогресс блока'))),
          h('span', { class: 'callout as-muted as-tnum', style: { textAlign: 'right' } }, b.done + '/' + b.total, b.closedAt ? h('div', { class: 'caption as-subtle' }, b.closedAt === 'ранее' ? 'закрыт ранее' : 'закрыт ' + b.closedAt) : null))))));
  return `Путь · Этап ${s.num}`;
}
