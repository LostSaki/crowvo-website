"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not send your message.");
      }

      form.reset();
      setStatus("success");
      setMessage(data.message ?? "Thanks - we'll be in touch soon.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send your message.");
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
          <input name="name" required maxLength={120} className="field-input" />
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
            maxLength={2000}
            className="field-textarea"
            placeholder="Tell us about your community or question..."
          />
        </label>
        <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-70">
          {status === "loading" ? "Sending..." : "Send message"}
        </button>
        {message ? (
          <p className={`text-sm ${status === "error" ? "text-red-500 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>
            {message}
          </p>
        ) : null}
      </form>
    </MarketingPage>
  );
}
