/* =============================================================
   STATISTIK-LABOR (Klasse 9, versteckt): Streuung/Standardabweichung,
   Mittelwert vs. Median, irreführende Grafiken
   ============================================================= */
function fit(c) {
  const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
  return { ctx, w: r.width, h: r.height };
}
const font = (s, b = 400) => `${b} ${s}px ${tok("--body")}`;
const dec = (v, d = 2) => num(Math.round(v * 10 ** d) / 10 ** d);
const big = n => (n < 0 ? "−" : "") + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const sdev = a => { const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) ** 2))); };
const median = a => { const b = [...a].sort((x, y) => x - y), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };
// Punkte auf dem Zahlenstrahl stapeln: Ebene je Punkt, damit sich nichts überdeckt (Abstand in Pixeln)
function stack(xs, gap) {
  const idx = xs.map((x, i) => i).sort((i, j) => xs[i] - xs[j]), lvl = Array(xs.length).fill(0), placed = [];
  for (const i of idx) {
    let l = 0; while (placed.some(j => lvl[j] === l && Math.abs(xs[j] - xs[i]) < gap)) l++;
    lvl[i] = l; placed.push(i);
  }
  return lvl;
}
// Zahlenstrahl mit Ziehen: hit(px,py) → Index, set(i, x)
function dragDots(c, hit, set, redraw) {
  let g = -1;
  c.addEventListener("pointerdown", e => { const r = c.getBoundingClientRect(); g = hit(e.clientX - r.left, e.clientY - r.top); if (g >= 0) { c.setPointerCapture(e.pointerId); e.preventDefault(); } });
  c.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    if (g >= 0) { if (set(g, px)) redraw(); } else c.style.cursor = hit(px, py) >= 0 ? "grab" : "default";
  });
  const end = () => { g = -1; }; c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
}
function axis(ctx, X, y, lo, hi, step, lab, x0, x1) {
  ctx.strokeStyle = tok("--ink"); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.font = font(12); ctx.fillStyle = tok("--muted"); ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (let v = lo; v <= hi + 1e-9; v += step) {
    ctx.beginPath(); ctx.moveTo(X(v), y - 4); ctx.lineTo(X(v), y + 4); ctx.stroke();
    if (lab(v) !== null) ctx.fillText(lab(v), X(v), y + 7);
  }
}
function vline(ctx, x, y0, y1, col, text, ty, al = "center") {
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
  if (text) {
    // al: Beschriftung mittig über der Linie oder links/rechts daneben
    ctx.font = font(15, 700); const tw = ctx.measureText(text).width;
    const tx = al === "center" ? x : al === "right" ? x - 6 : x + 6, bx = al === "center" ? tx - tw / 2 : al === "right" ? tx - tw : tx;
    ctx.fillStyle = tok("--paper"); ctx.fillRect(bx - 4, ty - 2, tw + 8, 20);
    ctx.fillStyle = col; ctx.textAlign = al; ctx.textBaseline = "top"; ctx.fillText(text, tx, ty);
  }
}

/* =============================================================
   1 STREUUNG: gleicher Mittelwert, unterschiedliche Standardabweichung
   ============================================================= */
