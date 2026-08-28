"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
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
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          message: String(formData.get("message") ?? ""),
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not send message.");
      }
      setMessage(payload.message ?? "Thanks — we'll be in touch soon.");
      setSent(true);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send message.");
      return;
    }

    setStatus("idle");
  }

  return (
    <MarketingPage
      eyebrow="CONTACT"
      title="Talk to us."
      subtitle="Questions about access, partnerships, or bringing your community to Crowvo — we'd like to hear from you."
    >
      {sent ? (
        <p className="glass-panel rounded-2xl p-5 text-sm text-muted">{message || "Thanks — we'll be in touch soon."}</p>
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
            <textarea name="message" required rows={4} className="field-textarea" placeholder="Tell us about your community or question…" />
          </label>
          <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-60">
            {status === "loading" ? "Sending..." : "Send message"}
          </button>
          {status === "error" && message ? <p className="text-sm text-red-300">{message}</p> : null}
        </form>
      )}
    </MarketingPage>
  );
}
