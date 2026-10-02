import Link from "next/link";
import { AnimatedSection } from "@/components/animated-section";
import { FaqList, MarketingPage } from "@/components/marketing-page";
import { getCrowvoAppUrl } from "@/lib/app-url";

const faqs = [
  {
    q: "Why Crowvo?",
    a: "Because most social platforms are built around strangers and a single ranked feed. Crowvo is built around the groups you are actually in: two feeds you choose between, presence you set per community, and events as a first-class thing.",
  },
  {
    q: "How is Crowvo different from Discord?",
    a: "Discord is built around servers and administration. Crowvo is built around communities and governance — with feeds, events, and identity tools designed for groups that want calm, intentional spaces rather than sprawling server management.",
  },
  {
    q: "How is Crowvo different from X or Twitter?",
    a: "Public platforms reward outrage and reach. Crowvo is private by default, community-controlled, and designed for groups who already know each other — not for broadcasting to strangers.",
  },
  {
    q: "Is my data sold?",
    a: "We do not sell your personal information for money. Crowvo plans to support the service with advertising inside the app; it is not running yet, and the Privacy Policy will spell out exactly what an ad can use before it launches.",
  },
  {
    q: "How do communities work?",
    a: "Each community (we call them Realms) has channels, a feed, events, and governance. Members join by invite. Community leaders control settings, moderation, and who can participate.",
  },
  {
    q: "Who controls a community?",
    a: "The people your community trusts to lead it. Crowvo uses authority layers — Founder, Stewards, Moderators, and Members — that communities can rename to fit their culture. Identity tags never grant power.",
  },
  {
    q: "How do I join Crowvo?",
    a: "Crowvo is in Public Beta — anyone can create an account at app.crow-vo.com with email, Google, or Apple sign-in. No invite code required for normal accounts.",
  },
  {
    q: "What are invite codes for?",
    a: "Team and admin codes are reserved for platform administrators, developers, and future private programs. If you have a team code, use Team code in the header to redeem it during signup.",
  },
  {
    q: "How do I contact Crowvo?",
    a: "Use our contact form for general questions, partnerships, and community onboarding. Email dylsn@gmail.com and we'll get back to you.",
  },
  {
    q: "I'm an investor — where can I learn more?",
    a: 'Visit the Investors page for an overview and to request our brief. You can also email dylsn@gmail.com with the subject line "Investor inquiry".',
  },
];

function FaqContactSection() {
  const appUrl = getCrowvoAppUrl();

  return (
    <AnimatedSection>
      <div className="glass-panel grid gap-6 rounded-2xl p-6 sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Still have questions?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Reach out for access help, partnerships, press, or anything else we didn&apos;t cover here.
          </p>
          <p className="mt-4 text-sm">
            <a href="mailto:dylsn@gmail.com" className="text-accent hover:underline">
              dylsn@gmail.com
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end sm:justify-center">
          <Link href="/contact" className="btn-primary w-full text-center sm:w-auto">
            Contact us
          </Link>
          <Link href="/investors" className="btn-secondary w-full text-center sm:w-auto">
            Investor overview
          </Link>
          <a href={`${appUrl}/signup`} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center sm:w-auto">
            Join Public Beta
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default function FaqPage() {
  return (
    <MarketingPage
      eyebrow="FAQ"
      title="Questions, answered plainly."
      subtitle="No pitch deck language. Just honest answers about what Crowvo is and how it works."
      cta={{ label: "Join Public Beta", external: true }}
    >
      <FaqList items={faqs} />
      <div className="mt-8">
        <FaqContactSection />
      </div>
    </MarketingPage>
  );
}
