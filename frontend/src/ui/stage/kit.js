// Инструменты сцен для карточек этапов и галереи: персонажи (гофер, Clawd), костюмы, предметы,
// небо, горы, лес, интерьер, реквизит. Всё — строки SVG; координаты сцены 1080×1100 (земля ≈ y 1000),
// у фона — весь кадр W×H.
import { gopherSVG } from '../gopher.js';

export const L = '#2E2622'; // контур
export const SVGF = 'font-family="Segoe UI, system-ui, sans-serif"';
export const SVGM = 'font-family="Cascadia Code, Consolas, monospace"';
export const SVGS = 'font-family="Georgia, serif"';

export function rngFrom(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
let idn = 0;
export const uid = (p = 'k') => p + (++idn);
export const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const txt = (x, y, t, size, fill, extra = '', fam = SVGF) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${fam} ${extra}>${esc(t)}</text>`;
export const stars = (rng, n, x0, y0, w, h, fill = '#FFFFFF', rmax = 2.2) => Array.from({ length: n }, () => `<circle cx="${(x0 + rng() * w).toFixed(0)}" cy="${(y0 + rng() * h).toFixed(0)}" r="${(0.6 + rng() * rmax).toFixed(1)}" fill="${fill}" opacity="${(0.3 + rng() * 0.7).toFixed(2)}"/>`).join('');

// ---------- персонажи ----------
// гофер внутри сцены: x, y — левый верх рамки 200×240, w — ширина
// flip: CSS-отражение вложенного svg в картинке не работает — отражаем группой
export function gopherAt(opts, x, y, w) {
  const svg = gopherSVG({ ...opts, flip: false, width: w }).replace('<svg ', `<svg x="${x}" y="${y}" height="${w * 1.2}" `);
  return opts.flip ? `<g transform="translate(${2 * x + w} 0) scale(-1 1)">${svg}</g>` : svg;
}
// гофер, стоящий ногами на земле gy, по центру cx
export const gopherOn = (opts, cx, gy, w) => gopherAt(opts, cx - w / 2, gy - w * 1.2 * 0.94 + (opts.lift || 0) * 0, w);

// костюмы (координаты гофера: 200×240; макушка ≈ y 14, глаза y 39…105, живот y 130…200; в профиль — морда справа)
export const hats = {
  prop: `<path d="M50 38 Q52 -2 100 -2 Q148 -2 150 38 Z" fill="#E63946" stroke="${L}" stroke-width="2.4"/>` +
    `<path d="M100 -2 Q84 10 82 37 L118 37 Q116 10 100 -2Z" fill="#FFD166" stroke="${L}" stroke-width="1.8"/>` +
    `<path d="M47 33 Q100 20 153 33 L153 42 Q100 29 47 42Z" fill="#457B9D" stroke="${L}" stroke-width="2.2"/>` +
    `<path d="M100 -2 V-16" stroke="${L}" stroke-width="3"/><circle cx="100" cy="-2" r="4" fill="#FFD166" stroke="${L}" stroke-width="2"/>` +
    `<ellipse cx="82" cy="-18" rx="18" ry="5" fill="#2A9D8F" stroke="${L}" stroke-width="2" transform="rotate(-8 82 -18)"/><ellipse cx="118" cy="-18" rx="18" ry="5" fill="#F4A261" stroke="${L}" stroke-width="2" transform="rotate(8 118 -18)"/><circle cx="100" cy="-17" r="3.5" fill="${L}"/>`,
  propSide: `<path d="M50 32 Q52 -10 104 -4 Q152 2 158 30 Q104 20 50 32Z" fill="#E63946" stroke="${L}" stroke-width="2.4"/><path d="M98 -4 Q90 12 92 26 L124 24 Q122 6 98 -4Z" fill="#FFD166" stroke="${L}" stroke-width="1.6"/>` +
    `<path d="M150 26 Q178 20 196 30 Q174 36 152 34Z" fill="#457B9D" stroke="${L}" stroke-width="2"/>` +
    `<path d="M100 -4 V-18" stroke="${L}" stroke-width="3"/><ellipse cx="86" cy="-20" rx="16" ry="4.5" fill="#2A9D8F" stroke="${L}" stroke-width="1.8"/><ellipse cx="114" cy="-20" rx="16" ry="4.5" fill="#F4A261" stroke="${L}" stroke-width="1.8"/><circle cx="100" cy="-19" r="3" fill="${L}"/>`,
  straps: `<path d="M58 118 L64 196 M142 118 L136 196" stroke="#9C4A2F" stroke-width="9" stroke-linecap="round"/>`,
  visor: `<g fill="none" stroke="#C9A227" stroke-width="4"><circle cx="67" cy="72" r="35"/><circle cx="133" cy="72" r="35"/><path d="M96 58 Q100 52 104 58"/><path d="M32 66 L22 60 M168 66 L178 60"/></g>` +
    `<path d="M44 44 Q100 18 156 44 L162 30 Q100 2 38 30Z" fill="#2A9D8F" fill-opacity=".85" stroke="${L}" stroke-width="2.2"/><path d="M40 30 Q100 4 160 30" stroke="#1D3557" stroke-width="5" fill="none"/>` +
    `<path d="M154 26 L178 6" stroke="#F4A261" stroke-width="7" stroke-linecap="round"/><path d="M178 6 L184 0" stroke="${L}" stroke-width="7" stroke-linecap="round"/>`,
  bow: `<path d="M100 132 L78 120 L78 144Z M100 132 L122 120 L122 144Z" fill="#FF5CA8" stroke="${L}" stroke-width="2.2"/><circle cx="100" cy="132" r="6" fill="#C2185B" stroke="${L}" stroke-width="2"/>`,
  post: `<path d="M48 36 Q50 -2 100 -4 Q150 -2 152 36Z" fill="#1D3557" stroke="${L}" stroke-width="2.4"/><path d="M46 32 Q100 22 154 32 L154 40 Q100 30 46 40Z" fill="#14213D" stroke="${L}" stroke-width="2"/>` +
    `<path d="M58 38 Q100 58 142 38 Q100 46 58 38Z" fill="#0B132B" stroke="${L}" stroke-width="2"/><rect x="89" y="8" width="22" height="15" rx="2" fill="#FFD166" stroke="${L}" stroke-width="1.6"/><path d="M89 8 L100 17 L111 8" fill="none" stroke="${L}" stroke-width="1.4"/>`,
  hard: `<path d="M46 38 Q46 -2 100 -2 Q154 -2 154 38Z" fill="#FFC300" stroke="${L}" stroke-width="2.4"/><path d="M100 -2 V36 M76 4 Q70 18 70 36 M124 4 Q130 18 130 36" stroke="#E0A800" stroke-width="4" fill="none"/>` +
    `<ellipse cx="100" cy="38" rx="64" ry="9" fill="#FFB000" stroke="${L}" stroke-width="2.2"/>`,
  vest: `<path d="M44 112 L74 118 L78 204 L50 198 Q40 160 44 112Z" fill="#FF7A00" stroke="${L}" stroke-width="2"/><path d="M156 112 L126 118 L122 204 L150 198 Q160 160 156 112Z" fill="#FF7A00" stroke="${L}" stroke-width="2"/>` +
    `<path d="M46 156 L76 160 M47 176 L77 180 M154 156 L124 160 M153 176 L123 180" stroke="#EDEDED" stroke-width="6"/>`,
  headset: `<path d="M30 64 Q30 2 100 2 Q170 2 170 64" stroke="#212529" stroke-width="8" fill="none"/><rect x="18" y="48" width="22" height="36" rx="8" fill="#343A40" stroke="${L}" stroke-width="2"/><rect x="160" y="48" width="22" height="36" rx="8" fill="#343A40" stroke="${L}" stroke-width="2"/>` +
    `<path d="M30 82 Q36 122 76 120" stroke="#212529" stroke-width="4.5" fill="none"/><circle cx="78" cy="120" r="6" fill="#39D98A" stroke="${L}" stroke-width="1.8"/>`,
  beanie: `<path d="M50 36 Q52 -4 100 -4 Q148 -4 150 36Z" fill="#D62828" stroke="${L}" stroke-width="2.4"/><path d="M70 0 L66 34 M85 -3 L84 34 M100 -4 V34 M115 -3 L116 34 M130 0 L134 34" stroke="#A4161A" stroke-width="2"/>` +
    `<path d="M45 30 Q100 18 155 30 L155 44 Q100 32 45 44Z" fill="#F1FAEE" stroke="${L}" stroke-width="2.2"/><circle cx="100" cy="-12" r="14" fill="#F1FAEE" stroke="${L}" stroke-width="2.2"/>`,
  scarf: `<path d="M36 120 Q100 146 164 120 L166 136 Q100 162 34 136Z" fill="#457B9D" stroke="${L}" stroke-width="2.2"/><path d="M60 128 L58 144 M86 134 L85 151 M114 134 L115 151 M140 128 L142 144" stroke="#F1FAEE" stroke-width="4"/>` +
    `<path d="M128 138 L150 200 L132 204 L114 142Z" fill="#457B9D" stroke="${L}" stroke-width="2.2"/><path d="M134 192 L150 188 M131 182 L146 177" stroke="#F1FAEE" stroke-width="4"/>`,
  santa: `<path d="M48 36 Q60 -20 120 -34 Q150 -36 168 -6 L150 36Z" fill="#D62828" stroke="${L}" stroke-width="2.4"/><path d="M44 30 Q100 16 156 30 L156 46 Q100 32 44 46Z" fill="#FFFFFF" stroke="${L}" stroke-width="2.2"/><circle cx="170" cy="-6" r="13" fill="#FFFFFF" stroke="${L}" stroke-width="2.2"/>`,
  redscarf: `<path d="M36 120 Q100 146 164 120 L166 136 Q100 162 34 136Z" fill="#2A9D8F" stroke="${L}" stroke-width="2.2"/><path d="M60 128 L58 144 M86 134 L85 151 M114 134 L115 151 M140 128 L142 144" stroke="#E63946" stroke-width="4"/><path d="M58 138 L46 196 L64 198 L74 142Z" fill="#2A9D8F" stroke="${L}" stroke-width="2.2"/>`,
  tie: `<path d="M82 122 L100 150 L118 122 Q100 130 82 122Z" fill="#FFFFFF" stroke="${L}" stroke-width="1.8"/><path d="M100 128 L93 137 L100 172 L107 137Z" fill="#457B9D" stroke="${L}" stroke-width="1.8"/><path d="M94 124 L106 124 L103 132 L97 132Z" fill="#1D3557"/>`,
  sweat: `<path d="M168 40q9 14 0 21q-9 -7 0 -21z" fill="#A9E6F5" stroke="${L}" stroke-width="2"/>`,
  pencil: `<path d="M150 22 L182 6" stroke="#FFC300" stroke-width="7" stroke-linecap="round"/><path d="M182 6 L190 2" stroke="${L}" stroke-width="7" stroke-linecap="round"/>`,
  glasses: `<g fill="none" stroke="#3A2A22" stroke-width="3.5"><circle cx="67" cy="72" r="35"/><circle cx="133" cy="72" r="35"/><path d="M96 58 Q100 52 104 58"/></g>`,
  suit: `<path d="M31 128 C33 150 33 168 34 186 C37 212 66 224 100 224 C134 224 163 212 166 186 C167 168 167 150 169 128 Q140 118 118 122 L100 176 L82 122 Q60 118 31 128Z" fill="#22223B" stroke="${L}" stroke-width="2.4"/>` +
    `<path d="M82 122 L100 176 L118 122 Q100 130 82 122Z" fill="#FFFFFF" stroke="${L}" stroke-width="1.8"/><path d="M100 128 L93 137 L100 172 L107 137Z" fill="#E63946" stroke="${L}" stroke-width="1.8"/><path d="M94 124 L106 124 L103 132 L97 132Z" fill="#B5172B"/>` +
    `<path d="M82 122 L92 152 L76 140Z M118 122 L108 152 L124 140Z" fill="#4A4E69" stroke="${L}" stroke-width="1.6"/><path d="M134 150 l16 -2 l-2 8 l-14 2z" fill="#F2CC8F" stroke="${L}" stroke-width="1.4"/>`,
};
// рюкзак за спиной: анфас (лямки видны спереди) и в профиль (морда вправо, спина слева)
export const packs = {
  front: (c = '#E76F51') => `<g stroke="${L}" stroke-width="2.2"><rect x="18" y="104" width="30" height="86" rx="12" fill="${c}"/><rect x="152" y="104" width="30" height="86" rx="12" fill="${c}"/></g>`,
  side: (c = '#E76F51') => `<g stroke="${L}" stroke-width="2.4"><rect x="2" y="84" width="58" height="116" rx="18" fill="${c}"/><rect x="-6" y="140" width="30" height="46" rx="10" fill="${c}"/><path d="M8 100 Q30 90 54 100" fill="none"/><rect x="14" y="66" width="34" height="22" rx="6" fill="#3A86FF"/></g>`,
};
// предметы в лапках (между телом и лапками)
export const items = {
  book: (t = 'Go', c = '#3A86FF') => `<rect x="58" y="138" width="84" height="56" rx="5" fill="${c}" stroke="${L}" stroke-width="2.4"/><rect x="62" y="142" width="76" height="48" rx="3" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>` +
    `<text x="100" y="176" text-anchor="middle" font-size="${t.length > 3 ? 18 : 26}" font-weight="800" fill="#fff" ${SVGF}>${esc(t)}</text>`,
  boxes: ['[]byte', 'map[k]v', 'struct{}'].map((t, i) => `<g transform="translate(${60 + (i % 2) * 6} ${172 - i * 27})"><rect width="${82 - (i % 2) * 6}" height="25" rx="3" fill="${['#E9C46A', '#F4A261', '#E76F51'][i]}" stroke="${L}" stroke-width="2.2"/><text x="${(82 - (i % 2) * 6) / 2}" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="#2B1B10" ${SVGM}>${esc(t)}</text></g>`).join(''),
  clipboard: `<rect x="64" y="134" width="72" height="62" rx="4" fill="#BC8A5F" stroke="${L}" stroke-width="2.2"/><rect x="70" y="142" width="60" height="50" fill="#FFFDF5"/><rect x="88" y="130" width="24" height="10" rx="3" fill="#ADB5BD" stroke="${L}" stroke-width="1.6"/>` +
    `<path d="M76 154 l5 5 l8 -10 M76 170 l5 5 l8 -10 M76 186 l5 5 l8 -10" stroke="#2A9D8F" stroke-width="2.6" fill="none"/><path d="M96 156 H124 M96 172 H120 M96 188 H124" stroke="#999" stroke-width="2.4"/>`,
  strap: `<path d="M152 108 Q100 140 34 172" stroke="#8D5524" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M152 108 Q100 140 34 172" stroke="#B07A45" stroke-width="3" fill="none" stroke-dasharray="6 7"/>`,
  envelope: (t = '200 OK') => `<rect x="62" y="140" width="76" height="48" rx="3" fill="#FFFDF5" stroke="${L}" stroke-width="2.2"/><path d="M62 140 L100 168 L138 140" fill="none" stroke="${L}" stroke-width="2"/><circle cx="100" cy="166" r="8" fill="#E63946" stroke="${L}" stroke-width="1.6"/><text x="100" y="185" text-anchor="middle" font-size="8.5" font-weight="700" fill="#555" ${SVGM}>${esc(t)}</text>`,
  map: `<path d="M54 140 L80 134 L104 142 L146 134 L146 190 L104 198 L80 190 L54 196Z" fill="#F4E3B5" stroke="${L}" stroke-width="2.2"/><path d="M80 134 V190 M104 142 V198" stroke="${L}" stroke-opacity=".4" stroke-width="1.6"/>` +
    `<path d="M62 182 Q78 160 92 170 T130 150" stroke="#E63946" stroke-width="2.6" stroke-dasharray="4 4" fill="none"/><path d="M128 146 l6 8 l-8 2z" fill="#E63946"/>`,
  blueprint: `<rect x="56" y="150" width="88" height="34" rx="17" fill="#3A6EA5" stroke="${L}" stroke-width="2.2"/><ellipse cx="144" cy="167" rx="9" ry="17" fill="#5B8FC7" stroke="${L}" stroke-width="2"/><path d="M66 160 H128 M66 168 H120 M66 176 H130" stroke="#CFE3FF" stroke-width="2"/>`,
  // ключ лежит поперёк живота (головка слева), ниже морды
  wrench: `<g transform="rotate(-72 100 178)"><rect x="92" y="138" width="16" height="74" rx="6" fill="#ADB5BD" stroke="${L}" stroke-width="2.2"/><path d="M84 120 a22 22 0 1 0 32 0 l-8 14 h-16z" fill="#CED4DA" stroke="${L}" stroke-width="2.2"/></g>`,
  mug: `<rect x="76" y="138" width="46" height="50" rx="7" fill="#F8F9FA" stroke="${L}" stroke-width="2.2"/><path d="M122 148 q16 0 16 14 q0 14 -16 14" fill="none" stroke="${L}" stroke-width="5"/><path d="M122 148 q16 0 16 14 q0 14 -16 14" fill="none" stroke="#F8F9FA" stroke-width="2"/>` +
    `<text x="99" y="160" text-anchor="middle" font-size="9" font-weight="800" fill="#39D98A" ${SVGM}>on</text><text x="99" y="172" text-anchor="middle" font-size="9" font-weight="800" fill="#39D98A" ${SVGM}>call</text>` +
    `<path d="M88 132 q4 -10 0 -18 M100 132 q4 -10 0 -18 M112 132 q4 -10 0 -18" stroke="#ADB5BD" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>`,
  resume: `<rect x="60" y="128" width="80" height="70" rx="3" fill="#FFFDF5" stroke="${L}" stroke-width="2.2"/><rect x="68" y="136" width="20" height="24" fill="#7FD4EA" stroke="${L}" stroke-width="1.4"/><path d="M94 140 H132 M94 150 H126 M68 170 H132 M68 180 H124 M68 190 H130" stroke="#999" stroke-width="2.4"/>` +
    `<text x="113" y="160" text-anchor="middle" font-size="9" font-weight="800" fill="#2B1B17" ${SVGF}>РЕЗЮМЕ</text>`,
  sparkler: `<path d="M100 196 L100 92" stroke="#6C757D" stroke-width="4"/>` + Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return `<path d="M${100 + Math.cos(a) * 8} ${88 + Math.sin(a) * 8} L${100 + Math.cos(a) * (24 + (i % 3) * 8)} ${88 + Math.sin(a) * (24 + (i % 3) * 8)}" stroke="${['#FFD166', '#FFFFFF', '#FFB703'][i % 3]}" stroke-width="2.6" stroke-linecap="round"/>`; }).join('') + `<circle cx="100" cy="88" r="7" fill="#FFF6C9"/>`,
  water: `<path d="M84 150 L88 196 L112 196 L116 150Z" fill="#CFF4FF" fill-opacity=".85" stroke="${L}" stroke-width="2"/><path d="M86 166 H114" stroke="#7FD4EA" stroke-width="3"/>`,
  // указка/палочка в правой лапке, поднятой к плечу (для позы «показывает вправо»)
  stick: `<path d="M172 150 L250 96" stroke="#7F5539" stroke-width="6" stroke-linecap="round"/>`,
};
// гофер: база этапа + поза кадра; hat — ключи/строки поверх, item — предмет, back — за телом
export function dressed(base, pose = {}) {
  const { hat = [], item = '', back = '', ...opts } = { ...base, ...pose };
  const hs = (Array.isArray(hat) ? hat : [hat]).map((k) => hats[k] || k).join('');
  const it = typeof item === 'function' ? item() : (items[item] ?? item);
  return { ...opts, extra: hs, item: typeof it === 'function' ? it() : it, back };
}

