// Этап 4 · Сеть и веб — почта интернета: сортировочная с адресами и портами → рукопожатие TCP флажками →
// письма под печатью TLS на биплане → ночная орбита, где пришёл ответ 200 OK.
import {
  L, SVGM, SVGF, txt, esc, stars, rngFrom, gopherOn, gopherAt, dressed, items, clawd, clawdOn, CI, csign,
  sky, glow, sun, cloud, range, hill, ribbon, trail, plane,
} from './kit.js';

const bag = `<rect x="2" y="160" width="52" height="42" rx="6" fill="#A0522D" stroke="${L}" stroke-width="2.2"/><path d="M2 166 L28 186 L54 166" fill="#8B4513" stroke="${L}" stroke-width="2"/><rect x="12" y="150" width="30" height="16" fill="#fff" stroke="${L}" stroke-width="1.6" transform="rotate(-10 27 158)"/>`;
const postman = { hat: 'post', back: bag };
const env = (x, y, r = 0, s = 1, seal = '#E63946', label = '') => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><rect x="-30" y="-20" width="60" height="40" rx="3" fill="#FFFDF5" stroke="${L}" stroke-width="2.5"/><path d="M-30 -20 L0 4 L30 -20" fill="none" stroke="${L}" stroke-width="2.5"/><circle cx="0" cy="4" r="7" fill="${seal}" stroke="${L}" stroke-width="1.6"/>${label ? txt(0, 34, label, 13, '#FFFDF5', 'text-anchor="middle" font-weight="800"', SVGM) : ''}</g>`;
// конверт с замком TLS
const sealed = (x, y, r = 0, s = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><rect x="-34" y="-22" width="68" height="44" rx="3" fill="#FFFDF5" stroke="${L}" stroke-width="2.5"/><path d="M-34 -22 L0 6 L34 -22" fill="none" stroke="${L}" stroke-width="2.5"/><rect x="-11" y="-2" width="22" height="18" rx="3" fill="#E9C46A" stroke="${L}" stroke-width="2"/><path d="M-6 -2 V-8 A6 6 0 0 1 6 -8 V-2" fill="none" stroke="${L}" stroke-width="2.4"/></g>`;
const flags = `<path d="M14 138 L-34 58" stroke="#5C4033" stroke-width="5" stroke-linecap="round"/><path d="M-34 58 L-70 46 L-58 86 L-24 76Z" fill="#E63946" stroke="${L}" stroke-width="2"/><path d="M-70 46 L-24 76" stroke="#FFD166" stroke-width="5"/>` +
  `<path d="M186 138 L234 58" stroke="#5C4033" stroke-width="5" stroke-linecap="round"/><path d="M234 58 L270 46 L258 86 L224 76Z" fill="#E63946" stroke="${L}" stroke-width="2"/><path d="M270 46 L224 76" stroke="#FFD166" stroke-width="5"/>`;
const aviator = `<path d="M48 40 Q50 -6 100 -8 Q150 -6 152 40Z" fill="#8B5E3C" stroke="${L}" stroke-width="2.4"/><path d="M34 34 Q22 70 30 92 L42 90 Q36 62 44 36Z M166 34 Q178 70 170 92 L158 90 Q164 62 156 36Z" fill="#8B5E3C" stroke="${L}" stroke-width="2"/>` +
  `<path d="M50 18 Q100 8 150 18" stroke="#3A2A22" stroke-width="6" fill="none"/><circle cx="80" cy="14" r="15" fill="#A8DADC" stroke="#3A2A22" stroke-width="4"/><circle cx="120" cy="14" r="15" fill="#A8DADC" stroke="#3A2A22" stroke-width="4"/><circle cx="76" cy="10" r="4" fill="#fff" opacity=".8"/><circle cx="116" cy="10" r="4" fill="#fff" opacity=".8"/>`;
