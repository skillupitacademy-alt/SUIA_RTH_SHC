import type { MarketingBrand } from "../brand";
import type {
  CertificateBranding,
  CertificateData,
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
    completedOn: readParam(searchParams, "completedOn") ?? "25 May 2026",
    duration: readParam(searchParams, "duration") ?? "12 Weeks",
    instructorName: readParam(searchParams, "instructorName") ?? "Vikas Agarwal",
    instructorTitle: readParam(searchParams, "instructorTitle") ?? "CEO & FOUNDER",
    organizationLine:
      readParam(searchParams, "organizationLine") ?? branding.brandName.toUpperCase(),
    verificationUrl,
    description:
      readParam(searchParams, "description") ??
      "Covering Data Analysis, SQL, Excel, Data Visualization, Statistics, and Real-World Data Analytics Projects.",
  };
}
