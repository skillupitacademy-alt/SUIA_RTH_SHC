import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrecisionGuidanceCard } from '../../components/reports/PrecisionGuidanceCard';
import React from 'react';
import type { GuidanceSignalRow } from '../../hooks/useInsightVectorData';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: { children: React.ReactNode }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('PrecisionGuidanceCard Component', () => {
  const mockSignal: GuidanceSignalRow = {
    signalType: 'Critical Gap',
    hierarchy: 'Domain > Subject > Topic > Subtopic',
    dimension: 'Skill (Expert)',
    currentValue: 92,
    severity: 'HIGH',
    recommendation: 'You are performing exceptionally well in this area.',
    historicalTrend: [{ sessionDate: '2024-01-01', value: 50 }, { sessionDate: '2024-02-01', value: 60 }]
  };

  it('renders signal title and description correctly', () => {
    render(<PrecisionGuidanceCard signal={mockSignal} />);
    expect(screen.getByText('Critical Gap')).toBeDefined();
    expect(screen.getByText(/performing exceptionally well/i)).toBeDefined();
  });

  it('renders accuracy and trend data', () => {
    render(<PrecisionGuidanceCard signal={mockSignal} showProgress />);
    expect(screen.getByText(/Current accuracy: 92%/)).toBeDefined();
  });

  it('renders hierarchy breadcrumb and difficulty badge', () => {
    render(<PrecisionGuidanceCard signal={mockSignal} />);
    expect(screen.getByText('Domain > Subject > Topic > Subtopic')).toBeDefined();
    expect(screen.getByText('EXPERT')).toBeDefined();
  });

  it('renders sparkline when historicalTrend has 2+ points', () => {
    const { container } = render(<PrecisionGuidanceCard signal={mockSignal} showTrend />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('applies indigo progress color for >=80 accuracy', () => {
    const { container } = render(<PrecisionGuidanceCard signal={mockSignal} showProgress />);
    const bar = container.querySelector('.bg-indigo-500');
    expect(bar).not.toBeNull();
  });

  it('applies correct styling based on signal type', () => {
    render(<PrecisionGuidanceCard signal={mockSignal} />);
    const badge = screen.getByText('HIGH');
    expect(badge).toBeDefined();
  });

  it('renders MEDIUM signal correctly', () => {
    render(<PrecisionGuidanceCard signal={{ ...mockSignal, severity: 'MEDIUM', signalType: 'Skill Deficit' }} />);
    expect(screen.getByText('Skill Deficit')).toBeDefined();
    expect(screen.getByText('MEDIUM')).toBeDefined();
  });

  it('renders POSITIVE signal correctly', () => {
    render(<PrecisionGuidanceCard signal={{ ...mockSignal, severity: 'POSITIVE', signalType: 'Strength Zone' }} />);
    expect(screen.getByText('Strength Zone')).toBeDefined();
    expect(screen.getByText('POSITIVE')).toBeDefined();
  });
});
