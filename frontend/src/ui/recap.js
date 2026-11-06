// Итоги: картинки за день, неделю, месяц или весь путь. Сторис 9:16 или квадрат 1:1, одна картинка или карусель.
// Обязательные карточки — сводка, пройденное и достижения; остальные выпадают случайно (или включаются вручную).
// Стиль, цвет, раскладка и поза гофера случайны на каждое открытие окна; в пределах окна не прыгают.
// Табло страниц: каждая картинка рисуется один раз на свой набор настроек; удаление и перестановка — без перерисовки.
import { api } from '../api.js';
import { S } from '../state.js';
import { h, clear, append, pluralRu } from './dom.js';
import { openDialog } from './dialog.js';
import { toast } from './toast.js';
import { FORMATS, STYLES, STYLE_KEYS, EXTRA_CARDS, GALLERY_LIST, planCards, drawCard, listPages, rngFrom, pick, hashStr, hasPageNo, drawPageNo } from './recap-draw.js';
import { achCardPNG } from './achwindow.js';
import { outfitFor, OUTFITS, OUTFIT } from './outfits.js';
import { openEditor } from './recap-editor.js';
import { openListEditor } from './recap-list.js';
import { openNotes } from './recap-notes.js';
import { openAnkiImport } from './recap-anki.js';
import { parseAnki, ankiInfo } from './anki.js';
import { parsePractice, practiceInfo } from './recap-practice.js';
import { openPracticeImport } from './recap-practice-import.js';

const KINDS = [['day', 'День'], ['week', 'Неделя'], ['month', 'Месяц'], ['range', 'Период'], ['all', 'Весь путь']];
const TOGGLE_NEXT = { auto: 'on', on: 'off', off: 'auto' };
const TOGGLE_TEXT = { auto: 'случайно', on: 'всегда', off: 'нет' };

function loadPrefs() {
  const def = { format: 'story', mode: 'carousel', style: 'random', toggles: {}, custom: [], dayX: true };
  try { return { ...def, ...JSON.parse(S.settings.recap_prefs || '{}') }; } catch { return def; }
}
// итоги Anki: последний загруженный JSON (настройка anki_recap)
function loadAnki() { const r = parseAnki(S.settings.anki_recap || ''); return r.ok ? r.data : null; }
// итоги практики: последний загруженный ответ /практика (настройка practice_recap)
function loadPractice() { const r = parsePractice(S.settings.practice_recap || ''); return r.ok ? r.data : null; }
function savePractice(x) {
  const v = x ? JSON.stringify(x) : '';
  S.settings.practice_recap = v;
  api.SetSetting('practice_recap', v).catch(() => {});
}
function saveAnki(a) {
  const v = a ? JSON.stringify(a) : '';
  S.settings.anki_recap = v;
  api.SetSetting('anki_recap', v).catch(() => {});
}
function savePrefs(p) {
  const v = JSON.stringify(p);
  S.settings.recap_prefs = v;
  api.SetSetting('recap_prefs', v).catch(() => {});
}

// один выбор из нескольких вариантов: сегментированный переключатель
function seg(items, cur, onPick) {
  const el = h('div', { class: 'as-seg as-recap__seg', role: 'tablist' });
  const draw = (v) => { clear(el); items.forEach(([k, l]) => el.append(h('button', { class: 'as-seg__tab' + (k === v ? ' is-on' : ''), role: 'tab', 'aria-selected': String(k === v), onclick: () => { draw(k); onPick(k); } }, l))); };
  draw(cur);
  return el;
}

const newUid = () => Math.random().toString(36).slice(2, 10);
const PAINTED = new Set(['stage', 'gallery', 'occasion']); // картины маслом: стиль, акцент и наряд на них не влияют
// версия своей карточки: правка даёт новый объект — и новую картинку
const CARD_V = new WeakMap(); let cardVN = 0;
const cardVer = (o) => { if (!CARD_V.has(o)) CARD_V.set(o, ++cardVN); return CARD_V.get(o); };

