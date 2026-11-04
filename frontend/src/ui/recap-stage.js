// Карточки «Этап закрыт» (свой мир и костюм гофера на каждый из 7 этапов) и картина «Нашёл работу!».
// Сцена собирается одной SVG (фон + иллюстрация), растрируется и подписывается на canvas.
import { gopherSVG } from './gopher.js';
import { pluralRu } from './dom.js';

const FONT = '-apple-system, "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif';
const MONO = 'ui-monospace, "Cascadia Code", Consolas, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';
const SVGF = 'font-family="Segoe UI, system-ui, sans-serif"';
const SVGM = 'font-family="Cascadia Code, Consolas, monospace"';
const L = '#2E2622'; // контур гофера
const HERO = '<!--hero-->'; // граница слоёв сцены: фон | гофер (для «масла» их пишут по-разному)

// ---------- помощники ----------
function rngFrom(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
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
// гофер внутри сцены: x, y — левый верх рамки 200×240, w — ширина
function gopherAt(opts, x, y, w) {
  return gopherSVG({ ...opts, width: w }).replace('<svg ', `<svg x="${x}" y="${y}" height="${w * 1.2}" `);
}
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function wrapText(g, text, maxW) {
  const words = String(text).split(/\s+/); const out = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur);
  return out;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const stars = (rng, n, W, H, fill, rmax = 2.2) => Array.from({ length: n }, () => `<circle cx="${(rng() * W).toFixed(0)}" cy="${(rng() * H).toFixed(0)}" r="${(0.6 + rng() * rmax).toFixed(1)}" fill="${fill}" opacity="${(0.3 + rng() * 0.7).toFixed(2)}"/>`).join('');

// ---------- костюмы гофера (координаты гофера: 200×240, макушка ≈ y 14, глаза y 39…105) ----------
const COSTUME = {
  1: { // первоклашка: шапка с пропеллером, рюкзак, книжка «Go»
    opts: { arms: 'hold', eyes: 'happy', look: 0.2 },
    item: `<rect x="58" y="138" width="84" height="56" rx="5" fill="#3A86FF" stroke="${L}" stroke-width="2.4"/><rect x="62" y="142" width="76" height="48" rx="3" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>` +
      `<text x="100" y="176" text-anchor="middle" font-size="26" font-weight="800" fill="#fff" ${SVGF}>Go</text>`,
    back: `<g stroke="${L}" stroke-width="2.2"><rect x="18" y="104" width="30" height="86" rx="12" fill="#E76F51"/><rect x="152" y="104" width="30" height="86" rx="12" fill="#E76F51"/></g>`,
    extra: `<path d="M58 118 L64 196 M142 118 L136 196" stroke="#9C4A2F" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M50 38 Q52 -2 100 -2 Q148 -2 150 38 Z" fill="#E63946" stroke="${L}" stroke-width="2.4"/>` +
      `<path d="M100 -2 Q84 10 82 37 L118 37 Q116 10 100 -2Z" fill="#FFD166" stroke="${L}" stroke-width="1.8"/>` +
      `<path d="M47 33 Q100 20 153 33 L153 42 Q100 29 47 42Z" fill="#457B9D" stroke="${L}" stroke-width="2.2"/>` +
      `<path d="M100 -2 V-16" stroke="${L}" stroke-width="3"/><circle cx="100" cy="-2" r="4" fill="#FFD166" stroke="${L}" stroke-width="2"/>` +
      `<ellipse cx="82" cy="-18" rx="18" ry="5" fill="#2A9D8F" stroke="${L}" stroke-width="2" transform="rotate(-8 82 -18)"/><ellipse cx="118" cy="-18" rx="18" ry="5" fill="#F4A261" stroke="${L}" stroke-width="2" transform="rotate(8 118 -18)"/><circle cx="100" cy="-17" r="3.5" fill="${L}"/>`,
  },
  2: { // архивариус: козырёк и очки, стопка коробок
    opts: { arms: 'hold', eyes: 'open', look: 0.35 },
    item: ['[]byte', 'map[k]v', 'struct{}'].map((t, i) => `<g transform="translate(${60 + (i % 2) * 6} ${172 - i * 27})"><rect width="${82 - (i % 2) * 6}" height="25" rx="3" fill="${['#E9C46A', '#F4A261', '#E76F51'][i]}" stroke="${L}" stroke-width="2.2"/><text x="${(82 - (i % 2) * 6) / 2}" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="#2B1B10" ${SVGM}>${esc(t)}</text></g>`).join(''),
    extra: `<g fill="none" stroke="#C9A227" stroke-width="4"><circle cx="67" cy="72" r="35"/><circle cx="133" cy="72" r="35"/><path d="M96 58 Q100 52 104 58"/><path d="M32 66 L22 60 M168 66 L178 60"/></g>` +
      `<path d="M44 44 Q100 18 156 44 L162 30 Q100 2 38 30Z" fill="#2A9D8F" fill-opacity=".85" stroke="${L}" stroke-width="2.2"/><path d="M40 30 Q100 4 160 30" stroke="#1D3557" stroke-width="5" fill="none"/>` +
      `<path d="M154 26 L178 6" stroke="#F4A261" stroke-width="7" stroke-linecap="round"/><path d="M178 6 L184 0" stroke="${L}" stroke-width="7" stroke-linecap="round"/>`,
  },
  3: { // жонглёр горутинами: бабочка, три светящихся шара
    opts: { arms: 'up', eyes: 'happy', lift: 10, look: 0 },
    extra: `<path d="M100 132 L78 120 L78 144Z M100 132 L122 120 L122 144Z" fill="#FF5CA8" stroke="${L}" stroke-width="2.2"/><circle cx="100" cy="132" r="6" fill="#C2185B" stroke="${L}" stroke-width="2"/>` +
      `<path d="M40 -6 Q100 -110 160 -6" stroke="#5CE1E6" stroke-width="3" stroke-dasharray="6 7" fill="none" opacity=".8"/>` +
      [[34, -10, '#5CE1E6'], [100, -84, '#FFD166'], [166, -10, '#FF5CA8']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="24" fill="${c}" opacity=".25"/><circle cx="${x}" cy="${y}" r="14" fill="${c}" stroke="${L}" stroke-width="2.2"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13" font-weight="800" fill="#1B1035" ${SVGM}>go</text>`).join(''),
  },
  4: { // почтальон сети: фуражка, сумка, конверт
    opts: { arms: 'hold', eyes: 'happy', look: 0.4 },
    back: `<rect x="2" y="160" width="52" height="42" rx="6" fill="#A0522D" stroke="${L}" stroke-width="2.2"/><path d="M2 166 L28 186 L54 166" fill="#8B4513" stroke="${L}" stroke-width="2"/><rect x="12" y="150" width="30" height="16" fill="#fff" stroke="${L}" stroke-width="1.6" transform="rotate(-10 27 158)"/>`,
    item: `<rect x="62" y="140" width="76" height="48" rx="3" fill="#FFFDF5" stroke="${L}" stroke-width="2.2"/><path d="M62 140 L100 168 L138 140" fill="none" stroke="${L}" stroke-width="2"/><circle cx="100" cy="166" r="8" fill="#E63946" stroke="${L}" stroke-width="1.6"/><text x="100" y="185" text-anchor="middle" font-size="8.5" font-weight="700" fill="#555" ${SVGM}>200 OK</text>`,
    extra: `<path d="M150 112 L56 200" stroke="#8D5524" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M48 36 Q50 -2 100 -4 Q150 -2 152 36Z" fill="#1D3557" stroke="${L}" stroke-width="2.4"/><path d="M46 32 Q100 22 154 32 L154 40 Q100 30 46 40Z" fill="#14213D" stroke="${L}" stroke-width="2"/>` +
      `<path d="M58 38 Q100 58 142 38 Q100 46 58 38Z" fill="#0B132B" stroke="${L}" stroke-width="2"/><rect x="89" y="8" width="22" height="15" rx="2" fill="#FFD166" stroke="${L}" stroke-width="1.6"/><path d="M89 8 L100 17 L111 8" fill="none" stroke="${L}" stroke-width="1.4"/>`,
  },
  5: { // строитель: каска, жилет, гаечный ключ
    opts: { arms: 'hold', eyes: 'open', look: 0.3 },
    item: `<g transform="rotate(-28 100 162)"><rect x="92" y="122" width="16" height="74" rx="6" fill="#ADB5BD" stroke="${L}" stroke-width="2.2"/><path d="M84 104 a22 22 0 1 0 32 0 l-8 14 h-16z" fill="#CED4DA" stroke="${L}" stroke-width="2.2"/></g>`,
    extra: `<path d="M44 112 L74 118 L78 204 L50 198 Q40 160 44 112Z" fill="#FF7A00" stroke="${L}" stroke-width="2"/><path d="M156 112 L126 118 L122 204 L150 198 Q160 160 156 112Z" fill="#FF7A00" stroke="${L}" stroke-width="2"/>` +
      `<path d="M46 156 L76 160 M47 176 L77 180 M154 156 L124 160 M153 176 L123 180" stroke="#EDEDED" stroke-width="6"/>` +
      `<path d="M46 38 Q46 -2 100 -2 Q154 -2 154 38Z" fill="#FFC300" stroke="${L}" stroke-width="2.4"/><path d="M100 -2 V36 M76 4 Q70 18 70 36 M124 4 Q130 18 130 36" stroke="#E0A800" stroke-width="4" fill="none"/>` +
      `<ellipse cx="100" cy="38" rx="64" ry="9" fill="#FFB000" stroke="${L}" stroke-width="2.2"/>`,
  },
  6: { // дежурный инженер: гарнитура, кружка on-call
    opts: { arms: 'hold', eyes: 'open', look: -0.3 },
    item: `<rect x="76" y="138" width="46" height="50" rx="7" fill="#F8F9FA" stroke="${L}" stroke-width="2.2"/><path d="M122 148 q16 0 16 14 q0 14 -16 14" fill="none" stroke="${L}" stroke-width="5"/><path d="M122 148 q16 0 16 14 q0 14 -16 14" fill="none" stroke="#F8F9FA" stroke-width="2"/>` +
      `<text x="99" y="160" text-anchor="middle" font-size="9" font-weight="800" fill="#39D98A" ${SVGM}>on</text><text x="99" y="172" text-anchor="middle" font-size="9" font-weight="800" fill="#39D98A" ${SVGM}>call</text>` +
      `<path d="M88 132 q4 -10 0 -18 M100 132 q4 -10 0 -18 M112 132 q4 -10 0 -18" stroke="#ADB5BD" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>`,
    extra: `<path d="M30 64 Q30 2 100 2 Q170 2 170 64" stroke="#212529" stroke-width="8" fill="none"/><rect x="18" y="48" width="22" height="36" rx="8" fill="#343A40" stroke="${L}" stroke-width="2"/><rect x="160" y="48" width="22" height="36" rx="8" fill="#343A40" stroke="${L}" stroke-width="2"/>` +
      `<path d="M30 82 Q36 122 76 120" stroke="#212529" stroke-width="4.5" fill="none"/><circle cx="78" cy="120" r="6" fill="#39D98A" stroke="${L}" stroke-width="1.8"/>`,
  },
  7: { // альпинист на вершине: шапка с помпоном, шарф
    opts: { arms: 'hips', eyes: 'happy', squash: 1.03 },
    extra: `<path d="M36 120 Q100 146 164 120 L166 136 Q100 162 34 136Z" fill="#457B9D" stroke="${L}" stroke-width="2.2"/><path d="M60 128 L58 144 M86 134 L85 151 M114 134 L115 151 M140 128 L142 144" stroke="#F1FAEE" stroke-width="4"/>` +
      `<path d="M128 138 L150 200 L132 204 L114 142Z" fill="#457B9D" stroke="${L}" stroke-width="2.2"/><path d="M134 192 L150 188 M131 182 L146 177" stroke="#F1FAEE" stroke-width="4"/>` +
      `<path d="M50 36 Q52 -4 100 -4 Q148 -4 150 36Z" fill="#D62828" stroke="${L}" stroke-width="2.4"/><path d="M70 0 L66 34 M85 -3 L84 34 M100 -4 V34 M115 -3 L116 34 M130 0 L134 34" stroke="#A4161A" stroke-width="2"/>` +
      `<path d="M45 30 Q100 18 155 30 L155 44 Q100 32 45 44Z" fill="#F1FAEE" stroke="${L}" stroke-width="2.2"/><circle cx="100" cy="-12" r="14" fill="#F1FAEE" stroke="${L}" stroke-width="2.2"/>`,
  },
  job: { // в костюме, с оффером над головой
    opts: { arms: 'up', eyes: 'happy', lift: 18, squash: 1.05, feet: 'jump' },
    item: `<path d="M31 128 C33 150 33 168 34 186 C37 212 66 224 100 224 C134 224 163 212 166 186 C167 168 167 150 169 128 Q140 118 118 122 L100 176 L82 122 Q60 118 31 128Z" fill="#22223B" stroke="${L}" stroke-width="2.4"/>` +
      `<path d="M82 122 L100 176 L118 122 Q100 130 82 122Z" fill="#FFFFFF" stroke="${L}" stroke-width="1.8"/><path d="M100 128 L93 137 L100 172 L107 137Z" fill="#E63946" stroke="${L}" stroke-width="1.8"/><path d="M94 124 L106 124 L103 132 L97 132Z" fill="#B5172B"/>` +
      `<path d="M82 122 L92 152 L76 140Z M118 122 L108 152 L124 140Z" fill="#4A4E69" stroke="${L}" stroke-width="1.6"/><path d="M134 150 l16 -2 l-2 8 l-14 2z" fill="#F2CC8F" stroke="${L}" stroke-width="1.4"/>`,
    extra: `<g transform="translate(0 30) rotate(-6 100 -60)"><rect x="46" y="-104" width="108" height="76" rx="4" fill="#FFFDF5" stroke="${L}" stroke-width="2.4"/><text x="100" y="-74" text-anchor="middle" font-size="22" font-weight="900" fill="#22223B" font-family="Georgia, serif">OFFER</text>` +
      `<path d="M60 -62 H140 M60 -52 H128 M60 -42 H134" stroke="#BBB" stroke-width="3"/><circle cx="138" cy="-40" r="11" fill="#E63946" stroke="${L}" stroke-width="1.8"/><path d="M133 -40 l4 4 l7 -8" stroke="#fff" stroke-width="2.6" fill="none"/></g>`,
  },
};
function gopherDressed(key, extraOpts = {}) {
  const c = COSTUME[key];
  return { ...c.opts, item: c.item || '', extra: c.extra || '', back: c.back || '', ...extraOpts };
}
// Clawd — питомец Claude: оранжевый пиксельный зверёк с глазками-прямоугольниками
function clawd(x, y, s, { jump = 0, wave = false } = {}) {
  const o = '#E8825F', d = '#C4623F', e = '#1A1A1A';
  return `<g transform="translate(${x} ${y - jump}) scale(${s})">` +
    `<ellipse cx="60" cy="${102 + jump / s}" rx="54" ry="7" fill="#000" opacity=".18"/>` +
    `<rect x="18" y="72" width="12" height="26" fill="${d}"/><rect x="38" y="72" width="12" height="26" fill="${d}"/><rect x="70" y="72" width="12" height="26" fill="${d}"/><rect x="90" y="72" width="12" height="26" fill="${d}"/>` +
    `<rect x="6" y="14" width="108" height="64" fill="${o}"/>` +
    `<rect x="${wave ? -10 : -8}" y="${wave ? 10 : 38}" width="16" height="${wave ? 26 : 18}" fill="${o}"/><rect x="112" y="38" width="16" height="18" fill="${o}"/>` +
    `<rect x="6" y="14" width="108" height="8" fill="#E8906F"/>` +
    `<rect x="32" y="34" width="10" height="20" fill="${e}"/><rect x="78" y="34" width="10" height="20" fill="${e}"/>` +
    `<rect x="34" y="36" width="4" height="5" fill="#fff" opacity=".8"/><rect x="80" y="36" width="4" height="5" fill="#fff" opacity=".8"/></g>`;
}

// ---------- миры этапов ----------
// каждая сцена: pal (цвета текста), bg(W, H, rng) — фон на весь кадр, art(rng) — иллюстрация 1080×1100 (земля ≈ y 1000)
const STAGES = {
  1: {
    paint: true, mottoOk: true, name: 'Рассвет у подножия', motto: 'Hello, World — позади. Путь начат.',
    pal: { ink: '#2B1B17', muted: 'rgba(43,27,23,0.66)', acc: '#D62828', card: 'rgba(255,255,255,0.55)', stamp: '#D62828' },
    bg: (W, H, rng) => `<defs><linearGradient id="s1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4DC"/><stop offset=".55" stop-color="#FFD6A5"/><stop offset="1" stop-color="#FFADAD"/></linearGradient>` +
      `<radialGradient id="s1sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6C9"/><stop offset=".6" stop-color="#FFD166"/><stop offset="1" stop-color="#FFD166" stop-opacity="0"/></radialGradient></defs>` +
      `<rect width="${W}" height="${H}" fill="url(#s1)"/>` +
      `<circle cx="${W * 0.78}" cy="${H * 0.58}" r="${W * 0.34}" fill="url(#s1sun)"/>` +
      Array.from({ length: 16 }, (_, i) => `<path d="M${W * 0.78} ${H * 0.58} L${W * 0.78 + Math.cos(i / 16 * 6.283) * W} ${H * 0.58 + Math.sin(i / 16 * 6.283) * W} L${W * 0.78 + Math.cos((i + 0.4) / 16 * 6.283) * W} ${H * 0.58 + Math.sin((i + 0.4) / 16 * 6.283) * W}Z" fill="#FFFFFF" opacity=".10"/>`).join('') +
      Array.from({ length: 26 }, () => `<text x="${(rng() * W).toFixed(0)}" y="${(rng() * H * 0.5).toFixed(0)}" font-size="${(18 + rng() * 22).toFixed(0)}" fill="#C76B4A" opacity="${(0.08 + rng() * 0.12).toFixed(2)}" ${SVGM}>${['0', '1', '01', 'x := 1', '{ }', 'func', '//', 'int', '&amp;x', 'for'][Math.floor(rng() * 10)]}</text>`).join(''),
    art: (rng) => `<path d="M0 640 L180 520 L300 590 L470 400 L560 470 L700 300 L780 360 L900 230 L1080 420 V1100 H0Z" fill="#E5989B" opacity=".55"/>` +
      `<path d="M900 230 L870 270 L885 268 L900 250 L915 266 L930 262Z" fill="#fff" opacity=".9"/><path d="M900 230 V196" stroke="#6D2E46" stroke-width="3"/><path d="M900 196 L926 204 L900 212Z" fill="#D62828"/>` +
      `<path d="M0 780 Q200 700 420 760 T1080 720 V1100 H0Z" fill="#B5838D" opacity=".55"/>` +
      `<path d="M0 960 Q300 900 560 950 T1080 930 V1100 H0Z" fill="#8FB996"/><path d="M0 1010 Q360 970 700 1000 T1080 990 V1100 H0Z" fill="#6A994E"/>` +
      `<path d="M520 1100 Q560 1000 640 960 T820 800 T900 640" stroke="#FFF4DC" stroke-width="10" stroke-dasharray="2 22" stroke-linecap="round" fill="none" opacity=".9"/>` +
      // доска с первой программой (и всё ниже — чёткий слой поверх масла)
      HERO + `<g transform="translate(60 610)"><path d="M40 360 L80 0 M300 360 L260 0 M170 0 L170 380" stroke="#7F5539" stroke-width="12" stroke-linecap="round"/>` +
      `<rect x="0" y="40" width="340" height="230" rx="8" fill="#2D6A4F" stroke="#7F5539" stroke-width="12"/>` +
      `<text x="22" y="92" font-size="21" fill="#E9F5DB" ${SVGM}>package main</text><text x="22" y="128" font-size="21" fill="#E9F5DB" ${SVGM}>func main() {</text>` +
      `<text x="40" y="164" font-size="21" fill="#FFD166" ${SVGM}>fmt.Println(</text><text x="60" y="198" font-size="21" fill="#FFADAD" ${SVGM}>"Hello, World!")</text><text x="22" y="234" font-size="21" fill="#E9F5DB" ${SVGM}>}</text>` +
      `<path d="M240 250 l26 0" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>` +
      // книги
      `<g transform="translate(760 905)"><rect x="0" y="62" width="180" height="34" rx="4" fill="#3A86FF" stroke="${L}" stroke-width="3"/><rect x="14" y="30" width="160" height="34" rx="4" fill="#FFBE0B" stroke="${L}" stroke-width="3"/><rect x="4" y="0" width="150" height="32" rx="4" fill="#FB5607" stroke="${L}" stroke-width="3"/>` +
      `<text x="24" y="22" font-size="17" font-weight="800" fill="#fff" ${SVGF}>SQL</text><text x="34" y="54" font-size="17" font-weight="800" fill="#2B1B17" ${SVGF}>указатели</text><text x="20" y="86" font-size="17" font-weight="800" fill="#fff" ${SVGF}>defer · panic</text></g>` +
      `<path d="M700 520 l60 -20 l-26 30z M734 530 l-6 22 l18 -14" fill="#fff" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M640 560 q30 -40 60 -40" stroke="#fff" stroke-width="3" stroke-dasharray="6 8" fill="none"/>` +
      gopherAt(gopherDressed(1), 420, 610, 330),
  },
  2: {
    name: 'Склад памяти', motto: 'Слайсы, мапы, интерфейсы — всё по полочкам.',
    pal: { ink: '#F4FFF9', muted: 'rgba(244,255,249,0.7)', acc: '#FFC857', card: 'rgba(255,255,255,0.08)', stamp: '#FFC857' },
    bg: (W, H, rng) => `<defs><linearGradient id="s2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B2E2F"/><stop offset="1" stop-color="#145F5F"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s2)"/>` +
      Array.from({ length: Math.ceil(H / 64) }, (_, j) => Array.from({ length: 6 }, (_, i) => `<text x="${i * 190 + 20}" y="${j * 64 + 40}" font-size="17" fill="#7FD1AE" opacity="${(0.05 + rng() * 0.08).toFixed(2)}" ${SVGM}>0xc000${(0x1a0 + (j * 6 + i) * 8).toString(16)}</text>`).join('')).join(''),
    art: (rng) => {
      const box = (x, y, w, h, c, t) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="4" fill="${c}" stroke="#0B2E2F" stroke-width="3"/><path d="M0 ${h * 0.32} H${w}" stroke="#0B2E2F" stroke-opacity=".35" stroke-width="2"/><rect x="${w / 2 - 18}" y="${h * 0.32 - 6}" width="36" height="12" fill="#fff" opacity=".35"/><text x="${w / 2}" y="${h * 0.78}" text-anchor="middle" font-size="18" font-weight="700" fill="#2B1B10" ${SVGM}>${esc(t)}</text></g>`;
      const shelves = [270, 470, 670, 870];
      let s = `<rect x="40" y="200" width="1000" height="800" fill="#0E3B3C" opacity=".6"/>`;
      s += shelves.map((y) => `<rect x="40" y="${y}" width="1000" height="16" fill="#C68B59" stroke="#0B2E2F" stroke-width="3"/>`).join('');
      s += [40, 1024].map((x) => `<rect x="${x}" y="190" width="18" height="820" fill="#A47148" stroke="#0B2E2F" stroke-width="3"/>`).join('');
      const labels = ['int', 'string', '[]int', 'map', '*T', 'error', 'chan', 'struct', 'any', 'rune', 'byte', '[3]int', 'time', 'bool', 'float64', 'uint8'];
      const cols = ['#E9C46A', '#F4A261', '#E76F51', '#90BE6D', '#43AA8B', '#F9C74F', '#F8961E', '#577590'];
      let k = 0;
      for (const y of shelves) {
        let x = 80;
        while (x < 940) { const w = 110 + Math.floor(rng() * 70), h = 90 + Math.floor(rng() * 70); if (x + w > 1000) break; s += box(x, y - h, w, h, cols[k % cols.length], labels[k % labels.length]); k++; x += w + 18 + rng() * 20; }
      }
      // указатели-стрелки между коробками
      s += `<g fill="none" stroke="#FFC857" stroke-width="4" stroke-dasharray="10 8" opacity=".9"><path d="M200 200 Q420 80 640 190"/><path d="M820 420 Q980 520 860 640"/><path d="M300 600 Q520 520 700 600"/></g>` +
        `<g fill="#FFC857"><path d="M640 190 l-22 -6 l10 -16z"/><path d="M860 640 l2 -22 l16 12z"/><path d="M700 600 l-22 -2 l12 -16z"/></g>`;
      s += `<g transform="translate(860 330) rotate(8)"><rect x="0" y="0" width="16" height="700" fill="#BC8A5F" stroke="#0B2E2F" stroke-width="3"/><rect x="110" y="0" width="16" height="700" fill="#BC8A5F" stroke="#0B2E2F" stroke-width="3"/>${Array.from({ length: 9 }, (_, i) => `<rect x="10" y="${40 + i * 74}" width="106" height="12" fill="#DDA15E" stroke="#0B2E2F" stroke-width="2"/>`).join('')}</g>`;
      s += `<rect x="0" y="1000" width="1080" height="100" fill="#0B2E2F"/><path d="M0 1000 H1080" stroke="#7FD1AE" stroke-width="3" opacity=".5"/>`;
      return s + HERO + gopherAt(gopherDressed(2), 330, 640, 340);
    },
  },
  3: {
    name: 'Цирк горутин', motto: 'Тысячи горутин — и ни одной гонки.',
    pal: { ink: '#FFFFFF', muted: 'rgba(255,255,255,0.72)', acc: '#FF5CA8', card: 'rgba(255,255,255,0.09)', stamp: '#5CE1E6' },
    bg: (W, H, rng) => `<defs><radialGradient id="s3" cx=".5" cy=".2" r="1"><stop offset="0" stop-color="#3A1F78"/><stop offset=".6" stop-color="#1B1035"/><stop offset="1" stop-color="#0D0820"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#s3)"/>` +
      stars(rng, 140, W, H, '#FFFFFF', 1.8) +
      Array.from({ length: 12 }, (_, i) => `<path d="M${W / 2} -40 L${i * 100 - 60} ${H} L${i * 100 - 10} ${H}Z" fill="${i % 2 ? '#FF5CA8' : '#5CE1E6'}" opacity=".035"/>`).join(''),
    art: (rng) => {
      let s = `<path d="M260 -200 L120 1000 H960 L820 -200Z" fill="#FFF6C9" opacity=".07"/>`;
      // каналы-трубы с сообщениями
      const pipes = [[250, '#5CE1E6'], [360, '#FF5CA8'], [470, '#FFD166']];
      for (const [y, c] of pipes) {
        s += `<path d="M-20 ${y} C300 ${y - 90} 760 ${y + 90} 1100 ${y}" stroke="${c}" stroke-width="34" fill="none" opacity=".18"/><path d="M-20 ${y} C300 ${y - 90} 760 ${y + 90} 1100 ${y}" stroke="${c}" stroke-width="4" fill="none" opacity=".8"/>`;
        for (let i = 0; i < 6; i++) { const t = (i + rng() * 0.5) / 6, x = -20 + t * 1120, yy = y + Math.sin((t - 0.5) * Math.PI) * -0 + (t < 0.5 ? -60 * Math.sin(t * Math.PI * 2) : 60 * Math.sin((t - 0.5) * Math.PI * 2)); s += `<circle cx="${x.toFixed(0)}" cy="${yy.toFixed(0)}" r="11" fill="${c}"/><circle cx="${x.toFixed(0)}" cy="${yy.toFixed(0)}" r="20" fill="${c}" opacity=".25"/>`; }
      }
      s += `<g transform="translate(840 560) rotate(6)"><rect width="200" height="80" rx="12" fill="#1B1035" stroke="#5CE1E6" stroke-width="4"/><text x="100" y="52" text-anchor="middle" font-size="30" font-weight="800" fill="#5CE1E6" ${SVGM}>select {}</text></g>`;
      s += `<g transform="translate(40 580) rotate(-5)"><rect width="190" height="70" rx="12" fill="#1B1035" stroke="#FF5CA8" stroke-width="4"/><text x="95" y="46" text-anchor="middle" font-size="26" font-weight="800" fill="#FF5CA8" ${SVGM}>go func()</text></g>`;
      // арена: полосатый подиум
      s += `<ellipse cx="540" cy="1000" rx="520" ry="90" fill="#2E1A5C"/><ellipse cx="540" cy="990" rx="300" ry="50" fill="#FF5CA8" stroke="#FFD166" stroke-width="6"/>` +
        Array.from({ length: 10 }, (_, i) => `<path d="M${270 + i * 60} 1000 l30 0 l0 70 l-30 0z" fill="${i % 2 ? '#FFD166' : '#FF5CA8'}"/>`).join('') + `<rect x="240" y="990" width="600" height="80" fill="none"/>`;
      // мини-горутины бегут по кругу арены
      const run = { view: 'side', arms: [60, -70], feet: 'walk', tilt: 8 };
      s += gopherAt(run, 40, 820, 120) + gopherAt({ ...run, flip: true }, 920, 840, 110) + gopherAt(run, 150, 900, 90) + gopherAt({ ...run, flip: true }, 860, 920, 80);
      return s + HERO + gopherAt(gopherDressed(3), 380, 640, 320);
    },
  },
  4: {
    mottoOk: true, name: 'Почта интернета', motto: 'Пакет ушёл, ответ пришёл: 200 OK.',
    pal: { ink: '#F1FAFF', muted: 'rgba(241,250,255,0.72)', acc: '#FFD166', card: 'rgba(255,255,255,0.09)', stamp: '#8DE4FF' },
    bg: (W, H, rng) => `<defs><linearGradient id="s4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050B1F"/><stop offset=".6" stop-color="#0B2545"/><stop offset="1" stop-color="#13315C"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s4)"/>` +
      stars(rng, 180, W, H, '#CFF4FF', 1.6),
    art: (rng) => {
      // планета с сеткой
      let s = `<defs><radialGradient id="s4p" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#1E6091"/><stop offset="1" stop-color="#0B2545"/></radialGradient></defs>` +
        `<circle cx="540" cy="1700" r="980" fill="#8DE4FF" opacity=".12"/><circle cx="540" cy="1700" r="940" fill="url(#s4p)" stroke="#8DE4FF" stroke-width="4"/>` +
        Array.from({ length: 9 }, (_, i) => `<ellipse cx="540" cy="1700" rx="${940 - i * 0}" ry="${120 + i * 100}" fill="none" stroke="#8DE4FF" stroke-opacity=".18" stroke-width="2"/>`).join('') +
        Array.from({ length: 9 }, (_, i) => `<ellipse cx="540" cy="1700" rx="${110 + i * 105}" ry="940" fill="none" stroke="#8DE4FF" stroke-opacity=".14" stroke-width="2"/>`).join('');
      // узлы сети и пакеты
      const nodes = [[110, 420], [330, 260], [600, 200], [880, 290], [990, 520], [760, 470], [210, 600], [470, 390]];
      const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 7], [7, 1], [0, 6], [6, 7], [5, 4], [2, 7]];
      s += edges.map(([a, b]) => `<path d="M${nodes[a][0]} ${nodes[a][1]} L${nodes[b][0]} ${nodes[b][1]}" stroke="#8DE4FF" stroke-opacity=".45" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round"/>`).join('');
      s += nodes.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="26" fill="#8DE4FF" opacity=".18"/><circle cx="${x}" cy="${y}" r="13" fill="${i % 3 ? '#8DE4FF' : '#FFD166'}" stroke="#050B1F" stroke-width="3"/>`).join('');
      const env = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-26" y="-17" width="52" height="34" rx="3" fill="#FFFDF5" stroke="#050B1F" stroke-width="2.5"/><path d="M-26 -17 L0 4 L26 -17" fill="none" stroke="#050B1F" stroke-width="2.5"/></g>`;
      s += env(220, 340, -18) + env(740, 245, 12) + env(930, 410, 20) + env(400, 500, -6) + env(620, 430, 8);
      const tag = (x, y, t, c) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="${t.length * 17 + 30}" height="44" rx="22" fill="#050B1F" stroke="${c}" stroke-width="3"/><text x="${(t.length * 17 + 30) / 2}" y="30" text-anchor="middle" font-size="22" font-weight="800" fill="${c}" ${SVGM}>${esc(t)}</text></g>`;
      s += tag(60, 640, 'DNS', '#8DE4FF') + tag(820, 600, 'TLS 1.3', '#FFD166') + tag(40, 230, 'TCP', '#FFD166') + tag(820, 170, 'HTTP/2', '#8DE4FF') + tag(820, 690, 'gRPC', '#FF8FA3');
      // спутник
      s += `<g transform="translate(980 140) rotate(-20)"><rect x="-14" y="-10" width="28" height="20" fill="#ADB5BD" stroke="#050B1F" stroke-width="2"/><rect x="-60" y="-8" width="40" height="16" fill="#3A86FF" stroke="#050B1F" stroke-width="2"/><rect x="20" y="-8" width="40" height="16" fill="#3A86FF" stroke="#050B1F" stroke-width="2"/></g>`;
      // почтовый ящик
      s += `<g transform="translate(780 820)"><rect x="56" y="80" width="14" height="110" fill="#6C757D"/><path d="M0 40 Q0 0 60 0 L120 0 Q130 0 130 10 V90 H0Z" fill="#E63946" stroke="#050B1F" stroke-width="4"/><rect x="18" y="38" width="80" height="8" fill="#050B1F"/><path d="M118 10 V-30 L150 -20 L118 -10" fill="#FFD166" stroke="#050B1F" stroke-width="3"/></g>`;
      return s + HERO + gopherAt(gopherDressed(4), 360, 640, 330);
    },
  },
  5: {
    mottoOk: true, name: 'Стройка сервиса', motto: 'Слои, миграции, контейнеры, тесты — сервис стоит.',
    pal: { ink: '#1D1D1D', muted: 'rgba(29,29,29,0.66)', acc: '#E85D04', card: 'rgba(255,255,255,0.55)', stamp: '#E85D04' },
    bg: (W, H, rng) => `<defs><linearGradient id="s5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3D6"/><stop offset="1" stop-color="#F7B267"/></linearGradient>` +
      `<pattern id="s5g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0 H0 V60" fill="none" stroke="#1D3557" stroke-opacity=".07" stroke-width="2"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#s5)"/><rect width="${W}" height="${H}" fill="url(#s5g)"/>`,
    art: (rng) => {
      let s = '';
      // кран
      s += `<g stroke="#1D3557" stroke-width="5" fill="none"><path d="M880 1000 V180 M940 1000 V180 M880 180 H940"/>${Array.from({ length: 13 }, (_, i) => `<path d="M880 ${240 + i * 60} L940 ${180 + i * 60}"/>`).join('')}<path d="M300 180 H1060 M300 230 H900"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${300 + i * 60} 230 L${330 + i * 60} 180"/>`).join('')}</g>` +
        `<rect x="960" y="160" width="90" height="70" fill="#FFC300" stroke="#1D3557" stroke-width="5"/><path d="M420 230 V350" stroke="#1D3557" stroke-width="3"/><path d="M405 350 h30 q0 22 -15 22" fill="none" stroke="#1D3557" stroke-width="6"/>`;
      // контейнер на крюке
      s += `<g transform="translate(320 370)"><path d="M100 0 L20 30 M100 0 L180 30" stroke="#1D3557" stroke-width="3"/><rect x="0" y="30" width="200" height="90" fill="#2A9D8F" stroke="#1D3557" stroke-width="5"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${20 + i * 20} 38 V112" stroke="#1D3557" stroke-opacity=".35" stroke-width="3"/>`).join('')}<text x="100" y="90" text-anchor="middle" font-size="30" font-weight="900" fill="#fff" ${SVGM}>api</text></g>`;
      // здание из слоёв
      const floors = [['handler', '#E76F51'], ['service', '#F4A261'], ['repository', '#E9C46A'], ['postgres', '#457B9D']];
      floors.forEach(([t, c], i) => { const y = 520 + i * 120; s += `<rect x="60" y="${y}" width="420" height="110" fill="${c}" stroke="#1D3557" stroke-width="5"/><text x="270" y="${y + 70}" text-anchor="middle" font-size="34" font-weight="800" fill="#1D3557" ${SVGM}>${t}</text>`; });
      s += `<g stroke="#1D3557" stroke-width="4" fill="none"><path d="M30 500 V1000 M510 500 V1000 M30 640 H60 M480 640 H510 M30 760 H60 M480 760 H510 M30 880 H60 M480 880 H510"/>${Array.from({ length: 4 }, (_, i) => `<path d="M30 ${520 + i * 120} L60 ${620 + i * 120} M510 ${520 + i * 120} L480 ${620 + i * 120}"/>`).join('')}</g>`;
      // стопка контейнеров
      const cont = (x, y, c, t) => `<g transform="translate(${x} ${y})"><rect width="200" height="84" fill="${c}" stroke="#1D3557" stroke-width="5"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${20 + i * 20} 8 V76" stroke="#1D3557" stroke-opacity=".3" stroke-width="3"/>`).join('')}<text x="100" y="54" text-anchor="middle" font-size="26" font-weight="900" fill="#fff" ${SVGM}>${t}</text></g>`;
      s += cont(640, 916, '#E63946', 'db') + cont(840, 916, '#3A86FF', 'cache') + cont(740, 832, '#6A4C93', 'migrate') + cont(700, 748, '#2A9D8F', 'tests ✓');
      // земля с полосами
      s += `<rect x="0" y="1000" width="1080" height="100" fill="#1D3557"/>` + Array.from({ length: 24 }, (_, i) => `<path d="M${i * 60 - 40} 1100 L${i * 60} 1000 L${i * 60 + 30} 1000 L${i * 60 - 10} 1100Z" fill="#FFC300"/>`).join('');
      return s + HERO + gopherAt(gopherDressed(5), 470, 680, 300);
    },
  },
  6: {
    name: 'Диспетчерская', motto: 'Сообщения доставлены, метрики зелёные, пейджер молчит.',
    pal: { ink: '#E9FFF3', muted: 'rgba(233,255,243,0.66)', acc: '#39D98A', card: 'rgba(57,217,138,0.08)', stamp: '#FFB020' },
    bg: (W, H, rng) => `<rect width="${W}" height="${H}" fill="#0B0F14"/>` +
      Array.from({ length: Math.ceil(H / 34) }, (_, j) => `<text x="${W - 300}" y="${j * 34 + 30}" font-size="15" fill="#39D98A" opacity="${(0.04 + rng() * 0.07).toFixed(2)}" ${SVGM}>${['INFO consumer lag=0', 'INFO commit offset=', 'WARN retry → DLQ', 'INFO p99=41ms', 'INFO cache hit 97%', 'INFO deploy ok'][Math.floor(rng() * 6)]}${Math.floor(rng() * 9000)}</text>`).join(''),
    art: (rng) => {
      let s = '';
      const mon = (x, y, w, h, inner) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="10" fill="#111820" stroke="#2B3440" stroke-width="6"/><rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="4" fill="#0E1A14"/>${inner}</g>`;
      let line = 'M20 150'; for (let i = 1; i <= 20; i++) line += ` L${20 + i * 14} ${150 - 40 - Math.sin(i * 0.9) * 20 - rng() * 30}`;
      s += mon(40, 150, 330, 200, `<path d="${line}" stroke="#39D98A" stroke-width="4" fill="none"/><text x="24" y="44" font-size="20" fill="#39D98A" ${SVGM}>p99 · 41ms</text>`);
      s += mon(380, 130, 320, 230, Array.from({ length: 10 }, (_, i) => { const h = 30 + rng() * 120; return `<rect x="${28 + i * 27}" y="${200 - h}" width="18" height="${h}" fill="${i === 7 ? '#FFB020' : '#39D98A'}" opacity=".85"/>`; }).join('') + `<text x="24" y="44" font-size="20" fill="#39D98A" ${SVGM}>rps</text>`);
      s += mon(710, 150, 330, 200, `<path d="M70 160 A95 95 0 0 1 260 160" stroke="#2B3440" stroke-width="18" fill="none"/><path d="M70 160 A95 95 0 0 1 220 85" stroke="#39D98A" stroke-width="18" fill="none"/><path d="M165 160 L215 100" stroke="#E9FFF3" stroke-width="5"/><text x="165" y="48" text-anchor="middle" font-size="20" fill="#39D98A" ${SVGM}>lag 0</text>`);
      // лента-топик с партициями
      for (let p = 0; p < 3; p++) {
        const y = 420 + p * 96;
        s += `<rect x="0" y="${y}" width="1080" height="70" fill="#151D27" stroke="#2B3440" stroke-width="3"/><text x="16" y="${y - 10}" font-size="18" fill="#7D8B99" ${SVGM}>orders · partition ${p}</text>`;
        for (let i = 0; i < 9; i++) { const x = 130 + i * 104 + p * 30; if (x > 1040) break; s += `<rect x="${x}" y="${y + 10}" width="84" height="50" rx="6" fill="${i < 6 - p ? '#39D98A' : '#FFB020'}" opacity="${i < 6 - p ? 0.9 : 0.75}" stroke="#0B0F14" stroke-width="3"/><text x="${x + 42}" y="${y + 43}" text-anchor="middle" font-size="20" font-weight="800" fill="#0B0F14" ${SVGM}>${i + p * 3}</text>`; }
      }
      s += `<path d="M640 410 V720" stroke="#FFB020" stroke-width="4" stroke-dasharray="10 8"/><text x="652" y="720" font-size="18" fill="#FFB020" ${SVGM}>commit</text>`;
      // пульт и лампа «всё ок»
      s += `<path d="M0 860 L1080 860 L1080 1000 L0 1000Z" fill="#151D27"/><path d="M0 860 H1080" stroke="#2B3440" stroke-width="6"/>` +
        Array.from({ length: 14 }, (_, i) => `<circle cx="${60 + i * 70}" cy="${920 + (i % 2) * 30}" r="10" fill="${i % 5 === 3 ? '#FFB020' : '#39D98A'}" opacity=".85"/>`).join('') +
        `<circle cx="960" cy="800" r="46" fill="#39D98A" opacity=".2"/><circle cx="960" cy="800" r="26" fill="#39D98A" stroke="#0B0F14" stroke-width="4"/><text x="960" y="770" text-anchor="middle" font-size="16" fill="#39D98A" ${SVGM}>ALL OK</text>`;
      s += `<rect x="0" y="1000" width="1080" height="100" fill="#0B0F14"/>`;
      return s + HERO + gopherAt(gopherDressed(6), 390, 680, 310);
    },
  },
  7: {
    mottoOk: true, name: 'Вершина', motto: 'Системный дизайн разобран, проект собран. Вершина взята.',
    pal: { ink: '#FFFFFF', muted: 'rgba(255,255,255,0.78)', acc: '#FFD08A', card: 'rgba(255,255,255,0.12)', stamp: '#FFD08A' },
    bg: (W, H, rng) => `<defs><linearGradient id="s7" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B1340"/><stop offset=".45" stop-color="#6D3B7A"/><stop offset=".75" stop-color="#F28C6B"/><stop offset="1" stop-color="#FFD08A"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s7)"/>` +
      stars(rng, 90, W, H * 0.4, '#FFFFFF', 1.6) +
      // созвездие-архитектура: LB → сервисы → БД
      (() => { const p = [[140, 140], [300, 90], [300, 200], [470, 60], [470, 150], [470, 240], [640, 150]]; const e = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [5, 6]];
        return `<g opacity=".55" transform="translate(${W - 760} ${H * 0.06})">` + e.map(([a, b]) => `<path d="M${p[a][0]} ${p[a][1]} L${p[b][0]} ${p[b][1]}" stroke="#FFD08A" stroke-width="2" stroke-dasharray="3 6"/>`).join('') + p.map(([x, y], i) => `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="${i === 6 ? 10 : 3}" fill="#FFD08A"/>`).join('') + `</g>`; })(),
    art: (rng) => {
      let s = `<circle cx="540" cy="760" r="300" fill="#FFE8B0" opacity=".35"/><circle cx="540" cy="760" r="170" fill="#FFF3D6" opacity=".55"/>`;
      // море облаков
      s += Array.from({ length: 14 }, (_, i) => `<ellipse cx="${(i * 97) % 1100}" cy="${880 + (i % 3) * 40}" rx="${160 + (i % 4) * 30}" ry="${50 + (i % 3) * 12}" fill="#FFFFFF" opacity="${0.55 + (i % 3) * 0.12}"/>`).join('');
      // дальние пики с лагерями 1…6
      s += `<path d="M-40 1000 L120 760 L230 860 L360 700 L470 820 L540 520 L620 820 L760 690 L880 860 L1000 740 L1120 1000Z" fill="#5B3A6B" opacity=".55"/>`;
      // главный пик
      s += `<path d="M180 1100 L420 640 L470 690 L540 470 L600 560 L650 520 L900 1100Z" fill="#3D2C5B"/><path d="M540 470 L500 590 L530 570 L560 610 L585 560 L600 560Z" fill="#FFFFFF"/><path d="M420 640 L400 690 L430 676 L470 690Z" fill="#FFFFFF" opacity=".9"/>`;
      s += `<path d="M260 1100 Q330 960 380 900 T470 760 T540 600" stroke="#FFD08A" stroke-width="7" stroke-dasharray="3 18" stroke-linecap="round" fill="none"/>`;
      [[300, 1010], [350, 930], [400, 860], [445, 790], [490, 710], [520, 640]].forEach(([x, y], i) => { s += `<path d="M${x - 16} ${y} L${x} ${y - 24} L${x + 16} ${y}Z" fill="#E63946" stroke="#1B1340" stroke-width="2.5"/><text x="${x + 22}" y="${y - 2}" font-size="17" font-weight="800" fill="#FFF3D6" ${SVGF}>${i + 1}</text>`; });
      // флаг на вершине
      s += `<path d="M560 480 V250" stroke="#2B1B17" stroke-width="8" stroke-linecap="round"/><path d="M564 256 Q640 236 700 262 Q760 286 820 262 L820 360 Q760 384 700 360 Q640 336 564 356Z" fill="#00ADD8" stroke="#1B1340" stroke-width="4"/>` +
        `<text x="692" y="324" text-anchor="middle" font-size="40" font-weight="900" fill="#FFFFFF" ${SVGF}>7 / 7</text>`;
      return s + HERO + gopherAt(gopherDressed(7), 360, 250, 230);
    },
  },
};
export const STAGE_INFO = Object.fromEntries(Object.entries(STAGES).map(([k, v]) => [k, { name: v.name }]));

