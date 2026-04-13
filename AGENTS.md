# AGENTS.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- **macOS machine** — Puppeteer paths from older sessions (C:/Users/nateh/...) are Windows paths and do not apply here.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Codex can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- **Canonical logo:** `brand_assets/betterclean-logo.png` — use this on all pages. Do not use other logo variants.
- `brand_assets/premium_pricing.html` is a design reference for the pricing page — check it when working on pricing.

## Brand Tokens (do not invent, do not override)
- **Primary green:** `--green: #3aaa35`
- **Dark green:** `--green-dark: #2a8226`
- **Light green:** `--green-light: #edf7ec`
- **Teal accent:** `--teal: #0fb8c9`
- **Dark:** `--dark: #1a2e1a`
- **Display font:** Sora (all headings, buttons, labels)
- **Body font:** Inter
- **Button shadow:** `0 4px 16px rgba(58,170,53,0.28)`
- These tokens are defined in every page's `<style>` block. Never change them or add alternatives.

## Multi-Page Consistency
- This site has 5 pages: `index.html`, `pricing.html`, `window-cleaning.html`, `steam-cleaning.html`, `post-renovation-cleaning.html`.
- Before editing any page, read at least one other page to verify nav, footer, CSS variable definitions, and button styles — then match them exactly.
- Nav and footer HTML must be **identical** across all pages (same links, same logo, same lang toggle, same contact CTA).
- Do not add CSS variables or redefine brand tokens inside a single page — they are always in `:root {}` at the top of `<style>`.

## Bilingual Copy (FI / EN)
- All user-facing copy must exist in **both Finnish and English**.
- **Finnish is the primary language** (`lang="fi"`). Every page initialises to Finnish on load: `setLang('fi')`.
- The toggle uses `data-en="..."` and `data-fi="..."` attributes on every translatable element.
- The language script (`setLang` function) is identical on all pages — copy it exactly, do not modify.
- Never add English-only content. Every string added must have both `data-en` and `data-fi` values.
- When adding new translatable elements, follow the existing pattern: `<element data-en="English text" data-fi="Finnish text"></element>`.

## SEO
- Every page must have: `<title>`, `<meta name="description">`, `<meta name="keywords">`, `<link rel="canonical">`, `og:title`, `og:description`, `og:type`.
- Include Finnish keywords in `<meta name="keywords">` alongside English terms.
- Canonical URLs use the format `https://betterclean.fi/page-name.html` (no trailing slash except on index: `https://betterclean.fi/`).
- Never remove or simplify existing meta tags when editing a page.

## AEO — AI Search Optimisation (Answer Engine Optimisation)
- Every page must include a `<script type="application/ld+json">` block with appropriate Schema.org structured data.
- Schema types by page:
  - `index.html` → `LocalBusiness` + `WebSite`
  - `pricing.html` → `LocalBusiness` + `Service` offers with prices
  - `window-cleaning.html` → `Service` + `FAQPage`
  - `steam-cleaning.html` → `Service` + `FAQPage`
  - `post-renovation-cleaning.html` → `Service` + `FAQPage`
- FAQ sections must use plain conversational language — AI assistants pull answers directly from these.
- Never remove structured data when editing pages.
- When adding new FAQ items to the HTML, add matching `Question`/`Answer` entries to the JSON-LD block on the same page.

## Before Major Changes — Bug & Error Prevention
- **Create a git save point first:** `git add -A && git commit -m "Save point before [description]"` — always do this before significant edits.
- **Take a "before" screenshot** of all affected pages before making changes.
- After changes, validate HTML: `npx html-validate *.html`
- Do a visual pass across **all 5 pages**, not just the edited one — nav/footer changes affect every page.
- After changes, take an "after" screenshot and compare explicitly against the "before".

## Git — Save Points & Revert
- The project is a git repository. Every commit is a save point you can return to at any time.
- To see all save points: `git log --oneline`
- To revert a single file to the last commit: `git checkout -- filename.html`
- To revert everything to the last commit: `git checkout -- .`
- To restore a specific file from any past commit: `git checkout <hash> -- filename.html`
- Never force-push or reset hard without user confirmation.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Use the brand tokens above.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Typography — Punctuation
- **Never use en dashes (–) or em dashes (—)** anywhere in the site copy.
- Replace em dash (—) with ` - ` (space-hyphen-space) if a pause/separator is needed.
- Replace en dash (–) with a regular hyphen `-` for ranges (e.g., `3-6 months`).
- This applies to all HTML attributes, visible text, `data-en`/`data-fi` values, JSON-LD strings, `<title>`, and `<meta>` tags.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
- Do not remove or alter JSON-LD structured data blocks
- Do not add content in only one language — always both FI and EN
- Do not use en dashes (–) or em dashes (—) — use hyphens instead

---

## Project Overview

**Business:** BetterClean — premium home cleaning company based in Tampere, Finland.
**Goal:** Keep the website running, improve SEO + AEO (AI search optimisation), and convert visitors to quote requests.
**Local path:** `/Users/venm3/Desktop/FINLAND BUSINESS/Better Clean/Better Clean Website/`
**GitHub:** `https://github.com/ventot-pixel/betterclean-website01` (branch: main)
**Live domain:** `https://betterclean.fi`
**Stack:** Static HTML5, Tailwind CSS via CDN, vanilla JS, no build tools.
**Dev server:** `node serve.mjs` → `http://localhost:3000`

---

