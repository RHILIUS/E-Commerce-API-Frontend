import axios from "axios";
import type { ChangeEvent, SyntheticEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

import { useAuth } from "../contexts/Auth/useAuth";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || "/";
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (
    e: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await auth.login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Invalid email or password");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="px-6 py-24 sm:py-28">
      <div className="mx-auto flex w-full max-w-150 min-w-60 flex-col items-stretch gap-10">
        <header className="space-y-2 text-center">
          <h1 className="text-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Welcome Back to
            <br />
            E-Commerce
          </h1>
        </header>

        <div className="bg-border h-px w-full" />

        <section className="border-border bg-card rounded-lg border px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-card-foreground text-sm font-semibold">
              Login to E-Commerce
            </h2>
            <Link
              to="/register"
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              Register
            </Link>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-card-foreground text-sm font-medium">
                Email
              </span>
              <Input
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
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </label>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" className="w-full rounded-md">
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-sm whitespace-nowrap">
              or continue with
            </span>
            <div className="bg-border h-px flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="border-input hover:bg-accent hover:text-accent-foreground mt-4 w-full rounded-md"
          >
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="text-foreground inline-flex size-4 items-center justify-center rounded-full text-[15px] leading-none font-semibold"
              >
                G
              </span>
              <span>Login with Google</span>
            </span>
          </Button>

          <Link
            to="/terms"
            className="text-primary hover:text-primary/80 mt-5 block text-center text-sm font-medium transition-colors"
          >
            Terms of Service
          </Link>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
