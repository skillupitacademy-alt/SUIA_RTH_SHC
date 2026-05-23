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
  const bgColor = `${color}10`;

  if (type === "calendar") {
    return (
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="24" fill={bgColor} stroke={color} strokeWidth="2.1" />
        <rect x="14.5" y="16.5" width="23" height="19" rx="2.6" fill="none" stroke={color} strokeWidth="2.1" />
        <path d="M14.5 21.5h23" stroke={color} strokeWidth="2.1" />
        <path d="M19.5 11.5v7M31.5 11.5v7" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
        <path d="M19.5 27.5h3M25.5 27.5h3M19.5 32.5h3M25.5 32.5h3" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r="24" fill={bgColor} stroke={color} strokeWidth="2.1" />
      <circle cx="26" cy="26" r="10.5" fill="none" stroke={color} strokeWidth="2.1" />
      <path d="M26 18.5v8.5l4.5 4" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Laurels({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  const leafColor = "#eedfd0";

  return (
    <svg
      width="250"
      height="650"
      viewBox="0 0 250 650"
      style={{
        position: "absolute",
        left: isLeft ? "60px" : "auto",
        right: !isLeft ? "60px" : "auto",
        top: "255px",
        opacity: 0.22,
        transform: isLeft ? "none" : "scaleX(-1)",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <g>
        <path
          d="M238 626 Q30 340 218 36"
          fill="none"
          stroke={leafColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {Array.from({ length: 24 }, (_, index) => {
          const t = index / 23;
          const u = 1 - t;
          const x = u * u * 238 + 2 * u * t * 30 + t * t * 218;
          const y = u * u * 626 + 2 * u * t * 340 + t * t * 36;
          const dx = 2 * u * (30 - 238) + 2 * t * (218 - 30);
          const dy = 2 * u * (340 - 626) + 2 * t * (36 - 340);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const scale = 1.08 - t * 0.46;
          const leafRotation = index % 2 === 0 ? -40 : 40;

          return (
            <g
              key={index}
              transform={`translate(${x}, ${y}) rotate(${angle + 90 + leafRotation}) scale(${scale})`}
            >
              <path d="M0,0 C-14,-18 -14,-46 0,-62 C14,-46 14,-18 0,0" fill={leafColor} />
            </g>
          );
        })}
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
        <path d={starburst} fill="none" stroke={primary} strokeWidth="18" strokeLinejoin="round" />
        <circle cx="110" cy="110" r="82" fill="#ffffff" stroke={primary} strokeWidth="12" />
        <circle cx="110" cy="110" r="67" fill="#ffffff" stroke={secondary} strokeWidth="8" />
        <path d="M80 180 L80 298 L110 274 L140 298 L140 180 Z" fill={secondary} />
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
            transform: branding.brandId === "skillupitacademy" ? "scale(1.5)" : "none",
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
  const previewPadding = 24;

  useEffect(() => {
    function updateScale() {
      const availableWidth = window.innerWidth - previewPadding * 2;
      const availableHeight = window.innerHeight - previewPadding * 2;
      const widthScale = availableWidth / 1600;
      const heightScale = availableHeight / 1100;
      setScale(Math.min(widthScale, heightScale, 1));
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
        height: "100vh",
        padding: `${previewPadding}px`,
        background: "#e9eef6",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
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
            fontFamily: "'Cormorant Garamond', Georgia, serif",
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
                  strokeOpacity="0.017"
                  strokeWidth="0.9"
                />
                <path
                  d="M0 0C14 -16 28 -16 42 0C56 16 70 16 84 0"
                  fill="none"
                  stroke={branding.secondaryColor}
                  strokeOpacity="0.012"
                  strokeWidth="0.9"
                />
              </pattern>
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
                display: "grid",
                gridTemplateColumns: "minmax(120px, 170px) auto",
                alignItems: "center",
                columnGap: branding.brandId === "skillupitacademy" ? 8 : 12,
                marginTop: 10,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: branding.brandId === "skillupitacademy" ? 182 : 148,
                  height: branding.brandId === "skillupitacademy" ? 182 : 148,
                  marginTop: branding.brandId === "skillupitacademy" ? -2 : 0,
                }}
              >
                <Image
                  src={branding.sealLogoSrc}
                  alt={`${branding.brandName} logo`}
                  fill
                  sizes={branding.brandId === "skillupitacademy" ? "182px" : "148px"}
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: branding.brandId === "skillupitacademy" ? 66 : 72,
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
                    width: branding.brandId === "skillupitacademy" ? "76%" : "74%",
                    height: 3,
                    margin: branding.brandId === "skillupitacademy"
                      ? "11px auto 13px"
                      : "10px auto 13px",
                    background: branding.primaryColor,
                  }}
                />
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: branding.brandId === "skillupitacademy" ? 18 : 19,
                    fontWeight: 700,
                    letterSpacing: branding.brandId === "skillupitacademy" ? 4.4 : 4.8,
                    color: branding.secondaryColor,
                  }}
                >
                  {branding.tagline.split(" • ").map((word, index, words) => (
                    <React.Fragment key={word + index}>
                      {word}
                      {index < words.length - 1 ? (
                        <span style={{ color: branding.primaryColor }}> • </span>
                      ) : null}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 22,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 126,
                fontWeight: 600,
                lineHeight: 0.92,
                letterSpacing: 3.2,
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
                marginTop: 2,
              }}
            >
              <div style={{ width: 148, height: 2.5, background: branding.primaryColor }} />
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  color: branding.primaryColor,
                  fontSize: 43,
                  lineHeight: 0.95,
                  letterSpacing: 3.8,
                }}
              >
                OF COMPLETION
              </div>
              <div style={{ width: 148, height: 2.5, background: branding.primaryColor }} />
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
                fontSize: 96,
                lineHeight: 1.04,
                textAlign: "center",
                fontFamily: "'Alex Brush', cursive",
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
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
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

            <Laurels side="left" />
            <Laurels side="right" />

            <div
              style={{
                position: "absolute",
                top: 44,
                right: 55,
              }}
            >
              <Seal branding={branding} />
            </div>

            <div
              style={{
                position: "absolute",
                bottom: 48,
                left: 0,
                right: 0,
                height: 104,
              }}
            >
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

              <div
                style={{
                  position: "absolute",
                  left: 350,
                  bottom: 98,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <CertificateIcon color={branding.primaryColor} type="calendar" />
                <div style={{ fontFamily: "'Inter', sans-serif" }}>
                  <div
                    style={{
                      color: branding.secondaryColor,
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: 0.45,
                    }}
                  >
                    COMPLETED ON
                  </div>
                  <div style={{ color: branding.secondaryColor, fontSize: 15, marginTop: 5 }}>
                    {data.completedOn}
                  </div>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: 24,
                  textAlign: "center",
                  width: 340,
                }}
              >
                <div
                  style={{
                    fontSize: 54,
                    fontFamily: "'Alex Brush', cursive",
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
                    fontWeight: 400,
                    color: branding.secondaryColor,
                    fontSize: 16,
                    letterSpacing: 2.5,
                  }}
                >
                  {data.instructorTitle}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    color: branding.secondaryColor,
                    fontSize: 16,
                    letterSpacing: 2.5,
                  }}
                >
                  {data.organizationLine}
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  right: 350,
                  bottom: 98,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <CertificateIcon color={branding.primaryColor} type="clock" />
                <div style={{ fontFamily: "'Inter', sans-serif", textAlign: "left" }}>
                  <div
                    style={{
                      color: branding.secondaryColor,
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: 0.45,
                    }}
                  >
                    DURATION
                  </div>
                  <div style={{ color: branding.secondaryColor, fontSize: 15, marginTop: 5 }}>
                    {data.duration}
                  </div>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  right: 320,
                  bottom: 0,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                }}
              >
                <span style={{ color: branding.secondaryColor }}>CERTIFICATE ID:</span>
                <span style={{ color: branding.primaryColor }}>{data.certificateId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
