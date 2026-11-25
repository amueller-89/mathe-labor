"""Baut aus den fertigen Laboren die an das Adminpanel gebundenen Versionen.
Die Originale werden nur gelesen."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
VIZ = os.path.join(HERE, '..', 'labore')

GATE_CSS = """
#mainTabs button.locked{opacity:.55}
#mainTabs button.locked::before{content:"\\1F512\\00A0"}
.proToast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:70;background:var(--surface);color:var(--ink);border:2px solid var(--line);border-radius:12px;padding:12px 18px;box-shadow:0 12px 40px rgb(0 0 0 / .4);max-width:calc(100vw - 32px);text-align:center}
.gate{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:16px;background:var(--paper)}
.gate .box{background:var(--surface);border-radius:16px;padding:28px 24px;max-width:460px;width:100%;box-shadow:0 20px 60px rgb(0 0 0 / .35)}
.gate h2{font-family:var(--display);font-weight:800;font-size:clamp(28px,5vw,38px);line-height:1.05;margin:0 0 14px}
.gate p{margin:0 0 14px}
.gate input{font:inherit;font-size:20px;font-weight:700;padding:8px 12px;border:2px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink);flex:1;min-width:0}
.gate input:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.gate .gform{display:flex;gap:10px;flex-wrap:wrap}
.gate .small{font-size:14px;color:var(--muted);margin:12px 0 0}
.who{font-size:14px;color:var(--muted);margin-top:4px}
.who b{color:var(--ink)}
.linkbtn{font:inherit;background:none;border:0;padding:0;color:var(--muted);text-decoration:underline;cursor:pointer}
.who .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--e);margin-right:6px;vertical-align:middle}
.who .dot.off{background:var(--pencil)}
"""

GATE_HTML = """
<div class="gate" id="gate">
  <div class="box">
    <h2>__TITLE__</h2>
    <div id="gLogin">
      <p>Wie heißt du? Nimm deinen Vornamen und immer genau denselben, dann geht es an jedem Rechner da weiter, wo du aufgehört hast.</p>
      <div class="gform"><input id="gWer" type="text" maxlength="30" autocomplete="nickname" autocapitalize="words" spellcheck="false" data-lpignore="true" data-1p-ignore placeholder="z. B. Mia" aria-label="Wie heißt du?"><button class="btn primary" id="gGo" type="button">Los geht’s</button></div>
    </div>
    <div id="gAgain" hidden>
      <p>Bist du <b id="gWho"></b>?</p>
      <div class="row"><button class="btn primary" id="gYes">Ja, weiter</button><button class="btn" id="gNo">Nein, ich bin jemand anderes</button></div>
    </div>
    <div id="gWait" hidden><p><b>Gleich geht’s los.</b></p><p>Deine Lehrkraft schaltet die erste Station gleich frei. Diese Seite merkt das von selbst.</p></div>
    <div id="gBye" hidden><p><b>Du bist abgemeldet.</b></p><p>Lade die Seite neu (Taste F5), damit sich jemand anderes anmelden kann.</p></div>
    <p class="feedback no" id="gErr" aria-live="polite"></p>
    <p class="small" id="gLoad" hidden>Einen Moment …</p>
  </div>
