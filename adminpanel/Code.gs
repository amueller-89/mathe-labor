/**
 * Labor-Server für Geraden-Labor (UIIIb) und Parabel-Labor (OIIIa).
 *
 * Einrichtung: siehe ANLEITUNG.md. Die HTML-Dateien liegen im Drive-Ordner und werden von dort gelesen. Kurz:
 *   1. Neue Google-Tabelle anlegen, Erweiterungen → Apps Script.
 *   2. Diese Datei als Code.gs einfügen (sonst nichts).
 *   3. Projekteinstellungen → Skripteigenschaften: ADMIN_SCHLUESSEL = eigenes Wort.
 *   4. Bereitstellen → Neue Bereitstellung → Web-App,
 *      „Ausführen als: Ich“, „Zugriff: Jeder“.
 *
 * Links (WEBAPP = die URL, die Google nach dem Bereitstellen anzeigt):
 *   Kinder UIIIb:  WEBAPP?lab=geraden
 *   Kinder OIIIa:  WEBAPP?lab=parabel
 *   Admin:         WEBAPP?admin=DEIN-SCHLUESSEL
 */

// Der Admin-Schlüssel steht NICHT im Code, sondern in den Skripteigenschaften
// (Apps-Script-Editor → Projekteinstellungen → Skripteigenschaften → ADMIN_SCHLUESSEL).
// So bleibt er bei jedem Code-Update erhalten und landet nie auf GitHub.

const LABS = {
  geraden: {
    title: 'Geraden-Labor', file: 'Geraden', klasse: 'UIIIb',
    tabs: [['mb', '1 Steigung & y-Achsenabschnitt'], ['pts', '2 Zwei Punkte'], ['train', '3 Rechentrainer'], ['pro', '4 Profi ★']],
  },
  parabel: {
    title: 'Parabel-Labor', file: 'Parabel', klasse: 'OIIIa',
    tabs: [['sp', '1 Scheitelpunktform'], ['forms', '2 Drei Formen'], ['pq', '3 pq-Formel'], ['train', '4 Rechentrainer'], ['pro', '5 Profi ★']],
  },
};

// Speicher: jedes Kind ist eine eigene Skripteigenschaft (schnell, kein Tabellen-Zugriff, kein Lock beim Speichern).
//   k_<lab>_<id>   = {"id","name","an","z","st"}   (an = angemeldet, z = zuletzt gespeichert, st = Fortschritt)
//   n_<lab>_<name> = id                            (Index zum Wiederfinden per Vorname)
//   cfg_<lab>      = {"tabs":[…], "alle":[ids], "epoch":n}
// Die Tabelle „Schueler“ aus der alten Version wird einmalig übernommen und danach nicht mehr benutzt.
const SHEET = 'Schueler';

/* ---------------- Web-App ---------------- */

// Die HTML-Dateien werden direkt aus diesem Drive-Ordner gelesen (Visualisierungen/Adminpanel).
// Liegt dort eine neue Version, ist sie sofort aktiv, ohne neue Bereitstellung.
const ORDNER_ID = '1N6RihmTnPvpw0HPZ1IsIbxfaPhJC431P';

