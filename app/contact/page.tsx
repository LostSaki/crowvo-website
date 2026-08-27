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
    const form = e.currentTarget;
    const formData = new FormData(form);

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/investor-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          company: "Contact form",
          message: formData.get("message"),
          turnstileToken,
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not send message.");
      }

      try {
        trackEvent("investor_form_submission");
      } catch {
        // Analytics should never mask a successful lead capture.
      }
      setStatus("success");
      setMessage(payload.message ?? "Thanks - we'll be in touch soon.");
      setTurnstileToken("");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send message.");
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
          Message
          <textarea
            name="message"
            required
            rows={4}
            className="field-textarea"
            placeholder="Tell us about your community or question..."
          />
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
