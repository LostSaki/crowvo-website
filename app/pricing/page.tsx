import { MarketingPage } from "@/components/marketing-page";
import { getCrowvoAppUrl } from "@/lib/app-url";

export default function PricingPage() {
  const appUrl = getCrowvoAppUrl();

  return (
    <MarketingPage
      eyebrow="ACCESS"
      title="Communities should not pay with their privacy."
      subtitle="Crowvo is in Public Beta. Pricing will stay simple and transparent — focused on supporting communities, not extracting attention."
    >
      <div className="glass-panel max-w-2xl space-y-4 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">During Public Beta</h2>
        <p className="text-sm leading-relaxed text-muted">
          Anyone can join and explore Realms, chat, feeds, events, and governance tools at no cost while we refine the
          experience with real communities.
        </p>
        <a href={`${appUrl}/signup`} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex">
          Join Public Beta
        </a>
      </div>
    </MarketingPage>
  );
}
