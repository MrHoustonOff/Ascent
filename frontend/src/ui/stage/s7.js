// Этап 7 · Системный дизайн и сборка — восхождение: базовый лагерь с картой-архитектурой → гребень над облаками
// (шарды, репликация) → ночная метель последнего перевала (финальный проект, мок-собес) → вершина 7/7 на рассвете.
import {
  L, SVGM, SVGF, txt, esc, stars, rngFrom, gopherOn, gopherAt, dressed, items, clawd, clawdOn, CI, csign,
  sky, glow, sun, cloud, range, hill, tent, pennant, trail,
} from './kit.js';

const climber = { hat: ['scarf', 'beanie'] };
const axeUp = `<path d="M182 120 L226 -10" stroke="#7F5539" stroke-width="8" stroke-linecap="round"/><path d="M196 -20 Q228 -26 254 -2 L250 4 Q228 -14 200 -10Z" fill="#ADB5BD" stroke="${L}" stroke-width="2.4"/><path d="M222 -16 L212 -34" stroke="#ADB5BD" stroke-width="7" stroke-linecap="round"/>`;
const headlamp = `<rect x="84" y="20" width="32" height="20" rx="6" fill="#343A40" stroke="${L}" stroke-width="2"/><circle cx="100" cy="30" r="7" fill="#FFF6C9"/>`;
const rope = (x0, y0, x1, y1, sag = 30) => `<path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${Math.max(y0, y1) + sag} ${x1} ${y1}" stroke="#F4A261" stroke-width="5" fill="none"/><path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${Math.max(y0, y1) + sag} ${x1} ${y1}" stroke="#E76F51" stroke-width="2" stroke-dasharray="5 6" fill="none"/>`;
const snowfall = (rng, n, x0, y0, w, h, len = 22, op = 0.7) => Array.from({ length: n }, () => { const x = x0 + rng() * w, y = y0 + rng() * h, l = len * (0.5 + rng()); return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l${(l * 0.8).toFixed(0)} ${(l * 0.35).toFixed(0)}" stroke="#FFFFFF" stroke-width="${(2 + rng() * 2).toFixed(1)}" stroke-linecap="round" opacity="${(op * (0.5 + rng() * 0.5)).toFixed(2)}"/>`; }).join('');

export default {
  name: 'Вершина',
  acts: [
    { // I. Базовый лагерь: карта маршрута — схема системы
      title: 'Базовый лагерь', story: 'Базовый лагерь: маршрут к вершине — это схема системы.',
      pal: { ink: '#EAF2FF', muted: 'rgba(234,242,255,0.76)', acc: '#FFD08A', card: 'rgba(255,255,255,0.1)', stamp: '#FFD08A', scrim: '#0E1530' },
      bg: (W, H, rng) => sky(W, H, [[0, '#0E1530'], [1, '#25335E']]) + stars(rng, 220, 0, 0, W, H * 0.7, '#FFFFFF', 1.6),
      back: (rng) => `<path d="M-40 260 Q300 160 540 230 T1120 170" stroke="#7CF5D2" stroke-width="60" fill="none" opacity=".08"/>` +
        range([[-40, 820], [120, 660], [260, 720], [430, 420], [560, 260], [680, 380], [800, 350], [960, 560], [1120, 720]], '#2E3C6E', { snow: 420, snowColor: '#DDE6FF', light: '#5B6FA8', lightOp: 0.45, capH: 130 }) +
        `<path d="M-40 1100 L-40 900 Q300 860 600 900 T1120 880 L1120 1100Z" fill="#C9D6F2"/>`,
      front: (rng) => {
        let s = `<path d="M560 260 V222" stroke="#FFD08A" stroke-width="4"/><path d="M560 222 l22 6 l-22 6z" fill="#FFD08A"/>` + glow(560, 240, 50, '#FFD08A', 0.5);
        s += tent(160, 1010, 0.95, { c: '#F4A261', c2: '#E76F51', lit: true });
        // карта-схема на стойке
        s += `<path d="M560 980 L580 820 M1000 980 L980 820" stroke="#5C4033" stroke-width="12" stroke-linecap="round"/><rect x="530" y="460" width="500" height="370" rx="8" fill="#F4E3B5" stroke="#5C4033" stroke-width="8"/>` +
          txt(780, 502, 'Маршрут: системный дизайн', 22, '#3B2A1C', 'text-anchor="middle" font-weight="900"');
        const box = (x, y, t, c = '#FFFDF5') => `<rect x="${x - 50}" y="${y - 22}" width="100" height="44" rx="6" fill="${c}" stroke="#3B2A1C" stroke-width="2.5"/>${txt(x, y + 7, t, 18, '#3B2A1C', 'text-anchor="middle" font-weight="800"', SVGM)}`;
        s += `<path d="M590 790 L640 720 L760 640 L880 600 L985 572" stroke="#E63946" stroke-width="4" stroke-dasharray="8 7" fill="none"/>`;
        s += box(640, 720, 'LB', '#FFD08A') + box(760, 640, 'API ×3') + box(880, 600, 'cache', '#A8DADC') + box(900, 690, 'queue', '#CDB4DB') + box(700, 770, 'DB', '#90BE6D') +
          `<path d="M750 770 H800 M800 770 L840 790 M800 770 L840 750" stroke="#3B2A1C" stroke-width="2"/>${txt(880, 796, 'реплики', 15, '#3B2A1C', 'text-anchor="middle"')}` +
          `<path d="M985 572 V528" stroke="#3B2A1C" stroke-width="3"/><path d="M985 528 l20 6 l-20 6z" fill="#E63946"/>`;
        // следы на снегу
        s += Array.from({ length: 9 }, (_, i) => `<ellipse cx="${300 + i * 30}" cy="${1060 - (i % 2) * 14}" rx="9" ry="5" fill="#9FB0D6"/>`).join('');
        s += gopherOn(dressed(climber, { arms: [0, -88], eyes: 'happy', look: 1, tilt: 3 }), 440, 1012, 280);
        s += clawdOn(1000, 1012, 0.85, { hat: 'beanie', item: 'lantern' });
        return s;
      },
    },
    { // II. Над облаками: гребень, шарды-льдины, лестница репликации
      title: 'Над облаками', story: 'Над облаками: шарды льдинами, лестница через трещину репликации.',
      pal: { ink: '#0B1B3A', muted: 'rgba(11,27,58,0.78)', acc: '#1D4ED8', card: 'rgba(255,255,255,0.66)', stamp: '#1D4ED8', scrim: '#D6ECFB' },
      bg: (W, H) => sky(W, H, [[0, '#6FA8DC'], [0.55, '#A9D0F0'], [1, '#D6ECFB']]) + sun(W * 0.82, H * 0.46, 50, { color: '#FFF3C4' }),
      back: () => Array.from({ length: 12 }, (_, i) => cloud(i * 110 - 30, 880 + (i % 3) * 40, 320 + (i % 2) * 80, '#FFFFFF', 0.95)).join('') +
        range([[-40, 900], [80, 760], [180, 820]], '#B9C9E6', { snow: 800 }) + range([[860, 860], [960, 700], [1060, 780], [1120, 860]], '#B9C9E6', { snow: 760 }) +
        `<path d="M-40 1100 L-40 1010 L1120 360 L1120 1100Z" fill="#F4F8FF"/><path d="M-40 1010 L1120 360 L1120 420 L-40 1080Z" fill="#C9D6F2"/>`,
      front: (rng) => {
        const ridge = (x) => 1010 - 0.5603 * (x + 40);
        let s = `<path d="M-40 1010 L1120 360" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/><path d="M-40 1018 L1120 368" stroke="#8FB0DA" stroke-width="4"/>` +
          Array.from({ length: 12 }, (_, i) => { const x = -20 + i * 100, y = ridge(x); return `<path d="M${x} ${y + 8} q20 30 6 70" stroke="#B5CAE8" stroke-width="5" fill="none" stroke-linecap="round"/>`; }).join('');
        // шарды-льдины на гребне
        [[90, 'shard 0'], [400, 'shard 1'], [950, 'shard 2']].forEach(([x, t]) => { const y = ridge(x); s += `<g transform="translate(${x} ${y}) rotate(-29)"><rect x="-56" y="-62" width="112" height="62" rx="6" fill="#A8DADC" stroke="#1D3557" stroke-width="3"/><path d="M-40 -50 L-20 -50 M20 -14 L40 -14" stroke="#FFFFFF" stroke-width="4"/>${txt(0, -24, t, 18, '#1D3557', 'text-anchor="middle" font-weight="900"', SVGM)}</g>`; });
        // трещина и лестница «replication lag»
        const cx = 790, cy = ridge(cx);
        s += `<path d="M${cx - 50} ${cy + 4} L${cx - 20} ${cy + 70} L${cx + 10} ${cy + 40} L${cx + 40} ${cy + 90} L${cx + 60} ${cy - 30}Z" fill="#5B7DB8" stroke="#1D3557" stroke-width="3"/>` +
          `<g transform="translate(${cx} ${cy - 6}) rotate(-29)"><rect x="-80" y="-10" width="160" height="8" fill="#9C6B3F" stroke="${L}" stroke-width="2"/><rect x="-80" y="8" width="160" height="8" fill="#9C6B3F" stroke="${L}" stroke-width="2"/>${Array.from({ length: 7 }, (_, i) => `<rect x="${-72 + i * 24}" y="-4" width="6" height="16" fill="#7F5539"/>`).join('')}</g>` +
          `<g transform="translate(${cx + 40} ${cy + 110}) rotate(-6)"><rect x="-100" y="-22" width="200" height="40" rx="6" fill="#FFFDF5" stroke="#1D3557" stroke-width="2.5"/>${txt(0, 6, 'replication lag', 18, '#1D3557', 'text-anchor="middle" font-weight="800"', SVGM)}</g>`;
        // связка: Clawd позади, гофер с ледорубом впереди
        const gx = 610, gy = ridge(gx) + 4, kx = 240, ky = ridge(kx) + 4;
        s += rope(gx - 60, gy - 120, kx + 30, ky - 60, 50);
        s += clawdOn(kx, ky, 0.75, { hat: 'beanie', both: true, eyes: 'happy' });
        s += gopherOn(dressed(climber, { arms: [0, -150], eyes: 'happy', look: 0.6, tilt: -12, feet: 'walk', hat: ['scarf', 'beanie', axeUp] }), gx, gy, 240);
        s += snowfall(rng, 20, 0, 400, 1080, 600, 18, 0.5);
        return s;
      },
    },
    { // III. Последний перевал: ночная метель, налобный фонарь, финальный проект
      title: 'Последний перевал', story: 'Ночная метель: финальный проект собран, завтра — мок-собес.',
      pal: { ink: '#E8FFF7', muted: 'rgba(232,255,247,0.76)', acc: '#7CF5D2', card: 'rgba(255,255,255,0.1)', stamp: '#7CF5D2', scrim: '#06141A' },
      bg: (W, H, rng) => sky(W, H, [[0, '#06141A'], [1, '#0F2A33']]) + stars(rng, 120, 0, 0, W, H * 0.5, '#FFFFFF', 1.4) +
        [['#7CF5D2', 0.16, 0.12], ['#B794F4', 0.12, 0.2], ['#7CF5D2', 0.1, 0.28]].map(([c, op, f]) => `<path d="M-40 ${H * f} Q${W * 0.3} ${H * (f - 0.08)} ${W * 0.55} ${H * f} T${W + 40} ${H * (f - 0.04)}" stroke="${c}" stroke-width="${W * 0.07}" fill="none" opacity="${op}"/>`).join(''),
      back: () => range([[-40, 760], [160, 520], [320, 600], [560, 300], [700, 380], [880, 260], [1120, 560]], '#163640', { snow: 420, snowColor: '#A9C4CC', light: '#2E6070', lightOp: 0.5 }) +
        `<path d="M-40 1100 L-40 880 Q400 840 760 900 T1120 860 L1120 1100Z" fill="#9FB8C2"/>`,
      front: (rng) => {
        let s = '';
        // палатка финального проекта и табличка ТЗ
        s += tent(170, 960, 0.85, { c: '#2A9D8F', c2: '#7CF5D2', lit: true }) + pennant(300, 820, 120, '', '#7CF5D2');
        s += `<g transform="translate(110 610) rotate(-3)"><rect width="280" height="110" rx="8" fill="#F1FAEE" stroke="${L}" stroke-width="3"/>${txt(140, 34, 'Финальный проект', 20, '#0F2A33', 'text-anchor="middle" font-weight="900"')}${txt(140, 64, 'распродажа', 18, '#2A9D8F', 'text-anchor="middle" font-weight="800"')}${txt(140, 90, 'без перепродажи ✓', 18, '#2A9D8F', 'text-anchor="middle" font-weight="800"')}</g><path d="M250 720 V820" stroke="#5C4033" stroke-width="8"/>`;
        // гофер с налобным фонарём, луч вправо-вверх
        const gx = 600, gy = 960;
        s += `<path d="M${gx + 8} ${gy - 286} L1100 420 L1100 640Z" fill="#FFF6C9" opacity=".14"/>`;
        s += gopherOn(dressed(climber, { arms: [-10, 10], eyes: 'open', look: 0.7, tilt: 7, squash: 0.97, hat: ['scarf', 'beanie', headlamp] }), gx, gy, 270);
        s += rope(gx - 80, gy - 120, 840, 920, 40);
        s += clawdOn(880, 990, 0.85, { hat: 'beanie', item: () => csign('мок-собес — завтра!', '#7CF5D2', '#06141A') });
        s += Array.from({ length: 6 }, (_, i) => `<ellipse cx="${380 + i * 34}" cy="${980 + (i % 2) * 12}" rx="10" ry="5" fill="#7E9AA6"/>`).join('');
        s += snowfall(rng, 160, -40, 220, 1160, 880, 34, 0.85);
        return s;
      },
    },
    { // IV. Вершина: рассвет, флаг 7/7, весь путь внизу
      title: 'Вершина', story: 'Вершина 7/7: внизу весь путь — от package main до системного дизайна.',
      pal: { ink: '#FFFFFF', muted: 'rgba(255,255,255,0.8)', acc: '#FFD08A', card: 'rgba(255,255,255,0.13)', stamp: '#FFD08A', scrim: '#1B1340' },
      bg: (W, H, rng) => sky(W, H, [[0, '#1B1340'], [0.42, '#6D3B7A'], [0.72, '#F28C6B'], [1, '#FFD08A']]) + stars(rng, 80, 0, 0, W, H * 0.35, '#FFFFFF', 1.5),
      back: () => sun(860, 640, 110, { core: '#FFF3D6', color: '#FFD08A', rays: 20, rayOp: 0.09 }) +
        Array.from({ length: 14 }, (_, i) => `<ellipse cx="${(i * 97) % 1100}" cy="${900 + (i % 3) * 40}" rx="${160 + (i % 4) * 30}" ry="${50 + (i % 3) * 12}" fill="#FFFFFF" opacity="${0.6 + (i % 3) * 0.12}"/>`).join('') +
        range([[-40, 1000], [120, 780], [230, 860], [360, 720], [470, 820]], '#5B3A6B', { op: 0.6 }) + range([[620, 820], [760, 700], [880, 860], [1000, 760], [1120, 1000]], '#5B3A6B', { op: 0.6 }) +
        range([[220, 1100], [430, 700], [480, 750], [540, 530], [600, 620], [650, 580], [860, 1100]], '#3D2C5B', { snow: 660, light: '#6E5A95', lightOp: 0.5, capH: 130 }),
      front: () => {
        let s = `<path d="M300 1100 Q350 990 390 930 T480 800 T540 650" stroke="#FFD08A" stroke-width="7" stroke-dasharray="3 18" stroke-linecap="round" fill="none"/>`;
        // значки пройденных миров на лагерях 1…6
        const icon = [
          `<rect x="-14" y="-18" width="28" height="22" rx="3" fill="#3A86FF" stroke="${L}" stroke-width="2"/>${txt(0, -2, 'Go', 11, '#fff', 'text-anchor="middle" font-weight="900"')}`,
          `<rect x="-14" y="-18" width="28" height="22" rx="3" fill="#E9C46A" stroke="${L}" stroke-width="2"/>${txt(0, -2, '[]', 12, '#2B1B10', 'text-anchor="middle" font-weight="900"', SVGM)}`,
          `<circle cx="0" cy="-8" r="12" fill="#FF5CA8" stroke="${L}" stroke-width="2"/>${txt(0, -4, 'go', 10, '#1B1035', 'text-anchor="middle" font-weight="900"', SVGM)}`,
          `<rect x="-15" y="-18" width="30" height="20" rx="2" fill="#FFFDF5" stroke="${L}" stroke-width="2"/><path d="M-15 -18 L0 -6 L15 -18" fill="none" stroke="${L}" stroke-width="2"/>`,
          `<rect x="-16" y="-18" width="32" height="22" fill="#2A9D8F" stroke="${L}" stroke-width="2"/>${txt(0, -3, 'api', 10, '#fff', 'text-anchor="middle" font-weight="900"', SVGM)}`,
          `<rect x="-16" y="-18" width="32" height="18" rx="3" fill="#E76F51" stroke="${L}" stroke-width="2"/><circle cx="-8" cy="2" r="4" fill="${L}"/><circle cx="8" cy="2" r="4" fill="${L}"/>`,
        ];
        [[330, 1040], [372, 960], [418, 890], [462, 818], [502, 746], [530, 680]].forEach(([x, y], i) => {
          s += `<circle cx="${x}" cy="${y - 10}" r="34" fill="#1B1340" opacity=".6"/><g transform="translate(${x} ${y}) scale(1.5)">${icon[i]}</g>` + txt(x + 40, y - 2, String(i + 1), 22, '#FFF3D6', 'font-weight="900"');
        });
        s += `<path d="M560 540 V320" stroke="#2B1B17" stroke-width="8" stroke-linecap="round"/><path d="M564 326 Q640 306 700 332 Q760 356 820 332 L820 430 Q760 454 700 430 Q640 406 564 426Z" fill="#00ADD8" stroke="#1B1340" stroke-width="4"/>` +
          txt(692, 394, '7 / 7', 40, '#FFFFFF', 'text-anchor="middle" font-weight="900"');
        s += gopherOn(dressed(climber, { arms: 'hips', eyes: 'happy', squash: 1.04 }), 466, 546, 220);
        s += clawdOn(650, 612, 0.85, { hat: 'beanie', wave: true, jump: 16, eyes: 'happy' });
        s += [[250, 380], [840, 420], [120, 560], [960, 620]].map(([x, y]) => `<path d="M${x} ${y - 14} L${x + 4} ${y - 4} L${x + 14} ${y} L${x + 4} ${y + 4} L${x} ${y + 14} L${x - 4} ${y + 4} L${x - 14} ${y} L${x - 4} ${y - 4}Z" fill="#FFF6C9"/>`).join('');
        return s;
      },
    },
  ],
};
