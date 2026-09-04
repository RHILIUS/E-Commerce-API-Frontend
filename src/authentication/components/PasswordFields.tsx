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

const PasswordFields = () => {
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
      <label className="block min-w-0 space-y-2">
        <span className="block text-sm font-medium">Password</span>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          className="h-10"
          value={password}
          onChange={handlePasswordChange}
          onBlur={() => setHasPasswordBlurred(true)}
          onInvalid={() => setHasPasswordBlurred(true)}
          aria-invalid={isPasswordInvalid || undefined}
          aria-describedby={isPasswordInvalid ? "password-error" : undefined}
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          pattern={PASSWORD_PATTERN}
        />

        {isPasswordInvalid && (
          <span
            id="password-error"
            className="text-destructive block text-xs"
            role="alert"
          >
            Password must be {PASSWORD_MIN_LENGTH}–{PASSWORD_MAX_LENGTH}
            characters and include an uppercase letter, a lowercase letter, and
            a number.
          </span>
        )}
      </label>

      <label className="block min-w-0 space-y-2">
        <span className="block text-sm font-medium">Confirm Password</span>
        <Input
          ref={confirmPasswordInputRef}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
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
      </label>
    </>
  );
};

export default PasswordFields;
