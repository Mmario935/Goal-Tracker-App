import * as store from './store.js';
import { radarSVG } from './charts.js';
import { ATTR_LEVEL_BASE, character, currentStreak, datesByActivity, isNegative } from './game.js';
import {
  PERIODS, dailyTotals, deltaPct, elapsedDays, periodLabel, periodRange, shortLabel, sumRange,
} from './stats.js';
import { addDays, esc, fmtDate, fmtNum, fmtSigned, todayKey, uid } from './util.js';

const ui = { view: 'today', date: todayKey(), period: 'week', offset: 0 };
const main = document.getElementById('main');
const dialog = document.getElementById('dialog');
const toastEl = document.getElementById('toast');

// ---------- Helpers de vista ----------

const attrMap = (s) => Object.fromEntries(s.attributes.map((a) => [a.id, a]));

function fxChips(xp, attrs) {
  return Object.entries(xp)
    .filter(([, v]) => v)
    .map(([a, v]) => `<span class="fx ${v < 0 ? 'fx-neg' : ''}">${esc(attrs[a]?.emoji ?? a)}${fmtSigned(v)}</span>`)
    .join('');
}

function bar(pct, color) {
  return `<div class="bar"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, pct * 100)).toFixed(1)}%;background:${esc(color)}"></div></div>`;
}

function deltaBadge(cur, prev) {
  const d = deltaPct(cur, prev);
  if (d === null) return '<span class="delta up">nuevo</span>';
  if (Math.abs(d) < 0.5) return '<span class="delta">=</span>';
  return `<span class="delta ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(0)}%</span>`;
}

function heroCard(s, ch) {
  return `<section class="card hero">
    <div class="avatar">${esc(s.profile.avatar)}</div>
    <div class="hero-body">
      <div class="hero-name">${esc(s.profile.name)}</div>
      <div class="hero-sub">${esc(ch.title)} · ${esc(ch.cls)}</div>
      <div class="hero-level"><span>Nivel ${ch.level}</span><span class="muted">${fmtNum(ch.into)} / ${fmtNum(ch.needed)} XP</span></div>
      ${bar(ch.pct, 'var(--gold)')}
    </div>
  </section>`;
}

// ---------- Vista: Hoy ----------

function viewToday(s) {
  const ch = character(s);
  const attrs = attrMap(s);
  const date = ui.date;
  const isToday = date === todayKey();
  const dayLogs = s.logs.filter((l) => l.date === date);
  const daySum = sumRange(dayLogs, { start: date, end: date });
  const dates = datesByActivity(s.logs);
  const active = s.activities.filter((a) => !a.archived);

  const row = (a) => {
    const count = daySum.counts[a.id] || 0;
    const neg = isNegative(a);
    const streak = neg ? 0 : currentStreak(dates.get(a.id), date);
    const meta = [
      streak >= 2 ? `<span class="streak">🔥${streak}</span>` : '',
      count ? `<span class="count">${a.repeatable ? `×${count}` : '✓'}</span>` : '',
    ].join('');
    return `<div class="act ${count ? 'done' : ''} ${neg ? 'neg' : ''}">
      <button class="act-main" data-action="log" data-id="${esc(a.id)}">
        <span class="act-emoji">${esc(a.emoji)}</span>
        <span class="act-body"><span class="act-name">${esc(a.name)}</span><span class="act-fx">${fxChips(a.effects, attrs)}</span></span>
        <span class="act-meta">${meta}</span>
      </button>
      ${a.repeatable && count ? `<button class="act-undo" data-action="unlog" data-id="${esc(a.id)}" aria-label="Quitar uno">−</button>` : ''}
    </div>`;
  };

  // Agrupa las actividades positivas por su atributo principal.
  const groups = s.attributes.map((attr) => ({ attr, items: [] }));
  const negatives = [];
  for (const a of active) {
    if (isNegative(a)) {
      negatives.push(a);
      continue;
    }
    const [mainAttr] = Object.entries(a.effects).sort((x, y) => y[1] - x[1])[0] ?? [];
    (groups.find((g) => g.attr.id === mainAttr) ?? groups[0]).items.push(a);
  }

  return `${heroCard(s, ch)}
    <div class="date-nav">
      <button class="icon-btn" data-action="date" data-step="-1" aria-label="Día anterior">‹</button>
      <button class="date-label" data-action="date" data-step="0">${isToday ? 'Hoy · ' : ''}${esc(fmtDate(date))}</button>
      <button class="icon-btn" data-action="date" data-step="1" ${isToday ? 'disabled' : ''} aria-label="Día siguiente">›</button>
    </div>
    <section class="card day-summary">
      <div class="day-xp"><span class="muted">XP del día</span><strong class="${daySum.total < 0 ? 'neg-text' : ''}">${fmtSigned(daySum.total)}</strong></div>
      <div class="chips">${fxChips(daySum.by, attrs) || '<span class="muted">Toca una actividad para registrarla.</span>'}</div>
    </section>
    ${groups.filter((g) => g.items.length).map((g) => `
      <h3 class="group-title" style="--c:${esc(g.attr.color)}">${esc(g.attr.emoji)} ${esc(g.attr.name)}</h3>
      <div class="act-list">${g.items.map(row).join('')}</div>`).join('')}
    ${negatives.length ? `<h3 class="group-title neg-title">😈 Tentaciones <span class="muted">(restan XP)</span></h3>
      <div class="act-list">${negatives.map(row).join('')}</div>` : ''}`;
}

