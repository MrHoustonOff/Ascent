// Гофер по официальному model sheet (Renée French).
// Силуэт — «бобинка»: узкий купол головы, щёки чуть шире, едва заметная талия и тяжёлый круглый низ;
// в профиль — наклонённая вперёд фасолина с выступающей мордочкой и хвостиком. Прямых линий нет.
// Огромные глаза вплотную, крошечные ушки, песочная мордочка с тёмным носом и зубами, лапки — капельки.
// Эмоции — только формой глаз, без бровей. Контур слегка дрожит, как карандашный (фильтр), с двойным штрихом.
//
// gopherSVG(opts) → строка SVG, viewBox 0 0 200 240. Классы для CSS-анимации:
// g-arm-l / g-arm-r (лапки, вращаются вокруг плеча), g-pupils, g-lids (верхние веки, scaleY 0…1).
//
// opts:
//   width  — ширина, px
//   view   — 'front' | 'side' (профиль вправо; 'three' — то же)
//   eyes   — 'open' | 'wide' | 'happy' | 'sleepy' | 'closed' | 'up' | 'down' | 'derp' (глаза в разные стороны)
//   look   — сдвиг зрачков: -1…1
//   arms   — 'down' | 'up' | 'wave' | 'hold' | 'hips' | 'out'
//   teeth  — 2 | 1
//   item   — SVG предмета в лапках (между телом и лапками)
//   extra  — SVG поверх (шапка, пот, линии движения)
//   sketch — карандашная дрожь и зерно (по умолчанию да; для 16 px выключать)
//   flip   — зеркально
export const GOPHER = {
  body: '#7FD4EA', shade: '#3FA9C6', line: '#2E2622', tan: '#F2D3AE', nose: '#3A2A22',
  tooth: '#FFFCF2', white: '#FFFFFF', ear: '#E8B496',
};
const C = GOPHER;
const SW = 2.6;

// силуэты
const FRONT = 'M100 14C140 13 166 30 172 62C177 88 176 108 171 128C167 150 167 168 166 186C163 212 134 224 100 224C66 224 37 212 34 186C33 168 33 150 29 128C24 108 23 88 28 62C34 30 60 15 100 14Z';
const SIDE = 'M90 15C132 9 167 32 172 68C176 93 169 113 165 131C161 153 164 173 156 193C146 216 112 226 84 220C56 214 41 195 41 166C41 141 34 119 34 92C34 50 56 21 90 15Z';

