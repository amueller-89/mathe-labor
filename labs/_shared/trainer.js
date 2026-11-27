/* =============================================================
   RECHENTRAINER (geteilt)
   Das Labor liefert: LEVELS (4 Stufen), makeTask(l), drawTrain(), EXAMPLES (je Stufe ein Musterbeispiel).
   makeTask(l) gibt zurück: { l, title, task, hint, answer, want, sol(), … }
     want  = { feldname: richtiger Wert } für die inp(…)-Felder in answer
     check(F, fb) optional statt want: eigene Prüfung, gibt true/false zurück oder null (= unvollständig)
     failMsg() optional: eigene Meldung bei falscher Antwort
   ============================================================= */
// Richtige Aufgaben je Stufe: in der Version mit Anmeldung stellt das die Lehrkraft im Adminpanel ein
const need = () => (ADMIN && ADMIN.need && ADMIN.need()) || 3, KEY = LAB.id + "-labor-v1";
const freshProg = () => ({ c: [0, 0, 0, 0], f: [0, 0, 0, 0], unl: 0, lvl: 0, won: false });
let prog = freshProg();
try { const s = ADMIN ? ADMIN.prog : JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.c)) prog = Object.assign(prog, s); } catch (_) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (_) {} changed(); };
const bTrain = new Board($("cTrain"));
let task = null;

function renderLevels() {
  const N = need();
  // Wurde die Zahl gesenkt: was jetzt reicht, wird freigeschaltet (gesperrt wird nie wieder)
  let up = false;
  while (prog.unl < 3 && prog.c[prog.unl] >= N) { prog.unl++; up = true; }
  if (!prog.won && prog.c.every(c => c >= N)) { prog.won = true; up = true; setTimeout(showWin, 500); }
  if (up) save();
  const box = $("levels"); box.innerHTML = "";
  LEVELS.forEach((L, i) => {
    const b = document.createElement("button"); b.className = "lvl";
    const open = allOpen() || i <= prog.unl;
    b.disabled = !open; b.setAttribute("aria-pressed", i === prog.lvl);
    const n = Math.min(prog.c[i], N);
    b.innerHTML = `<span class="t">${open ? "" : "🔒 "}${L.t}</span><span class="s">${L.s}</span><span class="dots">${"●".repeat(n)}${"○".repeat(N - n)}</span>`;
    b.addEventListener("click", () => { prog.lvl = i; save(); renderLevels(); newTask(); });
    box.appendChild(b);
  });
  $("trProg").innerHTML = LEVELS.map((L, i) => `<span>${L.t}</span><span class="muted">${L.s}</span><span><b>${prog.c[i]}</b> richtig${prog.f[i] ? ` · ${prog.f[i]} ${prog.f[i] === 1 ? "Fehlversuch" : "Fehlversuche"}` : ""}</span>`).join("");
  updProTab();
}
function newTask() {
  task = makeTask(prog.lvl); task.state = "open"; task.guess = null;
  $("trTitle").textContent = LEVELS[task.l].t + ": " + task.title;
  $("trTask").innerHTML = task.task; $("trTask").hidden = !task.task; $("trHint").textContent = task.hint;
  $("trAnswer").innerHTML = task.answer;
  $("trFb").textContent = ""; $("trFb").className = "feedback"; $("trSol").hidden = true;
  $("trCheck").disabled = false; $("trShow").disabled = false;
  const first = $("trAnswer").querySelector("input.in"); if (first && window.matchMedia("(pointer:fine)").matches && current === "train") first.focus();
  drawTrain();
}
function fields() { const o = {}; $("trAnswer").querySelectorAll("[data-k]").forEach(el => o[el.dataset.k] = el); return o; }
function mark(el, ok) { el.classList.toggle("ok", ok); el.classList.toggle("bad", !ok); }
function checkTask() {
  if (!task || task.state !== "open") return;
  const F = fields(), fb = $("trFb");
  let ok = true;
  if (task.check) { ok = task.check(F, fb); if (ok === null) return; }
  else {
    const g = {};
    for (const k in task.want) g[k] = parse(F[k].value);
    if (Object.values(g).some(isNaN)) { fb.className = "feedback no"; fb.textContent = "Bitte alle Felder ausfüllen."; return; }
    for (const k in task.want) { const good = near(g[k], task.want[k], 0.001); mark(F[k], good); ok = ok && good; }
    task.guess = g;
  }
  if (ok) {
    task.state = "done"; prog.c[task.l]++;
    let msg = pick(["Richtig!", "Stark!", "Genau!", "Sauber gerechnet!"]);
    if (prog.c[task.l] >= need() && task.l < 3 && prog.unl <= task.l) { prog.unl = task.l + 1; msg = `Richtig! ${LEVELS[task.l + 1].t} ist jetzt frei.`; }
    fb.className = "feedback ok"; fb.textContent = msg;
    $("trCheck").disabled = true; $("trShow").disabled = true; $("trNext").focus();
    if (!prog.won && prog.c.every(c => c >= need())) { prog.won = true; save(); updProTab(); setTimeout(showWin, 500); }
  } else {
    prog.f[task.l]++;
    fb.className = "feedback no"; fb.textContent = "Noch nicht. Rot markierte Felder nochmal prüfen.";
    const m = task.failMsg && task.failMsg(); if (m) fb.textContent = m;
  }
  save(); renderLevels(); drawTrain();
}
function showSolution() {
  if (!task || task.state !== "open") return;
  task.state = "shown"; $("trSol").innerHTML = task.sol(); $("trSol").hidden = false;
  const fb = $("trFb"); fb.className = "feedback"; fb.textContent = "Lösung (zählt nicht):";
  $("trCheck").disabled = true; $("trShow").disabled = true; drawTrain();
}
$("trCheck").addEventListener("click", checkTask);
$("trShow").addEventListener("click", showSolution);
$("trNext").addEventListener("click", newTask);
$("trAnswer").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); task.state === "open" ? checkTask() : newTask(); } });
$("trAnswer").addEventListener("input", () => { if (task && task.state === "open") $("trFb").textContent = ""; });
// Zurücksetzen erst beim zweiten Klick innerhalb von 4 Sekunden
let resetArmed = 0;
$("trReset").addEventListener("click", () => {
  const b = $("trReset");
  if (Date.now() - resetArmed >= 4000) { resetArmed = Date.now(); b.textContent = "Wirklich? Nochmal klicken"; setTimeout(() => { b.textContent = "Fortschritt zurücksetzen"; }, 4000); return; }
  resetArmed = 0; b.textContent = "Fortschritt zurücksetzen";
  prog = freshProg(); save(); renderLevels(); newTask(); updProTab();
});
if (ADMIN) $("trReset").hidden = true;
window.addEventListener("hashchange", renderLevels);
if (!allOpen() && prog.lvl > prog.unl) prog.lvl = prog.unl;

