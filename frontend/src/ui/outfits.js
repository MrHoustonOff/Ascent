// Наряд дня для гофера в итогах дня: 50 тематических нарядов.
// Обычный день — случайный наряд из общего гардероба (один и тот же весь день: выбор зависит только от даты).
// Праздники — свои наряды: 2 декабря день рождения, 10 декабря – 7 января новогодние, Хэллоуин, 14 февраля,
// 23 февраля, 8 марта, 1 апреля, 12 апреля, 1 сентября, День программиста (256-й день), день рождения Go (10 ноября).
// Наряд — две SVG-вставки в координатах гофера 200×240 (макушка ≈ y 14, глаза — круги r 33 в (67,72) и (133,72),
// мордочка (100,104), зубы y 105…120, плечи (35,140) и (165,140), низ ≈ y 224):
// hat — поверх всего (головные уборы, очки, шарфы, медали), back — за телом (плащи, крылья, рюкзаки, шары).
// Текста на нарядах нет: гофер на карточках бывает отражён.
const L = '#2E2622';
const S = `stroke="${L}" stroke-width="2.4" stroke-linejoin="round"`;
const s2 = `stroke="${L}" stroke-width="1.8" stroke-linejoin="round"`;
const star = (x, y, r, c = '#FFD166', st = true) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)} `; } return `<path d="${d}Z" fill="${c}" ${st ? s2 : ''}/>`; };
const heart = (x, y, s, c = '#FF5C8A') => `<path d="M${x} ${y + 8 * s} C${x - 22 * s} ${y - 8 * s} ${x - 12 * s} ${y - 26 * s} ${x} ${y - 14 * s} C${x + 12 * s} ${y - 26 * s} ${x + 22 * s} ${y - 8 * s} ${x} ${y + 8 * s}Z" fill="${c}" ${s2}/>`;
const mirror = (svg) => `<g transform="translate(200 0) scale(-1 1)">${svg}</g>`;
// пушистое облако из кругов: общий контур, без внутренних линий (борода, мех)
const fluffy = (cs, c = '#FFFFFF') => cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${L}" stroke="${L}" stroke-width="5"/>`).join('') + cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
// плащ за спиной: от плеч вниз, шире тела; inner — подкладка, видна по краям
const cape = (c, inner = '') => `<path d="M30 112 Q100 96 170 112 L198 236 Q100 250 2 236Z" fill="${c}" ${S}/>` + (inner ? `<path d="M40 120 Q100 108 160 120 L182 232 Q100 244 18 232Z" fill="${inner}"/>` : '');
// завязки плаща — на плечах, чтобы ничего не висело под мордочкой
const capeClasp = (c = '#FFD166') => `<circle cx="38" cy="118" r="7" fill="${c}" ${s2}/><circle cx="162" cy="118" r="7" fill="${c}" ${s2}/>`;
const wings = (c = '#FFFFFF', edge = '#D9E2EC') => {
  const w = `<path d="M44 118 Q-10 70 -34 92 Q-20 110 -36 122 Q-14 132 -30 150 Q0 156 4 170 Q26 152 40 150Z" fill="${c}" ${S}/><path d="M30 126 Q4 112 -14 120 M30 140 Q8 136 -10 146" fill="none" stroke="${edge}" stroke-width="3" stroke-linecap="round"/>`;
  return w + mirror(w);
};
const scarf = (a, b) => `<path d="M36 120 Q100 146 164 120 L166 136 Q100 162 34 136Z" fill="${a}" ${S}/><path d="M60 128 L58 144 M86 134 L85 151 M114 134 L115 151 M140 128 L142 144" stroke="${b}" stroke-width="4"/>` +
  `<path d="M128 138 L150 200 L132 204 L114 142Z" fill="${a}" ${S}/><path d="M134 192 L150 188 M131 182 L146 177" stroke="${b}" stroke-width="4"/>`;
const neckerchief = (c, dots = '') => `<path d="M64 120 Q100 136 136 120 L100 166Z" fill="${c}" ${S}/>` + (dots ? `<g fill="${dots}"><circle cx="90" cy="134" r="2.6"/><circle cx="108" cy="132" r="2.6"/><circle cx="100" cy="146" r="2.6"/><circle cx="96" cy="156" r="2"/></g>` : '') + `<circle cx="100" cy="128" r="7" fill="${c}" ${s2}/>`;
const bowTie = (c = '#1D1D1D', y = 130) => `<path d="M100 ${y} L78 ${y - 11} L78 ${y + 11}Z M100 ${y} L122 ${y - 11} L122 ${y + 11}Z" fill="${c}" ${S}/><circle cx="100" cy="${y}" r="5.5" fill="${c}" ${s2}/>`;
const shades = (c = '#141414', frame = '#141414') => `<g ${S}><rect x="34" y="52" width="64" height="40" rx="14" fill="${c}" stroke="${frame}"/><rect x="102" y="52" width="64" height="40" rx="14" fill="${c}" stroke="${frame}"/></g><path d="M98 64 Q100 60 102 64" stroke="${frame}" stroke-width="4" fill="none"/><path d="M34 62 L26 58 M166 62 L174 58" stroke="${frame}" stroke-width="4"/><path d="M44 60 L58 60 M112 60 L126 60" stroke="#FFFFFF" stroke-width="3" opacity=".55" stroke-linecap="round"/>`;
const medal = (c1 = '#E63946', c2 = '#457B9D') => `<path d="M62 116 L92 166 L100 160 L74 114Z" fill="${c1}" ${s2}/><path d="M138 116 L108 166 L100 160 L126 114Z" fill="${c2}" ${s2}/><circle cx="100" cy="172" r="15" fill="#F4C430" ${S}/>` + star(100, 172, 8, '#FFE08A', false);
const collar = (band, a, b) => `<path d="M30 126 Q100 150 170 126 L170 138 Q100 162 30 138Z" fill="${band}" ${S}/>` +
  Array.from({ length: 9 }, (_, i) => { const t0 = i / 9, t1 = (i + 1) / 9, x0 = 30 + t0 * 140, x1 = 30 + t1 * 140, y = (x) => 138 + 24 * Math.sin(((x - 30) / 140) * Math.PI); const xm = (x0 + x1) / 2; return `<path d="M${x0.toFixed(1)} ${y(x0).toFixed(1)} L${xm.toFixed(1)} ${(y(xm) + 18).toFixed(1)} L${x1.toFixed(1)} ${y(x1).toFixed(1)}Z" fill="${i % 2 ? b : a}" ${s2}/>`; }).join('');
