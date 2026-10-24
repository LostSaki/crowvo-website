import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { ConsentBanner } from "@/components/consent-banner";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { fontBody, fontDisplay } from "@/lib/fonts";

export const metadata: Metadata = {
  metadataBase: new URL("https://crow-vo.com"),
  title: "Crowvo | Find your people. Go to things together.",
  description:
    "Communities for what you are into, events that get you out the door, and a way to meet the people you pass there. Private beta — join the waitlist.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Crowvo",
    url: "https://crow-vo.com",
    title: "Crowvo | Find your people. Go to things together.",
    description:
      "Communities, events, and the people you pass there. Private beta — join the waitlist.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crowvo | Find your people. Go to things together.",
    description:
      "Communities, events, and the people you pass there. Private beta — join the waitlist.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;

  return (
    <html lang="en" className={`${fontBody.variable} ${fontDisplay.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans">
        <AnalyticsScripts gaId={gaId} hotjarId={hotjarId} />
        <AnalyticsProvider />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ConsentBanner />
      </body>
    </html>
  );
}
