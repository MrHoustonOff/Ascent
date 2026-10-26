// Рисование карточек итогов на canvas: 4 стиля × 2 формата, гофер с позой по итогам.
// Случайность — через rng с зерном: одно открытие окна даёт одну и ту же раскладку при любых переключениях.
import { gopherSVG, POSES } from './gopher.js';
import { pluralRu } from './dom.js';
import { achBadge } from './achicons.js';

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
async function cardSummary(g, W, H, c) {
  const { S, acc, d, rng } = c; const u = W / 1080, sq = H === W;
  const n = d.themes.length;
  const pose = poseFor('summary', d, rng);
  const lay = sq ? (c.layout % 2) : c.layout % 3;
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
    const gx = lay ? 270 * u : W - 270 * u, tx = lay ? W - 80 * u : 80 * u, al = lay ? 'right' : 'left';
    kicker(tx, 250 * u, al); big(tx, 520 * u, 250, al);
    await drawGopher(g, pose, gx, 700 * u, 430 * u, 0, lay === 0);
    tiles(760 * u, 170 * u);
    return;
  }
  if (lay === 0) {
    kicker(80 * u, 280 * u); big(64 * u, 590 * u, 300);
    tiles(800 * u);
    const lw = W; W_LOWER.w = W - 420 * u; lower(1060 * u, 360 * u); W_LOWER.w = 0; void lw;
    await drawGopher(g, pose, W - 210 * u, H - 120 * u, 450 * u, -0.06);
  } else if (lay === 1) {
    await drawGopher(g, pose, W / 2, 760 * u, 500 * u);
    kicker(W / 2, 860 * u, 'center'); big(W / 2, 1090 * u, 230, 'center');
    tiles(1280 * u, 170 * u); lower(1500 * u, 260 * u);
  } else {
    kicker(80 * u, 280 * u); big(64 * u, 600 * u, 320);
    await drawGopher(g, pose, W - 250 * u, 760 * u, 520 * u, 0.05, true);
    tiles(860 * u); lower(1130 * u, 380 * u);
  }
}

