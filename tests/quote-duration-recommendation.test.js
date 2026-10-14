const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requestQuoteHtml = fs.readFileSync(path.join(root, 'request-quote.html'), 'utf8');

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

const vm = require('vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'pricing.js'), 'utf8') + '\nthis.recommendations = Object.fromEntries(HOME_SIZE_BRACKETS.map(b => [b.key, b.hours.home]));', context);
const recommendations = JSON.parse(JSON.stringify(context.recommendations));

assert.deepStrictEqual(
  recommendations,
  {
    studio: 3,
    small: 3.5,
    medium: 4,
    large: 4.5,
    xlarge: 5,
    xxlarge: 5.5,
    xxxlarge: 7
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
  /durationLabel: getDurationDisplayLabel\(getTotalBookingHours\(\)\)/,
  'booking payload carries the same person-hour duration label as the UI'
);
