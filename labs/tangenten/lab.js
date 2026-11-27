/* =============================================================
   TANGENTEN-LABOR (nur Erkunden, kein Rechentrainer)
   tan: Tangente an y = x² mit Lupe · nor: Steigungen an y = x² → Gerade
   kub: kubische Funktion → Punkte liegen auf einer Parabel
   ============================================================= */
const C = n => tok(n);
const r2 = v => Math.round(v * 100) / 100;

// Erkunden-Stand merken (in der Version mit Anmeldung je Name, falls sich mehrere ein Gerät teilen)
const EX_KEY = (() => {
  let n = ""; try { if (ADMIN) n = (localStorage.getItem("labor-" + LAB.id + "-name") || "").toLowerCase(); } catch (_) {}
  return LAB.id + "-erkunden-v3" + (n ? "-" + n : "");
})();
let EXS = {}; try { EXS = JSON.parse(localStorage.getItem(EX_KEY)) || {}; } catch (_) {}
const exSave = () => { try { localStorage.setItem(EX_KEY, JSON.stringify(EXS)); } catch (_) {} changed(); };

// ---------- Zeichenhelfer ----------
function tangent(B, f, df, a, col = C("--d"), w = 3) { const y0 = f(a), m = df(a); B.curve(x => y0 + m * (x - a), col, w); }
// Steigungsdreieck: 1 nach rechts, Steigung nach oben/unten. Startet in P oder endet in P, je nachdem, was ins Bild passt.
function triangle(B, f, df, a, label) {
  const y0 = f(a), m = df(a), top = B.cy + B.R, bot = B.cy - B.R;
  let x1 = a, y1 = y0;
  if (triSide(B, f, df, a) < 0) { x1 = a - 1; y1 = y0 - m; }
  const ink = C("--ink"), ce = C("--e");
  B.seg(x1, y1, x1 + 1, y1, ink, 2.5, []);
  B.seg(x1 + 1, y1, x1 + 1, y1 + m, ce, 3.5, []);
  B.tag([["1", ink]], B.X(x1 + 0.5), B.Y(y1) + (m >= 0 ? 4 : -22), { align: "center", base: "top", size: 15 });
  if (label != null && Math.abs(m) > 1e-9) B.tag([[label, ce]], B.X(x1 + 1) + 8, B.Y(y1 + m / 2), { align: "left", base: "middle", size: 17 });
}
// Seite, auf der das Steigungsdreieck liegt: +1 = es startet in P (rechts davon), −1 = es endet in P (links davon)
function triSide(B, f, df, a) { const y0 = f(a), m = df(a); return y0 + m > B.cy + B.R || y0 + m < B.cy - B.R ? -1 : 1; }
// „P“ neben den Punkt schreiben: side = −1 links, +1 rechts
function pLabel(B, a, y, side) {
  B.tag([["P", C("--ink")]], B.X(a) + 12 * side, B.Y(y) - 10, { align: side < 0 ? "right" : "left", base: "bottom", size: 16 });
}
// feste Breiten (x bis „−2,95“, y bis „8,7025“), x rechtsbündig, y linksbündig: „|“ bleibt stehen
const pHTML = (x, y, wy = 4.1) => `<span class="nw">P(${fx("", x, 3.3, "right")} | ${fx("", y, wy, "left")})</span>`;
// neue Frage ins Bild holen, falls sie unten aus dem Fenster ragt
const seen = el => requestAnimationFrame(() => { try { el.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (_) {} });
// Multiple Choice: opts = [[Text, richtig?], …]; fertig() nach der richtigen Antwort
function mc(box, opts, fertig, fbId, cls = "") {
  const wrap = document.createElement("div"); wrap.className = "opts " + cls; box.appendChild(wrap);
  const fb = document.createElement("div"); fb.className = "feedback"; fb.id = fbId; box.appendChild(fb);
  opts.forEach(([t, ok]) => {
    const b = document.createElement("button"); b.className = "opt"; b.type = "button"; b.innerHTML = `<span>${t}</span>`;
    b.addEventListener("click", () => {
      if (ok) { wrap.querySelectorAll("button").forEach(x => x.disabled = true); b.classList.add("right"); fb.className = "feedback ok"; fb.textContent = "Genau!"; setTimeout(fertig, 700); }
      else { b.classList.add("wrong"); b.disabled = true; fb.className = "feedback no"; fb.textContent = "Schau nochmal genau hin."; }
    });
    wrap.appendChild(b);
  });
}

/* =============================================================
   1 TANGENTE (mit Lupe)
   ============================================================= */
const f2 = x => x * x, d2 = x => 2 * x;
const bT = new Board($("cTan"), 6, 0, 4), bL = new Board($("cLupe"), 1);
bL.lab = 1e9; bL.xName = bL.yName = " ";
const tanX = $("tanX");
let zoom = 5;
function updTan() {
  const a = +tanX.value;
  $("tanXo").textContent = num(a);
  $("tanP").innerHTML = pHTML(num(a), num(r6(a * a)));
  drawTan();
}
function drawTan() {
  const a = +tanX.value, y = a * a, B = bT;
  B.begin();
  B.curve(f2, C("--curve"), 3.5);
  tangent(B, f2, d2, a);
  const c = B.ctx; c.save(); c.setLineDash([5, 4]); c.strokeStyle = C("--muted"); c.lineWidth = 1.5;
  c.beginPath(); c.arc(B.X(a), B.Y(y), Math.max(12, B.R / zoom * B.u), 0, 2 * Math.PI); c.stroke(); c.restore();
  B.dot(a, y, C("--ink"), 7);
  pLabel(B, a, y, a > 0 ? -1 : 1);
  const L = bL; L.R = B.R / zoom; L.cx = a; L.cy = y;
  L.begin();
  L.curve(f2, C("--curve"), 6);
  tangent(L, f2, d2, a, C("--d"), 3);
  L.dot(a, y, C("--ink"), 7);
}
tanX.addEventListener("input", updTan);
draggable(bT, (x, y, px, py) => nearPx(bT, +tanX.value, f2(+tanX.value), px, py, 20) || Math.abs(bT.Y(f2(x)) - py) < 14 ? {} : null,
  (g, x) => { tanX.value = clamp(snapTo(x, STEP.look), -3, 3); updTan(); });
document.querySelectorAll("#tanZoom button").forEach(b => b.addEventListener("click", () => {
  zoom = +b.dataset.z;
  document.querySelectorAll("#tanZoom button").forEach(x => x.setAttribute("aria-selected", x === b));
  drawTan();
}));

/* =============================================================
   2 STEIGUNGEN AN y = x² (Tabelle → Punkte → Gerade)
   Ein Beispiel: f, df, fn (Gleichung), xs (Stellen), view/sview [R, cx, cy], m, b (Gerade der Steigungen),
   ask (Stelle für die Vorhersage), rule (Merksatz)
   ============================================================= */
function slopeLab(P, presets) {
  const B = new Board($(P + "C")), S = new Board($(P + "S"));
  S.lab = 2;
  let k = 0, st = null;
  const fresh = () => ({ v: {}, act: 0, tri: true, stage: 0, free: 0 });
  const Q = () => presets[k];
  const save = () => { EXS[P] = { k, st }; exSave(); };
  function load(i, keep) {
    k = i; st = keep || fresh();
    const q = Q(); [B.R, B.cx, B.cy] = q.view; [S.R, S.cx, S.cy] = q.sview;
    if (!keep) st.free = q.xs[0];
    $(P + "Fn").innerHTML = q.fn;
    table(); question(); draw();
  }
  const filled = i => st.v[i] != null;
  const allFilled = () => Q().xs.every((_, i) => filled(i));
  function table() {
    const q = Q();
    $(P + "Tbl").innerHTML = `<table class="wt tt"><tr><th>Stelle x</th>${q.xs.map((x, i) => `<th data-i="${i}"><button type="button" data-i="${i}">${num(x)}</button></th>`).join("")}</tr>` +
      `<tr><th>Steigung</th>${q.xs.map((x, i) => `<td data-i="${i}"><input data-i="${i}" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="Steigung bei x = ${num(x)}"></td>`).join("")}</tr></table>`;
    $(P + "Tbl").querySelectorAll("input").forEach(el => {
      const i = +el.dataset.i;
      if (filled(i)) { el.value = num(st.v[i]); el.readOnly = true; el.classList.add("ok"); }
      el.addEventListener("focus", () => setAct(i));
      el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); check(); } });
    });
    $(P + "Tbl").querySelectorAll("th button").forEach(b => b.addEventListener("click", () => setAct(+b.dataset.i, true)));
    markAct();
    const done = st.stage > 0;
    $(P + "Check").disabled = done; $(P + "Tri").disabled = done;
  }
  function markAct() {
    $(P + "Tbl").querySelectorAll("[data-i]").forEach(el => { if (el.tagName === "TH" || el.tagName === "TD") el.classList.toggle("act", st.stage === 0 && +el.dataset.i === st.act); });
    $(P + "Tri").textContent = st.tri ? "Steigungsdreieck ausblenden" : "Steigungsdreieck zeigen";
  }
  function setAct(i, focus) {
    if (st.stage > 0) return;
    if (st.act !== i) { st.act = i; $(P + "Fb").textContent = ""; }
    markAct(); draw();
    const el = $(P + "Tbl").querySelector(`input[data-i="${i}"]`);
    if (focus && !filled(i)) el.focus();
  }
  function check() {
    if (st.stage > 0) return;
    const q = Q(), i = st.act, el = $(P + "Tbl").querySelector(`input[data-i="${i}"]`), fb = $(P + "Fb");
    if (filled(i)) return;
    const v = parse(el.value);
    if (isNaN(v)) { fb.className = "feedback no"; fb.textContent = "Bitte eine Zahl eintippen."; return; }
    const want = q.df(q.xs[i]);
    if (!near(v, want, 0.01)) {
      el.classList.add("bad"); fb.className = "feedback no"; fb.textContent = "Noch nicht.";
      draw(); return;
    }
    st.v[i] = want; el.value = num(want); el.readOnly = true; el.classList.remove("bad"); el.classList.add("ok");
    fb.className = "feedback ok"; fb.textContent = "Richtig!";
    const next = q.xs.findIndex((_, j) => !filled(j));
    if (next < 0) { st.stage = 1; save(); table(); question(); draw(); seen($(P + "Q")); return; }
    save(); draw();
    setTimeout(() => { if (st.act === i) setAct(next, true); }, 600);
  }
  $(P + "Check").addEventListener("click", check);
  $(P + "Tri").addEventListener("click", () => { st.tri = !st.tri; markAct(); draw(); });

  function question() {
    const box = $(P + "Q"), q = Q();
    box.hidden = st.stage === 0; box.innerHTML = "";
    $(P + "Btns").hidden = st.stage > 0; $(P + "Fb").hidden = st.stage > 0; $(P + "Fb").textContent = "";
    if (st.stage === 0) return;
    const done = [];
    if (st.stage > 1) done.push("Die Punkte liegen auf einer Geraden.");
    if (st.stage > 2) done.push(`Gerade: y = ${linBody(q.m, q.b)}`);
    if (st.stage > 3) done.push(`Steigung bei x = ${num(q.ask)}: ${num(q.df(q.ask))}`);
    if (done.length && st.stage < 4) box.insertAdjacentHTML("beforeend", `<div class="done">${done.map(t => `<span>${t}</span>`).join("")}</div>`);
    const next = () => { st.stage++; save(); question(); draw(); seen(box); };
    if (st.stage === 1) {
      box.insertAdjacentHTML("beforeend", `<p class="qh">Die Punkte liegen …</p>`);
      mc(box, [["auf einer Parabel", false], ["auf einer Geraden", true], ["ohne Muster verteilt", false]], next, P + "McFb", "three");
    } else if (st.stage === 2 || st.stage === 3) {
      const isEq = st.stage === 2;
      box.insertAdjacentHTML("beforeend", isEq
        ? `<p class="qh">Wie heißt die Gleichung dieser Geraden?</p><div class="qa">y = <input id="${P}In" autocomplete="off" spellcheck="false"><button class="btn primary" id="${P}Go" type="button">Prüfen</button></div>`
        : `<p class="qh">Ohne Zeichnen: Welche Steigung hat die Tangente an der Stelle x = ${num(q.ask)}?</p><div class="qa"><input id="${P}In" class="num" inputmode="decimal" autocomplete="off"><button class="btn primary" id="${P}Go" type="button">Prüfen</button></div>`);
      box.insertAdjacentHTML("beforeend", `<div class="feedback" id="${P}QFb" aria-live="polite"></div>`);
      const inp = $(P + "In"), fb = $(P + "QFb");
      const go = () => {
        let ok;
        if (isEq) {
          const g = parseLin(inp.value);
          if (!g) { fb.className = "feedback no"; fb.textContent = "Bitte eine Gleichung mit x eintippen."; return; }
          ok = near(g.m, q.m, 0.001) && near(g.b, q.b, 0.001);
        } else {
          const v = parse(inp.value);
          if (isNaN(v)) { fb.className = "feedback no"; fb.textContent = "Bitte eine Zahl eintippen."; return; }
          ok = near(v, q.df(q.ask), 0.001);
        }
        inp.classList.toggle("ok", ok); inp.classList.toggle("bad", !ok);
        fb.className = "feedback " + (ok ? "ok" : "no"); fb.textContent = ok ? "Richtig!" : "Noch nicht.";
        if (ok) { inp.readOnly = true; $(P + "Go").disabled = true; setTimeout(next, 700); }
      };
      $(P + "Go").addEventListener("click", go);
      inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go(); } });
      if (current === P) setTimeout(() => inp.focus(), 50);
    } else {
      const lo = Math.min(...q.xs), hi = Math.max(...q.xs);
      box.insertAdjacentHTML("beforeend", `<div class="rule">${q.rule}</div>
        <div class="live" id="${P}Live"></div>
        <div class="sl"><b>x</b><input type="range" id="${P}X" min="${lo}" max="${hi}" data-step="look" value="${st.free}"><output id="${P}Xo"></output></div>
        ${presets.length > 1 ? `<div class="row" style="margin-top:6px"><button class="btn" id="${P}Next" type="button">Nächste Parabel</button></div>` : ""}`);
      const sl = $(P + "X"); setStep(sl, "look"); sl.value = st.free;
      sl.addEventListener("input", () => { st.free = +sl.value; live(); draw(); });
      sl.addEventListener("change", save);
      if ($(P + "Next")) $(P + "Next").addEventListener("click", () => { load((k + 1) % presets.length); save(); });
      live();
    }
  }
  function live() {
    const q = Q(), a = st.free;
    $(P + "Xo").textContent = num(a);
    $(P + "Live").innerHTML = `Stelle ${fx("", num(a), 3)} &nbsp; Steigung ${fx("ce", num(r6(q.df(a))), 3.4)}`;
  }
  function draw() {
    const q = Q(), ink = C("--ink"), ce = C("--e");
    const a = st.stage >= 4 ? st.free : q.xs[st.act], known = st.stage >= 4 || filled(st.act);
    B.begin();
    B.curve(q.f, C("--curve"), 3.5);
    tangent(B, q.f, q.df, a);
    if (st.tri || known) triangle(B, q.f, q.df, a, known ? num(r6(q.df(a))) : "?");
    B.dot(a, q.f(a), ink, 7);
    pLabel(B, a, q.f(a), -triSide(B, q.f, q.df, a));
    S.begin();
    if (st.stage >= 2) S.curve(x => q.m * x + q.b, ce, 2.5, [8, 6]);
    if (st.stage < 4) S.seg(a, S.cy - S.R, a, S.cy + S.R, C("--d"), 1.5, [3, 5]);
    q.xs.forEach((x, i) => { if (filled(i)) S.dot(x, q.df(x), ce, 6); });
    if (st.stage >= 4) S.dot(a, q.df(a), ink, 7);
  }
  const linBody = (m, b) => {
    const mx = m === 0 ? "" : m === 1 ? "x" : m === -1 ? "−x" : num(m) + "x";
    if (!b) return mx || "0";
    return mx ? `${mx} ${b > 0 ? "+" : "−"} ${num(Math.abs(b))}` : num(b);
  };
  const saved = EXS[P];
  const init = () => { if (saved && presets[saved.k] && saved.st) load(saved.k, Object.assign(fresh(), saved.st)); else load(0); };
  return { draw, init };
}

