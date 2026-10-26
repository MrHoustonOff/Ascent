// Масштаб интерфейса: Ctrl + = / Ctrl + − / Ctrl + 0 и Ctrl + колесо. Значение хранится в настройке ui_zoom.
// Смена плавная: содержимое «доезжает» от прежнего размера к новому. Гофер в табличке — по настройке zoom_gopher.
import { api } from '../api.js';
import { S } from '../state.js';
import { h } from './dom.js';

export const STEPS = [70, 80, 90, 100, 110, 125, 140, 160, 175];
const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let cur = 100, hud = null, hideT = 0, saveT = 0;

export const zoomPct = () => cur;
export const zoomK = () => cur / 100;

function clampPct(v) {
  const n = Math.round(+v);
  return n >= STEPS[0] && n <= STEPS[STEPS.length - 1] ? n : 100;
}

// Без анимации: при запуске.
export function initZoom(pct) {
  cur = clampPct(pct);
  document.getElementById('app').style.zoom = cur === 100 ? '' : String(cur / 100);
}

export function setZoom(pct) {
  const next = clampPct(pct);
  if (next === cur) { showHud(next, 0); return; }
  const prev = cur, app = document.getElementById('app');
  cur = next;
  app.style.zoom = next === 100 ? '' : String(next / 100);
  if (!reduce() && app.animate) {
    app.animate([{ transform: `scale(${prev / next})`, opacity: 0.85 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  window.dispatchEvent(new Event('resize')); // узкое окно считается с учётом масштаба
  document.dispatchEvent(new CustomEvent('as-zoom', { detail: next }));
  showHud(next, next > prev ? 1 : -1);
  S.settings.ui_zoom = String(next);
  clearTimeout(saveT);
  saveT = setTimeout(() => api.SetSetting('ui_zoom', String(next)).catch(() => {}), 300);
}

export function zoomStep(dir) {
  if (dir === 0) return setZoom(100);
  const next = dir > 0 ? STEPS.find((s) => s > cur) : [...STEPS].reverse().find((s) => s < cur);
  setZoom(next ?? cur);
}

// Гофер без плитки: та же фигура, что в иконке приложения.
const GOPHER = '<svg viewBox="14 12 72 84" aria-hidden="true">' +
  '<path d="M24 46c0-17 11-28 26-28s26 11 26 28v30c0 10-11 16-26 16S24 86 24 76z" fill="#7AD3E6"/>' +
  '<path d="M30 22c-5-5-12 0-8 5M70 22c5-5 12 0 8 5" stroke="#7AD3E6" stroke-width="6" stroke-linecap="round" fill="none"/>' +
  '<path class="g-arm" d="M24 60c-6 0-8 6-4 8M76 60c6 0 8 6 4 8" stroke="#7AD3E6" stroke-width="6" stroke-linecap="round" fill="none"/>' +
  '<ellipse cx="50" cy="74" rx="14" ry="12" fill="#B7EAF3" opacity=".7"/>' +
  '<circle cx="39" cy="38" r="10" fill="#fff"/><circle cx="61" cy="38" r="10" fill="#fff"/>' +
  '<g class="g-pupils"><circle cx="42" cy="39" r="4" fill="#111"/><circle cx="64" cy="39" r="4" fill="#111"/>' +
  '<circle cx="43.3" cy="37.5" r="1.3" fill="#fff"/><circle cx="65.3" cy="37.5" r="1.3" fill="#fff"/></g>' +
  '<ellipse cx="50" cy="51" rx="7" ry="5" fill="#F3D6B3"/><ellipse cx="50" cy="48.5" rx="3.3" ry="2.2" fill="#2A2020"/>' +
  '<rect x="47" y="54" width="6" height="6" rx="1.2" fill="#fff" stroke="#9AA" stroke-width=".6"/><path d="M50 54v6" stroke="#9AA" stroke-width=".6"/></svg>';

function showHud(pct, dir) {
  const gopher = S.settings.zoom_gopher !== '0';
  if (!hud) {
    hud = h('div', { class: 'as-zoomhud', role: 'status', 'aria-live': 'polite' });
    document.body.append(hud);
  }
  hud.className = 'as-zoomhud' + (gopher ? ' has-gopher' : '');
  hud.setAttribute('data-theme', document.getElementById('app').getAttribute('data-theme') || 'light');
  hud.replaceChildren(
    gopher ? h('div', { class: 'as-zoomhud__gopher' + (dir > 0 ? ' is-up' : dir < 0 ? ' is-down' : ' is-same'), style: { '--g': String(0.7 + (pct - STEPS[0]) / (STEPS[STEPS.length - 1] - STEPS[0]) * 0.6) }, html: GOPHER }) : null,
    h('div', { class: 'as-zoomhud__text' },
      h('div', { class: 'as-zoomhud__pct as-tnum' }, pct + ' %'),
      h('div', { class: 'as-zoomhud__steps', 'aria-hidden': 'true' }, STEPS.map((s) => h('i', { class: (s === pct ? 'is-on' : '') + (s === 100 ? ' is-base' : '') }))),
      h('div', { class: 'as-zoomhud__hint' }, 'Ctrl + 0 — обычный размер')));
  hud.classList.remove('is-hide');
  void hud.offsetWidth;
  hud.classList.add('is-show');
  clearTimeout(hideT);
  hideT = setTimeout(() => { hud.classList.remove('is-show'); hud.classList.add('is-hide'); }, 1300);
}

// Клавиши и колесо. Коды клавиш, а не символы: работает и в русской раскладке.
export function bindZoomKeys() {
  window.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const c = e.code;
    if (c === 'Equal' || c === 'NumpadAdd' || e.key === '+' || e.key === '=') { e.preventDefault(); e.stopImmediatePropagation(); zoomStep(1); }
    else if (c === 'Minus' || c === 'NumpadSubtract' || e.key === '-') { e.preventDefault(); e.stopImmediatePropagation(); zoomStep(-1); }
    else if (c === 'Digit0' || c === 'Numpad0') { e.preventDefault(); e.stopImmediatePropagation(); zoomStep(0); }
  }, true);
  let acc = 0, last = 0;
  window.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const now = performance.now();
    if (now - last > 400) acc = 0;
    last = now;
    acc += e.deltaY;
    if (Math.abs(acc) >= 80) { zoomStep(acc < 0 ? 1 : -1); acc = 0; }
  }, { passive: false });
}
