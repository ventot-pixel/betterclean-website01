# BetterClean Pricing Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make weekly and bi-weekly visibly different to a customer, remove the expiring promo clutter around the reset visit, and make `pricing.js` the only place a price is defined.

**Architecture:** No rate changes. The rates stay 49 / 59 / 79 €/h. Weekly and bi-weekly are identical today because the page prices only the *reset visit* (which is frequency-independent by design) and never shows what the customer actually pays per month. We fix it by displaying per-visit cost and monthly cost, both of which already differ. A guard test then locks every price string in the site to `pricing.js`.

**Tech Stack:** Static HTML5, vanilla JS, Tailwind via CDN, no build step. Tests are plain `node` + `assert`, run by `npm test`. Dev server `node serve.mjs` on `http://localhost:3000`. Screenshots via `node screenshot.mjs <url> <label>`.

## Global Constraints

Copied verbatim from `CLAUDE.md`. Every task's requirements implicitly include this section.

- **Never use en dashes (–) or em dashes (—) anywhere** — in visible text, HTML attributes, `data-en`/`data-fi` values, JSON-LD strings, `<title>`, or `<meta>`. Use ` - ` for a pause and `-` for ranges.
- **Every user-facing string must exist in both Finnish and English**, via `data-en="..."` and `data-fi="..."`. Finnish is primary; pages initialise with `setLang('fi')`. Never add English-only content.
- **Price format is Finnish:** `49 €/h`, `31,85 €/h`, `122,50 €`. Never `€49/h`, never `45.50`.
- **Canonical rates (source of truth is `pricing.js`):** recurring 49, one-time 59, deep 79, move-out 59, window 49, post-renovation 79. Household deduction is 35% of labour.
- **Never remove or alter JSON-LD structured data blocks.**
- **Never use `transition-all`.** Only animate `transform` and `opacity`.
- **Brand tokens are fixed** and defined in `:root {}`. Do not add or override them.
- **Create a git save point before starting:** `git add -A && git commit -m "Save point before pricing clarity work"`.
- **Serve on localhost, never screenshot a `file:///` URL.** If the server is already running, do not start a second instance.
- Do not add sections, features, or content beyond what this plan specifies.

## Decisions Already Made

- **The 45 / 49 / 55 / 59 commitment rate ladder is OUT OF SCOPE.** Ven took it off the table. Rates stay flat.
- **The reset visit is not a promotion.** A recurring customer's rate is 49 €/h. Their first visit is longer because it is a reset. It is billed at their rate. There is no expiry date, no customer cap, and no struck-through comparison.
- **`update-prices.mjs` is NOT being built.** Investigation showed the live pages have never drifted from `pricing.js` — only docs and collateral did. A propagation tool would need ~132 price strings hand-marked first, and would defend the one place that is already correct. A guard test catches the drift that actually happens, at a fraction of the cost.

## Consequences You Must Accept

These are true under flat pricing and no amount of code fixes them:

1. **Below 60 m², weekly and bi-weekly have identical per-visit hours and therefore identical per-visit price.** A 39 m² home wants 1.4 weekly hours; the 2-hour minimum visit floors it to 2, and it floors bi-weekly's 1.6 to 2 as well. They differ only in monthly cost.
2. **Weekly always costs roughly double per month.** You are buying twice the cleans at the same rate. The page will now say so out loud.
3. **Therefore weekly has no price advantage of any kind** — not per hour, not per visit, not per month. The "Best value" badge is false and Task 7 removes it.

## File Structure

| File | Change | Responsibility after change |
|---|---|---|
| `pricing.js` | Modify | Sole definition of every rate, the deduction rate, and visit cadence |
| `CLAUDE.md` | Modify (lines 138-171) | Points at `pricing.js`; contains no rate numbers |
| `tests/pricing-source-of-truth.test.js` | Create | Fails if any live page or `CLAUDE.md` shows a rate not in `pricing.js` |
| `tests/quote-frequency-duration-flow.test.js` | Modify (line 357) | Existing test, updated for the `HOUSEHOLD_DEDUCTION_RATE` refactor |
| `tests/quote-frequency-cost.test.js` | Create | Asserts per-visit and monthly cost, and that promo strings are gone |
| `request-quote.html` | Modify | Booking form: promo removed, cost displayed |
| `package.json` | Modify (`scripts.test`) | Runs the two new tests |

---

### Task 1: Make `pricing.js` the sole definition

The six `*AfterTax` constants have **zero consumers** anywhere in the codebase (verified by grep across all `.html`, `.js`, `.mjs`). They are duplicated arithmetic: `49 × 0.65 = 31.85` exactly, no float drift, for all three rates. Delete them.

`VISITS_PER_MONTH` is added here because Task 5 and Task 6 need it.

**Hazard:** `pricing.js` is loaded at `request-quote.html:131`, and `request-quote.html:1361` declares `const HOUSEHOLD_DEDUCTION_RATE = 0.35;` at script top level. Both are classic scripts sharing one global scope. Adding a top-level `const HOUSEHOLD_DEDUCTION_RATE` to `pricing.js` throws `SyntaxError: Identifier 'HOUSEHOLD_DEDUCTION_RATE' has already been declared` and the entire page dies. Put the rate **inside the `PRICES` object** instead.

**Files:**
- Modify: `pricing.js:20-26` (delete `*AfterTax` block), `pricing.js:11-50` (add two keys)
- Modify: `request-quote.html:1361`
- Modify: `tests/quote-frequency-duration-flow.test.js:357`
- Test: `tests/pricing-source-of-truth.test.js` (created in Task 3; this task is covered by the existing suite)

