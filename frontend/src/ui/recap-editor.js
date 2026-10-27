// Редактор своей карточки: тексты и гоферы (сколько угодно) — двигать, масштабировать, поворачивать; фон из четырёх стилей.
// Авто-режим: вводишь текст — редактор сразу раскладывает заголовок, подпись и гофера.
// Мышь: перетаскивание; угловая ручка — размер, верхняя — поворот; колесо — размер, Shift+колесо — поворот.
import { h, clear } from './dom.js';
import { POSES } from './gopher.js';
import { FORMATS, STYLES, STYLE_KEYS, drawCustom, itemBox, autoCard, rngFrom, TEXT_FONTS, TEXT_COLORS, textColor } from './recap-draw.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

export function openEditor({ card, format, acc, seed }) {
  return new Promise((resolve) => {
    const rng = rngFrom(seed || Date.now());
    let c = card ? clone(card) : { bg: STYLE_KEYS[Math.floor(rng() * STYLE_KEYS.length)], items: [] };
    let sel = c.items.length ? c.items.length - 1 : -1;
    const [W, H] = FORMATS[format];
    const cv = h('canvas', { class: 'as-editor__canvas', width: W, height: H, tabindex: '0', 'aria-label': 'Холст карточки' });
    const g = cv.getContext('2d');
    const side = h('div', { class: 'as-editor__side' });
    const root = h('div', { class: 'as-editor', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Своя карточка' },
      h('div', { class: 'as-editor__stage' }, cv), side);
    const scrim = h('div', { class: 'as-scrim as-editor__scrim' }, root);
    (document.querySelector('.as-window') || document.body).append(scrim);

    // ---------- рисование ----------
    let pending = false;
    const redraw = () => {
      if (pending) return; pending = true;
      requestAnimationFrame(async () => {
        pending = false;
        const off = document.createElement('canvas'); off.width = W; off.height = H;
        await drawCustom(off.getContext('2d'), W, H, c, acc);
        g.clearRect(0, 0, W, H); g.drawImage(off, 0, 0);
        const it = c.items[sel];
        if (it) {
          const b = boxOf(it), u = W / 1080;
          g.save(); g.translate(b.cx, b.cy); g.rotate(it.rot || 0);
          g.strokeStyle = '#0E7C93'; g.lineWidth = 3 * u; g.setLineDash([10 * u, 8 * u]);
          g.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h); g.setLineDash([]);
          g.fillStyle = '#fff'; g.strokeStyle = '#0E7C93'; g.lineWidth = 4 * u;
          g.beginPath(); g.rect(b.w / 2 - 14 * u, b.h / 2 - 14 * u, 28 * u, 28 * u); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(0, -b.h / 2); g.lineTo(0, -b.h / 2 - 50 * u); g.stroke();
          g.beginPath(); g.arc(0, -b.h / 2 - 64 * u, 15 * u, 0, Math.PI * 2); g.fill(); g.stroke();
          g.restore();
        }
      });
    };
    const boxOf = (it) => {
      const s = itemBox(g, W, H, it);
      const cy = it.type === 'gopher' ? it.y * H : it.y * H;
      return { ...s, cx: it.x * W, cy };
    };
    // точка в системе координат элемента (без поворота)
    const local = (it, x, y) => {
      const b = boxOf(it), a = -(it.rot || 0), dx = x - b.cx, dy = y - b.cy;
      return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a), b };
    };

    // ---------- мышь ----------
    const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
    let drag = null;
    cv.addEventListener('pointerdown', (e) => {
      const p = pt(e), u = W / 1080;
      const cur = c.items[sel];
      if (cur) {
        const l = local(cur, p.x, p.y);
        if (Math.abs(l.x - l.b.w / 2) < 30 * u && Math.abs(l.y - l.b.h / 2) < 30 * u) drag = { mode: 'scale', it: cur, s0: cur.size, d0: Math.hypot(l.x, l.y) };
        else if (Math.abs(l.x) < 30 * u && Math.abs(l.y + l.b.h / 2 + 64 * u) < 30 * u) drag = { mode: 'rot', it: cur };
      }
      if (!drag) {
        sel = -1;
        for (let i = c.items.length - 1; i >= 0; i--) {
          const l = local(c.items[i], p.x, p.y);
          if (Math.abs(l.x) <= l.b.w / 2 && Math.abs(l.y) <= l.b.h / 2) { sel = i; break; }
        }
        if (sel >= 0) drag = { mode: 'move', it: c.items[sel], ox: p.x - c.items[sel].x * W, oy: p.y - c.items[sel].y * H };
        panel();
      }
      if (drag) cv.setPointerCapture(e.pointerId);
      redraw();
    });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const p = pt(e), it = drag.it;
      if (drag.mode === 'move') { it.x = clamp((p.x - drag.ox) / W, -0.1, 1.1); it.y = clamp((p.y - drag.oy) / H, -0.1, 1.1); }
      if (drag.mode === 'scale') { const l = local(it, p.x, p.y); it.size = clamp(Math.round(drag.s0 * Math.hypot(l.x, l.y) / Math.max(1, drag.d0)), 16, 1600); }
      if (drag.mode === 'rot') { const b = boxOf(it); let a = Math.atan2(p.y - b.cy, p.x - b.cx) + Math.PI / 2; const snap = Math.round(a / (Math.PI / 12)) * (Math.PI / 12); if (Math.abs(a - snap) < 0.05) a = snap; it.rot = a; }
      redraw();
    });
    cv.addEventListener('pointerup', () => { if (drag) { drag = null; panel(); } });
    cv.addEventListener('wheel', (e) => {
      const it = c.items[sel]; if (!it) return;
      e.preventDefault();
      if (e.shiftKey) it.rot = (it.rot || 0) + Math.sign(e.deltaY) * 0.05;
      else it.size = clamp(Math.round(it.size * (e.deltaY < 0 ? 1.06 : 1 / 1.06)), 16, 1600);
      redraw(); panel();
    }, { passive: false });

    // ---------- клавиши ----------
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); done(null); return; }
      const inField = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if (!inField && (e.key === 'Delete' || e.key === 'Backspace') && sel >= 0) { e.preventDefault(); c.items.splice(sel, 1); sel = -1; panel(); redraw(); }
      e.stopImmediatePropagation(); // горячие клавиши приложения под редактором не срабатывают
    };
    window.addEventListener('keydown', onKey, true);
    function done(v) { window.removeEventListener('keydown', onKey, true); scrim.remove(); resolve(v); }

    // ---------- панель ----------
    const field = (label, ctl) => h('label', { class: 'as-editor__field' }, h('span', null, label), ctl);
    const range = (min, max, step, val, on) => { const r = h('input', { type: 'range', min, max, step, value: val }); r.addEventListener('input', () => { on(+r.value); redraw(); }); return r; };
    const poseSelect = (val, on) => {
      const s = h('select', { class: 'as-input' }, Object.entries(POSES).map(([k, p]) => h('option', { value: k, selected: k === val }, p.label)));
      s.addEventListener('change', () => { on(s.value); redraw(); });
      return s;
    };
    // авто-режим: карточка собирается на лету, пока печатаешь; раскладка держится, пока не нажать «Другая раскладка»
    let autoText = '', autoSeed = Math.floor(rng() * 2 ** 31);
    const autoBuild = () => { c = autoCard(autoText, rngFrom(autoSeed)); };
    function panel() {
      clear(side);
      const ta = h('textarea', { class: 'as-textarea', rows: 3, placeholder: 'Первая строка — заголовок, дальше — подпись' });
      ta.value = autoText;
      ta.addEventListener('input', () => {
        autoText = ta.value;
        if (!autoText.trim()) return;
        autoBuild();
        if (sel >= 0) { sel = -1; panel(); requestAnimationFrame(() => { const t = side.querySelector('textarea'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); }); }
        redraw();
      });
      side.append(
        h('div', { class: 'as-editor__sec' }, h('div', { class: 'as-eyebrow' }, 'Авто'), ta,
          h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: () => { if (!autoText.trim()) { ta.focus(); return; } autoSeed = Math.floor(rng() * 2 ** 31); autoBuild(); sel = -1; panel(); redraw(); } }, 'Другая раскладка')),
        h('div', { class: 'as-editor__sec' }, h('div', { class: 'as-eyebrow' }, 'Фон'),
          h('div', { class: 'as-editor__bgs' }, STYLE_KEYS.map((k) => h('button', { class: 'as-editor__bg is-' + k + (c.bg === k ? ' is-on' : ''), title: STYLES[k].label, onclick: () => { c.bg = k; panel(); redraw(); } }, STYLES[k].label)))),
        h('div', { class: 'as-editor__sec' }, h('div', { class: 'as-eyebrow' }, 'Добавить'),
          h('div', { class: 'as-rowx' },
            h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: () => { c.items.push({ type: 'text', text: 'Текст', x: 0.5, y: 0.3, size: 96, rot: 0, color: 'ink' }); sel = c.items.length - 1; panel(); redraw(); } }, '＋ Текст'),
            h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: () => { c.items.push({ type: 'gopher', pose: 'wave', x: 0.5, y: 0.62, size: 520, rot: 0, flip: false }); sel = c.items.length - 1; panel(); redraw(); } }, '＋ Гофер'))));
      const it = c.items[sel];
      if (it) {
        const sec = h('div', { class: 'as-editor__sec' }, h('div', { class: 'as-eyebrow' }, it.type === 'text' ? 'Текст' : 'Гофер'));
        if (it.type === 'text') {
          const t = h('textarea', { class: 'as-textarea', rows: 3 }); t.value = it.text;
          t.addEventListener('input', () => { it.text = t.value || ' '; redraw(); });
          // цвет: цвета стиля (основной, акцент, приглушённый), палитра и свой
          const S = STYLES[c.bg] || STYLES.night;
          const sw = (k) => h('button', {
            class: 'as-editor__sw' + ((it.color || 'ink') === k ? ' is-on' : ''), style: { background: textColor({ color: k }, S, acc) },
            title: { ink: 'Основной цвет стиля', accent: 'Акцентный цвет', muted: 'Приглушённый' }[k] || k, 'aria-label': 'Цвет ' + k,
            onclick: () => { it.color = k; panel(); redraw(); },
          });
          const own = h('input', { type: 'color', class: 'as-editor__own', title: 'Свой цвет', value: /^#[0-9a-f]{6}$/i.test(it.color || '') ? it.color : '#ffffff' });
          own.addEventListener('input', () => { it.color = own.value; redraw(); });
          own.addEventListener('change', () => panel());
          const col = h('div', { class: 'as-editor__sws' }, TEXT_COLORS.map(sw), own);
          const fnt = h('select', { class: 'as-input' }, Object.entries(TEXT_FONTS).map(([k, [l]]) => h('option', { value: k, selected: (it.font || 'head') === k }, l)));
          fnt.addEventListener('change', () => { it.font = fnt.value; redraw(); });
          const wt = h('select', { class: 'as-input' }, [['800', 'Жирный'], ['600', 'Полужирный'], ['400', 'Обычный']].map(([k, l]) => h('option', { value: k, selected: String(it.weight || 800) === k }, l)));
          wt.addEventListener('change', () => { it.weight = +wt.value; redraw(); });
          sec.append(t, field('Шрифт', fnt), field('Начертание', wt), h('div', { class: 'as-editor__field as-editor__field--col' }, h('span', null, 'Цвет'), col));
        } else {
          const fl = h('input', { type: 'checkbox', checked: !!it.flip }); fl.addEventListener('change', () => { it.flip = fl.checked; redraw(); });
          sec.append(field('Поза', poseSelect(it.pose, (v) => { it.pose = v; })), field('Зеркально', fl));
        }
        sec.append(
          field('Размер', range(16, it.type === 'text' ? 400 : 1600, 1, it.size, (v) => { it.size = v; })),
          field('Поворот', range(-180, 180, 1, Math.round((it.rot || 0) * 180 / Math.PI), (v) => { it.rot = v * Math.PI / 180; })),
          h('div', { class: 'as-rowx' },
            h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => { c.items.push(clone({ ...it, x: it.x + 0.04, y: it.y + 0.04 })); sel = c.items.length - 1; panel(); redraw(); } }, 'Копия'),
            h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => { c.items.splice(sel, 1); sel = -1; panel(); redraw(); } }, 'Удалить')));
        side.append(sec);
      } else {
        side.append(h('div', { class: 'caption as-subtle' }, 'Щелчок по элементу — выбрать. Тянуть — двигать, угол — размер, кружок сверху — поворот. Колесо — размер, Shift+колесо — поворот.'));
      }
      side.append(h('div', { class: 'as-editor__actions' },
        h('button', { class: 'as-btn as-btn--ghost', onclick: () => done(null) }, 'Отмена'),
        h('button', { class: 'as-btn as-btn--primary', onclick: () => done(c.items.length ? c : null) }, 'Готово')));
    }
    panel(); redraw(); cv.focus();
  });
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
