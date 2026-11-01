// GENERATED from Open Brain Operations/speed-to-lead — do not edit here; edit there and run sync-betterclean.js.
// Mirrors the live betterclean.fi api/lead.js copy (tests/parity.test.js checks it stays identical).
module.exports = {
  id: 'betterclean',
  name: 'BetterClean',
  allowedOrigins: ['https://betterclean.fi', 'https://www.betterclean.fi'],
  ownerEmail: 'info@betterclean.fi',
  leadFrom: 'BetterClean Website <onboarding@resend.dev>',
  replyFrom: 'BetterClean <onboarding@resend.dev>',
  defaultLanguage: 'fi',
  requireService: true,
  timeZone: 'Europe/Helsinki',
  // betterclean.fi runs this engine in its own Vercel project with its existing variable names.
  envAliases: {
    LEAD_EMAIL: ['BETTERCLEAN_LEAD_EMAIL'],
    LEAD_FROM: ['BETTERCLEAN_LEAD_FROM'],
    REPLY_FROM: ['BETTERCLEAN_REPLY_FROM'],
    CRM_URL: ['CRM_WEBHOOK_URL', 'CRM_INGEST_URL'],
    CRM_SECRET: ['CRM_WEBHOOK_SECRET', 'CRM_INGEST_SECRET'],
    CRM_BOARD_URL: ['BETTERCLEAN_CRM_BOARD_URL'],
    CRM_OWNER: ['BETTERCLEAN_LEAD_OWNER'],
    TELEGRAM_CHAT_ID: ['TELEGRAM_CHAT_ID'],
    CALLMEBOT_PHONE: ['CALLMEBOT_PHONE'],
    CALLMEBOT_APIKEY: ['CALLMEBOT_APIKEY'],
    SHEETS_WEBHOOK_URL: ['SHEETS_WEBHOOK_URL'],
    SHEETS_WEBHOOK_SECRET: ['SHEETS_WEBHOOK_SECRET']
  },
  crm: {
    business: 'BetterClean',
    owner: 'Ven',
    boardUrl: 'https://cc.betterclean.fi/workspaces/betterclean/crm'
  },
  reply: {
    fi: {
      subject: 'Saimme pyyntösi - BetterClean',
      greeting: 'Hei',
      intro: 'Kiitos yhteydenotosta. Saimme pyyntösi ja tarkistamme tiedot mahdollisimman pian.',
      notes: [
        'Maksat siivouksen jälkeen. Emme veloita erillisiä väline-, tarvike- tai käyntimaksuja, ja matkat ovat maksuttomia 20 km säteellä Tampereen keskustasta.',
        'Siivoustyö voi oikeuttaa kotitalousvähennykseen. Vähennysoikeuteen ja omavastuuseen liittyy ehtoja; tarkista ajantasaiset tiedot osoitteesta vero.fi.'
      ],
      contact: 'Jos asialla on kiire, voit olla meihin suoraan yhteydessä osoitteessa info@betterclean.fi.',
      signoff: ['Ystävällisin terveisin,', 'Joven / BetterClean']
    },
    en: {
      subject: 'We received your request - BetterClean',
      greeting: 'Hi',
      intro: 'Thanks for contacting BetterClean. We received your request and will review the details as soon as possible.',
      notes: [
        'You pay after the cleaning is complete. There are no separate equipment, supply or visit fees, and travel is free within 20 km of Tampere centre.',
        'Cleaning work may qualify for the household deduction. Eligibility and deductible conditions apply; check the current rules at vero.fi.'
      ],
      contact: 'If anything is urgent, you can also contact us directly at info@betterclean.fi.',
      signoff: ['Best regards,', 'Joven / BetterClean']
    }
  }
};
