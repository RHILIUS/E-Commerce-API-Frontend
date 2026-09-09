import axios from "axios";

import type { RegisterRequest } from "../api";

// Email comes from the verified cookie, but can still receive a conflict error.
export type RegistrationField = keyof RegisterRequest | "email";
export type RegistrationFieldErrors = Partial<
  Record<RegistrationField, string>
>;

type RegistrationError =
  | { kind: "validation"; fields: RegistrationFieldErrors }
  | { kind: "verification" }
  | { kind: "general"; message: string };

const registrationFields: RegistrationField[] = [
  "email",
  "username",
  "full_name",
  "phone_number",
  "country_code",
  "address_line1",
  "address_line2",
  "city",
  "region",
  "postal_code",
  "password",
];

/**
 * Converts API message arrays into one display message per known form field.
 * Ignores malformed values and unknown fields to keep error rendering safe.
 */
function readFieldErrors(
  data: Record<string, unknown>,
): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {};

  for (const field of registrationFields) {
    const messages = data[field];
    if (!Array.isArray(messages)) continue;
    if (!messages.every((message) => typeof message === "string")) continue;

    const message = messages.join(" ").trim();
    if (message) errors[field] = message;
  }

  return errors;
}

/**
 * Translates a failed registration request into the UI action the page needs:
 * field messages, renewed email verification, or a general failure message.
 */
export function getRegistrationError(error: unknown): RegistrationError {
  const fallback: RegistrationError = {
    kind: "general",
    message: "Unable to create your account. Please try again.",
  };

  if (!axios.isAxiosError(error) || !error.response) return fallback;

  const { status, data } = error.response;
  if (!data || typeof data !== "object" || Array.isArray(data)) return fallback;

  if (status === 401 && data.detail === "Registration token is not valid") {
    return { kind: "verification" };
  }

  // Support both field validation (400) and the documented email conflict (409).
  if (status === 400 || status === 409) {
    const fields = readFieldErrors(data);
    if (Object.keys(fields).length > 0) {
      return { kind: "validation", fields };
    }
  }

  return fallback;
}
