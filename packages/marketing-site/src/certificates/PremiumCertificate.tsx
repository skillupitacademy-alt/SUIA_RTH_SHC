"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";

import { CertificateQr } from "./CertificateQr";
import type { PremiumCertificateProps } from "./types";

function CertificateIcon({
  color,
  type,
}: {
  color: string;
  type: "calendar" | "clock";
}) {
  if (type === "calendar") {
    return (
      <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r="20" fill="none" stroke={color} strokeWidth="2.5" />
        <rect x="11" y="13" width="20" height="17" rx="3" fill="none" stroke={color} strokeWidth="2.5" />
        <path d="M11 18h20" stroke={color} strokeWidth="2.5" />
        <path d="M16 9v7M26 9v7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 23h3M22 23h3M16 27h3M22 27h3" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
      <circle cx="21" cy="21" r="20" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="21" cy="21" r="9" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M21 15v7l4 3" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Laurels({
  side,
}: {
  side: "left" | "right";
  color?: string; // Kept for backwards compatibility
}) {
  const isLeft = side === "left";
  const leafColor = "#e5d1b8"; // Elegant beige watermark color

  return (
    <svg 
      width="240" 
      height="600" 
      viewBox="0 0 240 600" 
      style={{
        position: "absolute",
        left: isLeft ? "90px" : "auto",
        right: !isLeft ? "90px" : "auto",
        top: "280px",
        opacity: 0.35,
        transform: isLeft ? "none" : "scaleX(-1)",
        pointerEvents: "none",
        userSelect: "none"
      }}
    >
      <g>
        {/* Main Stem - Deep C-Shape Curve */}
        <path
          d="M230 580 Q40 320 210 40"
          fill="none"
          stroke={leafColor}
          strokeWidth="5"
          strokeLinecap="round"
        />
        
        {/* Alternating Pointed-Ellipse Leaves */}
        {Array.from({ length: 22 }, (_, index) => {
          const t = index / 21; // 0 to 1
          const u = 1 - t;
          
          // Position along quadratic bezier curve (C-shape stem)
          const x = u * u * 230 + 2 * u * t * 40 + t * t * 210;
          const y = u * u * 580 + 2 * u * t * 320 + t * t * 40;
          
          // Tangent angle calculation
          const dx = 2 * u * (40 - 230) + 2 * t * (210 - 40);
          const dy = 2 * u * (320 - 580) + 2 * t * (40 - 320);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI); 
          
          const scale = 1.05 - (t * 0.5); 
          const isOuterLeaf = index % 2 === 0;
          const leafRotation = isOuterLeaf ? -42 : 42;
          
          return (
            <g 
              key={index} 
              transform={`translate(${x}, ${y}) rotate(${angle + 90 + leafRotation}) scale(${scale})`}
            >
              {/* Pointed ellipse (almond shape) geometrically bending left/right */}
              <path 
                d="M0,0 C-16,-20 -16,-50 0,-65 C16,-50 16,-20 0,0" 
                fill={leafColor} 
              />
            </g>
          );
        })}
        
        {/* Terminal top leaf */}
        <g 
          transform={`translate(210, 40) rotate(${Math.atan2(2 * 0 * (40 - 230) + 2 * 1 * (210 - 40), 2 * 0 * (320 - 580) + 2 * 1 * (40 - 320)) * (180 / Math.PI) + 90}) scale(0.55)`}
        >
          <path d="M0,0 C-16,-20 -16,-50 0,-65 C16,-50 16,-20 0,0" fill={leafColor} />
        </g>
      </g>
    </svg>
  );
}