**Interfaces:**
- Produces: `PRICES.householdDeductionRate` (Number, `0.35`) and `VISITS_PER_MONTH` (Object with keys `weekly`, `biweekly`, `monthly`, `once`; Number values). Both are globals available to any page that loads `pricing.js`.

- [ ] **Step 1: Confirm the `*AfterTax` constants really are unused**

Run:
```bash
cd "/Users/venm3/Business/Finland/BetterClean/Better Clean/Better Clean Website"
grep -rn "AfterTax" --include='*.html' --include='*.js' --include='*.mjs' . | grep -v node_modules | grep -v '^\./pricing\.js'
```
Expected: no output. If there is output, STOP and report — a consumer exists and this task's premise is wrong.

- [ ] **Step 2: Delete the dead constants from `pricing.js`**

Delete these lines entirely (`pricing.js:20-27`, including the blank line after):

```js
  // ── After kotitalousvähennys (labour-only hourly rates) ────────────────
  recurringAfterTax:  31.85,
  oneTimeAfterTax:    38.35,
  deepAfterTax:       51.35,
  moveOutAfterTax:    38.35,
  windowAfterTax:     31.85,
  postRenoAfterTax:   51.35,
```

- [ ] **Step 3: Add the deduction rate inside `PRICES`**

In `pricing.js`, immediately after the `postReno: 79,` line, insert:

```js

  // ── Kotitalousvähennys ────────────────────────────────────────────────
  // 35% of labour. Deliberately inside PRICES: a top-level
  // `const HOUSEHOLD_DEDUCTION_RATE` here would collide with the one in
  // request-quote.html, which shares this global scope.
  householdDeductionRate: 0.35,
```

- [ ] **Step 4: Add `VISITS_PER_MONTH` to `pricing.js`**

After the closing `};` of the `PRICES` object, insert:

```js
// Average visits per month for each recurring cadence. 52 weeks / 12 months.
const VISITS_PER_MONTH = {
  weekly:   52 / 12,   // 4.333...
  biweekly: 26 / 12,   // 2.166...
  monthly:  13 / 12,   // 1.083...
  once:     0,
};
```

- [ ] **Step 5: Point `request-quote.html` at the single source**

Replace `request-quote.html:1361`:

```js
  const HOUSEHOLD_DEDUCTION_RATE = 0.35;
```

with:

```js
  const HOUSEHOLD_DEDUCTION_RATE = PRICES.householdDeductionRate;
```

- [ ] **Step 6: Run the suite to see the expected failure**

Run: `npm test`
Expected: FAIL in `tests/quote-frequency-duration-flow.test.js`, because line 357 asserts the source contains the literal regex `/const HOUSEHOLD_DEDUCTION_RATE = 0\.35/`, which no longer matches.

- [ ] **Step 7: Update that assertion to test the value, not the literal**

In `tests/quote-frequency-duration-flow.test.js`, find line 357, which sits inside a list of source-text regexes:

```js
  /const HOUSEHOLD_DEDUCTION_RATE = 0\.35/,
```

Replace it with:

```js
  /const HOUSEHOLD_DEDUCTION_RATE = PRICES\.householdDeductionRate/,
```

Then, at the end of that same test file, add a real value assertion:

```js
assert.strictEqual(
  api.HOUSEHOLD_DEDUCTION_RATE,
  0.35,
  'household deduction rate resolves to 0.35 through PRICES'
);
```

If `HOUSEHOLD_DEDUCTION_RATE` is not already exposed on the test's `api` object, add it to the `this.__quoteTestApi = { ... }` block inside that file's `vm.runInContext` call.

- [ ] **Step 8: Run the suite again**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 9: Verify the page still loads (the collision hazard)**

Run:
```bash
node serve.mjs &
sleep 2
node -e "
const p = require('puppeteer');
(async () => {
  const b = await p.launch(); const pg = await b.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:3000/request-quote.html', {waitUntil:'networkidle0'});
  const ok = await pg.evaluate(() => typeof PRICES !== 'undefined' && typeof VISITS_PER_MONTH !== 'undefined' && HOUSEHOLD_DEDUCTION_RATE === 0.35);
  console.log('page errors:', errs.length ? errs : 'none');
  console.log('globals resolve:', ok);
  await b.close();
})();
"
```
Expected: `page errors: none` and `globals resolve: true`. If you see `Identifier ... has already been declared`, Step 3 was done wrong.

- [ ] **Step 10: Commit**

```bash
git add pricing.js request-quote.html tests/quote-frequency-duration-flow.test.js
git commit -m "refactor: pricing.js is the sole source of rates and deduction rate"
```

---

### Task 2: Strip rates out of `CLAUDE.md`

`CLAUDE.md:138-171` is titled "Canonical Pricing (source of truth)" and lists 57 / 65 / 69 / 69 / 69 / 75 €/h. `pricing.js:4` says "SINGLE SOURCE OF TRUTH" and lists 49 / 59 / 79 / 59 / 49 / 79. The live site ships the `pricing.js` numbers. Two files claiming to be canonical is the bug; correcting the stale one just resets the clock. Remove the numbers.

**Files:**
- Modify: `CLAUDE.md:138-171` (the "Canonical Pricing" section) and `CLAUDE.md:234-241` (the pricing change workflow)

**Interfaces:**
- Consumes: nothing.
- Produces: a `CLAUDE.md` containing zero `NN €/h` strings, which Task 3's guard test asserts.

- [ ] **Step 1: Replace the Canonical Pricing section**

Delete everything from the heading `## Canonical Pricing (source of truth — update here first, then update pricing.js)` down to and including the `**Price format rules:**` list (through `CLAUDE.md:171`). Replace it with:

