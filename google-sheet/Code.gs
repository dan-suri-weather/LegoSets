// Lego Tracker shared marks.
// Paste this into the Google Sheet's Extensions > Apps Script, set FAMILY_CODE, then Deploy as a web app
// (see SETUP-SHARING.txt). The app sends every request as a POST with the family code in the body.
const FAMILY_CODE = 'change-me';

const HEAD = ['Set number', 'Name', 'Year', 'Theme', 'Sarah has', 'Dan has', 'Rufus has', 'Sarah wants', 'Dan wants'];
const KEYS = ['sh', 'dh', 'rh', 'sw', 'dw'];

function sheet_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold');
  }
  return sh;
}

// Returns {setNumber: {info: [name, year, theme], marks: {sh: 1, ...}}}. Any text in a mark column counts as ticked.
function readAll_(sh) {
  const rows = {};
  const n = sh.getLastRow() - 1;
  if (n < 1) return rows;
  for (const r of sh.getRange(2, 1, n, HEAD.length).getDisplayValues()) {
    const id = String(r[0]).trim();
    if (!id) continue;
    const marks = {};
    KEYS.forEach((k, i) => { if (String(r[4 + i]).trim()) marks[k] = 1; });
    rows[id] = { info: r.slice(1, 4), marks };
  }
  return rows;
}

// Rewrites the sheet with every set that has at least one mark, in set-number order.
function writeAll_(sh, rows) {
  const ids = Object.keys(rows).filter(id => Object.keys(rows[id].marks).length).sort();
  const data = ids.map(id => [id, ...rows[id].info, ...KEYS.map(k => rows[id].marks[k] ? 'Y' : '')]);
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, HEAD.length).clearContent();
  sh.getRange('A:A').setNumberFormat('@');   // keeps "10-1" as text, not a date
  if (data.length) sh.getRange(2, 1, data.length, HEAD.length).setValues(data);
}

function marksOf_(rows) {
  const out = {};
  for (const id in rows) if (Object.keys(rows[id].marks).length) out[id] = rows[id].marks;
  return out;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Request: {code, changes: [{id, k, v, info}], replace}. With no changes it just returns the marks.
// replace: true clears every mark first (used by "Restore from .csv").
function doPost(e) {
  const req = JSON.parse(e.postData.contents);
  if (req.code !== FAMILY_CODE) return reply_({ error: 'wrong family code' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_();
    const rows = req.replace ? {} : readAll_(sh);
    const changes = req.changes || [];
    for (const c of changes) {
      const r = rows[c.id] || (rows[c.id] = { info: ['', '', ''], marks: {} });
      if (c.info) r.info = c.info;
      if (c.v) r.marks[c.k] = 1; else delete r.marks[c.k];
    }
    if (changes.length || req.replace) writeAll_(sh, rows);
    return reply_({ marks: marksOf_(rows) });
  } finally {
    lock.releaseLock();
  }
}
