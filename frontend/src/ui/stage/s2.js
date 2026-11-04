// Этап 2 · Данные в Go — склад памяти: пустой склад на рассвете → конвейер строк и map → ночная картотека
// со структурами и интерфейсами → золотой проход, где всё по полочкам.
import {
  L, SVGM, txt, esc, gopherOn, gopherAt, dressed, items, clawd, clawdOn, CI, csign,
  sky, glow, stars, shelf, lamp, crate, gear, conveyor, forklift,
} from './kit.js';

const dark = { ink: '#F4FFF9', muted: 'rgba(244,255,249,0.76)', acc: '#FFC857', card: 'rgba(255,255,255,0.1)', stamp: '#FFC857' };
const base = { hat: 'visor' };
// фонарик в лапках, светит влево
const flashlight = `<g transform="rotate(-8 100 160)"><rect x="44" y="150" width="76" height="24" rx="7" fill="#495057" stroke="${L}" stroke-width="2.4"/><path d="M44 145 L24 138 L24 186 L44 179Z" fill="#ADB5BD" stroke="${L}" stroke-width="2.4"/><rect x="90" y="155" width="12" height="14" rx="2" fill="#FFC857"/></g>`;
// ящик с подписью в лапках
const boxItem = (t, c = '#90BE6D') => `<rect x="52" y="132" width="96" height="66" rx="4" fill="${c}" stroke="${L}" stroke-width="2.6"/><path d="M52 150 H148" stroke="${L}" stroke-opacity=".3" stroke-width="2"/><rect x="72" y="160" width="56" height="28" rx="3" fill="#FFFDF5" stroke="${L}" stroke-width="1.8"/><text x="100" y="180" text-anchor="middle" font-size="15" font-weight="800" fill="#2B1B10" font-family="Cascadia Code, Consolas, monospace">${t}</text>`;

