/* =============================================================
   TESTLABOR (versteckt, "versteckt": true im Steckbrief)
   Nicht auf der Startseite, nicht im Adminpanel, ohne Anmeldung: nur …/test/.
   Hier werden neue Visualisierungen und Bedienideen ausprobiert,
   bevor sie in ein echtes Labor wandern. Neue Idee = neuer Tab in lab.json + tabs.html.
   ============================================================= */

/* ---------- gemeinsam: Geraden-Aufgaben zum Zeichnen ---------- */
const R_DRAW = 6;
// m = p/q (gekürzt), b ganzzahlig: es gibt immer ganzzahlige Punkte im Bild
const MS = [[1, 1], [2, 1], [3, 1], [-1, 1], [-2, 1], [-3, 1], [1, 2], [-1, 2], [1, 3], [-1, 3], [2, 3], [-2, 3], [3, 2], [-3, 2], [3, 4], [-3, 4]];
function makeLine(prev) {
  let t;
  do { const [p, q] = pick(MS); t = { p, q, m: p / q, b: rnd(7) - 3 }; } while (prev && prev.p === t.p && prev.q === t.q && prev.b === t.b);
  return t;
}
// y = ⅔x − 1: nur Zahlen farbig (m orange, b grün), Zeichen und x bleiben weiß
function eqHTML(t) {
  const sg = t.p < 0 ? "−" : "", P = Math.abs(t.p);
  const mx = t.q === 1 ? (P === 1 ? sg + "x" : sg + sp("cm", P) + "x") : sg + sp("cm", frac(P, t.q)) + "x";
  const bb = t.b === 0 ? "" : (t.b > 0 ? " + " : " − ") + sp("cb", Math.abs(t.b));
  return "y = " + mx + bb;
}
const onLine = (t, x, y) => near(y, t.m * x + t.b);
const coordTag = (bd, x, y) => bd.tag([[`(${num(x)} | ${num(y)})`, tok("--ink")]], bd.X(x) + 10, bd.Y(y) - 8, { base: "bottom", size: 15 });
function lineThrough(bd, A, B, color, w = 3) {
  if (near(A[0], B[0])) bd.seg(A[0], -R_DRAW, A[0], R_DRAW, color, w, []);
  else { const m = (B[1] - A[1]) / (B[0] - A[0]); bd.curve(x => A[1] + m * (x - A[0]), color, w); }
}
const gridPt = (x, y) => [clamp(Math.round(x), -R_DRAW, R_DRAW), clamp(Math.round(y), -R_DRAW, R_DRAW)];
const samePt = (A, B) => A && B && A[0] === B[0] && A[1] === B[1];
function setFb(el, ok, text) { el.className = "feedback" + (ok === null ? "" : ok ? " ok" : " no"); el.textContent = text; }
const scoreTxt = n => `Richtig gezeichnet: ${n}`;

// Ziehen mit Griff beim Antippen: down(x,y,px,py) liefert Griff (oder null), move(griff,x,y)
function grabber(bd, down, move, hover, redraw) {
  const c = bd.c; let g = null;
  c.addEventListener("pointerdown", e => { const [x, y, px, py] = bd.pointer(e); g = down(x, y, px, py); if (g) { c.setPointerCapture(e.pointerId); e.preventDefault(); redraw(); } });
  c.addEventListener("pointermove", e => {
    const [x, y, px, py] = bd.pointer(e);
    if (g) { if (move(g, x, y)) redraw(); } else c.style.cursor = hover(x, y, px, py);
  });
  const end = () => { g = null; };
  c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
}

/* =============================================================
   VARIANTE A: zwei Punkte setzen, die Gerade läuft automatisch durch
   ============================================================= */
