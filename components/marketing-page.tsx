import Link from "next/link";
import { ReactNode } from "react";
import { AnimatedSection } from "@/components/animated-section";
import { crowvoAppUrl } from "@/lib/app-url";

type MarketingPageProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  cta?: { label: string; href: string; external?: boolean };
};

const appUrl = crowvoAppUrl;

export function MarketingPage({ eyebrow, title, subtitle, children, cta }: MarketingPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6">
      <AnimatedSection>
        <div className="space-y-4">
          {eyebrow ? (
            <p className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-accent">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{title}</h1>
          {subtitle ? <p className="max-w-3xl text-base leading-relaxed text-muted sm:text-lg">{subtitle}</p> : null}
          {cta ? (
            cta.external ? (
              <a href={cta.href} target="_blank" rel="noopener noreferrer" className="btn-primary mt-2 inline-flex">
                {cta.label}
              </a>
            ) : (
              <Link href={cta.href} className="btn-primary mt-2 inline-flex">
                {cta.label}
              </Link>
            )
          ) : null}
        </div>
      </AnimatedSection>
      {children}
    </div>
  );
}

export function PillGrid({ items }: { items: { title: string; copy: string }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <AnimatedSection key={item.title}>
          <div className="glass-panel h-full rounded-2xl p-5">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.copy}</p>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <AnimatedSection key={item.q}>
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="font-semibold">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}

export { appUrl };
