"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    const saved = localStorage.getItem("hubly-theme");
    if (saved) {
      return saved === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("hubly-theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => {
    setDark((current) => !current);
  };

  return (
    <button
      onClick={toggle}
      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur hover:bg-slate-100 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20"
      type="button"
      aria-label="Toggle theme"
    >
      {dark ? "Light" : "Dark"} mode
    </button>
  );
}