const ZP = (() => {
  const bd = new Board($("cZp"), R_DRAW);
  const st = { t: makeLine(), pts: [], res: null, show: false, solved: false, n: 0 };
  function draw() {
    bd.begin();
    if (st.show) bd.curve(x => st.t.m * x + st.t.b, tok("--pencil"), 3);
    const ok = st.res === true;
    if (st.pts.length === 2) lineThrough(bd, st.pts[0], st.pts[1], ok ? tok("--e") : tok("--curve"));
    for (const P of st.pts) {
      const col = st.res === null ? tok("--curve") : onLine(st.t, P[0], P[1]) ? tok("--e") : tok("--pencil");
      bd.dot(P[0], P[1], col, 7);
      coordTag(bd, P[0], P[1]);
    }
  }
  function changed() { st.res = null; setFb($("zpFb"), null, ""); }
  function newTask() { st.t = makeLine(st.t); st.pts = []; st.show = false; st.solved = false; changed(); $("zpTask").innerHTML = eqHTML(st.t); draw(); }
  const hit = (px, py) => st.pts.findIndex(P => nearPx(bd, P[0], P[1], px, py, 18));
  grabber(bd, (x, y, px, py) => {
    const i = hit(px, py); if (i >= 0) return { i };
    const G = gridPt(x, y);
    if (st.pts.some(P => samePt(P, G))) return null;
    if (st.pts.length < 2) { st.pts.push(G); changed(); return { i: st.pts.length - 1 }; }
    // schon zwei Punkte: der nähere springt hierher
    const d = st.pts.map(P => Math.hypot(P[0] - x, P[1] - y)), j = d[0] <= d[1] ? 0 : 1;
    st.pts[j] = G; changed(); return { i: j };
  }, (g, x, y) => {
    const G = gridPt(x, y);
    if (samePt(G, st.pts[g.i]) || st.pts.some((P, k) => k !== g.i && samePt(P, G))) return false;
    st.pts[g.i] = G; changed(); return true;
  }, (x, y, px, py) => hit(px, py) >= 0 ? "grab" : "crosshair", draw);

  $("zpCheck").addEventListener("click", () => {
    if (st.pts.length < 2) { setFb($("zpFb"), false, "Setze zwei Punkte."); return; }
    st.res = st.pts.every(P => onLine(st.t, P[0], P[1]));
    if (st.res && !st.solved && !st.show) { st.solved = true; st.n++; $("zpScore").textContent = scoreTxt(st.n); }
    setFb($("zpFb"), st.res, st.res ? "Richtig!" : "Leider nicht.");
    draw();
  });
  $("zpClear").addEventListener("click", () => { st.pts = []; changed(); draw(); });
  $("zpShow").addEventListener("click", () => { st.show = true; draw(); });
  $("zpNext").addEventListener("click", newTask);
  return { draw, init() { $("zpTask").innerHTML = eqHTML(st.t); $("zpScore").textContent = scoreTxt(0); }, st };
})();

/* =============================================================
   VARIANTE B: erst y-Achsenabschnitt auf der y-Achse, dann Steigungsdreieck ziehen
   ============================================================= */
