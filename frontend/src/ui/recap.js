// Итоги дня или недели: инфографика 1080×1920 (вертикальный формат для коротких видео) в несколько страниц.
import { api } from '../api.js';
import { h, clear, pluralRu } from './dom.js';
import { openDialog } from './dialog.js';
import { toast, toastError } from './toast.js';
import { achBadge } from './achicons.js';

const W = 1080, H = 1920;
// Цвета — тёмная тема дизайн-системы (tokens.css)
const C = { bg1: '#0E3A47', bg2: '#121214', ink: '#F5F5F7', muted: '#A8A8AE', subtle: '#9E9EA5', accent: '#4CC9EA', streak: '#FFA640', success: '#4FD08F', card: 'rgba(255,255,255,0.06)', line: 'rgba(255,255,255,0.12)' };
const FONT = '-apple-system, "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif';
const MONO = 'ui-monospace, "Cascadia Code", Consolas, monospace';
const themesW = (n) => pluralRu(n, 'тема', 'темы', 'тем');

export function openRecap() {
  let kind = 'day', date = '', pages = [], data = null;
  const preview = h('div', { class: 'as-recap__pages' });
  const dateInp = h('input', { class: 'as-input', type: 'date', 'aria-label': 'Дата', style: { width: '170px' } });
  const tabs = h('div', { class: 'as-tabs' }, [['day', 'День'], ['week', 'Неделя']].map(([k, l]) =>
    h('button', { class: 'as-tab' + (k === kind ? ' is-active' : ''), onclick: (e) => { kind = k; [...e.target.parentNode.children].forEach((c) => c.classList.toggle('is-active', c === e.target)); build(); } }, l)));
  const info = h('div', { class: 'caption as-subtle' }, '');
  const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
    h('p', { class: 'as-p-callout', style: { fontSize: '14px' } }, 'Картинки 1080×1920 для вертикальных видео: темы, блоки, достижения и прогресс за выбранный период.'),
    h('div', { class: 'as-rowx' }, tabs, dateInp), preview, info);
  dateInp.addEventListener('change', () => { date = dateInp.value; build(); });
  const dlg = openDialog({
    title: 'Итоги', body, cls: 'as-recap', focus: '.as-dialog__actions .as-btn',
    actions: [
      { label: 'Закрыть', onClick: (d) => d.close() },
      { label: 'Сохранить картинки', kind: 'primary', onClick: save },
    ],
  });

  async function build() {
    clear(preview);
    preview.append(h('div', { class: 'as-recap__loading' }, 'Собираю…'));
    try {
      data = await api.Recap(kind, date);
      if (!dateInp.value) dateInp.value = data.date;
      pages = await render(data);
      clear(preview);
      pages.forEach((cv, i) => {
        const img = h('img', { src: cv.toDataURL('image/png'), alt: `Страница ${i + 1}`, class: 'as-recap__thumb' });
        preview.append(img);
      });
      info.textContent = `${data.period} · ${pages.length} ${pluralRu(pages.length, 'картинка', 'картинки', 'картинок')}`;
    } catch (e) { console.error(e); clear(preview); preview.append(h('div', { class: 'as-recap__loading' }, 'Не удалось собрать итоги.')); }
  }

  async function save() {
    if (!pages.length) return;
    const urls = pages.map((cv) => cv.toDataURL('image/png'));
    const name = `ascent-${kind === 'week' ? 'week' : 'day'}-${(data.period || '').replace(/[^\dа-яa-z]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`;
    try {
      const dir = await api.SaveImages(name, urls);
      if (dir) toast({ title: 'Картинки сохранены', body: dir });
    } catch {
      // в браузере (разработка) — обычная загрузка
      urls.forEach((u, i) => { const a = document.createElement('a'); a.href = u; a.download = `${name}-${i + 1}.png`; a.click(); });
      toast({ title: 'Картинки скачаны' });
    }
  }
  build();
  return dlg;
}

// ---------- рисование ----------
function canvas() {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, W * 0.4, H);
  grd.addColorStop(0, C.bg1); grd.addColorStop(0.55, C.bg2); grd.addColorStop(1, C.bg2);
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // мягкое свечение
  const glow = g.createRadialGradient(W * 0.85, 160, 10, W * 0.85, 160, 620);
  glow.addColorStop(0, 'rgba(76,201,234,0.28)'); glow.addColorStop(1, 'rgba(76,201,234,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  return { cv, g };
}

