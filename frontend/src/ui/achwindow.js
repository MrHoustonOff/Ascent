// Окно нового достижения вместо уведомления. У каждого достижения свой задник: тема — по группе
// (серия — огонь, темы — лучи, этапы — горы…), узор, цвета и раскладка — по ID, поэтому двух одинаковых нет.
// Несколько достижений сразу — очередь: «1 из 3», «Дальше». Enter/пробел — дальше, Esc — закрыть все.
import { h, clear } from './dom.js';
import { achBadge } from './achicons.js';
import { gopherSVG, POSES } from './gopher.js';
import { go } from '../actions.js';
import { badgeImage } from './recap-draw.js';

const queue = [];
let open = null;

export function showAchievements(list, { replay = false } = {}) {
  for (const a of list || []) if (!queue.some((x) => x.id === a.id)) queue.push({ ...a, replay });
  if (!open && queue.length) next();
}

const GROUP = { themes: 'Темы', day: 'За один день', week: 'За неделю', month: 'За месяц', streak: 'Серия', blocks: 'Блоки', stages: 'Этапы', tracks: 'Треки', topic: 'Тематическое', special: 'Особое' };
const POSE = { themes: ['cheer', 'proud', 'wave'], day: ['jump', 'dance'], week: ['dance', 'cheer'], month: ['proud', 'cheer'], streak: ['run', 'jump'], blocks: ['proud', 'point'], stages: ['cheer', 'jump'], tracks: ['think', 'proud'], topic: ['proud', 'wave', 'derp', 'dance'], special: ['derp', 'wave', 'sit', 'dance'] };

let shown = 0;
// карточка окна: фон, лента группы, значок с бликом, тёмная стеклянная карточка (название, описание, дата), гофер
function buildCard(a, { foot } = {}) {
  const rng = rngOf(a.id);
  const pose = pickR(rng, POSE[a.group] || ['cheer']);
  const bg = h('canvas', { class: 'as-achwin__bg', 'aria-hidden': 'true' });
  const card = h('div', { class: 'as-achwin', role: 'dialog', 'aria-modal': 'true', 'aria-label': (a.replay ? '' : 'Новое достижение: ') + a.name },
    bg,
    foot ? h('div', { class: 'as-achwin__burst', 'aria-hidden': 'true' }, confetti(rng)) : null,
    h('div', { class: 'as-achwin__body' },
      h('div', { class: 'as-achwin__kicker' }, a.replay ? (GROUP[a.group] || 'Достижение') : 'Новое · ' + (GROUP[a.group] || 'достижение')),
      h('div', { class: 'as-achwin__badge' }, achBadge({ ...a, unlocked: true }, 168)),
      h('div', { class: 'as-achwin__glass' },
        h('h2', { class: 'as-achwin__name' }, a.name),
        h('p', { class: 'as-achwin__desc' }, a.desc),
        a.when ? h('div', { class: 'as-achwin__when' }, 'Открыто ' + a.when) : null)),
    h('div', { class: 'as-achwin__gopher', html: gopherSVG({ ...(POSES[pose] || POSES.cheer).opts, width: 132 }) }),
    foot || null);
  return { card, bg, pose };
}

function next() {
  const a = queue.shift();
  if (!a) { close(); return; }
  shown++;
  const total = shown + queue.length;
  const foot = h('div', { class: 'as-achwin__foot' },
    h('div', { class: 'as-achwin__btns' },
      a.replay ? null : h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => { queue.length = 0; close(); go('#/achievements'); } }, 'Все достижения'),
      h('button', { class: 'as-btn as-btn--primary', autofocus: true, onclick: next }, queue.length ? 'Дальше' : 'Отлично')));
  const { card, bg } = buildCard(a, { foot });
  if (total > 1) card.append(h('span', { class: 'as-achwin__count' }, `${shown} из ${total}`));
  if (!open) {
    const scrim = h('div', { class: 'as-scrim as-achwin__scrim' });
    (document.querySelector('.as-window') || document.body).append(scrim);
    window.addEventListener('keydown', onKey, true);
    open = { scrim };
  }
  clear(open.scrim);
  open.scrim.append(card);
  requestAnimationFrame(() => {
    const r = card.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    bg.width = Math.round(r.width * dpr); bg.height = Math.round(r.height * dpr);
    drawBackdrop(bg.getContext('2d'), bg.width, bg.height, a, rngOf(a.id));
    card.querySelector('.as-btn--primary')?.focus();
  });
}

