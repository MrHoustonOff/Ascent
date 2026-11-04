// Этап 3 · Конкурентность и рантайм — цирк горутин: афиша вечером → репетиция с гонкой данных →
// канатоходец по каналу с шестом-мьютексом → премьера, где тысячи горутин и ни одной гонки.
import {
  L, SVGM, SVGF, txt, esc, stars, rngFrom, gopherOn, gopherAt, dressed, clawd, clawdOn, CI, csign,
  sky, glow, moon, ribbon,
} from './kit.js';

const base = { hat: 'bow' };
const ORB = { c: '#5CE1E6', p: '#FF5CA8', y: '#FFD166' };
const orb = (x, y, c, r = 14) => `<circle cx="${x}" cy="${y}" r="${r * 1.7}" fill="${c}" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${L}" stroke-width="2.2"/><text x="${x}" y="${y + r * 0.36}" text-anchor="middle" font-size="${r * 0.92}" font-weight="800" fill="#1B1035" ${SVGM}>go</text>`;
// полосатый шатёр: x0…x1 — основание, ground — земля, apex — вершина
function bigTop(x0, x1, ground, eave, apex, { a = '#D62828', b = '#FFF3E0' } = {}) {
  const ax = (x0 + x1) / 2, n = 10;
  let s = '';
  for (let i = 0; i < n; i++) {
    const xa = x0 + (x1 - x0) * i / n, xb = x0 + (x1 - x0) * (i + 1) / n;
    s += `<path d="M${xa} ${eave} L${xb} ${eave} L${xb} ${ground} L${xa} ${ground}Z" fill="${i % 2 ? a : b}"/>`;
    s += `<path d="M${ax} ${apex} L${xa} ${eave} L${xb} ${eave}Z" fill="${i % 2 ? b : a}"/>`;
  }
  s += Array.from({ length: n }, (_, i) => { const x = x0 + (x1 - x0) * (i + 0.5) / n; return `<path d="M${x - (x1 - x0) / n / 2} ${eave} Q${x} ${eave + 30} ${x + (x1 - x0) / n / 2} ${eave}" fill="${i % 2 ? b : a}"/>`; }).join('');
  return s + `<path d="M${ax} ${apex} V${apex - 70}" stroke="#2B1B17" stroke-width="5"/><path d="M${ax} ${apex - 70} l40 10 l-40 10z" fill="#FFD166"/>`;
}
// гирлянда лампочек по провисающей кривой
function lights(x0, y0, x1, y1, sag, n, colors = ['#FFD166', '#FF5CA8', '#5CE1E6', '#90BE6D']) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag;
  let s = `<path d="M${x0} ${y0} Q${mx} ${my + sag} ${x1} ${y1}" stroke="#2B1B17" stroke-width="3" fill="none"/>`;
  for (let i = 1; i < n; i++) { const t = i / n, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (my + sag) + t * t * y1; const c = colors[i % colors.length]; s += glow(x, y + 10, 26, c, 0.55) + `<circle cx="${x}" cy="${y + 10}" r="8" fill="${c}" stroke="${L}" stroke-width="1.5"/>`; }
  return s;
}
// ряды зрителей-силуэтов
const crowd = (rng, y, x0, x1, c = '#140A1F', r = 26, lift = 0) => { let s = '', x = x0; while (x < x1) { const rr = r * (0.8 + rng() * 0.4); s += `<circle cx="${x}" cy="${y - rr - rng() * 8}" r="${rr * 0.62}" fill="${c}"/><path d="M${x - rr} ${y + 40} Q${x - rr} ${y - rr * 0.6} ${x} ${y - rr * 0.6} Q${x + rr} ${y - rr * 0.6} ${x + rr} ${y + 40}Z" fill="${c}"/>` + (lift && rng() < lift ? `<path d="M${x + rr * 0.5} ${y - rr * 0.5} L${x + rr * 0.9} ${y - rr * 2}" stroke="${c}" stroke-width="${rr * 0.32}" stroke-linecap="round"/>` : ''); x += rr * 1.7; } return s; };
const beam = (x0, y0, x1, y1, w, c = '#FFF6C9', op = 0.14) => `<path d="M${x0 - 14} ${y0} L${x0 + 14} ${y0} L${x1 + w} ${y1} L${x1 - w} ${y1}Z" fill="${c}" opacity="${op}"/>` + glow(x1, y1, w * 1.3, c, op * 2.2, w * 1.3, w * 0.35);
const ticket = `<path d="M54 146 L146 146 L146 160 Q138 166 146 172 L146 190 L54 190 L54 172 Q62 166 54 160Z" fill="#FF8FA3" stroke="${L}" stroke-width="2.4"/><path d="M118 148 V188" stroke="${L}" stroke-width="2" stroke-dasharray="4 4"/><text x="86" y="174" text-anchor="middle" font-size="14" font-weight="900" fill="#2B1B17" ${SVGF}>ВХОД</text><text x="132" y="173" text-anchor="middle" font-size="10" font-weight="800" fill="#2B1B17" ${SVGM}>go</text>`;
const balloon = (c = '#FF5CA8', t = 'go') => `<path d="M136 30 Q150 -20 132 -70" stroke="${L}" stroke-width="2" fill="none"/><ellipse cx="132" cy="-102" rx="30" ry="36" fill="${c}" stroke="${L}" stroke-width="2.4"/><path d="M128 -66 l4 -6 l4 6z" fill="${c}" stroke="${L}" stroke-width="1.6"/><ellipse cx="121" cy="-114" rx="7" ry="11" fill="#fff" opacity=".45"/><text x="132" y="-95" text-anchor="middle" font-size="18" font-weight="900" fill="#fff" ${SVGM}>${esc(t)}</text>`;
const stopwatch = `<circle cx="146" cy="28" r="24" fill="#F8F9FA" stroke="${L}" stroke-width="2.6"/><rect x="140" y="-4" width="12" height="9" fill="#ADB5BD" stroke="${L}" stroke-width="1.6"/><path d="M146 28 L146 12 M146 28 L158 34" stroke="#E63946" stroke-width="3" stroke-linecap="round"/>`;

