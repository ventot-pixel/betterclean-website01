/**
 * Essential Home Care rate ladder (Ven, 2026-07-09).
 *
 *   weekly 49 · bi-weekly 55 · every four weeks 59 · one-time 69
 *
 * Commitment buys a cheaper hour. That is the whole incentive -- there is no
 * separate reset-visit rate and no promotion. A new customer's first visit is
 * simply longer, and is billed at their normal contract rate like every other
 * visit.
 *
 * Move-out stays 59 €/h and must NOT move when the one-time home rate does --
 * both were 59 before this change, which is why they are asserted apart.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = {};
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(root, 'pricing.js'), 'utf8') +
    '\nthis.__api = { PRICES, HOME_RATE_BY_FREQUENCY, hasResetTable: typeof RESET_VISIT_RATE_BY_FREQUENCY !== "undefined" };',
  context
);
const { PRICES, HOME_RATE_BY_FREQUENCY, hasResetTable } = context.__api;

// ── The ladder ─────────────────────────────────────────────────────────────
assert.strictEqual(HOME_RATE_BY_FREQUENCY.weekly, 49, 'weekly is 49 €/h');
assert.strictEqual(HOME_RATE_BY_FREQUENCY.biweekly, 55, 'bi-weekly is 55 €/h');
assert.strictEqual(HOME_RATE_BY_FREQUENCY.monthly, 59, 'every four weeks is 59 €/h');
assert.strictEqual(HOME_RATE_BY_FREQUENCY.once, 69, 'one-time home cleaning is 69 €/h');

// Commitment must always buy a strictly lower rate, or the ladder is a lie.
const ladder = ['weekly', 'biweekly', 'monthly', 'once'].map(f => HOME_RATE_BY_FREQUENCY[f]);
for (let i = 1; i < ladder.length; i++) {
  assert.ok(
    ladder[i] > ladder[i - 1],
    `rate must rise as commitment falls: ${ladder.join(' < ')}`
  );
}

// ── No reset-visit pricing ─────────────────────────────────────────────────
// The first visit is longer, not dearer. If a second rate table reappears,
// so does the "is my first visit a different price?" confusion.
assert.strictEqual(
  hasResetTable, false,
  'there must be no separate reset-visit rate table; a visit costs the contract rate'
);

// ── Rates that must NOT have moved ─────────────────────────────────────────
assert.strictEqual(PRICES.moveOut, 59, 'move-out stays 59 €/h');
assert.strictEqual(PRICES.deep, 79, 'deep stays 79 €/h');
assert.strictEqual(PRICES.window, 49, 'window stays 49 €/h');
assert.strictEqual(PRICES.postReno, 79, 'post-renovation stays 79 €/h');
assert.notStrictEqual(
  PRICES.oneTime, PRICES.moveOut,
  'one-time home and move-out were both 59; they must no longer be equal'
);

// Committing to any schedule must beat paying one-time.
assert.ok(
  HOME_RATE_BY_FREQUENCY.monthly < HOME_RATE_BY_FREQUENCY.once,
  'four-weekly must be strictly cheaper than one-time, with no first-visit catch'
);

// The advertised "alkaen" rate must be the cheapest rung.
assert.strictEqual(
  PRICES.recurring, HOME_RATE_BY_FREQUENCY.weekly,
  'PRICES.recurring is the "alkaen" rate and must equal the weekly rate'
);

// Deduction figures stay derivable.
const after = r => Math.round(r * 0.65 * 100) / 100;
assert.strictEqual(PRICES.oneTimeAfterTax, after(69), 'one-time after deduction is 44,85');
assert.strictEqual(PRICES.recurringAfterTax, after(49), 'weekly after deduction is 31,85');
assert.strictEqual(PRICES.moveOutAfterTax, after(59), 'move-out after deduction is 38,35');

console.log('home-rate-ladder: OK (49 / 55 / 59 / 69, no reset-visit pricing)');
