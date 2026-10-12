import { useEffect, useState } from "react";

import { fetchRecipients } from "../api";
import type { Recipient } from "../types";

/** Load the account address book with cancellable requests and explicit retry. */
export function useRecipients() {
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      try {
        const items = await fetchRecipients(controller.signal);
        if (!controller.signal.aborted) setRecipients(items);
      } catch {
        if (!controller.signal.aborted)
          setError("We couldn't load your recipients. Please try again.");
      }
    });
    return () => controller.abort();
  }, [version]);
  return {
    recipients,
    setRecipients,
    error,
    retry: () => {
      setError("");
      setVersion((value) => value + 1);
    },
  };
}
