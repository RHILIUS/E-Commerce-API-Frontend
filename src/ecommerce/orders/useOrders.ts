import axios from "axios";
import { useEffect, useState } from "react";

import { fetchOrders } from "./api";
import type { OrderPage, OrderTab } from "./types";

/** Cancel stale reads when filters change and expose explicit retry after a failed request. */
export function useOrders(tab: OrderTab, page: number) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    key: string;
    data: OrderPage | null;
    error: string | null;
  }>({ key: "", data: null, error: null });
  const key = `${tab}:${page}:${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(tab, page, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ key, data, error: null });
      },
      (error: unknown) => {
        if (!controller.signal.aborted && !axios.isCancel(error))
          setState({
            key,
            data: null,
            error: "We couldn't load your orders. Please try again.",
          });
      },
    );
    return () => controller.abort();
  }, [key, tab, page]);
  return {
    data: state.key === key ? state.data : null,
    error: state.key === key ? state.error : null,
    loading: state.key !== key,
    reload: () => setRevision((value) => value + 1),
  };
}
