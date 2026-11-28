/* =============================================================
   ZUFALLS-LABOR (Klasse 8, versteckt): Wahrscheinlichkeit, relative Häufigkeit,
   Laplace-Experimente, Ereignisse, zwei Würfel
   ============================================================= */
// Canvas in Gerätepixeln vorbereiten, liefert Zeichenfläche in CSS-Pixeln
function fit(c) {
  const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
  return { ctx, w: r.width, h: r.height };
}
const font = (s, b = 400) => `${b} ${s}px ${tok("--body")}`;
const dec = (v, d = 3) => num(Math.round(v * 10 ** d) / 10 ** d);
const gcd = (a, b) => b ? gcd(b, a % b) : a;
// Bruch k/n, gekürzt dazu, wenn es kürzer geht: 6/36 = 1/6
function fracRed(k, n, cls = "") {
  const g = gcd(k, n) || 1;
  return sp(cls, frac(k, n)) + (g > 1 && k ? " = " + sp(cls, frac(k / g, n / g)) : "");
}
// Schöne Obergrenze für die x-Achse: 10, 20, 50, 100, …
function niceMax(n) { let m = 10; for (;;) { for (const f of [1, 2, 5]) if (m * f >= n) return m * f; m *= 10; } }
const big = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* =============================================================
   1 WERFEN & ZÄHLEN: relative Häufigkeit nähert sich der Wahrscheinlichkeit
   ============================================================= */
const HF = (() => {
  // Reißzwecke: Wahrscheinlichkeit unbekannt, pro Besuch etwas anders (zwischen 0,55 und 0,7)
  const PZ = r6(0.55 + rnd(16) / 100);
  const EXP = {
    muenze: { hit: "Kopf", p: 1 / 2, pf: [1, 2], roll: () => Math.random() < .5 ? 1 : 0, sym: v => v ? "K" : "Z", isHit: v => v === 1 },
    wuerfel: { hit: "Sechs", p: 1 / 6, pf: [1, 6], roll: () => 1 + rnd(6), sym: v => v, isHit: v => v === 6 },
    zwecke: { hit: "Spitze nach oben", p: PZ, pf: null, roll: () => Math.random() < PZ ? 1 : 0, sym: v => v ? "↑" : "↘", isHit: v => v === 1 },
  };
  const st = { e: "muenze", n: 0, k: 0, h: [], last: [] };
  const c = $("hfC");
  function reset() { st.n = 0; st.k = 0; st.h = []; st.last = []; upd(); }
  function throwN(m) {
    const E = EXP[st.e];
    for (let i = 0; i < m; i++) {
      const v = E.roll(); st.n++; if (E.isHit(v)) st.k++;
      st.h.push(st.k / st.n); st.last.push(v);
    }
    if (st.last.length > 40) st.last = st.last.slice(-40);
    upd();
  }
  function upd() {
    const E = EXP[st.e];
    $("hfHit").innerHTML = `Treffer: <b class="cd">${E.hit}</b>`;
    $("hfStrip").innerHTML = st.last.map(v => `<span class="${E.isHit(v) ? "hit" : ""}">${E.sym(v)}</span>`).reverse().join("");
    const h = st.n ? st.k / st.n : 0;
    $("hfOut").innerHTML = `<span class="k">Würfe</span><span class="v">${big(st.n)}</span>
      <span class="k">Treffer</span><span class="v cd">${big(st.k)}</span>
      <span class="k">relative Häufigkeit</span><span class="v cu">${st.n ? fx("", dec(h), 3.4, "left") : "–"}</span>
      <span class="k">Wahrscheinlichkeit</span><span class="v">${E.pf ? frac(E.pf[0], E.pf[1]) + " ≈ " + dec(E.p) : "?"}</span>`;
    draw();
  }
  function draw() {
    const { ctx, w, h } = fit(c), E = EXP[st.e];
    const L = 46, Rm = 14, T = 14, B = 34, pw = w - L - Rm, ph = h - T - B;
    const N = niceMax(Math.max(10, st.n));
    const X = i => L + i / N * pw, Y = v => T + (1 - v) * ph;
    ctx.lineWidth = 1; ctx.font = font(12); ctx.fillStyle = tok("--muted");
    for (let j = 0; j <= 10; j++) {
      ctx.strokeStyle = j % 5 ? tok("--grid") : tok("--grid-strong");
      ctx.beginPath(); ctx.moveTo(L, Y(j / 10)); ctx.lineTo(L + pw, Y(j / 10)); ctx.stroke();
      ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(num(j / 10), L - 6, Y(j / 10));
    }
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let j = 0; j <= 5; j++) {
      const v = N * j / 5; ctx.strokeStyle = tok("--grid");
      ctx.beginPath(); ctx.moveTo(X(v), T); ctx.lineTo(X(v), T + ph); ctx.stroke();
      ctx.fillText(big(v), X(v), T + ph + 6);
    }
    ctx.strokeStyle = tok("--ink"); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, T + ph); ctx.lineTo(L + pw, T + ph); ctx.stroke();
    ctx.fillStyle = tok("--ink"); ctx.font = font(13, 700); ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillText("Würfe", L + pw, T + ph - 4);
    if (E.pf) {
      ctx.strokeStyle = tok("--ink"); ctx.setLineDash([7, 5]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(L, Y(E.p)); ctx.lineTo(L + pw, Y(E.p)); ctx.stroke(); ctx.setLineDash([]);
    }
    if (st.h.length) {
      ctx.strokeStyle = tok("--curve"); ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.beginPath();
      const step = Math.max(1, Math.floor(st.h.length / 1500));
      for (let i = 0; i < st.h.length; i += step) { const x = X(i + 1), y = Y(st.h[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.lineTo(X(st.h.length), Y(st.h[st.h.length - 1])); ctx.stroke();
      ctx.fillStyle = tok("--curve"); ctx.beginPath(); ctx.arc(X(st.h.length), Y(st.h[st.h.length - 1]), 5, 0, 7); ctx.fill();
    }
  }
  document.querySelectorAll("#tab-hf [data-n]").forEach(b => b.addEventListener("click", () => throwN(+b.dataset.n)));
  $("hfReset").addEventListener("click", reset);
  document.querySelectorAll("#hfExp button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("#hfExp button").forEach(x => x.setAttribute("aria-selected", x === b));
    st.e = b.dataset.e; reset();
  }));
  return { draw, init: upd, st };
})();

