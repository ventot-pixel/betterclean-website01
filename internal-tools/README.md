# BetterClean Internal Tools

This app is the first MVP for BetterClean's internal lead system.

## MVP goal

Capture leads from `www.betterclean.fi`, store them in a structured database, score them deterministically, and show them in an internal admin dashboard.

## Scope for version 1

- Website lead intake via `POST /api/leads`
- Deterministic validation and scoring
- Database schema for contacts, leads, and lead events
- Starter admin dashboard for viewing new leads
- Placeholder email flow for automatic replies and internal notifications

## Planned sources

- BetterClean website
- Facebook page and DMs
- Instagram profile and DMs
- TikTok attribution and inbound traffic

The first implemented source is the website only.

## Initial rules

- Deterministic scoring owns priority and workflow state
- AI can later assist with summaries, extraction, and suggested next steps
- Social channel ingestion can be added after website intake is stable

## MVP build order

1. Database schema
2. Website lead endpoint
3. Lead scoring
4. Auto-reply and internal alert service
5. Admin dashboard
6. Social channel integrations

## Run locally

1. Copy `.env.example` to `.env.local`
2. Install packages with `npm install`
3. Create the database and run `npx prisma db push`
4. Start with `npm run dev`

## Website payload

Expected lead payload from `betterclean.fi`:

```json
{
  "fullName": "Matti Meikalainen",
  "email": "matti@example.com",
  "phone": "+358401234567",
  "address": "Tampere",
  "language": "fi",
  "sourcePage": "https://www.betterclean.fi/",
  "serviceType": "window-cleaning",
  "propertySize": "small",
  "preferredDate": "2026-04-18",
  "preferredTime": "10:00",
  "notes": "Need balcony glazing too",
  "estimatedPrice": "159 €",
  "sourceChannel": "website_home"
}
```
