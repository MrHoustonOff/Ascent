// Галерея картин: миниатюры (с кэшем), просмотр вблизи с описанием и скачиванием, окно «Новая картина».
// Картины этапов открываются вехами (25/50/75 % и закрытие), постоянные доступны всегда.
import { api } from '../api.js';
import { S, lsGet, lsSet } from '../state.js';
import { h, clear } from './dom.js';
import { toast } from './toast.js';
import { PAINTINGS, PAINTING, paintingCanvas, drawPaintingCard, paintingAspect } from './recap-stage.js';
import { go } from '../actions.js';

const THUMB_W = 360, THUMB_V = 'gal.thumb.v1.';
const thumbs = new Map(); // id → Promise<dataURL>
const today = () => new Date().toISOString().slice(0, 10);
const ctx = () => ({ nick: S.settings?.nick || '', date: today() });

// очередь отрисовки: по одной картине, чтобы интерфейс не замирал
let chain = Promise.resolve();
const enqueue = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };
export function thumbURL(id) {
  if (thumbs.has(id)) return thumbs.get(id);
  const key = THUMB_V + id + (id === 'newyear' ? '.' + today().slice(0, 4) : '');
  let cached = null;
  try { cached = localStorage.getItem(key); } catch { /* хранилище недоступно — рисуем заново */ }
  const pr = cached ? Promise.resolve(cached) : enqueue(async () => {
    await new Promise((r) => setTimeout(r, 0));
    const cv = await paintingCanvas(id, THUMB_W, ctx());
    const url = cv ? cv.toDataURL('image/jpeg', 0.84) : '';
    try { if (url) localStorage.setItem(key, url); } catch { /* места нет — живём без кэша */ }
    return url;
  });
  thumbs.set(id, pr);
  return pr;
}

// ---------- открыто / новое ----------
export async function galleryState() {
  const st = await api.Gallery();
  const byId = Object.fromEntries((st || []).map((p) => [p.id, p]));
  return PAINTINGS.map((p) => p.kind === 'stage' ? { ...p, ...byId[p.id], title: p.title } : { ...p, unlocked: true, always: true });
}
const seen = () => new Set(lsGet('gal.seen', []));
export const isNew = (p) => p.unlocked && !p.always && !seen().has(p.id);
export function markSeen(id) { const s = seen(); if (!s.has(id)) { s.add(id); lsSet('gal.seen', [...s]); } }
export const lockHint = (p) => p.pct >= 100 ? `Откроется, когда этап ${p.num} будет пройден` : `Откроется на ${p.pct} % уроков этапа ${p.num}`;

// ---------- скачивание ----------
const fileName = (p) => p.kind === 'stage' ? `Этап ${p.num} · ${p.title} — ${p.sub}` : p.title.replace(/[!?]/g, '');
export async function savePainting(id, { canvasOnly = false } = {}) {
  const p = PAINTING[id]; if (!p) return;
  try {
    let url;
    if (canvasOnly) url = (await paintingCanvas(id, 1600, ctx())).toDataURL('image/png');
    else { const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920; await drawPaintingCard(cv.getContext('2d'), 1080, 1920, id, ctx()); url = cv.toDataURL('image/png'); }
    const path = await api.SavePainting(fileName(p) + (canvasOnly ? ' (холст)' : ''), url);
    if (path) toast({ title: 'Картина сохранена', body: path });
  } catch (e) {
    console.error(e);
    toast({ title: 'Не удалось сохранить картину', kind: 'streak' });
  }
}

// ---------- рама (CSS) с миниатюрой ----------
export function framed(p, { locked = false, size = '' } = {}) {
  const img = h('img', { class: 'as-galframe__img', alt: p.title, decoding: 'async' });
  const box = h('div', { class: `as-galframe is-${p.frame}${locked ? ' is-locked' : ''}${size ? ' is-' + size : ''}`, style: { '--ar': String(paintingAspect(p.id)) } },
    h('div', { class: 'as-galframe__canvas' }, locked
      ? h('div', { class: 'as-galframe__lock' }, h('span', { class: 'as-galframe__q' }, '?'))
      : [img, h('span', { class: 'as-galframe__shine', 'aria-hidden': 'true' })]));
  if (!locked) { box.classList.add('is-loading'); thumbURL(p.id).then((u) => { if (u) img.src = u; box.classList.remove('is-loading'); }); }
  return box;
}

