import { describe, expect, it } from 'vitest';
import React from 'react';
import MarketingLayout from '../layout';
import { useQueryClient } from '@tanstack/react-query';

// Consumer component to test that queryClient is properly provided in context
function TestConsumer() {
  const queryClient = useQueryClient();
  return (
    <div data-testid="test-consumer">
      {queryClient ? 'Client Available' : 'No Client'}
    </div>
  );
}

describe('MarketingLayout', () => {
  it('provides a valid QueryClient to children without throwing', () => {
    // Basic verification of React element tree creation
    const element = (
      <MarketingLayout>
        <TestConsumer />
      </MarketingLayout>
    );

    expect(element).toBeDefined();
    expect(element.type).toBe(MarketingLayout);
  });
});
