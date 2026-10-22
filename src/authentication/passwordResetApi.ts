import api from "@/app/api/axios";

export type ResetChallenge = {
  challenge_id: string;
  expires_at: string;
  retry_after: number;
  message: string;
};

export type ResetVerification = {
  expires_at: string;
  message: string;
};

const root = "/api/auth/forgot-password/";

/** Obtain a masked CSRF token for each operation; browser cookies carry reset permission. */
async function resetPost<T>(operation: string, body: object): Promise<T> {
  const csrf = await api.get<{ csrf_token: string }>(root);
  const response = await api.post<T>(`${root}${operation}/`, body, {
    headers: { "X-CSRFToken": csrf.data.csrf_token },
  });
  return response.data;
}

/** Request a code without learning whether this email belongs to an account. */
export const requestResetCode = (email: string) =>
  resetPost<ResetChallenge>("request", { email });

/** Replace the previous code while retaining the server's durable attempt budget. */
export const resendResetCode = (email: string, challengeId: string) =>
  resetPost<ResetChallenge>("resend", { email, challenge_id: challengeId });

/** Verify the code; reset authorization is set only as an HttpOnly cookie. */
export const verifyResetCode = (
  email: string,
  challengeId: string,
  otp: string,
) =>
  resetPost<ResetVerification>("verify", {
    email,
    challenge_id: challengeId,
    otp,
  });

/** Save once; the caller must handle an uncertain response without replaying it. */
export const confirmPasswordReset = (newPassword: string) =>
  resetPost<{ message: string }>("confirm", { new_password: newPassword });