// ---------- Clawd — питомец Claude: оранжевый пиксельный зверёк с глазками-прямоугольниками ----------
export const CH = { // шапочки (координаты Clawd: тело x 6…114, y 14…78)
  prop: `<path d="M28 16 Q60 -16 92 16Z" fill="#E63946" stroke="${L}" stroke-width="2"/><path d="M44 14 Q60 -6 76 14" fill="#FFD166"/><path d="M60 -2 V-14" stroke="${L}" stroke-width="2.5"/><ellipse cx="49" cy="-15" rx="11" ry="3.5" fill="#2A9D8F" stroke="${L}" stroke-width="1.5"/><ellipse cx="71" cy="-15" rx="11" ry="3.5" fill="#F4A261" stroke="${L}" stroke-width="1.5"/>`,
  visor: `<path d="M4 24 Q60 2 116 24 L120 12 Q60 -12 0 12Z" fill="#2A9D8F" fill-opacity=".92" stroke="${L}" stroke-width="2"/>`,
  top: `<rect x="34" y="-34" width="52" height="46" fill="#1B1035" stroke="#FFD166" stroke-width="2"/><rect x="20" y="8" width="80" height="8" rx="2" fill="#1B1035" stroke="#FFD166" stroke-width="1.5"/><rect x="34" y="-6" width="52" height="7" fill="#FF5CA8"/>`,
  post: `<path d="M18 18 Q60 -14 102 18Z" fill="#1D3557" stroke="${L}" stroke-width="2"/><path d="M12 16 H108 L100 26 H20Z" fill="#0B132B"/><rect x="52" y="-2" width="16" height="11" rx="1" fill="#FFD166" stroke="${L}" stroke-width="1.2"/>`,
  hard: `<path d="M16 18 Q18 -16 60 -16 Q102 -16 104 18Z" fill="#FFC300" stroke="${L}" stroke-width="2"/><path d="M60 -16 V16" stroke="#E0A800" stroke-width="3"/><rect x="6" y="12" width="108" height="9" rx="4" fill="#FFB000" stroke="${L}" stroke-width="1.6"/>`,
  headset: `<path d="M2 42 Q2 -10 60 -10 Q118 -10 118 42" stroke="#212529" stroke-width="6" fill="none"/><rect x="-6" y="30" width="14" height="24" rx="5" fill="#343A40"/><rect x="112" y="30" width="14" height="24" rx="5" fill="#343A40"/><path d="M0 54 Q8 74 30 70" stroke="#212529" stroke-width="3" fill="none"/><circle cx="32" cy="70" r="4" fill="#39D98A"/>`,
  beanie: `<path d="M20 18 Q22 -18 60 -18 Q98 -18 100 18Z" fill="#D62828" stroke="${L}" stroke-width="2"/><rect x="14" y="8" width="92" height="12" rx="4" fill="#F1FAEE" stroke="${L}" stroke-width="1.6"/><circle cx="60" cy="-22" r="10" fill="#F1FAEE" stroke="${L}" stroke-width="1.6"/>`,
  santa: `<path d="M18 18 Q30 -26 86 -30 Q110 -30 122 -6 L102 18Z" fill="#D62828" stroke="${L}" stroke-width="2"/><rect x="12" y="8" width="96" height="13" rx="6" fill="#fff" stroke="${L}" stroke-width="1.6"/><circle cx="122" cy="-6" r="10" fill="#fff" stroke="${L}" stroke-width="1.6"/>`,
  tie: `<path d="M54 78 L66 78 L63 84 L57 84Z" fill="#1D3557"/><path d="M57 84 L52 100 L60 106 L68 100 L63 84Z" fill="#457B9D"/>`,
  pack: `<rect x="-14" y="22" width="24" height="44" rx="8" fill="#2A9D8F" stroke="${L}" stroke-width="2"/>`,
  nightcap: `<path d="M16 18 Q30 -20 80 -26 Q120 -26 132 10 L104 18Z" fill="#5E60CE" stroke="${L}" stroke-width="2"/><circle cx="132" cy="12" r="9" fill="#FFD166" stroke="${L}" stroke-width="1.6"/><path d="M30 2 l3 6 M56 -12 l3 6 M86 -14 l3 6" stroke="#FFD166" stroke-width="3"/>`,
};
export const CI = { // предметы у правой лапки (x ≈ 120…170)
  chalk: `<rect x="124" y="30" width="26" height="9" rx="3" fill="#FFFFFF" stroke="${L}" stroke-width="1.6" transform="rotate(-30 137 34)"/>`,
  book: (t = 'SQL', c = '#FB5607') => `<rect x="122" y="16" width="36" height="46" rx="3" fill="${c}" stroke="${L}" stroke-width="2"/><text x="140" y="45" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" ${SVGF}>${esc(t)}</text>`,
  paper: `<path d="M118 34 L176 14 L152 50 Z M152 50 L146 66 L160 46" fill="#FFFFFF" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`,
  box: (t = '*T') => `<rect x="118" y="6" width="50" height="44" rx="3" fill="#E9C46A" stroke="${L}" stroke-width="2"/><text x="143" y="34" text-anchor="middle" font-size="12" font-weight="800" fill="#2B1B10" ${SVGM}>${esc(t)}</text>`,
  orb: (c = '#5CE1E6') => `<circle cx="146" cy="10" r="24" fill="${c}" opacity=".25"/><circle cx="146" cy="10" r="14" fill="${c}" stroke="${L}" stroke-width="2"/><text x="146" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="#1B1035" ${SVGM}>go</text>`,
  envelope: `<rect x="118" y="20" width="52" height="34" rx="3" fill="#FFFDF5" stroke="${L}" stroke-width="2"/><path d="M118 20 L144 40 L170 20" fill="none" stroke="${L}" stroke-width="2"/><circle cx="144" cy="38" r="5" fill="#E63946"/>`,
  brick: `<rect x="118" y="24" width="50" height="26" rx="2" fill="#C1440E" stroke="${L}" stroke-width="2"/><path d="M118 37 H168 M143 24 V37 M130 37 V50 M156 37 V50" stroke="#7A2A08" stroke-width="1.6"/>`,
  wrench: `<g transform="rotate(30 144 30)"><rect x="138" y="20" width="12" height="48" rx="5" fill="#ADB5BD" stroke="${L}" stroke-width="2"/><path d="M132 8 a16 16 0 1 0 24 0 l-6 10 h-12z" fill="#CED4DA" stroke="${L}" stroke-width="2"/></g>`,
  mug: `<rect x="124" y="20" width="32" height="36" rx="5" fill="#F8F9FA" stroke="${L}" stroke-width="2"/><path d="M156 28 q12 0 12 10 q0 10 -12 10" fill="none" stroke="${L}" stroke-width="4"/>`,
  flag: (t = '', c = '#00ADD8') => `<path d="M136 66 V-50" stroke="#2B1B17" stroke-width="4" stroke-linecap="round"/><path d="M138 -48 Q162 -56 184 -46 L184 -14 Q162 -24 138 -16Z" fill="${c}" stroke="${L}" stroke-width="2"/>${t ? `<text x="161" y="-25" text-anchor="middle" font-size="14" font-weight="900" fill="#fff" ${SVGF}>${esc(t)}</text>` : ''}`,
  gift: `<rect x="116" y="18" width="52" height="44" fill="#E63946" stroke="${L}" stroke-width="2"/><rect x="137" y="18" width="10" height="44" fill="#FFD166"/><rect x="116" y="34" width="52" height="10" fill="#FFD166"/><path d="M142 18 q-16 -18 -18 -2 M142 18 q16 -18 18 -2" stroke="#FFD166" stroke-width="5" fill="none"/>`,
  bars: `<rect x="116" y="-6" width="64" height="60" rx="4" fill="#FFFDF5" stroke="${L}" stroke-width="2"/>${[10, 18, 26, 36, 46].map((h, i) => `<rect x="${122 + i * 11}" y="${48 - h}" width="8" height="${h}" fill="${['#E63946', '#F4A261', '#E9C46A', '#2A9D8F', '#3A86FF'][i]}"/>`).join('')}`,
  compass: `<circle cx="146" cy="30" r="22" fill="#F4E3B5" stroke="${L}" stroke-width="2.4"/><circle cx="146" cy="30" r="16" fill="#FFFDF5" stroke="${L}" stroke-width="1.4"/><path d="M146 16 L151 30 L146 44 L141 30Z" fill="#E63946"/><path d="M146 30 L151 30 L146 44 L141 30Z" fill="#457B9D"/>`,
  marshmallow: `<path d="M118 50 L196 -10" stroke="#7F5539" stroke-width="4" stroke-linecap="round"/><rect x="186" y="-26" width="20" height="18" rx="5" fill="#FFF3E0" stroke="${L}" stroke-width="2" transform="rotate(-36 196 -17)"/><path d="M188 -12 q4 4 10 2" stroke="#C68B59" stroke-width="3" fill="none"/>`,
  notebook: `<rect x="118" y="22" width="44" height="36" rx="3" fill="#90BE6D" stroke="${L}" stroke-width="2"/><path d="M126 32 H154 M126 40 H150 M126 48 H154" stroke="#fff" stroke-width="2"/>`,
  lantern: `<path d="M140 -2 V10" stroke="${L}" stroke-width="3"/><rect x="126" y="10" width="28" height="36" rx="6" fill="#FFD166" stroke="${L}" stroke-width="2.4"/><circle cx="140" cy="28" r="22" fill="#FFD166" opacity=".3"/>`,
};
// табличка на палочке
export const csign = (t, c = '#FFFFFF', ink = '#2B1B17') => { const w = Math.max(70, t.length * 13 + 24); return `<path d="M140 64 V-6" stroke="#7F5539" stroke-width="4"/><rect x="${140 - w / 2}" y="-46" width="${w}" height="40" rx="6" fill="${c}" stroke="${L}" stroke-width="2"/><text x="140" y="-19" text-anchor="middle" font-size="19" font-weight="800" fill="${ink}" ${SVGF}>${esc(t)}</text>`; };
// x, y — левый верх; ноги на земле gy: y = gy − 98·s
export function clawd(x, y, s, { wave = false, jump = 0, flip = false, hat = '', item = '', both = false, eyes = 'open', shadow = true } = {}) {
  const o = '#E8825F', d = '#C4623F', e = '#1A1A1A';
  const hs = (Array.isArray(hat) ? hat : [hat]).map((k) => CH[k] || k).join('');
  const it = typeof item === 'function' ? item() : (CI[item] ?? item);
  const tr = `translate(${x} ${y - jump}) scale(${flip ? -s : s} ${s})${flip ? ' translate(-120 0)' : ''}`;
  const behind = hs.includes('x="-14"');
  const eyeSvg = eyes === 'closed'
    ? `<path d="M30 46 h14 M76 46 h14" stroke="${e}" stroke-width="4"/>`
    : eyes === 'happy'
      ? `<path d="M30 48 l7 -8 l7 8 M76 48 l7 -8 l7 8" stroke="${e}" stroke-width="4" fill="none"/>`
      : `<rect x="32" y="34" width="10" height="20" fill="${e}"/><rect x="78" y="34" width="10" height="20" fill="${e}"/><rect x="34" y="36" width="4" height="5" fill="#fff" opacity=".8"/><rect x="80" y="36" width="4" height="5" fill="#fff" opacity=".8"/>`;
  return `<g transform="${tr}">` +
    (shadow ? `<ellipse cx="60" cy="${102 + jump / s}" rx="54" ry="7" fill="#000" opacity=".18"/>` : '') +
    `<rect x="18" y="72" width="12" height="26" fill="${d}"/><rect x="38" y="72" width="12" height="26" fill="${d}"/><rect x="70" y="72" width="12" height="26" fill="${d}"/><rect x="90" y="72" width="12" height="26" fill="${d}"/>` +
    (behind ? hs : '') +
    `<rect x="6" y="14" width="108" height="64" fill="${o}"/>` +
    `<rect x="${wave || both ? -10 : -8}" y="${wave || both ? 6 : 38}" width="16" height="${wave || both ? 30 : 18}" fill="${o}"/><rect x="112" y="${both ? 6 : 38}" width="16" height="${both ? 30 : 18}" fill="${o}"/>` +
    `<rect x="6" y="14" width="108" height="8" fill="#F09B7A"/><rect x="6" y="70" width="108" height="8" fill="${d}" opacity=".5"/>` +
    eyeSvg + (behind ? '' : hs) + it + `</g>`;
}
// Clawd ногами на земле: cx — центр, gy — земля
export const clawdOn = (cx, gy, s, opts = {}) => clawd(cx - 60 * s, gy - 98 * s, s, opts);

