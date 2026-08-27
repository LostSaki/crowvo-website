"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";
import { trackEvent } from "@/lib/analytics-client";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [communityType, setCommunityType] = useState("");
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
          communityType,
          referralCode: params.get("ref") ?? undefined,
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        referralLink?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not join the waitlist.");
      }

      setStatus("success");
      setMessage(payload.message ?? "You're on the list.");
      setReferralLink(payload.referralLink ?? "");
      setEmail("");
      setCommunityType("");
      try {
        trackEvent("waitlist_submission", { communityType });
      } catch {
        // Analytics should never make a saved signup look like a failed request.
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not join the waitlist.");
    }
  }

  return (
    <MarketingPage
      eyebrow="INVITE LIST"
      title="Request demo access."
      subtitle="Crowvo is invite-only while we grow carefully with communities who care about trust, privacy, and real connection."
    >
      {status === "success" ? (
        <div className="glass-panel rounded-2xl p-5 text-sm text-muted">
          <p>{message} We&apos;ll reach out when a spot opens for your community.</p>
          {referralLink ? <p className="mt-2 break-all text-xs text-accent">Your referral link: {referralLink}</p> : null}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="glass-panel max-w-xl space-y-4 rounded-2xl p-6">
          <label htmlFor="waitlist-email" className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Email
            <input
              id="waitlist-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field-input"
            />
          </label>
          <label htmlFor="waitlist-community" className="block text-xs font-semibold uppercase tracking-wide text-muted">
            What kind of community?
            <input
              id="waitlist-community"
              required
              value={communityType}
              onChange={(event) => setCommunityType(event.target.value)}
              className="field-input"
              placeholder="Friend group, study club, local org, gaming group…"
            />
          </label>
          <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-60">
            {status === "loading" ? "Requesting..." : "Request access"}
          </button>
          {status === "error" && message ? <p className="text-sm text-red-300">{message}</p> : null}
        </form>
      )}
    </MarketingPage>
  );
}
