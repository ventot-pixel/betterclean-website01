import { LeadPriority, LeadStatus } from "@prisma/client";
import { crmLeads } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import type { BetterCleanLeadInput } from "@/lib/lead-schema";
import type { LeadRecord } from "@/lib/types";
import { scoreBetterCleanLead } from "@/lib/scoring";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function formatDate(value?: Date | null) {
  if (!value) {
    return undefined;
  }

  return value.toISOString().slice(0, 10);
}

function formatCreatedAt(value: Date) {
  return new Intl.DateTimeFormat("fi-FI", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value).replace(",", "");
}

function mapPriority(priority: LeadPriority): LeadRecord["priority"] {
  return priority;
}

function mapStatus(status: LeadStatus): LeadRecord["status"] {
  return status;
}

function buildNextAction(status: LeadStatus, serviceType: string) {
  switch (status) {
    case "NEW":
      return "Contact this lead and confirm scope";
    case "AWAITING_REPLY":
      return "Awaiting customer response";
    case "CONTACTED":
      return "Qualify property details and timing";
    case "QUALIFIED":
      return `Prepare ${serviceType} quote`;
    case "QUOTE_SENT":
      return "Follow up on sent quote";
    case "WON":
      return "Convert to job scheduling";
    case "LOST":
      return "Archive or re-engage later";
    case "OUT_OF_AREA":
      return "Review service area coverage";
    default:
      return "Review lead";
  }
}

export async function getLeadInbox() {
  if (!hasDatabaseUrl()) {
    return { leads: crmLeads, source: "mock" as const };
  }

  try {
    const leads = await prisma.lead.findMany({
      include: {
        contact: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    });

    return {
      source: "database" as const,
      leads: leads.map((lead): LeadRecord => ({
        id: lead.id,
        fullName: lead.contact.fullName,
        email: lead.contact.email ?? undefined,
        phone: lead.contact.phone ?? undefined,
        address: lead.contact.address ?? undefined,
        city: lead.contact.city ?? undefined,
        language: lead.contact.language === "en" ? "en" : "fi",
        sourcePage: lead.sourcePage ?? undefined,
        sourceChannel: lead.sourceChannel,
        sourcePlatform: (lead.sourcePlatform as LeadRecord["sourcePlatform"]) ?? "website",
        serviceType: (lead.serviceType as LeadRecord["serviceType"]) ?? "unknown",
        propertySize: lead.propertySize ?? undefined,
        preferredDate: formatDate(lead.preferredDate),
        preferredTime: lead.preferredTime ?? undefined,
        notes: lead.notes ?? undefined,
        estimatedPrice: lead.estimatedPrice ?? undefined,
        contactPreference: (lead.contactPreference as LeadRecord["contactPreference"]) ?? undefined,
        score: lead.score,
        priority: mapPriority(lead.priority),
        status: mapStatus(lead.status),
        assignedTo: lead.assignedTo ?? undefined,
        createdAt: formatCreatedAt(lead.createdAt),
        nextAction: buildNextAction(lead.status, lead.serviceType)
      }))
    };
  } catch (error) {
    console.error("Failed to read leads from database, falling back to mock data.", error);
    return { leads: crmLeads, source: "mock" as const };
  }
}

export async function createLead(input: BetterCleanLeadInput) {
  const score = scoreBetterCleanLead(input);

  if (!hasDatabaseUrl()) {
    return {
      mode: "mock" as const,
      score,
      leadId: null
    };
  }

  const matchers: Array<{ email: string } | { phone: string }> = [];

  if (input.email) {
    matchers.push({ email: input.email });
  }

  if (input.phone) {
    matchers.push({ phone: input.phone });
  }

  const existingContact = matchers.length > 0
    ? await prisma.contact.findFirst({
        where: {
          OR: matchers
        }
      })
    : null;

  const contact = existingContact ?? await prisma.contact.create({
    data: {
      fullName: input.fullName,
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      city: input.city || null,
      language: input.language
    }
  });

  const lead = await prisma.lead.create({
    data: {
      contactId: contact.id,
      sourceChannel: input.sourceChannel,
      sourcePlatform: input.sourcePlatform,
      sourcePage: input.sourcePage || null,
      serviceType: input.serviceType,
      propertySize: input.propertySize || null,
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
      preferredTime: input.preferredTime || null,
      notes: input.notes || null,
      estimatedPrice: input.estimatedPrice || null,
      contactPreference: input.contactPreference || null,
      score: score.score,
      priority: score.priority,
      status: score.priority === "HOT" ? "AWAITING_REPLY" : "NEW"
    }
  });

  await prisma.leadEvent.create({
    data: {
      leadId: lead.id,
      eventType: "lead_received",
      payloadJson: JSON.stringify(input)
    }
  });

  return {
    mode: "database" as const,
    score,
    leadId: lead.id
  };
}
