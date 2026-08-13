import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const LoginPage = () => {
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

          <form className="mt-6 space-y-4" action="#" method="post">
            <label className="block space-y-2">
              <span className="text-card-foreground text-sm font-medium">
                Email
              </span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-colors outline-none focus:ring-2"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-card-foreground text-sm font-medium">
                Password
              </span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-colors outline-none focus:ring-2"
              />
            </label>

            <Button type="submit" size="lg" className="w-full rounded-md">
              Login
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
            size="lg"
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
