import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Header } from "@/ecommerce/components/Header";

/** Match the store shell while allowing long addresses and references to wrap on mobile. */
export function CheckoutLayout({
  children,
  backLink = { to: "/", label: "Back to product catalog" },
}: {
  children: ReactNode;
  backLink?: { to: string; label: string } | null;
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-background text-foreground flex min-w-0 flex-col">
      <Header
        searchQuery=""
        onSearch={(query) =>
          navigate(query ? `/?${new URLSearchParams({ q: query })}` : "/")
        }
      />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-3 py-6 sm:px-6 sm:py-10">
        {backLink && (
          <Link
            to={backLink.to}
            className="text-muted-foreground focus-visible:outline-ring inline-flex min-h-11 items-center rounded-sm text-sm underline focus-visible:outline-2"
          >
            {backLink.label}
          </Link>
        )}
        {children}
      </main>
    </div>
  );
}
