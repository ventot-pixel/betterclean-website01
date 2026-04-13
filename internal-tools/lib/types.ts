export type BetterCleanServiceType =
  | "recurring-home-cleaning"
  | "one-time-home-cleaning"
  | "deep-cleaning"
  | "move-out-cleaning"
  | "window-cleaning"
  | "steam-cleaning"
  | "post-renovation-cleaning"
  | "unknown";

export type BetterCleanLeadPayload = {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  language: "fi" | "en";
  sourcePage?: string;
  sourceChannel: string;
  serviceType: BetterCleanServiceType;
  propertySize?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  estimatedPrice?: string;
};

export type LeadScoreResult = {
  score: number;
  priority: "HOT" | "WARM" | "COLD";
  reasons: string[];
};