// ---------- небо и свет ----------
export function sky(W, H, stops) {
  const id = uid('sky');
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
}
export function glow(x, y, r, color, op = 1, rx = r, ry = r) {
  const id = uid('gl');
  return `<defs><radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`;
}
export function sun(x, y, r, { core = '#FFF6C9', color = '#FFD166', rays = 0, rayOp = 0.12 } = {}) {
  let s = glow(x, y, r * 3, color, 0.55) + `<circle cx="${x}" cy="${y}" r="${r}" fill="${core}"/>`;
  for (let i = 0; i < rays; i++) { const a = i / rays * Math.PI * 2, b = (i + 0.45) / rays * Math.PI * 2, R = r * 14; s += `<path d="M${x} ${y} L${x + Math.cos(a) * R} ${y + Math.sin(a) * R} L${x + Math.cos(b) * R} ${y + Math.sin(b) * R}Z" fill="#FFFFFF" opacity="${rayOp}"/>`; }
  return s;
}
// месяц-серп (освещён слева); full — полная луна
export const moon = (x, y, r, _bg, full = false) => glow(x, y, r * 3.2, '#FFF3C4', 0.35) + (full ? `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF3C4"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.2}" r="${r * 0.18}" fill="#EADFB0"/><circle cx="${x + r * 0.35}" cy="${y + r * 0.25}" r="${r * 0.12}" fill="#EADFB0"/>` : `<path d="M${x} ${y - r} A${r} ${r} 0 1 0 ${x} ${y + r} A${r * 0.55} ${r} 0 0 1 ${x} ${y - r}Z" fill="#FFF3C4" transform="rotate(-20 ${x} ${y})"/>`);
export function cloud(x, y, w, color = '#FFFFFF', op = 0.85) {
  const h = w * 0.32;
  return `<g opacity="${op}" fill="${color}"><ellipse cx="${x}" cy="${y}" rx="${w * 0.5}" ry="${h * 0.42}"/><ellipse cx="${x - w * 0.18}" cy="${y - h * 0.28}" rx="${w * 0.22}" ry="${h * 0.42}"/><ellipse cx="${x + w * 0.1}" cy="${y - h * 0.42}" rx="${w * 0.26}" ry="${h * 0.55}"/><ellipse cx="${x + w * 0.3}" cy="${y - h * 0.16}" rx="${w * 0.18}" ry="${h * 0.36}"/></g>`;
}
export const birds = (rng, n, x0, x1, y0, y1, color = '#3D2C5B') => Array.from({ length: n }, () => { const x = x0 + rng() * (x1 - x0), y = y0 + rng() * (y1 - y0), k = 8 + rng() * 10; return `<path d="M${x - k} ${y - k * 0.3} Q${x - k * 0.4} ${y - k * 0.6} ${x} ${y} Q${x + k * 0.4} ${y - k * 0.6} ${x + k} ${y - k * 0.3}" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`; }).join('');

