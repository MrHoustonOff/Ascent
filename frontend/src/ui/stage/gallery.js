// Особые картины галереи: передний/задний план (back, front) для холста маслом.
import { L, SVGF, SVGM, SVGS, esc, txt, rngFrom, gopherAt, dressed, items, hats, clawd, CI, csign } from './kit.js';
const stars = (rng, n, W, H, fill, rmax = 2.2) => Array.from({ length: n }, () => `<circle cx="${(rng() * W).toFixed(0)}" cy="${(rng() * H).toFixed(0)}" r="${(0.6 + rng() * rmax).toFixed(1)}" fill="${fill}" opacity="${(0.3 + rng() * 0.7).toFixed(2)}"/>`).join('');
const confetti = (rng, W, H, n = 70) => Array.from({ length: n }, () => { const x = rng() * W, y = rng() * H, c = ['#E63946', '#FFD166', '#00ADD8', '#90BE6D', '#F28482', '#FFFFFF'][Math.floor(rng() * 6)]; return `<rect x="${x}" y="${y}" width="${8 + rng() * 10}" height="${4 + rng() * 6}" fill="${c}" transform="rotate(${rng() * 180} ${x} ${y})" opacity=".95"/>`; }).join('');

export const GALLERY = {
  algo: {
    title: 'Начинаю решать алгоритмы', wall: ['#14213D', '#0B132B'], frame: 'silver', ink: '#E5ECF4',
    back: (W, H, rng) => {
      let s = `<defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1D2D50"/><stop offset="1" stop-color="#2E4A7A"/></linearGradient>` +
        `<radialGradient id="gal" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD98E" stop-opacity=".75"/><stop offset="1" stop-color="#FFD98E" stop-opacity="0"/></radialGradient></defs>` +
        `<rect width="${W}" height="${H}" fill="url(#ga)"/>`;
      // окно с ночным небом и луной
      s += `<rect x="${W * 0.62}" y="${H * 0.06}" width="${W * 0.3}" height="${H * 0.26}" fill="#0B1026" stroke="#5C4033" stroke-width="16"/>` + stars(rng, 40, W * 0.28, H * 0.24, '#FFFFFF', 1.6).replace(/cx="(\d+)" cy="(\d+)"/g, (_, a, b) => `cx="${+a + W * 0.63}" cy="${+b + H * 0.07}"`) +
        `<circle cx="${W * 0.84}" cy="${H * 0.13}" r="${W * 0.05}" fill="#FFF3C4"/><circle cx="${W * 0.86}" cy="${H * 0.12}" r="${W * 0.045}" fill="#0B1026"/>` +
        `<path d="M${W * 0.77} ${H * 0.06} V${H * 0.32} M${W * 0.62} ${H * 0.19} H${W * 0.92}" stroke="#5C4033" stroke-width="10"/>`;
      // полки с книгами
      for (let r = 0; r < 3; r++) { const y = H * (0.4 + r * 0.1); s += `<rect x="${W * 0.62}" y="${y}" width="${W * 0.34}" height="10" fill="#6B4226"/>`; let x = W * 0.63; while (x < W * 0.95) { const bw = 14 + rng() * 18, bh = 50 + rng() * 40; s += `<rect x="${x}" y="${y - bh}" width="${bw}" height="${bh}" fill="${['#E63946', '#457B9D', '#E9C46A', '#2A9D8F', '#F4A261', '#A8DADC'][Math.floor(rng() * 6)]}"/>`; x += bw + 3; } }
      s += `<circle cx="${W * 0.7}" cy="${H * 0.66}" r="${W * 0.45}" fill="url(#gal)"/>`;
      s += `<rect x="0" y="${H * 0.78}" width="${W}" height="${H * 0.22}" fill="#3B2A1E"/>`;
      return s;
    },
    front: (W, H) => {
      const dy = H * 0.78;
      let s = `<g transform="translate(${W * 0.06} ${H * 0.06})"><rect width="${W * 0.5}" height="${H * 0.34}" rx="8" fill="#F8F9FA" stroke="#ADB5BD" stroke-width="10"/>`;
      const bw = W * 0.5, bh = H * 0.34;
      const tn = [[0.5, 0.14], [0.28, 0.34], [0.72, 0.34], [0.16, 0.56], [0.4, 0.56], [0.6, 0.56], [0.84, 0.56]];
      [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]].forEach(([a, b]) => { s += `<path d="M${tn[a][0] * bw} ${tn[a][1] * bh} L${tn[b][0] * bw} ${tn[b][1] * bh}" stroke="#264653" stroke-width="3"/>`; });
      tn.forEach(([x, y], i) => { s += `<circle cx="${x * bw}" cy="${y * bh}" r="${bw * 0.045}" fill="${i ? '#FFFFFF' : '#FFD166'}" stroke="#264653" stroke-width="3"/><text x="${x * bw}" y="${y * bh + 6}" text-anchor="middle" font-size="${bw * 0.04}" font-weight="700" fill="#264653" ${SVGM}>${[8, 3, 10, 1, 6, 9, 14][i]}</text>`; });
      s += txt(bw * 0.06, bh * 0.8, 'O(n log n)', bw * 0.07, '#E63946', 'font-weight="800"', SVGM) + txt(bw * 0.55, bh * 0.8, 'BFS · DP · ⇄', bw * 0.055, '#2A9D8F', 'font-weight="700"', SVGM) +
        txt(bw * 0.06, bh * 0.93, 'dp[i] = max(dp[i-1], dp[i-2]+a[i])', bw * 0.042, '#457B9D', '', SVGM) + `</g>`;
      // гофер за столом
      const gw = W * 0.36;
      s += gopherAt(dressed({ hat: ['glasses', 'pencil'] }, { arms: [0, 128], eyes: 'up', look: -0.5, tilt: 4 }), W * 0.3, dy - gw * 0.95, gw);
      // стол (передний край закрывает низ гофера)
      s += `<rect x="0" y="${dy}" width="${W}" height="${H * 0.05}" fill="#8B5E3C" stroke="#4A2C17" stroke-width="4"/><rect x="0" y="${dy + H * 0.05}" width="${W}" height="${H * 0.17}" fill="#6B4226"/>`;
      // ноутбук с задачей
      const lx = W * 0.05, ly = dy - H * 0.12;
      s += `<g transform="translate(${lx} ${ly})"><path d="M0 ${H * 0.12} L${W * 0.26} ${H * 0.12} L${W * 0.28} ${H * 0.13} L${-W * 0.02} ${H * 0.13}Z" fill="#ADB5BD" stroke="${L}" stroke-width="2"/><rect x="${W * 0.01}" y="0" width="${W * 0.24}" height="${H * 0.12}" rx="6" fill="#212529" stroke="${L}" stroke-width="3"/>` +
        ['func twoSum(a []int, t int) {', '  seen := map[int]int{}', '  for i, x := range a {', '    if j, ok := seen[t-x]; ok {'].map((l, i) => txt(W * 0.022, H * (0.026 + i * 0.024), l, W * 0.016, ['#8BE9FD', '#F8F8F2', '#FF79C6', '#50FA7B'][i], '', SVGM)).join('') + `</g>`;
      // книги и лампа
      const bx = W * 0.72;
      [['Алгоритмы', '#E63946'], ['Графы', '#457B9D'], ['DP', '#E9C46A']].forEach(([t, c], i) => { s += `<rect x="${bx + (i % 2) * 8}" y="${dy - (i + 1) * H * 0.028}" width="${W * 0.2}" height="${H * 0.026}" rx="3" fill="${c}" stroke="${L}" stroke-width="2"/>${txt(bx + 14 + (i % 2) * 8, dy - (i + 1) * H * 0.028 + H * 0.019, t, W * 0.024, '#fff', 'font-weight="800"')}`; });
      s += `<path d="M${W * 0.9} ${dy} L${W * 0.9} ${dy - H * 0.2} L${W * 0.8} ${dy - H * 0.26}" stroke="#343A40" stroke-width="8" fill="none"/><path d="M${W * 0.74} ${dy - H * 0.27} L${W * 0.84} ${dy - H * 0.29} L${W * 0.82} ${dy - H * 0.22}Z" fill="#E9C46A" stroke="${L}" stroke-width="3"/><ellipse cx="${W * 0.9}" cy="${dy}" rx="${W * 0.05}" ry="${H * 0.008}" fill="#343A40"/>`;
      // Clawd на столе сортирует столбики
      const cs = W / 640;
      s += clawd(W * 0.5, dy - 98 * cs, cs, { item: 'bars', both: true });
      return s;
    },
  },
  newyear: {
    title: 'С Новым годом!', wall: ['#5C1A1B', '#3A0F10'], frame: 'gold', ink: '#FCEBD2',
    back: (W, H, rng) => {
      let s = `<defs><linearGradient id="gn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1338"/><stop offset=".6" stop-color="#2B2A6B"/><stop offset="1" stop-color="#4B3F8F"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#gn)"/>` + stars(rng, 120, W, H * 0.6, '#FFFFFF', 1.8);
      // салюты
      [[0.22, 0.14, '#FFD166'], [0.72, 0.1, '#FF5CA8'], [0.5, 0.24, '#5CE1E6'], [0.85, 0.3, '#90BE6D'], [0.15, 0.34, '#F4A261']].forEach(([fx, fy, c]) => { for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, r = W * (0.07 + (i % 3) * 0.02); s += `<path d="M${W * fx + Math.cos(a) * W * 0.02} ${H * fy + Math.sin(a) * W * 0.02} L${W * fx + Math.cos(a) * r} ${H * fy + Math.sin(a) * r}" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity=".9"/>`; } s += `<circle cx="${W * fx}" cy="${H * fy}" r="${W * 0.012}" fill="#FFF6C9"/>`; });
      // заснеженные холмы и деревня
      s += `<path d="M0 ${H * 0.64} Q${W * 0.3} ${H * 0.58} ${W * 0.6} ${H * 0.63} T${W} ${H * 0.6} V${H} H0Z" fill="#C9D6F2"/>`;
      for (let i = 0; i < 9; i++) { const x = W * (0.04 + i * 0.11), y = H * 0.62 - (i % 3) * 8; s += `<rect x="${x}" y="${y - 40}" width="56" height="44" fill="#6B4E71"/><path d="M${x - 6} ${y - 38} L${x + 28} ${y - 66} L${x + 62} ${y - 38}Z" fill="#FFFFFF"/><rect x="${x + 20}" y="${y - 26}" width="14" height="14" fill="#FFD27A"/>`; }
      s += `<path d="M0 ${H * 0.76} Q${W * 0.4} ${H * 0.7} ${W} ${H * 0.75} V${H} H0Z" fill="#E8EEFA"/>`;
      return s;
    },
    front: (W, H, d) => {
      const rng = rngFrom(31);
      const date = String(d.date || ''); const yr = +(date.slice(0, 4)) || new Date().getFullYear(); const mo = +(date.slice(5, 7)) || 12;
      const year = mo >= 7 ? yr + 1 : yr;
      let s = `<text x="${W / 2}" y="${H * 0.2}" text-anchor="middle" font-size="${W * 0.2}" font-weight="900" fill="#FFD166" stroke="#B5651D" stroke-width="3" ${SVGS} font-style="italic">${year}</text>`;
      // ёлка
      const tx = W * 0.74, base = H * 0.86;
      for (let i = 0; i < 4; i++) { const w = W * (0.34 - i * 0.07), y = base - H * (0.06 + i * 0.1); s += `<path d="M${tx - w / 2} ${y} L${tx} ${y - H * 0.16} L${tx + w / 2} ${y}Z" fill="${i % 2 ? '#2D6A4F' : '#1B4332'}" stroke="#0B2B1D" stroke-width="3"/>`; }
      s += `<rect x="${tx - 16}" y="${base - H * 0.06}" width="32" height="${H * 0.05}" fill="#6B4226"/>`;
      for (let i = 0; i < 3; i++) { const y = base - H * (0.1 + i * 0.1); s += `<path d="M${tx - W * (0.13 - i * 0.03)} ${y} Q${tx} ${y + H * 0.03} ${tx + W * (0.13 - i * 0.03)} ${y - H * 0.02}" stroke="#FFD166" stroke-width="3" fill="none" stroke-dasharray="2 8" stroke-linecap="round"/>`; }
      for (let i = 0; i < 14; i++) { const y = base - H * (0.08 + rng() * 0.32), spread = (base - y) / (H * 0.42) * W * 0.15; const x = tx + (rng() - 0.5) * (W * 0.3 - spread * 1.2); s += `<circle cx="${x}" cy="${y}" r="${W * 0.014}" fill="${['#7FD4EA', '#E63946', '#FFD166', '#F28482', '#FFFFFF'][i % 5]}" stroke="${L}" stroke-width="2"/>`; }
      s += `<path d="M${tx} ${base - H * 0.47} l8 18 l20 2 l-15 13 l5 20 l-18 -10 l-18 10 l5 -20 l-15 -13 l20 -2z" fill="#FFD166" stroke="#B5651D" stroke-width="2"/>`;
      // подарки
      [[0.6, '#E63946'], [0.84, '#457B9D'], [0.7, '#90BE6D']].forEach(([fx, c], i) => { const w = W * 0.07, x = W * fx, y = base - w + (i === 2 ? 8 : 0); s += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="${c}" stroke="${L}" stroke-width="2"/><rect x="${x + w / 2 - 5}" y="${y}" width="10" height="${w}" fill="#FFD166"/><rect x="${x}" y="${y + w / 2 - 5}" width="${w}" height="10" fill="#FFD166"/>`; });
      const gw = W * 0.4;
      s += gopherAt(dressed({ hat: ['redscarf', 'santa'] }, { arms: 'hold', eyes: 'happy', look: 0.3, item: 'sparkler', lift: 6 }), W * 0.08, base - gw * 1.2 + H * 0.02, gw);
      const cs = W / 620;
      s += clawd(W * 0.43, base - 98 * cs + H * 0.01, cs, { hat: 'santa', item: 'gift', jump: 10 });
      // снег
      s += Array.from({ length: 140 }, () => `<circle cx="${rng() * W}" cy="${rng() * H}" r="${1.5 + rng() * 3.5}" fill="#FFFFFF" opacity="${0.5 + rng() * 0.5}"/>`).join('');
      return s;
    },
  },
  search: {
    title: 'Начинаю искать работу!', wall: ['#7A3E2B', '#4E2418'], frame: 'wood', ink: '#FCEBD2',
    back: (W, H, rng) => {
      let s = `<defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8EC5FC"/><stop offset=".5" stop-color="#FDE2C3"/><stop offset=".62" stop-color="#FFC48C"/><stop offset="1" stop-color="#FFC48C"/></linearGradient>` +
        `<radialGradient id="gss" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFBEA"/><stop offset=".4" stop-color="#FFE29A"/><stop offset="1" stop-color="#FFB86B" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#gs)"/>`;
      const hz = H * 0.5;
      s += `<circle cx="${W * 0.62}" cy="${hz - 10}" r="${W * 0.3}" fill="url(#gss)"/>`;
      s += Array.from({ length: 7 }, () => { const x = rng() * W, y = H * (0.06 + rng() * 0.25), w = 100 + rng() * 220; return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.17}" fill="#FFFFFF" opacity="${0.4 + rng() * 0.3}"/>`; }).join('');
      let cx = W * 0.3;
      while (cx < W * 0.98) { const bw = 40 + rng() * 60, bh = H * (0.05 + rng() * 0.13); s += `<rect x="${cx}" y="${hz + 10 - bh}" width="${bw}" height="${bh}" fill="#7C6A9E" opacity=".85"/>`; cx += bw + 4 + rng() * 10; }
      s += `<path d="M0 ${hz + 10} Q${W * 0.3} ${hz - 30} ${W * 0.6} ${hz + 20} T${W} ${hz} V${H} H0Z" fill="#A7C957"/>`;
      s += `<path d="M0 ${H * 0.68} Q${W * 0.5} ${H * 0.6} ${W} ${H * 0.68} V${H} H0Z" fill="#6A994E"/>`;
      s += `<path d="M${W * 0.18} ${H} Q${W * 0.32} ${H * 0.75} ${W * 0.5} ${H * 0.6} T${W * 0.66} ${hz + 6}" stroke="#E9D8A6" stroke-width="${W * 0.07}" fill="none" stroke-linecap="round"/>`;
      s += Array.from({ length: 60 }, () => `<circle cx="${rng() * W}" cy="${H * (0.72 + rng() * 0.28)}" r="${3 + rng() * 5}" fill="${['#FFD166', '#FF8FA3', '#FFFFFF', '#CDB4DB'][Math.floor(rng() * 4)]}"/>`).join('');
      return s;
    },
    front: (W, H) => {
      let s = '';
      // бумажные самолётики-отклики летят к городу
      [[0.36, 0.34, -12], [0.52, 0.26, -8], [0.68, 0.36, -16]].forEach(([fx, fy, r], i) => { const x = W * fx, y = H * fy; s += `<path d="M${x - W * 0.2} ${y + H * 0.08} Q${x - W * 0.1} ${y + H * 0.02} ${x - 20} ${y + 6}" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="7 9" fill="none"/><g transform="translate(${x} ${y}) rotate(${r}) scale(${W / 900})"><path d="M-30 0 L40 -16 L10 20Z M10 20 L4 36 L18 14" fill="#FFFFFF" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><text x="2" y="4" font-size="12" font-weight="800" fill="#E63946" ${SVGF}>CV</text></g>`; });
      // указатель
      const px = W * 0.12, py = H * 0.5;
      s += `<rect x="${px - 8}" y="${py}" width="16" height="${H * 0.36}" fill="#7F5539" stroke="${L}" stroke-width="2"/>`;
      [['Go-бэкенд →', '#FFD166', -4, 1], ['Junior', '#90BE6D', 5, -1], ['Удалёнка', '#A8DADC', -3, 1], ['Офис', '#F4A261', 4, -1]].forEach(([t, c, r, dir], i) => {
        const y = py + 20 + i * H * 0.06, w = W * 0.25;
        const x0 = dir > 0 ? px - 10 : px - w + 10;
        s += `<g transform="rotate(${r} ${px} ${y})"><path d="M${x0} ${y} H${x0 + w} ${dir > 0 ? `l22 ${H * 0.022} l-22 ${H * 0.022}` : `v${H * 0.044}`} H${x0} ${dir < 0 ? `l-22 ${-H * 0.022}z` : 'z'}" fill="${c}" stroke="${L}" stroke-width="3"/>${txt(x0 + 16, y + H * 0.031, t, W * 0.032, '#2B1B17', 'font-weight="800"')}</g>`;
      });
      const gw = W * 0.38, gy = H * 0.9 - gw * 1.2;
      s += gopherAt(dressed({ hat: [`<g stroke="${L}" stroke-width="2.2"><rect x="18" y="104" width="30" height="86" rx="12" fill="#2A9D8F"/><rect x="152" y="104" width="30" height="86" rx="12" fill="#2A9D8F"/></g>`] }, { arms: 'hold', eyes: 'happy', look: 0.6, item: 'resume', tilt: -3 }), W * 0.4, gy, gw);
      const cs = W / 620;
      s += clawd(W * 0.76, H * 0.9 - 98 * cs, cs, { hat: 'pack', item: 'compass', both: true });
      return s;
    },
  },
  interview: {
    title: 'Моё первое собеседование!', wall: ['#2B2D33', '#1B1C20'], frame: 'black', ink: '#F1EDE4',
    back: (W, H, rng) => {
      let s = `<rect width="${W}" height="${H}" fill="#EFE6D8"/>`;
      // окно с городом
      const wx = W * 0.56, wy = H * 0.06, ww = W * 0.38, wh = H * 0.36;
      s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="#9CC9E8"/>`;
      let cx = wx;
      while (cx < wx + ww) { const bw = 30 + rng() * 50, bh = wh * (0.3 + rng() * 0.55); s += `<rect x="${cx}" y="${wy + wh - bh}" width="${bw}" height="${bh}" fill="#5E7FA3"/>`; for (let yy = wy + wh - bh + 10; yy < wy + wh - 6; yy += 16) for (let xx = cx + 6; xx < cx + bw - 8; xx += 12) if (rng() < 0.5) s += `<rect x="${xx}" y="${yy}" width="6" height="8" fill="#DCEBF7"/>`; cx += bw + 4; }
      s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="none" stroke="#FFFFFF" stroke-width="14"/><path d="M${wx + ww / 2} ${wy} V${wy + wh}" stroke="#FFFFFF" stroke-width="10"/>`;
      // пол и лампа
      s += `<rect x="0" y="${H * 0.7}" width="${W}" height="${H * 0.3}" fill="#B08968"/>` + Array.from({ length: 12 }, (_, i) => `<path d="M${i * W / 11} ${H * 0.7} L${i * W / 11 - W * 0.15} ${H}" stroke="#8B6A4E" stroke-width="3"/>`).join('');
      s += `<circle cx="${W * 0.3}" cy="0" r="${W * 0.35}" fill="#FFF3D6" opacity=".55"/>`;
      // растение
      s += `<path d="M${W * 0.06} ${H * 0.7} L${W * 0.08} ${H * 0.62} L${W * 0.16} ${H * 0.62} L${W * 0.18} ${H * 0.7}Z" fill="#C9A227"/>` + Array.from({ length: 9 }, (_, i) => { const a = -Math.PI / 2 + (i - 4) * 0.28; return `<ellipse cx="${W * 0.12 + Math.cos(a) * W * 0.07}" cy="${H * 0.6 + Math.sin(a) * H * 0.07}" rx="${W * 0.05}" ry="${W * 0.016}" transform="rotate(${a * 57.3} ${W * 0.12 + Math.cos(a) * W * 0.07} ${H * 0.6 + Math.sin(a) * H * 0.07})" fill="#2D6A4F"/>`; }).join('');
      return s;
    },
    front: (W, H) => {
      let s = `<defs><filter id="ivh"><feColorMatrix type="hueRotate" values="140"/></filter></defs>`;
      // доска на стене
      const bx = W * 0.08, by = H * 0.08, bw = W * 0.4, bh = H * 0.24;
      s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#FFFFFF" stroke="#ADB5BD" stroke-width="8"/>` +
        [['LB', 0.06, 0.3], ['API', 0.4, 0.15], ['API', 0.4, 0.5], ['DB', 0.76, 0.32]].map(([t, fx, fy]) => `<rect x="${bx + bw * fx}" y="${by + bh * fy}" width="${bw * 0.2}" height="${bh * 0.2}" rx="6" fill="#FFFFFF" stroke="#264653" stroke-width="3"/>${txt(bx + bw * (fx + 0.1), by + bh * (fy + 0.14), t, bw * 0.055, '#264653', 'text-anchor="middle" font-weight="800"', SVGM)}`).join('') +
        `<path d="M${bx + bw * 0.26} ${by + bh * 0.38} L${bx + bw * 0.4} ${by + bh * 0.25} M${bx + bw * 0.26} ${by + bh * 0.42} L${bx + bw * 0.4} ${by + bh * 0.6} M${bx + bw * 0.6} ${by + bh * 0.25} L${bx + bw * 0.76} ${by + bh * 0.4} M${bx + bw * 0.6} ${by + bh * 0.6} L${bx + bw * 0.76} ${by + bh * 0.44}" stroke="#E63946" stroke-width="3"/>` +
        txt(bx + bw * 0.06, by + bh * 0.9, 'select { case <-ctx.Done(): }', bw * 0.045, '#2A9D8F', 'font-weight="700"', SVGM);
      // кандидат и интервьюер (сиреневый гофер в очках)
      const gw = W * 0.34, ty = H * 0.72;
      s += gopherAt(dressed({ hat: ['tie', 'sweat'] }, { arms: 'hold', eyes: 'wide', look: 0.6, item: 'water' }), W * 0.06, ty - gw * 0.98, gw);
      s += `<g filter="url(#ivh)">` + gopherAt(dressed({ hat: ['glasses'] }, { arms: 'hold', eyes: 'happy', look: -0.6, item: 'clipboard', flip: true }), W * 0.6, ty - gw * 0.98, gw) + `</g>`;
      // стол
      s += `<path d="M${W * 0.02} ${ty} L${W * 0.98} ${ty} L${W * 0.94} ${ty + H * 0.04} L${W * 0.06} ${ty + H * 0.04}Z" fill="#8B5E3C" stroke="#4A2C17" stroke-width="4"/><rect x="${W * 0.08}" y="${ty + H * 0.04}" width="${W * 0.04}" height="${H * 0.2}" fill="#6B4226"/><rect x="${W * 0.88}" y="${ty + H * 0.04}" width="${W * 0.04}" height="${H * 0.2}" fill="#6B4226"/>`;
      // реплики
      const bubble = (x, y, w, h, t, tail) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#FFFFFF" stroke="${L}" stroke-width="3"/><path d="${tail}" fill="#FFFFFF" stroke="${L}" stroke-width="3"/><rect x="${x + 10}" y="${y + h - 14}" width="40" height="12" fill="#FFFFFF"/>${txt(x + w / 2, y + h * 0.64, t, h * 0.36, '#2B1B17', 'text-anchor="middle" font-weight="700"')}`;
      s += bubble(W * 0.5, H * 0.36, W * 0.44, H * 0.06, 'Расскажите о себе :)', `M${W * 0.78} ${H * 0.42 - 2} L${W * 0.8} ${H * 0.46} L${W * 0.74} ${H * 0.42 - 2}Z`);
      s += `<circle cx="${W * 0.36}" cy="${H * 0.43}" r="7" fill="#FFF" stroke="${L}" stroke-width="2.5"/><circle cx="${W * 0.33}" cy="${H * 0.46}" r="5" fill="#FFF" stroke="${L}" stroke-width="2.5"/>` +
        `<ellipse cx="${W * 0.26}" cy="${H * 0.39}" rx="${W * 0.18}" ry="${H * 0.035}" fill="#FFFFFF" stroke="${L}" stroke-width="3"/>${txt(W * 0.26, H * 0.398, 'горутины… каналы… select…', H * 0.019, '#555', 'text-anchor="middle" font-style="italic"')}`;
      const cs = W / 700;
      s += clawd(W * 0.4, H * 0.96 - 98 * cs, cs, { item: () => csign('ты справишься!', '#FFD166'), both: true, hat: 'tie' });
      return s;
    },
  },
  job: {
    title: 'Нашёл работу!', wall: ['#16302B', '#0E2420'], frame: 'gold', ink: '#F3E3C0', whirl: true,
    back: (W, H, rng) => {
      let s = `<defs><linearGradient id="jsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F4E8C"/><stop offset=".3" stop-color="#6C5BB8"/><stop offset=".55" stop-color="#F28C7A"/><stop offset=".8" stop-color="#FFD59A"/><stop offset="1" stop-color="#FFE9C2"/></linearGradient>` +
        `<radialGradient id="jsun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFBEA"/><stop offset=".35" stop-color="#FFE29A"/><stop offset="1" stop-color="#FFB86B" stop-opacity="0"/></radialGradient></defs>` +
        `<rect width="${W}" height="${H}" fill="url(#jsky)"/>`;
      const hz = H * 0.6;
      s += `<circle cx="${W * 0.5}" cy="${hz - H * 0.02}" r="${W * 0.42}" fill="url(#jsun)"/>`;
      s += Array.from({ length: 22 }, (_, i) => { const a = Math.PI + (i + 0.5) / 22 * Math.PI; return `<path d="M${W / 2} ${hz} L${W / 2 + Math.cos(a - 0.03) * W} ${hz + Math.sin(a - 0.03) * W} L${W / 2 + Math.cos(a + 0.03) * W} ${hz + Math.sin(a + 0.03) * W}Z" fill="#FFF3D0" opacity="${i % 2 ? 0.1 : 0.05}"/>`; }).join('');
      s += Array.from({ length: 9 }, () => { const x = rng() * W, y = H * (0.08 + rng() * 0.3), w = 120 + rng() * 260; return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.16}" fill="#FFE3D3" opacity="${0.25 + rng() * 0.3}"/>`; }).join('');
      const peaks = [0.06, 0.2, 0.33, 0.47, 0.62, 0.76, 0.9];
      s += `<path d="M0 ${hz} ` + peaks.map((p, i) => `L${W * (p - 0.06)} ${hz - H * 0.03} L${W * p} ${hz - H * (0.08 + i * 0.022)}`).join(' ') + ` L${W} ${hz - H * 0.04} L${W} ${hz + 40} L0 ${hz + 40}Z" fill="#8E6C9E" opacity=".75"/>`;
      peaks.forEach((p, i) => { const x = W * p, y = hz - H * (0.08 + i * 0.022); s += `<path d="M${x} ${y} V${y - 46}" stroke="#3D2C5B" stroke-width="4"/><path d="M${x} ${y - 46} l30 9 l-30 9z" fill="${i === 6 ? '#00ADD8' : '#E63946'}"/><path d="M${x - 22} ${y + 26} L${x} ${y} L${x + 22} ${y + 26}Z" fill="#FFF" opacity=".75"/>`; });
      let cx = W * 0.02;
      while (cx < W) { const bw = 50 + rng() * 80, bh = H * (0.05 + rng() * 0.12); s += `<rect x="${cx}" y="${hz + 30 - bh}" width="${bw}" height="${bh + 30}" fill="#4A3F6B" opacity=".9"/>`; for (let wy = hz + 44 - bh; wy < hz + 20; wy += 20) for (let wx = cx + 8; wx < cx + bw - 10; wx += 16) if (rng() < 0.55) s += `<rect x="${wx}" y="${wy}" width="7" height="10" fill="#FFD27A" opacity="${0.6 + rng() * 0.4}"/>`; cx += bw + 6 + rng() * 14; }
      s += `<g transform="translate(${W * 0.66} ${hz - H * 0.17})"><rect width="${W * 0.16}" height="${H * 0.2}" fill="#3B3363"/><path d="M0 0 L${W * 0.08} -${H * 0.04} L${W * 0.16} 0Z" fill="#3B3363"/>` +
        Array.from({ length: 8 }, (_, j) => Array.from({ length: 5 }, (_, i) => `<rect x="${14 + i * W * 0.028}" y="${18 + j * H * 0.022}" width="${W * 0.016}" height="${H * 0.012}" fill="#FFE29A" opacity="${0.55 + ((i + j) % 3) * 0.15}"/>`).join('')).join('') +
        `<path d="M${W * 0.08} -${H * 0.04} V-${H * 0.08}" stroke="#2B1B17" stroke-width="4"/><path d="M${W * 0.08} -${H * 0.08} l40 12 l-40 12z" fill="#FFD166"/></g>`;
      s += `<path d="M0 ${H * 0.7} Q${W * 0.3} ${H * 0.62} ${W * 0.55} ${H * 0.68} T${W} ${H * 0.66} V${H} H0Z" fill="#7BA05B"/>`;
      s += `<path d="M0 ${H * 0.8} Q${W * 0.4} ${H * 0.72} ${W} ${H * 0.78} V${H} H0Z" fill="#5C8A3F"/>`;
      s += `<path d="M${W * 0.12} ${H} Q${W * 0.3} ${H * 0.86} ${W * 0.42} ${H * 0.8} T${W * 0.6} ${H * 0.69}" stroke="#F3D9A4" stroke-width="${W * 0.05}" fill="none" stroke-linecap="round" opacity=".9"/>`;
      s += Array.from({ length: 7 }, () => { const x = W * (0.1 + rng() * 0.8), y = H * (0.18 + rng() * 0.22), k = 8 + rng() * 10; return `<path d="M${x - k} ${y - k * 0.3} Q${x - k * 0.4} ${y - k * 0.6} ${x} ${y} Q${x + k * 0.4} ${y - k * 0.6} ${x + k} ${y - k * 0.3}" stroke="#3D2C5B" stroke-width="3" fill="none" stroke-linecap="round"/>`; }).join('');
      s += Array.from({ length: 70 }, () => { const x = rng() * W, y = H * (0.8 + rng() * 0.2); return `<circle cx="${x}" cy="${y}" r="${3 + rng() * 6}" fill="${['#FFD166', '#FF8FA3', '#FFFFFF', '#F4A261', '#CDB4DB'][Math.floor(rng() * 5)]}" opacity=".9"/>`; }).join('');
      return s;
    },
    front: (W, H) => {
      const gw = W * 0.36, gx = W * 0.26, gy = H * 0.86 - gw * 1.2 * 0.94;
      let s = `<defs><radialGradient id="jglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE8A8" stop-opacity=".75"/><stop offset="1" stop-color="#FFE8A8" stop-opacity="0"/></radialGradient></defs>` +
        `<ellipse cx="${gx + gw / 2}" cy="${gy + gw * 0.55}" rx="${gw * 0.85}" ry="${gw * 0.95}" fill="url(#jglow)"/>`;
      s += `<ellipse cx="${gx + gw / 2}" cy="${H * 0.86}" rx="${gw * 0.36}" ry="${gw * 0.05}" fill="#2B3A1F" opacity=".35"/>`;
      const offer = `<g transform="translate(0 30) rotate(-6 100 -60)"><rect x="46" y="-104" width="108" height="76" rx="4" fill="#FFFDF5" stroke="${L}" stroke-width="2.4"/><text x="100" y="-74" text-anchor="middle" font-size="22" font-weight="900" fill="#22223B" font-family="Georgia, serif">OFFER</text>` +
        `<path d="M60 -62 H140 M60 -52 H128 M60 -42 H134" stroke="#BBB" stroke-width="3"/><circle cx="138" cy="-40" r="11" fill="#E63946" stroke="${L}" stroke-width="1.8"/><path d="M133 -40 l4 4 l7 -8" stroke="#fff" stroke-width="2.6" fill="none"/></g>`;
      s += gopherAt(dressed({}, { arms: 'up', eyes: 'happy', lift: 18, squash: 1.05, feet: 'jump', item: hats.suit, hat: offer }), gx, gy, gw);
      const cs = W / 520;
      const cxp = W * 0.6 + 4 * cs, cyp = H * 0.86 - 100 * cs + 14 * cs;
      s += Array.from({ length: 9 }, (_, i) => { const a = -Math.PI / 2 - 0.9 + i * 0.22; return `<path d="M${cxp + Math.cos(a) * 30} ${cyp + Math.sin(a) * 30} L${cxp + Math.cos(a) * 90} ${cyp + Math.sin(a) * 90}" stroke="${['#FFD166', '#E63946', '#00ADD8'][i % 3]}" stroke-width="5" stroke-linecap="round"/>`; }).join('');
      s += clawd(W * 0.6, H * 0.86 - 100 * cs, cs, { wave: true });
      s += confetti(rngFrom(99), W, H * 0.6);
      return s;
    },
  },
};
