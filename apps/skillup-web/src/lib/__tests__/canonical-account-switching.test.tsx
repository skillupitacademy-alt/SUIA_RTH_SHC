// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TutorialPagePayload } from '@quiz/types';
import type { TutorialRuntimeContext } from '../../../../../src/share-branding/LearningExperience/runtime/TutorialRuntimeContext';

vi.mock('../../../../../packages/ui/src/tutorial/runtime/ActiveBlockContext', () => ({
  useActiveBlock: () => ({ activeBlock: null }),
}));
vi.mock('@quiz/ui', async () => {
  const runtime = await import('../../../../../packages/ui/src/tutorial/runtime/ILSProvider');
  const Children = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  return {
    ILSProvider: runtime.ILSProvider,
    useILS: runtime.useILS,
    ActiveBlockProvider: Children,
    BlockTelemetryProvider: Children,
    InstructionalBlockCompletionOrchestrator: Children,
    LearningProgressSidebar: () => null,
    buildBlockMetadataResolver: () => () => undefined,
    TutorialBlockRenderer: () => {
      const { overallProgress } = runtime.useILS();
      return <output data-testid="canonical-progress">{overallProgress?.progressPercentage ?? 'empty'}</output>;
    },
  };
});
vi.mock('../../../../../src/share-branding/LearningExperience/components/TutorialLeftSidebar', () => ({ TutorialLeftSidebar: () => null }));
vi.mock('../../../../../src/share-branding/LearningExperience/components/TutorialPageChrome', () => ({ TutorialHeader: () => null, TutorialFooterNavigation: () => null }));
vi.mock('../../../../../src/share-branding/LearningExperience/runtime/tutorialTrackingService', () => ({ trackTutorialEvent: async () => {}, getTutorialProgress: async () => null }));
vi.mock('../../../../../src/share-branding/LearningExperience/runtime/tutorialSessionService', () => ({ getOrCreateTutorialLearningSessionId: () => null }));

import { TutorialPageShell } from '../../../../../src/share-branding/LearningExperience/components/TutorialPageShell';

const payload = {
  hierarchy: { domain: { name: 'Domain' }, subject: { name: 'Subject' }, topic: { name: 'Topic' }, subtopic: { name: 'Subtopic' } },
  sidebar: { brand: 'skillup', topics: [] }, content: { blocks: [{ id: 'block-1', type: 'definition', version: 'D1' }] },
  theme: { primary: '#123456', secondary: '#654321' }, footer: { previous: null, next: null }, activeUrl: '/tutorial-v2/fixture',
} as unknown as TutorialPagePayload;
const createContext = (learnerId: string): TutorialRuntimeContext => ({
  learnerId, brandId: 'skillup', navigationNodeId: 'page-1', navigationNodeName: 'Page', sectionId: 'section-1', sessionId: null,
  hierarchy: { domainId: 'domain-1', domainName: 'Domain', domainSlug: 'domain', subjectId: 'subject-1', subjectName: 'Subject', subjectSlug: 'subject', topicId: 'topic-1', topicName: 'Topic', topicSlug: 'topic', subtopicId: 'subtopic-1', subtopicName: 'Subtopic', subtopicSlug: 'subtopic' },
});
function pendingResponse() {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>(done => { resolve = done; });
  return { promise, resolve: (percentage: number) => resolve(new Response(JSON.stringify({ data: {
    navigationNodeId: 'page-1', subtopicId: 'subtopic-1', sectionId: 'section-1', status: 'in_progress', progressPercentage: percentage,
    completedBlockCount: 1, totalBlockCount: 2, timeSpentActiveSec: 0, visitCount: 1, revisionCount: 0, firstViewedAt: null, lastViewedAt: null, completedAt: null, blocks: [],
  } }), { status: 200 })) };
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe.each(['skillup', 'realtutorialhub'] as const)('canonical %s TutorialPageShell account switching with real ILSProvider', brandId => {
  const context = (learnerId: string): TutorialRuntimeContext => ({ ...createContext(learnerId), brandId });
  it('clears loaded A progress immediately when B replaces A on the same page', async () => {
    const a = pendingResponse(); const b = pendingResponse();
    const fetch = vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    vi.stubGlobal('fetch', fetch);
    const view = render(<TutorialPageShell payload={payload} runtimeContext={context('learner-a')} />);
    await act(async () => { a.resolve(88); });
    await waitFor(() => expect(screen.getByTestId('canonical-progress')).toHaveTextContent('88'));
    view.rerender(<TutorialPageShell payload={payload} runtimeContext={context('learner-b')} />);
    expect(screen.getByTestId('canonical-progress')).toHaveTextContent('empty');
    expect(fetch).toHaveBeenCalledTimes(2);
    await act(async () => { b.resolve(12); });
    await waitFor(() => expect(screen.getByTestId('canonical-progress')).toHaveTextContent('12'));
  });
  it('ignores a delayed A response after B has loaded progress', async () => {
    const a = pendingResponse(); const b = pendingResponse();
    const fetch = vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    vi.stubGlobal('fetch', fetch);
    const view = render(<TutorialPageShell payload={payload} runtimeContext={context('learner-a')} />);
    view.rerender(<TutorialPageShell payload={payload} runtimeContext={context('learner-b')} />);
    expect(fetch).toHaveBeenCalledTimes(2);
    await act(async () => { b.resolve(12); });
    await waitFor(() => expect(screen.getByTestId('canonical-progress')).toHaveTextContent('12'));
    await act(async () => { a.resolve(88); });
    expect(screen.getByTestId('canonical-progress')).toHaveTextContent('12');
  });
  it('keeps B authoritative when an old A request finishes after unmount and remount', async () => {
    const a = pendingResponse(); const b = pendingResponse();
    vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise));
    const view = render(<TutorialPageShell payload={payload} runtimeContext={context('learner-a')} />);
    view.unmount();
    render(<TutorialPageShell payload={payload} runtimeContext={context('learner-b')} />);
    await act(async () => { b.resolve(12); });
    await waitFor(() => expect(screen.getByTestId('canonical-progress')).toHaveTextContent('12'));
    await act(async () => { a.resolve(88); });
    expect(screen.getByTestId('canonical-progress')).toHaveTextContent('12');
  });
  it('discards progress when the same learner changes brand', async () => {
    const a = pendingResponse(); const b = pendingResponse();
    const fetch = vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    vi.stubGlobal('fetch', fetch);
    const view = render(<TutorialPageShell payload={payload} runtimeContext={context('learner-a')} />);
    await act(async () => { a.resolve(88); });
    await waitFor(() => expect(screen.getByTestId('canonical-progress')).toHaveTextContent('88'));
    view.rerender(<TutorialPageShell payload={payload} runtimeContext={{ ...context('learner-a'), brandId: brandId === 'skillup' ? 'realtutorialhub' : 'skillup' }} />);
    expect(screen.getByTestId('canonical-progress')).toHaveTextContent('empty');
    expect(fetch).toHaveBeenCalledTimes(2);
    await act(async () => { b.resolve(12); });
    await waitFor(() => expect(screen.getByTestId('canonical-progress')).toHaveTextContent('12'));
  });
});