function header(g, d, page, total) {
  g.fillStyle = C.accent; roundRect(g, 80, 96, 56, 56, 16); g.fill();
  g.fillStyle = '#00232C'; g.font = `800 32px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('A', 108, 126);
  g.textAlign = 'left'; g.fillStyle = C.ink; g.font = `700 34px ${FONT}`;
  g.fillText('Ascent', 156, 116);
  g.fillStyle = C.muted; g.font = `400 26px ${FONT}`;
  g.fillText('Go — ROADMAP', 156, 148);
  if (total > 1) { g.textAlign = 'right'; g.fillStyle = C.subtle; g.font = `500 26px ${FONT}`; g.fillText(`${page} / ${total}`, W - 80, 126); g.textAlign = 'left'; }
}

function footer(g, d) {
  g.strokeStyle = C.line; g.lineWidth = 2; g.beginPath(); g.moveTo(80, H - 170); g.lineTo(W - 80, H - 170); g.stroke();
  g.fillStyle = C.muted; g.font = `400 28px ${FONT}`; g.textBaseline = 'alphabetic';
  g.fillText(`Пройдено ${d.pct} % пути · темп ${d.pace} ${pluralRu(Math.round(+d.pace.replace(',', '.')), 'тема', 'темы', 'тем')} в день`, 80, H - 110);
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function wrap(g, text, maxW) {
  const words = text.replace(/`/g, '').split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

