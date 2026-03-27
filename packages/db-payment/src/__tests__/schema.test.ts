import { describe, expect, it } from 'vitest';

import {
  gatewayWebhookLogs,
  paymentInstallments,
  paymentPlans,
  paymentTransactions,
} from '../schema';

describe('@quiz/db-payment schema', () => {
  it('exports the payment tables', () => {
    expect(paymentPlans).toBeDefined();
    expect(paymentInstallments).toBeDefined();
    expect(paymentTransactions).toBeDefined();
    expect(gatewayWebhookLogs).toBeDefined();
  });
});
