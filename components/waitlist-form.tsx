"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { TurnstileWidget } from "@/components/turnstile-widget";

export function WaitlistForm() {
  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [referralLink, setReferralLink] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const params = new URLSearchParams(window.location.search);
      const source = document.referrer || "direct";
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          referralCode: params.get("ref"),
          source,
          turnstileToken,
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string; referralLink?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to join");
      }

      posthog.capture("waitlist_submission", { source });
      setStatus("success");
      setMessage(data.message ?? "You're in! We'll send your invite soon.");
      setReferralLink(data.referralLink ?? "");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5"
    >
      <label htmlFor="email" className="mb-2 block text-sm text-muted">
        Get early access before public launch
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@startup.com"
          className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2 dark:border-white/20 dark:bg-black/30 dark:text-white"
        />
        <button
          type="submit"
          disabled={status === "loading" || (hasTurnstile && !turnstileToken)}
          className="h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 px-6 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-70"
        >
          {status === "loading" ? "Joining..." : "Join Waitlist"}
        </button>
      </div>
      {hasTurnstile ? (
        <div className="mt-3">
          <TurnstileWidget onToken={setTurnstileToken} />
        </div>
      ) : null}
      {message ? (
        <p className={`mt-3 text-sm ${status === "error" ? "text-red-500 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>
          {message}
        </p>
      ) : null}
      {referralLink ? <p className="mt-1 break-all text-xs text-indigo-300 dark:text-indigo-200">Your referral link: {referralLink}</p> : null}
      <p className="mt-2 text-xs text-muted">Limited beta seats. Founding members get priority access.</p>
    </form>
  );
}
