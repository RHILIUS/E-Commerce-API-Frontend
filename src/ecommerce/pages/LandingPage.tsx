import { useSearchParams } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { Header } from "@/ecommerce/components/Header";
import { ProductGrid } from "@/ecommerce/components/ProductGrid";
import { ProductPagination } from "@/ecommerce/components/ProductPagination";
import {
  CATALOG_PAGE_SIZE,
  useProductCatalog,
} from "@/ecommerce/hooks/useProductCatalog";

const LandingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // The query value from the url query params
  const query = searchParams.get("q")?.trim() ?? "";
  const requestedPage = Number(searchParams.get("page") ?? 1);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const { products, count, isLoading, error, retry } = useProductCatalog(
    page,
    query,
  );
  const pageCount = Math.ceil(count / CATALOG_PAGE_SIZE);

  // A new search always starts at the first page of its own results.
  const handleSearch = (value: string) => {
    setSearchParams(value ? { q: value } : {});
  };

  return (
    <div className="bg-background text-foreground w-full min-w-0">
      <a
        href="#products"
        className="bg-background text-foreground sr-only z-10 rounded-md p-3 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to products
      </a>
      <Header searchQuery={query} onSearch={handleSearch} />
      <main
        id="products"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-400 flex-col gap-6 px-3 pt-6 pb-8 outline-none sm:px-6 sm:pt-8 sm:pb-10 lg:gap-8 lg:px-12 lg:pt-10 lg:pb-12"
      >
        <div className="space-y-2">
          <h1 className="text-2xl leading-8 font-semibold tracking-[-0.2px]">
            {query ? "Search results" : "Featured products"}
          </h1>
          <p className="text-muted-foreground text-base leading-6 wrap-anywhere">
            {query
              ? `Products matching “${query}”.`
              : "Handpicked products worth discovering today."}
          </p>
        </div>
        {!isLoading && !error && (
          <p role="status" className="sr-only">
            {count} products found.{" "}
            {pageCount > 0 ? `Page ${page} of ${pageCount}.` : ""}
          </p>
        )}
        {isLoading ? (
          <ProductGrid products={[]} isLoading />
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-lg border px-4 py-12 text-center"
          >
            <p>{error}</p>
            <Button variant="outline" onClick={retry}>
              Try again
            </Button>
            {page > 1 && (
              <Button variant="outline" onClick={() => handleSearch(query)}>
                Go to first page
              </Button>
            )}
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Show products in the page when there is more than zero */}
            <ProductGrid products={products} />
            {pageCount > 1 && (
              <ProductPagination
                page={page}
                pageCount={pageCount}
                searchParams={searchParams}
              />
            )}
          </>
        ) : (
          // Else, show this
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-16 text-center">
            <h2 className="text-xl font-semibold">No products found</h2>
            <p className="text-muted-foreground text-sm">
              Try a different product name or browse all products.
            </p>
            <Button
              variant="outline"
              className="mt-2 min-h-11"
              onClick={() => handleSearch("")}
            >
              Clear search
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default LandingPage;