export default {
  name: 'Цирк горутин',
  acts: [
    { // I. Афиша: вечерняя площадь у шатра
      title: 'Афиша', story: 'Вечер у шатра: «Цирк горутин» — go func() и билет в руке.',
      pal: { ink: '#FFF6E5', muted: 'rgba(255,246,229,0.76)', acc: '#FFD166', card: 'rgba(255,255,255,0.1)', stamp: '#FF5CA8', scrim: '#120B2B' },
      bg: (W, H, rng) => sky(W, H, [[0, '#120B2B'], [0.6, '#2A1B54'], [1, '#4B2C6B']]) + stars(rng, 140, 0, 0, W, H * 0.6, '#FFFFFF', 1.6) + moon(W * 0.14, H * 0.07, 30, '', true),
      back: (rng) => {
        let s = '';
        let x = -20; while (x < 420) { const w = 60 + rng() * 60, h = 120 + rng() * 140; s += `<rect x="${x}" y="${900 - h}" width="${w}" height="${h + 100}" fill="#24183F"/>`; for (let yy = 900 - h + 16; yy < 880; yy += 28) for (let xx = x + 10; xx < x + w - 14; xx += 22) if (rng() < 0.45) s += `<rect x="${xx}" y="${yy}" width="10" height="14" fill="#FFD27A" opacity=".8"/>`; x += w + 6; }
        s += glow(730, 760, 420, '#FF9F1C', 0.35);
        s += bigTop(380, 1100, 980, 680, 340);
        s += `<rect x="-20" y="960" width="1120" height="140" fill="#2B1F3F"/>` + Array.from({ length: 9 }, (_, i) => `<path d="M-20 ${978 + i * 14} H1100" stroke="#3A2C52" stroke-width="2"/>`).join('');
        return s;
      },
      front: () => {
        let s = `<path d="M740 344 V270" stroke="#2B1B17" stroke-width="6"/><path d="M740 270 l44 12 l-44 12z" fill="#FFD166" stroke="${L}" stroke-width="2"/>`;
        s += lights(-20, 400, 740, 290, 60, 14) + lights(740, 290, 1100, 420, 40, 8);
        s += `<path d="M680 980 L680 840 Q740 780 800 840 L800 980Z" fill="#FFD98E"/>` + glow(740, 900, 120, '#FFB703', 0.55) +
          `<path d="M672 980 L672 832 Q700 860 712 980Z M808 980 L808 832 Q780 860 768 980Z" fill="#8E1B2B" stroke="${L}" stroke-width="2"/>`;
        // тумба с афишей
        s += `<rect x="70" y="540" width="250" height="440" rx="8" fill="#5E3B6B" stroke="${L}" stroke-width="4"/><path d="M50 540 Q195 500 340 540 L340 556 L50 556Z" fill="#3E2550" stroke="${L}" stroke-width="3"/><path d="M110 500 Q195 470 280 500 L270 520 L120 520Z" fill="#3E2550" stroke="${L}" stroke-width="3"/>` +
          `<rect x="92" y="580" width="206" height="300" fill="#FFF3E0" stroke="${L}" stroke-width="3"/><rect x="92" y="580" width="206" height="54" fill="#D62828"/>` +
          txt(195, 606, 'ЦИРК', 26, '#FFF3E0', 'text-anchor="middle" font-weight="900"') + txt(195, 628, 'ГОРУТИН', 20, '#FFD166', 'text-anchor="middle" font-weight="900"') +
          orb(140, 690, ORB.c, 13) + orb(195, 668, ORB.y, 13) + orb(250, 690, ORB.p, 13) + `<path d="M140 690 Q195 620 250 690" stroke="#2B1B17" stroke-width="2" stroke-dasharray="4 4" fill="none"/>` +
          txt(195, 750, 'go func() {…}()', 19, '#2B1B17', 'text-anchor="middle" font-weight="800"', SVGM) +
          txt(195, 790, 'сегодня:', 17, '#6B4E71', 'text-anchor="middle"') + txt(195, 816, 'горутины · каналы', 17, '#2B1B17', 'text-anchor="middle" font-weight="700"') + txt(195, 840, 'select · mutex', 17, '#2B1B17', 'text-anchor="middle" font-weight="700"') +
          txt(195, 866, '19:00 · вход свободный', 14, '#6B4E71', 'text-anchor="middle"');
        s += gopherOn(dressed(base, { arms: 'hold', eyes: 'happy', look: -0.8, tilt: -3, item: ticket }), 490, 1012, 300);
        s += clawdOn(890, 1000, 0.82, { hat: 'top', item: () => balloon('#FF5CA8', 'go'), eyes: 'happy' });
        return s;
      },
    },
    { // II. Репетиция: пустая арена, два шара и гонка данных
      title: 'Репетиция', story: 'Репетиция: два шара в воздухе — и первая гонка данных.',
      pal: { ink: '#FFF3E0', muted: 'rgba(255,243,224,0.76)', acc: '#FF8FA3', card: 'rgba(255,255,255,0.1)', stamp: '#FF8FA3', scrim: '#24120F' },
      bg: (W, H) => sky(W, H, [[0, '#24120F'], [1, '#3B1D17']]) + Array.from({ length: 16 }, (_, i) => `<path d="M${W / 2} -200 L${(i - 1) * W / 14} ${H} L${i * W / 14} ${H}Z" fill="${i % 2 ? '#5A1F1A' : '#2E1410'}" opacity=".7"/>`).join(''),
      back: (rng) => `<ellipse cx="540" cy="980" rx="620" ry="170" fill="#3A1A14"/>` + crowd(rng, 780, -20, 1100, '#2A120E', 30) +
        `<ellipse cx="540" cy="990" rx="470" ry="120" fill="#B5793E"/><ellipse cx="540" cy="990" rx="430" ry="104" fill="#C98B4F"/>` + beam(540, -40, 540, 990, 260, '#FFF0C8', 0.12),
      front: () => {
        let s = `<ellipse cx="540" cy="990" rx="470" ry="120" fill="none" stroke="#FFD166" stroke-width="10" stroke-dasharray="40 26"/>`;
        s += `<path d="M260 270 V520 M420 270 V520" stroke="#C9A227" stroke-width="5"/><rect x="252" y="516" width="176" height="14" rx="6" fill="#8E1B2B" stroke="${L}" stroke-width="2.5"/>`;
        s += `<g transform="translate(860 930) rotate(-12)"><circle cx="0" cy="0" r="54" fill="none" stroke="#343A40" stroke-width="10"/><path d="M0 0 V-110 M-20 -110 H24" stroke="#343A40" stroke-width="8"/><rect x="-20" y="-124" width="44" height="16" rx="6" fill="#E63946"/></g>`;
        // два шара по дуге и третий, столкнувшийся с ними
        const juggle = `<path d="M40 -6 Q100 -100 160 -6" stroke="#5CE1E6" stroke-width="3" stroke-dasharray="6 7" fill="none"/>` + orb(40, -30, ORB.c) + orb(150, -56, ORB.p) +
          `<g transform="translate(176 -96)">${orb(18, -12, ORB.y)}<path d="M-6 -2 l-14 -4 M-4 6 l-14 6 M2 -18 l-8 -12" stroke="#FFF6C9" stroke-width="3" stroke-linecap="round"/></g>`;
        s += gopherOn(dressed(base, { arms: 'up', eyes: 'wide', look: 0.6, hat: ['bow', juggle, 'sweat'] }), 520, 1000, 300);
        s += `<g transform="translate(830 300) rotate(6)"><path d="M-130 -42 L130 -42 L150 0 L130 42 L-130 42 L-150 0Z" fill="#E63946" stroke="${L}" stroke-width="4"/>${txt(0, 14, 'DATA RACE!', 40, '#FFFFFF', 'text-anchor="middle" font-weight="900"')}</g>`;
        s += clawdOn(210, 1010, 0.95, { hat: 'top', item: () => csign('go test -race', '#FFF3E0'), eyes: 'open' });
        return s;
      },
    },
    { // III. Канатоходец: канал — это канат между горутинами
      title: 'Канатоходец', story: 'ch <- 42: по каналу с шестом-мьютексом, Clawd принимает.',
      pal: { ink: '#FFFFFF', muted: 'rgba(255,255,255,0.76)', acc: '#5CE1E6', card: 'rgba(255,255,255,0.1)', stamp: '#5CE1E6', scrim: '#140A2A' },
      bg: (W, H, rng) => sky(W, H, [[0, '#140A2A'], [1, '#2A1650']]) + stars(rng, 90, 0, 0, W, H * 0.5, '#FFE8A8', 1.4),
      back: (rng) => Array.from({ length: 14 }, (_, i) => `<path d="M540 -300 L${(i - 1) * 84} 1100 L${i * 84} 1100Z" fill="${i % 2 ? '#2E1A5C' : '#1E1040'}" opacity=".6"/>`).join('') +
        beam(-40, -40, 520, 520, 120, '#5CE1E6', 0.1) + beam(1120, -40, 520, 520, 120, '#FF5CA8', 0.1) + crowd(rng, 1000, -20, 1100, '#0E0620', 30),
      front: (rng) => {
        let s = '';
        // платформы и канат-канал
        for (const [x, w] of [[40, 160], [880, 160]]) s += `<rect x="${x + w / 2 - 8}" y="590" width="16" height="520" fill="#6C757D" stroke="${L}" stroke-width="2"/><rect x="${x}" y="580" width="${w}" height="22" rx="4" fill="#C9A227" stroke="${L}" stroke-width="3"/>`;
        s += `<path d="M200 590 Q540 642 880 590" stroke="#F1E3C8" stroke-width="6" fill="none"/>`;
        s += txt(120, 560, 'go send()', 22, '#FFD166', 'text-anchor="middle" font-weight="800"', SVGM) + txt(960, 540 - 110, 'chan int', 22, '#5CE1E6', 'text-anchor="middle" font-weight="800"', SVGM);
        // сетка безопасности с таймаутом
        let net = `<path d="M110 840 Q540 930 970 840" stroke="#ADB5BD" stroke-width="4" fill="none"/><path d="M110 870 Q540 960 970 870" stroke="#ADB5BD" stroke-width="4" fill="none"/>`;
        for (let i = 0; i <= 24; i++) { const x = 110 + i * 35; net += `<path d="M${x} ${840 + Math.sin(i / 24 * Math.PI) * 45} L${x + 17} ${870 + Math.sin((i + 0.5) / 24 * Math.PI) * 45}" stroke="#ADB5BD" stroke-width="2"/>`; }
        s += net + crowd(rngFrom(33), 1080, -30, 1110, '#0A0418', 34, 0.25) + `<g transform="translate(540 960)"><rect x="-150" y="-26" width="300" height="46" rx="8" fill="#212529" stroke="#5CE1E6" stroke-width="3"/>${txt(0, 6, 'ctx: таймаут 3s', 22, '#5CE1E6', 'text-anchor="middle" font-weight="800"', SVGM)}</g>`;
        // гофер на канате: шест sync.Mutex, на голове значение 42
        const pole = `<rect x="-130" y="152" width="460" height="12" rx="6" fill="#C9A227" stroke="${L}" stroke-width="2"/><rect x="-136" y="146" width="22" height="24" rx="5" fill="#E63946" stroke="${L}" stroke-width="2"/><rect x="314" y="146" width="22" height="24" rx="5" fill="#E63946" stroke="${L}" stroke-width="2"/>` +
          `<rect x="-112" y="118" width="128" height="30" rx="5" fill="#1B1035" stroke="#FFD166" stroke-width="2"/><text x="-48" y="139" text-anchor="middle" font-size="17" font-weight="800" fill="#FFD166" ${SVGM}>sync.Mutex</text>`;
        const value = `<rect x="68" y="-48" width="64" height="50" rx="5" fill="#E9C46A" stroke="${L}" stroke-width="2.4"/><text x="100" y="-14" text-anchor="middle" font-size="24" font-weight="900" fill="#2B1B10" ${SVGM}>42</text>`;
        s += glow(530, 520, 180, '#FFF6C9', 0.25);
        s += gopherOn(dressed(base, { arms: 'hold', eyes: 'wide', look: 0.5, tilt: -4, item: pole, hat: ['bow', value] }), 530, 626, 250);
        s += clawdOn(950, 582, 0.95, { hat: 'top', item: () => csign('<-ch', '#5CE1E6', '#140A2A') });
        return s;
      },
    },
    { // IV. Премьера: полный зал, три шара и рой горутин
      title: 'Премьера', story: 'Премьера: тысячи горутин — и ни одной гонки.',
      pal: { ink: '#FFFFFF', muted: 'rgba(255,255,255,0.8)', acc: '#FFD166', card: 'rgba(255,255,255,0.12)', stamp: '#FFD166', scrim: '#2A0A14' },
      bg: (W, H) => sky(W, H, [[0, '#2A0A14'], [1, '#5A1024']]) + Array.from({ length: 18 }, (_, i) => `<path d="M${W / 2} -260 L${(i - 1) * W / 16} ${H} L${i * W / 16} ${H}Z" fill="${i % 2 ? '#8E1B2B' : '#F1E3C8'}" opacity=".22"/>`).join(''),
      back: (rng) => crowd(rng, 760, -20, 1100, '#24060E', 28, 0.3) + crowd(rng, 850, -40, 1120, '#1A040A', 32, 0.4) +
        `<ellipse cx="540" cy="1000" rx="520" ry="130" fill="#C9A227"/><ellipse cx="540" cy="1000" rx="480" ry="112" fill="#8E1B2B"/>` +
        beam(80, -40, 540, 900, 200, '#FFF6C9', 0.12) + beam(1000, -40, 540, 900, 200, '#FFD166', 0.12) + beam(540, -60, 540, 900, 160, '#FFFFFF', 0.08),
      front: (rng) => {
        let s = ribbon(540, 250, 520, 'Ни одной гонки!', { c: '#FFD166', ink: '#5A1024', fs: 40, r: 0 });
        s += `<ellipse cx="540" cy="990" rx="270" ry="46" fill="#FF5CA8" stroke="#FFD166" stroke-width="6"/>` + Array.from({ length: 9 }, (_, i) => `<path d="M${282 + i * 60} 1000 l30 0 l0 80 l-30 0z" fill="${i % 2 ? '#FFD166' : '#FF5CA8'}"/>`).join('');
        // рой мини-горутин по кругу арены
        const run = { view: 'side', arms: [60, -70], feet: 'walk', tilt: 8, eyes: 'happy' };
        [[60, 900, 110, false], [170, 960, 96, false], [870, 900, 110, true], [960, 990, 96, true], [250, 1040, 88, false], [880, 1066, 84, true]].forEach(([x, y, w, f]) => { s += gopherAt({ ...run, flip: f }, x - w / 2, y - w * 1.2 * 0.94, w); });
        const juggle = `<path d="M34 -10 Q100 -110 166 -10" stroke="#5CE1E6" stroke-width="3" stroke-dasharray="6 7" fill="none"/>` + orb(34, -10, ORB.c) + orb(100, -84, ORB.y) + orb(166, -10, ORB.p) +
          [[-10, -60], [210, -60], [100, -150]].map(([x, y]) => `<path d="M${x} ${y - 12} L${x + 4} ${y - 4} L${x + 12} ${y} L${x + 4} ${y + 4} L${x} ${y + 12} L${x - 4} ${y + 4} L${x - 12} ${y} L${x - 4} ${y - 4}Z" fill="#FFF6C9"/>`).join('');
        s += gopherOn(dressed(base, { arms: 'up', eyes: 'happy', lift: 14, squash: 1.05, hat: ['bow', juggle] }), 540, 976, 300);
        s += clawdOn(740, 1000, 0.85, { hat: 'top', wave: true, jump: 22, eyes: 'happy' });
        s += Array.from({ length: 80 }, () => { const x = rng() * 1080, y = 120 + rng() * 760, c = ['#FFD166', '#FF5CA8', '#5CE1E6', '#FFFFFF'][Math.floor(rng() * 4)]; return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${(8 + rng() * 8).toFixed(0)}" height="${(4 + rng() * 5).toFixed(0)}" fill="${c}" transform="rotate(${(rng() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`; }).join('');
        return s;
      },
    },
  ],
};
