import api from "@/app/api/axios";

import type { PhotoCrop, ProfilePhoto } from "../types";

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
