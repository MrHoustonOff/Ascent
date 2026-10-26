// Гофер в классических пропорциях: «фасолина», большие глаза вплотную, морда с зубами, ручки и ножки, тёмный контур.
// Возвращает строку SVG: используется в табличке масштаба и в tools/icon.mjs для иконки приложения.
// Части помечены классами, чтобы CSS мог их анимировать: g-arm-l/g-arm-r, g-eyes, g-pupils, g-lids.
export function gopherSVG({ width = 100, look = 0 } = {}) {
  const O = '#18343d', B = '#6AD7E5', T = '#F4D3A6', px = look * 3;
  const eye = (cx) => `<circle cx="${cx}" cy="42" r="17" fill="#fff" stroke="${O}" stroke-width="2.6"/>`;
  const pupil = (cx) => `<circle cx="${cx + 4 + px}" cy="44" r="6.5" fill="#111"/><circle cx="${cx + 6 + px}" cy="41.5" r="2" fill="#fff"/>`;
  const lid = (cx) => `<path d="M${cx - 17} 42a17 17 0 0 1 34 0z" fill="${B}" stroke="${O}" stroke-width="2.6"/>`;
  return `<svg width="${width}" viewBox="0 0 120 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="overflow:visible">` +
    `<circle cx="27" cy="21" r="9" fill="${B}" stroke="${O}" stroke-width="2.6"/><circle cx="27" cy="21" r="4" fill="#3FB0C2"/>` +
    `<circle cx="93" cy="21" r="9" fill="${B}" stroke="${O}" stroke-width="2.6"/><circle cx="93" cy="21" r="4" fill="#3FB0C2"/>` +
    `<g class="g-arm-l" style="transform-origin:18px 78px"><ellipse cx="13" cy="84" rx="6" ry="9" transform="rotate(25 13 84)" fill="${T}" stroke="${O}" stroke-width="2.4"/></g>` +
    `<g class="g-arm-r" style="transform-origin:102px 78px"><ellipse cx="107" cy="84" rx="6" ry="9" transform="rotate(-25 107 84)" fill="${T}" stroke="${O}" stroke-width="2.4"/></g>` +
    `<ellipse cx="40" cy="143" rx="11" ry="6" fill="${T}" stroke="${O}" stroke-width="2.4"/><ellipse cx="80" cy="143" rx="11" ry="6" fill="${T}" stroke="${O}" stroke-width="2.4"/>` +
    `<path d="M60 9C94 9 107 33 106 68c-1 30 0 55-15 69-12 10-50 10-62 0C14 123 15 98 14 68 13 33 26 9 60 9z" fill="${B}" stroke="${O}" stroke-width="2.8"/>` +
    `<path d="M30 120c8 9 52 9 60 0" stroke="#4FC3D6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>` +
    `<g class="g-eyes">${eye(41)}${eye(79)}<g class="g-pupils">${pupil(41)}${pupil(79)}</g>` +
    `<g class="g-lids" style="transform-origin:60px 25px;transform:scaleY(0)">${lid(41)}${lid(79)}</g></g>` +
    `<ellipse cx="60" cy="65" rx="12.5" ry="9" fill="${T}" stroke="${O}" stroke-width="2.4"/>` +
    `<ellipse cx="60" cy="59" rx="6.5" ry="4.3" fill="#3a2a22"/>` +
    `<rect x="55.5" y="70" width="9" height="9" rx="1.6" fill="#fff" stroke="${O}" stroke-width="1.8"/><path d="M60 70v9" stroke="${O}" stroke-width="1.4"/>` +
    `</svg>`;
}

// Иконка приложения (вариант 3): песочная плитка, гофер крупно выглядывает снизу.
export function appIconSVG(size = 1024) {
  // веки не нужны: без CSS их нельзя спрятать надёжно в любом просмотрщике
  const g = gopherSVG({ look: 1 }).replace(/<svg[^>]*>/, '').replace('</svg>', '').replace(/<g class="g-lids".*?<\/g>/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">` +
    `<defs><linearGradient id="ascent-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4D3A6"/><stop offset="1" stop-color="#E9B97C"/></linearGradient>` +
    `<clipPath id="ascent-clip"><rect width="100" height="100" rx="22.5"/></clipPath></defs>` +
    `<rect width="100" height="100" rx="22.5" fill="url(#ascent-bg)"/>` +
    `<g clip-path="url(#ascent-clip)"><g transform="translate(2 30) scale(0.8)">${g}</g></g></svg>`;
}