```markdown
## Pricing

**`pricing.js` is the single source of truth for every price. This file contains none.**

Do not copy rates into this document, into `Team/DECISIONS.md`, or into any other
notes file. Every previous attempt to keep a second copy in sync failed, which is
why `tests/pricing-source-of-truth.test.js` now fails the build if any page shows a
rate that is not in `pricing.js`.

To read the current rates: `cat pricing.js`.

All prices include VAT 25.5%. Kotitalousvähennys is 35% of labour,
omavastuu 150 €/hlö/vuosi.

**Kotitalousvähennys disclaimer (use verbatim):**
FI: "Kotitalousvähennys 35 % työn osuudesta, kun palvelu ostetaan yritykseltä. Omavastuu 150 €/hlö/vuosi. Materiaalit ja matkakulut eivät kuulu vähennykseen."
EN: "Household tax deduction: 35% of labour costs when purchased from a registered company. Personal deductible: €150/person/year. Materials and travel costs are not deductible."

**Price format rules:**
- Finnish format always: `57 €/h` style, comma decimals, space before the euro sign
- Never: `€57/hr`, `€57/h`, `45.50`, `+€60/session`
- Show kotitalousvähennys exact amounts ONLY for labour-only hourly rates
- Do NOT show exact after-tax amounts for fixed-price or bundled items
```

Note the format-rules bullet deliberately says "`57 €/h` style" as a *shape* example. Change it to `NN €/h` if the guard test flags it — see Task 3 Step 3.

- [ ] **Step 2: Replace the pricing change workflow**

Replace `CLAUDE.md:234-241` (the `**Pricing change workflow (when prices change):**` block) with:

```markdown
**Pricing change workflow (when prices change):**
1. Edit `pricing.js`. It is the only file that defines a rate.
2. Run `npm test`. `tests/pricing-source-of-truth.test.js` will list every HTML file
   still showing the old rate. It fails until you fix each one.
3. Update the JSON-LD `"price"` values on each page the test names.
4. Run `npx html-validate *.html`
5. Screenshot the affected pages and compare against the "before" shots
6. Commit with message "Update pricing: [what changed]"
```

- [ ] **Step 3: Verify no rates remain**

Run:
```bash
grep -nE '[0-9]+(,[0-9]+)? €/h' CLAUDE.md
```
Expected: exactly one line, the `57 €/h` style example in the format rules. If Task 3's guard test rejects it, change it to `NN €/h`.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md no longer duplicates rates; pricing.js is canonical"
```

---

### Task 3: The guard test

This is the piece that actually delivers "change it once and it applies to all." It cannot propagate a change, but it refuses to let you ship a missed one, and it names every file you forgot.

**Watch out for these, all verified to exist:**
- `150 €/hlö/vuosi` (the deduction ceiling) matches a naive `NN €/h` regex. Exclude with a negative lookahead on `lö`.
- `naapurietu.html` runs a legitimate **39 €/h** neighbour promo. Not drift. Out of scope.
- `document_templates/proposals/.../suomen-adventtikirkko/` holds **bespoke customer rates** (38 / 48 €/h). Never touch. Out of scope.
- `flyers/` and `document_templates/service-comparison/` carry **stale 69 / 65 / 57 / 75 €/h**. Real drift, but they are customer collateral and may already be printed. Out of scope pending Ven's decision. Do not add them to `SCANNED`.

**Files:**
- Create: `tests/pricing-source-of-truth.test.js`
- Modify: `package.json` (`scripts.test`)

**Interfaces:**
- Consumes: `PRICES` and `PRICES.householdDeductionRate` from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the test**

Create `tests/pricing-source-of-truth.test.js`:

```js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// Load PRICES the same way the other tests do: pricing.js is a classic script.
const context = {};
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(root, 'pricing.js'), 'utf8') +
    '\nthis.__prices = PRICES;',
  context
);
const PRICES = context.__prices;

// Pages that must never show a rate that is not in pricing.js.
// Deliberately excluded, all legitimate:
//   naapurietu.html                     39 €/h neighbour promo
//   flyers/, document_templates/        stale collateral + bespoke customer quotes
const SCANNED = [
  'index.html',
  'pricing.html',
  'request-quote.html',
  'window-cleaning.html',
  'post-renovation-cleaning.html',
  'steam-cleaning.html',
  'additional-cleaning-services.html',
  'CLAUDE.md',
];

const DEDUCTION = PRICES.householdDeductionRate;

function fi(amount) {
  return amount % 1 === 0
    ? String(amount)
    : amount.toFixed(2).replace('.', ',');
}

// Every rate in pricing.js, plus its after-deduction twin, in Finnish format.
const rates = [
  PRICES.recurring, PRICES.oneTime, PRICES.deep,
  PRICES.moveOut, PRICES.window, PRICES.postReno,
];
const allowed = new Set();
for (const rate of rates) {
  allowed.add(fi(rate));
  allowed.add(fi(Math.round(rate * (1 - DEDUCTION) * 100) / 100));
}

// `150 €/hlö/vuosi` is the deduction ceiling, not an hourly rate.
const RATE_RE = /([0-9]+(?:,[0-9]+)?) €\/h(?!lö)/g;

const violations = [];
for (const file of SCANNED) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of text.matchAll(RATE_RE)) {
    const value = match[1];
    if (!allowed.has(value)) {
      violations.push(`${file}: "${value} €/h" is not a value in pricing.js`);
    }
  }
}

