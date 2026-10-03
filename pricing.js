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
  oneTime:      59,   // Kertaluonteinen kotisiivous
  deep:         79,   // Signature syväsiivous / suursiivous (sis. höyrypesu)
  moveOut:      59,   // Muuttosiivous
  window:       49,   // Ikkunanpesu
  postReno:     79,   // Remonttisiivous

  // ── Estimated costs after a 35% tax deduction, before the personal annual threshold ────────────
  recurringAfterTax:  31.85,
  oneTimeAfterTax:    38.35,
  deepAfterTax:       51.35,
  moveOutAfterTax:    38.35,
  windowAfterTax:     31.85,
  postRenoAfterTax:   51.35,

  // ── Steam cleaning fixed prices (€) ───────────────────────────────────
  steamSingleMattress:  89,
  steamDoubleMattress:  109,
  steamSofa2Seat:       89,
  steamSofaExtraSeat:   20,
  steamArmchair:        79,
  steamBathroomSauna:   149,  // alkaen

  // ── Window cleaning estimates (€) ─────────────────────────────────────
  // Window jobs are quoted at PRICES.window with a 2 h minimum. Do not add
  // apartment/house estimate constants back: they drifted out of sync with the
  // hourly rate twice, and both times the site advertised the wrong price.
  // Balcony glazing, blinds and difficult access are quoted separately.

  // ── Minimum booking hours ──────────────────────────────────────────────
  minRecurring: 2,
  minOneTime:   2,
  minDeep:      3,
  minMoveOut:   4,
  minWindow:    2,
  minWindowAddon: 1,
  minPostReno:  4,
};

/**
 * Essential Home Care rate ladder (€/h, incl VAT).
 *
 * Outside an explicitly defined promotion, commitment buys a cheaper hour,
 * and that is the entire incentive. Every visit bills at this rate. A new
 * customer's first visit is longer because the home has not been maintained
 * yet, but it is billed at the same hourly rate.
 */
const HOME_RATE_BY_FREQUENCY = {
  weekly:   49,
  biweekly: 52,
  monthly:  55,   // every four weeks
  once:     PRICES.oneTime,
};

/**
 * Window cleaning is quoted, not booked online. It bills at PRICES.window with
 * a two-hour minimum (so the smallest job is 98 €), but the number of windows
 * and their glass surfaces drive the real duration, and we do not guess at it.
 * See window-cleaning.html.
 */

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
    hours: { home: 3, deep: 3, office: 4 }
  },
  {
    key: 'small',
    min: 40,
    max: 59,
    labels: { en: '40-59 m²', fi: '40-59 m²' },
    hours: { home: 3.5, deep: 4, office: 5 }
  },
  {
    key: 'medium',
    min: 60,
    max: 79,
    labels: { en: '60-79 m²', fi: '60-79 m²' },
    hours: { home: 4, deep: 5, office: 6 }
  },
  {
    key: 'large',
    min: 80,
    max: 99,
    labels: { en: '80-99 m²', fi: '80-99 m²' },
    hours: { home: 4.5, deep: 6, office: 7 }
  },
  {
    key: 'xlarge',
    min: 100,
    max: 119,
    labels: { en: '100-119 m²', fi: '100-119 m²' },
    hours: { home: 5, deep: 7, office: 8 }
  },
  {
    key: 'xxlarge',
    min: 120,
    max: 149,
    labels: { en: '120-149 m²', fi: '120-149 m²' },
    hours: { home: 5.5, deep: 8, office: 9 }
  },
  {
    key: 'xxxlarge',
    min: 150,
    max: 180,
    labels: { en: '150-180 m²', fi: '150-180 m²' },
    hours: { home: 7, deep: 10, office: 12 }
  }
];

