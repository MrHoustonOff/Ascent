import { api } from '../api.js';
import { S, emit } from '../state.js';
import { h } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { toast, toastError } from '../ui/toast.js';
import { openDialog, confirmDialog } from '../ui/dialog.js';
import { refresh } from '../actions.js';

const card = (title, ...kids) => h('section', { class: 'as-section' }, h('h2', { class: 'as-h2' }, title), h('div', { class: 'as-card', style: { gap: '4px' } }, kids));

async function save(key, value) {
  try {
    await api.SetSetting(key, String(value));
    S.settings[key] = String(value);
    if (key === 'theme') S.hooks.applyTheme();
    return true;
  } catch (e) { toast({ title: e.message || 'Не удалось сохранить', kind: 'streak' }); return false; }
}

const row = (label, hint, control) => h('div', { class: 'as-setting' },
  h('div', { class: 'as-setting__text' }, h('div', { class: 'as-setting__label' }, label), hint ? h('div', { class: 'as-setting__hint' }, hint) : null), control);

function num(key, min, max, set) {
  const i = h('input', { class: 'as-input as-input--num as-tnum', type: 'number', min, max, value: set[key], 'aria-label': key });
  i.addEventListener('change', async () => {
    const v = Math.round(+i.value);
    if (!(v >= min && v <= max)) { i.setAttribute('aria-invalid', 'true'); toast({ title: `Значение от ${min} до ${max}`, kind: 'streak' }); i.value = set[key]; return; }
    i.removeAttribute('aria-invalid');
    if (await save(key, v)) { set[key] = String(v); refresh(); }
  });
  return i;
}

const sw = (key, set) => {
  const b = h('button', { class: 'as-toggle', role: 'switch', 'aria-checked': String(set[key] === '1'), 'aria-label': key });
  b.addEventListener('click', async () => {
    const on = b.getAttribute('aria-checked') !== 'true';
    b.setAttribute('aria-checked', String(on));
    await save(key, on ? '1' : '0');
  });
  return b;
};

export async function render(root) {
  const [set, info] = await Promise.all([api.Settings(), api.PlanInfo()]);
  const theme = set.theme;

  const tabs = h('div', { class: 'as-tabs', role: 'tablist' }, [['light', 'Светлая'], ['dark', 'Тёмная'], ['system', 'Как в системе']].map(([k, l]) =>
    h('button', { class: 'as-tab' + (theme === k ? ' is-active' : ''), role: 'tab', 'aria-selected': theme === k, onclick: async (e) => {
      await save('theme', k);
      [...e.target.parentNode.children].forEach((c) => c.classList.toggle('is-active', c === e.target));
    } }, l)));

  const target = h('input', { class: 'as-input', type: 'date', value: set.milestone_target, 'aria-label': 'Целевая дата вехи', style: { width: '170px' } });
  target.addEventListener('change', async () => { if (await save('milestone_target', target.value)) refresh(); });

  const tpl = h('textarea', { class: 'as-textarea as-textarea--mono', rows: 6, 'aria-label': 'Шаблон копирования урока', spellcheck: 'false' });
  tpl.value = set.hermes_template;
  tpl.addEventListener('change', () => save('hermes_template', tpl.value));

  root.append(
    h('header', { class: 'as-head' },
      h('div', { class: 'as-eyebrow' }, 'Настройки'),
      h('h1', { class: 'large-title', style: { margin: '4px 0 0' } }, 'Как вам удобно'),
      h('p', { class: 'as-lead' }, 'Изменения сохраняются сразу.')),

    card('Внешний вид', row('Тема оформления', null, tabs)),

    card('Ритм',
      row('Начало учебного дня', 'Час, с которого начинается новый день. Всё, что вы отметите после полуночи до этого часа, относится к вчерашнему дню.', num('day_start_hour', 0, 8, set)),
      row('Дней отдыха в неделю', 'День отдыха сохраняет серию.', num('rest_per_week', 0, 2, set)),
      row('Срок проекта, дней', 'Проект — один урок, но занимает несколько дней. Это учитывается в прогнозе.', num('project_days', 1, 14, set)),
      row('Этап вехи «можно на собесы»', 'Веха наступает, когда закрыты этапы до этого номера включительно.', num('milestone_stage', 1, 7, set)),
      row('Желаемая дата', 'Необязательно. В разделе «Мой ритм» появится мягкая подсказка, сколько тем в день к ней приведёт.', target)),

    card('Гермес',
      h('div', { class: 'as-setting', style: { flexDirection: 'column', alignItems: 'stretch' } },
        h('div', { class: 'as-setting__text' }, h('div', { class: 'as-setting__label' }, 'Шаблон копирования урока'),
          h('div', { class: 'as-setting__hint' }, 'Переменные: {theme_id} {theme_title} {brief} {lesson_id} {lesson_title} {stars} {arrows} {block_id}. Пустые строки убираются.')), tpl,
        h('div', null, h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: async () => { tpl.value = (await api.DefaultTemplate()); await save('hermes_template', tpl.value); } }, 'Вернуть шаблон по умолчанию'))),
      row('Добавлять «стоит на» блока', 'В конце текста — строка «Блок … стоит на: …».', sw('hermes_with_deps', set)),
      row('Добавлять бриф темы к каждому уроку', null, sw('hermes_with_brief', set))),

    planCard(info),
    dataCard(info),

    h('section', { class: 'as-section' }, h('h2', { class: 'as-h2' }, 'Опасная зона'),
      h('div', { class: 'as-card' },
        row('Сбросить весь прогресс', 'Все отметки, заметки и история будут удалены. Резервная копия сохранится.',
          h('button', { class: 'as-btn as-btn--danger', onclick: reset }, 'Сбросить весь прогресс…')))));
  return 'Настройки';
}

