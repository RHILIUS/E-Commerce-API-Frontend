import axios from "axios";

export type PasswordFieldErrors = Partial<
  Record<"current_password" | "new_password" | "otp", string>
>;

type PasswordChangeErrorBody = {
  detail?: string;
  code?: string;
  retry_after?: number;
  current_password?: string[];
  new_password?: string[];
  otp?: string[];
};

/** Map the password-change contract to UI errors, cooldown and restart behavior. */
export function passwordChangeError(error: unknown) {
  const response = axios.isAxiosError<PasswordChangeErrorBody>(error)
    ? error.response
    : undefined;
  const body = response?.data;
  const fields: PasswordFieldErrors = {};
  for (const field of ["current_password", "new_password", "otp"] as const) {
    const messages = body?.[field];
    if (
      Array.isArray(messages) &&
      messages.every((item) => typeof item === "string")
    ) {
      fields[field] = messages.join(" ");
    }
  }
  return {
    fields,
    message:
      typeof body?.detail === "string"
        ? body.detail
        : Object.keys(fields).length
          ? "Check the highlighted fields and try again."
          : "We couldn't complete the request. Please try again.",
    retryAfter:
      typeof body?.retry_after === "number" && Number.isFinite(body.retry_after)
        ? Math.max(0, body.retry_after)
        : 0,
    restart:
      body?.code === "challenge_unavailable" ||
      body?.code === "challenge_exhausted",
    expired: body?.code === "code_expired",
    uncertain: !response || response.status >= 500,
  };
}
