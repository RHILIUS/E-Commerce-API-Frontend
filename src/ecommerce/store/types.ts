import type { ProductCatalogResponse } from "@/ecommerce/types";

export type PublicStore = {
  id: number;
  name: string;
  description: string;
  profile_image: string | null;
  banner_image: string | null;
  created_at: string;
  public_email: string;
  public_phone: string;
  address: {
    country_code: string;
    address_line1: string;
    address_line2: string;
    city: string;
    region: string;
    postal_code: string;
  } | null;
  listed_product_count: number;
  items_sold: number;
  categories: { id: number; name: string; product_count: number }[];
};

export type StoreProduct = ProductCatalogResponse["results"][number] & {
  stock: number;
};
export type StoreProductsResponse = Omit<ProductCatalogResponse, "results"> & {
  results: StoreProduct[];
};
export type StoreHomeResponse = {
  new_products: StoreProduct[];
  trending_products: StoreProduct[];
  best_sellers: StoreProduct[];
};
export const storeSortLabels = {
  latest: "Latest",
  oldest: "Oldest",
  popular: "Popular",
  best_sellers: "Best Sellers",
} as const;
export type StoreSort = keyof typeof storeSortLabels;
