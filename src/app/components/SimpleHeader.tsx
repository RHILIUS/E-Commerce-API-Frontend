import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { ThemeToggle } from "./ThemeToggle";

/** Minimal page framing; shopping and future owner-management layouts keep their own headers. */
export function SimpleHeader({
  backLink,
}: {
  backLink?: { to: string; label: string };
}) {
  return (
    <header className="bg-background border-b px-4 py-3 sm:px-8">
      <div className="mx-auto grid w-full max-w-400 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <Link
          to="/"
          aria-label="E-Commerce home"
          className="focus-visible:ring-ring/50 col-start-1 row-start-1 flex min-h-11 w-fit min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3"
        >
          <img src="/favicon.svg" alt="" className="size-9 shrink-0" />
          <span className="min-w-0">
            <span className="block text-lg font-semibold">E-Commerce</span>
            <span className="text-muted-foreground block text-xs">
              by RhiLius Apps
            </span>
          </span>
        </Link>
        {backLink && (
          <Link
            to={backLink.to}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 col-span-2 row-start-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-md text-sm outline-none focus-visible:ring-3 sm:col-span-1 sm:col-start-2 sm:row-start-1"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {backLink.label}
          </Link>
        )}
        <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
