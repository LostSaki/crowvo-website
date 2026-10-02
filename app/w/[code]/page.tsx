import type { Metadata } from "next";
import Link from "next/link";
import { CrowvoMark } from "@/components/crowvo-mark";
import { GroupJoin } from "@/components/home/group-join";
import { findWaitlistByReferralCode } from "@/lib/waitlist-store";

/**
 * Group invite landing — the payoff for "bring your group" on the waitlist
 * confirmation. Someone shares crow-vo.com/w/<code>; whoever opens it joins the
 * waitlist credited to them, so the group gets opened together.
 *
 * We never show who shared the link. The code is a capability, not an identity —
 * printing the referrer's email to anyone holding the URL would leak it.
 */
export const metadata: Metadata = {
  title: "You have been invited to Crowvo",
  description: "Join the Crowvo waitlist with your group.",
  robots: { index: false, follow: false },
};

export default async function GroupInvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let valid = false;
  try {
    valid = Boolean(await findWaitlistByReferralCode(code));
  } catch {
    // If the lookup fails we still show the form — a database blip should not
    // cost a signup. The code is re-checked server-side on submit anyway.
    valid = true;
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex flex-col items-center text-center">
        <CrowvoMark size={48} />
        {valid ? (
          <>
            <h1 className="mt-7 font-display text-[30px] font-bold leading-tight sm:text-[34px]">
              Someone wants you on Crowvo
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">
              They already have a place. Join with this link and you are put in the same batch, so
              your group opens together instead of one at a time.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-7 font-display text-[30px] font-bold leading-tight sm:text-[34px]">
              That link has expired
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">
              We could not find that invite. You can still join the waitlist — we open places in
              batches.
            </p>
          </>
        )}
      </div>

      <div className="mt-9 rounded-[22px] border border-border-strong bg-surface p-5 sm:p-6">
        <GroupJoin referralCode={valid ? code : undefined} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-faint">
        Already have a code?{" "}
        <Link href="/download" className="text-[color:var(--accent-soft)] hover:underline">
          Enter it here
        </Link>
        .
      </p>
    </div>
  );
}
