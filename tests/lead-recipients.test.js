const assert = require('assert');
const leadHandler = require('../api/lead');

const originalLeadEmail = process.env.BETTERCLEAN_LEAD_EMAIL;

try {
  delete process.env.BETTERCLEAN_LEAD_EMAIL;
  assert.deepStrictEqual(
    leadHandler.getLeadRecipients(),
    ['info@betterclean.fi'],
    'uses the default owner recipient when env is missing'
  );

  process.env.BETTERCLEAN_LEAD_EMAIL = 'info@betterclean.fi, bettercleanfinland@gmail.com';
  assert.deepStrictEqual(
    leadHandler.getLeadRecipients(),
    ['info@betterclean.fi', 'bettercleanfinland@gmail.com'],
    'splits comma-separated owner recipients'
  );

  process.env.BETTERCLEAN_LEAD_EMAIL = ' info@betterclean.fi ; bettercleanfinland@gmail.com ';
  assert.deepStrictEqual(
    leadHandler.getLeadRecipients(),
    ['info@betterclean.fi', 'bettercleanfinland@gmail.com'],
    'splits semicolon-separated owner recipients and trims whitespace'
  );

  process.env.BETTERCLEAN_LEAD_EMAIL = ' , ; ';
  assert.deepStrictEqual(
    leadHandler.getLeadRecipients(),
    ['info@betterclean.fi'],
    'falls back safely when the configured recipient list is empty'
  );
} finally {
  if (originalLeadEmail === undefined) {
    delete process.env.BETTERCLEAN_LEAD_EMAIL;
  } else {
    process.env.BETTERCLEAN_LEAD_EMAIL = originalLeadEmail;
  }
}
