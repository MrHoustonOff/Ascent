import { api } from '../api.js';
import { S, emit } from '../state.js';
import { h, clear, pluralRu } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { toastError } from '../ui/toast.js';
import { refresh } from '../actions.js';
import { openRecap } from '../ui/recap.js';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MNOM = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MSHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const iso = (d) => d.toISOString().slice(0, 10);
const utc = (s) => new Date(s + 'T00:00:00Z');
const addDays = (d, n) => new Date(d.getTime() + n * 864e5);
const themesWord = (n) => pluralRu(n, 'тема', 'темы', 'тем');

const KINDS = { days: 'По дням', weeks: 'По неделям', total: 'Накопленно' };
let tab = 'week', monthOff = 0, chartTab = 'days';

export async function render(root) {
  const [today, vel, fc, daily, weekly, ins] = await Promise.all([api.Today(), api.Velocity(), api.Forecast(), api.Daily(28), api.Weekly(12), api.Insights()]);
  const todayStr = today.streak.week.find((d) => d.state === 'today' || d.state === 'done' && false)?.day || null;
  const tdy = todayDate(today);

  root.append(
    h('header', { class: 'as-head' },
      h('div', { class: 'as-eyebrow' }, 'Статистика'),
      h('div', { class: 'as-rowx as-rowx--between' },
        h('h1', { class: 'large-title', style: { margin: '4px 0 0' } }, 'Ваш темп'),
        vel.empty ? null : h('button', { class: 'as-btn as-btn--secondary', onclick: openRecap, title: 'Картинки с итогами дня или недели' }, icon('share'), 'Итоги дня и недели')),
      h('p', { class: 'as-lead' }, 'Единица — закрытая тема: пройдены уроки и отвечены вопросы. Уроки по времени не считаются.')));

  if (vel.empty) {
    root.append(h('div', { class: 'as-card' }, h('div', { class: 'as-empty' }, 'Здесь появится ваша неделя, как только вы отметите первый урок.')));
    return 'Статистика';
  }

  root.append(stagesCard());

  // 1. хитмапа
  const heatBox = h('div', { class: 'as-card', style: { gap: '16px' } });
  root.append(h('section', { class: 'as-section' }, h('h2', { class: 'as-h2' }, 'Учёба по дням'), heatBox));
  const drawHeat = async () => {
    clear(heatBox);
    const tabs = h('div', { class: 'as-tabs', role: 'tablist' }, [['week', 'Неделя'], ['month', 'Месяц'], ['year', 'Год']].map(([k, l]) =>
      h('button', { class: 'as-tab' + (tab === k ? ' is-active' : ''), role: 'tab', 'aria-selected': tab === k, onclick: () => { tab = k; drawHeat(); } }, l)));
    const head = h('div', { class: 'as-rowx as-rowx--between' }, tabs);
    heatBox.append(head);
    if (tab === 'week') await weekView(heatBox, tdy);
    else if (tab === 'month') await monthView(heatBox, tdy, head, drawHeat);
    else await yearView(heatBox, tdy);
    heatBox.append(legend());
  };
  await drawHeat();

  // 2. скорость
  const chartBox = h('div', { class: 'as-card', style: { gap: '12px' } });
  root.append(h('section', { class: 'as-section' }, h('h2', { class: 'as-h2' }, 'Динамика'), chartBox));
  const drawChart = () => {
    clear(chartBox);
    const tabs = h('div', { class: 'as-tabs', role: 'tablist' }, [['days', 'По дням'], ['weeks', 'По неделям'], ['total', 'Накопленно']].map(([k, l]) =>
      h('button', { class: 'as-tab' + (chartTab === k ? ' is-active' : ''), role: 'tab', 'aria-selected': chartTab === k, onclick: () => { chartTab = k; drawChart(); } }, l)));
    const sub = chartTab === 'days'
      ? h('span', { class: 'callout as-muted' }, `За неделю: ${vel.weekThemes} ${themesWord(vel.weekThemes)} · к прошлой: ${vel.weekDelta}`)
      : chartTab === 'weeks' ? h('span', { class: 'callout as-muted' }, 'Закрытые темы по календарным неделям')
      : h('span', { class: 'callout as-muted' }, 'Всего закрыто за 12 недель: ' + weekly.reduce((a, b) => a + b.themes, 0));
    chartBox.append(h('div', { class: 'as-rowx as-rowx--between' }, tabs, sub));
    const host = h('div', null);
    chartBox.append(host);
    requestAnimationFrame(() => {
      const w = host.clientWidth || 640;
      if (chartTab === 'days') host.append(barChart(daily.map((d) => ({ v: d.themes, label: d.label, today: d.today, avg: d.avg7 })), { w, goal: today.goal, ticks: 7 }));
      else if (chartTab === 'total') { let acc = 0; host.append(lineChart(weekly.map((d) => ({ v: (acc += d.themes), label: d.label })), { w })); }
      else host.append(barChart(weekly.map((d) => ({ v: d.themes, label: d.label, today: d.current })), { w, ticks: 3 }));
    });
    chartBox.append(h('div', { class: 'as-chart-legend' },
      chartTab === 'total' ? null : h('span', null, h('i'), 'Закрытые темы'),
      chartTab === 'total' ? h('span', null, h('i', { class: 'l' }), 'Темы нарастающим итогом') : null,
      chartTab === 'days' ? h('span', null, h('i', { class: 'l' }), 'Среднее за 7 дней') : null,
      chartTab === 'days' ? h('span', null, h('i', { class: 'd' }), 'Цель дня') : null));
  };
  drawChart();

  // 3. продуктивность
  const card = (n, l) => h('div', { class: 'as-card as-stat' }, h('div', { class: 'as-stat__n' }, n), h('div', { class: 'as-stat__l' }, l));
  const p = Object.fromEntries(vel.paces.map((x) => [x.n, x.value]));
  root.append(h('section', { class: 'as-section' }, h('h2', { class: 'as-h2' }, 'Продуктивность'),
    h('div', { class: 'as-grid3' },
      card(p[7], 'тем в день за 7 дней'),
      card(p[14], 'тем в день за 14 дней'),
      card(p[28], 'тем в день за 28 дней'),
      card(`${vel.activeDays28} из 28`, 'активных дней'),
      card(String(vel.bestStreak), pluralRu(vel.bestStreak, 'день', 'дня', 'дней') + ' — лучшая серия'),
      card(vel.bestDay ? `${vel.bestDayThemes} ${themesWord(vel.bestDayThemes)}` : '—', vel.bestDay ? 'лучший день · ' + vel.bestDay : 'лучший день')),
    h('p', { class: 'caption as-subtle', style: { margin: 0 } }, `За всё время: ${vel.allTime} тем в день. В неделю при нынешнем темпе — около ${vel.perWeek}.`)));

  // ритм: дни недели, время суток, рекорды
  root.append(rhythm(ins, w0()));

  // 4. прогноз
  root.append(forecastSection(fc));
  return 'Статистика';
}

