# BetterClean Lead Workflow — Setup & Status

Built 2026-06-11 and extended locally on 2026-07-20. Form → Command Center CRM → owner alerts → customer confirmation → Google Sheet backup.

**Current release state:** the CRM connection is implemented and locally tested only. It has not been deployed, no Vercel settings were changed, and no live lead was submitted.

## How it flows
1. Visitor submits booking or inquiry form on `request-quote.html`.
2. Frontend POSTs to `/api/lead` (Vercel serverless function).
3. `api/lead.js` creates the lead in Command Center CRM using a private server-to-server connection.
4. The backend alerts the owner by email and Telegram, sends the customer a confirmation email, and keeps the Google Sheet as a backup log.
5. Every inquiry receives a private reference number. New CRM leads are assigned to the configured owner and marked for follow-up that day.
6. If CRM saving fails, the owner alert clearly says that manual CRM entry is required. The customer sees success only when the CRM or at least one owner-alert channel accepted the inquiry.
7. If marketing consent was granted, the browser fires `Lead` (Meta) and `generate_lead` (Google) conversion events.
8. `consent.js` on every page loads Meta Pixel + Google Tag after the visitor accepts cookies — this builds the retargeting audience for future ads.

Each optional channel is controlled through private environment settings. Command Center is the main lead record; the Sheet is a temporary safety copy, not a second CRM.

## Vercel environment variables (project settings → Environment Variables)
| Variable | Purpose | Status |
|---|---|---|
| `CRM_WEBHOOK_URL` | Command Center intake address: `https://cc.betterclean.fi/api/crm/leads/ingest` | **required before CRM rollout** |
| `CRM_WEBHOOK_SECRET` | Must match Command Center's private `CRM_INGEST_SECRET` | **required before CRM rollout** |
| `BETTERCLEAN_CRM_BOARD_URL` | Link placed in owner alerts | optional; BetterClean board is the default |
| `BETTERCLEAN_LEAD_OWNER` | Name assigned to new CRM leads | optional; defaults to `Ven` |
| `CRM_WEBHOOK_TIMEOUT_MS` | CRM request timeout, limited to 1–15 seconds | optional; defaults to 5 seconds |
| `RESEND_API_KEY` | Email delivery | verify it's set |
| `BETTERCLEAN_LEAD_EMAIL` | Recipient (default info@betterclean.fi) | optional |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Telegram ping | optional, already coded |
| `CALLMEBOT_PHONE` | WhatsApp number incl. country code, e.g. +358... | **Ven: needed** |
| `CALLMEBOT_APIKEY` | From CallMeBot pairing (below) | **Ven: needed** |
| `SHEETS_WEBHOOK_URL` | Apps Script web app URL | **Ven: needed** |
| `SHEETS_WEBHOOK_SECRET` | Same secret as in the Apps Script | **Ven: needed** |

## Review and rollout order
1. Run `npm test`. These tests replace CRM and messaging providers with fake local responses; they do not send or store anything.
2. Review the CRM field matching, owner name, customer confirmation, and failure wording.
3. After separate production approval, add `CRM_WEBHOOK_URL` and `CRM_WEBHOOK_SECRET` to Vercel.
4. Deploy only after the BetterClean and Command Center checks pass.
5. After separate approval to create a test record and send notifications, submit one clearly labelled synthetic lead and verify: website success, one CRM record, one owner alert, one customer confirmation, and one Sheet backup row.

Automatic retries are deliberately postponed until Command Center enforces the inquiry reference as a unique key. Retrying before that protection exists could create duplicate CRM leads. Until then, a CRM failure is made visible in the owner alert for manual recovery.

## Optional later actions
1. **WhatsApp:** Add the CallMeBot phone and API key if WhatsApp alerts are still wanted. Telegram and email already cover the main alert path.
2. **Google Sheet:** Keep the existing Apps Script webhook as a temporary safety copy; retire it later if CRM reliability and backups are sufficient.
3. **Meta Pixel:** Create a pixel in Meta Events Manager and add its ID to `consent.js` only after the privacy wording is approved.
4. **Google Tag:** Create a Google Ads account or GA4 property and add the tag ID to `consent.js` only after the privacy wording is approved.

## GDPR notes
- Pixels load **only after** the visitor clicks "Hyväksy" on the consent bar. "Vain välttämättömät" stores a denial and never loads them.
- If both pixel IDs are empty, no banner is shown and nothing loads — current deployed state is unchanged until IDs are added.
- `privacy-policy.html` should be updated to mention Meta/Google marketing cookies once pixels go live.

## Retargeting: how ads-to-past-visitors works once live
- Meta: Events Manager → Audiences → create "Website visitors, last 180 days" custom audience → use it in any FB/IG campaign.
- Google: the tag builds a remarketing list automatically → attach it to a Google Ads display/search campaign.
- Audiences start filling from the day the pixel goes live, so install now even though ads come later.
