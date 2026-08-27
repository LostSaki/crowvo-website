import { z } from "zod";

export const waitlistSignupSchema = z.object({
  email: z.email().min(5).max(120),
  community: z.string().trim().min(2).max(160),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().min(5).max(120),
  message: z.string().trim().min(10).max(1200),
});

export const analyticsTrackSchema = z.object({
  eventName: z.string().trim().min(2).max(100),
  path: z.string().trim().max(300).optional(),
  referrer: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(160).optional(),
  sessionId: z.string().trim().max(120).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});
