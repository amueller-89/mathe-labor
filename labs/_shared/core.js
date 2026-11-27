/* Geteilter Kern aller Labore: kleine Helfer, Koordinatensystem, Zahlen einlesen.
   Wird vom Build (build.py) zusammen mit dem Code des Labors in eine Datei kopiert. */
const $ = id => document.getElementById(id);
const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const r6 = v => Math.round(v * 1e6) / 1e6;
const num = v => { const r = r6(v); return (r < 0 ? "−" : "") + String(Math.abs(r)).replace(".", ","); };
const sp = (cls, t) => cls ? `<span class="${cls}">${t}</span>` : t;
const rnd = n => Math.floor(Math.random() * n);
const pick = arr => arr[rnd(arr.length)];
const near = (u, v, tol = 1e-6) => Math.abs(u - v) <= tol;
const paren = v => r6(v) < 0 ? `(${num(v)})` : num(v);
// Zahl in fester Breite, damit Text dahinter beim Ziehen nicht springt
const fx = (cls, t, w = 3.2, al = "center") => `<span class="fx ${cls}" style="width:${w}em;text-align:${al}">${t}</span>`;
const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function nz(lo, hi) { let v; do v = lo + rnd(hi - lo + 1); while (v === 0); return v; }
function shuffle(n) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// Eingabefeld für den Rechentrainer; data-k ist der Schlüssel in task.want
const inp = k => `<input class="in" data-k="${k}" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${k}">`;

