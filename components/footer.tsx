import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Crowvo — built for communities, not advertisers.</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <Link href="/safety" className="hover:text-foreground">
            Safety
          </Link>
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <Link href="/waitlist" className="hover:text-foreground">
            Request access
          </Link>
        </div>
      </div>
    </footer>
  );
}
