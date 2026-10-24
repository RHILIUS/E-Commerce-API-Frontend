import axios from "axios";
import { useEffect, useState } from "react";

import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { productDetailApi } from "@/ecommerce/api";
import { useDisplayCurrency } from "@/ecommerce/currency/context";
import type { ProductDetail } from "@/ecommerce/types";

type DetailResult = {
  key: string;
  data?: ProductDetail;
  error?: "not-found" | "request";
};

/** Discard stale responses and hide prior data when the route or viewer changes. */
export const useProductDetail = (id: string) => {
  const { accessToken, user, isLoading: authLoading } = useAuth();
  const {
    currency,
    defaultCurrency,
    loading: currencyLoading,
  } = useDisplayCurrency();
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([
    id,
    accessToken,
    user?.address_country_code,
    currency ?? defaultCurrency,
    attempt,
  ]);
  const [result, setResult] = useState<DetailResult | null>(null);

  useEffect(() => {
    if (authLoading || currencyLoading) return;
    const controller = new AbortController();
    productDetailApi(id, controller.signal, accessToken, currency).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            error:
              axios.isAxiosError(error) && error.response?.status === 404
                ? "not-found"
                : "request",
          });
      },
    );
    return () => controller.abort();
  }, [id, accessToken, currency, authLoading, currencyLoading, key]);

  const current =
    !authLoading && !currencyLoading && result?.key === key ? result : null;
  return {
    product: current?.data,
    error: current?.error,
    isLoading: current === null,
    retry: () => setAttempt((value) => value + 1),
  };
};
