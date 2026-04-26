import { InvestorForm } from "@/components/investor-form";

export default function InvestorsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/15 dark:bg-white/5">
        <h1 className="text-3xl font-semibold tracking-tight">Investor Brief</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Hubly is building the privacy-first community OS for events: discovery, trusted hubs, live coordination, and
          transparent pricing in one mobile product.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/15 dark:bg-white/5">
          <h2 className="text-xl font-semibold">Problem</h2>
          <p className="mt-2 text-sm text-muted">
            People discover events in one app, plan in another, and chat in public-first communities not designed for
            attendance. Fragmentation reduces trust, weakens conversion, and creates noisy user experiences.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/15 dark:bg-white/5">
          <h2 className="text-xl font-semibold">Solution</h2>
          <p className="mt-2 text-sm text-muted">
            Hubly replaces Discord as the event-native place to build private communities, coordinate in real-time,
            and act with clear, fair pricing. Built for attendance outcomes, not generic chat.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/15 dark:bg-white/5">
          <h2 className="text-xl font-semibold">Market Opportunity</h2>
          <p className="mt-2 text-sm text-muted">
            We sit at the intersection of live events, creator communities, and social media, targeting a large and
            growing engagement + transaction market with stronger retention from community-driven loops.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/15 dark:bg-white/5">
          <h2 className="text-xl font-semibold">Vision</h2>
          <p className="mt-2 text-sm text-muted">
            Become the default private social layer where communities choose what to attend, who to go with, and how
            to shape the product through direct feedback.
          </p>
        </article>
      </section>
      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/15 dark:bg-white/5">
          <h2 className="text-xl font-semibold">Request investor access</h2>
          <p className="mt-2 text-sm text-muted">
            Submit interest to receive the deck, traction updates, and early diligence materials.
          </p>
        </div>
        <InvestorForm />
      </section>
    </div>
  );
}
