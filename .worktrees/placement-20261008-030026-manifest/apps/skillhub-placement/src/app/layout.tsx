import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';

import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SkillHub Placement',
    template: '%s | SkillHub Placement',
  },
  description: 'Shared placement service for Real Tutorial Hub and SkillUp IT Academy.',
  metadataBase: new URL('https://placement.skillhubcore.in'),
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
