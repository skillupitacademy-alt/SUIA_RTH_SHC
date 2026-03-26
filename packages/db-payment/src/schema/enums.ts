import { pgEnum } from 'drizzle-orm/pg-core';

export const paymentPlanStatusEnum = pgEnum('payment_plan_status', ['active', 'paused', 'closed']);
export const paymentPlanTypeEnum = pgEnum('payment_plan_type', ['full', 'installment', 'scholarship', 'custom']);
export const paymentInstallmentStatusEnum = pgEnum('payment_installment_status', ['paid', 'due', 'overdue', 'waived']);
export const paymentTransactionGatewayEnum = pgEnum('payment_transaction_gateway', ['razorpay', 'stripe', 'manual', 'cashfree']);
export const paymentTransactionStatusEnum = pgEnum('payment_transaction_status', ['created', 'captured', 'failed', 'refunded']);
export const gatewayWebhookStatusEnum = pgEnum('gateway_webhook_status', ['received', 'processed', 'ignored', 'failed']);
