import { api } from '../api.js';
import { h, pluralRu } from '../ui/dom.js';
import { achBadge } from '../ui/achicons.js';

let filter = 'all';

export async function render(root) {
  const d = await api.Achievements();
  const items = d.items.filter((x) => (filter === 'all' ? true : filter === 'open' ? x.unlocked : !x.unlocked));
  const pct = Math.round((d.unlocked * 100) / (d.total || 1));
  const tabs = h('div', { class: 'as-tabs', role: 'tablist' }, [['all', 'Все'], ['open', 'Открытые'], ['secret', 'Секретные']].map(([k, l]) =>
    h('button', { class: 'as-tab' + (filter === k ? ' is-active' : ''), role: 'tab', 'aria-selected': filter === k, onclick: () => { filter = k; document.dispatchEvent(new Event('as-rerender')); } }, l)));

  root.append(
    h('header', { class: 'as-head' },
      h('div', { class: 'as-eyebrow' }, 'Достижения'),
      h('h1', { class: 'large-title', style: { margin: '4px 0 0' } }, 'Что вы уже открыли'),
      h('p', { class: 'as-lead' }, 'Все достижения секретные. Заранее не видно ни названия, ни условия: они открываются сами, когда вы закрываете темы.')),
    h('section', { class: 'as-card as-achhead' },
      h('div', { class: 'as-rowx as-rowx--between' },
        h('div', null, h('div', { class: 'as-stat__n as-tnum' }, `${d.unlocked} из ${d.total}`), h('div', { class: 'as-stat__l' }, d.unlocked ? 'достижений открыто' : 'Первое откроется, когда вы закроете первую тему')),
        d.new ? h('span', { class: 'as-badge as-badge--accent' }, d.new + ' ' + pluralRu(d.new, 'новое', 'новых', 'новых')) : null),
      h('div', { class: 'as-bar', role: 'progressbar', 'aria-valuenow': pct, 'aria-label': 'Открыто достижений' }, h('i', { style: { width: pct + '%' } }))),
    h('div', { class: 'as-rowx' }, tabs),
    items.length ? h('div', { class: 'as-achgrid' }, items.map((x, i) => { const c = card(x); c.style.setProperty('--i', Math.min(i, 30)); return c; })) : h('div', { class: 'as-empty' }, filter === 'open' ? 'Пока ни одного. Закройте тему — и первое откроется.' : 'Все секреты раскрыты.'));
  return 'Достижения';
}

function card(x) {
  const badge = h('div', { class: 'as-ach__badge' }, achBadge(x, x.unlocked ? 64 : 44));
  if (!x.unlocked) {
    return h('div', { class: 'as-ach is-locked', role: 'group', 'aria-label': 'Секретное достижение' }, badge,
      h('div', { class: 'as-ach__body' }, h('div', { class: 'as-ach__name' }, 'Секретное достижение'), h('div', { class: 'as-ach__desc' }, 'Узнаете, когда откроете.')));
  }
  return h('div', { class: 'as-ach' + (x.new ? ' is-new' : ''), role: 'group', 'aria-label': x.name }, badge,
    h('div', { class: 'as-ach__body' },
      h('div', { class: 'as-ach__name' }, x.name, x.new ? h('span', { class: 'as-badge as-badge--accent' }, 'Новое') : null),
      h('div', { class: 'as-ach__desc' }, x.desc),
      h('div', { class: 'as-ach__when' }, x.when === 'ранее' ? 'Открыто ранее' : 'Открыто ' + x.when)));
}
