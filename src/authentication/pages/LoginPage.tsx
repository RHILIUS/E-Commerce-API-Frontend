import axios from "axios";
import type { ChangeEvent, SyntheticEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";

import AuthShell from "../components/AuthShell/AuthShell";
import { useAuth } from "../contexts/Auth/useAuth";

type LoginLocationState = {
  from?: { pathname?: string; search?: string };
  email?: string;
  registrationSucceeded?: boolean;
  passwordChange?: "success" | "uncertain";
};

type LoginError = {
  kind: "credentials" | "general";
  message: string;
};

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LoginLocationState | null;

  const destination = locationState?.from;
  const pathname = destination?.pathname || "/";
  const from =
    pathname.startsWith("/") && !pathname.startsWith("//")
      ? `${pathname}${destination?.search || ""}`
      : "/";
  const [formData, setFormData] = useState({
    email: locationState?.email ?? "",
    password: "",
  });
  const [error, setError] = useState<LoginError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();
  const [googleNotice, setGoogleNotice] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (
    e: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await auth.login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError({ kind: "credentials", message: "Invalid email or password" });
      } else {
        setError({
          kind: "general",
          message: "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <Card className="w-full min-w-0 gap-0 rounded-2xl border p-5 shadow-sm ring-0 sm:p-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Pick up where you left off.
          </p>
        </header>
        {locationState?.registrationSucceeded && (
          <p className="text-muted-foreground mt-6 text-sm" role="status">
            Your account was created, but we couldn&apos;t log you in
            automatically. Please log in.
          </p>
        )}

        {locationState?.passwordChange && (
          <p className="text-muted-foreground mt-6 text-sm" role="status">
            {locationState.passwordChange === "success"
              ? "Password changed successfully. Sign in with your new password."
              : "The password change may have completed, but we couldn't confirm the response. Please sign in."}
          </p>
        )}

        <form
          className="mt-7 space-y-5"
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          aria-describedby={error ? "login-error" : undefined}
        >
          <label className="block space-y-2">
            <span className="text-card-foreground text-sm font-medium">
              Email
            </span>
            <Input
              className="h-11"
              placeholder="you@example.com"
              disabled={isSubmitting}
              aria-invalid={error?.kind === "credentials" || undefined}
              aria-describedby={
                error?.kind === "credentials" ? "login-error" : undefined
              }
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-card-foreground text-sm font-medium">
              Password
            </span>
            <Input
              className="h-11"
              disabled={isSubmitting}
              aria-invalid={error?.kind === "credentials" || undefined}
              aria-describedby={
                error?.kind === "credentials" ? "login-error" : undefined
              }
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>

          {error && (
            <p
              id="login-error"
              role="alert"
              className="text-destructive text-sm"
            >
              {error.message}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>

        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground mt-3 h-auto min-h-11 w-full flex-wrap gap-x-2 gap-y-1 py-2 whitespace-normal"
          onClick={() => setGoogleNotice(true)}
          aria-describedby={googleNotice ? "google-notice" : undefined}
        >
          <span>Login with Google</span>
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
            Coming soon
          </span>
        </Button>
        {googleNotice && (
          <p
            id="google-notice"
            role="status"
            className="text-muted-foreground mt-3 text-sm leading-relaxed"
          >
            Google sign-in isn’t available yet. Please use your email and
            password.
          </p>
        )}

        <p className="text-muted-foreground mt-6 text-center text-sm">
          New here?{" "}
          <Link
            to="/register/enter-email"
            className="text-primary focus-visible:outline-ring rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2"
          >
            Create an account
          </Link>
        </p>

        <Link
          to="/terms"
          className="text-primary hover:text-primary/80 mt-5 block text-center text-sm font-medium transition-colors"
        >
          Terms of Service
        </Link>
      </Card>
    </AuthShell>
  );
};

export default LoginPage;
