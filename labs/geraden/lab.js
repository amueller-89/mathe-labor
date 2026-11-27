// y = m·x + b als HTML
function lineHTML(m, b, col = true) {
  m = r6(m); b = r6(b);
  const cm = col ? "cm" : "", cb = col ? "cb" : "";
  if (m === 0) return `y = ${sp(cb, num(b))}`;
  const mx = m === 1 ? "x" : m === -1 ? sp(cm, "−") + "x" : sp(cm, num(m)) + "x";
  const bp = b === 0 ? "" : b > 0 ? ` + ${sp(cb, num(b))}` : ` − ${sp(cb, num(-b))}`;
  return `y = ${mx}${bp}`;
}

/* =============================================================
   1 STEIGUNG & Y-ACHSENABSCHNITT (Erkunden + Quiz)
   ============================================================= */
const bMb = new Board($("cMb"));
const sM = $("mbM"), sB = $("mbB");
let mbMode = "explore", target = null, solved = false, hits = 0, tries = 0;
function updMb() {
  const m = +sM.value, b = +sB.value;
  $("mbMo").textContent = num(m); $("mbBo").textContent = num(b);
  $("mbForm").innerHTML = lineHTML(m, b);
  const dir = m > 0 ? "die Gerade steigt" : m < 0 ? "die Gerade fällt" : "die Gerade ist waagerecht";
  $("mbInfoM").innerHTML = `Steigung ${sp("cm", "m = " + num(m))}: ${dir}`;
  $("mbInfoB").innerHTML = `y-Achsenabschnitt ${sp("cb", "b = " + num(b))}: Schnitt mit der y-Achse bei (0 | ${sp("cb", num(b))})`;
  const xs = [-2, -1, 0, 1, 2, 3];
  $("mbTable").innerHTML = `<tr><th>x</th>${xs.map(x => `<th>${num(x)}</th>`).join("")}</tr><tr><th>y</th>${xs.map(x => `<td>${num(r6(m * x + b))}</td>`).join("")}</tr>`;
  drawMb();
}
function drawMb() {
  const B = bMb; B.begin();
  const m = +sM.value, b = +sB.value, cd = tok("--d"), ce = tok("--e"), ink = tok("--ink");
  if (mbMode === "quiz" && target) { B.curve(x => target.m * x + target.b, tok("--pencil"), 6); if (solved) B.dot(0, target.b, tok("--pencil"), 6); }
  B.curve(x => m * x + b, tok("--curve"), 3.5);
  if (mbMode === "explore") (/* Tabellenpunkte */[-2, -1, 2, 3]).forEach(x => B.dot(x, m * x + b, tok("--curve"), 4, false));
  {
    // Steigungsdreieck: 1 nach rechts, m hoch/runter (auch im Quiz, an der eigenen Geraden)
    B.seg(0, b, 1, b, ink, 2.5, []);
    B.seg(1, b, 1, b + m, cd, 3.5, []);
    B.tag([["1", ink]], B.X(0.5), B.Y(b) + (m >= 0 ? 4 : -22), { align: "center", base: "top", size: 14 });
    if (Math.abs(m) > 0.04) B.tag([["m = " + num(m), cd]], B.X(1) + 8, B.Y(b + m / 2), { align: "left", base: "middle", size: 15 });
    B.dot(1, b + m, cd, 8);
    B.dot(0, b, ce, 8);
    B.tag([["b = " + num(b), ce]], B.X(0) - 10, B.Y(b), { align: "right", base: "middle", size: 15 });
  }
}
[sM, sB].forEach(s => s.addEventListener("input", () => { $("mbFb").textContent = ""; updMb(); }));
$("mbReset").addEventListener("click", () => { sM.value = 0.5; sB.value = 1; updMb(); });
draggable(bMb,
  (x, y, px, py) => {
    const m = +sM.value, b = +sB.value;
    if (nearPx(bMb, 1, b + m, px, py, 18)) return { k: "m" };
    if (nearPx(bMb, 0, b, px, py, 18)) return { k: "b" };
    return null;
  },
  (g, x, y) => {
    if (g.k === "b") sB.value = clamp(snapTo(y, +sB.step), -6, 6);
    else sM.value = clamp(snapTo(y - +sB.value, +sM.step), -4, 4);
    $("mbFb").textContent = ""; updMb();
  });
