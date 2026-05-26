import { trackConversion, trackEvent } from "../tracking";

export function trackCheckoutStarted(input: {
  checkoutId: string;
  courseSlug: string;
  courseName: string;
  value: number;
  currency: string;
}) {
  trackEvent("education.checkout_started", input);
}

export function trackPaymentCompleted(input: {
  checkoutId: string;
  paymentId: string;
  paymentProvider: string;
  courseSlug: string;
  courseName: string;
  value: number;
  currency: string;
}) {
  trackConversion("education.payment_completed", input);
}