// ---------- земля: горы, холмы, лес ----------
// хребет: пики по точкам [x, y]; снежные шапки на пиках выше snowY
// light — цвет освещённых склонов (правые грани от пиков), capH — высота снежной шапки
export function range(points, color, { op = 1, bottom = 1100, snow = null, snowColor = '#FFFFFF', light = null, lightOp = 0.3, capH = 90 } = {}) {
  let s = `<path d="M${points[0][0]} ${bottom} ` + points.map(([x, y]) => `L${x} ${y}`).join(' ') + ` L${points[points.length - 1][0]} ${bottom}Z" fill="${color}" opacity="${op}"/>`;
  if (light) points.forEach(([x, y], i) => {
    if (i === 0 || i === points.length - 1 || y > points[i - 1][1] || y > points[i + 1][1]) return;
    const [nx, ny] = points[i + 1];
    s += `<path d="M${x} ${y} L${nx} ${ny} L${x + (nx - x) * 0.35} ${Math.min(bottom, ny + (ny - y) * 1.2)}Z" fill="${light}" opacity="${lightOp}"/>`;
  });
  if (snow != null) points.forEach(([x, y], i) => {
    if (y > snow || i === 0 || i === points.length - 1) return;
    const [px, py] = points[i - 1], [nx, ny] = points[i + 1];
    const k = Math.min(0.4, capH / Math.max(1, py - y)), m = Math.min(0.4, capH / Math.max(1, ny - y));
    const lx = x + (px - x) * k, ly = y + (py - y) * k, rx = x + (nx - x) * m, ry = y + (ny - y) * m;
    // шапка: по склонам вниз и зубчатый край обратно
    const z = (t, d) => `${lx + (rx - lx) * t} ${ly + (ry - ly) * t + d}`;
    s += `<path d="M${x} ${y} L${rx} ${ry} L${z(0.8, -10)} L${z(0.62, 12)} L${z(0.45, -6)} L${z(0.28, 14)} L${z(0.14, -4)} L${lx} ${ly}Z" fill="${snowColor}" opacity=".92"/>`;
  });
  return s;
}
// плавная волна холма через всю ширину
export const hill = (y, amp, color, { phase = 0, x0 = -40, x1 = 1120, bottom = 1100, op = 1 } = {}) =>
  `<path d="M${x0} ${y + Math.sin(phase) * amp} Q${(x0 + x1) * 0.25} ${y - amp + Math.sin(phase + 1) * amp * 0.4} ${(x0 + x1) / 2} ${y + Math.cos(phase) * amp * 0.3} T${x1} ${y + Math.sin(phase + 2) * amp * 0.6} V${bottom} H${x0}Z" fill="${color}" opacity="${op}"/>`;
