import Link from "next/link";
import { CrowvoMark } from "@/components/crowvo-mark";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <CrowvoMark size={56} />
      <h1 className="mt-7 font-display text-[30px] font-bold">Nothing in this orbit</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        That page moved or never existed. The whole site lives on one page now.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-6 text-[15px] font-semibold text-background transition hover:opacity-90"
        >
          Go home
        </Link>
        <Link
          href="/waitlist"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-input px-6 text-[15px] font-medium text-foreground transition hover:bg-surface"
        >
          Join the waitlist
        </Link>
      </div>
    </div>
  );
}
