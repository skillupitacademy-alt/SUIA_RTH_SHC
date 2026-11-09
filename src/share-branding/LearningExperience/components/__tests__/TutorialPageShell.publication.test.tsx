// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TENANT_REGISTRY, type TutorialPagePayload } from '@quiz/types';
import type { TutorialRuntimeContext } from '../../runtime/TutorialRuntimeContext';
import { TutorialPageShell } from '../TutorialPageShell';
import { TutorialLeftSidebar } from '../TutorialLeftSidebar';

const mocks = vi.hoisted(() => ({
  ils: vi.fn(), telemetry: vi.fn(), completion: vi.fn(),
  session: vi.fn(() => 'test-session'),
  track: vi.fn(async () => ({ delivered: true })),
  progress: vi.fn(async () => null),
}));

// Exercise the real shell/sidebar/chrome. Learning-runtime boundaries are isolated
// so an unpublished page cannot start providers, tracking, or progress requests.
vi.mock('@quiz/ui', async () => {
  const { createElement } = await import('react');
  type Children = { children: React.ReactNode };
  return {
    ActiveBlockProvider: ({ children }: Children) => children,
    ILSProvider: ({ children }: Children) => { mocks.ils(); return children; },
    BlockTelemetryProvider: ({ children }: Children) => { mocks.telemetry(); return children; },
    InstructionalBlockCompletionOrchestrator: ({ children }: Children) => { mocks.completion(); return children; },
    LearningProgressSidebar: () => null,
    useILS: () => ({ overallProgress: null, activeBlockProgress: null }),
    buildBlockMetadataResolver: () => () => null,
    TutorialBlockRenderer: ({ block }: { block: { id: string; content: { text: string } } }) =>
      createElement('p', { 'data-block-id': block.id }, block.content.text),
  };
});
vi.mock('../../runtime/tutorialTrackingService', () => ({
  trackTutorialEvent: mocks.track, getTutorialProgress: mocks.progress,
}));
vi.mock('../../runtime/tutorialSessionService', () => ({
  getOrCreateTutorialLearningSessionId: mocks.session,
}));

function fixture(brandId: 'skillup' | 'realtutorialhub', published = false) {
  const tenant = TENANT_REGISTRY[brandId];
  const pageUrl = '/tutorial-v2/domain/subject/topic/java/whatisjava';
  const sectionId = published ? 'published-section' : null;
  const hierarchy = {
    domain: { id: 'domain', name: 'Development', slug: 'domain' },
    subject: { id: 'subject', name: 'Backend', slug: 'subject' },
    topic: { id: 'topic', name: 'Java', slug: 'topic' },
    subtopic: { id: 'subtopic', name: 'What is Java?', slug: 'java' },
  };
  const payload: TutorialPagePayload = {
    brandId, theme: tenant.theme, hierarchy, activeUrl: pageUrl,
    sidebar: {
      brand: tenant, theme: tenant.theme, subject: { name: 'Backend' }, progress: { percentage: 0 },
      topics: [{ id: 'whatisjava', name: 'What is Java?', type: 'page', slug: 'whatisjava', url: pageUrl }],
    },
    content: { sectionId, blocks: published ? [{
      id: '11111111-1111-4111-8111-111111111111', type: 'paragraph', content: { text: 'Published block content' },
    }] : [] },
    footer: { previous: null, next: { name: 'Syntax & Structure', slug: 'syntax', url: '/tutorial-v2/next' } },
  };
  const runtimeContext: TutorialRuntimeContext = {
    brandId, learnerId: 'learner', sectionId, sessionId: null,
    navigationNodeId: 'whatisjava', navigationNodeName: 'What is Java?',
    hierarchy: {
      domainId: 'domain', domainName: 'Development', domainSlug: 'domain',
      subjectId: 'subject', subjectName: 'Backend', subjectSlug: 'subject',
      topicId: 'topic', topicName: 'Java', topicSlug: 'topic',
      subtopicId: 'subtopic', subtopicName: 'What is Java?', subtopicSlug: 'java',
    },
  };
  return { payload, runtimeContext };
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
});
afterEach(cleanup);

describe('unpublished canonical tutorial pages', () => {
  it.each(['skillup', 'realtutorialhub'] as const)('keeps %s navigation without starting learning activity', (brand) => {
    render(<TutorialPageShell {...fixture(brand)} />);
    expect(screen.getByRole('status')).toHaveTextContent('Content is not published');
    expect(screen.getByRole('complementary', { name: 'Tutorial navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Syntax & Structure/ })).toHaveAttribute('href', '/tutorial-v2/next');
    expect(screen.getByRole('button', { name: 'Learning progress' })).toBeDisabled();
    expect(mocks.ils).not.toHaveBeenCalled();
    expect(mocks.telemetry).not.toHaveBeenCalled();
    expect(mocks.completion).not.toHaveBeenCalled();
    expect(mocks.track).not.toHaveBeenCalled();
    expect(mocks.progress).not.toHaveBeenCalled();
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it('does not start learning from blocks without a delivered section identity', () => {
    const page = fixture('skillup', true);
    page.runtimeContext.sectionId = null;
    page.payload.content.sectionId = null;
    render(<TutorialPageShell {...page} />);
    expect(screen.queryByText('Published block content')).not.toBeInTheDocument();
    expect(mocks.ils).not.toHaveBeenCalled();
    expect(mocks.track).not.toHaveBeenCalled();
  });

  it('starts the existing learning runtime after publication and stops it on an unpublished page', async () => {
    const view = render(<TutorialPageShell {...fixture('skillup')} />);
    view.rerender(<TutorialPageShell {...fixture('skillup', true)} />);
    await waitFor(() => expect(mocks.progress).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Published block content')).toBeInTheDocument();
    expect(mocks.ils).toHaveBeenCalled();
    expect(mocks.telemetry).toHaveBeenCalled();
    expect(mocks.completion).toHaveBeenCalled();
    expect(mocks.track).toHaveBeenCalledTimes(1);
    expect(mocks.session).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Learning progress' })).toBeEnabled();
    vi.clearAllMocks();
    view.rerender(<TutorialPageShell {...fixture('skillup')} />);
    expect(screen.getByRole('status')).toHaveTextContent('Content is not published');
    expect(mocks.ils).not.toHaveBeenCalled();
    expect(mocks.telemetry).not.toHaveBeenCalled();
    expect(mocks.completion).not.toHaveBeenCalled();
    expect(mocks.track).not.toHaveBeenCalled();
    expect(mocks.progress).not.toHaveBeenCalled();
  });
});

describe('tutorial brand initials', () => {
  it.each(['skillup', 'realtutorialhub'] as const)('shows %s initials without loading a configured logo', (brand) => {
    const { payload } = fixture(brand);
    const tenant = TENANT_REGISTRY[brand];
    render(<TutorialLeftSidebar tree={payload.sidebar} />);
    expect(screen.queryByRole('img', { name: `${tenant.name} logo` })).not.toBeInTheDocument();
    expect(screen.getByText(brand === 'skillup' ? 'SA' : 'RTH')).toBeInTheDocument();
  });

  it('keeps initials without an image and updates them when the tenant changes', () => {
    const first = fixture('skillup').payload.sidebar;
    const view = render(<TutorialLeftSidebar tree={{ ...first, brand: { ...first.brand, logoUrl: undefined } }} />);
    expect(screen.getByText('SA')).toBeInTheDocument();
    const second = fixture('realtutorialhub').payload.sidebar;
    view.rerender(<TutorialLeftSidebar tree={second} />);
    expect(screen.getByText('RTH')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
