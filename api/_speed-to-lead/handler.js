// GENERATED from Open Brain Operations/speed-to-lead — do not edit here; edit there and run sync-betterclean.js.
// Speed-to-Lead core. Generalized from the live BetterClean api/lead.js:
// validate → CRM → owner alerts (email/Telegram/WhatsApp) → sheet log → customer auto-reply.
// The customer is only told "we got it" after at least one owner path accepted the lead.
const { randomUUID } = require('node:crypto');

const MAX_BODY_BYTES = 64 * 1024;
const MAX_FIELD_LENGTH = 5000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const REPLY_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const REPLY_LIMIT_PER_RECIPIENT = 3;
// ponytail: in-memory per-instance limits, same as the live site. Origin is not authentication, so a
// determined script can still post; the auto-reply only echoes short, link-free text and each address
// gets at most 3 replies a day per instance. Add Turnstile + a shared store (Upstash) if abuse shows up.
const rateLimitBuckets = new Map();

const TEXT = {
  fi: {
    detailsHeading: 'Saimme nämä tiedot:',
    correction: 'Jos jokin tieto on väärin, vastaa tähän sähköpostiin, niin korjaamme sen.',
    success: 'Kiitos! Saimme viestisi ja vastaamme pian.',
    error: 'Lähetys epäonnistui. Tarkista tiedot ja yritä uudelleen.'
  },
  en: {
    detailsHeading: 'We received these details:',
    correction: 'If anything looks incorrect, reply to this email and we will correct it.',
    success: 'Thanks! We received your message and will reply shortly.',
    error: 'Sending failed. Please check your details and try again.'
  }
};

const BOOKING_LABELS = [
  ['sizeLabel', 'size', 'Kodin koko', 'Apartment size'],
  ['durationLabel', 'duration', 'Siivouksen kesto', 'Cleaning duration'],
  ['frequencyLabel', 'frequency', 'Toistuvuus', 'Frequency'],
  ['extras', null, 'Lisäpalvelut', 'Additional services'],
  ['estimatedTotal', 'estimatedPrice', 'Arvioitu yhteensä', 'Estimated total'],
  ['address', null, 'Osoite', 'Address'],
  ['postcode', null, 'Postinumero', 'Postcode'],
  ['preferredDay', null, 'Toivottu päivä', 'Preferred day'],
  ['slot', 'time', 'Toivottu aika', 'Preferred time']
];

const INQUIRY_LABELS = {
  service: ['Kiinnostuksen kohde', 'Interested service'],
  area: ['Alue tai postinumero', 'Area or postcode'],
  size: ['Kodin koko', 'Home size'],
  method: ['Toivottu yhteydenotto', 'Preferred contact method'],
  need: ['Tarve / viesti', 'Need / message'],
  message: ['Tarve / viesti', 'Need / message']
};

// Secrets live in env vars, prefixed per client: STL_<CLIENTID>_<NAME>.
// Only agency-owned credentials (Resend key, Telegram bot token) fall back to an unprefixed
// global; anything that routes a lead (chat id, CRM, sheet, WhatsApp) must be per-client,
// so a missing var can never send one client's lead to another client.
const SHARED_SECRETS = new Set(['RESEND_API_KEY', 'TELEGRAM_BOT_TOKEN']);

