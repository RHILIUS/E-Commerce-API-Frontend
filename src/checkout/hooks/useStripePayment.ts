import { useCallback, useEffect, useRef, useState } from "react";

import { fetchStripePayment, reconcileStripePayment } from "../api";
import type { StripePayment } from "../types";
import { checkoutError } from "../utils/errors";

/** Reconcile with Stripe on entry, then poll saved state for two minutes while pending. */
export function useStripePayment(reference: string) {
  const [data, setData] = useState<StripePayment | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [pollingEnded, setPollingEnded] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const revision = useRef(0);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let reads = 0;
    const read = async () => {
      const currentRevision = revision.current;
      try {
        const result = await fetchStripePayment(reference, controller.signal);
        if (controller.signal.aborted) return;
        if (currentRevision === revision.current) setData(result);
        if (result.status === "pending" && ++reads < 40)
          timer = setTimeout(() => void read(), 3000);
        else if (result.status === "pending") setPollingEnded(true);
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(checkoutError(failure).message);
      }
    };
    // Defer initiation so Strict Mode cleanup can abort before sending a duplicate request.
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      inFlight.current = true;
      setBusy(true);
      try {
        const result = await reconcileStripePayment(
          reference,
          false,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setData(result);
        if (result.status === "pending")
          timer = setTimeout(() => void read(), 3000);
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(checkoutError(failure).message);
      } finally {
        if (!controller.signal.aborted) {
          inFlight.current = false;
          setBusy(false);
        }
      }
    });
    return () => {
      mounted.current = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [reference]);

  const reconcile = useCallback(
    async (cancel = false) => {
      if (inFlight.current) return;
      inFlight.current = true;
      revision.current += 1;
      setBusy(true);
      setError("");
      try {
        const result = await reconcileStripePayment(reference, cancel);
        revision.current += 1;
        if (mounted.current) setData(result);
      } catch (failure) {
        if (mounted.current) setError(checkoutError(failure).message);
      } finally {
        inFlight.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [reference],
  );

  useEffect(() => {
    // Browser Back can restore this page without remounting React.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void reconcile();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [reconcile]);

  return { data, error, busy, pollingEnded, reconcile };
}
