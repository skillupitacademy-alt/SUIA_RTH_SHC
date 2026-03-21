import type { Metadata } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'RealTutorialHub',
  description: 'Tutorial learning experience scaffold',
};

const themeBootstrap = `(function () {
  try {
    var theme = localStorage.getItem('rth-tutorial-theme') || 'classic';
    document.documentElement.setAttribute('data-tutorial-theme', theme);
  } catch (error) {
    document.documentElement.setAttribute('data-tutorial-theme', 'classic');
  }
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-tutorial-theme="classic" suppressHydrationWarning>
      <head>
        <Script id="tutorial-theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