// ---------- просмотр вблизи ----------
let view = null;
export function openPainting(id, list) {
  const items = (list || []).filter((x) => x.unlocked);
  let i = Math.max(0, items.findIndex((x) => x.id === id));
  if (!items.length) return;
  if (!view) {
    const scrim = h('div', { class: 'as-scrim as-galview__scrim', onclick: (e) => { if (e.target === scrim) closeView(); } });
    (document.querySelector('.as-window') || document.body).append(scrim);
    window.addEventListener('keydown', onViewKey, true);
    view = { scrim };
  }
  view.show = (k) => { i = (k + items.length) % items.length; paint(); };
  view.step = (d) => view.show(i + d);
  function paint() {
    const p = items[i]; markSeen(p.id);
    const big = h('div', { class: 'as-galview__art' }, framed(p, { size: 'big' }));
    // крупнее миниатюры — дорисовываем в высоком разрешении
    paintingCanvas(p.id, 960, ctx()).then((cv) => { const img = big.querySelector('img'); if (cv && img && view && items[i] === p) img.src = cv.toDataURL('image/jpeg', 0.9); });
    const meta = h('div', { class: 'as-galview__meta' },
      h('div', { class: 'as-galview__kicker' }, p.kind === 'stage' ? `Этап ${p.num} из 7 · картина ${[25, 50, 75, 100].indexOf(p.pct) + 1} из 4` : 'Постоянная картина'),
      h('h2', { class: 'as-galview__title' }, p.title),
      p.sub ? h('div', { class: 'as-galview__sub' }, p.sub) : null,
      p.act ? h('div', { class: 'as-galview__act' }, 'Сюжет: ' + p.act) : null,
      h('p', { class: 'as-galview__story' }, p.story),
      h('div', { class: 'as-galview__when' }, p.always ? 'Доступна всегда' : p.when ? 'Получена ' + p.when : 'Получена отметками «пройдено ранее»'),
      h('div', { class: 'as-galview__btns' },
        h('button', { class: 'as-btn as-btn--primary', onclick: () => savePainting(p.id) }, 'Скачать'),
        h('button', { class: 'as-btn as-btn--secondary', title: 'Только холст, без стены и подписей', onclick: () => savePainting(p.id, { canvasOnly: true }) }, 'Только холст')),
      items.length > 1 ? h('div', { class: 'as-galview__nav' },
        h('button', { class: 'as-iconbtn', 'aria-label': 'Предыдущая', onclick: () => view.step(-1) }, '←'),
        h('span', null, `${i + 1} / ${items.length}`),
        h('button', { class: 'as-iconbtn', 'aria-label': 'Следующая', onclick: () => view.step(1) }, '→')) : null);
    clear(view.scrim);
    view.scrim.append(h('div', { class: 'as-galview', role: 'dialog', 'aria-modal': 'true', 'aria-label': p.title },
      h('button', { class: 'as-iconbtn as-galview__close', 'aria-label': 'Закрыть', onclick: closeView }, '✕'), big, meta));
  }
  paint();
}
function onViewKey(e) {
  if (!view) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeView(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); view.step(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); view.step(1); }
}
function closeView() {
  if (!view) return;
  view.scrim.remove(); window.removeEventListener('keydown', onViewKey, true); view = null;
  document.dispatchEvent(new Event('as-gallery-seen'));
}

// ---------- окно «Новая картина» ----------
const queue = [];
let winOpen = null;
export function showPaintings(list) {
  const popped = new Set(lsGet('gal.popped', [])); // одна картина — одно окно, даже после «отменить» и повторной отметки
  for (const x of list || []) if (PAINTING[x.id] && !popped.has(x.id) && !queue.some((q) => q.id === x.id)) { queue.push(x); popped.add(x.id); }
  lsSet('gal.popped', [...popped]);
  if (!winOpen && queue.length) waitAndShow();
}
function waitAndShow() { // после окон достижений: картина — отдельный праздник
  if (document.querySelector('.as-achwin__scrim') || view) { setTimeout(waitAndShow, 400); return; }
  nextPainting();
}
function nextPainting() {
  const x = queue.shift();
  if (!x) { closeWin(); return; }
  const p = { ...PAINTING[x.id], ...x, title: PAINTING[x.id].title };
  if (!winOpen) {
    const scrim = h('div', { class: 'as-scrim as-paintwin__scrim' });
    (document.querySelector('.as-window') || document.body).append(scrim);
    window.addEventListener('keydown', onWinKey, true);
    winOpen = { scrim };
  }
  const card = h('div', { class: 'as-paintwin', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Новая картина: ' + p.title },
    h('div', { class: 'as-paintwin__rays', 'aria-hidden': 'true' }),
    h('div', { class: 'as-paintwin__kicker' }, '✦ Новая картина в галерее ✦'),
    framed(p, { size: 'win' }),
    h('h2', { class: 'as-paintwin__title' }, p.title),
    p.sub ? h('div', { class: 'as-paintwin__sub' }, p.sub) : null,
    h('div', { class: 'as-paintwin__btns' },
      h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => savePainting(p.id) }, 'Скачать'),
      h('button', { class: 'as-btn as-btn--secondary', onclick: () => { queue.length = 0; closeWin(); go('#/gallery/' + p.id); } }, 'В галерею'),
      h('button', { class: 'as-btn as-btn--primary', autofocus: true, onclick: nextPainting }, queue.length ? 'Дальше' : 'Отлично')));
  clear(winOpen.scrim); winOpen.scrim.append(card);
  requestAnimationFrame(() => card.querySelector('.as-btn--primary')?.focus());
}
function onWinKey(e) { if (winOpen && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); queue.length = 0; closeWin(); } }
function closeWin() { if (!winOpen) return; winOpen.scrim.remove(); window.removeEventListener('keydown', onWinKey, true); winOpen = null; }
