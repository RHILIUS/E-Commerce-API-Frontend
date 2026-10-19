import { type ChangeEvent, type SyntheticEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";

import { sendOTPApi } from "../api";
import AuthShell from "../components/AuthShell/AuthShell";
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
    <AuthShell step={1}>
      <Card
        role="region"
        aria-labelledby="register-title"
        className="w-full min-w-0 gap-6 rounded-2xl border py-6 shadow-sm ring-0 [--card-spacing:--spacing(5)] sm:py-8 sm:[--card-spacing:--spacing(8)]"
      >
        <CardHeader className="gap-1.5">
          <CardTitle
            id="register-title"
            role="heading"
            aria-level={1}
            className="text-2xl font-semibold tracking-tight"
          >
            Create your account
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            We’ll email you a six-digit verification code.
          </CardDescription>
          <div className="text-muted-foreground mt-2 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary focus-visible:outline-ring rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2"
            >
              Log in
            </Link>
          </div>
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
                placeholder="you@example.com"
                className="h-11"
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
              className="h-11 w-full"
              disabled={isSubmitting || isCoolingDown}
            >
              {isSubmitting ? "Sending..." : "Send verification code"}
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
    </AuthShell>
  );
};

export default RegisterEmailPage;
