// Коллекция этапов и галерея особых картин: отрисовка на canvas.
// Этап — история в 4 актах (25, 50, 75 % уроков и закрытие): каждый акт — своя картина, гофер в костюме этапа и Clawd.
// Сцены (stage/s1…s7.js, stage/gallery.js) — SVG в два слоя: фон пишется крупными мазками маслом,
// передний план (надписи, персонажи) — чётко поверх, с мелкими мазками. Текст карточки — на canvas.
import { pluralRu } from './dom.js';
import { rngFrom } from './stage/kit.js';
import s1 from './stage/s1.js';
import { legacy } from './stage/legacy.js';
import { GALLERY } from './stage/gallery.js';

const FONT = '-apple-system, "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const STAGES = { ...legacy, 1: s1 };
export const STAGE_INFO = Object.fromEntries(Object.entries(STAGES).map(([k, v]) => [k, { name: v.name }]));

const imgCache = new Map();
function svgImage(s) {
  if (imgCache.has(s)) return imgCache.get(s);
  const img = new Image();
  const pr = new Promise((res) => { img.onload = () => res(img); img.onerror = () => res(null); });
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  if (imgCache.size > 40) imgCache.clear();
  imgCache.set(s, pr);
  return pr;
}
function wrapText(g, text, maxW) {
  const words = String(text).split(/\s+/); const out = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur);
  return out;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------- масло ----------
// мазки: цвет берётся из картинки под мазком; поле направлений — пологие волны (calm) или вихри
function brushPass(g, x0, y0, w, h, n, len, width, alpha, seed, calm = false, relief = 0) {
  const rng = rngFrom(seed);
  const data = g.getImageData(x0, y0, w, h).data;
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = rng() * w, y = rng() * h;
    const k = ((y | 0) * w + (x | 0)) * 4;
    const a = calm ? Math.sin(y * 0.005 + x * 0.003) * 0.32 + (rng() - 0.5) * 0.35
      : Math.sin(x * 0.006 + y * 0.002) * 0.9 + Math.cos(y * 0.008) * 0.6 + (rng() - 0.5) * 0.5;
    const l = len * (0.5 + rng());
    const j = (rng() - 0.5) * 18;
    g.strokeStyle = `rgba(${Math.min(255, data[k] + j)},${Math.min(255, data[k + 1] + j)},${Math.min(255, data[k + 2] + j)},${alpha})`;
    g.lineWidth = width * (0.6 + rng() * 0.8);
    const ax = x0 + x - Math.cos(a) * l / 2, ay = y0 + y - Math.sin(a) * l / 2, bx = x0 + x + Math.cos(a) * l / 2, by = y0 + y + Math.sin(a) * l / 2;
    const cx = x0 + x + Math.sin(a) * l * 0.15, cy = y0 + y - Math.cos(a) * l * 0.15;
    g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(cx, cy, bx, by); g.stroke();
    if (relief && rng() < 0.5) { // рельеф густой краски: светлая кромка сверху, тень снизу
      const lw = g.lineWidth, o = lw * 0.32;
      g.lineWidth = lw * 0.22;
      g.strokeStyle = `rgba(255,250,235,${relief})`; g.beginPath(); g.moveTo(ax, ay - o); g.quadraticCurveTo(cx, cy - o, bx, by - o); g.stroke();
      g.strokeStyle = `rgba(60,30,10,${relief * 0.7})`; g.beginPath(); g.moveTo(ax, ay + o); g.quadraticCurveTo(cx, cy + o, bx, by + o); g.stroke();
    }
  }
  g.restore();
}
function canvasWeave(g, x0, y0, w, h, u) {
  g.save(); g.globalAlpha = 0.06; g.fillStyle = '#000';
  for (let y = 0; y < h; y += 4 * u) g.fillRect(x0, y0 + y, w, 1.2 * u);
  g.globalAlpha = 0.05; g.fillStyle = '#fff';
  for (let x = 0; x < w; x += 4 * u) g.fillRect(x0 + x, y0, 1.2 * u, h);
  g.restore();
}
// холст маслом: фон крупно, передний план поверх — мелко, фактура, лак
async function paintOil(g, x0, y0, w, h, back, front, seed, u, { calm = true } = {}) {
  const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
  const bi = await svgImage(wrap(back));
  if (bi) g.drawImage(bi, x0, y0, w, h);
  brushPass(g, x0, y0, w, h, Math.round(w * h / 45), 20 * u, 8 * u, 0.45, seed + 1, calm, 0.1);
  brushPass(g, x0, y0, w, h, Math.round(w * h / 110), 11 * u, 4 * u, 0.55, seed + 2, calm, 0.08);
  const fi = await svgImage(wrap(front));
  if (fi) g.drawImage(fi, x0, y0, w, h);
  brushPass(g, x0, y0, w, h, Math.round(w * h / 420), 10 * u, 3 * u, 0.3, seed + 3, calm);
  canvasWeave(g, x0, y0, w, h, u);
  const v = g.createRadialGradient(x0 + w / 2, y0 + h * 0.45, w * 0.25, x0 + w / 2, y0 + h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(255,230,170,0)'); v.addColorStop(1, 'rgba(70,35,15,0.3)');
  g.fillStyle = v; g.fillRect(x0, y0, w, h);
}

// ---------- карточка этапа ----------
const W_ = (n, a, b, c) => `${n} ${pluralRu(n, a, b, c)}`;
const ofGen = (n, one, many) => `из ${n} ${n % 10 === 1 && n % 100 !== 11 ? one : many}`; // «из 21 темы», «из 163 уроков»
function stamp(g, x, y, s, color, text, rot = -0.12) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.font = `900 ${42 * s}px ${FONT}`; const w = g.measureText(text).width + 56 * s, h = 76 * s;
  g.strokeStyle = color; g.lineWidth = 6 * s; rr(g, -w / 2, -h / 2, w, h, 14 * s); g.stroke();
  g.lineWidth = 2.5 * s; rr(g, -w / 2 + 9 * s, -h / 2 + 9 * s, w - 18 * s, h - 18 * s, 8 * s); g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 2 * s);
  g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
