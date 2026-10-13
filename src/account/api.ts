import api from "@/app/api/axios";

import type {
  PhotoCrop,
  Profile,
  ProfileInput,
  ProfilePhoto,
  Recipient,
  RecipientInput,
} from "./types";

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

/** Read the signed-in account's personal details and address. */
export async function fetchProfile(signal?: AbortSignal) {
  return (await api.get<Profile>("/api/account/profile/", { signal })).data;
}
/** Save a complete personal profile; recipients remain independent. */
export async function saveProfile(input: ProfileInput) {
  return (await api.put<Profile>("/api/account/profile/", input)).data;
}

/** Read the photo source and saved crop separately from personal details. */
export async function fetchProfilePhoto(signal?: AbortSignal) {
  return (
    await api.get<ProfilePhoto>("/api/account/profile/photo/", { signal })
  ).data;
}
/** Upload a new source or re-crop the currently saved source. */
export async function saveProfilePhoto(
  crop: PhotoCrop,
  image?: File,
  sourceId?: string,
) {
  const body = image ? new FormData() : { crop, source_id: sourceId };
  if (body instanceof FormData && image) {
    body.append("image", image);
    body.append("crop", JSON.stringify(crop));
  }
  return (await api.put<ProfilePhoto>("/api/account/profile/photo/", body))
    .data;
}
/** Remove the saved avatar and retained source. */
export async function removeProfilePhoto() {
  return (await api.delete<ProfilePhoto>("/api/account/profile/photo/")).data;
}
