import { createContext, useContext } from "react";

export type CurrencyOption = {
  code: string;
  name: string;
  minor_unit: number;
  display_supported: boolean;
  stripe_supported: boolean;
};
export type CurrencyOptions = {
  currencies: CurrencyOption[];
  default_currency: string;
  default_source: "address" | "fallback";
};
export type CurrencyPreference = {
  currency: string | undefined;
  options: CurrencyOption[];
  defaultCurrency: string | undefined;
  loading: boolean;
  error: boolean;
  storageError: boolean;
  select: (code: string | undefined) => void;
  retry: () => void;
};

export const CurrencyContext = createContext<CurrencyPreference>({
  currency: undefined,
  options: [],
  defaultCurrency: undefined,
  loading: false,
  error: false,
  storageError: false,
  select: () => {},
  retry: () => {},
});

/** Read the shared browsing preference; checkout continues using its own quote policy. */
export const useDisplayCurrency = () => useContext(CurrencyContext);
