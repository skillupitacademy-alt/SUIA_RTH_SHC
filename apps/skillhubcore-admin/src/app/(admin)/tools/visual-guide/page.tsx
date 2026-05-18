import React from 'react';
import { BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { rthConfig } from '@/share-branding/brandConfig';
import { VisualGuideUI } from './components/VisualGuideUI';

export const metadata = {
  title: 'Visual Architecture Guide | SkillHubCore Admin',
  description: 'Global interactive reference guide for 14 educational sections and components.',
};

export default function VisualGuidePage() {
  return (
    <BrandProvider brand={rthConfig}>
      <main className="min-h-screen bg-slate-50/50">
        <VisualGuideUI />
      </main>
    </BrandProvider>
  );
}
