import * as store from './store.js';
import { radarSVG } from './charts.js';
import { CATEGORIES, SUBS, TIME_PRESETS, subInfo } from './data.js';
import {
  ATTR_LEVEL_BASE, character, computeLogXp, currentStreak, datesByKey, isNegativeSub,
} from './game.js';
import {
  PERIODS, dailyTotals, deltaPct, elapsedDays, periodLabel, periodRange, shortLabel, sumRange,
} from './stats.js';
import {
  addDays, esc, fmtDate, fmtHours, fmtMinutes, fmtNum, fmtSigned, todayKey,
} from './util.js';

const ui = { view: 'today', date: todayKey(), period: 'week', offset: 0 };
const main = document.getElementById('main');
const dialog = document.getElementById('dialog');
const toastEl = document.getElementById('toast');

// Estado del flujo de registro (categoría → subcategoría → detalle) mientras el diálogo está abierto.
let sheet = null;

// ---------- Helpers de vista ----------

const attrMap = (s) => Object.fromEntries(s.attributes.map((a) => [a.id, a]));

function fxChips(xp, attrs, suffix = '') {
  return Object.entries(xp)
    .filter(([, v]) => v)
    .map(([a, v]) => `<span class="fx ${v < 0 ? 'fx-neg' : ''}">${esc(attrs[a]?.emoji ?? a)}${fmtSigned(v)}${suffix}</span>`)
    .join('');
}

const MODE_SUFFIX = { time: '/h', count: '', check: '' };

function modeLabel(sub) {
  if (sub.mode === 'time') return 'por hora';
  if (sub.mode === 'count') return `por ${sub.unit}`;
  return 'una vez al día';
}

function amountLabel(sub, qty) {
  if (sub.mode === 'time') return fmtMinutes(qty);
  if (sub.mode === 'count') return `${qty} ${qty === 1 ? sub.unit : sub.units}`;
  return '✓';
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
  const dayLogs = s.logs.filter((l) => l.date === date).sort((a, b) => a.ts - b.ts);
  const day = sumRange(dayLogs, { start: date, end: date });
  const dates = datesByKey(s.logs);

  const favs = s.favorites.filter((f) => !f.archived).map((f) => ({ ...f, info: subInfo(f.sub) }));
  const routine = favs.filter((f) => f.info.mode === 'check' && !isNegativeSub(f.info));
  const regular = favs.filter((f) => f.info.mode !== 'check' && !isNegativeSub(f.info));
  const temptations = favs.filter((f) => isNegativeSub(f.info));

  const todayOf = (f) => day.byName[f.id];
  const streakOf = (f) => currentStreak(dates.get(f.id), date);

  const pill = (f, neg = false) => {
    const t = todayOf(f);
    const streak = neg ? 0 : streakOf(f);
    const amount = t && f.info.mode !== 'check' ? ` · ${amountLabel(f.info, t.qty)}` : '';
    return `<button class="pill ${t ? 'on' : ''} ${neg ? 'neg' : ''}" data-action="fav" data-id="${esc(f.id)}">
      ${esc(f.emoji)} ${esc(f.name)}${amount}${t && f.info.mode === 'check' ? ' ✓' : ''}${streak >= 2 ? ` <span class="streak">🔥${streak}</span>` : ''}
    </button>`;
  };

  const tile = (f) => {
    const t = todayOf(f);
    const streak = streakOf(f);
    return `<button class="tile ${t ? 'on' : ''}" data-action="fav" data-id="${esc(f.id)}" style="--c:${esc(f.info.cat.color)}">
      <span class="tile-top"><span class="tile-emoji">${esc(f.emoji)}</span>${streak >= 2 ? `<span class="streak">🔥${streak}</span>` : ''}</span>
      <span class="tile-name">${esc(f.name)}</span>
      <span class="tile-sub">${t ? `<strong>${esc(amountLabel(f.info, t.qty))}</strong>` : esc(modeLabel(f.info))}</span>
    </button>`;
  };

  const logRow = (l) => {
    const sub = subInfo(l.sub);
    return `<li class="log-row">
      <span class="log-emoji">${esc(l.emoji)}</span>
      <span class="log-body">
        <span class="log-name">${esc(l.name)} <span class="muted small">${esc(amountLabel(sub, l.qty))}</span></span>
        ${l.note ? `<span class="log-note">${esc(l.note)}</span>` : ''}
        <span class="act-fx">${fxChips(l.xp, attrs)}</span>
      </span>
      <button class="log-del" data-action="del-log" data-id="${esc(l.id)}" aria-label="Borrar registro">✕</button>
    </li>`;
  };

  return `${heroCard(s, ch)}
    <div class="date-nav">
      <button class="icon-btn" data-action="date" data-step="-1" aria-label="Día anterior">‹</button>
      <button class="date-label" data-action="date" data-step="0">${isToday ? 'Hoy · ' : ''}${esc(fmtDate(date))}</button>
      <button class="icon-btn" data-action="date" data-step="1" ${isToday ? 'disabled' : ''} aria-label="Día siguiente">›</button>
    </div>
    <section class="card day-summary">
      <div class="day-xp"><span class="muted">XP del día</span><strong class="${day.total < 0 ? 'neg-text' : ''}">${fmtSigned(day.total)}</strong></div>
      <div class="muted small">⏱ ${day.minutes ? `${fmtMinutes(day.minutes)} invertidos` : 'Aún sin tiempo registrado'}</div>
      <div class="chips">${fxChips(day.by, attrs)}</div>
    </section>

    <button class="btn primary big" data-action="new-log">＋ Registrar actividad</button>

    ${routine.length ? `<h3 class="group-title">Rutina diaria</h3><div class="pills">${routine.map((f) => pill(f)).join('')}</div>` : ''}
    ${regular.length ? `<h3 class="group-title">Mis actividades</h3><div class="tiles">${regular.map(tile).join('')}</div>` : ''}
    ${temptations.length ? `<h3 class="group-title neg-title">😈 Tentaciones <span class="muted">(restan XP)</span></h3>
      <div class="pills">${temptations.map((f) => pill(f, true)).join('')}</div>` : ''}

    <section class="card">
      <h2>Registro del día</h2>
      ${dayLogs.length ? `<ul class="log-list">${dayLogs.map(logRow).join('')}</ul>`
        : '<p class="muted">Toca una actividad o “Registrar actividad” para empezar.</p>'}
    </section>`;
}

