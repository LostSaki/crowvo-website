import { z } from "zod";

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
