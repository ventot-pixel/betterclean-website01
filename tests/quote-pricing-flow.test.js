const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requestQuoteHtml = fs.readFileSync(path.join(root, 'request-quote.html'), 'utf8');
const pricingHtml = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
const windowCleaningHtml = fs.readFileSync(path.join(root, 'window-cleaning.html'), 'utf8');

// The "Review pricing first" round-trip (fill form -> save draft -> pricing
// resume bar -> back into booking) was removed to keep customers in the funnel.
// The price now shows on step 1, so the detour is obsolete. Guard that the whole
// draft mechanism stays gone from both pages.
for (const dead of [
  'QUOTE_DRAFT_KEY',
  'saveQuoteDraftAndReviewPricing',
  'restoreQuoteDraftFromSession',
  'Katso hinnat ensin'
]) {
  assert.ok(!requestQuoteHtml.includes(dead), `removed draft-flow remnant "${dead}" in request-quote`);
}
for (const dead of ['quoteResumeBar', 'hydrateQuoteResumeBar', 'QUOTE_DRAFT_KEY']) {
  assert.ok(!pricingHtml.includes(dead), `removed resume-bar remnant "${dead}" in pricing`);
}

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

// The price must be visible before the customer types an address. It used to
// appear only in #summaryEstimate on step 3, after street address + postcode.
assert.match(
  requestQuoteHtml,
  /id="step1Estimate"/,
  'step 1 shows the estimated total'
);
{
  const step1 = requestQuoteHtml.indexOf('id="bookingStep1"');
  const step2 = requestQuoteHtml.indexOf('id="bookingStep2"');
  const estimate = requestQuoteHtml.indexOf('id="step1Estimate"');
  const address = requestQuoteHtml.indexOf('id="streetAddress"');
  assert.ok(step1 < estimate && estimate < step2, 'the total lives inside step 1');
  assert.ok(estimate < address, 'the total is shown before the address field');
}
console.log('quote-pricing-flow: price shown on step 1, before the address');
