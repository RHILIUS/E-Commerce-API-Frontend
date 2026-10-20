import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { productCatalogApi } from "@/ecommerce/api";
import type { Product } from "@/ecommerce/types";
import { catalogProduct } from "@/ecommerce/utils/catalogProduct";

export const CATALOG_PAGE_SIZE = 12;

type CatalogResult = {
  key: string;
  products: Product[];
  page: number;
  hasMore: boolean;
  error?: string;
  moreError?: string;
  isLoadingMore: boolean;
};

/** Accumulate catalog pages and cancel obsolete search or viewer requests. */
export const useProductCatalog = (query: string) => {
  const { accessToken, user, isLoading: authLoading } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([
    query,
    accessToken,
    user?.address_country_code,
    attempt,
  ]);
  const [result, setResult] = useState<CatalogResult | null>(null);
  const moreRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    productCatalogApi(1, query, controller.signal, accessToken).then(
      (data) => {
        if (!controller.signal.aborted) {
          setResult({
            key,
            products: data.results.map(catalogProduct),
            page: 1,
            hasMore: data.next !== null,
            isLoadingMore: false,
          });
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setResult({
            key,
            products: [],
            page: 1,
            hasMore: false,
            isLoadingMore: false,
            error: "Unable to load products. Please try again.",
          });
        }
      },
    );
    return () => {
      controller.abort();
      moreRequest.current?.abort();
      moreRequest.current = null;
    };
  }, [query, accessToken, authLoading, key]);

  const current = !authLoading && result?.key === key ? result : null;

  // Lock immediately, before React renders, so repeated clicks cannot skip pages.
  const loadMore = async () => {
    if (!current?.hasMore || moreRequest.current) return false;
    const controller = new AbortController();
    moreRequest.current = controller;
    setResult({ ...current, isLoadingMore: true, moreError: undefined });
    try {
      const data = await productCatalogApi(
        current.page + 1,
        query,
        controller.signal,
        accessToken,
      );
      if (controller.signal.aborted) return false;
      // Rankings can shift between requests; keep already displayed cards unique.
      const seen = new Set(current.products.map((product) => product.id));
      const added = data.results
        .map(catalogProduct)
        .filter((product) => !seen.has(product.id));
      setResult({
        key,
        products: [...current.products, ...added],
        page: current.page + 1,
        hasMore: data.next !== null,
        isLoadingMore: false,
      });
      return added.length > 0;
    } catch {
      if (!controller.signal.aborted) {
        setResult({
          ...current,
          isLoadingMore: false,
          moreError: "Unable to load more products. Please try again.",
        });
      }
      return false;
    } finally {
      if (moreRequest.current === controller) moreRequest.current = null;
    }
  };

  return {
    products: current?.products ?? [],
    isLoading: current === null,
    error: current?.error,
    moreError: current?.moreError,
    isLoadingMore: current?.isLoadingMore ?? false,
    hasMore: current?.hasMore ?? false,
    loadMore,
    retry: () => setAttempt((value) => value + 1),
  };
};
