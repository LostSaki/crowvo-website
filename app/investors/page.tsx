"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AnimatedSection } from "@/components/animated-section";
import { MarketingPage, PillGrid } from "@/components/marketing-page";

const INBOX = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "dylsn@gmail.com";

const highlights = [
  {
    title: "Community-first social",
    copy: "Private Realms, feeds, events, and governance — built for groups who already trust each other, not for ad-driven engagement.",
  },
  {
    title: "Public Beta",
    copy: "We're growing openly with real communities while we harden the platform. Feedback and usage inform every release.",
  },
  {
    title: "Privacy by design",
    copy: "Communities control membership, visibility, and moderation. Identity and authority are separate by design, and presence is set per community.",
  },
  {
    title: "What we're building toward",
    copy: "A credible alternative to platforms that optimize for outrage — with sustainable pricing for communities, not attention extraction.",
  },
];

export default function InvestorsPage() {
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
      const res = await fetch("/api/investors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          checkSize: data.get("checkSize") || undefined,
          message: data.get("message"),
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? "Could not send request.");
      }
      setSent(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MarketingPage
      eyebrow="INVESTORS"
      title="Building social infrastructure communities can trust."
      subtitle="Crowvo is in Public Beta. If you're exploring the space, we'd welcome a conversation."
      cta={{ label: "Request brief", path: "#investor-form", external: false }}
    >
      <PillGrid items={highlights} />

      <AnimatedSection>
        <div className="glass-panel mt-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">What to expect</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>· Live Public Beta at app.crow-vo.com — open signup with community feedback loop</li>
            <li>· Early traction via Public Beta signups and community-led onboarding</li>
            <li>· Focus on governance, events, and calm social velocity inside Realms</li>
            <li>· Deck and metrics shared after a short intro call</li>
          </ul>
          <p className="mt-4 text-sm">
            Prefer email?{" "}
            <a href={`mailto:${INBOX}?subject=Investor%20inquiry`} className="text-accent hover:underline">
              {INBOX}
            </a>
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <div id="investor-form" className="mt-8 scroll-mt-24">
          <h2 className="text-xl font-semibold">Request investor materials</h2>
          <p className="mt-1 text-sm text-muted">Tell us a bit about your fund or interest. We&apos;ll follow up with next steps.</p>
          {sent ? (
            <p className="glass-panel mt-4 rounded-2xl p-5 text-sm text-muted">
              Thanks — your request was sent. We&apos;ll follow up at the email you provided.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="glass-panel mt-4 max-w-xl space-y-4 rounded-2xl p-6">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Name
                <input required name="name" className="field-input" disabled={loading} />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Email
                <input type="email" required name="email" className="field-input" disabled={loading} />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Firm / organization
                <input required name="company" className="field-input" disabled={loading} />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Check size or stage focus (optional)
                <input name="checkSize" className="field-input" placeholder="e.g. Pre-seed, $250k–$1M" disabled={loading} />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Message
                <textarea
                  required
                  name="message"
                  rows={4}
                  className="field-textarea"
                  placeholder="What drew you to Crowvo?"
                  disabled={loading}
                />
              </label>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Sending…" : "Send request"}
              </button>
            </form>
          )}
          <p className="mt-4 text-xs text-muted">
            General questions? <Link href="/contact" className="text-accent hover:underline">Contact us</Link> instead.
          </p>
        </div>
      </AnimatedSection>
    </MarketingPage>
  );
}
