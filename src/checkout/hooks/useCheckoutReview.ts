import { useEffect, useState } from "react";

import { fetchRecipients } from "@/account/api/recipientApi";
import type { Recipient } from "@/account/types";

import { fetchPreview } from "../api";
import type { PaymentMethod, Preview } from "../types";
import { checkoutError } from "../utils/errors";
import { parseSource } from "../utils/source";

/** Retain the last review for display while only the latest requested preview can be submitted. */
export function useCheckoutReview(
  search: string,
  paused: boolean,
  paymentMethod: PaymentMethod = "cod",
) {
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<{
    paymentMethod: PaymentMethod;
    version: number;
    preview: Preview;
    recipients: Recipient[];
  } | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const key = `${paymentMethod}:${version}`;
  // The version invalidates even a rapid switch back to the previous payment method.
  const current =
    data?.paymentMethod === paymentMethod && data.version === version;
  const error = failure?.key === key ? failure.message : "";
  useEffect(() => {
    const source = parseSource(search);
    if (!source || paused) return;
    const controller = new AbortController();
    // Async start also makes strict-mode cleanup cancel before network work begins.
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      try {
        const [preview, recipients] = await Promise.all([
          fetchPreview(source, controller.signal, paymentMethod),
          fetchRecipients(controller.signal),
        ]);
        if (!controller.signal.aborted)
          setData({ paymentMethod, version, preview, recipients });
      } catch (failure) {
        if (!controller.signal.aborted)
          setFailure({ key, message: checkoutError(failure).message });
      }
    });
    return () => controller.abort();
  }, [search, paused, version, paymentMethod, key]);
  return {
    data,
    current: Boolean(current),
    loading: !paused && !current && !error,
    error,
    refresh: () => {
      setVersion((value) => value + 1);
    },
  };
}
