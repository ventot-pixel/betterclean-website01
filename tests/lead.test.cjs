const assert = require('node:assert/strict');
const { afterEach, beforeEach, describe, test } = require('node:test');

const handler = require('../api/lead.js');

const MANAGED_ENV = [
  'RESEND_API_KEY',
  'BETTERCLEAN_LEAD_EMAIL',
  'BETTERCLEAN_LEAD_FROM',
  'BETTERCLEAN_REPLY_FROM',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'CALLMEBOT_PHONE',
  'CALLMEBOT_APIKEY',
  'SHEETS_WEBHOOK_URL',
  'SHEETS_WEBHOOK_SECRET',
  'CRM_WEBHOOK_URL',
  'CRM_WEBHOOK_SECRET',
  'CRM_INGEST_URL',
  'CRM_INGEST_SECRET',
  'CRM_WEBHOOK_TIMEOUT_MS',
  'BETTERCLEAN_CRM_BOARD_URL',
  'BETTERCLEAN_LEAD_OWNER'
];

const originalEnv = Object.fromEntries(MANAGED_ENV.map((key) => [key, process.env[key]]));
const originalFetch = global.fetch;

function clearManagedEnv() {
  for (const key of MANAGED_ENV) delete process.env[key];
}

function restoreManagedEnv() {
  clearManagedEnv();
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value !== undefined) process.env[key] = value;
  }
}

function response(ok, status, body = {}) {
  return {
    ok,
    status,
    json: async () => body
  };
}

async function invoke(method, body) {
  const state = { status: null, body: null, headers: {} };
  const res = {
    setHeader(name, value) {
      state.headers[name] = value;
    },
    status(value) {
      state.status = value;
      return this;
    },
    json(value) {
      state.body = value;
      return this;
    }
  };

  await handler({ method, body }, res);
  return state;
}

beforeEach(() => {
  clearManagedEnv();
});

afterEach(() => {
  global.fetch = originalFetch;
  restoreManagedEnv();
});

describe('BetterClean lead handoff', () => {
  test('stores a website inquiry in CRM without exposing the secret', async () => {
    process.env.CRM_WEBHOOK_URL = 'https://crm.example.test/api/crm/leads/ingest';
    process.env.CRM_WEBHOOK_SECRET = 'private-test-secret';
    const calls = [];
    global.fetch = async (url, options) => {
      calls.push({ url, options });
      return response(true, 200, { ok: true, leadId: 'lead-123' });
    };

    const result = await invoke('POST', {
      source: 'homepage-booking',
      language: 'fi',
      customer: {
        firstName: 'Testi',
        lastName: 'Asiakas',
        email: 'test@example.com',
        phone: '040 123 4567'
      },
      booking: {
        service: 'window-cleaning',
        address: 'Testikatu 1'
      },
      assignedTo: 'Untrusted browser value',
      nextFollowUpDate: '2099-12-31'
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.crm, 'saved');
    assert.match(result.body.reference, /^[0-9a-f-]{36}$/);
    assert.equal(calls.length, 1);

    const crmCall = calls[0];
    const crmPayload = JSON.parse(crmCall.options.body);
    assert.equal(crmCall.url, process.env.CRM_WEBHOOK_URL);
    assert.equal(crmCall.options.headers['x-crm-webhook-secret'], 'private-test-secret');
    assert.equal(crmPayload.secret, undefined);
    assert.equal(crmPayload.business, 'BetterClean');
    assert.equal(crmPayload.sourcePlatform, 'website');
    assert.equal(crmPayload.sourcePage, '/');
    assert.equal(crmPayload.assignedTo, 'Ven');
    assert.match(crmPayload.nextFollowUpDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.notEqual(crmPayload.nextFollowUpDate, '2099-12-31');
    assert.equal(crmPayload.intakeId, result.body.reference);
  });

  test('warns the owner when CRM saving fails but an alert still arrives', async () => {
    process.env.CRM_WEBHOOK_URL = 'https://crm.example.test/api/crm/leads/ingest';
    process.env.CRM_WEBHOOK_SECRET = 'private-test-secret';
    process.env.TELEGRAM_BOT_TOKEN = 'fake-token';
    process.env.TELEGRAM_CHAT_ID = 'fake-chat';
    const calls = [];
    global.fetch = async (url, options) => {
      calls.push({ url, options });
      if (String(url).startsWith('https://crm.example.test/')) {
        return response(false, 503, { ok: false });
      }
      return response(true, 200, { ok: true });
    };

    const result = await invoke('POST', {
      source: 'request-quote-inquiry',
      customer: { name: 'Test Customer', phone: '040 123 4567' },
      inquiry: { service: 'Window cleaning', area: 'Tampere' }
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.crm, 'failed');
    const telegramCall = calls.find((call) => String(call.url).includes('api.telegram.org'));
    assert.ok(telegramCall, 'Telegram alert should be attempted');
    const telegramPayload = JSON.parse(telegramCall.options.body);
    assert.match(telegramPayload.text, /CRM: SAVE FAILED/);
    assert.match(telegramPayload.text, new RegExp(result.body.reference));
  });

  test('fails visibly when neither CRM nor an owner alert is available', async () => {
    global.fetch = async () => {
      throw new Error('No network call should be attempted');
    };

    const result = await invoke('POST', {
      customer: { name: 'Test Customer' },
      inquiry: { service: 'Home cleaning' }
    });

    assert.equal(result.status, 503);
    assert.equal(result.body.ok, false);
    assert.equal(result.body.crm, 'not_configured');
    assert.match(result.body.reference, /^[0-9a-f-]{36}$/);
  });

  test('keeps the public endpoint POST-only', async () => {
    global.fetch = async () => {
      throw new Error('No network call should be attempted');
    };

    const result = await invoke('GET');
    assert.equal(result.status, 405);
    assert.equal(result.headers.Allow, 'POST');
  });

  test('rejects a non-object lead before any delivery attempt', async () => {
    global.fetch = async () => {
      throw new Error('No network call should be attempted');
    };

    const result = await invoke('POST', []);
    assert.equal(result.status, 400);
    assert.equal(result.body.ok, false);
  });
});
