import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import {
  fetchCarts,
  removeCartItems,
  updateCartQuantity,
} from "@/ecommerce/cart/api";
import type { CartResponse } from "@/ecommerce/cart/types";
import { useCart } from "@/ecommerce/cart/useCart";

vi.mock("@/ecommerce/cart/api", () => ({
  fetchCarts: vi.fn(),
  removeCartItems: vi.fn(),
  updateCartQuantity: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchCarts).mockResolvedValue({ carts: [] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("refreshes every 15 seconds only while visible and stops after unmount", async () => {
  vi.useFakeTimers();
  const visibility = vi
    .spyOn(document, "visibilityState", "get")
    .mockReturnValue("visible");
  const { unmount } = renderHook(() => useCart());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000);
  });
  expect(fetchCarts).toHaveBeenCalledTimes(2);
  visibility.mockReturnValue("hidden");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(fetchCarts).toHaveBeenCalledTimes(2);
  visibility.mockReturnValue("visible");
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(fetchCarts).toHaveBeenCalledTimes(3);
  unmount();
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(fetchCarts).toHaveBeenCalledTimes(3);
});

test("an older refresh cannot overwrite a mutation and overlapping writes are blocked", async () => {
  const { result } = renderHook(() => useCart());
  await waitFor(() => expect(result.current.data).toEqual({ carts: [] }));
  let resolveRefresh!: (data: CartResponse) => void;
  vi.mocked(fetchCarts).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
  );
  act(() => {
    void result.current.refresh();
  });
  const staleSignal = vi.mocked(fetchCarts).mock.calls[1][0];
  let resolveUpdate!: (data: CartResponse) => void;
  vi.mocked(updateCartQuantity).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
  );
  let mutation!: Promise<boolean>;
  act(() => {
    mutation = result.current.updateQuantity(1, 2);
  });
  expect(staleSignal.aborted).toBe(true);
  expect(result.current.pending).toBe(true);
  await act(async () => {
    expect(await result.current.removeItems([1])).toBe(false);
  });
  expect(removeCartItems).not.toHaveBeenCalled();
  act(() => {
    void result.current.refresh();
  });
  expect(fetchCarts).toHaveBeenCalledTimes(2);
  const updated: CartResponse = {
    carts: [
      {
        id: 1,
        store: { id: 1, name: "Store", profile_image: null },
        items: [],
      },
    ],
  };
  await act(async () => {
    resolveUpdate(updated);
    await mutation;
  });
  await act(async () => {
    resolveRefresh({ carts: [] });
  });
  expect(result.current.data).toEqual(updated);
  expect(result.current.pending).toBe(false);
});
