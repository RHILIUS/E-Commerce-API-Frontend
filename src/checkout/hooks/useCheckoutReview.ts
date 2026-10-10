import { useEffect, useState } from "react";

import { fetchPreview, fetchRecipients } from "../api";
import type { PaymentMethod, Preview, Recipient } from "../types";
import { checkoutError } from "../utils/errors";
import { parseSource } from "../utils/source";

/** Load a review without polling or silently replacing the prices the customer accepted. */
export function useCheckoutReview(
  search: string,
  paused: boolean,
  paymentMethod: PaymentMethod = "cod",
) {
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<{
    paymentMethod: PaymentMethod;
    preview: Preview;
    recipients: Recipient[];
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const source = parseSource(search);
    if (!source || paused) return;
    const controller = new AbortController();
    // Async start also makes strict-mode cleanup cancel before network work begins.
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError("");
      setData(null);
      try {
        const [preview, recipients] = await Promise.all([
          fetchPreview(source, controller.signal, paymentMethod),
          fetchRecipients(controller.signal),
        ]);
        if (!controller.signal.aborted)
          setData({ paymentMethod, preview, recipients });
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(checkoutError(failure).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [search, paused, version, paymentMethod]);
  return {
    data: data?.paymentMethod === paymentMethod ? data : null,
    loading,
    error,
    refresh: () => {
      setData(null);
      setVersion((value) => value + 1);
    },
  };
}