export function openRecap() {
  const p = loadPrefs();
  p.custom.forEach((c) => { if (!c.uid) c.uid = newUid(); }); // id своей карточки не зависит от её места в списке
  const seed = Math.floor(Math.random() * 2 ** 31);
  const rnd = rngFrom(seed);
  const randStyle = pick(rnd, STYLE_KEYS);
  let todayStudy = '';
  let gallery = ''; // картина галереи для этих итогов: выбирается каждый раз, не запоминается
  let outfitPick = ''; // наряд, выбранный руками, — для этих итогов, пока окно открыто
  let kind = 'day', date = '', data = null, loadNo = 0;
  let all = [], list = []; // все страницы по плану и те, что на табло (без удалённых, в своём порядке)
  // правки табло — удалённые страницы, свой фон, порядок — живут для каждого периода, пока окно открыто;
  // их не сбрасывают ни переключатели, ни данные Anki и практики; вернуть исходное — «Сбросить всё»
  const edits = {};
  const period = () => kind + '|' + (data ? data.from + '..' + data.date : '');
  const E = () => edits[period()] || (edits[period()] = { over: {}, order: [] });
  const ver = { anki: 0, practice: 0, themes: 0 }; // версии данных, от которых зависят их страницы

  const preview = h('div', { class: 'as-recap__pages' });
  const bar = h('div', { class: 'as-recap__pagebar' });
  const info = h('div', { class: 'caption as-subtle' }, '');
  const dateInp = h('input', { class: 'as-input', type: 'date', 'aria-label': 'Дата', style: { width: '160px' } });
  dateInp.addEventListener('change', () => { date = dateInp.value; load(); });
  // произвольный период: с … по …; пока не выбран — последние две недели
  let rFrom = '', rTo = '';
  const fromInp = h('input', { class: 'as-input', type: 'date', 'aria-label': 'Начало периода', style: { width: '160px' } });
  const toInp = h('input', { class: 'as-input', type: 'date', 'aria-label': 'Конец периода', style: { width: '160px' } });
  const onRange = () => { if (!fromInp.value || !toInp.value) return; rFrom = fromInp.value; rTo = toInp.value; load(); };
  fromInp.addEventListener('change', onRange); toInp.addEventListener('change', onRange);
  const dates = h('div', { class: 'as-recap__dates' });
  const drawDates = () => {
    clear(dates);
    if (kind === 'range') dates.append(h('span', null, 'с'), fromInp, h('span', null, 'по'), toInp);
    else if (kind !== 'all') dates.append(dateInp);
  };
  const query = () => (kind === 'range' ? (rFrom && rTo ? `${rFrom}..${rTo}` : '') : date);
  const toggles = h('div', { class: 'as-recap__chips' });
  const drawToggles = () => {
    clear(toggles);
    toggles.append(h('span', { class: 'as-recap__label' }, 'Карточки'));
    // ритм недели — только для недели; по умолчанию «всегда»
    const chips = kind === 'week' ? [['week', 'Ритм недели', 'on'], ...EXTRA_CARDS] : EXTRA_CARDS;
    for (const [k, l, def] of chips) {
      const st = p.toggles[k] || def || 'auto';
      toggles.append(h('button', {
        class: 'as-recap__chip is-' + st, title: 'Щелчок: случайно → всегда → нет',
        onclick: () => { p.toggles[k] = TOGGLE_NEXT[st]; savePrefs(p); drawToggles(); plan(); },
      }, l, h('span', { class: 'as-recap__chipst' }, TOGGLE_TEXT[st])));
    }
    // вехи этапа (25/50/75 % и закрытие) — только если в периоде они есть
    if (data?.stageDone?.length) {
      const on = p.toggles.stage !== 'off', n = data.stageDone.length, x = data.stageDone[0];
      toggles.append(h('button', {
        class: 'as-recap__chip is-' + (on ? 'on' : 'off'), title: 'Карточки этапа: своя картина на 25, 50, 75 % и закрытие',
        onclick: () => { p.toggles.stage = on ? 'off' : 'on'; savePrefs(p); drawToggles(); plan(); },
      }, n > 1 ? 'Вехи этапов' : x.pct >= 100 ? `Этап ${x.num} закрыт` : `Этап ${x.num} · ${x.pct} %`, h('span', { class: 'as-recap__chipst' }, on ? 'есть' : 'нет')));
    }
    // картина из галереи — список, доступна всегда
    const gsel = h('select', { class: 'as-input as-recap__gallery', 'aria-label': 'Картина', title: 'Картина маслом первой карточкой' },
      [['', 'Картина: нет'], ...GALLERY_LIST.map(([k, t]) => [k, 'Картина: ' + t])].map(([k, t]) => h('option', { value: k, selected: k === gallery }, t)));
    gsel.addEventListener('change', () => { gallery = gsel.value; plan(); });
    toggles.append(gsel);
    // наряд дня для гофера — только в итогах дня: «случайно» (по дате, в праздники — праздничный), «нет» или любой из списка
    if (kind === 'day') {
      const o = data ? outfitFor(data.date) : null;
      const GROUPS = [['На каждый день', ['regular', 'summer']], ['Новый год', ['ny']], ['Хэллоуин', ['halloween']], ['Праздники', ['feb14', 'feb23', 'mar8', 'apr1', 'sep1', 'progday', 'goday', 'bday']]];
      const cur = outfitPick || (p.outfit === 'off' ? 'off' : 'random');
      const opt = (v, t) => h('option', { value: v, selected: v === cur }, t);
      const osel = h('select', { class: 'as-input as-recap__gallery', 'aria-label': 'Наряд гофера', title: 'Наряд гофера на картинках дня' },
        opt('random', 'Наряд: случайно' + (o ? ` (${o.name.toLowerCase()})` : '')), opt('off', 'Наряд: нет'),
        GROUPS.map(([label, pools]) => h('optgroup', { label }, OUTFITS.filter((x) => !x.same && pools.includes(x.pool)).map((x) => opt(x.id, 'Наряд: ' + x.name)))));
      osel.addEventListener('change', () => {
        const v = osel.value;
        if (v === 'random' || v === 'off') { outfitPick = ''; p.outfit = v; savePrefs(p); } else outfitPick = v;
        plan();
      });
      toggles.append(osel);
    }
    // «учу Go · день X» на первой карточке: считается от первой закрытой темы
    toggles.append(h('button', {
      class: 'as-recap__chip is-' + (p.dayX ? 'on' : 'off'), title: 'Надпись «учу Go · день X» на первой карточке',
      onclick: () => { p.dayX = !p.dayX; savePrefs(p); drawToggles(); plan(); },
    }, 'День X', h('span', { class: 'as-recap__chipst' }, p.dayX ? 'есть' : 'нет')));
    // окна достижений периода отдельными PNG в подпапку «Достижения» при сохранении
    toggles.append(h('button', {
      class: 'as-recap__chip is-' + (p.achPng ? 'on' : 'off'), title: 'При сохранении: окна достижений периода отдельными картинками в подпапку «Достижения»',
      onclick: () => { p.achPng = !p.achPng; savePrefs(p); drawToggles(); },
    }, 'Окна достижений', h('span', { class: 'as-recap__chipst' }, p.achPng ? 'сохранять' : 'нет')));
  };
  drawToggles();

  // кнопка «Данные из Anki»; когда данные есть — колода и дата, рядом ✕ убрать
  const ankiBtns = h('div', { class: 'as-recap__anki' });
  const drawAnkiBtns = () => {
    clear(ankiBtns);
    const a = loadAnki();
    ankiBtns.append(h('button', { class: 'as-btn as-btn--secondary as-btn--sm', title: 'Вставить JSON или прикрепить файл из Anki', onclick: importAnki },
      a ? `Anki · ${a.deck} · ${ankiInfo(a).short}` : 'Данные из Anki'));
    if (a) ankiBtns.append(h('button', { class: 'as-iconbtn', title: 'Убрать данные Anki', 'aria-label': 'Убрать данные Anki', onclick: () => { saveAnki(null); ver.anki++; drawAnkiBtns(); plan(); } }, '✕'));
  };
  async function importAnki() {
    const a = await openAnkiImport();
    if (!a) return;
    saveAnki(a); ver.anki++; drawAnkiBtns(); plan();
  }
  drawAnkiBtns();
  // кнопка «Данные практики»: как у Anki — когда данные есть, их даты и ✕ убрать
  const pracBtns = h('div', { class: 'as-recap__anki' });
  const drawPracBtns = () => {
    clear(pracBtns);
    const x = loadPractice();
    pracBtns.append(h('button', { class: 'as-btn as-btn--secondary as-btn--sm', title: 'Вставить ответ /практика или прикрепить файл', onclick: importPractice },
      x ? `Практика · ${practiceInfo(x).short} · ${x.total.count}` : 'Данные практики'));
    if (x) pracBtns.append(h('button', { class: 'as-iconbtn', title: 'Убрать данные практики', 'aria-label': 'Убрать данные практики', onclick: () => { savePractice(null); ver.practice++; drawPracBtns(); plan(); } }, '✕'));
  };
  async function importPractice() {
    const x = await openPracticeImport();
    if (!x) return;
    savePractice(x); ver.practice++; drawPracBtns(); plan();
  }
  drawPracBtns();

  // стилей много — выпадающий список вместо ряда кнопок
  const styleSel = h('select', { class: 'as-input as-recap__stylesel', 'aria-label': 'Стиль' },
    [['random', 'Стиль: случайно'], ...STYLE_KEYS.map((k) => [k, 'Стиль: ' + STYLES[k].label])].map(([k, l]) => h('option', { value: k, selected: k === p.style }, l)));
  styleSel.addEventListener('change', () => { p.style = styleSel.value; savePrefs(p); render(); });
  const body = h('div', { class: 'as-recap__body' },
    h('div', { class: 'as-rowx' }, seg(KINDS, kind, (k) => { kind = k; drawDates(); drawToggles(); load(); }), dates),
    h('div', { class: 'as-rowx' },
      seg([['story', '9:16'], ['square', '1:1']], p.format, (v) => { p.format = v; savePrefs(p); plan(); }),
      seg([['carousel', 'Карусель'], ['one', 'Одна']], p.mode, (v) => { p.mode = v; savePrefs(p); plan(); }),
      styleSel),
    toggles,
    bar,
    preview,
    h('div', { class: 'as-rowx as-rowx--between' }, info,
      h('div', { class: 'as-rowx' }, ankiBtns, pracBtns,
        h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: () => edit(null, 'list') }, '＋ Список'),
        h('button', { class: 'as-btn as-btn--secondary as-btn--sm', onclick: () => edit(null) }, '＋ Своя карточка'))));

  const dlg = openDialog({
    title: 'Итоги', body, cls: 'as-recap', focus: '.as-dialog__actions .as-btn',
    actions: [
      { label: 'Закрыть', onClick: (d) => d.close() },
      { label: 'Сохранить картинки', kind: 'primary', onClick: save },
    ],
  });

  const styleNow = () => (p.style === 'random' ? randStyle : p.style);
  const accent = () => pick(rngFrom(seed + 5), STYLES[styleNow()].accents);

  // своя карточка: свободный холст или список
  async function edit(i, kind) {
    const old = i == null ? null : p.custom[i];
    const open = (old ? old.kind : kind) ? openListEditor : openEditor;
    const card = await open({ card: old, format: p.format, acc: accent(), seed: seed + 11 + (i ?? p.custom.length) });
    if (!card) return;
    card.uid = old?.uid || newUid();
    if (i == null) p.custom.push(card); else p.custom[i] = card;
    savePrefs(p); plan();
  }

  async function editNotes() {
    await openNotes({ themes: data.themes });
    data.notes = await api.ThemeComments().catch(() => data.notes);
    ver.themes++; plan(); // страниц с темами могло стать больше
  }

  // ---------- готовые картинки ----------
  // каждая страница рисуется один раз на свой набор настроек и хранится целиком (1080 px) без номера страницы;
  // номер «3 / 9» кладётся поверх при показе и сохранении — поэтому удаление и перестановка ничего не перерисовывают
  const cache = new Map(), inflight = new Map();
  let wanted = new Set(), chain = Promise.resolve();
  function trim() {
    const cap = Math.max(32, wanted.size + 8); // ~8 МБ на картинку 1080×1920
    for (const k of cache.keys()) { if (cache.size <= cap) break; if (!wanted.has(k)) cache.delete(k); }
  }
  function canvasFor(c) {
    const k = c.rk;
    if (cache.has(k)) { const v = cache.get(k); cache.delete(k); cache.set(k, v); return Promise.resolve(v); }
    if (inflight.has(k)) return inflight.get(k);
    const d = data, o = c.opts;
    // рисуем по одной (наряд дня — общий на время отрисовки) и только то, что ещё нужно
    const job = chain.then(async () => {
      if (!wanted.has(k)) return null;
      const cv = await drawCard(c, d, o);
      cache.set(k, cv); trim();
      return cv;
    }).finally(() => inflight.delete(k));
    chain = job.catch(() => {});
    inflight.set(k, job);
    return job;
  }

  // данные периода: при открытии и смене периода
  async function load() {
    const my = ++loadNo;
    if (!tiles.size) { clear(preview); preview.append(h('div', { class: 'as-recap__loading' }, 'Собираю…')); } else preview.classList.add('is-loading');
    try {
      // свои карточки и списки живут один учебный день: с началом нового дня (час из настроек, обычно 4:00) — с чистого листа
      if (!todayStudy) todayStudy = (await api.Recap('day', '')).date;
      if (p.customDay !== todayStudy) {
        if (p.custom.length) p.custom = [];
        p.customDay = todayStudy; savePrefs(p);
      }
      const d = await api.Recap(kind, query());
      d.notes = await api.ThemeComments().catch(() => ({})); // комментарии тем: id → тексты
      if (my !== loadNo) return;
      data = d;
      if (kind === 'range') { fromInp.value = data.from; toInp.value = data.date; rFrom = data.from; rTo = data.date; }
      else if (!dateInp.value && kind !== 'all') dateInp.value = data.date;
      drawToggles();
      plan();
    } catch (e) {
      console.error(e);
      if (my !== loadNo) return;
      for (const t of tiles.values()) t.remove(); tiles.clear(); list = [];
      clear(preview); preview.append(h('div', { class: 'as-recap__loading' }, 'Не удалось собрать итоги.'));
    } finally { if (my === loadNo) preview.classList.remove('is-loading'); }
  }

  // какие страницы есть: после любой настройки; данные не запрашивает
  function plan() {
    if (!data) return;
    data.anki = loadAnki();
    // Anki — только если его период пересекается с периодом итогов (вчерашний JSON в сегодняшних итогах не нужен)
    if (data.anki && (data.anki.period_to < data.from || data.anki.period_from > data.date)) data.anki = null;
    // практика — так же: только если её даты пересекаются с периодом итогов
    data.practice = loadPractice();
    if (data.practice && (data.practice.range.to < data.from || data.practice.range.from > data.date)) data.practice = null;
    const cards = planCards(data, { mode: p.mode, toggles: p.toggles, gallery, seed, format: p.format, tasks: !!p.tasks, practiceMode: p.practiceMode });
    p.custom.forEach((c, i) => {
      if (!c.kind) { cards.push({ key: 'custom', name: 'Своя карточка', card: c, ci: i }); return; }
      const n = listPages(c, p.format); // длинный список — несколько страниц
      for (let k = 0; k < n; k++) cards.push({ key: 'custom', name: n > 1 ? `Список ${k + 1}` : 'Список', card: c, ci: i, page: k });
    });
    // id страницы — по смыслу, а не по месту: «темы, 2-я», «этап 1 · 50 %», «список такой-то, стр. 1»
    const seen = {};
    for (const c of cards) {
      if (c.key === 'custom') c.id = `custom:${c.card.uid}:${c.page || 0}`;
      else if (c.key === 'stage') c.id = 'stage:' + c.from;
      else if (c.key === 'gallery') c.id = 'gallery:' + c.kind;
      else if (c.key === 'occasion') c.id = 'occasion:' + c.occ;
      else { seen[c.key] = (seen[c.key] ?? -1) + 1; c.id = c.key + ':' + seen[c.key]; }
      c.sig = JSON.stringify(c, (k, v) => (k === 'card' ? cardVer(v) : v)); // что именно на странице
    }
    all = cards;
    render();
  }

  // порядок табло: переставленные — как поставили; новые страницы — рядом со своим соседом по плану
  function arrange() {
    const { over, order } = E();
    const vis = all.filter((c) => c.locked || !over[c.id]?.hidden); // особая карточка 25 ноября не убирается
    if (!order.length) return vis;
    const out = order.map((id) => vis.find((c) => c.id === id)).filter(Boolean);
    vis.forEach((c, i) => {
      if (out.includes(c)) return;
      let at = 0;
      for (let j = i - 1; j >= 0; j--) { const k = out.indexOf(vis[j]); if (k >= 0) { at = k + 1; break; } }
      out.splice(at, 0, c);
    });
    return out;
  }

  // ---------- табло ----------
  const tiles = new Map(); // id страницы → плитка
  const thumbH = () => (p.format === 'square' ? 196 : 260);
  function render() {
    if (!data) return;
    const { over } = E();
    list = arrange();
    const style = styleNow(), acc = accent(), per = period();
    const outfit = kind !== 'day' ? null : outfitPick ? OUTFIT[outfitPick] : p.outfit !== 'off' ? outfitFor(data.date) : null;
    const full = p.mode === 'one', tasks = !!p.tasks;
    for (const c of list) {
      const st = over[c.id]?.style || style; // свой фон у страницы
      const a = st === style ? acc : pick(rngFrom(seed + 5), STYLES[st].accents);
      c.style = st;
      c.opts = { format: p.format, style: st, acc: a, seed, salt: hashStr(c.id) % 9973, full, dayX: p.dayX, tasks, outfit };
      const look = PAINTED.has(c.key) ? [] : c.key === 'custom' ? [a, outfit?.id || ''] : [st, a, full, p.dayX, tasks, outfit?.id || '', ver[c.key] ?? 0];
      c.rk = [per, c.sig, p.format, ...look].join('|');
    }
    wanted = new Set(list.map((c) => c.rk));
    preview.querySelector('.as-recap__loading')?.remove();
    for (const [id, t] of tiles) if (!list.some((c) => c.id === id)) { t.remove(); tiles.delete(id); }
    const [W, H] = FORMATS[p.format], th = thumbH();
    preview.style.setProperty('--th', th + 'px'); preview.style.setProperty('--tw', Math.round(th * W / H) + 'px');
    list.forEach((c, i) => {
      let t = tiles.get(c.id);
      if (!t) { t = makeTile(); tiles.set(c.id, t); }
      fillTile(t, c, i);
      if (preview.children[i] !== t) preview.insertBefore(t, preview.children[i] || null);
    });
    list.forEach((c, i) => show(tiles.get(c.id), c, i + 1, list.length));
    drawBar();
    const n = list.length;
    info.textContent = `${data.title} · ${data.period} · ${n} ${pluralRu(n, 'картинка', 'картинки', 'картинок')} · ${STYLES[style].label.toLowerCase()}` + (outfit ? ` · наряд: ${outfit.name.toLowerCase()}` : '');
  }

  function makeTile() {
    const cv = h('canvas', { class: 'as-recap__cv' });
    const shot = h('div', { class: 'as-recap__shot is-wait' }, cv);
    const t = h('div', { class: 'as-recap__tile' }, shot, h('div', { class: 'as-recap__name' }), h('div', { class: 'as-recap__extra' }));
    t._cv = cv; t._shot = shot; t._rk = ''; t._pn = ''; t._fmt = '';
    return t;
  }

  // кнопки плитки: ✕ в углу, внизу ‹ фон ›; под картинкой — название и настройки этой страницы
  function fillTile(t, c, i) {
    const { over } = E(), n = list.length, id = c.id;
    t.dataset.id = id;
    t.title = 'Перетащите, чтобы поменять порядок';
    t._shot.querySelectorAll('.as-recap__x, .as-recap__lock, .as-recap__bar').forEach((x) => x.remove());
    const corner = c.locked ? h('span', { class: 'as-recap__lock', title: 'Особый день — эта карточка остаётся' }, '♥')
      : h('button', { class: 'as-recap__x', title: c.key === 'custom' ? 'Убрать карточку' : 'Убрать страницу', 'aria-label': c.key === 'custom' ? 'Убрать карточку' : 'Убрать страницу', onclick: () => drop(c) }, '✕');
    const mv = (dir, label, sym) => h('button', { class: 'as-recap__mv', title: label, 'aria-label': label, disabled: dir < 0 ? i === 0 : i === n - 1,
      onclick: () => { const k = list.findIndex((x) => x.id === id); moveTo(k, k + dir); } }, sym);
    let bg = null;
    if (!PAINTED.has(c.key) && c.key !== 'custom') {
      bg = h('select', { class: 'as-recap__bgsel', 'aria-label': 'Фон страницы', title: 'Фон этой страницы' },
        STYLE_KEYS.map((k) => h('option', { value: k, selected: k === c.style }, STYLES[k].label)));
      bg.addEventListener('change', () => { over[id] = { ...over[id], style: bg.value === styleNow() ? undefined : bg.value }; render(); });
    }
    t._shot.append(corner, h('div', { class: 'as-recap__bar' }, mv(-1, 'Раньше', '‹'), bg || h('span', { class: 'as-recap__grow' }), mv(1, 'Позже', '›')));
    t.querySelector('.as-recap__name').textContent = `${i + 1} · ${c.name}`;
    const ex = t.querySelector('.as-recap__extra'); clear(ex);
    if (c.key === 'custom') ex.append(h('button', { class: 'as-recap__link', onclick: () => edit(c.ci) }, 'изменить'));
    if (c.key === 'themes' && c.id === 'themes:0' && data.themes.length) {
      // «Показывать задачи» — темы раскрываются в свои задачи; комментарии к темам
      const chk = h('input', { type: 'checkbox', checked: !!p.tasks });
      chk.addEventListener('change', () => { p.tasks = chk.checked; savePrefs(p); plan(); });
      ex.append(h('label', { class: 'as-recap__chk', title: 'Показывать задачи каждой темы' }, chk, 'задачи'),
        h('button', { class: 'as-recap__link', title: 'Комментарии к пройденным темам', onclick: editNotes }, 'комментарии'));
    }
    if (c.key === 'practice' && c.page === 0) {
      const ps = h('select', { class: 'as-recap__bgsel as-recap__bgsel--line', 'aria-label': 'Вид карточки практики', title: 'Подробно — всё; сжато — название, вид и время' },
        [['full', 'Подробно'], ['short', 'Сжато']].map(([k, l]) => h('option', { value: k, selected: k === (p.practiceMode === 'short' ? 'short' : 'full') }, l)));
      ps.addEventListener('change', () => { p.practiceMode = ps.value; savePrefs(p); plan(); });
      ex.append(ps);
    }
  }

  // показать страницу: готовая — сразу (уменьшенная копия + номер), нет — пока прежняя картинка с кружком или заглушка
  function show(t, c, page, total) {
    const pn = hasPageNo(c) && total > 1 ? `${page}/${total}` : '';
    if (t._fmt !== p.format) { t._fmt = p.format; t._rk = ''; t._shot.classList.add('is-wait'); }
    if (t._rk === c.rk && t._pn === pn) return;
    const ready = cache.get(c.rk);
    if (ready) { paint(t, ready, c, page, total); return; }
    t._shot.classList.add(t._rk ? 'is-busy' : 'is-wait');
    canvasFor(c).then((cv) => {
      if (!cv || tiles.get(c.id) !== t) return;
      const k = list.findIndex((x) => x.id === c.id), cur = list[k];
      if (!cur || cur.rk !== c.rk) return; // пока рисовали, настройки поменялись
      paint(t, cv, cur, k + 1, list.length);
    }).catch((e) => { console.error(e); t._shot.classList.remove('is-busy', 'is-wait'); t._shot.classList.add('is-err'); });
  }
  function paint(t, cv, c, page, total) {
    const dpr = Math.min(2.5, Math.max(1.5, window.devicePixelRatio || 1));
    const ch = Math.round(thumbH() * dpr), cw = Math.round(ch * cv.width / cv.height);
    if (t._cv.width !== cw || t._cv.height !== ch) { t._cv.width = cw; t._cv.height = ch; }
    const g = t._cv.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.clearRect(0, 0, cw, ch); g.drawImage(cv, 0, 0, cw, ch);
    if (hasPageNo(c)) drawPageNo(g, cw, c.style, page, total);
    t._rk = c.rk; t._pn = hasPageNo(c) && total > 1 ? `${page}/${total}` : '';
    t._shot.classList.remove('is-wait', 'is-busy', 'is-err');
  }

  // убрать страницу: остальные остаются как были, ничего не перерисовывается
  function drop(c) {
    if (c.key === 'custom') { p.custom = p.custom.filter((x) => x !== c.card); savePrefs(p); plan(); return; }
    const { over } = E();
    over[c.id] = { ...over[c.id], hidden: true };
    render();
  }
  function moveTo(from, to) {
    if (from < 0 || to < 0 || to >= list.length || from === to) return;
    const ids = list.map((c) => c.id); const [x] = ids.splice(from, 1); ids.splice(to, 0, x);
    E().order = ids; render();
  }

  // строка над табло: сколько страниц, вернуть удалённые, сбросить всё
  function drawBar() {
    clear(bar);
    const ed = E(), hidden = all.filter((c) => !c.locked && ed.over[c.id]?.hidden).length;
    const dirty = hidden || ed.order.length || Object.values(ed.over).some((x) => x.style);
    append(bar, [h('span', { class: 'as-recap__label' }, `Страницы · ${list.length}`),
      h('span', { class: 'as-recap__hint' }, list.length > 1 ? 'перетащите картинку, чтобы поменять порядок' : ''),
      hidden ? h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => { for (const k in ed.over) delete ed.over[k].hidden; render(); } }, `Вернуть удалённые (${hidden})`) : null,
      h('button', { class: 'as-btn as-btn--secondary as-btn--sm', disabled: !dirty, title: 'Вернуть удалённые страницы, исходный порядок и общий фон', onclick: () => { edits[period()] = { over: {}, order: [] }; render(); } }, 'Сбросить всё')]);
  }

  // ---------- перетаскивание ----------
  // плитка едет за мышью, соседи расступаются; у края табло само прокручивается
  let drag = null;
  preview.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || drag?.on) return;
    const tile = e.target.closest('.as-recap__tile');
    if (!tile || e.target.closest('button, select, input, label, a')) return;
    e.preventDefault(); // без выделения текста
    const ts = [...preview.querySelectorAll('.as-recap__tile')], k = ts.indexOf(tile);
    drag = { tile, tiles: ts, from: k, to: k, x0: e.clientX, s0: preview.scrollLeft, cx: e.clientX, on: false, pid: e.pointerId };
  });
  const dragStart = () => {
    drag.on = true;
    const { tiles: ts, tile } = drag;
    drag.mid = ts.map((t) => t.offsetLeft + t.offsetWidth / 2);
    drag.step = ts.length > 1 ? ts[1].offsetLeft - ts[0].offsetLeft : tile.offsetWidth;
    try { preview.setPointerCapture(drag.pid); } catch {}
    preview.classList.add('is-dragging'); tile.classList.add('is-lift');
    const loop = () => { // автопрокрутка у краёв
      if (!drag?.on) return;
      const r = preview.getBoundingClientRect(), edge = 56;
      const v = drag.cx < r.left + edge ? -Math.ceil((r.left + edge - drag.cx) / 4) : drag.cx > r.right - edge ? Math.ceil((drag.cx - r.right + edge) / 4) : 0;
      if (v) { preview.scrollLeft += v; dragMove(); }
      drag.raf = requestAnimationFrame(loop);
    };
    drag.raf = requestAnimationFrame(loop);
  };
  const dragMove = () => {
    const { tiles: ts, tile, from, mid, step } = drag;
    const off = drag.cx - drag.x0 + (preview.scrollLeft - drag.s0), at = mid[from] + off;
    tile.style.transform = `translateX(${off}px) scale(1.04)`;
    let to = from;
    for (let i = 0; i < ts.length; i++) {
      if (i < from && at < mid[i] && i < to) to = i;
      if (i > from && at > mid[i]) to = i;
    }
    drag.to = to;
    ts.forEach((t, i) => {
      if (i === from) return;
      const sh = to < from && i >= to && i < from ? step : to > from && i > from && i <= to ? -step : 0;
      t.style.transform = sh ? `translateX(${sh}px)` : '';
    });
  };
  preview.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    drag.cx = e.clientX;
    if (!drag.on) { if (Math.abs(e.clientX - drag.x0) < 6) return; dragStart(); }
    dragMove();
  });
  const dragEnd = (e) => {
    if (!drag || (e && e.pointerId !== drag.pid)) return;
    const d = drag; drag = null;
    if (!d.on) return;
    cancelAnimationFrame(d.raf);
    preview.classList.add('is-settle');
    d.tiles.forEach((t) => { t.style.transform = ''; t.classList.remove('is-lift'); });
    preview.classList.remove('is-dragging');
    moveTo(d.from, d.to);
    void preview.offsetWidth; preview.classList.remove('is-settle');
  };
  // отпустить можно где угодно; окно закрыли посреди перетаскивания — слушатели снимаются
  const onUp = (e) => { if (!preview.isConnected) { window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); return; } dragEnd(e); };
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  preview.addEventListener('lostpointercapture', dragEnd);

  // колесо мыши листает табло вбок; у края — отдаёт прокрутку окну
  preview.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const max = preview.scrollWidth - preview.clientWidth;
    if (max <= 0 || (e.deltaY < 0 && preview.scrollLeft <= 0) || (e.deltaY > 0 && preview.scrollLeft >= max - 1)) return;
    preview.scrollLeft += e.deltaY; e.preventDefault();
  }, { passive: false });

  async function save() {
    if (!data || !list.length) return;
    const cards = list.slice(), n = cards.length;
    const bases = await Promise.all(cards.map(canvasFor));
    if (bases.some((x) => !x)) return; // окно успело поменяться — сохранять нечего
    // номер страницы — как на табло
    const urls = bases.map((b, i) => {
      const c = cards[i];
      if (!hasPageNo(c) || n <= 1) return b.toDataURL('image/png');
      const cv = document.createElement('canvas'); cv.width = b.width; cv.height = b.height;
      const g = cv.getContext('2d'); g.drawImage(b, 0, 0); drawPageNo(g, b.width, c.style, i + 1, n);
      return cv.toDataURL('image/png');
    });
    const names = cards.map((c) => c.name);
    try {
      const dir = await api.SaveImages(kind, kind === 'range' ? `${data.from}..${data.date}` : data.date, names, urls);
      if (dir && p.achPng && data.achievements.length) { // окна достижений периода (как в приложении, без кнопки) — в подпапку «Достижения»
        const pngs = []; for (const a of data.achievements) pngs.push(await achCardPNG(a));
        await api.SaveAchBadges(dir, data.achievements.map((a) => a.name), pngs);
      }
      if (dir) toast({ title: 'Картинки сохранены', body: dir + (p.achPng && data.achievements.length ? ` · достижений: ${data.achievements.length}` : '') });
    } catch (e) {
      if (window.go && window.go.app) { toast({ title: 'Не удалось сохранить', body: String(e.message || e), kind: 'streak' }); return; }
      // в браузере (веб-версия, разработка) — обычная загрузка файлов
      urls.forEach((u, i) => { const a = document.createElement('a'); a.href = u; a.download = `${data.title} ${data.date} ${String(i + 1).padStart(2, '0')} ${names[i]}.png`; a.click(); });
      if (p.achPng) for (const [i, ac] of data.achievements.entries()) { const a = document.createElement('a'); a.href = await achCardPNG(ac); a.download = `Достижение ${String(i + 1).padStart(2, '0')} ${ac.name}.png`; a.click(); }
      toast({ title: 'Картинки скачаны' });
    }
  }

  drawDates();
  load();
  return dlg;
}