const M_CHOICES = [-3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3];
function newTarget() {
  let t;
  do t = { m: pick(M_CHOICES), b: rnd(11) - 5 }; while (target && t.m === target.m && t.b === target.b);
  target = t; solved = false; $("mbFb").textContent = ""; $("mbFb").className = "feedback";
  sM.value = 0; sB.value = 0; updMb();
}
$("mbCheck").addEventListener("click", () => {
  if (solved) return;
  const m = +sM.value, b = +sB.value; tries++;
  const fb = $("mbFb");
  const okM = Math.abs(m - target.m) <= 0.1, okB = Math.abs(b - target.b) <= 0.15;
  if (okM && okB) { hits++; solved = true; fb.className = "feedback ok"; fb.innerHTML = "Treffer! Exakt: " + lineHTML(target.m, target.b); }
  else {
    fb.className = "feedback no"; const wrong = [];
    if (!okM) wrong.push(Math.sign(m) !== Math.sign(target.m) ? "Richtung (steigt oder fällt?)" : "Steigung");
    if (!okB) wrong.push("y-Achsenabschnitt");
    fb.textContent = "Noch nicht: " + wrong.join(" und ") + " prüfen.";
  }
  $("mbScore").textContent = `Treffer: ${hits} von ${tries}`; drawMb();
});
$("mbSolve").addEventListener("click", () => {
  solved = true; sM.value = target.m; sB.value = target.b; updMb();
  const fb = $("mbFb"); fb.className = "feedback ok"; fb.innerHTML = lineHTML(target.m, target.b);
});
$("mbNext").addEventListener("click", newTarget);
function setMbMode(m) {
  mbMode = m; if (hashOn) setHash();
  [sM, sB].forEach(s => setStep(s, m === "quiz" ? "match" : "look"));
  $("mbTabs").querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.m === m));
  $("mbQuizCard").hidden = m !== "quiz"; $("mbLegTarget").hidden = m !== "quiz";
  $("mbTableCard").hidden = m === "quiz"; $("mbLegTri").hidden = false;
  $("mbLegMine").textContent = m === "quiz" ? "Eure Gerade" : "Gerade";
  if (m === "quiz") newTarget(); else updMb();
}
$("mbTabs").querySelectorAll("button").forEach(b => b.addEventListener("click", () => setMbMode(b.dataset.m)));

/* =============================================================
   2 ZWEI PUNKTE
   ============================================================= */
const bPts = new Board($("cPts"));
let P = { x: -2, y: -1 }, Q = { x: 2, y: 1 };
function updPts() {
  const dx = r6(Q.x - P.x), dy = r6(Q.y - P.y);
  $("ptsPQ").innerHTML = `${sp("cz", "P")}(${num(P.x)} | ${num(P.y)}) &nbsp; ${sp("cz", "Q")}(${num(Q.x)} | ${num(Q.y)})`;
  if (dx === 0) {
    $("ptsM").innerHTML = `m = ${frac("Δy", "Δx")} = ${frac(`${num(Q.y)} − ${paren(P.y)}`, `${num(Q.x)} − ${paren(P.x)}`)} = ${frac(sp("cm", num(dy)), "0")} &nbsp;<span style="color:var(--pencil)">geht nicht!</span>`;
    $("ptsB").innerHTML = `<span style="color:var(--pencil)">Senkrechte Gerade: Zu x = ${num(P.x)} gehören viele y-Werte. Das ist keine Funktion.</span>`;
    $("ptsEq").innerHTML = `<span style="color:var(--pencil);font-size:.7em">keine Funktion (x = ${num(P.x)})</span>`;
  } else {
    const m = dy / dx, mr = Math.round(m * 1000) / 1000, exact = near(m, mr, 1e-9);
    const b = P.y - m * P.x, br = Math.round(b * 1000) / 1000;
    const eq = exact ? "=" : "≈";
    $("ptsM").innerHTML = `m = ${frac("Δy", "Δx")} = ${frac(`${num(Q.y)} − ${paren(P.y)}`, `${num(Q.x)} − ${paren(P.x)}`)} = ${frac(sp("cm", num(dy)), num(dx))} ${eq} ${sp("cm", num(mr))}`;
    $("ptsB").innerHTML = `${num(P.y)} = ${sp("cm", paren(mr))} · ${paren(P.x)} + ${sp("cb", "b")} &nbsp;→&nbsp; ${sp("cb", "b")} ${near(b, br, 1e-9) && exact ? "=" : "≈"} ${sp("cb", num(br))}`;
    $("ptsEq").innerHTML = (exact && near(b, br, 1e-9)) ? lineHTML(mr, br) : lineHTML(mr, br).replace(/^y = /, "y ≈ ");
  }
  drawPts();
}
function drawPts() {
  const B = bPts; B.begin();
  const dx = r6(Q.x - P.x), dy = r6(Q.y - P.y), cd = tok("--d"), ink = tok("--ink"), cz = tok("--z");
  if (dx === 0) B.seg(P.x, -B.R, P.x, B.R, tok("--pencil"), 3.5, []);
  else {
    const m = dy / dx, b = P.y - m * P.x;
    B.curve(x => m * x + b, tok("--curve"), 3.5);
    B.seg(P.x, P.y, Q.x, P.y, ink, 2.5, []);
    B.seg(Q.x, P.y, Q.x, Q.y, cd, 3.5, []);
    if (Math.abs(dx) > 0.3) B.tag([["Δx = " + num(dx), ink]], B.X((P.x + Q.x) / 2), B.Y(P.y) + (dy >= 0 ? 6 : -24), { align: "center", base: "top", size: 14 });
    if (Math.abs(dy) > 0.3) B.tag([["Δy = " + num(dy), cd]], B.X(Q.x) + (dx > 0 ? 8 : -8), B.Y((P.y + Q.y) / 2), { align: dx > 0 ? "left" : "right", base: "middle", size: 14 });
    if (Math.abs(b) <= B.R) B.dot(0, b, tok("--e"), 6);
  }
  B.dot(P.x, P.y, cz, 9); B.dot(Q.x, Q.y, cz, 9);
  B.tag([["P", cz]], B.X(P.x) - 12, B.Y(P.y) - 10, { align: "right", base: "bottom" });
  B.tag([["Q", cz]], B.X(Q.x) + 12, B.Y(Q.y) - 10, { align: "left", base: "bottom" });
}
draggable(bPts,
  (x, y, px, py) => nearPx(bPts, P.x, P.y, px, py, 18) ? P : nearPx(bPts, Q.x, Q.y, px, py, 18) ? Q : null,
  (pt, x, y) => { pt.x = clamp(snapTo(x, STEP.look), -7.5, 7.5); pt.y = clamp(snapTo(y, STEP.look), -7.5, 7.5); updPts(); });

