import { REGEXP_ONLY_DIGITS } from "input-otp";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";

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

const RegisterOTPPage = () => {
  const INPUT_OTP_COUNT = 6;

  const handleSubmit = (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();
  };

  return (
    <main className="flex items-center justify-center px-4 py-12 sm:px-6">
      <Card
        role="region"
        aria-labelledby="register-otp-title"
        className="w-full max-w-145 gap-6 rounded-lg border py-6 shadow-sm ring-0 [--card-spacing:--spacing(6)]"
      >
        <CardHeader className="min-w-0 gap-1.5">
          <CardTitle
            id="register-otp-title"
            role="heading"
            aria-level={1}
            className="text-sm font-bold"
          >
            Register
          </CardTitle>
          <CardDescription className="min-w-0 text-xs leading-4 font-medium wrap-break-word">
            Kindly enter the six-digit verification code we sent to your email
            address.
          </CardDescription>
        </CardHeader>

        <CardContent className="min-w-0">
          <form className="min-w-0 space-y-6" onSubmit={handleSubmit}>
            <div className="flex min-w-0 flex-col items-center gap-1">
              <div className="flex w-full min-w-0 flex-col items-center gap-2">
                <InputOTP
                  maxLength={INPUT_OTP_COUNT}
                  pattern={REGEXP_ONLY_DIGITS}
                  aria-label="Six-digit verification code"
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
                <p className="text-center text-sm leading-5">
                  Enter your one-time password.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-1 text-center text-xs leading-4 font-medium">
                <span className="text-muted-foreground">
                  Didn&apos;t receive a code?
                </span>
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 rounded-lg transition-colors"
                >
                  Resend Code
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Verify Code
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
    </main>
  );
};

export default RegisterOTPPage;
