/**
 * pricing.js — BetterClean canonical price constants
 *
 * SINGLE SOURCE OF TRUTH for all prices.
 * Update here first, then run:  node update-prices.mjs  (or grep manually)
 *
 * All prices include VAT 25.5%.
 * Kotitalousvähennys = 35% off labour, omavastuu 150 €/hlö/vuosi.
 */

const PRICES = {
  // ── Hourly service rates (€/h) ─────────────────────────────────────────
  recurring:    49,   // Essential "alkaen" rate. MUST equal HOME_RATE_BY_FREQUENCY.weekly
  oneTime:      69,   // Kertaluonteinen kotisiivous
  deep:         79,   // Signature syväsiivous / suursiivous (sis. höyrypesu)
  moveOut:      59,   // Muuttosiivous
  window:       49,   // Ikkunanpesu
  postReno:     79,   // Remonttisiivous

  // ── After kotitalousvähennys (labour-only hourly rates) ────────────────
  recurringAfterTax:  31.85,
  oneTimeAfterTax:    44.85,
  deepAfterTax:       51.35,
  moveOutAfterTax:    38.35,
  windowAfterTax:     31.85,
  postRenoAfterTax:   51.35,

  // ── Steam cleaning fixed prices (€) ───────────────────────────────────
  steamSingleMattress:  89,
  steamDoubleMattress:  129,
  steamSofa2Seat:       129,
  steamSofaExtraSeat:   35,
  steamArmchair:        89,
  steamBathroomSauna:   149,  // alkaen

  // ── Window cleaning estimates (€) ─────────────────────────────────────
  // Window job prices come from WINDOW_COUNT_BRACKETS x PRICES.window.
  // Do not add apartment/house estimate constants back: they drifted out of
  // sync with the hourly rate twice.
  windowBalconyAddon:   59,

  // ── Minimum booking hours ──────────────────────────────────────────────
  minRecurring: 2,
  minOneTime:   2,
  minDeep:      3,
  minMoveOut:   4,
  minWindow:    2,
  minPostReno:  4,
};

/**
 * Essential Home Care rate ladder (€/h, incl VAT).
 *
 * Commitment buys a cheaper hour, and that is the entire incentive. Every
 * visit bills at this rate, including the first one. A new customer's first
 * visit is longer, because the home has not been maintained yet, but it is
 * not dearer. There is deliberately no second rate table here.
 */
const HOME_RATE_BY_FREQUENCY = {
  weekly:   49,
  biweekly: 55,
  monthly:  59,   // every four weeks
  once:     PRICES.oneTime,
};

/**
 * Window cleaning is bookable on its own, at PRICES.window with a two-hour
 * minimum. Windows scale with how many there are, not with floor area, so the
 * booking form asks for a count rather than square metres.
 *
 * Beyond 24 windows we quote by hand instead of guessing.
 */
const WINDOW_COUNT_BRACKETS = [
  { key: 'win8',  min: 1,  max: 8,  hours: 2, labels: { en: 'Up to 8 windows', fi: 'Enintään 8 ikkunaa' } },
  { key: 'win16', min: 9,  max: 16, hours: 3, labels: { en: '9-16 windows',    fi: '9-16 ikkunaa' } },
  { key: 'win24', min: 17, max: 24, hours: 4, labels: { en: '17-24 windows',   fi: '17-24 ikkunaa' } },
];

function getWindowCountBracket(windowCount) {
  const value = Number(windowCount);
  if (!Number.isFinite(value) || value <= 0) return null;
  return WINDOW_COUNT_BRACKETS.find(b => value >= b.min && value <= b.max) || null;
}

// Fixed-euro window add-ons. Priced, never "confirmed in our reply".
const WINDOW_ADDON_PRICES = {
  balcony:    PRICES.windowBalconyAddon,  // glazed balcony
  highAccess: 50,                         // high or hard-to-reach windows, per visit
};

/**
 * Booking widget helpers
 *
 * service values used by the widget:
 *   'home'   → Essential (49 €/h)
 *   'deep'   → Deep clean (79 €/h)
 *   'office' → move-out (59 €/h, min 4h)
 *   'event'  → specialty (windows/steam/post-reno) → custom quote
 */

// Competitive package pricing by typed home size. Homes above this table need
// personal confirmation instead of an invented instant price.
const HOME_SIZE_BRACKETS = [
  {
    key: 'studio',
    min: 0,
    max: 39,
    labels: { en: 'Up to 39 m²', fi: 'Enintään 39 m²' },
    hours: { home: 2, deep: 3, office: 4 }
  },
  {
    key: 'small',
    min: 40,
    max: 59,
    labels: { en: '40-59 m²', fi: '40-59 m²' },
    hours: { home: 2.5, deep: 4, office: 5 }
  },
  {
    key: 'medium',
    min: 60,
    max: 79,
    labels: { en: '60-79 m²', fi: '60-79 m²' },
    hours: { home: 3, deep: 5, office: 6 }
  },
  {
    key: 'large',
    min: 80,
    max: 99,
    labels: { en: '80-99 m²', fi: '80-99 m²' },
    hours: { home: 3.5, deep: 6, office: 7 }
  },
  {
    key: 'xlarge',
    min: 100,
    max: 119,
    labels: { en: '100-119 m²', fi: '100-119 m²' },
    hours: { home: 4, deep: 7, office: 8 }
  },
  {
    key: 'xxlarge',
    min: 120,
    max: 149,
    labels: { en: '120-149 m²', fi: '120-149 m²' },
    hours: { home: 4.5, deep: 8, office: 9 }
  },
  {
    key: 'xxxlarge',
    min: 150,
    max: 180,
    labels: { en: '150-180 m²', fi: '150-180 m²' },
    hours: { home: 6, deep: 10, office: 12 }
  }
];

// Estimated hours per service x size combination, kept for older pages/scripts.
const BOOKING_HOURS = HOME_SIZE_BRACKETS.reduce((hours, bracket) => {
  hours.home[bracket.key] = bracket.hours.home;
  hours.deep[bracket.key] = bracket.hours.deep;
  hours.office[bracket.key] = bracket.hours.office;
  return hours;
}, { home: {}, deep: {}, office: {} });

// Hourly rate per widget service key
const BOOKING_RATE = {
  home:   PRICES.recurring,
  deep:   PRICES.deep,
  office: PRICES.moveOut,
};

/**
 * Format a Finnish-style price string.
 * formatPrice(37.05, 'h') → '37,05 €/h'
 * formatPrice(114)        → '114 €'
 */
function formatPrice(amount, suffix) {
  const str = amount % 1 === 0
    ? String(amount)
    : amount.toFixed(2).replace('.', ',');
  return str + ' €' + (suffix ? '/' + suffix : '');
}

function getHomeSizeBracket(squareMeters) {
  const value = Number(squareMeters);
  if (!Number.isFinite(value) || value <= 0) return null;
  return HOME_SIZE_BRACKETS.find(bracket => value >= bracket.min && value <= bracket.max) || null;
}

/**
 * Calculate an estimated widget price.
 * Returns { price: string, hours: number } or null for custom-quote services.
 */
function calcWidgetEstimate(service, size) {
  if (!BOOKING_HOURS[service]) return null;   // 'event' → custom quote
  const bracket = getHomeSizeBracket(size) || HOME_SIZE_BRACKETS.find(item => item.key === size);
  if (!bracket) return null;
  const hours = bracket.hours[service];
  if (!hours) return null;
  const rate  = BOOKING_RATE[service];
  const amount = rate * hours;
  return {
    amount,
    price: formatPrice(amount),
    hours,
    rate,
    bracket
  };
}
