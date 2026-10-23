import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { productCatalogApi } from "@/ecommerce/api";
import { catalogProduct } from "@/ecommerce/utils/catalogProduct";

import { CatalogHistoryContext, type CatalogResult } from "./catalogHistory";

export const CATALOG_PAGE_SIZE = 12;

/** Accumulate catalog pages and cancel obsolete search or viewer requests. */
export const useProductCatalog = (query: string) => {
  const { accessToken, user, isLoading: authLoading } = useAuth();
  const history = useContext(CatalogHistoryContext);
  const location = useLocation();
  const navigationType = useNavigationType();
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([
    location.key,
    query,
    accessToken,
    user?.address_country_code,
    attempt,
  ]);
  const [result, setResult] = useState<CatalogResult | null>(null);
  const moreRequest = useRef<AbortController | null>(null);

  const historyKey = key;
  const cached =
    navigationType === "POP" ? history?.get(historyKey) : undefined;
  useEffect(() => {
    if (authLoading) return;
    if (navigationType === "POP" && history?.has(historyKey)) {
      return () => {
        moreRequest.current?.abort();
        moreRequest.current = null;
      };
    }
    const controller = new AbortController();
    productCatalogApi(1, query, controller.signal, accessToken).then(
      (data) => {
        if (!controller.signal.aborted) {
          setResult({
            key,
            products: data.results.map(catalogProduct),
            page: 1,
            hasMore: data.next !== null,
            isLoadingMore: false,
          });
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setResult({
            key,
            products: [],
            page: 1,
            hasMore: false,
            isLoadingMore: false,
            error: "Unable to load products. Please try again.",
          });
        }
      },
    );
    return () => {
      controller.abort();
      moreRequest.current?.abort();
      moreRequest.current = null;
    };
  }, [
    query,
    accessToken,
    authLoading,
    key,
    history,
    historyKey,
    navigationType,
  ]);

  const current = authLoading
    ? null
    : result?.key === key
      ? result
      : (cached ?? null);

  useEffect(() => {
    if (!current || current.error || current.isLoadingMore || !history) return;
    history.set(historyKey, current);
    if (history.size > 20) history.delete(history.keys().next().value!);
  }, [current, history, historyKey]);

  // Lock immediately, before React renders, so repeated clicks cannot skip pages.
  const loadMore = async () => {
    if (!current?.hasMore || moreRequest.current) return false;
    const controller = new AbortController();
    moreRequest.current = controller;
    setResult({ ...current, isLoadingMore: true, moreError: undefined });
    try {
      const data = await productCatalogApi(
        current.page + 1,
        query,
        controller.signal,
        accessToken,
      );
      if (controller.signal.aborted) return false;
      // Rankings can shift between requests; keep already displayed cards unique.
      const seen = new Set(current.products.map((product) => product.id));
      const added = data.results
        .map(catalogProduct)
        .filter((product) => !seen.has(product.id));
      setResult({
        key,
        products: [...current.products, ...added],
        page: current.page + 1,
        hasMore: data.next !== null,
        isLoadingMore: false,
      });
      return added.length > 0;
    } catch {
      if (!controller.signal.aborted) {
        setResult({
          ...current,
          isLoadingMore: false,
          moreError: "Unable to load more products. Please try again.",
        });
      }
      return false;
    } finally {
      if (moreRequest.current === controller) moreRequest.current = null;
    }
  };

  return {
    products: current?.products ?? [],
    isLoading: current === null,
    error: current?.error,
    moreError: current?.moreError,
    isLoadingMore: current?.isLoadingMore ?? false,
    hasMore: current?.hasMore ?? false,
    loadMore,
    retry: () => setAttempt((value) => value + 1),
  };
};