function planCard(info) {
  const rep = info.lastSync;
  return card('План',
    row('Версия плана', `${info.stages} этапов, ${info.blocks} блоков, ${info.themes} тем, ${info.lessons} уроков` + (info.syncedAt ? ` · синхронизация ${info.syncedAt}` : ''),
      h('span', { class: 'as-mono as-muted', style: { fontSize: '13px' } }, info.version)),
    row('Источник', info.source === 'embedded' ? 'Встроенный план.' : info.source,
      h('button', { class: 'as-btn as-btn--secondary', onclick: async () => {
        try {
          const r = await api.ReloadPlanFromDir();
          if (!r.version) return;
          toast({ title: 'План обновлён', body: `Новых уроков: ${r.added}. Перенесено: ${r.moved}.` });
          await refresh();
        } catch (e) { toast({ title: e.message.includes('план') ? e.message : 'Не удалось прочитать план из папки. Проверьте, что в ней лежат файлы этапов', kind: 'streak' }); }
      } }, icon('folder'), 'Обновить план из папки…')),
    rep && (rep.moved || rep.orphans) ? h('div', { class: 'as-banner' }, `Последняя синхронизация: перенесено ${rep.moved}, без пары ${rep.orphans}.`) : null,
    info.orphans.length ? h('div', { class: 'as-setting', style: { flexDirection: 'column', alignItems: 'stretch' } },
      h('div', { class: 'as-setting__text' }, h('div', { class: 'as-setting__label' }, 'Уроки, которых больше нет в плане'),
        h('div', { class: 'as-setting__hint' }, 'У них был прогресс. Перенесите его на новый урок или оставьте как есть.')),
      info.orphans.map((o) => h('div', { class: 'as-rowx as-rowx--between', style: { flexWrap: 'nowrap', padding: '4px 0' } },
        h('div', { style: { minWidth: 0 } }, h('span', { class: 'as-mono as-subtle', style: { fontSize: '12px', marginRight: '8px' } }, o.id), h('span', { class: 'as-clamp1' }, o.title)),
        h('button', { class: 'as-btn as-btn--ghost as-btn--sm', onclick: () => adopt(o) }, 'Перенести прогресс на…')))) : null);
}

function adopt(o) {
  const input = h('input', { class: 'as-input', placeholder: 'ID урока, например GO-7.3.4', 'aria-label': 'ID урока' });
  openDialog({ title: 'Перенести прогресс', body: h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, h('p', { class: 'as-p-callout', style: { fontSize: '15px', lineHeight: '22px' } }, `Прогресс урока «${o.title}» будет записан на выбранный урок.`), input),
    actions: [{ label: 'Отмена', onClick: (d) => d.close() }, { label: 'Перенести', kind: 'primary', onClick: async (d) => { try { await api.AdoptOrphan(o.id, input.value.trim()); d.close(); toast({ title: 'Прогресс перенесён' }); emit(); } catch { toast({ title: 'Такого урока нет в плане', kind: 'streak' }); } } }] });
}

function dataCard(info) {
  const ok = (t, b) => toast({ title: t, body: b });
  return card('Данные',
    row('Резервная копия', 'При запуске раз в день копия делается сама, хранятся 14 последних.',
      h('button', { class: 'as-btn as-btn--secondary', onclick: async () => { try { const p = await api.BackupNow(); ok('Резервная копия сохранена', p.split(/[\\/]/).pop()); } catch { toastError(); } } }, 'Сделать копию')),
    row('Папка данных', null, h('span', { class: 'as-mono as-muted', style: { fontSize: '12px', overflowWrap: 'anywhere', textAlign: 'right', maxWidth: '320px' } }, info.dataDir)),
    row('Экспорт JSON', 'Версия плана, настройки и все отметки.',
      h('button', { class: 'as-btn as-btn--secondary', onclick: async () => { try { const p = await api.ExportJSON(); if (p) ok('Экспорт сохранён', p.split(/[\\/]/).pop()); } catch (e) { toastError(e.message); } } }, 'Экспорт…')),
    row('План с отметками для Obsidian', 'Копия файлов плана, где у пройденного стоит [x]. Исходные файлы не меняются.',
      h('button', { class: 'as-btn as-btn--secondary', onclick: async () => { try { const p = await api.ExportMarkdown(); if (p) ok('План сохранён', p.split(/[\\/]/).pop()); } catch (e) { toastError(e.message); } } }, 'Экспорт…')),
    info.demo ? row('Демо-данные', 'Только сборка для разработки: заполнит историю за шесть недель.',
      h('button', { class: 'as-btn as-btn--secondary', onclick: async () => { await api.FillDemo(); toast({ title: 'Демо-данные добавлены' }); await refresh(); } }, 'Заполнить демо-данными')) : null);
}

async function reset() {
  const w = await confirmDialog({ title: 'Сбросить весь прогресс', text: 'Все отметки, заметки и история будут удалены. Резервная копия сохранится. Чтобы продолжить, введите слово «сбросить».', confirmLabel: 'Сбросить', danger: true, word: 'сбросить' });
  if (!w) return;
  try {
    await api.ResetProgress(w);
    S.settings.onboarded = '0';
    toast({ title: 'Прогресс сброшен', body: 'Резервная копия сохранена.' });
    await refresh();
    const { runOnboarding } = await import('./onboarding.js');
    runOnboarding();
  } catch (e) { toastError(e.message); }
}
