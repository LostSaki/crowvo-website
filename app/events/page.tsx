import { MarketingPage, PillGrid, appUrl } from "@/components/marketing-page";

const items = [
  { title: "Plan together", copy: "Create events for game nights, meetups, volunteer days, or anything your group cares about." },
  { title: "Stay in the loop", copy: "RSVP, discuss plans in channels, and keep coordination where your community already lives." },
  { title: "Show up for each other", copy: "Events are part of community life — not a separate product bolted on the side." },
];

export default function EventsShowcasePage() {
  return (
    <MarketingPage
      eyebrow="EVENTS"
      title="Bring people together."
      subtitle="When your community wants to meet, volunteer, celebrate, or organize — Crowvo keeps planning close to conversation."
      cta={{ label: "Try the demo", href: `${appUrl}/join`, external: true }}
    >
      <PillGrid items={items} />
    </MarketingPage>
  );
}
