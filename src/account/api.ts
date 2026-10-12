import api from "@/app/api/axios";

import type { Recipient, RecipientInput } from "./types";

/** Load only the authenticated customer's active saved recipients. */
export async function fetchRecipients(signal?: AbortSignal) {
  return (
    await api.get<{ recipients: Recipient[] }>("/api/account/recipients/", {
      signal,
    })
  ).data.recipients;
}
/** Save a new address; callers reconcile unknown outcomes before retrying. */
export async function createRecipient(recipient: RecipientInput) {
  return (await api.post<Recipient>("/api/account/recipients/", recipient))
    .data;
}
/** Update contact details or atomically replace the account's default. */
export async function updateRecipient(
  id: number,
  recipient: Partial<RecipientInput>,
) {
  return (
    await api.patch<Recipient>(`/api/account/recipients/${id}/`, recipient)
  ).data;
}
/** Remove from the address book, retaining historical orders; return the authoritative remaining list. */
export async function deleteRecipient(
  id: number,
  replacementDefaultId?: number,
) {
  return (
    await api.delete<{ recipients: Recipient[] }>(
      `/api/account/recipients/${id}/`,
      {
        params:
          replacementDefaultId === undefined
            ? undefined
            : { replacement_default_id: replacementDefaultId },
      },
    )
  ).data.recipients;
}
