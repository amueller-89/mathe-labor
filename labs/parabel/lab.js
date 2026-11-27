// ---------- Formeln als HTML ----------
function aPre(a, cls) { return a === 1 ? "" : a === -1 ? sp(cls, "−") : sp(cls, num(a)); }
function shiftHTML(v, cls) { return v === 0 ? "x" : v > 0 ? `x − ${sp(cls, num(v))}` : `x + ${sp(cls, num(-v))}`; }
function scheitelHTML(a, d, e, col = true) {
  const ca = col ? "ca" : "", cd = col ? "cd" : "", ce = col ? "ce" : "";
  const sq = d === 0 ? `${aPre(a, ca)}x²` : `${aPre(a, ca)}(${shiftHTML(d, cd)})²`;
  const eP = e === 0 ? "" : e > 0 ? ` + ${sp(ce, num(e))}` : ` − ${sp(ce, num(-e))}`;
  return `y = ${sq}${eP}`;
}
function polyBody(A, B, C) {
  const t = [];
  const co = (k, s) => k === 1 ? s : k === -1 ? "−" + s : num(k) + s;
  if (A) t.push(co(A, "x²"));
  if (B) t.push(t.length ? (B > 0 ? " + " : " − ") + co(Math.abs(B), "x") : co(B, "x"));
  if (C) t.push(t.length ? (C > 0 ? " + " : " − ") + num(Math.abs(C)) : num(C));
  return t.join("") || "0";
}
const polyHTML = (A, B, C) => "y = " + polyBody(A, B, C);
function zfmt(v) { const z = Math.round(v * 100) / 100; return (Math.abs(z - v) > 1e-9 ? "≈ " : "") + num(z); }
function factor(x0, cls, approx) {
  if (near(x0, 0)) return "x";
  const s = approx ? zfmt(Math.abs(x0)) : num(Math.abs(x0));
  return `(x ${x0 > 0 ? "−" : "+"} ${sp(cls, s)})`;
}
function nullHTML(a, x1, x2, col = true, approx = false) {
  const ca = col ? "ca" : "", cz = col ? "cz" : "";
  if (near(x1, x2)) {
    const f = near(x1, 0) ? "x²" : factor(x1, cz, approx) + "²";
    return `y = ${aPre(a, ca)}${f}`;
  }
  let f1 = factor(x1, cz, approx), f2 = factor(x2, cz, approx);
  if (f2 === "x") [f1, f2] = [f2, f1];
  return `y = ${aPre(a, ca)}${f1}${f2}`;
}

/* =============================================================
   2 PQ-FORMEL
   ============================================================= */
const bPq = new Board($("cPq"));
const pqP = $("pqP"), pqQ = $("pqQ");
function updPq() {
  const p = +pqP.value, q = +pqQ.value, h = p / 2, A = -h, D = r6(h * h - q);
  $("pqPo").textContent = num(p); $("pqQo").textContent = num(q);
  const sg = v => v < 0 ? "−" : "+";
  $("pqEq").innerHTML =
    `<span>x²</span><span>+</span><span class="v cd">p</span><span>x</span><span>+</span><span class="v ca">q</span><span>= 0</span>` +
    `<span>x²</span><span>${sg(p)}</span><span class="v cd">${num(Math.abs(p))}</span><span>x</span><span>${sg(q)}</span><span class="v ca">${num(Math.abs(q))}</span><span>= 0</span>`;
  const lines = [
    `x₁,₂ = −${sp("cd", paren(h))} ± √(${sp("cd", paren(h))}² − ${sp("ca", paren(q))})`,
    `x₁,₂ = ${sp("cd", num(A))} ± ${sp("ce", `√${D < 0 ? "(" + num(D) + ")" : num(D)}`)}`,
  ];
  let res = "", cls = "ok";
  if (D > 1e-9) {
    const s = Math.sqrt(D), exact = near(s, Math.round(s * 100) / 100, 1e-9);
    lines.push(`x₁,₂ = ${sp("cd", num(A))} ± ${sp("ce", (exact ? "" : "≈ ") + num(Math.round(s * 100) / 100))}`);
    res = `${sp("cz", `x₁ ${exact ? "=" : "≈"} ${num(Math.round((A - s) * 100) / 100)}`)}, &nbsp; ${sp("cz", `x₂ ${exact ? "=" : "≈"} ${num(Math.round((A + s) * 100) / 100)}`)} &nbsp; (2 Lösungen)`;
  } else if (Math.abs(D) <= 1e-9) { res = `${sp("cz", "x = " + num(A))} &nbsp; (nur 1 Lösung, Scheitel auf der Achse)`; }
  else { cls = "no"; res = "D < 0: Wurzel geht nicht, keine Lösung. Der Scheitel liegt über der x-Achse."; }
  $("pqSteps").innerHTML = lines.map(l => `<div>${l}</div>`).join("");
  $("pqRes").className = "feedback " + cls; $("pqRes").innerHTML = res;
  drawPq();
}
function drawPq() {
  const B = bPq; B.begin();
  const p = +pqP.value, q = +pqQ.value, A = -p / 2, D = r6(A * A - q);
  const cd = tok("--d"), ce = tok("--e"), ink = tok("--ink");
  B.curve(x => x * x + p * x + q, tok("--curve"), 3.5);
  // Tiefe D: senkrechte Strecke Scheitel - Achse
  B.seg(A, 0, A, -D, ce, 3, []);
  // Mitte -p/2 auf der Achse
  B.seg(A, -0.35, A, 0.35, cd, 3, []);
  B.tag([["−p/2 = ", cd], [num(A), cd]], B.X(A), B.Y(0) + (D > 0 ? -28 : 8), { align: "center", base: "top" });
  if (Math.abs(D) > 0.05 && Math.abs(D) < 8) B.tag([[(D > 0 ? "Tiefe D = " : "D = ") + num(D), ce]], B.X(A) + 10, B.Y(-D / 2), { align: "left", base: "middle" });
  if (D > 1e-9) {
    const s = Math.sqrt(D);
    B.seg(A - s, 0, A + s, 0, ce, 4, []);
    B.dot(A - s, 0, tok("--z"), 7); B.dot(A + s, 0, tok("--z"), 7);
    const sv = Math.round(s * 100) / 100, ex = near(s, sv, 1e-9);
    if (s > 0.6) {
      B.tag([["√D " + (ex ? "= " : "≈ ") + num(sv), ce]], B.X(A - s / 2), B.Y(0) + 10, { align: "center", base: "top", size: 13 });
      B.tag([["√D", ce]], B.X(A + s / 2), B.Y(0) + 10, { align: "center", base: "top", size: 13 });
    }
  }
  B.dot(A, -D, ink, 5);
}
[pqP, pqQ].forEach(s => s.addEventListener("input", updPq));

