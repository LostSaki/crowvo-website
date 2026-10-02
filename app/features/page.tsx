import { MarketingPage, PillGrid } from "@/components/marketing-page";
import { ProductShowcase } from "@/components/marketing-ui";

const features = [
  { title: "Real communities", copy: "Private realms for friend groups, clubs, neighborhoods, and organizations — not public performance stages." },
  { title: "Private by default", copy: "You choose who can find you, who can join, and how open each space is." },
  { title: "Real-time chat", copy: "Talk naturally in channels without switching apps or losing context." },
  { title: "Two feeds, your pick", copy: "For You finds new communities, events and people. Following is just your people, newest first." },
  { title: "Events", copy: "Bring people together. Plan meetups, game nights, volunteer days, and study sessions in one place." },
  { title: "Roles and groups", copy: "Clear authority layers so communities can govern themselves — without copying old server-admin models." },
  { title: "Secure accounts", copy: "Public Beta signup with email or social sign-in, session management, and account controls built for real use." },
  { title: "Community governance", copy: "Founders, stewards, and moderators your community can rename to fit your culture." },
];

export default function FeaturesPage() {
  return (
    <MarketingPage
      eyebrow="WHAT YOU GET"
      title="Built for groups, not broadcasts."
      subtitle="Everything in Crowvo exists to help real groups talk, organize, and actually show up to things together."
      cta={{ label: "Join Public Beta", external: true }}
    >
      <ProductShowcase />
      <PillGrid items={features} />
    </MarketingPage>
  );
}
