"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

export default function WaitlistPage() {
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          communityType: formData.get("communityType"),
          referralCode: new URLSearchParams(window.location.search).get("ref") ?? undefined,
          source: document.referrer || "direct",
        }),
      });
      const payload = (await response.json()) as { message?: string; referralLink?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not submit request.");
      }
      setSent(true);
      setMessage(payload.message ?? "You're on the invite list.");
      setReferralLink(payload.referralLink ?? "");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request.");
    } finally {
      setSubmitting(false);
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
          {referralLink ? <p className="mt-2 break-all text-xs">Referral link: {referralLink}</p> : null}
        </div>
      ) : (
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
              placeholder="Friend group, study club, local org, gaming group…"
            />
          </label>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? "Submitting..." : "Request access"}
          </button>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </form>
      )}
    </MarketingPage>
  );
}
