"use client";

import { FormEvent, useState } from "react";

type WaitlistStatus = "auto_invited" | "queued" | "existing";

/**
 * Waitlist form that carries a referral code. Same endpoint as the home form;
 * the code is validated server-side, so a tampered one simply records no referrer.
 */
export function GroupJoin({ referralCode }: { referralCode?: string }) {
  const [email, setEmail] = useState("");
  const [communityType, setCommunityType] = useState("");
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, communityType, referralCode }),
      });
      const payload = (await res.json()) as {
        status?: WaitlistStatus;
        message?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(payload.error ?? "Request failed.");
      setDone(true);
      setMessage(payload.message ?? "Thanks — check your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#1e4733] bg-[#10211a]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12.5l5 5 11-11" />
          </svg>
        </span>
        <p className="mt-4 font-display text-xl font-bold">You are on the list</p>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="g-email" className="mb-2 block text-sm font-medium text-muted">
        Your email
      </label>
      <input
        id="g-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="h-[50px] w-full rounded-2xl border border-border-input bg-background px-4 text-[15px] text-foreground outline-none transition placeholder:text-[#55555f] focus:border-accent"
      />

      <label htmlFor="g-group" className="mb-2 mt-4 block text-sm font-medium text-muted">
        What kind of group is it?
      </label>
      <input
        id="g-group"
        required
        minLength={2}
        maxLength={200}
        value={communityType}
        onChange={(e) => setCommunityType(e.target.value)}
        placeholder="Friend group, study club, local org, gaming group…"
        className="h-[50px] w-full rounded-2xl border border-border-input bg-background px-4 text-[15px] text-foreground outline-none transition placeholder:text-[#55555f] focus:border-accent"
      />

      <button
        type="submit"
        disabled={loading}
        data-analytics-event="cta_waitlist_submit"
        data-analytics-cta="group_invite"
        className="mt-5 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-foreground text-base font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Join with the group"}
      </button>
      {error ? <p className="mt-3 text-sm text-[color:var(--danger)]">{error}</p> : null}
    </form>
  );
}