assert.deepStrictEqual(
  violations,
  [],
  'Every rate shown on a live page must come from pricing.js.\n' +
    'Allowed: ' + [...allowed].sort().join(', ') + '\n' +
    violations.join('\n')
);

// CLAUDE.md must not restate rates at all.
const claudeMd = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
const claudeRates = [...claudeMd.matchAll(RATE_RE)].map(m => m[1]);
assert.deepStrictEqual(
  claudeRates,
  [],
  'CLAUDE.md must contain no hourly rates. Found: ' + claudeRates.join(', ')
);

// The deduction rate itself lives in exactly one place.
assert.strictEqual(DEDUCTION, 0.35, 'household deduction rate is 35%');

console.log('pricing-source-of-truth: OK (allowed rates: ' + [...allowed].sort().join(', ') + ')');
```

- [ ] **Step 2: Run it and watch it fail on purpose**

Temporarily edit `pricing.js` and change `recurring: 49,` to `recurring: 52,`.

Run: `node tests/pricing-source-of-truth.test.js`
Expected: FAIL, listing `index.html: "49 €/h" is not a value in pricing.js` and similar for `pricing.html`, `request-quote.html`, `window-cleaning.html`, `additional-cleaning-services.html`.

This is the whole point of the test. If it passes here, the regex is broken.

Now revert: change `recurring: 52,` back to `recurring: 49,`.

- [ ] **Step 3: Run it clean**

Run: `node tests/pricing-source-of-truth.test.js`
Expected: PASS, printing `pricing-source-of-truth: OK (allowed rates: 31,85, 38,35, 49, 51,35, 59, 79)`

If it fails on `CLAUDE.md` because of the `57 €/h` style example from Task 2 Step 1, change that example to `NN €/h` and rerun.

- [ ] **Step 4: Wire it into `npm test`**

In `package.json`, in `scripts.test`, insert `node tests/pricing-source-of-truth.test.js && ` immediately before `npm run check`.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS, all tests including the new one.

- [ ] **Step 6: Commit**

```bash
git add tests/pricing-source-of-truth.test.js package.json
git commit -m "test: fail the build when any page shows a rate not in pricing.js"
```

---

### Task 4: Remove the promo framing from the reset visit

Ven's decision, verbatim: *"That's not a discount - that's just their rate. A recurring customer's rate is 49. Their first visit happens to be longer because it's a reset. It's billed at their rate. Done."*

This deletes the expiry date (`30.9.2026`), the uncounted scarcity claim (`Only 4 new contract customers per month`), and the struck-through `norm. 59 €/h` comparison, which appears **three times on one screen**. It also removes four em dashes, which violate the standing rule.

It has a second effect worth understanding. Today `getBookingHourlyRate()` (`request-quote.html:1564`) returns 49 for *any* recurring frequency, but the offer note only renders for weekly and bi-weekly (`request-quote.html:2250`). A four-weekly customer silently receives the contract rate while being told nothing. Once the reset is simply "your rate," that inconsistency disappears — four-weekly is a recurring customer, so 49 is correct for them.

**Files:**
- Modify: `request-quote.html` lines 840, 851, 888-892, 902, 1900, 2250-2254, 2311
- Test: `tests/quote-frequency-cost.test.js` (created in Task 6; this task's deletions are asserted there)

**Interfaces:**
- Consumes: nothing.
- Produces: removes the global `bookingPayload.freeResetOffer` field. Task 6 asserts it is gone.

- [ ] **Step 1: Delete the offer line from the weekly card**

Delete `request-quote.html:840` entirely:

```html
                      <p class="offer-line" data-en="Reset clean at contract rate 49 €/h (norm. 59 €/h)" data-fi="Aloitussiivous sopimushintaan 49 €/h (norm. 59 €/h)">Aloitussiivous sopimushintaan 49 €/h (norm. 59 €/h)</p>
```

- [ ] **Step 2: Delete the offer line from the bi-weekly card**

Delete `request-quote.html:851` entirely (same markup, same class, on `freq-biweekly`).

- [ ] **Step 3: Fold the honest statement into `recurringExplanation`**

There is already an element that explains the reset visit. Extend it rather than adding a new one. Replace `request-quote.html:888`:

```html
              <p id="recurringExplanation" class="duration-recommendation recurring-explanation-callout duration-grid-span" hidden data-en="New recurring customers begin with an initial reset visit. Once the home reaches a consistent maintenance level, future visits can usually be shorter." data-fi="Uudet toistuvat asiakkaat aloittavat nollauskäynnillä. Kun koti on saatu tasaiselle ylläpitotasolle, tulevat käynnit voivat yleensä olla lyhyempiä.">Uudet toistuvat asiakkaat aloittavat nollauskäynnillä. Kun koti on saatu tasaiselle ylläpitotasolle, tulevat käynnit voivat yleensä olla lyhyempiä.</p>
```

with:

```html
              <p id="recurringExplanation" class="duration-recommendation recurring-explanation-callout duration-grid-span" hidden data-en="Your first visit is a longer reset clean. We bill it at your contract rate of 49 €/h, not the 59 €/h one time rate. Once the home reaches a consistent maintenance level, ongoing visits are shorter." data-fi="Ensimmäinen käynti on pidempi nollaussiivous. Laskutamme sen sopimushintaasi 49 €/h, emme kertahintaa 59 €/h. Kun koti on saatu tasaiselle ylläpitotasolle, jatkokäynnit ovat lyhyempiä.">Ensimmäinen käynti on pidempi nollaussiivous. Laskutamme sen sopimushintaasi 49 €/h, emme kertahintaa 59 €/h. Kun koti on saatu tasaiselle ylläpitotasolle, jatkokäynnit ovat lyhyempiä.</p>
