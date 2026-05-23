"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export function CertificateQr({
  value,
  color,
  size = 126,
}: {
  value: string;
  color: string;
  size?: number;
}) {
  const [svgMarkup, setSvgMarkup] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function generateQr() {
      const svg = await QRCode.toString(value, {
        type: "svg",
        margin: 1,
        width: size,
        color: {
          dark: color,
          light: "#ffffff",
        },
      });

      if (!cancelled) {
        setSvgMarkup(svg);
      }
    }

    generateQr().catch(() => {
      if (!cancelled) {
        setSvgMarkup("");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [color, size, value]);

  if (!svgMarkup) {
    return (
      <div
        aria-label="Certificate verification code"
        role="img"
        style={{
          width: size,
          height: size,
          background: "#ffffff",
        }}
      />
    );
  }

  return (
    <div
      aria-label="Certificate verification code"
      role="img"
      style={{ width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
