import Link from "next/link";
import { CrowvoMark } from "@/components/marketing-ui";
import { crowvoAppUrl } from "@/lib/app-url";

const links = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/communities", label: "Communities" },
  { href: "/safety", label: "Safety" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const appUrl = crowvoAppUrl;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground">
          <CrowvoMark size="sm" />
          Crowvo
        </Link>
        <nav className="hidden gap-5 text-sm text-muted lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={`${appUrl}/join`} className="btn-secondary hidden sm:inline-flex">
            Get invite
          </a>
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event="cta_start_hub_click"
            data-analytics-cta="navbar_launch_app"
            className="btn-primary"
          >
            Open app
          </a>
        </div>
      </div>
    </header>
  );
}
