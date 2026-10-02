import path from "node:path";
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const packageRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  turbopack: {
    // Cursor workspace is the parent folder; pin Turbopack to this package.
    root: packageRoot,
  },
  async headers() {
    const scriptSrc = isProd
      ? "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.hotjar.com https://challenges.cloudflare.com;"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://static.hotjar.com https://challenges.cloudflare.com;";

    const sharedSecurityHeaders = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
      },
      {
        key: "Content-Security-Policy",
        value:
          `default-src 'self'; ${scriptSrc} connect-src 'self' https://app.posthog.com https://*.hotjar.com https://*.hotjar.io https://challenges.cloudflare.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src https://challenges.cloudflare.com;`,
      },
    ];

    const bypassCacheHeaders = [{ key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" }];

    return [
      {
        source: "/admin",
        headers: [...bypassCacheHeaders, ...sharedSecurityHeaders],
      },
      {
        source: "/api/admin/:path*",
        headers: bypassCacheHeaders,
      },
      {
        source: "/:path*",
        headers: sharedSecurityHeaders,
      },
    ];
  },

  /**
   * The site folded down to one page. These routes still have files on disk so the
   * copy is recoverable, but they redirect — nothing 404s and old links keep working.
   * Sections that survived the fold point at their anchor on the home page.
   */
  async redirects() {
    return [
      { source: "/features", destination: "/#how-it-works", permanent: false },
      { source: "/communities", destination: "/#how-it-works", permanent: false },
      { source: "/events", destination: "/#how-it-works", permanent: false },
      { source: "/pricing", destination: "/", permanent: false },
      { source: "/about", destination: "/", permanent: false },
      { source: "/faq", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
