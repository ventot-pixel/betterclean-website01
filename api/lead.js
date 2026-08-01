const { randomUUID } = require('node:crypto');

const MAX_BODY_BYTES = 64 * 1024;
const MAX_FIELD_LENGTH = 5000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitBuckets = new Map();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;
    let settled = false;
    req.on('data', (chunk) => {
      if (settled) return;
      bytes += Buffer.byteLength(chunk);
      if (bytes > MAX_BODY_BYTES) {
        settled = true;
        const error = new Error('Payload too large');
        error.code = 'PAYLOAD_TOO_LARGE';
        reject(error);
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (!settled) resolve(body);
    });
    req.on('error', reject);
  });
}

function getRequestIp(req) {
  const headers = req.headers || {};
  const forwarded = headers['x-forwarded-for'];
  const candidate = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0];
  return candidate.trim() || (req.socket && req.socket.remoteAddress) || '';
}

function checkRateLimit(req, now = Date.now()) {
  const ip = getRequestIp(req);
  if (!ip) return { allowed: true };

  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }
  if (rateLimitBuckets.size >= 5000) {
    rateLimitBuckets.delete(rateLimitBuckets.keys().next().value);
  }

  const existing = rateLimitBuckets.get(ip);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  bucket.count += 1;
  rateLimitBuckets.set(ip, bucket);

  return {
    allowed: bucket.count <= RATE_LIMIT_MAX_REQUESTS,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  };
}

function isValidEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  if (!value) return true;
  return /^[+()\d\s.-]+$/.test(value) && value.replace(/\D/g, '').length >= 6;
}

function findOversizedField(value, seen = new Set()) {
  if (typeof value === 'string') return value.length > MAX_FIELD_LENGTH;
  if (!value || typeof value !== 'object' || seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some((entry) => findOversizedField(entry, seen));
}

function validateLeadPayload(payload) {
  const fields = [];
  const customer = getCustomer(payload);
  const booking = payload.booking && typeof payload.booking === 'object' ? payload.booking : null;
  const inquiry = payload.inquiry && typeof payload.inquiry === 'object' ? payload.inquiry : null;

  if (String(payload.website || '').trim()) fields.push('website');
  if (!customer.email && !customer.phone) fields.push('contact');
  if (!isValidEmail(customer.email)) fields.push('email');
  if (!isValidPhone(customer.phone)) fields.push('phone');
  if (findOversizedField(payload)) fields.push('payload');

  if (booking) {
    if (!String(booking.service || booking.serviceLabel || '').trim()) fields.push('service');
    if (!String(booking.address || '').trim()) fields.push('address');
  }
  if (inquiry && !String(inquiry.service || '').trim()) fields.push('service');

  return [...new Set(fields)];
}

function safeSubject(value, fallback) {
  return String(value || fallback).replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
}

function formatPayload(payload, context) {
  const details = payload.body || formatFallbackBody(payload);
  const lines = [
    payload.subject || 'BetterClean lead',
    '',
    details,
    '',
    'Source: ' + (payload.source || 'website'),
    'Reference: ' + context.intakeId,
    'Received: ' + context.receivedAt,
    formatCrmStatus(context.crm)
  ];
  return lines.join('\n');
}

function getCrmConfig() {
  return {
    url: process.env.CRM_WEBHOOK_URL || process.env.CRM_INGEST_URL || '',
    secret: process.env.CRM_WEBHOOK_SECRET || process.env.CRM_INGEST_SECRET || '',
    boardUrl: process.env.BETTERCLEAN_CRM_BOARD_URL ||
      'https://cc.betterclean.fi/workspaces/betterclean/crm'
  };
}

function crmIsConfigured(config) {
  return Boolean(config.url && config.secret);
}

function inferSourcePage(payload) {
  if (payload.sourcePage || payload.page || payload.url) {
    return payload.sourcePage || payload.page || payload.url;
  }
  if (payload.source === 'homepage-booking') return '/';
  if (String(payload.source || '').startsWith('request-quote-')) {
    return '/request-quote.html';
  }
  return undefined;
}

function helsinkiDate(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function buildCrmPayload(payload, context) {
  return {
    ...payload,
    customer: getCrmCustomer(payload),
    business: 'BetterClean',
    source: payload.source || 'BetterClean website',
    sourceChannel: payload.source || 'BetterClean website',
    sourcePlatform: 'website',
    sourcePage: inferSourcePage(payload),
    assignedTo: process.env.BETTERCLEAN_LEAD_OWNER || 'Ven',
    nextFollowUpDate: helsinkiDate(new Date(context.receivedAt)),
    intakeId: context.intakeId,
    receivedAt: context.receivedAt
  };
}

function crmTimeoutMs() {
  const configured = Number(process.env.CRM_WEBHOOK_TIMEOUT_MS || 5000);
  if (!Number.isFinite(configured)) return 5000;
  return Math.min(Math.max(configured, 1000), 15000);
}

async function sendCrm(payload, context) {
  const config = getCrmConfig();
  if (!crmIsConfigured(config)) {
    return { ok: false, configured: false, boardUrl: config.boardUrl };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), crmTimeoutMs());

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-crm-webhook-secret': config.secret
      },
      body: JSON.stringify(buildCrmPayload(payload, context)),
      signal: controller.signal
    });
    const parsed = await response.json().catch(() => ({}));
    const result = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};

    return {
      ok: response.ok && result.ok !== false,
      configured: true,
      status: response.status,
      leadId: typeof result.leadId === 'string' ? result.leadId : '',
      boardUrl: config.boardUrl
    };
  } finally {
    clearTimeout(timer);
  }
}

