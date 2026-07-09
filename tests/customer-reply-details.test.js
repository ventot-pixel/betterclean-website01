const assert = require('assert');
const leadHandler = require('../api/lead');

assert.strictEqual(
  typeof leadHandler.formatCustomerReply,
  'function',
  'exports the customer reply formatter for regression tests'
);

const reply = leadHandler.formatCustomerReply({
  language: 'en',
  customer: {
    firstName: 'Aino',
    email: 'aino@example.com'
  },
  booking: {
    sizeLabel: '120 - 154m²',
    duration: 5,
    durationLabel: '5h+',
    frequencyLabel: 'Every second week',
    extrasLabels: ['Sauna'],
    estimatedTotal: '342 €',
    saunaFirstVisitOffer: true
  }
});

assert.match(reply.text, /Apartment size: 120 - 154m²/);
assert.match(reply.text, /Cleaning duration: 5h\+/);
assert.match(reply.text, /Frequency: Every second week/);
assert.match(reply.text, /Additional services: Sauna/);
assert.match(reply.text, /Estimated total: 342 €/);
assert.match(reply.text, /€10 off sauna cleaning on your first booked visit/);
assert.match(reply.text, /reply to this email and we will correct it/i);
