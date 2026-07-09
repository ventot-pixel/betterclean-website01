/**
 * Essential Home Care rate ladder (Ven, 2026-07-09).
 *
 *   weekly 49 · bi-weekly 55 · every four weeks 59 · one-time 69
 *
 * The first visit is a longer reset clean. Weekly and bi-weekly are billed for
 * it at their own contract rate; four-weekly pays the one-time rate for the
 * first visit only.
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
    '\nthis.__api = { PRICES, HOME_RATE_BY_FREQUENCY, RESET_VISIT_RATE_BY_FREQUENCY };',
  context
);
const { PRICES, HOME_RATE_BY_FREQUENCY, RESET_VISIT_RATE_BY_FREQUENCY } = context.__api;

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

// ── The reset visit ────────────────────────────────────────────────────────
assert.strictEqual(RESET_VISIT_RATE_BY_FREQUENCY.weekly, 49, 'weekly reset billed at its contract rate');
assert.strictEqual(RESET_VISIT_RATE_BY_FREQUENCY.biweekly, 55, 'bi-weekly reset billed at its contract rate');
assert.strictEqual(RESET_VISIT_RATE_BY_FREQUENCY.monthly, 69, 'four-weekly reset billed at the one-time rate');
assert.strictEqual(RESET_VISIT_RATE_BY_FREQUENCY.once, 69, 'a one-time clean is simply the one-time rate');

// Weekly and bi-weekly get no markup on the reset; four-weekly does.
for (const f of ['weekly', 'biweekly']) {
  assert.strictEqual(
    RESET_VISIT_RATE_BY_FREQUENCY[f], HOME_RATE_BY_FREQUENCY[f],
    `${f} pays no reset markup`
  );
}
assert.ok(
  RESET_VISIT_RATE_BY_FREQUENCY.monthly > HOME_RATE_BY_FREQUENCY.monthly,
  'four-weekly pays a reset markup, which is what makes weekly/bi-weekly worth choosing'
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

console.log('home-rate-ladder: OK (49 / 55 / 59 / 69; reset weekly 49, biweekly 55, 4-weekly 69)');
