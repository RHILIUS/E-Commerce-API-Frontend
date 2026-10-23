import api from "@/app/api/axios";
import type { ProductCatalogResponse, ProductDetail } from "@/ecommerce/types";

/** Load a detail page; the server controls draft visibility and purchase eligibility. */
export const productDetailApi = async (
  id: string,
  signal: AbortSignal,
  accessToken: string | null,
  displayCurrency?: string,
) => {
  const response = await api.get<ProductDetail>(
    `/api/shop/products/${encodeURIComponent(id)}/`,
    {
      signal,
      params: { display_currency: displayCurrency },
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    },
  );
  return response.data;
};

/** Fetch one ranked catalog page through the shared authenticated API client. */
export const productCatalogApi = async (
  page: number,
  query: string,
  signal: AbortSignal,
  accessToken: string | null,
  displayCurrency?: string,
) => {
  const response = await api.get<ProductCatalogResponse>(
    "/api/shop/products/",
    {
      params: { page, q: query, display_currency: displayCurrency },
      signal,
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    },
  );
  return response.data;
};
