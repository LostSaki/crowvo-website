import { z } from "zod";

const normalizedEmail = z.string().trim().email().transform((email) => email.toLowerCase());

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

export const contactRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: normalizedEmail,
  message: z.string().trim().min(1).max(2_000),
});

export const waitlistRequestSchema = z.object({
  email: normalizedEmail,
  community: z.string().trim().min(1).max(500),
});
