export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/15 dark:bg-white/5">
        <h1 className="text-3xl font-semibold tracking-tight">About Crowvo</h1>
        <p className="mt-4 text-muted">
          Crowvo exists to make event communities private, intentional, and outcome-driven. We believe people should
          discover events, coordinate with trusted groups, and shape the product through direct feedback loops.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/15 dark:bg-white/5">
          <h2 className="text-xl font-semibold">Mission</h2>
          <p className="mt-2 text-sm text-muted">
            Build the privacy-first operating system for real-world communities and events.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/15 dark:bg-white/5">
          <h2 className="text-xl font-semibold">Vision</h2>
          <p className="mt-2 text-sm text-muted">
            A world where every city has trusted digital hubs that turn interest into attendance without sacrificing
            privacy.
          </p>
        </article>
      </section>
      <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/15 dark:bg-white/5">
        <h2 className="text-xl font-semibold">Founder Story</h2>
        <p className="mt-2 text-sm text-muted">
          Crowvo started from one recurring pain: communities had energy, but event execution was fragmented across too
          many tools. We are building one trusted place to discover, coordinate, and convert together.
        </p>
      </section>
    </div>
  );
}
