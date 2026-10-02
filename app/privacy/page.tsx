import type { Metadata } from "next";
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
  PRIVACY_SECTIONS,
} from "@/content/legal/policies";

export const metadata: Metadata = {
  title: "Privacy Policy | Crowvo",
  description: "How Crowvo collects, uses and shares information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-cyan">Legal</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-sm text-muted">
        Version {LEGAL_VERSION} · Effective {LEGAL_EFFECTIVE_DATE} · Last updated {LEGAL_LAST_UPDATED}
      </p>
      <div className="mt-10 space-y-8">
        {PRIVACY_SECTIONS.map((section) => (
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
