/* =============================================================
   BINOMI-LABOR: nur Rechentrainer, keine Erkunden-Tabs, keine Skizze
   Stufe 1–3: je eine binomische Formel (1., 2., 3.)
   Stufe 4: Terme mit einer Variablen ausmultiplizieren und zusammenfassen
   ============================================================= */

const LEVELS = [
  { t: "Stufe 1", s: "1. binomische Formel" },
  { t: "Stufe 2", s: "2. binomische Formel" },
  { t: "Stufe 3", s: "3. binomische Formel" },
  { t: "Stufe 4", s: "Terme zusammenfassen" },
];

// ---------- Terme als Text ----------
const vz = (v, first) => first ? (v < 0 ? "−" : "") : (v < 0 ? " − " : " + ");
const xT = (a, cls) => sp(cls, (a === 1 ? "" : num(a)) + "x");        // 1 → x, 3 → 3x
// Polynom c = [Zahl, x-Glied, x²-Glied] als Text, optional farbig (x² lila, x blau, Zahl grün)
function polyT(c, col) {
  const parts = [];
  [[c[2], "x²", "ca"], [c[1], "x", "cx"], [c[0], "", "ce"]].forEach(([k, s, cls]) => {
    if (!k) return;
    const body = (Math.abs(k) === 1 && s ? "" : num(Math.abs(k))) + s;
    parts.push(vz(k, !parts.length) + sp(col ? cls : "", body));
  });
  return parts.join("") || "0";
}

// ---------- Eingabe lesen: Polynom in x, frei getippt ----------
// erlaubt x², x^2, x2, Leerzeichen, · und *, Komma; Reihenfolge egal.
// Ergebnis { c: [Zahl, x, x²], dup } (dup = ein Glied kommt mehrfach vor, also noch nicht zusammengefasst) oder null
function parsePoly(str) {
  let s = String(str).toLowerCase().replace(/[−–—]/g, "-").replace(/[\s·*×]/g, "").replace(/,/g, ".")
    .replace(/\^2|x2(?!\d)/g, m => m === "^2" ? "²" : "x²").replace(/^=/, "");
  if (!s || /[()]/.test(s)) return null;
  if (!/^[+-]/.test(s)) s = "+" + s;
  const terms = s.match(/[+-][^+-]*/g); if (!terms || terms.join("") !== s) return null;
  const c = [0, 0, 0], seen = [0, 0, 0];
  for (const t of terms) {
    const m = t.match(/^([+-])(\d*\.?\d*)(x²|x)?$/); if (!m || (!m[2] && !m[3])) return null;
    const k = (m[1] === "-" ? -1 : 1) * (m[2] === "" ? 1 : Number(m[2])); if (isNaN(k)) return null;
    const p = m[3] === "x²" ? 2 : m[3] ? 1 : 0;
    c[p] += k; seen[p]++;
  }
  return { c, dup: seen.some(n => n > 1) };
}
const samePoly = (g, w) => g.c.every((v, i) => near(v, w[i], 1e-9));

// ---------- Aufgaben ----------
// Stufe 1: Typ 1 (ax + b)², Typ 2 (ax − b)² oder (b − ax)², Typ 3 (ax + b)(ax − b)
function binom(type) {
  const a = pick([1, 1, 1, 2, 3, 4, 5]), b = a === 1 ? 1 + rnd(12) : 1 + rnd(9);
  const A = xT(a, "ca"), B = sp("cd", num(b));
  if (type === 1) return { a, b, type, html: `(${A} + ${B})²`, plain: `(${xT(a)} + ${num(b)})²`, c: [b * b, 2 * a * b, a * a] };
  if (type === 2) {
    const rev = Math.random() < 0.25; // manchmal Zahl vorn: (3 − x)²
    return { a, b, type, html: rev ? `(${B} − ${A})²` : `(${A} − ${B})²`, plain: rev ? `(${num(b)} − ${xT(a)})²` : `(${xT(a)} − ${num(b)})²`, c: [b * b, -2 * a * b, a * a] };
  }
  const sw = Math.random() < 0.5;
  const p = `(${A} + ${B})`, m = `(${A} − ${B})`, pp = `(${xT(a)} + ${num(b)})`, mp = `(${xT(a)} − ${num(b)})`;
  return { a, b, type, html: sw ? m + p : p + m, plain: sw ? mp + pp : pp + mp, c: [-b * b, 0, a * a] };
}

