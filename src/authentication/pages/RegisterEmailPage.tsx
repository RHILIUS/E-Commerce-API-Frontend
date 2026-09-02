import { type ChangeEvent, type SyntheticEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";

import { sendOTPApi } from "../api";
import { useRegistration } from "../contexts/Registration/useRegistration";
import { useCountdown } from "../hooks/useCountdown";
import {
  getRetryAfterSeconds,
  getSendOTPErrorMessage,
} from "../utils/sendOTPError";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const RegisterEmailPage = () => {
  const {
    email: registrationEmail,
    cooldownEndsAt,
    beginRegistration,
  } = useRegistration();

  const navigate = useNavigate();
  const [email, setEmail] = useState(registrationEmail ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedEmail = normalizeEmail(email);
  const cooldownSeconds = useCountdown(cooldownEndsAt);
  const isCoolingDown =
    registrationEmail === normalizedEmail && // Only apply cooldown to the email that triggered it
    cooldownSeconds > 0;
  const emailDescribedBy = [
    errorMessage ? "register-email-error" : null,
    isCoolingDown ? "register-email-cooldown" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const requestedEmail = normalizeEmail(email);

    try {
      const response = await sendOTPApi(requestedEmail);

      beginRegistration(response.email, response.retry_after);
      navigate("/register/verify-otp");
    } catch (error) {
      setErrorMessage(getSendOTPErrorMessage(error));

      const retryAfter = getRetryAfterSeconds(error);

      if (retryAfter) {
        beginRegistration(requestedEmail, retryAfter);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.currentTarget.value);

    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  return (
    <main className="flex items-center justify-center px-4 py-12 sm:px-6">
      <div className="flex w-full max-w-150 flex-col items-center gap-2">
        <h1 className="text-foreground max-w-72.5 text-center text-4xl font-bold text-balance">
          Get Started with E-Commerce
        </h1>

        <div className="flex h-8 w-full items-center" aria-hidden="true">
          <div className="bg-border h-px w-full" />
        </div>

        <Card
          role="region"
          aria-labelledby="register-title"
          className="w-full max-w-145 gap-6 rounded-lg border py-6 shadow-sm ring-0 [--card-spacing:--spacing(6)]"
        >
          <CardHeader className="gap-1.5">
            <CardTitle
              id="register-title"
              role="heading"
              aria-level={2}
              className="text-sm font-bold"
            >
              Register
            </CardTitle>
            <CardDescription className="text-xs leading-4 font-medium">
              Enter your email address to receive a one-time passcode (OTP).
            </CardDescription>
            <CardAction>
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 inline-flex h-9 items-center rounded-lg px-4 font-medium transition-colors"
              >
                Login
              </Link>
            </CardAction>
          </CardHeader>

          <CardContent>
            <form
              className="space-y-6"
              onSubmit={handleSubmit}
              aria-busy={isSubmitting}
            >
              <label className="block space-y-3">
                <span className="block text-sm font-medium">Email</span>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="h-9"
                  onChange={handleChange}
                  value={email}
                  aria-invalid={errorMessage ? true : undefined}
                  aria-describedby={emailDescribedBy || undefined}
                  disabled={isSubmitting}
                  required
                />
              </label>

              {errorMessage && (
                <p
                  id="register-email-error"
                  className="text-destructive text-sm"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              {isCoolingDown && (
                <p
                  id="register-email-cooldown"
                  className="text-muted-foreground text-sm"
                >
                  You can request another code for this email in{" "}
                  <span className="font-medium tabular-nums">
                    {cooldownSeconds}s
                  </span>
                  .
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || isCoolingDown}
              >
                {isSubmitting
                  ? "Sending..."
                  : isCoolingDown
                    ? `Try again in ${cooldownSeconds}s`
                    : "Send OTP"}
              </Button>
            </form>
          </CardContent>

          <div className="flex justify-center px-6">
            <Link
              to="/terms"
              className="text-primary hover:text-primary/80 inline-flex h-9 items-center rounded-lg px-4 font-medium transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default RegisterEmailPage;
