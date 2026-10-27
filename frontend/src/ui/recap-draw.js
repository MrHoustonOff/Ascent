// Рисование карточек итогов на canvas: 4 стиля × 2 формата, гофер с позой по итогам.
// Случайность — через rng с зерном: одно открытие окна даёт одну и ту же раскладку при любых переключениях.
import { gopherSVG, POSES } from './gopher.js';
import { pluralRu } from './dom.js';
import { achBadge } from './achicons.js';
import { ankiInfo } from './anki.js';

export const FONT = '-apple-system, "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif';
export const MONO = 'ui-monospace, "Cascadia Code", Consolas, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';
export const FORMATS = { story: [1080, 1920], square: [1080, 1080] };

const LOGO = new Image();
LOGO.src = new URL('../ds/logo.svg', import.meta.url).href;

// ---------- стили ----------
export const STYLES = {
  night: {
    label: 'Ночь', ink: '#F5F5F7', muted: '#A8A8AE', card: 'rgba(255,255,255,0.07)', line: 'rgba(255,255,255,0.14)', track: 'rgba(255,255,255,0.10)',
    accents: ['#4CC9EA', '#FFA640', '#4FD08F', '#F06AA6', '#A78BFA'], font: FONT, head: FONT,
    bg(g, W, H, acc) {
      const grd = g.createLinearGradient(0, 0, W * 0.4, H);
      grd.addColorStop(0, '#0E3A47'); grd.addColorStop(0.55, '#121214'); grd.addColorStop(1, '#121214');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      const glow = g.createRadialGradient(W * 0.85, H * 0.08, 10, W * 0.85, H * 0.08, W * 0.6);
      glow.addColorStop(0, hexA(acc, 0.28)); glow.addColorStop(1, hexA(acc, 0));
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
      speckle(g, W, H, 'rgba(255,255,255,0.045)', 1600, 2);
    },
  },
  sand: {
    label: 'Песок', ink: '#2A2018', muted: 'rgba(42,32,24,0.62)', card: 'rgba(255,255,255,0.45)', line: 'rgba(42,32,24,0.16)', track: 'rgba(42,32,24,0.10)',
    accents: ['#1F7A8C', '#C2552D', '#7A4FD0', '#2E8B57', '#C2185B'], font: FONT, head: FONT,
    bg(g, W, H) {
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, '#F8E4C4'); grd.addColorStop(1, '#EBC48E');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,0.22)';
      blob(g, W * 0.9, H * 0.1, W * 0.35); blob(g, W * 0.05, H * 0.62, W * 0.28);
      speckle(g, W, H, 'rgba(90,60,30,0.05)', 1800, 2);
    },
  },
  terminal: {
    label: 'Терминал', ink: '#9DF59D', muted: '#5E9A5E', card: 'rgba(157,245,157,0.06)', line: 'rgba(157,245,157,0.22)', track: 'rgba(157,245,157,0.10)',
    accents: ['#9DF59D', '#FFD75F', '#5FD7FF', '#FF87AF'], font: MONO, head: MONO,
    bg(g, W, H) {
      g.fillStyle = '#0B0F0C'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(157,245,157,0.035)';
      for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
      const v = g.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, H * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
      g.fillStyle = v; g.fillRect(0, 0, W, H);
    },
  },
  journal: {
    label: 'Журнал', ink: '#1C1B19', muted: '#6B665C', card: 'rgba(28,27,25,0.05)', line: 'rgba(28,27,25,0.85)', track: 'rgba(28,27,25,0.09)',
    accents: ['#B23A2E', '#1F5E8C', '#2E7D4F', '#8A5A00'], font: FONT, head: SERIF,
    bg(g, W, H) {
      g.fillStyle = '#FBF7EF'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(28,27,25,0.025)';
      for (let i = 0; i < 1400; i++) g.fillRect((i * 7919) % W, (i * 104729) % H, 2, 2);
    },
  },
};
export const STYLE_KEYS = Object.keys(STYLES);

