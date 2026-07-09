import type {
  ActivityRecord,
  ChannelQueueRecord,
  CustomerRecord,
  InvoiceRecord,
  JobRecord,
  LeadRecord,
  PropertyRecord,
  QuoteRecord
} from "@/lib/types";

export const crmLeads: LeadRecord[] = [
  {
    id: "lead_001",
    fullName: "Matti Meikalainen",
    email: "matti@example.com",
    phone: "+358401234567",
    address: "Lapinkaari 12 B 14",
    city: "Tampere",
    language: "fi",
    sourcePage: "https://betterclean.fi/window-cleaning.html",
    sourceChannel: "website_window",
    sourcePlatform: "website",
    serviceType: "window-cleaning",
    propertySize: "Apartment, 58 m2",
    preferredDate: "2026-04-27",
    preferredTime: "12:00-15:00",
    notes: "Balcony glazing included. Wants fast booking before May Day.",
    estimatedPrice: "159 €",
    contactPreference: "phone",
    score: 74,
    priority: "WARM",
    status: "QUOTE_SENT",
    assignedTo: "Jenna",
    createdAt: "2026-04-24 08:10",
    nextAction: "Follow up on quote before 16:00"
  },
  {
    id: "lead_002",
    fullName: "Laura Korhonen",
    email: "laura@example.com",
    phone: "+358505554443",
    address: "Kaskimaki 8",
    city: "Pirkkala",
    language: "fi",
    sourceChannel: "meta_dm",
    sourcePlatform: "instagram",
    serviceType: "post-renovation-cleaning",
    propertySize: "House, 142 m2",
    preferredDate: "2026-04-25",
    preferredTime: "Morning",
    notes: "Kitchen renovation just finished. Dust everywhere and urgent handover.",
    estimatedPrice: "Custom quote",
    contactPreference: "whatsapp",
    score: 88,
    priority: "HOT",
    status: "CONTACTED",
    assignedTo: "Jenna",
    createdAt: "2026-04-24 07:25",
    nextAction: "Send site-visit quote draft"
  },
  {
    id: "lead_003",
    fullName: "Anna Virtanen",
    email: "anna@example.com",
    phone: "+358451112223",
    address: "Hallituskatu 3 A 9",
    city: "Tampere",
    language: "fi",
    sourcePage: "https://betterclean.fi/",
    sourceChannel: "website_home",
    sourcePlatform: "website",
    serviceType: "recurring-home-cleaning",
    propertySize: "Apartment, 74 m2",
    preferredDate: "2026-05-02",
    preferredTime: "09:00-13:00",
    notes: "Every second week if the first clean goes well.",
    estimatedPrice: "171 €",
    contactPreference: "email",
    score: 82,
    priority: "HOT",
    status: "QUALIFIED",
    assignedTo: "Aino",
    createdAt: "2026-04-23 18:20",
    nextAction: "Book recurring quote review call"
  },
  {
    id: "lead_004",
    fullName: "James Cooper",
    email: "james@example.com",
    phone: "+358409991111",
    address: "Itsenaisyydenkatu 55",
    city: "Tampere",
    language: "en",
    sourceChannel: "whatsapp_direct",
    sourcePlatform: "whatsapp",
    serviceType: "steam-cleaning",
    propertySize: "2-seat sofa + armchair",
    preferredDate: "2026-04-29",
    preferredTime: "After 17:00",
    notes: "Needs evening visit. English preferred.",
    estimatedPrice: "218 €",
    contactPreference: "whatsapp",
    score: 68,
    priority: "WARM",
    status: "NEW",
    assignedTo: "Aino",
    createdAt: "2026-04-24 09:05",
    nextAction: "Reply on WhatsApp with fixed-price menu"
  },
  {
    id: "lead_005",
    fullName: "Sari Nieminen",
    email: "sari@example.com",
    phone: "+358407777111",
    address: "Kirkkokatu 4",
    city: "Ylojarvi",
    language: "fi",
    sourceChannel: "facebook_campaign",
    sourcePlatform: "facebook",
    serviceType: "one-time-home-cleaning",
    propertySize: "House, 96 m2",
    preferredDate: "2026-05-04",
    preferredTime: "Flexible",
    notes: "First trial clean from Facebook campaign.",
    estimatedPrice: "195 €",
    contactPreference: "phone",
    score: 64,
    priority: "WARM",
    status: "AWAITING_REPLY",
    assignedTo: "Jenna",
    createdAt: "2026-04-23 14:05",
    nextAction: "Call customer to confirm scope"
  }
];

