// Итоги Anki: разбор JSON расширения «Итоги периода (JSON)» и проверка полей.
// Ничего не досчитываем сверх того, что есть в файле: только производные из гайда (показов на карточку, секунд на ответ).
const INTS = ['unique_cards_reviewed', 'total_reviews', 'new_cards_created', 'new_cards_first_studied', 'deck_streak_days', 'deck_longest_streak_days'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// parseAnki(text) → { ok: true, data } | { ok: false, error }
export function parseAnki(text) {
  let j;
  try { j = JSON.parse(String(text).trim()); } catch { return { ok: false, error: 'Это не JSON — проверьте, что вставлен файл целиком.' }; }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { ok: false, error: 'Ожидается объект с полями итогов Anki.' };
  for (const k of ['period_from', 'period_to']) if (typeof j[k] !== 'string' || !DATE.test(j[k])) return { ok: false, error: `Поле ${k}: нужна дата ГГГГ-ММ-ДД.` };
  if (j.period_from > j.period_to) return { ok: false, error: 'period_from позже period_to.' };
  if (typeof j.deck !== 'string' || !j.deck.trim()) return { ok: false, error: 'Поле deck: нужно имя колоды.' };
  for (const k of INTS) if (!Number.isInteger(j[k]) || j[k] < 0) return { ok: false, error: `Поле ${k}: нужно целое число ≥ 0.` };
  if (typeof j.minutes_spent !== 'number' || !(j.minutes_spent >= 0)) return { ok: false, error: 'Поле minutes_spent: нужно число ≥ 0.' };
  const data = { period_from: j.period_from, period_to: j.period_to, deck: j.deck.trim(), minutes_spent: Math.round(j.minutes_spent * 10) / 10 };
  for (const k of INTS) data[k] = j[k];
  return { ok: true, data };
}

// производные значения и подписи периода
const MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const day = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const gen = (t) => `${t.getDate()} ${MON[t.getMonth()]}`;
export function ankiInfo(a) {
  const f = day(a.period_from), t = day(a.period_to);
  const days = Math.round((t - f) / 864e5) + 1;
  return {
    days,
    old: Math.max(0, a.unique_cards_reviewed - a.new_cards_first_studied), // уже знакомые карточки
    kicker: days === 1 ? 'ANKI · ИТОГИ ДНЯ' : days === 7 ? 'ANKI · ИТОГИ НЕДЕЛИ' : 'ANKI · ИТОГИ ПЕРИОДА',
    period: days === 1 ? `${WD[f.getDay()]}, ${gen(f)}` : `${gen(f)} — ${gen(t)}`,
    short: days === 1 ? `${f.getDate()}.${String(f.getMonth() + 1).padStart(2, '0')}` : `${f.getDate()}.${String(f.getMonth() + 1).padStart(2, '0')}–${t.getDate()}.${String(t.getMonth() + 1).padStart(2, '0')}`,
    perCard: a.unique_cards_reviewed ? a.total_reviews / a.unique_cards_reviewed : 0,
    secPer: a.total_reviews ? a.minutes_spent * 60 / a.total_reviews : 0,
  };
}
