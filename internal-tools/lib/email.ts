import type { BetterCleanLeadInput } from "@/lib/lead-schema";

export function buildAutoReply(input: BetterCleanLeadInput) {
  const serviceLabel = input.serviceType.replace(/-/g, " ");

  if (input.language === "en") {
    return {
      subject: "BetterClean quote request received",
      body: [
        `Hi ${input.fullName},`,
        "",
        "Thank you for your request to BetterClean.",
        `Requested service: ${serviceLabel}.`,
        "We will review your request and reply within 1 business day.",
        "",
        "If you need to add details, reply to this email or call +358 41 576 9236.",
        "",
        "BetterClean"
      ].join("\n")
    };
  }

  return {
    subject: "BetterClean tarjouspyyntö vastaanotettu",
    body: [
      `Hei ${input.fullName},`,
      "",
      "Kiitos tarjouspyynnöstäsi BetterCleanille.",
      `Pyydetty palvelu: ${serviceLabel}.`,
      "Käymme pyyntösi läpi ja vastaamme 1 arkipäivän kuluessa.",
      "",
      "Jos haluat lisätä tietoja, vastaa tähän sähköpostiin tai soita numeroon +358 41 576 9236.",
      "",
      "BetterClean"
    ].join("\n")
  };
}
