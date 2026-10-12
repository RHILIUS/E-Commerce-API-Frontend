import axios from "axios";

/** Read the recipient API's DRF field errors and distinguish an unconfirmed mutation. */
export function recipientError(error: unknown) {
  const fields: Record<string, string> = {};
  let detail = "";
  const response = axios.isAxiosError(error) ? error.response : undefined;
  const data: unknown = response?.data;
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
  return {
    fields,
    message:
      detail ||
      Object.values(fields).join(" ") ||
      "We couldn't update your recipients. Please try again.",
    uncertain: !response || response.status >= 500 || response.status === 401,
  };
}