// ---------- Vista: Personaje ----------

function viewCharacter(s) {
  const ch = character(s);
  const values = ch.attrs.map((a) => ({ label: a.name, emoji: a.emoji, color: a.color, value: a.level + a.pct - 1 }));
  const max = Math.max(4, Math.ceil(Math.max(...values.map((v) => v.value)) + 1));
  const dates = datesByActivity(s.logs);
  const today = todayKey();
  const streaks = s.activities
    .filter((a) => !a.archived && !isNegative(a))
    .map((a) => ({ a, n: currentStreak(dates.get(a.id), today) }))
    .filter((x) => x.n >= 2)
    .sort((x, y) => y.n - x.n);

  return `${heroCard(s, ch)}
    <section class="card">
      <h2>Atributos</h2>
      ${radarSVG(values, max)}
    </section>
    <section class="attr-grid">
      ${ch.attrs.map((a) => `<div class="card attr-card" style="--c:${esc(a.color)}">
        <div class="attr-head"><span>${esc(a.emoji)} ${esc(a.name)}</span><strong>Nv ${a.level}</strong></div>
        ${bar(a.pct, a.color)}
        <div class="muted small">${fmtNum(a.into)} / ${fmtNum(a.needed)} XP · total ${fmtNum(a.xp)}</div>
      </div>`).join('')}
    </section>
    <section class="card">
      <h2>Rachas activas</h2>
      ${streaks.length ? `<ul class="streak-list">${streaks.map(({ a, n }) => `<li><span>${esc(a.emoji)} ${esc(a.name)}</span><span class="streak">🔥 ${n} días</span></li>`).join('')}</ul>`
        : '<p class="muted">Repite una actividad dos días seguidos para empezar una racha. Con 3, 7, 14 y 30 días ganas multiplicadores de XP.</p>'}
    </section>`;
}

// ---------- Vista: Estadísticas ----------

