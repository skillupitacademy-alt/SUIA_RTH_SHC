"use client";

import { createContext, useContext } from "react";

import type { MarketingContentSnapshot } from "./contracts";

const MarketingContentContext = createContext<MarketingContentSnapshot | null>(null);

export function MarketingContentProvider({
  snapshot,
  children,
}: {
  snapshot: MarketingContentSnapshot;
  children: React.ReactNode;
}) {
  return (
    <MarketingContentContext.Provider value={snapshot}>
      {children}
    </MarketingContentContext.Provider>
  );
}

export function useMarketingContent() {
  const content = useContext(MarketingContentContext);
  if (content === null) {
    throw new Error("useMarketingContent must be used within MarketingContentProvider");
  }

  return content;
}
