import api from "@/app/api/axios";

import type { OrderHistory, OrderPage, OrderTab, UserOrder } from "./types";

/** Read one owned page; filtering and creation-time sorting happen before pagination. */
export async function fetchOrders(
  tab: OrderTab,
  page: number,
  signal: AbortSignal,
) {
  return (
    await api.get<OrderPage>("/api/shop/orders/", {
      params: { tab, page },
      signal,
    })
  ).data;
}
/** The server rechecks eligibility and deduplicates inventory and refund effects. */
export async function cancelOrder(id: number) {
  return (
    await api.post<UserOrder>(`/api/shop/orders/${id}/cancel/`, undefined, {
      timeout: 30000,
    })
  ).data;
}

/** Read the full recorded timeline for an owned order without reconciling payments. */
export async function fetchOrderHistory(id: number, signal: AbortSignal) {
  return (
    await api.get<OrderHistory>(`/api/shop/orders/${id}/history/`, { signal })
  ).data;
}