const NOR = slopeLab("nor", [{
  f: f2, df: d2, fn: "y = x²", xs: [-2, -1, 0, 1, 2],
  view: [5, 0, 3], sview: [5, 0, 0], m: 2, b: 0, ask: 10,
  rule: "An der Stelle x hat die Tangente an <span class=nw>y = x²</span> die Steigung <span class=nw>2·x</span>.",
}]);

/* =============================================================
   3 KUBISCHE FUNKTION (angeleitet: Punkte sammeln → Parabel)
   y = ¼x³ − 3x + 1, Hochpunkt (−2|5), Tiefpunkt (2|−3), Wendepunkt (0|1)
   Steigung: ¾(x − 1)² − 3 (Parabel mit Scheitel (1|−3), Nullstellen −1 und 3)
   ============================================================= */
const fk = x => 0.25 * x ** 3 - 3 * x + 1, dk = x => 0.75 * x * x - 3;
const bK = new Board($("cKub"), 5, 0, 1), sK = new Board($("kubS"), 7, 0, 3);
sK.lab = 2;
const kubX = $("kubX"), KUB_N = 6;
let kub = Object.assign({ pts: [], stage: -1 }, EXS.kub || {}); // stage −1: nur der Graph
const kubSave = () => { EXS.kub = kub; exSave(); };
function updKub() {
  const a = +kubX.value;
  $("kubXo").textContent = num(a);
  $("kubP").innerHTML = `${pHTML(num(a), num(r2(fk(a))), 3.3)}<span class="gap"></span>Steigung ${fx("ce", num(r2(dk(a))), 3.6)}`;
  drawKub();
}
function drawKub() {
  const a = +kubX.value, ink = C("--ink"), ce = C("--e"), B = bK, S = sK;
  B.begin();
  if (kub.stage >= 3) [-2, 2].forEach(x => B.seg(x, B.cy - B.R, x, B.cy + B.R, C("--z"), 1.5));
  B.curve(fk, C("--curve"), 3.5);
  if (kub.stage < 0) return;
  tangent(B, fk, dk, a);
  triangle(B, fk, dk, a, num(r2(dk(a))));
  if (kub.stage >= 3) {
    [[-2, 5, "H"], [2, -3, "T"], [0, 1, "W"]].forEach(([x, y, t]) => { B.dot(x, y, C("--z"), 6); B.tag([[t, C("--z")]], B.X(x) + 10, B.Y(y) - 8, { base: "bottom", size: 15 }); });
  }
  B.dot(a, fk(a), ink, 7);
  pLabel(B, a, fk(a), -triSide(B, fk, dk, a));
  S.begin();
  if (kub.stage >= 2) S.curve(dk, ce, 2.5, [8, 6]);
  if (kub.stage >= 3) {
    [-2, 2].forEach(x => { S.seg(x, 0, x, sK.cy + sK.R, C("--z"), 1.5); S.dot(x, 0, C("--z"), 6); });
    S.dot(0, -3, C("--z"), 6);
  }
  kub.pts.forEach(([x, m]) => S.dot(x, m, ce, 6));
  S.dot(a, dk(a), ink, 6);
  const c = S.ctx; c.save(); c.strokeStyle = ink; c.lineWidth = 2; c.beginPath(); c.arc(S.X(a), S.Y(dk(a)), 9, 0, 2 * Math.PI); c.stroke(); c.restore();
}
function kubQuestion() {
  const box = $("kubQ"); box.innerHTML = ""; box.hidden = kub.stage < 0;
  const intro = kub.stage < 0;
  $("kubIntro").hidden = !intro; $("kubCtl").hidden = intro; $("kubSCard").hidden = intro; $("kubLegT").hidden = intro;
  $("kubLede").style.visibility = intro ? "hidden" : "";
  if (kub.stage === 0) box.insertAdjacentHTML("beforeend", `<p class="qh" style="margin:0">Trage mehr Punkte ab!</p>`);
  const next = () => { kub.stage++; kubSave(); kubQuestion(); drawKub(); seen(box); };
  if (kub.stage === 1) {
    box.insertAdjacentHTML("beforeend", `<p class="qh">Die Punkte liegen …</p>`);
    mc(box, [["auf einer Geraden", false], ["auf einer Parabel", true], ["auf einer Kurve wie der blauen", false], ["ohne Muster verteilt", false]], next, "kubMcFb");
  } else if (kub.stage === 2) {
    box.insertAdjacentHTML("beforeend", `<p class="qh">Wo ist die Tangente waagerecht?</p>`);
    mc(box, [["an den Nullstellen der grünen Parabel", true], ["am Scheitel der grünen Parabel", false], ["an den Nullstellen der blauen Kurve", false], ["nur bei x = 0", false]], next, "kubMcFb");
  } else if (kub.stage >= 3) {
    box.insertAdjacentHTML("beforeend", `<div class="done"><span>Waagerecht bei x = −2 und x = 2: Hochpunkt H und Tiefpunkt T</span></div>
      <div class="rule">Am „Wendepunkt“ W fällt die Kurve am steilsten. Dort liegt der Scheitel der grünen Parabel.</div>`);
  }
}
kubX.addEventListener("input", updKub);
draggable(bK, (x, y, px, py) => Math.abs(bK.Y(fk(x)) - py) < 16 ? {} : null,
  (g, x) => { kubX.value = clamp(snapTo(x, STEP.look), -4, 4); updKub(); });
$("kubAdd").addEventListener("click", () => {
  const a = r6(+kubX.value);
  kub.pts = kub.pts.filter(p => !near(p[0], a)); kub.pts.push([a, r6(dk(a))]);
  if (kub.stage === 0 && kub.pts.length >= KUB_N) { kub.stage = 1; kubQuestion(); seen($("kubQ")); }
  kubSave(); updKub();
});
$("kubOk").addEventListener("click", () => { kub.stage = 0; kubSave(); kubQuestion(); updKub(); });
$("kubClear").addEventListener("click", () => { kub.pts = []; kubSave(); updKub(); });

/* ---------- Anbindung an das gemeinsame Gerüst ---------- */
const EXPLORE = {
  draw: { tan: drawTan, nor: NOR.draw, kub: drawKub },
  canvases: ["cTan", "cLupe", "norC", "norS", "cKub", "kubS"],
  init() { updTan(); NOR.init(); updKub(); kubQuestion(); },
};