export const pine = (x, y, h, color = '#2D6A4F', { snow = false, trunk = '#5C4033' } = {}) =>
  `<rect x="${x - h * 0.04}" y="${y - h * 0.12}" width="${h * 0.08}" height="${h * 0.12}" fill="${trunk}"/>` +
  [0, 1, 2].map((i) => { const w = h * (0.5 - i * 0.12), yy = y - h * 0.1 - i * h * 0.26; return `<path d="M${x - w / 2} ${yy} L${x} ${yy - h * 0.42} L${x + w / 2} ${yy}Z" fill="${color}"/>` + (snow ? `<path d="M${x - w * 0.18} ${yy - h * 0.28} L${x} ${yy - h * 0.42} L${x + w * 0.18} ${yy - h * 0.28}Z" fill="#FFFFFF" opacity=".9"/>` : ''); }).join('');
export function forest(rng, x0, x1, y, hmin, hmax, colors, opts = {}) {
  let s = '', x = x0;
  while (x < x1) { const h = hmin + rng() * (hmax - hmin); s += pine(x, y + rng() * 14, h, colors[Math.floor(rng() * colors.length)], opts); x += h * (0.18 + rng() * 0.22); }
  return s;
}
export const tufts = (rng, n, x0, x1, y0, y1, color = '#386641') => Array.from({ length: n }, () => { const x = x0 + rng() * (x1 - x0), y = y0 + rng() * (y1 - y0), h = 10 + rng() * 14; return `<path d="M${x - 8} ${y} Q${x - 6} ${y - h * 0.6} ${x - 10} ${y - h} M${x} ${y} Q${x + 1} ${y - h * 0.7} ${x} ${y - h * 1.2} M${x + 8} ${y} Q${x + 6} ${y - h * 0.6} ${x + 11} ${y - h}" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`; }).join('');
export const flowers = (rng, n, x0, x1, y0, y1, colors = ['#FFD166', '#FF8FA3', '#FFFFFF', '#CDB4DB']) => Array.from({ length: n }, () => `<circle cx="${(x0 + rng() * (x1 - x0)).toFixed(0)}" cy="${(y0 + rng() * (y1 - y0)).toFixed(0)}" r="${(3 + rng() * 5).toFixed(1)}" fill="${colors[Math.floor(rng() * colors.length)]}"/>`).join('');
export const rock = (x, y, w, h, color = '#8D99AE', shade = '#6C7A89') => `<path d="M${x} ${y} L${x + w * 0.12} ${y - h * 0.7} L${x + w * 0.38} ${y - h} L${x + w * 0.7} ${y - h * 0.85} L${x + w * 0.9} ${y - h * 0.45} L${x + w} ${y}Z" fill="${color}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M${x + w * 0.38} ${y - h} L${x + w * 0.5} ${y} M${x + w * 0.7} ${y - h * 0.85} L${x + w * 0.62} ${y - h * 0.3}" stroke="${shade}" stroke-width="3" fill="none"/>`;

