import axios from "axios";
import { useEffect, useState } from "react";

import api from "@/app/api/axios";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { useDisplayCurrency } from "@/ecommerce/currency/context";

type StoreResult<T> = { key: string; data?: T; status?: number };

/** Load a public store resource, refreshing viewer prices and discarding stale requests. */
export const useStoreResource = <T>(path: string) => {
  const { accessToken, user, isLoading: authLoading } = useAuth();
  const { currency } = useDisplayCurrency();
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([
    path,
    accessToken,
    user?.address_country_code,
    currency,
    attempt,
  ]);
  const [result, setResult] = useState<StoreResult<T> | null>(null);
  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    api
      .get<T>(path, {
        signal: controller.signal,
        params: { display_currency: currency },
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted)
            setResult({
              key,
              status: axios.isAxiosError(error)
                ? (error.response?.status ?? 0)
                : 0,
            });
        },
      );
    return () => controller.abort();
  }, [path, accessToken, currency, authLoading, key]);
  const current = !authLoading && result?.key === key ? result : null;
  return {
    data: current?.data,
    error: current?.status,
    isLoading: current === null,
    retry: () => setAttempt((value) => value + 1),
  };
};
