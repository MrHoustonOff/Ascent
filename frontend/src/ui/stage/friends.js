// Три картины о гофере и Clawd крупным планом: знакомство → коллеги → лучшие друзья.
// Холст 840×1386 (как у остальных картин галереи): back — фон маслом, front — чёткие персонажи и надписи.
import {
  L, SVGF, SVGM, SVGS, esc, txt, rngFrom, gopherAt, dressed, hats, clawd, CI,
  sky, glow, sun, cloud, hill, birds, flowers, tufts, windowAt, shelf, ribbon,
} from './kit.js';

const heart = (x, y, s, c = '#FF5C8A', op = 1) => `<path d="M${x} ${y + 8 * s} C${x - 22 * s} ${y - 8 * s} ${x - 12 * s} ${y - 26 * s} ${x} ${y - 14 * s} C${x + 12 * s} ${y - 26 * s} ${x + 22 * s} ${y - 8 * s} ${x} ${y + 8 * s}Z" fill="${c}" stroke="${L}" stroke-width="${Math.max(1.5, 2 * s)}" opacity="${op}"/>`;
const sparkle = (x, y, r, c = '#FFF6C9') => `<path d="M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28}Z" fill="${c}"/>`;
// реплика: овальное облачко с хвостиком к говорящему (tx, ty)
function speech(x, y, w, h, t, tx, ty, { fs = 30, fill = '#FFFFFF', ink = '#2B1B17', font = SVGF } = {}) {
  const cx = x + w / 2, by = y + h - 4;
  return `<path d="M${cx - 26} ${by} L${tx} ${ty} L${cx + 26} ${by}Z" fill="${fill}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${L}" stroke-width="3"/><rect x="${cx - 24}" y="${by - 6}" width="48" height="10" fill="${fill}"/>` +
    txt(cx, y + h / 2 + fs * 0.36, t, fs, ink, 'text-anchor="middle" font-weight="800"', font);
}
// табличка с именем на колышке
function nameplate(cx, y, t, { c = '#F4E3B5', ink = '#3B2A1C', fs = 34, r = 0 } = {}) {
  const w = t.length * fs * 0.56 + 56, h = fs * 1.8;
  return `<g transform="rotate(${r} ${cx} ${y})"><rect x="${cx - 7}" y="${y + h - 8}" width="14" height="70" fill="#7F5539" stroke="${L}" stroke-width="2.5"/>` +
    `<rect x="${cx - w / 2 + 6}" y="${y + 8}" width="${w}" height="${h}" rx="10" fill="#000" opacity=".2"/><rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="10" fill="${c}" stroke="${L}" stroke-width="3.5"/>` +
    `<rect x="${cx - w / 2 + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="7" fill="none" stroke="${ink}" stroke-opacity=".35" stroke-width="2"/>` +
    `<circle cx="${cx - w / 2 + 16}" cy="${y + h / 2}" r="4" fill="${ink}" opacity=".5"/><circle cx="${cx + w / 2 - 16}" cy="${y + h / 2}" r="4" fill="${ink}" opacity=".5"/>` +
    txt(cx, y + h / 2 + fs * 0.36, t, fs, ink, 'text-anchor="middle" font-weight="800" font-style="italic"', SVGS) + `</g>`;
}
function blossomTree(x, y, s, rng, petals = ['#FFC8DD', '#FFAFCC', '#FFE5EC']) {
  let t = `<path d="M${x} ${y} C${x - 10 * s} ${y - 120 * s} ${x + 20 * s} ${y - 200 * s} ${x - 10 * s} ${y - 300 * s} M${x - 4 * s} ${y - 180 * s} Q${x - 90 * s} ${y - 230 * s} ${x - 140 * s} ${y - 300 * s} M${x + 4 * s} ${y - 220 * s} Q${x + 90 * s} ${y - 260 * s} ${x + 130 * s} ${y - 330 * s}" stroke="#6B4226" stroke-width="${22 * s}" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 26; i++) { const a = rng() * Math.PI * 2, r = (60 + rng() * 150) * s; t += `<circle cx="${x + Math.cos(a) * r * 1.25}" cy="${y - 300 * s + Math.sin(a) * r * 0.7}" r="${(40 + rng() * 50) * s}" fill="${petals[i % petals.length]}" opacity=".95"/>`; }
  return t;
}

export const FRIENDS = {
  meet: {
    title: 'Знакомство', wall: ['#5A3550', '#3A2234'], frame: 'gold', ink: '#FBE7F0',
    story: 'Весна, утро, парк. Суслик Гофер и Крабик Клавд впервые здороваются.',
    back: (W, H, rng) => sky(W, H, [[0, '#BFE6F5'], [0.5, '#FCE7EF'], [0.75, '#FFE2C6'], [1, '#FFE2C6']]) + sun(W * 0.78, H * 0.2, 46, { color: '#FFE8A8' }) +
      cloud(W * 0.25, H * 0.1, 260, '#FFFFFF', 0.85) + cloud(W * 0.7, H * 0.3, 200, '#FFFFFF', 0.7) +
      hill(H * 0.5, 30, '#B7D7A8', { x0: -40, x1: W + 40, bottom: H }) + hill(H * 0.58, 24, '#9CC58A', { x0: -40, x1: W + 40, bottom: H, phase: 1.4 }) +
      blossomTree(W * 0.12, H * 0.62, 1.15, rng) + blossomTree(W * 0.95, H * 0.58, 0.9, rng) +
      `<path d="M${W * 0.36} ${H} Q${W * 0.44} ${H * 0.8} ${W * 0.52} ${H * 0.62} T${W * 0.6} ${H * 0.5}" stroke="#F1DDB0" stroke-width="90" fill="none" stroke-linecap="round"/>` +
      `<g transform="translate(${W * 0.62} ${H * 0.55})"><rect x="0" y="0" width="160" height="14" rx="4" fill="#8B5E3C"/><rect x="0" y="-36" width="160" height="12" rx="4" fill="#8B5E3C"/><rect x="10" y="14" width="10" height="34" fill="#5C3D27"/><rect x="140" y="14" width="10" height="34" fill="#5C3D27"/></g>` +
      hill(H * 0.74, 18, '#7FB069', { x0: -40, x1: W + 40, bottom: H, phase: 2.2 }) + flowers(rng, 90, 0, W, H * 0.76, H, ['#FFFFFF', '#FFD166', '#FFAFCC', '#CDB4DB']),
    front: (W, H) => {
      const rng = rngFrom(17);
      let s = Array.from({ length: 34 }, () => { const x = rng() * W, y = rng() * H * 0.7; return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="7" ry="4" fill="#FFAFCC" transform="rotate(${(rng() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})" opacity=".9"/>`; }).join('');
      const gy = H * 0.9, gw = W * 0.5;
      s += `<ellipse cx="${W * 0.3}" cy="${gy}" rx="${gw * 0.34}" ry="18" fill="#2B3A1F" opacity=".25"/><ellipse cx="${W * 0.74}" cy="${gy}" rx="150" ry="16" fill="#2B3A1F" opacity=".25"/>`;
      // гофер чуть смущён: машет, смотрит на нового знакомого
      s += gopherAt(dressed({}, { arms: [0, -150], eyes: 'happy', look: 0.9, tilt: 4, squash: 0.98 }), W * 0.3 - gw / 2, gy - gw * 1.2 * 0.94, gw);
      s += `<path d="M${W * 0.12} ${H * 0.43} q8 -14 0 -26 M${W * 0.15} ${H * 0.435} q8 -12 0 -22" stroke="#FF8FA3" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`; // смущение
      const cs = W / 300; // ширина Клавда ≈ 0.4 W
      s += clawd(W * 0.74 - 60 * cs, gy - 98 * cs, cs, { wave: true, eyes: 'open', jump: 6 });
      s += speech(W * 0.04, H * 0.2, W * 0.4, 84, 'Привет!', W * 0.26, H * 0.34, { fs: 40 });
      s += speech(W * 0.48, H * 0.36, W * 0.48, 120, '', W * 0.7, H * 0.52) + txt(W * 0.72, H * 0.36 + 52, 'Приятно', 34, '#2B1B17', 'text-anchor="middle" font-weight="800"') + txt(W * 0.72, H * 0.36 + 94, 'познакомиться!', 34, '#2B1B17', 'text-anchor="middle" font-weight="800"');
      s += nameplate(W * 0.3, H * 0.905, 'Суслик Гофер', { r: -2, fs: 32 }) + nameplate(W * 0.74, H * 0.905, 'Крабик Клавд', { r: 2, fs: 32, c: '#FFE0D3' });
      return s;
    },
  },
  colleagues: {
    title: 'Коллеги', wall: ['#22313F', '#151F29'], frame: 'silver', ink: '#E9F1F7',
    story: 'Клавд помогает со всем — от ревью до деплоя. Гофер им очень-очень дорожит.',
    back: (W, H, rng) => {
      let s = sky(W, H, [[0, '#E9E2D4'], [1, '#D8CDB8']]);
      // окно с вечерним городом
      let city = sky(W * 0.56, H * 0.3, [[0, '#F7B98A'], [0.6, '#F29E7E'], [1, '#C77DA0']]) + sun(W * 0.38, H * 0.24, 40, { color: '#FFD08A' });
      let x = 0; while (x < W * 0.56) { const w = 34 + rng() * 50, h = 60 + rng() * 140; city += `<rect x="${x}" y="${H * 0.3 - h}" width="${w}" height="${h}" fill="#6D4A73"/>`; for (let yy = H * 0.3 - h + 10; yy < H * 0.3 - 6; yy += 18) for (let xx = x + 6; xx < x + w - 8; xx += 12) if (rng() < 0.5) city += `<rect x="${xx}" y="${yy}" width="6" height="9" fill="#FFE29A"/>`; x += w + 4; }
      s += windowAt(W * 0.4, H * 0.06, W * 0.56, H * 0.3, city, { part: 'glass' });
      s += shelf(rng, W * 0.04, H * 0.2, W * 0.3, { wood: '#8B5E3C' }) + shelf(rng, W * 0.04, H * 0.32, W * 0.3, { wood: '#8B5E3C' });
      s += `<rect x="0" y="${H * 0.78}" width="${W}" height="${H * 0.22}" fill="#9C7A5B"/>` + Array.from({ length: 10 }, (_, i) => `<path d="M${i * W / 9} ${H * 0.78} L${i * W / 9 - 60} ${H}" stroke="#86664A" stroke-width="3"/>`).join('');
      return s;
    },
    front: (W, H) => {
      let s = windowAt(W * 0.4, H * 0.06, W * 0.56, H * 0.3, '', { frame: '#6B4E37', part: 'frame' });
      // доска «Клавд помог»
      s += `<g transform="translate(${W * 0.04} ${H * 0.38}) rotate(-2)"><rect width="${W * 0.36}" height="${H * 0.25}" rx="8" fill="#FFFDF5" stroke="#ADB5BD" stroke-width="8"/>` +
        txt(W * 0.18, 46, 'Клавд помог:', 28, '#2B1B17', 'text-anchor="middle" font-weight="900"') +
        ['код-ревью', 'тесты', 'деплой', 'вопросы к собесу', 'настроение'].map((t, i) => `<path d="M24 ${80 + i * 44} l9 9 l16 -20" stroke="#2A9D8F" stroke-width="5" fill="none" stroke-linecap="round"/>${txt(60, 92 + i * 44, t, 24, '#2B1B17', 'font-weight="700"')}`).join('') + `</g>`;
      // стол
      const dy = H * 0.74;
      s += `<rect x="${W * 0.32}" y="${dy}" width="${W * 0.68}" height="26" rx="5" fill="#8B5E3C" stroke="${L}" stroke-width="3"/><rect x="${W * 0.36}" y="${dy + 26}" width="20" height="${H - dy}" fill="#6B4226"/><rect x="${W * 0.94}" y="${dy + 26}" width="20" height="${H - dy}" fill="#6B4226"/>`;
      // монитор с зелёными тестами
      const mx = W * 0.665, mw = W * 0.31, mh = H * 0.14;
      s += `<rect x="${mx + mw / 2 - 12}" y="${dy - 40}" width="24" height="40" fill="#495057"/><rect x="${mx + mw / 2 - 60}" y="${dy - 10}" width="120" height="10" rx="4" fill="#495057"/>` +
        `<rect x="${mx}" y="${dy - 40 - mh}" width="${mw}" height="${mh}" rx="10" fill="#212529" stroke="${L}" stroke-width="4"/><rect x="${mx + 12}" y="${dy - 28 - mh}" width="${mw - 24}" height="${mh - 24}" rx="4" fill="#1E1F29"/>` +
        ['func TestSum(t)', '  Sum(2, 2) == 4', '  // ✓ PASS', '}'].map((l, i) => txt(mx + 22, dy - mh + 2 + i * 30, l, 18, ['#8BE9FD', '#F8F8F2', '#50FA7B', '#8BE9FD'][i], '', SVGM)).join('');
      // Клавд на столе показывает на экран
      const cs = W / 400;
      s += clawd(W * 0.34, dy - 98 * cs, cs, { item: `<path d="M128 18 L196 -40" stroke="#7F5539" stroke-width="5" stroke-linecap="round"/>`, both: true, eyes: 'happy' });
      s += speech(W * 0.5, H * 0.42, W * 0.42, 86, 'Давай вместе!', W * 0.56, H * 0.55, { fs: 32 });
      // гофер стоит рядом и смотрит с восхищением
      const gw = W * 0.46, gy = H * 0.99;
      // кружка «Клавду» в лапках гофера — несёт коллеге
      const mug = `<rect x="70" y="134" width="56" height="62" rx="8" fill="#FFFFFF" stroke="${L}" stroke-width="2.6"/><path d="M126 148 q18 0 18 16 q0 16 -18 16" fill="none" stroke="${L}" stroke-width="5"/>${heart(98, 160, 0.62)}${txt(98, 188, 'Клавду', 10, '#E63946', 'text-anchor="middle" font-weight="900"')}`;
      s += gopherAt(dressed({}, { arms: 'hold', eyes: 'up', look: 0.7, tilt: 6, squash: 1.02, item: mug, hat: [sparkle(20, 30, 14), sparkle(186, 10, 11), sparkle(196, 70, 8)] }), W * 0.02, gy - gw * 1.2 * 0.94, gw);
      s += `<g transform="translate(${W * 0.2} ${H * 0.665})"><ellipse cx="0" cy="0" rx="${W * 0.15}" ry="44" fill="#FFFFFF" stroke="${L}" stroke-width="3"/>${txt(0, -4, 'он лучший', 26, '#2B1B17', 'text-anchor="middle" font-weight="800" font-style="italic"')}${txt(0, 26, 'коллега ✦', 26, '#2B1B17', 'text-anchor="middle" font-weight="800" font-style="italic"')}<circle cx="40" cy="60" r="9" fill="#FFF" stroke="${L}" stroke-width="2.5"/><circle cx="58" cy="84" r="6" fill="#FFF" stroke="${L}" stroke-width="2.5"/></g>`;
      return s;
    },
  },
  friends: {
    title: 'Лучшие друзья', wall: ['#6B2E3A', '#45182A'], frame: 'gold', ink: '#FFE8EE', whirl: true,
    story: 'Закат на холме. Лучшие друзья — Гофер и Клавд.',
    back: (W, H, rng) => sky(W, H, [[0, '#3B2A6B'], [0.35, '#B95C8A'], [0.62, '#FF9F80'], [0.8, '#FFD39B'], [1, '#FFD39B']]) +
      sun(W * 0.5, H * 0.56, 90, { core: '#FFF4D6', color: '#FFC371', rays: 22, rayOp: 0.08 }) +
      cloud(W * 0.2, H * 0.16, 240, '#FFD0DC', 0.6) + cloud(W * 0.78, H * 0.24, 200, '#FFD0DC', 0.5) +
      hill(H * 0.62, 26, '#7A4E7E', { x0: -40, x1: W + 40, bottom: H }) +
      `<path d="M-40 ${H} L-40 ${H * 0.78} Q${W * 0.5} ${H * 0.66} ${W + 40} ${H * 0.76} L${W + 40} ${H}Z" fill="#5C8A3F"/>` +
      `<path d="M${W * 0.84} ${H * 0.74} C${W * 0.82} ${H * 0.6} ${W * 0.88} ${H * 0.5} ${W * 0.84} ${H * 0.38}" stroke="#4A2C17" stroke-width="60" fill="none" stroke-linecap="round"/>` +
      Array.from({ length: 16 }, (_, i) => { const a = rng() * Math.PI * 2, r = 30 + rng() * 120; return `<circle cx="${W * 0.86 + Math.cos(a) * r}" cy="${H * 0.34 + Math.sin(a) * r * 0.6}" r="${50 + rng() * 40}" fill="${['#3F6E3A', '#4E8A45', '#356030'][i % 3]}"/>`; }).join('') +
      flowers(rng, 60, 0, W, H * 0.82, H, ['#FFD166', '#FFAFCC', '#FFFFFF']) + tufts(rng, 30, 0, W, H * 0.8, H, '#2D5A27'),
    front: (W, H) => {
      const rng = rngFrom(5);
      let s = '';
      // сердце на стволе «Г + К»
      s += `<g transform="translate(${W * 0.84} ${H * 0.6})">${heart(0, 0, 3.4, '#C44569')}${txt(0, -10, 'Г+К', 30, '#FFFFFF', 'text-anchor="middle" font-weight="900"')}</g>`;
      // воздушный змей-сердце
      s += `<path d="M${W * 0.52} ${H * 0.66} Q${W * 0.4} ${H * 0.4} ${W * 0.22} ${H * 0.16}" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".8"/>` + `<g transform="rotate(-14 ${W * 0.22} ${H * 0.14})">${heart(W * 0.22, H * 0.14, 2.6, '#FF5C8A')}</g>` +
        [0, 1, 2].map((i) => `<path d="M${W * 0.22 + 4} ${H * 0.14 + 18 + i * 22} l-10 10 l10 10" stroke="#FFD166" stroke-width="4" fill="none"/>`).join('');
      // плед
      s += `<path d="M${W * 0.06} ${H * 0.95} L${W * 0.18} ${H * 0.82} L${W * 0.86} ${H * 0.82} L${W * 0.96} ${H * 0.95}Z" fill="#E63946" stroke="${L}" stroke-width="3"/>` +
        Array.from({ length: 6 }, (_, i) => `<path d="M${W * (0.18 + i * 0.12)} ${H * 0.82} L${W * (0.08 + i * 0.16)} ${H * 0.95}" stroke="#FFFFFF" stroke-width="10" opacity=".6"/>`).join('') +
        `<path d="M${W * 0.12} ${H * 0.88} H${W * 0.92}" stroke="#FFFFFF" stroke-width="10" opacity=".6"/>`;
      // гофер сидит, Клавд прижался сбоку; лапка гофера обнимает Клавда
      const gw = W * 0.5, gx = W * 0.08, gy = H * 0.9 - gw * 1.2 * 0.86;
      s += gopherAt(dressed({}, { view: 'sit', arms: [-30, 0], eyes: 'happy', look: 0.6, tilt: 7 }), gx, gy, gw);
      const cs = W / 300, cx = W * 0.5, cyy = H * 0.9 - 98 * cs;
      s += clawd(cx, cyy, cs, { eyes: 'happy', both: false, wave: false });
      // рука-объятие: от плеча гофера через спину Клавда
      const sx = gx + 158 * gw / 200, sy = gy + 124 * gw / 200, ex = cx + 30 * cs, ey = cyy + 16 * cs;
      const arm = `M${sx} ${sy} Q${(sx + ex) / 2} ${Math.min(sy, ey) - 26} ${ex} ${ey}`;
      s += `<path d="${arm}" stroke="${L}" stroke-width="34" fill="none" stroke-linecap="round"/><path d="${arm}" stroke="#7FD4EA" stroke-width="28" fill="none" stroke-linecap="round"/>` +
        `<ellipse cx="${ex + 4}" cy="${ey + 6}" rx="18" ry="14" fill="#F2D3AE" stroke="${L}" stroke-width="3" transform="rotate(30 ${ex + 6} ${ey + 10})"/>`;
      // сердечки и светлячки
      s += heart(W * 0.47, H * 0.42, 1.6) + heart(W * 0.6, H * 0.36, 1.1, '#FF8FA3') + heart(W * 0.38, H * 0.33, 0.9, '#FFAFCC') + heart(W * 0.68, H * 0.46, 0.8, '#FF5C8A');
      s += Array.from({ length: 22 }, () => { const x = rng() * W, y = H * (0.3 + rng() * 0.5); return glow(x, y, 14, '#FFF3A6', 0.8) + `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="3" fill="#FFF8D0"/>`; }).join('');
      s += ribbon(W * 0.5, H * 0.08, W * 0.62, 'друзья навсегда', { c: '#FFD166', ink: '#6B2E3A', fs: 34 });
      return s;
    },
  },
};
