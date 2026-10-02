import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
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
        {gaId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');`}
            </Script>
          </>
        ) : null}
        {hotjarId ? (
          <Script id="hotjar-init" strategy="afterInteractive">
            {`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${hotjarId},hjsv:6};
              a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
          </Script>
        ) : null}
        <AnalyticsProvider />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
