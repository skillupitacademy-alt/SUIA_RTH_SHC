import type { MarketingBrand } from "../brand";
import type {
  CertificateBranding,
  CertificateData,
  CertificateGeneratorFormValues,
  CertificatePreviewSearchParams,
} from "./types";

function readParam(
  searchParams: CertificatePreviewSearchParams,
  key: string,
): string | undefined {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
}

function toIsoDateLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toCertificateDateLabel(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function getCertificateBranding(
  brand: MarketingBrand,
): CertificateBranding {
  const tagline =
    brand.id === "skillupitacademy"
      ? "LEARN • GROW • SUCCEED"
      : "LEARN • PRACTICE • SUCCEED";

  return {
    brandId: brand.id,
    brandName: brand.name,
    brandShortName: brand.shortName,
    tagline,
    primaryColor: brand.colors.primary,
    secondaryColor: brand.colors.secondary,
    logoSrc: brand.logo,
    sealLogoSrc: brand.iconLogo,
    verificationBaseUrl: `${brand.domain}/verify`,
  };
}

export function buildCertificateGeneratorDefaults(
  branding: CertificateBranding,
): CertificateGeneratorFormValues {
  const today = new Date();
  const isoDate = toIsoDateLabel(today);
  const certificateId = `${branding.brandShortName}-DA-${today.getFullYear()}-001245`;

  return {
    brandId: branding.brandId,
    studentName: "Aarav Sharma",
    studentId: `${branding.brandShortName}-STU-1001`,
    email: "aarav.sharma@example.com",
    courseName: "DATA ANALYST",
    courseSlug: "data-analyst",
    duration: "12 Weeks",
    description:
      "Covering Data Analysis, SQL, Excel, Data Visualization, Statistics, and Real-World Data Analytics Projects.",
    certificateId,
    completedOn: isoDate,
    issueDate: isoDate,
    instructorName: "Vikas Agarwal",
    instructorTitle: "CEO & FOUNDER",
    organizationLine: branding.brandName.toUpperCase(),
    verificationUrl: `${branding.verificationBaseUrl}/${certificateId}`,
    autoGenerateVerificationUrl: true,
  };
}

export function buildPreviewCertificateData(
  branding: CertificateBranding,
  searchParams: CertificatePreviewSearchParams = {},
): CertificateData {
  const courseName = readParam(searchParams, "courseName") ?? "DATA ANALYST";
  const certificateId =
    readParam(searchParams, "certificateId") ??
    `${branding.brandShortName}-DA-2026-001245`;
  const verificationUrl =
    readParam(searchParams, "verificationUrl") ??
    `${branding.verificationBaseUrl}/${certificateId}`;

  return {
    studentName: readParam(searchParams, "studentName") ?? "Aarav Sharma",
    courseName,
    certificateId,
    completedOn: toCertificateDateLabel(
      readParam(searchParams, "completedOn") ?? "25 May 2026",
    ),
    duration: readParam(searchParams, "duration") ?? "12 Weeks",
    instructorName:
      readParam(searchParams, "instructorName") ?? "Vikas Agarwal",
    instructorTitle:
      readParam(searchParams, "instructorTitle") ?? "CEO & FOUNDER",
    organizationLine:
      readParam(searchParams, "organizationLine") ??
      branding.brandName.toUpperCase(),
    verificationUrl,
    description:
      readParam(searchParams, "description") ??
      "Covering Data Analysis, SQL, Excel, Data Visualization, Statistics, and Real-World Data Analytics Projects.",
  };
}
