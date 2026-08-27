"use client";

import { FormEvent, useState } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { MarketingPage } from "@/components/marketing-page";
import { trackEvent } from "@/lib/analytics-client";

export default function WaitlistPage() {
  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [email, setEmail] = useState("");
  const [communityKind, setCommunityKind] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          referralCode: params.get("ref") ?? undefined,
          source: communityKind.trim(),
          turnstileToken,
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not request access.");
      }

      try {
        trackEvent("waitlist_submission", { source: communityKind.trim() || "unspecified" });
      } catch {
        // Analytics should never mask a successful lead capture.
      }
      setStatus("success");
      setMessage(payload.message ?? "You're on the list. We'll reach out when a spot opens for your community.");
      setEmail("");
      setCommunityKind("");
      setTurnstileToken("");
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
            value={communityKind}
            onChange={(event) => setCommunityKind(event.target.value)}
            className="field-input"
            placeholder="Friend group, study club, local org, gaming group..."
          />
        </label>
        {hasTurnstile ? <TurnstileWidget onToken={setTurnstileToken} /> : null}
        <button type="submit" disabled={status === "loading" || (hasTurnstile && !turnstileToken)} className="btn-primary">
          {status === "loading" ? "Requesting..." : "Request access"}
        </button>
        {message ? (
          <p className={`text-sm ${status === "error" ? "text-red-300" : "text-emerald-300"}`}>{message}</p>
        ) : null}
      </form>
    </MarketingPage>
  );
}
