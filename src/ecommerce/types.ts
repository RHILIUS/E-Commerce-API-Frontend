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
  isOutOfStock?: boolean;
};

/** Product Page response; monetary amounts remain decimal strings. */
export type ProductDetail = {
  id: number;
  name: string;
  short_description: string;
  description: string | null;
  price: string;
  currency: string;
  display_price: { amount: string; currency: string };
  sold_count: number;
  stock: number;
  status: "active" | "archived" | "draft";
  archived_at: string | null;
  can_purchase: boolean;
  default_image: {
    image: string;
    alt_text: string;
    crop: Record<string, unknown>;
  } | null;
  images: ProductDetailImage[];
  store: {
    id: number;
    name: string;
    profile_image: string | null;
    profile_image_crop: Record<string, unknown>;
    listed_product_count: number;
    created_at: string;
  };
};

export type ProductDetailImage = {
  id: number;
  image: string;
  alt_text: string;
  crop: Record<string, unknown>;
  is_default: boolean;
  order: number;
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