const STAMP = ['ЧЕТВЕРТЬ', 'ПОЛОВИНА', 'ТРИ ЧЕТВЕРТИ', 'ЗАКРЫТ ✓'];

// x — веха этапа из итогов (num, pct 25/50/75/100, сроки и объём)
export async function drawStage(g, W, H, x) {
  const st = STAGES[x.num] || STAGES[1], u = W / 1080, sq = H === W;
  const k = x.pct >= 100 || !x.pct ? 4 : Math.max(1, Math.min(3, Math.round(x.pct / 25)));
  const act = st.acts[k - 1], P = act.pal;
  const rng = rngFrom(x.num * 977 + 13);
  const artT = sq ? `translate(${W - 0.54 * W + 40 * u} ${H - 0.54 * 1100 * u}) scale(${0.54 * u})` : `translate(0 ${H - 1100})`;
  await paintOil(g, 0, 0, W, H,
    `${act.bg(W, H, rng)}<g transform="${artT}">${act.back(rngFrom(x.num * 31 + 7 + k))}</g>`,
    `<g transform="${artT}">${act.front(rngFrom(x.num * 31 + 9 + k))}</g>`, x.num * 7 + k * 101, u);
  // подложка под текст: картина под надписями спокойнее
  const sc = g.createLinearGradient(0, 0, 0, H * 0.56);
  sc.addColorStop(0, P.scrim + 'B3'); sc.addColorStop(0.75, P.scrim + '59'); sc.addColorStop(1, P.scrim + '00');
  g.fillStyle = sc; g.fillRect(0, 0, W, H * 0.56);

  // шапка и полоска этапов (текущий — частично)
  const pad = 80 * u;
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.fillStyle = P.ink; g.font = `800 ${30 * u}px ${FONT}`; g.fillText('Ascent', pad, 110 * u);
  g.fillStyle = P.muted; g.font = `500 ${24 * u}px ${FONT}`; g.fillText(`учу Go · акт ${['I', 'II', 'III', 'IV'][k - 1]} · ${act.title}`, pad + 120 * u, 110 * u);
  g.textAlign = 'right'; g.fillText(`этап ${x.num} из 7`, W - pad, 110 * u); g.textAlign = 'left';
  const bw = (W - 2 * pad - 6 * 10 * u) / 7;
  for (let i = 0; i < 7; i++) {
    const bx = pad + i * (bw + 10 * u);
    g.fillStyle = i < x.num - 1 || (i === x.num - 1 && k === 4) ? P.acc : P.card; rr(g, bx, 136 * u, bw, 10 * u, 5 * u); g.fill();
    if (i === x.num - 1 && k < 4) { g.fillStyle = P.acc; rr(g, bx, 136 * u, Math.max(10 * u, bw * k / 4), 10 * u, 5 * u); g.fill(); }
  }

  const colW = sq ? 430 * u : W - 2 * pad;
  let y = sq ? 250 * u : 300 * u;
  g.fillStyle = P.acc; g.font = `800 ${30 * u}px ${FONT}`; g.fillText(`ЭТАП ${x.num}`, pad, y);
  const stampTxt = STAMP[k - 1];
  g.font = `900 ${42 * u}px ${FONT}`;
  stamp(g, pad + 190 * u + g.measureText(stampTxt).width / 2 * (sq ? 0.8 : 0.95), y - 12 * u, u * (sq ? 0.8 : 0.95), P.stamp, stampTxt);
  y += (sq ? 76 : 104) * u;
  const [main, sub] = String(x.title).split(/:\s*/);
  g.fillStyle = P.ink; g.font = `800 ${(sq ? 50 : 74) * u}px ${FONT}`;
  for (const ln of wrapText(g, main, colW).slice(0, 2)) { g.fillText(ln, pad, y); y += (sq ? 62 : 84) * u; }
  if (sub) { g.fillStyle = P.muted; g.font = `600 ${(sq ? 24 : 32) * u}px ${FONT}`; for (const ln of wrapText(g, sub, colW).slice(0, 2)) { g.fillText(ln, pad, y - 18 * u); y += (sq ? 30 : 40) * u; } y -= (sq ? 4 : 14) * u; }
  y += 6 * u;
  g.fillStyle = P.muted; g.font = `500 ${(sq ? 28 : 34) * u}px ${FONT}`;
  g.fillText(x.days > 1 ? `${x.from} → ${x.to}` : x.to, pad, y);
  y += (sq ? 110 : 150) * u;
  if (k === 4) {
    g.fillStyle = P.acc; g.font = `900 ${(sq ? 76 : 136) * u}px ${FONT}`;
    g.fillText(`за ${W_(x.days, 'день', 'дня', 'дней')}!`, pad, y);
  } else {
    g.fillStyle = P.acc; g.font = `900 ${(sq ? 84 : 150) * u}px ${FONT}`;
    const big = `${x.pct} %`; g.fillText(big, pad, y);
    const bw2 = g.measureText(big).width;
    g.fillStyle = P.ink; g.font = `800 ${(sq ? 34 : 52) * u}px ${FONT}`;
    g.fillText(`за ${W_(x.days, 'день', 'дня', 'дней')}`, pad + bw2 + 26 * u, y);
  }
  y += (sq ? 46 : 62) * u;
  g.fillStyle = P.muted; g.font = `500 ${(sq ? 24 : 28) * u}px ${FONT}`;
  g.fillText(k === 4 ? (x.activeDays ? `из них учебных — ${x.activeDays}` : '') : `с начала этапа · учебных дней — ${x.activeDays || 1}`, pad, y);
  y += (sq ? 36 : 50) * u;
  const tiles = k === 4
    ? [[x.lessons, pluralRu(x.lessons, 'урок', 'урока', 'уроков')], [x.themes, pluralRu(x.themes, 'тема', 'темы', 'тем')], [x.blocks, pluralRu(x.blocks, 'блок', 'блока', 'блоков')], [x.checks, pluralRu(x.checks, 'вопрос', 'вопроса', 'вопросов')]]
    : [[x.lessonsDone, ofGen(x.lessons, 'урока', 'уроков')], [x.themesDone, ofGen(x.themes, 'темы', 'тем')], [x.blocksDone, ofGen(x.blocks, 'блока', 'блоков')], [x.activeDays || 1, 'учебных дней']];
  const cols = sq ? 2 : 4, gap = 16 * u, tw = (colW - gap * (cols - 1)) / cols, th = (sq ? 104 : 130) * u;
  tiles.forEach(([n, l], i) => {
    const tx = pad + (i % cols) * (tw + gap), ty = y + Math.floor(i / cols) * (th + gap);
    g.fillStyle = P.card; rr(g, tx, ty, tw, th, 22 * u); g.fill();
    g.fillStyle = P.ink; g.font = `800 ${(sq ? 44 : 52) * u}px ${FONT}`; g.fillText(String(n ?? 0), tx + 22 * u, ty + th * 0.55);
    g.fillStyle = P.muted; g.font = `500 ${(sq ? 21 : 24) * u}px ${FONT}`; g.fillText(l, tx + 22 * u, ty + th * 0.82);
  });
  if (!sq) { g.fillStyle = P.muted; g.font = `italic 500 ${26 * u}px ${SERIF}`; g.fillText('«' + act.story + '»', pad, y + th + 64 * u); }
}

