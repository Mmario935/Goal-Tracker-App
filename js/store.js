// Estado de la app guardado en el propio dispositivo (localStorage).
import { DEFAULT_ACTIVITIES, DEFAULT_ATTRIBUTES } from './data.js';
import { computeLogXp } from './game.js';
import { uid } from './util.js';

const KEY = 'rpg-goals-track:v1';
const clone = (o) => JSON.parse(JSON.stringify(o));
const listeners = new Set();
let state;

function defaults() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    profile: { name: 'Aventurero', avatar: '🧙' },
    attributes: clone(DEFAULT_ATTRIBUTES),
    activities: clone(DEFAULT_ACTIVITIES),
    logs: [],
  };
}

function normalize(s) {
  const d = defaults();
  return {
    ...d,
    ...s,
    profile: { ...d.profile, ...s.profile },
    attributes: s.attributes?.length ? s.attributes : d.attributes,
    activities: Array.isArray(s.activities) ? s.activities : d.activities,
    logs: Array.isArray(s.logs) ? s.logs : [],
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? normalize(JSON.parse(raw)) : defaults();
  } catch {
    state = defaults();
  }
  return state;
}

export const getState = () => state;

export function subscribe(fn) {
  listeners.add(fn);
}

function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('No se pudo guardar', e);
  }
  listeners.forEach((fn) => fn(state));
}

export const activityById = (id) => state.activities.find((a) => a.id === id);

export function addLog(activityId, date) {
  const activity = activityById(activityId);
  const { xp, streak, mult, dim } = computeLogXp(state.logs, activity, date);
  const log = { id: uid(), activityId, date, ts: Date.now(), xp, streak };
  state.logs.push(log);
  commit();
  return { log, mult, dim };
}

export function removeLastLog(activityId, date) {
  for (let i = state.logs.length - 1; i >= 0; i--) {
    const l = state.logs[i];
    if (l.activityId === activityId && l.date === date) {
      state.logs.splice(i, 1);
      commit();
      return l;
    }
  }
  return null;
}

export function upsertActivity(activity) {
  const i = state.activities.findIndex((a) => a.id === activity.id);
  if (i >= 0) state.activities[i] = activity;
  else state.activities.push({ ...activity, id: activity.id || uid() });
  commit();
}

// Se archiva en vez de borrar para conservar el historial.
export function archiveActivity(id) {
  const a = activityById(id);
  if (a) a.archived = true;
  commit();
}

export function setProfile(patch) {
  state.profile = { ...state.profile, ...patch };
  commit();
}

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.logs) || !Array.isArray(parsed.activities)) {
    throw new Error('El archivo no parece un respaldo válido.');
  }
  state = normalize(parsed);
  commit();
}

export function reset() {
  state = defaults();
  commit();
}