function ring(g, cx, cy, r, pct) {
  g.lineCap = 'round'; g.lineWidth = 26;
  g.strokeStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = C.accent; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.005, pct / 100)); g.stroke();
  g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 64px ${FONT}`;
  g.fillText(pct + '%', cx, cy - 8);
  g.fillStyle = C.muted; g.font = `400 26px ${FONT}`; g.fillText('пути', cx, cy + 44);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}

function statTile(g, x, y, w, n, label, color) {
  g.fillStyle = C.card; roundRect(g, x, y, w, 200, 36); g.fill();
  g.fillStyle = color || C.ink; g.font = `800 76px ${FONT}`; g.fillText(String(n), x + 36, y + 110);
  g.fillStyle = C.muted; g.font = `400 28px ${FONT}`; g.fillText(label, x + 36, y + 160);
}

function hex(c) {
  c = c.replace('#', '');
  if (c.length <= 4) c = c.split('').map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
}
function mix(a, b, p) {
  const x = hex(a), y = hex(b);
  return '#' + x.map((v, i) => Math.round(v * p + y[i] * (1 - p)).toString(16).padStart(2, '0')).join('');
}

async function badgeImage(a) {
  // значок из SVG: CSS-переменные подставляем значениями тёмной темы
  const probe = document.createElement('div');
  probe.setAttribute('data-theme', 'dark'); probe.className = 'as-root'; probe.style.position = 'absolute'; probe.style.left = '-9999px';
  document.body.append(probe);
  const cs = getComputedStyle(probe);
  const svg = achBadge({ ...a, unlocked: true }, 64);
  probe.append(svg);
  let xml = new XMLSerializer().serializeToString(svg);
  xml = xml.replace(/var\((--[\w-]+)\)/g, (_, v) => cs.getPropertyValue(v).trim() || '#888');
  probe.remove();
  // color-mix внутри SVG-картинки поддерживается не везде: смешиваем сами
  xml = xml.replace(/color-mix\(in srgb,\s*(#[0-9a-fA-F]{3,8})\s+(\d+)%,\s*(#[0-9a-fA-F]{3,8})\)/g, (_, a, p, b) => mix(a, b, +p / 100));
  if (!/^<svg[^>]*xmlns=/.test(xml)) xml = xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  xml = xml.replace(/^(<svg[^>]*>)/, `$1<style>.b-num{font:800 19px ${FONT}}.b-code{font-family:${MONO};font-weight:700}.b-sub{font:700 6.5px ${MONO};opacity:.85}.b-shine{display:none}</style>`);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  await img.decode().catch(() => {});
  return img;
}

async function render(d) {
  const out = [];
  const pagesThemes = [];
  for (let i = 0; i < d.themes.length; i += 8) pagesThemes.push(d.themes.slice(i, i + 8));
  const pagesAch = [];
  for (let i = 0; i < d.achievements.length; i += 6) pagesAch.push(d.achievements.slice(i, i + 6));
  const total = 1 + pagesThemes.length + (d.kind === 'week' ? 1 : 0) + pagesAch.length;
  let page = 0;

  // 1. обложка
  {
    const { cv, g } = canvas(); header(g, d, ++page, total);
    g.fillStyle = C.accent; g.font = `600 34px ${FONT}`; g.fillText(d.title.toUpperCase(), 80, 300);
    g.fillStyle = C.muted; g.font = `400 34px ${FONT}`; g.fillText(d.period, 80, 352);
    g.fillStyle = C.ink; g.font = `800 300px ${FONT}`; g.fillText(String(d.themes.length), 64, 650);
    g.font = `700 64px ${FONT}`; g.textBaseline = 'alphabetic'; g.fillText(pluralRu(d.themes.length, 'тема закрыта', 'темы закрыто', 'тем закрыто'), 80, 800);
    const tw = (W - 160 - 40) / 3;
    statTile(g, 80, 880, tw, d.lessons, pluralRu(d.lessons, 'урок', 'урока', 'уроков'));
    statTile(g, 80 + tw + 20, 880, tw, d.checks, pluralRu(d.checks, 'ответ', 'ответа', 'ответов'));
    statTile(g, 80 + (tw + 20) * 2, 880, tw, d.streak, pluralRu(d.streak, 'день', 'дня', 'дней') + ' подряд', C.streak);
    ring(g, 250, 1340, 150, d.pct);
    g.fillStyle = C.ink; g.font = `700 40px ${FONT}`;
    wrap(g, (d.stage || 'Путь пройден').split(':')[0], 520).slice(0, 3).forEach((l, i) => g.fillText(l, 470, 1290 + i * 52));
    g.fillStyle = C.muted; g.font = `400 30px ${FONT}`; g.fillText(`${d.done} из ${d.total} уроков`, 470, 1300 + Math.min(3, wrap(g, (d.stage || '').split(':')[0], 520).length) * 52 + 10);
    if (d.blocks.length) { g.fillStyle = C.success; g.font = `600 32px ${FONT}`; g.fillText(`Закрыто ${d.blocks.length} ${pluralRu(d.blocks.length, 'блок', 'блока', 'блоков')}: ${d.blocks.map((b) => b.id).join(', ')}`.slice(0, 60), 80, 1600); }
    footer(g, d); out.push(cv);
  }
  // 2. неделя по дням
  if (d.kind === 'week') {
    const { cv, g } = canvas(); header(g, d, ++page, total);
    g.fillStyle = C.ink; g.font = `800 72px ${FONT}`; g.fillText('Неделя по дням', 80, 330);
    g.fillStyle = C.muted; g.font = `400 32px ${FONT}`; g.fillText(`${d.activeDays} из 7 дней с учёбой`, 80, 390);
    const max = Math.max(1, ...d.days.map((x) => x.themes));
    const bw = (W - 160) / 7, base = 1450, hMax = 900;
    d.days.forEach((x, i) => {
      const bh = x.themes ? Math.max(24, (x.themes / max) * hMax) : 10;
      const bx = 80 + i * bw + bw * 0.16, ww = bw * 0.68;
      const grd = g.createLinearGradient(0, base - bh, 0, base);
      grd.addColorStop(0, C.accent); grd.addColorStop(1, 'rgba(76,201,234,0.45)');
      g.fillStyle = x.themes ? grd : 'rgba(255,255,255,0.10)'; roundRect(g, bx, base - bh, ww, bh, 22); g.fill();
      g.textAlign = 'center';
      if (x.themes) { g.fillStyle = C.ink; g.font = `800 52px ${FONT}`; g.fillText(String(x.themes), bx + ww / 2, base - bh - 24); }
      g.fillStyle = C.muted; g.font = `500 34px ${FONT}`; g.fillText(x.label, bx + ww / 2, base + 60);
      g.textAlign = 'left';
    });
    footer(g, d); out.push(cv);
  }
  // 3. темы
  for (const list of pagesThemes) {
    const { cv, g } = canvas(); header(g, d, ++page, total);
    g.fillStyle = C.ink; g.font = `800 72px ${FONT}`; g.fillText('Закрытые темы', 80, 330);
    let y = 430;
    for (const t of list) {
      g.fillStyle = C.card; roundRect(g, 80, y, W - 160, 136, 32); g.fill();
      g.fillStyle = C.success; g.beginPath(); g.arc(140, y + 68, 22, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#12372A'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(129, y + 69); g.lineTo(137, y + 77); g.lineTo(152, y + 60); g.stroke();
      g.fillStyle = C.subtle; g.font = `500 26px ${MONO}`; g.fillText(t.id, 190, y + 52);
      g.fillStyle = C.ink; g.font = `600 38px ${FONT}`;
      const l = wrap(g, t.title, W - 160 - 150);
      g.fillText(l[0] + (l.length > 1 ? '…' : ''), 190, y + 100);
      y += 156;
    }
    footer(g, d); out.push(cv);
  }
  // 4. достижения
  for (const list of pagesAch) {
    const { cv, g } = canvas(); header(g, d, ++page, total);
    g.fillStyle = C.ink; g.font = `800 72px ${FONT}`; g.fillText('Достижения', 80, 330);
    g.fillStyle = C.muted; g.font = `400 32px ${FONT}`; g.fillText('Открыто за этот период', 80, 390);
    let y = 460;
    for (const a of list) {
      g.fillStyle = C.card; roundRect(g, 80, y, W - 160, 190, 36); g.fill();
      const img = await badgeImage(a);
      try { g.drawImage(img, 110, y + 25, 140, 140); } catch { /* значок необязателен */ }
      g.fillStyle = C.ink; g.font = `700 42px ${FONT}`; g.fillText(a.name, 280, y + 80);
      g.fillStyle = C.muted; g.font = `400 28px ${FONT}`;
      wrap(g, a.desc, W - 160 - 230).slice(0, 2).forEach((l, i) => g.fillText(l, 280, y + 124 + i * 36));
      y += 210;
    }
    footer(g, d); out.push(cv);
  }
  return out;
}
export { render as renderRecap };
