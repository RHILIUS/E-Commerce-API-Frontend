import type { CheckoutSource, PlacementRequest } from "../types";

export type SavedAttempt = { request: PlacementRequest; reference?: string };
export type RecoveryState = { attempt: SavedAttempt | null; error: string };

/** Keep one recovery record per product or canonical cart selection, across payment methods. */
export function recoveryKey(userId: number, source: CheckoutSource | null) {
  if (!source) return null;
  const selection =
    source.source === "product"
      ? `product:${source.product_id}`
      : `cart:${[...source.item_ids].sort((a, b) => a - b).join(",")}`;
  return `checkout:attempt:${userId}:${selection}`;
}

/** Reject damaged recovery data for this selection rather than risking another purchase. */
export function readAttempt(key: string | null): RecoveryState {
  try {
    const raw = key ? sessionStorage.getItem(key) : null;
    if (!raw) return { attempt: null, error: "" };
    const data = JSON.parse(raw) as SavedAttempt;
    if (
      !data?.request ||
      typeof data.request.preview_token !== "string" ||
      !Number.isSafeInteger(data.request.recipient_id) ||
      data.request.recipient_id < 1 ||
      !["cod", "stripe"].includes(data.request.payment_method) ||
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

/** Remove only this account's matching reference; other purchases remain recoverable. */
export function clearConfirmedAttempt(userId: number, reference: string) {
  try {
    const prefix = `checkout:attempt:${userId}:`;
    const keys = Object.keys(sessionStorage).filter(
      (key) => key.startsWith(prefix) || key === `checkout:cod:${userId}`,
    );
    for (const key of keys) {
      if (readAttempt(key).attempt?.reference === reference)
        sessionStorage.removeItem(key);
    }
  } catch {
    // Keep the saved request when browser storage cannot be accessed.
  }
}
