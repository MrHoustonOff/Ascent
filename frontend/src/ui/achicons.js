// Иконки достижений: линейные, 24×24, штрих 1.7, currentColor.
const P = {
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.4 2.4M15.6 15.6L18 18M18 6l-2.4 2.4M8.4 15.6L6 18"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z"/>',
  layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>',
  bolt: '<path d="M13 3L5.5 13.2H11L10 21l8-10.5h-5.6z"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z"/>',
  crown: '<path d="M4 8l4 4 4-6 4 6 4-4-1.6 10H5.6z"/><path d="M5.6 20.5h12.8"/>',
  flag: '<path d="M6 21V4M6 5h11l-2.2 3.5L17 12H6"/>',
  peak: '<path d="M2.5 19.5L9.5 7l3.5 6 2-3 6.5 9.5z"/><path d="M9.5 7l1.5 2.6"/>',
  twin: '<circle cx="8.5" cy="12" r="5"/><circle cx="15.5" cy="12" r="5"/>',
  rocket: '<path d="M12 3c3.5 2 5 5.5 4.5 10l-2 2.5h-5L7.5 13C7 8.5 8.5 5 12 3z"/><circle cx="12" cy="9.5" r="1.6"/><path d="M9.5 15.5L7 19M14.5 15.5L17 19M12 17v4"/>',
  flame: '<path d="M12.6 2.8c.3 3.6 4.9 5.8 4.9 11a5.5 5.5 0 0 1-11 0c0-2.2 1.1-3.7 2.3-4.8.1 1.6.8 2.6 1.9 3 .5-2.4 1.5-5.4 1.9-9.2z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8.5 14.5l2 2 4-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/>',
  wave: '<path d="M3 15c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M3 9.5c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
  block: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 12.3l2.5 2.5 4.6-5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  db: '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6"/>',
  net: '<circle cx="12" cy="5.5" r="2.3"/><circle cx="5.5" cy="18" r="2.3"/><circle cx="18.5" cy="18" r="2.3"/><path d="M11 7.6L6.6 15.8M13 7.6l4.4 8.2M8 18h8"/>',
  term: '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M7.5 10l3 2.5-3 2.5M13 15h4"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.3l2.8 2.8 5.2-5.6"/>',
  box: '<path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2z"/><path d="M4 7.2l8 4.3 8-4.3M12 11.5V21"/>',
  queue: '<rect x="3" y="8" width="5" height="8" rx="1.6"/><rect x="9.5" y="8" width="5" height="8" rx="1.6"/><path d="M17 12h4M19.2 9.8L21.4 12l-2.2 2.2"/>',
  chat: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z"/><path d="M8 8.5h8M8 11.5h5"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  sunrise: '<path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 5v3M4.8 9.8l1.8 1.8M19.2 9.8l-1.8 1.8"/>',
  return: '<path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h9.5a5 5 0 0 1 0 10H12"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5c0 3 1.5 4.5 3.7 4.8M16 6h3.5c0 3-1.5 4.5-3.7 4.8M12 13v4M8.5 20.5h7M9.5 17h5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
};

export function achSvg(key, size = 28) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', size);
  s.setAttribute('height', size);
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.7');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  const m = /^stage(\d)$/.exec(key);
  if (m) {
    s.innerHTML = '<path d="M12 3l7.5 3.2v5.6c0 4.3-3 7.6-7.5 9.2-4.5-1.6-7.5-4.9-7.5-9.2V6.2z"/>' +
      `<text x="12" y="15.4" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor" stroke="none" font-family="-apple-system,Segoe UI,sans-serif">${m[1]}</text>`;
  } else s.innerHTML = P[key] || P.star;
  return s;
}

export const trophyPath = P.trophy;
