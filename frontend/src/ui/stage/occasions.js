// Особые карточки семейных дней в итогах дня (холст 840×1386, back — фон маслом, front — чётко):
// 25 ноября — день рождения невесты: голубой и розовый гоферы; 22 декабря — день рождения мамы.
import {
  L, SVGF, txt, rngFrom, gopherAt, dressed, clawd, CI,
  sky, glow, sun, cloud, hill, flowers, windowAt, floorPlanks, rug, ribbon, stars,
} from './kit.js';

const heart = (x, y, s, c = '#FF5C8A', op = 1) => `<path d="M${x} ${y + 8 * s} C${x - 22 * s} ${y - 8 * s} ${x - 12 * s} ${y - 26 * s} ${x} ${y - 14 * s} C${x + 12 * s} ${y - 26 * s} ${x + 22 * s} ${y - 8 * s} ${x} ${y + 8 * s}Z" fill="${c}" stroke="${L}" stroke-width="${Math.max(1.5, 2 * s)}" opacity="${op}"/>`;
// гофер другого цвета: тело и уши перекрашиваются целиком
const tinted = (opts, x, y, w, body) => gopherAt(opts, x, y, w).replace(/#7FD4EA/g, body);
function cake(x, y, s, candles = 3, { c1 = '#FFE5EC', c2 = '#FF8FA3', top = '#FFFFFF' } = {}) {
  let t = `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<ellipse cx="0" cy="4" rx="96" ry="14" fill="#E9ECEF" stroke="${L}" stroke-width="3"/>` +
    `<path d="M-80 0 L-80 -64 Q0 -80 80 -64 L80 0 Q0 14 -80 0Z" fill="${c1}" stroke="${L}" stroke-width="3"/>` +
    `<path d="M-80 -36 Q0 -22 80 -36" fill="none" stroke="${c2}" stroke-width="10"/>` +
    `<path d="M-58 -82 L-58 -122 Q0 -136 58 -122 L58 -82 Q0 -68 -58 -82Z" fill="${c2}" stroke="${L}" stroke-width="3"/>` +
    `<path d="M-58 -122 Q-44 -104 -30 -122 Q-16 -104 0 -122 Q16 -104 30 -122 Q44 -104 58 -122 Q0 -138 -58 -122Z" fill="${top}" stroke="${L}" stroke-width="2.5"/>`;
  for (let i = 0; i < candles; i++) {
    const cx = (i - (candles - 1) / 2) * 30;
    t += `<rect x="${cx - 5}" y="-170" width="10" height="42" rx="3" fill="${['#4CC9F0', '#FFD166', '#B794F4', '#90BE6D'][i % 4]}" stroke="${L}" stroke-width="2"/>` +
      glow(cx, -182, 22, '#FFD166', 0.7) + `<path d="M${cx} -192 Q${cx + 8} -180 ${cx} -172 Q${cx - 8} -180 ${cx} -192Z" fill="#FFB703" stroke="${L}" stroke-width="1.5"/>`;
  }
  return t + `</g>`;
}
const balloon = (x, y, c, s = 1) => `<path d="M${x} ${y + 44 * s} Q${x + 10} ${y + 120 * s} ${x - 6} ${y + 200 * s}" fill="none" stroke="#6C757D" stroke-width="2"/>` +
  `<ellipse cx="${x}" cy="${y}" rx="${34 * s}" ry="${42 * s}" fill="${c}" stroke="${L}" stroke-width="3"/><path d="M${x - 5} ${y + 42 * s} l5 ${8 * s} l5 ${-8 * s}z" fill="${c}" stroke="${L}" stroke-width="2"/>` +
  `<ellipse cx="${x - 12 * s}" cy="${y - 14 * s}" rx="${8 * s}" ry="${13 * s}" fill="#FFFFFF" opacity=".45"/>`;
const bouquet = `<path d="M84 196 L100 150 L116 196Z" fill="#90BE6D" stroke="${L}" stroke-width="2.4"/><path d="M86 176 L114 176" stroke="#E63946" stroke-width="5"/>` +
  [[80, 132, '#FF5C8A'], [100, 118, '#FFD166'], [120, 132, '#FF8FA3'], [90, 150, '#FFFFFF'], [112, 150, '#B794F4']].map(([x, y, c]) =>
    Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2; return `<circle cx="${(x + Math.cos(a) * 8).toFixed(1)}" cy="${(y + Math.sin(a) * 8).toFixed(1)}" r="6.5" fill="${c}" stroke="${L}" stroke-width="1.6"/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="5" fill="#F4A261" stroke="${L}" stroke-width="1.6"/>`).join('');
const pinkBow = `<path d="M130 22 L106 8 L108 36Z M130 22 L154 8 L152 36Z" fill="#FF5C8A" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="130" cy="22" r="7" fill="#C2185B" stroke="${L}" stroke-width="2"/>`;
const shawl = `<path d="M28 118 Q100 150 172 118 L176 150 Q100 186 24 150Z" fill="#B794F4" stroke="${L}" stroke-width="2.4"/><path d="M40 146 l-4 18 M60 158 l-2 18 M82 166 l-1 18 M118 166 l1 18 M140 158 l2 18 M160 146 l4 18" stroke="#7B5CB8" stroke-width="3"/>`;
const momGlasses = `<g fill="none" stroke="#7B2CBF" stroke-width="3.5"><circle cx="67" cy="72" r="35"/><circle cx="133" cy="72" r="35"/><path d="M96 58 Q100 52 104 58"/></g><path d="M32 70 Q20 110 40 140 M168 70 Q180 110 160 140" fill="none" stroke="#C9A227" stroke-width="2"/>`;

export const OCCASION_SCENES = {
  'bday-love': {
    title: 'С днём рождения, любимая!', wall: ['#6B2E4F', '#45182F'], frame: 'gold', ink: '#FFE8F0',
    story: '25 ноября: голубой и розовый гоферы, торт со свечами и сердце на двоих.',
    back: (W, H, rng) => sky(W, H, [[0, '#FFD6E7'], [0.45, '#FFC2D4'], [0.75, '#FFDCC2'], [1, '#FFE8D6']]) +
      sun(W * 0.5, H * 0.42, 70, { core: '#FFF6E8', color: '#FFC2D4', rays: 18, rayOp: 0.08 }) +
      cloud(W * 0.18, H * 0.14, 230, '#FFFFFF', 0.75) + cloud(W * 0.8, H * 0.22, 190, '#FFFFFF', 0.65) +
      hill(H * 0.66, 22, '#F4B6C2', { x0: -40, x1: W + 40, bottom: H }) + hill(H * 0.74, 18, '#E8A0B4', { x0: -40, x1: W + 40, bottom: H, phase: 1.6 }) +
      flowers(rng, 110, 0, W, H * 0.78, H, ['#FFFFFF', '#FF8FA3', '#FFD166', '#CDB4DB']),
    front: (W, H) => {
      const rng = rngFrom(25);
      let s = ribbon(W / 2, H * 0.08, W * 0.7, 'С днём рождения!', { c: '#FF5C8A', ink: '#FFFFFF', fs: 36 });
      s += balloon(W * 0.14, H * 0.24, '#FF8FA3', 1.1) + balloon(W * 0.26, H * 0.2, '#4CC9F0', 1) + balloon(W * 0.82, H * 0.22, '#FFD166', 1.1) + balloon(W * 0.92, H * 0.28, '#FF5C8A', 0.95);
      // гирлянда сердец
      s += `<path d="M${W * 0.04} ${H * 0.31} Q${W / 2} ${H * 0.38} ${W * 0.96} ${H * 0.31}" stroke="#C2185B" stroke-width="3" fill="none"/>` +
        Array.from({ length: 9 }, (_, i) => { const t = (i + 0.5) / 9, x = W * (0.04 + 0.92 * t), y = H * (0.31 + 0.07 * 4 * t * (1 - t)) + 20; return heart(x, y, 0.9, ['#FF5C8A', '#FFFFFF', '#FF8FA3'][i % 3]); }).join('');
      // большое сердце над парой
      s += glow(W / 2, H * 0.5, 200, '#FF8FA3', 0.45) + heart(W / 2, H * 0.52, 4.2, '#FF5C8A');
      // пара: голубой и розовый гофер держатся за лапки
      const gw = W * 0.42, gy = H * 0.9;
      s += gopherAt({ arms: [0, -60], eyes: 'happy', look: 0.6, tilt: 5 }, W * 0.27 - gw / 2, gy - gw * 1.2 * 0.94, gw);
      s += tinted({ arms: [60, 0], eyes: 'happy', look: -0.6, tilt: -5, extra: pinkBow }, W * 0.73 - gw / 2, gy - gw * 1.2 * 0.94, gw, '#F7A8C8');
      s += `<ellipse cx="${W / 2}" cy="${gy - gw * 0.42}" rx="22" ry="17" fill="#F2D3AE" stroke="${L}" stroke-width="3"/>` + heart(W / 2, gy - gw * 0.52, 1.1, '#FF5C8A');
      s += cake(W / 2, H * 0.985, 0.8, 3);
      // Клавд с подарком
      const cs = W / 760;
      s += clawd(W * 0.84 - 60 * cs, H * 0.985 - 98 * cs, cs, { item: 'gift', eyes: 'happy', jump: 6 });
      s += Array.from({ length: 40 }, () => { const x = rng() * W, y = rng() * H * 0.75; return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="6" ry="3.5" fill="#FFAFCC" transform="rotate(${(rng() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})" opacity=".85"/>`; }).join('');
      return s;
    },
  },
  'bday-mom': {
    title: 'С днём рождения, мама!', wall: ['#4A2C55', '#2E1A36'], frame: 'gold', ink: '#FCEBD2',
    story: '22 декабря: зимний вечер, торт, цветы и тёплый плед для мамы.',
    back: (W, H, rng) => {
      let s = sky(W, H, [[0, '#F6E3CF'], [1, '#EBCFB2']]);
      const out = sky(W * 0.5, H * 0.3, [[0, '#2B3A67'], [1, '#5B6C9E']]) + stars(rng, 30, 0, 0, W * 0.5, H * 0.2, '#FFFFFF', 1.4) +
        hill(H * 0.24, 10, '#E8EEFA', { x0: -10, x1: W * 0.5 + 10, bottom: H * 0.3 }) +
        Array.from({ length: 40 }, () => `<circle cx="${(rng() * W * 0.5).toFixed(0)}" cy="${(rng() * H * 0.3).toFixed(0)}" r="${(1.5 + rng() * 2.5).toFixed(1)}" fill="#FFFFFF" opacity=".85"/>`).join('');
      s += windowAt(W * 0.46, H * 0.08, W * 0.5, H * 0.3, out, { part: 'glass' });
      s += glow(W * 0.25, H * 0.5, 320, '#FFD98E', 0.4) + floorPlanks(H * 0.8, W, '#9C6B3F', '#7F5539', H) + rug(W / 2, H * 0.9, W * 0.44, 50, '#9B2226', '#F4C430');
      return s;
    },
    front: (W, H) => {
      const rng = rngFrom(22);
      let s = windowAt(W * 0.46, H * 0.08, W * 0.5, H * 0.3, '', { frame: '#7F5539', part: 'frame' });
      // гирлянда и ветка ели над окном
      s += `<path d="M${W * 0.44} ${H * 0.07} Q${W * 0.71} ${H * 0.12} ${W * 0.98} ${H * 0.07}" stroke="#2D6A4F" stroke-width="16" fill="none" stroke-linecap="round"/>` +
        Array.from({ length: 10 }, (_, i) => { const t = (i + 0.5) / 10, x = W * (0.44 + 0.54 * t), y = H * (0.07 + 0.05 * 4 * t * (1 - t)) + 10; return glow(x, y, 16, ['#FFD166', '#FF5C8A', '#4CC9F0'][i % 3], 0.8) + `<circle cx="${x}" cy="${y}" r="6" fill="${['#FFD166', '#FF5C8A', '#4CC9F0'][i % 3]}" stroke="${L}" stroke-width="1.5"/>`; }).join('');
      s += ribbon(W * 0.26, H * 0.1, W * 0.44, 'Любимой маме', { c: '#B794F4', ink: '#FFFFFF', fs: 30, r: -4 });
      // стол с тортом
      const ty = H * 0.62;
      s += `<path d="M${W * 0.3} ${ty} L${W * 0.7} ${ty} L${W * 0.74} ${ty + 30} L${W * 0.26} ${ty + 30}Z" fill="#FFF3E0" stroke="${L}" stroke-width="3"/><rect x="${W * 0.32}" y="${ty + 30}" width="14" height="${H * 0.14}" fill="#7F5539"/><rect x="${W * 0.66}" y="${ty + 30}" width="14" height="${H * 0.14}" fill="#7F5539"/>` +
        cake(W / 2, ty + 6, 0.7, 4, { c1: '#FFF3E0', c2: '#B794F4', top: '#FFFFFF' });
      // мама-гофер (сиреневая, в шали и очках) и гофер с букетом
      const gw = W * 0.4, gy = H * 0.92;
      s += tinted({ arms: 'hold', eyes: 'happy', look: 0.5, extra: shawl + momGlasses, squash: 1.02 }, W * 0.24 - gw / 2, gy - gw * 1.2 * 0.94, gw, '#C9B6E8');
      s += gopherAt(dressed({}, { arms: 'hold', eyes: 'happy', look: -0.6, tilt: -4, item: bouquet }), W * 0.76 - gw / 2, gy - gw * 1.2 * 0.94, gw);
      s += heart(W / 2, H * 0.47, 1.6) + heart(W * 0.42, H * 0.43, 0.9, '#FF8FA3') + heart(W * 0.58, H * 0.42, 1.0, '#FFAFCC');
      const cs = W / 800;
      s += clawd(W / 2 - 60 * cs, H * 0.99 - 98 * cs, cs, { item: 'gift', eyes: 'happy', hat: 'santa' });
      s += Array.from({ length: 16 }, () => { const x = rng() * W, y = H * (0.4 + rng() * 0.4); return glow(x, y, 12, '#FFF3A6', 0.6); }).join('');
      return s;
    },
  },
};
