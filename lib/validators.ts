import { z } from "zod";

const analyticsMetadataValueSchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const waitlistSchema = z.object({
  email: z.email().min(5).max(120),
  referralCode: z.string().trim().max(60).optional(),
  source: z.string().trim().max(80).optional(),
  turnstileToken: z.string().trim().min(1).optional(),
});

export const investorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().min(5).max(120),
  company: z.string().trim().min(2).max(120),
  checkSize: z.string().trim().max(80).optional(),
  message: z.string().trim().min(10).max(1200),
  turnstileToken: z.string().trim().min(1).optional(),
});

export const analyticsTrackSchema = z.object({
  eventName: z.string().trim().min(2).max(100),
  path: z.string().trim().max(300).optional(),
  referrer: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(160).optional(),
  sessionId: z.string().trim().max(120).optional(),
  metadata: z
    .record(z.string().trim().min(1).max(64), analyticsMetadataValueSchema)
    .refine((metadata) => Object.keys(metadata).length <= 20, "Metadata is too large.")
    .optional(),
});
