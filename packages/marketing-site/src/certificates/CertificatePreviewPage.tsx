"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useRef, useState } from "react";

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

async function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function getFileBaseName(
  brandShortName: string,
  certificateId: string,
  studentName: string,
): string {
  const slugName = studentName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${brandShortName}-${certificateId}-${slugName || "certificate"}`;
}

function PreviewShell({
  brands,
}: {
  brands: MarketingBrand[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<"png" | "pdf" | null>(null);

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

  async function createPngDataUrl() {
    if (!exportRef.current) {
      throw new Error("Certificate export node not available.");
    }

    const { toPng } = await import("html-to-image");

    return toPng(exportRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      canvasWidth: 3200,
      canvasHeight: 2200,
    });
  }

  async function handleDownloadPng() {
    try {
      setDownloading("png");
      const dataUrl = await createPngDataUrl();
      await downloadDataUrl(
        dataUrl,
        `${getFileBaseName(branding.brandShortName, data.certificateId, data.studentName)}.png`,
      );
    } finally {
      setDownloading(null);
    }
  }

  async function handleDownloadPdf() {
    try {
      setDownloading("pdf");
      const dataUrl = await createPngDataUrl();
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1600, 1100],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, 1600, 1100);
      pdf.save(
        `${getFileBaseName(branding.brandShortName, data.certificateId, data.studentName)}.pdf`,
      );
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 50,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          padding: 10,
          borderRadius: 14,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #d9e3f1",
          boxShadow: "0 14px 28px rgba(15, 23, 42, 0.12)",
          backdropFilter: "blur(10px)",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/certificate-generator")}
          style={{
            minHeight: 42,
            flex: "1 1 140px",
            padding: "0 16px",
            borderRadius: 10,
            border: "1px solid #c7d2e8",
            background: "#ffffff",
            color: "#17316f",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Back to Form
        </button>
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={downloading !== null}
          style={{
            minHeight: 42,
            flex: "1 1 140px",
            padding: "0 16px",
            borderRadius: 10,
            border: "1px solid #c7d2e8",
            background: "#ffffff",
            color: "#17316f",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            cursor: downloading ? "wait" : "pointer",
          }}
        >
          {downloading === "png" ? "Preparing PNG..." : "Download PNG"}
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading !== null}
          style={{
            minHeight: 42,
            flex: "1 1 140px",
            padding: "0 16px",
            borderRadius: 10,
            border: 0,
            background: branding.primaryColor,
            color: "#ffffff",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 14,
            fontWeight: 800,
            cursor: downloading ? "wait" : "pointer",
            boxShadow: `0 12px 24px ${branding.primaryColor}33`,
          }}
        >
          {downloading === "pdf" ? "Preparing PDF..." : "Download PDF"}
        </button>
      </div>

      <PremiumCertificate branding={branding} data={data} />

      <div
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <PremiumCertificate
          branding={branding}
          data={data}
          fitToViewport={false}
          certificateRef={exportRef}
        />
      </div>
    </>
  );
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
  return <PreviewShell brands={brands} />;
}
