# BetterClean pricing contract

- Prices include 25.5% VAT. Tax-credit illustrations are conditional examples, not amounts customers pay.
- `pricing.js` owns rates, booking durations and the textile rate card. After a textile change run `node update-prices.mjs`, then `npm test`.
- Quote-form appliance extras use the fixed add-on tariff, not extra hours multiplied by the chosen rate. Included move-out appliances cannot be charged again. Duration selection and estimates enforce each service minimum.
- Home cleaning frequency determines the rate on every visit, including the first. Weekly, fortnightly, every four weeks and one-time visits are separate tiers. Size-based totals are estimates; unusual homes require confirmation.
- Window cleaning is quoted at the hourly rate with a two-hour minimum. No instant booking based on apartment size alone.
- Textile extraction and steam-assisted textile treatment are different options. Steam is used only on suitable materials. Protection is an optional paid add-on. A textile home visit has a €69 minimum, even when an individual item's listed price is lower.
- The €149 extraction bundle covers one accessible side of a 160 cm mattress and a three-seat sofa in one visit. Steam, protection, additional sides and exceptional treatment are excluded and quoted separately. Its component total is €178 and its saving is €29.
- Packages with unspecified window duration, textile materials or optional protection require itemised quotes. Do not claim a saving without a defined comparison using the same scope.
- HEPA-filtered vacuuming is included in post-renovation cleaning. The separate allergy-treatment add-on must not be charged merely to supply the equipment already included.
- Neighbour prices are a separate, time-limited promotion; sofa and window prices there are add-ons to that visit, not standalone rates. Promotion scope and expiry must be visible and match JSON-LD.
- Travel terms differ between hourly services and textile visits. Any applicable travel, parking or exceptional-treatment charge is agreed before work.
- A lead form requests confirmation; it does not take payment or establish an unconditional booking.

## Home timing and tariff approved 14 September 2026

Weekly €49/h, fortnightly €52/h, every four weeks €55/h, ordinary one-time €59/h. `HOME_DURATION_BY_SIZE` owns explicit maintenance durations. First visits use the longer home-size baseline at the same contracted hourly rate. For 60–79 m²: first/one-time 4 h, fortnightly maintenance 3.5 h, four-weekly 4 h, weekly maintenance 3 h. These are estimates subject to agreed condition and scope. Other home-size baselines receive one additional person-hour; specialist durations are unchanged. Manual shorter selections retain the existing scope warning. The existing “more time” wording is retained at Ven’s request.