// ---------- интерьер ----------
// окно: inner — сцена снаружи в координатах окна (0…w, 0…h)
// part: 'all' | 'glass' (только вид за окном — для живописного фона) | 'frame' (только рама — для чёткого слоя)
export function windowAt(x, y, w, h, inner, { frame = '#5C4033', cross = true, sill = true, part = 'all' } = {}) {
  const id = uid('win');
  const glass = `<defs><clipPath id="${id}"><rect x="0" y="0" width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#${id})">${inner}</g>`;
  if (part === 'glass') return `<g transform="translate(${x} ${y})">${glass}</g>`;
  return `<g transform="translate(${x} ${y})">${part === 'frame' ? '' : glass}` +
    `<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${frame}" stroke-width="16"/>` +
    (cross ? `<path d="M${w / 2} 0 V${h} M0 ${h * 0.45} H${w}" stroke="${frame}" stroke-width="10"/>` : '') +
    (sill ? `<rect x="-20" y="${h}" width="${w + 40}" height="16" rx="3" fill="${frame}"/>` : '') + `</g>`;
}
export function shelf(rng, x, y, w, { wood = '#6B4226', colors = ['#E63946', '#457B9D', '#E9C46A', '#2A9D8F', '#F4A261', '#A8DADC'] } = {}) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="12" fill="${wood}"/>`, xx = x + 6;
  while (xx < x + w - 20) { const bw = 14 + rng() * 18, bh = 46 + rng() * 40; if (rng() < 0.12) { s += `<rect x="${xx}" y="${y - bh * 0.7}" width="${bh * 0.7}" height="${bw}" fill="${colors[Math.floor(rng() * colors.length)]}" transform="rotate(-8 ${xx} ${y})"/>`; xx += bh * 0.6; continue; } s += `<rect x="${xx}" y="${y - bh}" width="${bw}" height="${bh}" fill="${colors[Math.floor(rng() * colors.length)]}" stroke="${L}" stroke-opacity=".35" stroke-width="1.5"/>`; xx += bw + 2; }
  return s;
}
export const floorPlanks = (y, W, color = '#6B4E37', line = '#523A28', H = 1100) => `<rect x="0" y="${y}" width="${W}" height="${H - y}" fill="${color}"/>` + Array.from({ length: 14 }, (_, i) => `<path d="M${i * W / 13} ${y} L${i * W / 13 + (i - 6.5) * 40} ${H}" stroke="${line}" stroke-width="3"/>`).join('') + Array.from({ length: 4 }, (_, i) => `<path d="M0 ${y + 20 + i * i * 14} H${W}" stroke="${line}" stroke-width="2" opacity=".6"/>`).join('');
export const rug = (cx, cy, rx, ry, c = '#8E3B46', c2 = '#E9C46A') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.8}" ry="${ry * 0.72}" fill="none" stroke="${c2}" stroke-width="5" stroke-dasharray="14 10"/>`;
export const desk = (x, y, w, h = 300, top = '#8B5E3C', leg = '#6B4226') => `<rect x="${x}" y="${y}" width="${w}" height="22" rx="4" fill="${top}" stroke="${L}" stroke-width="3"/><rect x="${x + 16}" y="${y + 22}" width="20" height="${h}" fill="${leg}"/><rect x="${x + w - 36}" y="${y + 22}" width="20" height="${h}" fill="${leg}"/><rect x="${x + w * 0.55}" y="${y + 22}" width="${w * 0.42}" height="${h * 0.42}" fill="${leg}" stroke="${L}" stroke-width="2"/><circle cx="${x + w * 0.76}" cy="${y + 22 + h * 0.2}" r="5" fill="#E9C46A"/>`;
export function lamp(x, y, s = 1, on = true) { // x, y — основание на столе
  return (on ? glow(x - 60 * s, y - 120 * s, 260 * s, '#FFE29A', 0.55) : '') +
    `<ellipse cx="${x}" cy="${y}" rx="${34 * s}" ry="${8 * s}" fill="#343A40"/><path d="M${x} ${y} L${x - 10 * s} ${y - 110 * s} L${x - 70 * s} ${y - 150 * s}" stroke="#343A40" stroke-width="${8 * s}" fill="none" stroke-linecap="round"/>` +
    `<path d="M${x - 112 * s} ${y - 128 * s} L${x - 60 * s} ${y - 176 * s} L${x - 36 * s} ${y - 140 * s}Z" fill="#E9C46A" stroke="${L}" stroke-width="3"/>` + (on ? `<path d="M${x - 108 * s} ${y - 130 * s} L${x - 150 * s} ${y - 40 * s} L${x - 20 * s} ${y - 70 * s} L${x - 40 * s} ${y - 140 * s}Z" fill="#FFF3C4" opacity=".22"/>` : '');
}
export function laptop(x, y, w, lines, { screen = '#1E1F29', colors = ['#8BE9FD', '#F8F8F2', '#FF79C6', '#50FA7B', '#F1FA8C'] } = {}) { // x, y — левый край основания
  const h = w * 0.62, fs = w * 0.062;
  return `<path d="M${x - w * 0.06} ${y} L${x + w * 1.06} ${y} L${x + w} ${y - w * 0.04} L${x} ${y - w * 0.04}Z" fill="#ADB5BD" stroke="${L}" stroke-width="2.5"/>` +
    `<rect x="${x}" y="${y - w * 0.04 - h}" width="${w}" height="${h}" rx="8" fill="#343A40" stroke="${L}" stroke-width="3"/><rect x="${x + w * 0.04}" y="${y - w * 0.04 - h + w * 0.04}" width="${w * 0.92}" height="${h - w * 0.08}" fill="${screen}"/>` +
    glow(x + w / 2, y - h * 0.5, w * 0.7, '#8BE9FD', 0.18) +
    lines.map((l, i) => txt(x + w * 0.08, y - h + w * 0.08 + fs * 1.4 * (i + 1), l, fs, colors[i % colors.length], '', SVGM)).join('');
}
// плакат-карта ROADMAP: 7 вершин, пунктир маршрута, отмечено done
export function roadmapPoster(x, y, w, h, done = 0, { paper = '#F4E3B5', ink = '#5C4033' } = {}) {
  let s = `<g transform="translate(${x} ${y}) rotate(-2)"><rect width="${w}" height="${h}" fill="${paper}" stroke="${ink}" stroke-width="4"/><rect x="10" y="10" width="${w - 20}" height="${h - 20}" fill="none" stroke="${ink}" stroke-opacity=".4" stroke-width="2"/>`;
  s += txt(w / 2, 46, 'Go — ROADMAP', w * 0.085, ink, 'text-anchor="middle" font-weight="800"', SVGS);
  const base = h - 30, pk = Array.from({ length: 7 }, (_, i) => [30 + i * (w - 60) / 6, base - 30 - i * (h - 140) / 7]);
  s += `<path d="M14 ${base} ` + pk.map(([px, py], i) => `L${px - 18} ${py + 26 + i * 2} L${px} ${py}`).join(' ') + ` L${w - 14} ${base}Z" fill="#B5838D" opacity=".5"/>`;
  s += `<path d="M${pk.map(([px, py]) => `${px} ${py}`).join(' L')}" stroke="#E63946" stroke-width="3" stroke-dasharray="6 6" fill="none"/>`;
  pk.forEach(([px, py], i) => { s += `<circle cx="${px}" cy="${py}" r="9" fill="${i < done ? '#2A9D8F' : '#FFFDF5'}" stroke="${ink}" stroke-width="2.5"/>` + txt(px, py + 30, String(i + 1), 16, ink, 'text-anchor="middle" font-weight="800"'); });
  s += `<path d="M${pk[6][0]} ${pk[6][1] - 8} V${pk[6][1] - 40}" stroke="${ink}" stroke-width="3"/><path d="M${pk[6][0]} ${pk[6][1] - 40} l22 7 l-22 7z" fill="#E63946"/>`;
  return s + `</g>`;
}

