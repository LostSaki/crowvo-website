"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

export default function WaitlistPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    let response: Response;
    try {
      response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          communityType: formData.get("communityType"),
        }),
      });
    } catch {
      setError("We could not save your request. Please try again.");
      setSubmitting(false);
      return;
    }

    if (response.ok) {
      setSent(true);
      return;
    }

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(payload?.error ?? "We could not save your request. Please try again.");
    setSubmitting(false);
  }

  return (
    <MarketingPage
      eyebrow="INVITE LIST"
      title="Request demo access."
      subtitle="Crowvo is invite-only while we grow carefully with communities who care about trust, privacy, and real connection."
    >
      {sent ? (
        <p className="glass-panel rounded-2xl p-5 text-sm text-muted">
          You&apos;re on the list. We&apos;ll reach out when a spot opens for your community.
        </p>
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
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? "Saving..." : "Request access"}
          </button>
        </form>
      )}
    </MarketingPage>
  );
}