/* =============================================================
   2 GLÜCKSRAD: Laplace-Experiment, Ereignisse als Menge von Feldern
   ============================================================= */
const GR = (() => {
  const c = $("grC");
  const st = { n: 8, hits: new Set([0, 1, 2]), rot: 0, spin: null, N: 0, K: 0, res: null };
  const S = () => 2 * Math.PI / st.n;
  const mod = (a, m) => ((a % m) + m) % m;
  const under = rot => Math.floor(mod(-rot, 2 * Math.PI) / S()); // Feld unter dem Zeiger (oben)
  const EV = { gerade: z => z % 2 === 0, ungerade: z => z % 2 === 1, prim: z => [2, 3, 5, 7, 11].includes(z), gross: z => z > 4 };
  let ev = null;
  function geo() { const r = c.getBoundingClientRect(); const R = Math.min(r.width, r.height) * 0.42; return { cx: r.width / 2, cy: r.height / 2 + 14, R }; }
  function draw() {
    const { ctx } = fit(c), { cx, cy, R } = geo(), s = S();
    for (let i = 0; i < st.n; i++) {
      const a0 = i * s + st.rot - Math.PI / 2, a1 = a0 + s;
      const lit = st.res !== null && !st.spin && i === st.res;
      ctx.fillStyle = st.hits.has(i) ? tok("--d") : tok("--surface");
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = tok("--paper"); ctx.lineWidth = 3; ctx.stroke();
      if (lit) { ctx.strokeStyle = tok("--ink"); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R - 2, a0 + .02, a1 - .02); ctx.stroke(); }
      const am = (a0 + a1) / 2;
      ctx.fillStyle = st.hits.has(i) ? "#fff" : tok("--ink"); ctx.font = font(Math.max(16, Math.min(30, R * 0.16)), 700);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(i + 1, cx + Math.cos(am) * R * 0.72, cy + Math.sin(am) * R * 0.72);
    }
    ctx.strokeStyle = tok("--muted"); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    ctx.fillStyle = tok("--muted"); ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7); ctx.fill();
    // Zeiger oben
    ctx.fillStyle = tok("--ink"); ctx.beginPath(); ctx.moveTo(cx, cy - R + 16); ctx.lineTo(cx - 13, cy - R - 16); ctx.lineTo(cx + 13, cy - R - 16); ctx.closePath(); ctx.fill();
  }
  function upd() {
    $("grN").textContent = st.n;
    const k = st.hits.size;
    $("grP").innerHTML = `P(<span class="cd">Treffer</span>) = ${fracRed(k, st.n, "cd")} ≈ ${fx("", dec(k / st.n, 2), 2.6, "left")}`;
    const lastTxt = st.res === null ? "–" : st.hits.has(st.res) ? `<span class="cd">${st.res + 1} Treffer</span>` : `${st.res + 1}`;
    $("grOut").innerHTML = `<span class="k">zuletzt</span><span class="v">${lastTxt}</span>
      <span class="k">Drehungen</span><span class="v">${big(st.N)}</span>
      <span class="k">Treffer</span><span class="v cd">${big(st.K)}</span>
      <span class="k">relative Häufigkeit</span><span class="v cu">${st.N ? fx("", dec(st.K / st.N, 2), 2.6, "left") : "–"}</span>`;
    document.querySelectorAll("#grEv button").forEach(b => b.setAttribute("aria-selected", b.dataset.ev === ev));
    draw();
  }
  function tally(i) { st.N++; if (st.hits.has(i)) st.K++; st.res = i; }
  function resetTally() { st.N = 0; st.K = 0; st.res = null; }
  function spin() {
    if (st.spin) return;
    const target = rnd(st.n), th = (target + 0.15 + 0.7 * Math.random()) * S();
    const r0 = st.rot, r1 = r0 + 2 * Math.PI * 4 + mod(-th - r0, 2 * Math.PI), t0 = performance.now(), D = 1800;
    st.res = null;
    const step = t => {
      const u = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - u, 3);
      st.rot = r0 + (r1 - r0) * e;
      if (u < 1) { st.spin = requestAnimationFrame(step); draw(); }
      else { st.spin = null; st.rot = mod(r1, 2 * Math.PI); tally(under(st.rot)); upd(); }
    };
    st.spin = requestAnimationFrame(step);
  }
  c.addEventListener("pointerdown", e => {
    if (st.spin) return;
    const r = c.getBoundingClientRect(), { cx, cy, R } = geo(), dx = e.clientX - r.left - cx, dy = e.clientY - r.top - cy;
    if (Math.hypot(dx, dy) > R) return;
    const i = Math.floor(mod(Math.atan2(dx, -dy) - st.rot, 2 * Math.PI) / S());
    st.hits.has(i) ? st.hits.delete(i) : st.hits.add(i);
    ev = null; resetTally(); upd();
  });
  c.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect(), { cx, cy, R } = geo();
    c.style.cursor = Math.hypot(e.clientX - r.left - cx, e.clientY - r.top - cy) <= R ? "pointer" : "default";
  });
  function setN(n) {
    if (st.spin) return;
    st.n = clamp(n, 2, 12);
    st.hits = ev ? new Set([...Array(st.n).keys()].filter(i => EV[ev](i + 1))) : new Set([...st.hits].filter(i => i < st.n));
    resetTally(); upd();
  }
  $("grMinus").addEventListener("click", () => setN(st.n - 1));
  $("grPlus").addEventListener("click", () => setN(st.n + 1));
  document.querySelectorAll("#grEv button").forEach(b => b.addEventListener("click", () => { ev = b.dataset.ev; setN(st.n); }));
  $("grSpin").addEventListener("click", spin);
  $("grMany").addEventListener("click", () => { if (st.spin) return; for (let i = 0; i < 100; i++) tally(rnd(st.n)); st.rot = -(st.res + 0.5) * S(); upd(); });
  $("grReset").addEventListener("click", () => { if (!st.spin) { resetTally(); upd(); } });
  return { draw, init: upd, st };
})();