// A client may also list legacy names it already uses on its own deployment (client.envAliases),
// so a site can run this engine without renaming its existing Vercel variables.
function clientEnv(client, name) {
  const own = process.env['STL_' + client.id.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_' + name];
  if (own) return own;
  for (const alias of (client.envAliases && client.envAliases[name]) || []) {
    if (process.env[alias]) return process.env[alias];
  }
  return SHARED_SECRETS.has(name) ? process.env[name] || '' : '';
}

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function str(value) {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
}

// What the auto-reply may echo back to the address the form claims: one line, no links, short.
// Keeps the client's sending domain from carrying an attacker's message to a third party.
const LINK_PATTERN = /(https?:\/\/|www\.)\S*|\b[\p{L}0-9-]+(\.[\p{L}0-9-]+)*\.[a-z]{2,}\b(\/\S*)?/giu;

function echo(value, max = 100) {
  const text = (Array.isArray(value) ? value.map(str).join(', ') : str(value))
    .replace(/[\r\n\t]+/g, ' ')
    .replace(LINK_PATTERN, '[link removed]')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function safeFirstName(value) {
  const name = str(value).trim();
  return /^[\p{L}][\p{L}' -]{0,39}$/u.test(name) ? name : '';
}

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

// Works with Vercel's res.status().json() helpers and with a plain Node response (dev.js).
function send(res, status, body, headers = {}) {
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  if (typeof res.status === 'function' && typeof res.json === 'function') return res.status(status).json(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function getRequestIp(req) {
  // Vercel sets x-real-ip itself; a client cannot spoof it the way it can prepend to x-forwarded-for.
  const real = (req.headers || {})['x-real-ip'];
  if (real) return String(real).trim();
  const forwarded = (req.headers || {})['x-forwarded-for'];
  const candidate = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0];
  return candidate.trim() || (req.socket && req.socket.remoteAddress) || '';
}

function checkRateLimit(key, now = Date.now()) {
  for (const [bucketKey, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(bucketKey);
  }
  if (rateLimitBuckets.size >= 5000) rateLimitBuckets.delete(rateLimitBuckets.keys().next().value);

  const existing = rateLimitBuckets.get(key);
  const bucket = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);
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

function getCustomer(payload) {
  const customer = payload.customer && typeof payload.customer === 'object' ? payload.customer : {};
  const firstName = str(customer.firstName) || str(payload.firstName);
  const lastName = str(customer.lastName) || str(payload.lastName);
  const name = str(customer.name) || [firstName, lastName].filter(Boolean).join(' ') || str(payload.name);
  return {
    firstName,
    lastName,
    name,
    email: str(customer.email) || str(payload.email) || str(payload._replyto),
    phone: str(customer.phone) || str(payload.phone)
  };
}

function validateLeadPayload(payload, client) {
  const fields = [];
  const customer = getCustomer(payload);
  const booking = payload.booking && typeof payload.booking === 'object' ? payload.booking : null;
  const inquiry = payload.inquiry && typeof payload.inquiry === 'object' ? payload.inquiry : null;

  if (hasText(payload.website)) fields.push('website');
  if (!customer.email && !customer.phone) fields.push('contact');
  if (!isValidEmail(customer.email)) fields.push('email');
  if (!isValidPhone(customer.phone)) fields.push('phone');
  if (findOversizedField(payload)) fields.push('payload');

  if (booking) {
    if (!hasText(booking.service || booking.serviceLabel)) fields.push('service');
    if (!hasText(booking.address)) fields.push('address');
  }
  if (client.requireService && inquiry && !hasText(inquiry.service)) fields.push('service');

  return [...new Set(fields)];
}

function safeSubject(value, fallback) {
  return String(value || fallback).replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
}

function formatFallbackBody(payload) {
  const customer = getCustomer(payload);
  const booking = payload.booking || payload;
  const inquiry = payload.inquiry || {};
  const lines = [];
  const add = (label, value) => { if (hasText(value)) lines.push(label + ': ' + value); };

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
  for (const [key, value] of Object.entries(inquiry)) {
    if (!INQUIRY_LABELS[key] && key !== 'urgency') add(key, value);
  }
  return lines.length ? lines.join('\n') : 'No lead details provided.';
}

// System lines come first and form-supplied text is fenced below them, so a crafted message
// cannot fake "CRM: saved" or a reference above the real ones.
function formatOwnerText(payload, context, client) {
  return [
    safeSubject(payload.subject, client.name + ' lead'),
    'Source: ' + safeSubject(payload.source, 'website'),
    'Reference: ' + context.intakeId,
    'Received: ' + context.receivedAt,
    formatCrmStatus(context.crm),
    '',
    '--- From the website form ---',
    str(payload.body) || formatFallbackBody(payload)
  ].join('\n');
}

function formatCrmStatus(crm) {
  if (!crm.boardUrl && !crm.configured) return 'CRM: not used';
  if (crm.ok) return 'CRM: saved' + (crm.leadId ? ' (' + crm.leadId + ')' : '') + '\nOpen: ' + crm.boardUrl;
  if (!crm.configured) return 'CRM: NOT CONFIGURED — add this lead manually.\nOpen: ' + crm.boardUrl;
  return 'CRM: SAVE FAILED — add this lead manually.\nOpen: ' + crm.boardUrl;
}

function zonedDate(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function inferSourcePage(payload) {
  if (payload.sourcePage || payload.page || payload.url) return payload.sourcePage || payload.page || payload.url;
  if (payload.source === 'homepage-booking') return '/';
  if (String(payload.source || '').startsWith('request-quote-')) return '/request-quote.html';
  return undefined;
}

function buildCrmPayload(payload, context, client) {
  const original = payload.customer && typeof payload.customer === 'object' ? payload.customer : {};
  const customer = getCustomer(payload);
  const crm = client.crm || {};
  return {
    ...payload,
    customer: {
      ...original,
      firstName: customer.firstName,
      lastName: customer.lastName,
      name: customer.name || customer.email || customer.phone || 'Website inquiry',
      email: customer.email,
      phone: customer.phone
    },
    business: crm.business || client.name,
    source: payload.source || client.name + ' website',
    sourceChannel: payload.source || client.name + ' website',
    sourcePlatform: 'website',
    sourcePage: inferSourcePage(payload),
    assignedTo: clientEnv(client, 'CRM_OWNER') || crm.owner || client.name,
    nextFollowUpDate: zonedDate(new Date(context.receivedAt), client.timeZone || 'Europe/Helsinki'),
    intakeId: context.intakeId,
    receivedAt: context.receivedAt
  };
}

function crmBoardUrl(client) {
  return clientEnv(client, 'CRM_BOARD_URL') || (client.crm && client.crm.boardUrl) || '';
}

function crmTimeoutMs() {
  const configured = Number(process.env.CRM_WEBHOOK_TIMEOUT_MS || 5000);
  return Number.isFinite(configured) ? Math.min(Math.max(configured, 1000), 15000) : 5000;
}

async function sendCrm(payload, context, client) {
  const url = clientEnv(client, 'CRM_URL');
  const secret = clientEnv(client, 'CRM_SECRET');
  const boardUrl = crmBoardUrl(client);
  if (!url || !secret) return { ok: false, configured: false, boardUrl };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), crmTimeoutMs());
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-crm-webhook-secret': secret },
      body: JSON.stringify(buildCrmPayload(payload, context, client)),
      signal: controller.signal
    });
    const parsed = await response.json().catch(() => ({}));
    const result = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    return {
      ok: response.ok && result.ok !== false,
      configured: true,
      status: response.status,
      leadId: typeof result.leadId === 'string' ? result.leadId : '',
      boardUrl
    };
  } finally {
    clearTimeout(timer);
  }
}

function splitEmails(value) {
  return String(value || '').split(/[;,]/).map((email) => email.trim()).filter(Boolean);
}

function getLeadRecipients(client) {
  const override = splitEmails(clientEnv(client, 'LEAD_EMAIL'));
  return override.length ? override : splitEmails(client.ownerEmail);
}

async function sendResendEmail(client, body) {
  const key = clientEnv(client, 'RESEND_API_KEY');
  if (!key) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.ok;
}

function sendOwnerEmail(payload, text, client) {
  const to = getLeadRecipients(client);
  if (!to.length) return false;
  return sendResendEmail(client, {
    from: clientEnv(client, 'LEAD_FROM') || client.leadFrom || client.name + ' Website <onboarding@resend.dev>',
    to,
    subject: safeSubject(payload.subject, client.name + ' website lead'),
    text
  });
}

async function sendTelegram(text, client) {
  const token = clientEnv(client, 'TELEGRAM_BOT_TOKEN');
  const chatId = clientEnv(client, 'TELEGRAM_CHAT_ID');
  if (!token || !chatId) return false;
  const response = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3900), disable_web_page_preview: true })
  });
  return response.ok;
}

