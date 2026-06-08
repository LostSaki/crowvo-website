import Link from "next/link";
import { MarketingPage, PillGrid } from "@/components/marketing-page";

const pillars = [
  {
    title: "Privacy-first by design",
    copy: "Communities are private by default. You decide discoverability, invites, and who belongs — not an algorithm.",
  },
  {
    title: "We do not sell your data",
    copy: "Crowvo is not an ad platform. We are not building profiles to sell to third parties.",
  },
  {
    title: "You stay in control",
    copy: "Manage your account, sessions, and profile. Leave or delete your account when you choose.",
  },
  {
    title: "Community moderation",
    copy: "Stewards and moderators your community appoints — with clear authority separate from identity tags.",
  },
  {
    title: "Transparent policies",
    copy: "We explain what we collect, why we collect it, and how communities can govern their own spaces.",
  },
  {
    title: "Invite-only demo",
    copy: "Public signups are closed during the demo. Access is granted through controlled invite codes.",
  },
];

export default function SafetyPage() {
  return (
    <MarketingPage
      eyebrow="SAFETY & PRIVACY"
      title="Safe spaces require intentional design."
      subtitle="Crowvo is built for communities that want trust — not for maximizing engagement, outrage, or data collection."
    >
      <PillGrid items={pillars} />
      <div className="glass-panel space-y-4 rounded-2xl p-6">
        <h2 className="text-xl font-semibold">Authority vs. identity</h2>
        <p className="text-sm leading-relaxed text-muted">
          Profile tags like He/Him, Artist, or Student are for self-expression. They never grant moderation power.
          Authority layers — who can manage channels, events, invites, and governance — are configured separately
          by community leaders.
        </p>
        <Link href="/faq" className="text-sm text-accent hover:underline">
          Read common questions →
        </Link>
      </div>
    </MarketingPage>
  );
}
