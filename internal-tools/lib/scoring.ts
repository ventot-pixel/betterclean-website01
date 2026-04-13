import type { BetterCleanLeadInput } from "@/lib/lead-schema";
import type { LeadScoreResult } from "@/lib/types";

const PRIMARY_SERVICE_AREAS = [
  "tampere",
  "pirkkala",
  "ylöjärvi",
  "kangasala",
  "lempäälä",
  "nokia"
];

export function scoreBetterCleanLead(input: BetterCleanLeadInput): LeadScoreResult {
  let score = 0;
  const reasons: string[] = [];

  switch (input.serviceType) {
    case "post-renovation-cleaning":
      score += 30;
      reasons.push("High-value post-renovation request");
      break;
    case "recurring-home-cleaning":
      score += 25;
      reasons.push("Recurring cleaning usually has strong lifetime value");
      break;
    case "move-out-cleaning":
      score += 20;
      reasons.push("Move-out cleaning is high urgency");
      break;
    case "deep-cleaning":
      score += 20;
      reasons.push("Deep cleaning tends to be a higher-ticket service");
      break;
    case "window-cleaning":
      score += 15;
      reasons.push("Window cleaning is a qualified service inquiry");
      break;
    case "steam-cleaning":
      score += 10;
      reasons.push("Steam cleaning is a valid niche service lead");
      break;
    default:
      reasons.push("Needs qualification");
      break;
  }

  if (input.email && input.phone) {
    score += 10;
    reasons.push("Complete contact details");
  } else if (!input.email && !input.phone) {
    score -= 20;
    reasons.push("Missing both email and phone");
  }

  const addressHaystack = [input.address, input.city].filter(Boolean).join(" ").toLowerCase();
  if (PRIMARY_SERVICE_AREAS.some((area) => addressHaystack.includes(area))) {
    score += 10;
    reasons.push("Inside BetterClean primary service area");
  }

  if (input.preferredDate) {
    const today = new Date();
    const preferred = new Date(input.preferredDate);
    const diffMs = preferred.getTime() - today.setHours(0, 0, 0, 0);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (!Number.isNaN(diffDays) && diffDays >= 0 && diffDays <= 3) {
      score += 10;
      reasons.push("Near-term booking request");
    }
  }

  if (input.notes) {
    const normalized = input.notes.toLowerCase();
    if (/(urgent|asap|today|tomorrow|heti|kiire|mahdollisimman pian)/.test(normalized)) {
      score += 5;
      reasons.push("Notes indicate urgency");
    }
  }

  if (input.estimatedPrice) {
    const numeric = parseInt(input.estimatedPrice.replace(/[^\d]/g, ""), 10);
    if (!Number.isNaN(numeric) && numeric >= 180) {
      score += 10;
      reasons.push("Higher estimated booking value");
    }
  }

  const priority =
    score >= 80 ? "HOT" :
    score >= 50 ? "WARM" :
    "COLD";

  return { score, priority, reasons };
}