function todayDate(t) {
  // «сегодня» — точка недели со state=today или последняя активная; берём по eyebrow через дни недели
  const dots = t.streak.week;
  const idx = dots.findIndex((d) => d.state === 'today');
  if (idx >= 0) return utc(dots[idx].day);
  // сегодня активно: последняя «done/rest», не future
  const past = dots.filter((d) => d.state !== 'future');
  return utc(past[past.length - 1].day);
}

function legend() {
  const c = (cls) => h('span', { class: 'as-cell ' + cls });
  return h('div', { class: 'as-rowx', style: { gap: '20px' } },
    h('div', { class: 'as-heat-legend' }, 'Меньше', c(''), c('as-cell--l1'), c('as-cell--l2'), c('as-cell--l3'), c('as-cell--l4'), 'Больше'),
    h('div', { class: 'as-heat-legend' }, c('as-cell--rest'), 'Отдых'));
}

const levelCls = (d) => d.rest ? 'as-cell--rest' : d.future ? 'as-cell--future' : d.level ? 'as-cell--l' + d.level : '';

async function weekView(box, tdy) {
  const mon = addDays(tdy, -((tdy.getUTCDay() + 6) % 7));
  const days = await api.Heat(iso(mon), iso(addDays(mon, 6)));
  const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  box.append(h('div', { class: 'as-weekrow as-week' }, days.map((d, i) => {
    const cls = 'as-dot' + (d.rest ? ' as-dot--rest' : d.themes > 0 || d.level > 0 ? ' as-dot--done' : d.today ? ' as-dot--today' : '');
    const dot = h('div', { class: cls, title: d.text, style: d.future ? { opacity: .5 } : null });
    if (d.rest) dot.innerHTML = '<svg class="as-glyph" viewBox="0 0 10 10"><path d="M2 5h6"/></svg>';
    else if (d.level > 0) dot.innerHTML = '<svg class="as-glyph" viewBox="0 0 10 10"><path d="M1.8 5.4l2.2 2.2 4.4-4.8"/></svg>';
    dot.style.setProperty('--i', i);
    return h('div', { class: 'as-day' }, dot, names[i], d.future ? h('b', { class: 'as-subtle' }, '·') : h('b', null, String(d.themes)));
  })));
  box.append(h('p', { class: 'caption as-subtle', style: { margin: 0 } }, 'Под каждым днём — сколько тем закрыто.'));
}

