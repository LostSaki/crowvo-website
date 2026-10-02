-- Run once against the website Supabase database (same as DATABASE_URL on Cloudflare).
ALTER TABLE "WaitlistSignup" ADD COLUMN IF NOT EXISTS "communityType" TEXT;
ALTER TABLE "WaitlistSignup" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'queued';
ALTER TABLE "WaitlistSignup" ADD COLUMN IF NOT EXISTS "backendCodeId" TEXT;
ALTER TABLE "WaitlistSignup" ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP(3);
ALTER TABLE "WaitlistSignup" ALTER COLUMN "inviteCode" DROP NOT NULL;
