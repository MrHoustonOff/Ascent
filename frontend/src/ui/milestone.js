// Веха «можно на собесы» (этап из настройки milestone_stage, по умолчанию 5) и лёгкая отметка «можно на стажировки» после этапа 3.
// Показывается: пунктиром в «Курсе» слева, карточкой «Путь до собесов» на «Сегодня», баннером с гофером в «Моём ритме».
import { S } from '../state.js';
import { h, pluralRu } from './dom.js';
import { gopherSVG } from './gopher.js';
import { go } from '../actions.js';

export const INTERN_STAGE = 3;
export const milestoneStage = () => Math.min(7, Math.max(1, Number(S.settings?.milestone_stage) || 5));

// сколько пройдено до вехи: по этапам дерева
export function milestoneInfo(tree = S.tree) {
  const ms = milestoneStage(), st = (tree?.stages || []).filter((x) => x.num <= ms);
  const done = st.reduce((s, x) => s + x.done, 0), total = st.reduce((s, x) => s + x.total, 0);
  return { ms, st, done, total, left: Math.max(0, total - done), pct: total ? Math.floor(done * 100 / total) : 0, passed: total > 0 && done >= total };
}
const lessons = (n) => `${n} ${pluralRu(n, 'урок', 'урока', 'уроков')}`;

// «Курс» слева: после этапа 3 — едва заметно, после этапа вехи — пунктир с флажком
export function navMarks(num) {
  const ms = milestoneStage(), out = [];
  if (num === INTERN_STAGE && ms !== INTERN_STAGE) out.push(h('div', { class: 'as-navmile is-soft', title: 'После этапа 3 можно пробовать стажировки' }, 'можно на стажировки'));
  if (num === ms) {
    const m = milestoneInfo();
    out.push(h('div', { class: 'as-navmile' + (m.passed ? ' is-passed' : ''), title: m.passed ? 'Веха пройдена: этапы 1–' + ms + ' закрыты' : `Веха: закрыть этапы 1–${ms} · осталось ${lessons(m.left)}` },
      h('span', null, m.passed ? '⚑ веха пройдена' : '⚑ можно на собесы')));
  }
  return out;
}

// «Сегодня»: путь до собесов — полоса по этапам до вехи и флажок на финише
export function milestoneCard(forecast) {
  const m = milestoneInfo();
  if (!m.total) return null;
  const date = (forecast?.rows || []).find((r) => r.key === 'milestone')?.text || '';
  if (m.passed) {
    return h('section', { class: 'as-card as-mscard is-passed' },
      h('div', { class: 'as-mscard__row' }, h('h3', { class: 'as-mscard__title' }, '⚑ Веха пройдена — можно на собесы'), h('span', { class: 'as-mscard__pct' }, '100 %')),
      h('div', { class: 'as-mscard__foot' }, h('span', null, `Этапы 1–${m.ms} закрыты: ${m.total} уроков. Дальше — отклики, а оставшиеся этапы параллельно.`)));
  }
  let acc = 0;
  const segs = m.st.map((x) => { const from = acc; acc += x.total; return { x, from }; });
  return h('section', { class: 'as-card as-mscard', role: 'button', tabindex: '0', title: 'Мой ритм: прогноз и желаемая дата', onclick: () => go('#/speed') },
    h('div', { class: 'as-mscard__row' }, h('h3', { class: 'as-mscard__title' }, '⚑ Путь до собесов'), h('span', { class: 'as-mscard__pct' }, m.pct + ' %')),
    h('div', { class: 'as-mscard__track' },
      segs.map(({ x, from }) => h('div', { class: 'as-mscard__seg', style: { flexGrow: String(x.total) } },
        h('i', { style: { width: Math.round(x.done * 100 / (x.total || 1)) + '%' } }),
        h('span', { class: 'as-mscard__lab' }, 'Этап ' + x.num))),
      h('span', { class: 'as-mscard__flag', 'aria-hidden': 'true' }, '⚑')),
    h('div', { class: 'as-mscard__foot' },
      h('span', null, 'Пройдено ', h('b', null, String(m.done)), ' из ' + m.total),
      h('span', null, 'Осталось ', h('b', null, lessons(m.left))),
      date ? h('span', null, 'Прогноз ', h('b', null, date)) : null));
}

// «Мой ритм»: баннер с гофером у финиша
export function milestoneBanner(date) {
  const m = milestoneInfo();
  if (!m.total) return null;
  const g = h('div', { class: 'as-msban__g', html: gopherSVG({ width: 116, eyes: m.passed ? 'happy' : 'open', arms: m.passed ? 'up' : 'down' }) });
  const ring = h('div', { class: 'as-msban__ring', style: { '--p': m.pct + '%' } }, h('span', null, m.pct + '%'));
  return h('section', { class: 'as-msban' + (m.passed ? ' is-passed' : '') }, g, h('div', { class: 'as-msban__flags', 'aria-hidden': 'true' }),
    h('div', { class: 'as-msban__text' },
      h('div', { class: 'as-msban__k' }, '⚑ Веха «можно на собесы» · этапы 1–' + m.ms),
      h('h2', { class: 'as-msban__t' }, m.passed ? 'Веха пройдена — подавайся!' : `Ещё ${lessons(m.left)} — и на собесы`),
      h('p', { class: 'as-msban__p' }, m.passed ? 'Этапы до вехи закрыты. Оставшиеся этапы — параллельно с откликами.'
        : `Go, конкурентность, SQL, сеть, сервис целиком${date ? ' · прогноз — ' + date : ''}. Стажировки можно пробовать уже после этапа 3.`)),
    ring);
}