// ---------- Vista: Personaje ----------

function streakLabel(s, key) {
  const fav = store.favoriteById(key);
  if (fav) return { emoji: fav.emoji, name: fav.name };
  const sub = SUBS.get(key);
  return sub ? { emoji: sub.emoji, name: sub.name } : null;
}

function viewCharacter(s) {
  const ch = character(s);
  const values = ch.attrs.map((a) => ({ label: a.name, emoji: a.emoji, color: a.color, value: a.level + a.pct - 1 }));
  const max = Math.max(4, Math.ceil(Math.max(...values.map((v) => v.value)) + 1));
  const today = todayKey();
  const streaks = [...datesByKey(s.logs)]
    .map(([key, dates]) => ({ key, n: currentStreak(dates, today), label: streakLabel(s, key) }))
    .filter((x) => x.n >= 2 && x.label && !(store.favoriteById(x.key)?.archived))
    .filter((x) => !isNegativeSub(subInfo(store.favoriteById(x.key)?.sub ?? x.key)))
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
      ${streaks.length ? `<ul class="streak-list">${streaks.map(({ label, n }) => `<li><span>${esc(label.emoji)} ${esc(label.name)}</span><span class="streak">🔥 ${n} días</span></li>`).join('')}</ul>`
        : '<p class="muted">Repite una actividad dos días seguidos para empezar una racha. Con 3, 7, 14 y 30 días ganas multiplicadores de XP.</p>'}
    </section>`;
}

// ---------- Vista: Estadísticas ----------

function viewStats(s) {
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

  const cats = CATEGORIES.filter((c) => c.id !== 'tentacion');
  const maxMin = Math.max(1, ...cats.flatMap((c) => [curSum.byCat[c.id]?.minutes || 0, prevSum.byCat[c.id]?.minutes || 0]));

  const trend = Array.from({ length: 8 }, (_, i) => {
    const r = periodRange(type, today, ui.offset - 7 + i);
    return { r, total: sumRange(s.logs, r).total, current: i === 7 };
  });
  const trendMax = Math.max(1, ...trend.map((t) => Math.abs(t.total)));

  const top = Object.values(curSum.byName).sort((x, y) => y.xp - x.xp).slice(0, 6);

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
      <div><span class="muted small">XP por día</span><strong>${fmtNum(curSum.total / curDays)}</strong>${deltaBadge(curSum.total / curDays, prevSum.total / prevDays)}</div>
      <div><span class="muted small">Tiempo</span><strong>${fmtHours(curSum.minutes)}</strong>${deltaBadge(curSum.minutes, prevSum.minutes)}</div>
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
      <h2>Tiempo por categoría</h2>
      <div class="compare">
        ${cats.map((c) => {
          const cm = curSum.byCat[c.id]?.minutes || 0;
          const pm = prevSum.byCat[c.id]?.minutes || 0;
          const count = curSum.byCat[c.id]?.count || 0;
          return `<div class="cmp-row">
            <div class="cmp-head"><span>${esc(c.emoji)} ${esc(c.name)}</span><span><strong>${cm ? fmtHours(cm) : count ? `${count} reg.` : '—'}</strong> ${cm || pm ? deltaBadge(cm, pm) : ''}</span></div>
            <div class="cmp-bars">
              <div class="cmp-bar" style="width:${(cm / maxMin) * 100}%;background:${esc(c.color)}"></div>
              <div class="cmp-bar prev" style="width:${(pm / maxMin) * 100}%"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <p class="legend">Solo cuenta actividades medidas en tiempo. Anterior: ${fmtHours(prevSum.minutes)}</p>
    </section>
    <section class="card">
      <h2>Tendencia de XP</h2>
      <div class="trend">
        ${trend.map((t) => `<div class="trend-col ${t.current ? 'current' : ''}">
          <span class="trend-val">${t.total ? fmtNum(t.total) : ''}</span>
          <div class="trend-bar ${t.total < 0 ? 'neg' : ''}" style="height:${(Math.abs(t.total) / trendMax) * 100}%"></div>
          <span class="trend-label">${esc(shortLabel(type, t.r))}</span>
        </div>`).join('')}
      </div>
    </section>
    <section class="card">
      <h2>Lo que más te aportó</h2>
      ${top.length ? `<ul class="top-list">${top.map((n) => `<li>
          <span>${esc(n.emoji)} ${esc(n.name)} <span class="muted small">${esc(n.sub.mode === 'check' ? `${n.count} día${n.count === 1 ? '' : 's'}` : amountLabel(n.sub, n.qty))}</span></span>
          <span class="count ${n.xp < 0 ? 'neg' : ''}">${fmtSigned(n.xp)} XP</span></li>`).join('')}</ul>`
        : '<p class="muted">Sin registros en este periodo.</p>'}
    </section>
    <section class="card">
      <h2>Constancia <span class="muted small">últimas 17 semanas</span></h2>
      ${heatmap(s)}
    </section>`;
}

function heatmap(s) {
  const today = todayKey();
  const totals = dailyTotals(s.logs);
  const start = periodRange('week', today, -16).start;
  const end = periodRange('week', today, 0).end;
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
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
  const favs = s.favorites.filter((f) => !f.archived);
  const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  return `<section class="card">
      <h2>Perfil</h2>
      <label class="field"><span>Nombre del personaje</span><input id="profile-name" value="${esc(s.profile.name)}" maxlength="30"></label>
      <label class="field"><span>Avatar (emoji)</span><input id="profile-avatar" value="${esc(s.profile.avatar)}" maxlength="4"></label>
    </section>
    <section class="card">
      <div class="row-between"><h2>Mis actividades</h2><button class="btn small" data-action="edit-fav" data-id="">+ Nueva</button></div>
      <p class="muted small">Atajos que aparecen en “Hoy”. Su puntaje lo define la subcategoría.</p>
      <ul class="manage-list">
        ${favs.map((f) => {
          const sub = subInfo(f.sub);
          return `<li><button data-action="edit-fav" data-id="${esc(f.id)}">
            <span>${esc(f.emoji)} ${esc(f.name)}</span>
            <span class="muted small">${esc(sub.cat.name)} › ${esc(sub.name)} · ${esc(modeLabel(sub))}</span></button></li>`;
        }).join('')}
      </ul>
    </section>
    <section class="card">
      <h2>Tabla de puntajes</h2>
      <p class="muted small">XP base de cada subcategoría. Sobre el óptimo diario, el extra vale la mitad.</p>
      ${CATEGORIES.map((c) => `<details class="score-cat">
        <summary>${esc(c.emoji)} ${esc(c.name)}</summary>
        <ul class="score-list">
          ${c.subs.map((sub) => `<li>
            <span>${esc(sub.emoji)} ${esc(sub.name)}<span class="muted small"> · ${esc(modeLabel(sub))}${sub.optimal ? ` · óptimo ${sub.mode === 'time' ? fmtMinutes(sub.optimal) : sub.optimal}` : ''}</span></span>
            <span class="act-fx">${fxChips(sub.rate, attrs, MODE_SUFFIX[sub.mode])}</span>
          </li>`).join('')}
        </ul>
      </details>`).join('')}
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
        <li>Cada subcategoría da XP por hora, por unidad o una vez al día a uno o más atributos.</li>
        <li>Sobre el óptimo diario de una subcategoría, el tiempo o las unidades extra valen la mitad.</li>
        <li>Rachas (días seguidos con la misma actividad): 3 días ×1.1 · 7 ×1.25 · 14 ×1.35 · 30 ×1.5.</li>
        <li>Del nivel N al N+1 de un atributo se necesitan ${ATTR_LEVEL_BASE} × N<sup>1.5</sup> XP.</li>
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

// ---------- Flujo de registro ----------

function lastQty(key) {
  const logs = store.getState().logs;
  for (let i = logs.length - 1; i >= 0; i--) if (logs[i].key === key) return logs[i].qty;
  return null;
}

function openSheet(init) {
  sheet = { step: 1, cat: null, sub: null, favId: null, name: '', note: '', qty: null, saveFav: false, ...init };
  renderSheet();
  if (!dialog.open) dialog.showModal();
}

function previewHTML() {
  const s = store.getState();
  const sub = subInfo(sheet.sub);
  const key = sheet.favId || sheet.sub;
  const { xp, mult, reduced } = computeLogXp(s.logs, sub, sub.mode === 'check' ? 1 : sheet.qty || 0, ui.date, key);
  const notes = [
    mult > 1 ? `🔥 racha ×${mult}` : '',
    reduced ? 'parte sobre el óptimo diario (×0.5)' : '',
  ].filter(Boolean).join(' · ');
  return `<span class="muted small">Ganarás</span> ${fxChips(xp, attrMap(s)) || '—'} ${notes ? `<div class="muted small">${notes}</div>` : ''}`;
}

function renderSheet() {
  const s = store.getState();
  const attrs = attrMap(s);
  let body = '';

  if (sheet.step === 1) {
    body = `<h2>¿Qué hiciste?</h2>
      <div class="cat-grid">
        ${CATEGORIES.map((c) => `<button class="cat-btn" data-s="cat" data-id="${c.id}" style="--c:${esc(c.color)}">
          <span class="cat-emoji">${esc(c.emoji)}</span>${esc(c.name)}</button>`).join('')}
      </div>`;
  } else if (sheet.step === 2) {
    const cat = CATEGORIES.find((c) => c.id === sheet.cat);
    body = `<div class="sheet-head"><button class="icon-btn" data-s="back" aria-label="Volver">‹</button><h2>${esc(cat.emoji)} ${esc(cat.name)}</h2></div>
      <div class="sub-list">
        ${cat.subs.map((sub) => `<button class="sub-btn" data-s="sub" data-id="${cat.id}.${sub.id}">
          <span class="act-emoji">${esc(sub.emoji)}</span>
          <span class="act-body"><span class="act-name">${esc(sub.name)}</span>
          <span class="muted small">${esc(modeLabel(sub))}</span>
          <span class="act-fx">${fxChips(sub.rate, attrs, MODE_SUFFIX[sub.mode])}</span></span>
        </button>`).join('')}
      </div>`;
  } else {
    const sub = subInfo(sheet.sub);
    const fav = sheet.favId ? store.favoriteById(sheet.favId) : null;
    const ownFavs = fav ? [] : s.favorites.filter((f) => f.sub === sub.id && !f.archived);
    const suggestions = [...new Set([
      ...s.favorites.filter((f) => f.sub === sub.id && !f.archived).map((f) => f.name),
      ...s.logs.filter((l) => l.sub === sub.id).map((l) => l.name),
    ])].filter((n) => n !== sub.name).slice(0, 20);
    const already = sub.mode === 'check' && store.findLog(sheet.favId || sheet.sub, ui.date);

    body = `<div class="sheet-head">
        ${sheet.fromTile ? '' : '<button class="icon-btn" data-s="back" aria-label="Volver">‹</button>'}
        <h2>${esc(fav ? fav.emoji : sub.emoji)} ${esc(fav ? fav.name : sub.name)}</h2>
      </div>
      <p class="muted small sheet-path">${esc(sub.cat.name)} › ${esc(sub.name)} · ${esc(modeLabel(sub))} ${fxChips(sub.rate, attrs, MODE_SUFFIX[sub.mode])}</p>
      ${ownFavs.length ? `<div class="field"><span>¿Es una de tus actividades?</span>
        <div class="chip-select">${ownFavs.map((f) => `<button type="button" class="chip-opt" data-s="pick-fav" data-id="${esc(f.id)}">${esc(f.emoji)} ${esc(f.name)}</button>`).join('')}</div>
      </div>` : ''}
      ${fav ? '' : `<label class="field"><span>${ownFavs.length ? 'O escribe otro nombre (opcional)' : 'Nombre (opcional)'}</span>
        <input name="name" list="name-suggestions" value="${esc(sheet.name)}" placeholder="${esc(sub.name)}" maxlength="40" autocomplete="off">
        <datalist id="name-suggestions">${suggestions.map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
      </label>`}
      ${sub.mode === 'time' ? `<div class="field"><span>Duración</span>
        <div class="chip-select">${TIME_PRESETS.map((m) => `<button type="button" class="chip-opt ${sheet.qty === m ? 'on' : ''}" data-s="qty" data-v="${m}">${esc(fmtMinutes(m))}</button>`).join('')}</div>
        <label class="inline-field"><input name="minutes" type="number" inputmode="numeric" min="1" max="1440" value="${sheet.qty ?? ''}" placeholder="Otro"> minutos</label>
      </div>` : ''}
      ${sub.mode === 'count' ? `<div class="field"><span>Cantidad (${esc(sub.units)})</span>
        <div class="stepper"><button type="button" class="icon-btn" data-s="dec">−</button><strong class="stepper-val">${sheet.qty}</strong><button type="button" class="icon-btn" data-s="inc">＋</button></div>
      </div>` : ''}
      <label class="field"><span>Nota (opcional)</span><input name="note" value="${esc(sheet.note)}" placeholder="${sub.id === 'hogar.aseo' ? 'Ej.: baño y cocina' : 'Detalle libre'}" maxlength="80"></label>
      ${fav ? '' : `<label class="check"><input type="checkbox" name="saveFav" ${sheet.saveFav ? 'checked' : ''}> Guardar en “Mis actividades” para registrarla con un toque</label>`}
      <div class="preview">${previewHTML()}</div>
      ${already ? '<p class="form-error">Ya está registrada este día.</p>' : ''}
      <div class="btn-row">
        <span class="grow"></span>
        <button type="button" class="btn" data-s="close">Cancelar</button>
        <button type="button" class="btn primary" data-s="save" ${already || (sub.mode !== 'check' && !(sheet.qty > 0)) ? 'disabled' : ''}>Registrar</button>
      </div>`;
  }

  dialog.innerHTML = `<div class="sheet">${body}${sheet.step < 3 ? '<div class="btn-row"><span class="grow"></span><button type="button" class="btn" data-s="close">Cancelar</button></div>' : ''}</div>`;
}

function saveSheet() {
  const sub = subInfo(sheet.sub);
  let favId = sheet.favId;
  let name = sheet.name.trim();
  let emoji = null;

  if (!favId && name) {
    // Si el nombre coincide con una actividad guardada de la misma subcategoría, se vincula (mantiene la racha).
    const match = store.getState().favorites.find((f) => !f.archived && f.sub === sub.id && f.name.toLowerCase() === name.toLowerCase());
    if (match) favId = match.id;
  }
  if (!favId && sheet.saveFav) {
    favId = store.upsertFavorite({ sub: sub.id, name: name || sub.name, emoji: sub.emoji }).id;
  }
  if (favId) {
    const fav = store.favoriteById(favId);
    name = fav.name;
    emoji = fav.emoji;
  }

  const { log, mult, reduced } = store.addLog({
    sub: sub.id, favId, name, emoji, qty: sheet.qty, note: sheet.note.trim(), date: ui.date,
  });
  dialog.close();
  celebrate(log, mult, reduced);
}

dialog.addEventListener('click', (e) => {
  const el = e.target.closest('[data-s]');
  if (!el || !sheet) return;
  const sub = sheet.sub ? subInfo(sheet.sub) : null;
  switch (el.dataset.s) {
    case 'cat':
      sheet.cat = el.dataset.id;
      sheet.step = 2;
      break;
    case 'sub': {
      sheet.sub = el.dataset.id;
      const s2 = subInfo(sheet.sub);
      sheet.qty = s2.mode === 'time' ? lastQty(sheet.sub) ?? 30 : s2.mode === 'count' ? 1 : 1;
      sheet.step = 3;
      break;
    }
    case 'back':
      // Si se eligió una actividad propia dentro del flujo, "volver" solo la deselecciona.
      if (sheet.favId) {
        sheet.favId = null;
        break;
      }
      sheet.step -= 1;
      if (sheet.step === 2 && !sheet.cat) sheet.cat = sub?.cat.id;
      break;
    case 'pick-fav':
      sheet.favId = el.dataset.id;
      sheet.name = '';
      sheet.saveFav = false;
      break;
    case 'qty':
      sheet.qty = Number(el.dataset.v);
      break;
    case 'inc':
      sheet.qty = (sheet.qty || 0) + 1;
      break;
    case 'dec':
      sheet.qty = Math.max(1, (sheet.qty || 1) - 1);
      break;
    case 'save':
      saveSheet();
      return;
    case 'close':
      dialog.close();
      return;
    default:
      return;
  }
  renderSheet();
});

// Los campos de texto actualizan el estado sin redibujar (para no perder el foco del teclado).
dialog.addEventListener('input', (e) => {
  if (!sheet) return;
  const { name, value, checked } = e.target;
  if (name === 'name') sheet.name = value;
  if (name === 'note') sheet.note = value;
  if (name === 'saveFav') sheet.saveFav = checked;
  if (name === 'minutes') {
    sheet.qty = Math.min(1440, Math.max(0, parseInt(value, 10) || 0));
    dialog.querySelectorAll('.chip-opt').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === sheet.qty));
    const save = dialog.querySelector('[data-s="save"]');
    if (save) save.disabled = !(sheet.qty > 0);
  }
  const preview = dialog.querySelector('.preview');
  if (preview) preview.innerHTML = previewHTML();
});

