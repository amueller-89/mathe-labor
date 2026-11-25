// Lokaler Nachbau von Apps Script: führt Code.gs mit Fake-Diensten aus.
const http = require('http'), fs = require('fs'), vm = require('vm'), path = require('path'), crypto = require('crypto');
const DIR = require('path').join(__dirname, '..'), PORT = +process.argv[2] || 8765;
const rows = []; // sheet rows incl. header
const sheet = {
  getLastRow: () => rows.length,
  getRange: (r, c, nr = 1, nc = 1) => ({
    getValues: () => { const o = []; for (let i = 0; i < nr; i++) { const row = rows[r - 1 + i] || []; o.push(Array.from({ length: nc }, (_, j) => row[c - 1 + j] ?? '')); } return o; },
    setValues: v => { v.forEach((row, i) => { rows[r - 1 + i] = rows[r - 1 + i] || []; row.forEach((x, j) => rows[r - 1 + i][c - 1 + j] = x); }); return this; },
    setValue: x => { rows[r - 1] = rows[r - 1] || []; rows[r - 1][c - 1] = x; },
    setFontWeight() { return this; },
  }),
  appendRow: r => rows.push(r.slice()),
  deleteRow: r => rows.splice(r - 1, 1),
  setFrozenRows() {},
};
let created = false;
const props = {};
const ctx = {
  SpreadsheetApp: { getActive: () => ({ getSheetByName: () => created ? sheet : null, insertSheet: () => { created = true; return sheet; } }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
  CacheService: { getScriptCache: () => ({ put: (k, v) => { props['cache:' + k] = v; }, getAll: ks => { const o = {}; ks.forEach(k => { if (props['cache:' + k] !== undefined) o[k] = props['cache:' + k]; }); return o; } }) },
  Number,
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: t => ({ t, setMimeType() { return this; } }) },
  DriveApp: { getFolderById: () => ({ getFilesByName: n => { const fs2 = [{ isTrashed: () => false, getLastUpdated: () => new Date(), getBlob: () => ({ getDataAsString: () => fs.readFileSync(path.join(DIR, n), 'utf8') }) }]; let i = 0; return { hasNext: () => i < fs2.length, next: () => fs2[i++] }; } }) },
  Utilities: { getUuid: () => crypto.randomUUID() },
  ScriptApp: { getService: () => ({ getUrl: () => `http://localhost:${PORT}/exec` }) },
  HtmlService: {
    createHtmlOutputFromFile: n => out(fs.readFileSync(path.join(DIR, n + '.html'), 'utf8')),
    createHtmlOutput: h => out(h),
  },
  JSON, Date, Math, String, Object, Array, Error, console,
};
function out(html) { const o = { html, setTitle: () => o, addMetaTag: () => o }; return o; }
let code = fs.readFileSync(path.join(DIR, 'Code.gs'), 'utf8').replace("const ADMIN_SCHLUESSEL = 'bitte-aendern';", "const ADMIN_SCHLUESSEL = 'test123';");
vm.createContext(ctx); vm.runInContext(code + '\nthis.__api = {doGet, doPost, anmelden, ping, adminDaten, adminFreigabe, adminLoeschen, adminAlles};', ctx);
const api = ctx.__api;

const SHIM = `<script>
window.google = { script: {
  url: { getLocation(cb) { const p = {}; new URLSearchParams(location.search).forEach((v, k) => p[k] = v); setTimeout(() => cb({ parameter: p }), 0); } },
  get run() { let ok = () => {}, bad = () => {}; const h = { withSuccessHandler(f) { ok = f; return p; }, withFailureHandler(f) { bad = f; return p; } };
    const p = new Proxy(h, { get(t, k) { if (k in t) return t[k]; return (...args) => fetch('/rpc', { method: 'POST', body: JSON.stringify({ fn: k, args }) })
      .then(r => r.json()).then(j => j.error ? bad(new Error(j.error)) : ok(j.result)).catch(e => bad(e)); } }); return p; } } };
</script>`;

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/rpc') {
    let b = ''; req.on('data', d => b += d); req.on('end', () => {
      const { fn, args } = JSON.parse(b);
      let r;
      try { r = { result: JSON.parse(JSON.stringify(api[fn](...args) ?? null)) }; } catch (e) { r = { error: e.message }; }
      res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(r));
    }); return;
  }
  if (u.pathname === '/exec' && req.method === 'POST') {
    let b = ''; req.on('data', d => b += d); req.on('end', () => {
      const o = api.doPost({ postData: { contents: b } });
      res.setHeader('content-type', 'application/json'); res.end(o.t);
    }); return;
  }
  if (u.pathname === '/site/config.js') { res.setHeader('content-type', 'text/javascript'); res.end('window.LABOR_API = "/exec";'); return; }
  if (u.pathname.startsWith('/site/')) {
    let f = path.join(DIR, '..', 'docs', u.pathname.slice(6)); if (f.endsWith('/')) f += 'index.html';
    if (fs.existsSync(f)) { res.setHeader('content-type', f.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8'); res.end(fs.readFileSync(f)); return; }
  }
  if (u.pathname === '/exec') {
    const p = {}; u.searchParams.forEach((v, k) => p[k] = v);
    const o = api.doGet({ parameter: p });
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(o.html.replace(/<head>/i, '<head>' + SHIM)); return;
  }
  if (u.pathname === '/dump') { res.end(JSON.stringify({ rows, props })); return; }
  res.statusCode = 404; res.end();
}).listen(PORT, () => console.log('mock on', PORT));
