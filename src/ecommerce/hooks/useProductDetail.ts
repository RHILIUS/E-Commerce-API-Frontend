import axios from "axios";
import { useEffect, useState } from "react";

import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { productDetailApi } from "@/ecommerce/api";
import type { ProductDetail } from "@/ecommerce/types";

type DetailResult = {
  key: string;
  data?: ProductDetail;
  error?: "not-found" | "request";
};

/** Discard stale responses and hide prior data when the route or viewer changes. */
export const useProductDetail = (id: string) => {
  const { accessToken, user, isLoading: authLoading } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([
    id,
    accessToken,
    user?.address_country_code,
    attempt,
  ]);
  const [result, setResult] = useState<DetailResult | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    productDetailApi(id, controller.signal, accessToken).then(
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
  }, [id, accessToken, authLoading, key]);

  const current = !authLoading && result?.key === key ? result : null;
  return {
    product: current?.data,
    error: current?.error,
    isLoading: current === null,
    retry: () => setAttempt((value) => value + 1),
  };
};
