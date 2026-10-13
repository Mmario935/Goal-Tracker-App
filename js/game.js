// Reglas del juego: XP, niveles, rachas y multiplicadores.
import { TITLES } from './data.js';
import { addDays } from './util.js';

export const ATTR_LEVEL_BASE = 100;
export const CHAR_LEVEL_BASE = 300;

// Subir del nivel N al N+1 cuesta base × N^1.5 XP.
export function levelInfo(xp, base = ATTR_LEVEL_BASE) {
  let level = 1;
  let rest = Math.max(0, xp);
  let cost = base;
  for (;;) {
    cost = Math.round(base * level ** 1.5);
    if (rest < cost) break;
    rest -= cost;
    level++;
  }
  return { level, into: rest, needed: cost, pct: rest / cost };
}

export function streakMultiplier(days) {
  if (days >= 30) return 1.5;
  if (days >= 14) return 1.35;
  if (days >= 7) return 1.25;
  if (days >= 3) return 1.1;
  return 1;
}

export const isNegative = (activity) => Object.values(activity.effects).some((v) => v < 0);

// Mapa activityId → Set de fechas con registro.
export function datesByActivity(logs) {
  const map = new Map();
  for (const l of logs) {
    if (!map.has(l.activityId)) map.set(l.activityId, new Set());
    map.get(l.activityId).add(l.date);
  }
  return map;
}

// Racha vigente a la fecha: incluye ese día si tiene registro; si no, la que termina el día anterior.
export function currentStreak(dates, date) {
  if (!dates) return 0;
  let d = dates.has(date) ? date : addDays(date, -1);
  let n = 0;
  while (dates.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

// XP que otorga registrar una actividad en una fecha (se guarda en el log como foto fija).
export function computeLogXp(logs, activity, date) {
  const sameDay = logs.filter((l) => l.activityId === activity.id && l.date === date).length;
  const negative = isNegative(activity);
  let streak = 0;
  if (!negative) {
    const dates = datesByActivity(logs).get(activity.id) ?? new Set();
    let d = addDays(date, -1);
    while (dates.has(d)) {
      streak++;
      d = addDays(d, -1);
    }
    streak += 1;
  }
  const mult = negative ? 1 : streakMultiplier(streak);
  const dim = activity.diminishing ? 0.5 ** sameDay : 1;
  const xp = {};
  for (const [attr, v] of Object.entries(activity.effects)) {
    if (!v) continue;
    xp[attr] = v > 0 ? Math.max(1, Math.round(v * mult * dim)) : v;
  }
  return { xp, streak, mult, dim };
}

export function attrTotals(logs) {
  const totals = {};
  for (const l of logs) {
    for (const [a, v] of Object.entries(l.xp)) totals[a] = (totals[a] || 0) + v;
  }
  return totals;
}

export function character(state) {
  const totals = attrTotals(state.logs);
  const attrs = state.attributes.map((a) => {
    const xp = Math.max(0, totals[a.id] || 0);
    return { ...a, xp, ...levelInfo(xp) };
  });
  const totalXp = attrs.reduce((s, a) => s + a.xp, 0);
  const info = levelInfo(totalXp, CHAR_LEVEL_BASE);
  const title = [...TITLES].reverse().find(([min]) => info.level >= min)[1];
  const top = attrs.reduce((best, a) => (a.xp > best.xp ? a : best), attrs[0]);
  const cls = top && top.xp > 0 ? top.cls : 'Sin clase';
  return { attrs, totalXp, ...info, title, cls };
}
