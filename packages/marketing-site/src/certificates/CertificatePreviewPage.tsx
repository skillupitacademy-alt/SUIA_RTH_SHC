"use client";

import { useSearchParams } from "next/navigation";
import React, { useMemo } from "react";

import type { MarketingBrand } from "../brand";
import { buildPreviewCertificateData, getCertificateBranding } from "./branding";
import { PremiumCertificate } from "./PremiumCertificate";

function resolveBrand(
  brands: MarketingBrand[],
  searchBrandId: string | null,
): MarketingBrand {
  const fallbackBrand = brands[0];

  if (!searchBrandId) {
    return fallbackBrand;
  }

  return brands.find((brand) => brand.id === searchBrandId) ?? fallbackBrand;
}

export function CertificatePreviewFallback({
  brands,
}: {
  brands: MarketingBrand[];
}) {
  const brand = brands[0];
  const branding = getCertificateBranding(brand);
  const data = buildPreviewCertificateData(branding);

  return <PremiumCertificate branding={branding} data={data} />;
}

export function CertificatePreviewPage({
  brands,
}: {
  brands: MarketingBrand[];
}) {
  const searchParams = useSearchParams();
  const brand = useMemo(
    () => resolveBrand(brands, searchParams.get("brand")),
    [brands, searchParams],
  );
  const branding = useMemo(() => getCertificateBranding(brand), [brand]);

  const data = useMemo(
    () =>
      buildPreviewCertificateData(branding, {
        studentName: searchParams.get("studentName") ?? undefined,
        courseName: searchParams.get("courseName") ?? undefined,
        certificateId: searchParams.get("certificateId") ?? undefined,
        completedOn: searchParams.get("completedOn") ?? undefined,
        duration: searchParams.get("duration") ?? undefined,
        instructorName: searchParams.get("instructorName") ?? undefined,
        instructorTitle: searchParams.get("instructorTitle") ?? undefined,
        organizationLine: searchParams.get("organizationLine") ?? undefined,
        verificationUrl: searchParams.get("verificationUrl") ?? undefined,
        description: searchParams.get("description") ?? undefined,
      }),
    [branding, searchParams],
  );

  return <PremiumCertificate branding={branding} data={data} />;
}
