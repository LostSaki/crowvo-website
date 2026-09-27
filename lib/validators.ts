import { z } from "zod";

export const waitlistSubmissionSchema = z.object({
  email: z.string().trim().email().max(254),
  communityType: z.string().trim().min(2).max(160),
  referralCode: z.string().trim().min(2).max(40).optional(),
});

export const investorInterestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(2).max(160),
  checkSize: z.string().trim().max(80).optional(),
  message: z.string().trim().min(5).max(2_000),
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
