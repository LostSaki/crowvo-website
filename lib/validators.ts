import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.string().trim().email().min(5).max(120),
  community: z.string().trim().min(2).max(160),
  referralCode: z.string().trim().max(60).optional(),
  source: z.string().trim().max(160).optional(),
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