// ---------- Musterbeispiel je Stufe (Popup) ----------
// EXAMPLES[l] = { sub, rows }; rows: [links, rechts, Kommentar, Umformung] oder {sec}, {html}
// Der Kommentar steht in der Zeile vor dem Schritt, den er beschreibt (wie „| : 2“ bei Gleichungen).
function exGraph(o) {
  const u = 30, W = (o.x1 - o.x0) * u, H = (o.y1 - o.y0) * u, X = x => (x - o.x0) * u, Y = y => (o.y1 - y) * u;
  let g = `<svg class="exsvg" viewBox="-4 -4 ${W + 8} ${H + 8}" role="img" aria-label="${o.label}">`;
  for (let x = o.x0; x <= o.x1; x++) g += `<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${H}" style="stroke:var(--grid-strong,#2e3f50)" stroke-width="${x === 0 ? 0 : 1}"/>`;
  for (let y = o.y0; y <= o.y1; y++) g += `<line x1="0" y1="${Y(y)}" x2="${W}" y2="${Y(y)}" style="stroke:var(--grid-strong,#2e3f50)" stroke-width="${y === 0 ? 0 : 1}"/>`;
  g += `<line x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}" style="stroke:var(--ink)" stroke-width="1.6"/><line x1="${X(0)}" y1="0" x2="${X(0)}" y2="${H}" style="stroke:var(--ink)" stroke-width="1.6"/>`;
  g += `<text x="${W - 4}" y="${Y(0) - 6}" text-anchor="end" font-size="14" style="fill:var(--muted)">x</text><text x="${X(0) + 6}" y="14" font-size="14" style="fill:var(--muted)">y</text>`;
  for (let x = o.x0 + 1; x < o.x1; x++) if (x) g += `<text x="${X(x)}" y="${Y(0) + 14}" text-anchor="middle" font-size="11" style="fill:var(--muted)">${num(x)}</text>`;
  for (let y = o.y0 + 1; y < o.y1; y++) if (y && (o.skipY || []).indexOf(y) < 0) g += `<text x="${X(0) - 5}" y="${Y(y) + 4}" text-anchor="end" font-size="11" style="fill:var(--muted)">${num(y)}</text>`;
  let pts = [];
  for (let i = 0; i <= 240; i++) { const x = o.x0 + (o.x1 - o.x0) * i / 240, y = o.f(x); if (y >= o.y0 && y <= o.y1) pts.push(X(x).toFixed(1) + "," + Y(y).toFixed(1)); }
  g += `<polyline points="${pts.join(" ")}" fill="none" style="stroke:var(--curve)" stroke-width="3"/>`;
  (o.path || []).forEach(p => g += `<polyline points="${p.map(([x, y]) => X(x) + "," + Y(y)).join(" ")}" fill="none" style="stroke:var(${o.pathColor || "--d"})" stroke-width="2.6" stroke-dasharray="6 4"/>`);
  (o.dots || []).forEach(([x, y, c]) => g += `<circle cx="${X(x)}" cy="${Y(y)}" r="5.5" style="fill:var(${c})"/>`);
  (o.labels || []).forEach(([x, y, t, c, a]) => g += `<text x="${X(x)}" y="${Y(y)}" text-anchor="${a || "middle"}" font-size="16" font-weight="700" style="fill:var(${c || "--ink"})">${t}</text>`);
  return g + "</svg>";
}
function exRender(E) {
  return E.rows.map(r => {
    if (r.sec) return `<div class="sec">${r.sec}</div>`;
    if (r.note) return `<div class="note">${r.note}</div>`;
    if (r.html) return `<div class="wide">${r.html}</div>`;
    const [l, rr, c, op] = r;
    // Umformung („| − 2“) und Kommentar teilen sich eine Spalte, damit alle Striche untereinander stehen
    const cc = op ? `<span class="op">${op.replace(/^\|\s*/, "")}</span>${c ? " " + c : ""}` : (c || "");
    return `<div class="l">${l}</div><div class="r">${rr}</div><div class="c">${cc}</div>`;
  }).join("");
}
let exByKey = false;
function openEx(e) {
  exByKey = !!e && e.detail === 0; // per Tastatur geöffnet (Enter/Leertaste)
  const l = task ? task.l : prog.lvl, E = EXAMPLES[l];
  $("exLvl").textContent = LEVELS[l].t + " · " + LEVELS[l].s;
  $("exSub").innerHTML = E.sub;
  $("exBody").innerHTML = exRender(E);
  $("exWin").hidden = false; document.querySelector(".exbox").scrollTop = 0; $("exOk").focus({ preventScroll: true });
}
function closeEx() {
  $("exWin").hidden = true; const b = $("trEx");
  // Fokus nur nach Tastatur-Bedienung zurück auf den Knopf, sonst bleibt er hässlich blau umrandet
  if (exByKey) b.focus(); else if (document.activeElement) document.activeElement.blur();
}
$("trEx").addEventListener("click", openEx);
$("exOk").addEventListener("click", closeEx);
$("exClose").addEventListener("click", closeEx);
$("exWin").addEventListener("click", e => { if (e.target.id === "exWin") closeEx(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("exWin").hidden) closeEx(); });

