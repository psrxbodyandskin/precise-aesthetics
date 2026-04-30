import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "@/components/PostHogProvider";
import { SITE } from "@/lib/constants";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-google",
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body-google",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Precise Aesthetics — Protocol-Driven Pico Laser",
    template: "%s — Precise Aesthetics",
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Precise Aesthetics — Protocol-Driven Pico Laser",
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: "Precise Aesthetics — Protocol-Driven Pico Laser",
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-bone-100 text-ink-700 font-body antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-midnight-800 focus:px-4 focus:py-2 focus:text-cream-50"
        >
          Skip to content
        </a>
        <PostHogProvider>{children}</PostHogProvider>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}
