'use client';

import { useState } from 'react';

import type { TutorialPagePayload } from '@quiz/types';
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

  return (
    <main className="min-h-screen bg-[#f4f7fa]">
      <TutorialHeader
        crumbs={[payload.hierarchy.domain.name, payload.hierarchy.subject.name, payload.hierarchy.topic.name]}
        active={payload.hierarchy.subtopic.name}
        brand={payload.sidebar.brand}
        theme={payload.theme}
        onMenuClick={() => setIsSidebarOpen((current) => !current)}
      />
      <div className="flex">
        {isSidebarOpen && (
          <TutorialLeftSidebar tree={payload.sidebar} activeUrl={payload.activeUrl} />
        )}
        <div className="min-w-0 flex-1 px-6 py-6">
          <div className="mx-auto w-full space-y-6">
            {payload.content.definition && <TutorialDefinitionContent payload={payload.content.definition} theme={payload.theme} />}
            {payload.content.code && <TutorialCodeContent payload={payload.content.code} theme={payload.theme} />}
            {payload.content.summary && <TutorialSummaryContent payload={payload.content.summary} theme={payload.theme} />}
            {!payload.content.definition && !payload.content.code && !payload.content.summary && (
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