// Stufe 2: Summe aus 2–3 Teilen; der Generator kennt die Teile und rechnet das Ergebnis mit
const inner = (a, p) => `(${xT(a)}${p < 0 ? " − " : " + "}${num(Math.abs(p))})`;
const coef = (k, first) => (first ? (k < 0 ? "−" : "") : (k < 0 ? " − " : " + ")) + (Math.abs(k) === 1 ? "" : num(Math.abs(k)));
const PARTS = {
  sq(k, first) { const a = pick([1, 1, 1, 2]), p = nz(-6, 6); return { html: coef(k, first) + inner(a, p) + "²", c: [k * p * p, k * 2 * a * p, k * a * a] }; },
  pm(k, first) { const a = pick([1, 1, 2]), p = 1 + rnd(6); return { html: coef(k, first) + inner(a, p) + inner(a, -p), c: [-k * p * p, 0, k * a * a] }; },
  pq(k, first) { let p = nz(-6, 6), q; do q = nz(-6, 6); while (Math.abs(q) === Math.abs(p)); return { html: coef(k, first) + inner(1, p) + inner(1, q), c: [k * p * q, k * (p + q), k] }; },
  xp(k, first) { const p = nz(-6, 6); return { html: (first ? (k < 0 ? "−" : "") : (k < 0 ? " − " : " + ")) + xT(Math.abs(k)) + inner(1, p), c: [0, k * p, k] }; },
  lin(k, first) { const m = nz(-9, 9); return { html: vz(m, first) + xT(Math.abs(m)), c: [0, m, 0] }; },
  con(k, first) { const n = nz(-12, 12); return { html: vz(n, first) + num(Math.abs(n)), c: [n, 0, 0] }; },
};
function termTask() {
  for (;;) {
    let kinds = [pick(["sq", "sq", "pm", "pq", "xp"]), pick(["sq", "pm", "pq", "xp"])];
    if (Math.random() < 0.6) kinds.push(pick(["lin", "con", "con"]));
    if (Math.random() < 0.25) kinds = ["sq", "con"]; // wie Scheitelpunktform → allgemeine Form
    if (kinds[0] === "sq" && kinds[1] === "sq" && Math.random() < 0.5) kinds[1] = "pq";
    let html = "", c = [0, 0, 0];
    kinds.forEach((kd, i) => {
      const k = i === 0 ? pick([1, 1, 1, 2, 3]) : pick([1, 1, -1, -1, 2, -2, 3, -3]);
      const P = PARTS[kd](k, i === 0); html += P.html; c = c.map((v, j) => v + P.c[j]);
    });
    if (c.every(v => v === 0) || c.some(v => Math.abs(v) > 80)) continue;
    return { html, c };
  }
}

