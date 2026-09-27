"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";
import { trackEvent } from "@/lib/analytics-client";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function WaitlistPage() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");
  const [referralLink, setReferralLink] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const communityType = String(formData.get("communityType") ?? "");
    const referralCode = new URLSearchParams(window.location.search).get("ref") ?? undefined;

    setStatus("loading");
    setMessage("");
    setReferralLink("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, communityType, referralCode }),
      });
      const payload = (await response.json()) as { message?: string; error?: string; referralLink?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not submit your request.");
      }

      trackEvent("waitlist_submission", { communityType });
      setStatus("success");
      setMessage(payload.message ?? "You're on the list. We'll reach out when a spot opens for your community.");
      setReferralLink(payload.referralLink ?? "");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit your request.");
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
          <input name="email" type="email" required className="field-input" />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          What kind of community?
          <input
            name="communityType"
            required
            className="field-input"
            placeholder="Friend group, study club, local org, gaming group..."
          />
        </label>
        <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-60">
          {status === "loading" ? "Requesting..." : "Request access"}
        </button>
        {message ? (
          <div className={`text-sm ${status === "error" ? "text-red-300" : "text-muted"}`}>
            <p>{message}</p>
            {referralLink ? <p className="mt-2 break-all text-xs">Referral link: {referralLink}</p> : null}
          </div>
        ) : null}
      </form>
    </MarketingPage>
  );
}