dialog.addEventListener('close', () => {
  sheet = null;
});

// ---------- Editor de actividades frecuentes ----------

function openFavEditor(id) {
  const fav = id ? store.favoriteById(id) : { id: '', sub: 'estudio.curso', name: '', emoji: '' };
  dialog.innerHTML = `<form class="sheet" id="fav-form">
    <h2>${id ? 'Editar' : 'Nueva'} actividad</h2>
    <label class="field"><span>Subcategoría (define el puntaje)</span>
      <select name="sub">
        ${CATEGORIES.map((c) => `<optgroup label="${esc(c.emoji)} ${esc(c.name)}">
          ${c.subs.map((sub) => `<option value="${c.id}.${sub.id}" ${fav.sub === `${c.id}.${sub.id}` ? 'selected' : ''}>${esc(sub.emoji)} ${esc(sub.name)} (${esc(modeLabel({ ...sub }))})</option>`).join('')}
        </optgroup>`).join('')}
      </select>
    </label>
    <div class="field-row">
      <label class="field emoji-field"><span>Emoji</span><input name="emoji" value="${esc(fav.emoji)}" maxlength="4" placeholder="${esc(subInfo(fav.sub).emoji)}"></label>
      <label class="field grow"><span>Nombre</span><input name="name" value="${esc(fav.name)}" maxlength="40" placeholder="Ej.: Curso Databricks" required></label>
    </div>
    <div class="btn-row">
      ${id ? '<button type="button" class="btn danger" data-f="archive">Eliminar</button>' : ''}
      <span class="grow"></span>
      <button type="button" class="btn" data-f="close">Cancelar</button>
      <button type="submit" class="btn primary">Guardar</button>
    </div>
  </form>`;
  const form = dialog.querySelector('form');
  const emojiInput = form.elements.emoji;
  form.elements.sub.addEventListener('change', (e) => {
    emojiInput.placeholder = subInfo(e.target.value).emoji;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const sub = subInfo(f.get('sub'));
    store.upsertFavorite({
      ...fav,
      sub: sub.id,
      name: f.get('name').trim() || sub.name,
      emoji: f.get('emoji').trim() || sub.emoji,
    });
    dialog.close();
  });
  form.addEventListener('click', (e) => {
    const action = e.target.closest('[data-f]')?.dataset.f;
    if (action === 'close') dialog.close();
    if (action === 'archive' && confirm(`¿Eliminar “${fav.name}”? Tu historial se conserva.`)) {
      store.archiveFavorite(fav.id);
      dialog.close();
    }
  });
  dialog.showModal();
}

