import type { ReactNode } from "react";

const wordmarkSizes = {
  sm: "text-xl tracking-tight",
  md: "text-2xl tracking-tight",
  lg: "text-4xl tracking-tight",
};

/** Text wordmark — no image logo. */
export function CrowvoWordmark({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      className={`font-display font-semibold text-foreground ${wordmarkSizes[size]} ${className}`}
      style={{ letterSpacing: "-0.04em" }}
    >
      Crowvo
    </span>
  );
}

/** @deprecated Use CrowvoWordmark */
export function CrowvoMark(props: { size?: "sm" | "md" | "lg"; className?: string }) {
  return <CrowvoWordmark {...props} />;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-accent">
      {children}
    </p>
  );
}

export function MarketingCard({ children, className = "", glow }: { children: ReactNode; className?: string; glow?: boolean }) {
  return <div className={`glass-panel rounded-2xl p-5 ${glow ? "glow-ring" : ""} ${className}`}>{children}</div>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest text-cyan">{children}</p>;
}

export function StatPill({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-border bg-glass px-3 py-2 text-xs text-muted">{children}</p>;
}

export function FeedPreview() {
  const posts = [
    { user: "Study Group · Tuesday", text: "Anyone free to review chapter 4 together tonight?" },
    { user: "Neighborhood Block", text: "Potluck this Saturday — bring a dish if you can." },
  ];

  return (
    <div className="space-y-4">
      <MarketingCard glow>
        <SectionLabel>Community feed</SectionLabel>
        <div className="mt-3 space-y-3">
          {posts.map((post) => (
            <div key={post.user} className="rounded-xl border border-border bg-surface-elevated/80 p-3">
              <p className="text-sm font-semibold text-foreground">{post.user}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{post.text}</p>
            </div>
          ))}
        </div>
      </MarketingCard>

      <MarketingCard className="bg-gradient-to-br from-accent/15 via-surface to-cyan/10">
        <SectionLabel>Your community · private channels</SectionLabel>
        <div className="mt-3 space-y-2 text-sm text-muted">
          <p><span className="text-cyan">#</span> general</p>
          <p><span className="text-cyan">#</span> plans</p>
          <p><span className="text-cyan">#</span> help</p>
        </div>
      </MarketingCard>
    </div>
  );
}

export function HubPreview() {
  return (
    <MarketingCard glow className="bg-gradient-to-br from-surface via-surface to-accent/5">
      <SectionLabel>Realms</SectionLabel>
      <div className="mt-3 flex gap-3">
        <div className="w-28 shrink-0 space-y-1 rounded-xl border border-border bg-surface-elevated/80 p-2 text-xs">
          <p className="font-semibold text-foreground">Study Circle</p>
          <p className="text-cyan"># general</p>
          <p className="text-muted"># homework</p>
          <p className="mt-2 font-semibold text-foreground">Block Club</p>
          <p className="text-cyan"># plans</p>
        </div>
        <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface-elevated/60 p-3 text-xs text-muted">
          <p className="font-semibold text-foreground">Alex</p>
          <p className="mt-1">Meet at the library at 6? We can go through chapter 4 together.</p>
        </div>
      </div>
    </MarketingCard>
  );
}

export function LoginPreview() {
  return (
    <MarketingCard>
      <div className="flex flex-col items-center text-center">
        <CrowvoWordmark size="sm" />
        <p className="mt-3 text-sm font-semibold">Welcome back</p>
        <p className="mt-1 text-xs text-muted">Sign in to your community</p>
        <div className="mt-4 w-full space-y-2">
          <div className="h-8 rounded-lg border border-border bg-surface-elevated/80" />
          <div className="h-8 rounded-lg border border-border bg-surface-elevated/80" />
          <div className="h-9 rounded-lg bg-accent/80" />
        </div>
      </div>
    </MarketingCard>
  );
}

export function EventsPreview() {
  const events = [
    { title: "Community potluck", when: "Sat · 4:00 PM", rsvp: "12 going" },
    { title: "Study session", when: "Tue · 6:00 PM", rsvp: "5 going" },
  ];
  return (
    <MarketingCard className="bg-gradient-to-br from-cyan/10 via-surface to-accent/10">
      <SectionLabel>Events</SectionLabel>
      <div className="mt-3 space-y-2">
        {events.map((e) => (
          <div key={e.title} className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated/70 px-3 py-2 text-xs">
            <div>
              <p className="font-semibold text-foreground">{e.title}</p>
              <p className="text-muted">{e.when}</p>
            </div>
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">{e.rsvp}</span>
          </div>
        ))}
      </div>
    </MarketingCard>
  );
}

export function PublicBetaPreview() {
  return (
    <MarketingCard>
      <SectionLabel>Public Beta</SectionLabel>
      <p className="mt-2 text-xs text-muted">Open signup — help shape Crowvo with your feedback.</p>
      <div className="mt-3 rounded-lg border border-border bg-surface-elevated/80 px-3 py-2 text-xs text-muted">
        🚧 Actively improving with the community
      </div>
      <div className="mt-2 h-8 rounded-lg bg-accent/80" />
    </MarketingCard>
  );
}

export function ProductShowcase() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <HubPreview />
      <LoginPreview />
      <EventsPreview />
      <PublicBetaPreview />
    </div>
  );
}

export const HOME_FEATURES = [
  "Real communities",
  "Private by default",
  "Real-time chat",
  "Community feeds",
  "Events",
  "Roles and groups",
  "Secure accounts",
  "Community governance",
] as const;