const scroll = `<rect x="118" y="10" width="54" height="46" rx="4" fill="#FFF3D6" stroke="${L}" stroke-width="2"/><path d="M126 22 H164 M126 30 H158 M126 38 H162" stroke="#999" stroke-width="2"/><circle cx="160" cy="48" r="9" fill="#2A9D8F" stroke="${L}" stroke-width="1.6"/><path d="M155 48 l4 4 l6 -8" stroke="#fff" stroke-width="2.4" fill="none"/>`;
const stamp = `<rect x="132" y="-6" width="18" height="28" rx="4" fill="#7F5539" stroke="${L}" stroke-width="2"/><rect x="122" y="22" width="38" height="16" rx="3" fill="#343A40" stroke="${L}" stroke-width="2"/>`;
const spyglass = `<g transform="rotate(-24 140 30)"><rect x="118" y="20" width="70" height="20" rx="5" fill="#C9A227" stroke="${L}" stroke-width="2.4"/><rect x="180" y="16" width="16" height="28" rx="4" fill="#8B5E3C" stroke="${L}" stroke-width="2"/></g>`;

export default {
  name: 'Почта интернета',
  acts: [
    { // I. Сортировочная: ячейки по IP и портам, справочник DNS
      title: 'Сортировочная', story: 'Сортировочная: каждому письму — адрес, порт и справка DNS.',
      pal: { ink: '#2B1B17', muted: 'rgba(43,27,23,0.72)', acc: '#1D3557', card: 'rgba(255,255,255,0.62)', stamp: '#E63946', scrim: '#F3E6CC' },
      bg: (W, H) => sky(W, H, [[0, '#F3E6CC'], [1, '#E2CBA0']]) + Array.from({ length: Math.ceil(W / 40) }, (_, i) => `<rect x="${i * 40}" y="0" width="3" height="${H}" fill="#8B5E3C" opacity=".06"/>`).join(''),
      back: () => `<rect x="0" y="860" width="1080" height="240" fill="#8B5E3C"/>` + Array.from({ length: 12 }, (_, i) => `<path d="M${i * 98} 860 L${i * 98 - 60} 1100" stroke="#6B4226" stroke-width="3"/>`).join('') +
        glow(860, 220, 300, '#FFF6D8', 0.6) + `<rect x="760" y="140" width="220" height="200" fill="#CFE8F7"/>`,
      front: () => {
        let s = `<rect x="760" y="140" width="220" height="200" fill="none" stroke="#6B4226" stroke-width="14"/><path d="M870 140 V340 M760 240 H980" stroke="#6B4226" stroke-width="8"/>`;
        // стена ячеек с адресами
        const addrs = ['10.0.0.1', '10.0.0.2', '10.0.0.7', '172.16.0.4', ':80', ':443', ':5432', ':8080', '127.0.0.1', '::1', '0.0.0.0', ':53'];
        s += `<rect x="40" y="200" width="640" height="420" rx="8" fill="#6B4226" stroke="${L}" stroke-width="4"/>`;
        addrs.forEach((a, i) => { const x = 56 + (i % 4) * 155, y = 216 + Math.floor(i / 4) * 134; s += `<rect x="${x}" y="${y}" width="145" height="122" rx="4" fill="#3B2A1C" stroke="${L}" stroke-width="2"/><rect x="${x + 14}" y="${y + 92}" width="117" height="24" rx="3" fill="#F3E6CC"/>${txt(x + 72, y + 110, a, 16, '#2B1B17', 'text-anchor="middle" font-weight="800"', SVGM)}`; if ((i * 5) % 3 !== 1) s += env(x + 72, y + 52, (i % 3 - 1) * 8, 0.9); });
        // стойка с журналом DNS
        s += `<rect x="610" y="760" width="460" height="24" rx="4" fill="#A0522D" stroke="${L}" stroke-width="3"/><rect x="630" y="784" width="420" height="320" fill="#7F5539" stroke="${L}" stroke-width="3"/>`;
        const layers = [['HTTP', '#E63946'], ['TLS', '#F4A261'], ['TCP · UDP', '#E9C46A'], ['IP', '#2A9D8F'], ['Ethernet', '#457B9D']];
        s += `<g transform="translate(760 380) rotate(2)"><rect width="230" height="250" fill="#FFFDF5" stroke="${L}" stroke-width="3"/>${txt(115, 34, 'Слои сети', 22, '#2B1B17', 'text-anchor="middle" font-weight="900"')}` +
          layers.map(([t, c], i) => `<rect x="20" y="${50 + i * 38}" width="190" height="32" rx="4" fill="${c}" stroke="${L}" stroke-width="2"/>${txt(115, 72 + i * 38, t, 17, '#FFFFFF', 'text-anchor="middle" font-weight="800"', SVGM)}`).join('') + `<circle cx="115" cy="0" r="8" fill="#E63946" stroke="${L}" stroke-width="2"/></g>`;
        s += `<g transform="translate(630 694) rotate(-4)"><rect width="250" height="66" rx="4" fill="#FFFDF5" stroke="${L}" stroke-width="2.5"/>${txt(14, 26, 'DNS: ascent.local', 17, '#1D3557', 'font-weight="800"', SVGM)}${txt(14, 52, '  → A 10.0.0.7', 17, '#E63946', 'font-weight="800"', SVGM)}<g transform="translate(206 44) rotate(-14)"><rect x="-30" y="-12" width="60" height="24" rx="4" fill="none" stroke="#E63946" stroke-width="2.5"/>${txt(0, 6, 'DNS ✓', 13, '#E63946', 'text-anchor="middle" font-weight="900"')}</g></g>`;
        s += clawdOn(975, 760, 0.95, { hat: 'post', item: stamp, both: true });
        s += gopherOn(dressed(postman, { arms: 'hold', eyes: 'happy', look: -0.6, item: () => items.strap + items.envelope('GET /') }), 380, 1030, 310);
        return s;
      },
    },
    { // II. Рукопожатие: две башни, флажковый семафор SYN / SYN-ACK / ACK
      title: 'Рукопожатие', story: 'SYN → ← SYN-ACK → ACK: TCP жмёт руку, UDP просто кидает.',
      pal: { ink: '#2B1B17', muted: 'rgba(43,27,23,0.72)', acc: '#C2410C', card: 'rgba(255,255,255,0.6)', stamp: '#C2410C', scrim: '#FCE3C2' },
      bg: (W, H) => sky(W, H, [[0, '#FCE3C2'], [0.6, '#F7B98A'], [1, '#E58F6B']]) + sun(W * 0.5, H * 0.66, 70, { color: '#FFD08A' }) + cloud(W * 0.2, H * 0.16, 220, '#FFF4E6', 0.6) + cloud(W * 0.8, H * 0.24, 180, '#FFF4E6', 0.55),
      back: (rng) => range([[-40, 720], [140, 600], [300, 660], [460, 560], [620, 640], [800, 540], [960, 620], [1120, 600]], '#B98AA0', { op: 0.75 }) +
        hill(820, 30, '#8AA05B', { phase: 2 }) + `<path d="M-40 1100 L-40 760 Q120 690 300 720 L360 1100Z" fill="#6B8E4E"/><path d="M1120 1100 L1120 760 Q960 690 780 720 L720 1100Z" fill="#6B8E4E"/>`,
      front: (rng) => {
        const tower = (x, y) => `<path d="M${x - 70} ${y + 360} L${x - 40} ${y} L${x + 40} ${y} L${x + 70} ${y + 360}Z" fill="#9C6B3F" stroke="${L}" stroke-width="4"/><path d="M${x - 58} ${y + 280} L${x + 58} ${y + 280} M${x - 50} ${y + 180} L${x + 50} ${y + 180} M${x - 46} ${y + 90} L${x + 46} ${y + 90} M${x - 58} ${y + 280} L${x + 46} ${y + 90} M${x + 58} ${y + 280} L${x - 46} ${y + 90}" stroke="${L}" stroke-width="3"/><rect x="${x - 70}" y="${y - 14}" width="140" height="18" rx="4" fill="#7F5539" stroke="${L}" stroke-width="3"/>`;
        let s = tower(220, 640) + tower(870, 600);
        const arrow = (y, t, dir, c) => { const x0 = dir > 0 ? 340 : 760, x1 = dir > 0 ? 760 : 340; return `<path d="M${x0} ${y} L${x1} ${y}" stroke="${c}" stroke-width="5" stroke-dasharray="14 8"/><path d="M${x1} ${y} l${-dir * 22} -12 l0 24z" fill="${c}"/>` + `<rect x="${(x0 + x1) / 2 - 90}" y="${y - 44}" width="180" height="36" rx="18" fill="#FFFDF5" stroke="${c}" stroke-width="3"/>${txt((x0 + x1) / 2, y - 18, t, 20, c, 'text-anchor="middle" font-weight="900"', SVGM)}`; };
        s += arrow(380, 'SYN', 1, '#1D3557') + arrow(470, 'SYN-ACK', -1, '#C2410C') + arrow(560, 'ACK', 1, '#2A9D8F');
        // UDP: самолётик улетает без ответа
        s += trail('M380 820 Q520 790 660 740', { c: '#FFFFFF', w: 3 }) + plane(690, 728, 1.4, -14) + `<g transform="translate(560 860)"><rect x="-86" y="-20" width="172" height="36" rx="8" fill="#FFFDF5" stroke="${L}" stroke-width="2"/>${txt(0, 6, 'UDP: без ответа', 16, '#6B4E71', 'text-anchor="middle" font-weight="800"')}</g>`;
        // сервер на правой башне — сиреневый гофер-сервер с флажками
        s += `<defs><filter id="srvh"><feColorMatrix type="hueRotate" values="140"/></filter></defs><g filter="url(#srvh)">` + gopherOn(dressed({}, { arms: 'out', eyes: 'happy', look: -0.6, hat: [flags] }), 870, 590, 150) + `</g>`;
        s += txt(870, 400, 'server :443', 20, '#2B1B17', 'text-anchor="middle" font-weight="800"', SVGM);
        s += gopherOn(dressed(postman, { arms: 'out', eyes: 'happy', look: 0.7, hat: ['post', flags] }), 220, 630, 200);
        s += clawdOn(470, 1040, 1.0, { hat: 'post', item: spyglass, eyes: 'open' });
        s += flowersLite(rng);
        return s;
      },
    },
    { // III. Письма под печатью: биплан над облаками, TLS-замки
      title: 'Письма под печатью', story: 'HTTPS: письма под печатью TLS, ворона не прочтёт ни слова.',
      pal: { ink: '#14213D', muted: 'rgba(20,33,61,0.72)', acc: '#1D4ED8', card: 'rgba(255,255,255,0.62)', stamp: '#1D4ED8', scrim: '#CFE8F7' },
      bg: (W, H) => sky(W, H, [[0, '#CFE8F7'], [0.6, '#A8D4F0'], [1, '#7FB8E6']]) + sun(W * 0.82, H * 0.48, 54, { color: '#FFF3C4' }) +
        cloud(W * 0.15, H * 0.4, 280, '#FFFFFF', 0.85) + cloud(W * 0.62, H * 0.33, 240, '#FFFFFF', 0.8),
      back: (rng) => Array.from({ length: 9 }, (_, i) => cloud(i * 140 - 20, 940 + (i % 3) * 30, 300 + (i % 2) * 80, '#FFFFFF', 0.95)).join('') +
        cloud(860, 760, 260, '#FFFFFF', 0.8) + cloud(180, 300, 200, '#FFFFFF', 0.7),
      front: (rng) => {
        let s = trail('M60 640 Q200 560 320 600', { c: '#FFFFFF', w: 5, dash: '2 14' });
        s += sealed(110, 700, -14, 1.1) + sealed(200, 520, 10, 0.9) + sealed(60, 470, -6, 0.8);
        // ворона-перехватчик
        s += `<g transform="translate(150 280)"><path d="M0 0 Q40 -40 90 -10 Q60 0 90 20 Q40 30 0 0Z" fill="#212529"/><circle cx="74" cy="-6" r="4" fill="#FFF"/><path d="M90 -6 l18 4 l-18 4z" fill="#FFB703"/><path d="M20 -10 Q30 -60 60 -40" fill="#343A40"/>${txt(40, -64, '???', 34, '#212529', 'text-anchor="middle" font-weight="900"')}</g>`;
        // биплан (координаты самолёта, масштаб 1.25)
        const pilot = gopherAt(dressed({ hat: aviator }, { eyes: 'happy', look: 0.4, arms: [0, -120] }), -94, -150, 170);
        s += `<g transform="translate(520 600) scale(1.25)">` +
          `<path d="M-300 -10 L-250 -40 L-230 -10Z" fill="#E63946" stroke="${L}" stroke-width="3"/><rect x="-300" y="10" width="80" height="16" rx="6" fill="#C1440E" stroke="${L}" stroke-width="3"/>` +
          `<rect x="-160" y="60" width="380" height="26" rx="10" fill="#E9C46A" stroke="${L}" stroke-width="3"/>` +
          `<path d="M-30 -70 Q-120 -120 -200 -96 Q-130 -100 -40 -56Z" fill="#FFFFFF" stroke="${L}" stroke-width="2.5"/>` + pilot +
          `<path d="M-280 -30 Q-260 -50 -120 -46 L190 -40 Q300 -36 330 0 Q300 50 190 50 L-120 46 Q-260 40 -280 -30Z" fill="#E63946" stroke="${L}" stroke-width="4"/>` +
          `<path d="M-80 -46 Q-10 -62 60 -44" fill="none" stroke="#5C2E1F" stroke-width="6"/><path d="M-230 0 H170" stroke="#FFD166" stroke-width="6"/>` +
          txt(20, 30, 'HTTPS', 30, '#FFFFFF', 'text-anchor="middle" font-weight="900"') +
          `<circle cx="336" cy="2" r="16" fill="#343A40" stroke="${L}" stroke-width="3"/><ellipse cx="346" cy="2" rx="8" ry="70" fill="#ADB5BD" opacity=".7"/>` +
          `<path d="M-150 -214 L-140 -44 M180 -214 L170 -40 M-130 50 L-120 60 M160 50 L150 60" stroke="${L}" stroke-width="5"/>` +
          `<rect x="-200" y="-240" width="430" height="26" rx="10" fill="#E9C46A" stroke="${L}" stroke-width="3"/>` +
          `<circle cx="-60" cy="80" r="24" fill="#212529"/><circle cx="-60" cy="80" r="8" fill="#ADB5BD"/><circle cx="140" cy="80" r="24" fill="#212529"/><circle cx="140" cy="80" r="8" fill="#ADB5BD"/><path d="M-60 56 L-40 40 M140 56 L120 40" stroke="${L}" stroke-width="5"/>` +
          clawdOn(120, -240, 0.62, { item: scroll, eyes: 'happy' }) + `</g>`;
        // крыши города под облаками
        s += Array.from({ length: 8 }, (_, i) => { const x = 40 + i * 136, h = 50 + (i * 37) % 60; return `<rect x="${x}" y="${1100 - h}" width="96" height="${h}" fill="#6B7FA8"/><path d="M${x - 8} ${1100 - h} L${x + 48} ${1060 - h} L${x + 104} ${1100 - h}Z" fill="#4F6390"/>`; }).join('');
        s += sealed(860, 420, 12, 1.2);
        return s;
      },
    },
    { // IV. 200 OK: ночная орбита, ответ пришёл
      title: '200 OK', story: 'Пакет ушёл, ответ пришёл: 200 OK.',
      pal: { ink: '#F1FAFF', muted: 'rgba(241,250,255,0.76)', acc: '#FFD166', card: 'rgba(255,255,255,0.1)', stamp: '#8DE4FF', scrim: '#050B1F' },
      bg: (W, H, rng) => sky(W, H, [[0, '#050B1F'], [0.6, '#0B2545'], [1, '#13315C']]) + stars(rng, 200, 0, 0, W, H, '#CFF4FF', 1.6),
      back: () => glow(540, 1700, 1040, '#8DE4FF', 0.25) + `<circle cx="540" cy="1700" r="940" fill="#1E6091"/>` +
        Array.from({ length: 8 }, (_, i) => `<ellipse cx="540" cy="1700" rx="940" ry="${140 + i * 110}" fill="none" stroke="#8DE4FF" stroke-opacity=".22" stroke-width="3"/>`).join('') +
        Array.from({ length: 8 }, (_, i) => `<ellipse cx="540" cy="1700" rx="${120 + i * 115}" ry="940" fill="none" stroke="#8DE4FF" stroke-opacity=".18" stroke-width="3"/>`).join(''),
      front: (rng) => {
        const nodes = [[110, 380], [300, 240], [520, 300], [760, 210], [960, 360], [200, 560], [860, 560]];
        const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 2], [2, 6], [6, 4], [1, 3]];
        let s = edges.map(([a, b]) => `<path d="M${nodes[a][0]} ${nodes[a][1]} L${nodes[b][0]} ${nodes[b][1]}" stroke="#8DE4FF" stroke-opacity=".55" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round"/>`).join('');
        s += nodes.map(([x, y], i) => glow(x, y, 34, '#8DE4FF', 0.35) + `<circle cx="${x}" cy="${y}" r="12" fill="${i % 3 ? '#8DE4FF' : '#FFD166'}" stroke="#050B1F" stroke-width="3"/>`).join('');
        const tag = (x, y, t, c) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="${t.length * 15 + 28}" height="40" rx="20" fill="#050B1F" stroke="${c}" stroke-width="3"/>${txt((t.length * 15 + 28) / 2, 27, t, 20, c, 'text-anchor="middle" font-weight="800"', SVGM)}</g>`;
        s += tag(40, 420, 'DNS', '#8DE4FF') + tag(330, 150, 'TCP', '#FFD166') + tag(600, 330, 'TLS 1.3', '#FFD166') + tag(800, 130, 'HTTP/2', '#8DE4FF') + tag(900, 410, 'gRPC', '#FF8FA3') + tag(130, 610, 'REST', '#90BE6D');
        // ответ летит к ящику светящимся следом
        s += `<path d="M760 210 Q600 400 690 610" stroke="#FFD166" stroke-width="5" fill="none" stroke-dasharray="3 12" stroke-linecap="round"/>` + env(690, 640, 18, 1.1, '#2A9D8F');
        // огни городов на планете
        s += Array.from({ length: 40 }, () => { const a = -Math.PI / 2 + (rng() - 0.5) * 1.5, r = 940 - 20 - rng() * 300, x = 540 + Math.cos(a) * r, y = 1700 + Math.sin(a) * r; return y < 1100 ? glow(x, y, 14, '#FFD166', 0.7) + `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.6" fill="#FFF3C4"/>` : ''; }).join('');
        s += `<g transform="translate(980 140) rotate(-20)"><rect x="-14" y="-10" width="28" height="20" fill="#ADB5BD" stroke="#050B1F" stroke-width="2"/><rect x="-60" y="-8" width="40" height="16" fill="#3A86FF" stroke="#050B1F" stroke-width="2"/><rect x="20" y="-8" width="40" height="16" fill="#3A86FF" stroke="#050B1F" stroke-width="2"/></g>`;
        // ящик с поднятым флажком
        s += `<g transform="translate(640 700)"><rect x="56" y="80" width="14" height="90" fill="#6C757D"/><path d="M0 40 Q0 0 60 0 L120 0 Q130 0 130 10 V90 H0Z" fill="#E63946" stroke="#050B1F" stroke-width="4"/><rect x="18" y="38" width="80" height="8" fill="#050B1F"/><path d="M118 10 V-34 L152 -24 L118 -14" fill="#FFD166" stroke="#050B1F" stroke-width="3"/></g>`;
        s += ribbon(820, 520, 240, '200 OK', { c: '#2A9D8F', ink: '#FFFFFF', fs: 40, r: -6 });
        s += clawdOn(880, 818, 0.85, { hat: 'post', wave: true, jump: 14, eyes: 'happy' });
        s += gopherOn(dressed(postman, { arms: 'hold', eyes: 'happy', look: 0.4, item: () => items.strap + items.envelope('200 OK') }), 400, 780, 290);
        return s;
      },
    },
  ],
};
function flowersLite(rng) { return Array.from({ length: 30 }, () => `<circle cx="${(rng() * 1080).toFixed(0)}" cy="${(1000 + rng() * 100).toFixed(0)}" r="${(3 + rng() * 4).toFixed(1)}" fill="${['#FFD166', '#FF8FA3', '#FFFFFF'][Math.floor(rng() * 3)]}"/>`).join(''); }
