import { MarketingPage, PillGrid, appUrl } from "@/components/marketing-page";

const examples = [
  { title: "Gaming groups", copy: "Coordinate sessions, share clips, and keep your squad in one trusted space." },
  { title: "Local communities", copy: "Block associations, neighborhood groups, and city circles that actually show up." },
  { title: "Friend groups", copy: "The group chat that grew up — with room to plan, share, and stay close." },
  { title: "Hobby clubs", copy: "Photography, hiking, books, music — whatever brings you together." },
  { title: "Study groups", copy: "Share notes, schedule sessions, and keep accountability human." },
  { title: "Organizations", copy: "Volunteer teams, student orgs, and community groups that need clarity and trust." },
];

export default function CommunitiesPage() {
  return (
    <MarketingPage
      eyebrow="WHO IT'S FOR"
      title="Communities people actually want to be part of."
      subtitle="Crowvo is for groups that care about each other — not audiences, not follower counts, and not engagement charts."
      cta={{ label: "Get an invite", href: `${appUrl}/join`, external: true }}
    >
      <PillGrid items={examples} />
    </MarketingPage>
  );
}