/* =============================================================
   3 RECHENTRAINER: Stufen, Aufgaben, Skizze
   ============================================================= */

const LEVELS = [
  { t: "Stufe 1", s: "Gleichung aus dem Graphen" },
  { t: "Stufe 2", s: "In Normalform bringen" },
  { t: "Stufe 3", s: "Wertetabelle ausfüllen" },
  { t: "Stufe 4", s: "Gerade durch zwei Punkte" },
];

const mbSlots = `<div class="slots"><span>y =</span><span class="p cm">m</span><span>· x +</span><span class="p cb">b</span>
  <span>y =</span>${inp("m")}<span>· x +</span>${inp("b")}</div>`;

function termsHTML(terms) {
  // terms: [{k, x:true/false}]
  return "y = " + terms.map((t, i) => {
    const neg = t.k < 0, a = Math.abs(t.k);
    const body = t.x ? (a === 1 ? "x" : num(a) + "x") : num(a);
    return i === 0 ? (neg ? "−" : "") + body : (neg ? " − " : " + ") + body;
  }).join("");
}
function makeTask(l) {
  if (l === 0) {
    const m = pick([-3, -2, -1, -0.5, 0.5, 1, 2, 3, 1.5, -1.5]), b = rnd(11) - 5;
    return { l, want: { m, b }, title: "Lies die Gleichung aus dem Graphen ab.", task: "",
      hint: "m: Zwei Punkte auf Kästchenecken suchen, Steigungsdreieck einzeichnen, m = hoch durch rechts (Δy : Δx). b: Wo schneidet die Gerade die y-Achse?",
      answer: mbSlots, f: x => m * x + b, given: true, sol: () => lineHTML(m, b, false) };
  }
  if (l === 1) {
    const m = nz(-4, 4), b = rnd(13) - 6;
    let a1; do a1 = nz(-6, 6); while (a1 === m);
    let c1; do c1 = nz(-7, 7); while (c1 === b);
    const terms = [{ k: a1, x: true }, { k: m - a1, x: true }, { k: c1, x: false }, { k: b - c1, x: false }];
    for (let i = terms.length - 1; i > 0; i--) { const j = rnd(i + 1); [terms[i], terms[j]] = [terms[j], terms[i]]; }
    return { l, want: { m, b }, title: "Bringe die Gleichung in die Normalform y = m·x + b.", task: termsHTML(terms),
      hint: "Erst alle x-Terme zusammenfassen, dann alle Zahlen ohne x. Negative Zahlen mit Minus eintippen.",
      answer: mbSlots, f: x => m * x + b, sol: () => `${termsHTML(terms)} = ${lineHTML(m, b, false).replace("y = ", "")}` };
  }
  if (l === 2) {
    const m = pick([-3, -2, -1, -0.5, 0.5, 1, 2, 3]), b = rnd(11) - 5;
    const pool = [-3, -2, -1, 0, 1, 2, 3, 4]; for (let i = pool.length - 1; i > 0; i--) { const j = rnd(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const xs = pool.slice(0, 4).sort((u, v) => u - v);
    const want = {}; xs.forEach((x, i) => want["y" + i] = r6(m * x + b));
    const head = `<span class="h">x</span><span class="h">y</span>` + xs.map((x, i) => `<span class="h">${num(x)}</span>${inp("y" + i)}`).join("");
    return { l, want, xs, title: "Fülle die Wertetabelle aus.", task: lineHTML(m, b),
      hint: "x einsetzen: y = m · x + b. Vorsicht bei negativen x-Werten.",
      answer: `<div class="tgrid">${head}</div>`, f: x => m * x + b,
      sol: () => xs.map(x => `x = ${num(x)}: y = ${num(r6(m * x + b))}`).join(" &nbsp; ") };
  }
  const m = pick([-3, -2, -1, -0.5, 0.5, 1, 2, 3]), b = rnd(9) - 4;
  let x1, x2, y1, y2;
  do {
    x1 = rnd(7) - 4; const dx = Math.abs(m) === 0.5 ? pick([2, 4]) : pick([1, 2, 3]); x2 = x1 + dx;
    y1 = m * x1 + b; y2 = m * x2 + b;
  } while (Math.abs(y1) > 7 || Math.abs(y2) > 7 || x2 > 6);
  return { l, want: { m, b }, P: [x1, y1], Q: [x2, y2], title: "Bestimme die Gerade durch die beiden Punkte.",
    task: `P(${num(x1)} | ${num(y1)}), &nbsp; Q(${num(x2)} | ${num(y2)})`,
    hint: "m = Δy : Δx = (f(x₂) − f(x₁)) : (x₂ − x₁). Dann einen Punkt in y = m · x + b einsetzen und nach b auflösen.",
    answer: mbSlots, f: x => m * x + b, sol: () => `m = ${num(y2 - y1)} : ${num(x2 - x1)} = ${num(m)}, &nbsp; ${lineHTML(m, b, false)}` };
}

function drawTrain() {
  const B = bTrain; B.begin(); if (!task) return;
  const reveal = task.state !== "open", leg = []; // richtige Skizze erst nach richtiger Antwort oder „Lösung zeigen“, sonst könnte man ablesen
  if (task.l === 0) { B.curve(task.f, tok("--pencil"), 5); leg.push(["--pencil", "Gegebene Gerade"]); }
  else if (reveal) { B.curve(task.f, tok("--pencil"), 5); leg.push(["--pencil", "Richtige Gerade"]); }
  if (task.l === 3) { B.dot(task.P[0], task.P[1], tok("--z"), 7); B.dot(task.Q[0], task.Q[1], tok("--z"), 7); leg.push(["--z", "P und Q"]); }
  if (task.l === 2 && reveal) task.xs.forEach(x => B.dot(x, task.f(x), tok("--pencil"), 6));
  const g = task.guess;
  if (g && task.state !== "shown") {
    if (task.l === 2) { task.xs.forEach((x, i) => B.dot(x, g["y" + i], tok("--curve"), 5)); leg.push(["--curve", "Deine Punkte"]); }
    else { B.curve(x => g.m * x + g.b, tok("--curve"), 3); leg.push(["--curve", "Deine Gerade"]); }
  }
  if (!reveal && task.l !== 0 && task.l !== 3) B.tag([[task.guess ? "Die richtige Skizze kommt, sobald es stimmt" : "Skizze erscheint nach dem Prüfen", tok("--muted")]], B.w / 2, B.Y(-6), { align: "center", base: "middle" });
  $("legTrain").innerHTML = leg.map(([c, t]) => `<span><i style="background:var(${c})"></i>${t}</span>`).join("");
}

// ---------- Musterbeispiel je Stufe ----------

const M = t => `<span class="cm">${t}</span>`, Bc = t => `<span class="cb">${t}</span>`, Z = t => `<span class="cz">${t}</span>`;
const res = t => `<span class="res">${t}</span>`;
// Musterbeispiele: Kommentar steht in der Zeile VOR dem Schritt (wie bei Äquivalenzumformungen).
// Farben nur für Zahlen/Terme (m orange, b grün, Punkte türkis); Rechenzeichen, Klammern, x bleiben weiß.
const EXAMPLES = [
  { sub: "Lies die Gleichung der blauen Geraden ab.", rows: [
    { html: exGraph({ x0: -4, x1: 5, y0: -5, y1: 5, f: x => 1.5 * x - 2, label: "Gerade mit zwei Punkten und Steigungsdreieck", skipY: [-2],
        path: [[[2, 1], [4, 1], [4, 4]]], dots: [[2, 1, "--z"], [4, 4, "--z"], [0, -2, "--e"]],
        labels: [[3, 0.35, "2", "--d"], [4.25, 2.6, "3", "--d", "start"], [1.75, 1.45, "P", "--z", "end"], [3.75, 4.45, "Q", "--z", "end"], [-0.3, -2.45, "b", "--e", "end"]] }) },
    { sec: "1. Zwei Punkte auf Kästchenecken" },
    [Z("P"), "= (" + Z("2") + " | " + Z("1") + ")"],
    [Z("Q"), "= (" + Z("4") + " | " + Z("4") + ")"],
    { sec: "2. Steigungsdreieck von P nach Q" },
    ["Δx", "= " + Z("4") + " − " + Z("2") + " = " + M("2")],
    ["Δy", "= " + Z("4") + " − " + Z("1") + " = " + M("3")],
    { sec: "3. m = hoch durch rechts" },
    [M("m"), "= " + frac("Δy", "Δx"), "einsetzen"],
    ["", "= " + frac(M("3"), M("2"))],
    ["", "= " + M("1,5")],
    { sec: "4. b an der y-Achse ablesen" },
    [Bc("b"), "= " + Bc("−2")],
    { sec: "5. Einsetzen" },
    ["y", "= " + res(M("1,5") + "x − " + Bc("2"))],
  ] },
  { sub: "Bringe y = " + M("−2x") + " + " + Bc("7") + " + " + M("5x") + " − " + Bc("9") + " in die Normalform y = mx + b.", rows: [
    ["y", "= " + M("−2x") + " + " + Bc("7") + " + " + M("5x") + " − " + Bc("9"), "sortieren"],
    ["", "= " + M("−2x") + " + " + M("5x") + " + " + Bc("7") + " − " + Bc("9"), "zusammenfassen"],
    ["", "= " + res(M("3x") + " − " + Bc("2"))],
    { sec: "Ablesen" },
    [M("m"), "= " + M("3")],
    [Bc("b"), "= " + Bc("−2")],
  ] },
  { sub: "Fülle die Wertetabelle für y = " + M("−2") + "x + " + Bc("3") + " aus.", rows: [
    { sec: "x = " + Z("−2") },
    ["y", "= " + M("−2") + " · (" + Z("−2") + ") + " + Bc("3"), "erst mal, dann plus"],
    ["", "= 4 + " + Bc("3")],
    ["", "= " + res("7")],
    { sec: "x = " + Z("3") },
    ["y", "= " + M("−2") + " · " + Z("3") + " + " + Bc("3"), "erst mal, dann plus"],
    ["", "= −6 + " + Bc("3")],
    ["", "= " + res("−3")],
    { sec: "Genauso für x = " + Z("0") + " und x = " + Z("1") },
    { html: `<div class="extab"><span>x</span><span>${Z("−2")}</span><span>${Z("0")}</span><span>${Z("1")}</span><span>${Z("3")}</span><span>y</span><span>7</span><span>3</span><span>1</span><span>−3</span></div>` },
  ] },
  { sub: "Bestimme die Gerade durch P(" + Z("−1") + " | " + Z("4") + ") und Q(" + Z("3") + " | " + Z("−4") + ").", rows: [
    { sec: "1. Steigung" },
    [M("m"), "= " + frac("f(x₂) − f(x₁)", "x₂ − x₁"), "Q und P einsetzen"],
    ["", "= " + frac(Z("−4") + " − " + Z("4"), Z("3") + " − (" + Z("−1") + ")")],
    ["", "= " + frac("−8", "4")],
    ["", "= " + M("−2")],
    { sec: "2. b: P in y = mx + b einsetzen" },
    [Z("4"), "= " + M("−2") + " · (" + Z("−1") + ") + " + Bc("b")],
    [Z("4"), "= 2 + " + Bc("b"), "", "| − 2"],
    ["2", "= " + Bc("b")],
    { sec: "3. Ergebnis" },
    ["y", "= " + res(M("−2") + "x + " + Bc("2"))],
  ] },
];

/* =============================================================
   4 PROFI: Fragen
   ============================================================= */

const PRO = [
  { q: "An der Geraden ist ein Steigungsdreieck mit Δx = 1 und Δy = 2 eingezeichnet. Jetzt zeichnet man ein größeres Steigungsdreieck mit Δx = 3. Was gilt dann für die Steigung m?",
    graph: [{ f: x => 2 * x - 2 }], segs: [[0, -2, 1, -2, "--d"], [1, -2, 1, 0, "--d"]], cap: "Orange: Steigungsdreieck mit Δx = 1 und Δy = 2.",
    opts: ["m bleibt 2.", "m wird 6.", "m wird 3-mal so klein.", "Das hängt davon ab, wo man das Dreieck zeichnet."], ok: 0,
    afterSegs: [[1, 0, 4, 0, "--e"], [4, 0, 4, 6, "--e"]], afterCap: "Grün: das große Dreieck mit Δx = 3 und Δy = 6.",
    ex: "Geht man 3 nach rechts, geht es 6 nach oben: m = Δy/Δx = 6 : 3 = 2. Bei einer Geraden ist jedes Steigungsdreieck gleich steil, egal wie groß oder wo." },
  { q: "Bei y = 3x − 1 wird b von −1 auf 4 geändert. Was passiert mit der Geraden?",
    graph: [{ f: x => 3 * x - 1 }], cap: "Das ist y = 3x − 1.",
    opts: ["Sie wird um 5 nach oben verschoben.", "Sie wird steiler.", "Sie wird um 5 nach rechts verschoben.", "Sie dreht sich um den Punkt (0 | −1)."], ok: 0,
    after: [{ f: x => 3 * x + 4, c: "--e", dash: true }], afterCap: "Gestrichelt: y = 3x + 4.",
    ex: "b verschiebt die Gerade nur nach oben oder unten, die Steigung m = 3 bleibt gleich. Von −1 auf 4 sind es 5 nach oben." },
  { q: "Was gilt für m und b bei dieser Geraden?", graph: [{ f: x => -0.8 * x - 2 }], noNums: true,
    opts: ["m < 0 und b < 0", "m > 0 und b < 0", "m < 0 und b > 0", "m > 0 und b > 0"], ok: 0,
    ex: "Die Gerade fällt von links nach rechts: m < 0. Sie schneidet die y-Achse unterhalb von 0: b < 0. Dafür braucht man keine einzige Zahl." },
  { q: "Lena berechnet die Steigung der Geraden durch P(1 | 4) und Q(3 | 0) so: m = (3 − 1) : (0 − 4) = −0,5. Was ist falsch?",
    pts: [[1, 4, "P"], [3, 0, "Q"]],
    opts: ["Sie hat x- und y-Werte vertauscht.", "Sie hätte zuerst Q und dann P abziehen müssen.", "Nichts, m = −0,5 stimmt.", "Die Steigung darf nicht negativ sein."], ok: 0,
    after: [{ f: x => -2 * x + 6 }], afterCap: "Die Gerade durch P und Q fällt steil: m = −2.",
    ex: "Oben im Bruch steht Δy = f(x₂) − f(x₁) = 0 − 4 = −4, unten Δx = x₂ − x₁ = 3 − 1 = 2. Richtig ist m = −4 : 2 = −2." },
  { q: "Ein Taxi kostet 3 € Grundgebühr und 2 € pro gefahrenem Kilometer. Welche Gleichung beschreibt den Preis y (in €) für x Kilometer?",
    opts: ["y = 2x + 3", "y = 3x + 2", "y = 5x", "y = 2x − 3"], ok: 0,
    after: [{ f: x => 2 * x + 3 }], afterPts: [[0, 3]], afterCap: "Die Gerade startet bei 3 € (b) und steigt pro km um 2 € (m).",
    ex: "Die Grundgebühr zahlt man auch bei 0 km: Das ist der y-Achsenabschnitt b = 3. Pro Kilometer kommen 2 € dazu: Das ist die Steigung m = 2." },
  { q: "Tarif A: 10 € im Monat plus 0,10 € pro Minute. Tarif B: keine Grundgebühr, aber 0,30 € pro Minute. Ab wie vielen Minuten im Monat ist Tarif A günstiger?",
    opts: ["Ab mehr als 50 Minuten", "Ab mehr als 33 Minuten", "Ab mehr als 100 Minuten", "Tarif A ist nie günstiger."], ok: 0,
    ex: "A: y = 0,1x + 10, B: y = 0,3x. Gleich teuer bei 0,3x = 0,1x + 10, also 0,2x = 10 und x = 50. Danach ist B teurer, weil seine Gerade steiler ist." },
  { q: "Eine Kerze ist 20 cm lang und brennt pro Stunde 2,5 cm ab. Nach wie vielen Stunden ist sie ganz abgebrannt?",
    opts: ["Nach 8 Stunden", "Nach 10 Stunden", "Nach 17,5 Stunden", "Nach 50 Stunden"], ok: 0,
    ex: "Länge: y = −2,5x + 20. Abgebrannt heißt y = 0: 2,5x = 20, also x = 8. Kontrolle: 8 · 2,5 = 20." },
  { q: "Ein Radfahrer hat nach x Stunden y Kilometer zurückgelegt: y = 18x. Was bedeutet m = 18?",
    opts: ["Er fährt 18 km pro Stunde.", "Er ist nach 18 Stunden am Ziel.", "Er startet 18 km vom Start entfernt.", "Die ganze Strecke ist 18 km lang."], ok: 0,
    ex: "m sagt, um wie viel y wächst, wenn x um 1 wächst: pro Stunde 18 km mehr, also 18 km/h. b = 0 heißt: Er startet bei 0 km." },
  { q: "Bei welcher Geraden gilt: Geht man 2 nach rechts, geht es 3 nach unten?",
    graph: [{ f: x => -1.5 * x + 2 }], hideGraphUntil: true,
    opts: ["y = −1,5x + 2", "y = −3x + 2", "y = 1,5x + 2", "y = −2x + 3"], ok: 0,
    ex: "m = (−3) : 2 = −1,5. Die Steigung sagt, wie viel es pro 1 nach rechts hoch oder runter geht." },
  { q: "Bei y = m·x + 3 wird nur m verändert. Welcher Punkt liegt immer auf der Geraden, egal welches m?",
    opts: ["(0 | 3)", "(3 | 0)", "(1 | 3)", "Keiner, die Gerade verschiebt sich."], ok: 0,
    after: [{ f: x => -2 * x + 3, c: "--muted" }, { f: x => -0.5 * x + 3, c: "--muted" }, { f: x => 0.5 * x + 3, c: "--muted" }, { f: x => 1.5 * x + 3, c: "--muted" }],
    afterPts: [[0, 3, "(0|3)"]], afterCap: "Alle Geraden y = m·x + 3 drehen sich um den Punkt (0 | 3).",
    ex: "Bei x = 0 ist m · 0 = 0, also y = 3 für jedes m. Ändert man m, dreht sich die Gerade um (0 | 3)." },
  { q: "Die Gerade y = 2x + 1 wird an der y-Achse gespiegelt. Welche Gleichung hat die gespiegelte Gerade?",
    graph: [{ f: x => 2 * x + 1 }], cap: "Das ist y = 2x + 1.",
    opts: ["y = −2x + 1", "y = −2x − 1", "y = 2x − 1", "y = 0,5x + 1"], ok: 0,
    after: [{ f: x => -2 * x + 1, c: "--e", dash: true }], afterCap: "Gestrichelt: die gespiegelte Gerade y = −2x + 1.",
    ex: "Der Punkt (0 | 1) liegt auf der y-Achse und bleibt beim Spiegeln liegen, also bleibt b = 1. Aus Steigen wird Fallen: m = −2." },
  { q: "Was stimmt für die Geraden y = 2x + 1 und y = 2x − 3?",
    opts: ["Sie sind parallel und schneiden sich nie.", "Sie schneiden sich im Punkt (0 | 1).", "Es ist dieselbe Gerade.", "Sie stehen senkrecht aufeinander."], ok: 0,
    after: [{ f: x => 2 * x + 1 }, { f: x => 2 * x - 3, c: "--pencil" }],
    ex: "Gleiche Steigung m = 2, aber verschiedene y-Achsenabschnitte: Die Geraden laufen parallel nebeneinander her und treffen sich nie." },
  { q: "Die Wertetabelle gehört zu einer linearen Funktion. Welcher Wert fehlt?", table: [[-1, 1, 2, 4], [5, 1, "?", -5]],
    opts: ["−1", "−3", "0", "−2"], ok: 0,
    after: [{ f: x => -2 * x + 3 }], afterPts: [[-1, 5], [1, 1], [2, -1], [4, -5]],
    ex: "Vorsicht, die x-Werte haben verschiedene Abstände! Von x = −1 bis x = 1 (2 nach rechts) fällt y um 4: m = −4 : 2 = −2. Von x = 1 bis x = 2 ist es 1 Schritt, also 2 weniger: 1 − 2 = −1. Kontrolle: Von 2 bis 4 sind es 2 Schritte: −1 − 4 = −5." },
  { q: "Die Gerade y = m·x + 2 geht durch P(3 | −4). Wie groß ist m?",
    pts: [[0, 2, "(0|2)"], [3, -4, "P"]], cap: "Eingezeichnet: der y-Achsenabschnitt und P.",
    opts: ["m = −2", "m = 2", "m = −3", "m = −0,5"], ok: 0, after: [{ f: x => -2 * x + 2 }],
    ex: "Von (0 | 2) nach P(3 | −4) geht es 3 nach rechts und 6 nach unten: m = −6 : 3 = −2. Oder einsetzen: −4 = m · 3 + 2, also 3m = −6." },
  { q: "Welche Gerade ist am steilsten?",
    opts: ["y = 0,5x + 4", "y = −3x + 1", "y = 2x − 5", "y = x"], ok: 1,
    after: [{ f: x => 0.5 * x + 4, c: "--muted" }, { f: x => -3 * x + 1, c: "--pencil" }, { f: x => 2 * x - 5, c: "--muted" }, { f: x => x, c: "--muted" }],
    afterCap: "Rot: y = −3x + 1, sie fällt am steilsten.",
    ex: "Steil heißt: Die Zahl m ist weit weg von 0, egal ob positiv oder negativ. −3 ist weiter von 0 weg als 2, 1 oder 0,5. Die Gerade fällt also am steilsten." },
  { q: "Welcher Punkt liegt auf der Geraden y = −0,5x + 1?",
    opts: ["(4 | −1)", "(2 | 1)", "(−2 | 0)", "(1 | −0,5)"], ok: 0,
    after: [{ f: x => -0.5 * x + 1 }], afterPts: [[4, -1]],
    ex: "x einsetzen und vergleichen: −0,5 · 4 + 1 = −2 + 1 = −1. Passt! Bei (2 | 1) käme 0 heraus, bei (−2 | 0) käme 2 heraus, bei (1 | −0,5) käme 0,5 heraus." },
  { q: "Wo schneidet die Gerade y = 2x − 6 die x-Achse?",
    opts: ["Bei (3 | 0)", "Bei (−6 | 0)", "Bei (0 | −6)", "Bei (−3 | 0)"], ok: 0,
    after: [{ f: x => 2 * x - 6 }], afterPts: [[3, 0], [0, -6]],
    ex: "Auf der x-Achse ist y = 0: 0 = 2x − 6, also x = 3. Vorsicht: (0 | −6) ist der Schnitt mit der y-Achse." },
  { q: "Zu welcher Gleichung passt diese Wertetabelle?", table: [[0, 1, 2, 3], [5, 3, 1, -1]],
    opts: ["y = −2x + 5", "y = 2x + 5", "y = −2x + 1", "y = 5x − 2"], ok: 0,
    after: [{ f: x => -2 * x + 5 }], afterPts: [[0, 5], [1, 3], [2, 1], [3, -1]],
    ex: "Bei x = 0 steht y = 5, also b = 5. Pro Schritt nach rechts wird y um 2 kleiner, also m = −2." },
  { q: "Welcher Graph gehört zu keiner Funktion?",
    gopts: [{ v: 2 }, { f: x => 2 }, { f: x => 3 * x - 1 }, { f: x => -0.5 * x + 1 }], ok: 0,
    ex: "Bei einer Funktion gehört zu jedem x genau ein y (Senkrechtentest: Eine senkrechte Linie darf den Graphen höchstens einmal treffen). Die senkrechte Gerade x = 2 hat zu x = 2 unendlich viele y-Werte. Die waagerechte Gerade y = 2 ist dagegen eine Funktion mit m = 0." },
  { q: "Welche Gleichung gehört zu dieser Geraden?", graph: [{ f: x => 0.5 * x - 2 }],
    opts: ["y = 0,5x − 2", "y = 2x − 2", "y = −0,5x − 2", "y = 0,5x + 2"], ok: 0,
    ex: "Die Gerade schneidet die y-Achse bei −2, also b = −2. Geht man 2 nach rechts, geht es 1 nach oben: m = 1 : 2 = 0,5." },
  { q: "Welcher Graph gehört zu y = −x + 2?",
    gopts: [{ f: x => x + 2 }, { f: x => -x - 2 }, { f: x => -x + 2 }, { f: x => -2 * x + 1 }], ok: 2,
    ex: "b = 2: Schnitt mit der y-Achse bei 2. m = −1: pro 1 nach rechts 1 nach unten, die Gerade fällt." },
];

/* ---------- Anbindung an das gemeinsame Gerüst ---------- */
const EXPLORE = {
  draw: { mb: drawMb, pts: drawPts },          // Zeichenfunktion je Tab
  canvases: ["cMb", "cPts"],                     // bei Größenänderung neu zeichnen
  init() { updMb(); updPts(); },
  quiz: { tab: "mb", on: () => mbMode === "quiz", start: () => setMbMode("quiz") },  // …#steigung/quiz
};
