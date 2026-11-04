// Этап 5 · Сервис целиком — стройка: ночное бюро с чертежом слоёв → котлован с фундаментом postgres и миграциями →
// леса, кран и контейнеры → сдача объекта: красная лента и огни.
import {
  L, SVGM, SVGF, txt, esc, stars, rngFrom, gopherOn, gopherAt, dressed, items, clawd, clawdOn, CI, csign,
  sky, glow, sun, cloud, ribbon, lamp, crate, windowAt,
} from './kit.js';

const builder = { hat: ['vest', 'hard'] };
const ruler = `<g transform="rotate(-32 100 160)"><rect x="20" y="150" width="170" height="22" rx="3" fill="#FFD166" stroke="${L}" stroke-width="2.4"/>${Array.from({ length: 16 }, (_, i) => `<path d="M${30 + i * 10} 150 V${i % 2 ? 158 : 162}" stroke="${L}" stroke-width="1.6"/>`).join('')}</g>`;
// лопата у правого бока: черенок ниже глаз, штык у земли
const shovel = `<g transform="rotate(-14 170 180)"><rect x="164" y="116" width="12" height="120" rx="5" fill="#9C6B3F" stroke="${L}" stroke-width="2.2"/><rect x="152" y="110" width="36" height="12" rx="5" fill="#9C6B3F" stroke="${L}" stroke-width="2"/><path d="M150 230 L190 230 L186 278 Q170 294 154 278Z" fill="#ADB5BD" stroke="${L}" stroke-width="2.4"/></g>`;
const scissors = `<g transform="rotate(-8 100 166)"><circle cx="46" cy="148" r="16" fill="none" stroke="#E63946" stroke-width="7"/><circle cx="46" cy="186" r="16" fill="none" stroke="#E63946" stroke-width="7"/>` +
  `<path d="M60 152 L196 120 L200 128 L66 162Z M60 182 L196 214 L200 206 L66 172Z" fill="#CED4DA" stroke="${L}" stroke-width="2.4"/><circle cx="96" cy="167" r="6" fill="#495057"/></g>`;
const rolled = `<rect x="118" y="10" width="20" height="60" rx="9" fill="#3A6EA5" stroke="${L}" stroke-width="2" transform="rotate(30 128 40)"/><ellipse cx="146" cy="16" rx="8" ry="11" fill="#5B8FC7" stroke="${L}" stroke-width="2" transform="rotate(30 146 16)"/>`;
const floorCols = { postgres: '#457B9D', repository: '#E9C46A', service: '#F4A261', handler: '#E76F51', api: '#2A9D8F' };

