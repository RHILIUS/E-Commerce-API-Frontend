import api from "@/app/api/axios";

import type {
  CheckoutSource,
  Confirmation,
  PlacementRequest,
  Preview,
  Recipient,
} from "./types";

/** Request authoritative prices and availability for only the chosen items. */
export async function fetchPreview(
  source: CheckoutSource,
  signal?: AbortSignal,
) {
  return (
    await api.post<Preview>("/api/shop/checkout/preview/", source, { signal })
  ).data;
}
/** Saved recipients are scoped to the authenticated account. */
export async function fetchRecipients(signal?: AbortSignal) {
  return (
    await api.get<{ recipients: Recipient[] }>("/api/account/recipients/", {
      signal,
    })
  ).data.recipients;
}
/** Persist a recipient before selecting it for checkout. */
export async function createRecipient(recipient: Omit<Recipient, "id">) {
  return (await api.post<Recipient>("/api/account/recipients/", recipient))
    .data;
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

/** Update an owned saved recipient without changing its identity. */
export async function updateRecipient(
  id: number,
  recipient: Omit<Recipient, "id">,
) {
  return (
    await api.patch<Recipient>(`/api/account/recipients/${id}/`, recipient)
  ).data;
}
