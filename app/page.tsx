import Link from "next/link";
import { HeroDoors } from "@/components/home/hero-doors";
import { WaitlistInline } from "@/components/home/waitlist-inline";

/**
 * One page, built from Marketing.dc.html on the design canvas.
 *
 * Positioning v3: Crowvo will have an algorithm and ads. Nothing here claims
 * otherwise — the feed is sold as a choice (For You / Following), and the privacy
 * claims are scoped to visibility, location and who can find you.
 */

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border-strong px-3.5 py-2 text-sm text-muted">
      {children}
    </span>
  );
}

function Promise({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex-1 rounded-[18px] border border-border bg-surface p-5">
      <div className="mb-3 flex items-center gap-3">
        {icon}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="text-[15px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(52% 70% at 78% 8%, rgba(109,124,255,0.16), transparent 70%), radial-gradient(44% 60% at 14% 24%, rgba(208,131,92,0.10), transparent 72%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-3xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-strong px-3.5 py-1.5 text-sm text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--teal)]" />
              In private beta — letting people in gradually
            </span>
            <h1 className="font-display text-[38px] font-bold leading-[1.06] sm:text-[52px]">
              Somewhere for your people, and the plans you make together.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted sm:text-[19px]">
              Communities for what you are into, events that get you out the door, and a way to
              meet the people you pass there. You decide who can see you.
            </p>
            <div className="mt-8">
              <HeroDoors />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- the product ---------------- */}
      <section id="how-it-works" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-display text-[26px] font-bold">This is the whole thing</h2>
            <span className="text-[15px] text-muted-faint">Three tabs do the work.</span>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-base font-semibold">Two feeds, your pick</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                <span className="text-foreground">For You</span> finds new communities, events and
                people. <span className="text-foreground">Following</span> is just your people,
                newest first. Switch in one tap.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold">Rooms, not a group chat</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Text and voice rooms, each community with its own colour, roles and rules. You can
                see where people actually are before you join.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold">Plans are the point</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Make an event anywhere — a room, a message, the feed — and everyone can say yes in
                one tap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- cross paths ---------------- */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-[13px] font-semibold tracking-[0.09em] text-[color:var(--accent-soft)]">
                ONLY ON CROWVO
              </p>
              <h2 className="mt-3 font-display text-[28px] font-bold leading-tight sm:text-[32px]">
                Cross paths with people who get it
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
                At an event, you pass someone who is into the same things. Afterwards you both get
                a nudge with what you share. Say hi, or let it go.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Rule>Off until you turn it on</Rule>
                <Rule>Only inside events</Rule>
                <Rule>Both people opt in</Rule>
                <Rule>Never your location</Rule>
              </div>
            </div>

            <div className="rounded-[26px] border border-border-strong bg-surface-elevated p-6">
              <p className="text-sm text-muted-dim">Crowvo · Rooftop Sessions</p>
              <p className="mt-3 font-display text-xl font-bold">You crossed paths with Maya</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["film photos", "bouldering", "indie games"].map((t) => (
                  <span key={t} className="rounded-full bg-[#1e1e26] px-3 py-1.5 text-sm text-[#d4d4dc]">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex gap-2.5">
                <span className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-[15px] font-semibold text-background">
                  Say hi
                </span>
                <span className="inline-flex min-h-11 items-center rounded-full border border-border-input px-5 text-[15px] text-[#d4d4dc]">
                  Not now
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- the promise ---------------- */}
      <section className="border-b border-border bg-[#0b0b0f]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="font-display text-[26px] font-bold">You decide who can see you</h2>
          <div className="mt-7 flex flex-col gap-5 md:flex-row">
            <Promise
              title="Invisible means invisible"
              body="Go dark in one community and stay visible in another. No last-seen, no read receipts you did not ask for, no quiet exceptions."
              icon={
                <svg width="24" height="24" viewBox="0 0 30 30" fill="none" aria-hidden>
                  <ellipse cx="15" cy="15" rx="13" ry="5.6" transform="rotate(-25 15 15)" stroke="#33333d" strokeWidth="1.5" />
                  <circle cx="15" cy="15" r="4" fill="none" stroke="#5a5a64" strokeWidth="1.7" />
                </svg>
              }
            />
            <Promise
              title="Your community, your rules"
              body="Hosts set roles, permissions and who gets in. Moderation is built in, not bolted on, and every action is logged."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--clay)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3l7 3.5v5c0 4.2-2.9 7.9-7 9-4.1-1.1-7-4.8-7-9v-5z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              }
            />
            <Promise
              title="Found only when you want to be"
              body="Crossing paths is off until you turn it on for an event, works only there, and needs both people to opt in. Nobody sees where you are."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--iris)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* ---------------- for hosts ---------------- */}
      <section id="for-hosts" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-[13px] font-semibold tracking-[0.09em] text-[color:var(--clay)]">
                FOR HOSTS, CREATORS &amp; COMMUNITY MANAGERS
              </p>
              <h2 className="mt-3 font-display text-[28px] font-bold leading-tight sm:text-[32px]">
                Know if it is about to pop off
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
                Real analytics for your communities, events and posts, plus a live Hype Meter that
                shows how alive things are before and during.
              </p>
              <Link
                href="/waitlist"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-border-input px-6 text-[15px] font-medium text-foreground transition hover:bg-surface"
              >
                Host on Crowvo
              </Link>
            </div>

            <div className="rounded-[22px] border border-border-strong bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Rooftop Sessions</p>
                  <p className="mt-0.5 text-sm text-muted-dim">Fri 8pm · in 2 hours</p>
                </div>
                <span className="rounded-full bg-[#2e1c12] px-3 py-1 text-[13px] font-semibold text-[#f2c9ae]">
                  HYPE
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#1c1c23]">
                <div
                  className="h-full rounded-full"
                  style={{ width: "72%", background: "linear-gradient(90deg, var(--iris), var(--clay))" }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  ["48", "RSVPs"],
                  ["+12", "this hour"],
                  ["210", "messages"],
                ].map(([n, l]) => (
                  <div key={l} className="rounded-xl border border-border py-3">
                    <p className="text-lg font-bold tabular-nums">{n}</p>
                    <p className="mt-0.5 text-[13px] text-muted-dim">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- waitlist ---------------- */}
      <section id="waitlist" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(46% 90% at 82% 50%, rgba(109,124,255,0.13), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid items-end gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-[28px] font-bold sm:text-[30px]">Get an invite</h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                Tell us who you would bring and we will open a place for the whole group, not just
                you.
              </p>
            </div>
            <WaitlistInline />
          </div>
        </div>
      </section>
    </>
  );
}