// ---------- галерея: особые картины ----------
function frame(g, x, y, w, h, t, u, kind) {
  const F = {
    gold: { stops: ['#8C6A1F', '#F3D27A', '#B8862B', '#FFE7A3', '#A87A26', '#6E5115'], bead: 'rgba(255,245,210,0.55)', ros: ['#FFF6D0', '#D9A940', '#7A5A18'], line: 'rgba(255,240,200,0.8)', dark: 'rgba(90,60,10,0.8)' },
    silver: { stops: ['#5E6670', '#E9EEF2', '#9AA4AE', '#FFFFFF', '#8A949E', '#4A525B'], bead: 'rgba(255,255,255,0.55)', ros: ['#FFFFFF', '#B8C2CC', '#59626B'], line: 'rgba(255,255,255,0.8)', dark: 'rgba(40,46,54,0.8)' },
    wood: { stops: ['#4A2C17', '#9C6B3F', '#6B4226', '#B98551', '#5C3A20', '#3B2312'], bead: 'rgba(255,225,180,0.35)', ros: ['#E8C08A', '#9C6B3F', '#4A2C17'], line: 'rgba(255,220,170,0.5)', dark: 'rgba(30,15,5,0.8)' },
    black: { stops: ['#0E0E10', '#3A3A40', '#1A1A1E', '#4A4A52', '#16161A', '#0A0A0C'], bead: 'rgba(230,200,120,0.5)', ros: ['#FFE7A3', '#C9A227', '#5A4510'], line: 'rgba(230,200,120,0.85)', dark: 'rgba(0,0,0,0.8)' },
  }[kind] || {};
  const grd = g.createLinearGradient(x, y, x + w, y + h);
  F.stops.forEach((c, i) => grd.addColorStop(i / (F.stops.length - 1), c));
  g.save(); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 60 * u; g.shadowOffsetY = 30 * u;
  g.fillStyle = grd; g.fillRect(x - t, y - t, w + 2 * t, h + 2 * t); g.restore();
  g.save();
  g.strokeStyle = F.line; g.lineWidth = 3 * u; g.strokeRect(x - t + 6 * u, y - t + 6 * u, w + 2 * t - 12 * u, h + 2 * t - 12 * u);
  g.strokeStyle = F.dark; g.lineWidth = 4 * u; g.strokeRect(x - 8 * u, y - 8 * u, w + 16 * u, h + 16 * u);
  g.strokeStyle = F.line; g.lineWidth = 2 * u; g.strokeRect(x - 14 * u, y - 14 * u, w + 28 * u, h + 28 * u);
  g.fillStyle = F.bead;
  const bead = (bx, by) => { g.beginPath(); g.arc(bx, by, 4.5 * u, 0, Math.PI * 2); g.fill(); };
  for (let i = x - t + 26 * u; i < x + w + t - 20 * u; i += 22 * u) { bead(i, y - t + 22 * u); bead(i, y + h + t - 22 * u); }
  for (let i = y - t + 26 * u; i < y + h + t - 20 * u; i += 22 * u) { bead(x - t + 22 * u, i); bead(x + w + t - 22 * u, i); }
  for (const [cx, cy] of [[x - t / 2, y - t / 2], [x + w + t / 2, y - t / 2], [x - t / 2, y + h + t / 2], [x + w + t / 2, y + h + t / 2]]) {
    const r = g.createRadialGradient(cx - 6 * u, cy - 6 * u, 2 * u, cx, cy, t * 0.7);
    r.addColorStop(0, F.ros[0]); r.addColorStop(0.5, F.ros[1]); r.addColorStop(1, F.ros[2]);
    g.fillStyle = r; g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, rr2 = (k % 2 ? 0.45 : 0.72) * t; g.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } g.closePath(); g.fill();
  }
  g.restore();
}
export const GALLERY_LIST = ['algo', 'newyear', 'search', 'interview', 'job'].map((k) => [k, GALLERY[k].title]);

