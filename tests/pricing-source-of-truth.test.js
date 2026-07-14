const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = {};
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(root, 'pricing.js'), 'utf8') +
    '\nthis.__prices = PRICES; this.__homeRates = HOME_RATE_BY_FREQUENCY;',
  context
);

const PRICES = context.__prices;
const HOME_RATE_BY_FREQUENCY = context.__homeRates;
const RATE_RE = /([0-9]+(?:,[0-9]+)?) €\/h(?!lö)/g;

function fi(amount) {
  return amount % 1 === 0
    ? String(amount)
    : amount.toFixed(2).replace('.', ',');
}

const allowed = new Set([
  PRICES.recurring,
  PRICES.oneTime,
  PRICES.deep,
  PRICES.moveOut,
  PRICES.window,
  PRICES.postReno,
  PRICES.recurringAfterTax,
  PRICES.oneTimeAfterTax,
  PRICES.deepAfterTax,
  PRICES.moveOutAfterTax,
  PRICES.windowAfterTax,
  PRICES.postRenoAfterTax,
  ...Object.values(HOME_RATE_BY_FREQUENCY),
  ...Object.values(HOME_RATE_BY_FREQUENCY).map(rate =>
    Math.round(rate * 0.65 * 100) / 100
  ),
].map(fi));

const liveFiles = [
  'index.html',
  'pricing.html',
  'request-quote.html',
  'window-cleaning.html',
  'post-renovation-cleaning.html',
  'steam-cleaning.html',
  'additional-cleaning-services.html',
  'llms.txt',
];
const fileSpecificRates = {
  'llms.txt': new Set(['39']), // Published neighbour offer; expires 20.7.2026.
};

const violations = [];
for (const file of liveFiles) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of text.matchAll(RATE_RE)) {
    if (!allowed.has(match[1]) && !fileSpecificRates[file]?.has(match[1])) {
      violations.push(`${file}: "${match[1]} €/h" is not in pricing.js`);
    }
  }
}

assert.deepStrictEqual(
  violations,
  [],
  'Every hourly rate on a live surface must come from pricing.js.\n' +
    violations.join('\n')
);

for (const file of ['AGENTS.md', 'CLAUDE.md']) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(text, /pricing\.js.*single source of truth/is, `${file} must point to pricing.js`);
  assert.deepStrictEqual(
    [...text.matchAll(RATE_RE)],
    [],
    `${file} must not duplicate hourly rates from pricing.js`
  );
}

const pricingHtml = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
assert.doesNotMatch(pricingHtml, /Ekstrohointisiivouksen/);
assert.match(pricingHtml, /Ekstrahointisiivouksen/);

console.log(
  'pricing-source-of-truth: OK (allowed hourly values: ' +
    [...allowed].sort().join(', ') +
    ')'
);