export default {
  name: 'Склад памяти',
  acts: [
    { // I. Пустой склад: рассвет, лучи из окон, первый массив и срез
      title: 'Пустой склад', story: 'Склад открыт: массив [5]int и первый срез a[1:4].',
      pal: { ...dark, scrim: '#10282C' },
      bg: (W, H) => sky(W, H, [[0, '#10282C'], [1, '#18393D']]) + Array.from({ length: Math.ceil(W / 24) }, (_, i) => `<rect x="${i * 24}" y="0" width="4" height="${H}" fill="#FFFFFF" opacity=".025"/>`).join(''),
      back: () => {
        let s = `<rect x="180" y="110" width="720" height="650" fill="#1F4A4D"/>` +
          `<path d="M0 -40 L180 110 L180 760 L0 1100Z" fill="#163A3D"/><path d="M1080 -40 L900 110 L900 760 L1080 1100Z" fill="#163A3D"/>` +
          `<path d="M180 760 L900 760 L1080 1100 L0 1100Z" fill="#2B4743"/>` +
          Array.from({ length: 9 }, (_, i) => `<path d="M${260 + i * 70} 760 L${-160 + i * 175} 1100" stroke="#21403D" stroke-width="4"/>`).join('') +
          [0, 1, 2, 3].map((i) => `<path d="M0 ${300 + i * 190} L180 ${250 + i * 140}" stroke="#2C5A5C" stroke-width="12"/><path d="M1080 ${300 + i * 190} L900 ${250 + i * 140}" stroke="#2C5A5C" stroke-width="12"/>`).join('') +
          [40, 120].map((x) => `<path d="M${x} ${x * 0.8} L${x} ${1100 - x * 1.9}" stroke="#2C5A5C" stroke-width="10"/><path d="M${1080 - x} ${x * 0.8} L${1080 - x} ${1100 - x * 1.9}" stroke="#2C5A5C" stroke-width="10"/>`).join('');
        [250, 470, 690].forEach((x) => {
          s += `<rect x="${x}" y="170" width="140" height="170" fill="#CFE8E4"/>` +
            `<path d="M${x} 340 L${x + 140} 340 L${x - 60} 1000 L${x - 260} 1000Z" fill="#E9FFF7" opacity=".1"/>`;
        });
        return s;
      },
      front: (rng) => {
        let s = [250, 470, 690].map((x) => `<rect x="${x}" y="170" width="140" height="170" fill="none" stroke="#2C5A5C" stroke-width="10"/><path d="M${x + 70} 170 V340 M${x} 255 H${x + 140}" stroke="#2C5A5C" stroke-width="6"/>`).join('');
        s += crate(200, 640, 74, 60, '#8D6E52', '?', { fs: 26, ink: '#F4FFF9' }) + crate(232, 700, 80, 64, '#A0805F', '?', { fs: 26, ink: '#F4FFF9' }) + crate(150, 700, 76, 64, '#7D5E44', '?', { fs: 26, ink: '#F4FFF9' });
        // массив [5]int и срез a[1:4]
        s += `<rect x="300" y="400" width="480" height="92" rx="10" fill="#0F2A2C" stroke="#FFC857" stroke-width="4"/>` + txt(540, 446, 'СКЛАД ПАМЯТИ', 34, '#FFC857', 'text-anchor="middle" font-weight="900"') + txt(540, 478, 'с адреса 0xc000010000', 20, '#7FD1AE', 'text-anchor="middle"', SVGM);
        s += txt(70, 812, 'a := [5]int{…}', 26, '#FFC857', 'font-weight="800"', SVGM);
        for (let i = 0; i < 5; i++) s += crate(70 + i * 120, 834, 112, 96, '#E9C46A', 'int', { fs: 22 }) + txt(126 + i * 120, 968, String(i), 24, '#FFC857', 'text-anchor="middle" font-weight="800"', SVGM);
        s += `<rect x="180" y="820" width="372" height="122" rx="14" fill="none" stroke="#FF8FA3" stroke-width="5" stroke-dasharray="14 9"/>` +
          txt(190, 1012, 's := a[1:4]  ·  len 3, cap 4', 24, '#FF8FA3', 'font-weight="700"', SVGM);
        // луч фонарика на ящики
        s += `<path d="M738 900 L738 928 L200 1010 L200 790Z" fill="#FFF3C4" opacity=".16"/>`;
        s += Array.from({ length: 26 }, () => `<circle cx="${(rng() * 1080).toFixed(0)}" cy="${(300 + rng() * 650).toFixed(0)}" r="${(1.5 + rng() * 2).toFixed(1)}" fill="#FFF8E0" opacity="${(0.3 + rng() * 0.5).toFixed(2)}"/>`).join('');
        s += clawdOn(606, 834, 0.74, { hat: 'visor', item: 'lantern' });
        s += gopherOn(dressed(base, { arms: 'hold', eyes: 'wide', look: -0.8, item: flashlight }), 852, 1012, 300);
        return s;
      },
    },
    { // II. Конвейер: строка — это байты, map — это корзины
      title: 'Конвейер', story: 'Строка — это байты, а map раскладывает ключи по корзинам.',
      pal: { ink: '#FFF3E0', muted: 'rgba(255,243,224,0.76)', acc: '#FFB703', card: 'rgba(255,255,255,0.1)', stamp: '#FFB703', scrim: '#2A1A10' },
      bg: (W, H) => sky(W, H, [[0, '#2A1A10'], [1, '#4A2E1A']]),
      back: () => gear(860, 120, 50, 9, '#6B4428') +
        `<rect x="-20" y="430" width="1120" height="26" fill="#7F5539"/><rect x="600" y="-20" width="24" height="460" fill="#7F5539"/>` +
        `<path d="M440 380 L440 220 Q540 120 640 220 L640 380Z" fill="#FFB86B" opacity=".55"/>` + glow(540, 300, 320, '#FFB86B', 0.35) +
        `<rect x="0" y="930" width="1080" height="170" fill="#2B1B10"/>`,
      front: () => {
        let s = gear(120, 300, 110, 12, '#5A3920', { hole: '#2A1A10' }) + gear(290, 196, 66, 10, '#6B4428', { rot: 0.2, hole: '#2A1A10' }) + gear(1010, 250, 96, 11, '#5A3920', { rot: 0.1, hole: '#2A1A10' });
        s += conveyor(-20, 1100, 700, { legs: 230 });
        // строка "Goф": руны и байты
        const tile = (x, ch, bytes, w = 64) => `<rect x="${x}" y="636" width="${w}" height="64" rx="6" fill="#FFFDF5" stroke="${L}" stroke-width="3"/>${txt(x + w / 2, 680, ch, 38, '#2B1B10', 'text-anchor="middle" font-weight="800"')}${txt(x + w / 2, 626, bytes, 17, '#FFB703', 'text-anchor="middle" font-weight="700"', SVGM)}`;
        s += txt(40, 560, 's := "Goф"', 28, '#FFF3E0', 'font-weight="800"', SVGM) + txt(40, 594, 'len(s) = 4 · рун 3', 22, '#FFB703', 'font-weight="700"', SVGM);
        s += tile(40, 'G', '47') + tile(112, 'o', '6F') + tile(184, 'ф', 'D1 84', 84);
        // Clawd едет в ящике
        s += clawd(296, 560, 0.8, { hat: 'visor', both: true, eyes: 'happy', shadow: false }) + crate(284, 638, 124, 62, '#E9C46A', '', { tape: false });
        // машина hash()
        s += `<path d="M470 470 L530 400 L590 400 L650 470Z" fill="#ADB5BD" stroke="${L}" stroke-width="3"/><rect x="450" y="470" width="220" height="200" rx="10" fill="#C1440E" stroke="${L}" stroke-width="4"/>` +
          `<rect x="474" y="500" width="172" height="58" rx="6" fill="#2B1B10"/>${txt(560, 540, 'hash(k)', 30, '#FFB703', 'text-anchor="middle" font-weight="800"', SVGM)}` +
          `<circle cx="500" cy="610" r="16" fill="#FFB703" stroke="${L}" stroke-width="3"/><circle cx="560" cy="610" r="16" fill="#90BE6D" stroke="${L}" stroke-width="3"/><circle cx="620" cy="610" r="16" fill="#E63946" stroke="${L}" stroke-width="3"/>` +
          `<g transform="translate(560 360) rotate(-8)"><rect x="-56" y="-26" width="112" height="44" rx="5" fill="#FFFDF5" stroke="${L}" stroke-width="2.5"/>${txt(0, 4, '"go"', 22, '#2B1B10', 'text-anchor="middle" font-weight="800"', SVGM)}</g>`;
        // корзины map
        s += `<rect x="700" y="380" width="340" height="300" rx="8" fill="#6B4226" stroke="${L}" stroke-width="4"/>` + txt(870, 366, 'map[string]int', 26, '#FFF3E0', 'text-anchor="middle" font-weight="800"', SVGM);
        for (let i = 0; i < 8; i++) {
          const x = 718 + (i % 4) * 80, y = 400 + Math.floor(i / 4) * 130;
          s += `<rect x="${x}" y="${y}" width="68" height="110" rx="4" fill="#8B5E3C" stroke="${L}" stroke-width="2.5"/><rect x="${x + 22}" y="${y + 50}" width="24" height="8" rx="3" fill="#E9C46A"/>${txt(x + 34, y + 30, String(i), 22, '#FFF3E0', 'text-anchor="middle" font-weight="800"', SVGM)}`;
        }
        s += `<g transform="translate(880 530)"><rect x="-50" y="-20" width="110" height="60" rx="5" fill="#FFFDF5" stroke="${L}" stroke-width="2.5" transform="rotate(6)"/>${txt(6, 18, '"go": 1', 20, '#2B1B10', 'text-anchor="middle" font-weight="800"', SVGM)}</g>`;
        s += `<path d="M640 600 Q690 640 760 610" stroke="#FFB703" stroke-width="4" stroke-dasharray="8 7" fill="none"/>`;
        // гофер с этикетировщиком; ярлык летит к ящику
        s += gopherOn(dressed(base, { arms: 'hold', eyes: 'happy', look: 0.7, item: boxItem('[]rune') }), 210, 1060, 300);
        return s;
      },
    },
    { // III. Картотека: ночь, структура на чертеже, интерфейс — это розетка
      title: 'Картотека', story: 'type User struct — и он подходит в розетку Stringer.',
      pal: { ink: '#FFF8E7', muted: 'rgba(255,248,231,0.76)', acc: '#E9C46A', card: 'rgba(255,255,255,0.1)', stamp: '#E9C46A', scrim: '#1C2620' },
      bg: (W, H) => sky(W, H, [[0, '#1C2620'], [1, '#26332A']]),
      back: (rng) => {
        let s = `<path d="M380 560 L380 260 Q540 100 700 260 L700 560Z" fill="#22335A"/>` + stars(rng, 40, 400, 180, 280, 300, '#FFFFFF', 1.4) +
          `<rect x="0" y="60" width="330" height="860" fill="#3A2818"/><rect x="750" y="60" width="330" height="860" fill="#3A2818"/>`;
        for (let i = 0; i < 6; i++) { s += shelf(rng, 10, 180 + i * 130, 310, { wood: '#5C3D27' }) + shelf(rng, 760, 180 + i * 130, 310, { wood: '#5C3D27' }); }
        s += `<rect x="0" y="900" width="1080" height="200" fill="#3B2A1C"/>` + glow(560, 820, 360, '#FFD98E', 0.35);
        return s;
      },
      front: () => {
        let s = `<path d="M380 560 L380 260 Q540 100 700 260 L700 560Z" fill="none" stroke="#5C3D27" stroke-width="14"/><path d="M540 140 V560 M380 380 H700" stroke="#5C3D27" stroke-width="8"/>`;
        // чертёж структуры, приколот к полке справа
        s += `<g transform="translate(768 214) rotate(2)"><rect width="290" height="250" fill="#DCEBFF" stroke="#3A6EA5" stroke-width="4"/>` +
          ['type User struct {', '  Name string', '  Age  int', '}', '', 'func (u User)', '  String() string'].map((l, i) => txt(16, 40 + i * 30, l, 19, '#1D3557', 'font-weight="700"', SVGM)).join('') +
          `<circle cx="145" cy="0" r="9" fill="#E63946" stroke="${L}" stroke-width="2"/></g>`;
        // розетки-интерфейсы
        s += `<rect x="776" y="520" width="280" height="300" rx="10" fill="#6B4226" stroke="${L}" stroke-width="4"/>`;
        [['Stringer', 560], ['error', 650], ['io.Reader', 740]].forEach(([t, y], i) => {
          s += `<circle cx="830" cy="${y + 20}" r="28" fill="#F1E3C8" stroke="${L}" stroke-width="3"/><rect x="820" y="${y + 8}" width="6" height="24" rx="2" fill="${L}"/><rect x="834" y="${y + 8}" width="6" height="24" rx="2" fill="${L}"/>` +
            txt(872, y + 30, t, 24, i ? '#F1E3C8' : '#E9C46A', 'font-weight="800"', SVGM);
        });
        // картотека: ящички-корзины, один выдвинут
        s += `<rect x="70" y="520" width="300" height="400" rx="8" fill="#7F5539" stroke="${L}" stroke-width="4"/>`;
        for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
          const x = 86 + c * 94, y = 536 + r * 76;
          s += `<rect x="${x}" y="${y}" width="84" height="66" rx="4" fill="#9C6B3F" stroke="${L}" stroke-width="2"/><rect x="${x + 28}" y="${y + 40}" width="28" height="9" rx="3" fill="#E9C46A"/>${txt(x + 42, y + 28, '0x' + (r * 3 + c).toString(16).toUpperCase(), 17, '#FFF8E7', 'text-anchor="middle" font-weight="700"', SVGM)}`;
        }
        s += `<path d="M180 690 L292 690 L320 720 L208 720Z" fill="#B07A45" stroke="${L}" stroke-width="2.5"/><rect x="214" y="650" width="74" height="54" rx="3" fill="#FFFDF5" stroke="${L}" stroke-width="2" transform="rotate(-6 250 677)"/>${txt(250, 684, '"Ann"', 17, '#2B1B10', 'text-anchor="middle" font-weight="800"', SVGM)}`;
        s += clawdOn(220, 520, 0.72, { hat: 'visor', item: () => csign('nil?', '#F1E3C8'), eyes: 'open' });
        // гофер тянет кабель User к розетке Stringer (рука вправо-вверх)
        const gx = 600, gy = 960, w = 300;
        s += `<path d="M${gx + 128} ${gy - 136} Q760 740 790 590" stroke="#212529" stroke-width="8" fill="none" stroke-linecap="round"/>` +
          `<g transform="translate(790 580) rotate(-30)"><rect x="-32" y="-22" width="64" height="40" rx="8" fill="#E9C46A" stroke="${L}" stroke-width="3"/>${txt(0, 6, 'User', 17, '#2B1B10', 'text-anchor="middle" font-weight="800"', SVGM)}</g>`;
        s += gopherOn(dressed(base, { arms: [0, -72], eyes: 'happy', look: 0.9 }), gx, gy, w);
        // стол на переднем плане с лампой
        s += `<path d="M380 930 L1100 930 L1100 954 L380 954Z" fill="#8B5E3C" stroke="${L}" stroke-width="3"/><rect x="380" y="954" width="720" height="150" fill="#5C3D27"/>` +
          lamp(462, 930, 0.7) + `<rect x="880" y="896" width="150" height="34" rx="3" fill="#3A86FF" stroke="${L}" stroke-width="2.5"/>${txt(896, 920, 'Go: данные', 17, '#fff', 'font-weight="800"')}`;
        return s;
      },
    },
    { // IV. Всё по полочкам: золотой проход, JOIN над головой
      title: 'Всё по полочкам', story: 'Слайсы, мапы, интерфейсы и JOIN — всё по полочкам.',
      pal: { ink: '#2B1B10', muted: 'rgba(43,27,16,0.72)', acc: '#C2410C', card: 'rgba(255,255,255,0.58)', stamp: '#C2410C', scrim: '#F6DFB0' },
      bg: (W, H) => sky(W, H, [[0, '#F6DFB0'], [1, '#E8B877']]),
      back: (rng) => {
        const vx = 540, top = 380, bot = 640;
        let s = glow(vx, 500, 260, '#FFF6D8', 0.9) + `<rect x="420" y="${top}" width="240" height="${bot - top}" fill="#FFF3D6"/>`;
        s += `<path d="M0 0 L420 ${top} L420 ${bot} L0 1100Z" fill="#C98B4F"/><path d="M1080 0 L660 ${top} L660 ${bot} L1080 1100Z" fill="#C98B4F"/>`;
        s += `<path d="M420 ${bot} L660 ${bot} L1080 1100 L0 1100Z" fill="#B07A45"/><path d="M540 ${bot} L540 1100" stroke="#FFE29A" stroke-width="8" stroke-dasharray="40 30"/>`;
        const cols = ['#E76F51', '#2A9D8F', '#E9C46A', '#457B9D', '#F4A261', '#90BE6D', '#B5838D'];
        for (let i = 0; i < 6; i++) {
          const f = 0.08 + i * 0.16;
          for (const side of [-1, 1]) {
            const x0 = side < 0 ? 0 : 1080, x1 = side < 0 ? 420 : 660, y0 = f * 1100, y1 = top + f * (bot - top);
            s += `<path d="M${x0} ${y0} L${x1} ${y1}" stroke="#7F5539" stroke-width="${10 - i}"/>`;
            for (let k = 0; k < 9; k++) { const t0 = 0.3 + k * 0.075, t = t0 + 0.06; if (t > 1) break; const xa = x0 + (x1 - x0) * t0, xb = x0 + (x1 - x0) * t, ya = y0 + (y1 - y0) * t0, yb = y0 + (y1 - y0) * t, hh = (1 - t0) * 120 + 18; s += `<path d="M${xa} ${ya} L${xb} ${yb} L${xb} ${yb - hh * 0.8} L${xa} ${ya - hh}Z" fill="${cols[(i * 3 + k) % cols.length]}" opacity=".9"/>`; }
          }
        }
        s += [0.25, 0.5, 0.7].map((f) => glow(540, 30 + f * 300, 70 - f * 30, '#FFF6D8', 0.8)).join('');
        return s;
      },
      front: (rng) => {
        let s = '';
        // ближние полки с подписанными ящиками
        const near = [['string', '[]int', 'map'], ['struct', 'error', 'any'], ['time', 'rune', '[]byte']];
        near.forEach((row, i) => {
          const y = 350 + i * 210;
          s += `<path d="M0 ${y} L210 ${y + 46}" stroke="#7F5539" stroke-width="14"/><path d="M1080 ${y} L870 ${y + 46}" stroke="#7F5539" stroke-width="14"/>`;
          row.forEach((t, k) => { if (k > 1) return; const cx = 54 + k * 100, by = y + 46 * cx / 210 - 4; s += crate(cx - 46, by - 86, 92, 86, ['#E76F51', '#2A9D8F', '#E9C46A'][(i + k) % 3], t, { fs: 17, edge: L }) + crate(1080 - cx - 46, by - 86, 92, 86, ['#457B9D', '#F4A261', '#90BE6D'][(i + k) % 3], row[2 - k], { fs: 17, edge: L }); });
        });
        // вывеска JOIN на цепях
        const tb = (x, y, name, rows) => `<rect x="${x}" y="${y}" width="120" height="${26 + rows.length * 24}" rx="4" fill="#FFFDF5" stroke="${L}" stroke-width="2.5"/><rect x="${x}" y="${y}" width="120" height="26" rx="4" fill="#457B9D"/>${txt(x + 60, y + 19, name, 16, '#fff', 'text-anchor="middle" font-weight="800"', SVGM)}` + rows.map((r, i) => txt(x + 10, y + 46 + i * 24, r, 15, '#2B1B10', 'font-weight="700"', SVGM)).join('');
        s += `<path d="M420 120 V200 M660 120 V200" stroke="#5C4033" stroke-width="4" stroke-dasharray="6 4"/><rect x="360" y="196" width="360" height="200" rx="10" fill="#6B4226" stroke="${L}" stroke-width="4"/>` +
          txt(540, 236, 'SELECT … JOIN', 26, '#FFE29A', 'text-anchor="middle" font-weight="800"', SVGM) + tb(380, 256, 'users', ['1 Ann', '2 Bob']) + tb(580, 256, 'orders', ['7 → 1', '8 → 2']) +
          `<path d="M500 300 L580 300 M500 324 L580 324" stroke="#E63946" stroke-width="3"/>`;
        s += Array.from({ length: 30 }, () => `<circle cx="${(rng() * 1080).toFixed(0)}" cy="${(200 + rng() * 700).toFixed(0)}" r="${(1.5 + rng() * 2.5).toFixed(1)}" fill="#FFF6D8" opacity="${(0.4 + rng() * 0.5).toFixed(2)}"/>`).join('');
        // Clawd на погрузчике с ящиком [T any]
        s += clawd(686, 950 - 98 * 0.62, 0.62, { hat: 'visor', eyes: 'happy', shadow: false, wave: true });
        s += forklift(660, 1060, 0.95, { load: crate(160, -110, 100, 72, '#6A4C93', '[T any]', { fs: 17, ink: '#FFFFFF', edge: L }) });
        s += gopherOn(dressed(base, { arms: 'hold', eyes: 'happy', look: 0.3, squash: 1.03, item: 'clipboard' }), 380, 1070, 330);
        return s;
      },
    },
  ],
};
