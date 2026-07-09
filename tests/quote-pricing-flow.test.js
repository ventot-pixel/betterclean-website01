const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requestQuoteHtml = fs.readFileSync(path.join(root, 'request-quote.html'), 'utf8');
const pricingHtml = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
const windowCleaningHtml = fs.readFileSync(path.join(root, 'window-cleaning.html'), 'utf8');

assert.match(
  requestQuoteHtml,
  /const QUOTE_DRAFT_KEY = 'bettercleanQuoteDraftV1'/,
  'request quote page defines a stable session draft key'
);

assert.match(
  requestQuoteHtml,
  /function saveQuoteDraftAndReviewPricing\(\)/,
  'request quote page saves the current draft before opening pricing'
);

assert.match(
  requestQuoteHtml,
  /function restoreQuoteDraftFromSession\(\)/,
  'request quote page restores a saved draft when returning from pricing'
);

assert.match(
  requestQuoteHtml,
  /onclick="return saveQuoteDraftAndReviewPricing\(\)"/,
  'review-pricing links use the draft-saving handler'
);

// The reset visit is no longer a promotion, so there is no offer box, no
// expiry date and no customer cap. It states the first-visit rate instead.
assert.match(
  requestQuoteHtml,
  /id="firstVisitRateNote"/,
  'request quote page states the first-visit hourly rate'
);
for (const dead of ['freeResetOfferNote', 'firstVisitFreeNote', '30.9.2026', 'norm. 59']) {
  assert.ok(
    !requestQuoteHtml.includes(dead),
    `expiring promo remnant "${dead}" must be gone`
  );
}

assert.match(
  pricingHtml,
  /id="quoteResumeBar"/,
  'pricing page includes a floating quote resume bar'
);

assert.match(
  pricingHtml,
  /id="quoteResumeContinue"/,
  'pricing page includes a continue-to-date-and-area action'
);

assert.match(
  pricingHtml,
  /function hydrateQuoteResumeBar\(\)/,
  'pricing page hydrates the resume bar from session storage'
);

assert.match(
  pricingHtml,
  /bettercleanQuoteDraftV1/,
  'pricing page reads the same session draft key as request quote'
);

assert.doesNotMatch(
  pricingHtml,
  /\+€50/,
  'pricing page uses Finnish price format for the hard-to-reach window add-on'
);

assert.doesNotMatch(
  windowCleaningHtml,
  /\+€50/,
  'window cleaning page uses Finnish price format for the hard-to-reach window add-on'
);
