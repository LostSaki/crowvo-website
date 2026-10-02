import type { Metadata } from "next";
import { GetCrowvo } from "@/components/download/get-crowvo";
import { DESKTOP_RELEASE } from "@/content/desktop-release";

export const metadata: Metadata = {
  title: "Get Crowvo | Windows and the browser",
  description:
    "Crowvo is free to install. Windows and the browser are first. Sign-up needs an invite code — join the waitlist to get one.",
};

export default function DownloadPage() {
  // On Workers the default "/api/download/windows" streams from a local path that does
  // not exist, so in production we only offer the button once a real hosted URL is set.
  const isRemote = /^https?:\/\//.test(DESKTOP_RELEASE.downloadUrl);
  const installerReady = isRemote || process.env.NODE_ENV !== "production";

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-[13px] font-semibold tracking-[0.09em] text-muted-faint">DOWNLOAD</p>
      <h1 className="mt-3 font-display text-[36px] font-bold leading-tight sm:text-[44px]">
        Get Crowvo
      </h1>
      <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted">
        Free to install. We are in private beta, so signing up needs an invite code — check yours
        here and the install unlocks.
      </p>

      <div className="mt-10">
        <GetCrowvo
          version={DESKTOP_RELEASE.version}
          sizeLabel={DESKTOP_RELEASE.sizeLabel}
          releasedAt={DESKTOP_RELEASE.releasedAt}
          sha256={DESKTOP_RELEASE.sha256}
          downloadUrl={DESKTOP_RELEASE.downloadUrl}
          installerReady={installerReady}
        />
      </div>
    </div>
  );
}
