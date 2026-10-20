import {
  ProductCard,
  ProductCardSkeleton,
} from "@/ecommerce/components/ProductCard";
import { CATALOG_PAGE_SIZE } from "@/ecommerce/hooks/useProductCatalog";
import type { Product } from "@/ecommerce/types";

type ProductGridProps = {
  products: readonly Product[];
  isLoading?: boolean;
};

/** Keeps the same responsive grid while a catalog request is pending. */
export const ProductGrid = ({
  products,
  isLoading = false,
}: ProductGridProps) => (
  <div aria-busy={isLoading} aria-label="Products">
    <p role="status" className="sr-only">
      {isLoading ? "Loading products" : ""}
    </p>
    <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {isLoading
        ? Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))
        : products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
    </div>
  </div>
);
