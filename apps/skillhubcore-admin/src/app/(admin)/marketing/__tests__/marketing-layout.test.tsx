/** @vitest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import MarketingLayout from '../layout';
import MarketingGovernancePage from '../page';
import { useQueryClient, useQuery } from '@tanstack/react-query';

// Test consumer calling useQueryClient and useQuery
function ActiveQueryConsumer() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['test-provider-key'],
    queryFn: async () => 'tanstack-query-active',
  });

  return (
    <div>
      <span data-testid="client-status">{queryClient ? 'client-ready' : 'no-client'}</span>
      <span data-testid="query-status">{isLoading ? 'loading' : data}</span>
    </div>
  );
}

describe('MarketingLayout & MarketingGovernancePage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ status: 'mocked-ok', endpoint: url }),
      } as Response);
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders child consumer and executes useQueryClient and useQuery without missing provider error', async () => {
    render(
      <MarketingLayout>
        <ActiveQueryConsumer />
      </MarketingLayout>
    );

    expect(screen.getByTestId('client-status').textContent).toBe('client-ready');

    await waitFor(() => {
      expect(screen.getByTestId('query-status').textContent).toBe('tanstack-query-active');
    });
  });

  it('mounts the real MarketingGovernancePage within MarketingLayout and executes all 5 useQuery hooks safely', async () => {
    render(
      <MarketingLayout>
        <MarketingGovernancePage />
      </MarketingLayout>
    );

    // Initial render displays the cards
    expect(screen.getByText('RTH Control Plane')).toBeDefined();
    expect(screen.getByText('SUIA Control Plane')).toBeDefined();
    expect(screen.getByText('Collector Health')).toBeDefined();

    // After fetch resolves, cards transition from Loading to Healthy
    await waitFor(() => {
      const healthyBadges = screen.getAllByText('Healthy');
      expect(healthyBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('fails when MarketingGovernancePage is rendered outside of QueryClientProvider (demonstrating defect)', () => {
    // Suppress console.error during expected failure
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<MarketingGovernancePage />);
    }).toThrow(/No QueryClient set/i);

    consoleSpy.mockRestore();
  });
});
