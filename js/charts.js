// Gráfico de radar en SVG para los atributos del personaje.
import { esc } from './util.js';

export function radarSVG(items, max) {
  const size = 320;
  const c = size / 2;
  const r = 100;
  const n = items.length;
  const pt = (i, f) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(ang) * r * f, c + Math.sin(ang) * r * f];
  };
  const poly = (f) => items.map((_, i) => pt(i, f).map((v) => v.toFixed(1)).join(',')).join(' ');

  const rings = [0.25, 0.5, 0.75, 1]
    .map((f) => `<polygon points="${poly(f)}" class="radar-ring"/>`)
    .join('');
  const axes = items
    .map((_, i) => {
      const [x, y] = pt(i, 1);
      return `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="radar-axis"/>`;
    })
    .join('');
  const data = items
    .map((it, i) => pt(i, Math.max(0.02, Math.min(1, it.value / max))).map((v) => v.toFixed(1)).join(','))
    .join(' ');
  const dots = items
    .map((it, i) => {
      const [x, y] = pt(i, Math.max(0.02, Math.min(1, it.value / max)));
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${esc(it.color)}"/>`;
    })
    .join('');
  const labels = items
    .map((it, i) => {
      const [x, y] = pt(i, 1.28);
      const cos = Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n);
      const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" class="radar-label">
        <tspan>${esc(it.emoji)} ${esc(it.label)}</tspan>
        <tspan x="${x.toFixed(1)}" dy="15" class="radar-value">Nv ${Math.floor(it.value)}</tspan></text>`;
    })
    .join('');

  return `<svg viewBox="-56 0 ${size + 112} ${size}" class="radar" role="img" aria-label="Radar de atributos">
    ${rings}${axes}
    <polygon points="${data}" class="radar-data"/>
    ${dots}${labels}
  </svg>`;
}
