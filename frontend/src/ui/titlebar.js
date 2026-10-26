const logoUrl = new URL('../ds/logo.svg', import.meta.url).href;
import { h, $ } from './dom.js';
import { icon } from './icons.js';
import { win } from '../api.js';

const G = (window.Ascent && window.Ascent.glyph) || {};

export function mountTitlebar(winEl, { onToggleSidebar, onSearch }) {
  const maxBtn = h('button', { class: 'as-ctrl', 'aria-label': 'Развернуть', 'data-as-ctrl': 'max', html: G.max, title: 'Развернуть' });
  const bar = h('div', { class: 'as-titlebar' },
    h('div', { class: 'as-titlebar__brand' }, h('img', { class: 'as-logo', src: logoUrl, alt: '' }), 'Ascent'),
    h('div', { class: 'as-titlebar__title', id: 'as-title' }, ''),
    h('div', { class: 'as-titlebar__tools' },
      h('button', { class: 'as-iconbtn', title: 'Поиск (Ctrl+K)', 'aria-label': 'Поиск', onclick: onSearch }, icon('search')),
      h('button', { class: 'as-iconbtn', title: 'Сайдбар (Ctrl+B)', 'aria-label': 'Сайдбар', id: 'as-side-toggle', onclick: onToggleSidebar }, icon('sidebar'))),
    h('div', { class: 'as-titlebar__ctrls' },
      h('button', { class: 'as-ctrl', 'aria-label': 'Свернуть', html: G.min, title: 'Свернуть', onclick: () => win.minimise() }),
      maxBtn,
      h('button', { class: 'as-ctrl as-ctrl--close', 'aria-label': 'Закрыть', html: G.close, title: 'Закрыть', onclick: () => win.quit() })));

  // двойной клик по шапке (не по кнопкам) разворачивает окно
  bar.addEventListener('dblclick', (e) => {
    if (e.target.closest('button')) return;
    win.toggleMaximise();
  });
  maxBtn.addEventListener('click', () => win.toggleMaximise());

  const syncMax = async () => {
    const m = await win.isMaximised();
    maxBtn.innerHTML = m ? G.restore : G.max;
    maxBtn.setAttribute('aria-label', m ? 'Восстановить' : 'Развернуть');
    maxBtn.title = m ? 'Восстановить' : 'Развернуть';
  };
  window.addEventListener('resize', syncMax);
  window.addEventListener('blur', () => winEl.classList.add('is-inactive'));
  window.addEventListener('focus', () => winEl.classList.remove('is-inactive'));
  return {
    el: bar,
    setTitle(t) { $('#as-title', bar).textContent = t; document.title = t ? t + ' — Ascent' : 'Ascent'; },
    setScrolled(v) { bar.classList.toggle('is-scrolled', v); },
  };
}