// ---------- помощники ----------
export function rngFrom(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function hexA(hex, a) { const c = hex.replace('#', ''); const n = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function onAcc(hex) { // чёрный или белый текст поверх акцента
  const c = hex.replace('#', ''); const n = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? '#141414' : '#FFFFFF';
}
function speckle(g, W, H, color, n, size) { // мелкое «зерно» без случайности: одинаково при каждом рисовании
  g.fillStyle = color;
  for (let i = 0; i < n; i++) g.fillRect((i * 7919) % W, (i * 104729 + i * i * 13) % H, size, size);
}
function blob(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function wrap(g, text, maxW) {
  const words = String(text).replace(/`/g, '').split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
const plain = (t) => String(t).replace(/`/g, '').replace(/\[\[|\]\]/g, '').replace(/\s*★+\s*$/, '');
const W_ = (n, a, b, c) => pluralRu(n, a, b, c);

// ---------- гофер на canvas ----------
const L = '#2E2622';
export const EXTRAS = {
  zzz: `<text x="168" y="34" font-size="34" font-weight="800" fill="#7C6CF0" font-family="sans-serif">z</text><text x="194" y="6" font-size="24" font-weight="800" fill="#7C6CF0" font-family="sans-serif">z</text>`,
  run: `<g stroke="${L}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"><path d="M8 110h-28M4 140h-36M10 170h-24"/></g><path d="M188 28q8 13 0 19q-8-6 0-19z" fill="#A9E6F5" stroke="${L}" stroke-width="2"/>`,
  jump: `<g stroke="${L}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"><path d="M60 238v16M100 240v20M140 238v16"/></g>`,
  sweat: `<path d="M30 28q8 13 0 19q-8-6 0-19z" fill="#A9E6F5" stroke="${L}" stroke-width="2"/>`,
  sparkle: `<g fill="#F5C542" stroke="${L}" stroke-width="1.6"><path d="M-6 20l5 -12 5 12 12 5 -12 5 -5 12 -5 -12 -12 -5z"/><path d="M196 60l3 -8 3 8 8 3 -8 3 -3 8 -3 -8 -8 -3z"/></g>`,
};
const POSE_EXTRA = { sleep: 'zzz', run: 'run', cheer: 'jump', jump: 'jump', oops: 'sweat', proud: 'sparkle' };
export const POSE_KEYS = Object.keys(POSES);

const gcache = new Map();
function gopherImage(pose) {
  if (gcache.has(pose)) return gcache.get(pose);
  const p = POSES[pose] || POSES.idle;
  let s = gopherSVG({ ...p.opts, extra: EXTRAS[POSE_EXTRA[pose]] || '', width: 560 });
  // запас вокруг: поднятые лапки, линии движения и «z» выходят за 200×240
  s = s.replace('viewBox="0 0 200 240"', 'viewBox="-40 -70 280 340"').replace('width="560"', 'width="560" height="680"');
  const img = new Image();
  const pr = new Promise((res) => { img.onload = () => res(img); img.onerror = () => res(null); });
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  gcache.set(pose, pr);
  return pr;
}
// гофер: центр по x, низ ножек по y, высота тела h (px), поворот (рад), зеркально
export async function drawGopher(g, pose, cx, bottom, h, rot = 0, flip = false) {
  const img = await gopherImage(pose);
  if (!img) return;
  const k = h / 240;
  g.save(); g.translate(cx, bottom - 120 * k); g.rotate(rot); if (flip) g.scale(-1, 1);
  g.drawImage(img, -140 * k, -190 * k, 280 * k, 340 * k);
  g.restore();
}

// поза по смыслу карточки
export function poseFor(kind, d, rng) {
  const n = d.themes.length;
  const sets = {
    empty: ['sleep', 'tired'],
    summary: d.empty ? ['sleep'] : d.blocks.length ? ['cheer', 'jump', 'proud'] : n >= 4 ? ['cheer', 'jump', 'dance'] : n >= 2 ? ['wave', 'proud', 'dance', 'cheer'] : n === 1 ? ['wave', 'proud', 'point', 'idle'] : ['think', 'tired', 'derp'],
    themes: ['point', 'proud', 'sit', 'think'],
    ach: d.achievements.length ? ['proud', 'cheer', 'jump'] : ['think', 'shrug', 'derp'],
    heat: ['point', 'think', 'sit'],
    tracks: ['think', 'point', 'derp'],
    better: ['cheer', 'jump', 'proud', 'dance'],
    same: ['idle', 'think', 'shrug'],
    worse: ['shrug', 'tired', 'derp', 'oops'],
    mountain: ['walk', 'run'],
    forecast: ['walk', 'run', 'think', 'point'],
  };
  return pick(rng, sets[kind] || ['idle']);
}

// ---------- рамка карточки ----------
function frame(g, W, H, S, acc, d, page, total) {
  S.bg(g, W, H, acc);
  const u = W / 1080;
  if (LOGO.complete && LOGO.naturalWidth) g.drawImage(LOGO, 80 * u, 80 * u, 56 * u, 56 * u);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.fillStyle = S.ink; g.font = `700 32px ${S.font}`.replace('32px', `${32 * u}px`);
  g.fillText('Ascent', 154 * u, 108 * u);
  g.fillStyle = S.muted; g.font = `400 ${24 * u}px ${S.font}`;
  g.fillText(d.period, 154 * u, 138 * u);
  if (total > 1) { g.textAlign = 'right'; g.font = `500 ${26 * u}px ${S.font}`; g.fillText(`${page} / ${total}`, W - 80 * u, 118 * u); g.textAlign = 'left'; }
  // подпись
  g.font = `500 ${26 * u}px ${S.font}`; g.fillStyle = S.muted;
  g.fillText(d.nick ? d.nick : 'Go — ROADMAP', 80 * u, H - 70 * u);
  g.textAlign = 'right'; g.fillText(`${d.pct} % пути`, W - 80 * u, H - 70 * u); g.textAlign = 'left';
}
function title(g, S, u, text, x, y, size = 64) {
  g.fillStyle = S.ink; g.font = `800 ${size * u}px ${S.head}`; g.fillText(text, x, y);
}
function tile(g, S, acc, u, x, y, w, h, n, label, hl) {
  g.fillStyle = S.card; rr(g, x, y, w, h, 32 * u); g.fill();
  g.fillStyle = hl ? acc : S.ink; g.font = `800 ${Math.min(76, h * 0.42 / u) * u}px ${S.font}`; g.fillText(String(n), x + 32 * u, y + h * 0.56);
  g.fillStyle = S.muted; g.font = `400 ${26 * u}px ${S.font}`; g.fillText(label, x + 32 * u, y + h * 0.82);
}
function bars(g, S, acc, u, x, y, w, h, days) {
  const max = Math.max(1, ...days.map((x) => x.themes));
  const n = days.length, gap = n > 10 ? 6 * u : 14 * u, bw = (w - gap * (n - 1)) / n;
  days.forEach((dd, i) => {
    const bh = dd.themes ? Math.max(14 * u, (dd.themes / max) * (h - 60 * u)) : 8 * u;
    const bx = x + i * (bw + gap);
    g.fillStyle = dd.themes ? acc : S.track; rr(g, bx, y + h - 46 * u - bh, bw, bh, Math.min(16 * u, bw / 3)); g.fill();
    if (n <= 7) { g.fillStyle = S.muted; g.font = `500 ${26 * u}px ${S.font}`; g.textAlign = 'center'; g.fillText(dd.label, bx + bw / 2, y + h - 6 * u); g.textAlign = 'left'; }
  });
}
function progress(g, S, acc, u, x, y, w, pct) {
  g.fillStyle = S.track; rr(g, x, y, w, 22 * u, 11 * u); g.fill();
  g.fillStyle = acc; rr(g, x, y, Math.max(22 * u, w * pct / 100), 22 * u, 11 * u); g.fill();
}

// ---------- карточки ----------
// каждая: async (g, W, H, ctx) где ctx = { S, acc, rng, d, page, total, layout, full }
const W_LOWER = { w: 0 }; // ширина нижнего блока, когда справа стоит гофер
// «учу Go · день X»: наклейка в цвет акцента; у «Журнала» — штамп, у «Терминала» — рамка
function dayBadge(g, S, acc, u, d, x, y, align, size) {
  const term = S === STYLES.terminal, stamp = S === STYLES.journal;
  const t1 = term ? '> учу Go' : stamp ? 'УЧУ GO' : 'учу Go', t2 = stamp ? `ДЕНЬ ${d.dayN}` : `день ${d.dayN}`;
  const f2 = `800 ${size * u}px ${S.head}`, f1 = `600 ${size * 0.6 * u}px ${S.font}`;
  g.font = f2; const w2 = g.measureText(t2).width;
  g.font = f1; const w1 = g.measureText(t1).width;
  const pad = size * 0.45 * u, gap = size * 0.32 * u, w = pad * 2 + w1 + gap + w2, hh = size * 1.48 * u;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  g.save(); g.translate(x0 + w / 2, y + hh / 2); g.rotate(stamp ? -0.05 : term ? 0 : -0.03);
  const ink = term || stamp ? acc : onAcc(acc);
  if (term) { g.strokeStyle = acc; g.lineWidth = 3 * u; g.fillStyle = hexA(acc, 0.08); rr(g, -w / 2, -hh / 2, w, hh, 6 * u); g.fill(); g.stroke(); }
  else if (stamp) { g.strokeStyle = acc; g.lineWidth = 5 * u; rr(g, -w / 2, -hh / 2, w, hh, 14 * u); g.stroke(); g.lineWidth = 2 * u; rr(g, -w / 2 + 9 * u, -hh / 2 + 9 * u, w - 18 * u, hh - 18 * u, 8 * u); g.stroke(); }
  else {
    g.fillStyle = 'rgba(0,0,0,0.20)'; rr(g, -w / 2 + 6 * u, -hh / 2 + 10 * u, w, hh, hh * 0.32); g.fill();
    g.fillStyle = acc; rr(g, -w / 2, -hh / 2, w, hh, hh * 0.32); g.fill();
  }
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = hexA(ink, 0.78); g.font = f1; g.fillText(t1, -w / 2 + pad, size * 0.04 * u);
  g.fillStyle = ink; g.font = f2; g.fillText(t2, -w / 2 + pad + w1 + gap, size * 0.06 * u);
  g.restore(); g.textBaseline = 'alphabetic';
  return hh;
}
const showDay = (c) => c.dayX && c.d.dayN > 0;

async function cardSummary(g, W, H, c) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  const n = d.themes.length;
  const pose = poseFor('summary', d, rng);
  const lay = sq ? (c.layout % 2) : c.layout % 3;
  const dx = showDay(c); // со «днём X» всё опускается ниже
  const big = (x, y, size, align = 'left') => {
    g.textAlign = align; g.fillStyle = S.ink; g.font = `800 ${size * u}px ${S.head}`; g.fillText(String(n), x, y);
    g.font = `700 ${56 * u}px ${S.font}`; g.fillText(W_(n, 'тема закрыта', 'темы закрыто', 'тем закрыто'), x, y + 86 * u); g.textAlign = 'left';
  };
  const kicker = (x, y, align = 'left') => { g.textAlign = align; g.fillStyle = acc; g.font = `700 ${30 * u}px ${S.font}`; g.fillText(d.title.toUpperCase(), x, y); g.textAlign = 'left'; };
  const tiles = (y, h = 190 * u) => {
    const tw = (W - 160 * u - 40 * u) / 3;
    tile(g, S, acc, u, 80 * u, y, tw, h, d.lessons, W_(d.lessons, 'урок', 'урока', 'уроков'));
    tile(g, S, acc, u, 80 * u + tw + 20 * u, y, tw, h, d.checks, W_(d.checks, 'ответ', 'ответа', 'ответов'));
    tile(g, S, acc, u, 80 * u + (tw + 20 * u) * 2, y, tw, h, d.streak, W_(d.streak, 'день', 'дня', 'дней') + ' подряд', true);
  };
  const lower = (y, h) => { // нижний блок: дни периода или прогресс пути и темы
    if (c.full && n) {
      g.fillStyle = S.muted; g.font = `600 ${28 * u}px ${S.font}`; g.fillText('ПРОЙДЕНО', 80 * u, y + 30 * u);
      let yy = y + 80 * u;
      const fit = Math.max(1, Math.floor((H - 170 * u - yy) / (58 * u)) - 1), rows = Math.min(sq ? 2 : 4, fit);
      for (const t of d.themes.slice(0, rows)) {
        g.fillStyle = acc; g.font = `600 ${24 * u}px ${MONO}`; g.fillText(t.id, 80 * u, yy);
        g.fillStyle = S.ink; g.font = `600 ${34 * u}px ${S.font}`; const l = wrap(g, plain(t.title), W - 360 * u); g.fillText(l[0] + (l.length > 1 ? '…' : ''), 80 * u + 190 * u, yy);
        yy += 58 * u;
      }
      if (n > rows) { g.fillStyle = S.muted; g.font = `400 ${28 * u}px ${S.font}`; g.fillText(`и ещё ${n - rows}`, 80 * u, yy); }
      return;
    }
    if (d.days.length > 1) { bars(g, S, acc, u, 80 * u, y, W_LOWER.w || W - 160 * u, h, d.days); return; }
    g.fillStyle = S.muted; g.font = `500 ${30 * u}px ${S.font}`; g.fillText((d.stage || 'Путь').split(':')[0], 80 * u, y + 40 * u);
    progress(g, S, acc, u, 80 * u, y + 70 * u, W - 160 * u, d.pct);
    g.fillStyle = S.ink; g.font = `700 ${34 * u}px ${S.font}`; g.fillText(`${d.done} из ${d.total} уроков`, 80 * u, y + 150 * u);
  };
  if (sq) {
    const gx = lay ? 270 * u : W - 270 * u, tx = lay ? W - 80 * u : 80 * u, al = lay ? 'right' : 'left', o = dx ? 56 * u : 0;
    if (dx) dayBadge(g, S, acc, u, d, tx, 166 * u, al, 50);
    kicker(tx, 250 * u + o, al); big(tx, 520 * u + o * 0.6, 250, al);
    await drawGopher(g, pose, gx, 700 * u, 430 * u, 0, lay === 0);
    tiles(760 * u, 170 * u);
    return;
  }
  const o = dx ? 80 * u : 0;
  if (lay === 0) {
    if (dx) dayBadge(g, S, acc, u, d, 80 * u, 186 * u, 'left', 66);
    kicker(80 * u, 280 * u + o); big(64 * u, 590 * u + o, 300);
    tiles(800 * u + o);
    W_LOWER.w = W - 480 * u; lower(1060 * u + o, 360 * u - o / 2); W_LOWER.w = 0;
    await drawGopher(g, pose, W - 210 * u, H - 120 * u, 450 * u, -0.06);
  } else if (lay === 1) {
    if (dx) dayBadge(g, S, acc, u, d, W / 2, 186 * u, 'center', 66);
    await drawGopher(g, pose, W / 2, 760 * u + o, 500 * u - o / 2);
    kicker(W / 2, 860 * u + o, 'center'); big(W / 2, 1090 * u + o, 230, 'center');
    tiles(1280 * u + o, 170 * u); lower(1500 * u + o, 260 * u - o);
  } else {
    if (dx) dayBadge(g, S, acc, u, d, 80 * u, 186 * u, 'left', 66);
    kicker(80 * u, 280 * u + o); big(64 * u, 600 * u + o, 320);
    await drawGopher(g, pose, W - 250 * u, 760 * u + o, 520 * u, 0.05, true);
    tiles(860 * u + o); lower(1130 * u + o, 380 * u - o / 2);
  }
}

async function cardQuiet(g, W, H, c) { // пустой день: без хвастовства
  const { S, d, rng } = c; const u = W / 1080, sq = H === W;
  if (S !== STYLES.terminal) { g.fillStyle = hexA(S.ink, 0.5); for (let i = 0; i < 26; i++) blob(g, (i * 397) % W, ((i * 211) % (H * 0.45)) + 180 * u, (1 + (i % 3)) * 1.6 * u); }
  const o = showDay(c) ? (sq ? 50 : 40) * u : 0;
  if (o) dayBadge(g, S, c.acc, u, d, 80 * u, (sq ? 172 : 200) * u, 'left', sq ? 50 : 66);
  g.fillStyle = S.ink; g.font = `800 ${(sq ? 64 : 76) * u}px ${S.head}`;
  const lines = d.kind === 'day' ? ['День отдыха —', 'тоже часть пути'] : ['Тихий период —', 'тоже часть пути'];
  lines.forEach((l, i) => g.fillText(l, 80 * u, (sq ? 300 : 420) * u + o + i * 92 * u));
  g.fillStyle = S.muted; g.font = `400 ${32 * u}px ${S.font}`;
  g.fillText(d.streak ? `Серия ${d.streak} ${W_(d.streak, 'день', 'дня', 'дней')} цела · завтра продолжим` : 'Завтра продолжим', 80 * u, (sq ? 470 : 640) * u + o);
  await drawGopher(g, poseFor('empty', d, rng), W / 2, H - (sq ? 150 : 220) * u, (sq ? 460 : 640) * u);
}

async function cardThemes(g, W, H, c, list, first, more) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  title(g, S, u, 'Пройдено', 80 * u, 290 * u);
  g.fillStyle = S.muted; g.font = `400 ${30 * u}px ${S.font}`;
  g.fillText(`${d.themes.length} ${W_(d.themes.length, 'тема', 'темы', 'тем')}` + (d.blocks.length ? ` · ${d.blocks.length} ${W_(d.blocks.length, 'блок', 'блока', 'блоков')}` : ''), 80 * u, 345 * u);
  let y = 410 * u;
  const rowH = (sq ? 104 : 128) * u;
  if (first) for (const b of d.blocks.slice(0, sq ? 1 : 2)) {
    g.fillStyle = acc; rr(g, 80 * u, y, W - 160 * u, rowH, 28 * u); g.fill();
    g.fillStyle = S === STYLES.terminal ? '#0B0F0C' : '#fff'; g.font = `700 ${34 * u}px ${S.font}`;
    g.fillText(`Блок ${b.id} закрыт`, 120 * u, y + rowH * 0.45);
    g.font = `400 ${28 * u}px ${S.font}`; g.fillText(wrap(g, plain(b.title), W - 260 * u)[0], 120 * u, y + rowH * 0.78);
    y += rowH + 18 * u;
  }
  for (const t of list) {
    g.fillStyle = S.card; rr(g, 80 * u, y, W - 160 * u, rowH, 28 * u); g.fill();
    g.fillStyle = acc; blob(g, 132 * u, y + rowH / 2, 20 * u);
    g.strokeStyle = S === STYLES.terminal ? '#0B0F0C' : '#fff'; g.lineWidth = 5 * u; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(122 * u, y + rowH / 2 + 1 * u); g.lineTo(129 * u, y + rowH / 2 + 8 * u); g.lineTo(143 * u, y + rowH / 2 - 7 * u); g.stroke();
    g.fillStyle = S.muted; g.font = `500 ${24 * u}px ${MONO}`; g.fillText(t.id, 180 * u, y + rowH * 0.4);
    g.fillStyle = S.ink; g.font = `600 ${34 * u}px ${S.font}`;
    const l = wrap(g, plain(t.title), W - 160 * u - 140 * u);
    g.fillText(l[0] + (l.length > 1 ? '…' : ''), 180 * u, y + rowH * 0.78);
    y += rowH + 16 * u;
    const note = noteOf(d, t);
    if (note) y += bubbleNote(g, S, acc, u, 80 * u + IND * u, W - 160 * u - IND * u, y - 6 * u, note, (sq ? 30 : 34) * u, false) + 10 * u;
  }
  if (more) { g.fillStyle = S.muted; g.font = `500 ${32 * u}px ${S.font}`; g.fillText(`и ещё ${more} ${W_(more, 'тема', 'темы', 'тем')}`, 80 * u, y + 40 * u); }
  const flip = !more && rng() < 0.5; // строку «и ещё N» слева не закрываем
  // над подписью внизу, чтобы не закрывать ник
  await drawGopher(g, poseFor('themes', d, rng), flip ? 170 * u : W - 170 * u, H - 112 * u, (sq ? 200 : 300) * u, flip ? 0.08 : -0.08, flip);
}

async function badgeImage(a) {
  const probe = document.createElement('div');
  probe.setAttribute('data-theme', 'dark'); probe.className = 'as-root'; probe.style.position = 'absolute'; probe.style.left = '-9999px';
  document.body.append(probe);
  const cs = getComputedStyle(probe);
  const svg = achBadge({ ...a, unlocked: true }, 64);
  probe.append(svg);
  let xml = new XMLSerializer().serializeToString(svg);
  xml = xml.replace(/var\((--[\w-]+)\)/g, (_, v) => cs.getPropertyValue(v).trim() || '#888');
  probe.remove();
  xml = xml.replace(/color-mix\(in srgb,\s*(#[0-9a-fA-F]{3,8})\s+(\d+)%,\s*(#[0-9a-fA-F]{3,8})\)/g, (_, x, p, y) => mixHex(x, y, +p / 100));
  if (!/^<svg[^>]*xmlns=/.test(xml)) xml = xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  xml = xml.replace(/^(<svg[^>]*>)/, `$1<style>.b-num{font:800 19px ${FONT}}.b-code{font-family:${MONO};font-weight:700}.b-sub{font:700 6.5px ${MONO};opacity:.85}.b-shine{display:none}</style>`);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  await img.decode().catch(() => {});
  return img;
}
function mixHex(a, b, p) {
  const h = (c) => { c = c.replace('#', ''); if (c.length <= 4) c = c.split('').map((x) => x + x).join(''); return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)); };
  const x = h(a), y = h(b);
  return '#' + x.map((v, i) => Math.round(v * p + y[i] * (1 - p)).toString(16).padStart(2, '0')).join('');
}

async function cardAch(g, W, H, c, list) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  title(g, S, u, 'Достижения', 80 * u, 290 * u);
  if (!list.length) {
    g.fillStyle = S.muted; g.font = `400 ${34 * u}px ${S.font}`; g.fillText('Новых за этот период нет', 80 * u, 350 * u);
    const cx = W / 2, cy = (sq ? 600 : 760) * u, r = (sq ? 170 : 220) * u;
    g.lineCap = 'round'; g.lineWidth = 34 * u; g.strokeStyle = S.track; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = acc; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.01, d.achOpen / Math.max(1, d.achTotal))); g.stroke();
    g.textAlign = 'center'; g.fillStyle = S.ink; g.font = `800 ${90 * u}px ${S.head}`; g.fillText(String(d.achOpen), cx, cy + 20 * u);
    g.fillStyle = S.muted; g.font = `400 ${30 * u}px ${S.font}`; g.fillText(`из ${d.achTotal} открыто`, cx, cy + 70 * u); g.textAlign = 'left';
    if (!sq) await drawGopher(g, poseFor('ach', d, rng), W / 2, H - 170 * u, 420 * u);
    return;
  }
  g.fillStyle = acc; g.font = `800 ${44 * u}px ${S.font}`; g.fillText(`+${d.achievements.length}`, 80 * u, 360 * u);
  g.fillStyle = S.muted; g.font = `400 ${30 * u}px ${S.font}`; g.fillText(`· всего ${d.achOpen} из ${d.achTotal}`, 80 * u + g.measureText(`+${d.achievements.length}`).width * 1.5 + 20 * u, 358 * u);
  let y = 420 * u; const rowH = (sq ? 150 : 180) * u;
  for (const a of list) {
    g.fillStyle = S.card; rr(g, 80 * u, y, W - 160 * u, rowH, 32 * u); g.fill();
    const img = await badgeImage(a);
    try { g.drawImage(img, 104 * u, y + 18 * u, rowH - 36 * u, rowH - 36 * u); } catch { /* значок необязателен */ }
    g.fillStyle = S.ink; g.font = `700 ${38 * u}px ${S.font}`; g.fillText(a.name, 104 * u + rowH, y + rowH * 0.44);
    g.fillStyle = S.muted; g.font = `400 ${26 * u}px ${S.font}`;
    wrap(g, a.desc, W - 160 * u - rowH - 60 * u).slice(0, 2).forEach((l, i) => g.fillText(l, 104 * u + rowH, y + rowH * 0.68 + i * 32 * u));
    y += rowH + 18 * u;
  }
  if (!sq && list.length <= 3) await drawGopher(g, poseFor('ach', d, rng), W - 200 * u, H - 130 * u, 380 * u, -0.05);
}

