/* =============================================================
   TABS, ADRESSE, START (geteilt)
   Das Labor liefert EXPLORE = { draw: {tab: zeichne}, canvases: [ids], init(), quiz?, fontsReady? }
   ============================================================= */
// Adresse merkt sich den Tab (z. B. …#rechentrainer), damit Neuladen und Links an derselben Stelle landen
var hashOn = false;
const SLUG = {};
LAB.tabs.forEach(t => SLUG[t.id] = t.slug);
if (document.querySelector('#mainTabs [data-tab="train"]')) { SLUG.train = "rechentrainer"; SLUG.pro = "profi"; }
function setHash() {
  const q = EXPLORE.quiz, sub = q && current === q.tab && q.on() ? "/quiz" : "";
  const h = "#" + SLUG[current] + sub + (/alle/i.test(location.hash) ? "/alle" : "");
  if (location.hash !== h) { try { history.replaceState(null, "", h); } catch (_) {} }
}
function hashTab() {
  const h = decodeURIComponent(location.hash.slice(1)).toLowerCase().split("/");
  for (const t in SLUG) if (h[0] === SLUG[t]) return { tab: t, quiz: h.indexOf("quiz") >= 0 };
  return null;
}
const FIRST = LAB.tabs[0].id;
let current = FIRST;
const drawers = Object.assign({}, EXPLORE.draw, { train: drawTrain, pro: drawPro });
function show(tab) {
  if (ADMIN && tab === "pro" && proLocked()) { const f = [...document.querySelectorAll("#mainTabs button")].find(b => !b.hidden && b.dataset.tab !== "pro"); if (!f) return; tab = f.dataset.tab; }
  current = tab; changed();
  document.querySelectorAll("#mainTabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === tab));
  document.querySelectorAll(".tab").forEach(s => s.hidden = s.id !== "tab-" + tab);
  try { localStorage.setItem(KEY + "-tab", tab); } catch (_) {}
  if (hashOn) setHash();
  requestAnimationFrame(drawers[tab]);
}
document.querySelectorAll("#mainTabs button").forEach(b => b.addEventListener("click", () => {
  if (ADMIN && b.dataset.tab === "pro" && proLocked()) { ADMIN.proLocked(); return; }
  show(b.dataset.tab);
}));
const redraw = () => drawers[current]();
[...EXPLORE.canvases, "cTrain", "cPro", "proOpts"].forEach(id => new ResizeObserver(redraw).observe($(id)));
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redraw); } catch (_) {}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (EXPLORE.fontsReady) EXPLORE.fontsReady(); redraw(); });

renderLevels(); newTask(); EXPLORE.init(); renderPro(); updProTab();
let startTab = FIRST; try { startTab = localStorage.getItem(KEY + "-tab") || FIRST; } catch (_) {}
{ const ht = hashTab(); if (ht) startTab = ht.tab; }
show(drawers[startTab] && (startTab !== "pro" || proVisible()) ? startTab : FIRST);
{ const ht = hashTab(), q = EXPLORE.quiz; if (ht && ht.quiz && q && current === q.tab) q.start(); }
hashOn = true; setHash();
window.addEventListener("hashchange", () => {
  const t = hashTab(), b = t && document.querySelector('#mainTabs [data-tab="' + t.tab + '"]');
  if (b && !b.hidden && t.tab !== current) b.click();
});
// für Tests und die Admin-Anbindung
window.__lab = { get task() { return task; }, prog: () => prog, pro: () => pro, current: () => current, show, updProTab, renderLevels, PRO_N: PRO.length };
