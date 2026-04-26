import { InvestorForm } from "@/components/investor-form";

export default function InvestorsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/85">
        <p className="text-xs font-semibold tracking-[0.16em] text-indigo-500 dark:text-indigo-300">INVESTOR ACCESS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Crowvo Investor Brief</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Crowvo is building the privacy-first social OS for communities, with event discovery and conversion embedded
          directly in the social graph.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
          <h2 className="text-xl font-semibold">Problem</h2>
          <p className="mt-2 text-sm text-muted">
            Communities spend daily attention in chat tools that are not designed to convert social energy into
            coordinated action. Discovery, planning, and attendance remain fragmented.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
          <h2 className="text-xl font-semibold">Solution</h2>
          <p className="mt-2 text-sm text-muted">
            Crowvo replaces Discord for action-oriented communities by combining private hubs, social feed, live chat,
            and event conversion flows in one product.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
          <h2 className="text-xl font-semibold">Market Opportunity</h2>
          <p className="mt-2 text-sm text-muted">
            We sit at the intersection of live events, creator communities, and social media, targeting a large and
            growing engagement + transaction market with stronger retention from community-driven loops.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
          <h2 className="text-xl font-semibold">Vision</h2>
          <p className="mt-2 text-sm text-muted">
            Become the default private social layer where communities build daily habit and turn momentum into
            real-world outcomes.
          </p>
        </article>
      </section>
      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
          <h2 className="text-xl font-semibold">Request deck access</h2>
          <p className="mt-2 text-sm text-muted">
            Submit interest to receive the deck, traction updates, and early diligence materials.
          </p>
        </div>
        <InvestorForm />
      </section>
    </div>
  );
}
