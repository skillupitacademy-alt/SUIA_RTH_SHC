import React from 'react';
import { BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { rthConfig } from '@/share-branding/brandConfig';
import { ContentManagerUI } from './components/ContentManagerUI';

export const metadata = {
  title: 'Content Manager | SkillHubCore Admin',
  description: 'Enterprise-grade visual content registry and visualizer preview system.',
};

export default function ContentManagerPage() {
  return (
    <BrandProvider brand={rthConfig}>
      <main className="min-h-screen bg-gray-50/50">
        <ContentManagerUI />
      </main>
    </BrandProvider>
  );
}
