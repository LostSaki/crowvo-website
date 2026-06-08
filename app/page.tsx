import Link from "next/link";
import { AnimatedSection } from "@/components/animated-section";
import { Eyebrow, FeedPreview, HOME_FEATURES, MarketingCard, StatPill } from "@/components/marketing-ui";
import { crowvoAppUrl } from "@/lib/app-url";

const appUrl = crowvoAppUrl;

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-12 sm:px-6">
      <AnimatedSection>
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Eyebrow>Community first · People first · Privacy first</Eyebrow>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Social media was built for advertisers.
              <br />
              <span className="text-accent">Crowvo is built for communities.</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              A calm place where communities can talk, organize, share, and grow — without algorithms pushing rage bait,
              without selling your data, and without endless noise.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={`${appUrl}/join`} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Get an invite
              </a>
              <Link href="/about" className="btn-secondary">
                Why Crowvo exists
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {HOME_FEATURES.map((item) => (
                <StatPill key={item}>{item}</StatPill>
              ))}
            </div>
          </div>
          <FeedPreview />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <MarketingCard>
          <h2 className="text-2xl font-semibold">Built for people, not engagement metrics.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Most platforms optimize for time on screen, ad impressions, and outrage. Crowvo optimizes for trust,
            meaningful conversation, and communities that actually want to be together.
          </p>
        </MarketingCard>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Talk without the noise",
              copy: "Feeds and channels designed for your group — not for an algorithm to keep you scrolling.",
            },
            {
              title: "Organize together",
              copy: "Plan events, share updates, and coordinate in one place your community controls.",
            },
            {
              title: "Stay in control",
              copy: "Private by default. Your community sets the rules. You decide who belongs.",
            },
          ].map((item) => (
            <MarketingCard key={item.title}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.copy}</p>
            </MarketingCard>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <MarketingCard className="border-accent/25 bg-accent/5 text-center">
          <h2 className="text-2xl font-semibold">Build communities people actually want to be part of.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted">
            Crowvo is in invite-only demo. Request access, join a community, and see what social can feel like when
            people come first.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a href={`${appUrl}/join`} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Get an invite
            </a>
            <Link href="/communities" className="btn-secondary">
              See who it&apos;s for
            </Link>
          </div>
        </MarketingCard>
      </AnimatedSection>
    </div>
  );
}