// сидя: живот складывается, тело ниже на 12 %
const SIT = FRONT.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${x} ${(14 + (y - 14) * 0.84).toFixed(1)}`);
let uid = 0;
const nub = (x, y, rot, k = 1) => `<path d="M${x} ${y - 13}C${x + 7} ${y - 13} ${x + 8} ${y - 2} ${x + 6} ${y + 6}C${x + 4} ${y + 13} ${x - 4} ${y + 13} ${x - 6} ${y + 6}C${x - 8} ${y - 2} ${x - 7} ${y - 13} ${x} ${y - 13}Z" transform="rotate(${rot} ${x} ${y}) translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})" fill="${C.tan}" stroke="${C.line}" stroke-width="2.1" stroke-linejoin="round"/>`;
const ARMS = { down: [0, 0], up: [155, -155], wave: [0, -155], hold: [-80, 80], hips: [-42, 42], out: [62, -62] };

function eye(cx, cy, r, mode, look, pr = 8.5) {
  const px = cx + look * r * 0.34;
  const base = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.white}" stroke="${C.line}" stroke-width="${SW}"/>`;
  const pupil = (x, y, rr = pr) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="#141414"/><circle cx="${x - rr * 0.35}" cy="${y - rr * 0.4}" r="${rr * 0.32}" fill="#fff"/>`;
  // веко — часть круга глаза цветом тела с изогнутым краем
  const lid = (edgeY, top, bow) => {
    const w = Math.sqrt(Math.max(0, r * r - (edgeY - cy) ** 2));
    const big = top ? (edgeY > cy ? 1 : 0) : (edgeY < cy ? 1 : 0);
    return `<path d="M${cx - w} ${edgeY}A${r} ${r} 0 ${big} ${top ? 1 : 0} ${cx + w} ${edgeY}Q${cx} ${top ? edgeY + bow : edgeY - bow} ${cx - w} ${edgeY}Z" fill="${C.body}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>`;
  };
  switch (mode) {
    case 'closed': return `<path d="M${cx - r * 0.7} ${cy + 3}Q${cx} ${cy + r * 0.55} ${cx + r * 0.7} ${cy + 3}" stroke="${C.line}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'happy': return base + pupil(px, cy - r * 0.2) + lid(cy + r * 0.56, false, r * 0.2);
    case 'sleepy': return base + pupil(px, cy + r * 0.38) + lid(cy - r * 0.2, true, r * 0.28);
    case 'wide': return base + pupil(cx + look * r * 0.2, cy, pr * 0.55);
    case 'derpL': return base + pupil(cx - r * 0.5, cy - r * 0.45, pr * 1.15); // косит: левый глаз вверх-наружу
    case 'derpR': return base + pupil(cx - r * 0.38, cy + r * 0.52, pr * 0.7); // правый вниз к носу
    case 'up': return base + pupil(px, cy - r * 0.42);
    case 'down': return base + pupil(px, cy + r * 0.45);
    default: return base + pupil(px, cy + r * 0.15);
  }
}

export function gopherSVG(opts = {}) {
  const { width = 100, eyes = 'open', look = 0, arms = 'down', teeth = 2, item = '', extra = '', sketch = true, flip = false,
    tilt = 0, squash = 1, lift = 0, feet: feetMode = 'stand', back = '' } = opts;
  const side = opts.view === 'side' || opts.view === 'three';
  const sit = opts.view === 'sit';
  const [al, ar] = Array.isArray(arms) ? arms : (ARMS[arms] || ARMS.down);
  const id = 'gph' + (++uid);
  // поднятая лапка скользит вверх по боку к щеке: отростки короткие, одного поворота мало
  const armT = (a) => {
    const k = Math.max(0, Math.abs(a) - 90);
    return `translate(${(-Math.sign(a) * k * 0.26).toFixed(1)}px,${(-k * 0.7).toFixed(1)}px) rotate(${a}deg)`;
  };
  const body = side ? SIDE : sit ? SIT : FRONT;
  const ln = (w = 2.1) => `stroke="${C.line}" stroke-width="${w}"`;

  // карандаш: дрожь контура и зерно заливки
  const defs = `<defs>` +
    (sketch ? `<filter id="${id}w" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>` +
      `<filter id="${id}g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="n"/>` +
      `<feColorMatrix in="n" type="matrix" values="0 0 0 0 .05  0 0 0 0 .32  0 0 0 0 .45  1.6 0 0 0 -.78" result="d"/>` +
      `<feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 -1.6 0 0 .82" result="l"/>` +
      `<feMerge><feMergeNode in="d"/><feMergeNode in="l"/></feMerge><feComposite in2="SourceGraphic" operator="in"/></filter>` : '') + `</defs>`;

  const ears = side
    ? `<circle cx="66" cy="31" r="12.5" fill="${C.body}" ${ln(SW)}/><path d="M60 27q4-6 10-3" stroke="${C.ear}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : `<circle cx="41" cy="36" r="12.5" fill="${C.body}" ${ln(SW)}/><circle cx="38" cy="33" r="5" fill="${C.ear}"/>` +
      `<circle cx="159" cy="36" r="12.5" fill="${C.body}" ${ln(SW)}/><circle cx="162" cy="33" r="5" fill="${C.ear}"/>`;
  const foot = (x, y, rot, rx = 14) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="7" transform="rotate(${rot} ${x} ${y})" fill="${C.tan}" ${ln()}/>`;
  const FEET = side
    ? { stand: [[80, 221, -8], [130, 219, 10]], walk: [[66, 214, -42], [142, 222, 14]], jump: [[78, 226, -62], [128, 226, -40]] }
    : { stand: [[74, 221, -10], [126, 221, 10]], walk: [[70, 213, -38], [128, 222, 8]], jump: [[80, 227, -64], [120, 227, 64]] };
  const feetFront = sit ? foot(76, 197, -14, 15) + foot(124, 197, 14, 15) : '';
  const feet = sit ? '' : (FEET[feetMode] || FEET.stand).map(([x, y, r]) => foot(x, y, r)).join('');
  const tail = side ? `<path d="M44 178C32 176 28 188 38 194C43 197 48 194 50 190" fill="${C.body}" ${ln()}/>` : '';
  const armL = side
    ? `<g class="g-arm-l" style="transform-origin:108px 142px;transform:${armT(al)}">${nub(106, 155, 14)}</g>`
    : `<g class="g-arm-l" style="transform-origin:35px 140px;transform:${armT(al)}">${nub(29, 152, 26)}</g>`;
  const armR = side
    ? `<g class="g-arm-r" style="transform-origin:160px 138px;transform:${armT(ar)}">${nub(165, 150, -24)}</g>`
    : `<g class="g-arm-r" style="transform-origin:165px 140px;transform:${armT(ar)}">${nub(171, 152, -26)}</g>`;

  // глаза: в профиль дальний глаз выглядывает над лбом и заходит за ближний
  const ey = side ? 62 : 72;
  const eyesSvg = side
    ? `<g class="g-eyes">${eye(156, ey - 9, 22, eyes, Math.max(look, 0.55), 6.5)}${eye(117, ey, 33, eyes, Math.max(look, 0.55))}</g>`
    : `<g class="g-eyes">${eye(67, ey, 33, eyes === 'derp' ? 'derpL' : eyes, look === 0 ? -0.45 : look)}${eye(133, ey, 33, eyes === 'derp' ? 'derpR' : eyes, look === 0 ? 0.45 : look)}</g>`;
  const lids = side ? '' : `<g class="g-lids" style="transform-origin:100px 39px;transform:scaleY(0)">` +
    `<circle cx="67" cy="${ey}" r="33" fill="${C.body}" ${ln(SW)}/><circle cx="133" cy="${ey}" r="33" fill="${C.body}" ${ln(SW)}/></g>`;

  // мордочка: «фасолинка» с тёмным носом, под ней зубы
  const mx = side ? 168 : 100, my = side ? 96 : 104;
  const tooth = (x, w, hh) => `<rect x="${x}" y="${my + 1}" width="${w}" height="${hh}" rx="1.6" fill="${C.tooth}" ${ln(1.8)}/>`;
  const teethSvg = side ? (teeth === 1 ? tooth(mx - 5, 10, 15) : tooth(mx - 9, 9, 15) + tooth(mx, 9, 15))
    : (teeth === 1 ? tooth(mx - 5, 10, 15) : tooth(mx - 9, 9, 15) + tooth(mx, 9, 15));
  const muzzle = side
    ? `<path d="M${mx - 18} ${my - 3}C${mx - 18} ${my - 15} ${mx + 4} ${my - 18} ${mx + 13} ${my - 10}C${mx + 19} ${my - 4} ${mx + 14} ${my + 8} ${mx + 2} ${my + 8}C${mx - 8} ${my + 9} ${mx - 18} ${my + 6} ${mx - 18} ${my - 3}Z" fill="${C.tan}" ${ln()}/>` +
      `<ellipse cx="${mx + 8}" cy="${my - 9}" rx="8" ry="5.6" fill="${C.nose}" transform="rotate(-12 ${mx + 8} ${my - 9})"/>`
    : `<path d="M${mx - 17} ${my - 4}C${mx - 18} ${my - 15} ${mx + 18} ${my - 15} ${mx + 17} ${my - 4}C${mx + 16} ${my + 7} ${mx + 7} ${my + 9} ${mx} ${my + 6}C${mx - 7} ${my + 9} ${mx - 16} ${my + 7} ${mx - 17} ${my - 4}Z" fill="${C.tan}" ${ln()}/>` +
      `<ellipse cx="${mx}" cy="${my - 9}" rx="9.5" ry="6.3" fill="${C.nose}"/><ellipse cx="${mx - 3}" cy="${my - 11.5}" rx="3" ry="1.5" fill="#fff" opacity=".5"/>`;

  // тело: заливка, объём, зерно, контур двойным карандашным штрихом
  const torso = `<path d="${body}" fill="${C.body}"/>` +
    (sketch ? `<path d="${body}" fill="#000" filter="url(#${id}g)" opacity=".55"/>` : '') +
    (sit ? `<path d="M48 170Q100 190 152 170" fill="none" ${ln(2.2)} stroke-linecap="round"/>` : '') +
    `<path d="${body}" fill="none" ${ln(SW)} stroke-linejoin="round"/>` +
    (sketch ? `<path d="${body}" fill="none" stroke="${C.line}" stroke-width="1" stroke-opacity=".35" transform="translate(1.2 .8)"/>` : '');

  const drawing = back + ears + feet + tail + (side ? armR : '') + torso + feetFront + eyesSvg + lids + teethSvg + muzzle + item + armL + (side ? '' : armR);
  // живость: наклон, сжатие-растяжение (объём сохраняется) и подскок; тень остаётся на земле
  const sx = (1 / squash).toFixed(3), base = sit ? 202 : 226;
  const pose = tilt || squash !== 1 || lift
    ? ` transform="translate(100 ${base - lift}) rotate(${tilt}) scale(${sx} ${squash}) translate(-100 ${-base})"` : '';
  const shadow = lift ? `<ellipse cx="100" cy="${base + 2}" rx="${Math.max(24, 56 - lift * 0.5)}" ry="6" fill="#000" opacity="${Math.max(0.06, 0.16 - lift / 400)}"/>` : '';
  return `<svg width="${width}" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="overflow:visible${flip ? ';transform:scaleX(-1)' : ''}">` +
    defs + shadow + `<g${pose}><g${sketch ? ` filter="url(#${id}w)"` : ''}>${drawing}</g>${extra}</g></svg>`;
}