/* =============================================================
   3 DREI FORMEN
   ============================================================= */
const bF = new Board($("cForms"));
let fm = { a: 1, d: 1, e: -4, flip: false };
const fmA = $("fmA"), fmX1 = $("fmX1"), fmX2 = $("fmX2");
function fmZeros() { const t = -fm.e / fm.a; if (t < -1e-9) return []; if (t <= 1e-9) return [fm.d]; const s = Math.sqrt(t); return [fm.d - s, fm.d + s]; }
// Nullstellen in Beschriftungs-Reihenfolge [x1, x2] (x1 kann größer sein, wenn der Regler so steht)
function fmLabeled() { const z = fmZeros(); if (!z.length) return null; if (z.length === 1) return [z[0], z[0]]; return fm.flip ? [z[1], z[0]] : [z[0], z[1]]; }
function fmSetZeros(x1, x2) { fm.d = (x1 + x2) / 2; fm.e = -fm.a * ((x2 - x1) / 2) ** 2; fm.flip = x1 > x2; }
function updForms(fromSlider) {
  const { a, d, e } = fm, Z = fmLabeled();
  $("fmAo").textContent = num(a);
  $("fmSp").innerHTML = scheitelHTML(a, r6(d), r6(e));
  $("fmNf").innerHTML = polyHTML(a, r6(-2 * a * d), r6(a * d * d + e));
  const nul = $("fmNull");
  [fmX1, fmX2].forEach(s => s.disabled = !Z);
  $("fmZoff").hidden = !!Z;
  if (!Z) {
    nul.className = "formula off"; nul.innerHTML = "Gibt es nicht: Die Parabel schneidet die x-Achse nicht, also gibt es keine Nullstellen.";
    $("fmMid").textContent = ""; $("fmX1o").textContent = "–"; $("fmX2o").textContent = "–";
  } else {
    if (!fromSlider) { fmX1.value = r6(Z[0]); fmX2.value = r6(Z[1]); }
    $("fmX1o").textContent = zfmt(Z[0]); $("fmX2o").textContent = zfmt(Z[1]);
    nul.className = "formula mid";
    const approx = Z.some(v => Math.abs(Math.round(v * 100) / 100 - v) > 1e-9);
    nul.innerHTML = nullHTML(a, Z[0], Z[1], true, approx);
    $("fmMid").innerHTML = near(Z[0], Z[1])
      ? `Doppelte Nullstelle bei ${sp("cz", zfmt(Z[0]))}: Der Scheitel liegt auf der x-Achse.`
      : `Mitte der Nullstellen: (${sp("cz", zfmt(Z[0]))} + ${sp("cz", zfmt(Z[1]))}) : 2 = ${sp("cd", num(r6(d)))} &nbsp;=&nbsp; x-Wert des Scheitels`;
  }
  drawForms();
}
function drawForms() {
  const B = bF; B.begin();
  const { a, d, e } = fm, Z = fmLabeled(), cz = tok("--z");
  B.curve(x => a * (x - d) ** 2 + e, tok("--curve"), 3.5);
  if (Z && !near(Z[0], Z[1])) {
    B.seg(Z[0], 0, Z[1], 0, cz, 3, []);
    B.seg(d, e, d, 0, tok("--d"), 1.8);
    B.seg(d, -0.3, d, 0.3, tok("--d"), 3, []);
  }
  if (Z) [...new Set(Z.map(r6))].forEach(x => B.dot(x, 0, cz, 9));
  B.dot(d, e, tok("--curve"), 8);
  const below = a > 0;
  B.tag([["S(", tok("--ink")], [num(r6(d)), tok("--d")], ["|", tok("--ink")], [num(r6(e)), tok("--e")], [")", tok("--ink")]], B.X(d) + 12, B.Y(e) + (below ? 6 : -6), { base: below ? "top" : "bottom" });
  if (Z) {
    if (near(Z[0], Z[1])) B.tag([["x₁ = x₂ = " + zfmt(Z[0]), cz]], B.X(Z[0]), B.Y(0) + (below ? -30 : 10), { align: "center", base: "top", size: 14 });
    else Z.forEach((x, i) => B.tag([[(i ? "x₂ = " : "x₁ = ") + zfmt(x), cz]], B.X(x), B.Y(0) + (below ? -30 : 10), { align: "center", base: "top", size: 14 }));
  }
}
draggable(bF,
  (x, y, px, py) => {
    const Z = fmLabeled();
    if (Z) for (let i = 0; i < 2; i++) if (nearPx(bF, Z[i], 0, px, py, 18)) return { kind: "z", i, other: Z[1 - i] };
    if (nearPx(bF, fm.d, fm.e, px, py, 18)) return { kind: "v" };
    return null;
  },
  (g, x, y) => {
    const s = STEP.look, R = bF.R - 0.5;
    if (g.kind === "v") { fm.d = Math.max(-R, Math.min(R, snapTo(x, s))); fm.e = Math.max(-R, Math.min(R, snapTo(y, s))); fm.flip = false; }
    else {
      const xi = Math.max(-R, Math.min(R, snapTo(x, s))), xo = g.other;
      if (Math.abs(fm.a * ((xi - xo) / 2) ** 2) > R) return; // Scheitel bleibt im Bild
      g.i === 0 ? fmSetZeros(xi, xo) : fmSetZeros(xo, xi);
    }
    updForms();
  }, () => {});
