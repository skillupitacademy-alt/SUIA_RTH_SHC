import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightVectorTab } from '../../components/reports/InsightVectorTab';
import type { GuidanceSignalRow, HistoricalProgressRow, AggregationRow } from '../../hooks/useInsightVectorData';
import React from 'react';

// Mock dependecies
vi.mock('../../components/reports/PrecisionGuidanceCard', () => ({
  PrecisionGuidanceCard: ({ signal }: { signal: GuidanceSignalRow }) => (
    <div data-testid="guidance-card">{signal.signalType}</div>
  )
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: { children: React.ReactNode }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Recharts to avoid issues in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

describe('InsightVectorTab Component', () => {
  const mockGuidanceSignals: GuidanceSignalRow[] = [
    {
      signalType: 'Strength Zone',
      hierarchy: 'Domain > Subject > Topic > Subtopic',
      dimension: 'Skill (Simple)',
      currentValue: 85,
      severity: 'POSITIVE',
      recommendation: 'Great job'
    },
    {
      signalType: 'Skill Deficit',
      hierarchy: 'Domain > Subject > Topic > Subtopic',
      dimension: 'Skill (Intermediate)',
      currentValue: 55,
      severity: 'MEDIUM',
      recommendation: 'Improve'
    },
    {
      signalType: 'Critical Gap',
      hierarchy: 'Domain > Subject > Topic > Subtopic',
      dimension: 'Skill (Expert)',
      currentValue: 35,
      severity: 'HIGH',
      recommendation: 'Fix'
    }
  ];

  const mockHistorical: HistoricalProgressRow[] = [
    {
      sessionId: 's1',
      sessionDate: '2024-01-01',
      domain: 'Domain',
      subject: 'Subject',
      topic: 'Topic',
      subtopic: 'Subtopic',
      accuracyPct: 80,
      masteryScorePct: 70,
      expertDropoff: 10,
      readinessLevel: 'Intermediate',
      sessionIndex: 1,
      trend: 'improving'
    },
    {
      sessionId: 's2',
      sessionDate: '2024-02-01',
      domain: 'Domain',
      subject: 'Subject',
      topic: 'Topic',
      subtopic: 'Subtopic',
      accuracyPct: 70,
      masteryScorePct: 65,
      expertDropoff: 12,
      readinessLevel: 'Intermediate',
      sessionIndex: 2,
      trend: 'regressing'
    }
  ];

  const mockSkills: AggregationRow[] = [{
    skillName: 'Skill A',
    totalAttempts: 10,
    correctAnswers: 8,
    accuracyPct: 80,
    avgTimeSec: 40,
    masteryScorePct: 75,
    readinessLevel: 'Intermediate'
  }];

  const mockProps = {
    guidanceSignals: mockGuidanceSignals,
    historicalProgress: mockHistorical,
    skillData: mockSkills,
    report: {
      examId: 'id',
      score: 80,
      mastery: 70,
      readiness: 75,
      percentile: 85,
      totalTimeSpentSeconds: 3600,
      timeEfficiency: 'OPTIMAL' as const,
      subtopics: [],
      skills: [],
      difficulty: [],
      heatmap: [],
      ai: { status: 'READY' as const, actions: [], weakest_subtopic: '', weakest_skill: '' }
    },
    loading: false,
    error: null,
    onRetry: vi.fn()
  };

  it('renders all main sections for successful state', () => {
    render(<InsightVectorTab {...mockProps} />);
    
    expect(screen.getByText(/Signal Command Centre/i)).toBeDefined();
    expect(screen.getByText(/Skill Intelligence Matrix/i)).toBeDefined();
    expect(screen.getByText(/Progression Timeline/i)).toBeDefined();
    expect(screen.getByText(/Next Action Protocol/i)).toBeDefined();
  });

  it('renders guidance signals through PrecisionGuidanceCard', () => {
    render(<InsightVectorTab {...mockProps} />);
    const cards = screen.getAllByTestId('guidance-card');
    expect(cards.length).toBe(3);
    expect(cards[0].textContent).toBe('Critical Gap');
    expect(cards[1].textContent).toBe('Skill Deficit');
    expect(cards[2].textContent).toBe('Strength Zone');
  });

  it('renders skill data bars', () => {
    render(<InsightVectorTab {...mockProps} />);
    expect(screen.getByText('Skill A')).toBeDefined();
    expect(screen.getAllByText('80%').length).toBeGreaterThan(0);
  });

  it('renders progression timeline table headers and values', () => {
    render(<InsightVectorTab {...mockProps} />);
    expect(screen.getByText('S1')).toBeDefined();
    expect(screen.getByText('S2')).toBeDefined();
    expect(screen.getAllByText('80%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('70%').length).toBeGreaterThan(0);
  });

  it('renders next action protocol with score-based timing', () => {
    render(<InsightVectorTab {...mockProps} />);
    expect(screen.getByText(/Return in 72 hours/i)).toBeDefined();
  });

  it('renders diagnostic footer SYS vector', () => {
    render(<InsightVectorTab {...mockProps} />);
    expect(screen.getByText(/SYS_ID/i)).toBeDefined();
  });

  it('renders loading state', () => {
    render(<InsightVectorTab {...mockProps} loading={true} />);
    expect(screen.queryByText(/Signal Command Centre/i)).toBeNull();
  });

  it('renders error state with retry button', () => {
    render(<InsightVectorTab {...mockProps} error="Synthesis Error" />);
    expect(screen.getByText(/Vector Sync Failed/i)).toBeDefined();
    const retryBtn = screen.getByText(/Sync Retry/i);
    retryBtn.click();
    expect(mockProps.onRetry).toHaveBeenCalled();
  });
});
