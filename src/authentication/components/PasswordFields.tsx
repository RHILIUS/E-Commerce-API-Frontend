import { type ChangeEvent, useRef, useState } from "react";

import { Input } from "@/app/components/ui/input";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_REGEX,
} from "@/authentication/constants";

const setPasswordMismatchValidity = (
  input: HTMLInputElement | null,
  password: string,
  confirmPassword: string,
) => {
  input?.setCustomValidity(
    confirmPassword.length > 0 && confirmPassword !== password
      ? "Passwords do not match."
      : "",
  );
};

const PasswordFields = ({
  serverError,
  onValueChange,
}: {
  serverError?: string;
  onValueChange?: () => void;
}) => {
  const [password, setPassword] = useState("");
  const [hasPasswordBlurred, setHasPasswordBlurred] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasConfirmPasswordBlurred, setHasConfirmPasswordBlurred] =
    useState(false);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  const isPasswordInvalid =
    hasPasswordBlurred && password.length > 0 && !PASSWORD_REGEX.test(password);
  const doPasswordsMismatch =
    confirmPassword.length > 0 && confirmPassword !== password;
  const isConfirmPasswordInvalid =
    hasConfirmPasswordBlurred && doPasswordsMismatch;

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextPassword = event.currentTarget.value;

    setPassword(nextPassword);
    onValueChange?.();
    setPasswordMismatchValidity(
      confirmPasswordInputRef.current,
      nextPassword,
      confirmPassword,
    );
  };

  const handleConfirmPasswordChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nextConfirmPassword = event.currentTarget.value;

    setConfirmPassword(nextConfirmPassword);
    setPasswordMismatchValidity(
      event.currentTarget,
      password,
      nextConfirmPassword,
    );
  };

  return (
    <>
      <div className="min-w-0 space-y-2">
        <label
          htmlFor="register-password"
          className="block text-sm font-medium"
        >
          Password
        </label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          className="h-10"
          value={password}
          onChange={handlePasswordChange}
          onBlur={() => setHasPasswordBlurred(true)}
          onInvalid={() => setHasPasswordBlurred(true)}
          aria-invalid={Boolean(serverError) || isPasswordInvalid || undefined}
          aria-describedby={[
            "password-requirements",
            serverError
              ? "password-server-error"
              : isPasswordInvalid
                ? "password-error"
                : null,
          ]
            .filter(Boolean)
            .join(" ")}
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          pattern={PASSWORD_PATTERN}
        />

        <p
          id="password-requirements"
          className="text-muted-foreground text-xs leading-relaxed"
        >
          Use {PASSWORD_MIN_LENGTH}–{PASSWORD_MAX_LENGTH} characters with an
          uppercase letter, a lowercase letter, and a number.
        </p>
        {serverError && (
          <span
            id="password-server-error"
            className="text-destructive block text-xs wrap-break-word"
            role="alert"
          >
            {serverError}
          </span>
        )}
        {!serverError && isPasswordInvalid && (
          <span
            id="password-error"
            className="text-destructive block text-xs"
            role="alert"
          >
            Your password doesn’t meet the requirements above.
          </span>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <label
          htmlFor="register-confirm-password"
          className="block text-sm font-medium"
        >
          Confirm Password
        </label>
        <Input
          id="register-confirm-password"
          ref={confirmPasswordInputRef}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          className="h-10"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          onBlur={() => setHasConfirmPasswordBlurred(true)}
          onInvalid={() => setHasConfirmPasswordBlurred(true)}
          aria-invalid={isConfirmPasswordInvalid || undefined}
          aria-describedby={
            isConfirmPasswordInvalid ? "confirm-password-error" : undefined
          }
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          pattern={PASSWORD_PATTERN}
        />

        {isConfirmPasswordInvalid && (
          <span
            id="confirm-password-error"
            className="text-destructive block text-xs"
            role="alert"
          >
            Passwords do not match.
          </span>
        )}
      </div>
    </>
  );
};

export default PasswordFields;
