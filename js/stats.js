// Agregaciones por periodo (día, semana, mes) para las comparativas.
import { addDays, fmtDate, fromKey, toKey } from './util.js';

export const PERIODS = {
  day: { label: 'Día', prev: 'día anterior', ofPrev: 'del día anterior' },
  week: { label: 'Semana', prev: 'semana anterior', ofPrev: 'de la semana anterior' },
  month: { label: 'Mes', prev: 'mes anterior', ofPrev: 'del mes anterior' },
};

// Rango del periodo que contiene `ref`, desplazado `offset` periodos.
export function periodRange(type, ref, offset = 0) {
  const d = fromKey(ref);
  if (type === 'day') {
    d.setDate(d.getDate() + offset);
    const k = toKey(d);
    return { start: k, end: k };
  }
  if (type === 'week') {
    const dow = (d.getDay() + 6) % 7; // lunes = 0
    d.setDate(d.getDate() - dow + offset * 7);
    const start = toKey(d);
    return { start, end: addDays(start, 6) };
  }
  const start = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  const end = new Date(d.getFullYear(), d.getMonth() + offset + 1, 0);
  return { start: toKey(start), end: toKey(end) };
}

export function periodLabel(type, range) {
  if (type === 'day') return fmtDate(range.start);
  if (type === 'week') {
    const s = fmtDate(range.start, { day: 'numeric', month: 'short' });
    const e = fmtDate(range.end, { day: 'numeric', month: 'short' });
    return `${s} – ${e}`;
  }
  return fmtDate(range.start, { month: 'long', year: 'numeric' });
}

export function shortLabel(type, range) {
  if (type === 'day') return fmtDate(range.start, { weekday: 'narrow' });
  if (type === 'week') return fmtDate(range.start, { day: 'numeric', month: 'numeric' });
  return fmtDate(range.start, { month: 'short' });
}

export function sumRange(logs, { start, end }) {
  const by = {};
  const counts = {};
  let total = 0;
  let count = 0;
  for (const l of logs) {
    if (l.date < start || l.date > end) continue;
    count++;
    counts[l.activityId] = (counts[l.activityId] || 0) + 1;
    for (const [a, v] of Object.entries(l.xp)) {
      by[a] = (by[a] || 0) + v;
      total += v;
    }
  }
  return { total, by, count, counts };
}

// Días del rango ya transcurridos (para promedios justos en periodos en curso).
export function elapsedDays({ start, end }, today) {
  if (today < start) return 0;
  const last = today < end ? today : end;
  return Math.round((fromKey(last) - fromKey(start)) / 86400000) + 1;
}

export function dailyTotals(logs) {
  const map = new Map();
  for (const l of logs) {
    const v = Object.values(l.xp).reduce((s, x) => s + x, 0);
    map.set(l.date, (map.get(l.date) || 0) + v);
  }
  return map;
}

export function deltaPct(cur, prev) {
  if (!prev) return cur > 0 ? null : 0;
  return ((cur - prev) / Math.abs(prev)) * 100;
}
