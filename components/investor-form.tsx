"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { TurnstileWidget } from "@/components/turnstile-widget";

export function InvestorForm() {
  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/investor-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, turnstileToken }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not submit request");
      }
      posthog.capture("investor_form_submission");
      setStatus("success");
      setMessage("Thanks for your interest. We'll follow up with deck access.");
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unexpected error.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5"
    >
      <input
        name="name"
        required
        placeholder="Full name"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/20 dark:bg-black/30 dark:text-white"
      />
      <input
        name="email"
        required
        type="email"
        placeholder="Email"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/20 dark:bg-black/30 dark:text-white"
      />
      <input
        name="company"
        required
        placeholder="Fund / Angel group"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/20 dark:bg-black/30 dark:text-white"
      />
      <input
        name="checkSize"
        placeholder="Typical check size (optional)"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/20 dark:bg-black/30 dark:text-white"
      />
      <textarea
        name="message"
        required
        rows={5}
        placeholder="Tell us what you'd like to learn."
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/20 dark:bg-black/30 dark:text-white"
      />
      <button
        type="submit"
        disabled={status === "loading" || (hasTurnstile && !turnstileToken)}
        className="h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 px-4 text-sm font-semibold text-white"
      >
        {status === "loading" ? "Submitting..." : "Request Investor Brief"}
      </button>
      {hasTurnstile ? <TurnstileWidget onToken={setTurnstileToken} /> : null}
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-500 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