// ---------- реквизит ----------
export function chalkboard(x, y, w, h, lines, { easel = true, frame = '#7F5539', board = '#2D6A4F', fs = 21 } = {}) {
  let s = `<g transform="translate(${x} ${y})">`;
  if (easel) s += `<path d="M${w * 0.12} ${h + 130} L${w * 0.24} -10 M${w * 0.88} ${h + 130} L${w * 0.76} -10 M${w / 2} -10 L${w / 2} ${h + 150}" stroke="${frame}" stroke-width="12" stroke-linecap="round"/>`;
  s += `<rect x="0" y="0" width="${w}" height="${h}" rx="8" fill="${board}" stroke="${frame}" stroke-width="12"/>`;
  s += lines.map((l) => (typeof l === 'string' ? l : txt(l[0], l[1], l[2], l[4] || fs, l[3] || '#E9F5DB', l[5] || '', SVGM))).join('');
  return s + `<path d="M${w - 100} ${h - 20} l26 0" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>`;
}
// стопка книг: list = [[цвет, надпись, цвет надписи]] снизу вверх
export const bookStack = (x, y, list, w = 170) => `<g transform="translate(${x} ${y})">` + list.map(([c, t, ink = '#fff'], i) => `<rect x="${(i % 2) * 10 - 4}" y="${-34 * (i + 1)}" width="${w - (i % 3) * 12}" height="32" rx="4" fill="${c}" stroke="${L}" stroke-width="3"/>${txt((i % 2) * 10 + 12, -34 * (i + 1) + 22, t, 17, ink, 'font-weight="800"')}`).join('') + `</g>`;
export function backpackProp(x, y, s = 1, { c = '#E76F51', open = true, inside = '' } = {}) { // x, y — середина дна
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="M-90 0 Q-100 -150 -60 -170 L60 -170 Q100 -150 90 0Z" fill="${c}" stroke="${L}" stroke-width="4"/>` +
    (open ? `<path d="M-64 -170 Q0 -196 64 -170 L70 -160 Q0 -184 -70 -160Z" fill="#9C4A2F" stroke="${L}" stroke-width="3"/>` + inside : `<path d="M-70 -170 Q0 -110 70 -170" fill="#D85A3A" stroke="${L}" stroke-width="3"/>`) +
    `<rect x="-56" y="-78" width="112" height="64" rx="14" fill="#D85A3A" stroke="${L}" stroke-width="3"/><path d="M-40 -46 H40" stroke="${L}" stroke-width="3"/><rect x="-10" y="-58" width="20" height="10" rx="2" fill="#FFD166" stroke="${L}" stroke-width="2"/></g>`;
}
export function tent(x, y, s = 1, { c = '#F4A261', c2 = '#E76F51', lit = false } = {}) { // x, y — центр основания
  return `<g transform="translate(${x} ${y}) scale(${s})">` + (lit ? glow(0, -60, 220, '#FFB703', 0.35) : '') +
    `<path d="M-170 0 L0 -220 L170 0Z" fill="${c}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/><path d="M0 -220 L-30 0 M0 -220 L30 0" stroke="${L}" stroke-width="3"/>` +
    `<path d="M-30 0 L0 -150 L30 0Z" fill="${lit ? '#FFD166' : '#5C3A21'}"/><path d="M0 -220 L-14 -250 M0 -220 L16 -248" stroke="${L}" stroke-width="4"/><path d="M-170 0 L-210 10 M170 0 L210 10" stroke="${c2}" stroke-width="3"/></g>`;
}
export function campfire(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">` + glow(0, -40, 260, '#FF9F1C', 0.5) +
    `<path d="M-60 0 L60 -20 M-60 -20 L60 0" stroke="#5C4033" stroke-width="16" stroke-linecap="round"/>` +
    `<path d="M-40 -16 Q-46 -70 -10 -110 Q-6 -70 10 -60 Q14 -100 36 -120 Q52 -60 40 -16Z" fill="#FF9F1C" stroke="#E85D04" stroke-width="3"/><path d="M-20 -16 Q-22 -50 0 -76 Q6 -46 22 -16Z" fill="#FFE066"/>` +
    [[-30, -150], [20, -170], [44, -140], [-6, -200], [56, -210]].map(([sx, sy], i) => `<circle cx="${sx}" cy="${sy}" r="${3 + (i % 2) * 2}" fill="#FFD166" opacity=".9"/>`).join('') + `</g>`;
}
export const log = (x, y, w, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="0" y="-34" width="${w}" height="34" rx="17" fill="#7F5539" stroke="${L}" stroke-width="3"/><ellipse cx="${w - 8}" cy="-17" rx="10" ry="16" fill="#C68B59" stroke="${L}" stroke-width="2.5"/></g>`;
// указатель: boards = [[текст, цвет, наклон°, направление ±1]]
export function signpost(x, y, h, boards, { wood = '#7F5539', fs = 26 } = {}) {
  let s = `<rect x="${x - 9}" y="${y - h}" width="18" height="${h}" fill="${wood}" stroke="${L}" stroke-width="3"/>`;
  boards.forEach(([t, c, r = 0, dir = 1], i) => {
    const by = y - h + 20 + i * (fs * 2.2), w = t.length * fs * 0.56 + 40, x0 = dir > 0 ? x - 12 : x - w + 12;
    const tip = dir > 0 ? `L${x0 + w + 24} ${by + fs * 0.8} L${x0 + w} ${by + fs * 1.6}` : `L${x0 + w} ${by + fs * 1.6}`;
    const tail = dir < 0 ? `L${x0 - 24} ${by + fs * 0.8}` : '';
    s += `<g transform="rotate(${r} ${x} ${by + fs * 0.8})"><path d="M${x0} ${by} L${x0 + w} ${by} ${tip} L${x0} ${by + fs * 1.6} ${tail}Z" fill="${c}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>${txt(x0 + 18, by + fs * 1.12, t, fs, '#2B1B17', 'font-weight="800"')}</g>`;
  });
  return s;
}
export const plane = (x, y, s = 1, r = 0, label = '') => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M-30 0 L40 -16 L10 20Z M10 20 L4 36 L18 14" fill="#FFFFFF" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>${label ? `<text x="2" y="4" font-size="12" font-weight="800" fill="#E63946" ${SVGF}>${esc(label)}</text>` : ''}</g>`;
export const trail = (d, { c = '#FFFFFF', w = 3, dash = '7 9', op = 0.9 } = {}) => `<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-dasharray="${dash}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
// лента-баннер с текстом (x, y — центр)
export function ribbon(x, y, w, t, { c = '#E63946', ink = '#FFFFFF', fs = 34, r = 0 } = {}) {
  const h = fs * 1.7;
  return `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M${-w / 2 - 40} ${-h / 2 + 14} L${-w / 2} ${-h / 2 + 14} L${-w / 2} ${h / 2 + 14} L${-w / 2 - 40} ${h / 2 + 14} L${-w / 2 - 24} ${14}Z" fill="${c}" opacity=".75" stroke="${L}" stroke-width="2.5"/>` +
    `<path d="M${w / 2 + 40} ${-h / 2 + 14} L${w / 2} ${-h / 2 + 14} L${w / 2} ${h / 2 + 14} L${w / 2 + 40} ${h / 2 + 14} L${w / 2 + 24} ${14}Z" fill="${c}" opacity=".75" stroke="${L}" stroke-width="2.5"/>` +
    `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${c}" stroke="${L}" stroke-width="3"/>${txt(0, fs * 0.36, t, fs, ink, 'text-anchor="middle" font-weight="900"')}</g>`;
}
// камень у тропы с надписью
export const stone = (x, y, t, { c = '#CED4DA', ink = '#495057', fs = 22 } = {}) => { const w = t.length * fs * 0.64 + 34; return `<g transform="translate(${x} ${y})"><path d="M${-w / 2} 0 Q${-w / 2 - 6} -34 ${-w / 4} -44 Q0 -52 ${w / 4} -46 Q${w / 2 + 8} -36 ${w / 2} 0Z" fill="${c}" stroke="${L}" stroke-width="3"/>${txt(0, -14, t, fs, ink, 'text-anchor="middle" font-weight="800"', SVGM)}</g>`; };
export const pennant = (x, y, h, t, c = '#E63946') => `<path d="M${x} ${y} V${y - h}" stroke="#2B1B17" stroke-width="6" stroke-linecap="round"/><path d="M${x + 3} ${y - h} L${x + 3 + h * 0.62} ${y - h + h * 0.16} L${x + 3} ${y - h + h * 0.32}Z" fill="${c}" stroke="${L}" stroke-width="3"/>${t ? txt(x + 10, y - h + h * 0.2, t, h * 0.11, '#fff', 'font-weight="900"') : ''}`;