async function sendWhatsApp(text, client) {
  const phone = clientEnv(client, 'CALLMEBOT_PHONE');
  const apiKey = clientEnv(client, 'CALLMEBOT_APIKEY');
  if (!phone || !apiKey) return false;
  const url = 'https://api.callmebot.com/whatsapp.php' +
    '?phone=' + encodeURIComponent(phone) +
    '&apikey=' + encodeURIComponent(apiKey) +
    '&text=' + encodeURIComponent(text.slice(0, 1500));
  const response = await fetch(url);
  return response.ok;
}

async function sendSheet(payload, context, client) {
  const url = clientEnv(client, 'SHEETS_WEBHOOK_URL');
  if (!url) return false;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: clientEnv(client, 'SHEETS_WEBHOOK_SECRET'),
      business: client.name,
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

function formatCustomerDetailLines(payload, lang) {
  const booking = payload.booking && typeof payload.booking === 'object' ? payload.booking : null;
  const inquiry = payload.inquiry && typeof payload.inquiry === 'object' ? payload.inquiry : null;
  const fi = lang === 'fi';
  const lines = [];
  const add = (label, value, max) => {
    const safe = echo(value, max);
    if (safe) lines.push(label + ': ' + safe);
  };

  if (booking) {
    for (const [key, fallbackKey, fiLabel, enLabel] of BOOKING_LABELS) {
      let value = booking[key];
      if (key === 'extras') {
        const labels = Array.isArray(booking.extrasLabels) && booking.extrasLabels.length ? booking.extrasLabels : booking.extras;
        value = Array.isArray(labels) ? labels.filter(hasText).join(', ') : '';
      } else if (key === 'durationLabel' && !hasText(value) && hasText(booking.duration)) {
        value = booking.duration + 'h';
      } else if (key === 'slot' && !hasText(value)) {
        value = booking.time || booking.date;
      } else if (!hasText(value) && fallbackKey) {
        value = booking[fallbackKey];
      }
      add(fi ? fiLabel : enLabel, value);
    }
    return lines;
  }

  if (inquiry) {
    const label = (key) => INQUIRY_LABELS[key][fi ? 0 : 1];
    add(label('service'), inquiry.service);
    add(label('area'), inquiry.area);
    add(label('size'), inquiry.size);
    add(label('method'), inquiry.method);
    add(label('need'), inquiry.need || inquiry.message, 300);
  }
  return lines;
}

function formatCustomerReply(payload, client) {
  const customer = getCustomer(payload);
  const requested = payload.language || payload.lang || client.defaultLanguage || 'fi';
  const lang = client.reply[requested] ? requested : client.defaultLanguage || Object.keys(client.reply)[0];
  const template = client.reply[lang];
  const text = TEXT[lang] || TEXT.en;
  const firstName = safeFirstName(customer.firstName || (customer.name || '').split(' ')[0]);
  const detailLines = formatCustomerDetailLines(payload, lang);
  const detailBlock = detailLines.length
    ? ['', text.detailsHeading, ...detailLines.map((line) => '- ' + line), '', text.correction]
    : [];

  return {
    subject: template.subject,
    text: [
      template.greeting + (firstName ? ' ' + firstName : '') + ',',
      '',
      template.intro,
      ...detailBlock,
      ...(template.notes && template.notes.length ? ['', ...template.notes] : []),
      ...(template.contact ? ['', template.contact] : []),
      '',
      ...template.signoff
    ].join('\n')
  };
}

const replyCounts = new Map();

// One mailbox, one key: "Anna.Smith+x@gmail.com" and "annasmith@gmail.com" share a limit.
function mailboxKey(email) {
  const [local, domain = ''] = email.trim().toLowerCase().split('@');
  const base = local.split('+')[0];
  const gmail = domain === 'gmail.com' || domain === 'googlemail.com';
  return (gmail ? base.replace(/\./g, '') : base) + '@' + (gmail ? 'gmail.com' : domain);
}

const clientReplyCounts = new Map();
// Plain addresses only, so the limiter key and the actual recipient can never differ.
const STRICT_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

function windowEntry(map, key, now) {
  const entry = map.get(key);
  return entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + REPLY_LIMIT_WINDOW_MS };
}

