"use client";

import { createContext, useContext, ReactNode } from 'react';
import { BrandConfig, rthConfig } from '../../../brandConfig';

const BrandContext = createContext<BrandConfig | null>(null);

export function BrandProvider({ brand, children }: { brand: BrandConfig; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const brand = useContext(BrandContext);
  if (!brand) {
    // Graceful fallback to default RTH brand config if context is missing or duplicated by Next.js bundling
    return rthConfig;
  }
  return brand;
}
