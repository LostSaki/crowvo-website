import { z } from "zod";

const metadataValueSchema = z.union([z.string().max(500), z.number(), z.boolean(), z.null()]);
const analyticsMetadataSchema = z
  .record(z.string().max(80), metadataValueSchema)
  .optional()
  .superRefine((metadata, ctx) => {
    if (!metadata) return;

    if (Object.keys(metadata).length > 20) {
      ctx.addIssue({
        code: "custom",
        message: "Analytics metadata may include at most 20 keys.",
      });
    }

    if (JSON.stringify(metadata).length > 4096) {
      ctx.addIssue({
        code: "custom",
        message: "Analytics metadata is too large.",
      });
    }
  });

export const waitlistSchema = z.object({
  email: z.email().min(5).max(120),
  communityType: z.string().trim().min(2).max(160),
  referralCode: z.string().trim().max(60).optional(),
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
  metadata: analyticsMetadataSchema,
});
