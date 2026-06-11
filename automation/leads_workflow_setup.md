# BetterClean Lead Workflow — Setup & Status

Built 2026-06-11. Form → email + WhatsApp + Google Sheet + retargeting pixels.

## How it flows
1. Visitor submits booking or inquiry form on `request-quote.html`.
2. Frontend POSTs to `/api/lead` (Vercel serverless function).
3. `api/lead.js` fans out: Resend email → Telegram → WhatsApp (CallMeBot) → Google Sheet (Apps Script webhook).
4. If marketing consent was granted, the browser fires `Lead` (Meta) and `generate_lead` (Google) conversion events.
5. `consent.js` on every page loads Meta Pixel + Google Tag after the visitor accepts cookies — this builds the retargeting audience for future ads.

Each channel is env-gated: missing env vars just skip that channel, nothing breaks.

## Vercel environment variables (project settings → Environment Variables)
| Variable | Purpose | Status |
|---|---|---|
| `RESEND_API_KEY` | Email delivery | verify it's set |
| `BETTERCLEAN_LEAD_EMAIL` | Recipient (default info@betterclean.fi) | optional |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Telegram ping | optional, already coded |
| `CALLMEBOT_PHONE` | WhatsApp number incl. country code, e.g. +358... | **Ven: needed** |
| `CALLMEBOT_APIKEY` | From CallMeBot pairing (below) | **Ven: needed** |
| `SHEETS_WEBHOOK_URL` | Apps Script web app URL | **Ven: needed** |
| `SHEETS_WEBHOOK_SECRET` | Same secret as in the Apps Script | **Ven: needed** |

## Ven's one-time actions
1. **WhatsApp (free, ~2 min):** From your phone, send the message `I allow callmebot to send me messages` via WhatsApp to CallMeBot's number (current number at https://www.callmebot.com/blog/free-api-whatsapp-messages/). It replies with your API key. Put phone + key in Vercel.
2. **Google Sheet (~3 min):** Follow the steps at the top of `leads_sheet_webhook.gs` — paste it into Apps Script on the leads sheet, set the secret, deploy as web app, copy URL into Vercel.
3. **Meta Pixel:** Create a pixel in Meta Events Manager (needs Meta Business account for BetterClean). Put the Pixel ID into `META_PIXEL_ID` in `consent.js`.
4. **Google Tag:** Create a Google Ads account (or GA4 property) and put the tag ID (`AW-...` or `G-...`) into `GOOGLE_TAG_ID` in `consent.js`.
5. Redeploy the site.

## GDPR notes
- Pixels load **only after** the visitor clicks "Hyväksy" on the consent bar. "Vain välttämättömät" stores a denial and never loads them.
- If both pixel IDs are empty, no banner is shown and nothing loads — current deployed state is unchanged until IDs are added.
- `privacy-policy.html` should be updated to mention Meta/Google marketing cookies once pixels go live.

## Retargeting: how ads-to-past-visitors works once live
- Meta: Events Manager → Audiences → create "Website visitors, last 180 days" custom audience → use it in any FB/IG campaign.
- Google: the tag builds a remarketing list automatically → attach it to a Google Ads display/search campaign.
- Audiences start filling from the day the pixel goes live, so install now even though ads come later.
