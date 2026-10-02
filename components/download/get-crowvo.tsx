"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useCrowvoAppUrl } from "@/lib/use-crowvo-app-url";

type CheckState = "idle" | "checking" | "valid" | "invalid" | "throttled";

/**
 * Code-gated download, per WaitlistDownload on the canvas.
 *
 * The install buttons render locked rather than hidden: the board shows them
 * present-but-disabled so people can see what they are working toward, and hiding
 * them makes the page look broken rather than gated.
 *
 * Validation goes through /api/invite/check, which rate limits before touching the
 * backend and returns only { valid }. Anchors are neutralised with pointer-events,
 * tabIndex and aria-disabled — an <a> cannot be disabled by attribute alone.
 */
export function GetCrowvo({
  version,
  sizeLabel,
  releasedAt,
  sha256,
  downloadUrl,
  installerReady,
}: {
  version: string;
  sizeLabel: string;
  releasedAt: string;
  sha256: string;
  downloadUrl: string;
  /** false when no hosted installer URL is configured — the Windows button would 404 */
  installerReady: boolean;
}) {
  const appUrl = useCrowvoAppUrl();
  const [code, setCode] = useState("");
  const [state, setState] = useState<CheckState>("idle");

  const trimmed = code.trim();
  const unlocked = state === "valid";
  const isRemote = /^https?:\/\//.test(downloadUrl);

  async function onCheck(e: FormEvent) {
    e.preventDefault();
    if (!trimmed || state === "checking") return;
    setState("checking");
    try {
      const res = await fetch("/api/invite/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const payload = (await res.json().catch(() => null)) as { valid?: boolean } | null;
      if (res.status === 429) setState("throttled");
      else setState(payload?.valid ? "valid" : "invalid");
    } catch {
      setState("invalid");
    }
  }

  const lockedStyle = unlocked
    ? ""
    : "pointer-events-none select-none opacity-40";

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      {/* ---- code gate + install paths ---- */}
      <div className="rounded-[22px] border border-border-strong bg-surface p-5 sm:p-6">
        <form onSubmit={onCheck}>
          <label htmlFor="dl-code" className="block text-sm font-medium text-muted">
            Invite code
          </label>
          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
            <input
              id="dl-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (state !== "idle") setState("idle");
              }}
              placeholder="CROWVO-XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="dl-code-status"
              className="h-[50px] min-h-[50px] w-full flex-1 rounded-2xl border border-border-input bg-background px-4 text-base tracking-[0.04em] text-foreground outline-none transition placeholder:text-[#55555f] focus:border-accent"
            />
            <button
              type="submit"
              disabled={!trimmed || state === "checking"}
              className="inline-flex h-[50px] shrink-0 items-center justify-center rounded-full bg-foreground px-7 text-[15px] font-semibold text-background transition hover:opacity-90 disabled:opacity-40"
            >
              {state === "checking" ? "Checking…" : "Check"}
            </button>
          </div>
        </form>

        <div id="dl-code-status" aria-live="polite" className="mt-2.5 text-sm">
          {state === "idle" ? (
            <span className="text-muted-faint">
              Crowvo is in private beta. Enter your code to unlock the download.
            </span>
          ) : null}
          {state === "checking" ? <span className="text-muted-faint">Checking…</span> : null}
          {state === "valid" ? (
            <span className="flex items-center gap-2 text-[color:var(--success)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 12.5l5 5 11-11" />
              </svg>
              Code cleared. It will be filled in when you sign up.
            </span>
          ) : null}
          {state === "invalid" ? (
            <span className="text-[color:var(--danger)]">
              That code is not valid. Check it, or join the waitlist for one.
            </span>
          ) : null}
          {state === "throttled" ? (
            <span className="text-[color:var(--danger)]">
              Too many attempts. Wait a few minutes and try again.
            </span>
          ) : null}
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Install on</p>
            {!unlocked ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-faint">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="4" y="10" width="16" height="11" rx="2.5" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                Locked
              </span>
            ) : null}
          </div>

          <div className={`mt-3 grid gap-3 sm:grid-cols-2 ${lockedStyle}`}>
            {installerReady ? (
              <a
                href={unlocked ? downloadUrl : undefined}
                aria-disabled={!unlocked}
                tabIndex={unlocked ? 0 : -1}
                data-analytics-event="download_click"
                data-analytics-cta="download_windows"
                {...(isRemote
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : { download: `CrowvoSetup-${version}.exe` })}
                className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-border-input bg-background px-4 transition hover:border-accent"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-foreground" aria-hidden>
                  <path d="M3 5.5l7.5-1v7H3v-6zM11.5 4.3L21 3v8.5h-9.5v-7.2zM3 12.5h7.5v7L3 18.5v-6zM11.5 12.5H21V21l-9.5-1.3v-7.2z" />
                </svg>
                <span className="min-w-0">
                  <span className="block font-semibold">Windows</span>
                  <span className="block text-sm text-muted-dim">
                    {version}
                    {sizeLabel ? ` · ${sizeLabel}` : ""}
                  </span>
                </span>
              </a>
            ) : (
              <div className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-dashed border-border-input px-4">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-muted-faint" aria-hidden>
                  <path d="M3 5.5l7.5-1v7H3v-6zM11.5 4.3L21 3v8.5h-9.5v-7.2zM3 12.5h7.5v7L3 18.5v-6zM11.5 12.5H21V21l-9.5-1.3v-7.2z" />
                </svg>
                <span className="min-w-0">
                  <span className="block font-semibold text-muted">Windows</span>
                  <span className="block text-sm text-muted-faint">Installer coming shortly</span>
                </span>
              </div>
            )}

            <a
              href={
                unlocked
                  ? `${appUrl}/join?code=${encodeURIComponent(trimmed)}`
                  : undefined
              }
              aria-disabled={!unlocked}
              tabIndex={unlocked ? 0 : -1}
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-event="download_click"
              data-analytics-cta="download_browser"
              className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-border-input bg-background px-4 transition hover:border-accent"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-foreground" aria-hidden>
                <rect x="2.5" y="4" width="19" height="14" rx="2.5" />
                <path d="M2.5 8.5h19" />
              </svg>
              <span className="min-w-0">
                <span className="block font-semibold">Open in browser</span>
                <span className="block text-sm text-muted-dim">Any device, nothing to install</span>
              </span>
            </a>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-faint">
            macOS, Linux, iPhone and Android come later. Windows and the browser are first.
          </p>
          {releasedAt || sha256 ? (
            <p className="mt-3 break-all font-mono text-[13px] text-muted-faint">
              {releasedAt ? `Released ${releasedAt}` : ""}
              {releasedAt && sha256 ? " · " : ""}
              {sha256 ? `SHA-256 ${sha256}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {/* ---- no code ---- */}
      <div className="flex flex-col gap-5">
        <div className="rounded-[22px] border border-border-strong bg-surface p-5 sm:p-6">
          <p className="font-display text-lg font-bold">No code yet?</p>
          <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
            Join the waitlist with your group. We open places in batches and email you a code that
            opens sign-up directly.
          </p>
          <Link
            href="/waitlist"
            data-analytics-event="cta_waitlist_click"
            data-analytics-cta="download_waitlist"
            className="mt-5 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-foreground text-base font-semibold text-background transition hover:opacity-90"
          >
            Join the waitlist
          </Link>
        </div>

        <div className="rounded-[22px] border border-border bg-surface p-5 sm:p-6">
          <p className="text-sm font-semibold">What you need</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>Windows 10 21H2 or Windows 11, 64-bit</li>
            <li>Per-user install — no administrator prompt</li>
            <li>Same account and communities as the browser</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
