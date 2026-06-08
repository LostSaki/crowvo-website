import { FaqList, MarketingPage, appUrl } from "@/components/marketing-page";

const faqs = [
  {
    q: "Why Crowvo?",
    a: "Because most social platforms optimize for advertisers and engagement — not for the people inside communities. Crowvo is built for trusted spaces where real groups can talk, organize, and grow without algorithms or data selling.",
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
    a: "No. Crowvo does not sell your personal data to advertisers. Our model is built around serving communities, not harvesting attention for ads.",
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
    q: "How do I get access?",
    a: "Crowvo is invite-only during the demo. Request an invite code from an administrator or use a code shared with your group.",
  },
];

export default function FaqPage() {
  return (
    <MarketingPage
      eyebrow="FAQ"
      title="Questions, answered plainly."
      subtitle="No pitch deck language. Just honest answers about what Crowvo is and how it works."
      cta={{ label: "Get an invite", href: `${appUrl}/join`, external: true }}
    >
      <FaqList items={faqs} />
    </MarketingPage>
  );
}
