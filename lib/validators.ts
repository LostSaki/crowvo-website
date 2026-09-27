import { z } from "zod";

const optionalText = (maxLength: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().trim().max(maxLength).optional());

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

export const waitlistSignupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  community: optionalText(160),
  referralCode: optionalText(64),
  source: optionalText(120),
});

export const investorInterestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  company: optionalText(160),
  checkSize: optionalText(80),
  message: z.string().trim().min(5).max(2_000),
});
