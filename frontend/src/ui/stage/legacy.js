// Временный переходник: этапы 2–7 в старом виде (кадр = тот же мир с прогрессом k). Заменяются по одному на s2…s7.
import { L, SVGF, SVGM, esc, txt, rngFrom, gopherAt, dressed, items, hats, clawd, CI, csign } from './kit.js';
const stars = (rng, n, W, H, fill, rmax = 2.2) => Array.from({ length: n }, () => `<circle cx="${(rng() * W).toFixed(0)}" cy="${(rng() * H).toFixed(0)}" r="${(0.6 + rng() * rmax).toFixed(1)}" fill="${fill}" opacity="${(0.3 + rng() * 0.7).toFixed(2)}"/>`).join('');
const OLD = {
  2: {
    name: 'Склад памяти',
    story: ['Склад открыт: первые коробки — массивы и слайсы.', 'Строки изнутри и map — полки заполняются.', 'Структуры, методы, интерфейсы — всё подписано.', 'Слайсы, мапы, интерфейсы — всё по полочкам.'],
    pal: { ink: '#F4FFF9', muted: 'rgba(244,255,249,0.74)', acc: '#FFC857', card: 'rgba(255,255,255,0.09)', stamp: '#FFC857', scrim: '#0B2E2F' },
    bg: (W, H, rng) => `<defs><linearGradient id="s2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B2E2F"/><stop offset="1" stop-color="#145F5F"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s2)"/>` +
      Array.from({ length: Math.ceil(H / 64) }, (_, j) => Array.from({ length: 6 }, (_, i) => `<text x="${i * 190 + 20}" y="${j * 64 + 40}" font-size="17" fill="#7FD1AE" opacity="${(0.05 + rng() * 0.08).toFixed(2)}" ${SVGM}>0xc000${(0x1a0 + (j * 6 + i) * 8).toString(16)}</text>`).join('')).join(''),
    back: () => {
      let s = `<rect x="40" y="200" width="1000" height="800" fill="#0E3B3C" opacity=".7"/>`;
      s += [270, 470, 670, 870].map((y) => `<rect x="40" y="${y}" width="1000" height="16" fill="#C68B59" stroke="#0B2E2F" stroke-width="3"/>`).join('');
      s += [40, 1024].map((x) => `<rect x="${x}" y="190" width="18" height="820" fill="#A47148" stroke="#0B2E2F" stroke-width="3"/>`).join('');
      s += `<g transform="translate(860 330) rotate(8)"><rect x="0" y="0" width="16" height="700" fill="#BC8A5F" stroke="#0B2E2F" stroke-width="3"/><rect x="110" y="0" width="16" height="700" fill="#BC8A5F" stroke="#0B2E2F" stroke-width="3"/>${Array.from({ length: 9 }, (_, i) => `<rect x="10" y="${40 + i * 74}" width="106" height="12" fill="#DDA15E" stroke="#0B2E2F" stroke-width="2"/>`).join('')}</g>`;
      s += `<rect x="0" y="1000" width="1080" height="100" fill="#0B2E2F"/><path d="M0 1000 H1080" stroke="#7FD1AE" stroke-width="3" opacity=".5"/>`;
      return s;
    },
    front: (_, k) => {
      const rng = rngFrom(202);
      const box = (x, y, w, h, c, t) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="4" fill="${c}" stroke="#0B2E2F" stroke-width="3"/><path d="M0 ${h * 0.32} H${w}" stroke="#0B2E2F" stroke-opacity=".35" stroke-width="2"/><rect x="${w / 2 - 18}" y="${h * 0.32 - 6}" width="36" height="12" fill="#fff" opacity=".35"/><text x="${w / 2}" y="${h * 0.78}" text-anchor="middle" font-size="18" font-weight="700" fill="#2B1B10" ${SVGM}>${esc(t)}</text></g>`;
      const labels = ['[]int', 'array', '[]byte', 'string', 'rune', 'map', 'struct', '*T', 'error', 'any', 'time', 'chan', 'bool', 'float64', 'uint8', '[3]int'];
      const cols = ['#E9C46A', '#F4A261', '#E76F51', '#90BE6D', '#43AA8B', '#F9C74F', '#F8961E', '#577590'];
      const all = []; let n = 0;
      for (const y of [870, 670, 470, 270]) { // снизу вверх
        let x = 80;
        while (x < 940) { const w = 110 + Math.floor(rng() * 70), h = 90 + Math.floor(rng() * 70); if (x + w > 1000) break; all.push(box(x, y - h, w, h, cols[n % cols.length], labels[n % labels.length])); n++; x += w + 18 + rng() * 20; }
      }
      let s = all.slice(0, Math.round(all.length * [0.25, 0.5, 0.78, 1][k - 1])).join('');
      // неразобранная куча на полу
      for (let i = 0; i < (4 - k) * 2; i++) s += `<g transform="translate(${70 + (i % 3) * 78} ${930 - Math.floor(i / 3) * 62}) rotate(${(i % 2 ? 4 : -5)})"><rect width="72" height="58" rx="3" fill="#B08968" stroke="#0B2E2F" stroke-width="3"/><text x="36" y="40" text-anchor="middle" font-size="24" font-weight="800" fill="#2B1B10" ${SVGF}>?</text></g>`;
      const arrows = [`<path d="M200 200 Q420 80 640 190"/>`, `<path d="M300 600 Q520 520 700 600"/>`, `<path d="M820 420 Q980 520 860 640"/>`];
      const heads = [`<path d="M640 190 l-22 -6 l10 -16z"/>`, `<path d="M700 600 l-22 -2 l12 -16z"/>`, `<path d="M860 640 l2 -22 l16 12z"/>`];
      s += `<g fill="none" stroke="#FFC857" stroke-width="4" stroke-dasharray="10 8">${arrows.slice(0, k - 1).join('')}</g><g fill="#FFC857">${heads.slice(0, k - 1).join('')}</g>`;
      const pose = [{ arms: 'hold', eyes: 'wide', look: 0.3, item: 'boxes' }, { arms: 'hold', eyes: 'up', look: 0.5, item: 'boxes' }, { arms: 'hold', eyes: 'open', look: -0.4, item: 'clipboard' }, { arms: 'hold', eyes: 'happy', look: 0.35, item: 'boxes' }][k - 1];
      s += gopherAt(dressed({ hat: 'visor' }, pose), 330, 640, 340);
      s += [
        () => clawd(130, 930 - 62 * (k === 1 ? 1 : 0) - 98 * 0.85, 0.85, { hat: 'visor', item: 'box', both: true }),
        () => clawd(880, 600 - 98 * 0.8, 0.8, { hat: 'visor', item: 'box' }),
        () => clawd(700, 1000 - 98 * 0.9, 0.9, { hat: 'visor', item: () => csign('map[k]v', '#FFC857') }),
        () => clawd(450, 192 - 98 * 0.85, 0.85, { hat: 'visor', wave: true, jump: 18 }),
      ][k - 1]();
      return s;
    },
  },
  3: {
    name: 'Цирк горутин',
    story: ['Первая горутина. И первая гонка данных.', 'Каналы и select — шары летают по кругу.', 'Mutex, атомики, context — никто не роняет.', 'Тысячи горутин — и ни одной гонки.'],
    pal: { ink: '#FFFFFF', muted: 'rgba(255,255,255,0.76)', acc: '#FF5CA8', card: 'rgba(255,255,255,0.1)', stamp: '#5CE1E6', scrim: '#1B1035' },
    bg: (W, H, rng) => `<defs><radialGradient id="s3" cx=".5" cy=".2" r="1"><stop offset="0" stop-color="#3A1F78"/><stop offset=".6" stop-color="#1B1035"/><stop offset="1" stop-color="#0D0820"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#s3)"/>` +
      stars(rng, 140, W, H, '#FFFFFF', 1.8) +
      Array.from({ length: 12 }, (_, i) => `<path d="M${W / 2} -40 L${i * 100 - 60} ${H} L${i * 100 - 10} ${H}Z" fill="${i % 2 ? '#FF5CA8' : '#5CE1E6'}" opacity=".04"/>`).join(''),
    back: (rng, k) => `<path d="M260 -200 L120 1000 H960 L820 -200Z" fill="#FFF6C9" opacity="${0.04 + k * 0.025}"/>` +
      `<ellipse cx="540" cy="1000" rx="520" ry="90" fill="#2E1A5C"/>` +
      // шатёр: гирлянды флажков
      `<path d="M-20 120 Q270 220 540 130 T1100 120" stroke="#FFD166" stroke-width="3" fill="none"/>` +
      Array.from({ length: 14 }, (_, i) => { const x = 20 + i * 78, y = 140 + Math.sin(i / 13 * Math.PI * 2) * -30 + (i < 7 ? i * 6 : (13 - i) * 6); return `<path d="M${x} ${y} l18 0 l-9 26z" fill="${['#FF5CA8', '#5CE1E6', '#FFD166'][i % 3]}"/>`; }).join(''),
    front: (rng0, k) => {
      const rng = rngFrom(303);
      let s = '';
      const pipes = [[250, '#5CE1E6'], [360, '#FF5CA8'], [470, '#FFD166']].slice(0, Math.min(k, 3));
      for (const [y, c] of pipes) {
        s += `<path d="M-20 ${y} C300 ${y - 90} 760 ${y + 90} 1100 ${y}" stroke="${c}" stroke-width="34" fill="none" opacity=".16"/><path d="M-20 ${y} C300 ${y - 90} 760 ${y + 90} 1100 ${y}" stroke="${c}" stroke-width="4" fill="none" opacity=".85"/>`;
        for (let i = 0; i < 6; i++) { const t = (i + rng() * 0.5) / 6, x = -20 + t * 1120, yy = y + (t < 0.5 ? -60 * Math.sin(t * Math.PI * 2) : 60 * Math.sin((t - 0.5) * Math.PI * 2)); s += `<circle cx="${x.toFixed(0)}" cy="${yy.toFixed(0)}" r="20" fill="${c}" opacity=".25"/><circle cx="${x.toFixed(0)}" cy="${yy.toFixed(0)}" r="11" fill="${c}"/>`; }
      }
      const sign = (x, y, r, t, c) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect width="${t.length * 17 + 36}" height="70" rx="12" fill="#1B1035" stroke="${c}" stroke-width="4"/><text x="${(t.length * 17 + 36) / 2}" y="46" text-anchor="middle" font-size="27" font-weight="800" fill="${c}" ${SVGM}>${esc(t)}</text></g>`;
      s += sign(40, 580, -5, 'go func()', '#FF5CA8');
      if (k >= 2) s += sign(850, 560, 6, 'select {}', '#5CE1E6');
      if (k >= 3) s += sign(36, 700, 4, 'sync.Mutex', '#FFD166');
      if (k >= 4) s += sign(830, 680, -4, 'ctx.Done()', '#B8F2E6');
      // подиум
      s += `<ellipse cx="540" cy="990" rx="300" ry="50" fill="#FF5CA8" stroke="#FFD166" stroke-width="6"/>` +
        Array.from({ length: 10 }, (_, i) => `<path d="M${270 + i * 60} 1000 l30 0 l0 70 l-30 0z" fill="${i % 2 ? '#FFD166' : '#FF5CA8'}"/>`).join('');
      const run = { view: 'side', arms: [60, -70], feet: 'walk', tilt: 8 };
      const minis = [gopherAt(run, 40, 820, 120), gopherAt({ ...run, flip: true }, 920, 840, 110), gopherAt(run, 150, 900, 90), gopherAt({ ...run, flip: true }, 860, 920, 80)];
      s += minis.slice(0, k).join('');
      // жонглирование: шаров столько, сколько кадр
      const orbs = [[[100, -86, '#FFD166']], [[40, -30, '#5CE1E6'], [160, -30, '#FF5CA8']], [[34, -10, '#5CE1E6'], [100, -84, '#FFD166'], [166, -10, '#FF5CA8']], [[34, -10, '#5CE1E6'], [100, -84, '#FFD166'], [166, -10, '#FF5CA8']]][k - 1];
      const juggle = `<path d="M40 -6 Q100 -110 160 -6" stroke="#5CE1E6" stroke-width="3" stroke-dasharray="6 7" fill="none" opacity="${k > 1 ? 0.8 : 0}"/>` +
        orbs.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="24" fill="${c}" opacity=".25"/><circle cx="${x}" cy="${y}" r="14" fill="${c}" stroke="${L}" stroke-width="2.2"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13" font-weight="800" fill="#1B1035" ${SVGM}>go</text>`).join('') +
        (k === 4 ? [[-10, -60], [210, -60], [100, -150]].map(([x, y]) => `<path d="M${x} ${y - 12} L${x + 4} ${y - 4} L${x + 12} ${y} L${x + 4} ${y + 4} L${x} ${y + 12} L${x - 4} ${y + 4} L${x - 12} ${y} L${x - 4} ${y - 4}Z" fill="#FFF6C9"/>`).join('') : '');
      const pose = { arms: 'up', eyes: ['wide', 'open', 'happy', 'happy'][k - 1], lift: [0, 6, 10, 16][k - 1], hat: ['bow', juggle] };
      s += gopherAt(dressed({}, pose), 380, 640, 320);
      s += [
        () => clawd(760, 990 - 98 * 0.85, 0.85, { hat: 'top', item: () => CI.orb('#FFD166'), both: true }),
        () => clawd(780, 990 - 98 * 0.85, 0.85, { hat: 'top', item: () => CI.orb('#5CE1E6'), jump: 10 }),
        () => `<circle cx="830" cy="950" r="46" fill="#5CE1E6" stroke="${L}" stroke-width="3"/><path d="M786 940 Q830 925 874 940 M790 966 Q830 980 870 966" stroke="#FF5CA8" stroke-width="8" fill="none"/>` + clawd(775, 904 - 98 * 0.85, 0.85, { hat: 'top', both: true }),
        () => clawd(790, 990 - 98 * 0.9, 0.9, { hat: 'top', wave: true, jump: 30 }),
      ][k - 1]();
      return s;
    },
  },
  4: {
    name: 'Почта интернета',
    story: ['IP, порты, DNS — разбираем адреса на конвертах.', 'TCP жмёт руку, UDP просто кидает.', 'HTTP и TLS — письма под печатью.', 'Пакет ушёл, ответ пришёл: 200 OK.'],
    pal: { ink: '#F1FAFF', muted: 'rgba(241,250,255,0.76)', acc: '#FFD166', card: 'rgba(255,255,255,0.1)', stamp: '#8DE4FF', scrim: '#050B1F' },
    bg: (W, H, rng) => `<defs><linearGradient id="s4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050B1F"/><stop offset=".6" stop-color="#0B2545"/><stop offset="1" stop-color="#13315C"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s4)"/>` +
      stars(rng, 180, W, H, '#CFF4FF', 1.6),
    back: () => `<defs><radialGradient id="s4p" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#1E6091"/><stop offset="1" stop-color="#0B2545"/></radialGradient></defs>` +
      `<circle cx="540" cy="1700" r="980" fill="#8DE4FF" opacity=".12"/><circle cx="540" cy="1700" r="940" fill="url(#s4p)" stroke="#8DE4FF" stroke-width="4"/>` +
      Array.from({ length: 9 }, (_, i) => `<ellipse cx="540" cy="1700" rx="940" ry="${120 + i * 100}" fill="none" stroke="#8DE4FF" stroke-opacity=".2" stroke-width="3"/>`).join('') +
      Array.from({ length: 9 }, (_, i) => `<ellipse cx="540" cy="1700" rx="${110 + i * 105}" ry="940" fill="none" stroke="#8DE4FF" stroke-opacity=".16" stroke-width="3"/>`).join(''),
    front: (_, k) => {
      const nodes = [[110, 420], [330, 260], [470, 390], [210, 600], [600, 200], [760, 470], [880, 290], [990, 520]];
      const edges = [[0, 1], [1, 2], [0, 3], [3, 2], [2, 4], [1, 4], [4, 6], [2, 5], [5, 6], [6, 7], [5, 7]];
      const n = [3, 5, 7, 8][k - 1];
      let s = edges.filter(([a, b]) => a < n && b < n).map(([a, b]) => `<path d="M${nodes[a][0]} ${nodes[a][1]} L${nodes[b][0]} ${nodes[b][1]}" stroke="#8DE4FF" stroke-opacity=".6" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round"/>`).join('');
      s += nodes.slice(0, n).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="26" fill="#8DE4FF" opacity=".18"/><circle cx="${x}" cy="${y}" r="13" fill="${i % 3 ? '#8DE4FF' : '#FFD166'}" stroke="#050B1F" stroke-width="3"/>`).join('');
      const env = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-26" y="-17" width="52" height="34" rx="3" fill="#FFFDF5" stroke="#050B1F" stroke-width="2.5"/><path d="M-26 -17 L0 4 L26 -17" fill="none" stroke="#050B1F" stroke-width="2.5"/></g>`;
      s += [env(220, 340, -18), env(160, 510, 10), env(400, 500, -6), env(740, 245, 12), env(930, 410, 20)].slice(0, k + 1).join('');
      const tag = (x, y, t, c) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="${t.length * 16 + 30}" height="44" rx="22" fill="#050B1F" stroke="${c}" stroke-width="3"/><text x="${(t.length * 16 + 30) / 2}" y="30" text-anchor="middle" font-size="22" font-weight="800" fill="${c}" ${SVGM}>${esc(t)}</text></g>`;
      const tags = [[40, 230, 'IP', '#FFD166'], [250, 160, ':8080', '#8DE4FF'], [60, 680, 'DNS', '#8DE4FF'], [390, 300, 'TCP', '#FFD166'], [820, 600, 'TLS 1.3', '#FFD166'], [640, 120, 'HTTP', '#8DE4FF'], [820, 160, 'HTTP/2', '#8DE4FF'], [840, 690, 'gRPC', '#FF8FA3']];
      s += tags.slice(0, [2, 4, 6, 8][k - 1]).map(([x, y, t, c]) => tag(x, y, t, c)).join('');
      s += `<g transform="translate(980 140) rotate(-20)"><rect x="-14" y="-10" width="28" height="20" fill="#ADB5BD" stroke="#050B1F" stroke-width="2"/><rect x="-60" y="-8" width="40" height="16" fill="#3A86FF" stroke="#050B1F" stroke-width="2"/><rect x="20" y="-8" width="40" height="16" fill="#3A86FF" stroke="#050B1F" stroke-width="2"/></g>`;
      // почтовый ящик: флажок поднят, когда ответ пришёл
      s += `<g transform="translate(780 820)"><rect x="56" y="80" width="14" height="110" fill="#6C757D"/><path d="M0 40 Q0 0 60 0 L120 0 Q130 0 130 10 V90 H0Z" fill="#E63946" stroke="#050B1F" stroke-width="4"/><rect x="18" y="38" width="80" height="8" fill="#050B1F"/>` +
        (k === 4 ? `<path d="M118 10 V-30 L150 -20 L118 -10" fill="#FFD166" stroke="#050B1F" stroke-width="3"/>` : `<path d="M118 60 H158 L148 76 H118" fill="#FFD166" stroke="#050B1F" stroke-width="3"/>`) + `</g>`;
      const bag = `<rect x="2" y="160" width="52" height="42" rx="6" fill="#A0522D" stroke="${L}" stroke-width="2.2"/><path d="M2 166 L28 186 L54 166" fill="#8B4513" stroke="${L}" stroke-width="2"/><rect x="12" y="150" width="30" height="16" fill="#fff" stroke="${L}" stroke-width="1.6" transform="rotate(-10 27 158)"/>`;
      const it = [() => items.strap + items.map, () => items.strap + items.envelope('SYN · ACK'), () => items.strap, () => items.strap + items.envelope('200 OK')][k - 1];
      const pose = [{ arms: 'hold', eyes: 'down', look: 0.2 }, { arms: 'hold', eyes: 'happy', look: 0.4 }, { arms: 'wave', eyes: 'happy', look: 0.5, tilt: -4 }, { arms: 'hold', eyes: 'happy', look: 0.4 }][k - 1];
      s += gopherAt(dressed({ hat: 'post', back: bag }, { ...pose, item: it }), 360, 640, 330);
      s += [
        () => clawd(170, 1000 - 98 * 0.85, 0.85, { hat: 'post', item: 'envelope', both: true }),
        () => clawd(782, 820 - 98 * 0.8, 0.8, { hat: 'post', item: 'envelope' }),
        () => clawd(130, 1000 - 98 * 0.85, 0.85, { hat: 'post', item: 'envelope', flip: true, jump: 14 }),
        () => clawd(782, 820 - 98 * 0.8, 0.8, { hat: 'post', wave: true, jump: 16 }),
      ][k - 1]();
      return s;
    },
  },
  5: {
    name: 'Стройка сервиса',
    story: ['Фундамент: Postgres, пул и транзакции в коде.', 'Миграции и репозиторий — этаж за этажом.', 'Слои, SOLID, Docker — дом растёт.', 'Слои, миграции, контейнеры, тесты — сервис стоит.'],
    pal: { ink: '#1D1D1D', muted: 'rgba(29,29,29,0.7)', acc: '#E85D04', card: 'rgba(255,255,255,0.6)', stamp: '#E85D04', scrim: '#FFF3D6' },
    bg: (W, H) => `<defs><linearGradient id="s5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3D6"/><stop offset="1" stop-color="#F7B267"/></linearGradient>` +
      `<pattern id="s5g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0 H0 V60" fill="none" stroke="#1D3557" stroke-opacity=".07" stroke-width="2"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#s5)"/><rect width="${W}" height="${H}" fill="url(#s5g)"/>`,
    back: () => `<circle cx="160" cy="300" r="120" fill="#FFE8B0" opacity=".7"/>` +
      `<path d="M0 860 L80 800 L140 830 L220 760 L300 820 L380 780 L460 840 L560 770 L660 830 L760 790 L860 840 L960 780 L1080 830 V1000 H0Z" fill="#E9A86A" opacity=".55"/>` +
      `<rect x="0" y="1000" width="1080" height="100" fill="#1D3557"/>` + Array.from({ length: 24 }, (_, i) => `<path d="M${i * 60 - 40} 1100 L${i * 60} 1000 L${i * 60 + 30} 1000 L${i * 60 - 10} 1100Z" fill="#FFC300"/>`).join(''),
    front: (_, k) => {
      let s = `<g stroke="#1D3557" stroke-width="5" fill="none"><path d="M880 1000 V180 M940 1000 V180 M880 180 H940"/>${Array.from({ length: 13 }, (_, i) => `<path d="M880 ${240 + i * 60} L940 ${180 + i * 60}"/>`).join('')}<path d="M300 180 H1060 M300 230 H900"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${300 + i * 60} 230 L${330 + i * 60} 180"/>`).join('')}</g>` +
        `<rect x="960" y="160" width="90" height="70" fill="#FFC300" stroke="#1D3557" stroke-width="5"/><path d="M420 230 V350" stroke="#1D3557" stroke-width="3"/><path d="M405 350 h30 q0 22 -15 22" fill="none" stroke="#1D3557" stroke-width="6"/>`;
      const floors = [['postgres', '#457B9D'], ['repository', '#E9C46A'], ['service', '#F4A261'], ['handler', '#E76F51']];
      const hang = [floors[1], floors[2], floors[3], ['api', '#2A9D8F']][k - 1];
      s += `<g transform="translate(320 370)"><path d="M100 0 L20 30 M100 0 L180 30" stroke="#1D3557" stroke-width="3"/><rect x="0" y="30" width="200" height="90" fill="${hang[1]}" stroke="#1D3557" stroke-width="5"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${20 + i * 20} 38 V112" stroke="#1D3557" stroke-opacity=".3" stroke-width="3"/>`).join('')}<text x="100" y="88" text-anchor="middle" font-size="${hang[0].length > 6 ? 24 : 30}" font-weight="900" fill="#fff" stroke="#1D3557" stroke-width="1" ${SVGM}>${hang[0]}</text></g>`;
      for (let i = 0; i < k; i++) { const y = 880 - i * 120; s += `<rect x="60" y="${y}" width="420" height="110" fill="${floors[i][1]}" stroke="#1D3557" stroke-width="5"/><text x="270" y="${y + 70}" text-anchor="middle" font-size="34" font-weight="800" fill="#1D3557" ${SVGM}>${floors[i][0]}</text>`; }
      const top = 880 - (k - 1) * 120 - 20;
      s += `<g stroke="#1D3557" stroke-width="4" fill="none"><path d="M30 ${top} V1000 M510 ${top} V1000"/>${Array.from({ length: k }, (_, i) => `<path d="M30 ${880 - i * 120} L60 ${980 - i * 120} M510 ${880 - i * 120} L480 ${980 - i * 120} M30 ${990 - i * 120} H60 M480 ${990 - i * 120} H510"/>`).join('')}</g>`;
      const cont = (x, y, c, t) => `<g transform="translate(${x} ${y})"><rect width="200" height="84" fill="${c}" stroke="#1D3557" stroke-width="5"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${20 + i * 20} 8 V76" stroke="#1D3557" stroke-opacity=".3" stroke-width="3"/>`).join('')}<text x="100" y="54" text-anchor="middle" font-size="26" font-weight="900" fill="#fff" ${SVGM}>${t}</text></g>`;
      s += [cont(640, 916, '#E63946', 'db'), cont(840, 916, '#3A86FF', 'cache'), cont(740, 832, '#6A4C93', 'migrate'), cont(700, 748, '#2A9D8F', 'tests ✓')].slice(0, k).join('');
      const pose = [{ arms: 'hold', eyes: 'open', look: 0.3, item: 'blueprint' }, { arms: 'hold', eyes: 'open', look: 0.3, item: 'wrench' }, { arms: [0, -150], eyes: 'up', look: -0.4 }, { arms: 'hold', eyes: 'happy', look: 0.3, item: 'wrench' }][k - 1];
      s += gopherAt(dressed({ hat: ['vest', 'hard'] }, pose), 470, 680, 300);
      s += [
        () => clawd(560, 1000 - 98 * 0.8, 0.8, { hat: 'hard', item: 'brick', flip: true }),
        () => clawd(380, 880 - 98 * 0.75, 0.75, { hat: 'hard', item: 'brick' }),
        () => clawd(330, 640 - 98 * 0.75, 0.75, { hat: 'hard', item: 'wrench' }),
        () => clawd(740, 748 - 98 * 0.85, 0.85, { hat: 'hard', wave: true, jump: 20 }),
      ][k - 1]();
      return s;
    },
  },
  6: {
    name: 'Диспетчерская',
    story: ['Первый топик. Лаг растёт, лампа красная.', 'Ретраи, DLQ, outbox — очередь тает.', 'Логи, метрики, трейсы — всё видно.', 'Сообщения доставлены, метрики зелёные, пейджер молчит.'],
    pal: { ink: '#E9FFF3', muted: 'rgba(233,255,243,0.72)', acc: '#39D98A', card: 'rgba(57,217,138,0.09)', stamp: '#FFB020', scrim: '#0B0F14' },
    bg: (W, H, rng) => `<rect width="${W}" height="${H}" fill="#0B0F14"/>` +
      Array.from({ length: Math.ceil(H / 34) }, (_, j) => `<text x="${W - 300}" y="${j * 34 + 30}" font-size="15" fill="#39D98A" opacity="${(0.04 + rng() * 0.07).toFixed(2)}" ${SVGM}>${['INFO consumer lag=0', 'INFO commit offset=', 'WARN retry → DLQ', 'INFO p99=41ms', 'INFO cache hit 97%', 'INFO deploy ok'][Math.floor(rng() * 6)]}${Math.floor(rng() * 9000)}</text>`).join(''),
    back: (_, k) => `<radialGradient id="s6l" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${['#E63946', '#FFB020', '#9ED96B', '#39D98A'][k - 1]}" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
      `<rect x="0" y="0" width="1080" height="1100" fill="url(#s6l)"/>` +
      `<path d="M0 860 L1080 860 L1080 1000 L0 1000Z" fill="#151D27"/><rect x="0" y="1000" width="1080" height="100" fill="#0B0F14"/>`,
    front: (_, k) => {
      const rng = rngFrom(606);
      let s = '';
      const mon = (x, y, w, h, on, inner) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="10" fill="#111820" stroke="#2B3440" stroke-width="6"/><rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="4" fill="${on ? '#0E1A14' : '#05080B'}"/>${on ? inner : `<text x="${w / 2}" y="${h / 2 + 8}" text-anchor="middle" font-size="20" fill="#2B3440" ${SVGM}>no signal</text>`}</g>`;
      let line = 'M20 150'; for (let i = 1; i <= 20; i++) line += ` L${20 + i * 14} ${150 - 40 - Math.sin(i * 0.9) * 20 - rng() * 30 + (k < 3 ? -i * 2 : 0)}`;
      const on = [1, 2, 3, 3][k - 1];
      s += mon(40, 150, 330, 200, on >= 1, `<path d="${line}" stroke="${k < 3 ? '#FFB020' : '#39D98A'}" stroke-width="4" fill="none"/><text x="24" y="44" font-size="20" fill="#39D98A" ${SVGM}>p99 · ${[480, 210, 64, 41][k - 1]}ms</text>`);
      s += mon(380, 130, 320, 230, on >= 2, Array.from({ length: 10 }, (_, i) => { const h = 30 + rng() * 120; return `<rect x="${28 + i * 27}" y="${200 - h}" width="18" height="${h}" fill="${i === 7 ? '#FFB020' : '#39D98A'}" opacity=".85"/>`; }).join('') + `<text x="24" y="44" font-size="20" fill="#39D98A" ${SVGM}>rps</text>`);
      s += mon(710, 150, 330, 200, on >= 3, `<path d="M70 160 A95 95 0 0 1 260 160" stroke="#2B3440" stroke-width="18" fill="none"/><path d="M70 160 A95 95 0 0 1 220 85" stroke="#39D98A" stroke-width="18" fill="none"/><path d="M165 160 L215 100" stroke="#E9FFF3" stroke-width="5"/><text x="165" y="48" text-anchor="middle" font-size="20" fill="#39D98A" ${SVGM}>lag ${k === 3 ? 12 : 0}</text>`);
      const amber = [2, 4, 6, 6];
      for (let p = 0; p < 3; p++) {
        const y = 420 + p * 96;
        s += `<rect x="0" y="${y}" width="1080" height="70" fill="#151D27" stroke="#2B3440" stroke-width="3"/><text x="16" y="${y - 10}" font-size="18" fill="#7D8B99" ${SVGM}>orders · partition ${p}</text>`;
        const lim = k === 4 ? 6 - p : amber[k - 1] - p;
        for (let i = 0; i < 9; i++) { const x = 130 + i * 104 + p * 30; if (x > 1040) break; const ok = i < lim; s += `<rect x="${x}" y="${y + 10}" width="84" height="50" rx="6" fill="${ok ? '#39D98A' : '#FFB020'}" opacity="${ok ? 0.9 : 0.8}" stroke="#0B0F14" stroke-width="3"/><text x="${x + 42}" y="${y + 43}" text-anchor="middle" font-size="20" font-weight="800" fill="#0B0F14" ${SVGM}>${i + p * 3}</text>`; }
      }
      s += `<path d="M${[300, 420, 560, 640][k - 1]} 410 V720" stroke="#FFB020" stroke-width="4" stroke-dasharray="10 8"/><text x="${[312, 432, 572, 652][k - 1]}" y="720" font-size="18" fill="#FFB020" ${SVGM}>commit</text>`;
      s += `<path d="M0 860 H1080" stroke="#2B3440" stroke-width="6"/>` +
        Array.from({ length: 14 }, (_, i) => `<circle cx="${60 + i * 70}" cy="${920 + (i % 2) * 30}" r="10" fill="${i % 5 === 3 || (k === 1 && i % 3 === 0) ? (k === 1 ? '#E63946' : '#FFB020') : '#39D98A'}" opacity=".85"/>`).join('');
      const lamp = ['#E63946', '#FFB020', '#9ED96B', '#39D98A'][k - 1];
      s += `<circle cx="960" cy="800" r="50" fill="${lamp}" opacity=".22"/><circle cx="960" cy="800" r="26" fill="${lamp}" stroke="#0B0F14" stroke-width="4"/><text x="960" y="766" text-anchor="middle" font-size="16" font-weight="700" fill="${lamp}" ${SVGM}>${['ALERT', 'WARN', 'OK', 'ALL OK'][k - 1]}</text>`;
      const pose = [{ arms: [150, -150], eyes: 'wide', tilt: -8, hat: ['headset', 'sweat'] }, { arms: [0, 128], eyes: 'up', look: -0.4 }, { arms: [0, -88], look: 1, eyes: 'open' }, { arms: 'hold', eyes: 'happy', look: -0.3, item: 'mug' }][k - 1];
      s += gopherAt(dressed({ hat: 'headset' }, pose), 390, 680, 310);
      s += [
        () => clawd(200, 1000 - 98 * 0.85, 0.85, { hat: 'headset', item: () => csign('лаг!', '#E63946', '#fff'), both: true }),
        () => clawd(200, 1000 - 98 * 0.85, 0.85, { hat: 'headset', item: 'mug' }),
        () => clawd(200, 1000 - 98 * 0.85, 0.85, { hat: 'headset', item: () => csign('p99 ↓', '#39D98A', '#0B0F14') }),
        () => clawd(200, 1000 - 98 * 0.85, 0.85, { hat: 'headset', item: () => csign('ALL OK', '#39D98A', '#0B0F14'), jump: 16 }),
      ][k - 1]();
      return s;
    },
  },
  7: {
    name: 'Вершина',
    story: ['Системный дизайн: маршрут проложен, лагерь 2.', 'Репликация и шардирование — выше облаков.', 'Проект собран. До вершины — мок-собес.', 'Системный дизайн разобран, проект собран. Вершина взята.'],
    pal: { ink: '#FFFFFF', muted: 'rgba(255,255,255,0.8)', acc: '#FFD08A', card: 'rgba(255,255,255,0.13)', stamp: '#FFD08A', scrim: '#1B1340' },
    bg: (W, H, rng, k) => `<defs><linearGradient id="s7" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B1340"/><stop offset=".45" stop-color="${['#3B2F6B', '#4F3A7A', '#6D3B7A', '#6D3B7A'][k - 1]}"/><stop offset=".75" stop-color="${['#C77DA0', '#E08A86', '#F28C6B', '#F28C6B'][k - 1]}"/><stop offset="1" stop-color="#FFD08A"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s7)"/>` +
      stars(rng, 90, W, H * 0.4, '#FFFFFF', 1.6) +
      (() => { const p = [[140, 140], [300, 90], [300, 200], [470, 60], [470, 150], [470, 240], [640, 150]]; const e = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [5, 6]];
        return `<g opacity=".55" transform="translate(${W - 760} ${H * 0.06})">` + e.map(([a, b]) => `<path d="M${p[a][0]} ${p[a][1]} L${p[b][0]} ${p[b][1]}" stroke="#FFD08A" stroke-width="2" stroke-dasharray="3 6"/>`).join('') + p.map(([x, y], i) => `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="${i === 6 ? 10 : 3}" fill="#FFD08A"/>`).join('') + `</g>`; })(),
    back: (_, k) => `<circle cx="540" cy="${[860, 820, 790, 760][k - 1]}" r="300" fill="#FFE8B0" opacity=".35"/><circle cx="540" cy="${[860, 820, 790, 760][k - 1]}" r="170" fill="#FFF3D6" opacity=".55"/>` +
      Array.from({ length: 14 }, (_, i) => `<ellipse cx="${(i * 97) % 1100}" cy="${880 + (i % 3) * 40}" rx="${160 + (i % 4) * 30}" ry="${50 + (i % 3) * 12}" fill="#FFFFFF" opacity="${0.55 + (i % 3) * 0.12}"/>`).join('') +
      `<path d="M-40 1000 L120 760 L230 860 L360 700 L470 820 L540 520 L620 820 L760 690 L880 860 L1000 740 L1120 1000Z" fill="#5B3A6B" opacity=".55"/>` +
      `<path d="M180 1100 L420 640 L470 690 L540 470 L600 560 L650 520 L900 1100Z" fill="#3D2C5B"/><path d="M540 470 L500 590 L530 570 L560 610 L585 560 L600 560Z" fill="#FFFFFF"/><path d="M420 640 L400 690 L430 676 L470 690Z" fill="#FFFFFF" opacity=".9"/>`,
    front: (_, k) => {
      const camps = [[300, 1010], [350, 930], [400, 860], [445, 790], [490, 710], [520, 640]];
      const reach = [2, 4, 6, 7][k - 1];
      let s = `<path d="M260 1100 Q330 960 380 900 T470 760 T540 600" stroke="#FFD08A" stroke-opacity=".35" stroke-width="7" stroke-dasharray="3 18" stroke-linecap="round" fill="none"/>`;
      camps.forEach(([x, y], i) => { const lit = i < reach; s += `<path d="M${x - 16} ${y} L${x} ${y - 24} L${x + 16} ${y}Z" fill="${lit ? '#E63946' : '#6B5B8A'}" stroke="#1B1340" stroke-width="2.5"/><text x="${x + 22}" y="${y - 2}" font-size="17" font-weight="800" fill="${lit ? '#FFF3D6' : '#A99BC9'}" ${SVGF}>${i + 1}</text>`; });
      if (k === 4) {
        s += `<path d="M560 480 V250" stroke="#2B1B17" stroke-width="8" stroke-linecap="round"/><path d="M564 256 Q640 236 700 262 Q760 286 820 262 L820 360 Q760 384 700 360 Q640 336 564 356Z" fill="#00ADD8" stroke="#1B1340" stroke-width="4"/>` +
          `<text x="692" y="324" text-anchor="middle" font-size="40" font-weight="900" fill="#FFFFFF" ${SVGF}>7 / 7</text>`;
        s += gopherAt(dressed({ hat: ['scarf', 'beanie'] }, { arms: 'hips', eyes: 'happy', squash: 1.03 }), 360, 250, 230);
        s += clawd(608, 560 - 98 * 0.7, 0.7, { hat: 'beanie', wave: true, jump: 14 });
        return s;
      }
      const [gx, gy] = camps[reach - 1], [cx, cy] = camps[reach - 2];
      const gw = 180;
      const pose = [{ arms: [0, -130], eyes: 'up', look: 0.8 }, { arms: 'wave', eyes: 'happy', look: 0.4 }, { arms: [-10, 10], eyes: 'sleepy', squash: 0.96, tilt: 4 }][k - 1];
      // верёвка между гофером и Clawd
      s += `<path d="M${gx + 10} ${gy - 30} Q${(gx + cx) / 2 + 20} ${Math.max(gy, cy) + 10} ${cx + 30} ${cy - 30}" stroke="#F4A261" stroke-width="4" fill="none"/>`;
      s += clawd(cx - 20, cy - 98 * 0.65, 0.65, { hat: 'beanie', item: k === 3 ? 'flag' : '', both: k === 2 });
      s += gopherAt(dressed({ hat: ['scarf', 'beanie'] }, pose), gx - gw / 2 + 20, gy - gw * 1.2 + 14, gw);
      return s;
    },
  },
};
export const legacy = Object.fromEntries(Object.entries(OLD).map(([n, st]) => [n, {
  name: st.name,
  acts: [1, 2, 3, 4].map((k) => ({ title: st.name, story: st.story[k - 1], pal: st.pal, bg: (W, H, rng) => st.bg(W, H, rng, k), back: (rng) => st.back(rng, k), front: (rng) => st.front(rng, k) })),
}]));
