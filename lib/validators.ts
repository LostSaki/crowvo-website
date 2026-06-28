import { z } from "zod";

const blankOptional = (value: unknown) => {
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return undefined;
  }

  return value;
};

const optionalTrimmedString = (max: number) => z.preprocess(blankOptional, z.string().trim().max(max).optional());
const optionalTurnstileToken = z.preprocess(blankOptional, z.string().trim().min(1).optional());

export const waitlistSchema = z.object({
  email: z.email().min(5).max(120),
  referralCode: optionalTrimmedString(60),
  source: optionalTrimmedString(80),
  turnstileToken: optionalTurnstileToken,
});

export const investorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().min(5).max(120),
  company: z.string().trim().min(2).max(120),
  checkSize: optionalTrimmedString(80),
  message: z.string().trim().min(10).max(1200),
  turnstileToken: optionalTurnstileToken,
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