function Seal({
  branding,
}: Pick<PremiumCertificateProps, "branding">) {
  const primary = branding.primaryColor;
  const secondary = branding.secondaryColor;

  const starburst = Array.from({ length: 18 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 18;
    const angleOffset = Math.PI / 18;
    const x1 = 110 + Math.cos(angle) * 88;
    const y1 = 110 + Math.sin(angle) * 88;
    const x2 = 110 + Math.cos(angle + angleOffset) * 78;
    const y2 = 110 + Math.sin(angle + angleOffset) * 78;
    return `${index === 0 ? "M" : "L"} ${x1} ${y1} L ${x2} ${y2}`;
  }).join(" ");

  return (
    <div style={{ position: "relative", width: 220, height: 330 }}>
      <svg width="220" height="330" viewBox="0 0 220 330" aria-hidden="true">
        <path
          d={starburst}
          fill="none"
          stroke={primary}
          strokeWidth="18"
          strokeLinejoin="round"
        />
        <circle cx="110" cy="110" r="82" fill="#ffffff" stroke={primary} strokeWidth="12" />
        <circle cx="110" cy="110" r="67" fill="#ffffff" stroke={secondary} strokeWidth="8" />
        <path
          d={`M80 180 L80 298 L110 ${274} L140 298 L140 180 Z`}
          fill={secondary}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 42,
          left: 42,
          width: 136,
          height: 136,
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Image
          src={branding.sealLogoSrc}
          alt={`${branding.brandName} seal`}
          width={96}
          height={96}
          style={{
            objectFit: "contain",
            transform: branding.brandId === "skillupitacademy" ? "scale(1.5)" : "none"
          }}
        />
      </div>
    </div>
  );
}

