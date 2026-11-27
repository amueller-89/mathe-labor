/* =============================================================
   PROFI-QUIZ (geteilt)
   Das Labor liefert PRO = [ { q, opts | gopts, ok, ex, … } ]:
     opts   4 Antworttexte          gopts  4 Graphen: Funktion f oder { f } oder { v: x } (senkrechte Linie)
     ok     Index der richtigen     ex     Erklärung nach der Antwort
     Skizze: graph [{f, c, dash}], pts [[x, y, "P"]], segs [[x1, y1, x2, y2, "--farbe"]], vlines [x], table [[xs], [ys]]
             hideGraphUntil (Graph erst nach der Antwort), after / afterPts / afterSegs / afterCap (nach der Antwort), cap, noNums
   ============================================================= */
const bPro = new Board($("cPro"), 7);
let pro = { i: 0, score: 0, answered: false, order: [], minis: [], errs: [] };
function proVisible() { return ADMIN ? ADMIN.tabOk("pro") : !!prog.won || allOpen(); }
const proLocked = () => !prog.won && !allOpen(); // Admin-Version: Tab sichtbar, aber noch zu
function updProTab() {
  const vis = proVisible(), b = document.querySelector('#mainTabs [data-tab="pro"]'); if (!b) return;
  b.hidden = !vis;
  if (ADMIN) { const lk = proLocked(); b.classList.toggle("locked", lk); b.title = lk ? "Erst den Rechentrainer schaffen" : ""; }
  if (!vis && typeof current !== "undefined" && current === "pro") show(LAB.tabs[0].id);
  try { renderJump(); } catch (_) {} // beim Start ist pro evtl. noch nicht angelegt
}
function proHasPic(Q, answered) { return !!((Q.graph && (!Q.hideGraphUntil || answered)) || Q.pts || Q.segs || Q.vlines || (answered && (Q.after || Q.afterPts))); }
function buildOpts(Q) {
  let order; do order = shuffle(4); while (pro.order.length && order.every((k, i) => k === pro.order[i]));
  pro.order = order;
  const box = $("proOpts"); box.innerHTML = ""; box.classList.toggle("graphs", !!Q.gopts); pro.minis = [];
  pro.order.forEach((k, pos) => {
    const b = document.createElement("button"); b.className = "opt"; b.dataset.k = k;
    const L = "ABCD"[pos];
    if (Q.gopts) {
      b.innerHTML = `<span class="badge">${L}</span><canvas aria-label="Graph ${L}"></canvas>`;
      const board = new Board(b.querySelector("canvas"), 5); board.lab = 2;
      const g = Q.gopts[k]; pro.minis.push({ board, g: typeof g === "function" ? { f: g } : g });
    } else b.innerHTML = `<span class="badge">${L}</span><span>${Q.opts[k]}</span>`;
    b.addEventListener("click", () => answerPro(k, b));
    box.appendChild(b);
  });
  requestAnimationFrame(drawPro);
}
// „alles frei“: Fragenliste zum freien Springen
function renderJump() {
  const box = $("proJump"), on = allOpen(); box.hidden = !on; if (!on) return;
  box.innerHTML = "";
  PRO.forEach((_, i) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = i + 1;
    b.setAttribute("aria-pressed", i === pro.i && $("proDone").hidden);
    b.addEventListener("click", () => { pro.review = false; pro.i = i; renderPro(); });
    box.appendChild(b);
  });
}
function proHead() { $("proHead").textContent = `Frage ${pro.i + 1} von ${PRO.length} · ${pro.score} beim ersten Versuch richtig`; }
function renderPro() {
  const Q = PRO[pro.i]; pro.answered = false; pro.missed = false; pro.order = [];
  clearInterval(pro.timer); $("proLock").hidden = true; pro.locked = false;
  $("proDone").hidden = true; $("proQuiz").hidden = false;
  proHead(); $("proQ").textContent = Q.q;
  const tb = $("proTable");
  if (Q.table) { tb.hidden = false; tb.innerHTML = `<table class="wt"><tr><th>x</th>${Q.table[0].map(v => `<th>${num(v)}</th>`).join("")}</tr><tr><th>y</th>${Q.table[1].map(v => `<td>${typeof v === "string" ? v : num(v)}</td>`).join("")}</tr></table>`; }
  else tb.hidden = true;
  $("cPro").hidden = !proHasPic(Q, false); $("proCap").textContent = Q.cap || ""; $("proCap").hidden = !Q.cap;
  buildOpts(Q);
  $("proFb").textContent = ""; $("proFb").className = "feedback"; $("proEx").hidden = true; $("proNext").hidden = true;
  renderJump();
}
function revealPro(Q) {
  $("proEx").textContent = Q.ex; $("proEx").hidden = false;
  if (proHasPic(Q, true)) $("cPro").hidden = false;
  if (Q.afterCap) { $("proCap").textContent = Q.afterCap; $("proCap").hidden = false; }
}
function answerPro(k, btn) {
  changed();
  const Q = PRO[pro.i];
  if (pro.answered || pro.locked) return;
  const fb = $("proFb");
  if (k === Q.ok) {
    if (!pro.missed) pro.score++;
    pro.answered = true; btn.classList.add("right");
    fb.className = "feedback ok"; fb.textContent = pro.missed ? "Jetzt stimmt’s." : pick(["Richtig!", "Genau!", "Stark!"]);
    revealPro(Q);
    $("proNext").hidden = false; $("proNext").textContent = pro.i < PRO.length - 1 ? "Nächste Frage" : "Auswertung";
    $("proNext").focus();
    $("proOpts").querySelectorAll(".opt").forEach(o => o.disabled = o !== btn);
    drawPro();
  } else {
    pro.missed = true; pro.locked = true; btn.classList.add("wrong"); pro.errs[pro.i] = (pro.errs[pro.i] || 0) + 1;
    $("proOpts").querySelectorAll(".opt").forEach(o => o.disabled = true);
    let n = 3; $("proCount").textContent = n; $("proLock").hidden = false;
    $("proPicked").textContent = Q.gopts ? `Du hattest Graph ${"ABCD"[pro.order.indexOf(k)]} gewählt.` : `Du hattest „${Q.opts[k]}“ gewählt.`;
    clearInterval(pro.timer);
    pro.timer = setInterval(() => {
      n--;
      if (n > 0) { $("proCount").textContent = n; return; }
      clearInterval(pro.timer); pro.locked = false; $("proLock").hidden = true; buildOpts(Q);
    }, 1000);
  }
  proHead();
}
function nextPro() {
  changed();
  if (pro.review) { showProDone(); return; }
  if (pro.i < PRO.length - 1) { pro.i++; renderPro(); return; }
  showProDone(); proNextLab();
}
// Steckbrief "weiter": { maxFehler, gut: { id, title, hinweis? }, ueben?: { id, title, text }, auch?: { id, title, text } }
// Nach dem Profi-Durchgang: weniger als maxFehler Fehler → Einladung ins Labor „gut“,
// sonst nochmal sorgfältig durchgehen oder im Labor „ueben“ üben; „auch“ wird in beiden Fällen angeboten
function proNextLab() {
  const W = LAB.weiter; if (!W) return;
  const f = pro.errs.reduce((s, v) => s + (v || 0), 0), good = f < W.maxFehler;
  // Adresse eines anderen Labors: GitHub Pages (../id/), eigenständige Datei (Titel.html); in der Google-Version kein Link
  const href = L => !L ? "" : window.LABOR_API ? "../" + L.id + "/" : !ADMIN ? L.title + ".html" : "";
  const link = (el, L) => { const h = href(L); el.hidden = !h; el.href = h || "#"; el.textContent = L ? "Zum " + L.title : ""; };
  const line = (el, t) => { el.textContent = t || ""; el.hidden = !t; };
  const alt = good ? null : W.ueben;
  $("nextIcon").textContent = good ? "🚀" : "💪";
  $("nextT").textContent = good ? "Super gemacht!" : "Geschafft!";
  $("nextS").textContent = good
    ? (f ? `Nur ${f} Fehler!` : "Kein einziger Fehler!") + ` Wenn du bereit für mehr bist, probier das ${W.gut.title}.`
    : `Du bist durch! Bei ${f} Fehlern war aber wohl etwas Raten dabei. Geh die Fragen gern nochmal in Ruhe durch: Lies sorgfältig und rechne auf Papier, dann klappt es noch besser.`;
  line($("nextS2"), good ? W.gut.hinweis : alt && alt.text);
  line($("nextS3"), W.auch && W.auch.text);
  link($("nextGo"), good ? W.gut : null);
  link($("nextAlt"), alt);
  link($("nextAlt2"), W.auch);
  $("nextAgain").hidden = good;
  $("nextWin").hidden = false;
}
$("nextClose").addEventListener("click", () => $("nextWin").hidden = true);
$("nextAgain").addEventListener("click", () => { $("nextWin").hidden = true; $("proAgain").click(); window.scrollTo({ top: 0 }); });
function showProDone() {
  pro.review = false;
  $("proQuiz").hidden = true; $("proDone").hidden = false;
  const s = pro.score, n = PRO.length;
  $("proDoneT").textContent = s >= n - 2 ? LAB.profi + " 🏅" : s >= n / 2 ? "Stark gemacht!" : "Geschafft!";
  $("proDoneS").textContent = `${s} von ${n} Fragen beim ersten Versuch richtig.` + (s < n / 2 ? " Lies dir die Erklärungen in Ruhe nochmal durch, dann klappt es beim zweiten Durchgang besser." : "");
  const list = $("proList"); list.innerHTML = "";
  PRO.forEach((Q, i) => {
    const e = pro.errs[i] || 0;
    const b = document.createElement("button"); b.className = "revitem" + (e ? " had" : "");
    b.innerHTML = `<span class="nr">${i + 1}</span><span class="qt">${Q.q}</span><span class="er">${e === 0 ? "✓ sofort richtig" : e === 1 ? "1 Fehler" : e + " Fehler"}</span>`;
    b.addEventListener("click", () => reviewPro(i));
    list.appendChild(b);
  });
  window.scrollTo({ top: 0 });
}
function reviewPro(i) {
  pro.i = i; pro.review = true; renderPro();
  const Q = PRO[i]; pro.answered = true;
  $("proOpts").querySelectorAll(".opt").forEach(o => { if (+o.dataset.k === Q.ok) o.classList.add("right"); else o.disabled = true; });
  const e = pro.errs[i] || 0;
  $("proHead").textContent = `Rückblick: Frage ${i + 1} von ${PRO.length} · ${e === 0 ? "sofort richtig" : e === 1 ? "1 Fehler" : e + " Fehler"}`;
  revealPro(Q);
  $("proNext").hidden = false; $("proNext").textContent = "Zurück zur Übersicht";
  window.scrollTo({ top: 0 }); requestAnimationFrame(drawPro);
}
function drawPro() {
  const Q = PRO[pro.i]; if (!Q) return;
  const B = bPro;
  if (!$("cPro").hidden) {
    B.lab = Q.noNums ? 99 : 1; B.begin();
    const items = [...((Q.graph && (!Q.hideGraphUntil || pro.answered)) ? Q.graph : []), ...(pro.answered && Q.after ? Q.after : [])];
    (Q.vlines || []).forEach(x => B.seg(x, -B.R, x, B.R, tok("--d"), 2.5, [8, 6]));
    items.forEach(it => B.curve(it.f, tok(it.c || "--curve"), 3.5, it.dash ? [10, 7] : null));
    const pts = [...(Q.pts || []), ...(pro.answered && Q.afterPts ? Q.afterPts : [])];
    [...(Q.segs || []), ...(pro.answered && Q.afterSegs ? Q.afterSegs : [])].forEach(([x1, y1, x2, y2, c]) => B.seg(x1, y1, x2, y2, tok(c), 3.5, []));
    pts.forEach(([x, y, l]) => { B.dot(x, y, tok("--ink"), 6); if (l) B.tag([[l, tok("--ink")]], B.X(x) + 9, B.Y(y) - 4, { base: "bottom" }); });
  }
  pro.minis.forEach(m => {
    m.board.begin();
    if (m.g.v !== undefined) m.board.seg(m.g.v, -m.board.R, m.g.v, m.board.R, tok("--curve"), 3, []);
    else m.board.curve(m.g.f, tok("--curve"), 3);
  });
}
$("proNext").addEventListener("click", nextPro);
$("proAgain").addEventListener("click", () => { pro = { i: 0, score: 0, answered: false, order: [], minis: [], errs: [] }; renderPro(); });
window.addEventListener("hashchange", updProTab);
