function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function formatPayload(payload) {
  const lines = [
    payload.subject || 'BetterClean lead',
    '',
    payload.body || '',
    '',
    'Source: ' + (payload.source || 'website'),
    'Received: ' + new Date().toISOString()
  ];
  return lines.join('\n');
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
    delivered = await sendResend(payload, text);
    delivered = (await sendTelegram(payload, text)) || delivered;
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
