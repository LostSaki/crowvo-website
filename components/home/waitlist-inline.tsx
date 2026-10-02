"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type WaitlistStatus = "auto_invited" | "queued" | "existing";

/**
 * Inline waitlist form for the home page. Same contract as /api/waitlist, which
 * already issues an access code and emails it — so a successful submit is the
 * end of the journey here, not a hand-off to the app stores.
 */
export function WaitlistInline() {
  const [email, setEmail] = useState("");
  const [communityType, setCommunityType] = useState("");
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState<WaitlistStatus | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, communityType }),
      });
      const payload = (await res.json()) as {
        status?: WaitlistStatus;
        message?: string;
        shareCode?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(payload.error ?? "Request failed.");
      setSent(true);
      setStatus(payload.status ?? "queued");
      setMessage(payload.message ?? "Thanks — check your email.");
      if (payload.shareCode) setShareCode(payload.shareCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border-strong bg-surface p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1e4733] bg-[#10211a]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 12.5l5 5 11-11" />
            </svg>
          </span>
          <p className="font-display text-xl font-bold">You are on the list</p>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{message}</p>
        {status === "auto_invited" ? (
          <p className="mt-2 text-sm text-muted-dim">
            Your code is in that email. It opens sign-up directly — no need to come back here.
          </p>
        ) : null}

        {shareCode ? (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm font-semibold">Bring your group</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-dim">
              Everyone who joins through your link is placed with you, so your community opens
              together.
            </p>
            <div className="mt-3 flex gap-2.5">
              <input
                readOnly
                value={`crow-vo.com/w/${shareCode}`}
                aria-label="Your group link"
                onFocus={(e) => e.currentTarget.select()}
                className="h-11 min-w-0 flex-1 rounded-xl border border-border-input bg-background px-3 text-sm text-muted"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`https://crow-vo.com/w/${shareCode}`);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setCopied(false);
                  }
                }}
                className="inline-flex h-11 shrink-0 items-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <label htmlFor="wl-email" className="sr-only">
        Email
      </label>
      <input
        id="wl-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="h-[50px] w-full rounded-2xl border border-border-input bg-surface px-4 text-[15px] text-foreground outline-none transition placeholder:text-[#55555f] focus:border-accent"
      />
      <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="wl-group" className="sr-only">
          What kind of group
        </label>
        <input
          id="wl-group"
          required
          minLength={2}
          maxLength={200}
          value={communityType}
          onChange={(e) => setCommunityType(e.target.value)}
          placeholder="Friend group, study club, local org, gaming group…"
          className="h-[50px] min-h-[50px] w-full flex-1 rounded-2xl border border-border-input bg-surface px-4 text-[15px] text-foreground outline-none transition placeholder:text-[#55555f] focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading}
          data-analytics-event="cta_waitlist_submit"
          data-analytics-cta="home_waitlist"
          className="inline-flex h-[50px] shrink-0 items-center justify-center rounded-full bg-foreground px-7 text-[15px] font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Join"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-[color:var(--danger)]">{error}</p> : null}
      <p className="mt-3 text-sm text-muted-faint">
        Already have a code?{" "}
        <Link href="/download" className="text-[color:var(--accent-soft)] hover:underline">
          Enter it here
        </Link>
        .
      </p>
    </form>
  );
}
