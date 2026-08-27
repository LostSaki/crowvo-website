"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setStatus("submitting");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not send your message.");
      }

      setStatus("sent");
    } catch (submissionError) {
      setStatus("idle");
      setError(submissionError instanceof Error ? submissionError.message : "Could not send your message.");
    }
  }

  return (
    <MarketingPage
      eyebrow="CONTACT"
      title="Talk to us."
      subtitle="Questions about access, partnerships, or bringing your community to Crowvo — we'd like to hear from you."
    >
      {status === "sent" ? (
        <p className="glass-panel rounded-2xl p-5 text-sm text-muted">Thanks — we&apos;ll be in touch soon.</p>
      ) : (
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
              placeholder="Tell us about your community or question…"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={status === "submitting"}>
            {status === "submitting" ? "Sending..." : "Send message"}
          </button>
          {error ? <p className="text-sm text-red-500 dark:text-red-300">{error}</p> : null}
        </form>
      )}
    </MarketingPage>
  );
}
