import type { Metadata } from "next";

/**
 * Metadata only. page.tsx here is a client component because of its form, and a client
 * component cannot export metadata — without this wrapper the page silently inherits the
 * site-wide title, which is what it was doing.
 */
export const metadata: Metadata = {
  title: "Investors | Crowvo",
  description: "Crowvo is building a calmer place to find your people and actually go to things. Investor enquiries.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
