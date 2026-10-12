import api from "@/app/api/axios";

import type {
  CheckoutSource,
  Confirmation,
  PaymentMethod,
  PlacementRequest,
  Preview,
  StripePayment,
} from "./types";

/** Request authoritative prices and availability for only the chosen items. */
export async function fetchPreview(
  source: CheckoutSource,
  signal?: AbortSignal,
  paymentMethod: PaymentMethod = "cod",
) {
  return (
    await api.post<Preview>(
      "/api/shop/checkout/preview/",
      { ...source, payment_method: paymentMethod },
      { signal },
    )
  ).data;
}
/** Retry this exact body when the outcome of an earlier request is unknown. */
export async function placeCOD(request: PlacementRequest) {
  return (
    await api.post<Confirmation>("/api/shop/checkouts/", request, {
      timeout: 30000,
    })
  ).data;
}
/** Read persisted purchase snapshots; this never creates another order. */
export async function fetchConfirmation(
  reference: string,
  signal?: AbortSignal,
) {
  return (
    await api.get<Confirmation>(
      `/api/shop/checkouts/${encodeURIComponent(reference)}/`,
      { signal },
    )
  ).data;
}

/** Create or recover the same Stripe test purchase; no card details enter this app. */
export async function placeStripe(request: PlacementRequest) {
  return (
    await api.post<StripePayment>("/api/shop/checkouts/stripe/", request, {
      timeout: 30000,
    })
  ).data;
}
/** Read persisted payment state without creating a session or calling Stripe. */
export async function fetchStripePayment(
  reference: string,
  signal?: AbortSignal,
) {
  return (
    await api.get<StripePayment>(
      `/api/shop/checkouts/${encodeURIComponent(reference)}/payment/`,
      { signal },
    )
  ).data;
}
/** Reconcile the provider state or request cancellation; both operations are safe to retry. */
export async function reconcileStripePayment(
  reference: string,
  cancel = false,
  signal?: AbortSignal,
) {
  return (
    await api.post<StripePayment>(
      `/api/shop/checkouts/${encodeURIComponent(reference)}/payment/${cancel ? "cancel/" : ""}`,
      undefined,
      { timeout: 30000, signal },
    )
  ).data;
}