## Canonical Pricing (source of truth — update here first, then update pricing.js)

All prices include VAT 25.5%. Kotitalousvähennys = 35% off labour, omavastuu 150 €/hlö/vuosi.

| Service | Rate | After kotitalousvähennys | Minimum |
|---|---|---|---|
| Recurring home cleaning | 57 €/h | 37,05 €/h | 2 h |
| One-time home cleaning | 65 €/h | 42,25 €/h | 2 h |
| Deep cleaning / suursiivous | 69 €/h | 44,85 €/h | 3 h |
| Move-out / muuttosiivous | 69 €/h | 44,85 €/h | 4 h |
| Window cleaning / ikkunanpesu | 69 €/h | 44,85 €/h | 2 h |
| Post-renovation / remonttisiivous | 75 €/h | 48,75 €/h | 4 h |

**Window cleaning estimates:**
- Apartment: 119-159 €
- House: 179-229 €
- Balcony glazing add-on: +59 €

**Steam cleaning (fixed-price menu — no per-hour rate shown):**
- Single mattress: 89 €
- Double mattress: 129 €
- 2-seat sofa: 129 €, additional seat +35 €
- Armchair: 89 €
- Bathroom / sauna: alkaen 149 €

**Kotitalousvähennys disclaimer (use verbatim):**
FI: "Kotitalousvähennys 35 % työn osuudesta, kun palvelu ostetaan yritykseltä. Omavastuu 150 €/hlö/vuosi. Materiaalit ja matkakulut eivät kuulu vähennykseen."
EN: "Household tax deduction: 35% of labour costs when purchased from a registered company. Personal deductible: €150/person/year. Materials and travel costs are not deductible."

**Price format rules:**
- Finnish format always: `57 €/h`, `37,05 €/h`, `119 €`, `+59 €`
- Never: `€57/hr`, `€57/h`, `45.50`, `+€60/session`
- Show kotitalousvähennys exact amounts ONLY for labor-only hourly rates
- Do NOT show exact after-tax amounts for fixed-price or bundled items

---

## File Map

| File | Purpose | Key sections |
|---|---|---|
| `index.html` | Homepage | Hero, service tier cards (3), specialty strip, why section, booking widget (3-step), testimonials, contact |
| `pricing.html` | Full pricing page | Core service cards, steam fixed menu, extraction table, add-ons, packages, notes box |
| `window-cleaning.html` | Window cleaning service | What's included checklist, price table card, why professional, FAQ (5 items) |
| `steam-cleaning.html` | Steam cleaning service | What we steam, fixed-price card, why steam, comparison table, FAQ |
| `post-renovation-cleaning.html` | Post-reno service | What's included checklist, price card, why specialist, 4-step process, FAQ |
| `pricing.js` | Centralized price constants | All prices as JS constants, booking widget calculator |
| `serve.mjs` | Dev server | Serves project root at localhost:3000 |
| `screenshot.mjs` | Puppeteer screenshots | Saves to `./temporary screenshots/screenshot-N.png` |
| `brand_assets/` | Logo, images | `betterclean-logo.png` is canonical logo |
| `brand_assets/premium_pricing.html` | Design reference | Check when working on pricing page layout |

**Important shared patterns across all pages:**
- Nav: logo + lang toggle (FI default) + hamburger mobile menu
- Footer: logo, services list, company links, Tampere contact
- Language script: `setLang(lang)` function — identical on all pages, never modify
- CSS variables in `:root {}` — never redefine per-page
- JSON-LD structured data block — never remove

---

## AEO Strategy (AI Search Optimisation)

The goal is for AI assistants (ChatGPT, Codex, Perplexity, Google AI) to recommend BetterClean when someone asks "best cleaning company in Tampere" or "how much does window cleaning cost in Finland."

**What's in place:**
- JSON-LD on every page (LocalBusiness, Service, FAQPage schemas)
- FAQ sections written in plain conversational Finnish + English
- Prices in visible text AND JSON-LD (AI crawlers read both)
- Bilingual content (Finnish primary, English secondary)
- Canonical URLs + og: tags

**What to improve next:**
- Add `Review`/`AggregateRating` schema once reviews are collected
- Add `HowTo` schema to the booking process section on index.html
- Expand FAQ sections — aim for 8-10 questions per service page
- Add a blog/articles section for long-tail keyword capture
- Add `serviceArea` with postcodes to JSON-LD for hyper-local signals

---

## Known Issues / Next Steps

**Active issues:**
- Booking widget on index.html shows a dynamic estimated price but no real payment integration — it is UI only. Treat it as a quote request form.
- No analytics yet (Google Analytics / Plausible) — no conversion tracking.
- No contact form backend — the booking form submits nowhere currently.

**Priority backlog (in order):**
1. Contact form backend (Formspree or similar — no server needed)
2. Google Analytics 4 + conversion event on form submit
3. Add 3-5 real customer reviews + AggregateRating schema
4. Expand FAQ to 8+ questions per service page (AEO boost)
5. Blog section: "How often should you clean your windows in Finland?" type posts
6. Add HowTo schema to booking process section

**Pricing change workflow (when prices change):**
1. Update the table in this AGENTS.md first
2. Update `pricing.js` constants
3. Run `node update-prices.mjs` if it exists, or manually grep + update all 5 HTML files
4. Update JSON-LD price values in each page's structured data
5. Run `npx html-validate *.html`
6. Screenshot all 5 pages
7. Commit with message "Update pricing: [what changed]"
