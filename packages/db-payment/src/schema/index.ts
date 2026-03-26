/* istanbul ignore file */
export * from './enums';
export * from './payment-plans';
export * from './payment-installments';
export * from './payment-transactions';
export * from './gateway-webhook-logs';

import * as enums from './enums';
import * as paymentPlansModule from './payment-plans';
import * as paymentInstallmentsModule from './payment-installments';
import * as paymentTransactionsModule from './payment-transactions';
import * as gatewayWebhookLogsModule from './gateway-webhook-logs';

export const schema = {
  ...enums,
  ...paymentPlansModule,
  ...paymentInstallmentsModule,
  ...paymentTransactionsModule,
  ...gatewayWebhookLogsModule,
};
