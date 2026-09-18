# Parkkar — Full-Stack Smart Parking Platform

Parkkar is a smart parking marketplace and management platform built with PostgreSQL, Node.js/Express, Next.js/React, Razorpay, data-driven recommendations, QR verification, and role-based user/partner/admin workspaces.

## Verification status (latest audit pass)

A verification pass was run against this package. Full evidence is in
`FINAL-AUDIT.md`; a condensed list is in `REQUIREMENTS-CHECKLIST.md`.

**One genuine bug was found and fixed:** a temporal-dead-zone crash in
`phase-3-frontend/src/app/bookings/new/page.tsx`
(`ReferenceError: Cannot access 'vehicleType' before initialization`) that
would have broken the booking flow at its first step. `const vehicleType` was
declared after two `useEffect` calls that referenced it in their dependency
arrays. The derived declarations were moved above those effects — statement
reordering only, no behaviour change.

**Verified by execution:** backend syntax (51 files), frontend syntax and
type-independent errors (84 files), `@/...` import resolution, internal link
integrity (zero dead links), frontend-to-backend API contract match, seed
foreign-key and primary-key integrity, all 9 Parkkar Care prices, all 9 mall
records, Z Square B1/B2/B3 slot data, and root-level `LanguageProvider`
coverage.

**Not verified, and not claimed:** the audit environment had no network
access, so dependencies could not be installed. Browser end-to-end testing,
`next build`, live Google Maps, real Razorpay transactions, runtime QR
scanning, responsive/visual QA, and the backend integration test suite are all
**NOT VERIFIED**. No payment success, map load, or QR scan result was
simulated or faked.

Recommended first step on your machine:

```bash
cd phase-3-frontend && npm install && npx tsc --noEmit && npm run build
```

## Roadmap status

- Phase 0 — Foundations / Learning: ✅
- Phase 1 — Database: ✅
- Phase 2 — Backend: ✅
- Phase 3 — Frontend: ✅
- Phase 4 — Maps + Payments: 🟡 Razorpay complete; Google Maps billing/account setup remains pending
- Phase 5 — AI Recommendation: ✅ data-driven recommendation engine + preferences
- Phase 6 — QR Verification: ✅ signed booking QR + partner/admin entry/exit verification
- Phase 7 — Admin Dashboard: ✅ monitoring + parking lifecycle controls
- Phase 8 — Deployment + Documentation: ✅ deployment-ready Dockerfiles and docs

## Local setup

### Database

Apply the Phase 1 schema and seed first. Then apply the Phase 4 Razorpay patch and Phase 6 QR patch:

```bash
psql -d parkkar -f "Phase 1 - Database/schema.sql"
psql -d parkkar -f "Phase 1 - Database/seed.sql"
psql -d parkkar -f "Phase 2 - Bacend/database/phase4_razorpay.sql"
psql -d parkkar -f "Phase 1 - Database/phase6_qr.sql"
```

### Backend

```bash
cd "Phase 2 - Bacend"
npm install
cp .env.example .env
npm run dev
```

Required backend environment variables:

```env
DATABASE_URL=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CORS_ORIGIN=http://localhost:3000
PORT=4000
```

### Frontend

```bash
cd "phase-3-frontend"
npm install
cp .env.example .env.local
npm run dev
```

Set:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Phase 5 — Recommendation

The public parking page obtains browser geolocation and sends optional vehicle type, max price, and start/end time preferences to the recommendation API. The backend scores distance, price, availability, and rating and returns a recommendation score plus short reasons.

Endpoint:

```text
GET /api/parking/recommendations
```

## Phase 6 — QR verification

Confirmed/active booking pages generate a signed QR payload. A partner/admin opens `/qr/verify?token=...` and can verify:

```text
ENTRY: CONFIRMED -> ACTIVE
EXIT:  ACTIVE -> COMPLETED
```

The database patch adds verification timestamps to `bookings`.

## Phase 7 — Admin

Admin parking management includes status controls for:

```text
PENDING_APPROVAL
ACTIVE
INACTIVE
```

The backend already protects the endpoint with ADMIN role authorization.

## Phase 8 — Deployment

Dockerfiles are included for both frontend and backend. For production:

1. Use a managed PostgreSQL instance.
2. Set secrets only in the hosting provider's secret/environment manager.
3. Deploy the backend as a Node container/service.
4. Deploy the Next.js frontend to a Next.js-compatible host.
5. Set the frontend API URL to the deployed backend HTTPS URL.
6. Configure CORS to the deployed frontend origin.
7. Keep Razorpay live credentials server-side only.
8. Complete the Google Maps billing/API-key setup and restrict the browser key before enabling live maps.

Actual cloud deployment still requires the user's hosting/cloud accounts and production credentials; this package contains the application/deployment configuration, not those private account actions.

## Final audit
See `FINAL-AUDIT.md` for the checks performed before packaging and the remaining external-production prerequisites.