function viewStats(s) {
  const attrs = attrMap(s);
  const today = todayKey();
  const type = ui.period;
  const cur = periodRange(type, today, ui.offset);
  const inProgress = cur.end >= today;
  const curDays = elapsedDays(cur, today) || 1;
  // Si el periodo está en curso, se compara contra el mismo tramo del anterior (ej. lun–mar vs lun–mar).
  const prevFull = periodRange(type, today, ui.offset - 1);
  const prevEnd = addDays(prevFull.start, curDays - 1);
  const prev = inProgress ? { start: prevFull.start, end: prevEnd < prevFull.end ? prevEnd : prevFull.end } : prevFull;
  const prevDays = elapsedDays(prev, today) || 1;
  const curSum = sumRange(s.logs, cur);
  const prevSum = sumRange(s.logs, prev);
  const vsLabel = inProgress && type !== 'day' ? `mismo tramo ${PERIODS[type].ofPrev}` : PERIODS[type].prev;
  const maxAttr = Math.max(1, ...s.attributes.flatMap((a) => [curSum.by[a.id] || 0, prevSum.by[a.id] || 0]));

  const trend = Array.from({ length: 8 }, (_, i) => {
    const r = periodRange(type, today, ui.offset - 7 + i);
    return { r, total: sumRange(s.logs, r).total, current: i === 7 };
  });
  const trendMax = Math.max(1, ...trend.map((t) => Math.abs(t.total)));

  const top = Object.entries(curSum.counts)
    .map(([id, n]) => ({ a: store.activityById(id), n }))
    .filter((x) => x.a)
    .sort((x, y) => y.n - x.n)
    .slice(0, 5);

  return `<div class="segmented">
      ${Object.entries(PERIODS).map(([k, p]) => `<button data-action="period" data-period="${k}" class="${k === type ? 'on' : ''}">${p.label}</button>`).join('')}
    </div>
    <div class="date-nav">
      <button class="icon-btn" data-action="offset" data-step="-1" aria-label="Periodo anterior">‹</button>
      <button class="date-label" data-action="offset" data-step="0">${esc(periodLabel(type, cur))}${inProgress ? ' <span class="muted">(en curso)</span>' : ''}</button>
      <button class="icon-btn" data-action="offset" data-step="1" ${ui.offset >= 0 ? 'disabled' : ''} aria-label="Periodo siguiente">›</button>
    </div>
    <section class="card kpis">
      <div><span class="muted small">XP total</span><strong>${fmtSigned(curSum.total)}</strong>${deltaBadge(curSum.total, prevSum.total)}</div>
      <div><span class="muted small">Promedio diario</span><strong>${fmtNum(curSum.total / curDays)}</strong>${deltaBadge(curSum.total / curDays, prevSum.total / prevDays)}</div>
      <div><span class="muted small">Registros</span><strong>${curSum.count}</strong>${deltaBadge(curSum.count, prevSum.count)}</div>
    </section>
    <section class="card">
      <h2>Por atributo <span class="muted small">vs ${esc(vsLabel)}</span></h2>
      <div class="compare">
        ${s.attributes.map((a) => {
          const c = curSum.by[a.id] || 0;
          const p = prevSum.by[a.id] || 0;
          return `<div class="cmp-row">
            <div class="cmp-head"><span>${esc(a.emoji)} ${esc(a.name)}</span><span><strong>${fmtSigned(c)}</strong> ${deltaBadge(c, p)}</span></div>
            <div class="cmp-bars">
              <div class="cmp-bar" style="width:${(Math.max(0, c) / maxAttr) * 100}%;background:${esc(a.color)}"></div>
              <div class="cmp-bar prev" style="width:${(Math.max(0, p) / maxAttr) * 100}%"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <p class="legend"><span class="sw" style="background:var(--accent)"></span>Actual <span class="sw prev"></span>Anterior (${fmtNum(prevSum.total)} XP)</p>
    </section>
    <section class="card">
      <h2>Tendencia</h2>
      <div class="trend">
        ${trend.map((t) => `<div class="trend-col ${t.current ? 'current' : ''}">
          <span class="trend-val">${t.total ? fmtNum(t.total) : ''}</span>
          <div class="trend-bar ${t.total < 0 ? 'neg' : ''}" style="height:${(Math.abs(t.total) / trendMax) * 100}%"></div>
          <span class="trend-label">${esc(shortLabel(type, t.r))}</span>
        </div>`).join('')}
      </div>
    </section>
    <section class="card">
      <h2>Más realizadas</h2>
      ${top.length ? `<ul class="top-list">${top.map(({ a, n }) => `<li><span>${esc(a.emoji)} ${esc(a.name)}</span><span class="count">×${n}</span></li>`).join('')}</ul>`
        : '<p class="muted">Sin registros en este periodo.</p>'}
    </section>
    <section class="card">
      <h2>Constancia <span class="muted small">últimas 17 semanas</span></h2>
      ${heatmap(s, attrs)}
    </section>`;
}

function heatmap(s) {
  const today = todayKey();
  const totals = dailyTotals(s.logs);
  const start = periodRange('week', today, -16).start;
  const days = [];
  for (let d = start; d <= periodRange('week', today, 0).end; d = addDays(d, 1)) days.push(d);
  const max = Math.max(1, ...days.map((d) => totals.get(d) || 0));
  const cells = days.map((d) => {
    const v = totals.get(d) || 0;
    const lvl = d > today ? 'future' : v <= 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4));
    return `<div class="hm-cell l${lvl}" title="${esc(fmtDate(d))}: ${fmtNum(v)} XP"></div>`;
  });
  return `<div class="heatmap">${cells.join('')}</div>
    <p class="legend">Menos <span class="hm-cell l0"></span><span class="hm-cell l1"></span><span class="hm-cell l2"></span><span class="hm-cell l3"></span><span class="hm-cell l4"></span> Más</p>`;
}

// ---------- Vista: Ajustes ----------

function viewSettings(s) {
  const attrs = attrMap(s);
  const active = s.activities.filter((a) => !a.archived);
  const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  return `<section class="card">
      <h2>Perfil</h2>
      <label class="field"><span>Nombre del personaje</span><input id="profile-name" value="${esc(s.profile.name)}" maxlength="30"></label>
      <label class="field"><span>Avatar (emoji)</span><input id="profile-avatar" value="${esc(s.profile.avatar)}" maxlength="4"></label>
    </section>
    <section class="card">
      <div class="row-between"><h2>Actividades</h2><button class="btn small" data-action="edit" data-id="">+ Nueva</button></div>
      <ul class="manage-list">
        ${active.map((a) => `<li><button data-action="edit" data-id="${esc(a.id)}">
          <span>${esc(a.emoji)} ${esc(a.name)}</span><span class="act-fx">${fxChips(a.effects, attrs)}</span></button></li>`).join('')}
      </ul>
    </section>
    <section class="card">
      <h2>Datos</h2>
      <p class="muted small">Tus datos se guardan solo en este dispositivo. Exporta un respaldo de vez en cuando.</p>
      <div class="btn-row">
        <button class="btn" data-action="export">⬇️ Exportar</button>
        <label class="btn">⬆️ Importar<input type="file" id="import-file" accept="application/json,.json" hidden></label>
      </div>
      <button class="btn danger" data-action="reset">Reiniciar todo</button>
    </section>
    ${standalone ? '' : `<section class="card">
      <h2>Instalar en iPhone</h2>
      <ol class="steps">
        <li>Abre esta página en <strong>Safari</strong>.</li>
        <li>Toca el botón <strong>Compartir</strong> (cuadro con flecha ↑).</li>
        <li>Elige <strong>“Agregar a pantalla de inicio”</strong>.</li>
        <li>Abre la app desde el ícono: funciona a pantalla completa y sin conexión.</li>
      </ol>
    </section>`}
    <section class="card">
      <h2>Cómo se calcula la XP</h2>
      <ul class="rules">
        <li>Cada actividad suma (o resta) XP a uno o más atributos.</li>
        <li>Cada atributo sube de nivel: del nivel N al N+1 se necesitan ${ATTR_LEVEL_BASE} × N<sup>1.5</sup> XP.</li>
        <li>Rachas: 3 días ×1.1 · 7 días ×1.25 · 14 días ×1.35 · 30 días ×1.5.</li>
        <li>Actividades con rendimiento decreciente valen la mitad en cada repetición del mismo día.</li>
        <li>Tu clase es la del atributo con más XP.</li>
      </ul>
    </section>`;
}

const VIEWS = { today: viewToday, character: viewCharacter, stats: viewStats, settings: viewSettings };

function render() {
  const s = store.getState();
  main.innerHTML = VIEWS[ui.view](s);
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.view === ui.view));
}

// ---------- Editor de actividades ----------

function openEditor(id) {
  const s = store.getState();
  const a = id ? store.activityById(id) : { id: '', emoji: '⭐', name: '', effects: {} };
  const neg = id ? isNegative(a) : false;
  dialog.innerHTML = `<form method="dialog" id="act-form">
    <h2>${id ? 'Editar' : 'Nueva'} actividad</h2>
    <div class="field-row">
      <label class="field emoji-field"><span>Emoji</span><input name="emoji" value="${esc(a.emoji)}" maxlength="4" required></label>
      <label class="field grow"><span>Nombre</span><input name="name" value="${esc(a.name)}" maxlength="40" required></label>
    </div>
    <label class="field"><span>Tipo</span>
      <select name="kind"><option value="pos" ${neg ? '' : 'selected'}>Hábito positivo (suma)</option><option value="neg" ${neg ? 'selected' : ''}>Tentación (resta)</option></select>
    </label>
    <fieldset class="effects"><legend>XP por atributo</legend>
      ${s.attributes.map((at) => `<label class="field"><span>${esc(at.emoji)} ${esc(at.name)}</span>
        <input type="number" inputmode="numeric" min="0" max="100" name="fx-${esc(at.id)}" value="${Math.abs(a.effects[at.id] || 0) || ''}" placeholder="0"></label>`).join('')}
    </fieldset>
    <label class="check"><input type="checkbox" name="repeatable" ${a.repeatable ? 'checked' : ''}> Se puede registrar varias veces al día</label>
    <label class="check"><input type="checkbox" name="diminishing" ${a.diminishing ? 'checked' : ''}> Rendimiento decreciente (cada repetición vale la mitad)</label>
    <p class="form-error" hidden></p>
    <div class="btn-row">
      ${id ? '<button type="button" class="btn danger" data-action="archive">Eliminar</button>' : ''}
      <span class="grow"></span>
      <button type="button" class="btn" data-action="close">Cancelar</button>
      <button type="submit" class="btn primary">Guardar</button>
    </div>
  </form>`;
  const form = dialog.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const sign = f.get('kind') === 'neg' ? -1 : 1;
    const effects = {};
    for (const at of s.attributes) {
      const v = Math.abs(parseInt(f.get(`fx-${at.id}`), 10) || 0);
      if (v) effects[at.id] = sign * v;
    }
    if (!Object.keys(effects).length) {
      const err = form.querySelector('.form-error');
      err.textContent = 'Asigna XP al menos a un atributo.';
      err.hidden = false;
      return;
    }
    store.upsertActivity({
      ...a,
      id: a.id || uid(),
      emoji: f.get('emoji').trim() || '⭐',
      name: f.get('name').trim(),
      effects,
      repeatable: f.has('repeatable'),
      diminishing: f.has('diminishing'),
    });
    dialog.close();
  });
  form.querySelector('[data-action="archive"]')?.addEventListener('click', () => {
    if (confirm(`¿Eliminar “${a.name}”? Tu historial se conserva.`)) {
      store.archiveActivity(a.id);
      dialog.close();
    }
  });
  form.querySelector('[data-action="close"]').addEventListener('click', () => dialog.close());
  dialog.showModal();
}

// ---------- Acciones ----------

let toastTimer;
function toast(html, negative = false) {
  toastEl.innerHTML = html;
  toastEl.className = `toast show ${negative ? 'neg' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.className = 'toast'), 2200);
}

