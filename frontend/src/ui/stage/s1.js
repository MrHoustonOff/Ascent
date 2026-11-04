// Этап 1 · Основы — история отправления: сборы ночью → первые шаги → лагерь у подножия → Hello, World на рассвете.
import {
  L, SVGM, txt, stars, rngFrom, gopherOn, gopherAt, dressed, packs, items, clawd, clawdOn, CI,
  sky, glow, sun, moon, cloud, birds, range, hill, forest, tufts, flowers,
  windowAt, floorPlanks, rug, desk, lamp, laptop, roadmapPoster, chalkboard, bookStack, backpackProp,
  tent, campfire, log, signpost, plane, trail, ribbon, stone, pennant,
} from './kit.js';

const light = { ink: '#2B1B17', muted: 'rgba(43,27,23,0.72)', acc: '#D62828', card: 'rgba(255,255,255,0.62)', stamp: '#D62828' };
const dark = { ink: '#FFF4E0', muted: 'rgba(255,244,224,0.76)', acc: '#FFB703', card: 'rgba(255,255,255,0.1)', stamp: '#FFB703' };

export default {
  name: 'Рассвет у подножия',
  acts: [
    { // I. Сборы: ночь, комната, карта пути на стене
      title: 'Сборы', story: 'Ночь перед стартом: карта на стене, package main на экране.',
      pal: { ...dark, scrim: '#20243F' },
      bg: (W, H, rng) => sky(W, H, [[0, '#2B2F55'], [1, '#1C1F3A']]) +
        Array.from({ length: Math.ceil(H / 70) * 16 }, (_, i) => `<path d="M${(i % 16) * 70 + ((i / 16 | 0) % 2) * 35} ${(i / 16 | 0) * 70 + 20} l6 8 l-6 8 l-6 -8z" fill="#FFFFFF" opacity=".035"/>`).join(''),
      back: (rng) => {
        const out = sky(400, 380, [[0, '#0B1026'], [1, '#2A3A6E']]) + stars(rng, 60, 0, 0, 400, 250, '#FFFFFF', 1.5) + glow(300, 90, 120, '#FFF3C4', 0.25);
        return windowAt(600, 170, 400, 380, out, { part: 'glass' }) +
          `<path d="M600 560 L1000 560 L1080 1100 L420 1100Z" fill="#9FB4FF" opacity=".07"/>` +
          floorPlanks(860, 1080, '#4E3A2B', '#3B2B1F') + rug(470, 985, 340, 62, '#7A2E3B', '#E9C46A');
      },
      front: (rng) => {
        // вид из окна: луна и далёкая цель — вершина с флажком
        const view = moon(300, 86, 34, '#121A3C') +
          range([[-20, 380], [40, 300], [110, 330], [190, 220], [250, 270], [310, 186], [370, 260], [420, 380]], '#33416E', { snow: 260, snowColor: '#DDE6FF' }) +
          `<path d="M310 186 V160" stroke="#FFD166" stroke-width="2.5"/><path d="M310 160 l16 5 l-16 5z" fill="#E63946"/>` + glow(310, 176, 50, '#FFD166', 0.3);
        let s = windowAt(600, 170, 400, 380, view, { frame: '#4A3728' }) + roadmapPoster(70, 200, 380, 270, 0) +
          `<g transform="translate(520 210)"><circle r="44" fill="#F1E3C8" stroke="#4A3728" stroke-width="6"/><path d="M0 0 L0 -30 M0 0 L22 10" stroke="${L}" stroke-width="5" stroke-linecap="round"/><circle r="4" fill="${L}"/></g>`;
        s += desk(640, 640, 400, 240, '#7A5236', '#5C3D27');
        s += laptop(690, 640, 210, ['package main', '', 'func main() {', '  // завтра в путь', '}']);
        s += lamp(1000, 640, 0.85) + `<rect x="930" y="604" width="34" height="36" rx="5" fill="#F8F9FA" stroke="${L}" stroke-width="2.5"/><path d="M964 612 q12 0 12 10 q0 10 -12 10" fill="none" stroke="${L}" stroke-width="4"/>`;
        s += bookStack(70, 1000, [['#3A86FF', 'Go'], ['#FFBE0B', 'SQL', '#2B1B17'], ['#2A9D8F', 'Linux'], ['#E63946', 'git']], 150);
        // Clawd выглядывает из открытого рюкзака
        s += clawd(258, 748, 0.92, { hat: 'nightcap', both: true, eyes: 'happy', shadow: false });
        s += backpackProp(312, 1000, 1.05, { inside: `<rect x="-84" y="-206" width="24" height="56" fill="#3A86FF" stroke="${L}" stroke-width="2" transform="rotate(-16 -72 -178)"/><rect x="62" y="-200" width="22" height="50" fill="#FFBE0B" stroke="${L}" stroke-width="2" transform="rotate(14 73 -175)"/>` });
        s += gopherOn(dressed({ hat: 'prop' }, { arms: 'hold', eyes: 'happy', look: -0.7, tilt: -4, item: items.book('Go') }), 600, 1010, 320);
        return s;
      },
    },
    { // II. Первые шаги: утро, тропа к лесу, камни со словами Go
      title: 'Первые шаги', story: 'Утро. var, if, for, func — по камням через лес.',
      pal: { ...light, scrim: '#FDE8D0' },
      bg: (W, H, rng) => sky(W, H, [[0, '#BFE3F2'], [0.5, '#FDE8D0'], [1, '#FFD1A9']]) + sun(W * 0.82, H * 0.5, 46, { color: '#FFE29A' }) +
        cloud(W * 0.2, H * 0.12, 260, '#FFFFFF', 0.7) + cloud(W * 0.7, H * 0.2, 200, '#FFFFFF', 0.6) + cloud(W * 0.45, H * 0.32, 180, '#FFF4E6', 0.55),
      back: (rng) => range([[-40, 520], [90, 430], [200, 480], [330, 330], [430, 400], [560, 250], [660, 330], [760, 170], [860, 280], [960, 230], [1120, 420]], '#9D8EC1', { op: 0.85, snow: 300, light: '#C9BEE6', lightOp: 0.45 }) +
        hill(640, 36, '#A7C4A0', { phase: 0.4 }) +
        forest(rng, -30, 1110, 730, 90, 170, ['#3A5A40', '#344E41', '#588157']) +
        hill(800, 26, '#90BE6D', { phase: 1.3 }) + hill(905, 18, '#6A994E', { phase: 2.1 }) +
        `<path d="M150 1100 C300 1000 420 960 560 920 S800 820 880 760 L905 762 C840 830 640 950 560 990 S430 1060 420 1100Z" fill="#E9D8A6"/>`,
      front: (rng) => {
        let s = '';
        const sc = (x, y, k, inner) => `<g transform="translate(${x} ${y}) scale(${k})">${inner}</g>`;
        s += `<path d="M760 180 V140" stroke="#5C3D5E" stroke-width="4"/><path d="M760 140 l22 6 l-22 6z" fill="#E63946" stroke="${L}" stroke-width="1.5"/>`;
        s += sc(905, 762, 0.5, stone(0, 0, 'func')) + sc(745, 866, 0.66, stone(0, 0, 'for')) + sc(655, 968, 0.82, stone(0, 0, 'if')) + sc(430, 1082, 1, stone(0, 0, 'var'));
        s += signpost(150, 1010, 340, [['Этап 1 · Основы', '#FFD166', -3, 1], ['Вершина ↑', '#A8DADC', 4, 1], ['Дом', '#E9C46A', -2, -1]], { fs: 24 });
        s += gopherOn(dressed({ hat: 'propSide', back: packs.side() }, { view: 'side', arms: [34, -40], feet: 'walk', tilt: 4, eyes: 'happy' }), 470, 1000, 300);
        s += clawdOn(840, 830, 0.7, { hat: 'prop', item: () => CI.flag('GO', '#00ADD8'), jump: 12 });
        s += birds(rng, 5, 380, 900, 260, 420) + tufts(rng, 26, 0, 1080, 1030, 1095) + flowers(rng, 40, 0, 1080, 1040, 1100);
        return s;
      },
    },
    { // III. Лагерь у подножия: сумерки, костёр, палатка, указатели на доске
      title: 'Лагерь у подножия', story: 'У костра: p := &x — указатели уже не страшны.',
      pal: { ...dark, scrim: '#1B1335' },
      bg: (W, H, rng) => sky(W, H, [[0, '#1B1335'], [0.45, '#3D2457'], [0.75, '#8C3B5E'], [1, '#E07A5F']]) + stars(rng, 120, 0, 0, W, H * 0.45, '#FFFFFF', 1.6) + moon(W * 0.16, H * 0.08, 26, '#1D1538'),
      back: (rng) => range([[-40, 640], [100, 520], [220, 560], [380, 300], [520, 150], [620, 230], [740, 190], [900, 400], [1120, 560]], '#3C2A4D', { snow: 330, snowColor: '#E8DAF0', light: '#8E7AB5', lightOp: 0.35, capH: 120 }) +
        forest(rng, -30, 1110, 880, 110, 190, ['#1F1B2E', '#251F38', '#2B2440']) +
        hill(930, 16, '#2F3E2E') + glow(620, 960, 460, '#FF9F1C', 0.42, 460, 260),
      front: (rng) => {
        let s = tent(230, 1000, 1, { lit: true });
        const box = (x, y, v, name, c) => `<rect x="${x}" y="${y}" width="96" height="56" rx="6" fill="#1E4D3A" stroke="${c}" stroke-width="3"/>${txt(x + 48, y + 38, v, 24, c, 'text-anchor="middle" font-weight="800"', SVGM)}${txt(x + 48, y + 80, name, 19, '#E9F5DB', 'text-anchor="middle"', SVGM)}`;
        s += chalkboard(730, 600, 320, 240, [
          [20, 40, 'x := 42', '#E9F5DB', 20], box(24, 66, '42', 'x', '#E9F5DB'), box(196, 66, '&x', 'p', '#FFD166'),
          `<path d="M196 94 Q150 60 124 86" stroke="#FFD166" stroke-width="3" fill="none"/><path d="M124 86 l14 -2 l-6 12z" fill="#FFD166"/>`,
          [20, 196, 'p := &x;  *p = 7', '#FFADAD', 19],
        ]);
        s += log(430, 1018, 130) + log(700, 1022, 120);
        s += campfire(620, 1010, 1);
        // гофер сидит у костра и показывает на доску
        const gw = 270;
        s += gopherAt(dressed({ hat: 'prop' }, { view: 'sit', arms: [0, -118], eyes: 'up', look: 0.9 }), 470 - gw / 2, 990 - gw * 1.2 * 0.86, gw);
        s += clawd(712, 988 - 98 * 0.8, 0.8, { hat: 'prop', item: 'marshmallow', flip: true, eyes: 'happy' });
        s += Array.from({ length: 14 }, () => `<circle cx="${(rng() * 1080).toFixed(0)}" cy="${(700 + rng() * 300).toFixed(0)}" r="${(2 + rng() * 2).toFixed(1)}" fill="#FFE066" opacity="${(0.5 + rng() * 0.5).toFixed(2)}"/>`).join('');
        return s;
      },
    },
    { // IV. Hello, World: рассвет на первом гребне, самолётик в небо
      title: 'Hello, World', story: 'Hello, World улетел в небо. Этап 1 позади.',
      pal: { ...light, scrim: '#FFF1D6' },
      bg: (W, H, rng) => sky(W, H, [[0, '#FFF1D6'], [0.5, '#FFD3A5'], [0.8, '#FFA987'], [1, '#F68F7A']]) + sun(W * 0.66, H * 0.6, 84, { rays: 18, rayOp: 0.07 }) +
        cloud(W * 0.18, H * 0.2, 240, '#FFFFFF', 0.6) + cloud(W * 0.86, H * 0.28, 200, '#FFF4E6', 0.55),
      back: (rng) => range([[-40, 760], [120, 640], [260, 700], [400, 610], [520, 760]], '#D8A7B1', { op: 0.75 }) +
        range([[300, 840], [470, 520], [560, 560], [700, 290], [800, 380], [900, 330], [1120, 700]], '#B67C92', { op: 0.9, snow: 430, light: '#E8A9A0', lightOp: 0.4 }) +
        Array.from({ length: 10 }, (_, i) => `<ellipse cx="${i * 120}" cy="${780 + (i % 3) * 24}" rx="${180 + (i % 2) * 60}" ry="40" fill="#FFFFFF" opacity=".55"/>`).join('') +
        `<path d="M-40 1100 L-40 880 Q200 820 420 862 Q640 904 820 1010 L820 1100Z" fill="#7E9C52"/><path d="M-40 940 Q220 900 440 930 Q640 960 820 1060 L820 1100 L-40 1100Z" fill="#6B8B45"/><path d="M-40 890 Q200 830 420 870 Q640 912 820 1018 L820 1000 Q640 890 420 850 Q200 810 -40 872Z" fill="#A3B86C"/>` +
        hill(1040, 14, '#A3B18A', { x0: 760 }) + tent(950, 1052, 0.24, { c: '#F4A261' }) + `<path d="M950 990 q-14 -24 6 -40 q18 -16 2 -40" stroke="#FFFFFF" stroke-width="5" fill="none" opacity=".6"/>`,
      front: (rng) => {
        let s = trail('M440 620 Q560 520 700 470', { c: '#FFFFFF', w: 4 });
        s += `<path d="M880 400 L800 420" stroke="#7F5539" stroke-width="3"/>` + ribbon(640, 450, 300, 'Hello, World!', { c: '#FFFFFF', ink: '#D62828', fs: 34, r: -10 });
        s += plane(920, 390, 2.4, -18);
        s += backpackProp(110, 878, 0.5, { open: false });
        s += pennant(560, 900, 190, 'Этап 1 ✓', '#D62828') + `<path d="M700 292 V256" stroke="#5C3D5E" stroke-width="4"/><path d="M700 256 l20 6 l-20 6z" fill="#E63946" stroke="${L}" stroke-width="1.5"/>`;
        s += gopherOn(dressed({ hat: ['straps', 'prop'] }, { arms: 'up', eyes: 'happy', lift: 22, squash: 1.06, feet: 'jump' }), 330, 868, 320);
        s += clawdOn(690, 950, 0.88, { hat: 'prop', wave: true, jump: 34, eyes: 'happy' });
        s += flowers(rng, 50, 0, 800, 900, 1090, ['#FFD166', '#FF8FA3', '#FFFFFF']) + birds(rng, 4, 250, 980, 80, 260, '#8C3B5E');
        return s;
      },
    },
  ],
};
