"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { trackEvent } from "@/lib/analytics-client";

export default function ContactPage() {
  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message: messageBody, turnstileToken }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not send message.");
      }

      trackEvent("contact_submission");
      setStatus("success");
      setMessage(payload.message ?? "Thanks - we'll be in touch soon.");
      setName("");
      setEmail("");
      setMessageBody("");
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
      <form onSubmit={(event) => void onSubmit(event)} className="glass-panel max-w-xl space-y-4 rounded-2xl p-6">
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          Name
          <input required value={name} onChange={(event) => setName(event.target.value)} className="field-input" />
        </label>
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
          Message
          <textarea
            required
            rows={4}
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            className="field-textarea"
            placeholder="Tell us about your community or question..."
          />
        </label>
        {hasTurnstile ? <TurnstileWidget onToken={setTurnstileToken} /> : null}
        <button
          type="submit"
          disabled={status === "loading" || (hasTurnstile && !turnstileToken)}
          className="btn-primary disabled:opacity-60"
        >
          {status === "loading" ? "Sending..." : "Send message"}
        </button>
        {message ? (
          <p className={`text-sm ${status === "error" ? "text-red-300" : "text-emerald-300"}`}>{message}</p>
        ) : null}
      </form>
    </MarketingPage>
  );
}
