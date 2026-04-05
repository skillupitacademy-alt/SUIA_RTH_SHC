import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../src/share-branding/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
