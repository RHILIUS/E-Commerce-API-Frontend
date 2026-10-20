import type { MouseEvent } from "react";
import { useEffect, useRef } from "react";

import { Button } from "@/app/components/ui/button";

type CatalogContinuationProps = {
  hasMore: boolean;
  isLoadingMore: boolean;
  moreError?: string;
  productCount: number;
  loadMore: () => Promise<boolean>;
};

/** Keep loading, retry, and completion feedback below the accumulated cards. */
export const CatalogContinuation = ({
  hasMore,
  isLoadingMore,
  moreError,
  productCount,
  loadMore,
}: CatalogContinuationProps) => {
  const pendingFocus = useRef<{
    button: HTMLButtonElement;
    index: number;
  } | null>(null);

  // Wait until appended cards are committed before continuing keyboard focus.
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || productCount <= pending.index) return;
    pendingFocus.current = null;
    if (
      document.activeElement !== pending.button &&
      document.activeElement !== document.body
    )
      return;
    const links = document.querySelectorAll<HTMLAnchorElement>(
      "#products article a",
    );
    links[pending.index]?.focus({ preventScroll: true });
  }, [productCount]);

  // Preserve pointer scroll position and avoid stealing focus moved during loading.
  const handleLoadMore = async (event: MouseEvent<HTMLButtonElement>) => {
    if (isLoadingMore) return;
    const button = event.currentTarget;
    if (event.detail === 0 || button.matches(":focus-visible")) {
      pendingFocus.current = { button, index: productCount };
    }
    if (!(await loadMore())) pendingFocus.current = null;
  };

  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 py-6 text-center">
      {hasMore ? (
        <>
          <div
            role="status"
            className="text-muted-foreground flex min-h-14 items-center gap-3 text-sm"
          >
            {isLoadingMore ? (
              <>
                <img
                  src="/favicon.svg"
                  alt=""
                  className="catalog-loading-logo size-10"
                />
                <span>Loading products…</span>
              </>
            ) : (
              <span className="sr-only">{productCount} products loaded.</span>
            )}
          </div>
          {moreError && (
            <p role="alert" className="text-muted-foreground text-sm">
              {moreError}
            </p>
          )}
          <Button
            variant="outline"
            className="min-h-11 min-w-40 aria-disabled:cursor-wait aria-disabled:opacity-50"
            aria-disabled={isLoadingMore}
            onClick={handleLoadMore}
          >
            {moreError ? "Try again" : "Load more"}
          </Button>
        </>
      ) : (
        <div role="status" className="flex flex-col items-center gap-2">
          <div className="bg-muted mb-2 flex size-18 items-center justify-center rounded-full">
            <img
              src="/favicon.svg"
              alt=""
              className="size-10 opacity-60 grayscale"
            />
          </div>
          <p className="font-medium">You’re all caught up</p>
          <p className="text-muted-foreground text-sm">
            You’ve seen all products in this list.
          </p>
        </div>
      )}
    </div>
  );
};
