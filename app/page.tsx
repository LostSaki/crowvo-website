import { AnimatedSection } from "@/components/animated-section";
import { WaitlistForm } from "@/components/waitlist-form";
import { ReferralLeaderboard } from "@/components/referral-leaderboard";

const features = [
  {
    title: "Community Hubs",
    copy: "Private spaces with channels, roles, and moderation controls built for trust.",
  },
  {
    title: "Live Feed + Chat",
    copy: "Post updates, react in real time, and keep momentum without context switching.",
  },
  {
    title: "Voice + Presence",
    copy: "See who is active, hop into voice rooms fast, and coordinate with your core group.",
  },
  {
    title: "Event Layer",
    copy: "Discovery, RSVP, ticketing, and attendance tools are native to each community.",
  },
];

const steps = [
  "Start or join a private hub around your city, creator, or niche.",
  "Build daily social activity through feed posts, chat, and voice rooms.",
  "Convert momentum into real events with built-in discovery and ticket actions.",
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-12 sm:px-6">
      <AnimatedSection>
        <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-indigo-300/40 bg-indigo-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-indigo-700 dark:border-indigo-300/30 dark:bg-indigo-300/10 dark:text-indigo-200">
              LIVE COMMUNITIES · PRIVATE BY DEFAULT
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Social velocity of X.
              <br />
              Trusted community depth of Discord.
            </h1>
            <p className="max-w-2xl text-base text-muted sm:text-lg">
              Crowvo is community-first social infrastructure. Your hub becomes the place people talk, plan, and
              mobilize together, with events as a native action layer.
            </p>
            <div id="waitlist">
              <WaitlistForm />
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="#waitlist"
                data-analytics-event="cta_waitlist_click"
                data-analytics-cta="hero_join_waitlist"
                className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
              >
                Join Waitlist
              </a>
              <a
                href="/investors"
                data-analytics-event="cta_request_deck_click"
                data-analytics-cta="hero_request_deck"
                className="inline-flex rounded-full border border-indigo-300/50 bg-indigo-100 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-200 dark:border-indigo-300/30 dark:bg-indigo-300/10 dark:text-indigo-200 dark:hover:bg-indigo-300/20"
              >
                Request Deck
              </a>
            </div>
            <div className="grid gap-3 text-xs text-muted sm:grid-cols-3">
              <p className="rounded-xl border border-slate-200/80 bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-white/5">23,948 waitlist joins</p>
              <p className="rounded-xl border border-slate-200/80 bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-white/5">61 city ambassadors</p>
              <p className="rounded-xl border border-slate-200/80 bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-white/5">17 pilot communities</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/15 dark:bg-[#151a2b]/85">
              <p className="text-xs font-semibold tracking-wider text-indigo-500 dark:text-indigo-300">LIVE FEED</p>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-black/30">
                <p className="text-sm font-semibold">@brooklynafterdark</p>
                <p className="mt-1 text-xs text-muted">New member intros thread is live. 84 replies in 20 minutes.</p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-black/30">
                  <p className="text-sm font-semibold">@foundercollective</p>
                <p className="mt-1 text-xs text-muted">Weekly voice townhall starts in 12m. Event sprint planning room open.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-slate-950 p-4 text-white shadow-sm dark:border-white/15">
              <p className="text-xs font-semibold tracking-wider text-indigo-200">CROWVO HUB · PRIVATE CHANNELS</p>
              <div className="mt-3 space-y-2 text-sm text-indigo-100/90">
                <p># event-chat · 248 online</p>
                <p># ticket-drops · 84 online</p>
                <p># feedback-loop · 52 online</p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="mb-4 text-center text-xs font-semibold tracking-[0.2em] text-muted">POST · CHAT · CONVERT</div>
        <div className="grid gap-4 md:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/15 dark:bg-white/5"
            >
              <h2 className="mb-2 text-lg font-semibold">{feature.title}</h2>
              <p className="text-sm text-muted">{feature.copy}</p>
            </article>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/15 dark:bg-white/5">
          <h3 className="text-2xl font-semibold">Community first. Events as a native action.</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200/80 bg-white/65 p-4 dark:border-white/15 dark:bg-transparent">
                <p className="text-xs text-indigo-600 dark:text-indigo-200">Step {index + 1}</p>
                <p className="mt-2 text-sm text-muted">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-[#5865F2]/10 to-[#7c5cff]/5 p-4 dark:border-white/15"
            >
              <div className="h-64 rounded-2xl border border-slate-300/80 bg-white/70 p-3 dark:border-white/10 dark:bg-black/30">
                <p className="text-sm text-muted">UI Preview {item}</p>
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.35}>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/15 dark:bg-white/5">
            <h3 className="text-2xl font-semibold">What early communities say</h3>
            <p className="mt-3 text-muted">
              “Our members now hang out daily in one place, and when we launch an event it fills faster because the
              community is already active.”
            </p>
            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-200">— Community Host, Brooklyn</p>
          </div>
          <ReferralLeaderboard />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        <div className="rounded-3xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-6 text-center">
          <h3 className="text-2xl font-semibold">Build your community home, then turn energy into attendance.</h3>
          <p className="mx-auto mt-2 max-w-2xl text-muted">
            Launch your private Crowvo hub now and secure founding perks before public rollout.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#waitlist"
              data-analytics-event="cta_start_hub_click"
              data-analytics-cta="final_start_founding_hub"
              className="inline-flex rounded-full bg-gradient-to-r from-[#5865F2] to-[#7c5cff] px-6 py-3 text-sm font-semibold text-white"
            >
              Start Founding Hub
            </a>
            <a
              href="/investors"
              data-analytics-event="cta_request_deck_click"
              data-analytics-cta="final_request_deck"
              className="inline-flex rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
            >
              Request Deck
            </a>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