```

- [ ] **Step 4: Delete the promo box**

Delete `request-quote.html:889-892` entirely, the whole `freeResetOfferNote` div:

```html
              <div class="free-reset-offer duration-grid-span" id="freeResetOfferNote" hidden>
                <strong data-en="Book now: your reset clean at the contract rate 49 €/h (norm. 59 €/h)" data-fi="Varaa nyt: aloitussiivous sopimushintaan 49 €/h (norm. 59 €/h)">Varaa nyt: aloitussiivous sopimushintaan 49 €/h (norm. 59 €/h)</strong>
                <span data-en="You save from the very first visit. Only 4 new contract customers per month — valid until 30.9.2026." data-fi="Säästät heti ensimmäisestä käynnistä alkaen. Vain 4 uutta sopimusasiakasta kuukaudessa — voimassa 30.9.2026 asti.">Säästät heti ensimmäisestä käynnistä alkaen. Vain 4 uutta sopimusasiakasta kuukaudessa — voimassa 30.9.2026 asti.</span>
              </div>
```

- [ ] **Step 5: Delete the third copy of the same claim**

Delete `request-quote.html:902` entirely:

```html
                  <p class="offer-line" id="firstVisitFreeNote" hidden data-en="49 €/h — norm. 59 €/h" data-fi="49 €/h — norm. 59 €/h">49 €/h — norm. 59 €/h</p>
```

- [ ] **Step 6: Delete the render logic for the deleted elements**

Replace `request-quote.html:2250-2254`:

```js
    const offerActive = service === 'home' && ['weekly', 'biweekly'].includes(bookingState.selectedFrequency);
    const offerNote = document.getElementById('freeResetOfferNote');
    if (offerNote) offerNote.hidden = !offerActive;
    const firstVisitFree = document.getElementById('firstVisitFreeNote');
    if (firstVisitFree) firstVisitFree.hidden = !offerActive;
```

with nothing. Delete all five lines.

- [ ] **Step 7: Delete the payload field**

In `request-quote.html:1900`, delete the `freeResetOffer` property from the payload object:

```js
      freeResetOffer: bookingState.selectedServiceType === 'home' && ['weekly', 'biweekly'].includes(bookingState.selectedFrequency)
```

- [ ] **Step 8: Delete the offer string sent to the ops inbox**

In `request-quote.html:2311`, delete this line entirely:

```js
      bookingPayload.freeResetOffer ? (lang === 'fi' ? 'Etu: Aloitussiivous sopimushintaan 49 €/h (norm. 59 €/h) — viikko/2 vk -tarjous, voimassa 30.9.2026' : 'Offer: Reset clean at contract rate 49 €/h (norm. 59 €/h) — weekly/bi-weekly offer valid until 30.9.2026') : null,
```

Check the surrounding array for a dangling comma and a now-unused `.filter(Boolean)`. Leave `.filter(Boolean)` in place if other entries can be null.

- [ ] **Step 9: Verify the dashes and the dead strings are gone**

Run:
```bash
grep -c "—\|–" request-quote.html
grep -c "30.9.2026\|norm. 59\|freeResetOffer\|firstVisitFreeNote" request-quote.html
```
Expected: `3` for the first command and `0` for the second.

Six lines carry em dashes today (891, 902, 1288, 1295, 1298, 2311). This task deletes three of them. The three survivors are the identical sauna/window add-on line repeated at 1288, 1295, and 1298, which is out of scope here.

If the first returns more than 3, you missed a deletion.

- [ ] **Step 10: Verify the page still works**

Run: `npm test && npx html-validate request-quote.html`
Expected: PASS. Then load `http://localhost:3000/request-quote.html`, pick Essential + weekly, type `60`, and confirm no JavaScript errors in the console and no empty gap where the green promo box used to be.

- [ ] **Step 11: Commit**

```bash
git add request-quote.html
git commit -m "copy: reset visit is billed at the contract rate, not a promo"
```

---

### Task 5: Show what the customer actually pays

This is the fix. At 60 m², weekly and bi-weekly both recommend 2.5 ongoing hours at 49 €/h, so both cost 122,50 € per visit. They are not the same product: one is 4.33 visits a month and the other is 2.17. Today the page shows neither number.

Verified values with the current flat 49 €/h rate and the existing 0.5-hour rounding step:

| Home size | Weekly €/visit | Weekly €/mo | Bi-weekly €/visit | Bi-weekly €/mo |
|---|---|---|---|---|
| 0-39 m² | 98 | 425 | 98 | 212 |
| 40-59 m² | 98 | 425 | 98 | 212 |
| 60-79 m² | 122,50 | 531 | 122,50 | 265 |
| 80-99 m² | 122,50 | 531 | 147 | 319 |
| 100-119 m² | 147 | 637 | 171,50 | 372 |
| 120-149 m² | 171,50 | 743 | 196 | 425 |
| 150-180 m² | 220,50 | 955 | 245 | 531 |

Monthly cost differs at every size. Per-visit price ties only below 80 m², where the 2-hour minimum visit floors both.

**Do not change `durationStep` from 0.5 to 0.25 to break those ties.** `durationStep` is read in two places: `roundPersonHoursUp()` at `request-quote.html:1632`, and the dropdown option generator at `request-quote.html:1701-1703`. Halving it doubles the manual duration dropdown from 26 options to 49. Not worth it.

**Files:**
- Modify: `request-quote.html:833-872` (add a price element to each frequency card)
- Modify: `request-quote.html:1741` area (`updateDurationRecommendationState`) to populate them

