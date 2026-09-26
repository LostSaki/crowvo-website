"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";
import { trackEvent } from "@/lib/analytics-client";

export default function WaitlistPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [referralLink, setReferralLink] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const source = String(formData.get("source") ?? "").trim();

    setStatus("loading");
    setMessage("");
    setReferralLink("");

    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          referralCode: params.get("ref") ?? undefined,
          source: source || undefined,
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string; referralLink?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not request access.");
      }

      trackEvent("waitlist_submission", source ? { source } : undefined);
      setStatus("success");
      setMessage(data.message ?? "You're on the list. We'll reach out when a spot opens for your community.");
      setReferralLink(data.referralLink ?? "");
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
            name="source"
            required
            className="field-input"
            placeholder="Friend group, study club, local org, gaming group..."
          />
        </label>
        <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-70">
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
