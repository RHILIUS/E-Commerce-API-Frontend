import { ArrowRight, Search } from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Header } from "@/ecommerce/components/Header";
import { StoreHome } from "@/ecommerce/store/StoreHome";
import { StoreProducts } from "@/ecommerce/store/StoreProducts";
import { StoreAbout, StoreProfile } from "@/ecommerce/store/StoreProfile";
import type { PublicStore } from "@/ecommerce/store/types";
import { useStoreResource } from "@/ecommerce/store/useStoreResource";

const tabs = [
  { value: "home", label: "Home" },
  { value: "products", label: "All Products" },
  { value: "categories", label: "Categories" },
  { value: "about", label: "About" },
];

/** Public storefront with URL-backed navigation and independently loaded product sections. */
const StorePage = () => {
  const { storeId = "" } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab") ?? "home";
  const tab = tabs.some((item) => item.value === requestedTab)
    ? requestedTab
    : "home";
  const query = params.get("q")?.trim() ?? "";
  const {
    data: store,
    isLoading,
    error,
    retry,
  } = useStoreResource<PublicStore>(
    `/api/shop/stores/${encodeURIComponent(storeId)}/`,
  );

  return (
    <div className="bg-background text-foreground w-full min-w-0">
      <a
        href="#store"
        className="bg-background sr-only z-50 rounded-md p-3 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to store
      </a>
      <Header
        searchQuery=""
        onSearch={(value) =>
          navigate(value ? `/?${new URLSearchParams({ q: value })}` : "/")
        }
      />
      <main
        id="store"
        tabIndex={-1}
        className="mx-auto w-full max-w-360 scroll-mt-40 space-y-6 px-3 pt-5 pb-12 outline-none sm:px-6 lg:space-y-8 lg:px-10"
      >
        <nav
          aria-label="Breadcrumb"
          className="text-muted-foreground flex flex-wrap gap-2 text-sm"
        >
          <Link
            className="hover:text-foreground underline-offset-4 hover:underline"
            to="/"
          >
            Products
          </Link>
          <span aria-hidden="true">/</span>
          <span className="min-w-0 wrap-anywhere" aria-current="page">
            {store?.name || "Store"}
          </span>
        </nav>
        {isLoading ? (
          <div role="status" aria-label="Loading store" className="space-y-5">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error !== undefined ? (
          <section className="space-y-4 rounded-xl border p-6" role="alert">
            <h1 className="text-2xl">
              {error === 404 ? "Store not found" : "Unable to load store"}
            </h1>
            <p className="text-muted-foreground">
              {error === 404
                ? "This store is unavailable. Browse products to discover another store."
                : "Please try again."}
            </p>
            {error !== 404 && (
              <Button variant="outline" className="min-h-11" onClick={retry}>
                Try again
              </Button>
            )}
            <Button
              render={<Link to="/" />}
              nativeButton={false}
              role="link"
              variant="outline"
              className="min-h-11"
            >
              Browse products
            </Button>
          </section>
        ) : (
          store && (
            <>
              <StoreProfile
                key={`${store.id}:${store.banner_image}:${store.profile_image}`}
                store={store}
              />
              <Tabs
                value={tab}
                onValueChange={(value) =>
                  setParams(value === "home" ? {} : { tab: String(value) })
                }
                className="min-w-0 gap-6"
              >
                <div className="flex min-w-0 flex-col gap-5 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
                  <TabsList
                    variant="line"
                    aria-label="Store navigation"
                    className="w-full justify-start gap-0 group-data-horizontal/tabs:h-auto lg:w-auto"
                  >
                    {tabs.map((item) => (
                      <TabsTrigger
                        key={item.value}
                        value={item.value}
                        className="min-h-11 min-w-0 px-2 text-xs whitespace-normal sm:px-4 sm:text-sm sm:whitespace-nowrap"
                      >
                        {item.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <form
                    key={`${storeId}:${query}`}
                    role="search"
                    aria-label="Store products"
                    className="w-full min-w-0 lg:max-w-80"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const value = String(
                        new FormData(event.currentTarget).get("storeQuery") ??
                          "",
                      ).trim();
                      setParams(
                        value
                          ? { tab: "products", q: value }
                          : { tab: "products" },
                      );
                    }}
                  >
                    <InputGroup className="h-11">
                      <InputGroupInput
                        type="search"
                        name="storeQuery"
                        aria-label="Search this store"
                        placeholder="Search this store"
                        maxLength={200}
                        defaultValue={query}
                        className="min-w-0 text-base"
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="submit"
                          size="icon-sm"
                          className="size-10"
                          aria-label="Submit store search"
                        >
                          <Search aria-hidden="true" />
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </form>
                </div>
                <TabsContent value="home">
                  {tab === "home" && <StoreHome storeId={storeId} />}
                </TabsContent>
                <TabsContent value="products">
                  {tab === "products" && <StoreProducts store={store} />}
                </TabsContent>
                <TabsContent value="categories">
                  <section className="space-y-5">
                    <h2 className="text-xl font-semibold">Categories</h2>
                    {store.categories.length ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {store.categories.map((category) => (
                          <Link
                            key={category.id}
                            to={`?tab=products&category=${category.id}`}
                            className="focus-visible:ring-ring/50 min-w-0 rounded-lg outline-none focus-visible:ring-3"
                          >
                            <Card className="hover:bg-muted h-full flex-row items-center justify-between gap-3 rounded-lg border p-5 ring-0">
                              <div className="min-w-0">
                                <h3 className="text-base font-semibold wrap-anywhere">
                                  {category.name}
                                </h3>
                                <p className="text-muted-foreground mt-1 text-sm">
                                  {category.product_count}{" "}
                                  {category.product_count === 1
                                    ? "product"
                                    : "products"}
                                </p>
                              </div>
                              <ArrowRight
                                className="size-4 shrink-0"
                                aria-hidden="true"
                              />
                            </Card>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center">
                        No categories available yet.
                      </p>
                    )}
                  </section>
                </TabsContent>
                <TabsContent value="about">
                  <StoreAbout store={store} />
                </TabsContent>
              </Tabs>
            </>
          )
        )}
      </main>
    </div>
  );
};

export default StorePage;
