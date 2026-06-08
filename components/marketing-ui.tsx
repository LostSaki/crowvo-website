import type { ReactNode } from "react";

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

export function CrowvoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-10 w-10 text-base", md: "h-14 w-14 text-xl", lg: "h-16 w-16 text-2xl" };
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-accent font-bold text-white shadow-lg shadow-accent/30 ${sizes[size]}`}
    >
      C
    </div>
  );
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
          <p>
            <span className="text-cyan">#</span> general
          </p>
          <p>
            <span className="text-cyan">#</span> plans
          </p>
          <p>
            <span className="text-cyan">#</span> help
          </p>
        </div>
      </MarketingCard>
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
