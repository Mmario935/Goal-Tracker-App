// Estado de la app guardado en el propio dispositivo (localStorage).
import { DEFAULT_ATTRIBUTES, DEFAULT_FAVORITES, subInfo } from './data.js';
import { computeLogXp } from './game.js';
import { uid } from './util.js';

const KEY = 'rpg-goals-track:v1';
const VERSION = 2;
const clone = (o) => JSON.parse(JSON.stringify(o));
const listeners = new Set();
let state;

function defaults() {
  return {
    version: VERSION,
    createdAt: new Date().toISOString(),
    profile: { name: 'Novato', avatar: '🎭' },
    attributes: clone(DEFAULT_ATTRIBUTES),
    favorites: clone(DEFAULT_FAVORITES),
    logs: [],
  };
}

// v1 tenía actividades con XP manual; se convierten a subcategorías conservando la XP ya ganada.
const V1_MAP = {
  madrugar: ['rutina.madrugar', 1], dormir: ['rutina.dormir', 1], ejercicio: ['deporte.fuerza', 60],
  cocinar: ['hogar.cocinar', 1], jornada: ['carrera.jornada', 1], databricks: ['estudio.curso', 30],
  leer: ['estudio.lectura', 60], postular: ['carrera.postulacion', 1], linkedin: ['carrera.networking', 1],
  ocio: ['ocio.videojuegos', 60], hobby: ['ocio.hobby', 60], social: ['ocio.social', 60],
  trasnochar: ['tentacion.trasnochar', 1], delivery: ['tentacion.delivery', 1], scroll: ['tentacion.scroll', 60],
};

function migrateV1(s) {
  const names = Object.fromEntries((s.activities || []).map((a) => [a.id, a]));
  const logs = (s.logs || []).map((l) => {
    const [sub, qty] = V1_MAP[l.activityId] ?? ['otros', 1];
    const old = names[l.activityId];
    return {
      id: l.id, date: l.date, ts: l.ts, sub, key: sub, qty,
      name: old?.name ?? subInfo(sub).name, emoji: old?.emoji ?? subInfo(sub).emoji,
      xp: l.xp, streak: l.streak,
    };
  });
  return { ...s, version: VERSION, favorites: clone(DEFAULT_FAVORITES), logs, activities: undefined };
}

function normalize(s) {
  const d = defaults();
  const src = (s.version ?? 1) < 2 ? migrateV1(s) : s;
  const profile = { ...d.profile, ...src.profile };
  if (profile.avatar === '🧙') profile.avatar = d.profile.avatar; // avatar por defecto anterior
  return {
    ...d,
    ...src,
    profile,
    // Los atributos no se editan desde la app: siempre se usan los del catálogo (colores y arcanos al día).
    attributes: d.attributes,
    favorites: Array.isArray(src.favorites) ? src.favorites : d.favorites,
    logs: Array.isArray(src.logs) ? src.logs : [],
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

export const favoriteById = (id) => state.favorites.find((f) => f.id === id);

// La clave de racha es la actividad frecuente si existe; si no, la subcategoría.
export function addLog({ sub: subId, favId, name, emoji, qty, note, date }) {
  const sub = subInfo(subId);
  const key = favId || subId;
  const amount = sub.mode === 'check' ? 1 : qty;
  const { xp, streak, mult, reduced } = computeLogXp(state.logs, sub, amount, date, key);
  const log = {
    id: uid(), date, ts: Date.now(), sub: subId, key, qty: amount,
    name: name || sub.name, emoji: emoji || sub.emoji, xp, streak,
  };
  if (favId) log.favId = favId;
  if (note) log.note = note;
  state.logs.push(log);
  commit();
  return { log, mult, reduced };
}

export function findLog(key, date) {
  return state.logs.find((l) => l.key === key && l.date === date);
}

export function removeLog(id) {
  const i = state.logs.findIndex((l) => l.id === id);
  if (i < 0) return null;
  const [log] = state.logs.splice(i, 1);
  commit();
  return log;
}

export function upsertFavorite(fav) {
  const i = state.favorites.findIndex((f) => f.id === fav.id);
  const saved = { ...fav, id: fav.id || uid() };
  if (i >= 0) state.favorites[i] = saved;
  else state.favorites.push(saved);
  commit();
  return saved;
}

// Se archiva en vez de borrar para conservar rachas e historial.
export function archiveFavorite(id) {
  const f = favoriteById(id);
  if (f) f.archived = true;
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
  if (!parsed || !Array.isArray(parsed.logs)) {
    throw new Error('El archivo no parece un respaldo válido.');
  }
  state = normalize(parsed);
  commit();
}

export function reset() {
  state = defaults();
  commit();
}