// ---------- Acciones ----------

let toastTimer;
function toast(html, negative = false) {
  toastEl.innerHTML = html;
  toastEl.className = `toast show ${negative ? 'neg' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.className = 'toast'), 2400);
}

let levelBefore = 0;
function celebrate(log, mult, reduced) {
  const s = store.getState();
  const after = character(s).level;
  const extra = [
    mult > 1 ? `🔥${log.streak} ×${mult}` : '',
    reduced ? 'sobre el óptimo' : '',
  ].filter(Boolean).join(' · ');
  const negative = Object.values(log.xp).some((v) => v < 0);
  toast(`${esc(log.emoji)} ${fxChips(log.xp, attrMap(s))} ${extra ? `<span class="muted small">${extra}</span>` : ''}
    ${after > levelBefore ? `<div class="levelup">🎉 ¡Subiste a nivel ${after}!</div>` : ''}`, negative);
  navigator.vibrate?.(15);
}

function tapFavorite(id) {
  const fav = store.favoriteById(id);
  const sub = subInfo(fav.sub);
  if (sub.mode === 'check') {
    const existing = store.findLog(fav.id, ui.date);
    if (existing) {
      store.removeLog(existing.id);
      toast(`Deshecho: ${esc(fav.emoji)} ${esc(fav.name)}`);
      return;
    }
  }
  if (sub.mode === 'time') {
    openSheet({ step: 3, sub: sub.id, cat: sub.cat.id, favId: fav.id, fromTile: true, qty: lastQty(fav.id) ?? 30 });
    return;
  }
  const { log, mult, reduced } = store.addLog({
    sub: sub.id, favId: fav.id, name: fav.name, emoji: fav.emoji, qty: 1, date: ui.date,
  });
  celebrate(log, mult, reduced);
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

document.addEventListener('click', (e) => {
  if (dialog.contains(e.target)) return;
  const el = e.target.closest('[data-action], .tab');
  if (!el) return;
  if (el.classList.contains('tab')) {
    ui.view = el.dataset.view;
    render();
    window.scrollTo(0, 0);
    return;
  }
  levelBefore = character(store.getState()).level;
  const { action, id, step, period } = el.dataset;
  switch (action) {
    case 'fav':
      return tapFavorite(id);
    case 'new-log':
      return openSheet({});
    case 'del-log': {
      const log = store.getState().logs.find((l) => l.id === id);
      if (log && confirm(`¿Borrar “${log.name}” de este día?`)) store.removeLog(id);
      return;
    }
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
    case 'edit-fav':
      return openFavEditor(id);
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
