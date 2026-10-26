// Мини-помощники для DOM. Весь текст попадает в textContent: никакого innerHTML с данными.
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v; // только для собственных SVG и HTML из Go
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  append(el, kids);
  return el;
}

export function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.appendChild(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return el;
}

// Текст с кодом в обратных кавычках → узлы с <code class="code-sm">.
export function rich(text) {
  const out = [];
  const parts = String(text).split(/(`[^`]+`|\[\[[^\]]+\]\])/g);
  for (const p of parts) {
    if (!p) continue;
    if (p.length > 2 && p[0] === '`' && p[p.length - 1] === '`') out.push(h('code', { class: 'code-sm as-inline-code' }, p.slice(1, -1)));
    else if (p.startsWith('[[') && p.endsWith(']]')) {
      // вики-ссылка на документ плана: «[[98 ТЗ А — …]]»
      const name = p.slice(2, -2).split('#')[0];
      const num = /^\d\d/.exec(name);
      out.push(h('a', { class: 'as-a', onclick: (e) => { e.stopPropagation(); if (num) document.dispatchEvent(new CustomEvent('as-open-doc', { detail: num[0] })); } }, name.replace(/^\d\d\s+/, '')));
    } else out.push(p);
  }
  return out;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

export function pluralRu(n, one, few, many) {
  const a = Math.abs(n), m10 = a % 10, m100 = a % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

// Контейнер экрана: append молча пропускает null/false (тернарные выражения в разметке).
export function safeRoot(el) {
  el.append = (...kids) => append(el, kids);
  return el;
}

// Плавный счёт числа при первом показе экрана.
export function countUp(el, to, suffix = '') {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !to) { el.textContent = to + suffix; return el; }
  const t0 = performance.now(), dur = 800;
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(to * e) + suffix;
    if (k < 1) requestAnimationFrame(tick);
  };
  el.textContent = '0' + suffix;
  requestAnimationFrame(tick);
  return el;
}

// Цвет трека по ID (ФУНД-1.2 → ФУНД): чуть больше цвета, чтобы треки различались с первого взгляда.
const TRK = { GO: 'var(--accent)', 'ФУНД': 'var(--c-amber)', SQL: 'var(--success)', PG: 'var(--success)', 'СЕТЬ': 'var(--c-blue)', 'ОС': 'var(--c-blue)', 'АРХ': 'var(--c-violet)', 'СИСД': 'var(--c-violet)', 'ТЕСТ': 'var(--c-pink)', 'ИНФРА': 'var(--streak)', 'БРОК': 'var(--c-pink)', 'СБОР': 'var(--c-violet)', 'ПРОГОН': 'var(--c-pink)' };
export function trk(id) { return TRK[String(id).split('-')[0]] || 'var(--accent)'; }
export function idTag(id, cls = 'as-nav-id') { return h('span', { class: cls + ' as-trk', style: { '--trk': trk(id) } }, id); }

// Маркер ◆ — самоцветный ромб; отвеченный — зелёный с галочкой.
export function gem(done, size = 16) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 16 16'); s.setAttribute('width', size); s.setAttribute('height', size);
  s.setAttribute('class', 'as-gem' + (done ? ' is-done' : '')); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path class="g-b" d="M8 1.2l6.3 6.8L8 14.8 1.7 8z"/><path class="g-t" d="M8 1.2l6.3 6.8H1.7z"/><path class="g-h" d="M8 3.4l3.3 3.6H4.7z"/>' +
    (done ? '<path class="g-c" d="M5.4 8.2l1.8 1.8 3.4-3.6"/>' : '');
  return s;
}

// Звёзды частоты на собесе: шкала из трёх (★★☆), цвет и короткая подпись — чтобы читалось сразу.
const STAR = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1l1.5 3.1 3.4.5-2.45 2.4.58 3.4L6 8.8 2.97 10.4l.58-3.4L1.1 4.6l3.4-.5z"/></svg>';
const STAR_TEXT = ['', 'редко', 'бывает', 'часто'];
export function starChip(n) {
  if (!n) return null;
  return h('span', { class: 'as-freq lv' + n, title: `Как часто встречается на собесах: ${STAR_TEXT[n]} (${n} из 3)`, 'aria-label': `На собесах: ${STAR_TEXT[n]}` },
    h('span', { class: 'as-freq__dots' }, [1, 2, 3].map((i) => h('i', { class: i <= n ? 'on' : '' }))), STAR_TEXT[n]);
}

// Подпись маркера над вопросом.
export function markerLabel(done) {
  return h('span', { class: 'as-mlabel' + (done ? ' is-done' : '') }, done ? '◆ Отвечено' : '◆ Маркер · закрывает блок');
}