export const crmCustomers: CustomerRecord[] = [
  {
    id: "customer_001",
    fullName: "Anna Virtanen",
    email: "anna@example.com",
    phone: "+358451112223",
    language: "fi",
    segment: "residential",
    totalJobs: 6,
    activeQuotes: 1,
    outstandingBalance: "0 €",
    lastServiceDate: "2026-04-10",
    leadSource: "Website"
  },
  {
    id: "customer_002",
    fullName: "Matti Meikalainen",
    email: "matti@example.com",
    phone: "+358401234567",
    language: "fi",
    segment: "residential",
    totalJobs: 1,
    activeQuotes: 1,
    outstandingBalance: "0 €",
    lastServiceDate: "2025-10-18",
    leadSource: "Website"
  },
  {
    id: "customer_003",
    fullName: "James Cooper",
    email: "james@example.com",
    phone: "+358409991111",
    language: "en",
    segment: "residential",
    totalJobs: 0,
    activeQuotes: 0,
    outstandingBalance: "0 €",
    leadSource: "WhatsApp"
  },
  {
    id: "customer_004",
    fullName: "Aamurusko Housing Oy",
    companyName: "Aamurusko Housing Oy",
    email: "ops@aamurusko.fi",
    phone: "+358108887766",
    language: "fi",
    segment: "commercial",
    totalJobs: 12,
    activeQuotes: 1,
    outstandingBalance: "388 €",
    lastServiceDate: "2026-04-22",
    leadSource: "Facebook"
  }
];

export const crmProperties: PropertyRecord[] = [
  {
    id: "property_001",
    customerId: "customer_001",
    label: "Anna home",
    address: "Hallituskatu 3 A 9",
    city: "Tampere",
    accessNotes: "Buzz 19, key safe in bike room",
    parkingNotes: "Street parking after 09:00",
    pets: "Indoor cat",
    frequency: "Biweekly"
  },
  {
    id: "property_002",
    customerId: "customer_002",
    label: "Matti apartment",
    address: "Lapinkaari 12 B 14",
    city: "Tampere",
    accessNotes: "Customer present",
    parkingNotes: "Guest spots behind building",
    pets: "None",
    frequency: "One-off"
  },
  {
    id: "property_003",
    customerId: "customer_003",
    label: "James apartment",
    address: "Itsenaisyydenkatu 55",
    city: "Tampere",
    accessNotes: "Call 10 minutes before arrival",
    parkingNotes: "Metered street parking",
    pets: "Small dog",
    frequency: "One-off"
  },
  {
    id: "property_004",
    customerId: "customer_004",
    label: "Aamurusko common areas",
    address: "Sarankulmankatu 8",
    city: "Tampere",
    accessNotes: "Key pickup from site office",
    parkingNotes: "Reserved visitor bay",
    pets: "None",
    frequency: "Weekly"
  }
];

export const crmQuotes: QuoteRecord[] = [
  {
    id: "quote_001",
    customerId: "customer_001",
    propertyId: "property_001",
    serviceType: "recurring-home-cleaning",
    status: "SENT",
    total: "171 €",
    labourShare: "114 €",
    sentAt: "2026-04-24 09:15",
    validUntil: "2026-05-01",
    lineSummary: "3 h recurring clean every 2 weeks"
  },
  {
    id: "quote_002",
    customerId: "customer_002",
    propertyId: "property_002",
    serviceType: "window-cleaning",
    status: "SENT",
    total: "159 €",
    labourShare: "126 €",
    sentAt: "2026-04-24 08:35",
    validUntil: "2026-04-28",
    lineSummary: "Apartment windows + balcony glazing"
  },
  {
    id: "quote_003",
    customerId: "customer_004",
    propertyId: "property_004",
    serviceType: "deep-cleaning",
    status: "APPROVED",
    total: "388 €",
    labourShare: "276 €",
    sentAt: "2026-04-22 10:45",
    validUntil: "2026-04-30",
    lineSummary: "Lobby, stairwells, laundry room"
  }
];

