import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';
import { FacultyServiceWorker } from '@/components/faculty-service-worker';

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
  title: 'Faculty Portal',
  description: 'SkillUp faculty portal scaffold',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <FacultyServiceWorker />
        {children}
      </body>
    </html>
  );
}
