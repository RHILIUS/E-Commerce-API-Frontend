import { useCallback, useEffect, useRef, useState } from "react";

import { fetchCarts, removeCartItems, updateCartQuantity } from "./api";
import type { CartResponse } from "./types";
import { cartErrorMessage } from "./utils";

/** Own cart requests, visible-page stock refresh, and mutation/refresh race prevention. */
export function useCart() {
  const [data, setData] = useState<CartResponse | null>(null);
  const [error, setError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [pending, setPending] = useState(false);
  const alive = useRef(false);
  const mutating = useRef(false);
  const request = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    if (mutating.current || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    return fetchCarts(controller.signal)
      .then((response) => {
        if (alive.current && !controller.signal.aborted) {
          setData(response);
          setRefreshError("");
        }
      })
      .catch(() => {
        if (alive.current && !controller.signal.aborted) {
          setRefreshError(
            "Couldn't refresh your cart. Stock and prices may have changed.",
          );
        }
      })
      .finally(() => {
        if (request.current === controller) request.current = null;
      });
  }, []);

  useEffect(() => {
    alive.current = true;
    void refresh();
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(refreshVisible, 15000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      alive.current = false;
      request.current?.abort();
      request.current = null;
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [refresh]);

  const mutate = async (operation: () => Promise<CartResponse>) => {
    if (mutating.current) return false;
    mutating.current = true;
    request.current?.abort();
    request.current = null;
    setPending(true);
    setError("");
    let success = false;
    try {
      const response = await operation();
      if (alive.current) {
        setData(response);
        setRefreshError("");
        success = true;
      }
    } catch (failure) {
      if (alive.current) setError(cartErrorMessage(failure));
    } finally {
      mutating.current = false;
      if (alive.current) {
        setPending(false);
        if (!success) void refresh();
      }
    }
    return success;
  };

  return {
    data,
    error,
    refreshError,
    pending,
    refresh,
    updateQuantity: (id: number, quantity: number) =>
      mutate(() => updateCartQuantity(id, quantity)),
    removeItems: (ids: number[]) => mutate(() => removeCartItems(ids)),
  };
}
