export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Fechas como claves locales "YYYY-MM-DD" (comparables como texto).
export function toKey(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export const todayKey = () => toKey(new Date());

export function daysBetween(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}

export function fmtDate(key, opts = { weekday: 'long', day: 'numeric', month: 'short' }) {
  return fromKey(key).toLocaleDateString('es', opts);
}

export const fmtNum = (n) => Math.round(n).toLocaleString('es');

export function fmtSigned(n) {
  return (n > 0 ? '+' : '') + fmtNum(n);
}

export function fmtMinutes(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function fmtHours(min) {
  return `${(min / 60).toLocaleString('es', { maximumFractionDigits: 1 })} h`;
}
