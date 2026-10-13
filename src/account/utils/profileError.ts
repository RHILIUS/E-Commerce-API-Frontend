import axios from "axios";

/** Flatten the profile API's nested address errors into form field names. */
export function profileError(error: unknown) {
  const fields: Record<string, string> = {};
  const response = axios.isAxiosError(error) ? error.response : undefined;
  const data: unknown = response?.data;
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (
        key === "address" &&
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        for (const [field, messages] of Object.entries(value)) {
          if (
            Array.isArray(messages) &&
            messages.every((item) => typeof item === "string")
          )
            fields[field] = messages.join(" ");
        }
      } else if (
        Array.isArray(value) &&
        value.every((item) => typeof item === "string")
      ) {
        fields[key] = value.join(" ");
      }
    }
  }
  return {
    fields,
    message: Object.keys(fields).length
      ? "Check the highlighted fields and try again."
      : "We couldn't save your profile. Please try again.",
    uncertain: !response || response.status >= 500,
  };
}
