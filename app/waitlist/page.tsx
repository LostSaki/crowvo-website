"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";
import { trackEvent } from "@/lib/analytics-client";

export default function WaitlistPage() {
  const [sent, setSent] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      communityType: String(formData.get("communityType") ?? ""),
      referralCode: new URLSearchParams(window.location.search).get("ref") ?? undefined,
      source: "waitlist-page",
    };

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as { inviteCode?: string; error?: string } | null;
      if (!response.ok) {
        throw new Error(result?.error ?? "Could not save your signup.");
      }
      setInviteCode(result?.inviteCode ?? "");
      try {
        trackEvent("waitlist_submission", { communityType: payload.communityType });
      } catch {
        // Analytics should never turn a persisted signup into a visible failure.
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your signup.");
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
          <p>You&apos;re on the list. We&apos;ll reach out when a spot opens for your community.</p>
          {inviteCode ? <p className="mt-3 text-xs">Your invite code: {inviteCode}</p> : null}
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
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" disabled={submitting} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Requesting..." : "Request access"}
          </button>
        </form>
      )}
    </MarketingPage>
  );
}