function fmFromSliders() {
  const x1 = +fmX1.value, x2 = +fmX2.value;
  fmSetZeros(x1, x2);
  if (Math.abs(fm.e) > bF.R - 0.5) $("fmMid").innerHTML += ""; // Scheitel evtl. außerhalb, Parabel trotzdem korrekt
  updForms(true);
}
[fmX1, fmX2].forEach(sl => sl.addEventListener("input", fmFromSliders));
fmA.addEventListener("input", () => {
  if (+fmA.value === 0) fmA.value = fm.a > 0 ? -fmA.step : fmA.step;
  const Z = fmLabeled(); fm.a = +fmA.value;
  if (Z) fmSetZeros(Z[0], Z[1]); // Nullstellen bleiben, wenn es welche gibt
  updForms();
});
$("fmReset").addEventListener("click", () => { fm = { a: 1, d: 1, e: -4, flip: false }; fmA.value = 1; updForms(); });

/* =============================================================
   4 SCHEITELPUNKTFORM (Erkunden + Quiz)
   ============================================================= */
const bS = new Board($("cSp"));
const sa = $("spA"), sd = $("spD"), se = $("spE");
let spMode = "explore", target = null, solved = false, hits = 0, tries = 0;
const vText = (a, d, e) => `Scheitelpunkt S(${sp("cd", num(d))} | ${sp("ce", num(e))})<span class="gap"></span>Streckfaktor ${sp("ca", num(a))}`;
function fitVertex() {
  const el = $("spVertex"), pr = $("spProbe");
  pr.style.fontSize = "19px"; pr.innerHTML = vText(-2.95, -5.95, -5.95);
  const avail = el.clientWidth, need = pr.getBoundingClientRect().width;
  el.style.fontSize = need > avail && avail > 0 ? (19 * avail / need * 0.98).toFixed(2) + "px" : "19px";
}
new ResizeObserver(fitVertex).observe($("spVertex"));
function stepsHTML(a, d, e) {
  if (d === 0) return "";
  const s2 = -2 * d, mid = `x² ${s2 > 0 ? "+" : "−"} ${num(Math.abs(s2))}x + ${num(d * d)}`;
  const eP = e === 0 ? "" : e > 0 ? ` + ${sp("ce", num(e))}` : ` − ${sp("ce", num(-e))}`;
  return `y = ${aPre(a, "ca")}(${mid})${eP}`;
}
function updSp() {
  if (+sa.value === 0) sa.value = sa.dataset.last > 0 ? -sa.step : sa.step;
  sa.dataset.last = sa.value;
  const a = +sa.value, d = +sd.value, e = +se.value;
  $("spAo").textContent = num(a); $("spDo").textContent = num(d); $("spEo").textContent = num(e);
  $("spForm").innerHTML = scheitelHTML(a, d, e);
  $("spVertex").innerHTML = vText(a, d, e);
  const st = stepsHTML(a, d, e);
  $("spSteps").innerHTML = st; $("spSteps").hidden = !st;
  $("spNf").innerHTML = (st ? "&nbsp;&nbsp;= " : "y = ") + polyBody(a, r6(-2 * a * d), r6(a * d * d + e));
  drawSp();
}
function drawSp() {
  const B = bS; B.begin();
  const a = +sa.value, d = +sd.value, e = +se.value, muted = tok("--muted"), ink = tok("--ink");
  if ($("spNorm").checked) B.curve(x => x * x, muted, 1.6, [6, 5]);
  if (spMode === "quiz" && target) { B.curve(x => target.a * (x - target.d) ** 2 + target.e, tok("--pencil"), 6); if (solved) B.dot(target.d, target.e, tok("--pencil"), 6); }
  B.curve(x => a * (x - d) ** 2 + e, tok("--curve"), 3.5);
  if (spMode === "explore") {
    B.seg(d, e, d, 0, tok("--d"), 1.5, [4, 4]); B.seg(d, e, 0, e, tok("--e"), 1.5, [4, 4]);
    B.dot(d, e, tok("--curve"), 7);
    B.tag([["S(", ink], [num(d), tok("--d")], ["|", ink], [num(e), tok("--e")], [")", ink]], B.X(d) + 12, B.Y(e) + (a > 0 ? 6 : -6), { base: a > 0 ? "top" : "bottom" });
  } else B.dot(d, e, tok("--curve"), 7);
}
[sa, sd, se].forEach(s => s.addEventListener("input", () => { $("spFb").textContent = ""; updSp(); }));
$("spNorm").addEventListener("change", () => { $("spLegNorm").hidden = !$("spNorm").checked; drawSp(); });
$("spReset").addEventListener("click", () => { sa.value = 1; sd.value = 0; se.value = 0; updSp(); });
draggable(bS,
  (x, y, px, py) => nearPx(bS, +sd.value, +se.value, px, py, 18) ? { v: 1 } : null,
  (g, x, y) => { sd.value = r6(snapTo(x, +sd.step)); se.value = r6(snapTo(y, +se.step)); $("spFb").textContent = ""; updSp(); }, () => {});

