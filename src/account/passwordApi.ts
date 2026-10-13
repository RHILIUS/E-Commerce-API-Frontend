import api from "@/app/api/axios";

export type PasswordCredentials = {
  current_password: string;
  new_password: string;
};

export type PasswordChallenge = {
  challenge_id: string;
  masked_email: string;
  expires_at: string;
  retry_after: number;
};

const endpoint = "/api/account/change-password/";

/** Request a dedicated password-change code for the authenticated account. */
export async function requestPasswordCode(credentials: PasswordCredentials) {
  const response = await api.post<PasswordChallenge>(
    `${endpoint}request/`,
    credentials,
  );
  return response.data;
}

/** Replace the code while retaining server attempt and rate-limit budgets. */
export async function resendPasswordCode(challengeId: string) {
  const response = await api.post<PasswordChallenge>(`${endpoint}resend/`, {
    challenge_id: challengeId,
  });
  return response.data;
}

/** Verify and commit the change in one single-use backend operation. */
export async function confirmPasswordChange(
  credentials: PasswordCredentials,
  challengeId: string,
  otp: string,
) {
  await api.post<{ message: string }>(`${endpoint}confirm/`, {
    ...credentials,
    challenge_id: challengeId,
    otp,
  });
}
