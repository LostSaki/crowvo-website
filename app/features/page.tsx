import { MarketingPage, PillGrid, appUrl } from "@/components/marketing-page";

const features = [
  { title: "Real communities", copy: "Private realms for friend groups, clubs, neighborhoods, and organizations — not public performance stages." },
  { title: "Private by default", copy: "You choose who can find you, who can join, and how open each space is." },
  { title: "Real-time chat", copy: "Talk naturally in channels without switching apps or losing context." },
  { title: "Community feeds", copy: "Share updates with the people who actually care — no algorithm deciding what you see." },
  { title: "Events", copy: "Bring people together. Plan meetups, game nights, volunteer days, and study sessions in one place." },
  { title: "Roles and groups", copy: "Clear authority layers so communities can govern themselves — without copying old server-admin models." },
  { title: "Secure accounts", copy: "Invite-only demo access, session management, and account controls built for real use." },
  { title: "Community governance", copy: "Founders, stewards, and moderators your community can rename to fit your culture." },
];

export default function FeaturesPage() {
  return (
    <MarketingPage
      eyebrow="WHAT YOU GET"
      title="Community tools — not creator tools."
      subtitle="Everything in Crowvo exists to help real groups talk, organize, and stay connected. Nothing is optimized for influencers, advertisers, or viral growth."
      cta={{ label: "Get an invite", href: `${appUrl}/join`, external: true }}
    >
      <PillGrid items={features} />
    </MarketingPage>
  );
}