const A_CHOICES = [-2, -1, -0.5, 0.5, 1, 2];
function newTarget() {
  let t;
  do t = { a: pick(A_CHOICES), d: rnd(9) - 4, e: rnd(11) - 5 }; while (target && t.a === target.a && t.d === target.d && t.e === target.e);
  target = t; solved = false; $("spFb").textContent = ""; $("spFb").className = "feedback";
  sa.value = 1; sd.value = 0; se.value = 0; updSp();
}
$("spCheck").addEventListener("click", () => {
  if (solved) return;
  const a = +sa.value, d = +sd.value, e = +se.value; tries++;
  const fb = $("spFb");
  const okS = Math.abs(d - target.d) <= 0.15 && Math.abs(e - target.e) <= 0.15, okA = Math.abs(a - target.a) <= 0.1;
  if (okS && okA) { hits++; solved = true; fb.className = "feedback ok"; fb.innerHTML = "Treffer! Exakt: " + scheitelHTML(target.a, target.d, target.e); }
  else {
    fb.className = "feedback no"; const wrong = [];
    if (!okS) wrong.push("Scheitel");
    if (!okA) wrong.push(Math.sign(a) !== Math.sign(target.a) ? "Öffnung" : "Streckfaktor");
    fb.textContent = "Noch nicht: " + wrong.join(" und ") + " prüfen.";
  }
  $("spScore").textContent = `Treffer: ${hits} von ${tries}`; drawSp();
});
$("spSolve").addEventListener("click", () => {
  solved = true; sa.value = target.a; sd.value = target.d; se.value = target.e; updSp();
  const fb = $("spFb"); fb.className = "feedback ok"; fb.innerHTML = scheitelHTML(target.a, target.d, target.e);
});
$("spNext").addEventListener("click", newTarget);
function setSpMode(m) {
  spMode = m; if (hashOn) setHash();
  [sa, sd, se].forEach(s => setStep(s, m === "quiz" ? "match" : "look"));
  $("spTabs").querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.m === m));
  $("spQuizCard").hidden = m !== "quiz"; $("spLegTarget").hidden = m !== "quiz";
  $("spLegMine").textContent = m === "quiz" ? "Eure Parabel" : "Parabel";
  if (m === "quiz") newTarget(); else updSp();
}
$("spTabs").querySelectorAll("button").forEach(b => b.addEventListener("click", () => setSpMode(b.dataset.m)));

/* =============================================================
   4 RECHENTRAINER: Stufen, Aufgaben, Skizze
   ============================================================= */

const LEVELS = [
  { t: "Stufe 1", s: "Scheitelpunktform → allgemeine Form" },
  { t: "Stufe 2", s: "Nullstellenform → allgemeine Form" },
  { t: "Stufe 3", s: "Nullstellen mit der pq-Formel" },
  { t: "Stufe 4", s: "Gleichung aus der Skizze" },
];

