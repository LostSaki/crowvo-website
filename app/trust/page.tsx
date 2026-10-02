import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trust Center | Crowvo",
  description: "How Crowvo approaches security, privacy, and community safety.",
};

export default function TrustCenterPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-cyan">Trust</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Trust Center</h1>
      <p className="mt-3 text-sm text-muted">
        Crowvo is built for communities — with security practices, clear policies, and tools that keep spaces safer.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Security practices</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Passwords hashed with bcrypt; refresh tokens hashed at rest</li>
          <li>Short-lived access tokens and session revocation</li>
          <li>HTTPS, Helmet hardening, and API rate limiting</li>
          <li>Email verification and password reset flows</li>
          <li>Realm permission layers (RBAC) and audit logs for community moderation</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Policies</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/terms" className="text-cyan hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-cyan hover:underline">
            Privacy Policy
          </Link>
          <Link href="/safety" className="text-cyan hover:underline">
            Safety
          </Link>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Reporting</h2>
        <p className="text-sm text-muted">
          Report bugs, safety concerns, or abuse through in-app feedback or our{" "}
          <Link href="/contact" className="text-cyan hover:underline">
            Contact
          </Link>{" "}
          page. We review reports to protect members and improve Crowvo.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Status</h2>
        <p className="text-sm text-muted">
          Crowvo is in Public Beta. For service issues, contact us and check product updates via the app.
        </p>
      </section>
    </div>
  );
}
