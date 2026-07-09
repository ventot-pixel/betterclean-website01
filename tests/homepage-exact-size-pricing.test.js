const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const pricingJs = fs.readFileSync(path.join(root, 'pricing.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const context = {};
vm.createContext(context);
vm.runInContext(
  pricingJs + `
    this.__pricingTestApi = {
      PRICES,
      HOME_SIZE_BRACKETS: typeof HOME_SIZE_BRACKETS === 'undefined' ? null : HOME_SIZE_BRACKETS,
      getHomeSizeBracket: typeof getHomeSizeBracket === 'undefined' ? null : getHomeSizeBracket,
      calcWidgetEstimate,
      formatPrice
    };
  `,
  context
);

const api = context.__pricingTestApi;
const plain = value => JSON.parse(JSON.stringify(value));

assert.deepStrictEqual(
  {
    recurring: api.PRICES.recurring,
    oneTime: api.PRICES.oneTime,
    deep: api.PRICES.deep,
    moveOut: api.PRICES.moveOut
  },
  {
    recurring: 49,
    oneTime: 69,
    deep: 79,
    moveOut: 59
  },
  'canonical hourly rates: Essential from 49, one-time home 69, deep 79, move-out 59'
);

// Window job prices are derived from the rate and the window count, not from
// standalone estimate constants. Those constants existed twice and drifted out
// of sync with the hourly rate both times.
assert.strictEqual(
  api.PRICES.windowApartmentMin, undefined,
  'window estimate constants must stay deleted; they drifted from the hourly rate twice'
);
assert.strictEqual(api.PRICES.windowBalconyAddon, 59, 'glazed balcony add-on is 59 €');
assert.strictEqual(
  api.PRICES.window * api.PRICES.minWindow, 98,
  'the smallest window visit is the 2 hour minimum at 49 €/h'
);

// The homepage must advertise the real minimum, not a stale estimate range.
assert.match(
  indexHtml,
  /alkaen 98 €/,
  'homepage window strip shows the 2-hour minimum price of 98 €'
);
assert.doesNotMatch(
  indexHtml,
  /alkaen 119 €/,
  'the old 119 € window estimate, priced against the retired 69 €/h rate, must be gone'
);

assert.deepStrictEqual(
  plain(api.HOME_SIZE_BRACKETS.map(({ key, min, max }) => ({ key, min, max }))),
  [
    { key: 'studio', min: 0, max: 39 },
    { key: 'small', min: 40, max: 59 },
    { key: 'medium', min: 60, max: 79 },
    { key: 'large', min: 80, max: 99 },
    { key: 'xlarge', min: 100, max: 119 },
    { key: 'xxlarge', min: 120, max: 149 },
    { key: 'xxxlarge', min: 150, max: 180 }
  ],
  'homepage pricing uses the discussed size brackets through 180 m²'
);

assert.strictEqual(api.getHomeSizeBracket(72).key, 'medium', '72 m² maps to the 60-79 m² bracket');
assert.strictEqual(api.getHomeSizeBracket('50').key, 'small', 'typed string sizes map to pricing brackets');
assert.strictEqual(api.getHomeSizeBracket(130).key, 'xxlarge', '130 m² maps to the 120-149 m² bracket');
assert.strictEqual(api.getHomeSizeBracket(160).key, 'xxxlarge', '160 m² maps to the 150-180 m² bracket');
assert.strictEqual(api.getHomeSizeBracket(181), null, 'homes above 180 m² fall back to a custom quote instead of invented prices');

assert.deepStrictEqual(
  plain(api.calcWidgetEstimate('home', 72)),
  {
    amount: 147,
    price: '147 €',
    hours: 3,
    rate: 49,
    bracket: plain(api.getHomeSizeBracket(72))
  },
  'Essential pricing is calculated from typed m², bracket duration, and 49 €/h'
);
assert.deepStrictEqual(
  plain(api.calcWidgetEstimate('deep', 72)),
  {
    amount: 395,
    price: '395 €',
    hours: 5,
    rate: 79,
    bracket: plain(api.getHomeSizeBracket(72))
  },
  'Deep pricing is calculated from typed m², bracket duration, and 79 €/h'
);
assert.deepStrictEqual(
  plain(api.calcWidgetEstimate('office', 72)),
  {
    amount: 354,
    price: '354 €',
    hours: 6,
    rate: 59,
    bracket: plain(api.getHomeSizeBracket(72))
  },
  'Move-out pricing is calculated from typed m², bracket duration, and 59 €/h'
);
assert.strictEqual(api.calcWidgetEstimate('home', 50).price, '122,50 €', 'half-hour totals keep cents instead of rounding away .50');
assert.deepStrictEqual(
  plain(api.calcWidgetEstimate('home', 135)),
  {
    amount: 220.5,
    price: '220,50 €',
    hours: 4.5,
    rate: 49,
    bracket: plain(api.getHomeSizeBracket(135))
  },
  'Essential pricing is shown for 120-149 m² homes'
);
assert.deepStrictEqual(
  plain(api.calcWidgetEstimate('deep', 135)),
  {
    amount: 632,
    price: '632 €',
    hours: 8,
    rate: 79,
    bracket: plain(api.getHomeSizeBracket(135))
  },
  'Deep cleaning pricing is shown as a one-time service for 120-149 m² homes'
);
assert.deepStrictEqual(
  plain(api.calcWidgetEstimate('office', 160)),
  {
    amount: 708,
    price: '708 €',
    hours: 12,
    rate: 59,
    bracket: plain(api.getHomeSizeBracket(160))
  },
  'Move-out pricing is shown as a one-time service for 150-180 m² homes'
);
assert.strictEqual(api.calcWidgetEstimate('home', 190), null, 'widget returns custom quote for sizes above 180 m²');

assert.match(indexHtml, /id="home-size-m2"/, 'homepage booking widget lets customers type exact m²');
assert.match(indexHtml, /id="widget-size-bracket"/, 'homepage widget displays the mapped size bracket');
assert.doesNotMatch(indexHtml, /onclick="selectSize\(this,'small'\)"/, 'homepage widget no longer uses fixed size buttons');
assert.match(indexHtml, /\.price-nowrap \{ white-space: nowrap; display: inline-block; \}/, 'service-card prices use a nowrap utility');
assert.match(indexHtml, /<span class="price-nowrap">49 €\/h<\/span>/, 'Essential service card shows 49 €/h as one unbroken price');
assert.match(indexHtml, /<span class="price-nowrap">79 €\/h<\/span>/, 'Deep service card shows 79 €/h as one unbroken price');
assert.match(indexHtml, /<span class="price-nowrap">59 €\/h<\/span>/, 'Move / Reset service card shows 59 €/h as one unbroken price');
assert.match(indexHtml, /href="request-quote\.html\?service=home"/, 'Essential CTA opens the home-cleaning quote path');
assert.match(indexHtml, /href="request-quote\.html\?service=deep"/, 'Deep Clean CTA opens the one-time deep-clean quote path');
assert.match(indexHtml, /href="request-quote\.html\?service=office"/, 'Move / Reset CTA opens the one-time move-out quote path');
assert.match(indexHtml, /Kotisiivous\s+-\s+alkaen <span class="price-nowrap">49 €\/h<\/span>/, 'homepage widget service option shows the Essential rate without wrapping');
assert.doesNotMatch(indexHtml, /€(49|59|79)\/h/, 'homepage service-card copy does not use prefix-euro hourly formatting');
assert.match(indexHtml, /function formatWidgetHourlyRate\(rate\)/, 'homepage widget formats the bottom display as an hourly rate');
assert.match(indexHtml, /priceEl\.textContent = formatWidgetHourlyRate\(est\.rate\)/, 'homepage widget bottom price value shows the selected hourly rate');
assert.match(indexHtml, /labelEl\.setAttribute\('data-en', 'Hourly rate'\)/, 'homepage widget labels the bottom price as an hourly rate');
assert.match(indexHtml, /hourlyRateLabel: currentEstimate \? formatWidgetHourlyRate\(currentEstimate\.rate\) : '-'/, 'homepage booking payload preserves the hourly rate separately');
assert.match(indexHtml, /estimatedPrice: currentEstimate \? currentEstimate\.price : document\.getElementById\('widget-price-display'\)\.textContent/, 'homepage booking payload preserves the estimated total separately');
assert.match(indexHtml, /One-time service/, 'homepage widget can label one-time services separately from recurring home care');
assert.match(indexHtml, /data-en="Custom quote recommended"/, 'homepage widget has a clear custom-quote state for very large homes');
assert.match(indexHtml, /window\.currentLang = lang;/, 'language switching updates the global language used by the booking widget');
assert.match(indexHtml, /\.service-opt\.selected/, 'service cards use a selected class instead of stale inline selected styling');
