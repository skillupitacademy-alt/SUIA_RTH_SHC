import { cache } from "react";

import type { MarketingBrand } from "../brand";
import {
  getFallbackMarketingBootstrapSnapshot,
  getFallbackMarketingContentSnapshot,
} from "./fallback";
import type {
  MarketingBootstrapSnapshot,
  MarketingBrandId,
  MarketingContentSnapshot,
} from "./contracts";

type NextFetchRequestInit = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

function resolveContentBaseUrl() {
  return (
    process.env.MARKETING_CONTENT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_SHC_CONTENT_BASE_URL ??
    process.env.SHARED_CONTENT_API_BASE_URL ??
    null
  );
}

async function fetchMarketingBootstrapSnapshot(
  brandId: MarketingBrandId,
): Promise<MarketingBootstrapSnapshot | null> {
  const baseUrl = resolveContentBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/public/marketing/bootstrap/${brandId}`, {
      headers: {
        accept: "application/json",
      },
      next: {
        revalidate: 900,
        tags: [`marketing-bootstrap:${brandId}`],
      },
    } as NextFetchRequestInit);

    if (!response.ok) {
      return null;
    }

    const parsed = (await response.json()) as MarketingBootstrapSnapshot;
    if (parsed?.content?.brandId !== brandId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export const loadMarketingBootstrapSnapshot = cache(
  async (
    brandId: MarketingBrandId,
    brandOverride?: MarketingBrand,
  ): Promise<MarketingBootstrapSnapshot> => {
    const remote = await fetchMarketingBootstrapSnapshot(brandId);
    return remote ?? getFallbackMarketingBootstrapSnapshot(brandId, brandOverride);
  },
);

export const loadMarketingContentSnapshot = cache(
  async (
    brandId: MarketingBrandId,
    brandOverride?: MarketingBrand,
  ): Promise<MarketingContentSnapshot> => {
    const snapshot = await loadMarketingBootstrapSnapshot(brandId, brandOverride);
    return snapshot.content ?? getFallbackMarketingContentSnapshot(brandId, brandOverride);
  },
);
