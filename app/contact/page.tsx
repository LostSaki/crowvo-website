"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";
import { trackEvent } from "@/lib/analytics-client";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [responseMessage, setResponseMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setResponseMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "Could not send your message.");
      }

      setStatus("success");
      setResponseMessage(data?.message ?? "Thanks - we'll be in touch soon.");
      setName("");
      setEmail("");
      setMessage("");
      try {
        trackEvent("contact_submission");
      } catch {
        // Analytics should never mask a successfully persisted contact request.
      }
    } catch (error) {
      setStatus("error");
      setResponseMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <MarketingPage
      eyebrow="CONTACT"
      title="Talk to us."
      subtitle="Questions about access, partnerships, or bringing your community to Crowvo — we'd like to hear from you."
    >
      {status === "success" ? (
        <p className="glass-panel rounded-2xl p-5 text-sm text-muted">{responseMessage}</p>
      ) : null}
      {status !== "success" ? (
        <form onSubmit={onSubmit} className="glass-panel max-w-xl space-y-4 rounded-2xl p-6">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field-input"
            />
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
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="field-textarea"
              placeholder="Tell us about your community or question…"
            />
          </label>
          <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-60">
            {status === "loading" ? "Sending..." : "Send message"}
          </button>
          {responseMessage ? (
            <p className={`text-sm ${status === "error" ? "text-red-300" : "text-muted"}`}>
              {responseMessage}
            </p>
          ) : null}
        </form>
      ) : null}
    </MarketingPage>
  );
}
