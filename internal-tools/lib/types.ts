export type BetterCleanServiceType =
  | "recurring-home-cleaning"
  | "one-time-home-cleaning"
  | "deep-cleaning"
  | "move-out-cleaning"
  | "window-cleaning"
  | "steam-cleaning"
  | "post-renovation-cleaning"
  | "unknown";

export type LeadPlatform =
  | "website"
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "tiktok";

export type LeadStatus =
  | "NEW"
  | "AWAITING_REPLY"
  | "CONTACTED"
  | "QUALIFIED"
  | "QUOTE_SENT"
  | "WON"
  | "LOST"
  | "SPAM"
  | "OUT_OF_AREA";

export type LeadPriority = "HOT" | "WARM" | "COLD";

export type BetterCleanLeadPayload = {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  language: "fi" | "en";
  sourcePage?: string;
  sourceChannel: string;
  sourcePlatform: LeadPlatform;
  serviceType: BetterCleanServiceType;
  propertySize?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  estimatedPrice?: string;
  contactPreference?: "phone" | "email" | "whatsapp";
};

export type LeadScoreResult = {
  score: number;
  priority: LeadPriority;
  reasons: string[];
};

export type LeadRecord = BetterCleanLeadPayload & {
  id: string;
  score: number;
  priority: LeadPriority;
  status: LeadStatus;
  assignedTo?: string;
  createdAt: string;
  nextAction: string;
};

export type CustomerSegment = "residential" | "commercial";

export type CustomerRecord = {
  id: string;
  fullName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  language: "fi" | "en";
  segment: CustomerSegment;
  totalJobs: number;
  activeQuotes: number;
  outstandingBalance: string;
  lastServiceDate?: string;
  leadSource: string;
};

export type PropertyRecord = {
  id: string;
  customerId: string;
  label: string;
  address: string;
  city: string;
  accessNotes: string;
  parkingNotes: string;
  pets: string;
  frequency: string;
};

export type QuoteStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED";

export type QuoteRecord = {
  id: string;
  customerId: string;
  propertyId: string;
  serviceType: BetterCleanServiceType;
  status: QuoteStatus;
  total: string;
  labourShare: string;
  sentAt?: string;
  validUntil: string;
  lineSummary: string;
};

export type JobStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type JobRecord = {
  id: string;
  customerId: string;
  propertyId: string;
  serviceType: BetterCleanServiceType;
  status: JobStatus;
  scheduledDate: string;
  timeWindow: string;
  assignedTeam: string;
  checklist: string[];
  internalNotes: string;
  recurring: boolean;
};

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE";

export type InvoiceRecord = {
  id: string;
  customerId: string;
  jobId: string;
  status: InvoiceStatus;
  total: string;
  labourPortion: string;
  dueDate: string;
  paymentMethod: string;
};

export type ActivityRecord = {
  id: string;
  title: string;
  detail: string;
  channel: string;
  time: string;
};

export type ChannelQueueRecord = {
  id: string;
  platform: LeadPlatform;
  handle: string;
  contactName: string;
  summary: string;
  status: "Needs reply" | "Waiting on customer" | "Ready to quote";
  linkedLeadId?: string;
};
