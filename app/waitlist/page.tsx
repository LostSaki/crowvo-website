"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { trackEvent } from "@/lib/analytics-client";

export default function WaitlistPage() {
  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [community, setCommunity] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [message, setMessage] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setReferralLink("");

    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          community,
          referralCode: params.get("ref"),
          source: document.referrer || "direct",
          turnstileToken,
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string; referralLink?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not request access.");
      }

      try {
        trackEvent("waitlist_submission", { source: document.referrer || "direct", community });
      } catch {
        // Submission persistence succeeded; analytics should not change the user-facing result.
      }
      setMessage(payload.message ?? "You're on the list. We'll reach out when a spot opens for your community.");
      setReferralLink(payload.referralLink ?? "");
      setEmail("");
      setCommunity("");
      setSent(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not request access.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MarketingPage
      eyebrow="INVITE LIST"
      title="Request demo access."
      subtitle="Crowvo is invite-only while we grow carefully with communities who care about trust, privacy, and real connection."
    >
      {sent ? (
        <div className="glass-panel rounded-2xl p-5 text-sm text-muted">
          <p>{message || "You're on the list. We'll reach out when a spot opens for your community."}</p>
          {referralLink ? <p className="mt-2 break-all text-xs text-accent">Referral link: {referralLink}</p> : null}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="glass-panel max-w-xl space-y-4 rounded-2xl p-6">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field-input"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            What kind of community?
            <input
              required
              value={community}
              onChange={(event) => setCommunity(event.target.value)}
              className="field-input"
              placeholder="Friend group, study club, local org, gaming group..."
            />
          </label>
          {hasTurnstile ? <TurnstileWidget onToken={setTurnstileToken} /> : null}
          {message ? <p className="text-sm text-red-300">{message}</p> : null}
          <button type="submit" disabled={loading || (hasTurnstile && !turnstileToken)} className="btn-primary disabled:opacity-60">
            {loading ? "Requesting..." : "Request access"}
          </button>
        </form>
      )}
    </MarketingPage>
  );
}
