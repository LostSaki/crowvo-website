"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { trackEvent } from "@/lib/analytics-client";

export default function WaitlistPage() {
  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [email, setEmail] = useState("");
  const [community, setCommunity] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [referralLink, setReferralLink] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setReferralLink("");

    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          referralCode: params.get("ref") ?? undefined,
          source: community.trim() ? `community:${community.trim()}` : document.referrer || "direct",
          turnstileToken,
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string; referralLink?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not request access.");
      }

      trackEvent("waitlist_submission", { source: community.trim() || "direct" });
      setStatus("success");
      setMessage(data.message ?? "You're on the list. We'll reach out when a spot opens for your community.");
      setReferralLink(data.referralLink ?? "");
      setEmail("");
      setCommunity("");
      setTurnstileToken("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not request access.");
    }
  }

  return (
    <MarketingPage
      eyebrow="INVITE LIST"
      title="Request demo access."
      subtitle="Crowvo is invite-only while we grow carefully with communities who care about trust, privacy, and real connection."
    >
      {status === "success" ? (
        <p className="glass-panel rounded-2xl p-5 text-sm text-muted">
          {message}
          {referralLink ? <span className="mt-2 block break-all text-xs text-accent">Referral link: {referralLink}</span> : null}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="glass-panel max-w-xl space-y-4 rounded-2xl p-6">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Email
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="field-input" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            What kind of community?
            <input
              required
              maxLength={140}
              value={community}
              onChange={(event) => setCommunity(event.target.value)}
              className="field-input"
              placeholder="Friend group, study club, local org, gaming group…"
            />
          </label>
          {hasTurnstile ? <TurnstileWidget onToken={setTurnstileToken} /> : null}
          <button type="submit" disabled={status === "loading" || (hasTurnstile && !turnstileToken)} className="btn-primary disabled:opacity-60">
            {status === "loading" ? "Requesting..." : "Request access"}
          </button>
          {status === "error" && message ? <p className="text-sm text-red-300">{message}</p> : null}
        </form>
      )}
    </MarketingPage>
  );
}