async function cardHeat(g, W, H, c) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  const days = d.heat || []; const weeks = Math.ceil(days.length / 7);
  const active = days.filter((x) => x.active).length;
  title(g, S, u, 'Дни учёбы', 80 * u, 290 * u);
  g.fillStyle = S.ink; g.font = `800 ${150 * u}px ${S.head}`; g.fillText(String(active), 80 * u, (sq ? 470 : 500) * u);
  g.fillStyle = S.muted; g.font = `400 ${32 * u}px ${S.font}`; g.fillText(`${W_(active, 'день', 'дня', 'дней')} с учёбой за ${weeks} ${W_(weeks, 'неделю', 'недели', 'недель')}`, 80 * u, (sq ? 530 : 565) * u);
  const gx = 80 * u, gy = (sq ? 590 : 660) * u, gw = W - 160 * u, gap = 6 * u;
  const cell = Math.min((gw - gap * (weeks - 1)) / weeks, ((sq ? 360 : 640) * u - gap * 6) / 7);
  const ox = gx + (gw - (cell * weeks + gap * (weeks - 1))) / 2;
  days.forEach((x, i) => {
    const col = Math.floor(i / 7), row = i % 7, px = ox + col * (cell + gap), py = gy + row * (cell + gap);
    g.fillStyle = x.level ? hexA(acc, 0.25 + 0.75 * Math.min(1, x.level / 4)) : S.track; rr(g, px, py, cell, cell, cell * 0.22); g.fill();
    if (x.rest) { g.fillStyle = S.muted; blob(g, px + cell / 2, py + cell / 2, cell * 0.12); }
  });
  if (!sq) await drawGopher(g, poseFor('heat', d, rng), W - 210 * u, H - 130 * u, 400 * u, -0.04);
}

async function cardTracks(g, W, H, c) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  const cols = [acc, ...S.accents.filter((x) => x !== acc), '#999'];
  const tr = d.tracks || []; const sum = tr.reduce((a, t) => a + t.done, 0);
  title(g, S, u, 'Треки', 80 * u, 290 * u);
  const cx = sq ? 300 * u : W / 2, cy = (sq ? 610 : 700) * u, r = (sq ? 190 : 250) * u;
  g.lineWidth = (sq ? 60 : 80) * u; g.lineCap = 'butt';
  g.strokeStyle = S.track; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  let a0 = -Math.PI / 2;
  tr.forEach((t, i) => { if (!t.done) return; const a1 = a0 + Math.PI * 2 * t.done / Math.max(1, sum); g.strokeStyle = cols[i % cols.length]; g.beginPath(); g.arc(cx, cy, r, a0, a1 - 0.015); g.stroke(); a0 = a1; });
  g.textAlign = 'center'; g.fillStyle = S.ink; g.font = `800 ${(sq ? 80 : 100) * u}px ${S.head}`; g.fillText(`${d.pct}%`, cx, cy + 20 * u);
  g.fillStyle = S.muted; g.font = `400 ${28 * u}px ${S.font}`; g.fillText('всего пути', cx, cy + 66 * u); g.textAlign = 'left';
  let y = sq ? 360 * u : 1080 * u; const lx = sq ? 580 * u : 80 * u, lw = sq ? W - 660 * u : W - 160 * u;
  tr.forEach((t, i) => {
    g.fillStyle = cols[i % cols.length]; rr(g, lx, y - 22 * u, 24 * u, 24 * u, 6 * u); g.fill();
    g.fillStyle = S.ink; g.font = `600 ${32 * u}px ${S.font}`; g.fillText(t.label, lx + 40 * u, y);
    g.textAlign = 'right'; g.fillStyle = S.muted; g.fillText(`${t.pct}%`, lx + lw, y); g.textAlign = 'left';
    progress(g, S, cols[i % cols.length], u, lx, y + 16 * u, lw, t.pct);
    y += (sq ? 92 : 104) * u;
  });
  if (!sq) await drawGopher(g, poseFor('tracks', d, rng), W - 180 * u, 520 * u, 260 * u, 0.08, true);
}

async function cardCompare(g, W, H, c) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  const now = d.themes.length, prev = d.prev;
  const diff = prev > 0 ? Math.round((now - prev) / prev * 100) : null;
  const txt = diff === null ? (now ? `+${now}` : '0') : `${diff > 0 ? '+' : ''}${diff}%`;
  const mood = now > prev ? 'better' : now === prev ? 'same' : 'worse';
  title(g, S, u, 'Сравнение', 80 * u, 290 * u);
  g.fillStyle = mood === 'worse' ? S.muted : acc; g.font = `800 ${(sq ? 170 : 210) * u}px ${S.head}`; g.fillText(txt, 70 * u, (sq ? 500 : 560) * u);
  g.fillStyle = S.muted; g.font = `400 ${32 * u}px ${S.font}`;
  const when = { 'вчера': 'вчера', 'прошлая неделя': 'за прошлую неделю', 'прошлый месяц': 'за прошлый месяц',
    'до этого': `за ${d.rangeDays} ${W_(d.rangeDays, 'день', 'дня', 'дней')} до этого` }[d.prevLabel] || d.prevLabel;
  g.fillText(mood === 'same' ? `столько же тем, сколько ${when}` : `тем ${mood === 'better' ? 'больше' : 'меньше'}, чем ${when}`, 80 * u, (sq ? 560 : 625) * u);
  const base = (sq ? 880 : 1500) * u, hMax = (sq ? 190 : 650) * u, max = Math.max(1, now, prev);
  [[d.prevLabel, prev, S.track], ['сейчас', now, acc]].forEach(([l, v, col], i) => {
    const bx = (sq ? 120 : 160) * u + i * (sq ? 260 : 340) * u, bw = (sq ? 200 : 260) * u, bh = Math.max(14 * u, v / max * hMax);
    g.fillStyle = col; rr(g, bx, base - bh, bw, bh, 26 * u); g.fill();
    g.textAlign = 'center'; g.fillStyle = S.ink; g.font = `800 ${60 * u}px ${S.font}`; g.fillText(String(v), bx + bw / 2, base - bh - 24 * u);
    g.fillStyle = S.muted; g.font = `500 ${28 * u}px ${S.font}`; g.fillText(l, bx + bw / 2, base + 46 * u); g.textAlign = 'left';
  });
  await drawGopher(g, poseFor(mood, d, rng), W - (sq ? 170 : 200) * u, base + 10 * u, (sq ? 280 : 420) * u, 0, rng() < 0.5);
}