async function monthView(box, tdy, head, redraw) {
  const base = new Date(Date.UTC(tdy.getUTCFullYear(), tdy.getUTCMonth() + monthOff, 1));
  const y = base.getUTCFullYear(), m = base.getUTCMonth();
  const last = new Date(Date.UTC(y, m + 1, 0));
  const days = await api.Heat(iso(base), iso(last));
  head.append(h('div', { class: 'as-monthnav' },
    h('button', { class: 'as-iconbtn', 'aria-label': 'Предыдущий месяц', onclick: () => { monthOff--; redraw(); } }, icon('chevL')),
    h('span', { class: 'as-monthnav__label' }, MONTHS[m] + ' ' + y),
    h('button', { class: 'as-iconbtn', 'aria-label': 'Следующий месяц', disabled: monthOff >= 0, style: monthOff >= 0 ? { opacity: .35 } : null, onclick: () => { if (monthOff < 0) { monthOff++; redraw(); } } }, icon('chevR'))));
  const pad = (base.getUTCDay() + 6) % 7;
  const grid = h('div', { class: 'as-heat as-heat--month', role: 'grid' });
  for (let i = 0; i < pad; i++) grid.append(h('span', { class: 'as-cell as-cell--pad' }));
  for (const [i, d] of days.entries()) {
    grid.append(h('span', { style: { '--i': i }, class: 'as-cell ' + levelCls(d) + (d.today ? ' as-cell--today' : ''), title: d.text, role: 'gridcell', 'aria-label': d.text }, String(d.dom)));
  }
  box.append(h('div', { class: 'as-heat-wrap' },
    h('div', { class: 'as-wdhead', style: { marginBottom: '6px' } }, ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((x) => h('span', null, x))), grid));
}

async function yearView(box, tdy) {
  const mon = addDays(tdy, -((tdy.getUTCDay() + 6) % 7) - 52 * 7);
  const sun = addDays(tdy, 6 - ((tdy.getUTCDay() + 6) % 7));
  const days = await api.Heat(iso(mon), iso(sun));
  const grid = h('div', { class: 'as-heat as-heat--year', role: 'grid' }, days.map((d, i) =>
    h('span', { style: { '--i': Math.floor(i / 7) }, class: 'as-cell ' + levelCls(d) + (d.today ? ' as-cell--today' : ''), title: d.text, role: 'gridcell', 'aria-label': d.text })));
  const weeks = Math.ceil(days.length / 7);
  const months = h('div', { class: 'as-heat-months' });
  for (let w = 0; w < weeks; w++) {
    const first = days[w * 7];
    const showsMonth = days.slice(w * 7, w * 7 + 7).find((d) => d.dom === 1) || (w === 0 && !days.slice(7, 28).some((d) => d.dom === 1) && first);
    months.append(h('span', null, showsMonth ? MNOM[showsMonth.month] : ''));
  }
  box.append(h('div', { class: 'as-heat-wrap' },
    h('div', { class: 'as-heat-year' },
      h('span'), months,
      h('div', { class: 'as-heat-wd', style: { marginTop: '0' } }, ['Пн', '', 'Ср', '', 'Пт', '', ''].map((x) => h('span', null, x))),
      grid)));
  requestAnimationFrame(() => { const w = box.querySelector('.as-heat-wrap'); if (w) w.scrollLeft = w.scrollWidth; });
}

// ---------- графики ----------
// Свой тултип вместо title: появляется мгновенно и читается лучше.
let tip;
function showTip(e, html) {
  if (!tip) { tip = h('div', { class: 'as-tip', role: 'tooltip' }); document.querySelector('.as-window').append(tip); }
  tip.replaceChildren(...html);
  tip.classList.add('is-on');
  const r = document.querySelector('.as-window').getBoundingClientRect();
  const x = Math.min(e.clientX - r.left + 12, r.width - tip.offsetWidth - 8);
  tip.style.transform = `translate(${x}px, ${e.clientY - r.top - tip.offsetHeight - 10}px)`;
}
const hideTip = () => tip && tip.classList.remove('is-on');
const NS = 'http://www.w3.org/2000/svg';
const sv = (n, a, t) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (t != null) e.textContent = t; return e; };