/* =============================================================
   3 ZWEI WÜRFEL: 36 gleich wahrscheinliche Ergebnisse, Augensumme
   ============================================================= */
const ZW = (() => {
  const c = $("zwC"), ch = $("zwH");
  const st = { s: 7, cnt: Array(13).fill(0), N: 0, last: null };
  const ways = s => 6 - Math.abs(s - 7);
  const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
  function die(ctx, x, y, a, v, col) {
    ctx.fillStyle = tok("--paper"); ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, y, a, a, a * 0.18); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col;
    for (const [i, j] of PIPS[v]) { ctx.beginPath(); ctx.arc(x + a * (0.25 + 0.25 * i), y + a * (0.25 + 0.25 * j), a * 0.085, 0, 7); ctx.fill(); }
  }
  function grid() {
    const r = c.getBoundingClientRect(), a = Math.min(r.width, r.height) / 7.3;
    return { a, x0: (r.width - 7 * a) / 2 + a, y0: (r.height - 7 * a) / 2 + a };
  }
  function draw() {
    const { ctx } = fit(c), { a, x0, y0 } = grid();
    for (let i = 1; i <= 6; i++) {
      die(ctx, x0 + (i - 1) * a + a * 0.18, y0 - a + a * 0.12, a * 0.64, i, tok("--curve"));
      die(ctx, x0 - a + a * 0.12, y0 + (i - 1) * a + a * 0.18, a * 0.64, i, tok("--a"));
    }
    for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) {
      const x = x0 + (i - 1) * a, y = y0 + (j - 1) * a, on = i + j === st.s;
      ctx.fillStyle = on ? tok("--d") : tok("--surface");
      ctx.beginPath(); ctx.roundRect(x + 3, y + 3, a - 6, a - 6, 8); ctx.fill();
      ctx.fillStyle = on ? "#fff" : tok("--muted"); ctx.font = font(Math.round(a * 0.34), 700);
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(i + j, x + a / 2, y + a / 2 + 1);
    }
    drawH();
  }
  function drawH() {
    const { ctx, w, h } = fit(ch), L = 40, T = 10, B = 26, pw = w - L - 8, ph = h - T - B, bw = pw / 11;
    const ymax = 0.25, Y = v => T + (1 - v / ymax) * ph;
    ctx.font = font(12); ctx.lineWidth = 1;
    for (let v = 0; v <= 0.25 + 1e-9; v += 0.05) {
      ctx.strokeStyle = tok("--grid"); ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(L + pw, Y(v)); ctx.stroke();
      ctx.fillStyle = tok("--muted"); ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(num(r6(v)), L - 6, Y(v));
    }
    for (let s = 2; s <= 12; s++) {
      const x = L + (s - 2) * bw, f = st.N ? st.cnt[s] / st.N : 0;
      ctx.fillStyle = s === st.s ? tok("--d") : tok("--curve");
      if (f) ctx.fillRect(x + bw * 0.18, Y(Math.min(f, ymax)), bw * 0.64, Y(0) - Y(Math.min(f, ymax)));
      ctx.strokeStyle = tok("--ink"); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x + bw * 0.08, Y(ways(s) / 36)); ctx.lineTo(x + bw * 0.92, Y(ways(s) / 36)); ctx.stroke();
      ctx.fillStyle = s === st.s ? tok("--d") : tok("--muted"); ctx.font = font(13, s === st.s ? 700 : 400);
      ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(s, x + bw / 2, T + ph + 6);
    }
    ctx.strokeStyle = tok("--ink"); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, T + ph); ctx.lineTo(L + pw, T + ph); ctx.stroke();
  }
  function upd() {
    const k = ways(st.s);
    $("zwP").innerHTML = `P(Summe&nbsp;${fx("cd", st.s, 1.15, "left")}) = ${fracRed(k, 36, "cd")}`;
    document.querySelectorAll("#zwSum button").forEach(b => b.setAttribute("aria-selected", +b.dataset.s === st.s));
    const D = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    $("zwLast").innerHTML = st.last ? `<span class="cu">${D[st.last[0]]}</span><span style="color:var(--a)">${D[st.last[1]]}</span> <b>${st.N > 0 ? big(st.N) + " Würfe" : ""}</b>` : "";
    draw();
  }
  $("zwSum").innerHTML = [...Array(11)].map((_, i) => `<button data-s="${i + 2}" aria-selected="false">${i + 2}</button>`).join("");
  document.querySelectorAll("#zwSum button").forEach(b => b.addEventListener("click", () => { st.s = +b.dataset.s; upd(); }));
  document.querySelectorAll("#tab-zw [data-n]").forEach(b => b.addEventListener("click", () => {
    for (let i = 0; i < +b.dataset.n; i++) { const d = [1 + rnd(6), 1 + rnd(6)]; st.cnt[d[0] + d[1]]++; st.N++; st.last = d; }
    upd();
  }));
  $("zwReset").addEventListener("click", () => { st.cnt.fill(0); st.N = 0; st.last = null; upd(); });
  c.addEventListener("pointerdown", e => {
    const r = c.getBoundingClientRect(), { a, x0, y0 } = grid();
    const i = Math.floor((e.clientX - r.left - x0) / a), j = Math.floor((e.clientY - r.top - y0) / a);
    if (i >= 0 && i < 6 && j >= 0 && j < 6) { st.s = i + j + 2; upd(); }
  });
  return { draw, init: upd, st };
})();

/* ---------- Anbindung an das gemeinsame Gerüst ---------- */
const EXPLORE = {
  draw: { hf: HF.draw, gr: GR.draw, zw: ZW.draw },
  canvases: ["hfC", "grC", "zwC", "zwH"],
  init() { HF.init(); GR.init(); ZW.init(); window.__zufall = { HF, GR, ZW }; },
};
