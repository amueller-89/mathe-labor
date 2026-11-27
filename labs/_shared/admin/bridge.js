/* Anmeldung + Verbindung zum Apps Script, nur in der Admin-Version (adminpanel/, docs/).
   __LAB__ ersetzt der Build durch die Labor-ID. */
(() => {
"use strict";
const LAB = "__LAB__", IDKEY = "labor-" + LAB + "-name", SESS = "labor-" + LAB + "-sitzung";
const $ = id => document.getElementById(id);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  del(k) { try { localStorage.removeItem(k); } catch (_) {} },
};
// Sitzung in diesem Browser-Tab: beim Neuladen (F5) ohne Nachfrage wieder anmelden
const sess = {
  get() { try { return sessionStorage.getItem(SESS); } catch (_) { return null; } },
  set(v) { try { sessionStorage.setItem(SESS, v); } catch (_) {} },
  del() { try { sessionStorage.removeItem(SESS); } catch (_) {} },
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
let me = null, allowed = [], alle = false, need = 3, started = false, pingTimer = null, debounce = null, online = true, epoch = 0;
const tabOk = t => allowed.indexOf(t) >= 0;
let toastT = null;
// Haken für das Labor (labs/_shared/core.js liest window.LAB_ADMIN)
window.LAB_ADMIN = {
  alle: () => alle,
  need: () => need,
  tabOk,
  prog: null,
  changed: () => { clearTimeout(debounce); debounce = setTimeout(ping, 2000); },
  proLocked() {
    let t = document.querySelector(".proToast");
    if (!t) { t = document.createElement("div"); t.className = "proToast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = "Der Profi-Tab öffnet sich, sobald du alle Stufen im Rechentrainer geschafft hast.";
    t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3500);
  },
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
    // Bei Ansturm (alle melden sich gleichzeitig an) automatisch mehrmals versetzt nachfassen
    let r = null;
    for (let i = 0; ; i++) {
      try { r = await call("anmelden", LAB, name); break; }
      catch (e) {
        const m = e && e.message ? String(e.message) : "";
        if (/Namen|Labor/.test(m) || i >= 6) throw e;
        await new Promise(ok => setTimeout(ok, 1500 + Math.random() * 2500 * (i + 1)));
      }
    }
    me = { id: r.id, name: r.name }; store.set(IDKEY, r.name); sess.set(r.name); allowed = r.tabs || []; alle = !!r.alle; epoch = r.epoch || 0; need = r.need || 3;
    start(r.prog);
  } catch (e) {
    $("gLoad").hidden = true; $("gErr").textContent = errMsg(e);
  } finally { document.querySelectorAll("#gate button").forEach(b => b.disabled = false); }
}
function start(prog) {
  if (started) return;
  started = true;
  window.LAB_ADMIN.prog = prog || {};
  window.__startLab();
  $("whoName").textContent = me.name;
  $("who").hidden = false;
  apply();
  pingTimer = setInterval(ping, 20000);
  setTimeout(ping, 1500);
}
function snap() {
  const L = window.__lab; if (!L) return null;
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
    const r = await call("ping", LAB, me.id, js !== lastSent ? s : null, epoch);
    lastSent = js;
    setOnline(true);
    if (!r.known) { clearInterval(pingTimer); me = null; store.del(IDKEY); sess.del(); gate("gBye"); return; }
    // Lehrkraft hat alle zurückgesetzt: neu laden, dann startet alles bei null (Anmeldung bleibt)
    if (r.epoch && epoch && r.epoch !== epoch) { clearInterval(pingTimer); location.reload(); return; }
    if (JSON.stringify(r.tabs) !== JSON.stringify(allowed) || !!r.alle !== alle || (r.need || 3) !== need) {
      const neu = (r.tabs || []).filter(t => allowed.indexOf(t) < 0).map(tabName), msgs = [];
      if (neu.length) msgs.push("Neu freigeschaltet: " + neu.join(", "));
      if (r.alle && !alle) msgs.push("Für dich ist jetzt alles freigeschaltet");
      if ((r.need || 3) < need) msgs.push("Jetzt reichen " + (r.need || 3) + " richtige Aufgaben je Stufe");
      allowed = r.tabs || []; alle = !!r.alle; need = r.need || 3; apply();
      if (msgs.length) unlockToast(msgs);
    }
  } catch (e) { setOnline(false); }
}
const tabName = t => { const b = document.querySelector('#mainTabs [data-tab="' + t + '"]'); return b ? b.textContent.replace(/^\d+\s*/, "") : t; };
// Hinweis am Rand, wenn die Lehrkraft etwas freischaltet (nimmt keinen Fokus)
let unlockT = null;
function unlockToast(msgs) {
  let t = document.querySelector(".unlockToast");
  if (!t) { t = document.createElement("div"); t.className = "unlockToast"; t.setAttribute("role", "status"); t.addEventListener("click", () => t.hidden = true); document.body.appendChild(t); }
  t.innerHTML = "<b>🔓</b><span></span>"; t.querySelector("span").textContent = msgs.join(" · ");
  t.hidden = false; t.classList.remove("in"); void t.offsetWidth; t.classList.add("in");
  clearTimeout(unlockT); unlockT = setTimeout(() => t.hidden = true, 8000);
}
function setOnline(v) { online = v; $("whoDot").classList.toggle("off", !v); $("whoDot").title = v ? "verbunden" : "keine Verbindung"; }
function apply() {
  const L = window.__lab; if (!L) return;
  document.querySelectorAll("#mainTabs button").forEach(b => { if (b.dataset.tab !== "pro") b.hidden = !tabOk(b.dataset.tab); });
  L.updProTab(); L.renderLevels();
  document.querySelectorAll("#mainTabs .tgrp").forEach(g => g.hidden = ![...g.querySelectorAll("button")].some(b => !b.hidden));
  $("winPro").hidden = !tabOk("pro"); $("winProTxt").hidden = !tabOk("pro");
  const vis = [...document.querySelectorAll("#mainTabs button")].filter(b => !b.hidden);
  if (!vis.length) { gate("gWait"); return; }
  if (!$("gWait").hidden || !$("gLogin").hidden || !$("gAgain").hidden) gate(null);
  if (!vis.some(b => b.dataset.tab === L.current())) L.show(vis[0].dataset.tab);
}

$("gGo").addEventListener("click", () => login($("gWer").value));
$("gWer").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); login($("gWer").value); } });
$("gYes").addEventListener("click", () => login(store.get(IDKEY)));
$("gNo").addEventListener("click", () => { store.del(IDKEY); gate("gLogin"); });
$("whoSwitch").addEventListener("click", () => { clearInterval(pingTimer); me = null; store.del(IDKEY); sess.del(); gate("gBye"); });
$("gNo").addEventListener("click", () => sess.del());
document.addEventListener("DOMContentLoaded", () => {
  const known = store.get(IDKEY);
  if (known && sess.get() === known) { $("gWho").textContent = known; gate("gAgain"); login(known); }
  else if (known) { $("gWho").textContent = known; gate("gAgain"); } else gate("gLogin");
});
})();