**Interfaces:**
- Consumes: `VISITS_PER_MONTH` and `PRICES` (Task 1). Existing globals `getCleaningDurationRecommendation(size, frequency)` returning `{ baselinePersonHours, recommendedFirstVisitHours, recommendedOngoingHours, recommendedSelectedDuration }`; `getBookingServiceConfig()` returning an object with `rateKey` and `pricingServiceKey`; `isRecurringFrequency(frequency)`; `formatPriceFi(amount)`; `bookingState.selectedPropertySize` (a bracket key such as `'medium'`, not square metres).
- Produces: global `function getHourlyRateForFrequency(frequency)` returning Number, and global `function estimateMonthlyCost(sizeKey, frequency)` returning `{ perVisit: Number, perMonth: Number } | null`. Task 6 uses `estimateMonthlyCost`.

**Why a new rate function:** `getBookingHourlyRate()` at `request-quote.html:1561-1565` reads the cadence from `bookingState.selectedFrequency` rather than taking it as an argument. Calling it while pricing a card for a *different* cadence returns the wrong rate. That is invisible today because every recurring cadence is 49 €/h, and it would silently corrupt all three cards on the day a rate ladder ships (see B2). Take the frequency as a parameter.

- [ ] **Step 1: Write the failing test**

Create `tests/quote-frequency-cost.test.js`. Load the page script exactly the way `tests/quote-frequency-duration-flow.test.js` does (copy its `extractMainScript()` and `vm` bootstrapping verbatim, including the `createClassList()` DOM stub), then append the assertions below.

`estimateMonthlyCost` resolves the *service* from `bookingState.selectedServiceType` via `getBookingServiceConfig()`, so before asserting, confirm the default service is `home` (it is: `#service-home` carries `class="choice-card active"` at `request-quote.html:812`). If the stub does not initialise it, set `api.bookingState.selectedServiceType = 'home';` first.

```js
// Weekly and bi-weekly must never present as the same offer.
const sizes = ['studio', 'small', 'medium', 'large', 'xlarge', 'xxlarge', 'xxxlarge'];
for (const size of sizes) {
  const wk = api.estimateMonthlyCost(size, 'weekly');
  const bi = api.estimateMonthlyCost(size, 'biweekly');
  assert.ok(wk && bi, `${size}: both cadences produce an estimate`);
  assert.notStrictEqual(
    wk.perMonth, bi.perMonth,
    `${size}: weekly and bi-weekly monthly cost must differ`
  );
}

// Exact values at 60-79 m², 2.5 ongoing hours x 49 €/h.
assert.strictEqual(api.estimateMonthlyCost('medium', 'weekly').perVisit, 122.5);
assert.strictEqual(api.estimateMonthlyCost('medium', 'weekly').perMonth, 531);
assert.strictEqual(api.estimateMonthlyCost('medium', 'biweekly').perVisit, 122.5);
assert.strictEqual(api.estimateMonthlyCost('medium', 'biweekly').perMonth, 265);

// Smallest home: per-visit ties at the 2 hour floor, monthly must still differ.
assert.strictEqual(api.estimateMonthlyCost('studio', 'weekly').perVisit, 98);
assert.strictEqual(api.estimateMonthlyCost('studio', 'biweekly').perVisit, 98);
assert.strictEqual(api.estimateMonthlyCost('studio', 'weekly').perMonth, 425);
assert.strictEqual(api.estimateMonthlyCost('studio', 'biweekly').perMonth, 212);

// One-time has no monthly cost.
assert.strictEqual(api.estimateMonthlyCost('medium', 'once'), null);

// Task 4's deletions stay deleted.
const src = fs.readFileSync(path.join(root, 'request-quote.html'), 'utf8');
for (const dead of ['30.9.2026', 'norm. 59', 'freeResetOffer', 'firstVisitFreeNote']) {
  assert.ok(!src.includes(dead), `promo remnant "${dead}" must be gone`);
}

console.log('quote-frequency-cost: OK');
```

Add `estimateMonthlyCost` to the `this.__quoteTestApi = { ... }` export block inside the file's `vm.runInContext` call.

- [ ] **Step 2: Run it to verify it fails**

Run: `node tests/quote-frequency-cost.test.js`
Expected: FAIL with `TypeError: api.estimateMonthlyCost is not a function`.

- [ ] **Step 3: Implement `getHourlyRateForFrequency` and `estimateMonthlyCost`**

In `request-quote.html`, immediately after `getCleaningDurationRecommendation` (which ends at line 1662), insert:

```js
  // Rate for a given cadence. Unlike getBookingHourlyRate(), this does not read
  // bookingState, so it can price a card for a cadence the user has not selected.
  function getHourlyRateForFrequency(frequency) {
    const config = getBookingServiceConfig();
    if (config.rateKey && PRICES[config.rateKey]) return PRICES[config.rateKey];
    return frequency === 'once' ? PRICES.oneTime : PRICES.recurring;
  }

  // Per-visit and per-month cost for a recurring cadence. Returns null for
  // one-time cleans, which have no monthly cost.
  function estimateMonthlyCost(sizeKey, frequency) {
    if (!isRecurringFrequency(frequency)) return null;
    const visitsPerMonth = VISITS_PER_MONTH[frequency];
    if (!visitsPerMonth) return null;
    const recommendation = getCleaningDurationRecommendation(sizeKey, frequency);
    const hours = recommendation.recommendedOngoingHours;
    if (!hours) return null;
    const perVisit = hours * getHourlyRateForFrequency(frequency);
    return {
      perVisit,
      perMonth: Math.round(perVisit * visitsPerMonth)
    };
  }
```