function makeTask(l) {
  if (l === 0) {
    const a = pick([1, 1, -1, 2, -2, 3]), d = nz(-5, 5), e = rnd(13) - 6;
    return { l, a, d, e, want: { A: a, B: -2 * a * d, C: a * d * d + e },
      title: "Schreibe in die allgemeine Form um.", task: scheitelHTML(a, d, e),
      hint: "Erst die Klammer mit der binomischen Formel auflösen, dann mit a malnehmen. Negative Zahlen mit Minus eintippen.",
      answer: `<div class="slots"><span>y =</span><span class="p">a</span><span>x² +</span><span class="p">b</span><span>x +</span><span class="p">c</span>
      <span>y =</span>${inp("A")}<span>x² +</span>${inp("B")}<span>x +</span>${inp("C")}</div>`,
      f: x => a * (x - d) ** 2 + e, sol: () => `${scheitelHTML(a, d, e, false)} = ${polyBody(a, -2 * a * d, a * d * d + e)}` };
  }
  if (l === 1) {
    const a = pick([1, 1, -1, 2, -2]); let x1 = rnd(13) - 6, x2 = rnd(13) - 6; if (x1 > x2) [x1, x2] = [x2, x1];
    return { l, a, x1, x2, want: { A: a, B: -a * (x1 + x2), C: a * x1 * x2 },
      title: "Schreibe in die allgemeine Form um.", task: nullHTML(a, x1, x2),
      hint: "Klammern ausmultiplizieren (jedes mit jedem), dann mit a malnehmen.",
      answer: `<div class="slots"><span>y =</span><span class="p">a</span><span>x² +</span><span class="p">b</span><span>x +</span><span class="p">c</span>
      <span>y =</span>${inp("A")}<span>x² +</span>${inp("B")}<span>x +</span>${inp("C")}</div>`,
      f: x => a * (x - x1) * (x - x2), sol: () => `${nullHTML(a, x1, x2, false)} = ${polyBody(a, -a * (x1 + x2), a * x1 * x2)}` };
  }
  if (l === 2) {
    const k = pick([1, 1, 1, 2, -1, 3]);
    let p, q, roots;
    if (Math.random() < 0.18) { const h = rnd(7) - 3; p = 2 * h; q = h * h + 1 + rnd(5); roots = []; }
    else { let r1 = rnd(15) - 7, r2 = rnd(15) - 7; if (r1 > r2) [r1, r2] = [r2, r1]; p = -(r1 + r2); q = r1 * r2; roots = r1 === r2 ? [r1] : [r1, r2]; }
    return { l, k, p, q, roots,
      title: "Berechne die Lösungen.", task: polyBody(k, k * p, k * q) + " = 0",
      hint: k === 1 ? "pq-Formel: x = −p/2 ± √((p/2)² − q). Gibt es nur eine Lösung, trag sie in beide Felder ein." : "Erst durch die Zahl vor x² teilen (Normalform), dann die pq-Formel. Gibt es nur eine Lösung, trag sie in beide Felder ein.",
      answer: `x₁ = ${inp("x1")} &nbsp; x₂ = ${inp("x2")} <label class="chk" style="font-size:17px;font-weight:700"><input type="checkbox" data-k="none"> keine Lösung</label>`,
      f: x => k * (x * x + p * x + q),
      // eigene Prüfung: Reihenfolge egal, Kästchen „keine Lösung“
      check(F, fb) {
        if (F.none.checked) { this.guess = { none: true }; [F.x1, F.x2].forEach(el => el.classList.remove("ok", "bad")); return roots.length === 0; }
        const g = [parse(F.x1.value), parse(F.x2.value)];
        if (g.some(isNaN)) { fb.className = "feedback no"; fb.textContent = "Bitte beide Felder ausfüllen (oder „keine Lösung“)."; return null; }
        this.guess = { xs: g };
        const want = roots.length === 1 ? [roots[0], roots[0]] : roots.slice();
        if (want.length === 0) { mark(F.x1, false); mark(F.x2, false); return false; }
        const ok = (near(g[0], want[0], 0.01) && near(g[1], want[1], 0.01)) || (near(g[0], want[1], 0.01) && near(g[1], want[0], 0.01));
        if (ok) { mark(F.x1, true); mark(F.x2, true); }
        else { mark(F.x1, want.some(w => near(w, g[0], 0.01))); mark(F.x2, want.some(w => near(w, g[1], 0.01))); }
        return ok;
      },
      failMsg() {
        if (this.guess.none) return "Doch, es gibt Lösungen. Rechne D = (p/2)² − q nochmal nach.";
        if (roots.length === 0) return "Schau auf D = (p/2)² − q. Was ist, wenn D negativ ist?";
      },
      sol: () => roots.length === 0 ? `D = (p/2)² − q = ${num((p / 2) ** 2 - q)} &lt; 0 → keine Lösung` : roots.length === 1 ? `x = ${num(roots[0])} (nur eine Lösung)` : `x₁ = ${num(roots[0])}, &nbsp; x₂ = ${num(roots[1])}` };
  }
  const a = pick([1, -1, 2, -2, 0.5, -0.5]), d = rnd(11) - 5, e = rnd(11) - 5;
  return { l, a, d, e, want: { a, d, e },
    title: "Lies die Scheitelpunktform aus der Skizze ab.", task: "",
    hint: "Scheitel S(d | e) ablesen. Für a: vom Scheitel 1 nach rechts, wie viel geht es hoch oder runter? Bei S(−3 | …) ist d = −3.",
    answer: `<div class="slots"><span>y =</span><span class="p ca">a</span><span>·(x −</span><span class="p cd">d</span><span>)² +</span><span class="p ce">e</span>
      <span>y =</span>${inp("a")}<span>·(x −</span>${inp("d")}<span>)² +</span>${inp("e")}</div>`,
    f: x => a * (x - d) ** 2 + e, sol: () => scheitelHTML(a, d, e, false) };
}

