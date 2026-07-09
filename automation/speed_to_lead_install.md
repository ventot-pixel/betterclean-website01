# BetterClean Speed-to-Lead Install

**Installed:** 2026-06-15  
**Purpose:** Customer-zero implementation for AI Automaatio's Speed-to-Lead Sprint.

## Live Flow

```text
Visitor submits BetterClean form
-> /api/lead receives structured lead payload
-> owner notification goes to configured delivery channels
-> customer receives instant acknowledgement email when email + Resend are available
-> lead is logged to Google Sheet when the Sheets webhook is configured
-> lead is synced to Command Center CRM when the CRM webhook is configured
-> page shows success state, or falls back to a prefilled mailto draft
```

Visitors can also start a WhatsApp conversation from the floating site widget:

```text
Page loads and WhatsApp widget opens automatically
-> clicks "Avaa WhatsApp" / "Open WhatsApp"
-> wa.me opens a prefilled message to +358 41 576 9236
```

## Entry Points

- Homepage booking widget: `index.html`
- Quote page booking form: `request-quote.html`
- Quote page inquiry form: `request-quote.html`
- Floating WhatsApp widget: `whatsapp-widget.js` auto-opens on each page load/new tab and remains dismissable

## Backend

- Endpoint: `api/lead.js`
- Accepts: `POST` JSON only
- Rejects: `GET` and other methods with `405`
- Owner delivery: Resend, Telegram, optional CallMeBot WhatsApp alert
- Storage: Google Sheet webhook and Command Center CRM webhook
- Customer acknowledgement: Resend email to the submitted customer email
- WhatsApp click-to-chat: `wa.me/358415769236`
- CRM lead name fallback: if an inquiry has no submitted name, the website sends
  email, phone, or `Website inquiry` as the CRM customer name so incomplete leads
  are still stored.

## Environment Variables

Required for direct owner email:

- `RESEND_API_KEY`

Optional:

- `BETTERCLEAN_LEAD_EMAIL` - owner recipient, defaults to `info@betterclean.fi`
- `BETTERCLEAN_LEAD_FROM` - sender for owner notifications
- `BETTERCLEAN_REPLY_FROM` - sender for customer acknowledgement emails
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `CALLMEBOT_PHONE` - optional backend WhatsApp owner alert
- `CALLMEBOT_APIKEY` - optional backend WhatsApp owner alert
- `SHEETS_WEBHOOK_URL`
- `SHEETS_WEBHOOK_SECRET`
- `CRM_WEBHOOK_URL`
- `CRM_WEBHOOK_SECRET`

## Verification Without Sending A Real Lead

Use these checks when changing the flow:

```bash
npm run check
curl -sI https://www.betterclean.fi/api/lead
```

Expected endpoint result for `GET`:

```text
HTTP/2 405
allow: POST
```

Do not submit a live `POST` test without Ven approval because it can notify Telegram/email and write to the leads sheet.

## Production Deploy Note

From Codex, the reliable Vercel deploy path is:

```bash
env NPM_CONFIG_CACHE=/private/tmp/betterclean-npm-cache npx -y -p node@22 -p vercel@54.20.1 vercel --prod --yes --token "$VERCEL_API_TOKEN"
```

The default system Node 24 + Vercel CLI path can fail before upload, and the
CLI auth file path may not be writable in the sandbox. Pass the token by env
reference only; never print token values while debugging auth.

## What This Proves For AI Automaatio

BetterClean can now be shown as a real implementation of the flagship package:

- lead capture on existing website
- instant owner notification
- customer acknowledgement
- Google Sheet logging path
- Command Center CRM sync path
- mailto fallback
- WhatsApp click-to-chat path
- optional backend WhatsApp owner-alert path when CallMeBot credentials are configured
- GDPR-aware consent/pixel setup through `consent.js`

This is the proof base for the BetterClean case-study one-pager and sales demo.
