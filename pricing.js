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
  recurring:    57,   // Toistuvat kotisiivous
  oneTime:      65,   // Kertaluonteinen kotisiivous
  deep:         69,   // Syväsiivous / suursiivous
  moveOut:      69,   // Muuttosiivous
  window:       69,   // Ikkunanpesu
  postReno:     75,   // Remonttisiivous

  // ── After kotitalousvähennys (labour-only hourly rates) ────────────────
  recurringAfterTax:  37.05,
  oneTimeAfterTax:    42.25,
  deepAfterTax:       44.85,
  moveOutAfterTax:    44.85,
  windowAfterTax:     44.85,
  postRenoAfterTax:   48.75,

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
 * Booking widget helpers
 *
 * service values used by the widget:
 *   'home'   → recurring (57 €/h, min 2h)
 *   'deep'   → deep clean (69 €/h, min 3h)
 *   'office' → move-out (69 €/h, min 4h)
 *   'event'  → specialty (windows/steam/post-reno) → custom quote
 */

// Estimated hours per service x size combination
const BOOKING_HOURS = {
  home:   { studio: 2, small: 2, medium: 3, large: 4, xlarge: 5 },
  deep:   { studio: 3, small: 3, medium: 4, large: 5, xlarge: 6 },
  office: { studio: 4, small: 4, medium: 5, large: 6, xlarge: 8 },
};

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

/**
 * Calculate an estimated widget price.
 * Returns { price: string, hours: number } or null for custom-quote services.
 */
function calcWidgetEstimate(service, size) {
  if (!BOOKING_HOURS[service]) return null;   // 'event' → custom quote
  const hours = BOOKING_HOURS[service][size] ?? BOOKING_HOURS[service]['small'];
  const rate  = BOOKING_RATE[service];
  return { price: Math.round(rate * hours), hours };
}
