"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { trackEvent } from "@/lib/analytics-client";

export default function ContactPage() {
  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/investor-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(formData.entries()), turnstileToken }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not send message.");
      }

      trackEvent("contact_form_submission");
      setStatus("success");
      setMessage(data.message ?? "Thanks - we'll be in touch soon.");
      e.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <MarketingPage
      eyebrow="CONTACT"
      title="Talk to us."
      subtitle="Questions about access, partnerships, or bringing your community to Crowvo — we'd like to hear from you."
    >
      <form onSubmit={onSubmit} className="glass-panel max-w-xl space-y-4 rounded-2xl p-6">
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          Name
          <input name="name" required className="field-input" />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          Email
          <input name="email" type="email" required className="field-input" />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          Community / organization
          <input name="company" required className="field-input" />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          Message
          <textarea required name="message" rows={4} className="field-textarea" placeholder="Tell us about your community or question..." />
        </label>
        {hasTurnstile ? <TurnstileWidget onToken={setTurnstileToken} /> : null}
        <button type="submit" disabled={status === "loading" || (hasTurnstile && !turnstileToken)} className="btn-primary">
          {status === "loading" ? "Sending..." : "Send message"}
        </button>
        {message ? (
          <p className={`text-sm ${status === "error" ? "text-red-300" : "text-emerald-300"}`}>{message}</p>
        ) : null}
      </form>
    </MarketingPage>
  );
}
