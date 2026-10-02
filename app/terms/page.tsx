import type { Metadata } from "next";
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
  TERMS_SECTIONS,
} from "@/content/legal/policies";

export const metadata: Metadata = {
  title: "Terms of Service | Crowvo",
  description: "Crowvo Terms of Service for the Public Beta.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-cyan">Legal</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-3 text-sm text-muted">
        Version {LEGAL_VERSION} · Effective {LEGAL_EFFECTIVE_DATE} · Last updated {LEGAL_LAST_UPDATED}
      </p>
      <div className="mt-10 space-y-8">
        {TERMS_SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)} className="mt-3 text-sm leading-relaxed text-muted">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
