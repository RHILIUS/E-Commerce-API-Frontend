import { Link } from "react-router-dom";

const linkClassName =
  "hover:text-foreground focus-visible:ring-ring/50 inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3";

/** Shared demo attribution and navigation for every application page. */
export const Footer = () => (
  <footer className="text-muted-foreground shrink-0 border-t px-6 py-5 text-sm">
    <div className="mx-auto flex w-full max-w-400 flex-wrap items-center justify-between gap-x-8 gap-y-3">
      <div className="space-y-1">
        <p>© 2026 RhiLius Apps</p>
        <p className="text-xs">Portfolio demo · No real purchases</p>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-1">
        <a
          href="https://github.com/RHILIUS/E-Commerce-API-Frontend"
          className={linkClassName}
        >
          GitHub
        </a>
        <Link to="/terms" className={linkClassName}>
          Terms of Service
        </Link>
      </nav>
    </div>
  </footer>
);