// ---------- Koordinatensystem ----------
class Board {
  // R = halbe Breite in Einheiten; cx, cy = Mitte des Ausschnitts (Standard: Ursprung)
  constructor(canvas, R = 8, cx = 0, cy = 0) { this.c = canvas; this.R = R; this.cx = cx; this.cy = cy; this.lab = 1; }
  begin() {
    const c = this.c, r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const ctx = this.ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = r.width; this.h = r.height;
    const R = this.R, m = 14; this.u = (Math.min(this.w, this.h) - 2 * m) / (2 * R);
    this.ox = this.w / 2 - this.cx * this.u; this.oy = this.h / 2 + this.cy * this.u;
    const X = x => this.X(x), Y = y => this.Y(y);
    const x0 = this.cx - R, x1 = this.cx + R, y0 = this.cy - R, y1 = this.cy + R;
    ctx.clearRect(0, 0, this.w, this.h); ctx.setLineDash([]);
    ctx.lineWidth = 1;
    for (let i = Math.ceil(x0); i <= x1; i++) {
      ctx.strokeStyle = i % 5 ? tok("--grid") : tok("--grid-strong");
      ctx.beginPath(); ctx.moveTo(X(i), Y(y0)); ctx.lineTo(X(i), Y(y1)); ctx.stroke();
    }
    for (let i = Math.ceil(y0); i <= y1; i++) {
      ctx.strokeStyle = i % 5 ? tok("--grid") : tok("--grid-strong");
      ctx.beginPath(); ctx.moveTo(X(x0), Y(i)); ctx.lineTo(X(x1), Y(i)); ctx.stroke();
    }
    const ink = tok("--ink"), muted = tok("--muted");
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(X(x0), Y(0)); ctx.lineTo(X(x1), Y(0)); ctx.moveTo(X(0), Y(y0)); ctx.lineTo(X(0), Y(y1)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(x1) + 2, Y(0)); ctx.lineTo(X(x1) - 7, Y(0) - 4); ctx.lineTo(X(x1) - 7, Y(0) + 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(X(0), Y(y1) - 2); ctx.lineTo(X(0) - 4, Y(y1) + 7); ctx.lineTo(X(0) + 4, Y(y1) + 7); ctx.fill();
    ctx.font = `12px ${tok("--body")}`; ctx.fillStyle = muted;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let i = Math.floor(x0) + 1; i < x1; i++) if (i && i % this.lab === 0) ctx.fillText(num(i), X(i), Y(0) + 4);
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (let i = Math.floor(y0) + 1; i < y1; i++) if (i && i % this.lab === 0) ctx.fillText(num(i), X(0) - 5, Y(i));
    ctx.fillStyle = ink; ctx.font = `700 14px ${tok("--body")}`;
    ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(this.xName || "x", X(x1) - 4, Y(0) - 6);
    ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(this.yName || "y", X(0) + 8, Y(y1) + 2);
    return ctx;
  }
  X(x) { return this.ox + x * this.u; }
  Y(y) { return this.oy - y * this.u; }
  ix(px) { return (px - this.ox) / this.u; }
  iy(py) { return (this.oy - py) / this.u; }
  clip(fn) { const c = this.ctx, R = this.R; c.save(); c.beginPath(); c.rect(this.X(this.cx - R), this.Y(this.cy + R), 2 * R * this.u, 2 * R * this.u); c.clip(); fn(c); c.restore(); }
  curve(f, color, width, dash) {
    const R = this.R, lo = this.cy - R - 4 * R / 8, hi = this.cy + R + 4 * R / 8;
    this.clip(c => {
      c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dash || []); c.lineJoin = "round"; c.lineCap = "round";
      c.beginPath(); let started = false; const N = 700;
      for (let i = 0; i <= N; i++) {
        const x = this.cx - R + 2 * R * i / N, y = f(x);
        if (y > hi || y < lo) { if (started) { c.lineTo(this.X(x), this.Y(Math.max(lo, Math.min(hi, y)))); c.stroke(); c.beginPath(); started = false; } continue; }
        if (!started) { c.moveTo(this.X(x), this.Y(y)); started = true; } else c.lineTo(this.X(x), this.Y(y));
      }
      c.stroke();
    });
  }
  seg(x1, y1, x2, y2, color, width = 1.5, dash = [5, 4]) {
    this.clip(c => { c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dash); c.beginPath(); c.moveTo(this.X(x1), this.Y(y1)); c.lineTo(this.X(x2), this.Y(y2)); c.stroke(); });
  }
  dot(x, y, color, r = 6, ring = true) {
    if (Math.abs(x - this.cx) > this.R || Math.abs(y - this.cy) > this.R) return;
    const c = this.ctx; c.setLineDash([]); c.fillStyle = color; c.strokeStyle = tok("--paper"); c.lineWidth = 2;
    c.beginPath(); c.arc(this.X(x), this.Y(y), r, 0, 2 * Math.PI); c.fill(); if (ring) c.stroke();
  }
  // farbiger Text mit Hintergrund; parts = [[text, farbe], ...]
  tag(parts, px, py, { align = "left", base = "top", size = 15 } = {}) {
    const c = this.ctx; c.font = `700 ${size}px ${tok("--body")}`; c.textBaseline = "alphabetic"; c.textAlign = "left";
    const tw = parts.reduce((s, p) => s + c.measureText(p[0]).width, 0);
    let x = align === "left" ? px : align === "right" ? px - tw : px - tw / 2;
    x = Math.max(4, Math.min(this.w - tw - 4, x));
    let y = base === "top" ? py + size : base === "bottom" ? py - 4 : py + size / 2 - 2;
    y = Math.max(size + 2, Math.min(this.h - 6, y));
    c.fillStyle = tok("--paper"); c.globalAlpha = .85; c.fillRect(x - 3, y - size, tw + 6, size + 6); c.globalAlpha = 1;
    for (const [t, col] of parts) { c.fillStyle = col; c.fillText(t, x, y); x += c.measureText(t).width; }
  }
  pointer(e) { const r = this.c.getBoundingClientRect(); return [this.ix(e.clientX - r.left), this.iy(e.clientY - r.top), e.clientX - r.left, e.clientY - r.top]; }
}