const ST = (() => {
  const c = $("stC");
  const st = { d: [[9, 10, 10, 11, 9, 10, 12, 9], [3, 6, 8, 10, 10, 13, 14, 16]], g: 0 };
  const COL = () => [tok("--curve"), tok("--a")];
  let geo = null;
  function draw() {
    const { ctx, w, h } = fit(c), L = 44, Rm = 24, X = v => L + v / 20 * (w - L - Rm), r = 9;
    const half = h / 2, ys = [half - 36, h - 36];
    geo = { X, ys, r };
    for (let g = 0; g < 2; g++) {
      const a = st.d[g], m = mean(a), s = sdev(a), y = ys[g], top = g ? half + 8 : 12, col = COL()[g];
      if ($("stBand").checked) {
        ctx.fillStyle = tok("--d"); ctx.globalAlpha = .16; ctx.fillRect(X(m - s), top + 22, X(m + s) - X(m - s), y - top - 22); ctx.globalAlpha = 1;
        ctx.strokeStyle = tok("--d"); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(X(m - s), top + 22); ctx.lineTo(X(m - s), y); ctx.moveTo(X(m + s), top + 22); ctx.lineTo(X(m + s), y); ctx.stroke(); ctx.setLineDash([]);
      }
      axis(ctx, X, y, 0, 20, 1, v => v % 2 ? null : v, X(0), X(20));
      ctx.fillStyle = col; ctx.font = font(18, 800); ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(g ? "B" : "A", 6, top);
      const lv = stack(a.map(X), 2 * r + 1);
      if ($("stDev").checked) a.forEach((v, i) => {
        const yy = y - r - 3 - lv[i] * (2 * r + 3);
        ctx.strokeStyle = tok("--muted"); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(m), yy); ctx.lineTo(X(v), yy); ctx.stroke();
      });
      vline(ctx, X(m), top + 22, y, tok("--d"), "x̄", top);
      a.forEach((v, i) => {
        const yy = y - r - 3 - lv[i] * (2 * r + 3);
        ctx.fillStyle = col; ctx.strokeStyle = tok("--paper"); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X(v), yy, r, 0, 7); ctx.fill(); ctx.stroke();
      });
      geo["lv" + g] = lv;
    }
  }
  function upd() {
    const [A, B] = st.d;
    $("stSum").innerHTML = `<span></span><span class="h">Mittelwert x̄</span><span class="h">Standardabw. s</span>
      <span class="g cu">Gruppe A</span><span class="v cd">${dec(mean(A), 1)}</span><span class="v cd">${dec(sdev(A))}</span>
      <span class="g ca">Gruppe B</span><span class="v cd">${dec(mean(B), 1)}</span><span class="v cd">${dec(sdev(B))}</span>`;
    const a = st.d[st.g], m = mean(a), sq = a.map(v => (v - m) ** 2), S = sq.reduce((s, v) => s + v, 0);
    $("stCalc").innerHTML = `<span class="h">x</span><span class="h">x − x̄</span><span class="h">(x − x̄)²</span>` +
      a.map((v, i) => `<span>${num(v)}</span><span>${dec(v - m)}</span><span>${dec(sq[i])}</span>`).join("") +
      `<span class="res">s = √(${dec(S)} : ${a.length}) ≈ <span class="cd">${dec(Math.sqrt(S / a.length))}</span></span>`;
    document.querySelectorAll("#stG button").forEach(b => b.setAttribute("aria-selected", +b.dataset.g === st.g));
    draw();
  }
  function hit(px, py) {
    if (!geo) return -1;
    let best = -1, bd = 14;
    for (let g = 0; g < 2; g++) st.d[g].forEach((v, i) => {
      const yy = geo.ys[g] - geo.r - 3 - geo["lv" + g][i] * (2 * geo.r + 3), d = Math.hypot(geo.X(v) - px, yy - py);
      if (d < bd) { bd = d; best = g * 100 + i; }
    });
    return best;
  }
  dragDots(c, hit, (k, px) => {
    const g = Math.floor(k / 100), i = k % 100, v = clamp(Math.round((px - geo.X(0)) / (geo.X(1) - geo.X(0))), 0, 20);
    if (v === st.d[g][i]) return false;
    st.d[g][i] = v; st.g = g; upd(); return false;
  }, draw);
  ["stDev", "stBand"].forEach(id => $(id).addEventListener("change", draw));
  document.querySelectorAll("#stG button").forEach(b => b.addEventListener("click", () => { st.g = +b.dataset.g; upd(); }));
  return { draw, init: upd, st };
})();

/* =============================================================
   2 MITTELWERT & MEDIAN: ein Ausreißer verschiebt den Mittelwert, nicht den Median
   ============================================================= */
