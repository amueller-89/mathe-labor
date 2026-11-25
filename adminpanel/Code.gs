/**
 * Labor-Server für Geraden-Labor (UIIIb) und Parabel-Labor (OIIIa).
 *
 * Einrichtung: siehe ANLEITUNG.md. Die HTML-Dateien liegen im Drive-Ordner und werden von dort gelesen. Kurz:
 *   1. Neue Google-Tabelle anlegen, Erweiterungen → Apps Script.
 *   2. Diese Datei als Code.gs einfügen (sonst nichts).
 *   3. Unten ADMIN_SCHLUESSEL ändern.
 *   4. Bereitstellen → Neue Bereitstellung → Web-App,
 *      „Ausführen als: Ich“, „Zugriff: Jeder“.
 *
 * Links (WEBAPP = die URL, die Google nach dem Bereitstellen anzeigt):
 *   Kinder UIIIb:  WEBAPP?lab=geraden
 *   Kinder OIIIa:  WEBAPP?lab=parabel
 *   Admin:         WEBAPP?admin=DEIN-SCHLUESSEL
 */

// >>> Hier ein eigenes Wort eintragen (nur Buchstaben/Ziffern), das niemand errät. <<<
const ADMIN_SCHLUESSEL = 'bitte-aendern';

const LABS = {
  geraden: {
    title: 'Geraden-Labor', file: 'Geraden', klasse: 'UIIIb',
    tabs: [['mb', '1 Steigung & y-Achsenabschnitt'], ['pts', '2 Zwei Punkte'], ['train', '3 Rechentrainer'], ['pro', '4 Profi ★']],
  },
  parabel: {
    title: 'Parabel-Labor', file: 'Parabel', klasse: 'OIIIa',
    tabs: [['pq', '1 pq-Formel'], ['forms', '2 Drei Formen'], ['sp', '3 Scheitelpunktform'], ['train', '4 Rechentrainer'], ['pro', '5 Profi ★']],
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
  lock.waitLock(15000);
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

/* ---------------- Aufrufe aus den Laboren ---------------- */

function cleanName_(name) {
  return String(name || '').replace(/[<>"'&]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
}

function anmelden(lab, name) {
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  name = cleanName_(name);
  if (name.length < 2) throw new Error('Bitte gib deinen Namen ein.');
  return withLock_(() => {
    const now = new Date();
    const key = name.toLowerCase();
    let r = rows_().find(x => x.labor === lab && x.name.toLowerCase() === key);
    if (!r) {
      const id = Utilities.getUuid();
      sheet_().appendRow([id, lab, name, now, now, '', '']);
      r = { id, name, fortschritt: '' };
    } else {
      sheet_().getRange(r.row, 5).setValue(now);
    }
    const st = parseJson_(r.fortschritt) || {};
    return { id: r.id, name: r.name, prog: st.prog || null, tabs: freigaben_(lab) };
  });
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
      const r = rows_().find(x => x.id === id && x.labor === lab);
      if (!r) return false;
      if (json.length < 20000) sheet_().getRange(r.row, 5, 1, 3).setValues([[new Date(), String(state.tab || ''), json]]);
      return true;
    });
  }
  return { known, tabs: freigaben_(lab) };
}

/* ---------------- Admin ---------------- */

function checkKey_(key) {
  if (ADMIN_SCHLUESSEL === 'bitte-aendern') throw new Error('Bitte zuerst in Code.gs den ADMIN_SCHLUESSEL ändern und neu bereitstellen.');
  if (String(key) !== ADMIN_SCHLUESSEL) throw new Error('Falscher Admin-Schlüssel.');
}

function adminDaten(key, lab) {
  checkKey_(key);
  if (!LABS[lab]) throw new Error('Unbekanntes Labor');
  const allowed = freigaben_(lab);
  const now = Date.now();
  const list = rows_().filter(x => x.labor === lab);
  const seen = list.length ? CacheService.getScriptCache().getAll(list.map(x => 'seen_' + x.id)) : {};
  const kids = list.map(x => ({
    id: x.id, name: x.name, tab: x.tab,
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

function adminLoeschen(key, lab, id) {
  checkKey_(key);
  return withLock_(() => {
    const r = rows_().find(x => x.id === String(id) && x.labor === lab);
    if (r) sheet_().deleteRow(r.row);
    return !!r;
  });
}
