const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'request-quote.html'), 'utf8');

assert.match(html, /<form id="bookingPanel"[^>]*onsubmit="submitBookingRequest\(event\)"/);
assert.match(html, /<form id="inquiryPanel"[^>]*onsubmit="submitInquiryRequest\(event\)"/);
assert.match(html, /id="streetAddress"[^>]*autocomplete="street-address"[^>]*required/);
assert.match(html, /id="postcode"[^>]*autocomplete="postal-code"[^>]*required/);
assert.match(html, /id="bookFirstName"[^>]*autocomplete="given-name"[^>]*required/);
assert.match(html, /id="bookingWebsite"[^>]*tabindex="-1"/);
assert.match(html, /id="inquiryWebsite"[^>]*tabindex="-1"/);
assert.match(html, /id="bookingSuccess"[^>]*aria-live="polite"/);
assert.match(html, /id="inquirySuccess"[^>]*aria-live="polite"/);
assert.match(html, /function validateBookingLocation\(\)/);
assert.match(html, /function validateBookingContact\(\)/);
assert.match(html, /function validateInquiry\(\)/);
assert.match(html, /function setSubmitting\(/);
assert.doesNotMatch(
  html,
  /window\.location\.href\s*=\s*['"]mailto:/,
  'delivery failure must not automatically open email and imply that the request was sent'
);
assert.match(html, /class="email-fallback" hidden/);
assert.match(html, /150 € vuotuista henkilökohtaista omavastuuta/);

console.log('quote-form-hardening: OK');