// Иконка приложения: песочная плитка, гофер крупно выглядывает снизу.
export function appIconSVG(size = 1024) {
  const g = gopherSVG({ look: 0.6, sketch: size >= 64 }).replace(/<svg[^>]*>/, '').replace('</svg>', '').replace(/<g class="g-lids".*?<\/g>/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">` +
    `<defs><linearGradient id="ascent-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6DCB6"/><stop offset="1" stop-color="#EAB97B"/></linearGradient>` +
    `<clipPath id="ascent-clip"><rect width="100" height="100" rx="22.5"/></clipPath></defs>` +
    `<rect width="100" height="100" rx="22.5" fill="url(#ascent-bg)"/>` +
    `<g clip-path="url(#ascent-clip)"><g transform="translate(-2 22) scale(0.52)">${g}</g></g></svg>`;
}

// Готовые позы-реакции: экспорт и другие экраны выбирают из них (в том числе случайно).
export const POSES = {
  idle: { label: 'стоит', opts: {} },
  wave: { label: 'машет', opts: { arms: 'wave', eyes: 'happy', tilt: -4 } },
  cheer: { label: 'ура!', opts: { arms: 'up', eyes: 'happy', lift: 26, squash: 1.06, feet: 'jump' } },
  jump: { label: 'прыжок', opts: { arms: [120, -120], eyes: 'wide', lift: 40, squash: 1.1, feet: 'jump' } },
  land: { label: 'приземлился', opts: { arms: 'out', eyes: 'closed', squash: 0.84 } },
  run: { label: 'бежит', opts: { view: 'side', arms: [60, -70], feet: 'walk', tilt: 8, lift: 6 } },
  walk: { label: 'идёт', opts: { view: 'side', arms: [30, -30], feet: 'walk', tilt: 3 } },
  sit: { label: 'сидит', opts: { view: 'sit', arms: 'hold', eyes: 'up' } },
  think: { label: 'думает', opts: { arms: [0, 128], eyes: 'up', look: -0.6, tilt: 5 } },
  shrug: { label: 'пожимает плечами', opts: { arms: [95, -95], eyes: 'sleepy', tilt: -3 } },
  point: { label: 'показывает', opts: { arms: [0, -88], look: 1, tilt: 4 } },
  dance: { label: 'танцует', opts: { arms: [150, -40], eyes: 'happy', feet: 'walk', tilt: 10 } },
  oops: { label: 'ой!', opts: { arms: [150, -150], eyes: 'wide', tilt: -16, feet: 'walk' } },
  proud: { label: 'гордится', opts: { arms: 'hips', eyes: 'happy', squash: 1.04 } },
  tired: { label: 'устал', opts: { arms: [-10, 10], eyes: 'sleepy', squash: 0.93, tilt: 6 } },
  derp: { label: 'тупит', opts: { eyes: 'derp', teeth: 1, tilt: -9, arms: [8, -20], squash: 0.97 } },
  sleep: { label: 'спит', opts: { view: 'sit', eyes: 'closed', tilt: 8 } },
};