async function cardQuiet(g, W, H, c) { // пустой день: без хвастовства
  const { S, d, rng } = c; const u = W / 1080, sq = H === W;
  if (S !== STYLES.terminal) { g.fillStyle = hexA(S.ink, 0.5); for (let i = 0; i < 26; i++) blob(g, (i * 397) % W, ((i * 211) % (H * 0.45)) + 180 * u, (1 + (i % 3)) * 1.6 * u); }
  g.fillStyle = S.ink; g.font = `800 ${(sq ? 64 : 76) * u}px ${S.head}`;
  const lines = d.kind === 'day' ? ['День отдыха —', 'тоже часть пути'] : ['Тихий период —', 'тоже часть пути'];
  lines.forEach((l, i) => g.fillText(l, 80 * u, (sq ? 300 : 420) * u + i * 92 * u));
  g.fillStyle = S.muted; g.font = `400 ${32 * u}px ${S.font}`;
  g.fillText(d.streak ? `Серия ${d.streak} ${W_(d.streak, 'день', 'дня', 'дней')} цела · завтра продолжим` : 'Завтра продолжим', 80 * u, (sq ? 470 : 640) * u);
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
  const when = { 'вчера': 'вчера', 'прошлая неделя': 'за прошлую неделю', 'прошлый месяц': 'за прошлый месяц' }[d.prevLabel] || d.prevLabel;
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

// ---------- своя карточка (редактор) ----------
// card = { bg: ключ стиля, items: [{ type: 'text', text, x, y, size, rot, color } | { type: 'gopher', pose, x, y, size, rot, flip }] }
// x, y — доли ширины/высоты (центр элемента), size — px при ширине 1080
export async function drawCustom(g, W, H, card, acc) {
  const S = STYLES[card.bg] || STYLES.night;
  S.bg(g, W, H, acc || S.accents[0]);
  const u = W / 1080;
  for (const it of card.items) {
    if (it.type === 'gopher') { await drawGopher(g, it.pose, it.x * W, it.y * H + it.size * u / 2, it.size * u, it.rot || 0, !!it.flip); continue; }
    g.save(); g.translate(it.x * W, it.y * H); g.rotate(it.rot || 0);
    g.fillStyle = it.color === 'accent' ? (acc || S.accents[0]) : it.color === 'muted' ? S.muted : S.ink;
    g.font = `${it.weight || 800} ${it.size * u}px ${it.font === 'body' ? S.font : S.head}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = String(it.text).split('\n');
    lines.forEach((l, i) => g.fillText(l, 0, (i - (lines.length - 1) / 2) * it.size * u * 1.12));
    g.restore();
  }
}
// размеры элемента для выделения в редакторе (в px холста, без поворота)
export function itemBox(g, W, H, it) {
  const u = W / 1080;
  if (it.type === 'gopher') return { w: it.size * u * 0.86, h: it.size * u * 1.02 };
  g.font = `${it.weight || 800} ${it.size * u}px ${FONT}`;
  const lines = String(it.text).split('\n');
  return { w: Math.max(...lines.map((l) => g.measureText(l).width)) + 20 * u, h: lines.length * it.size * u * 1.12 + 10 * u };
}

// авто-режим: из текста — заголовок, подзаголовок, гофер в свободном углу
export function autoCard(text, rng) {
  const lines = String(text).split('\n').map((x) => x.trim()).filter(Boolean);
  const bg = pick(rng, STYLE_KEYS);
  const head = lines[0] || 'Ascent';
  const rest = lines.slice(1).join('\n');
  const size = Math.max(64, Math.min(150, Math.round(1500 / Math.max(6, head.length))));
  const top = rng() < 0.5;
  const items = [{ type: 'text', text: wrapByChars(head, Math.max(8, Math.round(1700 / size))), x: 0.5, y: top ? 0.24 : 0.5, size, rot: 0, color: 'ink' }];
  if (rest) items.push({ type: 'text', text: wrapByChars(rest, 28), x: 0.5, y: top ? 0.38 : 0.64, size: 44, rot: 0, color: 'accent', weight: 600, font: 'body' });
  const pose = pick(rng, ['cheer', 'wave', 'proud', 'dance', 'point', 'jump', 'derp', 'think']);
  items.push({ type: 'gopher', pose, x: top ? 0.5 : (rng() < 0.5 ? 0.24 : 0.76), y: top ? 0.7 : 0.84, size: top ? 640 : 380, rot: 0, flip: rng() < 0.5 });
  return { bg, items };
}
function wrapByChars(s, n) {
  return s.split('\n').map((line) => {
    const out = []; let cur = '';
    for (const w of line.split(/\s+/)) { if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
    if (cur) out.push(cur);
    return out.join('\n');
  }).join('\n');
}

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
const draws = { heat: cardHeat, tracks: cardTracks, compare: cardCompare, mountain: cardMountain, forecast: cardForecast };

// plan: какие карточки рисовать. opts = { mode, toggles, seed }
export function planCards(d, opts) {
  const rng = rngFrom(opts.seed);
  const out = [];
  if (d.empty) out.push({ key: 'quiet', name: 'Отдых' });
  else out.push({ key: 'summary', name: 'Сводка' });
  if (opts.mode === 'one') return out;
  // темы: до трёх картинок; на первой место занимают закрытые блоки
  const per = opts.format === 'square' ? 3 : 6, sq = opts.format === 'square';
  let i = 0;
  for (let page = 0; page < 3 && i < d.themes.length; page++) {
    const cap = page === 0 ? Math.max(1, per - Math.min(d.blocks.length, sq ? 1 : 2)) : per;
    out.push({ key: 'themes', name: 'Темы', from: i, count: cap });
    i += cap;
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
  out.push({ key: 'ach', name: 'Достижения' });
  return out;
}

// рисует одну карточку; style — ключ, layout — номер раскладки
export async function drawCard(card, d, { format, style, acc, seed, index, total, full }) {
  if (!LOGO.complete) await LOGO.decode().catch(() => {});
  const [W, H] = FORMATS[format];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  if (card.key === 'custom') { await drawCustom(g, W, H, card.card, acc); return cv; }
  const S = STYLES[style];
  const rng = rngFrom(seed * 31 + index * 7 + 1);
  const c = { S, acc, d, rng, layout: Math.floor(rng() * 3), full };
  frame(g, W, H, S, acc, d, index + 1, total);
  const sq = H === W;
  if (card.key === 'summary') await cardSummary(g, W, H, c);
  else if (card.key === 'quiet') await cardQuiet(g, W, H, c);
  else if (card.key === 'themes') await cardThemes(g, W, H, c, d.themes.slice(card.from, card.from + card.count), card.from === 0, card.more || 0);
  else if (card.key === 'ach') await cardAch(g, W, H, c, d.achievements.slice(0, sq ? 2 : 5));
  else await draws[card.key](g, W, H, c);
  return cv;
}
