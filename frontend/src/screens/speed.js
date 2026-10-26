import { api } from '../api.js';
import { S, emit } from '../state.js';
import { h, pluralRu } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/toast.js';
import { weekCards, heatRange } from './stats.js';

// Темп: без норм и целей. Средняя считается сама; к желаемой дате — мягкая подсказка.
export async function render(root) {
  const d = await api.Speed();
  const [hf, ht] = heatRange(d.series.length ? d.series[d.series.length - 1].day : new Date().toISOString().slice(0, 10), 6);
  const hd = await api.Heat(hf, ht);
  root.append(
    h('header', { class: 'as-head' },
      h('div', { class: 'as-eyebrow' }, 'Мой ритм'),
      h('h1', { class: 'large-title', style: { margin: '4px 0 0' } }, 'Мой ритм'),
      h('p', { class: 'as-lead' }, 'Никаких норм и обязательств: темп считается сам по закрытым темам, а по нему — спокойный прогноз.')));

  if (d.empty) {
    root.append(h('div', { class: 'as-card' }, h('div', { class: 'as-empty' }, 'Закройте первую тему — и здесь появится ваш темп и прогноз.')), targetCard(d));
    return 'Мой ритм';
  }

  const trendIcon = { up: 'arrowUp', down: 'arrowDown', flat: 'arrowR' }[d.trend];
  root.append(h('section', { class: 'as-card as-card--lg as-speedhero' },
    h('div', { class: 'as-speedhero__now' },
      h('div', { class: 'as-eyebrow' }, 'Средний темп · 14 дней'),
      h('div', { class: 'as-speedhero__v' }, h('span', { class: 'as-speedhero__num' }, d.vText), h('span', { class: 'as-speedhero__unit' }, d.unit)),
      h('span', { class: 'as-trend as-trend--' + d.trend }, icon(trendIcon), d.trendText)),
    h('div', { class: 'as-speedhero__eta' },
      h('div', { class: 'as-eyebrow' }, 'Если идти так же'),
      h('div', { class: 'as-speedhero__headline' }, d.headline),
      d.young ? h('div', { class: 'caption as-subtle' }, d.young) : d.fork ? h('div', { class: 'caption as-subtle' }, d.fork) : null)));

  // график темпа
  const host = h('div');
  root.append(h('section', { class: 'as-section' },
    h('h2', { class: 'as-h2' }, 'Как менялся темп'),
    h('div', { class: 'as-card', style: { gap: '10px' } },
      h('div', { class: 'as-section__head' }, h('span', { class: 'callout as-muted' }, 'Закрытые темы по дням'), h('span', { class: 'caption as-subtle' }, 'последние недели')),
      host)));
  requestAnimationFrame(() => {
    host.append(weekCards(hd, { w: host.clientWidth || 700 }));
  });

  const card = (n, l, cls) => h('div', { class: 'as-card as-stat ' + (cls || '') }, h('div', { class: 'as-stat__n' }, n), h('div', { class: 'as-stat__l' }, l));
  root.append(h('div', { class: 'as-grid3', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' } },
    card(d.v7, 'тем в день · 7 дней', 'is-c1'),
    card(d.v28, 'тем в день · 28 дней', 'is-c2'),
    card(d.all, 'тем в день · всё время', 'is-c3'),
    card('≈ ' + d.perWeek, 'тем в неделю', 'is-c4')));

  root.append(h('section', { class: 'as-section' },
    h('h2', { class: 'as-h2' }, 'Прогноз'),
    h('div', { class: 'as-card' }, h('div', { class: 'as-table-wrap' }, h('table', { class: 'as-table' },
      h('thead', null, h('tr', null, ['Что', 'Впереди', `При ${d.vText} ${d.unit}`, 'Вилка'].map((x) => h('th', null, x)))),
      h('tbody', null, d.rows.map((r) => h('tr', null, h('td', null, r.label), h('td', { class: 'num' }, r.ahead), h('td', null, r.date || '—'), h('td', { class: 'num as-muted' }, r.fork || '—')))))))));

  root.append(targetCard(d));
  return 'Мой ритм';
}

function targetCard(d) {
  const t = d.target;
  const tabs = h('div', { class: 'as-tabs', role: 'tablist' }, [['milestone', 'До собесов'], ['path', 'Весь путь']].map(([k, l]) =>
    h('button', { class: 'as-tab' + (t.scope === k ? ' is-active' : ''), role: 'tab', 'aria-selected': t.scope === k, onclick: async () => { await api.SetSetting('target_scope', k); emit(); } }, l)));
  const inp = h('input', { class: 'as-input', type: 'date', value: t.date || '', 'aria-label': 'Желаемая дата', style: { width: '180px' } });
  inp.addEventListener('change', async () => {
    try { await api.SetSetting('milestone_target', inp.value); S.settings.milestone_target = inp.value; emit(); } catch (e) { toast({ title: e.message, kind: 'streak' }); }
  });
  const body = [];
  if (!t.set) {
    body.push(h('p', { class: 'as-p-callout' }, 'Необязательно. Если хочется успеть к определённому дню — укажите его, и здесь появится спокойная подсказка: сколько тем в день к нему приведёт. Это не норма, просто арифметика.'));
  } else if (t.status === 'done' || t.status === 'passed') {
    body.push(h('p', { class: 'as-p-callout' }, t.verdict));
  } else {
    const max = Math.max(t.need, t.now, 0.1) * 1.15;
    const bar = (label, v, cls) => h('div', { class: 'as-cmp ' + cls },
      h('span', { class: 'as-cmp__l' }, label),
      h('div', { class: 'as-cmp__track' }, h('i', { style: { width: Math.round((v / max) * 100) + '%' } })),
      h('span', { class: 'as-cmp__v' }, String(Math.round(v * 10) / 10).replace('.', ',')));
    body.push(
      h('div', { class: 'as-target__big' },
        h('div', null, h('span', { class: 'as-target__num' }, '≈ ' + t.needText), h('span', { class: 'as-target__unit' }, ' ' + pluralRu(Math.round(t.need), 'тема', 'темы', 'тем') + ' в день')),
        h('div', { class: 'caption as-subtle' }, `≈ ${t.needWeek} в неделю · ${t.label} к ${t.dateText} · впереди ${t.ahead}, ${t.daysLeft}`)),
      h('div', { class: 'as-cmps' }, bar('к дате', t.need, 'is-need'), bar('сейчас', t.now, 'is-now is-' + t.status)),
      h('p', { class: 'as-target__verdict is-' + t.status }, t.verdict));
  }
  return h('section', { class: 'as-section' },
    h('h2', { class: 'as-h2' }, 'Желаемая дата'),
    h('div', { class: 'as-card', style: { gap: '14px' } },
      h('div', { class: 'as-rowx as-rowx--between' }, tabs,
        h('div', { class: 'as-rowx', style: { gap: '8px' } }, inp, t.set ? h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: async () => { await api.SetSetting('milestone_target', ''); emit(); } }, 'Убрать') : null)),
      ...body));
}