function allowReply(email, client, now = Date.now()) {
  // Client cap first (bounded map, one key per configured client), so capped traffic adds no keys.
  const clientEntry = windowEntry(clientReplyCounts, client.id, now);
  if (clientEntry.count >= (client.dailyReplyCap || 200)) return false;

  for (const [address, entry] of replyCounts) if (entry.resetAt <= now) replyCounts.delete(address);
  const key = mailboxKey(email);
  if (!replyCounts.has(key) && replyCounts.size >= 5000) return false; // full: fail closed, never evict live counters
  const entry = windowEntry(replyCounts, key, now);
  if (entry.count >= REPLY_LIMIT_PER_RECIPIENT) return false;

  entry.count += 1;
  clientEntry.count += 1;
  replyCounts.set(key, entry);
  clientReplyCounts.set(client.id, clientEntry);
  return true;
}

function sendCustomerAutoReply(payload, client) {
  const customer = getCustomer(payload);
  const to = customer.email.trim();
  if (!client.reply || !STRICT_EMAIL.test(to)) return false;
  if (!clientEnv(client, 'RESEND_API_KEY') || !allowReply(to, client)) return false;
  const reply = formatCustomerReply(payload, client);
  return sendResendEmail(client, {
    from: clientEnv(client, 'REPLY_FROM') || client.replyFrom || clientEnv(client, 'LEAD_FROM') || client.leadFrom || client.name + ' <onboarding@resend.dev>',
    to,
    subject: reply.subject,
    text: reply.text,
    ...(client.replyTo ? { reply_to: client.replyTo } : {})
  });
}

async function attemptDelivery(fn) {
  try {
    return await fn();
  } catch {
    return false;
  }
}

