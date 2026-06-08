import Link from "next/link";
import { MarketingPage } from "@/components/marketing-page";

export default function PricingPage() {
  return (
    <MarketingPage
      eyebrow="ACCESS"
      title="Communities should not pay with their privacy."
      subtitle="Crowvo is in invite-only demo. Pricing will stay simple and transparent when we open more broadly — focused on supporting communities, not extracting attention."
    >
      <div className="glass-panel max-w-2xl space-y-4 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">During the demo</h2>
        <p className="text-sm leading-relaxed text-muted">
          Access is by invite only. Communities can explore Realms, chat, feeds, events, and governance tools at no
          cost while we refine the experience with early groups.
        </p>
        <Link href="/contact" className="btn-secondary inline-flex">
          Ask about access
        </Link>
      </div>
    </MarketingPage>
  );
}