// Explicit maintenance durations in person-hours. First visits use bracket.hours.home.
const HOME_DURATION_BY_SIZE = {
  "studio": {
    "weekly": 2,
    "biweekly": 2.5,
    "monthly": 3,
    "once": 3
  },
  "small": {
    "weekly": 2.5,
    "biweekly": 3,
    "monthly": 3.5,
    "once": 3.5
  },
  "medium": {
    "weekly": 3,
    "biweekly": 3.5,
    "monthly": 4,
    "once": 4
  },
  "large": {
    "weekly": 3.5,
    "biweekly": 4,
    "monthly": 4.5,
    "once": 4.5
  },
  "xlarge": {
    "weekly": 4,
    "biweekly": 4.5,
    "monthly": 5,
    "once": 5
  },
  "xxlarge": {
    "weekly": 4.5,
    "biweekly": 5,
    "monthly": 5.5,
    "once": 5.5
  },
  "xxxlarge": {
    "weekly": 6,
    "biweekly": 6.5,
    "monthly": 7,
    "once": 7
  }
};

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

// Display catalogue: quoted ranges and units are intentional, not instant bookings.
const TEXTILE_RATE_CARD = {
  "Armchair / steam": {
    "fi": "79 €",
    "en": "79 €"
  },
  "Armchair / extraction": {
    "fi": "59 €",
    "en": "59 €"
  },
  "Two-seat sofa / steam": {
    "fi": "89 €",
    "en": "89 €"
  },
  "Two-seat sofa / extraction": {
    "fi": "69 €",
    "en": "69 €"
  },
  "Three-seat sofa / steam": {
    "fi": "109 €",
    "en": "109 €"
  },
  "Three-seat sofa / extraction": {
    "fi": "89 €",
    "en": "89 €"
  },
  "Four-seat sofa / steam": {
    "fi": "129 €",
    "en": "129 €"
  },
  "Four-seat sofa / extraction": {
    "fi": "109 €",
    "en": "109 €"
  },
  "Divan or small corner sofa / steam": {
    "fi": "Alkaen 159 €",
    "en": "From 159 €"
  },
  "Divan or small corner sofa / extraction": {
    "fi": "Alkaen 139 €",
    "en": "From 139 €"
  },
  "Large corner sofa, 5-6 seats / steam": {
    "fi": "Alkaen 199 €",
    "en": "From 199 €"
  },
  "Large corner sofa, 5-6 seats / extraction": {
    "fi": "Alkaen 169 €",
    "en": "From 169 €"
  },
  "Extra-large or modular sofa / steam": {
    "fi": "Alkaen 239 €",
    "en": "From 239 €"
  },
  "Extra-large or modular sofa / extraction": {
    "fi": "Alkaen 199 €",
    "en": "From 199 €"
  },
  "Small ottoman / steam": {
    "fi": "39 €",
    "en": "39 €"
  },
  "Small ottoman / extraction": {
    "fi": "29 €",
    "en": "29 €"
  },
  "Large ottoman / steam": {
    "fi": "49 €",
    "en": "49 €"
  },
  "Large ottoman / extraction": {
    "fi": "39 €",
    "en": "39 €"
  },
  "Dining chair, seat only / steam": {
    "fi": "19 €/kpl",
    "en": "19 € each"
  },
  "Dining chair, seat only / extraction": {
    "fi": "15 €/kpl",
    "en": "15 € each"
  },
  "Dining chair, seat and back / steam": {
    "fi": "27 €/kpl",
    "en": "27 € each"
  },
  "Dining chair, seat and back / extraction": {
    "fi": "22 €/kpl",
    "en": "22 € each"
  },
  "Office chair / steam": {
    "fi": "39 €/kpl",
    "en": "39 € each"
  },
  "Office chair / extraction": {
    "fi": "29 €/kpl",
    "en": "29 € each"
  },
  "Sofa-bed sleeping section / steam": {
    "fi": "+30 €",
    "en": "+30 €"
  },
  "Sofa-bed sleeping section / extraction": {
    "fi": "+20 €",
    "en": "+20 €"
  },
  "Single mattress, 80-90 cm / steam": {
    "fi": "89 €",
    "en": "89 €"
  },
  "Single mattress, 80-90 cm / extraction": {
    "fi": "69 €",
    "en": "69 €"
  },
  "Medium mattress, 120-140 cm / steam": {
    "fi": "99 €",
    "en": "99 €"
  },
  "Medium mattress, 120-140 cm / extraction": {
    "fi": "79 €",
    "en": "79 €"
  },
  "Double mattress, 160 cm / steam": {
    "fi": "109 €",
    "en": "109 €"
  },
  "Double mattress, 160 cm / extraction": {
    "fi": "89 €",
    "en": "89 €"
  },
  "King-size mattress, 180 cm / steam": {
    "fi": "119 €",
    "en": "119 €"
  },
  "King-size mattress, 180 cm / extraction": {
    "fi": "99 €",
    "en": "99 €"
  },
  "Mattress underside, single / steam": {
    "fi": "+30 €",
    "en": "+30 €"
  },
  "Mattress underside, single / extraction": {
    "fi": "+20 €",
    "en": "+20 €"
  },
  "Mattress underside, double / steam": {
    "fi": "+45 €",
    "en": "+45 €"
  },
  "Mattress underside, double / extraction": {
    "fi": "+30 €",
    "en": "+30 €"
  },
  "Upholstered single bed base / steam": {
    "fi": "Alkaen 109 €",
    "en": "From 109 €"
  },
  "Upholstered single bed base / extraction": {
    "fi": "Alkaen 89 €",
    "en": "From 89 €"
  },
  "Upholstered double bed base / steam": {
    "fi": "Alkaen 159 €",
    "en": "From 159 €"
  },
  "Upholstered double bed base / extraction": {
    "fi": "Alkaen 129 €",
    "en": "From 129 €"
  },
  "Upholstered headboard / steam": {
    "fi": "49-69 €",
    "en": "49-69 €"
  },
  "Upholstered headboard / extraction": {
    "fi": "39-59 €",
    "en": "39-59 €"
  },
  "Complete continental bed / steam": {
    "fi": "Alkaen 179 €",
    "en": "From 179 €"
  },
  "Complete continental bed / extraction": {
    "fi": "Alkaen 149 €",
    "en": "From 149 €"
  },
  "Synthetic flat or low-pile carpet / steam": {
    "fi": "12,90 €/m²",
    "en": "12.90 €/m²"
  },
  "Synthetic flat or low-pile carpet / extraction": {
    "fi": "9,90 €/m²",
    "en": "9.90 €/m²"
  },
  "Thick-pile or shaggy carpet / steam": {
    "fi": "18,90 €/m²",
    "en": "18.90 €/m²"
  },
  "Thick-pile or shaggy carpet / extraction": {
    "fi": "14,90 €/m²",
    "en": "14.90 €/m²"
  },
  "Heavily soiled carpet / steam": {
    "fi": "Alkaen 21,90 €/m²",
    "en": "From 21,90 €/m²"
  },
  "Heavily soiled carpet / extraction": {
    "fi": "Alkaen 17,90 €/m²",
    "en": "From 17,90 €/m²"
  },
  "Wall-to-wall carpet / steam": {
    "fi": "Alkaen 11,90 €/m²",
    "en": "From 11,90 €/m²"
  },
  "Wall-to-wall carpet / extraction": {
    "fi": "Alkaen 8,90 €/m²",
    "en": "From 8,90 €/m²"
  },
  "Special stain treatment / steam": {
    "fi": "+15-35 €",
    "en": "+15-35 €"
  },
  "Special stain treatment / extraction": {
    "fi": "+10-25 €",
    "en": "+10-25 €"
  },
  "Pet accident or odour treatment / steam": {
    "fi": "Alkaen 30 €",
    "en": "From 30 €"
  },
  "Pet accident or odour treatment / extraction": {
    "fi": "Alkaen 20 €",
    "en": "From 20 €"
  }
};
const TEXTILE_BUNDLE = { doubleMattress: 89, sofa3Seat: 89, price: 149 };

// Fixed add-ons to an existing cleaning visit; separate visits need a quote.
const ADDON_PRICES = { freezer: 40, dishwasher: 30, balconyTerrace: 70, cabinetUnit: 25, allergyUpgrade: 60 };
const TEXTILE_TERMS = { minimumVisit: 69, nearbyTravelFrom: 15, protectorMattressArmchair: 29, protectorSmallSofa: 39, protectorLargeSofa: 59, urgentPercent: 20 };
const NEIGHBOUR_PROMOTION = {
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
};

// Extra person-hours, billed at the booked service rate. Windows are quoted separately.
const ADDON_HOURS = Object.freeze({ oven: 1, fridge: 1, hood: 0.5, microwave: 0.25, sauna: 1 });