async function cardMountain(g, W, H, c) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  title(g, S, u, 'Восхождение', 80 * u, 290 * u);
  g.fillStyle = S.ink; g.font = `800 ${150 * u}px ${S.head}`; g.fillText(`${d.pct}%`, 80 * u, (sq ? 460 : 500) * u);
  g.fillStyle = S.muted; g.font = `400 ${32 * u}px ${S.font}`; g.fillText(`пути пройдено · этапов закрыто ${d.stagesDone} из ${d.stages.length}`, 80 * u, (sq ? 520 : 565) * u);
  // гора: 7 уступов, вершина справа
  const top = (sq ? 560 : 700) * u, bottom = H - 140 * u, n = d.stages.length || 7;
  const pts = []; for (let i = 0; i <= n; i++) pts.push([W * (0.04 + 0.86 * i / n), bottom - (bottom - top) * Math.pow(i / n, 1.1)]);
  g.fillStyle = S === STYLES.terminal ? 'rgba(157,245,157,0.10)' : hexA(acc, 0.22);
  g.beginPath(); g.moveTo(0, H); pts.forEach(([x, y], i) => { g.lineTo(x, y); if (i < n) g.lineTo(x + (pts[i + 1][0] - x) * 0.45, y - 6 * u); }); g.lineTo(W, pts[n][1] + 80 * u); g.lineTo(W, H); g.closePath(); g.fill();
  // тропа до текущей высоты
  const pos = Math.min(n, d.pct / 100 * n);
  g.strokeStyle = acc; g.lineWidth = 8 * u; g.setLineDash([2 * u, 20 * u]); g.lineCap = 'round';
  g.beginPath(); pts.forEach(([x, y], i) => { if (i <= Math.ceil(pos)) (i ? g.lineTo(x, y) : g.moveTo(x, y)); }); g.stroke(); g.setLineDash([]);
  d.stages.forEach((st, i) => {
    const [x, y] = pts[i + 1];
    g.strokeStyle = S.muted; g.lineWidth = 4 * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 70 * u); g.stroke();
    g.fillStyle = st.done ? acc : S.track; g.beginPath(); g.moveTo(x, y - 70 * u); g.lineTo(x + 44 * u, y - 58 * u); g.lineTo(x, y - 44 * u); g.closePath(); g.fill();
    g.fillStyle = S.muted; g.font = `600 ${24 * u}px ${S.font}`; g.fillText(String(st.num), x + 8 * u, y + 32 * u);
  });
  const i0 = Math.floor(pos), f = pos - i0, A = pts[Math.min(i0, n)], B = pts[Math.min(i0 + 1, n)];
  const gx = A[0] + (B[0] - A[0]) * f, gy = A[1] + (B[1] - A[1]) * f;
  await drawGopher(g, poseFor('mountain', d, rng), gx, gy + 6 * u, (sq ? 150 : 190) * u, -0.18);
}

async function cardForecast(g, W, H, c) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  const m = d.forecast.find((f) => f.key === 'milestone') || d.forecast[0];
  title(g, S, u, 'Прогноз', 80 * u, 290 * u);
  g.fillStyle = S.muted; g.font = `400 ${32 * u}px ${S.font}`; g.fillText(m.label.toLowerCase(), 80 * u, 345 * u);
  g.fillStyle = S.ink; g.font = `800 ${(sq ? 130 : 160) * u}px ${S.head}`;
  g.fillText(m.ahead === 0 ? 'готово!' : m.days ? `${m.days} ${W_(m.days, 'день', 'дня', 'дней')}` : '—', 70 * u, (sq ? 500 : 530) * u);
  g.fillStyle = acc; g.font = `600 ${36 * u}px ${S.font}`; g.fillText(m.text || 'темп ещё считается', 80 * u, (sq ? 560 : 600) * u);
  let y = (sq ? 650 : 720) * u; const rows = sq ? d.stages.slice(0, 4) : d.stages;
  for (const st of rows) {
    g.fillStyle = st.done ? acc : S.ink; g.font = `600 ${30 * u}px ${S.font}`; g.fillText(`Этап ${st.num}`, 80 * u, y);
    g.fillStyle = S.muted; g.font = `400 ${26 * u}px ${S.font}`; g.fillText(wrap(g, st.title.split(':')[0], W - 520 * u)[0], 240 * u, y);
    g.textAlign = 'right'; g.fillText(`${st.pct}%`, W - 80 * u, y); g.textAlign = 'left';
    progress(g, S, st.done ? acc : hexA(acc, 0.6), u, 80 * u, y + 18 * u, W - 160 * u, st.pct);
    y += (sq ? 86 : 100) * u;
  }
  if (!sq) await drawGopher(g, poseFor('forecast', d, rng), W - 200 * u, H - 130 * u, 300 * u, 0, false);
}

// ---------- карточки периода: неделя, месяц, весь путь ----------
function moon(g, x, y, r, col) { // значок дня отдыха
  g.fillStyle = col; g.beginPath(); g.arc(x, y, r, Math.PI * 0.35, Math.PI * 1.65, false); g.arc(x + r * 0.45, y - r * 0.1, r * 0.8, Math.PI * 1.5, Math.PI * 0.5, true); g.closePath(); g.fill();
}
function check(g, x, y, r, col, w) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x - r * 0.5, y); g.lineTo(x - r * 0.12, y + r * 0.38); g.lineTo(x + r * 0.55, y - r * 0.4); g.stroke();
}
function star(g, x, y, r, col) {
  g.fillStyle = col; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); }
  g.closePath(); g.fill();
}
// рекорд: подпись, крупное значение, пояснение
function record(g, S, acc, u, x, y, label, value, sub, hl) {
  g.fillStyle = S.muted; g.font = `600 ${24 * u}px ${S.font}`; g.fillText(label.toUpperCase(), x, y);
  g.fillStyle = hl ? acc : S.ink; g.font = `800 ${52 * u}px ${S.head}`; g.fillText(value, x, y + 58 * u);
  if (sub) { g.fillStyle = S.muted; g.font = `400 ${26 * u}px ${S.font}`; g.fillText(sub, x, y + 96 * u); }
}

async function cardWeek(g, W, H, c) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  const days = d.days, act = days.filter((x) => x.active).length, max = Math.max(1, ...days.map((x) => x.themes));
  let best = -1; days.forEach((x, i) => { if (x.themes && (best < 0 || x.themes > days[best].themes)) best = i; });
  title(g, S, u, 'Ритм недели', 80 * u, 290 * u);
  g.fillStyle = S.muted; g.font = `400 ${30 * u}px ${S.font}`;
  g.fillText(`${act} из 7 ${W_(act, 'дня', 'дней', 'дней')} с учёбой` + (d.bestStreak > 1 ? ` · рекорд серии ${d.bestStreak}` : ''), 80 * u, 345 * u);
  const pose = pick(rng, act >= 5 ? ['cheer', 'dance', 'proud'] : act >= 3 ? ['wave', 'walk', 'point'] : ['tired', 'think', 'shrug']);
  if (sq) { // семь кружков в ряд
    const gap = 16 * u, cw = (W - 160 * u - gap * 6) / 7, r = cw / 2, cy = 560 * u;
    days.forEach((x, i) => {
      const cx = 80 * u + i * (cw + gap) + r;
      if (x.themes) { g.fillStyle = hexA(acc, 0.35 + 0.65 * x.themes / max); blob(g, cx, cy, r); }
      else if (x.future) { g.strokeStyle = S.line; g.lineWidth = 3 * u; g.setLineDash([8 * u, 8 * u]); g.beginPath(); g.arc(cx, cy, r - 2 * u, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
      else { g.fillStyle = S.track; blob(g, cx, cy, r); }
      if (x.themes) { g.fillStyle = onAcc(acc); g.textAlign = 'center'; g.font = `800 ${46 * u}px ${S.head}`; g.fillText(String(x.themes), cx, cy + 16 * u); g.textAlign = 'left'; }
      else if (x.active) check(g, cx, cy, r * 0.7, acc, 6 * u);
      else if (x.rest) moon(g, cx, cy, r * 0.32, S.muted);
      if (i === best) star(g, cx, cy - r - 26 * u, 18 * u, acc);
      g.fillStyle = i >= 5 ? acc : S.muted; g.textAlign = 'center'; g.font = `600 ${28 * u}px ${S.font}`; g.fillText(x.label, cx, cy + r + 50 * u); g.textAlign = 'left';
    });
    record(g, S, acc, u, 80 * u, 760 * u, 'за неделю', `${d.themes.length} ${W_(d.themes.length, 'тема', 'темы', 'тем')}`, `${d.lessons} ${W_(d.lessons, 'урок', 'урока', 'уроков')} · ${d.checks} ${W_(d.checks, 'ответ', 'ответа', 'ответов')}`, true);
    await drawGopher(g, pose, W - 200 * u, 950 * u, 230 * u, -0.04, true);
    return;
  }
  // сторис: семь строк-полос
  const x0 = 210 * u, bw = W - 80 * u - x0 - 90 * u, rowH = 124 * u, bh = 72 * u;
  let y = 420 * u;
  days.forEach((x, i) => {
    const cy = y + rowH / 2;
    g.fillStyle = i >= 5 ? acc : S.ink; g.font = `700 ${36 * u}px ${S.font}`; g.fillText(x.label, 80 * u, cy + 13 * u);
    if (x.future) { g.strokeStyle = S.line; g.lineWidth = 3 * u; g.setLineDash([10 * u, 10 * u]); rr(g, x0, cy - bh / 2, bw, bh, bh / 2); g.stroke(); g.setLineDash([]); }
    else { g.fillStyle = S.track; rr(g, x0, cy - bh / 2, bw, bh, bh / 2); g.fill(); }
    if (x.themes) {
      const w = Math.max(bh, bw * x.themes / max);
      g.fillStyle = i === best ? acc : hexA(acc, 0.55); rr(g, x0, cy - bh / 2, w, bh, bh / 2); g.fill();
      if (i === best) { g.fillStyle = onAcc(acc); g.font = `700 ${26 * u}px ${S.font}`; if (w > 300 * u) g.fillText('лучший день', x0 + 32 * u, cy + 9 * u); }
    } else if (x.active) { g.fillStyle = S.muted; g.font = `500 ${26 * u}px ${S.font}`; g.fillText('уроки и вопросы', x0 + 70 * u, cy + 9 * u); check(g, x0 + 36 * u, cy, 22 * u, acc, 5 * u); }
    else if (x.rest) { moon(g, x0 + 36 * u, cy, 12 * u, S.muted); g.fillStyle = S.muted; g.font = `500 ${26 * u}px ${S.font}`; g.fillText('отдых', x0 + 70 * u, cy + 9 * u); }
    g.textAlign = 'right'; g.fillStyle = x.themes ? S.ink : S.muted; g.font = `800 ${44 * u}px ${S.head}`;
    g.fillText(x.future ? '' : String(x.themes), W - 80 * u, cy + 15 * u); g.textAlign = 'left';
    y += rowH;
  });
  record(g, S, acc, u, 80 * u, y + 110 * u, 'за неделю', `${d.themes.length} ${W_(d.themes.length, 'тема', 'темы', 'тем')}`, `${d.lessons} ${W_(d.lessons, 'урок', 'урока', 'уроков')} · ${d.checks} ${W_(d.checks, 'ответ', 'ответа', 'ответов')}`, true);
  if (best >= 0) record(g, S, acc, u, 80 * u, y + 260 * u, 'сильнейший день', `${days[best].label} · ${days[best].themes}`, W_(days[best].themes, 'тема', 'темы', 'тем'));
  await drawGopher(g, pose, W - 230 * u, H - 120 * u, 380 * u, -0.05);
}

async function cardMonth(g, W, H, c) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  const days = d.days, act = days.filter((x) => x.active).length, max = Math.max(1, ...days.map((x) => x.themes));
  const off = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].indexOf(days[0]?.label);
  const MON = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  let ts = 64; g.font = `800 ${ts * u}px ${S.head}`; // период бывает длинным: «20 декабря 2025 — 10 января 2026»
  while (g.measureText(d.period).width > W - 160 * u && ts > 36) { ts -= 4; g.font = `800 ${ts * u}px ${S.head}`; }
  title(g, S, u, d.period, 80 * u, 290 * u, ts);
  g.fillStyle = S.muted; g.font = `400 ${30 * u}px ${S.font}`;
  g.fillText(`${act} ${W_(act, 'день', 'дня', 'дней')} с учёбой · ${d.themes.length} ${W_(d.themes.length, 'тема', 'темы', 'тем')}`, 80 * u, 345 * u);
  const nRows = Math.ceil((days.length + Math.max(0, off)) / 7);
  const gw = sq ? 600 * u : W - 160 * u, gap = (sq ? 10 : 14) * u, top = (sq ? 440 : 470) * u;
  const cell = Math.min((gw - gap * 6) / 7, ((sq ? 540 : 930) * u - gap * (nRows - 1)) / nRows); // длинный период — клетки мельче
  ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach((l, i) => {
    g.fillStyle = i >= 5 ? acc : S.muted; g.textAlign = 'center'; g.font = `600 ${(sq ? 22 : 26) * u}px ${S.font}`;
    g.fillText(l, 80 * u + i * (cell + gap) + cell / 2, top - 22 * u); g.textAlign = 'left';
  });
  days.forEach((x, i) => {
    const k = i + Math.max(0, off), col = k % 7, row = Math.floor(k / 7);
    const px = 80 * u + col * (cell + gap), py = top + row * (cell + gap), rad = cell * 0.24;
    const num = x.day === 1 && i > 0 ? `1 ${MON[+x.key.slice(5, 7) - 1]}` : String(x.day); // в периоде видно смену месяца
    const strong = x.themes / max > 0.5;
    if (x.future) { g.strokeStyle = S.line; g.lineWidth = 2 * u; rr(g, px + u, py + u, cell - 2 * u, cell - 2 * u, rad); g.stroke(); }
    else { g.fillStyle = x.themes ? hexA(acc, 0.3 + 0.7 * Math.min(1, x.themes / max)) : x.active ? hexA(acc, 0.14) : S.track; rr(g, px, py, cell, cell, rad); g.fill(); }
    if (x.key === d.date && !x.future) { g.strokeStyle = S.ink; g.lineWidth = 4 * u; rr(g, px - 4 * u, py - 4 * u, cell + 8 * u, cell + 8 * u, rad + 4 * u); g.stroke(); }
    g.fillStyle = strong ? onAcc(acc) : S.muted; g.font = `600 ${(sq ? 18 : 24) * u}px ${S.font}`; g.fillText(num, px + cell * 0.14, py + cell * 0.3);
    if (x.themes) { g.fillStyle = strong ? onAcc(acc) : S.ink; g.textAlign = 'center'; g.font = `800 ${(sq ? 30 : 44) * u}px ${S.head}`; g.fillText(String(x.themes), px + cell / 2, py + cell * 0.8); g.textAlign = 'left'; }
    else if (x.rest) moon(g, px + cell / 2, py + cell * 0.62, cell * 0.12, S.muted);
    else if (x.active) check(g, px + cell / 2, py + cell * 0.62, cell * 0.22, acc, 4 * u);
  });
  const end = top + nRows * (cell + gap);
  const bd = d.bestDay, bw = d.bestWeek;
  const pose = pick(rng, act >= 15 ? ['cheer', 'proud', 'dance'] : act >= 6 ? ['point', 'wave', 'proud'] : ['think', 'sit', 'tired']);
  if (sq) {
    const rx = 740 * u; let y = top + 10 * u;
    if (bd) { record(g, S, acc, u, rx, y, 'лучший день', `${bd.themes} ${W_(bd.themes, 'тема', 'темы', 'тем')}`, bd.label, true); y += 170 * u; }
    if (bw) { record(g, S, acc, u, rx, y, 'лучшая неделя', `${bw.themes} ${W_(bw.themes, 'тема', 'темы', 'тем')}`, bw.label); y += 170 * u; }
    await drawGopher(g, pose, 870 * u, 935 * u, 170 * u, -0.05, true);
    return;
  }
  let y = end + 60 * u;
  if (bd) { record(g, S, acc, u, 80 * u, y, 'лучший день', `${bd.themes} ${W_(bd.themes, 'тема', 'темы', 'тем')}`, bd.label, true); }
  if (bw) { record(g, S, acc, u, 80 * u + (bd ? 360 * u : 0), y, 'лучшая неделя', `${bw.themes} ${W_(bw.themes, 'тема', 'темы', 'тем')}`, bw.label); }
  y += bd || bw ? 170 * u : 0;
  record(g, S, acc, u, 80 * u, y, 'серия', `${d.streak} ${W_(d.streak, 'день', 'дня', 'дней')}`, d.bestStreak > d.streak ? `рекорд — ${d.bestStreak}` : 'это рекорд', false);
  await drawGopher(g, pose, W - 200 * u, H - 120 * u, Math.min(380 * u, H - 150 * u - end), -0.05);
}