// ---------- текстовая часть карточки этапа ----------
const W_ = (n, a, b, c) => `${n} ${pluralRu(n, a, b, c)}`;
function stamp(g, x, y, s, color, text, rot = -0.12) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.font = `900 ${42 * s}px ${FONT}`; const w = g.measureText(text).width + 56 * s, h = 76 * s;
  g.strokeStyle = color; g.lineWidth = 6 * s; rr(g, -w / 2, -h / 2, w, h, 14 * s); g.stroke();
  g.lineWidth = 2.5 * s; rr(g, -w / 2 + 9 * s, -h / 2 + 9 * s, w - 18 * s, h - 18 * s, 8 * s); g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 2 * s);
  g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}

// рисует карточку «Этап закрыт»: x — RecapStageDone, d — данные итогов (ник, день X)
export async function drawStage(g, W, H, x) {
  const st = STAGES[x.num] || STAGES[1], P = st.pal, u = W / 1080, sq = H === W;
  const rng = rngFrom(x.num * 977 + 13);
  const artT = sq ? `translate(${W - 0.54 * W + 40 * u} ${H - 0.54 * 1100 * u}) scale(${0.54 * u})` : `translate(0 ${H - 1100})`;
  const [sceneArt, heroArt = ''] = st.art(rngFrom(x.num * 31 + 7)).split(HERO);
  const wrapSvg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`;
  if (st.paint) { // масло: фон крупными мазками, гофер поверх мелкими, фактура холста и лак
    const bgImg = await svgImage(wrapSvg(`${st.bg(W, H, rng)}<g transform="${artT}">${sceneArt}</g>`));
    if (bgImg) g.drawImage(bgImg, 0, 0, W, H);
    brushPass(g, 0, 0, W, H, Math.round(W * H / 45), 20 * u, 8 * u, 0.45, x.num * 7 + 1, true, 0.10);
    brushPass(g, 0, 0, W, H, Math.round(W * H / 110), 11 * u, 4 * u, 0.55, x.num * 7 + 2, true, 0.08);
    const heroImg = await svgImage(wrapSvg(`<g transform="${artT}">${heroArt}</g>`));
    if (heroImg) g.drawImage(heroImg, 0, 0, W, H);
    brushPass(g, 0, 0, W, H, Math.round(W * H / 420), 10 * u, 3 * u, 0.3, x.num * 7 + 3);
    canvasWeave(g, 0, 0, W, H, u);
    const v = g.createRadialGradient(W / 2, H * 0.45, W * 0.25, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, 'rgba(255,230,170,0)'); v.addColorStop(1, 'rgba(70,35,15,0.30)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  } else {
    const img = await svgImage(wrapSvg(`${st.bg(W, H, rng)}<g transform="${artT}">${sceneArt}${heroArt}</g>`));
    if (img) g.drawImage(img, 0, 0, W, H);
  }

  // шапка
  const pad = 80 * u;
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.fillStyle = P.ink; g.font = `800 ${30 * u}px ${FONT}`; g.fillText('Ascent', pad, 110 * u);
  g.fillStyle = P.muted; g.font = `500 ${24 * u}px ${FONT}`; g.fillText('учу Go · ' + st.name.toLowerCase(), pad + 120 * u, 110 * u);
  g.textAlign = 'right'; g.fillText(`этап ${x.num} из 7`, W - pad, 110 * u); g.textAlign = 'left';
  // полоска прогресса этапов
  const bw = (W - 2 * pad - 6 * 10 * u) / 7;
  for (let i = 0; i < 7; i++) { g.fillStyle = i < x.num ? P.acc : P.card; rr(g, pad + i * (bw + 10 * u), 136 * u, bw, 10 * u, 5 * u); g.fill(); }

  const colW = sq ? 430 * u : W - 2 * pad;
  let y = sq ? 250 * u : 300 * u;
  g.fillStyle = P.acc; g.font = `800 ${30 * u}px ${FONT}`; g.fillText(`ЭТАП ${x.num}`, pad, y);
  stamp(g, pad + (sq ? 330 : 360) * u, y - 12 * u, u * (sq ? 0.8 : 0.95), P.stamp, 'ЗАКРЫТ ✓');
  y += (sq ? 76 : 104) * u;
  const [main, sub] = String(x.title).split(/:\s*/);
  g.fillStyle = P.ink; g.font = `800 ${(sq ? 50 : 74) * u}px ${FONT}`;
  for (const ln of wrapText(g, main, colW).slice(0, 2)) { g.fillText(ln, pad, y); y += (sq ? 62 : 84) * u; }
  if (sub) { g.fillStyle = P.muted; g.font = `600 ${(sq ? 24 : 32) * u}px ${FONT}`; for (const ln of wrapText(g, sub, colW).slice(0, 2)) { g.fillText(ln, pad, y - 18 * u); y += (sq ? 30 : 40) * u; } y -= (sq ? 4 : 14) * u; }
  y += 6 * u;
  g.fillStyle = P.muted; g.font = `500 ${(sq ? 28 : 34) * u}px ${FONT}`;
  g.fillText(x.days > 1 ? `${x.from} → ${x.to}` : x.to, pad, y);
  y += (sq ? 110 : 150) * u;
  g.fillStyle = P.acc; g.font = `900 ${(sq ? 76 : 136) * u}px ${FONT}`;
  g.fillText(`за ${W_(x.days, 'день', 'дня', 'дней')}!`, pad, y);
  y += (sq ? 46 : 62) * u;
  g.fillStyle = P.muted; g.font = `500 ${(sq ? 24 : 28) * u}px ${FONT}`;
  g.fillText(x.activeDays ? `из них учебных — ${x.activeDays}` : st.motto, pad, y);
  // плашки с объёмом
  y += (sq ? 36 : 50) * u;
  const tiles = [[x.lessons, pluralRu(x.lessons, 'урок', 'урока', 'уроков')], [x.themes, pluralRu(x.themes, 'тема', 'темы', 'тем')], [x.blocks, pluralRu(x.blocks, 'блок', 'блока', 'блоков')], [x.checks, pluralRu(x.checks, 'вопрос', 'вопроса', 'вопросов')]];
  const cols = sq ? 2 : 4, gap = 16 * u, tw = (colW - gap * (cols - 1)) / cols, th = (sq ? 104 : 130) * u;
  tiles.forEach(([n, l], i) => {
    const tx = pad + (i % cols) * (tw + gap), ty = y + Math.floor(i / cols) * (th + gap);
    g.fillStyle = P.card; rr(g, tx, ty, tw, th, 22 * u); g.fill();
    g.fillStyle = P.ink; g.font = `800 ${(sq ? 44 : 52) * u}px ${FONT}`; g.fillText(String(n), tx + 22 * u, ty + th * 0.55);
    g.fillStyle = P.muted; g.font = `500 ${(sq ? 21 : 24) * u}px ${FONT}`; g.fillText(l, tx + 22 * u, ty + th * 0.82);
  });
  if (!sq && st.mottoOk) { g.fillStyle = P.muted; g.font = `italic 500 ${26 * u}px ${SERIF}`; g.fillText('«' + st.motto + '»', pad, y + th + 64 * u); }
}

// ---------- «Нашёл работу!»: картина маслом в золотой раме ----------
function jobScene(W, H, rng) {
  // небо, солнце, горы пройденного пути, город, холм, тропа
  let s = `<defs><linearGradient id="jsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F4E8C"/><stop offset=".3" stop-color="#6C5BB8"/><stop offset=".55" stop-color="#F28C7A"/><stop offset=".8" stop-color="#FFD59A"/><stop offset="1" stop-color="#FFE9C2"/></linearGradient>` +
    `<radialGradient id="jsun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFBEA"/><stop offset=".35" stop-color="#FFE29A"/><stop offset="1" stop-color="#FFB86B" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="url(#jsky)"/>`;
  const hz = H * 0.6;
  s += `<circle cx="${W * 0.5}" cy="${hz - H * 0.02}" r="${W * 0.42}" fill="url(#jsun)"/>`;
  s += Array.from({ length: 22 }, (_, i) => { const a = Math.PI + (i + 0.5) / 22 * Math.PI; return `<path d="M${W / 2} ${hz} L${W / 2 + Math.cos(a - 0.03) * W} ${hz + Math.sin(a - 0.03) * W} L${W / 2 + Math.cos(a + 0.03) * W} ${hz + Math.sin(a + 0.03) * W}Z" fill="#FFF3D0" opacity="${i % 2 ? 0.1 : 0.05}"/>`; }).join('');
  // облака-мазки
  s += Array.from({ length: 9 }, () => { const x = rng() * W, y = H * (0.08 + rng() * 0.3), w = 120 + rng() * 260; return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.16}" fill="#FFE3D3" opacity="${0.25 + rng() * 0.3}"/>`; }).join('');
  // семь пиков пройденного пути с флажками
  const peaks = [0.06, 0.2, 0.33, 0.47, 0.62, 0.76, 0.9];
  s += `<path d="M0 ${hz} ` + peaks.map((p, i) => `L${W * (p - 0.06)} ${hz - H * 0.03} L${W * p} ${hz - H * (0.08 + i * 0.022)}`).join(' ') + ` L${W} ${hz - H * 0.04} L${W} ${hz + 40} L0 ${hz + 40}Z" fill="#8E6C9E" opacity=".75"/>`;
  peaks.forEach((p, i) => { const x = W * p, y = hz - H * (0.08 + i * 0.022); s += `<path d="M${x} ${y} V${y - 46}" stroke="#3D2C5B" stroke-width="4"/><path d="M${x} ${y - 46} l30 9 l-30 9z" fill="${i === 6 ? '#00ADD8' : '#E63946'}"/><path d="M${x - 22} ${y + 26} L${x} ${y} L${x + 22} ${y + 26}Z" fill="#FFF" opacity=".75"/>`; });
  // город: офисы с огнями
  let cx = W * 0.02;
  while (cx < W) { const bw = 50 + rng() * 80, bh = H * (0.05 + rng() * 0.12); s += `<rect x="${cx}" y="${hz + 30 - bh}" width="${bw}" height="${bh + 30}" fill="#4A3F6B" opacity=".9"/>`; for (let wy = hz + 44 - bh; wy < hz + 20; wy += 20) for (let wx = cx + 8; wx < cx + bw - 10; wx += 16) if (rng() < 0.55) s += `<rect x="${wx}" y="${wy}" width="7" height="10" fill="#FFD27A" opacity="${0.6 + rng() * 0.4}"/>`; cx += bw + 6 + rng() * 14; }
  // большое здание компании с флагом-звездой
  s += `<g transform="translate(${W * 0.66} ${hz - H * 0.17})"><rect width="${W * 0.16}" height="${H * 0.2}" fill="#3B3363"/><path d="M0 0 L${W * 0.08} -${H * 0.04} L${W * 0.16} 0Z" fill="#3B3363"/>` +
    Array.from({ length: 8 }, (_, j) => Array.from({ length: 5 }, (_, i) => `<rect x="${14 + i * W * 0.028}" y="${18 + j * H * 0.022}" width="${W * 0.016}" height="${H * 0.012}" fill="#FFE29A" opacity="${0.55 + ((i + j) % 3) * 0.15}"/>`).join('')).join('') +
    `<path d="M${W * 0.08} -${H * 0.04} V-${H * 0.08}" stroke="#2B1B17" stroke-width="4"/><path d="M${W * 0.08} -${H * 0.08} l40 12 l-40 12z" fill="#FFD166"/></g>`;
  // холм и тропа
  s += `<path d="M0 ${H * 0.7} Q${W * 0.3} ${H * 0.62} ${W * 0.55} ${H * 0.68} T${W} ${H * 0.66} V${H} H0Z" fill="#7BA05B"/>`;
  s += `<path d="M0 ${H * 0.8} Q${W * 0.4} ${H * 0.72} ${W} ${H * 0.78} V${H} H0Z" fill="#5C8A3F"/>`;
  s += `<path d="M${W * 0.12} ${H} Q${W * 0.3} ${H * 0.86} ${W * 0.42} ${H * 0.8} T${W * 0.6} ${H * 0.69}" stroke="#F3D9A4" stroke-width="${W * 0.05}" fill="none" stroke-linecap="round" opacity=".9"/>`;
  // птицы
  s += Array.from({ length: 7 }, () => { const x = W * (0.1 + rng() * 0.8), y = H * (0.18 + rng() * 0.22), k = 8 + rng() * 10; return `<path d="M${x - k} ${y - k * 0.3} Q${x - k * 0.4} ${y - k * 0.6} ${x} ${y} Q${x + k * 0.4} ${y - k * 0.6} ${x + k} ${y - k * 0.3}" stroke="#3D2C5B" stroke-width="3" fill="none" stroke-linecap="round"/>`; }).join('');
  // цветы
  s += Array.from({ length: 70 }, () => { const x = rng() * W, y = H * (0.8 + rng() * 0.2); return `<circle cx="${x}" cy="${y}" r="${3 + rng() * 6}" fill="${['#FFD166', '#FF8FA3', '#FFFFFF', '#F4A261', '#CDB4DB'][Math.floor(rng() * 5)]}" opacity=".9"/>`; }).join('');
  return s;
}
function jobChars(W, H) {
  const gw = W * 0.36, gx = W * 0.26, gy = H * 0.86 - gw * 1.2 * 0.94;
  let s = `<defs><radialGradient id="jglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE8A8" stop-opacity=".75"/><stop offset="1" stop-color="#FFE8A8" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="${gx + gw / 2}" cy="${gy + gw * 0.55}" rx="${gw * 0.85}" ry="${gw * 0.95}" fill="url(#jglow)"/>`;
  s += `<ellipse cx="${gx + gw / 2}" cy="${H * 0.86}" rx="${gw * 0.36}" ry="${gw * 0.05}" fill="#2B3A1F" opacity=".35"/>`;
  s += gopherAt(gopherDressed('job'), gx, gy, gw);
  const cs = W / 520; s += clawd(W * 0.6, H * 0.86 - 100 * cs, cs, { jump: 0, wave: true });
  // хлопушка Clawd: веер лучей
  const cxp = W * 0.6 + 4 * (W / 520), cyp = H * 0.86 - 100 * (W / 520) + 14 * (W / 520);
  s += Array.from({ length: 9 }, (_, i) => { const a = -Math.PI / 2 - 0.9 + i * 0.22; return `<path d="M${cxp + Math.cos(a) * 30} ${cyp + Math.sin(a) * 30} L${cxp + Math.cos(a) * 90} ${cyp + Math.sin(a) * 90}" stroke="${['#FFD166', '#E63946', '#00ADD8'][i % 3]}" stroke-width="5" stroke-linecap="round"/>`; }).join('');
  // конфетти
  const rng = rngFrom(99);
  s += Array.from({ length: 70 }, () => { const x = rng() * W, y = rng() * H * 0.6, c = ['#E63946', '#FFD166', '#00ADD8', '#90BE6D', '#F28482', '#FFFFFF'][Math.floor(rng() * 6)]; return `<rect x="${x}" y="${y}" width="${8 + rng() * 10}" height="${4 + rng() * 6}" fill="${c}" transform="rotate(${rng() * 180} ${x} ${y})" opacity=".95"/>`; }).join('');
  return s;
}
// мазки маслом: цвет берётся из картинки под мазком, направление — по полю
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
function goldFrame(g, x, y, w, h, t, u) {
  const grd = g.createLinearGradient(x, y, x + w, y + h);
  grd.addColorStop(0, '#8C6A1F'); grd.addColorStop(0.2, '#F3D27A'); grd.addColorStop(0.4, '#B8862B'); grd.addColorStop(0.6, '#FFE7A3'); grd.addColorStop(0.8, '#A87A26'); grd.addColorStop(1, '#6E5115');
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 60 * u; g.shadowOffsetY = 30 * u;
  g.fillStyle = grd; g.fillRect(x - t, y - t, w + 2 * t, h + 2 * t);
  g.restore();
  // фаски и орнамент
  g.save();
  g.strokeStyle = 'rgba(255,240,200,0.8)'; g.lineWidth = 3 * u; g.strokeRect(x - t + 6 * u, y - t + 6 * u, w + 2 * t - 12 * u, h + 2 * t - 12 * u);
  g.strokeStyle = 'rgba(90,60,10,0.8)'; g.lineWidth = 4 * u; g.strokeRect(x - 8 * u, y - 8 * u, w + 16 * u, h + 16 * u);
  g.strokeStyle = 'rgba(255,236,170,0.9)'; g.lineWidth = 2 * u; g.strokeRect(x - 14 * u, y - 14 * u, w + 28 * u, h + 28 * u);
  g.fillStyle = 'rgba(255,245,210,0.55)';
  const bead = (bx, by) => { g.beginPath(); g.arc(bx, by, 4.5 * u, 0, Math.PI * 2); g.fill(); };
  for (let i = x - t + 26 * u; i < x + w + t - 20 * u; i += 22 * u) { bead(i, y - t + 22 * u); bead(i, y + h + t - 22 * u); }
  for (let i = y - t + 26 * u; i < y + h + t - 20 * u; i += 22 * u) { bead(x - t + 22 * u, i); bead(x + w + t - 22 * u, i); }
  // угловые розетки
  for (const [cx, cy] of [[x - t / 2, y - t / 2], [x + w + t / 2, y - t / 2], [x - t / 2, y + h + t / 2], [x + w + t / 2, y + h + t / 2]]) {
    const r = g.createRadialGradient(cx - 6 * u, cy - 6 * u, 2 * u, cx, cy, t * 0.7);
    r.addColorStop(0, '#FFF6D0'); r.addColorStop(0.5, '#D9A940'); r.addColorStop(1, '#7A5A18');
    g.fillStyle = r; g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, rr2 = (k % 2 ? 0.45 : 0.72) * t; g.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } g.closePath(); g.fill();
  }
  g.restore();
}

