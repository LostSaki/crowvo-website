"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [messageBody, setMessageBody] = useState("");
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
        body: JSON.stringify({
          name,
          email,
          message: messageBody,
          source: document.referrer || "General contact",
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not save your message.");
      }

      setName("");
      setEmail("");
      setMessageBody("");
      setStatus("success");
      setMessage(payload?.message ?? "Thanks — we'll be in touch soon.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not save your message.");
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
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            className="field-textarea"
            placeholder="Tell us about your community or question..."
          />
        </label>
        <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-60">
          {status === "loading" ? "Sending..." : "Send message"}
        </button>
        {message ? (
          <p className={`text-sm ${status === "error" ? "text-red-300" : "text-muted"}`}>{message}</p>
        ) : null}
      </form>
    </MarketingPage>
  );
}
