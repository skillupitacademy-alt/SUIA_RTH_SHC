import type { Metadata } from 'next';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import { Inter, Outfit, Poppins } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { DevAxe } from '@/components/providers/DevAxe';
import enMessages from '../../messages/en.json';
import hiMessages from '../../messages/hi.json';

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
  title: 'RealTutorialHub',
  description: 'Tutorial learning experience scaffold',
  manifest: '/manifest.json',
};

const themeBootstrap = `(function () {
  try {
    var theme = localStorage.getItem('rth-tutorial-theme') || 'classic';
    document.documentElement.setAttribute('data-tutorial-theme', theme);
  } catch (error) {
    document.documentElement.setAttribute('data-tutorial-theme', 'classic');
  }
})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('rth-locale')?.value === 'hi' ? 'hi' : 'en';
  const messages = locale === 'hi' ? hiMessages : enMessages;

  return (
    <html lang={locale} data-tutorial-theme="classic" className={`${inter.variable} ${outfit.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#185FA5" />
        <Script id="tutorial-theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
      </head>
      <body>
        <QueryProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <DevAxe />
            {children}
          </NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
