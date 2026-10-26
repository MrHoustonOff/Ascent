// Маленькое хранилище состояния с подписками.
export const S = {
  tree: null,
  settings: {},
  route: { name: 'today', arg: '' },
  skipPending: false,
  hooks: {},
};

const subs = new Set();
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const emit = () => subs.forEach((f) => f());

// Отмена последней отметки: 6 секунд.
let undoSlot = null;
export function setUndo(fn) {
  undoSlot = { fn, at: Date.now() };
}
export async function runUndo() {
  if (!undoSlot || Date.now() - undoSlot.at > 6000) return false;
  const { fn } = undoSlot;
  undoSlot = null;
  await fn();
  return true;
}

export function lsGet(key, def) {
  try { const v = localStorage.getItem(key); return v == null ? def : JSON.parse(v); } catch { return def; }
}
export function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* удобство, не данные */ }
}
