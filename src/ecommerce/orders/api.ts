import api from "@/app/api/axios";

import type { OrderPage, OrderTab, UserOrder } from "./types";

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
