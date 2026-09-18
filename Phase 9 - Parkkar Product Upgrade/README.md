# Parkkar Product Upgrade

This phase captures the product requirements discussed for the mobile-first Parkkar experience.

## Included
- Kanpur + Lucknow mall discovery seed data.
- Kanpur Z Square building-aware three-level parking layout: B1 bikes, B2/B3 cars.
- Slot states: available, unavailable/occupied for the selected time, maintenance, selected.
- Best-slot hints using exit/lift/cleaning-bay factors. These are UI recommendations, not a claim of live occupancy.
- Google Maps integration remains available through `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; without a key, a usable Parkkar map preview remains visible.
- Capital-city search directory plus Kanpur.
- Parkkar Care as a first-class booking feature: car by default, bike/EV/other support, interior/exterior/complete cleaning, EV charging, valet, tubeless puncture assistance and tyre air top-up.
- Hindi, English and Hinglish language switcher.
- Mobile-first navigation and booking layouts.
- Real backend availability remains authoritative. External mall billing/parking systems are not automatically accessible; operator permission/API integration is required before claiming live occupancy from those systems.

## Data notes
Mall facts were checked against public mall/operator or map sources during the build. A detailed slot map is shown only where a building parking layout is supported; otherwise the UI explicitly says the detailed floor map is unavailable rather than fabricating it.

Cleaning prices are designed around the affordable Parkkar target discussed during development. They are seed/demo prices and should be partner-configurable before production.
