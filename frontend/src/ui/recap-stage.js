// Галерея картин маслом: постоянные (знакомство, коллеги, друзья, алгоритмы, Новый год, поиск работы,
// первое собеседование, оффер) и 28 картин этапов — на каждый этап история в 4 актах (25, 50, 75 %, закрытие).
// Сцены (stage/*.js) — SVG в два слоя: фон пишется крупными мазками маслом, передний план (надписи, персонажи)
// кладётся чётко поверх с мелкими мазками. Отсюда: картина любого размера (миниатюра, просмотр) и карточка
// «стена · название · рама · подпись» для экспорта и итогов.
import { rngFrom } from './stage/kit.js';
import s1 from './stage/s1.js';
import s2 from './stage/s2.js';
import s3 from './stage/s3.js';
import s4 from './stage/s4.js';
import s5 from './stage/s5.js';
import s6 from './stage/s6.js';
import s7 from './stage/s7.js';
import { GALLERY } from './stage/gallery.js';
import { FRIENDS } from './stage/friends.js';
import { OCCASION_SCENES } from './stage/occasions.js';

const FONT = '-apple-system, "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const STAGES = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6, 7: s7 };
export const STAGE_TITLES = ['Основы', 'Данные в Go', 'Конкурентность и рантайм', 'Сеть и веб', 'Сервис целиком', 'Брокеры и эксплуатация', 'Системный дизайн и сборка'];
const STAGE_WALLS = ['#5C2E2E', '#1F3B3A', '#3A1F4F', '#1D2B4F', '#4A3423', '#1E2A24', '#2B2147'];
const PCTS = [25, 50, 75, 100];
const PCT_SUB = { 25: 'первая четверть', 50: 'ровно половина', 75: 'три четверти позади', 100: 'этап пройден' };
const PCT_FRAME = { 25: 'wood', 50: 'silver', 75: 'black', 100: 'gold' };
const STAGE_NATIVE = [1080, 1180]; // сцена этапа: 1100 по высоте + полоса неба сверху
const GAL_NATIVE = [840, 1386];
const STORY = {
  algo: 'Поздний вечер, лампа, дерево на доске и первые задачи на стикерах.',
  newyear: 'Салют, ёлка и бенгальский огонь. Новый год — новые этапы.',
  search: 'Резюме в лапках, указатели на развилке, самолётики-отклики летят к городу.',
  interview: '«Расскажите о себе». А в голове — горутины, каналы, select.',
  job: 'Оффер подброшен в небо: путь от package main до работы пройден.',
};

