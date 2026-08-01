const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requestQuoteHtml = fs.readFileSync(path.join(root, 'request-quote.html'), 'utf8');
const neighborHtml = fs.readFileSync(path.join(root, 'naapurietu.html'), 'utf8');

function extractObject(name) {
  const match = requestQuoteHtml.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n  \\};`));
  assert(match, `${name} is defined`);
  return Function(`"use strict"; return ({${match[1]}});`)();
}

function extractBookingStateValue(key) {
  const bookingStateMatch = requestQuoteHtml.match(/const bookingState = \{([\s\S]*?)\n  \};/);
  assert(bookingStateMatch, 'bookingState is defined');
  const match = bookingStateMatch[1].match(new RegExp(`\\b${key}:\\s*([^,\\n]+)`));
  assert(match, `bookingState has ${key}`);
  const rawValue = match[1].trim();
  if (/^\d+$/.test(rawValue)) return Number(rawValue);
  if (rawValue === "''") return '';
  if (rawValue === 'null') return null;
  return rawValue.replace(/^['"]|['"]$/g, '');
}

const recommendations = extractObject('RECOMMENDED_DURATION_BY_SIZE');

assert.deepStrictEqual(
  recommendations,
  {
    studio: 2,
    small: 2.5,
    medium: 3,
    large: 3.5,
    xlarge: 4,
    xxlarge: 4.5,
    xxxlarge: 6
  },
  'quote form uses the competitive Essential duration recommendations by size bracket through 180 m²'
);

assert.strictEqual(
  extractBookingStateValue('selectedFrequency'),
  '',
  'quote form starts without a selected frequency'
);

assert.strictEqual(
  extractBookingStateValue('selectedPropertySize'),
  '',
  'quote form starts without a selected apartment size'
);

assert.strictEqual(
  extractBookingStateValue('duration'),
  0,
  'quote form starts without a selected duration'
);

assert.match(
  requestQuoteHtml,
  /id="cleanDuration" onchange="handleDurationChange\(\)" aria-describedby="durationPersonHoursHelp durationWarning" disabled><\/select>/,
  'duration selector starts disabled until frequency and home size are selected'
);

assert.match(
  requestQuoteHtml,
  /<input id="homeSize" type="number" min="1" max="300" inputmode="decimal" onchange="handleHomeSizeChange\(\)" oninput="handleHomeSizeChange\(\)" aria-describedby="homeSizeBracketHelp" disabled \/>/,
  'booking home-size field lets customers enter exact square meters'
);

assert.match(
  requestQuoteHtml,
  /id="homeSizeBracketHelp"/,
  'booking form keeps accessible helper text for typed square meters without exposing bracket mapping'
);

assert.match(
  requestQuoteHtml,
  /<option value="over-180" data-en="Over 180 m²" data-fi="Yli 180 m²">/,
  'inquiry home-size selector keeps apartment size separate from the duration recommendation'
);

assert.match(
  requestQuoteHtml,
  /durationLabel: getDurationDisplayLabel\(bookingState\.selectedDuration\)/,
  'booking payload carries the same person-hour duration label as the UI'
);

const neighborRecommendations = (() => {
  const match = neighborHtml.match(/const NEIGHBOR_VISIT_RECOMMENDATIONS = \{([\s\S]*?)\n  \};/);
  assert(match, 'neighbor page visit recommendations are defined');
  return Function(`"use strict"; return ({${match[1]}});`)();
})();

assert.deepStrictEqual(
  neighborRecommendations,
  {
    'under-40': '3h+',
    '40-59': '4h+',
    '60-79': '4h+',
    '80-99': '5h+',
    '100-119': '5h+',
    '120-149': '6h+',
    '150-180': '7h+',
    'over-180': '8h+'
  },
  'neighbor page uses the same recommended visit-length buckets'
);

assert.match(
  neighborHtml,
  /<option value="120-149" data-en="120-149 m²" data-fi="120-149 m²">/,
  'neighbor page home-size selector keeps apartment size separate from the duration recommendation'
);
