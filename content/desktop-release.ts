/** Update this file when a Windows installer is published to updates.crow-vo.com. */
export const DESKTOP_RELEASE = {
  version: process.env.NEXT_PUBLIC_DESKTOP_VERSION ?? "0.1.0",
  releasedAt: process.env.NEXT_PUBLIC_DESKTOP_RELEASED_AT ?? "",
  sizeLabel: process.env.NEXT_PUBLIC_DESKTOP_SIZE ?? "89 MB",
  sha256: process.env.NEXT_PUBLIC_DESKTOP_SHA256 ?? "",
  /** CDN URL in production; local Next API streams CrowvoSetup from desktop/release. */
  downloadUrl: process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL?.trim() || "/api/download/windows",
};