const ANSWER = `<div class="brows"><span class="eqs">=</span><input class="in poly" data-k="t0" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Ergebnis"></div>`;
const NAMES = ["x²-Glied", "x-Glied", "Zahl ohne x"];
function makeTask(l) {
  if (l < 3) {
    const b = binom(l + 1);
    return { l, b, key: [b.c], // key: für die Tests
      title: `Rechne mit der ${l + 1}. binomischen Formel aus.`, task: b.html,
      answer: ANSWER,
      check(F, fb) {
        if (!F.t0.value.trim()) { fb.className = "feedback no"; fb.textContent = "Bitte ausrechnen."; return null; }
        const g = parsePoly(F.t0.value);
        if (!g) { mark(F.t0, false); fb.className = "feedback no"; fb.textContent = "Das kann ich nicht lesen. Bitte ohne Klammern."; return null; }
        if (g.dup && samePoly(g, b.c)) { fb.className = "feedback no"; fb.textContent = "Fast: noch zusammenfassen."; return null; }
        this.guess = g; const ok = samePoly(g, b.c) && !g.dup; mark(F.t0, ok); return ok;
      },
      failMsg() {
        const g = this.guess;
        if (g.c[2] !== b.c[2] && b.a > 1 && near(g.c[2], b.a, 1e-9)) return `Auch die Zahl vor dem x wird quadriert: (${num(b.a)}x)² = ${num(b.a * b.a)}x².`;
        if (b.type < 3 && g.c[1] === 0) return "Das Mittelglied fehlt.";
        if (b.type < 3 && near(g.c[1], -b.c[1], 1e-9)) return "Vorzeichen beim Mittelglied prüfen.";
        if (b.type === 3 && near(g.c[0], b.b * b.b, 1e-9)) return "Bei (a + b)(a − b) kommt hinten minus.";
      },
      sol: () => `${b.plain} = ${polyT(b.c)}` };
  }
  const T = termTask();
  return { l, T, key: [T.c],
    title: "Löse die Klammern auf und fasse zusammen.", task: `<span class="trterm">${T.html}</span>`,
    answer: ANSWER,
    check(F, fb) {
      if (!F.t0.value.trim()) { fb.className = "feedback no"; fb.textContent = "Bitte ausrechnen."; return null; }
      const g = parsePoly(F.t0.value);
      if (!g) { mark(F.t0, false); fb.className = "feedback no"; fb.textContent = "Das kann ich nicht lesen. Bitte ohne Klammern."; return null; }
      if (g.dup && samePoly(g, T.c)) { fb.className = "feedback no"; fb.textContent = "Fast: noch zusammenfassen."; return null; }
      this.guess = g; const ok = samePoly(g, T.c) && !g.dup; mark(F.t0, ok); return ok;
    },
    failMsg() {
      const g = this.guess;
      const wrong = [2, 1, 0].filter(i => !near(g.c[i], T.c[i], 1e-9)).map(i => NAMES[2 - i]);
      return "Noch falsch: " + wrong.join(", ") + ".";
    },
    sol: () => `${T.html.replace(/<[^>]+>/g, "")} = ${polyT(T.c)}` };
}
function drawTrain() {}

// ---------- Musterbeispiel je Stufe ----------
// Kommentar steht in der Zeile VOR dem Schritt. Farben: a lila, b orange; im Ergebnis x² lila, x blau, Zahl grün.
const A = t => sp("ca", t), D = t => sp("cd", t), E = t => sp("ce", t), X = t => sp("cx", t);
const res = t => `<span class="res">${t}</span>`;
const pad = `<span style="visibility:hidden">= </span>`; // erste Zeile ohne „=“, Terme trotzdem bündig
const EXAMPLES = [
  { sub: "Rechne mit der 1. binomischen Formel aus.", rows: [
    { sec: "(a + b)² = a² + 2ab + b²" },
    ["(" + A("2x") + " + " + D("3") + ")²", "= (" + A("2x") + ")² + 2 · " + A("2x") + " · " + D("3") + " + " + D("3") + "²", "ausrechnen"],
    ["", "= " + res(A("4x²") + " + " + X("12x") + " + " + E("9"))],
  ] },
  { sub: "Rechne mit der 2. binomischen Formel aus.", rows: [
    { sec: "(a − b)² = a² − 2ab + b²" },
    ["(" + A("x") + " − " + D("5") + ")²", "= " + A("x") + "² − 2 · " + A("x") + " · " + D("5") + " + " + D("5") + "²", "ausrechnen"],
    ["", "= " + res(A("x²") + " − " + X("10x") + " + " + E("25"))],
  ] },
  { sub: "Rechne mit der 3. binomischen Formel aus.", rows: [
    { sec: "(a + b)(a − b) = a² − b²" },
    ["(" + A("3x") + " + " + D("4") + ")(" + A("3x") + " − " + D("4") + ")", "= (" + A("3x") + ")² − " + D("4") + "²", "ausrechnen"],
    ["", "= " + res(A("9x²") + " − " + E("16"))],
  ] },
  { sub: "Löse die Klammern auf und fasse zusammen.", rows: [
    ["", pad + "2(x − 3)² − (x + 1)(x − 1) + " + X("4x"), "binomische Formeln"],
    ["", "= 2(" + A("x²") + " − " + X("6x") + " + " + E("9") + ") − (" + A("x²") + " − " + E("1") + ") + " + X("4x"), "Klammern auflösen, Vorzeichen!"],
    ["", "= " + A("2x²") + " − " + X("12x") + " + " + E("18") + " − " + A("x²") + " + " + E("1") + " + " + X("4x"), "gleiche Farben zusammenfassen"],
    ["", "= " + res(A("x²") + " − " + X("8x") + " + " + E("19"))],
  ] },
];

const EXPLORE = { draw: {}, canvases: [], init() {} };
