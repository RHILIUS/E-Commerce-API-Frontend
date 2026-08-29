import axios from "axios";
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

import { sendOTPApi, type SendOTPErrorResponse } from "../api";

const getSendOTPErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError<SendOTPErrorResponse>(error)) {
    return "Something went wrong. Please try again.";
  }

  const emailError = error.response?.data?.email;

  if (Array.isArray(emailError)) {
    return emailError.join(" ");
  }

  if (emailError) {
    return emailError;
  }

  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (!error.response) {
    return "Unable to connect. Check your internet connection and try again.";
  }

  return "Unable to send the verification code. Please try again.";
};

const RegisterEmailPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await sendOTPApi(email.trim());
      navigate("/register/verify-otp");
    } catch (error) {
      setErrorMessage(getSendOTPErrorMessage(error));
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
                  aria-describedby={
                    errorMessage ? "register-email-error" : undefined
                  }
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

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send OTP"}
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
