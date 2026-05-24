import type { MarketingBrand } from "../brand";

export interface CertificateBranding {
  brandId: MarketingBrand["id"];
  brandName: string;
  brandShortName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoSrc: string;
  sealLogoSrc: string;
  verificationBaseUrl: string;
}

export interface CertificateData {
  studentName: string;
  courseName: string;
  certificateId: string;
  completedOn: string;
  duration: string;
  instructorName: string;
  instructorTitle: string;
  organizationLine: string;
  verificationUrl: string;
  description: string;
}

export interface PremiumCertificateProps {
  branding: CertificateBranding;
  data: CertificateData;
  fitToViewport?: boolean;
  certificateRef?: React.Ref<HTMLDivElement>;
}

export interface CertificateGeneratorFormValues {
  brandId: MarketingBrand["id"];
  studentName: string;
  studentId: string;
  email: string;
  courseName: string;
  courseSlug: string;
  duration: string;
  description: string;
  certificateId: string;
  completedOn: string;
  issueDate: string;
  instructorName: string;
  instructorTitle: string;
  organizationLine: string;
  verificationUrl: string;
  autoGenerateVerificationUrl: boolean;
}

export type CertificatePreviewSearchParams = Record<
  string,
  string | string[] | undefined
>;
