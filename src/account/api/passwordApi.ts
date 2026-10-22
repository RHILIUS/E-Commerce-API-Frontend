import api from "@/app/api/axios";

export type PasswordBootstrap = {
  csrf_token: string;
  masked_email: string;
};

export type PasswordChallenge = {
  challenge_id: string;
  masked_email: string;
  expires_at: string;
  retry_after: number;
};

export type PasswordVerification = {
  expires_at: string;
  message: string;
};

const endpoint = "/api/account/change-password/";

/** Load the fixed email destination and a fresh CSRF token without issuing a code. */
export async function fetchPasswordBootstrap(signal?: AbortSignal) {
  const response = await api.get<PasswordBootstrap>(endpoint, { signal });
  return response.data;
}

/** Send the explicit CSRF header; the browser carries the separate HttpOnly permission. */
async function passwordPost<T>(operation: string, body: object, csrf: string) {
  const response = await api.post<T>(`${endpoint}${operation}/`, body, {
    headers: { "X-CSRFToken": csrf },
  });
  return response.data;
}

/** Request a code for the authenticated account without collecting a password draft. */
export const requestPasswordCode = (csrf: string) =>
  passwordPost<PasswordChallenge>("request", {}, csrf);

/** Replace both code and identifier while retaining durable server budgets. */
export const resendPasswordCode = (challengeId: string, csrf: string) =>
  passwordPost<PasswordChallenge>(
    "resend",
    { challenge_id: challengeId },
    csrf,
  );

/** Consume an OTP and let the backend set temporary permission; do not change the password. */
export const verifyPasswordCode = (
  challengeId: string,
  otp: string,
  csrf: string,
) =>
  passwordPost<PasswordVerification>(
    "verify",
    { challenge_id: challengeId, otp },
    csrf,
  );

/** Save once using verified permission; uncertain responses must not trigger replay. */
export const confirmPasswordChange = (newPassword: string, csrf: string) =>
  passwordPost<{ message: string }>(
    "confirm",
    { new_password: newPassword },
    csrf,
  );
