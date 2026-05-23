"use client";

import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

import type { MarketingBrand } from "../brand";
import {
  buildCertificateGeneratorDefaults,
  getCertificateBranding,
} from "./branding";
import type { CertificateGeneratorFormValues } from "./types";

function buildPreviewUrl(values: CertificateGeneratorFormValues): string {
  const params = new URLSearchParams();
  const certificateId = values.certificateId.trim();
  const verificationUrl = values.autoGenerateVerificationUrl
    ? values.verificationUrl.trim()
    : values.verificationUrl.trim();

  params.set("brand", values.brandId);
  params.set("studentName", values.studentName.trim());
  params.set("courseName", values.courseName.trim());
  params.set("certificateId", certificateId);
  params.set("completedOn", values.completedOn.trim());
  params.set("duration", values.duration.trim());
  params.set("instructorName", values.instructorName.trim());
  params.set("instructorTitle", values.instructorTitle.trim());
  params.set("organizationLine", values.organizationLine.trim());
  params.set("verificationUrl", verificationUrl);
  params.set("description", values.description.trim());

  return `/certificate-preview?${params.toString()}`;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#17316f",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        {label}
      </span>
      {children}
      {hint ? (
        <span
          style={{
            fontSize: 12,
            color: "#52638f",
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid #c7d2e8",
  background: "#ffffff",
  color: "#14213d",
  fontSize: 15,
  lineHeight: 1.4,
  fontFamily: "Inter, Arial, sans-serif",
  boxSizing: "border-box",
};

export function CertificateGeneratorPage({
  brands,
  initialBrandId,
}: {
  brands: MarketingBrand[];
  initialBrandId?: MarketingBrand["id"];
}) {
  const router = useRouter();
  const fallbackBrand = brands[0];
  const [selectedBrandId, setSelectedBrandId] = useState<MarketingBrand["id"]>(
    initialBrandId ?? fallbackBrand.id,
  );

  const selectedBrand =
    brands.find((item) => item.id === selectedBrandId) ?? fallbackBrand;
  const branding = useMemo(
    () => getCertificateBranding(selectedBrand),
    [selectedBrand],
  );
  const [values, setValues] = useState<CertificateGeneratorFormValues>(() =>
    buildCertificateGeneratorDefaults(branding),
  );

  function updateField<Key extends keyof CertificateGeneratorFormValues>(
    key: Key,
    value: CertificateGeneratorFormValues[Key],
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value };

      if (key === "certificateId" && next.autoGenerateVerificationUrl) {
        next.verificationUrl = `${branding.verificationBaseUrl}/${String(value).trim()}`;
      }

      return next;
    });
  }

  function handleBrandChange(nextBrandId: MarketingBrand["id"]) {
    const nextBrand = brands.find((item) => item.id === nextBrandId) ?? fallbackBrand;
    const nextBranding = getCertificateBranding(nextBrand);
    setSelectedBrandId(nextBrandId);
    setValues(buildCertificateGeneratorDefaults(nextBranding));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildPreviewUrl(values));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef3fb",
        padding: "32px 20px 48px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 18,
          boxShadow: "0 18px 48px rgba(15, 23, 42, 0.09)",
          border: "1px solid #dde4f1",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "28px 28px 20px",
            borderBottom: "1px solid #e7edf6",
            background:
              selectedBrand.id === "skillupitacademy"
                ? "linear-gradient(135deg, rgba(245,74,141,0.08), rgba(19,50,130,0.05))"
                : "linear-gradient(135deg, rgba(208,63,0,0.08), rgba(18,79,214,0.05))",
          }}
        >
          <div
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "#17316f",
            }}
          >
            Certificate Generator
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: 15,
              lineHeight: 1.5,
              color: "#52638f",
            }}
          >
            Fill the certificate data and open the shared certificate preview on the next page. The preview branding changes from the selected brand.
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: 28,
            display: "grid",
            gap: 28,
          }}
        >
          <section style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: 18,
                fontWeight: 800,
                color: "#17316f",
              }}
            >
              Brand
            </div>
            <Field label="Certificate Brand">
              <select
                style={{
                  ...inputStyle,
                  borderColor: branding.primaryColor,
                  color: branding.secondaryColor,
                  fontWeight: 700,
                }}
                value={values.brandId}
                onChange={(event) =>
                  handleBrandChange(event.target.value as MarketingBrand["id"])
                }
              >
                {brands.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
          </section>

          <section style={{ display: "grid", gap: 18 }}>
            <div style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: 18, fontWeight: 800, color: "#17316f" }}>
              Student Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
              <Field label="Student Name">
                <input style={inputStyle} value={values.studentName} onChange={(event) => updateField("studentName", event.target.value)} required />
              </Field>
              <Field label="Student ID">
                <input style={inputStyle} value={values.studentId} onChange={(event) => updateField("studentId", event.target.value)} required />
              </Field>
              <Field label="Email">
                <input style={inputStyle} type="email" value={values.email} onChange={(event) => updateField("email", event.target.value)} required />
              </Field>
            </div>
          </section>

          <section style={{ display: "grid", gap: 18 }}>
            <div style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: 18, fontWeight: 800, color: "#17316f" }}>
              Course Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
              <Field label="Course Name">
                <input style={inputStyle} value={values.courseName} onChange={(event) => updateField("courseName", event.target.value)} required />
              </Field>
              <Field label="Course Slug" hint="For future admin and verification use.">
                <input style={inputStyle} value={values.courseSlug} onChange={(event) => updateField("courseSlug", event.target.value)} />
              </Field>
              <Field label="Duration">
                <input style={inputStyle} value={values.duration} onChange={(event) => updateField("duration", event.target.value)} required />
              </Field>
            </div>
            <Field label="Certificate Description">
              <textarea
                style={{ ...inputStyle, minHeight: 108, resize: "vertical" }}
                value={values.description}
                onChange={(event) => updateField("description", event.target.value)}
                required
              />
            </Field>
          </section>

          <section style={{ display: "grid", gap: 18 }}>
            <div style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: 18, fontWeight: 800, color: "#17316f" }}>
              Completion Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
              <Field label="Certificate ID">
                <input style={inputStyle} value={values.certificateId} onChange={(event) => updateField("certificateId", event.target.value)} required />
              </Field>
              <Field label="Completed On">
                <input style={inputStyle} type="date" value={values.completedOn} onChange={(event) => updateField("completedOn", event.target.value)} required />
              </Field>
              <Field label="Issue Date">
                <input style={inputStyle} type="date" value={values.issueDate} onChange={(event) => updateField("issueDate", event.target.value)} />
              </Field>
            </div>
          </section>

          <section style={{ display: "grid", gap: 18 }}>
            <div style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: 18, fontWeight: 800, color: "#17316f" }}>
              Instructor Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
              <Field label="Instructor Name">
                <input style={inputStyle} value={values.instructorName} onChange={(event) => updateField("instructorName", event.target.value)} required />
              </Field>
              <Field label="Instructor Title">
                <input style={inputStyle} value={values.instructorTitle} onChange={(event) => updateField("instructorTitle", event.target.value)} required />
              </Field>
              <Field label="Organization Line">
                <input style={inputStyle} value={values.organizationLine} onChange={(event) => updateField("organizationLine", event.target.value)} required />
              </Field>
            </div>
          </section>

          <section style={{ display: "grid", gap: 18 }}>
            <div style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: 18, fontWeight: 800, color: "#17316f" }}>
              Verification
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: 14,
                color: "#17316f",
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={values.autoGenerateVerificationUrl}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setValues((current) => ({
                    ...current,
                    autoGenerateVerificationUrl: checked,
                    verificationUrl: checked
                      ? `${branding.verificationBaseUrl}/${current.certificateId.trim()}`
                      : current.verificationUrl,
                  }));
                }}
              />
              Auto-generate verification URL from certificate ID
            </label>
            <Field label="Verification URL">
              <input
                style={{
                  ...inputStyle,
                  background: values.autoGenerateVerificationUrl ? "#f5f8fd" : "#ffffff",
                }}
                value={
                  values.autoGenerateVerificationUrl
                    ? `${branding.verificationBaseUrl}/${values.certificateId.trim()}`
                    : values.verificationUrl
                }
                onChange={(event) => updateField("verificationUrl", event.target.value)}
                disabled={values.autoGenerateVerificationUrl}
                required
              />
            </Field>
          </section>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              paddingTop: 8,
            }}
          >
            <button
              type="submit"
              style={{
                minWidth: 220,
                minHeight: 52,
                padding: "0 22px",
                border: 0,
                borderRadius: 12,
                background: branding.primaryColor,
                color: "#ffffff",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: 15,
                lineHeight: 1.2,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                boxShadow: `0 14px 28px ${branding.primaryColor}33`,
              }}
            >
              Open Certificate Preview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
