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
  const to = process.env.BETTERCLEAN_LEAD_EMAIL || 'info@betterclean.fi';
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

function formatCustomerReply(payload) {
  const customer = getCustomer(payload);
  const lang = payload.language || payload.lang || 'fi';
  const firstName = customer.firstName || (customer.name || '').split(' ')[0] || '';
  const helloFi = firstName ? 'Hei ' + firstName + ',' : 'Hei,';
  const helloEn = firstName ? 'Hi ' + firstName + ',' : 'Hi,';

  if (lang === 'en') {
    return {
      subject: 'We received your request - BetterClean',
      text: [
        helloEn,
        '',
        'Thanks for contacting BetterClean. We received your request and will review the details as soon as possible.',
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

module.exports = async function handler(req, res) {
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

  const text = formatPayload(payload);
  let delivered = false;

  try {
    delivered = (await attemptDelivery(() => sendResend(payload, text))) || delivered;
    delivered = (await attemptDelivery(() => sendTelegram(payload, text))) || delivered;
    delivered = (await attemptDelivery(() => sendWhatsApp(text))) || delivered;
    await sendCustomerAutoReply(payload).catch(() => false);
    // Sheet logging is storage, not delivery — a sheet failure must not block the lead.
    await sendSheet(payload).catch(() => false);
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
};