// ---------- картинка окна для экспорта ----------
// Окно собирается вне экрана, с него снимается раскладка, и всё рисуется на холсте в k раз крупнее:
// фон, рамка, лента, значок с бликом, стеклянная карточка, гофер. Без кнопки, конфетти и счётчика.
export async function achCardPNG(a, k = 3) {
  const { card } = buildCard({ ...a, replay: true });
  card.classList.add('is-static');
  Object.assign(card.style, { width: '440px', height: '600px' });
  const holder = h('div', { style: { position: 'fixed', left: '-10000px', top: '0', width: '440px', height: '600px' } }, card);
  (document.querySelector('.as-window') || document.body).append(holder);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (document.fonts) await document.fonts.ready;
  const R = card.getBoundingClientRect();
  const rel = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: (r.left - R.left) * k, y: (r.top - R.top) * k, w: r.width * k, h: r.height * k }; };
  const q = (s) => card.querySelector(s);
  const L = { kick: rel(q('.as-achwin__kicker')), badge: rel(q('.as-achwin__badge')), glass: rel(q('.as-achwin__glass')), name: rel(q('.as-achwin__name')), desc: rel(q('.as-achwin__desc')), when: rel(q('.as-achwin__when')), gopher: rel(q('.as-achwin__gopher svg')) };
  const family = getComputedStyle(q('.as-achwin__name')).fontFamily;
  // строки — как их перенёс браузер в окне: слова группируются по вертикали
  const domLines = (el) => {
    const out = []; if (!el) return out;
    const tn = [...el.childNodes].find((n) => n.nodeType === 3); if (!tn) return out;
    const re = /\S+/g; let m, top = null;
    while ((m = re.exec(tn.data))) {
      const r = document.createRange(); r.setStart(tn, m.index); r.setEnd(tn, m.index + m[0].length);
      const t = Math.round(r.getBoundingClientRect().top);
      if (top === null || Math.abs(t - top) > 4) { out.push(m[0]); top = t; } else out[out.length - 1] += ' ' + m[0];
    }
    return out;
  };
  const nameLines = domLines(q('.as-achwin__name')), descLines = domLines(q('.as-achwin__desc'));
  const theme = document.querySelector('[data-theme]')?.getAttribute('data-theme') || 'dark';
  const kickText = q('.as-achwin__kicker').textContent.toUpperCase(), whenText = q('.as-achwin__when')?.textContent.toUpperCase() || '';
  const gsvg = q('.as-achwin__gopher svg').outerHTML;
  holder.remove();

  const W = 440 * k, H = 600 * k;
  const bgc = document.createElement('canvas'); bgc.width = W; bgc.height = H;
  drawBackdrop(bgc.getContext('2d'), W, H, a, rngOf(a.id));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const rr = (x, y, w, hh, r) => { g.beginPath(); g.roundRect(x, y, w, hh, r); };
  rr(0, 0, W, H, 28 * k); g.clip();
  g.drawImage(bgc, 0, 0);
  // низ чуть темнее, как под кнопками в окне
  const fg = g.createLinearGradient(0, H - 90 * k, 0, H); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,.35)');
  g.fillStyle = fg; g.fillRect(0, H - 90 * k, W, 90 * k);
  // рамка: светлая линия, тёмная полоса, тонкая линия
  g.lineWidth = 3 * k; g.strokeStyle = 'rgba(127,212,234,.65)'; rr(1.5 * k, 1.5 * k, W - 3 * k, H - 3 * k, 27 * k); g.stroke();
  g.lineWidth = 6 * k; g.strokeStyle = 'rgba(0,0,0,.25)'; rr(6 * k, 6 * k, W - 12 * k, H - 12 * k, 23 * k); g.stroke();
  g.lineWidth = 1 * k; g.strokeStyle = 'rgba(127,212,234,.25)'; rr(9.5 * k, 9.5 * k, W - 19 * k, H - 19 * k, 19 * k); g.stroke();
  // лента группы
  const K = L.kick;
  g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18 * k; g.shadowOffsetY = 6 * k;
  const kg = g.createLinearGradient(K.x, 0, K.x + K.w, 0); kg.addColorStop(0, '#1e7f95'); kg.addColorStop(1, '#4cc9ea');
  g.fillStyle = kg; g.beginPath(); g.roundRect(K.x, K.y, K.w, K.h, [0, 0, 14 * k, 14 * k]); g.fill(); g.restore();
  g.fillStyle = '#fff'; g.font = `700 ${11.5 * k}px ${family}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  if ('letterSpacing' in g) g.letterSpacing = `${1.6 * k}px`;
  g.fillText(kickText, K.x + K.w / 2, K.y + K.h / 2 + 0.5 * k);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  // значок: свечение, сам значок, голографический блик
  const B = L.badge, img = await badgeImage(a, theme);
  g.save(); g.shadowColor = 'rgba(127,212,234,.45)'; g.shadowBlur = 26 * k;
  try { g.drawImage(img, B.x, B.y, B.w, B.h); } catch { /* без значка картинка всё равно нужна */ }
  g.restore();
  g.save(); rr(B.x, B.y, B.w, B.h, B.w * 0.3); g.clip(); g.globalCompositeOperation = 'screen';
  const hg = g.createLinearGradient(B.x, B.y, B.x + B.w, B.y + B.h * 0.55);
  hg.addColorStop(0.35, 'rgba(255,255,255,0)'); hg.addColorStop(0.48, 'rgba(255,255,255,.45)'); hg.addColorStop(0.52, 'rgba(160,240,255,.25)'); hg.addColorStop(0.65, 'rgba(255,255,255,0)');
  g.fillStyle = hg; g.fillRect(B.x, B.y, B.w, B.h); g.restore();
  // гофер — под стеклянной карточкой, как в окне
  const gi = new Image(); gi.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(gsvg.includes('xmlns=') ? gsvg : gsvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
  await gi.decode().catch(() => {});
  try { g.drawImage(gi, L.gopher.x, L.gopher.y + 44 * k, L.gopher.w, L.gopher.h); } catch { /* без гофера */ } // кнопки нет — гофер ниже, на её место
  // стеклянная карточка: размытый фон + тёмная заливка
  const G = L.glass;
  g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 30 * k; g.shadowOffsetY = 10 * k; g.fillStyle = 'rgba(8,14,20,.01)'; rr(G.x, G.y, G.w, G.h, 20 * k); g.fill(); g.restore();
  g.save(); rr(G.x, G.y, G.w, G.h, 20 * k); g.clip();
  g.filter = `blur(${10 * k}px) saturate(1.2)`; g.drawImage(bgc, 0, 0); g.filter = 'none';
  g.fillStyle = 'rgba(8,14,20,.62)'; g.fillRect(G.x, G.y, G.w, G.h); g.restore();
  g.lineWidth = 1 * k; g.strokeStyle = 'rgba(255,255,255,.14)'; rr(G.x + 0.5 * k, G.y + 0.5 * k, G.w - k, G.h - k, 20 * k); g.stroke();
  // текст по ширине своих блоков
  const cx = G.x + G.w / 2;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  const nf = `850 ${32 * k}px ${family}`, nl = nameLines.length ? nameLines : [a.name];
  g.font = nf; nl.forEach((t, i) => g.fillText(t, cx, L.name.y + (i + 0.5) * 38 * k));
  const df = `500 ${15.5 * k}px ${family}`, dl = descLines.length ? descLines : [a.desc];
  g.globalAlpha = 0.95; g.font = df; dl.forEach((t, i) => g.fillText(t, cx, L.desc.y + (i + 0.5) * 22 * k));
  if (L.when) {
    g.globalAlpha = 1; g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(L.when.x, L.when.y, L.when.w, 1 * k);
    g.globalAlpha = 0.75; g.fillStyle = '#fff'; g.font = `600 ${12 * k}px ${family}`;
    if ('letterSpacing' in g) g.letterSpacing = `${0.72 * k}px`;
    g.fillText(whenText, cx, L.when.y + 4 * k + 4 * k + 8 * k);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }
  g.globalAlpha = 1;
  return cv.toDataURL('image/png');
}

function close() {
  if (!open) return;
  window.removeEventListener('keydown', onKey, true);
  open.scrim.remove(); open = null; shown = 0;
}
function onKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); queue.length = 0; close(); return; }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); next(); return; }
  if (e.key !== 'Tab') e.stopImmediatePropagation();
}

// ---------- случайность по ID ----------
function rngOf(id) {
  let s = 2166136261;
  for (const ch of String(id)) s = Math.imul(s ^ ch.codePointAt(0), 16777619);
  let a = s >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pickR = (r, arr) => arr[Math.floor(r() * arr.length)];
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

function confetti(rng) {
  const cols = ['#F2A65A', '#E2558F', '#7FD4EA', '#F5C542', '#A78BFA', '#4FD08F'];
  return Array.from({ length: 34 }, (_, i) => h('i', { style: {
    '--x': `${Math.round((rng() - 0.5) * 520)}px`, '--y': `${Math.round(-120 - rng() * 320)}px`, '--r': `${Math.round(rng() * 720 - 360)}deg`,
    '--d': `${(0.9 + rng() * 0.9).toFixed(2)}s`, '--w': `${6 + Math.round(rng() * 6)}px`, background: cols[i % cols.length],
    left: `${40 + rng() * 20}%`,
  } }));
}

// ---------- задники ----------
// Все тёмные и насыщенные: белый текст читается на любом. Оттенок и узор — от ID.
function drawBackdrop(g, W, H, a, rng) {
  const u = W / 440;
  const jit = (base, d = 14) => base + (rng() - 0.5) * 2 * d;
  const grad = (stops, x1 = 0, y1 = 0, x2 = 0, y2 = H) => { const gr = g.createLinearGradient(x1, y1, x2, y2); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const glow = (x, y, r, c) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const cx = W / 2, cy = H * 0.36;
  switch (a.group) {
    case 'themes': { // лучи из-за значка
      const hue = jit(190);
      g.fillStyle = grad([[0, hsl(hue, 60, 22)], [1, hsl(hue + 20, 55, 9)]]); g.fillRect(0, 0, W, H);
      const n = 10 + Math.floor(rng() * 14), rot = rng() * Math.PI;
      g.fillStyle = hsl(hue - 10, 80, 70, 0.09);
      for (let i = 0; i < n; i++) { const a0 = rot + i * 2 * Math.PI / n, w = Math.PI / n * (0.4 + rng() * 0.4); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, H * 1.2, a0, a0 + w); g.closePath(); g.fill(); }
      glow(cx, cy, W * 0.5, hsl(hue - 20, 90, 65, 0.35));
      break;
    }
    case 'streak': { // огонь и искры
      const hue = jit(18, 10);
      g.fillStyle = grad([[0, hsl(hue + 10, 70, 12)], [0.6, hsl(hue, 80, 22)], [1, hsl(hue - 8, 90, 40)]]); g.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) { g.fillStyle = hsl(hue + 15 + i * 6, 95, 55, 0.18); g.beginPath(); const x0 = rng() * W; g.moveTo(x0 - 120 * u, H); g.quadraticCurveTo(x0 + (rng() - 0.5) * 80 * u, H - (180 + rng() * 220) * u, x0 + 120 * u, H); g.fill(); }
      for (let i = 0; i < 60; i++) { g.fillStyle = hsl(jit(40, 15), 100, 65, 0.3 + rng() * 0.6); g.beginPath(); g.arc(rng() * W, rng() * H, (0.8 + rng() * 2.4) * u, 0, 7); g.fill(); }
      glow(cx, cy, W * 0.45, hsl(40, 100, 65, 0.3));
      break;
    }
    case 'day': case 'week': case 'month': { // волны / молнии / сетка дней
      const hue = jit(a.group === 'day' ? 265 : a.group === 'week' ? 215 : 240);
      g.fillStyle = grad([[0, hsl(hue, 55, 20)], [1, hsl(hue + 25, 60, 8)]]); g.fillRect(0, 0, W, H);
      g.lineWidth = 2.2 * u;
      if (a.group === 'week') for (let k = 0; k < 9; k++) { g.strokeStyle = hsl(hue - 20 + k * 6, 85, 70, 0.10 + k * 0.012); g.beginPath(); const y0 = H * (0.3 + k * 0.08), amp = (14 + rng() * 22) * u, f = 0.012 + rng() * 0.01; for (let x = 0; x <= W; x += 6) g.lineTo(x, y0 + Math.sin(x * f / u + k) * amp); g.stroke(); }
      else if (a.group === 'day') for (let k = 0; k < 7; k++) { g.strokeStyle = hsl(50, 100, 70, 0.12 + rng() * 0.15); g.beginPath(); let x = rng() * W, y = 0; g.moveTo(x, y); while (y < H) { x += (rng() - 0.5) * 70 * u; y += (30 + rng() * 40) * u; g.lineTo(x, y); } g.stroke(); }
      else { const s = 34 * u; for (let y = s; y < H; y += s) for (let x = s * 0.7; x < W; x += s) { g.fillStyle = hsl(hue - 30, 90, 75, rng() < 0.25 ? 0.4 : 0.08); g.beginPath(); g.roundRect ? g.roundRect(x - 9 * u, y - 9 * u, 18 * u, 18 * u, 4 * u) : g.rect(x - 9 * u, y - 9 * u, 18 * u, 18 * u); g.fill(); } }
      glow(cx, cy, W * 0.5, hsl(hue - 30, 90, 70, 0.3));
      break;
    }
    case 'blocks': { // плитки, несколько горят
      const hue = jit(160);
      g.fillStyle = grad([[0, hsl(hue, 40, 16)], [1, hsl(hue + 30, 45, 7)]]); g.fillRect(0, 0, W, H);
      const s = (38 + rng() * 14) * u, gap = 6 * u;
      for (let y = -s / 2; y < H; y += s + gap) for (let x = -s / 3; x < W; x += s + gap) { const lit = rng() < 0.12; g.fillStyle = lit ? hsl(hue, 80, 55, 0.55) : hsl(hue, 50, 60, 0.07); g.beginPath(); g.rect(x, y, s, s); g.fill(); }
      glow(cx, cy, W * 0.5, hsl(hue, 90, 60, 0.35));
      break;
    }
    case 'stages': { // ночные горы со звёздами
      const hue = jit(225, 20);
      g.fillStyle = grad([[0, hsl(hue, 55, 12)], [0.7, hsl(hue + 30, 50, 26)], [1, hsl(hue + 60, 60, 40)]]); g.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + rng() * 0.7})`; g.beginPath(); g.arc(rng() * W, rng() * H * 0.6, (0.5 + rng() * 1.4) * u, 0, 7); g.fill(); }
      for (let l = 0; l < 3; l++) { g.fillStyle = hsl(hue + 10, 40, 10 + l * 5, 0.9); g.beginPath(); g.moveTo(0, H); let x = 0; while (x <= W) { g.lineTo(x, H * (0.62 + l * 0.1) - rng() * 120 * u); x += (50 + rng() * 60) * u; } g.lineTo(W, H); g.fill(); }
      glow(cx, cy, W * 0.45, hsl(45, 100, 70, 0.25));
      break;
    }
    case 'tracks': { // схема: дорожки с узлами
      const hue = jit(pickR(rng, [190, 150, 210, 270, 330, 30]), 10);
      g.fillStyle = grad([[0, hsl(hue, 45, 14)], [1, hsl(hue, 50, 6)]]); g.fillRect(0, 0, W, H);
      g.lineWidth = 2 * u; g.strokeStyle = hsl(hue, 90, 65, 0.22); g.fillStyle = hsl(hue, 90, 70, 0.5);
      for (let k = 0; k < 16; k++) { let x = Math.round(rng() * 12) * W / 12, y = Math.round(rng() * 16) * H / 16; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 4; s++) { if (rng() < 0.5) x += (rng() < 0.5 ? -1 : 1) * W / 12 * (1 + Math.floor(rng() * 3)); else y += (rng() < 0.5 ? -1 : 1) * H / 16 * (1 + Math.floor(rng() * 3)); g.lineTo(x, y); } g.stroke(); g.beginPath(); g.arc(x, y, 3.5 * u, 0, 7); g.fill(); }
      glow(cx, cy, W * 0.5, hsl(hue, 90, 60, 0.32));
      break;
    }
    case 'topic': { // свой узор и водяной знак блока
      const hue = Math.floor(rng() * 360);
      g.fillStyle = grad([[0, hsl(hue, 50, 18)], [1, hsl(hue + 40, 55, 8)]], 0, 0, W, H); g.fillRect(0, 0, W, H);
      const kind = Math.floor(rng() * 5), s = (26 + rng() * 18) * u; g.strokeStyle = g.fillStyle = hsl(hue + 30, 80, 72, 0.10); g.lineWidth = 2 * u;
      for (let y = 0; y < H + s; y += s) for (let x = 0; x < W + s; x += s) {
        const ox = (Math.floor(y / s) % 2) * s / 2;
        g.beginPath();
        if (kind === 0) g.arc(x + ox, y, 3 * u, 0, 7), g.fill();
        else if (kind === 1) g.moveTo(x, y), g.lineTo(x + s, y + s), g.stroke();
        else if (kind === 2) { for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3; g.lineTo(x + ox + Math.cos(t) * s * 0.4, y + Math.sin(t) * s * 0.4); } g.closePath(); g.stroke(); }
        else if (kind === 3) g.moveTo(x + ox, y - s * 0.3), g.lineTo(x + ox + s * 0.3, y + s * 0.25), g.lineTo(x + ox - s * 0.3, y + s * 0.25), g.closePath(), g.stroke();
        else g.moveTo(x + ox - 5 * u, y), g.lineTo(x + ox + 5 * u, y), g.moveTo(x + ox, y - 5 * u), g.lineTo(x + ox, y + 5 * u), g.stroke();
      }
      g.save(); g.translate(W * 0.5, H * 0.86); g.rotate(-0.08); g.fillStyle = hsl(hue + 30, 80, 80, 0.07); g.font = `900 ${110 * u}px ui-monospace, Consolas, monospace`; g.textAlign = 'center'; g.fillText(a.mark || a.sub || a.id, 0, 0); g.restore();
      glow(cx, cy, W * 0.5, hsl(hue + 20, 90, 65, 0.32));
      break;
    }
    default: { // особые: по иконке — ночь, рассвет или северное сияние
      const icon = a.icon;
      if (icon === 'sunrise' || icon === 'sun') { g.fillStyle = grad([[0, hsl(230, 50, 20)], [0.55, hsl(330, 60, 40)], [1, hsl(35, 95, 60)]]); g.fillRect(0, 0, W, H); glow(cx, H * 0.85, W * 0.7, hsl(45, 100, 70, 0.6)); }
      else if (icon === 'moon') { g.fillStyle = grad([[0, hsl(235, 55, 10)], [1, hsl(255, 50, 22)]]); g.fillRect(0, 0, W, H); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + rng() * 0.7})`; g.beginPath(); g.arc(rng() * W, rng() * H, (0.5 + rng() * 1.5) * u, 0, 7); g.fill(); } glow(W * 0.8, H * 0.15, W * 0.35, 'rgba(255,240,200,0.35)'); }
      else { const hue = jit(160, 40); g.fillStyle = grad([[0, hsl(240, 50, 10)], [1, hsl(260, 40, 16)]]); g.fillRect(0, 0, W, H); for (let k = 0; k < 4; k++) { g.strokeStyle = hsl(hue + k * 25, 90, 60, 0.18); g.lineWidth = (30 + rng() * 40) * u; g.beginPath(); const y0 = H * (0.15 + k * 0.12); g.moveTo(-50, y0); g.bezierCurveTo(W * 0.3, y0 - 80 * u, W * 0.6, y0 + 90 * u, W + 50, y0 - 20 * u); g.stroke(); } }
      glow(cx, cy, W * 0.45, 'rgba(255,255,255,0.12)');
    }
  }
  // мягкое затемнение снизу — под текстом
  g.fillStyle = grad([[0.45, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.45)']]); g.fillRect(0, 0, W, H);
}
