"use client";

import React, { createContext, useContext } from "react";

export interface MarketingBrand {
  id: "realtutorialhub" | "skillupitacademy";
  name: string;
  shortName: string;
  domain: string;
  logo: string;
  iconLogo: string;
  showNameInHeader?: boolean;
  colors: {
    primary: string;
    secondary: string;
  };
  metadata: {
    title: string;
    description: string;
  };
}

const defaultBrand: MarketingBrand = {
  id: "realtutorialhub",
  name: "Real Tutorial Hub",
  shortName: "RTH",
  domain: "https://www.realtutorialhub.com",
  logo: "/Logo.png",
  iconLogo: "/Logo.png",
  colors: {
    primary: "#d03f00",
    secondary: "#124fd6",
  },
  metadata: {
    title: "Real Tutorial Hub",
    description: "Learn real-world skills with Real Tutorial Hub",
  },
};

const BrandContext = createContext<MarketingBrand>(defaultBrand);

export function BrandProvider({
  brand,
  children,
}: {
  brand: MarketingBrand;
  children: React.ReactNode;
}) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}

export function getBrandCssVars(brand: MarketingBrand): React.CSSProperties {
  return {
    "--brand-primary": brand.colors.primary,
    "--brand-secondary": brand.colors.secondary,
  } as React.CSSProperties;
}
