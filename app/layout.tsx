import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { AnalyticsScripts } from "@/components/analytics-scripts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crowvo | Communities first. People first. Privacy first.",
  description:
    "Crowvo is built for communities — not advertisers. Talk, organize, and grow together without algorithms, data selling, or endless noise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="crowvo-mesh flex min-h-full flex-col">
        <AnalyticsScripts />
        <AnalyticsProvider />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