function corsHeaders(req, client) {
  const origin = (req.headers || {}).origin;
  // Browsers always send Origin on a form POST; a missing one means a script, not a visitor.
  if (!origin) return client.allowServerPosts ? {} : null;
  let sameOrigin = false;
  try {
    sameOrigin = new URL(origin).host === (req.headers || {}).host;
  } catch {
    return null;
  }
  if (!sameOrigin && !(client.allowedOrigins || []).includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
}

// options.defaultClient: serve one client without ?client= (a site running the engine itself).
function createLeadHandler(clients, options = {}) {
  const handle = handleLead.bind(null, clients, options.defaultClient || '');
  return async function handler(req, res) {
    try {
      return await handle(req, res);
    } catch {
      if (!res.headersSent) return send(res, 500, { ok: false, error: 'Lead handling failed' });
    }
  };
}

async function handleLead(clients, defaultClient, req, res) {
  const clientId = new URL(req.url || '/', 'http://local').searchParams.get('client') || defaultClient;
  const client = Object.prototype.hasOwnProperty.call(clients, clientId) ? clients[clientId] : null;
  if (!client) return send(res, 404, { ok: false, error: 'Unknown client' });

  const cors = corsHeaders(req, client);
  if (!cors) return send(res, 403, { ok: false, error: 'Origin not allowed' });
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    for (const [name, value] of Object.entries(cors)) res.setHeader(name, value);
    return res.end();
  }
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' }, { ...cors, Allow: 'POST, OPTIONS' });

  const ip = getRequestIp(req);
  if (ip) {
    const rateLimit = checkRateLimit(client.id + ':' + ip);
    if (!rateLimit.allowed) {
      return send(res, 429, { ok: false, error: 'Too many requests. Please try again later.' }, { ...cors, 'Retry-After': String(rateLimit.retryAfter) });
    }
  }

  let payload;
  try {
    payload = req.body && typeof req.body === 'object' ? req.body : JSON.parse(await readBody(req));
    if (Buffer.byteLength(JSON.stringify(payload)) > MAX_BODY_BYTES) {
      return send(res, 413, { ok: false, error: 'Payload too large' }, cors);
    }
  } catch (error) {
    const status = error && error.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
    return send(res, status, { ok: false, error: status === 413 ? 'Payload too large' : 'Invalid JSON' }, cors);
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return send(res, 400, { ok: false, error: 'Invalid lead payload' }, cors);
  }

  const invalidFields = validateLeadPayload(payload, client);
  if (invalidFields.length) {
    return send(res, 400, { ok: false, error: 'Please check the required contact and service details.', fields: invalidFields }, cors);
  }

  const context = { intakeId: randomUUID(), receivedAt: new Date().toISOString() };
  const boardUrl = crmBoardUrl(client);
  const crm = await sendCrm(payload, context, client).catch(() => ({
    ok: false,
    configured: Boolean(clientEnv(client, 'CRM_URL') && clientEnv(client, 'CRM_SECRET')),
    boardUrl
  }));

  const text = formatOwnerText(payload, { ...context, crm }, client);
  const [emailDelivered, telegramDelivered, whatsappDelivered] = await Promise.all([
    attemptDelivery(() => sendOwnerEmail(payload, text, client)),
    attemptDelivery(() => sendTelegram(text, client)),
    attemptDelivery(() => sendWhatsApp(text, client))
  ]);
  const delivered = crm.ok || emailDelivered || telegramDelivered || whatsappDelivered;

  // Sheet logging is storage, not delivery — a sheet failure must not block the lead.
  const followOn = [attemptDelivery(() => sendSheet(payload, context, client))];
  if (delivered) followOn.push(attemptDelivery(() => sendCustomerAutoReply(payload, client)));
  const [, autoReplied] = await Promise.all(followOn);

  if (!delivered) {
    return send(res, 503, {
      ok: false,
      reference: context.intakeId,
      crm: crm.configured ? 'failed' : 'not_configured',
      error: 'Lead endpoint is not configured or all primary delivery paths failed.'
    }, cors);
  }

  return send(res, 200, {
    ok: true,
    reference: context.intakeId,
    crm: crm.ok ? 'saved' : crm.configured ? 'failed' : 'not_configured',
    delivered: { email: emailDelivered, telegram: telegramDelivered, whatsapp: whatsappDelivered, autoReply: Boolean(autoReplied) }
  }, cors);
}

module.exports = {
  createLeadHandler,
  formatCustomerReply,
  getLeadRecipients,
  validateLeadPayload,
  checkRateLimit,
  getRequestIp,
  clientEnv,
  TEXT
};
