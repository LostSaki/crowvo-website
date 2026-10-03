import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import {

  countWaitlistAll,

  countWaitlistByStatus,

  createWaitlistSignup,
  findWaitlistByReferralCode,
  ensureReferralCode,
  countReferrals,

  findWaitlistByEmail,

  markWaitlistNotified,

} from "@/lib/waitlist-store";

import { crowvoAdminFetch } from "@/lib/crowvo-admin-api";

import { crowvoAppUrlForEmail, emailConfigured, resendTestMode, sendEmail } from "@/lib/email";
import { adminSignupNotice, inviteCodeEmail, waitlistQueuedEmail } from "@/lib/email-templates";



const bodySchema = z.object({

  email: z.string().email(),

  communityType: z.string().min(2).max(200),

  /** optional share-link code from /w/<code> */

  referralCode: z.string().trim().min(4).max(64).optional(),

});



function waitlistLimit() {

  const raw = process.env.WAITLIST_AUTO_INVITE_LIMIT?.trim();

  const n = raw ? Number.parseInt(raw, 10) : 25;

  return Number.isFinite(n) && n > 0 ? n : 25;

}



function adminNotifyEmail() {

  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || process.env.CONTACT_INBOX_EMAIL?.trim() || "dylan.aruizmoya@gmail.com";

}



async function countAutoInvited() {

  try {

    return await countWaitlistByStatus("auto_invited");

  } catch {

    return await countWaitlistAll();

  }

}



async function countQueued() {

  try {

    return await countWaitlistByStatus("queued");

  } catch {

    return 0;

  }

}




/**
 * Sends and reports. Every call site here used to await sendEmail and discard the result,
 * so an invalid API key or an unverified sender produced a signup row, a cheerful
 * response, and no email — with nothing written down anywhere. The most common failure
 * of this endpoint was therefore completely invisible.
 */
