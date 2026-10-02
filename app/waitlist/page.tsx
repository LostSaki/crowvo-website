import type { Metadata } from "next";
import { WaitlistInline } from "@/components/home/waitlist-inline";

export const metadata: Metadata = {
  title: "Join the Crowvo waitlist",
  description:
    "Crowvo is in private beta. Tell us who you would bring and we will open a place for the whole group.",
};

export default function WaitlistPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <span className="inline-flex items-center gap-2 rounded-full border border-border-strong px-3.5 py-1.5 text-sm text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--teal)]" />
        In private beta — letting people in gradually
      </span>

      <h1 className="mt-5 font-display text-[36px] font-bold leading-tight sm:text-[42px]">
        Get an invite
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-muted">
        Tell us who you would bring and we will open a place for the whole group, not just you.
        When a place opens we email you a code that takes you straight into sign-up.
      </p>

      <div className="mt-9 rounded-[22px] border border-border-strong bg-surface p-5 sm:p-6">
        <WaitlistInline />
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        {[
          ["1", "You join", "Tell us the kind of group you would bring."],
          ["2", "We email a code", "It opens sign-up directly — no waiting at a wall."],
          ["3", "Your group follows", "Share your link and they are placed with you."],
        ].map(([n, title, body]) => (
          <div key={n} className="rounded-[18px] border border-border bg-surface p-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border-input text-[13px] font-semibold text-muted">
              {n}
            </span>
            <p className="mt-3 font-semibold">{title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