function barChart(data, { w, goal }) {
  const H = 220, padL = 28, padB = 26, padT = 14, padR = 6;
  const max = Math.max(goal || 0, ...data.map((d) => d.v), 1);
  const step = max > 6 ? 2 : 1;
  const top = Math.ceil((max + (max >= 3 ? 0.5 : 0)) / step) * step;
  const iw = w - padL - padR, ih = H - padT - padB;
  const bw = iw / data.length;
  const y = (v) => padT + ih - (v / top) * ih;
  const svg = sv('svg', { class: 'as-chart as-chart--bars', viewBox: `0 0 ${w} ${H}`, width: w, height: H, role: 'img', 'aria-label': 'График закрытых тем' });
  svg.append(sv('defs', {}), );
  svg.querySelector('defs').innerHTML = '<linearGradient id="barg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--accent) 62%,var(--surface-raised))"/></linearGradient>';
  for (let v = 0; v <= top; v += step) {
    svg.append(sv('line', { class: 'grid', x1: padL, x2: w - padR, y1: y(v), y2: y(v) }));
    svg.append(sv('text', { x: padL - 8, y: y(v) + 4, 'text-anchor': 'end' }, String(v)));
  }
  const hl = sv('rect', { class: 'hover-col', x: 0, y: padT, width: bw, height: ih, rx: 6, opacity: 0 });
  svg.append(hl);
  data.forEach((d, i) => {
    const x = padL + i * bw + bw * 0.2, ww = Math.max(2, bw * 0.6);
    const hh = d.v ? Math.max(3, (d.v / top) * ih) : 2;
    const r = sv('rect', { class: 'bar' + (d.today ? ' is-today' : '') + (d.v === 0 ? ' is-zero' : ''), x, y: padT + ih - hh, width: ww, height: hh, rx: Math.min(4, ww / 2), style: `--i:${i}` });
    svg.append(r);
    const hit = sv('rect', { x: padL + i * bw, y: padT, width: bw, height: ih + padB, fill: 'transparent' });
    hit.addEventListener('mousemove', (e) => {
      hl.setAttribute('x', padL + i * bw); hl.setAttribute('opacity', 1);
      showTip(e, [h('b', null, d.label), h('span', null, d.tip || `${d.v} ${themesWord(d.v)}` + (d.avg != null ? ` · среднее ${d.avg.toFixed(1).replace('.', ',')}` : ''))]);
    });
    hit.addEventListener('mouseleave', () => { hl.setAttribute('opacity', 0); hideTip(); });
    svg.append(hit);
  });
  if (goal) {
    svg.append(sv('line', { class: 'goal', x1: padL, x2: w - padR, y1: y(goal), y2: y(goal) }));
    svg.append(sv('text', { class: 'goal-label', x: w - padR, y: y(goal) - 5, 'text-anchor': 'end' }, 'цель ' + goal));
  }
  if (data[0] && data[0].avg != null) {
    const pts = data.map((d, i) => [padL + i * bw + bw / 2, y(d.avg)]);
    const path = sv('path', { class: 'avg draw', d: smooth(pts), pathLength: 1 });
    svg.insertBefore(path, svg.querySelector('.goal'));
  }
  const every = Math.ceil(data.length / Math.max(2, Math.floor(iw / 72)));
  data.forEach((d, i) => {
    if ((data.length - 1 - i) % every === 0) svg.append(sv('text', { x: padL + i * bw + bw / 2, y: H - 7, 'text-anchor': i === data.length - 1 ? 'end' : 'middle' }, d.label));
  });
  return svg;
}

