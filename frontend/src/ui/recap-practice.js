// Итоги практики: разбор JSON команды /практика (сегодня, неделя, период) и карточка «Практика» («Секундомер»).
// Режимы: full — всё (вид, название, факт, полоса «факт / бюджет», начало–сдача, итог «уложился ли»),
// short — только название, вид и факт. Много практик — несколько страниц; гофер — только в 9:16.
// Модуль ничего не берёт из recap-draw: стиль, акцент и рисование гофера приходят параметрами (без цикла импортов).
import { pluralRu } from './dom.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/, DT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
// parsePractice(text) → { ok: true, data } | { ok: false, error }
export function parsePractice(text) {
  let j;
  try { j = JSON.parse(String(text).trim()); } catch { return { ok: false, error: 'Это не JSON — проверьте, что вставлен ответ /практика целиком.' }; }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { ok: false, error: 'Ожидается объект с полями range, practices, total.' };
  const r = j.range || {};
  for (const k of ['from', 'to']) if (typeof r[k] !== 'string' || !DATE.test(r[k])) return { ok: false, error: `Поле range.${k}: нужна дата ГГГГ-ММ-ДД.` };
  if (r.from > r.to) return { ok: false, error: 'range.from позже range.to.' };
  if (!Array.isArray(j.practices)) return { ok: false, error: 'Поле practices: нужен массив (пустой, если практик не было).' };
  const list = [];
  for (const [i, p] of j.practices.entries()) {
    const at = `practices[${i}]`;
    if (!p || typeof p !== 'object') return { ok: false, error: `${at}: ожидается объект практики.` };
    if (typeof p.title !== 'string' || !p.title.trim()) return { ok: false, error: `${at}.title: нужно название.` };
    if (typeof p.kind !== 'string' || !p.kind.trim()) return { ok: false, error: `${at}.kind: нужен вид практики.` };
    for (const k of ['planned_min', 'duration_min']) if (typeof p[k] !== 'number' || !(p[k] >= 0)) return { ok: false, error: `${at}.${k}: нужно число ≥ 0.` };
    for (const k of ['started_at', 'finished_at']) if (typeof p[k] !== 'string' || !DT.test(p[k])) return { ok: false, error: `${at}.${k}: нужно время ГГГГ-ММ-ДДTЧЧ:ММ.` };
    list.push({ title: p.title.trim(), kind: p.kind.trim(), planned_min: Math.round(p.planned_min), duration_min: Math.round(p.duration_min), started_at: p.started_at, finished_at: p.finished_at });
  }
  list.sort((a, b) => (a.started_at < b.started_at ? -1 : a.started_at > b.started_at ? 1 : 0));
  // итог пересчитываем из списка: так карточка всегда сходится с перечнем
  const total = { count: list.length, duration_min: list.reduce((s, p) => s + p.duration_min, 0), planned_min: list.reduce((s, p) => s + p.planned_min, 0) };
  return { ok: true, data: { range: { from: r.from, to: r.to }, practices: list, total } };
}

// ---------- подписи ----------
const MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const WDS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const todayISO = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const dayOf = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export function practiceInfo(p) {
  const f = dayOf(p.range.from), t = dayOf(p.range.to), days = Math.round((t - f) / 864e5) + 1;
  const gen = (x) => `${x.getDate()} ${MON[x.getMonth()]}`;
  const dm = (x) => `${x.getDate()}.${String(x.getMonth() + 1).padStart(2, '0')}`;
  return {
    days,
    kicker: days === 1 ? (p.range.from === todayISO() ? 'ПРАКТИКА · СЕГОДНЯ' : 'ПРАКТИКА · ЗА ДЕНЬ') : days === 7 ? 'ПРАКТИКА · ЗА НЕДЕЛЮ' : 'ПРАКТИКА · ЗА ПЕРИОД',
    period: days === 1 ? `${WD[f.getDay()]}, ${gen(f)}` : `${gen(f)} — ${gen(t)}`,
    short: days === 1 ? dm(f) : `${dm(f)}–${dm(t)}`,
  };
}
export const hm = (m) => (m < 60 ? `${m} мин` : `${Math.floor(m / 60)} ч${m % 60 ? ` ${String(m % 60).padStart(2, '0')} мин` : ''}`);
export function kindLabel(k) { // «5min» → «5 мин», «1h» → «1 час»; незнакомый вид — как есть
  const m = String(k).match(/^(\d+)\s*min$/i), hh = String(k).match(/^(\d+)\s*h$/i);
  if (m) return `${m[1]} мин`;
  if (hh) return +hh[1] === 1 ? '1 час' : `${hh[1]} ч`;
  return String(k);
}
const clock = (dt) => dt.slice(11, 16);
function when(p, many) { // «15:52–16:11», через полночь — «23:50–00:20 +1», в периоде — с днём недели
  const s = p.started_at, f = p.finished_at, d = dayOf(s.slice(0, 10));
  const span = `${clock(s)}–${clock(f)}${s.slice(0, 10) === f.slice(0, 10) ? '' : ' +1'}`;
  return many ? `${WDS[d.getDay()]} ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} · ${span}` : span;
}
function verdict(t) { // итог по бюджету
  const dlt = t.duration_min - t.planned_min;
  return dlt <= 0 ? { ok: true, text: dlt === 0 ? 'ровно в бюджет' : `на ${hm(-dlt)} быстрее плана` } : { ok: false, text: `на ${hm(dlt)} дольше плана` };
}

