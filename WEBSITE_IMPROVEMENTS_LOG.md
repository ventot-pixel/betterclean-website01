# BetterClean Website — Improvements Log
*Use this as a reference checklist when building the next website.*

---

## Session: 2026-03-25 — Booking Form Fix + Site Audit

### What Was Broken (and Fixed)

#### 1. Fake Booking Form Submission
**Problem:** `submitBooking()` did nothing — it just called `goToStep(4)` and showed "Booking Confirmed!" with zero action. No email, no data, nothing.

**Fix:**
- Replaced with a real `async submitBooking()` function
- Primary path: `mailto:` pre-filled with all booking data → opens user's email client to `info@betterclean.fi`
- Optional upgrade path: `FORMSPREE_ENDPOINT` variable at the top of the script — set it to a Formspree URL for server-side form handling
- Booking only reaches confirmation screen on success

#### 2. No Step Validation
**Problem:** Users could skip selecting a date/time and reach the "payment confirmed" screen with empty fields.

**Fix:**
- Step 1 → Step 2: requires date AND time selected
- Step 2 → Step 3: requires first name, last name, email (with `@` and `.`), phone, address
- Each step has its own inline error message element

#### 3. Missing Error Message Elements
**Problem:** The validation code referenced `step-1-error`, `step-2-error`, `step-3-error` elements that didn't exist in the HTML.

**Fix:** Added `<p id="step-X-error" class="hidden text-sm text-red-600">` at each step before the navigation buttons.

#### 4. Step 1 Progress Indicator Not Resetting
**Problem:** `updateStepIndicators()` only looped over steps `[2, 3]` — step 1's circle/label had no IDs so it could never be reset visually.

**Fix:**
- Added `id="ind-1-circle"` and `id="ind-1-label"` to the step 1 HTML
- Changed loop from `[2, 3]` to `[1, 2, 3]`

#### 5. English Button Showing Finnish Text
**Problem:** The "Confirm Booking" button had `data-en="Vahvista varaus"` (Finnish) instead of English.

**Fix:** Changed to `data-en="Confirm Booking"`.

#### 6. Vex Cron Wrong Path
**Problem:** launchd cron pointed to `Team/vex_runner.py` but script lives at `Team/Vex/vex_runner.py` — Vex was silently failing every day.

**Fix:** Updated cron path to correct location.

---

## Outstanding Issues (Not Yet Fixed — Need Phone Number First)

### Critical
| Issue | Files | Notes |
|---|---|---|
| Placeholder phone `+358XXXXXXXXX` in JSON-LD | index.html:25, pricing.html:20 | Hurts SEO and Google rich results |
| Dead call button `tel:+358XXXXXXXXX` | window-cleaning.html:569 | Button does nothing |
| Placeholder `+358 XX XXX XXXX` in footer | All 5 pages | Visible to users |

### High Priority
| Issue | Files | Notes |
|---|---|---|
| Email not linked | All 5 footers | `info@betterclean.fi` is plain text, should be `<a href="mailto:...">` |
| Misleading confirmation screen | index.html:1001 | Says "A confirmation email has been sent to your address" — false, mailto just opens their email client |
| Fake payment form | index.html:963–983 | Card/bank form UI collects card details but processes nothing — misleading |
| No `og:image` meta tag | All 5 pages | No preview image when shared on social media |
| No Privacy Policy page | Entire site | GDPR requirement — form collects name, email, phone, address |

### Medium Priority
| Issue | Files | Notes |
|---|---|---|
| No `sitemap.xml` | Root | Submit to Google Search Console for indexing |
| No `robots.txt` | Root | Standard SEO hygiene |

---

## Lessons for the Next Website

### Always check on launch
- [ ] No placeholder phone numbers anywhere (JSON-LD, footer, tel: links)
- [ ] No placeholder emails
- [ ] All form submissions actually send data somewhere (email/Formspree/backend)
- [ ] All form validation gates exist and error elements are in the HTML
- [ ] Confirmation screen text matches what actually happened
- [ ] Payment UI only shown if payment is actually integrated
- [ ] All `mailto:` links on email addresses in footer/contact sections
- [ ] All `tel:` links on phone numbers in footer/contact sections
- [ ] `og:image` meta tag on every page (for social sharing previews)
- [ ] `og:title` and `og:description` on every page
- [ ] `canonical` URL on every page
- [ ] `sitemap.xml` at root
- [ ] `robots.txt` at root
- [ ] Privacy Policy page (required by GDPR if you collect any personal data)
- [ ] Cookie/GDPR consent notice (if using analytics)
- [ ] All bilingual elements have both `data-en` and `data-fi` attributes
- [ ] Step indicators include ALL steps (don't forget step 1)
- [ ] Progress indicator IDs exist for every step referenced in JS

### Architecture decisions that worked well
- **`data-en` / `data-fi` attribute system** — Clean bilingual toggle without a framework. Set `window.currentLang` and update all elements with one function.
- **`FORMSPREE_ENDPOINT` config variable** — Easy upgrade path. Set to empty string = mailto fallback. Set to Formspree URL = server-side handling. No code changes needed.
- **`BOOKING_EMAIL` config variable** — Single place to change the recipient email.
- **Tailwind CDN** — Fast to build with, no build step needed for static sites.
- **JSON-LD structured data** — Good for SEO. Include LocalBusiness + FAQPage schemas.
- **`kotitalousvähennys` mention** — High-value Finnish keyword for cleaning services. Always mention it.

### Payment flow for future sites
**Don't build a fake payment UI.** Either:
1. **No payment step** — Book → confirm → invoice sent manually (simplest, fine for small operations)
2. **Stripe** — Real card processing, international
3. **Paytrail** — Finnish payment gateway, includes Nordea/OP/MobilePay/cards natively
4. Until payment is integrated, remove card/bank UI entirely and just collect booking details

### GDPR checklist
- Privacy Policy page is required if you collect name, email, phone, or address
- Cookie notice required if using Google Analytics or any tracking
- Link to Privacy Policy in footer and in any form that collects personal data
