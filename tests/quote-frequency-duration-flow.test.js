const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const requestQuoteHtml = fs.readFileSync(path.join(root, 'request-quote.html'), 'utf8');

// Load the real rate tables rather than restating them in this file.
const REAL_PRICING = (() => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(path.join(root, 'pricing.js'), 'utf8') +
      '\nthis.__p = { PRICES, HOME_RATE_BY_FREQUENCY, RESET_VISIT_RATE_BY_FREQUENCY };',
    ctx
  );
  return ctx.__p;
})();

function countOccurrences(needle) {
  return (requestQuoteHtml.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
}

function extractMainScript() {
  const match = requestQuoteHtml.match(/<script>\s*\n\s*let currentLang = 'fi';([\s\S]*?)<\/script>/);
  assert(match, 'request quote main script is present');
  return "let currentLang = 'fi';" + match[1];
}

function createClassList() {
  const values = new Set();
  return {
    add(name) { values.add(name); },
    remove(name) { values.delete(name); },
    contains(name) { return values.has(name); },
    toggle(name, force) {
      if (force === undefined) {
        if (values.has(name)) values.delete(name);
        else values.add(name);
      } else if (force) {
        values.add(name);
      } else {
        values.delete(name);
      }
      return values.has(name);
    }
  };
}

function createElement(id) {
  const attributes = {};
  return {
    id,
    value: '',
    textContent: '',
    innerText: '',
    checked: false,
    disabled: false,
    hidden: false,
    style: {},
    dataset: {},
    options: [],
    selectedIndex: 0,
    classList: createClassList(),
    setAttribute(name, value) { attributes[name] = String(value); },
    getAttribute(name) { return attributes[name]; },
    removeAttribute(name) { delete attributes[name]; },
    addEventListener() {},
    querySelector() { return createElement(id + '-child'); }
  };
}

function createSelect(id, values, selectedValue) {
  const select = createElement(id);
  select.options = values.map((value, index) => ({
    value,
    textContent: value,
    selected: value === selectedValue || (!selectedValue && index === 0)
  }));
  let internalValue = selectedValue || values[0] || '';
  select.selectedIndex = Math.max(0, select.options.findIndex(option => option.value === internalValue));
  Object.defineProperty(select, 'value', {
    get() {
      return internalValue;
    },
    set(value) {
      internalValue = String(value);
      const index = select.options.findIndex(option => option.value === internalValue);
      select.selectedIndex = index >= 0 ? index : -1;
      select.options.forEach((option, optionIndex) => {
        option.selected = optionIndex === select.selectedIndex;
      });
    }
  });
  Object.defineProperty(select, 'selectedOptions', {
    get() {
      return select.options[select.selectedIndex] ? [select.options[select.selectedIndex]] : [];
    }
  });
  Object.defineProperty(select, 'innerHTML', {
    get() {
      return select.options.map(option => option.textContent).join('');
    },
    set() {
      select.options = [];
      select.selectedIndex = -1;
      internalValue = '';
    }
  });
  select.appendChild = option => {
    select.options.push(option);
    if (option.selected || !internalValue) select.value = option.value;
    return option;
  };
  return select;
}

const HOME_SIZE_BRACKETS = [
  { key: 'studio', min: 0, max: 39, labels: { en: 'Up to 39 m²', fi: 'Enintään 39 m²' } },
  { key: 'small', min: 40, max: 59, labels: { en: '40-59 m²', fi: '40-59 m²' } },
  { key: 'medium', min: 60, max: 79, labels: { en: '60-79 m²', fi: '60-79 m²' } },
  { key: 'large', min: 80, max: 99, labels: { en: '80-99 m²', fi: '80-99 m²' } },
  { key: 'xlarge', min: 100, max: 119, labels: { en: '100-119 m²', fi: '100-119 m²' } },
  { key: 'xxlarge', min: 120, max: 149, labels: { en: '120-149 m²', fi: '120-149 m²' } },
  { key: 'xxxlarge', min: 150, max: 180, labels: { en: '150-180 m²', fi: '150-180 m²' } }
];

function getHomeSizeBracket(squareMeters) {
  const value = Number(squareMeters);
  if (!Number.isFinite(value) || value <= 0) return null;
  return HOME_SIZE_BRACKETS.find(bracket => value >= bracket.min && value <= bracket.max) || null;
}

function createDocumentStub() {
  const elements = new Map();
  const add = element => {
    elements.set(element.id, element);
    return element;
  };

  add(createElement('homeSize'));
  add(createSelect('cleanDuration', [], ''));
  add(createSelect('inqContactMethod', ['Phone', 'Email'], 'Phone'));

  [
    'bookingServiceOptions',
    'service-home',
    'service-deep',
    'service-office',
    'frequencySection',
    'frequencyOptions',
    'homeSizePanel',
    'durationPanel',
    'durationRecommendation',
    'firstVisitRecommendation',
    'ongoingVisitRecommendation',
    'oneTimeRecommendation',
    'recurringExplanation',
    'recurringPlanNote',
    'durationWarning',
    'durationRecommendedLabel',
    'bookingStep1Continue',
    'pricingReviewLink',
    'bookingPanel',
    'inquiryPanel',
    'bookingModeBtn',
    'inquiryModeBtn',
    'progressBar',
    'bookingStep1',
    'bookingStep2',
    'bookingStep3',
    'freq-weekly',
    'freq-biweekly',
    'freq-monthly',
    'freq-once',
    'extra-fridge',
    'extra-oven',
    'extra-sauna',
    'streetAddress',
    'postcode',
    'petsHome',
    'summaryTitle',
    'summaryMode',
    'summaryService',
    'summaryDuration',
    'summaryFrequency',
    'summaryExtras',
    'summaryEstimate',
    'summaryEstimateAfterDeduction',
    'saunaOfferNote',
    'summaryInquiryContact',
    'inqArea',
    'summaryInquiryArea'
  ].forEach(id => add(createElement(id)));

  return {
    documentElement: { lang: 'fi' },
    getElementById(id) {
      if (!elements.has(id)) add(createElement(id));
      return elements.get(id);
    },
    createElement(tagName) {
      const element = createElement(tagName);
      element.tagName = tagName.toUpperCase();
      return element;
    },
    querySelectorAll(selector) {
      if (selector === '.lang-btn') return [];
      if (selector === '[data-en]') return [];
      if (selector === '.booking-only') return [];
      if (selector === '.inquiry-only') return [];
      if (selector === '.progress-pill') return [];
      if (selector === '.slot-btn') return [];
      return [];
    }
  };
}

function loadQuoteFormApi() {
  const document = createDocumentStub();
  const context = {
    document,
    window: { location: { href: '', search: '' } },
    sessionStorage: { getItem() { return null; }, setItem() {} },
    // Real values from pricing.js. Never restate rates here: a second copy of
    // the price table is exactly how 49/59/79/59 outlived the real ladder.
    PRICES: REAL_PRICING.PRICES,
    HOME_RATE_BY_FREQUENCY: REAL_PRICING.HOME_RATE_BY_FREQUENCY,
    RESET_VISIT_RATE_BY_FREQUENCY: REAL_PRICING.RESET_VISIT_RATE_BY_FREQUENCY,
    URLSearchParams,
    console
  };
  context.HOME_SIZE_BRACKETS = HOME_SIZE_BRACKETS;
  context.getHomeSizeBracket = getHomeSizeBracket;
  context.window.document = document;
  vm.createContext(context);
  vm.runInContext(
    extractMainScript() + `
      window.__durationTestApi = {
        bookingState,
        HOUSEHOLD_DEDUCTION_RATE,
        DURATION_RECOMMENDATION_RULES,
        calculateDurationRecommendation,
        calculateEstimate,
        calculateEstimateAfterHouseholdDeduction,
        getQuoteHomeSizeBracket,
        getCleaningDurationRecommendation,
        getBookingServiceConfig,
        selectBookingService,
        selectFrequency,
        handleHomeSizeChange,
        handleDurationChange,
        refreshUi
      };
    `,
    context
  );
  return { api: context.window.__durationTestApi, document };
}

assert.strictEqual(countOccurrences('id="homeSize"'), 1, 'request form has a single home-size field');
assert.strictEqual(countOccurrences('id="cleanDuration"'), 1, 'request form has a single duration field');

const frequencyIndex = requestQuoteHtml.indexOf('id="frequencyOptions"');
const serviceIndex = requestQuoteHtml.indexOf('id="bookingServiceOptions"');
const sizeIndex = requestQuoteHtml.indexOf('id="homeSize"');
const durationIndex = requestQuoteHtml.indexOf('id="cleanDuration"');
assert(serviceIndex > -1, 'booking setup has a service selector');
assert(frequencyIndex > -1, 'frequency options have a stable wrapper');
assert(serviceIndex < frequencyIndex, 'service selection appears before frequency options');
assert(frequencyIndex < sizeIndex, 'frequency selection appears before apartment size');
assert(sizeIndex < durationIndex, 'apartment size appears before duration');

assert.match(requestQuoteHtml, /role="radiogroup"/, 'frequency choices use radio-group semantics');
assert.match(requestQuoteHtml, /role="radio"/, 'frequency cards expose radio semantics');
assert.match(requestQuoteHtml, /handleFrequencyKeydown/, 'frequency cards support keyboard arrow navigation');
assert.doesNotMatch(
  requestQuoteHtml,
  /id="service-home"(?:(?!<\/button>)[\s\S])*<span class="frequency-check"/,
  'selected service card does not render a visible dot indicator'
);
assert.doesNotMatch(
  requestQuoteHtml,
  /id="service-deep"(?:(?!<\/button>)[\s\S])*<span class="frequency-check"/,
  'Deep service card does not render a visible dot indicator'
);
assert.doesNotMatch(
  requestQuoteHtml,
  /id="service-office"(?:(?!<\/button>)[\s\S])*<span class="frequency-check"/,
  'Move / Reset service card does not render a visible dot indicator'
);
assert.match(
  requestQuoteHtml,
  /\.choice-card\.active \{ border-color: rgba\(36,122,36,0\.55\); background:/,
  'selected cards remain visibly selected with border and background styling'
);
assert.match(
  requestQuoteHtml,
  /id="homeSize" type="number"/,
  'home-size field accepts exact square meters'
);
assert.match(
  requestQuoteHtml,
  /id="homeSizeBracketHelp"/,
  'home-size field keeps accessible helper text'
);
assert.doesNotMatch(
  requestQuoteHtml,
  /m² →/,
  'home-size helper does not expose internal size-bracket mapping to customers'
);
assert.match(
  requestQuoteHtml,
  /\.duration-setup-grid[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
  'duration section centers the top two fields in a balanced grid'
);
assert.match(
  requestQuoteHtml,
  /\.duration-setup-grid[\s\S]*max-width: 820px/,
  'duration field group has a centered max-width container'
);
assert.match(
  requestQuoteHtml,
  /\.duration-setup-grid[\s\S]*margin-left: auto;[\s\S]*margin-right: auto;/,
  'duration field group is centered within the form section'
);
assert.match(
  requestQuoteHtml,
  /\.duration-field input,\s*\.duration-field select \{[\s\S]*text-align: center;/,
  'apartment-size and duration field values are horizontally centered'
);
assert.match(
  requestQuoteHtml,
  /\.duration-field select \{[\s\S]*text-align-last: center;/,
  'duration dropdown selected text is centered while preserving the native arrow'
);
assert.match(
  requestQuoteHtml,
  /data-en="Recommended Duration"/,
  'duration field label uses the shorter requested text'
);
assert(!requestQuoteHtml.includes('id="durationRecommendedLabel"'), 'duration label does not include a redundant recommended badge');
assert(!requestQuoteHtml.includes(' (Recommended)'), 'duration dropdown labels do not append Recommended');
assert(!requestQuoteHtml.includes(' (suositus)'), 'duration dropdown labels do not append suositus');
assert.match(
  requestQuoteHtml,
  /id="durationPersonHoursHelp"[\s\S]*class="field-help duration-helper duration-grid-span"/,
  'person-hours helper spans the full duration grid'
);
assert.match(
  requestQuoteHtml,
  /id="recurringExplanation"[\s\S]*class="duration-recommendation recurring-explanation-callout duration-grid-span"/,
  'recurring explanation is a full-width callout'
);
assert.match(
  requestQuoteHtml,
  /class="recommendation-grid duration-grid-span"/,
  'recommendation cards span the full duration grid'
);
assert.match(
  requestQuoteHtml,
  /recommendationGrid\.hidden = !\(hasRecommendation && isRecurring\)/,
  'one-time flow hides the redundant lower recommendation card grid'
);
assert.match(
  requestQuoteHtml,
  /id="summaryEstimateAfterDeduction"/,
  'summary shows the estimated price after the 35% household deduction'
);
assert.match(
  requestQuoteHtml,
  /const HOUSEHOLD_DEDUCTION_RATE = 0\.35/,
  'household deduction rate is stored in one named constant'
);
assert.match(
  requestQuoteHtml,
  /New recurring customers begin with an initial reset visit\. Once the home reaches a consistent maintenance level, future visits can usually be shorter\./,
  'recurring reset explanation is present'
);
assert.match(
  requestQuoteHtml,
  /This is shorter than our recommendation\. We will follow the same cleaning checklist, but some lower-priority tasks may need to be left for a future visit\./,
  'manual duration warning avoids overpromising full checklist completion'
);
assert.match(
  requestQuoteHtml,
  /\.price-nowrap \{ white-space: nowrap; display: inline-block; \}/,
  'quote-page service prices use a nowrap utility'
);
assert.match(
  requestQuoteHtml,
  /service-home-desc[\s\S]*<span class="price-nowrap">49 €\/h<\/span>/,
  'quote-page Essential service card shows 49 €/h as one unbroken price'
);
assert.match(
  requestQuoteHtml,
  /service-deep-desc[\s\S]*<span class="price-nowrap">79 €\/h<\/span>/,
  'quote-page Deep service card shows 79 €/h as one unbroken price'
);
assert.match(
  requestQuoteHtml,
  /service-office-desc[\s\S]*<span class="price-nowrap">59 €\/h<\/span>/,
  'quote-page Move / Reset service card shows 59 €/h as one unbroken price'
);
assert.doesNotMatch(
  requestQuoteHtml,
  /alkaen (49|59|69) €\/h/,
  'quote-page service-card copy does not use the old wrapping-prone Finnish price format'
);
assert.doesNotMatch(
  requestQuoteHtml,
  /from (49|59|69) €\/h/,
  'quote-page service-card copy does not use the old wrapping-prone English price format'
);

const { api, document } = loadQuoteFormApi();

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(api.DURATION_RECOMMENDATION_RULES.frequencyMultipliers)),
  {
    once: 1,
    monthly: 0.9,
    biweekly: 0.8,
    weekly: 0.7
  },
  'duration multipliers are kept in one named configuration object'
);
assert.strictEqual(api.DURATION_RECOMMENDATION_RULES.minimumPersonHours, 2, 'duration minimum is two person-hours');
assert.strictEqual(api.DURATION_RECOMMENDATION_RULES.durationStep, 0.5, 'manual duration step is half a person-hour');
assert.strictEqual(api.HOUSEHOLD_DEDUCTION_RATE, 0.35, 'household deduction rate is 35%');
assert.strictEqual(api.DURATION_RECOMMENDATION_RULES.maximumSelectablePersonHours >= 12, true, 'manual duration dropdown supports the largest move-out recommendation');
assert.strictEqual(api.getQuoteHomeSizeBracket(72).key, 'medium', 'typed 72 m² maps to the 60-79 m² bracket');
assert.strictEqual(api.getQuoteHomeSizeBracket(130).key, 'xxlarge', 'typed 130 m² maps to the 120-149 m² bracket');
assert.strictEqual(api.getQuoteHomeSizeBracket(160).key, 'xxxlarge', 'typed 160 m² maps to the 150-180 m² bracket');
assert.strictEqual(api.getQuoteHomeSizeBracket(190), null, 'homes above 180 m² require custom confirmation');

assert.strictEqual(api.calculateDurationRecommendation(4, 'once'), 4, 'one-time visits use the full baseline');
assert.strictEqual(api.calculateDurationRecommendation(6, 'monthly'), 5.5, 'every-four-weeks visits round up to the next half-hour');
assert.strictEqual(api.calculateDurationRecommendation(4, 'biweekly'), 3.5, 'every-second-week visits apply the 80% multiplier');
assert.strictEqual(api.calculateDurationRecommendation(4, 'weekly'), 3, 'weekly visits apply the 70% multiplier');
assert.strictEqual(api.calculateDurationRecommendation(2.1, 'weekly'), 2, 'recommendations never fall below two person-hours');

assert.strictEqual(api.bookingState.selectedFrequency, '', 'frequency starts unselected');
assert.strictEqual(api.bookingState.selectedPropertySize, '', 'property size starts unselected');
assert.strictEqual(api.bookingState.selectedServiceType, 'home', 'booking service starts as Essential home cleaning');
assert.strictEqual(document.getElementById('homeSize').disabled, true, 'property size is disabled until frequency is selected');
assert.strictEqual(document.getElementById('cleanDuration').disabled, true, 'duration is disabled until frequency and size are selected');

api.selectBookingService('deep');
assert.strictEqual(api.bookingState.selectedServiceType, 'deep', 'Deep Clean updates selectedServiceType');
assert.strictEqual(api.bookingState.selectedFrequency, 'once', 'Deep Clean is forced to one-time frequency');
assert.strictEqual(document.getElementById('frequencySection').style.display, 'none', 'Deep Clean hides recurring frequency options');
assert.strictEqual(document.getElementById('homeSize').disabled, false, 'one-time service enables property size without a frequency choice');
document.getElementById('homeSize').value = '135';
api.handleHomeSizeChange();
assert.strictEqual(api.bookingState.selectedPropertySize, 'xxlarge', 'Deep Clean maps typed m² to the same size brackets');
assert.strictEqual(api.bookingState.baselinePersonHours, 8, 'Deep Clean uses its service-specific duration baseline');
assert.strictEqual(api.bookingState.selectedDuration, 8, 'Deep Clean defaults to its one-time recommendation');
assert.strictEqual(api.calculateEstimate(), 632, 'Deep Clean estimate uses 8 hours at 79 €/h');
assert.strictEqual(document.getElementById('recommendationGrid').hidden, true, 'Deep Clean hides the lower redundant one-time recommendation grid');
assert.strictEqual(document.getElementById('oneTimeRecommendation').hidden, true, 'Deep Clean hides the redundant one-time recommendation card');
assert.strictEqual(document.getElementById('firstVisitRecommendation').hidden, true, 'Deep Clean does not show recurring first-visit cards');
assert.strictEqual(document.getElementById('ongoingVisitRecommendation').hidden, true, 'Deep Clean does not show recurring ongoing cards');

api.selectBookingService('office');
assert.strictEqual(api.bookingState.selectedServiceType, 'office', 'Move / Reset updates selectedServiceType');
assert.strictEqual(api.bookingState.selectedFrequency, 'once', 'Move / Reset is forced to one-time frequency');
document.getElementById('homeSize').value = '160';
api.handleHomeSizeChange();
assert.strictEqual(api.bookingState.selectedPropertySize, 'xxxlarge', 'Move / Reset supports the 150-180 m² bracket');
assert.strictEqual(api.bookingState.baselinePersonHours, 12, 'Move / Reset uses its service-specific duration baseline');
assert.strictEqual(api.bookingState.selectedDuration, 12, 'Move / Reset can select the 12 person-hour recommendation');
assert.strictEqual(document.getElementById('cleanDuration').value, '12', 'duration dropdown includes the 12 person-hour move-out recommendation');
assert.strictEqual(api.calculateEstimate(), 708, 'Move / Reset estimate uses 12 hours at 59 €/h');
assert.strictEqual(document.getElementById('recommendationGrid').hidden, true, 'Move / Reset also hides the lower redundant one-time recommendation grid');

api.selectBookingService('home');
assert.strictEqual(api.bookingState.selectedServiceType, 'home', 'Essential service can be reselected');
assert.strictEqual(api.bookingState.selectedFrequency, '', 'Essential clears the forced one-time frequency');
assert.strictEqual(document.getElementById('frequencySection').style.display, '', 'Essential shows recurring frequency options again');
assert.strictEqual(document.getElementById('homeSize').disabled, true, 'Essential requires frequency before home size again');

api.selectFrequency('weekly');
assert.strictEqual(api.bookingState.selectedFrequency, 'weekly', 'selecting a frequency updates selectedFrequency');
assert.strictEqual(document.getElementById('homeSize').disabled, false, 'property size is enabled after frequency selection');

document.getElementById('homeSize').value = '72';
api.handleHomeSizeChange();
assert.strictEqual(api.bookingState.homeSizeM2, 72, 'typed square meters are stored separately');
assert.strictEqual(api.bookingState.selectedPropertySize, 'medium', 'typed square meters update selectedPropertySize through the pricing bracket');
assert.strictEqual(api.bookingState.baselinePersonHours, 3, 'baseline person-hours use the mapped size bracket');
assert.strictEqual(api.bookingState.recommendedFirstVisitHours, 3, 'recurring first visit uses the full baseline');
assert.strictEqual(api.bookingState.recommendedOngoingHours, 2.5, 'ongoing weekly visits use the adjusted recommendation');
assert.strictEqual(api.bookingState.selectedDuration, 3, 'recurring duration defaults to the first-visit recommendation');
assert.strictEqual(document.getElementById('cleanDuration').value, '3', 'duration select is reset to the recommendation');
api.refreshUi();
assert.strictEqual(document.getElementById('homeSizeBracketHelp').hidden, true, 'valid typed home sizes hide the internal size-bracket helper');
assert.strictEqual(document.getElementById('homeSizeBracketHelp').textContent, '', 'valid typed home sizes do not show the size-bracket mapping text');
assert.strictEqual(api.calculateEstimate(), 147, 'estimate uses the new recurring hourly price');
assert.strictEqual(
  api.calculateEstimateAfterHouseholdDeduction(),
  95.55,
  'discounted estimate applies the 35% household deduction'
);
assert.strictEqual(document.getElementById('summaryEstimate').textContent, '147 €', 'summary shows the full estimated total');
assert.strictEqual(
  document.getElementById('summaryEstimateAfterDeduction').textContent,
  '95,55 €',
  'summary shows the price after the 35% household deduction'
);
assert.strictEqual(document.getElementById('recommendationGrid').hidden, false, 'recurring bookings keep the useful recommendation card grid');
assert.strictEqual(document.getElementById('firstVisitRecommendation').hidden, false, 'recurring bookings keep the first-visit recommendation card');
assert.strictEqual(document.getElementById('ongoingVisitRecommendation').hidden, false, 'recurring bookings keep the ongoing-visits recommendation card');

document.getElementById('cleanDuration').value = '2.5';
api.handleDurationChange();
assert.strictEqual(api.bookingState.durationWasManuallyChanged, true, 'manual duration changes are tracked');
assert.strictEqual(api.bookingState.selectedDuration, 2.5, 'manual duration updates selectedDuration');
assert.strictEqual(document.getElementById('durationWarning').hidden, false, 'shorter-than-recommended durations show a warning');

api.selectFrequency('biweekly');
assert.strictEqual(api.bookingState.durationWasManuallyChanged, false, 'frequency changes reset manual duration state');
assert.strictEqual(api.bookingState.recommendedOngoingHours, 2.5, 'frequency changes recalculate the ongoing recommendation');
assert.strictEqual(api.bookingState.selectedDuration, 3, 'frequency changes reset selectedDuration to the new recommendation');

document.getElementById('homeSize').value = '88';
api.handleHomeSizeChange();
assert.strictEqual(api.bookingState.selectedPropertySize, 'large', 'size changes remap the pricing bracket');
assert.strictEqual(api.bookingState.baselinePersonHours, 3.5, 'size changes recalculate the baseline');
assert.strictEqual(api.bookingState.recommendedOngoingHours, 3, 'size changes recalculate the frequency-adjusted recommendation');
assert.strictEqual(api.bookingState.selectedDuration, 3.5, 'size changes reset selectedDuration to the new first-visit recommendation');

document.getElementById('homeSize').value = '135';
api.handleHomeSizeChange();
assert.strictEqual(api.bookingState.selectedPropertySize, 'xxlarge', '120-149 m² homes use the extended pricing bracket');
assert.strictEqual(api.bookingState.baselinePersonHours, 4.5, '120-149 m² homes use the extended Essential duration baseline');
assert.strictEqual(api.bookingState.recommendedOngoingHours, 4, 'extended recurring recommendations still round up to the next half-hour');
assert.strictEqual(api.bookingState.selectedDuration, 4.5, 'extended size changes reset selectedDuration to the new first-visit recommendation');

document.getElementById('homeSize').value = '190';
api.handleHomeSizeChange();
assert.strictEqual(api.bookingState.selectedPropertySize, '', 'homes above 180 m² are not forced into an invented bracket');
assert.strictEqual(api.bookingState.selectedDuration, null, 'homes above 180 m² do not get an invented booking duration');
assert.strictEqual(document.getElementById('homeSizeBracketHelp').hidden, false, 'custom-size homes still show the custom-estimate helper');