// ---------- раскладка и страницы ----------
// Все размеры — в единицах карточки шириной 1080. rowMin — минимальная высота строки, rows растягиваются до rowMax.
const GAP = 18;
function geo(H, mode, first) {
  const sq = H === 1080;
  const top = first ? (sq ? (mode === 'full' ? 430 : 402) : (mode === 'full' ? 640 : 610)) : (sq ? 250 : 290);
  const bottom = sq ? 130 : 420; // снизу подпись, в 9:16 ещё и гофер
  const rowMin = mode === 'full' ? 150 : sq ? 116 : 124, rowMax = mode === 'full' ? 200 : 160;
  const cap = Math.max(1, Math.floor((H - bottom - top + GAP) / (rowMin + GAP)));
  return { sq, top, bottom, rowMin, rowMax, cap };
}
// на сколько страниц делится список: первая — с итогом, следующие — только строки
export function practicePages(P, mode, format) {
  const H = format === 'square' ? 1080 : 1920, n = P.practices.length;
  const c1 = geo(H, mode, true).cap, cN = geo(H, mode, false).cap;
  return n <= c1 ? 1 : 1 + Math.ceil((n - c1) / cN);
}
function slice(P, mode, H, page) {
  const c1 = geo(H, mode, true).cap, cN = geo(H, mode, false).cap;
  return page === 0 ? P.practices.slice(0, c1) : P.practices.slice(c1 + (page - 1) * cN, c1 + page * cN);
}

