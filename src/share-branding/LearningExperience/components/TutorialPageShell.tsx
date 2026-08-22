'use client';

import { useState } from 'react';

import type { TutorialPagePayload } from '@quiz/types';
import { TutorialBlockRenderer } from '@quiz/ui';
import { TutorialCodeContent } from './TutorialCodeContent';
import { TutorialDefinitionContent } from './TutorialDefinitionContent';
import { TutorialSummaryContent } from './TutorialSummaryContent';
import { TutorialLeftSidebar } from './TutorialLeftSidebar';
import { TutorialFooterNavigation, TutorialHeader } from './TutorialPageChrome';

interface TutorialPageShellProps {
  payload: TutorialPagePayload;
}

export function TutorialPageShell({ payload }: TutorialPageShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // V2 Architecture: Render blocks[] when available
  const hasBlocks = payload.content.blocks && payload.content.blocks.length > 0;
  
  // Legacy fallback: Check for old content structure
  const hasLegacyContent = 
    payload.content.definition || 
    payload.content.code || 
    payload.content.summary;

  return (
    <main className="min-h-screen bg-white">
      <TutorialHeader
        crumbs={[payload.hierarchy.domain.name, payload.hierarchy.subject.name, payload.hierarchy.topic.name]}
        active={payload.hierarchy.subtopic.name}
        brand={payload.sidebar.brand}
        theme={payload.theme}
        onMenuClick={() => setIsSidebarOpen((current) => !current)}
      />
      <div className="flex w-full min-w-0 gap-0 bg-white">
        {isSidebarOpen && (
          <TutorialLeftSidebar tree={payload.sidebar} activeUrl={payload.activeUrl} />
        )}
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8 bg-white">
          <div className="w-full space-y-6">
            {hasBlocks ? (
              // V2 Canonical Path: Render blocks[] using TutorialBlockRenderer
              payload.content.blocks.map((block) => (
                <TutorialBlockRenderer
                  key={block.id}
                  block={block}
                  theme={payload.theme}
                  depth={0}
                />
              ))
            ) : hasLegacyContent ? (
              // Temporary Legacy Fallback: Render old content structure
              <>
                {payload.content.definition && <TutorialDefinitionContent payload={payload.content.definition} theme={payload.theme} />}
                {payload.content.code && <TutorialCodeContent payload={payload.content.code} theme={payload.theme} />}
                {payload.content.summary && <TutorialSummaryContent payload={payload.content.summary} theme={payload.theme} />}
              </>
            ) : (
              // Empty/Unpublished State
              <section className="rounded-xl border border-[#e4eaf2] bg-white p-6 text-[#071f63] shadow-sm">
                Content is not published for this subtopic yet.
              </section>
            )}
          </div>
          <TutorialFooterNavigation previous={payload.footer.previous} next={payload.footer.next} theme={payload.theme} />
        </div>
      </div>
    </main>
  );
}
