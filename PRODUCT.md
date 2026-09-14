# BetterClean pricing contract

- Essential Home Care includes accessible surface dusting up to 1.8 m, vacuuming, material-safe damp mopping, mirrors and non-window glass, light marks on handles/switches/door frames, and bin emptying with disposal access. Kitchen appliance exteriors and routine bathroom/shower cleaning are included. Bed making is included; dishwasher loading and changing clean bed linen left ready on the bed are on request within booked time. Appliance interiors, hood filters, sauna, windows, cupboard interiors, heavy buildup and upholstery need separately agreed services. Ceiling/high-access cleaning, heavy furniture moving, dismantling drains/ventilation fittings and renovation cleaning are excluded from Essential. Deep cleaning retains detailed frame/switch/baseboard cleaning and its existing specialist scope.

- Prices include 25.5% VAT. Tax-credit illustrations are conditional examples, not amounts customers pay.
- `pricing.js` owns rates, booking durations and the textile rate card. After a textile change run `node update-prices.mjs`, then `npm test`.
- Quote-form add-ons use ADDON_HOURS at the booked service hourly rate: oven 1 h, fridge 1 h, hood 0.5 h, microwave 0.25 h and sauna 1 h. Extra person-hours appear in the duration summary and are added to the estimate. Included move-out appliances cannot be charged again. Duration selection and estimates enforce each service minimum.
- Home cleaning frequency determines the rate on every visit, including the first. Weekly, fortnightly, every four weeks and one-time visits are separate tiers. Size-based totals are estimates; unusual homes require confirmation.
- Window cleaning is quoted at €49/person-hour with a two-hour standalone minimum and one-hour minimum when added to home cleaning. No instant booking based on apartment size alone.
- Textile extraction and steam-assisted textile treatment are different options. Steam is used only on suitable materials. Protection is an optional paid add-on. A textile home visit has a €69 minimum, even when an individual item's listed price is lower.
- The €149 extraction bundle covers one accessible side of a 160 cm mattress and a three-seat sofa in one visit. Steam, protection, additional sides and exceptional treatment are excluded and quoted separately. Its component total is €178 and its saving is €29.
- Packages with unspecified window duration, textile materials or optional protection require itemised quotes. Do not claim a saving without a defined comparison using the same scope.
- HEPA-filtered vacuuming is included in post-renovation cleaning. The separate allergy-treatment add-on must not be charged merely to supply the equipment already included.
- Neighbour prices are a separate, time-limited promotion; sofa and window prices there are add-ons to that visit, not standalone rates. Promotion scope and expiry must be visible and match JSON-LD.
- Travel terms differ between hourly services and textile visits. Any applicable travel, parking or exceptional-treatment charge is agreed before work.
- A lead form requests confirmation; it does not take payment or establish an unconditional booking.

## Home timing and tariff approved 14 September 2026

Weekly €49/h, fortnightly €52/h, every four weeks €55/h, ordinary one-time €59/h. `HOME_DURATION_BY_SIZE` owns explicit maintenance durations. First visits use the longer home-size baseline at the same contracted hourly rate. For 60–79 m²: first/one-time 4 h, fortnightly maintenance 3.5 h, four-weekly 4 h, weekly maintenance 3 h. These are estimates subject to agreed condition and scope. Other home-size baselines receive one additional person-hour; specialist durations are unchanged. Manual shorter selections retain the existing scope warning. The existing “more time” wording is retained at Ven’s request.

Window cleaning bills at €49/person-hour: standalone minimum 2 h (€98), home-cleaning add-on minimum 1 additional hour (€49). Window time and total are confirmed before booking from photos, counts, opening sections, glass surfaces and access. Accessible glass, frames and sills included; blinds, balcony glazing and difficult access quoted separately. Windows are excluded from the automatic home estimate until confirmed. Timed add-ons assume normal condition; fridge emptied beforehand, heavy buildup and large saunas scoped before booking.
