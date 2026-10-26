import { api } from '../api.js';
import { S } from '../state.js';
import { h, clear } from '../ui/dom.js';
import { openDialog } from '../ui/dialog.js';
import { go, refresh } from '../actions.js';
import { toast } from '../ui/toast.js';

// Мастер первого запуска: три шага, на каждом одна главная кнопка.
export function runOnboarding() {
  const st = { date: '', theme: S.settings.theme || 'system', upTo: null };
  let step = 1, dlg;
  const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '168px' } });

  const dots = () => h('div', { class: 'as-rowx', style: { gap: '6px' }, 'aria-label': `Шаг ${step} из 3` }, [1, 2, 3].map((i) =>
    h('span', { style: { width: '6px', height: '6px', borderRadius: '50%', background: i === step ? 'var(--accent)' : 'var(--line-strong)', display: 'inline-block' } })));

  const choice = (label, on, onClick) => h('button', { class: 'as-btn as-btn--secondary' + (on ? ' is-selected' : ''), 'aria-pressed': String(on), onclick: onClick }, label);

  async function paint() {
    clear(body);
    const actions = dlg.el.querySelector('.as-dialog__actions');
    const title = dlg.el.querySelector('.as-dialog__title');
    if (step === 1) {
      title.textContent = 'Добро пожаловать в Ascent';
      const info = await api.PlanInfo();
      body.append(h('p', { class: 'as-p-callout', style: { fontSize: '15px', lineHeight: '22px' } }, `Здесь весь ваш план: ${info.lessons} урока, ${info.stages} этапов. Приложение хранит прогресс и спокойно показывает темп. Подгонять вас оно не будет.`),
        h('div', { class: 'as-field', style: { minWidth: 0 } }, h('div', { class: 'as-label' }, 'Оформление'),
          h('div', { class: 'as-tabs', style: { alignSelf: 'flex-start' } }, [['light', 'Светлая'], ['dark', 'Тёмная'], ['system', 'Как в системе']].map(([k, l]) =>
            h('button', { class: 'as-tab' + (st.theme === k ? ' is-active' : ''), onclick: async (e) => {
              st.theme = k; await api.SetSetting('theme', k); S.settings.theme = k; S.hooks.applyTheme();
              [...e.target.parentNode.children].forEach((c) => c.classList.toggle('is-active', c === e.target));
            } }, l)))));
    } else if (step === 2) {
      title.textContent = 'Есть желаемая дата?';
      const inp = h('input', { class: 'as-input', type: 'date', value: st.date || '', 'aria-label': 'Желаемая дата', style: { width: '190px' } });
      inp.addEventListener('change', () => { st.date = inp.value; });
      body.append(
        h('p', { class: 'as-p-callout', style: { fontSize: '15px', lineHeight: '22px' } }, 'Норм и дневных целей здесь нет: темп посчитается сам по тому, как вы закрываете темы.'),
        h('p', { class: 'as-p-callout', style: { fontSize: '15px', lineHeight: '22px' } }, 'Если хочется дойти до собесов к определённому дню — укажите его. Приложение мягко подскажет, сколько тем в день к нему приведёт. Можно пропустить и вернуться к этому позже.'),
        h('div', { class: 'as-field', style: { minWidth: 0 } }, h('label', { class: 'as-label' }, 'Дойти до собесов к'), inp));
    } else {
      title.textContent = 'Вы уже прошли часть плана?';
      const res = h('div', { class: 'as-palette__list', style: { maxHeight: '160px' } });
      const inp = h('input', { class: 'as-input', placeholder: 'Урок, с которого продолжить: GO-7 или слово', 'aria-label': 'Поиск урока', style: { display: st.mode === 'mark' ? 'block' : 'none' } });
      const sel = h('div', { class: 'as-p-callout' }, '');
      const a = h('div', { class: 'as-rowx' }, choice('Начинаю с первого урока', st.mode !== 'mark', () => { st.mode = 'first'; st.upTo = null; paint(); }),
        choice('Отметить пройденное до урока…', st.mode === 'mark', () => { st.mode = 'mark'; paint(); }));
      body.append(a);
      if (st.mode === 'mark') {
        body.append(inp, res, sel);
        let seq = 0;
        const show = () => { sel.textContent = st.upTo ? `Будет отмечено пройденным всё до урока ${st.upTo.id} «${st.upTo.title}». Это не попадёт в темп и статистику.` : ''; };
        inp.addEventListener('input', async () => {
          const my = ++seq; const r = (await api.Search(inp.value)).filter((x) => x.kind === 'lesson'); if (my !== seq) return;
          clear(res);
          r.slice(0, 20).forEach((x) => res.append(h('div', { class: 'as-nav-item' + (st.upTo && st.upTo.id === x.id ? ' is-active' : ''), onclick: () => { st.upTo = x; show(); [...res.children].forEach((c) => c.classList.remove('is-active')); }, },
            h('span', { class: 'as-nav-text' }, h('span', { class: 'as-nav-id' }, x.id), x.title))));
        });
        inp.focus();
      }
    }
    actions.replaceChildren(
      step > 1 ? h('button', { class: 'as-btn as-btn--ghost', onclick: () => { step--; paint(); } }, 'Назад') : h('span'),
      h('div', { style: { flex: 1 } }),
      dots(),
      h('button', { class: 'as-btn as-btn--primary', onclick: next }, step < 3 ? 'Дальше' : 'Начать'));
    actions.style.alignItems = 'center';
    actions.style.justifyContent = 'flex-start';
  }

  async function next() {
    if (step < 3) { step++; paint(); return; }
    try {
      if (st.date) { await api.SetSetting('target_scope', 'milestone'); await api.SetSetting('milestone_target', st.date); S.settings.milestone_target = st.date; }
      if (st.mode === 'mark' && st.upTo) { const n = await api.MarkDoneUpTo(st.upTo.id); toast({ title: 'Пройденное отмечено', body: `Уроков: ${n}.` }); }
      await api.SetSetting('onboarded', '1');
      S.settings.onboarded = '1';
    } catch (e) { console.error(e); }
    dlg.close();
    go('#/today');
    await refresh();
  }

  dlg = openDialog({ title: '…', body, actions: [{ label: '.' }], cls: 'as-onboarding', onClose: async () => { if (S.settings.onboarded !== '1') { await api.SetSetting('onboarded', '1').catch(() => {}); S.settings.onboarded = '1'; } } });
  paint();
}
