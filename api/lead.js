// BetterClean lead endpoint. The engine is the shared Speed-to-Lead package, synced from
// Open Brain Operations/speed-to-lead into api/_speed-to-lead (edit it there, not here).
// This project's existing Vercel variable names are mapped below. Single tenant, so the unprefixed
// names (TELEGRAM_CHAT_ID, CRM_WEBHOOK_URL, ...) can only ever mean BetterClean here.
const engine = require('./_speed-to-lead/handler');
const client = {
  ...require('./_speed-to-lead/betterclean'),
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
  }
};

module.exports = engine.createLeadHandler({ [client.id]: client }, { defaultClient: client.id });
module.exports.formatCustomerReply = (payload) => engine.formatCustomerReply(payload, client);
module.exports.getLeadRecipients = () => engine.getLeadRecipients(client);
module.exports.validateLeadPayload = (payload) => engine.validateLeadPayload(payload, client);
module.exports.checkRateLimit = (req, now) => {
  const ip = engine.getRequestIp(req);
  return ip ? engine.checkRateLimit(client.id + ':' + ip, now) : { allowed: true };
};
