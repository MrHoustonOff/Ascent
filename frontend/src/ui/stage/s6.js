// Этап 6 · Брокеры и эксплуатация — диспетчерская: ночной алерт и лаг → сортировочная станция топика с партициями
// и DLQ → обсерватория метрик и трейсов → тихое утро: всё зелёное, пейджер молчит.
import {
  L, SVGM, SVGF, txt, esc, stars, rngFrom, gopherOn, gopherAt, dressed, items, clawd, clawdOn, CI, csign,
  sky, glow, sun, cloud, hill, windowAt, lamp, crate, range,
} from './kit.js';

const ops = { hat: 'headset' };
const alarmClock = `<g transform="translate(146 26)"><circle r="22" fill="#E63946" stroke="${L}" stroke-width="2.4"/><circle r="15" fill="#FFFDF5" stroke="${L}" stroke-width="1.6"/><path d="M0 0 V-10 M0 0 L8 4" stroke="${L}" stroke-width="2.4"/><circle cx="-16" cy="-20" r="8" fill="#FFD166" stroke="${L}" stroke-width="2"/><circle cx="16" cy="-20" r="8" fill="#FFD166" stroke="${L}" stroke-width="2"/><path d="M-34 -6 l-10 -4 M-34 6 l-12 2 M34 -6 l10 -4 M34 6 l12 2" stroke="#FFD166" stroke-width="3" stroke-linecap="round"/></g>`;
const magnifier = `<circle cx="150" cy="22" r="18" fill="#CFF4FF" fill-opacity=".6" stroke="${L}" stroke-width="4"/><path d="M137 36 L120 56" stroke="#7F5539" stroke-width="7" stroke-linecap="round"/>`;
const monitor = (x, y, w, h, inner, bezel = '#2B3440') => `<g transform="translate(${x} ${y})"><rect x="${w / 2 - 14}" y="${h}" width="28" height="30" fill="#495057"/><rect x="${w / 2 - 50}" y="${h + 26}" width="100" height="10" rx="4" fill="#495057"/><rect width="${w}" height="${h}" rx="10" fill="#111820" stroke="${bezel}" stroke-width="6"/><rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="4" fill="#0E1A14"/>${inner}</g>`;

