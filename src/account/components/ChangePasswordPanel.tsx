import { REGEXP_ONLY_DIGITS } from "input-otp";
import { type SyntheticEvent, useRef, useState } from "react";

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

/** Two-step password form with verification inside the account tab. */
export function ChangePasswordPanel() {
  const flow = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [otp, setOtp] = useState("");
  const [visible, setVisible] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const credentials = {
    current_password: currentPassword,
    new_password: newPassword,
  };

  const submit = async (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();
    if (!flow.challenge) {
      if (newPassword !== confirmation) {
        setMismatch(true);
        confirmationRef.current?.focus();
        return;
      }
      if (await flow.request(credentials)) setOtp("");
    } else {
      await flow.confirm(credentials, otp);
    }
  };

  return (
    <section
      className="bg-card min-w-0 space-y-5 rounded-xl border p-4 sm:p-6"
      aria-labelledby="change-password-heading"
    >
      <div className="space-y-2">
        <h2 id="change-password-heading" className="text-xl">
          Change password
        </h2>
        <p className="text-muted-foreground text-sm">
          Verify the change with a code sent to your registered email. Changing
          your password signs you out on all devices.
        </p>
      </div>
      <form
        className="min-w-0 space-y-5"
        onSubmit={submit}
        aria-busy={flow.busy}
      >
        {flow.challenge ? (
          <div className="min-w-0 space-y-4">
            <p className="text-sm wrap-break-word">
              Your verification email is queued for{" "}
              {flow.challenge.masked_email}. Enter the six-digit code when it
              arrives.
            </p>
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={otp}
              onChange={setOtp}
              autoFocus
              autoComplete="one-time-code"
              disabled={flow.busy}
              aria-label="Six-digit verification code"
              aria-invalid={Boolean(flow.fields.otp) || undefined}
              aria-describedby={
                flow.fields.otp
                  ? "password-code-help password-code-error"
                  : "password-code-help"
              }
              containerClassName="mx-auto w-fit max-w-full"
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot key={index} index={index} className="size-9" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <p
              id="password-code-help"
              className="text-muted-foreground text-center text-sm"
            >
              {flow.isExpired
                ? "This code has expired. Request a new code."
                : `Code expires in ${Math.floor(flow.expiresIn / 60)}:${String(flow.expiresIn % 60).padStart(2, "0")}.`}
            </p>
            {flow.fields.otp && (
              <p
                id="password-code-error"
                className="text-destructive text-sm"
                role="alert"
              >
                {flow.fields.otp}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full whitespace-normal"
              disabled={flow.busy || flow.cooldown > 0}
              onClick={async () => {
                setOtp("");
                await flow.resend();
              }}
            >
              {flow.cooldown > 0
                ? `Resend code in ${flow.cooldown}s`
                : "Resend code"}
            </Button>
          </div>
        ) : (
          <div className="min-w-0 space-y-4">
            <label className="block space-y-2">
              <span id="current-password-label" className="text-sm font-medium">
                Current password
              </span>
              <Input
                className="h-11"
                name="current_password"
                aria-labelledby="current-password-label"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                maxLength={128}
                disabled={flow.busy}
                aria-invalid={
                  Boolean(flow.fields.current_password) || undefined
                }
                aria-describedby={
                  flow.fields.current_password
                    ? "current-password-error"
                    : undefined
                }
              />
              {flow.fields.current_password && (
                <span
                  id="current-password-error"
                  className="text-destructive block text-sm"
                  role="alert"
                >
                  {flow.fields.current_password}
                </span>
              )}
            </label>
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
                disabled={flow.busy}
                aria-invalid={Boolean(flow.fields.new_password) || undefined}
                aria-describedby={
                  flow.fields.new_password
                    ? "new-password-help new-password-error"
                    : "new-password-help"
                }
              />
              <span
                id="new-password-help"
                className="text-muted-foreground block text-xs"
              >
                Use 8–64 characters with an uppercase letter, a lowercase letter
                and a number.
              </span>
              {flow.fields.new_password && (
                <span
                  id="new-password-error"
                  className="text-destructive block text-sm"
                  role="alert"
                >
                  {flow.fields.new_password}
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
                aria-labelledby="confirm-password-label"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  setMismatch(false);
                }}
                required
                disabled={flow.busy}
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
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              aria-pressed={visible}
              disabled={flow.busy}
              onClick={() => setVisible(!visible)}
            >
              {visible ? "Hide passwords" : "Show passwords"}
            </Button>
          </div>
        )}
        {flow.message && (
          <p className="text-destructive text-sm wrap-break-word" role="alert">
            {flow.message}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Button
            type="submit"
            className="min-h-11 whitespace-normal sm:flex-1"
            disabled={
              flow.busy ||
              (flow.challenge
                ? otp.length !== 6 || flow.isExpired
                : flow.cooldown > 0)
            }
          >
            {flow.busy
              ? "Please wait…"
              : flow.challenge
                ? "Verify and change password"
                : flow.cooldown > 0
                  ? `Send code in ${flow.cooldown}s`
                  : "Send verification code"}
          </Button>
          {flow.challenge && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={flow.busy}
              onClick={() => {
                flow.back();
                setOtp("");
              }}
            >
              Back
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
