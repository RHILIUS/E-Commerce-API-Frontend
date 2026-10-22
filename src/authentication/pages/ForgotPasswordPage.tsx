import { REGEXP_ONLY_DIGITS } from "input-otp";
import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/app/components/ui/input-otp";

import AuthShell from "../components/AuthShell/AuthShell";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from "../constants";
import { usePasswordReset } from "../hooks/usePasswordReset";

/** Keep each recovery phase focused; unmount password fields whenever verification restarts. */
export default function ForgotPasswordPage() {
  const location = useLocation();
  const initial = location.state as { email?: string } | null;
  const flow = usePasswordReset(initial?.email ?? "");
  const [otp, setOtp] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [flow.step]);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (flow.step === "email") void flow.request();
    else void flow.verify(otp);
  };

  return (
    <AuthShell>
      <Card className="w-full min-w-0 gap-0 rounded-2xl border p-5 shadow-sm ring-0 sm:p-8">
        <header className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">
            Step {flow.step === "email" ? 1 : flow.step === "otp" ? 2 : 3} of 3
          </p>
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight"
          >
            {flow.step === "email"
              ? "Forgot password?"
              : flow.step === "otp"
                ? "Check your email"
                : "Set a new password"}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed wrap-break-word">
            {flow.step === "email"
              ? "Enter your account email to request a verification code."
              : flow.step === "otp"
                ? `If an account exists for ${flow.email}, we'll send a verification code. Check your inbox and spam folder.`
                : "Choose a new password. Saving it signs you out on all devices."}
          </p>
        </header>

        {flow.step === "password" ? (
          <ResetPasswordForm
            busy={flow.busy}
            expired={flow.expired}
            fieldError={
              flow.error?.field === "new_password"
                ? flow.error.message
                : undefined
            }
            confirm={flow.confirm}
          />
        ) : (
          <form
            onSubmit={submit}
            aria-busy={flow.busy}
            className="mt-7 min-w-0 space-y-5"
          >
            {flow.step === "email" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium">Email</span>
                <Input
                  className="h-11"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={flow.email}
                  onChange={(event) => flow.setEmail(event.target.value)}
                  required
                  maxLength={254}
                  disabled={flow.busy}
                  aria-invalid={flow.error?.field === "email" || undefined}
                  aria-describedby={
                    flow.error?.field === "email" ? "reset-error" : undefined
                  }
                />
              </label>
            ) : (
              <>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={otp}
                  onChange={setOtp}
                  autoComplete="one-time-code"
                  disabled={flow.busy}
                  aria-label="Six-digit verification code"
                  aria-describedby={
                    flow.error
                      ? "reset-code-help reset-error"
                      : "reset-code-help"
                  }
                  aria-invalid={flow.error ? true : undefined}
                  containerClassName="w-full justify-center"
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="size-9"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <p
                  id="reset-code-help"
                  className="text-muted-foreground text-center text-sm"
                >
                  {flow.expired
                    ? "This code has expired. Request a new code."
                    : "Enter the six-digit code from your latest email."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full whitespace-normal"
                  disabled={flow.busy || flow.cooldown > 0}
                  onClick={() => {
                    setOtp("");
                    void flow.resend();
                  }}
                >
                  {flow.cooldown > 0
                    ? `Resend code in ${flow.cooldown}s`
                    : "Resend code"}
                </Button>
              </>
            )}
            <Button
              type="submit"
              className="min-h-11 w-full whitespace-normal"
              disabled={
                flow.busy ||
                (flow.step === "email"
                  ? flow.cooldown > 0
                  : otp.length !== 6 || flow.expired)
              }
            >
              {flow.busy
                ? "Please wait…"
                : flow.step === "email"
                  ? flow.cooldown > 0
                    ? `Send code in ${flow.cooldown}s`
                    : "Send verification code"
                  : "Verify code"}
            </Button>
          </form>
        )}

        {flow.step === "password" && flow.expired && (
          <p className="text-muted-foreground mt-4 text-sm">
            Reset permission has expired. Verify your email again.
          </p>
        )}
        {flow.error && flow.error.field !== "new_password" && (
          <p
            id="reset-error"
            className="text-destructive mt-4 text-sm wrap-break-word"
            role="alert"
          >
            {flow.error.message}
          </p>
        )}
        {flow.step !== "email" && (
          <Button
            type="button"
            variant="link"
            className="mt-3 min-h-11 whitespace-normal"
            disabled={flow.busy}
            onClick={() => {
              setOtp("");
              flow.restart();
            }}
          >
            {flow.step === "otp"
              ? "Use a different email"
              : "Restart email verification"}
          </Button>
        )}
        <Link
          to="/login"
          className="text-primary focus-visible:outline-ring mt-4 inline-flex min-h-11 items-center justify-center rounded-sm text-sm underline-offset-4 hover:underline focus-visible:outline-2"
        >
          Back to login
        </Link>
      </Card>
    </AuthShell>
  );
}

/** Own password drafts locally so returning to email clears sensitive input. */
function ResetPasswordForm({
  busy,
  expired,
  fieldError,
  confirm,
}: {
  busy: boolean;
  expired: boolean;
  fieldError?: string;
  confirm: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const confirmationInput = useRef<HTMLInputElement>(null);

  return (
    <form
      className="mt-7 min-w-0 space-y-5"
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (password !== confirmation) {
          setMismatch(true);
          confirmationInput.current?.focus();
          return;
        }
        void confirm(password);
      }}
    >
      <label className="block space-y-2">
        <span id="reset-new-label" className="text-sm font-medium">
          New password
        </span>
        <Input
          name="new_password"
          aria-labelledby="reset-new-label"
          className="h-11"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setMismatch(false);
          }}
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          pattern={PASSWORD_PATTERN}
          required
          disabled={busy || expired}
          aria-invalid={Boolean(fieldError) || undefined}
          aria-describedby={
            fieldError
              ? "reset-password-help reset-password-error"
              : "reset-password-help"
          }
        />
        <span
          id="reset-password-help"
          className="text-muted-foreground block text-xs leading-relaxed"
        >
          Use 8–64 characters with an uppercase letter, a lowercase letter and a
          number.
        </span>
        {fieldError && (
          <span
            id="reset-password-error"
            role="alert"
            className="text-destructive block text-sm"
          >
            {fieldError}
          </span>
        )}
      </label>
      <label className="block space-y-2">
        <span id="reset-confirm-label" className="text-sm font-medium">
          Confirm new password
        </span>
        <Input
          ref={confirmationInput}
          name="confirm_password"
          aria-labelledby="reset-confirm-label"
          className="h-11"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => {
            setConfirmation(event.target.value);
            setMismatch(false);
          }}
          required
          maxLength={PASSWORD_MAX_LENGTH}
          disabled={busy || expired}
          aria-invalid={mismatch || undefined}
          aria-describedby={mismatch ? "reset-match-error" : undefined}
        />
        {mismatch && (
          <span
            id="reset-match-error"
            role="alert"
            className="text-destructive block text-sm"
          >
            Passwords do not match.
          </span>
        )}
      </label>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        aria-pressed={visible}
        disabled={busy}
        onClick={() => setVisible(!visible)}
      >
        {visible ? "Hide passwords" : "Show passwords"}
      </Button>
      <Button
        type="submit"
        className="min-h-11 w-full"
        disabled={busy || expired}
      >
        {busy ? "Saving…" : "Reset password"}
      </Button>
    </form>
  );
}