function html_(name) {
  const it = DriveApp.getFolderById(ORDNER_ID).getFilesByName(name + '.html');
  let best = null;
  while (it.hasNext()) {
    const f = it.next();
    if (!f.isTrashed() && (!best || f.getLastUpdated() > best.getLastUpdated())) best = f;
  }
  if (!best) throw new Error('Datei ' + name + '.html fehlt im Ordner Adminpanel.');
  return best.getBlob().getDataAsString('UTF-8');
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.admin !== undefined) {
    return HtmlService.createHtmlOutput(html_('Admin'))
      .setTitle('Labor-Admin')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  const lab = LABS[p.lab];
  if (!lab) {
    return HtmlService.createHtmlOutput(
      '<p style="font:18px system-ui;padding:24px">Bitte den Link von deiner Lehrkraft benutzen.</p>');
  }
  return HtmlService.createHtmlOutput(html_(lab.file))
    .setTitle(lab.title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Schnittstelle für die Version auf GitHub Pages: POST {fn, args} → {result} oder {error}
const API = { anmelden: anmelden, ping: ping, adminDaten: adminDaten, adminFreigabe: adminFreigabe, adminLoeschen: adminLoeschen, adminAlles: adminAlles, adminReset: adminReset, adminAlleLoeschen: adminAlleLoeschen };
function doPost(e) {
  let out;
  try {
    const req = JSON.parse(e.postData.contents);
    const fn = API[req.fn];
    if (!fn) throw new Error('Unbekannte Funktion');
    out = { result: fn.apply(null, req.args || []) };
  } catch (err) {
    out = { error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- Speicher ---------------- */

const P = () => PropertiesService.getScriptProperties();
const C = () => CacheService.getScriptCache();

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(28000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function parseJson_(s) { try { return s ? JSON.parse(s) : null; } catch (err) { return null; } }
function time_(v) { return v instanceof Date ? v.getTime() : (v ? new Date(v).getTime() : 0); }
function nameKey_(lab, name) { return 'n_' + lab + '_' + String(name).toLowerCase(); }

// Einmalige Übernahme aus der alten Version (Tabelle + tabs_/alle_)
function migrate_() {
  if (C().get('v2') || P().getProperty('v2')) { C().put('v2', '1', 21600); return; }
  withLock_(() => {
    const props = P();
    if (props.getProperty('v2')) return;
    const add = {};
    Object.keys(LABS).forEach(lab => {
      const tabs = parseJson_(props.getProperty('tabs_' + lab));
      const alle = parseJson_(props.getProperty('alle_' + lab));
      add['cfg_' + lab] = JSON.stringify({ tabs: Array.isArray(tabs) ? tabs : [LABS[lab].tabs[0][0]], alle: Array.isArray(alle) ? alle : [], epoch: 1 });
    });
    try {
      const sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
      const n = sh ? sh.getLastRow() - 1 : 0;
      if (n > 0) sh.getRange(2, 1, n, 7).getValues().forEach(r => {
        const id = String(r[0]), lab = String(r[1]), name = String(r[2]);
        if (!id || !LABS[lab] || !name) return;
        add['k_' + lab + '_' + id] = JSON.stringify({ id, name, an: time_(r[3]), z: time_(r[4]), st: parseJson_(String(r[6] || '')) || {} });
        add[nameKey_(lab, name)] = id;
      });
    } catch (err) {}
    add.v2 = '1';
    props.setProperties(add);
  });
}

function cfg_(lab) {
  const c = C().get('cfg_' + lab);
  let o = parseJson_(c);
  if (!o) {
    o = parseJson_(P().getProperty('cfg_' + lab)) || {};
    if (!Array.isArray(o.tabs)) o.tabs = [LABS[lab].tabs[0][0]];
    if (!Array.isArray(o.alle)) o.alle = [];
    if (!o.epoch) o.epoch = 1;
    C().put('cfg_' + lab, JSON.stringify(o), 600);
  }
  return o;
}
function setCfg_(lab, o) {
  const js = JSON.stringify(o);
  P().setProperty('cfg_' + lab, js);
  C().put('cfg_' + lab, js, 600);
}

function kid_(lab, id) { return parseJson_(P().getProperty('k_' + lab + '_' + id)); }
function kids_(lab) {
  const all = P().getProperties(), pre = 'k_' + lab + '_', out = [];
  Object.keys(all).forEach(k => { if (k.indexOf(pre) === 0) { const o = parseJson_(all[k]); if (o) out.push(o); } });
  return out;
}

function antwort_(lab, id, extra) {
  const c = cfg_(lab), alle = c.alle.indexOf(String(id)) >= 0;
  const o = { tabs: alle ? LABS[lab].tabs.map(t => t[0]) : c.tabs, alle, epoch: c.epoch };
  Object.keys(extra || {}).forEach(k => o[k] = extra[k]);
  return o;
}

/* ---------------- Aufrufe aus den Laboren ---------------- */

function cleanName_(name) {
  return String(name || '').replace(/[<>"'&]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
}

function anmelden(lab, name) {
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  name = cleanName_(name);
  if (name.length < 2) throw new Error('Bitte gib deinen Namen ein.');
  migrate_();
  const nk = nameKey_(lab, name);
  let id = P().getProperty(nk), k = id ? kid_(lab, id) : null;
  if (!k) {
    // Neues Kind: nur das Anlegen braucht den Lock (damit derselbe Name nicht doppelt entsteht), das dauert Millisekunden.
    k = withLock_(() => {
      const again = P().getProperty(nk), ak = again ? kid_(lab, again) : null;
      if (ak) return ak;
      const nid = Utilities.getUuid(), now = Date.now();
      const o = { id: nid, name, an: now, z: now, st: {} };
      P().setProperties({ ['k_' + lab + '_' + nid]: JSON.stringify(o), [nk]: nid });
      return o;
    });
  }
  C().put('seen_' + k.id, String(Date.now()), 21600);
  return antwort_(lab, k.id, { id: k.id, name: k.name, prog: (k.st && k.st.prog) || null });
}

// Wird alle 20 s vom Labor aufgerufen. state = neuer Fortschritt, oder null, wenn sich nichts geändert hat.
// epoch = Stand, mit dem das Labor gestartet ist. Wurde inzwischen zurückgesetzt, wird der alte Fortschritt verworfen.
function ping(lab, id, state, epoch) {
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  id = String(id);
  migrate_();
  C().put('seen_' + id, String(Date.now()), 21600);
  const c = cfg_(lab);
  let known = true;
  if (state && typeof state === 'object') {
    const k = kid_(lab, id);
    if (!k) known = false;
    else if (!epoch || Number(epoch) === Number(c.epoch)) {
      k.st = state; k.z = Date.now();
      const js = JSON.stringify(k);
      if (js.length < 8500) P().setProperty('k_' + lab + '_' + id, js);
    }
  } else if (C().get('gone_' + id)) known = false;
  return antwort_(lab, id, { known });
}

/* ---------------- Admin ---------------- */

function checkKey_(key) {
  const soll = P().getProperty('ADMIN_SCHLUESSEL');
  if (!soll) throw new Error('Bitte zuerst im Apps-Script-Editor unter Projekteinstellungen → Skripteigenschaften den ADMIN_SCHLUESSEL anlegen.');
  if (String(key) !== soll) throw new Error('Falscher Admin-Schlüssel.');
}

function adminDaten(key, lab, ohneUrl) {
  checkKey_(key);
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  migrate_();
  const c = cfg_(lab), now = Date.now();
  const list = kids_(lab);
  const seen = list.length ? C().getAll(list.map(x => 'seen_' + x.id)) : {};
  const kids = list.map(x => ({
    id: x.id, name: x.name, tab: (x.st && x.st.tab) || '', alle: c.alle.indexOf(x.id) >= 0,
    vorSek: Math.round((now - Math.max(Number(x.z) || 0, Number(x.an) || 0, Number(seen['seen_' + x.id]) || 0)) / 1000),
    state: x.st || null,
  }));
  let url = '';
  if (!ohneUrl) { try { url = ScriptApp.getService().getUrl(); } catch (err) {} }
  return {
    labs: Object.keys(LABS).map(k => ({ id: k, title: LABS[k].title, klasse: LABS[k].klasse })),
    tabs: LABS[lab].tabs.map(([id, label]) => ({ id, label, on: c.tabs.indexOf(id) >= 0 })),
    kids, url, now,
  };
}

function adminFreigabe(key, lab, tabs) {
  checkKey_(key);
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  const valid = LABS[lab].tabs.map(t => t[0]);
  const list = (tabs || []).map(String).filter(t => valid.indexOf(t) >= 0);
  withLock_(() => { const c = cfg_(lab); c.tabs = list; setCfg_(lab, c); });
  return adminDaten(key, lab, true);
}

function adminAlles(key, lab, id, an) {
  checkKey_(key);
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  withLock_(() => {
    id = String(id);
    const c = cfg_(lab);
    c.alle = c.alle.filter(x => x !== id);
    if (an) c.alle.push(id);
    setCfg_(lab, c);
  });
  return adminDaten(key, lab, true);
}

function loesche_(lab, k) {
  P().deleteProperty('k_' + lab + '_' + k.id);
  const nk = nameKey_(lab, k.name);
  if (P().getProperty(nk) === k.id) P().deleteProperty(nk);
  C().put('gone_' + k.id, '1', 21600);
}

function adminLoeschen(key, lab, id) {
  checkKey_(key);
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  withLock_(() => { const k = kid_(lab, String(id)); if (k) loesche_(lab, k); });
  return adminDaten(key, lab, true);
}

// Alle Kinder dieses Labors behalten ihren Namen, fangen aber von vorn an.
function adminReset(key, lab) {
  checkKey_(key);
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  withLock_(() => {
    const c = cfg_(lab); c.epoch = (Number(c.epoch) || 1) + 1; c.alle = []; setCfg_(lab, c);
    const upd = {};
    kids_(lab).forEach(k => { k.st = {}; upd['k_' + lab + '_' + k.id] = JSON.stringify(k); });
    if (Object.keys(upd).length) P().setProperties(upd);
  });
  return adminDaten(key, lab, true);
}

// Alle Kinder dieses Labors löschen (Namen und Fortschritt).
function adminAlleLoeschen(key, lab) {
  checkKey_(key);
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  withLock_(() => {
    kids_(lab).forEach(k => loesche_(lab, k));
    const c = cfg_(lab); c.epoch = (Number(c.epoch) || 1) + 1; c.alle = []; setCfg_(lab, c);
  });
  return adminDaten(key, lab, true);
}
