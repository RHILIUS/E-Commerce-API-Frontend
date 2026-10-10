import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { placeCOD, placeStripe } from "../api";
import type { CheckoutSource, PlacementRequest } from "../types";
import { checkoutError } from "../utils/errors";
import { readAttempt, recoveryKey, type SavedAttempt } from "../utils/recovery";

/** Persist selection-scoped requests; retain legacy unknown outcomes for explicit recovery. */
export function useCheckoutPlacement(
  userId: number,
  source: CheckoutSource | null,
) {
  const scopedKey = recoveryKey(userId, source);
  const legacyKey = `checkout:cod:${userId}`;
  const [legacy] = useState(() => readAttempt(legacyKey));
  // Legacy records lack a selection. Known references remain accessible without
  // blocking review; unknown outcomes must be resolved before another purchase.
  const [recoverLegacy, setRecoverLegacy] = useState(() =>
    Boolean(legacy.error || (legacy.attempt && !legacy.attempt.reference)),
  );
  const key = recoverLegacy ? legacyKey : scopedKey;
  const [initial] = useState(() => (recoverLegacy ? legacy : readAttempt(key)));
  const [attempt, setAttempt] = useState(initial.attempt);
  const [error, setError] = useState(initial.error);
  const [busy, setBusy] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const inFlight = useRef(false);
  const navigate = useNavigate();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const submit = async (input?: Omit<PlacementRequest, "idempotency_key">) => {
    if (
      !key ||
      inFlight.current ||
      initial.error ||
      (!attempt && (!input || needsReview))
    )
      return;
    if (attempt?.reference) {
      navigate(
        `/checkout/${attempt.request.payment_method === "stripe" ? "payment" : "confirmation"}/${attempt.reference}`,
        {
          replace: true,
        },
      );
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    let saved: SavedAttempt;
    try {
      saved = attempt ?? {
        request: { ...input!, idempotency_key: crypto.randomUUID() },
      };
      sessionStorage.setItem(key, JSON.stringify(saved));
      setAttempt(saved);
    } catch {
      setError(
        "Enable browser session storage before placing your order. No new request was sent.",
      );
      setBusy(false);
      inFlight.current = false;
      return;
    }
    try {
      const payment =
        saved.request.payment_method === "stripe"
          ? await placeStripe(saved.request)
          : null;
      const confirmation = payment ?? (await placeCOD(saved.request));
      // Keep the successful reference until confirmation loads, including when navigation is interrupted.
      const completed = { ...saved, reference: confirmation.reference };
      setAttempt(completed);
      try {
        sessionStorage.setItem(key, JSON.stringify(completed));
      } catch {
        /* The persisted original request remains safe to replay. */
      }
      if (mounted.current) {
        if (
          payment?.status === "pending" &&
          payment.checkout_url &&
          !payment.cancel_requested
        ) {
          // Persist recovery before leaving the app; return visits stay on the status page.
          location.assign(payment.checkout_url);
          return;
        }
        navigate(
          `/checkout/${saved.request.payment_method === "stripe" ? "payment" : "confirmation"}/${confirmation.reference}`,
          {
            replace: true,
          },
        );
      }
    } catch (failure) {
      const parsed = checkoutError(failure);
      setError(parsed.message);
      if (!parsed.uncertain) {
        try {
          sessionStorage.removeItem(key);
          setAttempt(null);
          setRecoverLegacy(false);
          setNeedsReview(true);
        } catch {
          setError(
            "Restore browser storage, then retry the saved request before starting another purchase.",
          );
        }
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return {
    attempt,
    previousAttempt: legacy.attempt?.reference ? legacy.attempt : null,
    busy,
    error,
    storageBlocked: Boolean(initial.error),
    needsReview,
    submit,
    reviewed: () => {
      setNeedsReview(false);
      setError("");
    },
  };
}
