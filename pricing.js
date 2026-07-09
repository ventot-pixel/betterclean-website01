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
  windowApartmentMin:   119,
  windowApartmentMax:   159,
  windowHouseMin:       179,
  windowHouseMax:       229,
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
 * Commitment buys a lower rate. Weekly is the cheapest hour we sell on a
 * contract; a walk-in one-time clean pays the most.
 */
const HOME_RATE_BY_FREQUENCY = {
  weekly:   49,
  biweekly: 55,
  monthly:  59,   // every four weeks
  once:     PRICES.oneTime,
};

/**
 * The first visit is a longer reset clean. Weekly and bi-weekly customers are
 * billed for it at their own contract rate. Four-weekly customers pay the
 * one-time rate for that first visit, then drop to their contract rate.
 */
const RESET_VISIT_RATE_BY_FREQUENCY = {
  weekly:   HOME_RATE_BY_FREQUENCY.weekly,
  biweekly: HOME_RATE_BY_FREQUENCY.biweekly,
  monthly:  PRICES.oneTime,
  once:     PRICES.oneTime,
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
