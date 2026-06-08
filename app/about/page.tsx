import { MarketingPage, PillGrid } from "@/components/marketing-page";

const reasons = [
  {
    title: "Communities became exhausting",
    copy: "Rage bait, pile-ons, and performative posting pushed real conversation to the margins.",
  },
  {
    title: "Privacy kept disappearing",
    copy: "Platforms learned more about you to sell ads — while giving you less control over your space.",
  },
  {
    title: "Engagement replaced people",
    copy: "Algorithms optimize for outrage and clicks, not for trust, care, or showing up for each other.",
  },
  {
    title: "People want smaller, trusted spaces",
    copy: "Friend groups, local circles, hobby clubs, and organizations need a home that feels safe and intentional.",
  },
];

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="WHY CROWVO EXISTS"
      title="Social platforms stopped serving people."
      subtitle="Crowvo is our answer: community-first, privacy-first, and built around real relationships — not advertisers, not growth hacks, and not endless feeds designed to keep you angry."
    >
      <PillGrid items={reasons} />
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-semibold">What we believe</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <li>Communities should belong to the people in them.</li>
          <li>Privacy should be the default, not a premium feature.</li>
          <li>Authority and identity are separate — who you are is not the same as what you can do.</li>
          <li>Technology should feel calm, welcoming, and human.</li>
        </ul>
      </div>
    </MarketingPage>
  );
}