const SD = (() => {
  const bd = new Board($("cSd"), R_DRAW);
  const st = { t: makeLine(), B: null, Q: null, res: null, show: false, solved: false, n: 0 };
  function tri(B, Q, col, dash, labels) {
    bd.seg(B[0], B[1], Q[0], B[1], col, 2.5, dash);
    bd.seg(Q[0], B[1], Q[0], Q[1], col, 2.5, dash);
    if (!labels) return;
    const dx = Q[0] - B[0], dy = Q[1] - B[1];
    const below = dy > 0; // waagerechte Seite: Zahl auf der vom Dreieck abgewandten Seite
    bd.tag([[num(dx), col]], bd.X((B[0] + Q[0]) / 2), bd.Y(B[1]) + (below ? 6 : -6), { align: "center", base: below ? "top" : "bottom", size: 17 });
    if (dy) bd.tag([[num(dy), col]], bd.X(Q[0]) + (dx > 0 ? 8 : -8), bd.Y((B[1] + Q[1]) / 2), { align: dx > 0 ? "left" : "right", base: "middle", size: 17 });
  }
  function draw() {
    bd.begin();
    const t = st.t;
    if (st.show) { bd.curve(x => t.m * x + t.b, tok("--pencil"), 3); tri([0, t.b], [t.q, t.b + t.p], tok("--pencil"), [6, 5], false); }
    const ok = st.res === true;
    if (st.B && st.Q) {
      lineThrough(bd, st.B, st.Q, ok ? tok("--e") : tok("--curve"));
      tri(st.B, st.Q, tok("--d"), [], true);
      bd.dot(st.Q[0], st.Q[1], tok("--d"), 6);
    }
    if (st.B) {
      const col = st.res === null || st.B[1] === t.b ? tok("--e") : tok("--pencil");
      bd.dot(0, st.B[1], col, 8);
    }
    steps();
  }
  function steps() {
    const s1 = st.B ? "ok" : "act", s2 = st.B && st.Q ? "ok" : st.B ? "act" : "";
    $("sdSteps").innerHTML = `<span class="n ${s1}">1</span><span class="t">y-Achsenabschnitt auf die y-Achse setzen</span>
      <span class="n ${s2}">2</span><span class="t${st.B ? "" : " off"}">Steigungsdreieck ziehen</span>`;
  }
  function changed() { st.res = null; setFb($("sdFb"), null, ""); }
  function newTask() { st.t = makeLine(st.t); st.B = st.Q = null; st.show = false; st.solved = false; changed(); $("sdTask").innerHTML = eqHTML(st.t); draw(); }
  const onB = (px, py) => st.B && nearPx(bd, 0, st.B[1], px, py, 18);
  const onQ = (px, py) => st.Q && nearPx(bd, st.Q[0], st.Q[1], px, py, 18);
  grabber(bd, (x, y, px, py) => {
    if (onQ(px, py)) return { k: "Q" };
    if (onB(px, py) && st.Q) return { k: "B" };
    if (!st.B) { if (Math.abs(x) > 1) return null; st.B = [0, gridPt(0, y)[1]]; changed(); return { k: "B" }; }
    // Steigungsdreieck: vom Punkt auf der y-Achse aus aufziehen
    if (onB(px, py)) return { k: "Q", fresh: true };
    const G = gridPt(x, y); if (G[0] === 0) return null;
    st.Q = G; changed(); return { k: "Q" };
  }, (g, x, y) => {
    if (g.k === "B") {
      const yb = gridPt(0, y)[1]; if (yb === st.B[1]) return false;
      // Dreieck wandert mit
      if (st.Q) st.Q = [st.Q[0], clamp(st.Q[1] + yb - st.B[1], -R_DRAW, R_DRAW)];
      st.B = [0, yb]; changed(); return true;
    }
    const G = gridPt(x, y); if (G[0] === 0 || samePt(G, st.Q)) return false;
    st.Q = G; changed(); return true;
  }, (x, y, px, py) => onQ(px, py) || onB(px, py) ? "grab" : !st.B && Math.abs(x) > 1 ? "default" : "crosshair", draw);

  $("sdCheck").addEventListener("click", () => {
    if (!st.B || !st.Q) { setFb($("sdFb"), false, st.B ? "Zieh das Steigungsdreieck." : "Setze den Punkt auf die y-Achse."); return; }
    st.res = st.B[1] === st.t.b && onLine(st.t, st.Q[0], st.Q[1]);
    if (st.res && !st.solved && !st.show) { st.solved = true; st.n++; $("sdScore").textContent = scoreTxt(st.n); }
    setFb($("sdFb"), st.res, st.res ? "Richtig!" : "Leider nicht.");
    draw();
  });
  $("sdClear").addEventListener("click", () => { st.B = st.Q = null; changed(); draw(); });
  $("sdShow").addEventListener("click", () => { st.show = true; draw(); });
  $("sdNext").addEventListener("click", newTask);
  return { draw, init() { $("sdTask").innerHTML = eqHTML(st.t); $("sdScore").textContent = scoreTxt(0); steps(); }, st };
})();

/* ---------- Anbindung an das gemeinsame Gerüst ---------- */
const EXPLORE = {
  draw: { zp: ZP.draw, sd: SD.draw },
  canvases: ["cZp", "cSd"],
  init() { ZP.init(); SD.init(); window.__test = { ZP, SD }; },
};
