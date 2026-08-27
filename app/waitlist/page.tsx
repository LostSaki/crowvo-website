"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

export default function WaitlistPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [community, setCommunity] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const referralCode = new URLSearchParams(window.location.search).get("ref") ?? undefined;
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, community, referralCode }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; inviteCode?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not request access.");
      }
      setInviteCode(payload?.inviteCode ?? "");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request access.");
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
        <p className="glass-panel rounded-2xl p-5 text-sm text-muted">
          You&apos;re on the list. We&apos;ll reach out when a spot opens for your community.
          {inviteCode ? <span className="mt-3 block font-mono text-foreground">Invite code: {inviteCode}</span> : null}
        </p>
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
              value={community}
              onChange={(event) => setCommunity(event.target.value)}
              className="field-input"
              placeholder="Friend group, study club, local org, gaming group…"
            />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? "Requesting…" : "Request access"}
          </button>
        </form>
      )}
    </MarketingPage>
  );
}
