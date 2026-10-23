import { Link } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { ProductGrid } from "@/ecommerce/components/ProductGrid";
import { catalogProduct } from "@/ecommerce/utils/catalogProduct";

import type { StoreHomeResponse } from "./types";
import { useStoreResource } from "./useStoreResource";

const sections = [
  {
    key: "new_products",
    title: "New Products",
    description: "The latest additions to this store.",
    sort: "latest",
    empty: "No products listed yet.",
  },
  {
    key: "trending_products",
    title: "Trending Products",
    description: "Most units ordered in the last 30 days.",
    sort: "popular",
    empty: "No trending products yet.",
  },
  {
    key: "most_ordered",
    title: "Most Ordered",
    description: "Most units ordered across all time.",
    sort: "most_ordered",
    empty: "No orders yet.",
  },
] as const;

/** Show bounded previews; View all moves to the corresponding full catalog sort. */
export const StoreHome = ({ storeId }: { storeId: string }) => {
  const { data, isLoading, error, retry } = useStoreResource<StoreHomeResponse>(
    `/api/shop/stores/${encodeURIComponent(storeId)}/home/`,
  );
  if (isLoading) return <ProductGrid products={[]} isLoading />;
  if (error !== undefined)
    return (
      <div role="alert" className="space-y-3">
        <p>Unable to load store highlights.</p>
        <Button variant="outline" className="min-h-11" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section
          key={section.key}
          aria-label={section.title}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="text-muted-foreground text-sm">
                {section.description}
              </p>
            </div>
            <Button
              render={<Link to={`?tab=products&sort=${section.sort}`} />}
              nativeButton={false}
              role="link"
              variant="outline"
              className="min-h-11"
              aria-label={`View all ${section.title.toLowerCase()}`}
            >
              View all
            </Button>
          </div>
          {data && data[section.key].length > 0 ? (
            <ProductGrid products={data[section.key].map(catalogProduct)} />
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center">
              {section.empty}
            </p>
          )}
        </section>
      ))}
    </div>
  );
};