function drawTrain() {
  const B = bTrain; B.begin(); if (!task) return;
  const reveal = task.state !== "open"; // richtige Skizze erst nach richtiger Antwort oder „Lösung zeigen“, sonst könnte man ablesen
  const leg = [];
  if (task.l === 3) {
    B.curve(task.f, tok("--pencil"), 5); leg.push(["--pencil", "Gegebene Parabel"]);
    if (task.state !== "open") B.dot(task.d, task.e, tok("--pencil"), 6);
  } else if (reveal) {
    B.curve(task.f, tok("--pencil"), 5); leg.push(["--pencil", "Richtige Parabel"]);
    if (task.l === 2) (task.roots).forEach(r => B.dot(r, 0, tok("--pencil"), 7));
  }
  const g = task.guess;
  if (g && task.state !== "shown") {
    if (task.l === 0 || task.l === 1) { B.curve(x => g.A * x * x + g.B * x + g.C, tok("--curve"), 3); leg.push(["--curve", "Deine Parabel"]); }
    if (task.l === 3) { B.curve(x => g.a * (x - g.d) ** 2 + g.e, tok("--curve"), 3); leg.push(["--curve", "Deine Parabel"]); }
    if (task.l === 2 && g.xs) { g.xs.forEach(x => B.dot(x, 0, tok("--curve"), 5)); leg.push(["--curve", "Deine Lösungen"]); }
  }
  if (!reveal && task.l !== 3) {
    const c = B.ctx; c.font = `15px ${tok("--body")}`; c.fillStyle = tok("--muted"); c.textAlign = "center";
    B.tag([[task.guess ? "Die richtige Skizze kommt, sobald es stimmt" : "Skizze erscheint nach dem Prüfen", tok("--muted")]], B.w / 2, B.Y(-6), { align: "center", base: "middle" });
  }
  $("legTrain").innerHTML = leg.map(([c, t]) => `<span><i style="background:var(${c})"></i>${t}</span>`).join("");
}

// ---------- Musterbeispiel je Stufe ----------

// Musterbeispiele: Kommentar steht in der Zeile VOR dem Schritt (wie bei Äquivalenzumformungen).
// Farben nur für Zahlen/Terme, Rechenzeichen, Klammern, Exponenten und x bleiben weiß; jedes Objekt behält seine Farbe.
// Stufe 1/2: Streckfaktor und x²-Glieder lila, d orange, Nullstellen türkis, x-Glieder blau, Zahlen grün.
// Stufe 3 wie im pq-Tab: p und Mitte −p/2 orange, q lila, Wurzel grün.
const A = t => sp("ca", t), D = t => sp("cd", t), E = t => sp("ce", t), X = t => sp("cx", t), Z = t => sp("cz", t);
const res = t => `<span class="res">${t}</span>`;
const EXAMPLES = [
  { sub: "Schreibe y = " + A("−2") + "(x − " + D("3") + ")² + " + E("4") + " in die allgemeine Form um.", rows: [
    ["y", "= " + A("−2") + " · (x − " + D("3") + ")² + " + E("4"), "binomische Formel"],
    ["", "= " + A("−2") + " · (x² − 2 · x · " + D("3") + " + " + D("3") + "²) + " + E("4"), "ausrechnen"],
    ["", "= " + A("−2") + " · (x² − " + X("6x") + " + " + E("9") + ") + " + E("4"), "mal −2, Vorzeichen!"],
    ["", "= " + A("−2x²") + " + " + X("12x") + " − " + E("18") + " + " + E("4"), "zusammenfassen"],
    ["", "= " + res(A("−2x²") + " + " + X("12x") + " − " + E("14"))],
  ] },
  { sub: "Schreibe y = " + A("2") + "(x + " + Z("1") + ")(x − " + Z("4") + ") in die allgemeine Form um.", rows: [
    ["y", "= " + A("2") + " · (x + " + Z("1") + ") · (x − " + Z("4") + ")", "jedes mit jedem"],
    ["", "= " + A("2") + " · (x · x − x · " + Z("4") + " + " + Z("1") + " · x − " + Z("1") + " · " + Z("4") + ")", "ausrechnen"],
    ["", "= " + A("2") + " · (x² − " + X("4x") + " + " + X("x") + " − " + E("4") + ")", "zusammenfassen"],
    ["", "= " + A("2") + " · (x² − " + X("3x") + " − " + E("4") + ")", "mal 2"],
    ["", "= " + res(A("2x²") + " − " + X("6x") + " − " + E("8"))],
  ] },
  { sub: "Löse 2x² − 4x − 6 = 0 mit der pq-Formel.", rows: [
    { sec: "1. Normalform herstellen" },
    ["2x² − 4x − 6", "= 0", "", "| : 2"],
    ["x² − " + D("2") + "x − " + A("3"), "= 0"],
    { sec: "2. pq-Formel" },
    ["x", "= −" + D("p") + "/2 ± √((" + D("p") + "/2)² − " + A("q") + ")", "einsetzen"],
    ["", "= −(" + D("−2") + ")/2 ± √((" + D("−2") + "/2)² − (" + A("−3") + "))", "ausrechnen"],
    ["", "= " + D("1") + " ± " + E("√") + "((" + E("−1") + ")² + " + E("3") + ")"],
    ["", "= " + D("1") + " ± " + E("√") + "(" + E("1") + " + " + E("3") + ")"],
    ["", "= " + D("1") + " ± " + E("√4")],
    ["", "= " + D("1") + " ± " + E("2")],
    { sec: "3. Die zwei Lösungen" },
    ["x₁", "= " + D("1") + " − " + E("2") + " = " + res("−1")],
    ["x₂", "= " + D("1") + " + " + E("2") + " = " + res("3")],
  ] },
  { sub: "Lies die Scheitelpunktform der blauen Parabel ab.", rows: [
    { html: exGraph({ x0: -6, x1: 3, y0: -5, y1: 5, f: x => -2 * (x + 2) ** 2 + 3, label: "Parabel mit Scheitel und Schritt", skipY: [3],
        path: [[[-2, 3], [-1, 3], [-1, 1]]], pathColor: "--a", dots: [[-2, 3, "--pencil"], [-1, 1, "--a"]],
        labels: [[-1.5, 3.3, "1", "--ink"], [-0.75, 2.2, "2", "--a", "start"], [-2.3, 3.6, "S", "--pencil", "end"]] }) },
    { sec: "1. Scheitel ablesen" },
    ["S", "= (" + D("−2") + " | " + E("3") + ")"],
    { sec: "2. Vom Scheitel 1 nach rechts" },
    ["", A("2") + " nach unten, also " + A("−2")],
    { sec: "3. Einsetzen" },
    ["y", "= " + A("−2") + " · (x − (" + D("−2") + "))² + " + E("3"), "− (−2) = + 2"],
    ["y", "= " + res(A("−2") + " · (x + " + D("2") + ")² + " + E("3"))],
  ] },
];