export default {
  name: 'Стройка сервиса',
  acts: [
    { // I. Чертёж: ночное бюро, слои на синьке, SOLID на пробке
      title: 'Чертёж', story: 'Ночью на синьке: handler → service → repository → postgres.',
      pal: { ink: '#EAF3FF', muted: 'rgba(234,243,255,0.76)', acc: '#FFD166', card: 'rgba(255,255,255,0.1)', stamp: '#FFD166', scrim: '#14213D' },
      bg: (W, H) => sky(W, H, [[0, '#14213D'], [1, '#1D2D50']]) + Array.from({ length: Math.ceil(W / 40) }, (_, i) => `<path d="M${i * 40} 0 V${H}" stroke="#FFFFFF" stroke-opacity=".035"/>`).join('') + Array.from({ length: Math.ceil(H / 40) }, (_, i) => `<path d="M0 ${i * 40} H${W}" stroke="#FFFFFF" stroke-opacity=".035"/>`).join(''),
      back: (rng) => {
        let city = sky(300, 300, [[0, '#0B1026'], [1, '#2A3A6E']]) + stars(rng, 30, 0, 0, 300, 120, '#FFFFFF', 1.3);
        let x = 0; while (x < 300) { const w = 30 + rng() * 40, h = 80 + rng() * 150; city += `<rect x="${x}" y="${300 - h}" width="${w}" height="${h}" fill="#26355E"/>`; for (let yy = 300 - h + 10; yy < 296; yy += 18) for (let xx = x + 6; xx < x + w - 8; xx += 12) if (rng() < 0.45) city += `<rect x="${xx}" y="${yy}" width="6" height="9" fill="#FFD27A"/>`; x += w + 4; }
        return windowAt(740, 150, 300, 300, city, { part: 'glass' }) + `<rect x="0" y="900" width="1080" height="200" fill="#2B2F45"/>` + glow(650, 700, 420, '#FFE29A', 0.3);
      },
      front: () => {
        let s = windowAt(740, 150, 300, 300, '', { frame: '#3A3F5C', part: 'frame' });
        // пробковая доска SOLID
        s += `<rect x="50" y="170" width="400" height="260" rx="8" fill="#C68B59" stroke="#7F5539" stroke-width="10"/>`;
        [['S', 'одна задача', '#FFD166'], ['O', 'расширяй', '#90BE6D'], ['L', 'подстановка', '#A8DADC'], ['I', 'интерфейсы', '#F4A261'], ['D', 'инверсия', '#FF8FA3']].forEach(([l, t, c], i) => {
          const x = 70 + (i % 3) * 126, y = 190 + Math.floor(i / 3) * 116, r = [-4, 3, -2, 5, -3][i];
          s += `<g transform="rotate(${r} ${x + 55} ${y + 50})"><rect x="${x}" y="${y}" width="112" height="100" fill="${c}" stroke="${L}" stroke-width="2"/>${txt(x + 56, y + 52, l, 46, '#1D3557', 'text-anchor="middle" font-weight="900"')}${txt(x + 56, y + 84, t, 13, '#1D3557', 'text-anchor="middle" font-weight="700"')}<circle cx="${x + 56}" cy="${y + 6}" r="6" fill="#E63946"/></g>`;
        });
        // кульман с синькой
        s += `<path d="M440 1100 L480 860 M1030 1100 L990 860 M735 860 L735 1100" stroke="#5C4033" stroke-width="12" stroke-linecap="round"/>`;
        s += `<path d="M440 640 L1040 600 L1060 870 L420 890Z" fill="#E9E3D5" stroke="${L}" stroke-width="4"/><path d="M470 660 L1020 624 L1036 850 L452 866Z" fill="#2B5C9E"/>`;
        const fl = ['handler', 'service', 'repository', 'postgres'];
        s += `<g transform="translate(520 660) rotate(-3.5)">` + fl.map((t, i) => `<rect x="0" y="${i * 44}" width="250" height="40" fill="none" stroke="#EAF3FF" stroke-width="2.5"/>${txt(125, i * 44 + 27, t, 19, '#EAF3FF', 'text-anchor="middle" font-weight="700"', SVGM)}`).join('') +
          `<path d="M270 0 V172 M262 0 H278 M262 172 H278" stroke="#EAF3FF" stroke-width="2"/>${txt(282, 92, '4 слоя', 16, '#EAF3FF', '', SVGM)}` +
          `<path d="M-24 20 V150" stroke="#FFD166" stroke-width="3"/><path d="M-24 150 l-7 -14 l14 0z" fill="#FFD166"/>${txt(330, 30, 'зависимости', 15, '#FFD166', '', SVGF)}${txt(330, 50, 'вниз ↓', 15, '#FFD166', '', SVGF)}</g>`;
        s += lamp(560, 646, 0.75) + `<rect x="930" y="586" width="36" height="34" rx="5" fill="#F8F9FA" stroke="${L}" stroke-width="2.5" transform="rotate(-3 948 600)"/>`;
        s += clawdOn(980, 606, 0.9, { hat: 'hard', item: rolled, eyes: 'happy' });
        s += gopherOn(dressed({ hat: ['hard', 'pencil'] }, { arms: 'hold', eyes: 'up', look: 0.6, item: ruler }), 260, 1020, 300);
        return s;
      },
    },
    { // II. Котлован: фундамент postgres, пул соединений, миграции
      title: 'Котлован', story: 'Котлован: фундамент postgres, пул соединений и миграции по порядку.',
      pal: { ink: '#1D1D1D', muted: 'rgba(29,29,29,0.72)', acc: '#E85D04', card: 'rgba(255,255,255,0.6)', stamp: '#E85D04', scrim: '#E8F4FA' },
      bg: (W, H) => sky(W, H, [[0, '#BFE3F2'], [0.6, '#E8F4FA'], [1, '#FDE9C9']]) + sun(W * 0.84, H * 0.44, 48, { color: '#FFE29A' }) + cloud(W * 0.2, H * 0.18, 240, '#FFFFFF', 0.8) + cloud(W * 0.65, H * 0.3, 180, '#FFFFFF', 0.7),
      back: (rng) => {
        let s = '', x = 0;
        while (x < 1080) { const w = 50 + rng() * 70, h = 60 + rng() * 120; s += `<rect x="${x}" y="${640 - h}" width="${w}" height="${h + 60}" fill="#A9B8CC" opacity=".7"/>`; x += w + 8; }
        s += `<rect x="0" y="690" width="1080" height="410" fill="#D9A066"/>`;
        s += `<path d="M120 700 L640 700 L590 980 L170 980Z" fill="#8B5E3C"/><path d="M140 760 L630 760 M150 830 L620 830 M160 900 L605 900" stroke="#6B4226" stroke-width="10" opacity=".7"/>`;
        s += `<path d="M-20 700 Q60 610 160 700Z" fill="#B07A45"/><path d="M680 700 Q760 640 840 700Z" fill="#B07A45"/>`;
        return s;
      },
      front: () => {
        let s = `<rect x="180" y="910" width="400" height="66" rx="4" fill="#ADB5BD" stroke="${L}" stroke-width="4"/>` + txt(380, 956, 'postgres', 36, '#1D3557', 'text-anchor="middle" font-weight="900"', SVGM);
        // пул соединений: трубы из фундамента
        for (let i = 0; i < 5; i++) s += `<rect x="${226 + i * 70}" y="${790 - (i % 2) * 20}" width="18" height="${120 + (i % 2) * 20}" fill="#457B9D" stroke="${L}" stroke-width="2.5"/><rect x="${220 + i * 70}" y="${780 - (i % 2) * 20}" width="30" height="14" rx="3" fill="#2A9D8F" stroke="${L}" stroke-width="2"/>`;
        s += `<g transform="translate(470 760)"><rect x="0" y="0" width="150" height="44" rx="6" fill="#FFFDF5" stroke="${L}" stroke-width="3"/>${txt(75, 29, 'pool: max 20', 17, '#1D3557', 'text-anchor="middle" font-weight="800"', SVGM)}</g>`;
        // щит «Здесь будет сервис»
        s += `<path d="M120 700 V420 M420 700 V420" stroke="#5C4033" stroke-width="12"/><rect x="60" y="200" width="420" height="236" rx="6" fill="#FFFDF5" stroke="#1D3557" stroke-width="6"/>` +
          txt(270, 244, 'ЗДЕСЬ БУДЕТ', 26, '#1D3557', 'text-anchor="middle" font-weight="900"') + txt(270, 280, 'СЕРВИС', 32, '#E85D04', 'text-anchor="middle" font-weight="900"') +
          ['handler', 'service', 'repository', 'postgres'].map((t, i) => `<rect x="170" y="${296 + i * 32}" width="200" height="28" fill="${floorCols[t]}" stroke="#1D3557" stroke-width="2"/>${txt(270, 316 + i * 32, t, 15, '#1D3557', 'text-anchor="middle" font-weight="800"', SVGM)}`).join('');
        // ограждение
        s += `<path d="M120 700 H640" stroke="#E63946" stroke-width="6" stroke-dasharray="22 14"/>` + [120, 300, 480, 640].map((x) => `<rect x="${x - 5}" y="660" width="10" height="44" fill="#495057"/>`).join('');
        // миграции на паллетах
        const mig = ['003_orders.sql', '002_users.sql', '001_init.sql'];
        s += `<rect x="830" y="690" width="230" height="14" fill="#9C6B3F" stroke="${L}" stroke-width="2"/>` + mig.map((t, i) => crate(840, 610 - (2 - i) * 74, 210, 70, ['#90BE6D', '#E9C46A', '#F4A261'][i], t, { fs: 18, edge: L })).join('');
        s += txt(945, 446, 'миграции ↑', 20, '#1D1D1D', 'text-anchor="middle" font-weight="800"');
        // экскаватор с Clawd в кабине
        s += clawd(22, 560, 0.72, { hat: 'hard', eyes: 'happy', shadow: false, wave: true });
        s += `<g transform="translate(0 700)"><rect x="-30" y="-60" width="200" height="50" rx="10" fill="#FFB703" stroke="${L}" stroke-width="4"/><path d="M10 -60 L20 -150 L120 -150 L130 -60" fill="none" stroke="${L}" stroke-width="7"/>` +
          `<rect x="-30" y="-10" width="210" height="34" rx="17" fill="#343A40" stroke="${L}" stroke-width="3"/>${[0, 50, 100, 150].map((x) => `<circle cx="${x - 6}" cy="7" r="11" fill="#6C757D"/>`).join('')}` +
          `<path d="M150 -70 L300 -170 L380 -40" fill="none" stroke="#FFB703" stroke-width="22" stroke-linejoin="round"/><path d="M150 -70 L300 -170 L380 -40" fill="none" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` +
          `<path d="M360 -50 L420 -40 L400 20 L350 0Z" fill="#ADB5BD" stroke="${L}" stroke-width="3"/></g>`;
        s += gopherOn(dressed(builder, { arms: 'hold', eyes: 'happy', look: -0.5, item: shovel }), 690, 712, 270);
        return s;
      },
    },
    { // III. Леса: дом растёт, кран несёт handler, контейнеры и тесты
      title: 'Леса', story: 'Леса: слой за слоем, кран несёт handler, тесты зелёные.',
      pal: { ink: '#1D1D1D', muted: 'rgba(29,29,29,0.72)', acc: '#E85D04', card: 'rgba(255,255,255,0.6)', stamp: '#E85D04', scrim: '#FFF0D9' },
      bg: (W, H) => sky(W, H, [[0, '#FFF0D9'], [0.6, '#FFD3A5'], [1, '#F7B267']]) + sun(W * 0.2, H * 0.5, 60, { color: '#FFE29A' }),
      back: (rng) => { let s = '', x = 0; while (x < 1080) { const w = 50 + rng() * 70, h = 80 + rng() * 140; s += `<rect x="${x}" y="${900 - h}" width="${w}" height="${h + 60}" fill="#D9A27A" opacity=".55"/>`; x += w + 8; } return s + `<rect x="0" y="980" width="1080" height="120" fill="#B07A45"/>`; },
      front: () => {
        let s = '';
        // кран справа
        s += `<g stroke="#1D3557" stroke-width="5" fill="none"><path d="M900 1000 V220 M960 1000 V220 M900 220 H960"/>${Array.from({ length: 13 }, (_, i) => `<path d="M900 ${280 + i * 60} L960 ${220 + i * 60}"/>`).join('')}<path d="M180 220 H1070 M180 270 H920"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${180 + i * 60} 270 L${210 + i * 60} 220"/>`).join('')}</g>` +
          `<rect x="980" y="200" width="90" height="70" fill="#FFC300" stroke="#1D3557" stroke-width="5"/>`;
        s += `<path d="M300 270 V380" stroke="#1D3557" stroke-width="3"/><path d="M300 380 L170 410 M300 380 L430 410" stroke="#1D3557" stroke-width="3"/>` +
          `<rect x="160" y="410" width="280" height="96" fill="${floorCols.handler}" stroke="#1D3557" stroke-width="5"/>` + txt(300, 470, 'handler', 34, '#1D3557', 'text-anchor="middle" font-weight="800"', SVGM);
        // здание из трёх этажей
        [['postgres', 870], ['repository', 740], ['service', 610]].forEach(([t, y]) => {
          s += `<rect x="140" y="${y}" width="460" height="130" fill="${floorCols[t]}" stroke="#1D3557" stroke-width="5"/>` + txt(370, y + 56, t, 32, '#1D3557', 'text-anchor="middle" font-weight="800"', SVGM) +
            [170, 260, 440, 530].map((x) => `<rect x="${x}" y="${y + 76}" width="48" height="36" fill="#FFF3D6" stroke="#1D3557" stroke-width="3"/>`).join('');
        });
        // леса
        s += `<g stroke="#5C4033" stroke-width="6" fill="none"><path d="M120 580 V1000 M380 580 V1000 M630 580 V1000"/>${[610, 740, 870].map((y) => `<path d="M100 ${y} H660"/>`).join('')}</g>` +
          [610, 740, 870].map((y) => `<rect x="96" y="${y - 10}" width="568" height="14" fill="#C68B59" stroke="${L}" stroke-width="2"/>`).join('');
        // тесты
        s += `<rect x="690" y="560" width="190" height="200" rx="8" fill="#212529" stroke="${L}" stroke-width="4"/><path d="M780 760 V1000" stroke="#495057" stroke-width="10"/>` +
          txt(785, 596, 'go test ./...', 18, '#F1FAEE', 'text-anchor="middle" font-weight="800"', SVGM) +
          ['ok  repository', 'ok  service', 'ok  postgres', 'PASS'].map((t, i) => txt(706, 636 + i * 32, t, 18, i === 3 ? '#39D98A' : '#A7F3D0', 'font-weight="700"', SVGM)).join('');
        // контейнеры
        s += crate(700, 914, 170, 76, '#3A86FF', 'app', { fs: 26, ink: '#FFFFFF', edge: L }) + crate(880, 914, 170, 76, '#E63946', 'db', { fs: 26, ink: '#FFFFFF', edge: L }) + crate(790, 838, 170, 76, '#6A4C93', 'cache', { fs: 26, ink: '#FFFFFF', edge: L });
        s += gopherOn(dressed(builder, { arms: [0, -150], eyes: 'up', look: -0.2, item: 'wrench' }), 560, 604, 200);
        s += clawdOn(668, 1000, 0.82, { hat: 'hard', item: () => csign('compose', '#FFFFFF'), both: true });
        return s;
      },
    },
    { // IV. Сдача объекта: огни, красная лента, ножницы
      title: 'Сдача объекта', story: 'Слои, миграции, контейнеры, тесты — сервис сдан.',
      pal: { ink: '#FFFFFF', muted: 'rgba(255,255,255,0.8)', acc: '#FFD166', card: 'rgba(255,255,255,0.12)', stamp: '#FFD166', scrim: '#2B1B3D' },
      bg: (W, H, rng) => sky(W, H, [[0, '#2B1B3D'], [0.55, '#7B3F61'], [1, '#F28C6B']]) + stars(rng, 60, 0, 0, W, H * 0.35, '#FFFFFF', 1.4),
      back: (rng) => { let s = '', x = -20; while (x < 1100) { const w = 50 + rng() * 70, h = 100 + rng() * 200; s += `<rect x="${x}" y="${960 - h}" width="${w}" height="${h + 40}" fill="#4A2C55"/>`; x += w + 6; } return s + `<rect x="0" y="960" width="1080" height="140" fill="#3B2A40"/>` + glow(540, 650, 520, '#FFD98E', 0.3); },
      front: (rng) => {
        // салют
        let s = [[110, 470, '#FFD166'], [975, 440, '#FF8FA3'], [990, 660, '#5CE1E6']].map(([x, y, c]) => Array.from({ length: 18 }, (_, i) => { const a = i / 18 * Math.PI * 2; return `<path d="M${x + Math.cos(a) * 14} ${y + Math.sin(a) * 14} L${x + Math.cos(a) * 70} ${y + Math.sin(a) * 70}" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`; }).join('')).join('');
        // фасад
        s += `<rect x="220" y="380" width="640" height="580" fill="#2E2240" stroke="${L}" stroke-width="5"/>`;
        ['handler', 'service', 'repository', 'postgres'].forEach((t, i) => {
          const y = 400 + i * 140;
          const ground = i === 3; // первый этаж: вход посередине, подпись слева от двери
          s += `<rect x="236" y="${y}" width="608" height="122" fill="${floorCols[t]}" opacity=".95"/>` + (ground ? [] : [260, 360, 680, 780]).map((x) => glow(x + 22, y + 60, 50, '#FFF3C4', 0.6) + `<rect x="${x}" y="${y + 36}" width="44" height="50" fill="#FFF3C4" stroke="#1D3557" stroke-width="3"/>`).join('') + txt(ground ? 350 : 540, y + 72, t, 34, '#1D3557', 'text-anchor="middle" font-weight="900"', SVGM);
        });
        s += `<rect x="440" y="300" width="200" height="76" rx="12" fill="#1B1035" stroke="#39D98A" stroke-width="5"/>` + glow(540, 338, 160, '#39D98A', 0.35) + txt(540, 352, 'api', 46, '#39D98A', 'text-anchor="middle" font-weight="900"', SVGM);
        // вход, столбики и лента
        s += `<rect x="470" y="826" width="140" height="134" fill="#FFD98E" stroke="${L}" stroke-width="4"/><path d="M540 826 V960" stroke="${L}" stroke-width="3"/>`;
        s += [300, 780].map((x) => `<rect x="${x - 8}" y="900" width="16" height="100" fill="#C9A227" stroke="${L}" stroke-width="2"/><circle cx="${x}" cy="898" r="12" fill="#FFD166" stroke="${L}" stroke-width="2"/>`).join('');
        s += `<path d="M300 910 Q480 950 664 924 M716 926 Q750 930 780 910" stroke="#E63946" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M664 924 l-14 40 M716 926 l14 38" stroke="#E63946" stroke-width="8" stroke-linecap="round"/>` +
          `<g transform="translate(470 934)"><path d="M0 0 l-34 -20 l0 40z M0 0 l34 -20 l0 40z" fill="#E63946" stroke="${L}" stroke-width="2"/><circle r="8" fill="#B5172B"/></g>`;
        s += gopherOn(dressed({ hat: ['hard', 'bow'] }, { arms: 'hold', eyes: 'happy', look: -0.4, item: scissors, squash: 1.03 }), 690, 1060, 220);
        s += crate(890, 920, 160, 70, '#3A86FF', 'app', { fs: 24, ink: '#FFFFFF', edge: L }) + crate(900, 850, 140, 70, '#E63946', 'db', { fs: 24, ink: '#FFFFFF', edge: L });
        s += `<g transform="translate(980 790) rotate(6)"><rect x="-90" y="-26" width="180" height="46" rx="8" fill="#39D98A" stroke="${L}" stroke-width="3"/>${txt(0, 6, 'tests ✓ 100%', 20, '#0B2B1D', 'text-anchor="middle" font-weight="900"')}</g>`;
        s += clawdOn(150, 1030, 1.05, { hat: 'hard', both: true, eyes: 'happy', jump: 16 });
        s += ribbon(540, 230, 420, 'Сервис сдан!', { c: '#FFD166', ink: '#2B1B3D', fs: 40 });
        s += Array.from({ length: 60 }, () => { const x = rng() * 1080, y = 120 + rng() * 800, c = ['#FFD166', '#FF5CA8', '#5CE1E6', '#FFFFFF'][Math.floor(rng() * 4)]; return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${(8 + rng() * 8).toFixed(0)}" height="${(4 + rng() * 5).toFixed(0)}" fill="${c}" transform="rotate(${(rng() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`; }).join('');
        return s;
      },
    },
  ],
};
