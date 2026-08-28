"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

type WaitlistResponse = {
  message?: string;
  error?: string;
  referralLink?: string;
};

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
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
          source,
          referralCode: params.get("ref") ?? undefined,
        }),
      });

      const data = (await response.json()) as WaitlistResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Could not request access.");
      }

      setStatus("success");
      setMessage(data.message ?? "You're on the list. We'll reach out when a spot opens for your community.");
      setReferralLink(data.referralLink ?? "");
      setEmail("");
      setSource("");
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
        <div className="glass-panel rounded-2xl p-5 text-sm text-muted">
          <p>{message}</p>
          {referralLink ? <p className="mt-2 break-all text-xs text-accent">Your referral link: {referralLink}</p> : null}
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
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="field-input"
              placeholder="Friend group, study club, local org, gaming group..."
            />
          </label>
          <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-70">
            {status === "loading" ? "Requesting..." : "Request access"}
          </button>
          {status === "error" && message ? <p className="text-sm text-red-300">{message}</p> : null}
        </form>
      )}
    </MarketingPage>
  );
}
