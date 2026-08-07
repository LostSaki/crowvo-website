import { z } from "zod";

const maxAnalyticsMetadataKeys = 20;
const maxAnalyticsMetadataBytes = 4 * 1024;

const analyticsMetadataSchema = z
  .record(z.string().max(80), z.union([z.string().max(500), z.number(), z.boolean(), z.null()]))
  .superRefine((metadata, ctx) => {
    if (Object.keys(metadata).length > maxAnalyticsMetadataKeys) {
      ctx.addIssue({
        code: "custom",
        message: `Analytics metadata cannot contain more than ${maxAnalyticsMetadataKeys} keys.`,
      });
      return;
    }

    const serialized = JSON.stringify(metadata);
    if (new TextEncoder().encode(serialized).length > maxAnalyticsMetadataBytes) {
      ctx.addIssue({
        code: "custom",
        message: `Analytics metadata cannot exceed ${maxAnalyticsMetadataBytes} bytes.`,
      });
    }
  });

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