export const crmJobs: JobRecord[] = [
  {
    id: "job_001",
    customerId: "customer_001",
    propertyId: "property_001",
    serviceType: "recurring-home-cleaning",
    status: "SCHEDULED",
    scheduledDate: "2026-04-25",
    timeWindow: "09:00-12:00",
    assignedTeam: "Tiina + Olga",
    checklist: ["Kitchen surfaces", "Bathrooms", "Dusting", "Floors"],
    internalNotes: "Bring pet-safe detergent. Customer prefers text on arrival.",
    recurring: true
  },
  {
    id: "job_002",
    customerId: "customer_004",
    propertyId: "property_004",
    serviceType: "deep-cleaning",
    status: "IN_PROGRESS",
    scheduledDate: "2026-04-24",
    timeWindow: "10:00-15:00",
    assignedTeam: "Mira + Elena",
    checklist: ["Dust after renovation", "Elevator wipe-down", "Stair rails", "Entry glass"],
    internalNotes: "Property manager available 10:00-11:00 only.",
    recurring: false
  },
  {
    id: "job_003",
    customerId: "customer_002",
    propertyId: "property_002",
    serviceType: "window-cleaning",
    status: "SCHEDULED",
    scheduledDate: "2026-04-27",
    timeWindow: "12:00-15:00",
    assignedTeam: "Sofia",
    checklist: ["Interior glass", "Exterior glass", "Frames", "Balcony glazing"],
    internalNotes: "Customer requested phone confirmation 30 min before arrival.",
    recurring: false
  }
];

export const crmInvoices: InvoiceRecord[] = [
  {
    id: "invoice_001",
    customerId: "customer_004",
    jobId: "job_002",
    status: "OVERDUE",
    total: "388 €",
    labourPortion: "276 €",
    dueDate: "2026-04-21",
    paymentMethod: "Bank transfer"
  },
  {
    id: "invoice_002",
    customerId: "customer_001",
    jobId: "job_001",
    status: "DRAFT",
    total: "171 €",
    labourPortion: "114 €",
    dueDate: "2026-05-02",
    paymentMethod: "Email invoice"
  },
  {
    id: "invoice_003",
    customerId: "customer_002",
    jobId: "job_003",
    status: "SENT",
    total: "159 €",
    labourPortion: "126 €",
    dueDate: "2026-05-04",
    paymentMethod: "Email invoice"
  }
];

export const crmActivities: ActivityRecord[] = [
  {
    id: "activity_001",
    title: "Instagram lead qualified",
    detail: "Laura shared renovation photos and confirmed site visit availability.",
    channel: "Instagram DM",
    time: "09:20"
  },
  {
    id: "activity_002",
    title: "Quote sent",
    detail: "Window cleaning quote sent to Matti with balcony glazing add-on.",
    channel: "Email",
    time: "08:35"
  },
  {
    id: "activity_003",
    title: "Invoice overdue",
    detail: "Aamurusko Housing Oy invoice is 3 days overdue and needs follow-up.",
    channel: "Finance",
    time: "08:10"
  }
];

export const channelQueue: ChannelQueueRecord[] = [
  {
    id: "queue_001",
    platform: "whatsapp",
    handle: "+358 40 999 1111",
    contactName: "James Cooper",
    summary: "Asked for sofa and armchair steam cleaning in English.",
    status: "Needs reply",
    linkedLeadId: "lead_004"
  },
  {
    id: "queue_002",
    platform: "instagram",
    handle: "@laurak_home",
    contactName: "Laura Korhonen",
    summary: "Shared renovation photos and wants urgent cleanup.",
    status: "Ready to quote",
    linkedLeadId: "lead_002"
  },
  {
    id: "queue_003",
    platform: "facebook",
    handle: "BetterClean campaign lead",
    contactName: "Sari Nieminen",
    summary: "Clicked campaign form, asked for first trial home clean.",
    status: "Waiting on customer",
    linkedLeadId: "lead_005"
  },
  {
    id: "queue_004",
    platform: "tiktok",
    handle: "@cleanhomewithsari",
    contactName: "Unassigned",
    summary: "Commented asking if BetterClean serves Hervanta and weekends.",
    status: "Needs reply"
  }
];

export const crmSnapshot = {
  totalLeads: crmLeads.length,
  hotLeads: crmLeads.filter((lead) => lead.priority === "HOT").length,
  awaitingReply: crmLeads.filter((lead) => ["NEW", "AWAITING_REPLY", "CONTACTED"].includes(lead.status)).length,
  quotesWaiting: crmQuotes.filter((quote) => quote.status === "SENT").length,
  jobsToday: crmJobs.filter((job) => job.scheduledDate === "2026-04-24").length,
  overdueInvoices: crmInvoices.filter((invoice) => invoice.status === "OVERDUE").length,
  activeCustomers: crmCustomers.length,
  recurringCustomers: crmProperties.filter((property) => property.frequency !== "One-off").length
};

export function getCustomer(customerId: string) {
  return crmCustomers.find((customer) => customer.id === customerId);
}

export function getProperty(propertyId: string) {
  return crmProperties.find((property) => property.id === propertyId);
}
