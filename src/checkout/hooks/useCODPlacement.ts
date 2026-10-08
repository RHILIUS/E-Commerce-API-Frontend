import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { placeCOD } from "../api";
import type { PlacementRequest } from "../types";
import { checkoutError } from "../utils/errors";

type SavedAttempt = { request: PlacementRequest; reference?: string };
// Reject unreadable recovery data instead of silently allowing a second purchase.
function readAttempt(key: string): {
  attempt: SavedAttempt | null;
  error: string;
} {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return { attempt: null, error: "" };
    const data = JSON.parse(raw) as SavedAttempt;
    if (
      !data?.request ||
      typeof data.request.preview_token !== "string" ||
      !Number.isSafeInteger(data.request.recipient_id) ||
      data.request.recipient_id < 1 ||
      data.request.payment_method !== "cod" ||
      typeof data.request.idempotency_key !== "string" ||
      (data.reference !== undefined && typeof data.reference !== "string")
    )
      throw new Error("Invalid attempt");
    return { attempt: data, error: "" };
  } catch {
    return {
      attempt: null,
      error:
        "Checkout recovery storage is unavailable. Restore this tab’s storage before placing an order; an earlier purchase may still need confirmation.",
    };
  }
}

/** Persist an account-scoped request before sending; ambiguous failures retain its identity across reloads. */
export function useCODPlacement(userId: number) {
  const key = `checkout:cod:${userId}`;
  const [initial] = useState(() => readAttempt(key));
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
      inFlight.current ||
      initial.error ||
      (!attempt && (!input || needsReview))
    )
      return;
    if (attempt?.reference) {
      navigate(`/checkout/confirmation/${attempt.reference}`, {
        replace: true,
      });
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
      const confirmation = await placeCOD(saved.request);
      // Keep the successful reference until confirmation loads, including when navigation is interrupted.
      const completed = { ...saved, reference: confirmation.reference };
      setAttempt(completed);
      try {
        sessionStorage.setItem(key, JSON.stringify(completed));
      } catch {
        /* The persisted original request remains safe to replay. */
      }
      if (mounted.current)
        navigate(`/checkout/confirmation/${confirmation.reference}`, {
          replace: true,
        });
    } catch (failure) {
      const parsed = checkoutError(failure);
      setError(parsed.message);
      if (!parsed.uncertain) {
        try {
          sessionStorage.removeItem(key);
          setAttempt(null);
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

/** Clear only the confirmed request for this account, leaving other pending purchases intact. */
export function clearConfirmedAttempt(userId: number, reference: string) {
  const key = `checkout:cod:${userId}`;
  const { attempt } = readAttempt(key);
  if (attempt?.reference === reference) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* A later visit can still open the stored confirmation. */
    }
  }
}