Then make the existing `getBookingHourlyRate()` delegate, so there is one rate rule rather than two. Replace `request-quote.html:1561-1565`:

```js
  function getBookingHourlyRate() {
    const config = getBookingServiceConfig();
    if (config.rateKey && PRICES[config.rateKey]) return PRICES[config.rateKey];
    return bookingState.selectedFrequency === 'once' ? PRICES.oneTime : PRICES.recurring;
  }
```

with:

```js
  function getBookingHourlyRate() {
    return getHourlyRateForFrequency(bookingState.selectedFrequency);
  }
```

Because `getHourlyRateForFrequency` is a function declaration, hoisting makes this safe despite it being defined later in the file.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node tests/quote-frequency-cost.test.js`
Expected: `quote-frequency-cost: OK`

If `perMonth` for `medium`/`weekly` comes back `530` instead of `531`, `VISITS_PER_MONTH.weekly` was written as `4.33` rather than `52 / 12`. Fix Task 1 Step 4.

- [ ] **Step 5: Add the price element to each recurring frequency card**

In `request-quote.html`, inside `#freq-weekly`, after the `<p ... id="freq-weekly-desc">` line, insert:

```html
                      <p class="offer-line" id="freq-weekly-cost" hidden></p>
```

Do the same for `#freq-biweekly` (`id="freq-biweekly-cost"`) and `#freq-monthly` (`id="freq-monthly-cost"`).

Do **not** add one to `#freq-once` — a one-time clean has no monthly cost.

The `.offer-line` class already exists in the stylesheet (`request-quote.html:583`); reusing it means no new CSS.

- [ ] **Step 6: Populate them whenever the size changes**

Inside `updateDurationRecommendationState()` (starts at `request-quote.html:1741`), at the end of the function body, insert:

```js
    const sizeKey = bookingState.selectedPropertySize;
    ['weekly', 'biweekly', 'monthly'].forEach(function (frequency) {
      const el = document.getElementById('freq-' + frequency + '-cost');
      if (!el) return;
      const cost = sizeKey ? estimateMonthlyCost(sizeKey, frequency) : null;
      if (!cost) { el.hidden = true; return; }
      el.hidden = false;
      el.textContent = lang === 'fi'
        ? formatPriceFi(cost.perVisit) + ' / käynti, noin ' + formatPriceFi(cost.perMonth) + '/kk'
        : formatPriceFi(cost.perVisit) + ' per visit, about ' + formatPriceFi(cost.perMonth) + '/month';
    });
```

`formatPriceFi` already appends ` €`, so `formatPriceFi(531) + '/kk'` renders `531 €/kk`. Do not add a space before the slash.

If `lang` is not already in scope in that function, read it with `const lang = currentLang || 'fi';` as the first line of the block.

- [ ] **Step 7: Verify in a real browser**

Start the server if it is not running, then:

```bash
node screenshot.mjs http://localhost:3000/request-quote.html freq-cost-after
```

Read the PNG from `temporary screenshots/`. Confirm by eye:
- Before a size is entered, no cost line appears on any card.
- After typing `60`, the weekly card reads `122,50 € / käynti, noin 531 € /kk` and the bi-weekly card reads `122,50 € / käynti, noin 265 € /kk`.
- The one-time card has no cost line.

- [ ] **Step 8: Commit**

```bash
git add request-quote.html tests/quote-frequency-cost.test.js
git commit -m "feat: show per-visit and monthly cost on each frequency card"
```

---

### Task 6: Price the ongoing visit in the recommendation grid

The grid at `request-quote.html:893-909` shows "Recommended ongoing visits: 2,5 person-hours per visit" and no price. That is the visit the customer will pay for, forever, and it is the only visit whose duration varies by cadence.

**Files:**
- Modify: `request-quote.html:904-908` (`#ongoingVisitRecommendation`)
- Modify: `request-quote.html:1831-1840` (the render block)

**Interfaces:**
- Consumes: `estimateMonthlyCost(sizeKey, frequency)` from Task 5, `formatPriceFi(amount)`, `bookingState.selectedPropertySize`, `bookingState.selectedFrequency`.

- [ ] **Step 1: Add a price element to the ongoing-visit tile**

In `request-quote.html`, inside `<div id="ongoingVisitRecommendation" class="recommendation-item">`, after `<p id="ongoingVisitCadence">-</p>`, insert:

```html
                  <p class="offer-line" id="ongoingVisitCost" hidden></p>
```

- [ ] **Step 2: Populate it in the existing render block**

Immediately after the `ongoingVisitCadence` block that ends at `request-quote.html:1840`, insert:

```js
    const ongoingVisitCost = document.getElementById('ongoingVisitCost');
    if (ongoingVisitCost) {
      const cost = estimateMonthlyCost(bookingState.selectedPropertySize, bookingState.selectedFrequency);
      if (!cost) {
        ongoingVisitCost.hidden = true;
      } else {
        ongoingVisitCost.hidden = false;
        ongoingVisitCost.textContent = lang === 'fi'
          ? formatPriceFi(cost.perVisit) + ' / käynti'
          : formatPriceFi(cost.perVisit) + ' per visit';
      }
    }
```

- [ ] **Step 3: Verify in a real browser**

Load `http://localhost:3000/request-quote.html`, choose Essential + weekly, type `60`.
Expected: the "Suositellut jatkokäynnit" tile reads `2,5 henkilötuntia / käynti`, `Perustuu rytmiin: joka viikko`, `122,50 € / käynti`.

Switch to "Vain kerran". Expected: the cost line disappears (one-time has no ongoing visit).

- [ ] **Step 4: Screenshot and compare**

