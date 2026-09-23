import api from "@/app/api/axios";

import type { CartResponse } from "./types";

/** Fetch the signed-in customer's store carts with current prices and stock. */
export const fetchCarts = async (signal: AbortSignal) =>
  (await api.get<CartResponse>("/api/shop/carts/", { signal })).data;

/** Add units to a product; the server finds or creates the correct store cart. */
export const addToCart = async (productId: number, quantity: number) =>
  (
    await api.post<CartResponse>("/api/shop/carts/items/", {
      product_id: productId,
      quantity,
    })
  ).data;

/** Replace an owned item's quantity after server-side stock validation. */
export const updateCartQuantity = async (itemId: number, quantity: number) =>
  (
    await api.patch<CartResponse>(`/api/shop/carts/items/${itemId}/`, {
      quantity,
    })
  ).data;

/** Remove the exact selected item IDs across the customer's store carts. */
export const removeCartItems = async (itemIds: number[]) =>
  (
    await api.delete<CartResponse>("/api/shop/carts/items/", {
      data: { item_ids: itemIds },
    })
  ).data;
