import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.string().trim().email().min(5).max(120),
  community: z.string().trim().min(2).max(120).optional(),
  referralCode: z.string().trim().max(60).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().min(5).max(120),
  message: z.string().trim().min(10).max(1200),
});

const analyticsMetadataSchema = z
  .record(
    z.string().trim().min(1).max(64),
    z.union([z.string().trim().max(500), z.number().finite(), z.boolean(), z.null()]),
  )
  .refine((metadata) => Object.keys(metadata).length <= 20, "Too many metadata fields.");

export const analyticsTrackSchema = z.object({
  eventName: z.string().trim().min(2).max(100),
  path: z.string().trim().max(300).optional(),
  referrer: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(160).optional(),
  sessionId: z.string().trim().max(120).optional(),
  metadata: analyticsMetadataSchema.optional(),
});
