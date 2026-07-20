"use client";

import { FormEvent, useState } from "react";
import { MarketingPage } from "@/components/marketing-page";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function WaitlistPage() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not request access.");
      }

      form.reset();
      setStatus("success");
      setMessage(data.message ?? "You're on the list. We'll reach out when a spot opens for your community.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not request access.");
    }
  }

  return (
    <MarketingPage
      eyebrow="INVITE LIST"
      title="Request demo access."
      subtitle="Crowvo is invite-only while we grow carefully with communities who care about trust, privacy, and real connection."
    >
      <form onSubmit={onSubmit} className="glass-panel max-w-xl space-y-4 rounded-2xl p-6">
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          Email
          <input name="email" type="email" required className="field-input" />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          What kind of community?
          <input
            name="community"
            required
            maxLength={500}
            className="field-input"
            placeholder="Friend group, study club, local org, gaming group..."
          />
        </label>
        <button type="submit" disabled={status === "loading"} className="btn-primary disabled:opacity-70">
          {status === "loading" ? "Requesting..." : "Request access"}
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
