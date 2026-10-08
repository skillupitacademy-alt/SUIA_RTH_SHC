import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, Poppins } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';
import { SiteShell } from '@/components/layout/SiteShell';

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

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SkillUp IT Academy',
    template: '%s | SkillUp IT Academy',
  },
  description: 'Student portal for SkillUp IT Academy',
  metadataBase: new URL('https://user.skillupitacademy.com'),
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="bg-white text-slate-900 antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