async function cardJourney(g, W, H, c) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  const act = d.activeDays;
  g.fillStyle = acc; g.font = `700 ${30 * u}px ${S.font}`; g.fillText('УЧУ GO', 80 * u, (sq ? 250 : 280) * u);
  const txt = `День ${d.dayN}`; let fs = sq ? 150 : 190;
  g.font = `800 ${fs * u}px ${S.head}`; while (g.measureText(txt).width > W - 160 * u - (sq ? 330 : 360) * u && fs > 90) { fs -= 6; g.font = `800 ${fs * u}px ${S.head}`; }
  g.fillStyle = S.ink; g.fillText(txt, 70 * u, (sq ? 410 : 470) * u);
  g.fillStyle = S.muted; g.font = `400 ${32 * u}px ${S.font}`; g.fillText(`с ${d.start} · ${act} ${W_(act, 'день', 'дня', 'дней')} с учёбой`, 80 * u, (sq ? 470 : 540) * u);
  await drawGopher(g, pick(rng, ['proud', 'walk', 'cheer', 'wave']), W - (sq ? 200 : 220) * u, (sq ? 500 : 580) * u, (sq ? 280 : 330) * u, 0.04, true);
  // шесть плиток с итогом
  const tw = (W - 160 * u - 40 * u) / 3, th = (sq ? 160 : 190) * u, ty = (sq ? 540 : 620) * u;
  const nB = d.blocks.length;
  [[d.themes.length, W_(d.themes.length, 'тема', 'темы', 'тем'), true], [d.lessons, W_(d.lessons, 'урок', 'урока', 'уроков')], [d.checks, W_(d.checks, 'ответ', 'ответа', 'ответов')],
    [nB, W_(nB, 'блок закрыт', 'блока закрыто', 'блоков закрыто')], [d.stagesDone, `${W_(d.stagesDone, 'этап', 'этапа', 'этапов')} из ${d.stages.length}`], [d.bestStreak, 'рекорд серии', true]]
    .forEach(([n, l, hl], i) => tile(g, S, acc, u, 80 * u + (i % 3) * (tw + 20 * u), ty + Math.floor(i / 3) * (th + 20 * u), tw, th, n, l, hl));
  if (sq) return;
  // вехи: первая и последние
  const ms = d.milestones.length > 5 ? [d.milestones[0], ...d.milestones.slice(-4)] : d.milestones;
  if (!ms.length) return;
  let y = ty + th * 2 + 110 * u;
  g.fillStyle = S.muted; g.font = `600 ${28 * u}px ${S.font}`; g.fillText('ВЕХИ', 80 * u, y); y += 70 * u;
  const lx = 262 * u, step = 112 * u;
  g.strokeStyle = S.line; g.lineWidth = 4 * u; g.beginPath(); g.moveTo(lx, y - 10 * u); g.lineTo(lx, y + step * (ms.length - 1) - 10 * u); g.stroke();
  ms.forEach((m, i) => {
    const yy = y + i * step, last = i === ms.length - 1;
    g.fillStyle = acc; g.font = `600 ${26 * u}px ${MONO}`; g.textAlign = 'right'; g.fillText(m.date, lx - 34 * u, yy); g.textAlign = 'left';
    if (last) { g.fillStyle = acc; blob(g, lx, yy - 10 * u, 16 * u); g.fillStyle = hexA(acc, 0.25); blob(g, lx, yy - 10 * u, 28 * u); }
    else { g.fillStyle = acc; blob(g, lx, yy - 10 * u, 12 * u); }
    g.fillStyle = S.ink; g.font = `700 ${34 * u}px ${S.font}`; g.fillText(m.label, lx + 44 * u, yy);
    g.fillStyle = S.muted; g.font = `400 ${26 * u}px ${S.font}`;
    const l = wrap(g, plain(m.sub), W - 80 * u - lx - 44 * u); g.fillText(l[0] + (l.length > 1 ? '…' : ''), lx + 44 * u, yy + 38 * u);
  });
}

