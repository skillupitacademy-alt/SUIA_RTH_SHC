import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { BrandProvider } from "@quiz/marketing-site/brand";
import { ConsentBanner } from "@quiz/marketing-site";
import ScrollProgressBar from "@quiz/marketing-site/components/Scroll/ScrollProgressBar";
import ScrollToTop from "@quiz/marketing-site/components/Scroll/ScrollToTop";
import LenisProvider from "@quiz/marketing-site/components/Providers/LenisProvider";
import PremiumLoader from "@quiz/marketing-site/components/PremiumLoader";
import { TrackingScripts } from "@quiz/marketing-site/components/Tracking/TrackingScripts";

import { brand } from "../brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: brand.metadata.title,
  description: brand.metadata.description,
  metadataBase: new URL(brand.domain),
  alternates: {
    canonical: brand.domain,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      style={
        {
          "--brand-primary": brand.colors.primary,
          "--brand-secondary": brand.colors.secondary,
        } as CSSProperties
      }
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <BrandProvider brand={brand}>
          <TrackingScripts />
          <ConsentBanner />
          <PremiumLoader />
          <ScrollProgressBar />
          <main id="main-content">
            <LenisProvider>{children}</LenisProvider>
          </main>
          <ScrollToTop />
        </BrandProvider>
      </body>
    </html>
  );
}
