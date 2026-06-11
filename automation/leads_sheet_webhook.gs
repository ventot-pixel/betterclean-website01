// BetterClean leads -> Google Sheet webhook (Google Apps Script)
//
// Deploy (one time, ~3 minutes, done from Ven's Google account):
// 1. Create/open the Google Sheet that should collect leads.
// 2. Extensions > Apps Script, delete the default code, paste this file.
// 3. Change SECRET below to a long random string.
// 4. Deploy > New deployment > type "Web app":
//      - Execute as: Me
//      - Who has access: Anyone
// 5. Copy the web app URL. In Vercel (betterclean.fi project) set:
//      SHEETS_WEBHOOK_URL    = <the web app URL>
//      SHEETS_WEBHOOK_SECRET = <the same SECRET string>
//
// The site backend (api/lead.js) POSTs every form submission here.

const SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';
const SHEET_NAME = 'Leads';

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid JSON' });
  }

  if (!SECRET || SECRET.indexOf('CHANGE_ME') === 0 || data.secret !== SECRET) {
    return jsonResponse({ ok: false, error: 'Unauthorized' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Received', 'Source', 'Name', 'Email', 'Phone', 'Subject', 'Details']);
    sheet.setFrozenRows(1);
  }

  const c = data.customer || {};
  const name = c.name || [c.firstName, c.lastName].filter(Boolean).join(' ');

  sheet.appendRow([
    data.receivedAt || new Date().toISOString(),
    data.source || '',
    name || '',
    c.email || '',
    c.phone || '',
    data.subject || '',
    data.body || ''
  ]);

  return jsonResponse({ ok: true });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
