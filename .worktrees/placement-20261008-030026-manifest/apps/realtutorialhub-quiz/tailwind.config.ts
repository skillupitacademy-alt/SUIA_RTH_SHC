import type { Config } from "tailwindcss";
import sharedPreset from "@quiz/ui/tailwind.preset";

const config: Config = {
  presets: [sharedPreset],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [],
};
export default config;
