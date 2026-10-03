"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CrowvoMark } from "@/components/crowvo-mark";
import { useCrowvoAppUrl } from "@/lib/use-crowvo-app-url";

/**
 * Four links, a Log in link and one CTA.
 *
 * Log in is deliberately quiet next to the waitlist button: most visitors do not have an
 * account yet, so the waitlist stays the primary action. But people who already signed up
 * had no route into the app from this site at all, which made the marketing page a dead
 * end for exactly the users who had already converted.
 *
 * The primary action is the waitlist, not Download: sign-up needs an invite code,
 * so sending a stranger to the stores first is how the old site produced installs
 * that dead-ended. "I have a code" lives on the home page and on /download.
 */
const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-hosts", label: "For hosts" },
  { href: "/safety", label: "Safety" },
  { href: "/download", label: "Download" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const appUrl = useCrowvoAppUrl();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/92">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-h-11 min-w-0 shrink-0 items-center gap-2.5" aria-label="Crowvo home">
          <CrowvoMark size={30} />
          <span className="font-display text-[19px] font-extrabold" style={{ letterSpacing: "-0.04em" }}>
            Crowvo
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-[15px] text-muted md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center rounded-lg px-3 transition hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`${appUrl}/login`}
            data-analytics-event="cta_login_click"
            data-analytics-cta="navbar_login"
            className="hidden h-11 items-center rounded-lg px-3 text-[15px] text-muted transition hover:text-foreground sm:inline-flex"
          >
            Log in
          </a>
          <Link

          href="/waitlist"
            data-analytics-event="cta_waitlist_click"
            data-analytics-cta="navbar_waitlist"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-[15px] font-semibold text-background transition hover:opacity-90"
          >
            Join the waitlist
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border-strong text-foreground transition hover:bg-surface md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-xl px-3 text-[15px] text-muted transition hover:bg-surface hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
              <a
                href={`${appUrl}/login`}
                data-analytics-event="cta_login_click"
                data-analytics-cta="mobilemenu_login"
                className="flex min-h-11 items-center rounded-xl px-3 text-[15px] text-muted transition hover:bg-surface hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Log in
              </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
