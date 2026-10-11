import { useEffect, useState } from "react";

import { fetchOrderHistory } from "./api";
import type { OrderHistory } from "./types";

/** Load fresh history for each dialog opening; discard responses after closing or retrying. */
export function useOrderHistory(orderId: number) {
  const [revision, setRevision] = useState(0);
  const key = `${orderId}:${revision}`;
  const [state, setState] = useState<{
    key: string;
    data: OrderHistory | null;
    error: boolean;
  }>({ key: "", data: null, error: false });
  useEffect(() => {
    const controller = new AbortController();
    fetchOrderHistory(orderId, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ key, data, error: false });
      },
      () => {
        if (!controller.signal.aborted)
          setState({ key, data: null, error: true });
      },
    );
    return () => controller.abort();
  }, [key, orderId]);
  return {
    loading: state.key !== key,
    data: state.key === key ? state.data : null,
    error: state.key === key && state.error,
    retry: () => setRevision((value) => value + 1),
  };
}
