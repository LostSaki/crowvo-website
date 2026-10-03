"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

const INBOX = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "dylan.aruizmoya@gmail.com";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string; message?: string; mailto?: string } | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? "Could not send message.");
      }
      setSent(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MarketingPage
      eyebrow="CONTACT"
      title="Talk to us."
      subtitle="Questions about access, partnerships, press, or bringing your community to Crowvo — we'd like to hear from you."
    >
      <p className="text-sm text-muted">
        You can also email{" "}
        <a href={`mailto:${INBOX}`} className="text-accent hover:underline">
          {INBOX}
        </a>
        . Investors can visit{" "}
        <a href="/investors" className="text-accent hover:underline">
          our investor page
        </a>
        .
      </p>
      {sent ? (
        <p className="glass-panel rounded-2xl p-5 text-sm text-muted">
          Thanks — your message was sent. We&apos;ll reply to the email you provided.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="glass-panel max-w-xl space-y-4 rounded-2xl p-6">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Name
            <input name="name" required className="field-input" disabled={loading} />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Email
            <input type="email" name="email" required className="field-input" disabled={loading} />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Message
            <textarea
              name="message"
              required
              rows={4}
              className="field-textarea"
              placeholder="Tell us about your community or question…"
              disabled={loading}
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </MarketingPage>
  );
}
