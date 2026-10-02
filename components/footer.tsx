import Link from "next/link";
import { CrowvoMark } from "@/components/crowvo-mark";

const legal = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/safety", label: "Safety" },
  { href: "/trust", label: "Trust" },
  { href: "/download", label: "Download" },
  { href: "/investors", label: "Investors" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#0a0a0d]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-7 sm:px-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <CrowvoMark size={20} fg="var(--muted-dim)" bg="#0a0a0d" />
          <p className="text-sm text-muted-faint">© {new Date().getFullYear()} Crowvo</p>
        </div>
        <div className="-mx-3 flex flex-wrap text-sm text-muted-dim md:ml-auto">
          {legal.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center px-3 transition hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
