import { AnimatedSection } from "@/components/animated-section";
import { WaitlistForm } from "@/components/waitlist-form";
import { ReferralLeaderboard } from "@/components/referral-leaderboard";

const features = [
  {
    title: "Local Event Discovery",
    copy: "Instantly find what is happening tonight, this weekend, or in your niche scene.",
  },
  {
    title: "Community Hubs",
    copy: "Join servers around cities, creators, and interests with focused channels and voice rooms.",
  },
  {
    title: "Live Chat + Voice",
    copy: "Coordinate plans in real-time with your crew before, during, and after events.",
  },
  {
    title: "Social Feed",
    copy: "Share clips, photos, and updates while discovering trending experiences nearby.",
  },
];

const steps = [
  "Discover events curated for your city and interests",
  "Join a Hub and meet people already going",
  "Buy tickets and plan through chat in one flow",
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-12 sm:px-6">
      <AnimatedSection>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-indigo-300/40 bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-300/30 dark:bg-indigo-300/10 dark:text-indigo-200">
              Privacy-first beta: limited founding communities
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Replace noisy chats with <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">private event communities</span>
            </h1>
            <p className="max-w-xl text-base text-muted sm:text-lg">
              Crowvo is the privacy-focused alternative to Discord for real-world communities. Discover events, coordinate in trusted hubs, and launch with transparent demand pricing.
            </p>
            <div id="waitlist">
              <WaitlistForm />
            </div>
            <div className="flex gap-6 text-xs text-muted">
              <span>23,948 waitlist joins</span>
              <span>61 city ambassadors</span>
              <span>17 pilot communities</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/90 to-white/70 p-5 shadow-xl dark:border-white/15 dark:from-white/10 dark:to-transparent">
            <div className="space-y-3 rounded-2xl bg-slate-950/90 p-4 dark:bg-black/40">
              <p className="text-sm text-indigo-200">Tonight in Brooklyn</p>
              <div className="rounded-xl border border-white/15 p-3">
                <p className="text-sm font-semibold">Neon Rooftop Session</p>
                <p className="text-xs text-muted">317 people interested · 48 in voice room</p>
              </div>
              <div className="rounded-xl border border-white/15 p-3">
                <p className="text-sm font-semibold">Founders @ Midnight Mixer</p>
                <p className="text-xs text-muted">Tickets from $19 · 9 Hub channels live</p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
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
          <h3 className="text-2xl font-semibold">How Crowvo works</h3>
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
              className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-indigo-500/10 to-violet-500/5 p-4 dark:border-white/15"
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
            <h3 className="text-2xl font-semibold">What early users say</h3>
            <p className="mt-3 text-muted">
              “Finally one app where I can find events, convince friends to go, and buy tickets without jumping between five tools.”
            </p>
            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-200">— Beta Creator, NYC</p>
          </div>
          <ReferralLeaderboard />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        <div className="rounded-3xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-6 text-center">
          <h3 className="text-2xl font-semibold">Founding member spots close soon</h3>
          <p className="mx-auto mt-2 max-w-2xl text-muted">
            Join now to lock in early perks, priority invites, and insider access before public launch.
          </p>
          <a
            href="#waitlist"
            className="mt-4 inline-flex rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-3 text-sm font-semibold text-white"
          >
            Claim Early Access
          </a>
        </div>
      </AnimatedSection>
    </div>
  );
}
