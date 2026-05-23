export { BrandProvider, getBrandCssVars, useBrand } from "./brand";
export type { MarketingBrand } from "./brand";
export { default as MarketingHome } from "./MarketingHome";
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
export { buildPreviewCertificateData, getCertificateBranding } from "./certificates/branding";
export type {
  CertificateBranding,
  CertificateData,
  CertificatePreviewSearchParams,
  PremiumCertificateProps,
} from "./certificates/types";
