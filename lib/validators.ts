import { z } from "zod";

const analyticsMetadataValueSchema = z.union([z.string().max(500), z.number().finite(), z.boolean(), z.null()]);

const analyticsMetadataSchema = z
  .record(z.string().min(1).max(80), analyticsMetadataValueSchema)
  .refine((metadata) => Object.keys(metadata).length <= 20, "Analytics metadata can include at most 20 keys.");

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