function formatCrmStatus(crm) {
  if (crm.ok) {
    const id = crm.leadId ? ' (' + crm.leadId + ')' : '';
    return 'CRM: saved' + id + '\nOpen: ' + crm.boardUrl;
  }
  if (!crm.configured) {
    return 'CRM: NOT CONFIGURED — add this lead manually.\nOpen: ' + crm.boardUrl;
  }
  return 'CRM: SAVE FAILED — add this lead manually.\nOpen: ' + crm.boardUrl;
}

function getCustomer(payload) {
  const customer = payload.customer || {};
  const firstName = customer.firstName || payload.firstName || '';
  const lastName = customer.lastName || payload.lastName || '';
  const name = customer.name || [firstName, lastName].filter(Boolean).join(' ') || payload.name || '';

  return {
    firstName,
    lastName,
    name,
    email: customer.email || payload.email || payload._replyto || '',
    phone: customer.phone || payload.phone || ''
  };
}

function getCrmCustomer(payload) {
  const original = payload.customer && typeof payload.customer === 'object' ? payload.customer : {};
  const customer = getCustomer(payload);
  return {
    ...original,
    firstName: customer.firstName,
    lastName: customer.lastName,
    name: customer.name || customer.email || customer.phone || 'Website inquiry',
    email: customer.email,
    phone: customer.phone
  };
}

function formatFallbackBody(payload) {
  const customer = getCustomer(payload);
  const booking = payload.booking || payload;
  const inquiry = payload.inquiry || {};
  const lines = [];

  function add(label, value) {
    if (value !== undefined && value !== null && String(value).trim()) {
      lines.push(label + ': ' + value);
    }
  }

  add('Name', customer.name);
  add('Email', customer.email);
  add('Phone', customer.phone);
  add('Service', booking.service || inquiry.service);
  add('Size', booking.size || inquiry.size);
  add('Date', booking.date);
  add('Time', booking.time);
  add('Address', booking.address);
  add('Area', inquiry.area);
  add('Preferred contact', inquiry.method);
  add('Urgency', inquiry.urgency);
  add('Estimated price', booking.estimatedPrice);
  add('Notes', booking.notes || inquiry.need || inquiry.message || payload.message);

  return lines.length ? lines.join('\n') : 'No lead details provided.';
}

async function sendResend(payload, text) {
  if (!process.env.RESEND_API_KEY) return false;
  const to = getLeadRecipients();
  const from = process.env.BETTERCLEAN_LEAD_FROM || 'BetterClean Website <onboarding@resend.dev>';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: safeSubject(payload.subject, 'BetterClean website lead'),
      text
    })
  });
  return response.ok;
}

function getLeadRecipients() {
  const recipients = (process.env.BETTERCLEAN_LEAD_EMAIL || 'info@betterclean.fi')
    .split(/[;,]/)
    .map((email) => email.trim())
    .filter(Boolean);
  return recipients.length ? recipients : ['info@betterclean.fi'];
}

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function getBookingExtras(booking) {
  if (Array.isArray(booking.extrasLabels) && booking.extrasLabels.length) {
    return booking.extrasLabels.filter(hasText);
  }
  return Array.isArray(booking.extras) ? booking.extras.filter(hasText) : [];
}

