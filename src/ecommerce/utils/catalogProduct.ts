import type { Product, ProductCatalogResponse } from "@/ecommerce/types";

/** Map server display prices to shared cards without doing currency conversion locally. */
export const catalogProduct = (
  product: ProductCatalogResponse["results"][number] & { stock?: number },
): Product => ({
  id: String(product.id),
  name: product.name,
  description: product.short_description,
  price: Number(product.display_price.amount),
  currency: product.display_price.currency,
  soldCount: product.sold_count,
  imageUrl: product.default_image?.image ?? null,
  imageAlt: product.default_image?.alt_text || product.name,
  isOutOfStock: product.stock === 0,
});
