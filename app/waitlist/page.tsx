"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";
import { trackEvent } from "@/lib/analytics-client";

type SubmissionState = "idle" | "loading" | "success" | "error";

export default function WaitlistPage() {
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [referralLink, setReferralLink] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const community = String(formData.get("community") ?? "");
    const params = new URLSearchParams(window.location.search);
    const source = document.referrer || "direct";

    setStatus("loading");
    setMessage("");
    setReferralLink("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          community,
          referralCode: params.get("ref"),
          source,
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string; referralLink?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not submit waitlist request.");
      }

      trackEvent("waitlist_submission", { source });
      setStatus("success");
      setMessage(payload.message ?? "You're on the list. We'll reach out when a spot opens for your community.");
      setReferralLink(payload.referralLink ?? "");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
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
            name="community"
            required
            className="field-input"
            placeholder="Friend group, study club, local org, gaming group..."
          />
        </label>
        <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-60">
          {status === "loading" ? "Requesting..." : "Request access"}
        </button>
        {message ? (
          <p className={`text-sm ${status === "error" ? "text-red-300" : "text-emerald-300"}`}>{message}</p>
        ) : null}
        {referralLink ? <p className="break-all text-xs text-muted">Referral link: {referralLink}</p> : null}
      </form>
    </MarketingPage>
  );
}