// Сглаженная линия (монотонная кривая без выбросов за точки).
function smooth(p) {
  if (p.length < 3) return 'M' + p.map((q) => q.join(' ')).join('L');
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i], [x1, y1] = p[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C${cx.toFixed(1)} ${y0.toFixed(1)} ${cx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

function lineChart(data, { w }) {
  const H = 220, padL = 34, padB = 26, padT = 16, padR = 22;
  const max = Math.max(...data.map((d) => d.v), 1);
  const step = max > 40 ? 20 : max > 16 ? 10 : max > 8 ? 4 : 2;
  const top = Math.ceil(max / step) * step || step;
  const iw = w - padL - padR, ih = H - padT - padB;
  const x = (i) => padL + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => padT + ih - (v / top) * ih;
  const svg = sv('svg', { class: 'as-chart as-chart--line', viewBox: `0 0 ${w} ${H}`, width: w, height: H, role: 'img', 'aria-label': 'Накопленно закрытых тем' });
  svg.append(sv('defs', {}));
  svg.querySelector('defs').innerHTML = '<linearGradient id="areag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.28"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient>';
  for (let v = 0; v <= top; v += step) {
    svg.append(sv('line', { class: 'grid', x1: padL, x2: w - padR, y1: y(v), y2: y(v) }));
    svg.append(sv('text', { x: padL - 8, y: y(v) + 4, 'text-anchor': 'end' }, String(v)));
  }
  const pts = data.map((d, i) => [x(i), y(d.v)]);
  const line = smooth(pts);
  svg.append(sv('path', { class: 'area', d: `${line} L${x(data.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z` }));
  svg.append(sv('path', { class: 'line draw', d: line, pathLength: 1 }));
  const guide = sv('line', { class: 'guide', x1: 0, x2: 0, y1: padT, y2: padT + ih, opacity: 0 });
  svg.append(guide);
  data.forEach((d, i) => {
    const c = sv('circle', { class: 'dot', cx: x(i), cy: y(d.v), r: i === data.length - 1 ? 5 : 3.5, style: `--i:${i}` });
    svg.append(c);
    if (i % 2 === data.length % 2 || i === data.length - 1) svg.append(sv('text', { x: x(i), y: H - 7, 'text-anchor': i === data.length - 1 ? 'end' : 'middle' }, d.label));
  });
  const seg = iw / Math.max(1, data.length - 1);
  const hit = sv('rect', { x: padL - seg / 2, y: padT, width: iw + seg, height: ih, fill: 'transparent' });
  hit.addEventListener('mousemove', (e) => {
    const r = svg.getBoundingClientRect();
    const i = Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left) * (w / r.width) - padL) / seg)));
    guide.setAttribute('x1', x(i)); guide.setAttribute('x2', x(i)); guide.setAttribute('opacity', 1);
    svg.querySelectorAll('.dot').forEach((c, j) => c.classList.toggle('is-hot', j === i));
    const prev = i ? data[i].v - data[i - 1].v : data[i].v;
    showTip(e, [h('b', null, 'Неделя с ' + data[i].label), h('span', null, `всего ${data[i].v} · за неделю +${prev}`)]);
  });
  hit.addEventListener('mouseleave', () => { guide.setAttribute('opacity', 0); svg.querySelectorAll('.dot').forEach((c) => c.classList.remove('is-hot')); hideTip(); });
  svg.append(hit);
  return svg;
}

// ---------- прогноз ----------
function forecastSection(fc) {
  const sec = h('section', { class: 'as-section' }, h('h2', { class: 'as-h2' }, 'Прогноз'));
  const card = h('div', { class: 'as-card', style: { gap: '16px' } });
  if (fc.empty) card.append(h('p', { class: 'as-p-callout' }, 'Отметьте первый урок — и здесь появится прогноз'));
  else {
    card.append(h('div', { class: 'as-table-wrap' }, h('table', { class: 'as-table' },
      h('thead', null, h('tr', null, ['Цель', 'Впереди', `При темпе ${fc.pace}`, 'Вилка'].map((x) => h('th', null, x)))),
      h('tbody', null, fc.rows.map((r) => h('tr', null,
        h('td', null, r.label), h('td', { class: 'num' }, r.ahead), h('td', null, r.date || '—'), h('td', { class: 'num as-muted' }, r.fork || '—')))))));
    if (fc.young) card.append(h('p', { class: 'caption as-subtle', style: { margin: 0 } }, fc.young));
  }
  // целевая дата вехи
  const inp = h('input', { class: 'as-input', type: 'date', value: fc.target || '', 'aria-label': 'Целевая дата вехи', style: { width: '180px' } });
  inp.addEventListener('change', async () => {
    try { await api.SetSetting('milestone_target', inp.value); S.settings.milestone_target = inp.value; emit(); } catch (e) { toastError(e.message); }
  });
  card.append(h('div', { class: 'as-field', style: { minWidth: 0 } },
    h('label', { class: 'as-label' }, 'Хочу дойти до вехи к'), inp,
    fc.need ? h('div', { class: 'as-rowx', style: { marginTop: '4px' } }, h('span', { class: 'as-hint', style: { fontSize: '13px', lineHeight: '18px', flex: '1 1 260px' } }, fc.need),
      h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: async () => { await api.SetSetting('daily_goal', String(Math.min(10, Math.max(1, fc.needN)))); toastOk(); refresh(); } }, 'Сделать дневной целью')) : null));
  sec.append(card);
  return sec;
}
function toastOk() {}

