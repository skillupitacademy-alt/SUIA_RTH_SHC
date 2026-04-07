"use client";

import { createContext, useContext, ReactNode } from 'react';
import { BrandConfig } from '../../../brandConfig';

const BrandContext = createContext<BrandConfig | null>(null);

export function BrandProvider({ brand, children }: { brand: BrandConfig; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const brand = useContext(BrandContext);
  if (!brand) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return brand;
}
