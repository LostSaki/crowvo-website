import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/investors", label: "Investors" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0d14]/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
          Crowvo
        </Link>
        <nav className="hidden gap-6 text-sm text-muted md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/#waitlist"
            data-analytics-event="cta_start_hub_click"
            data-analytics-cta="navbar_start_hub"
            className="rounded-full bg-gradient-to-r from-[#5865F2] to-[#7c5cff] px-4 py-2 text-xs font-semibold text-white transition hover:scale-105"
          >
            Start Your Hub
          </Link>
        </div>
      </div>
    </header>
  );
}
