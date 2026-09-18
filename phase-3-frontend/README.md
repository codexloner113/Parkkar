# Parkkar Phase 3 — Frontend

Premium Next.js frontend for the Parkkar smart-parking platform.

## Run locally

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` and expects the Phase 2 backend on `http://localhost:4000`.

Create `.env.local` from `.env.example` when you want to override the API base URL.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Axios · TanStack React Query · lucide-react

## Notes

Phase 2 mock payments are intentionally labeled as development-only in the UI. Backend responses remain the source of truth for booking totals and access control.


## Phase 5–8 additions

The frontend includes data-driven parking recommendations with location/preferences, booking QR display and a partner/admin QR verification page, admin parking lifecycle controls, and production Docker support. Google Maps remains pending Google Cloud billing/API-key activation.