/* =============================================================
   5 PROFI: Fragen
   ============================================================= */

const PRO = [
  { q: "Eine nach oben geöffnete Normalparabel hat die Nullstellen −1 und 5 (siehe Skizze). Wo liegt ihr Scheitel?",
    pts: [[-1, 0], [5, 0]], cap: "Nur die Nullstellen sind eingezeichnet.",
    opts: ["S(2 | −9)", "S(3 | −9)", "S(2 | 9)", "S(2 | −5)"], ok: 0, after: [{ f: x => (x + 1) * (x - 5) }], afterPts: [[2, -9]],
    ex: "Der Scheitel liegt genau in der Mitte: x = (−1 + 5) : 2 = 2. Einsetzen in y = (x + 1)(x − 5): y = 3 · (−3) = −9." },
  { q: "Für welches e hat y = −2(x − 1)² + e genau eine Nullstelle?",
    graph: [{ f: x => -2 * (x - 1) ** 2 + 3 }], cap: "So sieht die Parabel zum Beispiel für e = 3 aus.",
    opts: ["e = −2", "e = 0", "e = 1", "e = 2"], ok: 1, after: [{ f: x => -2 * (x - 1) ** 2, c: "--e" }],
    ex: "Genau eine Nullstelle heißt: Der Scheitel S(1 | e) liegt auf der x-Achse. Also e = 0 (grün)." },
  { q: "Die Parabel y = (x − 1)(x − 5) wird um 2 nach oben verschoben. Was passiert mit den Nullstellen?",
    graph: [{ f: x => (x - 1) * (x - 5) }], pts: [[1, 0], [5, 0]],
    cap: "Das ist y = (x − 1)(x − 5) mit ihren Nullstellen 1 und 5.",
    after: [{ f: x => (x - 1) * (x - 5) + 2, c: "--pencil", dash: true }], afterPts: [[3 - Math.SQRT2, 0], [3 + Math.SQRT2, 0]],
    afterCap: "Gestrichelt: die um 2 nach oben verschobene Parabel mit ihren neuen Nullstellen.",
    opts: ["Sie wandern beide 2 nach oben.", "Sie rücken näher zusammen.", "Sie rücken weiter auseinander.", "Sie bleiben gleich."], ok: 1,
    ex: "Nullstellen liegen immer auf der x-Achse, sie können nicht „nach oben wandern“. Die verschobene Parabel schneidet die x-Achse weiter unten im Bogen, wo er schmaler ist. Aus 1 und 5 werden 3 − √2 ≈ 1,59 und 3 + √2 ≈ 4,41." },
  { q: "Was haben y = (x − 3)² + 1 und y = −(x − 3)² + 1 gemeinsam?",
    opts: ["Dieselben Nullstellen", "Denselben Scheitel", "Dieselbe allgemeine Form", "Beide haben keine Nullstellen"], ok: 1,
    after: [{ f: x => (x - 3) ** 2 + 1 }, { f: x => -((x - 3) ** 2) + 1, c: "--pencil" }], afterPts: [[3, 1]],
    ex: "Beide haben S(3 | 1). Die blaue ist nach oben geöffnet und hat keine Nullstellen, die rote nach unten und schneidet die x-Achse bei 2 und 4." },
  { q: "Bei der pq-Formel kommt unter der Wurzel genau 0 heraus. Was bedeutet das für die Parabel y = x² + px + q?",
    opts: ["Der Scheitel liegt auf der x-Achse.", "Der Scheitel liegt auf der y-Achse.", "Die Parabel geht durch den Ursprung.", "Die Parabel hat keine Nullstelle."], ok: 0,
    after: [{ f: x => (x - 2) ** 2 }], afterCap: "Beispiel: x² − 4x + 4 = 0, unter der Wurzel steht 4 − 4 = 0.",
    ex: "x = −p/2 ± √0 liefert nur eine Lösung. Die Parabel berührt die x-Achse also nur in einem Punkt, und das ist ihr Scheitel." },
  { q: "Die Parabel y = x² + px + q hat keine Nullstellen. Was gilt dann sicher?",
    opts: ["(p/2)² − q < 0", "q < 0", "p < 0", "q = 0"], ok: 0,
    after: [{ f: x => x * x - 2 * x + 3 }], afterCap: "Beispiel: y = x² − 2x + 3, unter der Wurzel steht 1 − 3 = −2.",
    ex: "Keine Nullstellen heißt: Unter der Wurzel der pq-Formel steht etwas Negatives. Vorsicht: Bei q < 0 gibt es sogar immer zwei Nullstellen, denn dann ist (p/2)² − q sicher positiv." },
  { q: "Die Parabel y = a(x − 1)² + 4 hat den Scheitel S(1 | 4) und geht durch P(3 | 0). Wie groß ist a?",
    pts: [[1, 4, "S"], [3, 0, "P"]], cap: "Nur S und P sind eingezeichnet.",
    opts: ["a = −1", "a = 1", "a = −2", "a = −0,5"], ok: 0, after: [{ f: x => -((x - 1) ** 2) + 4 }],
    ex: "P einsetzen: 0 = a · (3 − 1)² + 4 = 4a + 4. Also a = −1. In der Skizze: Vom Scheitel 2 nach rechts geht es 4 nach unten, bei der Normalparabel wären es genau 2² = 4 nach oben." },
  { q: "Die Parabel y = x² + px + q ist symmetrisch zur gestrichelten Geraden x = 3. Was weißt du über p?",
    graph: [{ f: x => x * x - 6 * x + 5 }], vlines: [3], cap: "Die Parabel ist symmetrisch zur Geraden x = 3.",
    opts: ["p = 3", "p = −3", "p = −6", "p = 6"], ok: 2,
    ex: "Die Symmetrieachse geht durch den Scheitel, und der hat den x-Wert −p/2. Also −p/2 = 3 und damit p = −6. Über q weiß man nichts: Hoch- oder Runterschieben ändert die Achse nicht." },
  { q: "Welche Aussage über diese Parabel ist falsch?", graph: [{ f: x => 0.5 * (x + 2) ** 2 - 2 }],
    opts: ["Der Scheitel ist S(−2 | −2).", "Sie ist gestaucht (breiter als die Normalparabel).", "Ihre Nullstellen sind −4 und 0.", "Sie ist nach unten geöffnet."], ok: 3,
    ex: "Die Parabel ist nach oben geöffnet (a = 0,5 > 0). Alles andere stimmt: y = 0,5(x + 2)² − 2." },
  { q: "Du willst 2x² − 8x = −6 mit der pq-Formel lösen. Welche Werte haben p und q?",
    opts: ["p = −8, q = 6", "p = −4, q = 3", "p = −4, q = −3", "p = 4, q = 3"], ok: 1,
    ex: "Erst alles auf eine Seite: 2x² − 8x + 6 = 0. Dann durch 2 teilen, das ergibt die Normalform x² − 4x + 3 = 0. Also p = −4 und q = 3." },
  { q: "Wie viele Schnittpunkte haben y = x² und die Gerade y = 2x − 1?",
    opts: ["Keinen", "Genau einen", "Zwei", "Kann man ohne Zeichnung nicht sagen"], ok: 1,
    after: [{ f: x => x * x }, { f: x => 2 * x - 1, c: "--pencil" }], afterPts: [[1, 1]],
    ex: "Gleichsetzen: x² = 2x − 1, also x² − 2x + 1 = 0. Unter der Wurzel steht 1 − 1 = 0, also genau eine Lösung x = 1. Die Gerade berührt die Parabel in P(1 | 1)." },
  { q: "Was stimmt für y = (x − 2)² − 9 und y = (x + 1)(x − 5)?",
    opts: ["Das ist dieselbe Parabel.", "Gleicher Scheitel, aber andere Öffnung", "Gleiche Nullstellen, aber verschiedene Scheitel", "Sie haben nichts gemeinsam."], ok: 0,
    after: [{ f: x => (x - 2) ** 2 - 9 }], afterPts: [[2, -9], [-1, 0], [5, 0]],
    ex: "Beide ausmultiplizieren: x² − 4x + 4 − 9 = x² − 4x − 5 und x² − 5x + x − 5 = x² − 4x − 5. Gleiche allgemeine Form, also dieselbe Parabel in zwei Schreibweisen." },
  { q: "Welche Gleichung gehört zu dieser Parabel?", graph: [{ f: x => (x - 2) ** 2 - 3 }],
    opts: ["y = (x + 2)² − 3", "y = x² − 4x + 1", "y = x² + 4x + 1", "y = (x − 2)² + 3"], ok: 1,
    ex: "Scheitel ablesen: S(2 | −3), also y = (x − 2)² − 3. Die steht hier nicht, aber ausmultipliziert: x² − 4x + 4 − 3 = x² − 4x + 1." },
  { q: "Welcher Graph gehört zu y = −(x + 1)(x − 3)?", gopts: [x => (x + 1) * (x - 3), x => -(x - 1) * (x + 3), x => -(x + 1) * (x - 3), x => -((x - 1) ** 2) - 4], ok: 2,
    ex: "Minus vorne: nach unten geöffnet. Nullstellen dort, wo eine Klammer 0 wird: x = −1 und x = 3. Der Scheitel liegt in der Mitte bei x = 1." },
];

/* ---------- Anbindung an das gemeinsame Gerüst ---------- */
const EXPLORE = {
  draw: { pq: drawPq, forms: drawForms, sp: () => { fitVertex(); drawSp(); } },
  canvases: ["cPq", "cForms", "cSp"],
  init() { updPq(); updForms(); updSp(); },
  quiz: { tab: "sp", on: () => spMode === "quiz", start: () => setSpMode("quiz") },
  fontsReady: fitVertex,
};
