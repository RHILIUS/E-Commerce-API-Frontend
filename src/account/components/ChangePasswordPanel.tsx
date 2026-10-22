import { REGEXP_ONLY_DIGITS } from "input-otp";
import { type SyntheticEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/app/components/ui/input-otp";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from "@/authentication/constants";

import { useChangePassword } from "../hooks/useChangePassword";

/** Verify the fixed account email before mounting a fresh password form. */
export function ChangePasswordPanel({ active = true }: { active?: boolean }) {
  const flow = useChangePassword();
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(flow.step);

  useEffect(() => {
    if (active && previousStep.current !== flow.step) heading.current?.focus();
    previousStep.current = flow.step;
  }, [active, flow.step]);

  return (
    <section
      className="bg-card min-w-0 space-y-5 rounded-xl border p-4 sm:p-6"
      aria-labelledby="change-password-heading"
      aria-busy={flow.loading || flow.busy}
    >
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">
          Step {flow.step === "email" ? 1 : flow.step === "otp" ? 2 : 3} of 3
        </p>
        <h2
          ref={heading}
          id="change-password-heading"
          tabIndex={-1}
          className="text-xl"
        >
          {flow.step === "email"
            ? "Change password"
            : flow.step === "otp"
              ? "Check your email"
              : "Choose a new password"}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed wrap-break-word">
          {flow.step === "email"
            ? "Verify your account email to choose a new password."
            : flow.step === "otp"
              ? "We’ve queued a verification code for your account email. Enter the six-digit code when it arrives."
              : "Saving your new password signs you out on all devices."}
        </p>
      </header>

      {flow.loading ? (
        <p className="text-muted-foreground text-sm" role="status">
          Loading account email…
        </p>
      ) : flow.loadError ? (
        <div className="space-y-3">
          <p className="text-destructive text-sm wrap-break-word" role="alert">
            {flow.loadError}
          </p>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={flow.retryLoad}
          >
            Try again
          </Button>
        </div>
      ) : flow.step === "email" ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed wrap-break-word">
            We’ll send a verification code to your account email.
          </p>
          <Button
            className="min-h-11 w-full whitespace-normal sm:w-auto"
            disabled={flow.busy || flow.cooldown > 0}
            onClick={() => void flow.request()}
          >
            {flow.busy
              ? "Sending…"
              : flow.cooldown > 0
                ? `Send code in ${flow.cooldown}s`
                : "Send verification code"}
          </Button>
        </div>
      ) : flow.step === "otp" ? (
        <VerificationForm
          busy={flow.busy}
          expired={flow.expired}
          cooldown={flow.cooldown}
          fieldError={flow.fields.otp}
          verify={flow.verify}
          resend={flow.resend}
        />
      ) : (
        <NewPasswordForm
          busy={flow.busy}
          expired={flow.expired}
          fieldError={flow.fields.new_password}
          confirm={flow.confirm}
        />
      )}

      {flow.message && Object.keys(flow.fields).length === 0 && (
        <p className="text-destructive text-sm wrap-break-word" role="alert">
          {flow.message}
        </p>
      )}
      {flow.step !== "email" && (
        <Button
          type="button"
          variant="link"
          className="min-h-11 whitespace-normal"
          disabled={flow.busy}
          onClick={flow.restart}
        >
          Restart email verification
        </Button>
      )}
    </section>
  );
}

/** Keep the code local so leaving verification clears the previous code input. */
function VerificationForm({
  busy,
  expired,
  cooldown,
  fieldError,
  verify,
  resend,
}: {
  busy: boolean;
  expired: boolean;
  cooldown: number;
  fieldError?: string;
  verify: (otp: string) => Promise<void>;
  resend: () => Promise<void>;
}) {
  const [otp, setOtp] = useState("");
  return (
    <form
      className="min-w-0 space-y-4"
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && !expired && otp.length === 6) void verify(otp);
      }}
    >
      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        value={otp}
        onChange={setOtp}
        autoComplete="one-time-code"
        disabled={busy}
        aria-label="Six-digit verification code"
        aria-invalid={Boolean(fieldError) || undefined}
        aria-describedby={
          [expired && "password-code-help", fieldError && "password-code-error"]
            .filter(Boolean)
            .join(" ") || undefined
        }
        containerClassName="w-full justify-center"
      >
        <InputOTPGroup>
          {Array.from({ length: 6 }, (_, index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className="size-9"
              aria-invalid={Boolean(fieldError) || undefined}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {expired && (
        <p
          id="password-code-help"
          className="text-muted-foreground text-center text-sm"
          role="status"
        >
          This code has expired. Request a new code.
        </p>
      )}
      {fieldError && (
        <p
          id="password-code-error"
          className="text-destructive text-sm"
          role="alert"
        >
          {fieldError}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button
          type="submit"
          className="min-h-11 whitespace-normal sm:flex-1"
          disabled={busy || expired || otp.length !== 6}
        >
          {busy ? "Please wait…" : "Verify code"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 whitespace-normal sm:flex-1"
          disabled={busy || cooldown > 0}
          onClick={() => {
            setOtp("");
            void resend();
          }}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </Button>
      </div>
    </form>
  );
}

/** Unmount password drafts when verification restarts or the account page closes. */
function NewPasswordForm({
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const confirmationRef = useRef<HTMLInputElement>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || expired) return;
    if (newPassword !== confirmation) {
      setMismatch(true);
      confirmationRef.current?.focus();
      return;
    }
    void confirm(newPassword);
  };

  return (
    <form className="min-w-0 space-y-4" onSubmit={submit} aria-busy={busy}>
      <label className="block space-y-2">
        <span id="new-password-label" className="text-sm font-medium">
          New password
        </span>
        <Input
          className="h-11"
          name="new_password"
          aria-labelledby="new-password-label"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setMismatch(false);
          }}
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          pattern={PASSWORD_PATTERN}
          disabled={busy || expired}
          aria-invalid={Boolean(fieldError) || undefined}
          aria-describedby={
            fieldError
              ? "new-password-help new-password-error"
              : "new-password-help"
          }
        />
        <span
          id="new-password-help"
          className="text-muted-foreground block text-xs"
        >
          Use 8–64 characters with an uppercase letter, a lowercase letter and a
          number.
        </span>
        {fieldError && (
          <span
            id="new-password-error"
            className="text-destructive block text-sm"
            role="alert"
          >
            {fieldError}
          </span>
        )}
      </label>
      <label className="block space-y-2">
        <span id="confirm-password-label" className="text-sm font-medium">
          Confirm new password
        </span>
        <Input
          ref={confirmationRef}
          className="h-11"
          name="confirm_password"
          maxLength={PASSWORD_MAX_LENGTH}
          aria-labelledby="confirm-password-label"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => {
            setConfirmation(event.target.value);
            setMismatch(false);
          }}
          required
          disabled={busy || expired}
          aria-invalid={mismatch || undefined}
          aria-describedby={mismatch ? "password-match-error" : undefined}
        />
        {mismatch && (
          <span
            id="password-match-error"
            className="text-destructive block text-sm"
            role="alert"
          >
            Passwords do not match.
          </span>
        )}
      </label>

      {expired && (
        <p className="text-muted-foreground text-sm" role="status">
          Verification has expired. Verify your email again to change your
          password.
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          aria-pressed={visible}
          disabled={busy || expired}
          onClick={() => setVisible(!visible)}
        >
          {visible ? "Hide passwords" : "Show passwords"}
        </Button>{" "}
        <Button
          type="submit"
          className="min-h-11 w-full whitespace-normal sm:w-auto"
          disabled={busy || expired}
        >
          {busy ? "Saving…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
