import { useEffect, useState } from "react";

import { fetchPreview, fetchRecipients } from "../api";
import type { Preview, Recipient } from "../types";
import { checkoutError } from "../utils/errors";
import { parseSource } from "../utils/source";

/** Load a review without polling or silently replacing the prices the customer accepted. */
export function useCheckoutReview(search: string, paused: boolean) {
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<{
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
          fetchPreview(source, controller.signal),
          fetchRecipients(controller.signal),
        ]);
        if (!controller.signal.aborted) setData({ preview, recipients });
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(checkoutError(failure).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [search, paused, version]);
  return {
    data,
    loading,
    error,
    refresh: () => {
      setData(null);
      setVersion((value) => value + 1);
    },
  };
}