// картина на стене галереи; kind — ключ GALLERY
export async function drawGallery(g, W, H, kind = 'job', d = {}) {
  const G = GALLERY[kind] || GALLERY.job, u = W / 1080, sq = H === W;
  g.fillStyle = G.wall[0]; g.fillRect(0, 0, W, H);
  const wall = g.createRadialGradient(W / 2, H * 0.08, 10, W / 2, H * 0.4, H * 0.8);
  wall.addColorStop(0, 'rgba(255,236,190,0.35)'); wall.addColorStop(1, 'rgba(0,0,0,0.38)');
  g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.05; for (let x = 0; x < W; x += 36 * u) { g.fillStyle = x % (72 * u) ? '#000' : '#fff'; g.fillRect(x, 0, 18 * u, H); } g.restore();
  g.textAlign = 'center'; g.fillStyle = G.ink;
  g.font = `600 ${(sq ? 22 : 26) * u}px ${FONT}`; g.fillText('A S C E N T  ·  Г А Л Е Р Е Я', W / 2, (sq ? 64 : 120) * u);
  let fs = (sq ? 72 : 108) * u; g.font = `italic 800 ${fs}px ${SERIF}`;
  while (g.measureText(G.title).width > W - 120 * u && fs > 40 * u) { fs -= 4 * u; g.font = `italic 800 ${fs}px ${SERIF}`; }
  g.fillText(G.title, W / 2, (sq ? 146 : 250) * u);
  g.textAlign = 'left';
  const t = (sq ? 46 : 64) * u;
  const px = (sq ? 220 : 120) * u, py = (sq ? 210 : 360) * u, pw = W - 2 * px, ph = sq ? 640 * u : H - py - t - 110 * u;
  frame(g, px, py, pw, ph, t, u, G.frame);
  const pw0 = Math.round(pw), ph0 = Math.round(ph), px0 = Math.round(px), py0 = Math.round(py);
  await paintOil(g, px0, py0, pw0, ph0, G.back(pw0, ph0, rngFrom(2026)), G.front(pw0, ph0, d), 7 + kind.length * 13, u, { calm: !G.whirl });
  g.save(); g.fillStyle = 'rgba(40,20,10,0.75)'; g.font = `italic 700 ${22 * u}px ${SERIF}`; g.textAlign = 'right';
  g.fillText((d.nick || 'Гофер') + ' · ' + (String(d.date || '').slice(0, 4) || new Date().getFullYear()), px0 + pw0 - 24 * u, py0 + ph0 - 22 * u); g.restore();
}
export const drawJob = (g, W, H, d) => drawGallery(g, W, H, 'job', d);
