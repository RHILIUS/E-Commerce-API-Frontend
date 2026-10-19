import { REGEXP_ONLY_DIGITS } from "input-otp";
import type { SyntheticEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/app/components/ui/input-otp";

import { sendOTPApi, verifyOTPApi } from "../api";
import AuthShell from "../components/AuthShell/AuthShell";
import { INPUT_OTP_COUNT } from "../constants";
import { useRegistration } from "../contexts/Registration/useRegistration";
import { useCountdown } from "../hooks/useCountdown";
import {
  getRetryAfterSeconds,
  getSendOTPErrorMessage,
} from "../utils/sendOTPError";
import { getVerificationErrorMessage } from "../utils/verifyOTPError";

const RegisterOTPPage = () => {
  const navigate = useNavigate();

  const { email, cooldownEndsAt, startOtpCooldown } = useRegistration();
  const cooldownSeconds = useCountdown(cooldownEndsAt);
  const isCoolingDown = cooldownSeconds > 0;

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();

    if (!email || otp.length !== INPUT_OTP_COUNT || isVerifying) {
      return;
    }

    setVerificationError(null);
    setIsVerifying(true);

    try {
      await verifyOTPApi(email, otp);
      navigate("/register/account-details");
    } catch (error) {
      setVerificationError(getVerificationErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || isCoolingDown || isResending || isVerifying) {
      return;
    }

    setResendError(null);
    setResendMessage(null);
    setVerificationError(null);
    setIsResending(true);

    try {
      const response = await sendOTPApi(email);

      startOtpCooldown(response.retry_after);
      setOtp("");
      setResendMessage(
        "A new verification email is queued. Please check your inbox.",
      );
    } catch (error) {
      setResendError(getSendOTPErrorMessage(error));
      const retryAfter = getRetryAfterSeconds(error);

      if (retryAfter) {
        startOtpCooldown(retryAfter);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell step={2}>
      <Card
        role="region"
        aria-labelledby="register-otp-title"
        className="w-full min-w-0 gap-6 rounded-2xl border py-6 shadow-sm ring-0 [--card-spacing:--spacing(5)] sm:py-8 sm:[--card-spacing:--spacing(8)]"
      >
        <CardHeader className="min-w-0 gap-1.5">
          <CardTitle
            id="register-otp-title"
            role="heading"
            aria-level={1}
            className="text-2xl font-semibold tracking-tight"
          >
            Check your email
          </CardTitle>
          <CardDescription className="min-w-0 text-sm leading-relaxed wrap-break-word">
            Your verification email is queued for {email}. Enter the six-digit
            code when it arrives.
          </CardDescription>
        </CardHeader>

        <CardContent className="min-w-0">
          <Link
            to="/register/enter-email"
            className="text-primary mb-5 inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
          >
            Use a different email
          </Link>
          <form
            className="min-w-0 space-y-6"
            onSubmit={handleSubmit}
            aria-busy={isVerifying}
          >
            <div className="flex min-w-0 flex-col items-center gap-1">
              <div className="flex w-full min-w-0 flex-col items-center gap-2">
                <InputOTP
                  maxLength={INPUT_OTP_COUNT}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);

                    if (verificationError) {
                      setVerificationError(null);
                    }
                  }}
                  disabled={isVerifying || isResending}
                  aria-label="Six-digit verification code"
                  aria-invalid={verificationError ? true : undefined}
                  aria-describedby={verificationError ? "otp-error" : undefined}
                  containerClassName="w-full justify-center"
                >
                  <InputOTPGroup>
                    {Array.from({ length: INPUT_OTP_COUNT }, (_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="size-9 shadow-xs"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {verificationError && (
                  <p
                    id="otp-error"
                    className="text-destructive text-center text-sm"
                    role="alert"
                  >
                    {verificationError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-1 text-center text-xs leading-4 font-medium">
                <span className="text-muted-foreground">
                  Didn&apos;t receive a code?
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="min-h-11 px-1 text-xs whitespace-normal"
                  disabled={isCoolingDown || isResending || isVerifying}
                  onClick={handleResend}
                >
                  {isResending
                    ? "Sending..."
                    : isCoolingDown
                      ? `Resend Code in ${cooldownSeconds}s`
                      : "Resend Code"}
                </Button>
              </div>
            </div>
            {resendError && (
              <p className="text-destructive text-center text-sm" role="alert">
                {resendError}
              </p>
            )}

            {resendMessage && (
              <p
                className="text-muted-foreground text-center text-sm"
                role="status"
              >
                {resendMessage}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full"
              disabled={isVerifying || otp.length !== INPUT_OTP_COUNT}
            >
              {isVerifying ? "Verifying..." : "Verify Code"}
            </Button>
          </form>
        </CardContent>

        <div className="flex min-w-0 justify-center px-6">
          <Link
            to="/terms"
            className="text-primary hover:text-primary/80 inline-flex h-9 items-center rounded-lg px-4 text-center font-medium transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </Card>
    </AuthShell>
  );
};

export default RegisterOTPPage;
