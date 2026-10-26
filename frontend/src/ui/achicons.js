// Иконки достижений: линейные, 24×24, штрих 1.7, currentColor.
const P = {
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.4 2.4M15.6 15.6L18 18M18 6l-2.4 2.4M8.4 15.6L6 18"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z"/>',
  layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>',
  bolt: '<path d="M13 3L5.5 13.2H11L10 21l8-10.5h-5.6z"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z"/>',
  crown: '<path d="M4 8l4 4 4-6 4 6 4-4-1.6 10H5.6z"/><path d="M5.6 20.5h12.8"/>',
  flag: '<path d="M6 21V4M6 5h11l-2.2 3.5L17 12H6"/>',
  peak: '<path d="M2.5 19.5L9.5 7l3.5 6 2-3 6.5 9.5z"/><path d="M9.5 7l1.5 2.6"/>',
  twin: '<circle cx="8.5" cy="12" r="5"/><circle cx="15.5" cy="12" r="5"/>',
  rocket: '<path d="M12 3c3.5 2 5 5.5 4.5 10l-2 2.5h-5L7.5 13C7 8.5 8.5 5 12 3z"/><circle cx="12" cy="9.5" r="1.6"/><path d="M9.5 15.5L7 19M14.5 15.5L17 19M12 17v4"/>',
  flame: '<path d="M12.6 2.8c.3 3.6 4.9 5.8 4.9 11a5.5 5.5 0 0 1-11 0c0-2.2 1.1-3.7 2.3-4.8.1 1.6.8 2.6 1.9 3 .5-2.4 1.5-5.4 1.9-9.2z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8.5 14.5l2 2 4-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/>',
  wave: '<path d="M3 15c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M3 9.5c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
  block: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 12.3l2.5 2.5 4.6-5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  db: '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6"/>',
  net: '<circle cx="12" cy="5.5" r="2.3"/><circle cx="5.5" cy="18" r="2.3"/><circle cx="18.5" cy="18" r="2.3"/><path d="M11 7.6L6.6 15.8M13 7.6l4.4 8.2M8 18h8"/>',
  term: '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M7.5 10l3 2.5-3 2.5M13 15h4"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.3l2.8 2.8 5.2-5.6"/>',
  box: '<path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2z"/><path d="M4 7.2l8 4.3 8-4.3M12 11.5V21"/>',
  queue: '<rect x="3" y="8" width="5" height="8" rx="1.6"/><rect x="9.5" y="8" width="5" height="8" rx="1.6"/><path d="M17 12h4M19.2 9.8L21.4 12l-2.2 2.2"/>',
  chat: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z"/><path d="M8 8.5h8M8 11.5h5"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  sunrise: '<path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 5v3M4.8 9.8l1.8 1.8M19.2 9.8l-1.8 1.8"/>',
  return: '<path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h9.5a5 5 0 0 1 0 10H12"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5c0 3 1.5 4.5 3.7 4.8M16 6h3.5c0 3-1.5 4.5-3.7 4.8M12 13v4M8.5 20.5h7M9.5 17h5"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2.5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/>',
  gopher: '<path d="M5.5 8.5c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5v8c0 2.6-2.6 4.5-6.5 4.5s-6.5-1.9-6.5-4.5z"/><path d="M6 6.2c-1.6-.9-2.9.4-2.2 1.8M18 6.2c1.6-.9 2.9.4 2.2 1.8"/><circle cx="9.3" cy="8.8" r="2"/><circle cx="14.7" cy="8.8" r="2"/><circle cx="9.7" cy="9" r=".7" fill="currentColor"/><circle cx="15.1" cy="9" r=".7" fill="currentColor"/><path d="M10.8 12.2c.4-.6 2-.6 2.4 0"/><path d="M11.2 13v1.6h1.6V13"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
};

export function achSvg(key, size = 28) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', size);
  s.setAttribute('height', size);
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.7');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  const m = /^stage(\d)$/.exec(key);
  if (m) {
    s.innerHTML = '<path d="M12 3l7.5 3.2v5.6c0 4.3-3 7.6-7.5 9.2-4.5-1.6-7.5-4.9-7.5-9.2V6.2z"/>' +
      `<text x="12" y="15.4" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor" stroke="none" font-family="-apple-system,Segoe UI,sans-serif">${m[1]}</text>`;
  } else s.innerHTML = P[key] || P.star;
  return s;
}

