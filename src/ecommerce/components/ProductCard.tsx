import { Link } from "react-router-dom";

import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import type { Product } from "@/ecommerce/types";

const soldFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const cardClassName = "h-full min-w-0 gap-0 rounded-lg border py-0 ring-0";
const contentClassName = "flex flex-1 flex-col gap-3 p-3 sm:p-4";
const imageClassName =
  "h-32 w-full shrink-0 rounded-none! object-cover sm:h-49";

/** Link the entire catalog card to its corresponding product detail page. */
export const ProductCard = ({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) => (
  <article className="min-w-0" aria-label={product.name}>
    <Link
      to={`/products/${encodeURIComponent(product.id)}`}
      aria-label={`View ${product.name}`}
      className="focus-visible:ring-ring/50 block h-full rounded-lg outline-none focus-visible:ring-3"
    >
      <Card className={cardClassName}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            width={636}
            height={392}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={imageClassName}
          />
        ) : (
          <div
            className={`${imageClassName} bg-muted text-muted-foreground flex items-center justify-center text-sm`}
          >
            No image available
          </div>
        )}
        <CardContent className={contentClassName}>
          <h2 className="text-base leading-6 font-semibold tracking-normal wrap-anywhere">
            {product.name}
          </h2>
          <p className="text-muted-foreground min-h-8 flex-1 text-xs leading-4 wrap-anywhere">
            {product.description}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <p className="text-lg leading-7 font-semibold wrap-anywhere tabular-nums">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: product.currency,
              }).format(product.price)}
            </p>
            <p className="text-muted-foreground text-xs leading-4 whitespace-nowrap">
              {soldFormatter.format(product.soldCount).toLowerCase()} sold
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  </article>
);

/** Matches the product card's image, content spacing, and price row while loading. */
export const ProductCardSkeleton = () => (
  <Card className={cardClassName} aria-hidden="true">
    <Skeleton className={imageClassName} />
    <CardContent className={contentClassName}>
      <Skeleton className="h-6 w-3/4" />
      <div className="flex min-h-8 flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
    </CardContent>
  </Card>
);
