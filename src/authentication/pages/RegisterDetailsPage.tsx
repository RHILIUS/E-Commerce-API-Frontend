import axios from "axios";
import { type SyntheticEvent, useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { registerApi, type RegisterRequest } from "@/authentication/api";
import AddressCountryField from "@/authentication/components/AddressCountryField";
import PasswordFields from "@/authentication/components/PasswordFields";
import PhoneNumberField from "@/authentication/components/PhoneNumberField";
import UsernameField from "@/authentication/components/UsernameField";
import { useRegistration } from "@/authentication/contexts/Registration/useRegistration";

const getFormString = (formData: FormData, name: string) => {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
};

const RegisterDetailsPage = () => {
  const { email } = useRegistration();
  const navigate = useNavigate();
  const [isVerificationInvalid, setIsVerificationInvalid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    const formData = new FormData(event.currentTarget);
    const request: RegisterRequest = {
      email,
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
    setSubmissionMessage(null);
    setIsSubmitting(true);

    try {
      const response = await registerApi(request);

      setSubmissionMessage(response.message);
    } catch (error) {
      if (
        axios.isAxiosError<{ detail: string }>(error) &&
        error.response?.status === 401 &&
        error.response.data.detail === "Registration token is not valid"
      ) {
        setIsVerificationInvalid(true);
        return;
      }

      setSubmissionError("Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex items-start justify-center px-4 py-12 sm:px-6 lg:py-25">
      <Card
        role="region"
        aria-labelledby="register-details-title"
        className="w-full max-w-145 gap-6 rounded-lg border py-6 shadow-sm ring-0 [--card-spacing:--spacing(6)]"
      >
        <CardHeader className="min-w-0 gap-1.5">
          <CardTitle
            id="register-details-title"
            role="heading"
            aria-level={1}
            className="text-xl font-bold"
          >
            Register
          </CardTitle>
          <CardDescription className="min-w-0 text-xs leading-4 wrap-break-word">
            Please provide your personal information to set up your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="min-w-0">
          <form
            className="min-w-0 space-y-6"
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
          >
            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-medium">Email</span>
              <Input
                name="email"
                type="email"
                value={email ?? ""}
                autoComplete="email"
                aria-readonly="true"
                className="h-10"
                required
                disabled
              />
            </label>

            <UsernameField />

            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-medium">Full name</span>
              <Input
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                className="h-10"
                required
              />
            </label>

            <PhoneNumberField />

            <section
              aria-labelledby="address-section-title"
              className="border-border min-w-0 space-y-4 border-y py-4"
            >
              <h2 id="address-section-title" className="text-sm font-medium">
                Address
              </h2>

              <AddressCountryField />

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">
                  Address line 1
                </span>
                <Input
                  name="addressLine1"
                  type="text"
                  autoComplete="address-line1"
                  placeholder="House number, street name or area"
                  className="h-10"
                  required
                />
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">
                  Address line 2 (optional)
                </span>
                <Input
                  name="addressLine2"
                  type="text"
                  autoComplete="address-line2"
                  placeholder="Apartment, suite, unit, building, or floor"
                  className="h-10"
                />
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">City / Town</span>
                <Input
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Enter your city or town"
                  className="h-10"
                  required
                />
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">
                  State / Province / Region (optional)
                </span>
                <Input
                  name="stateProvinceRegion"
                  type="text"
                  autoComplete="address-level1"
                  placeholder="Enter your state, province, or region"
                  className="h-10"
                />
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-medium">
                  Postal / ZIP code (optional)
                </span>
                <Input
                  name="postalCode"
                  type="text"
                  autoComplete="postal-code"
                  placeholder="Enter your postal or ZIP code"
                  className="h-10"
                />
              </label>
            </section>

            <PasswordFields />

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

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>

        <div className="flex min-w-0 justify-center px-6">
          <Link
            to="/terms"
            className="text-primary hover:text-primary/80 inline-flex h-9 items-center rounded-lg px-4 text-center text-xs font-medium transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </Card>

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
    </main>
  );
};

export default RegisterDetailsPage;