// ---------- список (своя карточка): что изучил ----------
// Мини-markdown в пункте: `код`, **жирный**, *курсив*. Вложенность — один уровень (lvl 0 или 1).
export function mdRuns(text) {
  const out = []; const re = /`([^`]+)`|\*\*(.+?)\*\*|\*(.+?)\*/g; let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    if (m[1] != null) out.push({ t: m[1], code: true });
    else if (m[2] != null) out.push({ t: m[2], b: true });
    else out.push({ t: m[3], i: true });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}
const runFont = (r, S, px, wt = 500) => r.code ? `600 ${px * 0.88}px ${MONO}` : `${r.i ? 'italic ' : ''}${r.b ? 800 : wt} ${px}px ${S.font}`;
// раскладка по строкам: слова со своим начертанием, перенос по ширине
function runLines(g, S, runs, maxW, px, wt) {
  const lines = [[]]; let x = 0;
  for (const r of runs) {
    g.font = runFont(r, S, px, wt);
    for (const t of r.t.split(/(\s+)/)) {
      if (!t) continue;
      const w = g.measureText(t).width, sp = /^\s+$/.test(t);
      if (sp) { if (x > 0) { lines[lines.length - 1].push({ t: ' ', r, x, w, sp }); x += w; } continue; }
      if (x + w > maxW && x > 0) { const l = lines[lines.length - 1]; while (l.length && l[l.length - 1].sp) l.pop(); lines.push([]); x = 0; }
      lines[lines.length - 1].push({ t, r, x, w }); x += w;
    }
  }
  return lines;
}
// текст с мини-markdown: y — верх строки; dry — только высота
function mdText(g, S, acc, u, text, x, y, maxW, px, color, dry, wt = 500) {
  const lines = runLines(g, S, mdRuns(String(text)), maxW, px, wt), lh = px * 1.3;
  if (!dry) lines.forEach((l, i) => {
    const base = y + lh * 0.76 + i * lh;
    for (const tk of l) {
      if (tk.sp) continue;
      if (tk.r.code) { g.fillStyle = hexA(acc, 0.16); rr(g, x + tk.x - 6 * u, base - px * 0.86, tk.w + 12 * u, px * 1.14, 8 * u); g.fill(); }
      g.font = runFont(tk.r, S, px, wt); g.fillStyle = tk.r.code ? acc : color; g.fillText(tk.t, x + tk.x, base);
    }
  });
  return Math.max(1, lines.length) * lh;
}
// пузыри списка (вариант «лесенка»): пункт — с галочкой, подпункт — с точкой, комментарий — с кавычкой
const IND = 56; // сдвиг подпунктов и комментария
function bubbleItem(g, S, acc, u, x, w, y, text, px, dry) {
  const tx = x + 100 * u, tw = x + w - 32 * u - tx, h = mdText(g, S, acc, u, text, tx, 0, tw, px, S.ink, true) + 52 * u;
  if (dry) return h;
  g.fillStyle = S.card; rr(g, x, y, w, h, 28 * u); g.fill();
  const cy = y + 26 * u + px * 0.65;
  g.fillStyle = acc; blob(g, x + 52 * u, cy, 22 * u); check(g, x + 52 * u, cy, 26 * u, onAcc(acc), 5 * u);
  mdText(g, S, acc, u, text, tx, y + 26 * u, tw, px, S.ink);
  return h;
}
function bubbleSub(g, S, acc, u, x, w, y, text, px, dry) {
  const tx = x + 50 * u, tw = x + w - 32 * u - tx, h = mdText(g, S, acc, u, text, tx, 0, tw, px, S.ink, true) + 40 * u;
  if (dry) return h;
  g.fillStyle = S.card; rr(g, x, y, w, h, 28 * u); g.fill();
  g.fillStyle = acc; blob(g, x + 26 * u, y + 20 * u + px * 0.62, 8 * u);
  mdText(g, S, acc, u, text, tx, y + 20 * u, tw, px, S.ink);
  return h;
}
function bubbleNote(g, S, acc, u, x, w, y, text, px, dry) {
  const tx = x + 84 * u, tw = x + w - 32 * u - tx, h = mdText(g, S, acc, u, text, tx, 0, tw, px, S.ink, true) + 48 * u;
  if (dry) return h;
  g.fillStyle = hexA(acc, 0.16); rr(g, x, y, w, h, 28 * u); g.fill();
  g.fillStyle = acc; g.font = `800 ${100 * u}px Georgia, serif`; g.fillText('“', x + 22 * u, y + 96 * u);
  mdText(g, S, acc, u, text, tx, y + 24 * u, tw, px, S.ink);
  return h;
}
const BUBBLE = { item: bubbleItem, sub: bubbleSub, note: bubbleNote };

// раскладка списка: блоки (пункт, подпункты, комментарий внизу) → страницы; текст не уменьшается
function listLayout(g, W, H, card) {
  const S = STYLES[card.bg] || STYLES.night, u = W / 1080, sq = H === W;
  const px = (sq ? 40 : 44) * u, npx = (sq ? 32 : 36) * u, x0 = 80 * u, w = W - 160 * u;
  const groups = [];
  for (const t of card.tasks || []) {
    if (!String(t.text).trim()) continue;
    if (t.lvl === 1 && groups.length) groups[groups.length - 1].push({ type: 'sub', text: t.text });
    else groups.push([{ type: 'item', text: t.text, note: t.comment }]);
  }
  for (const gr of groups) if (gr[0].note && String(gr[0].note).trim()) gr.push({ type: 'note', text: gr[0].note }); // комментарий — в самый низ блока
  const gw = card.gopher === 'none' ? 0 : (sq ? 200 : 240) * u; // гофер у заголовка
  const ts = (sq ? 80 : 96) * u;
  g.font = `800 ${ts}px ${S.head}`;
  const title = String(card.title || '').trim() ? wrap(g, card.title, w - gw) : [];
  const top = (sq ? 175 : 215) * u + title.length * ts * 1.08 + (title.length ? 46 * u : 0);
  const contentTop = Math.max(top, gw ? (sq ? 350 : 420) * u : 0), limit = H - (sq ? 70 : 90) * u;
  const meas = (bl) => BUBBLE[bl.type](g, S, STYLES.night.accents[0], u, bl.type === 'item' ? x0 : x0 + IND * u, bl.type === 'item' ? w : w - IND * u, 0, bl.text, bl.type === 'note' ? npx : px, true);
  const pages = [[]]; let y = contentTop;
  const empty = () => !pages[pages.length - 1].length;
  const next = () => { pages.push([]); y = contentTop; };
  for (const gr of groups) {
    const hs = gr.map(meas), body = hs.reduce((a, b) => a + b, 0) + 10 * u * (gr.length - 1);
    if (!empty() && y + 28 * u + body > limit && body <= limit - contentTop) next(); // блок целиком — на новую страницу
    gr.forEach((bl, i) => { // блок длиннее страницы — делится по подпунктам
      let gap = empty() ? 0 : i ? 10 * u : 28 * u;
      if (!empty() && y + gap + hs[i] > limit) { next(); gap = 0; }
      pages[pages.length - 1].push({ ...bl, h: hs[i], gap });
      y += gap + hs[i];
    });
  }
  return { S, u, sq, px, npx, x0, w, title, ts, gw, contentTop, limit, pages };
}
export function listPages(card, format) {
  const [W, H] = FORMATS[format]; const cv = document.createElement('canvas');
  return Math.max(1, listLayout(cv.getContext('2d'), W, H, card).pages.length);
}
const LIST_POSES = ['point', 'proud', 'think', 'wave', 'idle'];
// card = { kind: 'list', bg, title, tasks: [{ text, lvl, comment }], gopher: 'auto' | 'none' | поза, flip }
export async function drawList(g, W, H, card, acc, page = 0) {
  const L = listLayout(g, W, H, card), { S, u, sq } = L;
  if (!S.accents.includes(acc)) acc = S.accents[0]; // акцент — из своего фона, иначе код на светлом не читается
  S.bg(g, W, H, acc);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  if (LOGO.complete && LOGO.naturalWidth) g.drawImage(LOGO, 80 * u, 80 * u, 56 * u, 56 * u);
  g.fillStyle = S.ink; g.font = `700 ${32 * u}px ${S.font}`; g.fillText('Ascent', 154 * u, 108 * u);
  g.fillStyle = S.muted; g.font = `400 ${24 * u}px ${S.font}`;
  g.fillText(card.sub || new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }), 154 * u, 138 * u);
  const n = L.pages.length; page = Math.min(page, n - 1);
  if (n > 1) { g.textAlign = 'right'; g.font = `500 ${26 * u}px ${S.font}`; g.fillText(`${page + 1} / ${n}`, W - 80 * u, 118 * u); g.textAlign = 'left'; }
  g.fillStyle = S.ink; g.font = `800 ${L.ts}px ${S.head}`;
  L.title.forEach((l, i) => g.fillText(l, 80 * u, (sq ? 175 : 215) * u + L.ts * (0.9 + i * 1.08)));
  let y = L.contentTop;
  for (const bl of L.pages[page] || []) {
    y += bl.gap;
    const x = bl.type === 'item' ? L.x0 : L.x0 + IND * u, w = bl.type === 'item' ? L.w : L.w - IND * u;
    BUBBLE[bl.type](g, S, acc, u, x, w, y, bl.text, bl.type === 'note' ? L.npx : L.px, false);
    y += bl.h;
  }
  if (card.gopher === 'none') return;
  const auto = (card.gopher || 'auto') === 'auto';
  const last = page === n - 1, free = H - 50 * u - y;
  if (last && free >= (sq ? 300 : 400) * u) { // на последней странице, если внизу есть место, — крупно
    const gh = Math.min((sq ? 340 : 540) * u, free - 110 * u); // запас сверху: поднятые лапки и искры
    await drawGopher(g, auto ? (n > 1 || (L.pages[0] || []).length > 5 ? 'cheer' : 'proud') : card.gopher, W - 80 * u - gh * 0.42, H - 50 * u, gh, -0.05, !card.flip);
    return;
  }
  const gh = (sq ? 180 : 220) * u;
  await drawGopher(g, auto ? LIST_POSES[page % LIST_POSES.length] : card.gopher, W - 80 * u - gh * 0.42, L.contentTop - 24 * u, gh, 0.04, !!card.flip);
}

// ---------- своя карточка (редактор) ----------
// Шрифты текста: системные, без загрузки из сети (есть и в Windows, и в macOS; иначе — общий запасной).
export const TEXT_FONTS = {
  head: ['Как в стиле', null],
  sans: ['Обычный', FONT],
  serif: ['С засечками', SERIF],
  mono: ['Моноширинный', MONO],
  poster: ['Плакатный', 'Impact, "Arial Black", "Helvetica Neue", sans-serif'],
  round: ['Округлый', '"Arial Rounded MT Bold", "Segoe UI Black", "Trebuchet MS", sans-serif'],
  hand: ['Рукописный', '"Segoe Print", "Bradley Hand", "Comic Sans MS", "Marker Felt", cursive'],
};
// Цвета текста: цвета стиля и общая палитра; любой другой — свой HEX.
export const TEXT_COLORS = ['ink', 'accent', 'muted', '#FFFFFF', '#141414', '#4CC9EA', '#4FD08F', '#F5C542', '#FFA640', '#F06AA6', '#A78BFA', '#E2553B'];
export function textColor(it, S, acc) { return it.color === 'accent' ? (acc || S.accents[0]) : it.color === 'muted' ? S.muted : it.color && it.color[0] === '#' ? it.color : S.ink; }
export function textFont(it, S) {
  if (it.font === 'body') return S.font; // старые карточки
  const f = TEXT_FONTS[it.font];
  return f && f[1] ? f[1] : S.head;
}
// card = { bg: ключ стиля, items: [{ type: 'text', … } | { type: 'gopher', pose, x, y, size, rot, flip }] }
// x, y — доли ширины/высоты (центр элемента), size — px при ширине 1080.
// Текстовый блок с рамкой (bw — ширина рамки в px при 1080; bh — высота для режима «вписать»):
//   fit: 'none' — без рамки, строки как набраны; 'wrap' — перенос по ширине рамки; 'fit' — кегль подбирается,
//   чтобы текст влез в рамку (не больше size). align — left|center|right, valign — top|middle|bottom (для «вписать»),
//   lh — межстрочный, upper — заглавные, plate — none|card|accent (подложка), shadow — тень. В тексте — мини-markdown.
const CUSTOM_LH = 1.15;
function customFont(it, S, r, px) { return `${r.i ? 'italic ' : ''}${r.b ? 900 : it.weight || 800} ${px}px ${r.code ? MONO : textFont(it, S)}`; }
function customLines(g, it, S, px, maxW) {
  const text = it.upper ? String(it.text).toUpperCase() : String(it.text);
  const out = [];
  for (const para of text.split('\n')) {
    let cur = [], x = 0;
    for (const r of mdRuns(para)) {
      g.font = customFont(it, S, r, px);
      for (const t of r.t.split(/(\s+)/)) {
        if (!t) continue;
        const w = g.measureText(t).width, sp = /^\s+$/.test(t);
        if (sp) { if (x > 0) { cur.push({ t: ' ', r, x, w, sp }); x += w; } continue; }
        if (maxW && x + w > maxW && x > 0) { while (cur.length && cur[cur.length - 1].sp) x -= cur.pop().w; out.push({ toks: cur, w: x }); cur = []; x = 0; }
        cur.push({ t, r, x, w }); x += w;
      }
    }
    while (cur.length && cur[cur.length - 1].sp) x -= cur.pop().w;
    out.push({ toks: cur, w: x });
  }
  return out;
}
// раскладка текстового блока: строки, кегль, размеры рамки (px холста)
export function textLayout(g, W, it, S = STYLES.night) {
  const u = W / 1080, mode = it.fit || 'none', lh = it.lh || CUSTOM_LH, pad = it.plate && it.plate !== 'none' ? 0.6 : 0;
  let px = it.size * u;
  const bw = mode === 'none' ? 0 : (it.bw || 800) * u;
  let lines = customLines(g, it, S, px, bw);
  if (mode === 'fit') { // уменьшать, пока не влезет в рамку
    const bh = (it.bh || 400) * u;
    for (let k = 0; k < 60 && px > 8 * u; k++) {
      lines = customLines(g, it, S, px, bw);
      const tooWide = lines.some((l) => l.w > bw + 0.5);
      if (lines.length * px * lh <= bh && !tooWide) break;
      px *= 0.95;
    }
  }
  const textW = Math.max(1, ...lines.map((l) => l.w)), textH = lines.length * px * lh;
  const w = mode === 'none' ? textW : bw, h = mode === 'fit' ? (it.bh || 400) * u : textH;
  return { lines, px, lh, w, h, textH, pad: pad * px };
}
function drawTextItem(g, W, H, it, S, acc) {
  const L = textLayout(g, W, it, S), u = W / 1080;
  g.save(); g.translate(it.x * W, it.y * H); g.rotate(it.rot || 0);
  const col = textColor(it, S, acc);
  if (it.plate === 'card' || it.plate === 'accent') { // подложка
    const p = L.pad;
    g.fillStyle = it.plate === 'accent' ? acc : S.card; rr(g, -L.w / 2 - p, -L.h / 2 - p, L.w + p * 2, L.h + p * 2, Math.min(40 * u, p + 12 * u)); g.fill();
  }
  if (it.shadow) { g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = L.px * 0.25; g.shadowOffsetY = L.px * 0.06; }
  const al = it.align || 'center', va = it.valign || 'middle';
  let y0 = -L.h / 2; if (L.h > L.textH) y0 += va === 'bottom' ? L.h - L.textH : va === 'middle' ? (L.h - L.textH) / 2 : 0;
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  const ink = it.plate === 'accent' && (!it.color || it.color === 'ink' || it.color === 'accent') ? onAcc(acc) : col;
  L.lines.forEach((l, i) => {
    const x0 = al === 'left' ? -L.w / 2 : al === 'right' ? L.w / 2 - l.w : -l.w / 2;
    const base = y0 + i * L.px * L.lh + L.px * (0.5 * L.lh + 0.36);
    for (const k of l.toks) {
      if (k.sp) continue;
      if (k.r.code) { g.save(); g.shadowColor = 'transparent'; g.fillStyle = hexA(acc, 0.2); rr(g, x0 + k.x - 4 * u, base - L.px * 0.86, k.w + 8 * u, L.px * 1.1, 8 * u); g.fill(); g.restore(); }
      g.font = customFont(it, S, k.r, L.px);
      g.fillStyle = k.r.b && it.plate !== 'accent' ? acc : ink; // жирное — акцентом
      g.fillText(k.t, x0 + k.x, base);
    }
  });
  g.restore();
}
export async function drawCustom(g, W, H, card, acc) {
  const S = STYLES[card.bg] || STYLES.night;
  acc = acc || S.accents[0];
  S.bg(g, W, H, acc);
  const u = W / 1080;
  for (const it of card.items) {
    if (it.type === 'gopher') { await drawGopher(g, it.pose, it.x * W, it.y * H + it.size * u / 2, it.size * u, it.rot || 0, !!it.flip); continue; }
    drawTextItem(g, W, H, it, S, acc);
  }
}
// размеры элемента для выделения в редакторе (в px холста, без поворота)
export function itemBox(g, W, H, it) {
  const u = W / 1080;
  if (it.type === 'gopher') return { w: it.size * u * 0.86, h: it.size * u * 1.02 };
  const L = textLayout(g, W, it);
  return { w: L.w + (it.fit && it.fit !== 'none' ? 0 : 20 * u), h: L.h + 10 * u };
}

// авто-режим: из текста — заголовок, подзаголовок, гофер в свободном углу
export function autoCard(text, rng) {
  const lines = String(text).split('\n').map((x) => x.trim()).filter(Boolean);
  const bg = pick(rng, STYLE_KEYS);
  const head = lines[0] || 'Ascent';
  const rest = lines.slice(1).join('\n');
  const size = Math.max(64, Math.min(150, Math.round(1500 / Math.max(6, head.length))));
  const top = rng() < 0.5;
  const items = [{ type: 'text', text: head, x: 0.5, y: top ? 0.24 : 0.5, size, rot: 0, color: 'ink', fit: 'wrap', bw: 900, align: 'center' }];
  if (rest) items.push({ type: 'text', text: rest, x: 0.5, y: top ? 0.4 : 0.66, size: 46, rot: 0, color: 'ink', weight: 500, font: 'sans', fit: 'wrap', bw: 860, align: 'center', lh: 1.35 });
  const pose = pick(rng, ['cheer', 'wave', 'proud', 'dance', 'point', 'jump', 'derp', 'think']);
  items.push({ type: 'gopher', pose, x: top ? 0.5 : (rng() < 0.5 ? 0.24 : 0.76), y: top ? 0.7 : 0.84, size: top ? 640 : 380, rot: 0, flip: rng() < 0.5 });
  return { bg, items };
}

// ---------- Anki: итоги повторений из расширения «Итоги периода (JSON)» ----------
// Главное — карточки (новые и старые) и время на ответы; ниже — серия с огнём и созданные карточки.
function fitPx(g, text, font, size, maxW, min = 40) { // самый крупный кегль, при котором текст влезает
  let px = size; g.font = font(px);
  while (px > min && g.measureText(text).width > maxW) { px -= 4; g.font = font(px); }
  return px;
}
function flamePath(g, x, y, h) {
  const w = h * 0.72; g.beginPath();
  g.moveTo(x + w * 0.06, y - h);
  g.bezierCurveTo(x + w * 0.2, y - h * 0.78, x + w * 0.58, y - h * 0.64, x + w * 0.52, y - h * 0.34);
  g.bezierCurveTo(x + w * 0.5, y - h * 0.08, x + w * 0.26, y, x, y);
  g.bezierCurveTo(x - w * 0.26, y, x - w * 0.52, y - h * 0.08, x - w * 0.52, y - h * 0.32);
  g.bezierCurveTo(x - w * 0.52, y - h * 0.5, x - w * 0.36, y - h * 0.56, x - w * 0.3, y - h * 0.74);
  g.bezierCurveTo(x - w * 0.16, y - h * 0.6, x - w * 0.08, y - h * 0.66, x - w * 0.04, y - h * 0.82);
  g.bezierCurveTo(x, y - h * 0.9, x + w * 0.02, y - h * 0.95, x + w * 0.06, y - h); g.closePath();
}
// огонь: цвета огня, не акцента. Серия 0 — погасший; от недели — два языка, от месяца — три, от сотни — с искрами
function flame(g, x, y, s, days) {
  const one = (fx, fh, out) => {
    const gr = g.createLinearGradient(0, y - fh, 0, y);
    gr.addColorStop(0, out ? '#8C8C92' : '#FF4D2E'); gr.addColorStop(1, out ? '#B9B9BE' : '#FF9A2E');
    flamePath(g, fx, y, fh); g.fillStyle = gr; g.fill();
    if (out) return;
    flamePath(g, fx + fh * 0.02, y, fh * 0.58); g.fillStyle = '#FFD24A'; g.fill();
    flamePath(g, fx + fh * 0.03, y, fh * 0.28); g.fillStyle = '#FFF4C2'; g.fill();
  };
  if (!days) { one(x, s * 0.8, true); return; }
  if (days >= 100) { const gl = g.createRadialGradient(x, y - s * 0.4, 0, x, y - s * 0.4, s * 0.9); gl.addColorStop(0, 'rgba(255,140,40,0.35)'); gl.addColorStop(1, 'rgba(255,140,40,0)'); g.fillStyle = gl; g.fillRect(x - s, y - s * 1.4, s * 2, s * 1.6); }
  if (days >= 30) one(x + s * 0.3, s * 0.62);
  if (days >= 7) one(x - s * 0.28, s * 0.72);
  one(x, s);
  if (days >= 100) { g.fillStyle = '#FFD24A'; [[0.42, 0.95, 0.05], [-0.4, 1.02, 0.04], [0.15, 1.18, 0.035]].forEach(([dx, dy, r]) => blob(g, x + s * dx, y - s * dy, s * r)); }
}
function ankiClock(g, acc, cx, cy, r) {
  g.strokeStyle = acc; g.lineWidth = r * 0.16; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - r * 0.58); g.moveTo(cx, cy); g.lineTo(cx + r * 0.42, cy + r * 0.2); g.stroke();
}
function ankiNewCard(g, acc, x, y, s) { // стопка карточек с плюсом
  g.save(); g.translate(x + s * 0.55, y + s * 0.5); g.rotate(0.18); g.fillStyle = hexA(acc, 0.35); rr(g, -s * 0.34, -s * 0.44, s * 0.68, s * 0.88, s * 0.12); g.fill(); g.restore();
  g.save(); g.translate(x + s * 0.45, y + s * 0.5); g.rotate(-0.08); g.fillStyle = acc; rr(g, -s * 0.34, -s * 0.44, s * 0.68, s * 0.88, s * 0.12); g.fill();
  g.strokeStyle = onAcc(acc); g.lineWidth = s * 0.09; g.lineCap = 'round'; g.beginPath(); g.moveTo(-s * 0.15, 0); g.lineTo(s * 0.15, 0); g.moveTo(0, -s * 0.15); g.lineTo(0, s * 0.15); g.stroke(); g.restore();
}
const num1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
async function cardAnki(g, W, H, c, page, total) {
  const { S, acc, d } = c, a = d.anki, i = ankiInfo(a), u = W / 1080, sq = H === W;
  const cards = a.unique_cards_reviewed, NEW = a.new_cards_first_studied, OLD = i.old;
  // рамка: своя дата периода из Anki, подпись «данные из Anki»
  S.bg(g, W, H, acc);
  if (LOGO.complete && LOGO.naturalWidth) g.drawImage(LOGO, 80 * u, 80 * u, 56 * u, 56 * u);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.fillStyle = S.ink; g.font = `700 ${32 * u}px ${S.font}`; g.fillText('Ascent', 154 * u, 108 * u);
  g.fillStyle = S.muted; g.font = `400 ${24 * u}px ${S.font}`; g.fillText(i.period, 154 * u, 138 * u);
  if (total > 1) { g.textAlign = 'right'; g.font = `500 ${26 * u}px ${S.font}`; g.fillText(`${page} / ${total}`, W - 80 * u, 118 * u); g.textAlign = 'left'; }
  g.font = `500 ${26 * u}px ${S.font}`; g.fillText(d.nick || 'Go — ROADMAP', 80 * u, H - 70 * u);
  g.textAlign = 'right'; g.fillText('данные из Anki', W - 80 * u, H - 70 * u); g.textAlign = 'left';
  // колода и подзаголовок
  const L = sq ? { chipY: 166, kick: [0, 0], heroY: 420, heroMax: 200, labY: 482, divTop: 300, divBot: 500, minY: 400, minMax: 120, clockY: 462, barY: 530, barH: 110, footY: 690, boxY: 730, boxH: 190 }
    : { chipY: 200, kick: [80, 330], heroY: 610, heroMax: 280, labY: 694, divTop: 400, divBot: 710, minY: 580, minMax: 160, clockY: 648, barY: 800, barH: 140, footY: 1000, boxY: 1070, boxH: 230 };
  g.font = `700 ${30 * u}px ${S.font}`;
  let deck = a.deck; while (g.measureText(deck).width > W - 160 * u - (sq ? 420 : 64) * u && deck.length > 4) deck = deck.slice(0, -2) + '…';
  const cw = g.measureText(deck).width + 64 * u;
  g.fillStyle = hexA(acc, 0.18); rr(g, 80 * u, L.chipY * u, cw, 56 * u, 28 * u); g.fill();
  g.fillStyle = acc; rr(g, 98 * u, L.chipY * u + 18 * u, 14 * u, 20 * u, 3 * u); g.fill();
  g.fillText(deck, 124 * u, L.chipY * u + 39 * u);
  if (sq) g.fillText(i.kicker, 80 * u + cw + 24 * u, L.chipY * u + 39 * u);
  else g.fillText(i.kicker, L.kick[0] * u, L.kick[1] * u);
  // главное: карточки | минуты
  const mid = W / 2 + 40 * u;
  fitPx(g, String(cards), (p) => `800 ${p}px ${S.head}`, L.heroMax * u, mid - 120 * u - 66 * u);
  g.fillStyle = S.ink; g.fillText(String(cards), 66 * u, L.heroY * u);
  g.font = `700 ${(sq ? 42 : 50) * u}px ${S.font}`; g.fillText(W_(cards, 'карточка', 'карточки', 'карточек'), 80 * u, L.labY * u);
  g.strokeStyle = S.line; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(mid - 40 * u, L.divTop * u); g.lineTo(mid - 40 * u, L.divBot * u); g.stroke();
  const mins = num1(a.minutes_spent);
  fitPx(g, mins, (p) => `800 ${p}px ${S.head}`, L.minMax * u, W - 80 * u - mid);
  g.fillStyle = acc; g.fillText(mins, mid, L.minY * u);
  const cr = (sq ? 22 : 26) * u;
  ankiClock(g, acc, mid + cr + 4 * u, L.clockY * u, cr);
  g.fillStyle = S.ink; g.font = `700 ${(sq ? 32 : 40) * u}px ${S.font}`; g.fillText('мин на ответы', mid + cr * 2 + 22 * u, L.clockY * u + 14 * u);
  // новые | старые
  const bx = 80 * u, by = L.barY * u, bw = W - 160 * u, bh = L.barH * u;
  const fn = `800 ${bh * 0.46}px ${S.head}`, fl = `600 ${bh * 0.24}px ${S.font}`;
  const labW = (n, l) => { g.font = fn; const w1 = g.measureText(String(n)).width; g.font = fl; return [w1, g.measureText(l).width]; };
  const lN = W_(NEW, 'новая', 'новых', 'новых'), lO = W_(OLD, 'старая', 'старых', 'старых');
  const [n1, n2] = labW(NEW, lN), [o1, o2] = labW(OLD, lO);
  const minN = n1 + n2 + 12 * u + 64 * u, minO = o1 + o2 + 12 * u + 64 * u; // каждая часть не уже своей подписи
  let nw = cards ? bw * NEW / cards : bw / 2;
  nw = Math.max(minN, Math.min(bw - minO, nw));
  g.fillStyle = hexA(acc, 0.28); rr(g, bx, by, bw, bh, bh * 0.3); g.fill();
  g.fillStyle = acc; rr(g, bx, by, nw, bh, bh * 0.3); g.fill();
  const lab = (n, l, w1, x0, col) => { g.fillStyle = col; g.font = fn; g.fillText(String(n), x0, by + bh * 0.66); g.font = fl; g.fillText(l, x0 + w1 + 12 * u, by + bh * 0.64); };
  lab(NEW, lN, n1, bx + 32 * u, onAcc(acc));
  lab(OLD, lO, o1, bx + bw - 32 * u - o1 - 12 * u - o2, S.ink);
  // второстепенное
  const foot = !a.total_reviews ? 'ответов не было' : [`${a.total_reviews} ${W_(a.total_reviews, 'ответ', 'ответа', 'ответов')}`,
    i.perCard ? `${num1(i.perCard)} показа на карточку` : '', i.secPer ? `≈ ${Math.round(i.secPer)} с на ответ` : ''].filter(Boolean).join(' · ');
  g.fillStyle = S.muted; fitPx(g, foot, (p) => `400 ${p}px ${S.font}`, 28 * u, W - 160 * u, 18 * u); g.fillText(foot, 80 * u, L.footY * u);
  // серия с огнём | созданные — одна плашка
  const y = L.boxY * u, bH = L.boxH * u, half = bw * 0.64, st = a.deck_streak_days, rec = a.deck_longest_streak_days;
  g.fillStyle = S.card; rr(g, bx, y, bw, bH, 40 * u); g.fill();
  flame(g, 152 * u, y + bH * 0.79, bH * 0.6, st);
  const tx = 236 * u, tw = bx + half - 24 * u - tx;
  const sTxt = st ? `${st} ${W_(st, 'день', 'дня', 'дней')} подряд` : 'серия прервалась';
  g.fillStyle = st ? S.ink : S.muted; fitPx(g, sTxt, (p) => `800 ${p}px ${S.head}`, (sq ? 48 : 54) * u, tw, 24 * u); g.fillText(sTxt, tx, y + bH * 0.5);
  const sub = st && st >= rec && st > 1 ? 'это рекорд колоды!' : `рекорд колоды — ${rec}`;
  g.fillStyle = st && st >= rec && st > 1 ? acc : S.muted; fitPx(g, sub, (p) => `${st >= rec && st > 1 ? 700 : 500} ${p}px ${S.font}`, 28 * u, tw, 18 * u); g.fillText(sub, tx + 2 * u, y + bH * 0.74);
  g.strokeStyle = S.line; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(bx + half, y + 36 * u); g.lineTo(bx + half, y + bH - 36 * u); g.stroke();
  const cx = bx + half + 36 * u, rw = bx + bw - 32 * u - cx, ic = bH * 0.37;
  ankiNewCard(g, acc, cx, y + bH * 0.16, ic);
  g.fillStyle = S.ink; fitPx(g, String(a.new_cards_created), (p) => `800 ${p}px ${S.head}`, (sq ? 54 : 60) * u, rw - ic - 26 * u, 24 * u); g.fillText(String(a.new_cards_created), cx + ic + 26 * u, y + bH * 0.48);
  const cl = W_(a.new_cards_created, 'карточка создана', 'карточки создано', 'карточек создано');
  g.fillStyle = S.muted; fitPx(g, cl, (p) => `500 ${p}px ${S.font}`, 28 * u, rw, 18 * u); g.fillText(cl, cx, y + bH * 0.75);
  if (!sq) {
    const pose = !cards ? 'sleep' : st > 1 && st >= rec ? 'cheer' : NEW ? 'proud' : 'wave';
    await drawGopher(g, pose, W - 230 * u, H - 120 * u, 380 * u, -0.04, false);
  }
}

// комментарий к пройденной теме (настройка theme_notes)
function noteOf(d, t) { const n = d.notes && d.notes[t.id]; return n && String(n).trim() ? String(n) : ''; }

// ---------- набор карточек ----------
export const EXTRA_CARDS = [
  ['heat', 'Хитмапа'], ['tracks', 'Треки'], ['compare', 'Сравнение'], ['mountain', 'Гора'], ['forecast', 'Прогноз'],
];
const extraOk = {
  heat: (d) => d.heat && d.heat.length > 0,
  tracks: (d) => d.tracks.some((t) => t.done),
  compare: (d) => d.prev >= 0 && (d.prev > 0 || d.themes.length > 0),
  mountain: (d) => d.stages.length > 0,
  forecast: (d) => d.forecast.length > 0,
};
const draws = { week: cardWeek, month: cardMonth, journey: cardJourney, heat: cardHeat, tracks: cardTracks, compare: cardCompare, mountain: cardMountain, forecast: cardForecast };

// plan: какие карточки рисовать. opts = { mode, toggles, seed }
export function planCards(d, opts) {
  const rng = rngFrom(opts.seed);
  const out = [];
  if (d.empty) out.push({ key: 'quiet', name: 'Отдых' });
  else out.push({ key: 'summary', name: 'Сводка' });
  if (opts.mode === 'one') return out;
  // карточка периода: ритм недели, календарь месяца, весь путь
  if (d.kind === 'week' && d.days.length === 7 && !d.empty) out.push({ key: 'week', name: 'Ритм недели' });
  if (d.kind === 'month' && d.days.length) out.push({ key: 'month', name: 'Календарь' });
  if (d.kind === 'range' && d.days.length > 1 && d.days.length <= 42) out.push({ key: 'month', name: 'Календарь' });
  if (d.kind === 'all' && d.dayN > 0) out.push({ key: 'journey', name: 'Путь' });
  // темы: до четырёх картинок, по высоте (комментарии занимают место); на первой место занимают закрытые блоки
  const sq = opts.format === 'square', rowH = sq ? 104 : 128, avail = sq ? 3 * 120 : 6 * 144;
  const mg = document.createElement('canvas').getContext('2d');
  const cost = (t) => { const n = noteOf(d, t); return rowH + 16 + (n ? bubbleNote(mg, STYLES.terminal, '#888888', 1, 136, 864, 0, n, sq ? 30 : 34, true) + 4 : 0); };
  let i = 0;
  for (let page = 0; page < 4 && i < d.themes.length; page++) {
    let room = avail - (page === 0 ? Math.min(d.blocks.length, sq ? 1 : 2) * (rowH + 18) : 0);
    const from = i;
    while (i < d.themes.length) { const c = cost(d.themes[i]); if (c > room && i > from) break; room -= c; i++; }
    out.push({ key: 'themes', name: 'Темы', from, count: i - from });
  }
  if (!d.themes.length && d.blocks.length) out.push({ key: 'themes', name: 'Темы', from: 0, count: 0 });
  const last = out.filter((x) => x.key === 'themes').pop();
  if (last && i < d.themes.length) last.more = d.themes.length - i;
  // доп. карточки: включённые — всегда, авто — случайное число случайных
  const ok = EXTRA_CARDS.map(([k]) => k).filter((k) => extraOk[k](d));
  const on = ok.filter((k) => opts.toggles[k] === 'on');
  const auto = ok.filter((k) => (opts.toggles[k] || 'auto') === 'auto');
  const n = auto.length ? Math.floor(rng() * (auto.length + 1)) : 0;
  const chosen = [...auto].sort(() => rng() - 0.5).slice(0, n);
  for (const [k, name] of EXTRA_CARDS) if (on.includes(k) || chosen.includes(k)) out.push({ key: k, name });
  if (d.anki) out.push({ key: 'anki', name: 'Anki' }); // итоги Anki, если загружены
  out.push({ key: 'ach', name: 'Достижения' });
  return out;
}

// рисует одну карточку; style — ключ, layout — номер раскладки
export async function drawCard(card, d, { format, style, acc, seed, index, total, full, dayX = true }) {
  if (!LOGO.complete) await LOGO.decode().catch(() => {});
  const [W, H] = FORMATS[format];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  if (card.key === 'custom') { if (card.card.kind) await drawList(g, W, H, card.card, acc, card.page || 0); else await drawCustom(g, W, H, card.card, acc); return cv; }
  const S = STYLES[style];
  const rng = rngFrom(seed * 31 + index * 7 + 1);
  const c = { S, acc, d, rng, layout: Math.floor(rng() * 3), full, dayX };
  if (card.key === 'anki') { await cardAnki(g, W, H, c, index + 1, total); return cv; } // своя рамка
  frame(g, W, H, S, acc, d, index + 1, total);
  const sq = H === W;
  if (card.key === 'summary') await cardSummary(g, W, H, c);
  else if (card.key === 'quiet') await cardQuiet(g, W, H, c);
  else if (card.key === 'themes') await cardThemes(g, W, H, c, d.themes.slice(card.from, card.from + card.count), card.from === 0, card.more || 0);
  else if (card.key === 'ach') await cardAch(g, W, H, c, d.achievements.slice(0, sq ? 2 : 5));
  else await draws[card.key](g, W, H, c);
  return cv;
}
