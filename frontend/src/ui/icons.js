// Линейные иконки 16px, штрих 1.6, currentColor (as-icon из дизайн-системы).
const P = {
  today: '<circle cx="8" cy="8" r="3"/><path d="M8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M12.4 3.6l-1 1M4.6 11.4l-1 1"/>',
  path: '<circle cx="3.6" cy="12.4" r="1.6"/><circle cx="12.4" cy="3.6" r="1.6"/><path d="M5.2 12.4h4.2a2.2 2.2 0 0 0 0-4.4H6.6a2.2 2.2 0 0 1 0-4.4h4.2"/>',
  stats: '<path d="M2.5 13.5h11"/><path d="M4.5 13.5V8.5M8 13.5V3.5M11.5 13.5V6.5"/>',
  bank: '<circle cx="8" cy="8" r="6"/><path d="M6.2 6.3a1.9 1.9 0 1 1 2.6 1.8c-.6.3-.8.7-.8 1.3"/><path d="M8 11.6v.1"/>',
  glossary: '<path d="M3 3.2A1.2 1.2 0 0 1 4.2 2H12v10.5H4.2A1.2 1.2 0 0 0 3 13.7z"/><path d="M3 13.7A1.2 1.2 0 0 0 4.2 14.8H12"/>',
  docs: '<path d="M4 1.8h5.2L12.4 5v9.2H4z"/><path d="M9 1.8V5.2h3.4M6 8.4h4.4M6 11h4.4"/>',
  settings: '<path d="M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6"/><circle cx="10" cy="4.5" r="1.5"/><circle cx="6" cy="11.5" r="1.5"/>',
  copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.8"/><path d="M10.5 5.5V4.3A1.8 1.8 0 0 0 8.7 2.5H4.3a1.8 1.8 0 0 0-1.8 1.8v4.4a1.8 1.8 0 0 0 1.8 1.8h1.2"/>',
  note: '<path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h7A1.5 1.5 0 0 1 13 3.5v7L9.5 14h-5A1.5 1.5 0 0 1 3 12.5z"/><path d="M9.5 14v-2.5a1 1 0 0 1 1-1H13M5.5 5.5h5M5.5 8h3"/>',
  play: '<path d="M5 3.2v9.6L12.6 8z" fill="currentColor"/>',
  chevR: '<path d="M6 3.5L10.5 8 6 12.5"/>',
  chevD: '<path d="M3.5 6L8 10.5 12.5 6"/>',
  chevL: '<path d="M10 3.5L5.5 8l4.5 4.5"/>',
  search: '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>',
  sidebar: '<rect x="2" y="3" width="12" height="10" rx="2"/><path d="M6.2 3v10"/>',
  link: '<path d="M6.5 9.5l3-3M7 4.6l.9-.9a2.5 2.5 0 0 1 3.5 3.5l-.9.9M9 11.4l-.9.9a2.5 2.5 0 0 1-3.5-3.5l.9-.9"/>',
  arrowR: '<path d="M3 8h10M9 4l4 4-4 4"/>',
  external: '<path d="M9 3h4v4M13 3L7.5 8.5M11 9.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2.5"/>',
  close: '<path d="M4 4l8 8M12 4l-8 8"/>',
  trophy: '<path d="M4.5 2.5h7v4a3.5 3.5 0 0 1-7 0z"/><path d="M4.5 4H2.5c0 2 1 3 2.2 3.2M11.5 4h2c0 2-1 3-2.2 3.2M8 10v2.5M5.5 13.5h5"/>',
  share: '<path d="M8 2.5v8M5 5.5l3-3 3 3"/><path d="M4.5 8H4a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 12 8h-.5"/>',
  folder: '<path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.4 1.6h5A1.5 1.5 0 0 1 14 6.1v5.4a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5z"/>',
};

export function icon(name, cls = '') {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 16 16');
  s.setAttribute('class', 'as-icon' + (cls ? ' ' + cls : ''));
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = P[name] || '';
  return s;
}

export const CHECK_GLYPH = '<svg class="as-glyph" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.8 5.4l2.2 2.2 4.4-4.8"/></svg>';
export const DASH_GLYPH = '<svg class="as-glyph" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5h6"/></svg>';
export const FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.6 2.2c.3 3.6 4.9 5.8 4.9 11a5.5 5.5 0 0 1-11 0c0-2.2 1.1-3.7 2.3-4.8.1 1.6.8 2.6 1.9 3C10 7.3 11 4.3 12.6 2.2z"/></svg>';

// Круглый индикатор состояния (as-state) из дизайн-системы.
export function stateDot(state) {
  const s = document.createElement('span');
  s.className = 'as-state as-state--' + state;
  if (state === 'done') s.innerHTML = CHECK_GLYPH;
  return s;
}
