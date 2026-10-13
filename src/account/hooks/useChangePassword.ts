import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { useCountdown } from "@/authentication/hooks/useCountdown";

import {
  confirmPasswordChange,
  type PasswordChallenge,
  type PasswordCredentials,
  requestPasswordCode,
  resendPasswordCode,
} from "../passwordApi";
import {
  passwordChangeError,
  type PasswordFieldErrors,
} from "../utils/passwordChangeError";

/** Own the challenge lifecycle; keep passwords only in the mounted form. */
export function useChangePassword() {
  const { endSession, user } = useAuth();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<PasswordChallenge | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<PasswordFieldErrors>({});
  const [expired, setExpired] = useState(false);
  const mounted = useRef(false);
  const pending = useRef(false);
  const cooldown = useCountdown(cooldownEndsAt);
  const expiresIn = useCountdown(
    challenge ? Date.parse(challenge.expires_at) : null,
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Ending authentication is required even if the form unmounts during confirmation.
  const finish = (uncertain: boolean) => {
    // Commit the login route before clearing auth so the guard cannot overwrite its notice.
    navigate("/login", {
      flushSync: true,
      replace: true,
      state: {
        email: user?.email,
        passwordChange: uncertain ? "uncertain" : "success",
      },
    });
    endSession();
  };

  const run = async (
    action: "request" | "resend" | "confirm",
    credentials?: PasswordCredentials,
    otp?: string,
  ) => {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setMessage(null);
    setFields({});
    try {
      if (action === "confirm" && challenge && credentials && otp) {
        await confirmPasswordChange(credentials, challenge.challenge_id, otp);
        finish(false);
      } else {
        const result =
          action === "request" && credentials
            ? await requestPasswordCode(credentials)
            : await resendPasswordCode(challenge!.challenge_id);
        if (mounted.current) {
          setChallenge(result);
          setExpired(false);
          setCooldownEndsAt(Date.now() + result.retry_after * 1000);
        }
      }
      return true;
    } catch (error) {
      const result = passwordChangeError(error);
      if (action === "confirm" && result.uncertain) {
        finish(true);
      } else if (mounted.current) {
        setFields(result.fields);
        setMessage(result.message);
        if (result.retryAfter)
          setCooldownEndsAt(Date.now() + result.retryAfter * 1000);
        if (
          result.restart ||
          result.fields.current_password ||
          result.fields.new_password
        )
          setChallenge(null);
        if (result.expired) setExpired(true);
      }
      return false;
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return {
    challenge,
    busy,
    message,
    fields,
    cooldown,
    expiresIn,
    isExpired: expired || (challenge !== null && expiresIn === 0),
    request: (credentials: PasswordCredentials) => run("request", credentials),
    resend: () => run("resend"),
    confirm: (credentials: PasswordCredentials, otp: string) =>
      run("confirm", credentials, otp),
    back: () => {
      if (!pending.current) {
        setChallenge(null);
        setFields({});
        setMessage(null);
      }
    },
  };
}
