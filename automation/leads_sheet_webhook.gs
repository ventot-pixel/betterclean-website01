// BetterClean leads -> Google Sheet webhook + lightweight CRM API (Google Apps Script)
//
// Deploy/update from Ven's Google account:
// 1. Open the Google Sheet that collects BetterClean leads.
// 2. Extensions > Apps Script, paste this file.
// 3. Project Settings > Script Properties: add SHEETS_WEBHOOK_SECRET with a
//    long random value. Never paste the secret into this source file.
// 4. Deploy > Manage deployments > edit the existing web app deployment,
//    or deploy a new web app:
//      - Execute as: Me
//      - Who has access: Anyone
// 5. In Vercel set:
//      SHEETS_WEBHOOK_URL    = <the web app URL>
//      SHEETS_WEBHOOK_SECRET = <the same value from Script Properties>
//
// api/lead.js appends website leads here. Command Center can also list/create/update
// CRM rows through the same endpoint.

const WEBHOOK_SECRET_PROPERTY = 'SHEETS_WEBHOOK_SECRET';
const SHEET_NAME = 'Leads';
const HEADERS = [
  'Lead ID',
  'Received',
  'Updated',
  'Business',
  'Source',
  'Source Platform',
  'Source Page',
  'Name',
  'Email',
  'Phone',
  'Address',
  'City',
  'Language',
  'Subject',
  'Service',
  'Property Size',
  'Preferred Date',
  'Preferred Time',
  'Estimated Price',
  'Contact Preference',
  'Details',
  'Score',
  'Priority',
  'Status',
  'Next Follow-up',
  'Owner',
  'CRM Notes'
];

function doGet(e) {
  const data = e && e.parameter ? e.parameter : {};
  const auth = authorize(data);
  if (!auth.ok) return jsonResponse(auth);

  const sheet = getLeadSheet();
  const headers = ensureHeaders(sheet);
  return jsonResponse({ ok: true, leads: listLeads(sheet, headers) });
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid JSON' });
  }

  const auth = authorize(data);
  if (!auth.ok) return jsonResponse(auth);

  const sheet = getLeadSheet();
  const headers = ensureHeaders(sheet);
  const action = String(data.action || '').trim();

  if (action === 'listLeads') {
    return jsonResponse({ ok: true, leads: listLeads(sheet, headers) });
  }

  if (action === 'updateLead') {
    return updateLead(sheet, headers, data);
  }

  const lead = appendLead(sheet, headers, data);
  return jsonResponse({ ok: true, lead: lead });
}

function authorize(data) {
  const secret = getWebhookSecret();
  if (!secret || secret.indexOf('CHANGE_ME') === 0 || data.secret !== secret) {
    return { ok: false, error: 'Unauthorized' };
  }
  return { ok: true };
}

function getLeadSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function appendLead(sheet, headers, data) {
  const row = buildLeadRow(data);
  sheet.appendRow(headers.map(function(header) {
    return row[header] || '';
  }));

  const rowNumber = sheet.getLastRow();
  return getRowObject(sheet, headers, rowNumber);
}

