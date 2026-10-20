import "./auth-shell.css";

import { ArrowLeft, Check } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { ThemeToggle } from "@/app/components/ThemeToggle";

const registrationSteps = [
  "Email",
  "Verify",
  "Personal details",
  "Address",
  "Security",
];

/** Shared authentication framing keeps branding and registration progress consistent. */
const AuthShell = ({
  children,
  step,
}: {
  children: ReactNode;
  step?: number;
}) => (
  <main className="bg-muted/30 flex items-center px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
    <div className="mx-auto grid w-full max-w-280 min-w-0 items-start gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
      <aside className="min-w-0 lg:sticky lg:top-10">
        <div className="mb-6 flex items-center justify-between gap-4 lg:mb-10">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-h-11 items-center gap-2 rounded-md text-sm outline-none focus-visible:ring-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to shop
          </Link>
          <ThemeToggle />
        </div>
        <div className="relative isolate flex items-center gap-4 lg:block lg:py-10">
          <div
            aria-hidden="true"
            className="bg-primary/5 absolute inset-0 -z-10 hidden rounded-3xl lg:block"
          />
          <div className="lg:px-8">
            <svg
              viewBox="0 0 64 64"
              aria-hidden="true"
              className="auth-brand-mark text-primary size-16 shrink-0 lg:mb-8 lg:size-28"
            >
              <g fill="currentColor">
                <path d="M8 4H52Q60 4 60 12L55 43Q54 50 47 50H23Q16 50 15 43L10 16Q9 12 8 12A4 4 0 0 1 8 4Z" />
                <circle cx="22" cy="54" r="6" />
                <circle cx="48" cy="54" r="6" />
              </g>
              <path
                className="fill-primary-foreground"
                d="M23 13H41A4 4 0 0 1 41 21H30Q29 21 29.2 22L29.5 24H36A3 3 0 0 1 36 30H30.5L30.8 32H41.5A3.5 3.5 0 0 1 41.5 39H28Q23 39 22.2 34L19 18Q19 13 23 13Z"
              />
            </svg>
          </div>
          <div className="min-w-0 lg:px-8">
            <p className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              E-Commerce
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              by{" "}
              <span className="text-foreground font-medium">RhiLius Apps</span>
            </p>
            <p className="text-muted-foreground mt-6 hidden max-w-72 text-base leading-relaxed lg:block">
              {step
                ? "Your next great find starts here."
                : "Make yourself at home."}
            </p>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        {step && (
          <nav aria-label="Registration progress" className="mb-5">
            <p className="mb-2 text-sm font-medium sm:hidden">
              Step {step} of {registrationSteps.length} ·{" "}
              {registrationSteps[step - 1]}
            </p>
            <div className="mb-2 flex gap-1 sm:hidden" aria-hidden="true">
              {registrationSteps.map((label, index) => (
                <span
                  key={label}
                  className={`h-1 flex-1 rounded-full ${step >= index + 1 ? "bg-primary" : "bg-border"}`}
                />
              ))}
            </div>
            <ol className="sr-only sm:not-sr-only sm:flex sm:items-start sm:gap-2">
              {registrationSteps.map((label, index) => (
                <li
                  key={label}
                  aria-current={step === index + 1 ? "step" : undefined}
                  className="flex min-w-0 flex-1 flex-col gap-2"
                >
                  <div className="flex items-center gap-2" aria-hidden="true">
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${step >= index + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {step > index + 1 ? (
                        <Check className="size-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    {index < registrationSteps.length - 1 && (
                      <span
                        className={`h-px flex-1 ${step > index + 1 ? "bg-primary" : "bg-border"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs ${step === index + 1 ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                  >
                    <span className="sr-only">Step {index + 1}: </span>
                    {label}
                    {step > index + 1 && (
                      <span className="sr-only"> (completed)</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        )}
        {children}
      </div>
    </div>
  </main>
);

export default AuthShell;
