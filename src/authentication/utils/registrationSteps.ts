import type {
  RegistrationField,
  RegistrationFieldErrors,
} from "./registerError";

export type RegistrationDetailsStep = 3 | 4 | 5;

const fieldsByStep: Record<RegistrationDetailsStep, RegistrationField[]> = {
  3: ["email", "username", "full_name", "phone_number"],
  4: [
    "country_code",
    "address_line1",
    "address_line2",
    "city",
    "region",
    "postal_code",
  ],
  5: ["password"],
};

/** Return the earliest details step that needs correction after server validation. */
export function getRegistrationErrorStep(
  errors: RegistrationFieldErrors,
): RegistrationDetailsStep {
  for (const step of [3, 4, 5] as const) {
    if (fieldsByStep[step].some((field) => Boolean(errors[field]))) return step;
  }
  return 5;
}
