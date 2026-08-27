"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

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
      const sourceParts = [document.referrer || "direct"];
      if (communityType.trim()) {
        sourceParts.push(`community: ${communityType.trim()}`);
      }

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          referralCode: params.get("ref"),
          source: sourceParts.join(" | ").slice(0, 500),
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string; referralLink?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not submit waitlist request.");
      }

      setStatus("success");
      setMessage(payload.message ?? "You're on the list. We'll reach out when a spot opens for your community.");
      setReferralLink(payload.referralLink ?? "");
      setEmail("");
      setCommunityType("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit waitlist request.");
    }
  }

  return (
    <MarketingPage
      eyebrow="INVITE LIST"
      title="Request demo access."
      subtitle="Crowvo is invite-only while we grow carefully with communities who care about trust, privacy, and real connection."
    >
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
            maxLength={200}
            value={communityType}
            onChange={(event) => setCommunityType(event.target.value)}
            className="field-input"
            placeholder="Friend group, study club, local org, gaming group…"
          />
        </label>
        <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-60">
          {status === "loading" ? "Submitting..." : "Request access"}
        </button>
        {message ? (
          <p className={`text-sm ${status === "error" ? "text-red-300" : "text-muted"}`}>{message}</p>
        ) : null}
        {referralLink ? <p className="break-all text-xs text-muted">Referral link: {referralLink}</p> : null}
      </form>
    </MarketingPage>
  );
}
