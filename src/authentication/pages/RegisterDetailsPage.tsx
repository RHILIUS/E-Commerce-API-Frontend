import { MapPin, ShieldCheck, UserRound } from "lucide-react";
import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { registerApi, type RegisterRequest } from "@/authentication/api";
import AddressCountryField from "@/authentication/components/AddressCountryField";
import PasswordFields from "@/authentication/components/PasswordFields";
import PhoneNumberField from "@/authentication/components/PhoneNumberField";
import UsernameField from "@/authentication/components/UsernameField";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { useRegistration } from "@/authentication/contexts/Registration/useRegistration";
import {
  getRegistrationError,
  type RegistrationField,
  type RegistrationFieldErrors,
} from "@/authentication/utils/registerError";

import AuthShell from "../components/AuthShell/AuthShell";
import {
  getRegistrationErrorStep,
  type RegistrationDetailsStep,
} from "../utils/registrationSteps";

type RegistrationControl =
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// Read text inputs for the request, treating missing or file values as empty.
const getFormString = (formData: FormData, name: string) => {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
};

const RegisterDetailsPage = () => {
  const { email } = useRegistration();
  const auth = useAuth();
  const navigate = useNavigate();
  const [detailsStep, setDetailsStep] = useState<RegistrationDetailsStep>(3);
  const [furthestStep, setFurthestStep] = useState<RegistrationDetailsStep>(3);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const invalidControlRef = useRef<RegistrationControl | null>(null);

  useEffect(() => {
    if (invalidControlRef.current) {
      invalidControlRef.current.reportValidity();
      invalidControlRef.current.focus();
      invalidControlRef.current = null;
    } else {
      headingRef.current?.focus();
    }
  }, [detailsStep]);

  // Validate only the requested step, revealing it before focusing a hidden error.
  const validateStep = (step: RegistrationDetailsStep) => {
    const controls = formRef.current!.querySelectorAll<RegistrationControl>(
      `[data-details-step="${step}"] input, [data-details-step="${step}"] select, [data-details-step="${step}"] textarea`,
    );
    const invalid = Array.from(controls).find(
      (control) => control.willValidate && !control.checkValidity(),
    );
    if (!invalid) return true;
    if (step === detailsStep) {
      invalid.reportValidity();
      invalid.focus();
    } else {
      invalidControlRef.current = invalid;
      setDetailsStep(step);
    }
    return false;
  };

  const [isVerificationInvalid, setIsVerificationInvalid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});
  // Editing one input clears its server error while preserving other field errors.
  const clearFieldError = (field: RegistrationField) => {
    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  // Connect an input to its accessible error message and clear that error on edit.
  const fieldErrorProps = (field: RegistrationField) => ({
    "aria-invalid": Boolean(fieldErrors[field]) || undefined,
    "aria-describedby": fieldErrors[field]
      ? `register-${field}-error`
      : undefined,
    onChange: () => clearFieldError(field),
  });
  // Use the same message ID referenced by fieldErrorProps for screen readers.
  const renderFieldError = (field: RegistrationField) =>
    fieldErrors[field] && (
      <span
        id={`register-${field}-error`}
        className="text-destructive block text-xs wrap-break-word"
        role="alert"
      >
        {fieldErrors[field]}
      </span>
    );
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null,
  );
  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();

    if (!email || isSubmitting) {
      return;
    }

    if (!validateStep(detailsStep)) return;
    if (detailsStep < 5) {
      const nextStep = (detailsStep + 1) as RegistrationDetailsStep;
      setFurthestStep(
        (previous) => Math.max(previous, nextStep) as RegistrationDetailsStep,
      );
      setDetailsStep(nextStep);
      return;
    }
    // Recheck earlier steps before the single account-creation request.
    if (!validateStep(3) || !validateStep(4)) return;

    const formData = new FormData(event.currentTarget);
    const request: RegisterRequest = {
      username: getFormString(formData, "username"),
      full_name: getFormString(formData, "fullName"),
      phone_number: getFormString(formData, "phoneNumber"),
      country_code: getFormString(formData, "addressCountry"),
      address_line1: getFormString(formData, "addressLine1"),
      address_line2: getFormString(formData, "addressLine2"),
      city: getFormString(formData, "city"),
      region: getFormString(formData, "stateProvinceRegion"),
      postal_code: getFormString(formData, "postalCode"),
      password: getFormString(formData, "password"),
    };

    setSubmissionError(null);
    setFieldErrors({});
    setSubmissionMessage(null);
    setIsSubmitting(true);

    try {
      const response = await registerApi(request);
      setSubmissionMessage(response.message);
    } catch (error) {
      setIsSubmitting(false);
      const registrationError = getRegistrationError(error);

      if (registrationError.kind === "validation") {
        setFieldErrors(registrationError.fields);
        setDetailsStep(getRegistrationErrorStep(registrationError.fields));
        return;
      }

      if (registrationError.kind === "verification") {
        setIsVerificationInvalid(true);
        return;
      }

      setSubmissionError(registrationError.message);
      return;
    }

    // Establish a normal session after creating the account.
    try {
      await auth.login(email, request.password);
      navigate("/", { replace: true });
    } catch {
      navigate("/login", {
        replace: true,
        state: { email, registrationSucceeded: true },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      step={detailsStep}
      detailsNavigation={{
        furthestStep,
        disabled: isSubmitting,
        onStepChange: setDetailsStep,
      }}
    >
      <div className="min-w-0 space-y-6">
        <header className="space-y-2">
          <h1
            id="register-details-title"
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight"
          >
            {detailsStep === 3
              ? "Your personal details"
              : detailsStep === 4
                ? "Your address"
                : "Secure your account"}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {detailsStep === 3
              ? "Let’s start with the basics."
              : detailsStep === 4
                ? "Add the address for your account."
                : "Choose a password to finish creating your account."}
          </p>
        </header>

        <form
          ref={formRef}
          noValidate
          className="flex min-w-0 flex-col gap-5"
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
        >
          <fieldset
            hidden={detailsStep !== 3}
            data-details-step="3"
            className="m-0 min-w-0 border-0 p-0"
          >
            <Card
              role="region"
              aria-labelledby="personal-section-title"
              className="min-w-0 gap-5 rounded-2xl border p-5 shadow-sm ring-0 sm:p-8"
            >
              <h2
                id="personal-section-title"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <UserRound
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden="true"
                />
                Personal details
              </h2>
              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">Email</span>
                <Input
                  name="email"
                  {...fieldErrorProps("email")}
                  type="email"
                  value={email ?? ""}
                  autoComplete="email"
                  aria-readonly="true"
                  className="h-10"
                  required
                  disabled
                />
                {renderFieldError("email")}
              </label>

              {fieldErrors.email && (
                <p className="text-sm">
                  <Link to="/login" className="text-primary underline">
                    Log in
                  </Link>
                  {" or "}
                  <Link
                    to="/register/enter-email"
                    className="text-primary underline"
                  >
                    use a different email
                  </Link>
                  .
                </p>
              )}

              <UsernameField
                serverError={fieldErrors.username}
                onValueChange={() => clearFieldError("username")}
              />

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">Full name</span>
                <Input
                  name="fullName"
                  {...fieldErrorProps("full_name")}
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Alex Santos"
                  className="h-10"
                  required
                />
                {renderFieldError("full_name")}
              </label>

              <PhoneNumberField
                serverError={fieldErrors.phone_number}
                onValueChange={() => clearFieldError("phone_number")}
              />
            </Card>
          </fieldset>

          <fieldset
            hidden={detailsStep !== 4}
            data-details-step="4"
            className="m-0 min-w-0 border-0 p-0"
          >
            <Card
              role="region"
              aria-labelledby="address-section-title"
              className="min-w-0 gap-5 rounded-2xl border p-5 shadow-sm ring-0 sm:p-8"
            >
              <h2
                id="address-section-title"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <MapPin
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden="true"
                />
                Address
              </h2>

              <AddressCountryField
                serverError={fieldErrors.country_code}
                onValueChange={() => clearFieldError("country_code")}
              />

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">
                  Address line 1
                </span>
                <Input
                  name="addressLine1"
                  {...fieldErrorProps("address_line1")}
                  type="text"
                  autoComplete="address-line1"
                  placeholder="e.g. 123 Mabini Street"
                  className="h-10"
                  required
                />
                {renderFieldError("address_line1")}
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">
                  Address line 2 (optional)
                </span>
                <Input
                  name="addressLine2"
                  {...fieldErrorProps("address_line2")}
                  type="text"
                  autoComplete="address-line2"
                  placeholder="e.g. Unit 4B, Sampaguita Building"
                  className="h-10"
                />
                {renderFieldError("address_line2")}
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">City / Town</span>
                <Input
                  name="city"
                  {...fieldErrorProps("city")}
                  type="text"
                  autoComplete="address-level2"
                  placeholder="e.g. Quezon City"
                  className="h-10"
                  required
                />
                {renderFieldError("city")}
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">
                  State / Province / Region (optional)
                </span>
                <Input
                  name="stateProvinceRegion"
                  {...fieldErrorProps("region")}
                  type="text"
                  autoComplete="address-level1"
                  placeholder="e.g. Metro Manila"
                  className="h-10"
                />
                {renderFieldError("region")}
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">
                  Postal / ZIP code (optional)
                </span>
                <Input
                  name="postalCode"
                  {...fieldErrorProps("postal_code")}
                  type="text"
                  autoComplete="postal-code"
                  placeholder="e.g. 1100"
                  className="h-10"
                />
                {renderFieldError("postal_code")}
              </label>
            </Card>
          </fieldset>

          <fieldset
            hidden={detailsStep !== 5}
            data-details-step="5"
            className="m-0 min-w-0 border-0 p-0"
          >
            <Card
              role="region"
              aria-labelledby="security-section-title"
              className="min-w-0 gap-5 rounded-2xl border p-5 shadow-sm ring-0 sm:p-8"
            >
              <h2
                id="security-section-title"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <ShieldCheck
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden="true"
                />
                Account security
              </h2>
              <PasswordFields
                serverError={fieldErrors.password}
                onValueChange={() => clearFieldError("password")}
              />
            </Card>
          </fieldset>

          {submissionError && (
            <p className="text-destructive text-sm" role="alert">
              {submissionError}
            </p>
          )}

          {submissionMessage && (
            <p className="text-muted-foreground text-sm" role="status">
              {submissionMessage}
            </p>
          )}

          <div className="flex gap-3">
            {detailsStep > 3 && (
              <Button
                type="button"
                variant="outline"
                className="h-11 px-5"
                disabled={isSubmitting}
                onClick={() =>
                  setDetailsStep((detailsStep - 1) as RegistrationDetailsStep)
                }
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              size="lg"
              className="h-11 flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Creating account..."
                : detailsStep === 5
                  ? "Create account"
                  : "Continue"}
            </Button>
          </div>
        </form>
      </div>

      <AlertDialog open={isVerificationInvalid}>
        <AlertDialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Verify your email again</AlertDialogTitle>
            <AlertDialogDescription>
              We couldn’t create your account because your email verification is
              no longer valid. Please request a new code and verify your email
              again to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              size="lg"
              onClick={() =>
                navigate("/register/enter-email", { replace: true })
              }
            >
              Verify email again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthShell>
  );
};

export default RegisterDetailsPage;
