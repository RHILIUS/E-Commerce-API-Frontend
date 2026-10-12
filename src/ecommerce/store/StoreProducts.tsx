import { ChevronDown } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { ProductGrid } from "@/ecommerce/components/ProductGrid";
import { ProductPagination } from "@/ecommerce/components/ProductPagination";
import { catalogProduct } from "@/ecommerce/utils/catalogProduct";

import {
  type PublicStore,
  type StoreProductsResponse,
  type StoreSort,
  storeSortLabels,
} from "./types";
import { useStoreResource } from "./useStoreResource";

/** Coordinate URL-backed catalog filters with server pagination and sorting. */
export const StoreProducts = ({ store }: { store: PublicStore }) => {
  const [params, setParams] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const category = params.get("category") ?? "";
  const requestedPage = Number(params.get("page") ?? 1);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const requestedSort = params.get("sort") ?? "latest";
  const sort: StoreSort = Object.hasOwn(storeSortLabels, requestedSort)
    ? (requestedSort as StoreSort)
    : "latest";
  const apiParams = new URLSearchParams({ q: query, sort, page: String(page) });
  if (category) apiParams.set("category", category);
  const { data, isLoading, error, retry } =
    useStoreResource<StoreProductsResponse>(
      `/api/shop/stores/${store.id}/products/?${apiParams}`,
    );
  const pageCount = Math.ceil((data?.count ?? 0) / 10);
  const categoryName = store.categories.find(
    (item) => String(item.id) === category,
  )?.name;

  // Preserve search/category when sorting; filter changes start at the first page.
  const changeSort = (value: string) => {
    const next = new URLSearchParams(params);
    next.set("sort", value);
    next.delete("page");
    setParams(next);
  };
  const clearFilters = () => setParams({ tab: "products", sort });
  return (
    <section className="space-y-6" aria-label="Store products">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h2 className="text-xl font-semibold wrap-anywhere">
            {categoryName || (category ? "Category products" : "All Products")}
          </h2>
          {query && (
            <p className="text-muted-foreground text-sm wrap-anywhere">
              Results for “{query}”
            </p>
          )}
          {!isLoading && error === undefined && (
            <p role="status" className="text-muted-foreground text-sm">
              {data?.count ?? 0} products
              {pageCount > 0 ? ` · Page ${page} of ${pageCount}` : ""}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className="min-h-11" />}
            aria-label={`Sort products: ${storeSortLabels[sort]}`}
          >
            Sort: {storeSortLabels[sort]}
            <ChevronDown aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={sort} onValueChange={changeSort}>
              {Object.entries(storeSortLabels).map(([value, label]) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  closeOnClick
                  className="min-h-11"
                >
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {(query || category) && (
        <Button variant="outline" className="min-h-11" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
      {isLoading ? (
        <ProductGrid products={[]} isLoading />
      ) : error !== undefined ? (
        <div role="alert" className="space-y-3 rounded-lg border p-6">
          <p>
            {error === 404
              ? "This product page or category is unavailable."
              : error === 400
                ? "These product filters are invalid. Clear filters and try again."
                : "Unable to load products. Please try again."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="min-h-11" onClick={retry}>
              Try again
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={clearFilters}
            >
              Browse all products
            </Button>
          </div>
        </div>
      ) : data && data.results.length > 0 ? (
        <>
          <ProductGrid products={data.results.map(catalogProduct)} />
          {pageCount > 1 && (
            <ProductPagination
              page={page}
              pageCount={pageCount}
              searchParams={params}
            />
          )}
        </>
      ) : (
        <p
          role="status"
          className="text-muted-foreground rounded-lg border border-dashed px-4 py-12 text-center"
        >
          {query
            ? "No results found."
            : category
              ? "No products in this category."
              : "No products listed yet."}
        </p>
      )}
    </section>
  );
};