// ---------- рисование ----------
const MONO = 'ui-monospace, "Cascadia Code", Consolas, monospace';
const LOGO = new Image(); LOGO.src = new URL('../ds/logo.svg', import.meta.url).href;
const hexA = (hex, a) => { const n = parseInt(hex.replace('#', ''), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const onAcc = (hex) => { const n = parseInt(hex.replace('#', ''), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? '#141414' : '#FFFFFF'; };
function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fit(g, text, font, size, maxW, min = 16) { let px = size; g.font = font(px); while (px > min && g.measureText(text).width > maxW) { px -= 2; g.font = font(px); } return px; }
function ellipsis(g, text, maxW) { if (g.measureText(text).width <= maxW) return text; let t = text; while (t.length > 3 && g.measureText(t + '…').width > maxW) t = t.slice(0, -1); return t.trimEnd() + '…'; }
// цвет вида — по бюджету; не зелёный и не оранжевый: ими показано «в бюджет / дольше плана». Незнакомый вид — серый
const KIND_COL = { 5: '#4CC9F0', 10: '#B794F4', 15: '#FF8FA3', 30: '#FFD166', 60: '#F7B267' };
const kindColor = (p) => KIND_COL[p.planned_min] || '#ADB5BD';
const OK = '#3DBE7A', OVER = '#F08C3C';

function frame(g, W, H, S, acc, info, d, page, total) {
  const u = W / 1080;
  S.bg(g, W, H, acc);
  if (LOGO.complete && LOGO.naturalWidth) g.drawImage(LOGO, 80 * u, 80 * u, 56 * u, 56 * u);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.fillStyle = S.ink; g.font = `700 ${32 * u}px ${S.font}`; g.fillText('Ascent', 154 * u, 108 * u);
  g.fillStyle = S.muted; g.font = `400 ${24 * u}px ${S.font}`; g.fillText(info.period, 154 * u, 138 * u);
  if (total > 1) { g.textAlign = 'right'; g.font = `500 ${26 * u}px ${S.font}`; g.fillText(`${page} / ${total}`, W - 80 * u, 118 * u); g.textAlign = 'left'; }
  g.font = `500 ${26 * u}px ${S.font}`; g.fillStyle = S.muted; g.fillText(d.nick || 'Go — ROADMAP', 80 * u, H - 70 * u);
  g.textAlign = 'right'; g.fillText('данные практики', W - 80 * u, H - 70 * u); g.textAlign = 'left';
}
function kickerChip(g, S, acc, u, x, y, text) {
  g.font = `700 ${28 * u}px ${S.font}`; const w = g.measureText(text).width + 60 * u;
  g.fillStyle = hexA(acc, 0.18); rr(g, x, y, w, 54 * u, 27 * u); g.fill();
  g.fillStyle = acc; g.beginPath(); g.arc(x + 26 * u, y + 27 * u, 7 * u, 0, Math.PI * 2); g.fill();
  g.fillText(text, x + 44 * u, y + 37 * u);
  return w;
}
// кольцо «факт / план»: акцент до 100 %, сверх плана — оранжевый второй круг (не больше полного)
function ring(g, S, acc, u, cx, cy, R, frac) {
  g.lineCap = 'round'; g.lineWidth = R * 0.2;
  g.strokeStyle = S.track; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  if (frac > 0) { g.strokeStyle = acc; g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac)); g.stroke(); }
  if (frac > 1) { g.strokeStyle = OVER; g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac - 1)); g.stroke(); }
  g.textAlign = 'center'; g.fillStyle = S.ink; fit(g, `${Math.round(frac * 100)}%`, (p) => `800 ${p}px ${S.head}`, R * 0.5, R * 1.4, 20); g.fillText(`${Math.round(frac * 100)}%`, cx, cy + R * 0.1);
  g.fillStyle = S.muted; g.font = `500 ${R * 0.19}px ${S.font}`; g.fillText('от плана', cx, cy + R * 0.4); g.textAlign = 'left';
}
function row(g, S, u, x, y, w, rowH, p, mode, many) {
  const col = kindColor(p);
  g.fillStyle = S.card; rr(g, x, y, w, rowH, 28 * u); g.fill();
  g.fillStyle = col; rr(g, x, y, 12 * u, rowH, 6 * u); g.fill();
  // вид
  g.font = `800 ${24 * u}px ${S.font}`; const kl = kindLabel(p.kind);
  const klFit = ellipsis(g, kl, w * 0.45), kw = g.measureText(klFit).width + 30 * u, ky = y + 26 * u;
  g.fillStyle = col; rr(g, x + 36 * u, ky, kw, 42 * u, 21 * u); g.fill();
  g.fillStyle = onAcc(col); g.fillText(klFit, x + 51 * u, ky + 30 * u);
  // факт справа
  g.textAlign = 'right'; g.fillStyle = S.ink; g.font = `800 ${46 * u}px ${S.head}`; g.fillText(hm(p.duration_min), x + w - 30 * u, y + 62 * u); g.textAlign = 'left';
  // название: сперва чуть мельче, потом многоточие
  const ty = mode === 'full' ? y + rowH * 0.62 : y + rowH * 0.74, tmax = w - 66 * u;
  g.fillStyle = S.ink; fit(g, p.title, (px) => `700 ${px}px ${S.font}`, 32 * u, tmax, 26 * u);
  g.fillText(ellipsis(g, p.title, tmax), x + 36 * u, ty);
  if (mode !== 'full') return;
  // полоса: факт против бюджета, риска — бюджет
  const meta = `${when(p, many)} · план ${p.planned_min}`;
  g.font = `500 ${24 * u}px ${MONO}`; const mw = g.measureText(meta).width;
  const bx = x + 36 * u, by = y + rowH * 0.78, bw = Math.max(120 * u, w - 66 * u - mw - 40 * u), bh = 12 * u, scale = Math.max(p.planned_min, p.duration_min) || 1;
  g.fillStyle = S.track; rr(g, bx, by, bw, bh, 6 * u); g.fill();
  if (p.duration_min > 0) { g.fillStyle = p.duration_min <= p.planned_min ? OK : OVER; rr(g, bx, by, Math.max(bh, bw * p.duration_min / scale), bh, 6 * u); g.fill(); }
  if (p.planned_min > 0) { g.fillStyle = S.ink; g.fillRect(bx + bw * p.planned_min / scale - 1.5 * u, by - 8 * u, 3 * u, bh + 16 * u); }
  g.fillStyle = S.muted; g.textAlign = 'right'; g.fillText(meta, x + w - 30 * u, by + 12 * u); g.textAlign = 'left';
}

