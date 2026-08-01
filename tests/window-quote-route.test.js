/**
 * Window cleaning is quoted, not booked online (Ven, 2026-07-09).
 *
 * It was briefly a fourth bookable service, priced from a window-count table
 * whose hours were reverse-engineered from a stale 119 € estimate: 8 windows in
 * 2 hours, which is 15 minutes a window including frames and sills. Ven, who
 * does the work, said that is not doable. Rather than invent better hours, the
 * booking form now offers three services and window jobs go to the quote route.
 *
 * The rate stays 49 €/h with a 2 hour minimum, so 98 € is the smallest visit.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const quote = fs.readFileSync(path.join(root, 'request-quote.html'), 'utf8');
const page = fs.readFileSync(path.join(root, 'window-cleaning.html'), 'utf8');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(root, 'pricing.js'), 'utf8') +
    '\nthis.__p = { PRICES, hasWindowBrackets: typeof WINDOW_COUNT_BRACKETS !== "undefined" };',
  ctx
);
const { PRICES, hasWindowBrackets } = ctx.__p;

// ── Rate and minimum survive; the invented hours do not ────────────────────
assert.strictEqual(PRICES.window, 49, 'window cleaning is still 49 €/h');
assert.strictEqual(PRICES.minWindow, 2, 'window cleaning still has a 2 hour minimum');
assert.strictEqual(PRICES.window * PRICES.minWindow, 98, 'the smallest window visit is 98 €');
assert.strictEqual(PRICES.windowBalconyAddon, 59, 'glazed balcony is still +59 €');
assert.strictEqual(
  hasWindowBrackets, false,
  'WINDOW_COUNT_BRACKETS must stay deleted: its hours were never measured'
);

// ── Exactly three bookable services ────────────────────────────────────────
const cards = [...quote.matchAll(/id="service-([a-z]+)"/gi)].map(m => m[1]);
assert.deepStrictEqual(
  [...new Set(cards)].sort(),
  ['deep', 'home', 'office'],
  'the booking form offers exactly Essential, Deep and Move-out'
);
assert.ok(!quote.includes("pricingServiceKey: 'window'"), 'window is not a bookable service');
assert.ok(!quote.includes('id="extra-balcony"'), 'window-only add-ons are gone from the booking form');
assert.ok(!quote.includes('id="extra-highAccess"'), 'window-only add-ons are gone from the booking form');
assert.ok(!quote.includes('WINDOW_COUNT_BRACKETS'), 'the booking form no longer references window brackets');

// ── The window page routes to the quote form, with window preselected ──────
assert.match(
  quote,
  /function applyInquiryFromQuery/,
  'request-quote.html supports ?mode=inquiry deep links'
);
assert.match(
  page,
  /request-quote\.html\?mode=inquiry&amp;inquiry=window-cleaning/,
  'window-cleaning.html sends visitors to the quote form with window preselected'
);
assert.match(
  quote,
  /<option value="window-cleaning"/,
  'the inquiry form offers window cleaning'
);

// ── No page may promise a price for a window count we never measured ───────
for (const [name, src] of [['window-cleaning.html', page], ['request-quote.html', quote]]) {
  assert.ok(!/alkaen 147 €/.test(src), `${name} must not price 9-16 windows at 147 €`);
  assert.ok(!/Enintään 8 ikkunaa/.test(src), `${name} must not price 8 windows at all`);
}
assert.ok(
  !/asunnot alkaen 98/.test(page),
  '98 € is the two-hour minimum, not the price of an apartment'
);
assert.match(page, /alkaen 98 €/, 'the page still states the 98 € minimum order');

console.log('window-quote-route: OK (49 €/h, min 2 h = 98 €, quoted not booked)');
