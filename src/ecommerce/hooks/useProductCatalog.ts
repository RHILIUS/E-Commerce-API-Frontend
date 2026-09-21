import axios from "axios";
import { useEffect, useState } from "react";

import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { productCatalogApi } from "@/ecommerce/api";
import type { Product, ProductCatalogResponse } from "@/ecommerce/types";

export const CATALOG_PAGE_SIZE = 8;

/** Fetch catalog pages after auth restoration and discard obsolete requests. */
export const useProductCatalog = (page: number, query: string) => {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([page, query, accessToken, attempt]);
  const [result, setResult] = useState<{
    key: string;
    data?: ProductCatalogResponse;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    productCatalogApi(page, query, controller.signal, accessToken).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key,
          error:
            axios.isAxiosError(error) && error.response?.status === 404
              ? "This product page is unavailable. Try the first page."
              : "Unable to load products. Please try again.",
        });
      },
    );
    return () => controller.abort();
  }, [page, query, accessToken, authLoading, key]);

  const current = !authLoading && result?.key === key ? result : null;
  const products: Product[] = (current?.data?.results ?? []).map((product) => ({
    id: String(product.id),
    name: product.name,
    description: product.short_description,
    price: Number(product.price),
    soldCount: product.sold_count,
    imageUrl: product.default_image?.image ?? null,
    imageAlt: product.default_image?.alt_text || product.name,
  }));
  return {
    products,
    count: current?.data?.count ?? 0,
    isLoading: current === null,
    error: current?.error,
    retry: () => setAttempt((value) => value + 1),
  };
};