async function sendAndReport(
  label: string,
  to: string,
  payload: Parameters<typeof sendEmail>[0],
): Promise<boolean> {
  const result = await sendEmail(payload);
  if (!result.ok) {
    // Logged with the address so a specific person can be chased, and with the provider's
    // own detail so the cause is visible without reproducing it.
    console.error(
      `[waitlist] ${label} email FAILED to ${to}: ${result.reason}` +
        ("detail" in result && result.detail ? ` — ${String(result.detail).slice(0, 300)}` : ""),
    );
    return false;
  }
  return true;
}
export async function POST(req: NextRequest) {

  try {

    const parsed = bodySchema.safeParse(await req.json());

    if (!parsed.success) {

      return NextResponse.json({ error: "Invalid email or community type." }, { status: 400 });

    }



    const email = parsed.data.email.trim().toLowerCase();

    const communityType = parsed.data.communityType.trim();



    const existing = await findWaitlistByEmail(email);

    if (existing) {

      if (existing.status === "auto_invited" && existing.inviteCode) {

        return NextResponse.json({

          status: "auto_invited",

          message: "You already have an invite. Check your email for your access code.",

          inviteCode: existing.inviteCode,

        });

      }

      return NextResponse.json({

        status: existing.status,

        message: "You're already on the list. We'll email you when a spot opens.",

      });

    }



    const limit = waitlistLimit();

    const autoCount = await countAutoInvited();

    const autoMode = autoCount < limit;



    let inviteCode: string | null = null;

    let backendCodeId: string | null = null;

    let status: "auto_invited" | "queued" = autoMode ? "auto_invited" : "queued";



    if (autoMode) {

      try {

        const res = await crowvoAdminFetch("/access-codes", {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({

            singleUse: true,

            maxUses: 1,

            tier: "USER",

            label: `Waitlist: ${email}`,

            note: communityType,

            createdByLabel: "waitlist",

          }),

        });

        const payload = (await res.json()) as { code?: { id: string; code: string }; error?: string };

        if (!res.ok || !payload.code) {

          throw new Error(payload.error ?? "Could not create access code.");

        }

        inviteCode = payload.code.code;

        backendCodeId = payload.code.id;

      } catch (err) {

        console.error("waitlist code create failed", err);

        status = "queued";

        inviteCode = null;

        backendCodeId = null;

      }

    }



    let referredById: string | null = null;

    if (parsed.data.referralCode) {

      try {

        const referrer = await findWaitlistByReferralCode(parsed.data.referralCode);

        // never let someone credit themselves

        if (referrer && referrer.email.toLowerCase() !== email.toLowerCase()) referredById = referrer.id;

      } catch (err) {

        console.error("referral lookup failed", err);

      }

    }



    const signup = await createWaitlistSignup({

      email,

      communityType,

      status,

      inviteCode,

      backendCodeId,

      referredById,

      source: parsed.data.referralCode ? "waitlist_referral" : "waitlist",

    });



    const appUrl = crowvoAppUrlForEmail();

    const joinUrl = inviteCode ? `${appUrl}/join?code=${encodeURIComponent(inviteCode)}` : `${appUrl}/join`;

    const adminEmail = adminNotifyEmail();



    // issued before the emails so the share link can ride along in them

    let shareCode: string | null = null;

    let referredCount = 0;

    try {

      shareCode = await ensureReferralCode(signup.id);

      referredCount = await countReferrals(signup.id);

    } catch (err) {

      console.error("referral code issue failed", err);

    }

    const shareUrl = shareCode ? `https://crow-vo.com/w/${shareCode}` : null;



    if (emailConfigured()) {
      // Only a delivered signup email counts as notified. The admin notice is
      // incidental and must not mark the person as told.
      let delivered = false;

      if (status === "auto_invited" && inviteCode) {

        delivered = await sendAndReport("signup", email, {

          to: email,

          ...inviteCodeEmail({ code: inviteCode, joinUrl, communityType, shareUrl }),

        });

        if (adminEmail) {

          void sendAndReport("admin-notice", adminEmail, {

            to: adminEmail,

            ...adminSignupNotice({
              email,
              communityType,
              id: signup.id,
              status: `auto-invited (${autoCount + 1}/${limit})`,
              referred: Boolean(referredById),
            }),

          });

        }

      } else {

        delivered = await sendAndReport("signup", email, {

          to: email,

          ...waitlistQueuedEmail({ communityType, shareUrl }),

        });

        if (adminEmail) {

          void sendAndReport("admin-notice", adminEmail, {

            to: adminEmail,

            ...adminSignupNotice({
              email,
              communityType,
              id: signup.id,
              status: "queued — approve in admin",
              referred: Boolean(referredById),
            }),

          });

        }

      }



      if (delivered) {
        await markWaitlistNotified(signup.id);
      } else {
        // Left unmarked on purpose: this row is now discoverable as someone owed an
        // email, via notifiedAt IS NULL, once sending is working again.
        console.error(`[waitlist] ${email} saved but NOT emailed — left unnotified for retry`);
      }

    }



    return NextResponse.json({

      status,

      message:

        status === "auto_invited"

          ? "Check your email for your invite code."

          : "You're on the list. We'll email you when a spot opens.",

      shareCode,

      referredCount,



    });

  } catch (err) {

    console.error("waitlist error", err);

    const message = err instanceof Error ? err.message : "Waitlist request failed.";

    return NextResponse.json({ error: message }, { status: 500 });

  }

}



export async function GET() {

  try {

    const limit = waitlistLimit();

    const autoInvited = await countAutoInvited();

    const queued = await countQueued();

    return NextResponse.json({

      autoInviteLimit: limit,

      autoInvited,

      queued,

      slotsRemaining: Math.max(0, limit - autoInvited),



    });

  } catch (err) {

    console.error("waitlist GET", err);

    return NextResponse.json({

      autoInviteLimit: waitlistLimit(),

      autoInvited: 0,

      queued: 0,

      slotsRemaining: waitlistLimit(),



      dbReady: false,

    });

  }

}


