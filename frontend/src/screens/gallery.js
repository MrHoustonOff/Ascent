// Галерея: стена с рамами. Постоянные картины — всегда; картины этапов открываются на 25, 50, 75 % и при закрытии этапа.
// Щелчок по картине — просмотр вблизи с описанием и скачиванием; #/gallery/<id> открывает картину сразу.
import { h, pluralRu } from '../ui/dom.js';
import { galleryState, framed, openPainting, isNew, lockHint } from '../ui/gallery.js';
import { STAGE_TITLES } from '../ui/recap-stage.js';

export async function render(root, arg) {
  const all = await galleryState();
  const open = all.filter((p) => p.unlocked), stageOpen = open.filter((p) => p.kind === 'stage').length;
  const fresh = all.filter(isNew).length;
  const item = (p) => {
    const locked = !p.unlocked;
    const el = h('button', { class: 'as-galitem' + (locked ? ' is-locked' : ''), 'aria-label': locked ? 'Закрытая картина: ' + lockHint(p) : p.title + (p.sub ? ' — ' + p.sub : ''), title: locked ? lockHint(p) : '',
      onclick: () => { if (!locked) openPainting(p.id, all); } },
    framed(p, { locked }),
    h('div', { class: 'as-galitem__plate' },
      h('div', { class: 'as-galitem__name' }, locked ? '· · ·' : p.sub || p.title),
      h('div', { class: 'as-galitem__when' }, locked ? lockHint(p) : p.always ? 'всегда' : p.when || 'ранее')),
    isNew(p) ? h('span', { class: 'as-galitem__new' }, 'новая') : null);
    return el;
  };
  const section = (label, sub, list, grid = false) => h('section', { class: 'as-galsec' },
    h('div', { class: 'as-galsec__head' }, h('h2', { class: 'as-galsec__title' }, label), sub ? h('span', { class: 'as-galsec__sub' }, sub) : null),
    h('div', { class: 'as-galsec__row' + (grid ? ' is-grid' : '') }, list.map(item)));

  const wall = h('div', { class: 'as-galwall' },
    section('Гофер и Клавд', 'история дружбы', all.filter((p) => ['meet', 'colleagues', 'friends'].includes(p.id))),
    section('Особые дни', 'дни рождения', all.filter((p) => p.occasion)),
    section('Особые случаи', 'выбираются в итогах', all.filter((p) => p.kind === 'special' && !p.occasion && !['meet', 'colleagues', 'friends'].includes(p.id))),
    ...STAGE_TITLES.map((t, i) => {
      const list = all.filter((p) => p.num === i + 1), n = list.filter((p) => p.unlocked).length;
      return section(`Этап ${i + 1} · ${t}`, `${n} из 4`, list, true);
    }));

  root.append(
    h('header', { class: 'as-head' },
      h('div', { class: 'as-eyebrow' }, 'Галерея'),
      h('h1', { class: 'large-title', style: { margin: '4px 0 0' } }, 'Картины пути'),
      h('p', { class: 'as-lead' }, `Каждый этап — история в четырёх картинах: четверть, половина, три четверти и вершина. ` +
        `Открыто ${stageOpen} из 28` + (fresh ? ` · ${fresh} ${pluralRu(fresh, 'новая', 'новые', 'новых')}` : '') + '. Постоянные картины доступны всегда.')),
    wall);
  if (arg && open.some((p) => p.id === arg)) requestAnimationFrame(() => openPainting(arg, all));
  return 'Галерея';
}
