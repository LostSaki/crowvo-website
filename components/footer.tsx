export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70 dark:border-white/10 dark:bg-black/20">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Crowvo. Private communities meet real events.</p>
        <p>Built for founders, creators, and city explorers.</p>
      </div>
    </footer>
  );
}
