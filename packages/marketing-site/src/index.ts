export { BrandProvider, getBrandCssVars, useBrand } from "./brand";
export type { MarketingBrand } from "./brand";
export { MarketingContentProvider, useMarketingContent } from "./content/provider";
export { loadMarketingBootstrapSnapshot, loadMarketingContentSnapshot } from "./content/loader";
export {
  getMarketingCourseCatalogSnapshot,
  getMarketingCoursePageSnapshot,
  loadMarketingCourseCatalogSnapshot,
  loadMarketingCoursePageSnapshot,
} from "./content/courses";
export type {
  MarketingBootstrapSnapshot,
  MarketingContentSnapshot,
  MarketingControlPlaneSnapshot,
} from "./content/contracts";
export type {
  MarketingCourseCatalogSnapshot,
  MarketingCoursePageSnapshot,
  MarketingCourseSnapshot,
} from "./content/courses";
export { getAnalyticsRuntimeConfig, resolveBrandAnalyticsConfig } from "./config/analytics";
export { default as MarketingHome } from "./MarketingHome";
export { ConsentBanner } from "./components/privacy/ConsentBanner";
export {
  CourseMarketingPage,
  generateCourseStaticParams,
} from "./course-page";
export { default as CourseMarketingLayout } from "./course-layout";
export { PremiumCertificate } from "./certificates/PremiumCertificate";
export {
  CertificatePreviewFallback,
  CertificatePreviewPage,
} from "./certificates/CertificatePreviewPage";
export { CertificateGeneratorPage } from "./certificates/CertificateGeneratorPage";
export {
  buildCertificateGeneratorDefaults,
  buildPreviewCertificateData,
  getCertificateBranding,
} from "./certificates/branding";
export type {
  CertificateBranding,
  CertificateData,
  CertificateGeneratorFormValues,
  CertificatePreviewSearchParams,
  PremiumCertificateProps,
} from "./certificates/types";
export {
  identifyUser,
  setUserProperties,
  trackConversion,
  trackEvent,
  trackLead,
  trackPageView,
  trackVideoProgress,
} from "./lib/tracking";
export {
  ANALYTICS_SCHEMA_VERSION,
  analyticsEventDefinitions,
  analyticsEventNames,
  getAnalyticsEventDocumentation,
  isAnalyticsEventName,
  normalizeAnalyticsEvent,
} from "./lib/analytics/events";
export { funnelDefinitions, getFunnelState } from "./lib/analytics/funnel";
export { getLeadScores, updateLeadScore } from "./lib/analytics/lead-scoring";
export { getAutomationRules, evaluateAutomationRules } from "./lib/analytics/automation";
export { getAnalyticsHealthSnapshot } from "./lib/analytics/observability";
export { warehouseContract, warehouseSqlArtifacts } from "./lib/analytics/warehouse";
export { resolveIdentity } from "./lib/analytics/identity/identity-resolver";
export { updateSession, endSession } from "./lib/analytics/session/session-manager";
export { getConsentState, updateConsent, revokeConsent } from "./lib/privacy/consent-manager";
export { isFeatureEnabled } from "./lib/feature-flags/rollout-manager";
export { assignExperiment } from "./lib/feature-flags/experiment-engine";
export { processAttributionEvent } from "./lib/analytics/attribution/attribution-engine";
export { buildJourneyGraph, buildSankeyExport } from "./lib/analytics/journey/journey-builder";
export { upsertFeatures, getFeatures } from "./lib/ai-features/feature-store";
export { trackCourseViewed, trackCourseEnrollClicked } from "./lib/domain-tracking/course-tracking";
export { trackPaymentCompleted, trackCheckoutStarted } from "./lib/domain-tracking/payment-tracking";
export { trackWhatsAppLeadStarted, trackDemoSessionBooked } from "./lib/domain-tracking/lead-tracking";
export { trackLessonCompleted, trackGovernedVideoProgress } from "./lib/domain-tracking/engagement-tracking";
export { trackFunnelLanding } from "./lib/domain-tracking/funnel-tracking";
