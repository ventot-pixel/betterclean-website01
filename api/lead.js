function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function formatPayload(payload) {
  const details = payload.body || formatFallbackBody(payload);
  const lines = [
    payload.subject || 'BetterClean lead',
    '',
    details,
    '',
    'Source: ' + (payload.source || 'website'),
    'Received: ' + new Date().toISOString()
  ];
  return lines.join('\n');
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
      subject: payload.subject || 'BetterClean website lead',
      text
    })
  });
  return response.ok;
}

function getLeadRecipients() {
  return (process.env.BETTERCLEAN_LEAD_EMAIL || 'info@betterclean.fi')
    .split(/[;,]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

const BOOKING_SIZE_LABELS = {
  studio: { en: 'Under 50m²', fi: 'Alle 50m²' },
  small: { en: '50 - 89m²', fi: '50 - 89m²' },
  medium: { en: '90 - 119m²', fi: '90 - 119m²' },
  large: { en: '120 - 154m²', fi: '120 - 154m²' },
  xlarge: { en: '155m² or larger', fi: '155m² tai suurempi' }
};

const BOOKING_FREQUENCY_LABELS = {
  weekly: { en: 'Every week', fi: 'Joka viikko' },
  biweekly: { en: 'Every second week', fi: 'Joka toinen viikko' },
  monthly: { en: 'Every four weeks', fi: 'Joka neljäs viikko' },
  once: { en: 'One time only', fi: 'Vain kerran' }
};

const BOOKING_EXTRA_LABELS = {
  fridge: { en: 'Fridge', fi: 'Jääkaappi' },
  oven: { en: 'Oven', fi: 'Uuni' },
  sauna: { en: 'Sauna', fi: 'Sauna' }
};

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function localizedLabel(labels, key, lang) {
  return labels[key] ? labels[key][lang] : '';
}

function getBookingExtras(booking, lang) {
  if (Array.isArray(booking.extrasLabels) && booking.extrasLabels.length) {
    return booking.extrasLabels.filter(hasText);
  }
  if (!Array.isArray(booking.extras)) return [];
  return booking.extras
    .map(item => localizedLabel(BOOKING_EXTRA_LABELS, item, lang) || item)
    .filter(hasText);
}

function hasSaunaOffer(booking, extras) {
  if (booking.saunaFirstVisitOffer) return true;
  if (Array.isArray(booking.extras) && booking.extras.includes('sauna')) return true;
  return extras.some(item => String(item).toLowerCase().includes('sauna'));
}

function formatCustomerDetailLines(payload, lang) {
  const booking = payload.booking || null;
  const inquiry = payload.inquiry || null;
  const lines = [];

  function add(label, value) {
    if (hasText(value)) lines.push(label + ': ' + value);
  }

  if (booking && typeof booking === 'object') {
    const extras = getBookingExtras(booking, lang);
    add(lang === 'fi' ? 'Kodin koko' : 'Apartment size', booking.sizeLabel || localizedLabel(BOOKING_SIZE_LABELS, booking.size, lang));
    add(lang === 'fi' ? 'Siivouksen kesto' : 'Cleaning duration', booking.durationLabel || (hasText(booking.duration) ? booking.duration + 'h' : ''));
    add(lang === 'fi' ? 'Toistuvuus' : 'Frequency', booking.frequencyLabel || localizedLabel(BOOKING_FREQUENCY_LABELS, booking.frequency, lang));
    add(lang === 'fi' ? 'Lisäpalvelut' : 'Additional services', extras.join(', '));
    add(lang === 'fi' ? 'Arvioitu yhteensä' : 'Estimated total', booking.estimatedTotal || booking.estimatedPrice);
    add(lang === 'fi' ? 'Osoite' : 'Address', booking.address);
    add(lang === 'fi' ? 'Postinumero' : 'Postcode', booking.postcode);
    add(lang === 'fi' ? 'Toivottu aika' : 'Preferred time', booking.slot || booking.time || booking.date);
    if (hasSaunaOffer(booking, extras)) {
      lines.push(lang === 'fi'
        ? 'Saunaetu: 10 € alennus saunasiivouksesta ensimmäisellä varatulla käynnillä'
        : 'Sauna first-visit offer: €10 off sauna cleaning on your first booked visit');
    }
    return lines;
  }

  if (inquiry && typeof inquiry === 'object') {
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
        ...detailLines.map(line => '- ' + line),
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

async function sendSheet(payload) {
  if (!process.env.SHEETS_WEBHOOK_URL) return false;
  const response = await fetch(process.env.SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.SHEETS_WEBHOOK_SECRET || '',
      receivedAt: new Date().toISOString(),
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

async function sendCrm(payload) {
  if (!process.env.CRM_WEBHOOK_URL) return false;
  const response = await fetch(process.env.CRM_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-crm-webhook-secret': process.env.CRM_WEBHOOK_SECRET || ''
    },
    body: JSON.stringify({
      secret: process.env.CRM_WEBHOOK_SECRET || '',
      receivedAt: new Date().toISOString(),
      source: payload.source || 'website',
      subject: payload.subject || '',
      customer: getCrmCustomer(payload),
      booking: payload.booking || null,
      inquiry: payload.inquiry || null,
      body: payload.body || '',
      language: payload.language || payload.lang || 'fi',
      sourcePage: payload.sourcePage || payload.page || payload.url || ''
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

  let payload;
  try {
    payload = req.body && typeof req.body === 'object' ? req.body : JSON.parse(await readBody(req));
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  }

  if (process.env.CRM_WEBHOOK_SECRET && req.headers['x-betterclean-crm-smoke'] === process.env.CRM_WEBHOOK_SECRET) {
    const crmSynced = await sendCrm(payload).catch(() => false);
    return res.status(crmSynced ? 200 : 502).json({
      ok: crmSynced,
      mode: 'crm-smoke'
    });
  }

  const text = formatPayload(payload);
  let delivered = false;

  try {
    delivered = (await attemptDelivery(() => sendResend(payload, text))) || delivered;
    delivered = (await attemptDelivery(() => sendTelegram(payload, text))) || delivered;
    delivered = (await attemptDelivery(() => sendWhatsApp(text))) || delivered;
    await sendCustomerAutoReply(payload).catch(() => false);
    // Sheet logging is storage, not delivery — a sheet failure must not block the lead.
    await sendSheet(payload).catch(() => false);
    // CRM logging is storage, not delivery — a CRM failure must not block the lead.
    await sendCrm(payload).catch(() => false);
  } catch (error) {
    return res.status(502).json({ ok: false, error: 'Lead delivery failed' });
  }

  if (!delivered) {
    return res.status(503).json({
      ok: false,
      error: 'Lead endpoint is not configured. Set RESEND_API_KEY or TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.'
    });
  }

  return res.status(200).json({ ok: true });
}

module.exports = handler;
module.exports.getLeadRecipients = getLeadRecipients;
module.exports.formatCustomerReply = formatCustomerReply;