function stagesCard() {
  const t = S.tree;
  const rows = t.stages.map((st) => h('div', { class: 'as-stagebar', onclick: () => (location.hash = '#/path/' + st.id), title: st.title },
    h('div', { class: 'as-stagebar__name' }, `Этап ${st.num} · ${st.title.split(':')[0]}`),
    h('div', { class: 'as-stagebar__meta' }, st.closedAt ? (st.closedAt === 'ранее' ? 'закрыт ранее' : 'закрыт ' + st.closedAt) : `${st.done} из ${st.total} · ${st.pct} %`),
    h('div', { class: 'as-bar', role: 'progressbar', 'aria-valuenow': st.pct }, h('i', { style: { width: st.pct + '%' } }))));
  return h('section', { class: 'as-section' }, h('h2', { class: 'as-h2' }, 'Путь по этапам'), h('div', { class: 'as-card' }, h('div', { class: 'as-stagebars' }, rows)));
}


function w0() { const m = document.querySelector('.as-window__main'); return Math.min(1040, (m ? m.clientWidth : 900) - 64 - 34); }

function rhythm(ins, width) {
  if (ins.empty) return null;
  const card = (n, l) => h('div', { class: 'as-card as-stat' }, h('div', { class: 'as-stat__n' }, n), h('div', { class: 'as-stat__l' }, l));
  const wdHost = h('div');
  requestAnimationFrame(() => {
    const w = wdHost.clientWidth || width;
    wdHost.append(barChart(ins.weekdays.map((d) => ({ v: d.avg, label: d.label, today: d.best, tip: `в среднем ${d.avgText} · всего ${d.total}` })), { w }));
  });
  return h('section', { class: 'as-section' },
    h('h2', { class: 'as-h2' }, 'Ритм'),
    h('div', { class: 'as-grid3' },
      card(ins.avgActive, 'тем в среднем за учебный день'),
      card(ins.bestWeekday || '—', 'самый сильный день недели'),
      card(String(ins.bestWeek), 'рекорд недели · ' + ins.bestWeekAt),
      card(String(ins.bestMonth), 'рекорд месяца · ' + ins.bestMonthAt),
      card(String(ins.activeTotal), 'дней с учёбой всего'),
      card(ins.avgDay, 'тем в день за всё время')),
    h('div', { class: 'as-grid2' },
      h('div', { class: 'as-card' },
        h('div', { class: 'as-section__head' }, h('h3', { class: 'as-h-headline' }, 'По дням недели'), h('span', { class: 'caption as-subtle' }, 'тем в среднем')),
        wdHost),
      h('div', { class: 'as-card' },
        h('div', { class: 'as-section__head' }, h('h3', { class: 'as-h-headline' }, 'Время суток'), h('span', { class: 'caption as-subtle' }, 'когда закрываются темы')),
        h('div', { class: 'as-hbars' }, ins.parts.map((p) => h('div', { class: 'as-hbar' + (p.best ? ' is-best' : '') },
          h('div', null, h('b', null, p.label), h('div', { class: 'caption as-subtle' }, p.hint)),
          h('div', { class: 'as-bar' }, h('i', { style: { width: p.pct + '%' } })),
          h('span', null, p.pct + ' %')))),
        h('p', { class: 'caption as-subtle', style: { margin: 0 } }, ins.trend))),
    h('p', { class: 'caption as-subtle', style: { margin: 0 } }, `Всего: ${ins.themesTotal} ${themesWord(ins.themesTotal)}, ${ins.lessonsTotal} ${pluralRu(ins.lessonsTotal, 'урок', 'урока', 'уроков')}, ${ins.checksTotal} ${pluralRu(ins.checksTotal, 'ответ', 'ответа', 'ответов')} на вопросы, ${ins.blocksTotal} ${pluralRu(ins.blocksTotal, 'блок', 'блока', 'блоков')}.`));
}
