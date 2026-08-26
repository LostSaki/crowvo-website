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
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          communityType,
          referralCode: params.get("ref") ?? undefined,
          source: document.referrer || "direct",
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        referralLink?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not join waitlist.");
      }

      setStatus("success");
      setMessage(payload.message ?? "You're on the list. We'll reach out when a spot opens.");
      setReferralLink(payload.referralLink ?? "");
      setEmail("");
      setCommunityType("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not join waitlist.");
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
            value={communityType}
            onChange={(event) => setCommunityType(event.target.value)}
            className="field-input"
            placeholder="Friend group, study club, local org, gaming group..."
          />
        </label>
        <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-70">
          {status === "loading" ? "Requesting..." : "Request access"}
        </button>
        {message ? (
          <p className={`text-sm ${status === "error" ? "text-red-300" : "text-emerald-300"}`}>
            {message}
          </p>
        ) : null}
        {referralLink ? <p className="break-all text-xs text-muted">Referral link: {referralLink}</p> : null}
      </form>
    </MarketingPage>
  );
}
