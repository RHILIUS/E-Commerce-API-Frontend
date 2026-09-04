import { useState } from "react";

import { Input } from "@/app/components/ui/input";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  USERNAME_REGEX,
} from "@/authentication/constants";

const UsernameField = () => {
  const [username, setUsername] = useState("");
  const [hasBlurred, setHasBlurred] = useState(false);

  const isInvalid =
    hasBlurred && username.length > 0 && !USERNAME_REGEX.test(username);

  return (
    <label className="block min-w-0 space-y-2">
      <span className="block text-sm font-medium">Username</span>
      <Input
        name="username"
        type="text"
        autoComplete="username"
        placeholder="Choose a username"
        className="h-10"
        value={username}
        onChange={(event) => setUsername(event.currentTarget.value)}
        onBlur={() => setHasBlurred(true)}
        onInvalid={() => setHasBlurred(true)}
        aria-invalid={isInvalid || undefined}
        aria-describedby={isInvalid ? "username-error" : undefined}
        required
        minLength={USERNAME_MIN_LENGTH}
        maxLength={USERNAME_MAX_LENGTH}
        pattern={USERNAME_PATTERN}
      />

      {isInvalid && (
        <span
          id="username-error"
          className="text-destructive block text-xs"
          role="alert"
        >
          Username must be {USERNAME_MIN_LENGTH}–{USERNAME_MAX_LENGTH}{" "}
          characters, start with a letter or number, use only letters, numbers,
          underscores, hyphens, or periods, and contain no consecutive special
          characters.
        </span>
      )}
    </label>
  );
};

export default UsernameField;
