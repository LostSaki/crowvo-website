"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [community, setCommunity] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [referralLink, setReferralLink] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          referralCode: params.get("ref") ?? undefined,
          source: community.trim() || document.referrer || "direct",
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        error?: string;
        referralLink?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not join the waitlist.");
      }

      setSent(true);
      setMessage(payload?.message ?? "You're on the list. We'll reach out when a spot opens for your community.");
      setReferralLink(payload?.referralLink ?? "");
      setEmail("");
      setCommunity("");
    } catch (error) {
      setSent(false);
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
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
          <p>{message}</p>
          {referralLink ? <p className="mt-3 break-all text-xs">Referral link: {referralLink}</p> : null}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="glass-panel max-w-xl space-y-4 rounded-2xl p-6">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Email
            <input
              type="email"
              required
              maxLength={120}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field-input"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            What kind of community?
            <input
              required
              maxLength={160}
              value={community}
              onChange={(event) => setCommunity(event.target.value)}
              className="field-input"
              placeholder="Friend group, study club, local org, gaming group…"
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-70">
            {loading ? "Requesting..." : "Request access"}
          </button>
          {message ? <p className="text-sm text-red-300">{message}</p> : null}
        </form>
      )}
    </MarketingPage>
  );
}