// Ziehen: hit(x,y,px,py) liefert Griff oder null; move(griff,x,y)
function draggable(board, hit, move, redraw) { // redraw optional
  const c = board.c; let grab = null;
  c.addEventListener("pointerdown", e => { const [x, y, px, py] = board.pointer(e); grab = hit(x, y, px, py); if (grab) { c.setPointerCapture(e.pointerId); e.preventDefault(); } });
  c.addEventListener("pointermove", e => {
    const [x, y, px, py] = board.pointer(e);
    if (grab) { move(grab, x, y); if (redraw) redraw(); } else c.style.cursor = hit(x, y, px, py) ? "grab" : "default";
  });
  const end = () => { grab = null; };
  c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
}
// ---------- Schieberegler ----------
// Jeder Regler sagt im HTML nur, wozu er da ist; die Schrittweite steht nur hier:
//   data-step="look"   nur anschauen/erkunden: fein
//   data-step="match"  etwas Gegebenes treffen (Quiz): grob, damit man es auch trifft
// Umschalten (z. B. Erkunden ↔ Quiz) mit setStep(regler, "match").
const STEP = { look: 0.05, match: 0.25 };
function setStep(el, kind) { el.dataset.step = kind; el.step = STEP[kind]; }
// Startwert neu setzen: ohne step-Attribut hat der Browser ihn schon auf ganze Zahlen gerundet
document.querySelectorAll('input[type="range"]').forEach(el => { setStep(el, el.dataset.step || "look"); el.value = el.getAttribute("value"); });

const nearPx = (board, x, y, px, py, r = 16) => Math.hypot(board.X(x) - px, board.Y(y) - py) <= r;
const snapTo = (v, s) => r6(Math.round(v / s) * s);

// ---------- Zahlen einlesen (Komma, Minuszeichen, Brüche wie 3/4) ----------
function parse(str) {
  let s = String(str).trim().replace(/[−–—]/g, "-").replace(/\s/g, "").replace(",", ".");
  if (s === "") return NaN;
  if (s === "-") return -1;
  if (s === "+") return 1;
  const fr = s.match(/^([+-]?\d*\.?\d+)\/(\d*\.?\d+)$/);
  if (fr) return Number(fr[1]) / Number(fr[2]);
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}

// „0,09x + 7,5“, „7,5 + 0,09·x“, „24 − 1,5x“ → {m, b}; null, wenn es keine Gerade in x ist
function parseLin(str) {
  let s = String(str).toLowerCase().replace(/^\s*y\s*=/, "").replace(/[−–—]/g, "-").replace(/[·*×\s€%]/g, "").replace(/,/g, ".");
  if (!s) return null;
  if (!/^[+-]/.test(s)) s = "+" + s;
  const terms = s.match(/[+-][^+-]+/g);
  if (!terms || terms.join("") !== s) return null;
  let m = 0, b = 0;
  for (const t of terms) {
    if (t.endsWith("x")) { const k = t.slice(0, -1); const v = k === "+" ? 1 : k === "-" ? -1 : parse(k); if (isNaN(v)) return null; m += v; }
    else { const v = parse(t); if (isNaN(v)) return null; b += v; }
  }
  return { m: r6(m), b: r6(b) };
}

// ---------- Admin-Version ----------
// Die Version mit Anmeldung (adminpanel/, docs/) setzt vorher window.LAB_ADMIN, sonst ist es null.
// alle(): Lehrkraft hat für dieses Kind alles geöffnet · tabOk(t): Tab freigegeben · prog: gespeicherter Fortschritt
// changed(): Fortschritt geändert (wird gebündelt an den Server geschickt) · proLocked(): Hinweis „Profi noch zu“
const ADMIN = window.LAB_ADMIN || null;
const changed = () => { if (ADMIN) ADMIN.changed(); };
// #alle in der Adresse öffnet alle Stufen und den Profi-Tab (für die Lehrkraft)
const allOpen = () => ADMIN ? ADMIN.alle() : /alle/i.test(location.hash);