</div>
"""

BRIDGE = r"""
<script>
(() => {
"use strict";
const LAB = "__LAB__", IDKEY = "labor-" + LAB + "-name";
const $ = id => document.getElementById(id);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  del(k) { try { localStorage.removeItem(k); } catch (_) {} },
};
const call = (fn, ...args) => window.LABOR_API
  ? fetch(window.LABOR_API, { method: "POST", body: JSON.stringify({ fn, args }) })
      .then(r => r.json()).then(j => { if (j.error) throw new Error(j.error); return j.result; })
  : new Promise((res, rej) => {
      try { google.script.run.withSuccessHandler(res).withFailureHandler(rej)[fn](...args); }
      catch (e) { rej(e); }
    });
const errMsg = e => {
  const m = e && e.message ? String(e.message).replace(/^(Exception|Error):\s*/, "") : "";
  return /Namen|Labor/.test(m) ? m : "Die Verbindung klappt gerade nicht. Versuch es gleich nochmal.";
};
let me = null, allowed = [], started = false, pingTimer = null, debounce = null, online = true;
window.__tabOk = t => allowed.indexOf(t) >= 0;
let toastT = null;
window.__proLocked = () => {
  let t = document.querySelector(".proToast");
  if (!t) { t = document.createElement("div"); t.className = "proToast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = "Der Profi-Tab öffnet sich, sobald du alle Stufen im Rechentrainer geschafft hast.";
  t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3500);
};

function gate(which) {
  $("gate").hidden = !which;
  ["gLogin", "gAgain", "gWait", "gBye"].forEach(id => $(id).hidden = id !== which);
  $("gErr").textContent = ""; $("gLoad").hidden = true;
  if (which === "gLogin") setTimeout(() => $("gWer").focus(), 50);
}
async function login(name) {
  $("gErr").textContent = ""; $("gLoad").hidden = false;
  document.querySelectorAll("#gate button").forEach(b => b.disabled = true);
  try {
    const r = await call("anmelden", LAB, name);
    me = { id: r.id, name: r.name }; store.set(IDKEY, r.name); allowed = r.tabs || [];
    start(r.prog);
  } catch (e) {
    $("gLoad").hidden = true; $("gErr").textContent = errMsg(e);
  } finally { document.querySelectorAll("#gate button").forEach(b => b.disabled = false); }
}
function start(prog) {
  if (started) return;
  started = true;
  window.__initProg = prog || {};
  window.__startLab();
  $("whoName").textContent = me.name;
  $("who").hidden = false;
  apply();
  pingTimer = setInterval(ping, 20000);
  setTimeout(ping, 1500);
}
function snap() {
  const L = window.__lab2; if (!L) return null;
  const p = L.prog(), q = L.pro();
  return {
    tab: L.current(),
    prog: { c: p.c, f: p.f, unl: p.unl, lvl: p.lvl, won: !!p.won },
    pro: { i: q.i, score: q.score, errs: (q.errs || []).map(x => x || 0), n: L.PRO_N, answered: !!q.answered, done: !$("proDone").hidden },
  };
}
let lastSent = "";
async function ping() {
  if (!me) return;
  const s = snap(), js = JSON.stringify(s);
  try {
    const r = await call("ping", LAB, me.id, js !== lastSent ? s : null);
    lastSent = js;
    setOnline(true);
    if (!r.known) { clearInterval(pingTimer); me = null; store.del(IDKEY); gate("gBye"); return; }
    if (JSON.stringify(r.tabs) !== JSON.stringify(allowed)) { allowed = r.tabs || []; apply(); }
  } catch (e) { setOnline(false); }
}
function setOnline(v) { online = v; $("whoDot").classList.toggle("off", !v); $("whoDot").title = v ? "verbunden" : "keine Verbindung"; }
window.__changed = () => { clearTimeout(debounce); debounce = setTimeout(ping, 2000); };
function apply() {
  const L = window.__lab2; if (!L) return;
  document.querySelectorAll("#mainTabs button").forEach(b => { if (b.dataset.tab !== "pro") b.hidden = !window.__tabOk(b.dataset.tab); });
  L.updProTab();
  $("winPro").hidden = !window.__tabOk("pro"); $("winProTxt").hidden = !window.__tabOk("pro");
  const vis = [...document.querySelectorAll("#mainTabs button")].filter(b => !b.hidden);
  if (!vis.length) { gate("gWait"); return; }
  if (!$("gWait").hidden || !$("gLogin").hidden || !$("gAgain").hidden) gate(null);
  if (!vis.some(b => b.dataset.tab === L.current())) L.show(vis[0].dataset.tab);
}

$("gGo").addEventListener("click", () => login($("gWer").value));
$("gWer").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); login($("gWer").value); } });
$("gYes").addEventListener("click", () => login(store.get(IDKEY)));
$("gNo").addEventListener("click", () => { store.del(IDKEY); gate("gLogin"); });
$("whoSwitch").addEventListener("click", () => { clearInterval(pingTimer); me = null; store.del(IDKEY); gate("gBye"); });
document.addEventListener("DOMContentLoaded", () => {
  const known = store.get(IDKEY);
  if (known) { $("gWho").textContent = known; gate("gAgain"); } else gate("gLogin");
});
})();
</script>
"""

def build(src_name, out_name, lab, title, first_tab_comment):
    s = open(os.path.join(VIZ, src_name)).read()
    reps = [
        # Anmelde-Overlay + Styles
        ('</style>\n</head>', GATE_CSS + '</style>\n</head>'),
        ('<h1>' + title + '</h1>',
         '<div><h1>' + title + '</h1><div class="who" id="who" hidden><span class="dot" id="whoDot"></span>Angemeldet als <b id="whoName"></b> · <button class="linkbtn" id="whoSwitch">abmelden</button></div></div>'),
        # Lab-Code erst nach der Anmeldung starten
        ('<script>\n(() => {\n"use strict";', GATE_HTML.replace('__TITLE__', title) + BRIDGE.replace('__LAB__', lab) + '<script>\nwindow.__startLab = () => {\n"use strict";'),
        ('const allOpen = () => /alle/i.test(location.hash);', 'const allOpen = () => false;'),
        ('try { const s = JSON.parse(localStorage.getItem(KEY));', 'try { const s = window.__initProg;'),
        ('const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (_) {} };',
         'const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (_) {} if (window.__changed) window.__changed(); };'),
        ('function proVisible() { return !!prog.won || allOpen(); }', 'function proVisible() { return window.__tabOk("pro"); }'),
        ('function answerPro(k, btn) {', 'function answerPro(k, btn) {\n  if (window.__changed) window.__changed();'),
        ('function nextPro() {', 'function nextPro() {\n  if (window.__changed) window.__changed();'),
        ('function show(tab) {\n  current = tab;', 'function show(tab) {\n  if (tab === "pro" && !prog.won) { const f = [...document.querySelectorAll("#mainTabs button")].find(b => !b.hidden && b.dataset.tab !== "pro"); if (!f) return; tab = f.dataset.tab; }\n  current = tab; if (window.__changed) window.__changed();'),
        ('b.addEventListener("click", () => show(b.dataset.tab))', 'b.addEventListener("click", () => { if (b.dataset.tab === "pro" && !prog.won) { window.__proLocked(); return; } show(b.dataset.tab); })'),
        ('prog.won = true; save();', 'prog.won = true; save(); updProTab();'),
        ('function updProTab() {\n', 'function updProTab() {\n  { const pb = document.querySelector(\'#mainTabs [data-tab="pro"]\'); if (pb) { pb.classList.toggle("locked", !prog.won); pb.title = prog.won ? "" : "Erst den Rechentrainer schaffen"; } }\n'),
        ('window.__lab = {', 'window.__lab2 = { show, updProTab, current: () => current, prog: () => prog, pro: () => pro, PRO_N: PRO.length };\nwindow.__lab = {'),
        ('<button class="btn small" id="trReset">', '<button class="btn small" id="trReset" hidden>'),
        ('<p><b>Neu freigeschaltet:', '<p id="winProTxt"><b>Neu freigeschaltet:'),
    ]
    for a, b in reps:
        assert s.count(a) == 1, (src_name, a[:60], s.count(a))
        s = s.replace(a, b)
    # Ende des Lab-Skripts
    i = s.rindex('})();\n</script>')
    s = s[:i] + '};\n</script>' + s[i + len('})();\n</script>'):]
    open(os.path.join(HERE, out_name), 'w').write(s)
    print(out_name, len(s))
    # GitHub-Pages-Version: gleiche Datei, holt die Script-Adresse aus docs/config.js
    d = os.path.join(HERE, '..', 'docs', lab)
    os.makedirs(d, exist_ok=True)
    a = '<head>\n'
    assert s.count(a) == 1
    open(os.path.join(d, 'index.html'), 'w').write(s.replace(a, a + '<script src="../config.js"></script>\n'))
    print('docs/' + lab + '/index.html')

build('Geraden-Labor.html', 'Geraden.html', 'geraden', 'Geraden-Labor', '')
build('Parabel-Labor.html', 'Parabel.html', 'parabel', 'Parabel-Labor', '')

# Admin-Seite für GitHub Pages
_s = open(os.path.join(HERE, 'Admin.html')).read()
os.makedirs(os.path.join(HERE, '..', 'docs', 'admin'), exist_ok=True)
assert _s.count('<head>\n') == 1
open(os.path.join(HERE, '..', 'docs', 'admin', 'index.html'), 'w').write(_s.replace('<head>\n', '<head>\n<script src="../config.js"></script>\n'))
print('docs/admin/index.html')
