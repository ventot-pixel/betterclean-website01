import { z } from "zod";

export const betterCleanLeadSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(6).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  language: z.enum(["fi", "en"]).default("fi"),
  sourcePage: z.string().url().optional().or(z.literal("")),
  sourceChannel: z.string().min(2),
  serviceType: z.enum([
    "recurring-home-cleaning",
    "one-time-home-cleaning",
    "deep-cleaning",
    "move-out-cleaning",
    "window-cleaning",
    "steam-cleaning",
    "post-renovation-cleaning",
    "unknown"
  ]),
  propertySize: z.string().optional().or(z.literal("")),
  preferredDate: z.string().optional().or(z.literal("")),
  preferredTime: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  estimatedPrice: z.string().optional().or(z.literal(""))
});

export type BetterCleanLeadInput = z.infer<typeof betterCleanLeadSchema>;