export const trophyPath = P.trophy;

// ---------- кастомные значки достижений ----------
// Форма зависит от группы, цвет — от уровня, внутри — свой глиф или надпись (число, ID, кусочек кода).
const NS = 'http://www.w3.org/2000/svg';
const SHAPES = {
  themes: 'M32 4a28 28 0 1 1 0 56a28 28 0 1 1 0-56z',
  day: 'M32 3.5l14 9.7 9 13.5v10.6l-9 13.5-14 9.7-14-9.7-9-13.5V26.7l9-13.5z',
  streak: 'M32 3c7 7 21 14 21 31a21 21 0 0 1-42 0C11 20 25 14 32 3z',
  week: 'M18 5h28a13 13 0 0 1 13 13v28a13 13 0 0 1-13 13H18A13 13 0 0 1 5 46V18A13 13 0 0 1 18 5z',
  month: 'M14 9h36a9 9 0 0 1 9 9v32a9 9 0 0 1-9 9H14a9 9 0 0 1-9-9V18a9 9 0 0 1 9-9z',
  blocks: 'M32 3l25 14.5v29L32 61 7 46.5v-29z',
  stages: 'M32 3l25 9v17c0 15-10.5 26.5-25 32C17.5 55.5 7 44 7 29V12z',
  tracks: 'M22 4h20l14 14v28L42 60H22L8 46V18z',
  code: 'M13 8h38a8 8 0 0 1 8 8v32a8 8 0 0 1-8 8H13a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8z',
  special: (() => { let d = ''; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 26 : 30; d += (i ? 'L' : 'M') + (32 + r * Math.cos(a)).toFixed(1) + ' ' + (32 + r * Math.sin(a)).toFixed(1); } return d + 'z'; })(),
};
const TIER = {
  accent: ['--accent-soft', '--accent', '--accent-ink'],
  streak: ['--streak-soft', '--streak', '--streak-ink'],
  success: ['--success-soft', '--success', '--success-ink'],
};
let uid = 0;

function el(n, a, kids) {
  const e = document.createElementNS(NS, n);
  for (const k in a) e.setAttribute(k, a[k]);
  (kids || []).forEach((c) => e.append(c));
  return e;
}

export function achBadge(x, size = 64) {
  const svg = el('svg', { viewBox: '0 0 64 64', width: size, height: size, class: 'as-badge-svg', 'aria-hidden': 'true' });
  if (!x.unlocked) {
    svg.append(el('path', { d: SHAPES.themes, class: 'b-lock-bg' }));
    const g = achSvg('lock', 24); g.setAttribute('x', 20); g.setAttribute('y', 20); g.setAttribute('class', 'b-lock');
    svg.append(g);
    return svg;
  }
  if (x.group === 'topic') return topicArt(svg, x);
  const [soft, main, ink] = TIER[x.tier] || TIER.accent;
  const id = 'g' + (++uid);
  const shape = SHAPES[x.group] || SHAPES.themes;
  svg.append(el('defs', {}, [
    el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, [
      el('stop', { offset: '0', style: `stop-color:color-mix(in srgb,var(${soft}) 70%,var(--surface-raised))` }),
      el('stop', { offset: '1', style: `stop-color:color-mix(in srgb,var(${main}) 26%,var(${soft}))` }),
    ]),
    el('clipPath', { id: id + 'c' }, [el('path', { d: shape })]),
  ]));
  svg.append(el('path', { d: shape, fill: `url(#${id})`, style: `stroke:var(${main});stroke-width:2` }));
  // внутренний контур и блик
  svg.append(el('path', { d: shape, transform: 'translate(32 32) scale(.82) translate(-32 -32)', fill: 'none', style: `stroke:var(${main});stroke-opacity:.35;stroke-width:1.2;stroke-dasharray:2 3` }));
  const shine = el('rect', { x: -40, y: -10, width: 18, height: 90, class: 'b-shine', transform: 'rotate(25)', 'clip-path': `url(#${id}c)` });
  svg.append(el('g', { 'clip-path': `url(#${id}c)` }, [shine]));
  const color = `color:var(${ink});fill:var(${ink})`;
  const mark = x.mark || '';
  if (x.group === 'code') {
    const fs = mark.length > 5 ? 11 : mark.length > 3 ? 14 : 17;
    const t = el('text', { x: 32, y: 32 + fs * 0.36, 'text-anchor': 'middle', class: 'b-code', style: color + `;font-size:${fs}px` });
    t.textContent = mark;
    svg.append(t);
  } else if (mark) {
    const g = achSvg(x.icon, 16); g.setAttribute('x', 24); g.setAttribute('y', 12); g.setAttribute('style', `color:var(${ink})`);
    svg.append(g);
    const fs = mark.length > 2 ? 15 : 19;
    const t = el('text', { x: 32, y: 47, 'text-anchor': 'middle', class: 'b-num', style: color + `;font-size:${fs}px` });
    t.textContent = mark;
    svg.append(t);
  } else {
    const g = achSvg(x.icon, 30); g.setAttribute('x', 17); g.setAttribute('y', 17); g.setAttribute('style', `color:var(${ink})`);
    svg.append(g);
  }
  return svg;
}

