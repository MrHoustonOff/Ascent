import { api } from './api.js';
import { S, subscribe, emit, runUndo } from './state.js';
import { h, clear, $ } from './ui/dom.js';
import { mountTitlebar } from './ui/titlebar.js';
import { renderSidebar, revealInTree, pathHash } from './ui/sidebar.js';
import { mountToasts, toast } from './ui/toast.js';
import { openPalette } from './ui/palette.js';
import { go, openId, refresh } from './actions.js';
import * as today from './screens/today.js';
import * as path from './screens/path.js';
import * as stats from './screens/stats.js';
import * as bank from './screens/bank.js';
import * as glossary from './screens/glossary.js';
import * as docs from './screens/docs.js';
import * as settings from './screens/settings.js';
import { runOnboarding } from './screens/onboarding.js';

const SCREENS = { today, path, stats, bank, glossary, docs, settings };
const app = document.getElementById('app');
let winEl, main, sideEl, bar;
let renderSeq = 0;

// ---------- тема ----------
const mq = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = S.settings.theme || 'system';
  app.setAttribute('data-theme', t === 'system' ? (mq.matches ? 'dark' : 'light') : t);
}
mq.addEventListener("change", applyTheme);
S.hooks.applyTheme = applyTheme;

// ---------- оболочка ----------
function buildShell() {
  winEl = h('div', { class: 'as-window is-maximized' });
  bar = mountTitlebar(winEl, { onToggleSidebar: toggleSidebar, onSearch: search });
  sideEl = h('nav', { class: 'as-sidebar', 'aria-label': 'Навигация' });
  main = h('main', { class: 'as-window__main', id: 'main', tabindex: '-1' });
  main.addEventListener('scroll', () => bar.setScrolled(main.scrollTop > 2), { passive: true });
  const body = h('div', { class: 'as-window__body' }, sideEl, h('div', { class: 'as-scrim--side', onclick: () => winEl.classList.remove('is-side-open') }), main);
  winEl.append(bar.el, body);
  app.append(winEl);
  mountToasts(winEl);
  S.hooks.sidebar = () => renderSidebar(sideEl, closeOverlay);
  S.hooks.main = main;
  fit();
  window.addEventListener('resize', fit);
}

function fit() {
  const narrow = window.innerWidth < 1000;
  winEl.classList.toggle('is-narrow', narrow);
  if (!narrow) winEl.classList.remove('is-side-open');
}
const closeOverlay = () => winEl.classList.remove('is-side-open');
function toggleSidebar() {
  if (winEl.classList.contains('is-narrow')) winEl.classList.toggle('is-side-open');
  else winEl.classList.toggle('is-side-closed');
}
function search() {
  openPalette((hit) => {
    if (hit.kind === 'term') { if (/\d/.test(hit.id)) openId(hit.id.match(/[A-ZА-ЯЁ]+-\d+(?:\.\d+){0,2}/)?.[0] || ''); else go('#/glossary'); return; }
    openId(hit.id);
  });
}

// ---------- маршрутизация ----------
function parseHash() {
  const m = location.hash.replace(/^#\/?/, '').split('/');
  const name = m[0] || 'today';
  const arg = decodeURIComponent(m.slice(1).join('/'));
  return SCREENS[name] ? { name, arg } : { name: 'today', arg: '' };
}

async function renderRoute() {
  const my = ++renderSeq;
  S.route = parseHash();
  if (S.route.name === 'path' && !S.route.arg) { location.replace(pathHash()); return; }
  const scr = SCREENS[S.route.name];
  const keep = main.scrollTop;
  const sameScreen = main.dataset.screen === S.route.name + ':' + S.route.arg;
  const root = h('div', { class: 'as-screen' });
  let title = '';
  try {
    title = (await scr.render(root, S.route.arg)) || '';
  } catch (e) {
    console.error(e);
    root.append(h('div', { class: 'as-empty' }, 'Не удалось показать экран. Попробуйте ещё раз.'));
  }
  if (my !== renderSeq) return;
  clear(main);
  main.append(root);
  main.dataset.screen = S.route.name + ':' + S.route.arg;
  main.scrollTop = sameScreen ? keep : 0;
  bar.setTitle(title);
  if (S.route.name === 'path') revealInTree(S.route.arg.replace(/^(.+-\d+\.\d+)\.\d+$/, '$1'));
  renderSidebar(sideEl, closeOverlay);
  S.settings.last_route !== location.hash && api.SetSetting('last_route', location.hash).catch(() => {});
  S.settings.last_route = location.hash;
}

// ---------- клавиши ----------
function inField(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}
window.addEventListener('keydown', async (e) => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key.toLowerCase() === 'k') { e.preventDefault(); search(); return; }
  if (ctrl && e.key.toLowerCase() === 'b') { e.preventDefault(); toggleSidebar(); return; }
  if (ctrl && e.key.toLowerCase() === 'z' && !inField(e)) { if (await runUndo()) e.preventDefault(); return; }
  if (ctrl && e.key === ',') { e.preventDefault(); go('#/settings'); return; }
  if (ctrl && /^[1-6]$/.test(e.key)) {
    e.preventDefault();
    go(['#/today', pathHash(), '#/stats', '#/bank', '#/glossary', '#/docs/00'][+e.key - 1]);
    return;
  }
  if (e.key === 'Escape') { winEl.classList.remove('is-side-open'); document.dispatchEvent(new CustomEvent('as-escape')); }
  if (!ctrl && !e.altKey && !inField(e)) document.dispatchEvent(new CustomEvent('as-key', { detail: e }));
});

// ---------- запуск ----------
async function start() {
  try { S.settings = await api.Settings(); } catch (e) { console.error(e); S.settings = {}; }
  applyTheme();
  buildShell();
  S.tree = await api.Tree();
  window.addEventListener('hashchange', renderRoute);
  subscribe(renderRoute);
  subscribe(() => renderSidebar(sideEl, closeOverlay));
  if (!location.hash || location.hash === '#') location.replace(S.settings.last_route || '#/today');
  await renderRoute();
  if (S.settings.onboarded !== '1') runOnboarding();
  if (window.go && window.go.app) window.go.app.App.Docs && 0;
}
start();
