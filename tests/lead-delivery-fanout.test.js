const assert = require('assert');
const leadHandler = require('../api/lead');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

async function withEnv(overrides, fn) {
  const previousEnv = {};
  for (const key of Object.keys(overrides)) {
    previousEnv[key] = process.env[key];
    if (overrides[key] === undefined) delete process.env[key];
    else process.env[key] = overrides[key];
  }

  try {
    await fn();
  } finally {
    for (const key of Object.keys(overrides)) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  }
}

async function run() {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    calls.push({
      url: String(url),
      options,
      body: options.body ? JSON.parse(options.body) : null
    });
    return { ok: true };
  };

  try {
    await withEnv({
      RESEND_API_KEY: 'test-resend-key',
      BETTERCLEAN_LEAD_EMAIL: 'info@betterclean.fi, bettercleanfinland@gmail.com',
      BETTERCLEAN_LEAD_FROM: 'BetterClean Website <leads@betterclean.fi>',
      BETTERCLEAN_REPLY_FROM: 'BetterClean <hello@betterclean.fi>',
      CRM_WEBHOOK_URL: 'https://crm.example.test/api/crm/leads/ingest',
      CRM_WEBHOOK_SECRET: 'test-crm-secret',
      TELEGRAM_BOT_TOKEN: undefined,
      TELEGRAM_CHAT_ID: undefined,
      CALLMEBOT_PHONE: undefined,
      CALLMEBOT_APIKEY: undefined,
      SHEETS_WEBHOOK_URL: undefined,
      SHEETS_WEBHOOK_SECRET: undefined
    }, async () => {
      const response = createResponse();
      await leadHandler({
        method: 'POST',
        headers: {},
        body: {
          source: 'request-quote-inquiry',
          subject: 'BetterClean quote inquiry - Steam cleaning',
          language: 'en',
          customer: {
            name: '',
            email: 'inquiry@example.com',
            phone: '+358401234567'
          },
          inquiry: {
            service: 'Steam cleaning',
            area: 'Tampere',
            size: '50 - 89m²',
            method: 'Email',
            need: 'Need a quote'
          },
          body: 'New BetterClean quote inquiry'
        }
      }, response);

      assert.strictEqual(response.statusCode, 200);
      assert.deepStrictEqual(response.body, { ok: true });

      const ownerEmail = calls.find(call =>
        call.url === 'https://api.resend.com/emails' &&
        Array.isArray(call.body.to)
      );
      assert.ok(ownerEmail, 'sends an owner notification email through Resend');
      assert.deepStrictEqual(
        ownerEmail.body.to,
        ['info@betterclean.fi', 'bettercleanfinland@gmail.com'],
        'owner email recipients are split before sending to Resend'
      );

      const crm = calls.find(call => call.url === 'https://crm.example.test/api/crm/leads/ingest');
      assert.ok(crm, 'syncs the inquiry to CRM');
      assert.strictEqual(
        crm.options.headers['x-crm-webhook-secret'],
        'test-crm-secret',
        'CRM request includes the shared secret header'
      );
      assert.strictEqual(
        crm.body.customer.name,
        'inquiry@example.com',
        'CRM payload falls back to email as the lead name when inquiry name is blank'
      );
    });
  } finally {
    global.fetch = originalFetch;
  }
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
