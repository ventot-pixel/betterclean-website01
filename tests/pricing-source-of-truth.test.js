const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = {};
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(root, 'pricing.js'), 'utf8') +
    '\nthis.__prices = PRICES; this.__homeRates = HOME_RATE_BY_FREQUENCY; this.__neighborPromo = NEIGHBOUR_PROMOTION;',
  context
);

const PRICES = context.__prices;
const HOME_RATE_BY_FREQUENCY = context.__homeRates;
const NEIGHBOUR_PROMOTION = context.__neighborPromo;
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
  'textile-cleaning.html',
  'additional-cleaning-services.html',
  'naapurietu.html',
  'llms.txt',
];
const fileSpecificRates = {
  // 39 €/h is the six-month introductory rate for the first 50 new recurring customers.
  'naapurietu.html': new Set(['39']),
  'llms.txt': new Set(['39']),
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
  assert.match(text, /PROJECT\.md/is, `${file} must point to PROJECT.md`);
  assert.deepStrictEqual(
    [...text.matchAll(RATE_RE)],
    [],
    `${file} must not duplicate hourly rates from pricing.js`
  );
}

const projectText = fs.readFileSync(path.join(root, 'PROJECT.md'), 'utf8');
assert.match(projectText, /pricing\.js.*single source of truth/is, 'PROJECT.md must point to pricing.js');
assert.deepStrictEqual(
  [...projectText.matchAll(RATE_RE)],
  [],
  'PROJECT.md must not duplicate hourly rates from pricing.js'
);

const pricingHtml = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
assert.doesNotMatch(pricingHtml, /Ekstrohointisiivouksen/);
assert.match(pricingHtml, /Ekstrahointisiivouksen/);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(NEIGHBOUR_PROMOTION)),
  {
    hourlyRate: 39,
    customerLimit: 50,
    introductoryMonths: 6,
    minimumVisitHours: 2,
    validThrough: '2027-09-30',
    sofa2SeatAddon: 59,
    sofa3SeatAddon: 79,
    carpetAddonFrom: 39,
    carpetAddonTo: 69,
    smallWindowsAddon: 39,
  },
  'Neighbor promotion terms must remain canonical in pricing.js'
);

const neighborHtml = fs.readFileSync(path.join(root, 'naapurietu.html'), 'utf8');
for (const required of [
  'Ensimmäiselle 50 uudelle vakioasiakkaalle',
  'ensimmäiset 6 kuukautta',
  '30.9.2027',
  'Vähintään 2 tuntia käyntiä kohden',
  'id="frequency"',
  "introductoryMonths: 6",
  "customerLimit: 50",
  "validThrough: '2027-09-30'",
]) {
  assert.match(neighborHtml, new RegExp(required), `Neighbor page must include: ${required}`);
}
assert.doesNotMatch(neighborHtml, /1\.10\.2026|2026-10-01/);

console.log(
  'pricing-source-of-truth: OK (allowed hourly values: ' +
    [...allowed].sort().join(', ') +
    ')'
);