// ---------- Glückwunsch ----------
function showWin() {
  const tot = prog.c.reduce((s, v) => s + v, 0), bad = prog.f.reduce((s, v) => s + v, 0);
  $("winStats").textContent = `${tot} Aufgaben richtig gelöst${bad ? `, ${bad} ${bad === 1 ? "Fehlversuch" : "Fehlversuche"} unterwegs` : ", ohne einen einzigen Fehlversuch"}.`;
  $("winStats").hidden = tot === 0;
  $("win").hidden = false; ($("winPro").hidden ? $("winClose") : $("winPro")).focus(); confetti();
}
function closeWin() { $("win").hidden = true; confettiOn = false; updProTab(); }
$("winClose").addEventListener("click", closeWin);
$("winPro").addEventListener("click", () => { closeWin(); show("pro"); });
$("win").addEventListener("click", e => { if (e.target.id === "win") closeWin(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("win").hidden) closeWin(); });
let confettiOn = false;
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("confetti"), dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr; const ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = ["--a", "--d", "--e", "--z", "--curve", "--pencil"].map(tok);
  const Pp = Array.from({ length: 180 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * .6, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3,
    r: 5 + Math.random() * 6, a: Math.random() * 6.3, va: (Math.random() - .5) * .3, c: pick(cols) }));
  confettiOn = true; const t0 = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, W, H);
    if (!confettiOn) return;
    for (const p of Pp) { p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.a += p.va;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); }
    if (t - t0 < 6000) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
  })(t0);
}