const MM = (() => {
  const c = $("mmC");
  const st = { d: [2100, 2300, 2400, 2500, 2600, 2800, 2900, 3100, 3400, 9500], boss: 9 };
  const LO = 0, HI = 14000;
  let geo = null;
  function draw() {
    const { ctx, w, h } = fit(c), L = 30, Rm = 30, X = v => L + (v - LO) / (HI - LO) * (w - L - Rm), r = 10, y = h - 46;
    const lv = stack(st.d.map(X), 2 * r + 1);
    geo = { X, y, r, lv };
    axis(ctx, X, y, LO, HI, 1000, v => v % 2000 ? null : big(v), X(LO), X(HI));
    ctx.fillStyle = tok("--muted"); ctx.font = font(13, 700); ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText("€", X(HI), y - 6);
    const m = mean(st.d), md = median(st.d);
    // Beschriftungen zur Seite, damit sie sich nicht überdecken
    vline(ctx, X(md), 44, y, tok("--e"), "Median", 44, md <= m ? "right" : "left");
    vline(ctx, X(m), 8, y, tok("--d"), "Mittelwert", 8, md <= m ? "left" : "right");
    st.d.forEach((v, i) => {
      const yy = y - r - 3 - lv[i] * (2 * r + 3), boss = i === st.boss;
      ctx.fillStyle = boss ? tok("--pencil") : tok("--curve"); ctx.strokeStyle = tok("--paper"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X(v), yy, boss ? r + 3 : r, 0, 7); ctx.fill(); ctx.stroke();
      if (boss) { ctx.fillStyle = tok("--pencil"); ctx.font = font(15, 700); ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("Chef", X(v) + r + 8, yy); }
    });
  }
  function upd() {
    const m = mean(st.d), md = median(st.d), under = st.d.filter(v => v < m).length;
    $("mmOut").innerHTML = `<span class="k">Mittelwert</span><span class="v cd">${fx("", big(m), 3.6, "right")} €</span>
      <span class="k">Median</span><span class="v ce">${fx("", big(md), 3.6, "right")} €</span>
      <span class="k">unter dem Mittelwert</span><span class="v">${fx("", under, 1.3, "right")} von ${st.d.length}</span>`;
    $("mmAd").innerHTML = `„Bei uns verdienen Sie im Durchschnitt <span class="cd">${big(m)} €</span>!“`;
    draw();
  }
  function hit(px, py) {
    if (!geo) return -1;
    let best = -1, bd = 16;
    st.d.forEach((v, i) => { const d = Math.hypot(geo.X(v) - px, geo.y - geo.r - 3 - geo.lv[i] * (2 * geo.r + 3) - py); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  dragDots(c, hit, (i, px) => {
    const v = clamp(Math.round((LO + (px - geo.X(LO)) / (geo.X(HI) - geo.X(LO)) * (HI - LO)) / 100) * 100, 1000, HI);
    if (v === st.d[i]) return false;
    st.d[i] = v; upd(); return false;
  }, draw);
  return { draw, init: upd, st };
})();

/* =============================================================
   3 GRAFIKEN, DIE TÄUSCHEN: abgeschnittene y-Achse, Bilder statt Balken
   ============================================================= */
const GF = (() => {
  const c = $("gfC"), sl = $("gfStart");
  const D = [["9a", 182], ["9b", 197]];
  const st = { mode: "bar" };
  const start = () => Math.min(Math.round(+sl.value), 175);
  function draw() {
    const { ctx, w, h } = fit(c), s0 = start(), top = 210, L = 56, B = 40, T = 20, ph = h - T - B;
    const Y = v => T + (1 - (v - s0) / (top - s0)) * ph;
    ctx.font = font(12); ctx.lineWidth = 1;
    const step = top - s0 > 100 ? 20 : top - s0 > 40 ? 10 : 5;
    for (let v = Math.ceil(s0 / step) * step; v <= top; v += step) {
      ctx.strokeStyle = tok("--grid"); ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(w - 16, Y(v)); ctx.stroke();
      ctx.fillStyle = tok("--muted"); ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(v, L - 8, Y(v));
    }
    ctx.strokeStyle = tok("--ink"); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, Y(s0)); ctx.lineTo(w - 16, Y(s0)); ctx.stroke();
    ctx.fillStyle = tok("--ink"); ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.font = font(12, 700); ctx.fillText(s0, L - 8, Y(s0));
    const cw = (w - L - 16) / 2, col = [tok("--curve"), tok("--a")];
    D.forEach(([name, v], i) => {
      const cx = L + cw * (i + 0.5), hh = Y(s0) - Y(v);
      ctx.fillStyle = col[i];
      if (st.mode === "bar") ctx.fillRect(cx - cw * 0.22, Y(v), cw * 0.44, hh);
      else { // Handy-Bild: Höhe UND Breite wachsen mit dem Wert, die Fläche also im Quadrat
        const pw = hh * 0.55, x = cx - pw / 2, y = Y(v);
        ctx.beginPath(); ctx.roundRect(x, y, pw, hh, pw * 0.16); ctx.fill();
        ctx.fillStyle = tok("--paper"); ctx.beginPath(); ctx.roundRect(x + pw * 0.08, y + hh * 0.08, pw * 0.84, hh * 0.8, pw * 0.05); ctx.fill();
        ctx.fillStyle = col[i]; ctx.beginPath(); ctx.arc(cx, y + hh * 0.94, pw * 0.05, 0, 7); ctx.fill();
      }
      ctx.fillStyle = tok("--ink"); ctx.font = font(18, 700); ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText(v + " min", cx, Y(v) - 6);
      ctx.textBaseline = "top"; ctx.fillText(name, cx, Y(s0) + 10);
    });
  }
  function upd() {
    const s0 = start(); $("gfStartO").textContent = s0;
    const real = D[1][1] / D[0][1], hr = (D[1][1] - s0) / (D[0][1] - s0), look = st.mode === "bar" ? hr : hr * hr;
    $("gfOut").innerHTML = `<span class="k">9b hat wirklich</span><span class="v ce">${fx("", dec(real) + "-mal", 5.6, "right")}&nbsp;so viel</span>
      <span class="k">sieht aus wie</span><span class="v ${look > real + 0.05 ? "cp" : "ce"}">${fx("", dec(look) + "-mal", 5.6, "right")}&nbsp;so viel</span>`;
    draw();
  }
  sl.addEventListener("input", upd);
  document.querySelectorAll("#gfMode button").forEach(b => b.addEventListener("click", () => {
    st.mode = b.dataset.m; document.querySelectorAll("#gfMode button").forEach(x => x.setAttribute("aria-selected", x === b)); upd();
  }));
  return { draw, init: upd, st };
})();

/* ---------- Anbindung an das gemeinsame Gerüst ---------- */
const EXPLORE = {
  draw: { st: ST.draw, mm: MM.draw, gf: GF.draw },
  canvases: ["stC", "mmC", "gfC"],
  init() { ST.init(); MM.init(); GF.init(); window.__statistik = { ST, MM, GF }; },
};
