import { type ReactNode, useEffect, useState } from "react";

import api from "@/app/api/axios";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";

import { CurrencyContext, type CurrencyOptions } from "./context";

const STORAGE_KEY = "shop:display-currency";

/** Read an untrusted preference; it is only used after backend options validate it. */
function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Share an explicit browser preference while the backend owns automatic defaults. */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { accessToken, user, isLoading } = useAuth();
  const [selected, setSelected] = useState(readPreference);
  const [storageError, setStorageError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([
    accessToken,
    user?.address_country_code,
    attempt,
  ]);
  const [result, setResult] = useState<{
    key: string;
    data?: CurrencyOptions;
    error?: boolean;
  }>();

  useEffect(() => {
    if (isLoading) return;
    const controller = new AbortController();
    api
      .get<CurrencyOptions>("/api/shop/currencies/", {
        signal: controller.signal,
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, data });
        },
        () => {
          if (!controller.signal.aborted)
            setResult((previous) => ({
              key,
              error: true,
              data: previous?.data,
            }));
        },
      );
    return () => controller.abort();
  }, [accessToken, isLoading, key]);

  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null)
        setSelected(readPreference());
    };
    window.addEventListener("storage", receive);
    return () => window.removeEventListener("storage", receive);
  }, []);

  // Keep validated options during an account refresh, but never show its old default.
  const options =
    result?.data?.currencies.filter((item) => item.display_supported) ?? [];
  const currency = options.some((item) => item.code === selected)
    ? selected
    : undefined;
  const current = !isLoading && result?.key === key;
  const select = (code: string | undefined) => {
    if (code !== undefined && !options.some((item) => item.code === code))
      return;
    setSelected(code);
    try {
      if (code) localStorage.setItem(STORAGE_KEY, code);
      else localStorage.removeItem(STORAGE_KEY);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        options,
        defaultCurrency:
          current && !result.error ? result.data?.default_currency : undefined,
        loading: !current,
        error: Boolean(current && result.error),
        storageError,
        select,
        retry: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
