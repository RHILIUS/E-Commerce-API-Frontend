import api from "@/app/api/axios";

import type { CartResponse } from "./types";

/** Fetch the signed-in customer's store carts with current prices and stock. */
export const fetchCarts = async (
  signal: AbortSignal,
  displayCurrency?: string,
) =>
  (
    await api.get<CartResponse>("/api/shop/carts/", {
      signal,
      params: { display_currency: displayCurrency },
    })
  ).data;

/** Add units to a product; the server finds or creates the correct store cart. */
export const addToCart = async (productId: number, quantity: number) =>
  (
    await api.post<CartResponse>("/api/shop/carts/items/", {
      product_id: productId,
      quantity,
    })
  ).data;

/** Replace an owned item's quantity after server-side stock validation. */
export const updateCartQuantity = async (
  itemId: number,
  quantity: number,
  displayCurrency?: string,
) =>
  (
    await api.patch<CartResponse>(
      `/api/shop/carts/items/${itemId}/`,
      {
        quantity,
      },
      { params: { display_currency: displayCurrency } },
    )
  ).data;

/** Remove the exact selected item IDs across the customer's store carts. */
export const removeCartItems = async (
  itemIds: number[],
  displayCurrency?: string,
) =>
  (
    await api.delete<CartResponse>("/api/shop/carts/items/", {
      data: { item_ids: itemIds },
      params: { display_currency: displayCurrency },
    })
  ).data;