export async function drawJob(g, W, H, d = {}) {
  const u = W / 1080, sq = H === W;
  // стена музея: тёмно-зелёная с лучом света
  g.fillStyle = '#16302B'; g.fillRect(0, 0, W, H);
  const wall = g.createRadialGradient(W / 2, H * 0.08, 10, W / 2, H * 0.4, H * 0.8);
  wall.addColorStop(0, 'rgba(255,236,190,0.35)'); wall.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.05; for (let x = 0; x < W; x += 36 * u) { g.fillStyle = x % (72 * u) ? '#000' : '#fff'; g.fillRect(x, 0, 18 * u, H); } g.restore();
  // заголовок над картиной
  g.textAlign = 'center'; g.fillStyle = '#F3E3C0';
  g.font = `600 ${(sq ? 22 : 26) * u}px ${FONT}`; g.fillText('A S C E N T  ·  Г А Л Е Р Е Я', W / 2, (sq ? 64 : 120) * u);
  g.font = `italic 800 ${(sq ? 72 : 108) * u}px ${SERIF}`; g.fillText('Нашёл работу!', W / 2, (sq ? 146 : 250) * u);
  // картина
  const t = (sq ? 46 : 64) * u;
  const px = (sq ? 220 : 120) * u, py = (sq ? 210 : 360) * u, pw = W - 2 * px, ph = sq ? 640 * u : H - py - t - 110 * u;
  goldFrame(g, px, py, pw, ph, t, u);
  const pw0 = Math.round(pw), ph0 = Math.round(ph), px0 = Math.round(px), py0 = Math.round(py);
  const scene = await svgImage(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw0}" height="${ph0}" viewBox="0 0 ${pw0} ${ph0}">${jobScene(pw0, ph0, rngFrom(2026))}</svg>`);
  if (scene) g.drawImage(scene, px0, py0, pw0, ph0);
  // слои мазков: крупные по фону, затем персонажи и мелкие мазки поверх
  brushPass(g, px0, py0, pw0, ph0, Math.round(pw0 * ph0 / 60), 20 * u, 7 * u, 0.4, 7);
  brushPass(g, px0, py0, pw0, ph0, Math.round(pw0 * ph0 / 140), 11 * u, 4 * u, 0.5, 8);
  const chars = await svgImage(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw0}" height="${ph0}" viewBox="0 0 ${pw0} ${ph0}">${jobChars(pw0, ph0)}</svg>`);
  if (chars) g.drawImage(chars, px0, py0, pw0, ph0);
  brushPass(g, px0, py0, pw0, ph0, Math.round(pw0 * ph0 / 420), 12 * u, 3.2 * u, 0.35, 9);
  canvasWeave(g, px0, py0, pw0, ph0, u);
  // лак: тёплая виньетка и блик
  const v = g.createRadialGradient(px0 + pw0 / 2, py0 + ph0 * 0.45, pw0 * 0.2, px0 + pw0 / 2, py0 + ph0 / 2, pw0 * 0.9);
  v.addColorStop(0, 'rgba(255,230,170,0)'); v.addColorStop(1, 'rgba(60,30,10,0.35)');
  g.fillStyle = v; g.fillRect(px0, py0, pw0, ph0);
  const gl = g.createLinearGradient(px0, py0, px0 + pw0, py0 + ph0);
  gl.addColorStop(0, 'rgba(255,255,255,0.10)'); gl.addColorStop(0.35, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl; g.fillRect(px0, py0, pw0, ph0);
  // подпись художника в углу
  g.save(); g.fillStyle = 'rgba(60,30,15,0.75)'; g.font = `italic 700 ${22 * u}px ${SERIF}`; g.textAlign = 'right';
  g.fillText((d.nick || 'Гофер') + ' · 2026', px0 + pw0 - 24 * u, py0 + ph0 - 22 * u); g.restore();
}
