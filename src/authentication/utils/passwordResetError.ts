import axios from "axios";

type ResetErrorBody = {
  detail?: string;
  code?: string;
  retry_after?: number;
  email?: string[];
  otp?: string[];
  new_password?: string[];
};

/** Map the recovery API's validation, cooldown and restart rules for the form. */
export function passwordResetError(error: unknown) {
  if (!axios.isAxiosError<ResetErrorBody>(error) || !error.response) {
    return {
      message: "We couldn't confirm the response. Please try again.",
      uncertain: true,
      restart: false,
      retryAfter: 0,
      field: undefined,
    };
  }
  const { status, data } = error.response;
  const field = data.email
    ? "email"
    : data.otp
      ? "otp"
      : data.new_password
        ? "new_password"
        : undefined;
  return {
    message:
      (field ? data[field]?.[0] : undefined) ??
      data.detail ??
      "We couldn't complete this request. Please try again.",
    uncertain: status >= 500,
    restart:
      data.code === "reset_unavailable" ||
      data.code === "challenge_unavailable" ||
      data.code === "challenge_exhausted",
    retryAfter: data.retry_after ?? 0,
    field,
  };
}