const flower = (x, y, r, petal = '#FFFFFF', mid = '#FFD166') => Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2; return `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${r * 0.72}" fill="${petal}" ${s2}/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="${mid}" ${s2}/>`;
const partyHat = (a, b, pom) => `<path d="M64 26 L100 -64 L136 26 Q100 36 64 26Z" fill="${a}" ${S}/><path d="M76 -2 L124 -2 M86 -26 L114 -26 M70 14 L130 14" stroke="${b}" stroke-width="7"/><path d="M64 26 L100 -64 L136 26 Q100 36 64 26Z" fill="none" ${S}/>` +
  `<g>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i / 8 * Math.PI * 2; return `<path d="M100 -66 L${(100 + Math.cos(a) * 14).toFixed(1)} ${(-66 + Math.sin(a) * 14).toFixed(1)}" stroke="${pom}" stroke-width="5" stroke-linecap="round"/>`; }).join('')}</g>`;

// ---------- гардероб ----------
// pool: regular — общий; summer — общий, но только летом; остальное — праздники (см. rules)
export const OUTFITS = [
  { id: 'pirate', name: 'Пират', pool: 'regular',
    hat: `<path d="M24 40 Q30 -6 100 -10 Q170 -6 176 40 Q140 20 100 24 Q60 20 24 40Z" fill="#1F1B24" ${S}/><path d="M24 40 Q60 22 100 26 Q140 22 176 40" fill="none" stroke="#E9C46A" stroke-width="4"/>` +
      `<circle cx="100" cy="6" r="8" fill="#F8F9FA" ${s2}/><path d="M88 18 L112 28 M112 18 L88 28" stroke="#F8F9FA" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M112 52 L104 30 M154 58 L172 82" stroke="#141414" stroke-width="3"/><ellipse cx="133" cy="72" rx="27" ry="23" fill="#141414" ${s2}/>` },
  { id: 'astronaut', name: 'Космонавт', pool: 'regular',
    hat: `<circle cx="100" cy="68" r="86" fill="#CFE8F7" fill-opacity=".16" stroke="#E9F5FB" stroke-width="7"/><circle cx="100" cy="68" r="86" fill="none" stroke="${L}" stroke-width="2"/>` +
      `<path d="M40 16 Q62 -8 96 -12" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity=".7"/>` +
      `<path d="M38 140 Q100 166 162 140" fill="none" stroke="#ADB5BD" stroke-width="11" stroke-linecap="round"/><path d="M38 140 Q100 166 162 140" fill="none" stroke="${L}" stroke-width="2" stroke-dasharray="1 0" opacity=".0"/>` +
      `<path d="M100 -18 L100 -42" stroke="${L}" stroke-width="3"/><circle cx="100" cy="-46" r="7" fill="#E63946" ${s2}/>` },
  { id: 'chef', name: 'Шеф-повар', pool: 'regular',
    hat: `<circle cx="70" cy="2" r="24" fill="#FFFFFF" ${S}/><circle cx="130" cy="2" r="24" fill="#FFFFFF" ${S}/><circle cx="100" cy="-12" r="28" fill="#FFFFFF" ${S}/>` +
      `<path d="M54 40 L54 8 Q100 -2 146 8 L146 40 Q100 30 54 40Z" fill="#FFFFFF" ${S}/><path d="M76 12 L76 36 M100 8 L100 34 M124 12 L124 36" stroke="#DEE2E6" stroke-width="3"/>` + neckerchief('#E63946') },
  { id: 'detective', name: 'Детектив', pool: 'regular',
    hat: `<path d="M44 38 Q46 -6 100 -8 Q154 -6 156 38 Q100 26 44 38Z" fill="#A0784F" ${S}/><path d="M60 0 L60 34 M80 -6 L80 30 M100 -8 L100 28 M120 -6 L120 30 M140 0 L140 34 M48 14 L152 14" stroke="#6B4A2B" stroke-width="2" opacity=".7"/>` +
      `<path d="M40 38 Q100 26 160 38 Q170 48 160 50 Q100 40 40 50 Q30 48 40 38Z" fill="#8B6640" ${S}/><path d="M92 -8 Q100 -20 108 -8" fill="none" ${S}/>` +
      `<path d="M114 112 Q132 122 146 116" fill="none" stroke="#5C3D27" stroke-width="5" stroke-linecap="round"/><path d="M144 100 L162 100 L160 124 Q153 130 146 124Z" fill="#7F5539" ${S}/><path d="M152 94 q-6 -10 0 -18 q6 -8 0 -16" fill="none" stroke="#CED4DA" stroke-width="3" stroke-linecap="round" opacity=".85"/>` },
  { id: 'wizard', name: 'Волшебник', pool: 'regular',
    back: cape('#4A2F86', '#6A4BBE') + star(30, 200, 8) + star(172, 186, 7) + star(150, 224, 6),
    hat: `<path d="M50 38 L96 -86 Q112 -96 118 -78 L104 -70 L150 38Z" fill="#5B3E9B" ${S}/><ellipse cx="100" cy="38" rx="68" ry="12" fill="#4A2F86" ${S}/>` + star(88, -6, 9) + star(118, 16, 7) + star(98, -46, 6) + capeClasp() },
  { id: 'cowboy', name: 'Ковбой', pool: 'regular',
    hat: `<path d="M58 30 Q58 -10 80 -8 Q100 4 120 -8 Q142 -10 142 30Z" fill="#A0522D" ${S}/><path d="M60 22 Q100 34 140 22 L141 30 Q100 42 59 30Z" fill="#5C3317"/>` +
      `<path d="M10 28 Q24 46 100 44 Q176 46 190 28 Q196 42 176 50 Q100 62 24 50 Q4 42 10 28Z" fill="#8B4513" ${S}/>` + neckerchief('#C1121F', '#FFFFFF') },
  { id: 'knight', name: 'Рыцарь', pool: 'regular',
    back: cape('#9B2226', '#BC3F3F'),
    hat: `<path d="M30 70 Q26 -6 100 -10 Q174 -6 170 70 L156 66 Q154 16 100 12 Q46 16 44 66Z" fill="#ADB5BD" ${S}/><path d="M48 30 Q100 14 152 30" fill="none" stroke="#6C757D" stroke-width="3"/>` +
      `<circle cx="56" cy="40" r="3" fill="#6C757D"/><circle cx="144" cy="40" r="3" fill="#6C757D"/><path d="M100 -10 Q118 -64 162 -58 Q134 -46 116 -4Z" fill="#E63946" ${S}/><path d="M108 -20 Q126 -48 150 -52" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".6"/>` + capeClasp('#ADB5BD') },
  { id: 'king', name: 'Король', pool: 'regular',
    back: cape('#9B2226', '#7B1A1E'),
    hat: `<path d="M56 32 L54 -8 L76 14 L100 -20 L124 14 L146 -8 L144 32 Q100 40 56 32Z" fill="#F4C430" ${S}/><circle cx="100" cy="18" r="6" fill="#E63946" ${s2}/><circle cx="74" cy="22" r="4.5" fill="#3A86FF" ${s2}/><circle cx="126" cy="22" r="4.5" fill="#2A9D8F" ${s2}/>` +
      `<circle cx="54" cy="-10" r="4" fill="#FFF3B0" ${s2}/><circle cx="100" cy="-22" r="4" fill="#FFF3B0" ${s2}/><circle cx="146" cy="-10" r="4" fill="#FFF3B0" ${s2}/>` +
      `<path d="M26 116 Q100 140 174 116 L178 134 Q100 160 22 134Z" fill="#FFFFFF" ${S}/><g fill="#141414"><path d="M48 128 l3 7 l3 -7z"/><path d="M78 136 l3 7 l3 -7z"/><path d="M116 136 l3 7 l3 -7z"/><path d="M146 128 l3 7 l3 -7z"/></g>` },
  { id: 'scientist', name: 'Учёный', pool: 'regular',
    hat: `<path d="M34 30 Q100 14 166 30" fill="none" stroke="#343A40" stroke-width="6"/><g ${S}><circle cx="76" cy="22" r="16" fill="#F4A261"/><circle cx="124" cy="22" r="16" fill="#F4A261"/></g><circle cx="72" cy="18" r="4" fill="#FFF" opacity=".7"/><circle cx="120" cy="18" r="4" fill="#FFF" opacity=".7"/>` +
      `<path d="M42 118 L82 126 L76 224 L52 216 Q34 170 42 118Z" fill="#FFFFFF" ${S}/><path d="M158 118 L118 126 L124 224 L148 216 Q166 170 158 118Z" fill="#FFFFFF" ${S}/>` +
      `<rect x="54" y="150" width="20" height="24" rx="2" fill="#E9ECEF" ${s2}/><path d="M58 150 L58 140 M64 150 L64 142 M70 150 L70 138" stroke-width="3" stroke-linecap="round" stroke="#3A86FF"/><circle cx="64" cy="142" r="2" fill="#E63946"/>` },
  { id: 'artist', name: 'Художник', pool: 'regular',
    hat: `<path d="M38 32 Q56 -14 118 -12 Q170 -6 164 24 Q100 42 38 32Z" fill="#C1121F" ${S}/><path d="M98 -12 L102 -24" stroke="${L}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M150 18 L182 -18" stroke="#8B5E3C" stroke-width="6" stroke-linecap="round"/><path d="M180 -16 L190 -28 Q194 -22 186 -12Z" fill="#3A86FF" ${s2}/>` + scarf('#F4A261', '#2A9D8F') },
  { id: 'hacker', name: 'Хакер', pool: 'regular',
    back: `<path d="M12 124 Q-4 12 100 -18 Q204 12 188 124 Q150 104 100 104 Q50 104 12 124Z" fill="#2B2D42" ${S}/><path d="M20 112 Q14 30 100 2 Q186 30 180 112" fill="none" stroke="#3D405B" stroke-width="10"/>`,
    hat: shades('#111318', '#0B0B0F') + `<path d="M80 120 Q78 140 82 166 M120 120 Q122 140 118 166" fill="none" stroke="#ADB5BD" stroke-width="3"/><rect x="78" y="164" width="7" height="10" rx="2" fill="#DEE2E6"/><rect x="115" y="164" width="7" height="10" rx="2" fill="#DEE2E6"/>` },
  { id: 'ninja', name: 'Ниндзя', pool: 'regular',
    hat: `<g transform="translate(0 -9)"><path d="M34 34 Q100 12 166 34 L166 50 Q100 28 34 50Z" fill="#1D1D1D" ${S}/><rect x="84" y="24" width="32" height="20" rx="4" fill="#ADB5BD" ${s2}/><path d="M92 34 Q100 28 108 34 Q100 40 92 34" fill="none" stroke="#495057" stroke-width="2"/>` +
      `<path d="M164 40 Q190 30 214 12 Q200 34 168 48Z M166 46 Q196 50 222 40 Q200 60 166 52Z" fill="#1D1D1D" ${S}/></g>` },
  { id: 'firefighter', name: 'Пожарный', pool: 'regular',
    hat: `<path d="M40 40 Q40 -8 100 -10 Q160 -8 160 40Z" fill="#D00000" ${S}/><path d="M100 -10 L100 36" stroke="#9D0208" stroke-width="5"/><path d="M24 40 Q100 30 176 40 Q190 54 172 52 Q100 42 28 52 Q10 54 24 40Z" fill="#B00000" ${S}/>` +
      `<path d="M84 2 L116 2 L114 22 Q100 32 86 22Z" fill="#F4C430" ${S}/>` + star(100, 12, 6, '#FFF3B0', false) },
  { id: 'sre', name: 'Дежурный SRE', pool: 'regular',
    hat: `<path d="M30 64 Q30 2 100 2 Q170 2 170 64" stroke="#212529" stroke-width="8" fill="none"/><rect x="18" y="48" width="22" height="36" rx="8" fill="#343A40" ${s2}/><rect x="160" y="48" width="22" height="36" rx="8" fill="#343A40" ${s2}/>` +
      `<path d="M30 82 Q36 122 76 120" stroke="#212529" stroke-width="4.5" fill="none"/><circle cx="78" cy="120" r="6" fill="#39D98A" ${s2}/>` +
      `<rect x="128" y="168" width="34" height="24" rx="5" fill="#343A40" ${s2}/><rect x="133" y="173" width="24" height="10" rx="2" fill="#9ED96B"/>` },
  { id: 'builder', name: 'Строитель', pool: 'regular',
    hat: `<path d="M44 112 L74 118 L78 204 L50 198 Q40 160 44 112Z" fill="#FF7A00" ${s2}/><path d="M156 112 L126 118 L122 204 L150 198 Q160 160 156 112Z" fill="#FF7A00" ${s2}/><path d="M46 156 L76 160 M47 176 L77 180 M154 156 L124 160 M153 176 L123 180" stroke="#EDEDED" stroke-width="6"/>` +
      `<path d="M46 38 Q46 -2 100 -2 Q154 -2 154 38Z" fill="#FFC300" ${S}/><path d="M100 -2 V36 M76 4 Q70 18 70 36 M124 4 Q130 18 130 36" stroke="#E0A800" stroke-width="4" fill="none"/><ellipse cx="100" cy="38" rx="64" ry="9" fill="#FFB000" ${S}/>` },
  { id: 'postman', name: 'Почтальон', pool: 'regular',
    back: `<rect x="2" y="160" width="52" height="42" rx="6" fill="#A0522D" ${S}/><path d="M2 166 L28 186 L54 166" fill="#8B4513" ${s2}/>`,
    hat: `<path d="M152 108 Q100 140 34 172" stroke="#8D5524" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M152 108 Q100 140 34 172" stroke="#B07A45" stroke-width="3" fill="none" stroke-dasharray="6 7"/>` +
      `<path d="M48 36 Q50 -2 100 -4 Q150 -2 152 36Z" fill="#1D3557" ${S}/><path d="M46 32 Q100 22 154 32 L154 40 Q100 30 46 40Z" fill="#14213D" ${s2}/><path d="M58 38 Q100 58 142 38 Q100 46 58 38Z" fill="#0B132B" ${s2}/>` +
      `<rect x="89" y="8" width="22" height="15" rx="2" fill="#FFD166" ${s2}/><path d="M89 8 L100 17 L111 8" fill="none" stroke="${L}" stroke-width="1.4"/>` },
  { id: 'climber', name: 'Альпинист', pool: 'regular',
    hat: scarf('#457B9D', '#F1FAEE') + `<path d="M50 36 Q52 -4 100 -4 Q148 -4 150 36Z" fill="#D62828" ${S}/><path d="M70 0 L66 34 M85 -3 L84 34 M100 -4 V34 M115 -3 L116 34 M130 0 L134 34" stroke="#A4161A" stroke-width="2"/>` +
      `<path d="M45 30 Q100 18 155 30 L155 44 Q100 32 45 44Z" fill="#F1FAEE" ${S}/><circle cx="100" cy="-12" r="14" fill="#F1FAEE" ${S}/>` },
  { id: 'magician', name: 'Фокусник', pool: 'regular',
    back: cape('#1D1D1D', '#9B2226'),
    hat: `<path d="M62 30 L66 -62 L134 -62 L138 30Z" fill="#1D1D1D" ${S}/><path d="M64 8 L136 8 L137 22 L63 22Z" fill="#9B2226"/><ellipse cx="100" cy="-62" rx="34" ry="7" fill="#343A40" ${S}/><ellipse cx="100" cy="32" rx="62" ry="10" fill="#1D1D1D" ${S}/>` +
      bowTie('#9B2226') + star(150, -40, 7, '#FFF3B0', false) + star(40, -20, 5, '#FFF3B0', false) },
  { id: 'rockstar', name: 'Рок-звезда', pool: 'regular',
    hat: `<path d="M38 36 Q100 6 162 36 L160 48 Q100 22 40 48Z" fill="#E63946" ${S}/><g fill="#FFFFFF"><circle cx="70" cy="30" r="3"/><circle cx="100" cy="24" r="3"/><circle cx="130" cy="30" r="3"/></g><path d="M40 44 Q20 40 14 54 Q28 58 42 48Z M40 44 Q24 60 30 72 Q40 60 44 50Z" fill="#E63946" ${S}/>` +
      star(66, 72, 36, '#FF5CA8') + star(134, 72, 36, '#FF5CA8') + `<path d="M98 66 Q100 62 102 66" stroke="${L}" stroke-width="4" fill="none"/>` + star(66, 72, 22, '#2B1B3D', false) + star(134, 72, 22, '#2B1B3D', false) },
  { id: 'dj', name: 'Диджей', pool: 'regular',
    back: `<path d="M44 34 Q14 26 -8 42 Q20 50 48 42Z" fill="#2A9D8F" ${S}/>`,
    hat: `<path d="M44 40 Q46 -6 100 -8 Q154 -6 156 40 Q100 28 44 40Z" fill="#2A9D8F" ${S}/><circle cx="100" cy="-6" r="5" fill="#264653"/>` +
      `<path d="M24 76 Q20 -14 100 -16 Q180 -14 176 76" stroke="#212529" stroke-width="10" fill="none"/><g ${S}><ellipse cx="26" cy="74" rx="18" ry="26" fill="#FF5CA8"/><ellipse cx="174" cy="74" rx="18" ry="26" fill="#FF5CA8"/></g><ellipse cx="26" cy="74" rx="9" ry="14" fill="#C2185B"/><ellipse cx="174" cy="74" rx="9" ry="14" fill="#C2185B"/>` },
  { id: 'graduate', name: 'Выпускник', pool: 'regular',
    hat: `<path d="M60 18 L60 38 Q100 48 140 38 L140 18Z" fill="#1D1D1D" ${S}/><path d="M24 8 L100 -20 L176 8 L100 32Z" fill="#212529" ${S}/><circle cx="100" cy="6" r="4" fill="#F4C430"/>` +
      `<path d="M100 6 L158 16 L160 52" fill="none" stroke="#F4C430" stroke-width="3"/><path d="M154 50 L166 50 L164 70 L156 70Z" fill="#F4C430" ${s2}/>` },
  { id: 'gentleman', name: 'Джентльмен', pool: 'regular',
    hat: `<path d="M54 32 Q52 -16 100 -16 Q148 -16 146 32Z" fill="#343A40" ${S}/><path d="M56 22 Q100 30 144 22 L145 30 Q100 38 55 30Z" fill="#1D1D1D"/><path d="M34 34 Q100 22 166 34 Q170 44 158 44 Q100 34 42 44 Q30 44 34 34Z" fill="#343A40" ${S}/>` +
      `<circle cx="133" cy="72" r="30" fill="#FFFFFF" fill-opacity=".12" stroke="#C9A227" stroke-width="5"/><path d="M160 86 Q176 120 160 150" fill="none" stroke="#C9A227" stroke-width="2.5"/>` +
      `<path d="M100 100 Q84 90 64 104 Q72 112 84 108 Q94 106 100 110 Q106 106 116 108 Q128 112 136 104 Q116 90 100 100Z" fill="#4A3423" ${s2}/>` + bowTie('#5C2A36') },
  { id: 'viking', name: 'Викинг', pool: 'regular',
    hat: `<path d="M46 26 Q10 12 12 -36 Q30 -2 56 6Z" fill="#F1E3C8" ${S}/><path d="M154 26 Q190 12 188 -36 Q170 -2 144 6Z" fill="#F1E3C8" ${S}/>` +
      `<path d="M40 40 Q40 -6 100 -8 Q160 -6 160 40Z" fill="#8D99AE" ${S}/><path d="M42 30 Q100 18 158 30 L158 42 Q100 30 42 42Z" fill="#6C757D" ${s2}/><g fill="#DEE2E6"><circle cx="58" cy="35" r="2.6"/><circle cx="80" cy="31" r="2.6"/><circle cx="100" cy="30" r="2.6"/><circle cx="120" cy="31" r="2.6"/><circle cx="142" cy="35" r="2.6"/></g>` +
      `<path d="M64 120 Q100 134 136 120 Q146 150 130 172 L122 200 L112 178 L100 206 L88 178 L78 200 L70 172 Q54 150 64 120Z" fill="#E07A1F" ${S}/>` +
      `<path d="M78 136 Q82 150 78 164 M92 140 Q96 156 92 172 M108 140 Q104 156 108 172 M122 136 Q118 150 122 164" fill="none" stroke="#B85C12" stroke-width="2.5" stroke-linecap="round"/>` +
      `<circle cx="78" cy="199" r="5" fill="#F4C430" ${s2}/><circle cx="122" cy="199" r="5" fill="#F4C430" ${s2}/>` },
  { id: 'captain', name: 'Капитан', pool: 'regular',
    hat: `<path d="M38 116 L100 152 L162 116 L170 138 L100 176 L30 138Z" fill="#1D3557" ${S}/><path d="M42 124 L100 158 L158 124 M46 132 L100 164 L154 132" stroke="#FFFFFF" stroke-width="3" fill="none"/>` + neckerchief('#E63946') +
      `<path d="M44 30 Q46 -6 100 -8 Q154 -6 156 30Z" fill="#FFFFFF" ${S}/><path d="M46 24 Q100 34 154 24 L155 34 Q100 44 45 34Z" fill="#1D1D1D"/><path d="M58 36 Q100 56 142 36 Q100 44 58 36Z" fill="#141414" ${s2}/>` +
      `<g stroke="#F4C430" stroke-width="3" fill="none" stroke-linecap="round"><path d="M100 0 V18 M92 6 H108 M90 14 Q100 24 110 14"/></g>` },
  { id: 'pilot', name: 'Лётчик', pool: 'regular',
    hat: `<path d="M48 40 Q50 -6 100 -8 Q150 -6 152 40Z" fill="#8B5E3C" ${S}/><path d="M34 34 Q22 70 30 92 L42 90 Q36 62 44 36Z M166 34 Q178 70 170 92 L158 90 Q164 62 156 36Z" fill="#8B5E3C" ${S}/>` +
      `<path d="M50 18 Q100 8 150 18" stroke="#3A2A22" stroke-width="6" fill="none"/><circle cx="80" cy="14" r="15" fill="#A8DADC" stroke="#3A2A22" stroke-width="4"/><circle cx="120" cy="14" r="15" fill="#A8DADC" stroke="#3A2A22" stroke-width="4"/>` +
      `<path d="M38 120 Q100 142 162 120 L164 134 Q100 158 36 134Z" fill="#FFFFFF" ${S}/><path d="M150 132 Q190 140 222 124 Q196 152 156 146Z" fill="#FFFFFF" ${S}/>` },
  { id: 'diver', name: 'Дайвер', pool: 'regular',
    hat: `<path d="M28 60 Q100 30 172 60" fill="none" stroke="#264653" stroke-width="8"/><rect x="30" y="40" width="140" height="66" rx="30" fill="#9DE0F5" fill-opacity=".35" stroke="#F4A261" stroke-width="8"/><rect x="30" y="40" width="140" height="66" rx="30" fill="none" stroke="${L}" stroke-width="2"/>` +
      `<path d="M44 52 Q60 46 72 50" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/><path d="M168 74 L182 74 L186 -16" fill="none" stroke="#FFD166" stroke-width="9" stroke-linecap="round"/><path d="M168 74 L182 74 L186 -16" fill="none" stroke="${L}" stroke-width="2"/><rect x="178" y="-26" width="16" height="14" rx="4" fill="#E63946" ${s2}/>` },
  { id: 'gardener', name: 'Садовник', pool: 'regular',
    hat: neckerchief('#52B788') + `<path d="M60 26 Q62 -8 100 -10 Q138 -8 140 26Z" fill="#E9C46A" ${S}/><path d="M62 18 Q100 28 138 18 L139 26 Q100 36 61 26Z" fill="#E63946"/>` +
      `<path d="M8 34 Q100 10 192 34 Q100 58 8 34Z" fill="#E9C46A" ${S}/><path d="M30 34 Q100 22 170 34 M50 40 Q100 32 150 40" fill="none" stroke="#C9A227" stroke-width="2"/>` + flower(126, 18, 7, '#FFFFFF', '#FFD166') },
  { id: 'superhero', name: 'Супергерой', pool: 'regular',
    back: cape('#D00000', '#9D0208'),
    hat: `<path fill-rule="evenodd" d="M24 70 Q30 46 66 46 Q90 46 100 58 Q110 46 134 46 Q170 46 176 70 Q170 96 134 98 Q110 98 100 86 Q90 98 66 98 Q30 96 24 70Z M66 54 A18 18 0 1 0 66.1 54Z M134 54 A18 18 0 1 0 134.1 54Z" fill="#1D3557" ${S}/>` +
      `<path d="M24 70 L6 62 L10 76Z M176 70 L194 62 L190 76Z" fill="#1D3557" ${s2}/>` + capeClasp('#F4C430') +
      `<path d="M100 146 L124 166 L100 192 L76 166Z" fill="#F4C430" ${S}/><path d="M104 152 L92 168 L102 168 L96 184 L110 164 L100 164Z" fill="#D00000"/>` },
  { id: 'unicorn', name: 'Единорог', pool: 'regular',
    back: `<g ${S}><circle cx="34" cy="22" r="16" fill="#FF8FA3"/><circle cx="22" cy="46" r="16" fill="#FFD166"/><circle cx="18" cy="72" r="15" fill="#90BE6D"/><circle cx="22" cy="96" r="14" fill="#4CC9F0"/><circle cx="30" cy="118" r="13" fill="#B794F4"/></g>`,
    hat: `<path d="M86 22 L100 -64 L114 22 Q100 30 86 22Z" fill="#FFE29A" ${S}/><path d="M90 0 L110 -8 M92 -18 L108 -26 M95 -38 L105 -44" stroke="#F4A261" stroke-width="3"/>` + flower(66, 16, 6, '#FF8FA3', '#FFFFFF') + flower(134, 16, 6, '#B794F4', '#FFFFFF') },
  { id: 'robot', name: 'Робот', pool: 'regular',
    hat: `<path d="M100 16 L100 -24" stroke="#6C757D" stroke-width="4"/><circle cx="100" cy="-30" r="9" fill="#E63946" ${s2}/><path d="M86 -34 q-8 4 -6 12 M114 -34 q8 4 6 12" fill="none" stroke="#FFD166" stroke-width="3" stroke-linecap="round"/>` +
      `<g ${s2}><path d="M34 26 L48 26 L55 36 L48 46 L34 46 L27 36Z" fill="#ADB5BD"/><path d="M152 26 L166 26 L173 36 L166 46 L152 46 L145 36Z" fill="#ADB5BD"/></g><circle cx="41" cy="36" r="3" fill="#495057"/><circle cx="159" cy="36" r="3" fill="#495057"/>` +
      `<rect x="78" y="168" width="44" height="34" rx="6" fill="#CED4DA" ${S}/><circle cx="90" cy="180" r="4" fill="#39D98A"/><circle cx="100" cy="180" r="4" fill="#FFD166"/><circle cx="110" cy="180" r="4" fill="#E63946"/><path d="M86 192 H114" stroke="#495057" stroke-width="3"/>` },
  { id: 'athlete', name: 'Спортсмен', pool: 'regular',
    hat: `<path d="M34 30 Q100 12 166 30 L166 44 Q100 26 34 44Z" fill="#FFFFFF" ${S}/><path d="M36 36 Q100 18 164 36" fill="none" stroke="#E63946" stroke-width="4"/>` + medal() },
  { id: 'cat', name: 'Котик', pool: 'regular',
    hat: `<path d="M44 30 Q100 6 156 30" fill="none" stroke="#343A40" stroke-width="7"/><path d="M52 26 L60 -18 L86 14Z" fill="#343A40" ${S}/><path d="M60 18 L62 -4 L76 14Z" fill="#FFAFCC"/><path d="M148 26 L140 -18 L114 14Z" fill="#343A40" ${S}/><path d="M140 18 L138 -4 L124 14Z" fill="#FFAFCC"/>` +
      `<g stroke="${L}" stroke-width="2.4" stroke-linecap="round"><path d="M80 110 L44 104 M80 116 L42 118 M82 122 L46 132 M120 110 L156 104 M120 116 L158 118 M118 122 L154 132"/></g>` },
  { id: 'angel', name: 'Ангел без багов', pool: 'regular',
    back: wings('#FFFFFF', '#D9E2EC'),
    hat: `<ellipse cx="100" cy="-14" rx="40" ry="10" fill="none" stroke="#FFE08A" stroke-width="12" opacity=".5"/><ellipse cx="100" cy="-14" rx="40" ry="10" fill="none" stroke="#F4C430" stroke-width="6"/><ellipse cx="100" cy="-14" rx="40" ry="10" fill="none" stroke="${L}" stroke-width="1.5"/>` },
  { id: 'beach', name: 'Отпускник', pool: 'summer',
    hat: shades('#264653', '#141414') + `<path d="M40 30 Q100 6 160 30 Q100 22 40 30Z" fill="none"/>` +
      Array.from({ length: 11 }, (_, i) => { const t = i / 10, x = 40 + t * 120, y = 120 + Math.sin(t * Math.PI) * 34; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${['#FF5CA8', '#FFD166', '#F4A261', '#FF8FA3', '#B794F4'][i % 5]}" ${s2}/>`; }).join('') +
      `<path d="M48 30 Q52 -4 100 -6 Q148 -4 152 30Z" fill="#F1E3C8" ${S}/><path d="M22 34 Q100 18 178 34 Q100 52 22 34Z" fill="#F1E3C8" ${S}/><path d="M50 22 Q100 32 150 22" stroke="#2A9D8F" stroke-width="6" fill="none"/>` },
  // ---------- Новый год: 10 декабря – 7 января ----------
  { id: 'ny-santa', name: 'Дед Мороз', pool: 'ny',
    hat: `<path d="M48 36 Q60 -20 120 -34 Q150 -36 168 -6 L150 36Z" fill="#D62828" ${S}/><path d="M44 30 Q100 16 156 30 L156 46 Q100 32 44 46Z" fill="#FFFFFF" ${S}/><circle cx="170" cy="-6" r="13" fill="#FFFFFF" ${S}/>` +
      fluffy([[68, 126, 13], [82, 140, 15], [100, 146, 17], [118, 140, 15], [132, 126, 13], [76, 160, 14], [100, 168, 16], [124, 160, 14], [90, 184, 12], [110, 184, 12], [100, 196, 10]]) +
      fluffy([[80, 110, 9], [90, 114, 8], [120, 110, 9], [110, 114, 8]]) },
  { id: 'ny-snowman', name: 'Снеговик', pool: 'ny',
    hat: scarf('#E63946', '#FFFFFF') + `<path d="M64 30 L72 -26 L128 -26 L136 30Z" fill="#6C8EAD" ${S}/><ellipse cx="100" cy="-26" rx="28" ry="6" fill="#4F6D8A" ${S}/><path d="M66 18 L134 18" stroke="#4F6D8A" stroke-width="5"/>` +
      `<path d="M104 92 L150 100 L104 104Z" fill="#F77F00" ${S}/><path d="M118 96 l4 4 M132 99 l3 3" stroke="#C45500" stroke-width="2"/>` },
  { id: 'ny-tree', name: 'Ёлочка', pool: 'ny',
    hat: `<path d="M50 36 L100 -6 L150 36Z" fill="#2D6A4F" ${S}/><path d="M60 8 L100 -40 L140 8Z" fill="#40916C" ${S}/><path d="M70 -22 L100 -70 L130 -22Z" fill="#52B788" ${S}/>` +
      `<path d="M58 30 Q100 18 142 30 M70 2 Q100 -8 130 2 M78 -26 Q100 -34 122 -26" fill="none" stroke="#FFD166" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>` +
      `<g ${s2}><circle cx="76" cy="26" r="5" fill="#E63946"/><circle cx="122" cy="22" r="5" fill="#4CC9F0"/><circle cx="96" cy="-2" r="5" fill="#FFD166"/><circle cx="116" cy="-34" r="4" fill="#FF5CA8"/></g>` + star(100, -76, 13) },
  { id: 'ny-deer', name: 'Северный олень', pool: 'ny',
    hat: `<g fill="none" stroke="#7F5539" stroke-width="7" stroke-linecap="round"><path d="M70 20 Q58 -10 40 -30 M58 -4 Q40 -6 30 -2 M48 -18 Q50 -36 46 -48"/><path d="M130 20 Q142 -10 160 -30 M142 -4 Q160 -6 170 -2 M152 -18 Q150 -36 154 -48"/></g>` +
      `<circle cx="100" cy="95" r="12" fill="#E63946" ${S}/><circle cx="96" cy="91" r="3.5" fill="#FFFFFF" opacity=".75"/>` +
      `<path d="M38 120 Q100 144 162 120 L164 134 Q100 160 36 134Z" fill="#9B2226" ${S}/><circle cx="100" cy="158" r="11" fill="#F4C430" ${S}/><path d="M94 160 H106" stroke="${L}" stroke-width="2.4"/>` },
  { id: 'ny-elf', name: 'Эльф', pool: 'ny',
    hat: `<path d="M48 36 Q70 -30 140 -46 Q186 -50 196 -16 Q170 -32 150 -18 L152 36Z" fill="#2D6A4F" ${S}/><path d="M44 28 Q100 14 156 28 L156 42 Q100 28 44 42Z" fill="#D62828" ${S}/><circle cx="196" cy="-12" r="9" fill="#F4C430" ${S}/>` +
      collar('#2D6A4F', '#D62828', '#F4C430') },
  // ---------- Хэллоуин: 24–31 октября ----------
  { id: 'hw-pumpkin', name: 'Тыква', pool: 'halloween',
    hat: `<path d="M40 30 Q30 -40 100 -44 Q170 -40 160 30 Q100 44 40 30Z" fill="#F77F00" ${S}/><path d="M72 -40 Q64 0 72 34 M100 -44 V38 M128 -40 Q136 0 128 34" fill="none" stroke="#C45500" stroke-width="3"/>` +
      `<path d="M96 -44 Q94 -60 106 -64" fill="none" stroke="#386641" stroke-width="7" stroke-linecap="round"/><path d="M106 -54 Q124 -66 132 -50 Q118 -48 106 -54Z" fill="#52B788" ${s2}/>` +
      `<path d="M62 -8 L76 -24 L84 -6Z M138 -8 L124 -24 L116 -6Z" fill="#FFD166" ${s2}/><path d="M66 10 Q100 28 134 10 L124 12 L118 4 L110 14 L100 6 L90 14 L82 4 L76 12Z" fill="#FFD166" ${s2}/>` },
  { id: 'hw-witch', name: 'Ведьма', pool: 'halloween',
    back: cape('#3C096C', '#5A189A'),
    hat: `<path d="M56 34 L92 -70 Q102 -90 128 -84 Q110 -76 108 -62 L144 34Z" fill="#1D1D1D" ${S}/><path d="M60 22 Q100 32 140 22 L142 32 Q100 42 58 32Z" fill="#7B2CBF"/><rect x="90" y="20" width="20" height="16" rx="2" fill="none" stroke="#F4C430" stroke-width="3"/>` +
      `<ellipse cx="100" cy="36" rx="72" ry="12" fill="#1D1D1D" ${S}/>` + capeClasp('#7B2CBF') },
  { id: 'hw-vampire', name: 'Вампир', pool: 'halloween',
    back: `<path d="M24 120 L-2 6 L58 104Z" fill="#9D0208" ${S}/><path d="M176 120 L202 6 L142 104Z" fill="#9D0208" ${S}/>` + cape('#1D1D1D', '#9D0208'),
    hat: `<path d="M86 112 L90 128 L94 112Z M106 112 L110 128 L114 112Z" fill="#FFFFFF" ${S}/>` + capeClasp('#E63946') + `<path d="M76 18 Q100 4 124 18 L100 34Z" fill="#141414" opacity=".85"/>` },
  // ---------- праздники в один день ----------
  { id: 'valentine', name: 'Купидон', pool: 'feb14',
    back: wings('#FFE5EC', '#FFAFCC'),
    hat: `<path d="M44 30 Q100 6 156 30" fill="none" stroke="#FF5CA8" stroke-width="6"/><path d="M78 16 Q72 -6 64 -22 M122 16 Q128 -6 136 -22" fill="none" stroke="#FF5CA8" stroke-width="3"/>` + heart(62, -24, 0.9) + heart(138, -24, 0.9) +
      `<ellipse cx="52" cy="104" rx="12" ry="7" fill="#FF8FA3" opacity=".7"/><ellipse cx="148" cy="104" rx="12" ry="7" fill="#FF8FA3" opacity=".7"/>` },
  { id: 'feb23', name: 'Защитник', pool: 'feb23',
    hat: `<path d="M40 34 Q44 2 100 -2 Q156 2 160 34 Q100 20 40 34Z" fill="#6B705C" ${S}/><path d="M100 -2 Q104 18 100 26" stroke="#4A4E3C" stroke-width="3" fill="none"/>` + star(70, 18, 9, '#D62828') + medal() },
  { id: 'march8', name: 'Весна', pool: 'mar8',
    hat: `<path d="M38 30 Q100 6 162 30" fill="none" stroke="#52B788" stroke-width="6"/>` +
      [[44, 30, '#FF8FA3'], [62, 18, '#FFD166'], [82, 10, '#B794F4'], [100, 8, '#FFFFFF'], [118, 10, '#FF5CA8'], [138, 18, '#FFD166'], [156, 30, '#FF8FA3']].map(([x, y, c]) => flower(x, y, 6, c, '#F4A261')).join('') +
      `<path d="M54 28 q-10 -10 -18 -4 q8 8 18 4Z M146 28 q10 -10 18 -4 q-8 8 -18 4Z" fill="#52B788" ${s2}/>` },
  { id: 'april1', name: 'Шут', pool: 'apr1',
    hat: `<path d="M46 36 Q30 -20 -6 -16 Q30 -6 58 10Z" fill="#E63946" ${S}/><path d="M154 36 Q170 -20 206 -16 Q170 -6 142 10Z" fill="#3A86FF" ${S}/><path d="M64 34 Q76 -40 100 -58 Q124 -40 136 34Z" fill="#FFD166" ${S}/>` +
      `<path d="M44 30 Q100 16 156 30 L156 44 Q100 30 44 44Z" fill="#2A9D8F" ${S}/><g ${s2}><circle cx="-6" cy="-16" r="8" fill="#F4C430"/><circle cx="206" cy="-16" r="8" fill="#F4C430"/><circle cx="100" cy="-60" r="8" fill="#F4C430"/></g>` +
      collar('#7B2CBF', '#FFFFFF', '#FFD166') },
  { id: 'astro-day', name: 'Космонавт', pool: 'apr12', same: 'astronaut' },
  { id: 'sept1', name: 'Первоклашка', pool: 'sep1',
    back: `<g ${S}><rect x="18" y="104" width="30" height="86" rx="12" fill="#E76F51"/><rect x="152" y="104" width="30" height="86" rx="12" fill="#E76F51"/></g>`,
    hat: `<path d="M50 38 Q52 -2 100 -2 Q148 -2 150 38 Z" fill="#E63946" ${S}/><path d="M100 -2 Q84 10 82 37 L118 37 Q116 10 100 -2Z" fill="#FFD166" ${s2}/><path d="M47 33 Q100 20 153 33 L153 42 Q100 29 47 42Z" fill="#457B9D" ${S}/>` +
      `<path d="M100 -2 V-16" stroke="${L}" stroke-width="3"/><ellipse cx="82" cy="-18" rx="18" ry="5" fill="#2A9D8F" ${s2} transform="rotate(-8 82 -18)"/><ellipse cx="118" cy="-18" rx="18" ry="5" fill="#F4A261" ${s2} transform="rotate(8 118 -18)"/><circle cx="100" cy="-17" r="3.5" fill="${L}"/>` },
  { id: 'progday', name: 'День программиста', pool: 'progday',
    back: cape('#3A0CA3', '#4361EE') + `<path d="M40 150 H70 V180 H100 M160 150 H130 V200" fill="none" stroke="#4CC9F0" stroke-width="3" opacity=".7"/><circle cx="100" cy="180" r="4" fill="#4CC9F0"/><circle cx="130" cy="200" r="4" fill="#4CC9F0"/>`,
    hat: `<path d="M50 32 L50 -6 L74 12 L100 -16 L126 12 L150 -6 L150 32 Q100 40 50 32Z" fill="#F4C430" ${S}/><text x="100" y="26" text-anchor="middle" font-size="24" font-weight="900" fill="#3A0CA3" font-family="Cascadia Code, Consolas, monospace">{ }</text>` + capeClasp('#4CC9F0') },
  { id: 'goday', name: 'День рождения Go', pool: 'goday',
    hat: partyHat('#00ADD8', '#FFFFFF', '#FFD166') + bowTie('#00ADD8') +
      [[24, 10, '#FF5CA8'], [178, 0, '#FFD166'], [16, 60, '#90BE6D'], [186, 54, '#B794F4'], [170, -40, '#00ADD8'], [30, -34, '#F4A261']].map(([x, y, c], i) => `<rect x="${x}" y="${y}" width="10" height="5" fill="${c}" transform="rotate(${i * 37} ${x} ${y})"/>`).join('') },
  { id: 'birthday', name: 'Именинник', pool: 'bday',
    // шары — прямо за головой (не шире ушей): на карточках рядом с гофером текст
    back: `<path d="M44 -2 Q40 40 50 80 M156 -2 Q160 40 150 80" fill="none" stroke="#6C757D" stroke-width="2"/>` +
      `<g ${S}><ellipse cx="40" cy="-26" rx="20" ry="25" fill="#FF5CA8"/><ellipse cx="160" cy="-26" rx="20" ry="25" fill="#FFD166"/></g>` +
      `<g fill="#FFFFFF" opacity=".5"><ellipse cx="34" cy="-34" rx="5" ry="8"/><ellipse cx="154" cy="-34" rx="5" ry="8"/></g>`,
    hat: partyHat('#B794F4', '#FFD166', '#FF5CA8') + bowTie('#E63946') + star(30, 34, 7) + star(170, 30, 6, '#FF8FA3') },
];
export const OUTFIT = Object.fromEntries(OUTFITS.map((o) => [o.id, o.same ? { ...OUTFITS.find((x) => x.id === o.same), id: o.id, name: o.name, pool: o.pool } : o]));
export const OUTFIT_COUNT = OUTFITS.filter((o) => !o.same).length;

// ---------- какой наряд в какой день ----------
const md = (iso) => iso.slice(5, 10);
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
function hash(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
const shift = (iso, d) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };
function poolOf(iso) {
  const y = +iso.slice(0, 4), m = md(iso);
  if (m === '12-02') return 'bday';
  if (m >= '12-10' || m <= '01-07') return 'ny';
  if (m >= '10-24' && m <= '10-31') return 'halloween';
  const fixed = { '11-10': 'goday', '09-01': 'sep1', '04-01': 'apr1', '04-12': 'apr12', '03-08': 'mar8', '02-23': 'feb23', '02-14': 'feb14' };
  if (fixed[m]) return fixed[m];
  if (m === (leap(y) ? '09-12' : '09-13')) return 'progday'; // 256-й день года
  return m >= '06-01' && m <= '08-31' ? 'summer' : 'regular';
}
const candidates = (pool) => OUTFITS.filter((o) => (pool === 'summer' ? o.pool === 'regular' || o.pool === 'summer' : o.pool === pool));
const pickFor = (iso) => { const list = candidates(poolOf(iso)); return list[hash('outfit:' + iso) % list.length]; };
// наряд дня по дате YYYY-MM-DD; два дня подряд в одном гардеробе наряд не повторяется:
// идём от начала отрезка с тем же гардеробом (не дальше 14 дней назад) и сдвигаем совпавший с вчерашним
export function outfitFor(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return null;
  if (md(iso) === '11-25') return { ...OUTFIT.valentine, id: 'love', name: 'Влюблённый' }; // день рождения невесты
  const pool = poolOf(iso), list = candidates(pool);
  if (list.length < 2) return OUTFIT[list[0].id];
  let start = iso;
  for (let k = 0; k < 14 && poolOf(shift(start, -1)) === pool && md(shift(start, -1)) !== '11-25'; k++) start = shift(start, -1);
  let prev = null, cur = null;
  for (let day = start; ; day = shift(day, 1)) {
    cur = pickFor(day);
    if (prev && cur.id === prev.id) cur = list[(list.indexOf(cur) + 1) % list.length];
    if (day === iso) break;
    prev = cur;
  }
  return OUTFIT[cur.id];
}

// ---------- особые дни: неубираемые/особые карточки в итогах дня ----------
export const OCCASIONS = { '11-25': { id: 'bday-love', locked: true }, '12-02': { id: 'bday-me', locked: false }, '12-22': { id: 'bday-mom', locked: false } };
export const occasionFor = (iso) => OCCASIONS[md(String(iso || '0000-00-00'))] || null;
