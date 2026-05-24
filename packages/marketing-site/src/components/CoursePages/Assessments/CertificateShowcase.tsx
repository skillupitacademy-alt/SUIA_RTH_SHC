"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useBrand } from "@quiz/marketing-site/brand";
import { PremiumCertificate } from "../../../certificates/PremiumCertificate";
import {
  getCertificateBranding,
  buildPreviewCertificateData,
} from "../../../certificates/branding";

interface CertificateShowcaseProps {
  title: string;
  description: string;
  benefits: string[];
  certificateDetails: {
    title: string;
    subtitle: string;
    subSubtitle: string;
    rating: number;
  };
}

function ScaledCertificate({ branding, data }: { branding: any; data: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setScale(width / 1600);
      }
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        position: "relative",
        paddingBottom: "68.75%", // 1100 / 1600
        overflow: "hidden",
        borderRadius: "16px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <PremiumCertificate
          branding={branding}
          data={data}
          fitToViewport={false}
        />
      </div>
    </div>
  );
}

export const CertificateShowcase: React.FC<CertificateShowcaseProps> = ({
  title,
  description,
  benefits,
  certificateDetails,
}) => {
  const brand = useBrand();
  const branding = getCertificateBranding(brand);
  const data = buildPreviewCertificateData(branding, {
    courseName: certificateDetails.subtitle || "DATA ANALYST",
    description: certificateDetails.subSubtitle || undefined,
  });

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 md:p-16 text-white mb-12">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1">
          <h2 className="text-center text-xl md:text-left md:text-4xl font-bold mb-6">
            {title}
          </h2>
          <p className="text-gray-300 mb-8 text-sm md:text-lg leading-relaxed">
            {description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center md:justify-start gap-4">
            <button className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition transform hover:-translate-y-1 hover:shadow-2xl">
              View Sample Certificate
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition transform hover:-translate-y-1 hover:shadow-2xl">
              Enroll Now
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-center w-full">
          <div className="relative group w-full max-w-3xl">
            <div
              className="absolute -inset-6 rounded-3xl blur-[100px] opacity-30 mix-blend-screen transition-all duration-700 group-hover:opacity-50"
              style={{ backgroundColor: "var(--brand-secondary)" }}
            ></div>
            <div className="relative bg-white/5 p-4 rounded-3xl border border-white/10 shadow-2xl transform transition-all duration-700">
              <ScaledCertificate branding={branding} data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
