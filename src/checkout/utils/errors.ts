import axios from "axios";

export type CheckoutError = {
  message: string;
  fields: Record<string, string>;
  uncertain: boolean;
};
/** Parse DRF field errors and preserve unknown placement outcomes for safe retry. */
export function checkoutError(error: unknown): CheckoutError {
  if (!axios.isAxiosError(error))
    return {
      message: "Something went wrong. Please try again.",
      fields: {},
      uncertain: true,
    };
  const status = error.response?.status;
  const data: unknown = error.response?.data;
  const fields: Record<string, string> = {};
  let detail = "";
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (key === "detail" && typeof value === "string") detail = value;
      else if (
        Array.isArray(value) &&
        value.every((item) => typeof item === "string")
      )
        fields[key] = value.join(" ");
    }
  }
  const conflict =
    detail ===
    "This idempotency key has already been used for a different or incomplete purchase.";
  return {
    message:
      detail ||
      Object.values(fields).join(" ") ||
      "We could not reach checkout. Please try again.",
    fields,
    uncertain:
      !status ||
      status >= 500 ||
      status === 401 ||
      conflict ||
      ![400, 404, 409, 429].includes(status),
  };
}
