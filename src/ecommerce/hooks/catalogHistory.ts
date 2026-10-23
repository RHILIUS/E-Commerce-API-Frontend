import { createContext } from "react";

import type { Product } from "@/ecommerce/types";

export type CatalogResult = {
  key: string;
  products: Product[];
  page: number;
  hasMore: boolean;
  error?: string;
  moreError?: string;
  isLoadingMore: boolean;
};

// Keep catalog snapshots in this mounted app only; never persist customer data to storage.
export const CatalogHistoryContext = createContext<Map<
  string,
  CatalogResult
> | null>(null);