export function PremiumCertificate({
  branding,
  data,
}: PremiumCertificateProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const availableWidth = window.innerWidth;
      // 1600px cert width + 64px total horizontal padding
      if (availableWidth < 1664) {
        setScale((availableWidth - 64) / 1600);
      } else {
        setScale(1);
      }
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const patternId = `${branding.brandShortName}-waves`;
  const topArcStart = branding.brandId === "skillupitacademy" ? 286 : 240;
  const bottomArcStart = branding.brandId === "skillupitacademy" ? 1338 : 1360;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "32px",
        background: "#e9eef6",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;600;700;800&display=swap');
      `}</style>
      <div
        style={{
          width: 1600 * scale,
          height: 1100 * scale,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1600,
            height: 1100,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            background: "#ffffff",
            borderRadius: 10,
            boxShadow: "0 32px 70px rgba(15, 23, 42, 0.18)",
            overflow: "hidden",
            fontFamily: "\"Times New Roman\", Georgia, serif",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1600 1100"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: "absolute", inset: 0 }}
            aria-hidden="true"
          >
            <defs>
              <pattern id={patternId} width="84" height="84" patternUnits="userSpaceOnUse">
                <path
                  d="M0 42C14 26 28 26 42 42C56 58 70 58 84 42"
                  fill="none"
                  stroke={branding.secondaryColor}
                  strokeOpacity="0.03"
                  strokeWidth="1.0"
                />
                <path
                  d="M0 0C14 -16 28 -16 42 0C56 16 70 16 84 0"
                  fill="none"
                  stroke={branding.secondaryColor}
                  strokeOpacity="0.02"
                  strokeWidth="1.0"
                />
              </pattern>
              <linearGradient id="topArcPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={branding.primaryColor} />
                <stop offset="100%" stopColor={branding.primaryColor} />
              </linearGradient>
              <linearGradient id="topArcSecondary" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={branding.secondaryColor} />
                <stop offset="100%" stopColor={branding.secondaryColor} />
              </linearGradient>
            </defs>

            <rect width="1600" height="1100" fill={`url(#${patternId})`} />

            <rect x="22" y="22" width="1556" height="1056" rx="10" fill="none" stroke={branding.primaryColor} strokeWidth="3.5" />
            <rect x="31" y="31" width="1538" height="1038" rx="8" fill="none" stroke={branding.secondaryColor} strokeWidth="1.8" />

            <path d="M22 58 C22 34 34 22 58 22" fill="none" stroke={branding.primaryColor} strokeWidth="3.5" />
            <path d="M31 58 C31 38 40 31 58 31" fill="none" stroke={branding.secondaryColor} strokeWidth="1.8" />
            <path d="M1578 58 C1578 34 1566 22 1542 22" fill="none" stroke={branding.primaryColor} strokeWidth="3.5" />
            <path d="M1569 58 C1569 38 1560 31 1542 31" fill="none" stroke={branding.secondaryColor} strokeWidth="1.8" />
            <path d="M22 1042 C22 1066 34 1078 58 1078" fill="none" stroke={branding.primaryColor} strokeWidth="3.5" />
            <path d="M31 1042 C31 1062 40 1069 58 1069" fill="none" stroke={branding.secondaryColor} strokeWidth="1.8" />
            <path d="M1578 1042 C1578 1066 1566 1078 1542 1078" fill="none" stroke={branding.primaryColor} strokeWidth="3.5" />
            <path d="M1569 1042 C1569 1062 1560 1069 1542 1069" fill="none" stroke={branding.secondaryColor} strokeWidth="1.8" />

            <path
              d={`M0 0 L${topArcStart} 0 C150 38 72 158 0 320 Z`}
              fill={branding.secondaryColor}
            />
            <path
              d={`M0 0 L${topArcStart - 70} 0 C126 34 54 146 0 290 Z`}
              fill={branding.primaryColor}
            />
            <path
              d={`M1600 1100 L${bottomArcStart} 1100 C1460 1058 1518 938 1600 742 Z`}
              fill={branding.brandId === "skillupitacademy" ? branding.secondaryColor : branding.primaryColor}
            />
            <path
              d={`M1600 1100 L${bottomArcStart + 68} 1100 C1484 1046 1542 930 1600 772 Z`}
              fill={branding.brandId === "skillupitacademy" ? branding.primaryColor : branding.secondaryColor}
            />
          </svg>

          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "44px 62px 38px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: branding.secondaryColor,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              <span style={{ color: branding.secondaryColor }}>CERTIFICATE ID:</span>
              <span style={{ color: branding.primaryColor, marginLeft: 6 }}>{data.certificateId}</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(120px, 170px) auto",
                alignItems: "center",
                columnGap: 20,
                marginTop: 6,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: branding.brandId === "skillupitacademy" ? 230 : 155,
                  height: branding.brandId === "skillupitacademy" ? 230 : 155,
                  margin: branding.brandId === "skillupitacademy" ? "-36px -36px" : 0,
                }}
              >
                <Image
                  src={branding.sealLogoSrc}
                  alt={`${branding.brandName} logo`}
                  fill
                  sizes={branding.brandId === "skillupitacademy" ? "230px" : "155px"}
                  style={{
                    objectFit: "contain"
                  }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: branding.brandId === "skillupitacademy" ? 70 : 74,
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: 0,
                    color: branding.secondaryColor,
                  }}
                >
                  {branding.brandId === "skillupitacademy" ? (
                    <>
                      <span style={{ color: branding.primaryColor }}>Skill</span>
                      Up{" "}
                      <span style={{ color: branding.primaryColor }}>IT</span>{" "}
                      Academy
                    </>
                  ) : (
                    <>
                      <span style={{ color: branding.primaryColor }}>Real</span>
                      Tutorial
                      <span style={{ color: branding.primaryColor }}>Hub</span>
                    </>
                  )}
                </div>
                <div
                  style={{
                    width: "78%",
                    height: 3,
                    margin: "12px auto 14px",
                    background: branding.primaryColor,
                  }}
                />
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: 5.2,
                    color: branding.secondaryColor,
                  }}
                >
                  {branding.tagline.split(" • ").map((word, i, arr) => (
                    <React.Fragment key={i}>
                      {word}
                      {i < arr.length - 1 && (
                        <span style={{ color: branding.primaryColor }}> • </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 26,
                fontSize: 112,
                lineHeight: 0.95,
                letterSpacing: 4,
                color: branding.secondaryColor,
              }}
            >
              CERTIFICATE
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                marginTop: 8,
              }}
            >
              <div style={{ width: 150, height: 3, background: branding.primaryColor }} />
              <div
                style={{
                  color: branding.primaryColor,
                  fontSize: 48,
                  lineHeight: 1,
                  letterSpacing: 4.8,
                }}
              >
                OF COMPLETION
              </div>
              <div style={{ width: 150, height: 3, background: branding.primaryColor }} />
            </div>

            <div
              style={{
                marginTop: 26,
                fontFamily: "'Inter', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 1.8,
              }}
            >
              THIS IS TO CERTIFY THAT
            </div>

              <div
              style={{
                marginTop: 16,
                minWidth: 740,
                paddingBottom: 14,
                borderBottom: `3px solid ${branding.primaryColor}`,
                fontSize: 90,
                lineHeight: 1.04,
                textAlign: "center",
                fontFamily: "'Great Vibes', cursive",
                color: branding.secondaryColor,
              }}
            >
              {data.studentName}
            </div>

            <div
              style={{
                marginTop: 18,
                fontFamily: "'Inter', sans-serif",
                fontSize: 23,
                fontWeight: 700,
                letterSpacing: 1.6,
              }}
            >
              HAS SUCCESSFULLY COMPLETED THE COURSE
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 22,
                color: branding.primaryColor,
                fontSize: 34,
                lineHeight: 1,
              }}
            >
              <span>★</span>
              <div
                style={{
                  fontSize: 60,
                  letterSpacing: 2.4,
                  color: branding.secondaryColor,
                }}
              >
                {data.courseName}
              </div>
              <span>★</span>
            </div>

            <div
              style={{
                marginTop: 10,
                maxWidth: 860,
                textAlign: "center",
                fontFamily: "'Inter', sans-serif",
                color: "#233a68",
                fontSize: 19,
                lineHeight: 1.55,
              }}
            >
              {data.description}
            </div>

            {/* WATERMARKS */}
            <Laurels side="left" />
            <Laurels side="right" />

            <div
              style={{
                position: "absolute",
                top: 116,
                right: 120,
              }}
            >
              <Seal branding={branding} />
            </div>

              {/* Absolute Footer Container */}
            <div
              style={{
                position: "absolute",
                bottom: 48,
                left: 0,
                right: 0,
                height: 104, // Height of the QR code block
              }}
            >
              {/* QR Code and Verify Text */}
              <div
                style={{
                  position: "absolute",
                  left: 60,
                  bottom: 0,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    border: `2px solid ${branding.secondaryColor}`,
                    padding: 6,
                    background: "#ffffff",
                  }}
                >
                  <CertificateQr value={data.verificationUrl} color="#111111" size={104} />
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: branding.secondaryColor,
                    fontSize: 14,
                    lineHeight: 1.45,
                    maxWidth: 240,
                    wordBreak: "break-all",
                  }}
                >
                  <div>Verify this certificate at</div>
                  <div>{data.verificationUrl}</div>
                </div>
              </div>

              {/* COMPLETED ON */}
              <div style={{ position: "absolute", left: 340, bottom: 60, display: "flex", gap: 18, alignItems: "center" }}>
                <CertificateIcon color={branding.primaryColor} type="calendar" />
                <div style={{ fontFamily: "'Inter', sans-serif" }}>
                  <div style={{ color: branding.secondaryColor, fontSize: 22, fontWeight: 700 }}>
                    COMPLETED ON
                  </div>
                  <div style={{ color: branding.secondaryColor, fontSize: 22, marginTop: 8 }}>
                    {data.completedOn}
                  </div>
                </div>
              </div>

              {/* SIGNATURE */}
              <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 24, textAlign: "center", width: 340 }}>
                <div
                  style={{
                    fontSize: 54,
                    fontFamily: "'Great Vibes', cursive",
                    color: "#111827",
                    marginBottom: 8,
                  }}
                >
                  {data.instructorName}
                </div>
                <div
                  style={{
                    width: 280,
                    height: 3,
                    margin: "0 auto 10px",
                    background: branding.primaryColor,
                  }}
                />
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: branding.secondaryColor,
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: 2,
                  }}
                >
                  {data.instructorName.toUpperCase()}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: "'Inter', sans-serif",
                    color: branding.secondaryColor,
                    fontSize: 16,
                    letterSpacing: 3,
                  }}
                >
                  {data.instructorTitle}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: "'Inter', sans-serif",
                    color: branding.secondaryColor,
                    fontSize: 16,
                    letterSpacing: 2.6,
                  }}
                >
                  {data.organizationLine}
                </div>
              </div>

              {/* DURATION */}
              <div style={{ position: "absolute", right: 340, bottom: 60, display: "flex", gap: 18, alignItems: "center" }}>
                <CertificateIcon color={branding.primaryColor} type="clock" />
                <div style={{ fontFamily: "'Inter', sans-serif", textAlign: "left" }}>
                  <div style={{ color: branding.secondaryColor, fontSize: 22, fontWeight: 700 }}>
                    DURATION
                  </div>
                  <div style={{ color: branding.secondaryColor, fontSize: 22, marginTop: 8 }}>
                    {data.duration}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
