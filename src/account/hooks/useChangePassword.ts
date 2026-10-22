import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { useCountdown } from "@/authentication/hooks/useCountdown";

import {
  confirmPasswordChange,
  fetchPasswordBootstrap,
  type PasswordChallenge,
  requestPasswordCode,
  resendPasswordCode,
  verifyPasswordCode,
} from "../api/passwordApi";
import {
  passwordChangeError,
  type PasswordFieldErrors,
} from "../utils/passwordChangeError";

type PasswordStep = "email" | "otp" | "password";

/** Own account verification and permission deadlines; sensitive drafts belong to their forms. */
export function useChangePassword() {
  const { endSession, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<PasswordStep>("email");
  const [email, setEmail] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [challenge, setChallenge] = useState<PasswordChallenge | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<PasswordFieldErrors>({});
  const mounted = useRef(false);
  const pending = useRef(false);
  const cooldown = useCountdown(cooldownEndsAt);
  const remaining = useCountdown(deadline);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    fetchPasswordBootstrap(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setEmail(result.masked_email);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setLoadError(passwordChangeError(error).message);
      });
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [attempt]);

  // Commit Login before clearing authentication so the route guard preserves the notice.
  const finish = (uncertain: boolean) => {
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

  // Restart clears permission-dependent UI while retaining the server-authoritative cooldown.
  const reset = () => {
    setStep("email");
    setChallenge(null);
    setDeadline(null);
    setFields({});
  };

  const run = async (
    action: "request" | "resend" | "verify" | "confirm",
    value = "",
  ) => {
    if (pending.current || !mounted.current) return;
    if ((action === "verify" || action === "resend") && !challenge) return;
    pending.current = true;
    setBusy(true);
    setMessage(null);
    setFields({});
    let submitted = false;
    try {
      // A bootstrap failure is safe to retry: the password-save POST has not begun.
      const bootstrap = await fetchPasswordBootstrap();
      if (!mounted.current) return;
      setEmail(bootstrap.masked_email);
      submitted = true;
      if (action === "confirm") {
        await confirmPasswordChange(value, bootstrap.csrf_token);
        // A committed change must end authentication even after navigating away.
        finish(false);
      } else if (action === "verify" && challenge) {
        const result = await verifyPasswordCode(
          challenge.challenge_id,
          value,
          bootstrap.csrf_token,
        );
        if (mounted.current) {
          setDeadline(Date.parse(result.expires_at));
          setStep("password");
        }
      } else {
        const result =
          action === "resend" && challenge
            ? await resendPasswordCode(
                challenge.challenge_id,
                bootstrap.csrf_token,
              )
            : await requestPasswordCode(bootstrap.csrf_token);
        if (mounted.current) {
          setChallenge(result);
          setEmail(result.masked_email);
          setDeadline(Date.parse(result.expires_at));
          setCooldownEndsAt(Date.now() + result.retry_after * 1000);
          setStep("otp");
        }
      }
    } catch (error) {
      const result = passwordChangeError(error);
      if (action === "confirm" && submitted && result.uncertain) {
        finish(true);
      } else if (mounted.current) {
        if (
          result.restart ||
          (submitted && result.uncertain && action !== "confirm")
        )
          reset();
        setFields(result.fields);
        setMessage(result.message);
        if (result.retryAfter > 0)
          setCooldownEndsAt(Date.now() + result.retryAfter * 1000);
        if (result.expired) setDeadline(Date.now());
      }
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return {
    step,
    email,
    loadError,
    loading: email === null && loadError === null,
    retryLoad: () => {
      setLoadError(null);
      setAttempt((current) => current + 1);
    },
    busy,
    message,
    fields,
    cooldown,
    remaining,
    expired: deadline !== null && remaining === 0,
    request: () => run("request"),
    resend: () => run("resend"),
    verify: (otp: string) => run("verify", otp),
    confirm: (password: string) => run("confirm", password),
    restart: () => {
      if (pending.current) return;
      reset();
      setMessage(null);
    },
  };
}