export default {
  name: 'Диспетчерская',
  acts: [
    { // I. Ночная смена: алерт, лаг растёт, пейджер звонит
      title: 'Ночная смена', story: 'Три часа ночи: лаг консьюмера растёт, пейджер кричит.',
      pal: { ink: '#FFECE8', muted: 'rgba(255,236,232,0.76)', acc: '#FF6B6B', card: 'rgba(255,255,255,0.1)', stamp: '#FF6B6B', scrim: '#1A0E14' },
      bg: (W, H) => sky(W, H, [[0, '#1A0E14'], [1, '#2A1420']]),
      back: (rng) => windowAt(780, 290, 240, 260, sky(260, 300, [[0, '#0B1026'], [1, '#1D2A50']]) + stars(rng, 30, 0, 0, 260, 200, '#FFFFFF', 1.3) + Array.from({ length: 40 }, () => `<path d="M${rng() * 260} ${rng() * 300} l-8 22" stroke="#9FB4FF" stroke-width="2" opacity=".5"/>`).join(''), { part: 'glass' }) +
        glow(300, 380, 520, '#FF3B3B', 0.35) + `<rect x="0" y="900" width="1080" height="200" fill="#1B0F15"/>`,
      front: (rng) => {
        let s = windowAt(780, 290, 240, 260, '', { frame: '#3A2430', part: 'frame' });
        // сирена
        const sx = 300, sy = 380;
        s += `<rect x="${sx - 40}" y="${sy}" width="80" height="20" rx="4" fill="#495057" stroke="${L}" stroke-width="2"/><path d="M${sx - 34} ${sy} Q${sx} ${sy - 70} ${sx + 34} ${sy}Z" fill="#FF3B3B" stroke="${L}" stroke-width="3"/>` + glow(sx, sy - 24, 120, '#FF3B3B', 0.7) +
          Array.from({ length: 8 }, (_, i) => { const a = Math.PI + (i + 0.5) / 8 * Math.PI; return `<path d="M${sx + Math.cos(a) * 70} ${sy - 20 + Math.sin(a) * 70} L${sx + Math.cos(a) * 110} ${sy - 20 + Math.sin(a) * 110}" stroke="#FF6B6B" stroke-width="5" stroke-linecap="round"/>`; }).join('');
        // мониторы
        let line = 'M24 200'; for (let i = 1; i <= 16; i++) line += ` L${24 + i * 15} ${200 - i * i * 0.62 - (i % 3) * 6}`;
        s += monitor(420, 590, 300, 240, `<path d="${line}" stroke="#FF6B6B" stroke-width="5" fill="none"/>${txt(24, 46, 'consumer lag', 20, '#FFB4A2', 'font-weight="700"', SVGM)}${txt(24, 76, '↑ 12 403', 28, '#FF6B6B', 'font-weight="900"', SVGM)}`, '#5C2A36');
        s += monitor(740, 630, 250, 200, ['ERROR rebalance', 'WARN  retry 3/5', 'ERROR timeout', 'WARN  lag ↑'].map((t, i) => txt(22, 46 + i * 34, t, 17, i % 2 ? '#FFD166' : '#FF6B6B', 'font-weight="700"', SVGM)).join(''), '#5C2A36');
        // гофер проснулся от пейджера
        s += gopherOn(dressed(ops, { arms: [150, -150], eyes: 'wide', tilt: -8, hat: ['headset', 'sweat'] }), 220, 975, 290);
        // стол
        s += `<rect x="60" y="890" width="1000" height="26" rx="4" fill="#5C3D2E" stroke="${L}" stroke-width="3"/><rect x="80" y="916" width="960" height="190" fill="#3E2A20"/>` +
          [700, 870].map((x) => `<rect x="${x}" y="934" width="150" height="70" rx="4" fill="#4A3226" stroke="${L}" stroke-width="2"/><rect x="${x + 55}" y="962" width="40" height="10" rx="4" fill="#C9A227"/>`).join('') +
          `<path d="M300 916 Q320 990 260 1040 Q220 1080 280 1100" stroke="#212529" stroke-width="6" fill="none"/>`;
        s += `<g transform="translate(400 870) rotate(-8)"><rect x="-40" y="-26" width="80" height="50" rx="8" fill="#343A40" stroke="${L}" stroke-width="3"/><rect x="-30" y="-16" width="60" height="22" rx="3" fill="#9ED96B"/>${txt(0, 0, 'P1: лаг!', 12, '#1A0E14', 'text-anchor="middle" font-weight="900"', SVGM)}<path d="M-54 -20 l-10 -6 M-54 0 l-12 0 M54 -20 l10 -6 M54 0 l12 0" stroke="#FFD166" stroke-width="3" stroke-linecap="round"/></g>`;
        s += `<g transform="translate(640 882) rotate(80)"><rect x="-18" y="-16" width="36" height="32" rx="5" fill="#F8F9FA" stroke="${L}" stroke-width="2.5"/></g><ellipse cx="610" cy="888" rx="40" ry="6" fill="#6F4E37"/>`;
        s += clawdOn(1000, 890, 0.85, { hat: 'headset', item: alarmClock, eyes: 'open', jump: 10 });
        return s;
      },
    },
    { // II. Сортировочная станция: партиции — пути, оффсеты — вагоны, DLQ — тупик
      title: 'Сортировочная станция', story: 'Топик orders: партиции — пути, оффсеты — вагоны, сломанный — в DLQ.',
      pal: { ink: '#FFF3E0', muted: 'rgba(255,243,224,0.78)', acc: '#FFB703', card: 'rgba(255,255,255,0.11)', stamp: '#FFB703', scrim: '#2B1B3D' },
      bg: (W, H) => sky(W, H, [[0, '#2B1B3D'], [0.6, '#7B3F61'], [1, '#F28C6B']]) + sun(W * 0.75, H * 0.6, 60, { color: '#FFB86B' }),
      back: (rng) => { let s = '', x = -20; while (x < 1100) { const w = 40 + rng() * 80, h = 60 + rng() * 140; s += `<rect x="${x}" y="${600 - h}" width="${w}" height="${h + 40}" fill="#4A2C55"/>`; if (rng() < 0.4) s += `<rect x="${x + w * 0.3}" y="${600 - h - 60}" width="14" height="60" fill="#4A2C55"/>`; x += w + 6; } return s + `<rect x="0" y="560" width="1080" height="540" fill="#4A3B3F"/>`; },
      front: (rng) => {
        let s = '';
        const tracks = [[600, '#E76F51', 7, 'P0'], [710, '#2A9D8F', 5, 'P1'], [820, '#E9C46A', 6, 'P2']];
        // портал с табло
        s += `<rect x="40" y="320" width="20" height="300" fill="#495057" stroke="${L}" stroke-width="2"/><rect x="1020" y="320" width="20" height="300" fill="#495057" stroke="${L}" stroke-width="2"/><rect x="30" y="300" width="1020" height="70" rx="6" fill="#1D3557" stroke="${L}" stroke-width="4"/>` +
          txt(540, 346, 'topic: orders  ·  consumer group: billing', 24, '#FFD166', 'text-anchor="middle" font-weight="800"', SVGM);
        tracks.forEach(([y, c, n, p]) => {
          s += `<path d="M0 ${y + 30} H1080 M0 ${y + 46} H1080" stroke="#ADB5BD" stroke-width="5"/>` + Array.from({ length: 28 }, (_, i) => `<rect x="${i * 40}" y="${y + 26}" width="10" height="26" fill="#5C4033"/>`).join('');
          s += `<rect x="70" y="${y - 30}" width="56" height="34" rx="6" fill="#1D3557" stroke="${L}" stroke-width="2"/>${txt(98, y - 6, p, 20, '#FFFFFF', 'text-anchor="middle" font-weight="900"', SVGM)}`;
          for (let i = 0; i < n; i++) { const x = 150 + i * 112; s += `<rect x="${x}" y="${y - 24}" width="100" height="56" rx="6" fill="${c}" stroke="${L}" stroke-width="3"/>${txt(x + 50, y + 14, String(i), 24, '#1D1D1D', 'text-anchor="middle" font-weight="900"', SVGM)}<circle cx="${x + 22}" cy="${y + 34}" r="10" fill="#212529"/><circle cx="${x + 78}" cy="${y + 34}" r="10" fill="#212529"/>`; }
        });
        // отметка commit на P0
        s += `<path d="M622 560 V520" stroke="#FFFFFF" stroke-width="4"/><path d="M622 520 l44 10 l-44 10z" fill="#39D98A" stroke="${L}" stroke-width="2"/>` + txt(632, 514, 'commit 4', 18, '#39D98A', 'font-weight="800"', SVGM);
        // тупик DLQ со сломанным вагоном
        s += `<path d="M800 866 Q900 900 1080 960 M800 852 Q900 886 1080 946" stroke="#ADB5BD" stroke-width="5" fill="none"/>` +
          `<g transform="translate(950 916) rotate(14)"><rect x="-56" y="-30" width="112" height="56" rx="6" fill="#E63946" stroke="${L}" stroke-width="3"/><path d="M-20 -30 L-6 -6 L-18 6 L0 26" stroke="${L}" stroke-width="3" fill="none"/>${txt(18, 6, 'DLQ', 22, '#FFFFFF', 'text-anchor="middle" font-weight="900"', SVGM)}</g>`;
        // светофор
        s += `<rect x="1000" y="400" width="12" height="190" fill="#343A40"/><rect x="984" y="400" width="44" height="100" rx="10" fill="#212529" stroke="${L}" stroke-width="2"/><circle cx="1006" cy="426" r="12" fill="#5A1F1F"/>` + glow(1006, 472, 36, '#39D98A', 0.6) + `<circle cx="1006" cy="472" r="12" fill="#39D98A"/>`;
        // стрелочник и рычаг
        s += `<path d="M300 1090 L352 990" stroke="#495057" stroke-width="12" stroke-linecap="round"/><circle cx="354" cy="986" r="16" fill="#E63946" stroke="${L}" stroke-width="3"/><rect x="262" y="1076" width="90" height="24" rx="4" fill="#343A40"/>`;
        s += gopherOn(dressed(ops, { arms: [0, -70], eyes: 'happy', look: 0.8 }), 200, 1092, 220);
        s += clawdOn(620, 1080, 0.85, { hat: 'headset', item: 'lantern', wave: true });
        return s;
      },
    },
    { // III. Приборы: телескоп pprof, созвездия метрик и трейсов
      title: 'Приборы', story: 'Логи, метрики, трейсы и pprof — система видна до звёзд.',
      pal: { ink: '#EAE6FF', muted: 'rgba(234,230,255,0.76)', acc: '#B8F2E6', card: 'rgba(255,255,255,0.1)', stamp: '#B8F2E6', scrim: '#120B2B' },
      bg: (W, H, rng) => sky(W, H, [[0, '#120B2B'], [1, '#241A4A']]) + stars(rng, 220, 0, 0, W, H, '#FFFFFF', 1.5),
      back: () => `<path d="M700 920 L700 600 Q860 470 1020 600 L1020 920Z" fill="#2E2A55"/><path d="M836 520 L884 520 L900 920 L820 920Z" fill="#141033"/>` +
        `<rect x="0" y="920" width="1080" height="180" fill="#1E1A3E"/>` + glow(540, 560, 400, '#7B6CF0', 0.18),
      front: () => {
        let s = '';
        // созвездие задержки p99
        const pts = [[120, 470], [200, 430], [270, 450], [340, 380], [410, 400], [480, 300], [560, 330]];
        s += `<path d="M${pts.map(([x, y]) => `${x} ${y}`).join(' L')}" stroke="#B8F2E6" stroke-width="2.5" stroke-dasharray="4 6" fill="none"/>` + pts.map(([x, y]) => glow(x, y, 18, '#B8F2E6', 0.7) + `<circle cx="${x}" cy="${y}" r="5" fill="#FFFFFF"/>`).join('') + txt(120, 520, 'p99 latency', 20, '#B8F2E6', 'font-weight="800"', SVGM);
        // созвездие трейса: водопад спанов
        const spans = [['GET /orders', 0, 300], ['auth', 20, 60], ['db.Query', 90, 160], ['cache.Get', 260, 30]];
        s += spans.map(([t, x, w], i) => `<rect x="${640 + x}" y="${300 + i * 46}" width="${w}" height="26" rx="4" fill="none" stroke="#FFD166" stroke-width="2.5" stroke-dasharray="3 5"/>` + glow(640 + x, 313 + i * 46, 12, '#FFD166', 0.8) + glow(640 + x + w, 313 + i * 46, 12, '#FFD166', 0.8) + txt(640 + x + 6, 320 + i * 46, t, 16, '#FFE8A8', 'font-weight="700"', SVGM)).join('') + txt(640, 284, 'trace', 20, '#FFD166', 'font-weight="800"', SVGM);
        // флейм-граф на стенде
        s += `<rect x="40" y="590" width="320" height="250" rx="8" fill="#1B1640" stroke="#7B6CF0" stroke-width="4"/>` + txt(200, 626, 'flame graph', 20, '#EAE6FF', 'text-anchor="middle" font-weight="800"', SVGM);
        [[[60, 280]], [[60, 170], [236, 100]], [[60, 90], [156, 70], [236, 60]], [[70, 50], [160, 40], [240, 30]]].forEach((row, i) => row.forEach(([x, w], k) => { s += `<rect x="${x}" y="${800 - i * 36}" width="${w}" height="32" rx="3" fill="${['#E63946', '#F4A261', '#E9C46A', '#FFD166'][i]}" stroke="#1B1640" stroke-width="2"/>`; }));
        s += `<path d="M200 840 V920" stroke="#5C4033" stroke-width="10"/>`;
        // телескоп pprof
        s += `<path d="M560 920 L600 760 L640 920 M600 760 V920" stroke="#5C4033" stroke-width="10" stroke-linecap="round"/>` +
          `<g transform="translate(600 760) rotate(-38)"><rect x="-40" y="-26" width="230" height="52" rx="12" fill="#C9A227" stroke="${L}" stroke-width="4"/><rect x="176" y="-34" width="34" height="68" rx="8" fill="#8B5E3C" stroke="${L}" stroke-width="3"/>${txt(76, 9, 'pprof', 24, '#2B1B17', 'text-anchor="middle" font-weight="900"', SVGM)}</g>`;
        s += gopherOn(dressed(ops, { arms: [0, -140], eyes: 'up', look: 0.8 }), 440, 930, 270);
        // свиток логов и Clawd с лупой
        s += `<path d="M720 980 L1060 980 L1060 1010 L720 1010Z" fill="#F1E3C8" stroke="${L}" stroke-width="2.5"/><rect x="690" y="940" width="40" height="80" rx="18" fill="#E2CBA0" stroke="${L}" stroke-width="2.5"/>` +
          ['INFO  trace_id=7f…', 'WARN  slow query'].map((t, i) => txt(744, 992 + i * 13, t, 11, '#5C4033', 'font-weight="700"', SVGM)).join('');
        s += clawdOn(900, 940, 0.8, { hat: 'headset', item: magnifier, eyes: 'open' });
        return s;
      },
    },
    { // IV. Тихое утро: всё зелёное, CI зелёный, пейджер молчит
      title: 'Тихое утро', story: 'Утро: деплой зелёный, метрики спокойные, пейджер молчит.',
      pal: { ink: '#2B1B17', muted: 'rgba(43,27,23,0.72)', acc: '#2A9D8F', card: 'rgba(255,255,255,0.6)', stamp: '#2A9D8F', scrim: '#FFF1DA' },
      bg: (W, H) => sky(W, H, [[0, '#FFF1DA'], [1, '#F6D3A8']]),
      back: (rng) => windowAt(400, 250, 580, 380, sky(600, 420, [[0, '#FDE2C3'], [0.6, '#FFC48C'], [1, '#F7A07A']]) + sun(290, 300, 64, { color: '#FFE29A' }) +
        range([[-20, 380], [80, 290], [200, 330], [320, 250], [440, 320], [560, 270], [600, 380]], '#C08497', { op: 0.8 }) + hill(340, 18, '#A3B18A', { x0: -20, x1: 600, bottom: 380 }), { part: 'glass' }) +
        `<rect x="0" y="900" width="1080" height="200" fill="#C8A27C"/>`,
      front: (rng) => {
        let s = windowAt(400, 250, 580, 380, '', { frame: '#8B5E3C', part: 'frame' });
        // доска CI и k8s
        const cy = 260;
        s += `<rect x="40" y="${cy}" width="300" height="290" rx="10" fill="#FFFDF5" stroke="${L}" stroke-width="4"/>` + txt(190, cy + 40, 'CI / CD', 26, '#2B1B17', 'text-anchor="middle" font-weight="900"');
        ['build', 'test', 'deploy'].forEach((t, i) => { s += `<rect x="70" y="${cy + 60 + i * 70}" width="240" height="52" rx="8" fill="#39D98A" stroke="${L}" stroke-width="2.5"/>${txt(100, cy + 94 + i * 70, t, 22, '#0B2B1D', 'font-weight="800"', SVGM)}${txt(280, cy + 96 + i * 70, '✓', 26, '#0B2B1D', 'text-anchor="middle" font-weight="900"')}`; if (i < 2) s += `<path d="M190 ${cy + 112 + i * 70} V${cy + 130 + i * 70}" stroke="${L}" stroke-width="3"/>`; });
        s += `<g transform="translate(70 ${cy + 300})"><rect width="240" height="48" rx="8" fill="#457B9D" stroke="${L}" stroke-width="2.5"/>${txt(120, 32, 'k8s: 3/3 pods', 20, '#FFFFFF', 'text-anchor="middle" font-weight="800"', SVGM)}</g>`;
        // стол с мониторами ALL OK
        s += monitor(560, 610, 220, 160, `<path d="M20 110 L60 104 L100 108 L140 102 L180 106 L200 104" stroke="#39D98A" stroke-width="4" fill="none"/>${txt(110, 56, 'ALL OK', 30, '#39D98A', 'text-anchor="middle" font-weight="900"', SVGM)}`) +
          monitor(800, 630, 200, 140, `${txt(100, 62, 'lag 0', 26, '#39D98A', 'text-anchor="middle" font-weight="900"', SVGM)}${txt(100, 96, 'p99 41ms', 18, '#A7F3D0', 'text-anchor="middle" font-weight="700"', SVGM)}`);
        s += `<rect x="460" y="820" width="600" height="26" rx="4" fill="#8B5E3C" stroke="${L}" stroke-width="3"/><rect x="480" y="846" width="560" height="260" fill="#6B4226"/>`;
        s += `<g transform="translate(560 800)"><rect x="-38" y="-22" width="76" height="44" rx="8" fill="#343A40" stroke="${L}" stroke-width="3"/><rect x="-28" y="-12" width="56" height="20" rx="3" fill="#9ED96B"/>${txt(0, 3, '0 алертов', 10, '#1A0E14', 'text-anchor="middle" font-weight="900"')}</g>`;
        // Clawd спит на столе
        s += clawdOn(940, 820, 0.8, { hat: 'nightcap', eyes: 'closed' }) + txt(1000, 700, 'z', 34, '#5E60CE', 'font-weight="900"') + txt(1030, 670, 'z', 26, '#5E60CE', 'font-weight="900"');
        // растение
        s += `<path d="M380 1000 L392 920 L460 920 L472 1000Z" fill="#C1440E" stroke="${L}" stroke-width="3"/>` + Array.from({ length: 7 }, (_, i) => { const a = -Math.PI / 2 + (i - 3) * 0.32; return `<ellipse cx="${426 + Math.cos(a) * 56}" cy="${900 + Math.sin(a) * 56}" rx="40" ry="13" transform="rotate(${a * 57.3} ${426 + Math.cos(a) * 56} ${900 + Math.sin(a) * 56})" fill="#2D6A4F"/>`; }).join('');
        // гофер в кресле с кофе
        s += `<rect x="90" y="760" width="250" height="230" rx="40" fill="#457B9D" stroke="${L}" stroke-width="4"/><rect x="80" y="960" width="270" height="60" rx="20" fill="#3A6EA5" stroke="${L}" stroke-width="4"/><path d="M130 1020 V1090 M300 1020 V1090" stroke="#343A40" stroke-width="12"/>`;
        const gw = 250;
        s += gopherAt(dressed(ops, { view: 'sit', arms: 'hold', eyes: 'happy', look: 0.3, item: 'mug' }), 215 - gw / 2, 990 - gw * 1.2 * 0.86, gw);
        return s;
      },
    },
  ],
};