async function exportData() {
  const name = `rpg-metas-${todayKey()}.json`;
  const blob = new Blob([store.exportJSON()], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Respaldo RPG Metas' });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function logActivity(id) {
  const s = store.getState();
  const a = store.activityById(id);
  const attrs = attrMap(s);
  const already = s.logs.some((l) => l.activityId === id && l.date === ui.date);
  if (already && !a.repeatable) {
    store.removeLastLog(id, ui.date);
    toast(`Deshecho: ${esc(a.emoji)} ${esc(a.name)}`);
    return;
  }
  const before = character(s).level;
  const { log, mult, dim } = store.addLog(id, ui.date);
  const after = character(store.getState()).level;
  const extra = [
    mult > 1 ? `🔥${log.streak} ×${mult}` : '',
    dim < 1 ? `×${dim}` : '',
  ].filter(Boolean).join(' ');
  toast(`${esc(a.emoji)} ${fxChips(log.xp, attrs)} ${extra ? `<span class="muted">${extra}</span>` : ''}
    ${after > before ? `<div class="levelup">🎉 ¡Subiste a nivel ${after}!</div>` : ''}`, isNegative(a));
  navigator.vibrate?.(15);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action], .tab');
  if (!el) return;
  if (el.classList.contains('tab')) {
    ui.view = el.dataset.view;
    render();
    window.scrollTo(0, 0);
    return;
  }
  const { action, id, step, period } = el.dataset;
  switch (action) {
    case 'log':
      return logActivity(id);
    case 'unlog':
      store.removeLastLog(id, ui.date);
      return;
    case 'date': {
      const next = Number(step) === 0 ? todayKey() : addDays(ui.date, Number(step));
      if (next <= todayKey()) ui.date = next;
      return render();
    }
    case 'period':
      ui.period = period;
      ui.offset = 0;
      return render();
    case 'offset':
      ui.offset = Number(step) === 0 ? 0 : Math.min(0, ui.offset + Number(step));
      return render();
    case 'edit':
      if (dialog.contains(el)) return;
      return openEditor(id);
    case 'export':
      return exportData();
    case 'reset':
      if (confirm('¿Borrar todos tus datos y volver a los valores iniciales? Esto no se puede deshacer.')) store.reset();
      return;
    default:
  }
});

document.addEventListener('change', async (e) => {
  if (e.target.id === 'profile-name') store.setProfile({ name: e.target.value.trim() || 'Aventurero' });
  if (e.target.id === 'profile-avatar') store.setProfile({ avatar: e.target.value.trim() || '🧙' });
  if (e.target.id === 'import-file') {
    const file = e.target.files[0];
    if (!file) return;
    try {
      store.importJSON(await file.text());
      toast('Respaldo importado ✔');
    } catch (err) {
      alert(`No se pudo importar: ${err.message}`);
    }
  }
});

// ---------- Inicio ----------

store.load();
store.subscribe(render);
render();

if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// Si la app queda abierta de un día para otro, "Hoy" pasa al nuevo día al volver a ella.
let lastToday = todayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const now = todayKey();
  if (now === lastToday) return;
  if (ui.date === lastToday) ui.date = now;
  lastToday = now;
  render();
});
