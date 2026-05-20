import React from 'react';
import { BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { rthConfig } from '@/share-branding/brandConfig';
import { PromptGeneratorUI } from './components/PromptGeneratorUI';

/**
 * AI Content Prompt Generator Page
 * 
 * This tool enables administrative users to generate highly structured AI prompts
 * for tutorial content and visual assets (SVG).
 * 
 * Architecture:
 * - lib/engine.ts: Core logic for prompt/template mapping.
 * - lib/prompts.ts: Human-readable prompt string templates.
 * - lib/prompt-templates.ts: Strict canonical JSON structures for DB parity.
 * - lib/asset-specs.ts: Registry for SVG visual assets.
 * - components/PromptGeneratorUI.tsx: Main client-side interactive interface.
 */
export const metadata = {
  title: 'AI Prompt Generator | SkillHubCore Admin',
  description: 'Enterprise-grade AI content generation pipeline for educational assets.',
};

export default function PromptGeneratorPage() {
  return (
    <BrandProvider brand={rthConfig}>
      <main className="min-h-screen bg-gray-50">
        <PromptGeneratorUI />
      </main>
    </BrandProvider>
  );
}