// ---------- склад, цех, техника ----------
export const crate = (x, y, w, h, c, label = '', { ink = '#2B1B10', fs = 18, edge = '#0B2E2F', tape = true } = {}) =>
  `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="4" fill="${c}" stroke="${edge}" stroke-width="3"/>` +
  (tape ? `<path d="M0 ${h * 0.3} H${w}" stroke="${edge}" stroke-opacity=".3" stroke-width="2"/><rect x="${w / 2 - 16}" y="${h * 0.3 - 6}" width="32" height="12" fill="#fff" opacity=".35"/>` : '') +
  (label ? txt(w / 2, h * 0.72, label, fs, ink, 'text-anchor="middle" font-weight="800"', SVGM) : '') + `</g>`;
export function gear(x, y, r, teeth, color, { hole = '#00000033', rot = 0 } = {}) {
  let d = '';
  for (let i = 0; i < teeth * 2; i++) { const a = (i / (teeth * 2)) * Math.PI * 2 + rot, R = i % 2 ? r : r * 1.16; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * R).toFixed(1)} ${(y + Math.sin(a) * R).toFixed(1)} `; }
  return `<path d="${d}Z" fill="${color}"/><circle cx="${x}" cy="${y}" r="${r * 0.35}" fill="${hole}"/>`;
}
export function conveyor(x0, x1, y, { h = 34, belt = '#343A40', frame = '#6C757D', legs = 160 } = {}) {
  let s = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" rx="${h / 2}" fill="${belt}" stroke="${L}" stroke-width="3"/>`;
  for (let x = x0 + h / 2; x < x1; x += 46) s += `<circle cx="${x}" cy="${y + h / 2}" r="${h * 0.32}" fill="${frame}" stroke="${L}" stroke-width="2"/>`;
  for (let x = x0 + 40; x < x1; x += 220) s += `<rect x="${x}" y="${y + h}" width="16" height="${legs}" fill="${frame}" stroke="${L}" stroke-width="2"/>`;
  return s;
}
export function forklift(x, y, s = 1, { c = '#FFB703', load = '' } = {}) { // x, y — точка на земле под задним колесом
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<rect x="-10" y="-120" width="150" height="80" rx="10" fill="${c}" stroke="${L}" stroke-width="4"/><path d="M10 -120 L20 -200 L110 -200 L118 -120" fill="none" stroke="${L}" stroke-width="7"/>` +
    `<rect x="140" y="-230" width="12" height="230" fill="#495057" stroke="${L}" stroke-width="2"/><rect x="152" y="-40" width="90" height="10" fill="#495057" stroke="${L}" stroke-width="2"/>` +
    load + `<circle cx="20" cy="-14" r="24" fill="#212529"/><circle cx="20" cy="-14" r="9" fill="#ADB5BD"/><circle cx="110" cy="-14" r="24" fill="#212529"/><circle cx="110" cy="-14" r="9" fill="#ADB5BD"/></g>`;
}