function formatCustomerDetailLines(payload, lang) {
  const booking = payload.booking && typeof payload.booking === 'object' ? payload.booking : null;
  const inquiry = payload.inquiry && typeof payload.inquiry === 'object' ? payload.inquiry : null;
  const lines = [];

  function add(label, value) {
    if (hasText(value)) lines.push(label + ': ' + value);
  }

  if (booking) {
    const extras = getBookingExtras(booking);
    add(lang === 'fi' ? 'Kodin koko' : 'Apartment size', booking.sizeLabel || booking.size);
    add(lang === 'fi' ? 'Siivouksen kesto' : 'Cleaning duration', booking.durationLabel || (hasText(booking.duration) ? booking.duration + 'h' : ''));
    add(lang === 'fi' ? 'Toistuvuus' : 'Frequency', booking.frequencyLabel || booking.frequency);
    add(lang === 'fi' ? 'Lisäpalvelut' : 'Additional services', extras.join(', '));
    add(lang === 'fi' ? 'Arvioitu yhteensä' : 'Estimated total', booking.estimatedTotal || booking.estimatedPrice);
    add(lang === 'fi' ? 'Osoite' : 'Address', booking.address);
    add(lang === 'fi' ? 'Postinumero' : 'Postcode', booking.postcode);
    add(lang === 'fi' ? 'Toivottu päivä' : 'Preferred day', booking.preferredDay);
    add(lang === 'fi' ? 'Toivottu aika' : 'Preferred time', booking.slot || booking.time || booking.date);
    return lines;
  }

  if (inquiry) {
    add(lang === 'fi' ? 'Kiinnostuksen kohde' : 'Interested service', inquiry.service);
    add(lang === 'fi' ? 'Alue tai postinumero' : 'Area or postcode', inquiry.area);
    add(lang === 'fi' ? 'Kodin koko' : 'Home size', inquiry.size);
    add(lang === 'fi' ? 'Toivottu yhteydenotto' : 'Preferred contact method', inquiry.method);
    add(lang === 'fi' ? 'Tarve / viesti' : 'Need / message', inquiry.need || inquiry.message);
  }

  return lines;
}

function formatCustomerReply(payload) {
  const customer = getCustomer(payload);
  const lang = payload.language || payload.lang || 'fi';
  const firstName = customer.firstName || (customer.name || '').split(' ')[0] || '';
  const helloFi = firstName ? 'Hei ' + firstName + ',' : 'Hei,';
  const helloEn = firstName ? 'Hi ' + firstName + ',' : 'Hi,';
  const detailLines = formatCustomerDetailLines(payload, lang);
  const detailBlock = detailLines.length
    ? [
        '',
        lang === 'fi' ? 'Saimme nämä tiedot:' : 'We received these details:',
        ...detailLines.map((line) => '- ' + line),
        '',
        lang === 'fi'
          ? 'Jos jokin tieto on väärin, vastaa tähän sähköpostiin, niin korjaamme sen.'
          : 'If anything looks incorrect, reply to this email and we will correct it.'
      ]
    : [];

  if (lang === 'en') {
    return {
      subject: 'We received your request - BetterClean',
      text: [
        helloEn,
        '',
        'Thanks for contacting BetterClean. We received your request and will review the details as soon as possible.',
        ...detailBlock,
        '',
        'You pay after the cleaning is complete. There are no separate equipment, supply or visit fees, and travel is free within 20 km of Tampere centre.',
        'Cleaning work may qualify for the household deduction. Eligibility and deductible conditions apply; check the current rules at vero.fi.',
        '',
        'If anything is urgent, you can also contact us directly at info@betterclean.fi.',
        '',
        'Best regards,',
        'Joven / BetterClean'
      ].join('\n')
    };
  }

  return {
    subject: 'Saimme pyyntösi - BetterClean',
    text: [
      helloFi,
      '',
      'Kiitos yhteydenotosta. Saimme pyyntösi ja tarkistamme tiedot mahdollisimman pian.',
      ...detailBlock,
      '',
      'Maksat siivouksen jälkeen. Emme veloita erillisiä väline-, tarvike- tai käyntimaksuja, ja matkat ovat maksuttomia 20 km säteellä Tampereen keskustasta.',
      'Siivoustyö voi oikeuttaa kotitalousvähennykseen. Vähennysoikeuteen ja omavastuuseen liittyy ehtoja; tarkista ajantasaiset tiedot osoitteesta vero.fi.',
      '',
      'Jos asialla on kiire, voit olla meihin suoraan yhteydessä osoitteessa info@betterclean.fi.',
      '',
      'Ystävällisin terveisin,',
      'Joven / BetterClean'
    ].join('\n')
  };
}

