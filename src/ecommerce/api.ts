import api from "@/app/api/axios";
import type { ProductCatalogResponse } from "@/ecommerce/types";

/** Fetch one ranked catalog page through the shared authenticated API client. */
export const productCatalogApi = async (
  page: number,
  query: string,
  signal: AbortSignal,
  accessToken: string | null,
) => {
  const response = await api.get<ProductCatalogResponse>(
    "/api/shop/products/",
    {
      params: { page, q: query },
      signal,
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    },
  );
  return response.data;
};
