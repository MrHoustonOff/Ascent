import { api } from '../api.js';
import { S } from '../state.js';
import { h, rich, countUp, gem, idTag, markerLabel, starChip } from '../ui/dom.js';
import { icon, stateDot, FLAME, CHECK_GLYPH, DASH_GLYPH } from '../ui/icons.js';
import { openRecap } from '../ui/recap.js';
import { konspektPanel, kbar, isOpen, setOpen } from '../ui/konspekt.js';
import { go, openId, copy, startLesson, completeLesson, setCheck, setChecksAll, setMarker, rest, refresh } from '../actions.js';

let keyHandler = null;

export async function render(root) {
  const [t, n] = await Promise.all([api.Today(), api.Next(S.skipPending)]);
  const hero = heroCard(n, t);
  root.append(
    h('header', { class: 'as-head' },
      h('div', { class: 'as-rowx as-rowx--between' }, h('div', { class: 'as-eyebrow' }, t.eyebrow),
        t.fresh ? null : h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: openRecap, title: 'Картинки с итогами дня или недели' }, 'Итоги дня')),
      h('h1', { class: 'large-title', style: { margin: '4px 0 0' } }, t.greeting),
      h('p', { class: 'as-lead' }, t.status),
      t.motd && !t.fresh ? h('p', { class: 'as-motd' }, t.motd) : null),
    hero.el,
    h('div', { class: 'as-grid2' }, streakCard({ ...t.streak, fresh: t.fresh }), ringCard(t.ring)),
    forecastCard(t.forecast),
    t.recent.length ? recentCard(t.recent) : null);

  if (keyHandler) document.removeEventListener('as-key', keyHandler);
  keyHandler = (ev) => {
    const e = ev.detail;
    if (S.route.name !== 'today') return;
    if (e.key === 'Enter' && (document.activeElement === document.body || document.activeElement.id === 'main') && hero.primary) { e.preventDefault(); hero.primary.click(); }
    else if ((e.key === 'c' || e.key === 'C' || e.key === 'с' || e.key === 'С') && n.lesson) copy('lesson', n.lesson.id);
    else if ((e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') && n.lesson && n.card.startsWith('lesson')) completeLesson(n.lesson.id);
  };
  document.addEventListener('as-key', keyHandler);
  return 'Сегодня';
}

const btn = (label, kind, onClick, extra = {}) => h('button', { class: 'as-btn as-btn--' + kind + (extra.lg ? ' as-btn--lg' : ''), title: extra.title, onclick: onClick }, extra.icon ? icon(extra.icon) : null, label);

function themeLine(n) {
  if (!n.theme) return null;
  return h('div', { class: 'caption as-muted as-clamp1' }, idTag(n.lesson.id, 'as-mono'), ' · ' + n.theme.title);
}

function arrowsList(l) {
  if (!l.arrows.length) return null;
  return h('div', { class: 'as-lesson__arrows', style: { gridColumn: 'auto' } }, l.arrows.map((a) =>
    h('div', { class: 'as-lesson__arrow' }, h('b', null, '↳ ' + a.kind + ': '), a.kind === 'стоит на' ? idLinksT(a) : rich(a.text))));
}

function themeBar(n) {
  if (!n.theme) return null;
  return h('div', { class: 'as-bar', role: 'progressbar', 'aria-valuenow': n.theme.pct, 'aria-label': 'Прогресс темы' }, h('i', { style: { width: n.theme.pct + '%' } }));
}

// Конспект текущего урока на главной: свёрнут, пока урок не начат.
function konspektFold(l, openByDefault) {
  if (!l.kq) return null;
  const wrap = h('div', { class: 'as-kfold' });
  let bar = kbar(l.kqDone, l.kq), panel = null;
  const onCount = (d, t) => { const nb = kbar(d, t); bar.replaceWith(nb); bar = nb; };
  const head = h('button', { class: 'as-kfold__head', 'aria-expanded': 'false', onclick: () => set(!wrap.classList.contains('is-open')) },
    icon('chevD'), h('span', { class: 'as-kfold__label' }, 'Конспект урока'), bar);
  const set = (v) => {
    setOpen(l.id, v); wrap.classList.toggle('is-open', v); head.setAttribute('aria-expanded', String(v));
    if (v && !panel) { panel = konspektPanel(l.id, { onCount }); wrap.append(panel); } else if (!v && panel) { panel.remove(); panel = null; }
  };
  wrap.append(head);
  if (isOpen(l.id, openByDefault ? l.id : '')) set(true);
  return wrap;
}

function heroCard(n, t) {
  const card = h('section', { class: 'as-card as-card--lg', 'aria-live': 'polite' });
  let primary = null;
  const add = (...x) => card.append(...x.filter(Boolean));
  const mk = (label, onClick, opts) => (primary = btn(label, 'primary', onClick, { lg: true, ...opts }));
  switch (n.card) {
    case 'lesson_todo': {
      const l = n.lesson;
      add(h('div', { class: 'as-eyebrow' }, 'Продолжить'), themeLine(n),
        h('h2', { class: 'as-h-title1' }, rich(l.title)), starChip(l.stars), arrowsList(l), themeBar(n),
        h('div', { class: 'as-rowx as-rowx--between' },
          h('span', { class: 'as-p-callout as-tnum' }, n.theme ? `${n.theme.done} из ${n.theme.total} в теме` : ''),
          h('div', { class: 'as-actions' },
            btn('Открыть тему', 'ghost', () => openId(l.theme || l.block)),
            btn('Пройдено', 'secondary', () => completeLesson(l.id)),
            mk('Начать урок', () => startLesson(l.id), { icon: 'play', title: 'Начать урок (Enter)' }))), konspektFold(l, false));
      break;
    }
    case 'lesson_doing': {
      const l = n.lesson;
      add(h('div', { class: 'as-eyebrow' }, 'Вы остановились на'), themeLine(n),
        h('h2', { class: 'as-h-title1' }, rich(l.title)), arrowsList(l), themeBar(n),
        h('div', { class: 'as-rowx as-rowx--between' },
          h('span', { class: 'as-p-callout as-tnum' }, n.theme ? `${n.theme.done} из ${n.theme.total} в теме` : ''),
          h('div', { class: 'as-actions' },
            btn('Открыть тему', 'ghost', () => openId(l.theme || l.block)),
            btn('Скопировать ещё раз', 'secondary', () => copy('lesson', l.id)),
            mk('Урок пройден', () => completeLesson(l.id), { title: 'Урок пройден (Enter)' }))), konspektFold(l, true));
      break;
    }
    case 'theme_check': {
      const th = n.theme;
      add(h('div', { class: 'as-eyebrow' }, 'Проверка темы'), h('h2', { class: 'as-h-title1' }, th.title),
        h('p', { class: 'as-p-callout' }, 'Ответьте вслух на вопросы темы — и она закрыта'),
        h('ul', { class: 'as-qlist' }, n.checks.map((c) => qRow(c.text, c.done, (v) => setCheck(th.id, c.n, v)))),
        h('div', { class: 'as-actions', style: { justifyContent: 'flex-end' } },
          btn('Следующий урок', 'ghost', () => { S.skipPending = true; refresh(); }),
          btn('Отметить все', 'secondary', () => setChecksAll(th.id, true)),
          mk('Скопировать проверку для Гермеса', () => copy('theme_check', th.id), { icon: 'copy', title: 'Скопировать проверку (Enter)' })));
      break;
    }
    case 'block_close': {
      add(h('div', { class: 'as-eyebrow' }, 'Закрыть блок'), h('h2', { class: 'as-h-title1' }, n.blockTitle),
        h('p', { class: 'as-p-callout' }, 'Вопросы с собесов по этому блоку'),
        markerList(n.markers),
        h('div', { class: 'as-actions', style: { justifyContent: 'flex-end' } },
          btn('Следующий урок', 'ghost', () => { S.skipPending = true; refresh(); }),
          mk('Скопировать маркеры', () => copy('block_markers', n.block), { icon: 'copy' })));
      break;
    }
    case 'stage_run': {
      add(h('div', { class: 'as-eyebrow' }, 'Прогон этапа'), h('h2', { class: 'as-h-title1' }, 'Прогон этапа ' + n.stageNum),
        h('p', { class: 'as-p-callout' }, rich(n.lesson.title)),
        n.markers.length ? h('details', { class: 'as-details' }, h('summary', null, `Маркеры этапа · ${n.markers.length}`), markerList(n.markers)) : null,
        h('div', { class: 'as-actions', style: { justifyContent: 'flex-end' } },
          btn('Пройдено', 'secondary', () => completeLesson(n.lesson.id)),
          mk('Скопировать прогон для Гермеса', () => copy('stage_run', String(n.stageNum)), { icon: 'copy' })));
      break;
    }
    case 'project': {
      add(h('div', { class: 'as-eyebrow' }, 'Финальный проект'), h('h2', { class: 'as-h-title1' }, 'Проект А или Б'),
        h('p', { class: 'as-p-callout' }, 'Два технических задания на выбор. Проект А можно начинать уже после ПРОГОН-5, проекту Б нужны блоки про Kafka.'),
        h('div', { class: 'as-actions', style: { justifyContent: 'flex-end' } },
          btn('Открыть ТЗ Б', 'ghost', () => go('#/docs/99')),
          btn('Пройдено', 'secondary', () => completeLesson(n.lesson.id)),
          mk('Открыть ТЗ А', () => go('#/docs/98'))));
      break;
    }
    default: {
      add(h('div', { class: 'as-eyebrow' }, 'Путь'), h('h2', { class: 'as-h-title1' }, 'Путь пройден'),
        h('p', { class: 'as-p-callout' }, `${n.total} ${n.total % 10 === 1 && n.total % 100 !== 11 ? 'урок' : 'уроков'}. Дальше — факультатив «К мидлу».`));
    }
  }
  return { el: card, primary };
}

export function qRow(text, done, onToggle, meta, marker) {
  const b = checkbox(done, onToggle, marker ? 'Маркер отвечен' : 'Вопрос отмечен', marker);
  return h('li', { class: 'as-q' + (done ? ' is-done' : '') + (marker ? ' is-marker' : '') }, b, h('div', null, h('div', { class: 'as-q__text' }, rich(text)), meta || null));
}

export function checkbox(done, onToggle, label, diamond) {
  const b = h('button', { class: 'as-check' + (diamond ? ' as-check--diamond' : ''), role: 'checkbox', 'aria-checked': String(!!done), 'aria-label': label, onclick: () => onToggle(!done) },
    diamond ? h('span', { class: 'as-dbox' + (done ? ' is-done' : ''), html: done ? '<svg viewBox="0 0 10 10"><path d="M1.8 5.4l2.2 2.2 4.4-4.8"/></svg>' : '' }) : stateDot(done ? 'done' : 'todo'));
  b.addEventListener('keydown', (e) => { if (e.key === ' ') { e.preventDefault(); b.click(); } });
  return b;
}

function markerList(ms) {
  return h('ul', { class: 'as-qlist' }, ms.map((m) => qRow(m.text, m.done, (v) => setMarker(m.block, m.n, v),
    m.lessons.length ? h('div', { class: 'as-q__meta' }, 'Уроки: ', m.lessons.map((l) => h('a', { class: 'as-a as-mono', title: l.title, onclick: () => openId(l.id) }, l.id))) : null, true)));
}

function streakCard(s) {
  const dot = (d) => {
    const cls = 'as-dot' + (d.state === 'done' ? ' as-dot--done' : d.state === 'rest' ? ' as-dot--rest' : d.state === 'today' ? ' as-dot--today' : '');
    const el = h('div', { class: cls, title: d.day });
    if (d.state === 'done') el.innerHTML = CHECK_GLYPH;
    if (d.state === 'rest') el.innerHTML = DASH_GLYPH;
    if (d.state === 'future') el.style.opacity = '.5';
    el.style.setProperty('--i', s.week.indexOf(d));
    return h('div', { class: 'as-day' }, el, d.label);
  };
  const head = s.n > 0
    ? h('div', null, countUp(h('div', { class: 'as-streak__num', style: { fontSize: '44px', lineHeight: '44px' } }), s.n), h('div', { class: 'as-streak__unit' }, s.unit))
    : h('div', { class: 'as-p-callout', style: { maxWidth: '200px' } }, 'Начните сегодня — и здесь появится серия');
  const flame = h('div', { class: 'as-flame', html: FLAME });
  return h('section', { class: 'as-card as-streak' },
    h('div', { class: 'as-streak__head' }, flame, head),
    h('div', { class: 'as-week' }, s.week.map(dot)),
    s.canRest && !s.fresh ? h('div', null, btn('Сегодня отдыхаю', 'ghost', rest, { title: 'День отдыха не обнуляет серию' }))
      : s.restUsed ? h('div', { class: 'caption as-subtle' }, 'Один день отдыха в неделю уже взят') : null);
}

function ringCard(r) {
  const C = 2 * Math.PI * 40;
  const ring = h('div', { class: 'as-ring' + (r.pct === 0 ? ' is-zero' : ''), role: 'img', 'aria-label': `Пройдено ${r.pct} %` },
    h('div', { html: `<svg viewBox="0 0 96 96"><circle class="as-ring__track" cx="48" cy="48" r="40"/><circle class="as-ring__value" cx="48" cy="48" r="40" stroke-dasharray="${(r.pct / 100 * C).toFixed(1)} 999"/></svg>`, style: { width: '100%', height: '100%' } }),
    h('div', { class: 'as-ring__label' }, h('span', null, countUp(h('span'), r.pct, '%'), h('small', null, 'пройдено'))));
  const word = r.total % 10 === 1 && r.total % 100 !== 11 ? 'урока' : 'уроков';
  return h('section', { class: 'as-card', style: { flexDirection: 'row', alignItems: 'center', gap: '20px' } },
    ring,
    h('div', { style: { minWidth: 0 } },
      h('h3', { class: 'as-h-headline', style: { marginBottom: '2px' } }, r.stageNum ? `Этап ${r.stageNum} · ${r.stageTitle.split(':')[0]}` : 'Путь по курсу'),
      h('p', { class: 'as-p-callout' }, `${r.done} из ${r.total} ${word}.` + (r.block ? ` Текущий блок —\u00a0${r.block}.` : ''))));
}

function forecastCard(f) {
  const body = [];
  if (f.empty) body.push(h('p', { class: 'as-p-callout' }, 'Отметьте первый урок — и здесь появится прогноз'));
  else {
    body.push(h('div', { class: 'as-headline headline' }, f.pace));
    body.push(h('div', { class: 'as-rowlist', style: { display: 'flex', flexDirection: 'column', gap: '2px' } }, f.rows.map((r) =>
      h('div', { class: 'as-rowx', style: { justifyContent: 'space-between', gap: '12px', flexWrap: 'nowrap' } },
        h('span', { class: 'as-clamp1' }, r.label), h('span', { class: 'as-muted as-tnum', style: { whiteSpace: 'nowrap' } }, r.text)))));
    if (f.young) body.push(h('div', { class: 'caption as-subtle' }, f.young));
    else if (f.fork) body.push(h('div', { class: 'caption as-subtle' }, f.fork));
  }
  return h('section', { class: 'as-card' },
    h('div', { class: 'as-rowx as-rowx--between' },
      h('h3', { class: 'as-h-headline' }, 'Прогноз'),
      h('a', { class: 'as-a callout', onclick: () => go('#/speed') }, 'Мой ритм')),
    ...body);
}

const KIND = { theme: 'Тема', block: 'Блок', stage: 'Этап' };
function recentCard(items) {
  return h('section', { class: 'as-card' },
    h('h3', { class: 'as-h-headline' }, 'Недавно закрыто'),
    h('ul', { class: 'as-feed' }, items.map((r) => h('li', { onclick: () => openId(r.id), title: r.id + ' ' + r.title },
      h('span', { class: 'as-feed__kind' }, KIND[r.kind]),
      h('span', { class: 'as-clamp1' }, h('span', { class: 'as-mono as-subtle', style: { fontSize: '12px', marginRight: '8px' } }, r.kind === 'stage' ? '' : r.id), r.title.replace(/\.$/, '')),
      h('span', { class: 'as-feed__when' }, r.when)))));
}

function idLinksT(a) {
  const out = [];
  const re = /[A-ZА-ЯЁ]+-\d+(?:\.\d+){0,2}/g;
  let last = 0, m;
  while ((m = re.exec(a.text))) {
    if (m.index > last) out.push(...rich(a.text.slice(last, m.index)));
    const id = m[0];
    out.push(h('a', { class: 'as-a', onclick: () => openId(id) }, id));
    last = m.index + id.length;
  }
  if (last < a.text.length) out.push(...rich(a.text.slice(last)));
  return out;
}