// карточка «Практика»: c = { S, acc, d, gopher(pose, cx, bottom, h, rot) }, page — страница списка с 0
export async function cardPractice(g, W, H, c, P, mode, page, pageNo, total) {
  const { S, acc, d } = c, u = W / 1080, t = P.total, info = practiceInfo(P), sq = H === W;
  if (!LOGO.complete) await LOGO.decode().catch(() => {});
  frame(g, W, H, S, acc, info, d, pageNo, total);
  const first = page === 0, Gm = geo(H / u, mode, first), x = 80 * u, w = W - 160 * u;
  kickerChip(g, S, acc, u, 80 * u, (sq ? 170 : 200) * u, first ? info.kicker : info.kicker + ' · ПРОДОЛЖЕНИЕ');
  const frac = t.planned_min ? t.duration_min / t.planned_min : 0;
  if (first) {
    if (!t.count) { // практик не было
      g.fillStyle = S.ink; g.font = `800 ${(sq ? 96 : 130) * u}px ${S.head}`; g.fillText('0 мин', 74 * u, (sq ? 380 : 470) * u);
      g.font = `700 ${(sq ? 38 : 44) * u}px ${S.font}`; g.fillText(info.days === 1 ? 'сегодня без практики' : 'практик не было', 80 * u, (sq ? 450 : 550) * u);
      g.fillStyle = S.muted; g.font = `500 ${30 * u}px ${S.font}`; g.fillText('отдых — тоже часть плана', 80 * u, (sq ? 505 : 610) * u);
      if (c.gopher) await c.gopher('sleep', W / 2, H - (sq ? 150 : 260) * u, (sq ? 320 : 520) * u, 0);
      return;
    }
    const R = (sq ? 88 : 130) * u, cx = W - 80 * u - R - 20 * u, cy = (sq ? 288 : 430) * u;
    ring(g, S, acc, u, cx, cy, R, frac);
    const heroY = (sq ? 305 : 440) * u;
    g.fillStyle = S.ink; fit(g, hm(t.duration_min), (p) => `800 ${p}px ${S.head}`, (sq ? 100 : 150) * u, cx - R - 40 * u - 74 * u, 60 * u); g.fillText(hm(t.duration_min), 74 * u, heroY);
    g.font = `700 ${(sq ? 34 : 44) * u}px ${S.font}`; g.fillText(`${t.count} ${pluralRu(t.count, 'практика', 'практики', 'практик')}`, 80 * u, heroY + (sq ? 50 : 70) * u);
    if (mode === 'full') {
      const v = verdict(t), line = `план ${hm(t.planned_min)} · ${v.text}`;
      g.fillStyle = v.ok ? OK : OVER; fit(g, line, (p) => `700 ${p}px ${S.font}`, 30 * u, cx - R - 40 * u - 80 * u, 20 * u); g.fillText(line, 80 * u, heroY + (sq ? 92 : 120) * u);
    }
  }
  // строки этой страницы
  const list = slice(P, mode, H / u, page), many = info.days > 1;
  const avail = H - Gm.bottom * u - Gm.top * u;
  const rowH = Math.min(Gm.rowMax * u, Math.max(Gm.rowMin * u, (avail - GAP * u * (list.length - 1)) / Math.max(1, list.length)));
  let y = Gm.top * u;
  for (const p of list) { row(g, S, u, x, y, w, rowH, p, mode, many); y += rowH + GAP * u; }
  if (!sq && c.gopher) {
    const last = page === practicePages(P, mode, 'story') - 1;
    await c.gopher(!last || frac > 1 ? 'run' : 'proud', W - 190 * u, H - 120 * u, 230 * u, -0.04);
  }
}
