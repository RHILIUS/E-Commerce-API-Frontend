/** Product card presentation data mapped from the catalog response. */
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  soldCount: number;
  imageUrl: string | null;
  imageAlt: string;
};

/** Exact response from GET /api/shop/products/. Prices remain decimal strings. */
export type ProductCatalogResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    id: number;
    name: string;
    short_description: string;
    price: string;
    currency: string;
    display_price: { amount: string; currency: string };
    sold_count: number;
    default_image: {
      image: string;
      alt_text: string;
      crop: Record<string, unknown>;
    } | null;
  }[];
};
