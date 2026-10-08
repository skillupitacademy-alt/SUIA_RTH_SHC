import type { Config } from 'tailwindcss';

import sharedPreset from "@quiz/ui/tailwind.preset";

const config: Config = {
  presets: [sharedPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../src/share-branding/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
