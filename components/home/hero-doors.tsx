"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useCrowvoAppUrl } from "@/lib/use-crowvo-app-url";

/**
 * The two doors from the Marketing board: waitlist (primary) and "I have a code".
 *
 * Deliberate deviation from the board: the board shows the code being validated on
 * this page ("Code works ✓"). We do NOT validate here. A public endpoint that says
 * yes/no to an arbitrary code is a code oracle — it lets anyone enumerate invites.
 * Instead the code is handed straight to the app's /join, which already validates,
 * rate-limits, and shows the error in context. Same number of taps for a real user.
 */
export function HeroDoors() {
  const appUrl = useCrowvoAppUrl();
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function openCode() {
    setShowCode(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    window.location.href = `${appUrl}/join?code=${encodeURIComponent(trimmed)}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/waitlist"
          data-analytics-event="cta_waitlist_click"
          data-analytics-cta="hero_waitlist"
          className="inline-flex h-13 min-h-[52px] items-center justify-center rounded-full bg-foreground px-7 text-base font-semibold text-background transition hover:opacity-90"
        >
          Join the waitlist
        </Link>
        <button
          type="button"
          onClick={openCode}
          aria-expanded={showCode}
          className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-border-input px-6 text-base font-medium text-foreground transition hover:bg-surface"
        >
          I have a code
        </button>
      </div>

      {showCode ? (
        <form onSubmit={onSubmit} className="mt-3.5 max-w-[470px]">
          <div className="flex items-center gap-2.5">
            <div className="flex min-h-[50px] flex-1 items-center gap-3 rounded-2xl border border-border-input bg-surface px-4">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted-faint)" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
                <rect x="3" y="10" width="18" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CROWVO-XXXX-XXXX"
                aria-label="Invite code"
                autoComplete="off"
                spellCheck={false}
                className="h-[48px] w-full bg-transparent text-base tracking-[0.04em] text-foreground outline-none placeholder:text-[#55555f]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-[50px] items-center justify-center rounded-full bg-foreground px-6 text-[15px] font-semibold text-background transition hover:opacity-90 disabled:opacity-40"
              disabled={!code.trim()}
            >
              Enter
            </button>
          </div>
          <p className="mt-2.5 text-sm text-muted-faint">Takes you straight to sign-up with the code filled in.</p>
        </form>
      ) : null}
    </div>
  );
}
