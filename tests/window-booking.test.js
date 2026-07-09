/**
 * Window cleaning as a bookable service (Ven, 2026-07-09).
 *
 *   49 €/h, minimum 2 hours, so the cheapest window job is 98 €.
 *
 * Windows are sized by how many there are, not by square metres, so the
 * booking form asks for a window count. Every path must produce a price:
 * nothing on the window flow may say "we confirm the price in our reply".
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(root, 'pricing.js'), 'utf8') +
    '\nthis.__p = { PRICES, WINDOW_COUNT_BRACKETS, getWindowCountBracket, WINDOW_ADDON_PRICES };',
  ctx
);
const { PRICES, WINDOW_COUNT_BRACKETS, getWindowCountBracket, WINDOW_ADDON_PRICES } = ctx.__p;

// ── Rate and minimum ───────────────────────────────────────────────────────
assert.strictEqual(PRICES.window, 49, 'window cleaning is 49 €/h');
assert.strictEqual(PRICES.minWindow, 2, 'window cleaning has a 2 hour minimum');
assert.strictEqual(PRICES.window * PRICES.minWindow, 98, 'the cheapest window job is 98 €');

// ── Hours by window count ──────────────────────────────────────────────────
const expected = [
  [1, 2], [5, 2], [8, 2],      // up to 8 windows -> the 2 hour minimum
  [9, 3], [12, 3], [16, 3],    // 9-16 windows
  [17, 4], [20, 4], [24, 4],   // 17-24 windows
];
for (const [windows, hours] of expected) {
  const bracket = getWindowCountBracket(windows);
  assert.ok(bracket, `${windows} windows must map to a bracket`);
  assert.strictEqual(bracket.hours, hours, `${windows} windows -> ${hours} h`);
  assert.strictEqual(bracket.hours * PRICES.window, hours * 49, `${windows} windows priced at 49 €/h`);
}

// The published prices a customer will see.
assert.strictEqual(getWindowCountBracket(8).hours * PRICES.window, 98);
assert.strictEqual(getWindowCountBracket(12).hours * PRICES.window, 147);
assert.strictEqual(getWindowCountBracket(20).hours * PRICES.window, 196);

// ── Beyond the table we quote, we do not guess ─────────────────────────────
for (const n of [25, 40, 0, -3, NaN]) {
  assert.strictEqual(getWindowCountBracket(n), null, `${n} windows has no automatic price`);
}

// Hours must rise with window count.
const hours = WINDOW_COUNT_BRACKETS.map(b => b.hours);
for (let i = 1; i < hours.length; i++) {
  assert.ok(hours[i] > hours[i - 1], `hours must rise with window count: ${hours.join(' < ')}`);
}
assert.strictEqual(hours[0], PRICES.minWindow, 'the smallest bracket is exactly the minimum order');

// ── Add-ons are priced, never "confirmed in our reply" ─────────────────────
assert.strictEqual(WINDOW_ADDON_PRICES.balcony, 59, 'glazed balcony is +59 €');
assert.strictEqual(WINDOW_ADDON_PRICES.highAccess, 50, 'high or hard-to-reach windows are +50 €');

// ── The booking form must offer it, and the service page must link to it ───
const quote = fs.readFileSync(path.join(root, 'request-quote.html'), 'utf8');
assert.match(quote, /id="service-window"/, 'window is a bookable service card');
assert.match(quote, /pricingServiceKey: 'window'/, 'window service is registered in BOOKING_SERVICE_CONFIG');
assert.match(quote, /rateKey: 'window'/, 'window service bills at the window rate');
assert.match(quote, /id="extra-balcony"/, 'glazed balcony is a priced add-on, not a reply');
assert.match(quote, /id="extra-highAccess"/, 'high windows are a priced add-on, not a reply');
assert.match(quote, /id="customEstimateLink"/, 'out-of-range sizes get a route to the quote form');

const page = fs.readFileSync(path.join(root, 'window-cleaning.html'), 'utf8');
assert.match(
  page,
  /request-quote\.html\?service=window/,
  'window-cleaning.html must deep-link into the booking form with the service preselected'
);

console.log('window-booking: OK (49 €/h, min 2 h, 98 / 147 / 196 €)');
