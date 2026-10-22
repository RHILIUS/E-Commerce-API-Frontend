import api from "@/app/api/axios";

import type { Profile, ProfileInput } from "../types";

/** Read the signed-in account's personal details and address. */
export async function fetchProfile(signal?: AbortSignal) {
  return (await api.get<Profile>("/api/account/profile/", { signal })).data;
}
/** Save a complete personal profile; recipients remain independent. */
export async function saveProfile(input: ProfileInput) {
  return (await api.put<Profile>("/api/account/profile/", input)).data;
}
