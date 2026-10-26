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
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
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