// Тематический значок блока: насыщенная «карточка» с кодом трека, надписью и узором.
const TRACK = { GO: 'accent', 'ФУНД': 'streak', SQL: 'success', PG: 'success', 'СЕТЬ': 'accent', 'ОС': 'streak', 'АРХ': 'success', 'ИНФРА': 'streak', 'ТЕСТ': 'success', 'БРОК': 'streak', 'СИСД': 'accent', 'СБОР': 'success' };
const ON = { accent: '--on-accent', streak: '--on-streak', success: '--surface-raised' };
function topicArt(svg, x) {
  const tier = TRACK[(x.sub || '').split('-')[0]] || 'accent';
  const [, main, ink] = TIER[tier];
  const on = ON[tier];
  const id = 'tp' + (++uid);
  const shape = 'M14 4h36a10 10 0 0 1 10 10v36a10 10 0 0 1-10 10H14A10 10 0 0 1 4 50V14A10 10 0 0 1 14 4z';
  const defs = el('defs');
  defs.innerHTML = `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(${main}) 82%,#fff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(${ink}) 88%,#000)"/></linearGradient>` +
    `<pattern id="${id}p" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#fff" fill-opacity=".18"/></pattern>` +
    `<clipPath id="${id}c"><path d="${shape}"/></clipPath>`;
  svg.append(defs);
  svg.append(el('path', { d: shape, fill: `url(#${id})` }));
  svg.append(el('path', { d: shape, fill: `url(#${id}p)` }));
  // большой декоративный круг-орбита
  svg.append(el('g', { 'clip-path': `url(#${id}c)` }, [
    el('circle', { cx: 54, cy: 54, r: 22, fill: 'none', stroke: '#fff', 'stroke-opacity': '.16', 'stroke-width': 6 }),
    el('circle', { cx: 10, cy: 8, r: 14, fill: '#fff', 'fill-opacity': '.10' }),
    el('rect', { x: -40, y: -10, width: 18, height: 90, class: 'b-shine', transform: 'rotate(25)' }),
  ]));
  const style = `fill:var(${on})`;
  const sub = el('text', { x: 10, y: 15, class: 'b-sub', style });
  sub.textContent = x.sub || '';
  svg.append(sub);
  const mark = x.mark || '';
  const fs = mark.length > 6 ? 9.5 : mark.length > 4 ? 11.5 : mark.length > 3 ? 14 : 17;
  const t = el('text', { x: 32, y: 36 + fs * 0.33, 'text-anchor': 'middle', class: 'b-code', style: style + `;font-size:${fs}px` });
  t.textContent = mark;
  svg.append(t);
  const g = achSvg(x.icon, 13); g.setAttribute('x', 44); g.setAttribute('y', 45); g.setAttribute('style', `color:var(${on});opacity:.85`);
  svg.append(g);
  svg.append(el('path', { d: shape, fill: 'none', stroke: '#000', 'stroke-opacity': '.12', 'stroke-width': 1 }));
  return svg;
}
