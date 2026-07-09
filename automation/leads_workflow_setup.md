# BetterClean Lead Workflow — Setup & Status

Built 2026-06-11. Form -> email + optional WhatsApp owner alert + Google Sheet + Command Center CRM + retargeting pixels.
Upgraded 2026-06-15 into the AI Automaatio customer-zero Speed-to-Lead install. Details: `automation/speed_to_lead_install.md`.

## How it flows
1. Visitor submits booking or inquiry form on `request-quote.html`.
2. Frontend POSTs to `/api/lead` (Vercel serverless function).
3. `api/lead.js` fans out: owner notification by Resend email -> Telegram -> optional WhatsApp owner alert (CallMeBot) -> customer acknowledgement email -> Google Sheet (Apps Script webhook) -> Command Center CRM.
4. If marketing consent was granted, the browser fires `Lead` (Meta) and `generate_lead` (Google) conversion events.
5. `consent.js` on every page loads Meta Pixel + Google Tag after the visitor accepts cookies — this builds the retargeting audience for future ads.
6. `whatsapp-widget.js` adds a floating click-to-chat widget on public pages. It auto-opens shortly after page load, remains dismissable, opens the visitor's own WhatsApp to BetterClean's public number, and does not require CallMeBot.

Each channel is env-gated: missing env vars just skip that channel, nothing breaks.

## Vercel environment variables (project settings → Environment Variables)
| Variable | Purpose | Status |
|---|---|---|
| `RESEND_API_KEY` | Email delivery | verify it's set |
| `BETTERCLEAN_LEAD_EMAIL` | Recipient (default info@betterclean.fi) | optional |
| `BETTERCLEAN_REPLY_FROM` | Sender for customer acknowledgement emails | optional |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Telegram ping | optional, already coded |
| `CALLMEBOT_PHONE` | WhatsApp number incl. country code, e.g. +358... | optional backend WhatsApp owner alert |
| `CALLMEBOT_APIKEY` | From CallMeBot pairing (below) | optional backend WhatsApp owner alert |
| `SHEETS_WEBHOOK_URL` | Apps Script web app URL | **Ven: needed** |
| `SHEETS_WEBHOOK_SECRET` | Same value as the Apps Script `SHEETS_WEBHOOK_SECRET` Script Property | **Ven: needed** |
| `CRM_WEBHOOK_URL` | Command Center `/api/crm/leads/ingest` URL | needed for CRM sync |
| `CRM_WEBHOOK_SECRET` | Same value as Command Center `CRM_INGEST_SECRET` | needed for CRM sync |

Note: the website WhatsApp popup uses `https://wa.me/358415769236` and does not need env vars. CallMeBot is only for automatic owner alerts from the backend.

## Open TODO
- [ ] Get the CallMeBot API key from the BetterClean owner phone and add `CALLMEBOT_PHONE` + `CALLMEBOT_APIKEY` in Vercel if backend WhatsApp owner alerts are wanted.

## Ven's one-time actions
1. **WhatsApp backend owner alert (optional, free, ~2 min):** If BetterClean wants automatic WhatsApp alerts in addition to email/Telegram, send the message `I allow callmebot to send me messages` from the owner phone via WhatsApp to CallMeBot's number (current number at https://www.callmebot.com/blog/free-api-whatsapp-messages/). It replies with an API key. Put the owner phone + key in Vercel as `CALLMEBOT_PHONE` and `CALLMEBOT_APIKEY`.
2. **Google Sheet (~3 min):** Follow the steps at the top of `leads_sheet_webhook.gs` — paste it into Apps Script on the leads sheet, set a new `SHEETS_WEBHOOK_SECRET` in Script Properties, deploy as web app, copy URL into Vercel, and set the same `SHEETS_WEBHOOK_SECRET` value in Vercel.
3. **Command Center CRM:** Apply `Operations/command-center/supabase/migrations/20260625_crm_leads.sql`, set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRM_INGEST_SECRET` in Command Center, then set `CRM_WEBHOOK_URL` and `CRM_WEBHOOK_SECRET` in the BetterClean website Vercel project.
4. **Meta Pixel:** Create a pixel in Meta Events Manager (needs Meta Business account for BetterClean). Put the Pixel ID into `META_PIXEL_ID` in `consent.js`.
5. **Google Tag:** Create a Google Ads account (or GA4 property) and put the tag ID (`AW-...` or `G-...`) into `GOOGLE_TAG_ID` in `consent.js`.
6. Redeploy the site.

## GDPR notes
- Pixels load **only after** the visitor clicks "Hyväksy" on the consent bar. "Vain välttämättömät" stores a denial and never loads them.
- If both pixel IDs are empty, no banner is shown and nothing loads — current deployed state is unchanged until IDs are added.
- `privacy-policy.html` should be updated to mention Meta/Google marketing cookies once pixels go live.

## Secret rotation note
- Do not commit webhook secrets to this repo.
- If a webhook secret ever appears in source, rotate it immediately: generate a new value, update Apps Script Project Settings -> Script Properties, update Vercel `SHEETS_WEBHOOK_SECRET`, then redeploy.
- The Apps Script source reads the value with `PropertiesService`; the repo should only contain the property name.

## Retargeting: how ads-to-past-visitors works once live
- Meta: Events Manager → Audiences → create "Website visitors, last 180 days" custom audience → use it in any FB/IG campaign.
- Google: the tag builds a remarketing list automatically → attach it to a Google Ads display/search campaign.
- Audiences start filling from the day the pixel goes live, so install now even though ads come later.
