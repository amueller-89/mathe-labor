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

const SHEET = 'Schueler';
const HEAD = ['id', 'labor', 'name', 'angemeldet', 'zuletzt_online', 'tab', 'fortschritt'];

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
const API = { anmelden: anmelden, ping: ping, adminDaten: adminDaten, adminFreigabe: adminFreigabe, adminLoeschen: adminLoeschen, adminAlles: adminAlles };
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

/* ---------------- Tabelle ---------------- */

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

// Nur id/labor/name lesen (klein), für schnelles Suchen beim Login.
function kurz_() {
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 3).getValues().map((r, i) => ({ row: i + 2, id: String(r[0]), labor: String(r[1]), name: String(r[2]) }));
}

function rows_() {
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, HEAD.length).getValues().map((r, i) => ({
    row: i + 2, id: String(r[0]), labor: String(r[1]), name: String(r[2]),
    angemeldet: r[3], zuletzt: r[4], tab: String(r[5] || ''), fortschritt: String(r[6] || ''),
  }));
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(28000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function parseJson_(s) { try { return s ? JSON.parse(s) : null; } catch (err) { return null; } }
function time_(v) { return v instanceof Date ? v.getTime() : (v ? new Date(v).getTime() : 0); }

/* ---------------- Freigaben ---------------- */

function freigaben_(lab) {
  const raw = PropertiesService.getScriptProperties().getProperty('tabs_' + lab);
  const list = parseJson_(raw);
  if (Array.isArray(list)) return list;
  return [LABS[lab].tabs[0][0]];   // Standard: nur der erste Tab
}

// Kinder, für die alles freigeschaltet ist (alle Tabs, alle Stufen, Profi offen)
function alle_(lab) {
  const list = parseJson_(PropertiesService.getScriptProperties().getProperty('alle_' + lab));
  return Array.isArray(list) ? list : [];
}

function tabsFuer_(lab, id) {
  return alle_(lab).indexOf(String(id)) >= 0 ? LABS[lab].tabs.map(t => t[0]) : freigaben_(lab);
}

/* ---------------- Aufrufe aus den Laboren ---------------- */

function cleanName_(name) {
  return String(name || '').replace(/[<>"'&]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
}

function anmelden(lab, name) {
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  name = cleanName_(name);
  if (name.length < 2) throw new Error('Bitte gib deinen Namen ein.');
  const key = name.toLowerCase();
  const find = () => kurz_().find(x => x.labor === lab && x.name.toLowerCase() === key);
  // Bekannte Kinder: ohne Lock und ohne Schreiben (online-Zeit nur im Cache),
  // damit eine ganze Klasse gleichzeitig nicht im Lock-Stau landet.
  let r = find(), neu = false;
  if (!r) {
    r = withLock_(() => {
      const again = find();
      if (again) return again;
      const now = new Date(), id = Utilities.getUuid();
      sheet_().appendRow([id, lab, name, now, now, '', '']);
      neu = true;
      return { id, name };
    });
  }
  CacheService.getScriptCache().put('seen_' + r.id, String(Date.now()), 21600);
  let st = {};
  if (!neu) {
    const v = sheet_().getRange(r.row, 1, 1, HEAD.length).getValues()[0];
    if (String(v[0]) === r.id) st = parseJson_(String(v[6] || '')) || {};
    else st = parseJson_((rows_().find(x => x.id === r.id) || {}).fortschritt) || {};  // Zeile hat sich verschoben
  }
  return { id: r.id, name: r.name, prog: st.prog || null, tabs: tabsFuer_(lab, r.id), alle: alle_(lab).indexOf(String(r.id)) >= 0 };
}

// Wird alle 20 s vom Labor aufgerufen. state = neuer Fortschritt, oder null, wenn sich nichts geändert hat.
// Ohne state wird die Tabelle nicht angefasst (nur „online“ im Cache), damit 30 Kinder gleichzeitig kein Problem sind.
function ping(lab, id, state) {
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  id = String(id);
  CacheService.getScriptCache().put('seen_' + id, String(Date.now()), 21600);
  let known = true;
  if (state && typeof state === 'object') {
    const json = JSON.stringify(state);
    known = withLock_(() => {
      const r = kurz_().find(x => x.id === id && x.labor === lab);
      if (!r) return false;
      if (json.length < 20000) sheet_().getRange(r.row, 5, 1, 3).setValues([[new Date(), String(state.tab || ''), json]]);
      return true;
    });
  }
  return { known, tabs: tabsFuer_(lab, id), alle: alle_(lab).indexOf(id) >= 0 };
}

/* ---------------- Admin ---------------- */

function checkKey_(key) {
  const soll = PropertiesService.getScriptProperties().getProperty('ADMIN_SCHLUESSEL');
  if (!soll) throw new Error('Bitte zuerst im Apps-Script-Editor unter Projekteinstellungen → Skripteigenschaften den ADMIN_SCHLUESSEL anlegen.');
  if (String(key) !== soll) throw new Error('Falscher Admin-Schlüssel.');
}

function adminDaten(key, lab) {
  checkKey_(key);
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  const allowed = freigaben_(lab);
  const now = Date.now();
  const list = rows_().filter(x => x.labor === lab);
  const seen = list.length ? CacheService.getScriptCache().getAll(list.map(x => 'seen_' + x.id)) : {};
  const alle = alle_(lab);
  const kids = list.map(x => ({
    id: x.id, name: x.name, tab: x.tab, alle: alle.indexOf(x.id) >= 0,
    vorSek: Math.round((now - Math.max(time_(x.zuletzt), Number(seen['seen_' + x.id]) || 0)) / 1000),
    state: parseJson_(x.fortschritt),
  }));
  let url = '';
  try { url = ScriptApp.getService().getUrl(); } catch (err) {}
  return {
    labs: Object.keys(LABS).map(k => ({ id: k, title: LABS[k].title, klasse: LABS[k].klasse })),
    tabs: LABS[lab].tabs.map(([id, label]) => ({ id, label, on: allowed.indexOf(id) >= 0 })),
    kids, url, now,
  };
}

function adminFreigabe(key, lab, tabs) {
  checkKey_(key);
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  const valid = LABS[lab].tabs.map(t => t[0]);
  const list = (tabs || []).map(String).filter(t => valid.indexOf(t) >= 0);
  PropertiesService.getScriptProperties().setProperty('tabs_' + lab, JSON.stringify(list));
  return list;
}

function adminAlles(key, lab, id, an) {
  checkKey_(key);
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  return withLock_(() => {
    id = String(id);
    const list = alle_(lab).filter(x => x !== id);
    if (an) list.push(id);
    PropertiesService.getScriptProperties().setProperty('alle_' + lab, JSON.stringify(list));
    return !!an;
  });
}

function adminLoeschen(key, lab, id) {
  checkKey_(key);
  return withLock_(() => {
    const r = kurz_().find(x => x.id === String(id) && x.labor === lab);
    if (r) sheet_().deleteRow(r.row);
    return !!r;
  });
}