```bash
node screenshot.mjs http://localhost:3000/request-quote.html ongoing-cost-after
```
Read the PNG. Confirm the tile is not overflowing its grid cell at the narrowest breakpoint. If it is, the copy is too long; shorten the English string to `122,50 € / visit`.

- [ ] **Step 5: Run everything**

Run: `npm test && npx html-validate request-quote.html`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add request-quote.html
git commit -m "feat: price the ongoing visit in the recommendation grid"
```

---

### Task 7: Tell the truth on the badges

`#freq-weekly` carries `Paras arvo` / `Best value` (`request-quote.html:835`). With a flat 49 €/h rate, weekly is not the best value on any axis: same hourly rate as bi-weekly, same or higher per-visit price, and roughly double the monthly cost. Task 5 now puts `531 €/kk` next to `265 €/kk` on the same screen, so a customer can see the badge is false.

Weekly's real advantage is that the home is never dirty. Say that.

Both badges also carry `aria-hidden="true"`, which was defensible when they were decoration. Now they are the only qualitative difference between two cards, so screen reader users must hear them.

**Files:**
- Modify: `request-quote.html:835` and `request-quote.html:846`

- [ ] **Step 1: Relabel the weekly badge and expose it to assistive tech**

Replace `request-quote.html:835`:

```html
                  <span class="mini-tag" aria-hidden="true" data-en="Best value" data-fi="Paras arvo">Paras arvo</span>
```

with:

```html
                  <span class="mini-tag" data-en="Cleanest home" data-fi="Puhtain koti">Puhtain koti</span>
```

- [ ] **Step 2: Expose the bi-weekly badge too**

Replace `request-quote.html:846`:

```html
                  <span class="mini-tag" aria-hidden="true" data-en="Most popular" data-fi="Suosituin">Suosituin</span>
```

with:

```html
                  <span class="mini-tag" data-en="Most popular" data-fi="Suosituin">Suosituin</span>
```

- [ ] **Step 3: Verify no "best value" claim survives**

Run:
```bash
grep -ci "paras arvo\|best value" request-quote.html index.html pricing.html
```
Expected: `0` for each file. If `index.html` or `pricing.html` returns a hit, that is a real finding and out of scope for this task. Report it, do not fix it here.

- [ ] **Step 4: Verify the badges reach the accessibility tree**

```bash
node -e "
const p = require('puppeteer');
(async () => {
  const b = await p.launch(); const pg = await b.newPage();
  await pg.goto('http://localhost:3000/request-quote.html', {waitUntil:'networkidle0'});
  const name = await pg.\$eval('#freq-weekly', el => el.innerText.split('\n')[0]);
  console.log('weekly card first line:', JSON.stringify(name));
  await b.close();
})();
"
```
Expected: `"Puhtain koti"`.

- [ ] **Step 5: Run everything and screenshot**

Run: `npm test && npx html-validate request-quote.html && node screenshot.mjs http://localhost:3000/request-quote.html badges-after`

Read the PNG. Compare against the original screenshot. Confirm the only visual differences are: the green promo box is gone, each recurring card gained a cost line, the ongoing tile gained a price, and the weekly badge reads `Puhtain koti`.

- [ ] **Step 6: Commit**

```bash
git add request-quote.html
git commit -m "copy: weekly is the cleanest home, not the best value"
```

---

## Blocked: needs a decision from Ven

Do not start these. They are recorded so they are not lost.

### B1. Stale customer collateral

`flyers/betterclean-flyers.html` shows **69 €/h**. `document_templates/service-comparison/index.html` shows **69 / 65 / 57 / 75 €/h**. The site charges 49 / 59 / 79. If either has been printed or handed to a customer, that is a live mispricing of up to 41%, and correcting the file does not correct the paper.

**Needs from Ven:** have these been printed or sent? If yes, this is a customer-facing problem before it is a code problem.

### B2. The commitment rate ladder

Weekly currently has no economic reason to exist for a customer: same rate, same or worse per-visit price, double the monthly cost. A ladder (weekly 45, bi-weekly 49, four-weekly 55, one-time 59) would make weekly genuinely cheaper per hour and make a value claim defensible. Modelled contribution at an assumed 20 €/h loaded cleaner cost: weekly 154 €/customer/month against bi-weekly 103 €. The discount pays for itself. At 22 €/h it does not, comfortably.

**Needs from Ven:** the fully-loaded cleaner cost per hour, including employer contributions. It exists nowhere in the repo. Without it, 45 €/h is a guess.

### B3. Showing monthly cost may reduce weekly sign-ups

Task 5 puts `531 €/kk` on the weekly card. That is the truth, and a customer would have discovered it on the first invoice regardless. But expect weekly conversions to fall and bi-weekly to rise. That is a good trade for churn and for trust; it is still a trade, and Ven should know it is coming rather than read it in a dashboard.

---

## Out of scope, recorded

- The euro total still first appears on step 3, after the customer has given a street address (`request-quote.html:1181`, inside `#bookingStep3`). Task 5 and Task 6 put real prices on step 1, which substantially defuses this, but the *booked total* still hides behind the address.
- Homes over 180 m² dead-end: typing `200` shows "Tälle koolle annamme henkilökohtaisen arvion" and permanently disables Continue, with no link to the inquiry route that exists at `request-quote.html:1071` and has an "Yli 180 m²" option. One line to fix. Highest-value leads.
- Two em dashes remain at `request-quote.html:1288-1298` in the sauna and window add-on copy.
- `pricing.html` does not load `pricing.js`; its prices are hand-written HTML. The Task 3 guard test covers it, but it will never self-update.
