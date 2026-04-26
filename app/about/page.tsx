export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/85">
        <p className="text-xs font-semibold tracking-[0.16em] text-indigo-500 dark:text-indigo-300">ABOUT CROWVO</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Built for private communities that move in real life.</h1>
        <p className="mt-4 max-w-3xl text-muted">
          Crowvo exists to make social communities private, intentional, and outcome-driven. Events are not a separate
          app in the stack, they are a natural extension of community momentum.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
          <h2 className="text-xl font-semibold">Mission</h2>
          <p className="mt-2 text-sm text-muted">Build the privacy-first social operating system for real-world communities.</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
          <h2 className="text-xl font-semibold">Vision</h2>
          <p className="mt-2 text-sm text-muted">
            Every city has trusted digital hubs where people belong daily and mobilize instantly when it is time to act.
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/70">
          <h2 className="text-xl font-semibold">Founder Story</h2>
          <p className="mt-2 text-sm text-muted">
            Crowvo started from one recurring pain: community energy lived in chat, while execution lived somewhere
            else. We are building one trusted social home where people connect first and events happen naturally.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-slate-950 p-5 text-white shadow-sm dark:border-white/15">
          <h2 className="text-xl font-semibold">Crowvo Principles</h2>
          <ul className="mt-3 space-y-2 text-sm text-indigo-100/90">
            <li>Private by default</li>
            <li>Community input first</li>
            <li>Transparent demand pricing</li>
            <li>Built for attendance outcomes</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
