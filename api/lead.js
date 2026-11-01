// BetterClean lead endpoint. The engine is the shared Speed-to-Lead package, synced from
// Open Brain Operations/speed-to-lead into api/_speed-to-lead (edit it there, not here).
// This project's existing Vercel variables are read through envAliases in the client config.
const engine = require('./_speed-to-lead/handler');
const client = require('./_speed-to-lead/betterclean');

module.exports = engine.createLeadHandler({ [client.id]: client }, { defaultClient: client.id });
module.exports.formatCustomerReply = (payload) => engine.formatCustomerReply(payload, client);
module.exports.getLeadRecipients = () => engine.getLeadRecipients(client);
module.exports.validateLeadPayload = (payload) => engine.validateLeadPayload(payload, client);
module.exports.checkRateLimit = (req, now) => {
  const ip = engine.getRequestIp(req);
  return ip ? engine.checkRateLimit(client.id + ':' + ip, now) : { allowed: true };
};
