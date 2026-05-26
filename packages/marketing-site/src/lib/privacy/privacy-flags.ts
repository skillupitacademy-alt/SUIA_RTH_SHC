export type ConsentCategory = "functional" | "analytics" | "marketing" | "advertising";

export interface ConsentState {
  version: string;
  updatedAt: string;
  expiresAt?: string;
  region: "IN" | "EU" | "ROW";
  categories: Record<ConsentCategory, boolean>;
}

export const defaultConsentState: ConsentState = {
  version: "2026-05-26",
  updatedAt: new Date(0).toISOString(),
  region: "ROW",
  categories: {
    functional: true,
    analytics: false,
    marketing: false,
    advertising: false,
  },
};