// каталог: все картины галереи в порядке показа
const SPECIAL = { ...FRIENDS, ...GALLERY, ...OCCASION_SCENES };
const special = (id) => ({ id, kind: 'special', title: SPECIAL[id].title, sub: '', frame: SPECIAL[id].frame, wall: SPECIAL[id].wall, ink: SPECIAL[id].ink, story: SPECIAL[id].story || STORY[id] || '', native: GAL_NATIVE, ref: 840 });
export const PAINTINGS = [
  ...['meet', 'colleagues', 'friends'].map(special),
  ...['algo', 'newyear', 'search', 'interview', 'job'].map(special),
  ...['bday-love', 'bday-me', 'bday-mom'].map((id) => ({ ...special(id), occasion: true })), // особые дни: карточки в итогах дня и картины в галерее
  ...STAGE_TITLES.flatMap((t, i) => PCTS.map((pct, k) => {
    const act = STAGES[i + 1].acts[k];
    return { id: `stage-${i + 1}-${pct}`, kind: 'stage', num: i + 1, pct, title: t, sub: PCT_SUB[pct], act: act.title, frame: PCT_FRAME[pct], wall: [STAGE_WALLS[i]], ink: '#F3E3C0', story: act.story, native: STAGE_NATIVE, ref: 880 };
  })),
];
export const PAINTING = Object.fromEntries(PAINTINGS.map((p) => [p.id, p]));
export const GALLERY_LIST = PAINTINGS.filter((p) => p.kind === 'special' && !p.hidden).map((p) => [p.id, p.title]);

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
// back/front рисуются в собственных координатах vw×vh и вписываются в w×h; u — масштаб мазков
async function paintOil(g, x0, y0, w, h, back, front, seed, u, { calm = true, vw = w, vh = h } = {}) {
  const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="none">${inner}</svg>`;
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

// ---------- рама ----------
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

// ---------- картина ----------
// слои сцены в её собственных координатах
function layers(p, d) {
  const [vw, vh] = p.native;
  if (p.kind === 'stage') {
    const act = STAGES[p.num].acts[PCTS.indexOf(p.pct)], k = PCTS.indexOf(p.pct) + 1, dy = vh - 1100;
    return {
      back: `${act.bg(vw, vh, rngFrom(p.num * 977 + 13))}<g transform="translate(0 ${dy})">${act.back(rngFrom(p.num * 31 + 7 + k))}</g>`,
      front: `<g transform="translate(0 ${dy})">${act.front(rngFrom(p.num * 31 + 9 + k))}</g>`,
      seed: p.num * 7 + k * 101, calm: true,
    };
  }
  const G = SPECIAL[p.id];
  return { back: G.back(vw, vh, rngFrom(2026)), front: G.front(vw, vh, d || {}), seed: 7 + p.id.length * 13, calm: !G.whirl };
}
async function paintAt(g, p, x, y, w, h, d) {
  const L = layers(p, d);
  await paintOil(g, x, y, w, h, L.back, L.front, L.seed, w / p.ref, { calm: L.calm, vw: p.native[0], vh: p.native[1] });
}
export const paintingAspect = (id) => { const p = PAINTING[id]; return p ? p.native[0] / p.native[1] : 0.6; };

// только холст картины шириной w (миниатюры галереи, просмотр вблизи)
export async function paintingCanvas(id, w, d = {}) {
  const p = PAINTING[id]; if (!p) return null;
  const h = Math.round(w / paintingAspect(id));
  const cv = document.createElement('canvas'); cv.width = Math.round(w); cv.height = h;
  await paintAt(cv.getContext('2d'), p, 0, 0, cv.width, h, d);
  return cv;
}

// подпись под картиной этапа: «—— ровно половина ——» с завитками
function flourish(g, x, y, w, u, color) {
  g.save(); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 2.5 * u; g.globalAlpha = 0.8;
  for (const dir of [-1, 1]) {
    const x0 = x + dir * w / 2, x1 = x0 + dir * 150 * u;
    g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    g.beginPath(); g.arc(x1 + dir * 10 * u, y, 7 * u, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(x0 + dir * 30 * u, y - 10 * u); g.quadraticCurveTo(x0 + dir * 60 * u, y - 24 * u, x0 + dir * 90 * u, y); g.stroke();
    g.beginPath(); g.arc(x0 + dir * 14 * u, y, 4 * u, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

// карточка: стена галереи, название, картина в раме, у картин этапа — приписка
export async function drawPaintingCard(g, W, H, id, d = {}) {
  const p = PAINTING[id] || PAINTING.job, u = W / 1080, sq = H === W, stage = p.kind === 'stage';
  g.fillStyle = p.wall[0]; g.fillRect(0, 0, W, H);
  const wall = g.createRadialGradient(W / 2, H * 0.08, 10, W / 2, H * 0.4, H * 0.8);
  wall.addColorStop(0, 'rgba(255,236,190,0.35)'); wall.addColorStop(1, 'rgba(0,0,0,0.4)');
  g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.05; for (let x = 0; x < W; x += 36 * u) { g.fillStyle = x % (72 * u) ? '#000' : '#fff'; g.fillRect(x, 0, 18 * u, H); } g.restore();
  // раскладка: название сверху, рама, приписка (у этапов); всё по центру по вертикали
  const t = (sq ? 40 : 60) * u, titleH = (sq ? 150 : 270) * u, subH = stage ? (sq ? 90 : 170) * u : (sq ? 30 : 60) * u;
  let pw = (stage ? 880 : 840) * u, ph = pw / paintingAspect(p.id);
  const room = H - titleH - subH - 2 * t - (sq ? 30 : 80) * u;
  if (ph > room) { ph = room; pw = ph * paintingAspect(p.id); }
  const top = Math.max(0, (H - (titleH + 2 * t + ph + subH)) / 2);
  g.textAlign = 'center'; g.fillStyle = p.ink;
  g.font = `600 ${(sq ? 20 : 26) * u}px ${FONT}`; g.fillText('A S C E N T  ·  Г А Л Е Р Е Я', W / 2, top + (sq ? 50 : 90) * u);
  let fs = (sq ? 66 : 100) * u; g.font = `italic 800 ${fs}px ${SERIF}`;
  while (g.measureText(p.title).width > W - 100 * u && fs > 44 * u) { fs -= 4 * u; g.font = `italic 800 ${fs}px ${SERIF}`; }
  g.fillText(p.title, W / 2, top + (sq ? 120 : 210) * u);
  const px = (W - pw) / 2, py = top + titleH + t;
  frame(g, px, py, pw, ph, t, u, p.frame);
  const pw0 = Math.round(pw), ph0 = Math.round(ph), px0 = Math.round(px), py0 = Math.round(py);
  await paintAt(g, p, px0, py0, pw0, ph0, d);
  g.save(); g.fillStyle = 'rgba(40,20,10,0.7)'; g.font = `italic 700 ${20 * u}px ${SERIF}`; g.textAlign = 'right';
  g.shadowColor = 'rgba(255,255,255,0.35)'; g.shadowBlur = 6 * u;
  g.fillText((d.nick || 'Гофер') + ' · ' + (String(d.date || '').slice(0, 4) || new Date().getFullYear()), px0 + pw0 - 22 * u, py0 + ph0 - 20 * u); g.restore();
  if (stage) {
    const y = py + ph + t + (sq ? 60 : 100) * u;
    g.fillStyle = p.ink; g.font = `italic 600 ${(sq ? 40 : 58) * u}px ${SERIF}`; g.textAlign = 'center';
    g.fillText(p.sub, W / 2, y);
    flourish(g, W / 2, y - (sq ? 13 : 19) * u, g.measureText(p.sub).width + 60 * u, u, p.ink);
  }
  g.textAlign = 'left';
}

// совместимость с итогами: веха этапа x = { num, pct } и картина галереи по ключу
export const drawStage = (g, W, H, x, d = {}) => drawPaintingCard(g, W, H, `stage-${x.num}-${x.pct >= 100 || !x.pct ? 100 : x.pct}`, { nick: d.nick, date: x.toIso || d.date });
export const drawGallery = (g, W, H, kind, d) => drawPaintingCard(g, W, H, kind, d);
