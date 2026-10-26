// Окно нового достижения вместо уведомления. У каждого достижения свой задник: тема — по группе
// (серия — огонь, темы — лучи, этапы — горы…), узор, цвета и раскладка — по ID, поэтому двух одинаковых нет.
// Несколько достижений сразу — очередь: «1 из 3», «Дальше». Enter/пробел — дальше, Esc — закрыть все.
import { h, clear } from './dom.js';
import { achBadge } from './achicons.js';
import { gopherSVG, POSES } from './gopher.js';
import { go } from '../actions.js';

const queue = [];
let open = null;

export function showAchievements(list, { replay = false } = {}) {
  for (const a of list || []) if (!queue.some((x) => x.id === a.id)) queue.push({ ...a, replay });
  if (!open && queue.length) next();
}

const GROUP = { themes: 'Темы', day: 'За один день', week: 'За неделю', month: 'За месяц', streak: 'Серия', blocks: 'Блоки', stages: 'Этапы', tracks: 'Треки', topic: 'Тематическое', special: 'Особое' };
const POSE = { themes: ['cheer', 'proud', 'wave'], day: ['jump', 'dance'], week: ['dance', 'cheer'], month: ['proud', 'cheer'], streak: ['run', 'jump'], blocks: ['proud', 'point'], stages: ['cheer', 'jump'], tracks: ['think', 'proud'], topic: ['proud', 'wave', 'derp', 'dance'], special: ['derp', 'wave', 'sit', 'dance'] };

let shown = 0;
function next() {
  const a = queue.shift();
  if (!a) { close(); return; }
  shown++;
  const total = shown + queue.length;
  const rng = rngOf(a.id);
  const bg = h('canvas', { class: 'as-achwin__bg', 'aria-hidden': 'true' });
  const pose = pickR(rng, POSE[a.group] || ['cheer']);
  const card = h('div', { class: 'as-achwin', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Новое достижение: ' + a.name },
    bg,
    h('div', { class: 'as-achwin__burst', 'aria-hidden': 'true' }, confetti(rng)),
    h('div', { class: 'as-achwin__body' },
      h('div', { class: 'as-achwin__kicker' }, a.replay ? (GROUP[a.group] || 'Достижение') : 'Новое достижение · ' + (GROUP[a.group] || '')),
      h('div', { class: 'as-achwin__badge' }, achBadge({ ...a, unlocked: true }, 168)),
      h('h2', { class: 'as-achwin__name' }, a.name),
      h('p', { class: 'as-achwin__desc' }, a.desc),
      a.when ? h('div', { class: 'as-achwin__when' }, 'Открыто ' + a.when) : null),
    h('div', { class: 'as-achwin__gopher', html: gopherSVG({ ...(POSES[pose] || POSES.cheer).opts, width: 132 }) }),
    total > 1 ? h('span', { class: 'as-achwin__count' }, `${shown} из ${total}`) : null,
    h('div', { class: 'as-achwin__foot' },
      h('div', { class: 'as-achwin__btns' },
        a.replay ? null : h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => { queue.length = 0; close(); go('#/achievements'); } }, 'Все достижения'),
        h('button', { class: 'as-btn as-btn--primary', autofocus: true, onclick: next }, queue.length ? 'Дальше' : 'Отлично'))));
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
