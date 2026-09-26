"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
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
          company: company.trim() || undefined,
          message: body,
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not send message.");
      }

      setStatus("success");
      setMessage(data.message ?? "Thanks - we'll be in touch soon.");
      setName("");
      setEmail("");
      setCompany("");
      setBody("");
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
      {status === "success" ? (
        <p className="glass-panel rounded-2xl p-5 text-sm text-muted">{message}</p>
      ) : (
        <form onSubmit={onSubmit} className="glass-panel max-w-xl space-y-4 rounded-2xl p-6">
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
            Community or organization
            <input value={company} onChange={(event) => setCompany(event.target.value)} className="field-input" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Message
            <textarea
              required
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="field-textarea"
              placeholder="Tell us about your community or question…"
            />
          </label>
          <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-70">
            {status === "loading" ? "Sending..." : "Send message"}
          </button>
          {status === "error" && message ? <p className="text-sm text-red-300">{message}</p> : null}
        </form>
      )}
    </MarketingPage>
  );
}
