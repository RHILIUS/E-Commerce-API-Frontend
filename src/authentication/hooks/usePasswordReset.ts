import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/Auth/useAuth";
import {
  confirmPasswordReset,
  requestResetCode,
  resendResetCode,
  type ResetChallenge,
  verifyResetCode,
} from "../passwordResetApi";
import { passwordResetError } from "../utils/passwordResetError";
import { useCountdown } from "./useCountdown";

type ResetStep = "email" | "otp" | "password";

/** Own recovery deadlines and requests; sensitive drafts live only in the mounted page. */
export function usePasswordReset(initialEmail: string) {
  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<ResetStep>("email");
  const [challenge, setChallenge] = useState<ResetChallenge | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [cooldownDeadline, setCooldownDeadline] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReturnType<
    typeof passwordResetError
  > | null>(null);
  const pending = useRef(false);
  const mounted = useRef(false);
  const navigate = useNavigate();
  const { endSession } = useAuth();
  const cooldown = useCountdown(cooldownDeadline);
  const remaining = useCountdown(deadline);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const finish = (uncertain: boolean) => {
    navigate("/login", {
      flushSync: true,
      replace: true,
      state: { email, passwordReset: uncertain ? "uncertain" : "success" },
    });
    endSession();
  };

  const run = async (
    action: "request" | "resend" | "verify" | "confirm",
    value = "",
  ) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      if (action === "confirm") {
        await confirmPasswordReset(value);
        // Even an unmounted page must end the local session after a committed reset.
        finish(false);
      } else if (action === "verify" && challenge) {
        const result = await verifyResetCode(
          email,
          challenge.challenge_id,
          value,
        );
        if (mounted.current) {
          setDeadline(Date.parse(result.expires_at));
          setStep("password");
        }
      } else {
        const result =
          action === "resend" && challenge
            ? await resendResetCode(email, challenge.challenge_id)
            : await requestResetCode(email);
        if (mounted.current) {
          setEmail(email.trim().toLowerCase());
          setChallenge(result);
          setDeadline(Date.parse(result.expires_at));
          setCooldownDeadline(Date.now() + result.retry_after * 1000);
          setStep("otp");
        }
      }
    } catch (failure) {
      const result = passwordResetError(failure);
      if (action === "confirm" && result.uncertain) finish(true);
      else if (mounted.current) {
        setError(result);
        if (result.retryAfter > 0)
          setCooldownDeadline(Date.now() + result.retryAfter * 1000);
        if (result.restart || (result.uncertain && action !== "request")) {
          setStep("email");
          setChallenge(null);
          setDeadline(null);
        }
      }
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return {
    email,
    setEmail,
    step,
    busy,
    error,
    cooldown,
    remaining,
    expired: deadline !== null && remaining === 0,
    request: () => run("request"),
    resend: () => run("resend"),
    verify: (otp: string) => run("verify", otp),
    confirm: (password: string) => run("confirm", password),
    restart: () => {
      if (pending.current) return;
      setStep("email");
      setChallenge(null);
      setDeadline(null);
      setError(null);
    },
  };
}