async function sendCustomerAutoReply(payload) {
  if (!process.env.RESEND_API_KEY) return false;
  const customer = getCustomer(payload);
  if (!customer.email || !customer.email.includes('@')) return false;

  const from = process.env.BETTERCLEAN_REPLY_FROM ||
    process.env.BETTERCLEAN_LEAD_FROM ||
    'BetterClean <onboarding@resend.dev>';
  const reply = formatCustomerReply(payload);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: customer.email,
      subject: reply.subject,
      text: reply.text
    })
  });
  return response.ok;
}

async function sendWhatsApp(text) {
  if (!process.env.CALLMEBOT_PHONE || !process.env.CALLMEBOT_APIKEY) return false;
  const url = 'https://api.callmebot.com/whatsapp.php' +
    '?phone=' + encodeURIComponent(process.env.CALLMEBOT_PHONE) +
    '&apikey=' + encodeURIComponent(process.env.CALLMEBOT_APIKEY) +
    '&text=' + encodeURIComponent(text.slice(0, 1500));
  const response = await fetch(url);
  return response.ok;
}

async function sendSheet(payload, context) {
  if (!process.env.SHEETS_WEBHOOK_URL) return false;
  const response = await fetch(process.env.SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.SHEETS_WEBHOOK_SECRET || '',
      receivedAt: context.receivedAt,
      intakeId: context.intakeId,
      source: payload.source || 'website',
      subject: payload.subject || '',
      customer: payload.customer || {},
      booking: payload.booking || null,
      inquiry: payload.inquiry || null,
      body: payload.body || ''
    })
  });
  return response.ok;
}

async function sendTelegram(payload, text) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return false;
  const url = 'https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/sendMessage';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: text.slice(0, 3900),
      disable_web_page_preview: true
    })
  });
  return response.ok;
}

async function attemptDelivery(fn) {
  try {
    return await fn();
  } catch {
    return false;
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfter));
    return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  }

  let payload;
  try {
    payload = req.body && typeof req.body === 'object' ? req.body : JSON.parse(await readBody(req));
    if (Buffer.byteLength(JSON.stringify(payload)) > MAX_BODY_BYTES) {
      return res.status(413).json({ ok: false, error: 'Payload too large' });
    }
  } catch (error) {
    const status = error && error.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
    return res.status(status).json({ ok: false, error: status === 413 ? 'Payload too large' : 'Invalid JSON' });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ ok: false, error: 'Invalid lead payload' });
  }

  const invalidFields = validateLeadPayload(payload);
  if (invalidFields.length) {
    return res.status(400).json({
      ok: false,
      error: 'Please check the required contact and service details.',
      fields: invalidFields
    });
  }

  const context = {
    intakeId: randomUUID(),
    receivedAt: new Date().toISOString()
  };
  let crm = {
    ok: false,
    configured: crmIsConfigured(getCrmConfig()),
    boardUrl: getCrmConfig().boardUrl
  };

  try {
    crm = await sendCrm(payload, context).catch(() => ({
      ok: false,
      configured: crmIsConfigured(getCrmConfig()),
      boardUrl: getCrmConfig().boardUrl
    }));
    const text = formatPayload(payload, { ...context, crm });
    const [emailDelivered, telegramDelivered, whatsappDelivered] = await Promise.all([
      attemptDelivery(() => sendResend(payload, text)),
      attemptDelivery(() => sendTelegram(payload, text)),
      attemptDelivery(() => sendWhatsApp(text))
    ]);
    const delivered = crm.ok || emailDelivered || telegramDelivered || whatsappDelivered;
    const followOnTasks = [
      // Sheet logging is storage, not delivery — a sheet failure must not block the lead.
      sendSheet(payload, context).catch(() => false)
    ];
    // Confirm receipt only after the CRM or an owner-alert path accepted the inquiry.
    if (delivered) followOnTasks.push(sendCustomerAutoReply(payload).catch(() => false));
    await Promise.all(followOnTasks);

    if (!delivered) {
      return res.status(503).json({
        ok: false,
        reference: context.intakeId,
        crm: crm.configured ? 'failed' : 'not_configured',
        error: 'Lead endpoint is not configured or all primary delivery paths failed.'
      });
    }
  } catch (error) {
    return res.status(502).json({ ok: false, error: 'Lead delivery failed' });
  }

  return res.status(200).json({
    ok: true,
    reference: context.intakeId,
    crm: crm.ok ? 'saved' : crm.configured ? 'failed' : 'not_configured'
  });
}

module.exports = handler;
module.exports.formatCustomerReply = formatCustomerReply;
module.exports.getLeadRecipients = getLeadRecipients;
module.exports.validateLeadPayload = validateLeadPayload;
module.exports.checkRateLimit = checkRateLimit;
