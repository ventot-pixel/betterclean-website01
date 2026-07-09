# BetterClean Internal Tools

This app is now a simple CRM V1 for BetterClean.

## What V1 includes

- Dashboard for daily operations
- Lead inbox for website and social channels
- Customer and property records
- Quote tracker
- Job schedule
- Invoice tracker
- Validation and scoring endpoint at `POST /api/leads`

## Why this version is simple

The goal is to prove the workflow first:

1. Capture a lead
2. Qualify it
3. Send a quote
4. Schedule the job
5. Track invoice follow-up

The current app uses mock CRM data in the UI so the team can validate the screens quickly. The next step is swapping the mock layer for your existing Supabase lead-gen tables and adding write actions.

## Recommended live data path

- Website forms -> Supabase `leads`
- WhatsApp, Facebook, Instagram, TikTok -> normalized into the same `leads` shape
- Won leads -> `customers`
- Customer addresses -> `properties`
- Quotes -> `quotes`
- Scheduled work -> `jobs`
- Billing status -> `invoices`

## Run locally

1. Install packages with `npm install`
2. Start with `npm run dev`
3. Open `http://localhost:3000`

## Lead payload

Expected payload for `POST /api/leads`:

```json
{
  "fullName": "Matti Meikalainen",
  "email": "matti@example.com",
  "phone": "+358401234567",
  "address": "Tampere",
  "language": "fi",
  "sourcePage": "https://www.betterclean.fi/",
  "sourcePlatform": "website",
  "serviceType": "window-cleaning",
  "propertySize": "small",
  "preferredDate": "2026-04-18",
  "preferredTime": "10:00",
  "notes": "Need balcony glazing too",
  "estimatedPrice": "159 €",
  "sourceChannel": "website_home",
  "contactPreference": "phone"
}
```