function buildLeadRow(data) {
  const lead = data.lead || {};
  const c = data.customer || {};
  const booking = data.booking || {};
  const inquiry = data.inquiry || {};
  const now = new Date().toISOString();
  const name =
    lead.fullName ||
    lead.contactName ||
    c.name ||
    [c.firstName, c.lastName].filter(Boolean).join(' ') ||
    data.name ||
    '';

  return {
    'Lead ID': lead.leadId || data.leadId || Utilities.getUuid(),
    'Received': data.receivedAt || lead.createdAt || now,
    'Updated': now,
    'Business': lead.business || data.business || 'BetterClean',
    'Source': lead.sourceChannel || data.source || 'website',
    'Source Platform': lead.sourcePlatform || data.sourcePlatform || 'website',
    'Source Page': lead.sourcePage || data.sourcePage || data.page || data.url || '',
    'Name': name,
    'Email': lead.email || c.email || data.email || data._replyto || '',
    'Phone': lead.phone || c.phone || data.phone || '',
    'Address': lead.address || booking.address || inquiry.address || data.address || '',
    'City': lead.city || booking.city || inquiry.area || data.city || '',
    'Language': lead.language || data.language || data.lang || 'fi',
    'Subject': data.subject || '',
    'Service': lead.serviceType || booking.service || inquiry.service || data.service || '',
    'Property Size': lead.propertySize || booking.size || inquiry.size || data.size || '',
    'Preferred Date': lead.preferredDate || booking.date || data.date || '',
    'Preferred Time': lead.preferredTime || booking.time || data.time || '',
    'Estimated Price': lead.estimatedPrice || booking.estimatedPrice || data.estimatedPrice || '',
    'Contact Preference': lead.contactPreference || inquiry.method || data.contactPreference || '',
    'Details': lead.notes || data.body || booking.notes || inquiry.need || inquiry.message || data.message || '',
    'Score': lead.score || '',
    'Priority': lead.priority || 'COLD',
    'Status': lead.status || 'NEW',
    'Next Follow-up': lead.nextFollowUpDate || data.nextFollowUpDate || '',
    'Owner': lead.assignedTo || data.assignedTo || '',
    'CRM Notes': lead.crmNotes || data.crmNotes || ''
  };
}

function updateLead(sheet, headers, data) {
  const rowNumber = findLeadRow(sheet, headers, data.leadId || data.rowNumber);
  if (!rowNumber) {
    return jsonResponse({ ok: false, error: 'Lead not found' });
  }

  const patch = data.patch || {};
  const updates = {
    'Updated': new Date().toISOString(),
    'Status': patch.status,
    'Priority': patch.priority,
    'Next Follow-up': patch.nextFollowUpDate,
    'Owner': patch.assignedTo,
    'CRM Notes': patch.crmNotes
  };

  Object.keys(updates).forEach(function(header) {
    if (updates[header] === undefined || updates[header] === null) return;
    const column = headers.indexOf(header) + 1;
    if (column > 0) {
      sheet.getRange(rowNumber, column).setValue(updates[header]);
    }
  });

  return jsonResponse({ ok: true, lead: getRowObject(sheet, headers, rowNumber) });
}

function findLeadRow(sheet, headers, leadIdOrRowNumber) {
  const id = String(leadIdOrRowNumber || '').trim();
  if (!id) return null;

  const rowMatch = id.match(/^sheet-row-(\d+)$/);
  if (rowMatch) {
    const row = parseInt(rowMatch[1], 10);
    return row > 1 && row <= sheet.getLastRow() ? row : null;
  }

  const numericRow = parseInt(id, 10);
  if (!isNaN(numericRow) && numericRow > 1 && numericRow <= sheet.getLastRow()) {
    return numericRow;
  }

  const idColumn = headers.indexOf('Lead ID') + 1;
  if (idColumn < 1 || sheet.getLastRow() < 2) return null;

  const values = sheet.getRange(2, idColumn, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i += 1) {
    if (String(values[i][0] || '').trim() === id) {
      return i + 2;
    }
  }
  return null;
}

function listLeads(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function(row, index) {
    return rowToObject(headers, row, index + 2);
  }).reverse();
}

function getRowObject(sheet, headers, rowNumber) {
  const values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  return rowToObject(headers, values, rowNumber);
}

function rowToObject(headers, row, rowNumber) {
  const obj = { 'Row Number': rowNumber };
  headers.forEach(function(header, index) {
    const value = row[index];
    obj[header] = value instanceof Date ? value.toISOString() : String(value || '');
  });
  return obj;
}

function ensureHeaders(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  let current = [];
  if (sheet.getLastRow() > 0) {
    current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
      .map(function(value) { return String(value || '').trim(); })
      .filter(Boolean);
  }

  if (current.length === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return HEADERS;
  }

  HEADERS.forEach(function(header) {
    if (current.indexOf(header) === -1) {
      current.push(header);
      sheet.getRange(1, current.length).setValue(header);
    }
  });

  sheet.setFrozenRows(1);
  return current;
}

function getWebhookSecret() {
  return String(
    PropertiesService.getScriptProperties().getProperty(WEBHOOK_SECRET_PROPERTY) || ''
  ).trim();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
