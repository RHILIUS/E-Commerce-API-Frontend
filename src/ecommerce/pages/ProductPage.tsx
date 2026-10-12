import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Header } from "@/ecommerce/components/Header";
import { ProductGallery } from "@/ecommerce/components/ProductGallery";
import { ProductPurchasePanel } from "@/ecommerce/components/ProductPurchasePanel";
import { useProductDetail } from "@/ecommerce/hooks/useProductDetail";
import type { ProductDetail } from "@/ecommerce/types";

/** Display the store logo with an initials fallback for missing or failed images. */
const StoreCard = ({ store }: { store: ProductDetail["store"] }) => {
  const [failed, setFailed] = useState(false);
  const initials = store.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <Card className="min-w-0 gap-6 rounded-lg border p-5 ring-0 lg:p-6">
      <div className="flex items-center gap-4">
        <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg text-base font-semibold">
          {store.profile_image && !failed ? (
            <img
              src={store.profile_image}
              alt={`${store.name} logo`}
              onError={() => setFailed(true)}
              className="size-full object-cover"
            />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground text-xs">SOLD BY</p>
          <h2 className="text-base leading-6 font-semibold tracking-normal wrap-anywhere">
            <Link
              to={`/stores/${store.id}`}
              className="hover:text-primary focus-visible:ring-ring/50 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3"
            >
              {store.name}
            </Link>
          </h2>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-6">
        <div className="flex min-w-0 flex-col-reverse gap-1">
          <dt className="text-muted-foreground text-xs">Products listed</dt>
          <dd className="text-lg leading-7 font-semibold wrap-anywhere">
            {store.listed_product_count.toLocaleString()}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col-reverse gap-1">
          <dt className="text-muted-foreground text-xs">Store created</dt>
          <dd className="text-lg leading-7 font-semibold wrap-anywhere">
            <time dateTime={store.created_at}>
              {new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(store.created_at))}
            </time>
          </dd>
        </div>
      </dl>
      <Button
        render={<Link to={`/stores/${store.id}`} />}
        nativeButton={false}
        role="link"
        variant="outline"
        className="min-h-11"
      >
        Visit store
      </Button>
    </Card>
  );
};

const ProductPage = () => {
  const { productId = "" } = useParams();
  const navigate = useNavigate();
  const { product, isLoading, error, retry } = useProductDetail(productId);
  return (
    <div className="bg-background text-foreground min-w-0">
      <Header
        searchQuery=""
        onSearch={(query) =>
          navigate(query ? `/?${new URLSearchParams({ q: query })}` : "/")
        }
      />
      <main className="mx-auto flex w-full max-w-360 flex-col gap-6 px-4 pt-6 pb-8 lg:gap-8 lg:px-10 lg:pt-8 lg:pb-12 xl:px-20">
        <nav
          aria-label="Breadcrumb"
          className="text-muted-foreground min-h-6 text-sm font-medium"
        >
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link
                to="/"
                className="hover:text-foreground focus-visible:outline-ring rounded-sm underline-offset-4 hover:underline focus-visible:outline-2"
              >
                All products
              </Link>
            </li>
            {product && (
              <>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="min-w-0 wrap-anywhere">
                  {product.name}
                </li>
              </>
            )}
          </ol>
        </nav>
        {isLoading ? (
          <div
            role="status"
            aria-label="Loading product"
            className="grid gap-6 lg:grid-cols-2 lg:gap-12"
          >
            <Skeleton className="aspect-154/116 rounded-lg" />
            <div className="space-y-6" aria-hidden="true">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
            <span className="sr-only">Loading product…</span>
          </div>
        ) : error ? (
          <div
            className="flex flex-col items-center gap-4 rounded-lg border px-5 py-16 text-center"
            role="alert"
          >
            <h1 className="text-2xl">
              {error === "not-found"
                ? "Product unavailable"
                : "Unable to load product"}
            </h1>
            <p className="text-muted-foreground">
              {error === "not-found"
                ? "This product could not be found or you don't have access to it."
                : "Please check your connection and try again."}
            </p>
            {error === "request" && (
              <Button variant="outline" className="min-h-11" onClick={retry}>
                Try again
              </Button>
            )}
            <Link to="/" className="text-primary underline underline-offset-4">
              Browse products
            </Link>
          </div>
        ) : (
          product && (
            <>
              <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-12">
                <ProductGallery
                  key={`gallery:${product.id}`}
                  images={product.images}
                  name={product.name}
                  archived={product.status === "archived"}
                />
                <ProductPurchasePanel
                  key={`purchase:${product.id}`}
                  product={product}
                />
              </div>
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
                <Card className="min-w-0 gap-4 rounded-lg border p-5 ring-0 lg:p-6">
                  <h2 className="text-2xl leading-8 font-semibold tracking-[-0.2px]">
                    About this product
                  </h2>
                  <p className="text-muted-foreground text-base leading-6 wrap-anywhere whitespace-pre-wrap">
                    {product.description || "No description provided."}
                  </p>
                </Card>
                <StoreCard
                  key={`${product.store.id}:${product.store.profile_image}`}
                  store={product.store}
                />
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
};

export default ProductPage;
