// Общие действия экранов: копирование, отметки, переходы и тосты.
import { api } from './api.js';
import { S, setUndo, emit } from './state.js';
import { toast, toastError } from './ui/toast.js';
import { showAchievements } from './ui/achwindow.js';

export function go(hash) {
  if (location.hash === hash) emit();
  else location.hash = hash;
}

// ID → маршрут. Блок: ФУНД-1; тема: ФУНД-1.1; урок: ФУНД-1.1.1 (открывает тему).
export function routeForId(id) {
  if (/^stage-\d$/.test(id)) return '#/path/' + id;
  const dots = (id.match(/\./g) || []).length;
  if (dots >= 1) return '#/path/' + id;
  return '#/path/' + id;
}

export const openId = (id) => go(routeForId(id));

export async function refresh() {
  S.tree = await api.Tree();
  emit();
}

export async function copy(kind, ref = '', quiet = false) {
  try {
    const t = await api.Copy(kind, ref);
    if (navigator.clipboard && !(window.go && window.go.app)) navigator.clipboard.writeText(t).catch(() => {}); // в Wails буфер ставит Go
    if (!quiet) toast({ title: 'Скопировано', body: t.split('\n')[0] });
    return t;
  } catch (e) {
    toast({ title: 'Не удалось скопировать. Выделите текст и нажмите Ctrl+C', kind: 'streak' });
  }
}

// Реакция на закрытие темы/блока/цель дня.
export function celebrate(p) {
  if (!p) return;
  // Одно событие — один тост: несколько поводов сводим вместе, чтобы не закрыть главную кнопку.
  // достижения — отдельным окном (очередью, если их несколько), закрытие темы или блока — тостом
  if (p.blockClosed) toast({ title: 'Блок закрыт', body: p.nextId ? 'Следующий — ' + p.nextId + '.' : '', kind: 'streak' });
  else if (p.themeClosed) toast({ title: 'Тема закрыта', body: 'Вы ответили на все вопросы темы.', kind: 'streak' });
  if ((p.achievements || []).length) showAchievements(p.achievements);
}

async function safe(fn) {
  try { return await fn(); } catch (e) { console.error(e); toastError(); }
}

export const completeLesson = (id) => safe(async () => {
  const p = await api.CompleteLesson(id);
  setUndo(async () => { await api.UndoLesson(id); await refresh(); });
  toast({ title: 'Урок отмечен', action: { label: 'Отменить', onClick: async () => { await api.UndoLesson(id); await refresh(); } } });
  S.skipPending = false;
  await refresh();
  celebrate(p);
});

export const undoLesson = (id) => safe(async () => { await api.UndoLesson(id); await refresh(); });

export const startLesson = (id) => safe(async () => {
  await api.StartLesson(id);
  const t = await api.Copy('lesson', id);
  toast({ title: 'Скопировано', body: t.split('\n')[0] });
  await refresh();
});

export const setCheck = (theme, n, done) => safe(async () => {
  const p = await api.SetCheck(theme, n, done);
  if (done) setUndo(async () => { await api.SetCheck(theme, n, false); await refresh(); });
  await refresh();
  celebrate(p);
});

export const setChecksAll = (theme, done) => safe(async () => {
  const p = await api.SetChecksAll(theme, done);
  await refresh();
  celebrate(p);
});

export const setMarker = (block, n, done) => safe(async () => {
  const p = await api.SetMarker(block, n, done);
  if (done) setUndo(async () => { await api.SetMarker(block, n, false); await refresh(); });
  await refresh();
  celebrate(p);
});

export const rest = () => safe(async () => {
  await api.RestToday();
  toast({ title: 'Один день отдыха сохранён', kind: 'streak' });
  await refresh();
});
